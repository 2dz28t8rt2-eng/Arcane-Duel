'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const build={deck:snapshot.starterMain,fusions:snapshot.starterFusions,upgrades:{},enhancements:{},essence:{},lv1:{}};
const options={catalog,humanBuilds:{0:{...build,name:'Aktueller Host'},2:{...build,name:'Aktueller Gast'}}};
function lobby(){
 const g=rules.create({roomId:'online-v221-spec',hostName:'Host',hostDeck:build.deck,
  hostFusions:build.fusions,enemyDeckA:build.deck,enemyDeckB:build.deck,
  enemyFusionsA:build.fusions,enemyFusionsB:build.fusions,catalog,randomSeed:221});
 return rules.apply(g,2,{type:'join',name:'Gast',...build,deferStart:true},options);
}
const apply=(g,seat,action,extra={})=>rules.apply(g,seat,action,{...options,...extra});
const request=(g,seat,chapter=1)=>apply(g,seat,{type:'requestDuel',chapter},{now:1000});
const accept=(g,seat)=>apply(g,seat,{type:'acceptPartyStart',inviteId:g.partyStartInvite?.id},{now:1001});
test('either human may invite; an addressed, current, unexpired consent starts exactly one duel',()=>{
 for(const seat of [0,2]){
  const before=lobby(),pending=request(before,seat),other=seat===0?2:0;
  assert.equal(before.status,'lobby');assert.equal(pending.status,'party_ready');
  assert.equal(pending.partyStartInvite.toSeat,other);
  assert.throws(()=>accept(pending,seat),/Zustimmung/);
  assert.throws(()=>apply(pending,other,{type:'acceptPartyStart',inviteId:-1},{now:1001}),/ersetzt/);
  assert.throws(()=>apply(pending,other,{type:'acceptPartyStart',inviteId:pending.partyStartInvite.id},{now:121001}),/abgelaufen/);
  assert.throws(()=>request(pending,other),/außerhalb/);
  const active=accept(pending,other);assert.equal(active.status,'active');
  assert.equal(active.players[0].name,'Aktueller Host');assert.equal(active.players[2].name,'Aktueller Gast');
  assert.deepEqual(active.players.map(p=>p.field.length),[7,7,7,7]);
  assert.deepEqual(active.teams.map(t=>t.lp),[4000,4000]);
  assert.throws(()=>accept(active,other),/Zustimmung/);
 }
});
test('late responses cannot accept a replaced request, including a request from the other human',()=>{
 const first=request(lobby(),0),cancelled=apply(first,0,{type:'cancelPartyStart',inviteId:first.partyStartInvite.id});
 const second=request(cancelled,2);
 assert.throws(()=>apply(second,0,{type:'acceptPartyStart',inviteId:first.partyStartInvite.id},{now:1001}),/ersetzt/);
 assert.equal(accept(second,0).status,'active');
 const expired=apply(first,2,{type:'requestDuel',chapter:1},{now:121001});
 assert.notEqual(expired.partyStartInvite.id,first.partyStartInvite.id);
});
test('a declined rematch returns to the finished match and accepted replay completely resets combat',()=>{
 const finished=accept(request(lobby(),0),2);finished.status='finished';finished.winner=1;
 finished.teams[0].lp=0;finished.players[0].field[6]={id:0,uid:88};finished.players[0].summoned=true;
 const invite=request(finished,2),no=apply(invite,0,{type:'declinePartyStart',inviteId:invite.partyStartInvite.id});
 assert.equal(no.status,'finished');assert.equal(no.winner,1);assert.equal(no.teams[0].lp,0);
 const fresh=accept(request(no,2),0);assert.equal(fresh.status,'active');assert.equal(fresh.winner,null);
 assert.equal(fresh.duelNo,finished.duelNo+1);assert.equal(fresh.round,1);assert.equal(fresh.activeSeat,0);
 assert.equal(fresh.players[0].summoned,false);assert.equal(fresh.players[0].field[6],null);
 assert.ok(fresh.players.every(p=>p.field.every(c=>c===null)&&p.hand.length===5));
 assert.ok(fresh.teams.every(t=>t.lp===4000&&t.maxLp===4000));
});
test('the selected new chapter sets exact solo-parity LP; next-turn order is 0,1,2,3',()=>{
 let g=accept(request(lobby(),2,4),0);assert.equal(g.chapter,4);assert.equal(g.entry,'chapter');
 assert.equal(g.teams[0].lp,2*rules.soloStartingLp(4));
 for(const [from,to]of [[0,1],[1,2],[2,3],[3,0]]){assert.equal(g.activeSeat,from);g=apply(g,from,{type:'end'});assert.equal(g.activeSeat,to);}
});
test('zone seven supports summon and position changes while inactive partner commands are rejected',()=>{
 let g=accept(request(lobby(),0),2);
 assert.throws(()=>apply(g,2,{type:'summon',slot:6,handIndex:0}),/Zug/);
 g=apply(g,0,{type:'summon',slot:6,handIndex:0});const c=g.players[0].field[6];assert.ok(c);
 g=apply(g,0,{type:'switch',slot:6});assert.equal(g.players[0].field[6].mode,'def');
 const host=rules.view(g,0),guest=rules.view(g,2);
 assert.equal(host.players[0].field[6].uid,guest.players[0].field[6].uid);
 assert.ok(host.players[2].hand.every(x=>x===null));assert.ok(guest.players[0].hand.every(x=>x===null));
 assert.equal(guest.rngSeed,undefined);assert.equal(guest.players[0].baseDeck,undefined);
});
test('partner fusion from seventh zone consumes its real owner once, with result in seventh own zone',()=>{
 let g=accept(request(lobby(),0),2);const id=build.deck.find(id=>catalog[id].level===1),t=catalog[id];
 g.players[0].hand[0]=id; // Controlled fusion material, independent of the shuffle.
 const handIndex=g.players[0].hand.findIndex(x=>catalog[x]?.level===1);assert.ok(handIndex>=0);
 g.players[2].field[6]={...t,uid:9500,mode:'atk',maxDef:t.def,placedRound:0,used:false,fusion:false};
 const materials=[{from:'hand',index:handIndex},{from:'allyField',index:6}];
 const templates=rules.fusionOptions(g,0,materials,catalog).templates;assert.ok(templates.length);
 const next=apply(g,0,{type:'fusion',materials,slot:6,templateId:templates[0]});
 assert.equal(next.players[2].field[6],null);assert.equal(next.players[2].graveyard.filter(c=>c.id===id).length,1);
 assert.equal(next.players[0].field[6].id,templates[0]);assert.equal(g.players[2].graveyard.length,0);
 assert.throws(()=>apply(next,0,{type:'fusion',materials,slot:6,templateId:templates[0]}));
});
test('canonical NPC fusion templates instantiate for their actual owner, including non-playable solo templates',()=>{
 const adversaries=require('../assets/duo-adversaries-v200.js'),solo=require('../assets/duo-opponent-catalog-v201.json');
 let privateFusions=0;
 for(const seat of [1,3]){
  let g=rules.create({roomId:'npc-fusion-221-'+seat,hostName:'Host',hostDeck:build.deck,hostFusions:build.fusions,
   enemyDeckA:adversaries.enemyDeck(1,1,snapshot.cards,build.deck,solo),enemyDeckB:adversaries.enemyDeck(1,3,snapshot.cards,build.deck,solo),
   enemyFusionsA:adversaries.enemyFusions(1,snapshot.cards,solo),enemyFusionsB:adversaries.enemyFusions(1,snapshot.cards,solo),catalog});
  g=apply(g,2,{type:'join',name:'Gast',...build});g.activeSeat=seat;
  const p=g.players[seat];let selected;
  for(let i=0;i<p.baseDeck.length&&!selected;i++)for(let j=i+1;j<p.baseDeck.length&&!selected;j++){
   const remaining=p.baseDeck.filter((_,index)=>index!==i&&index!==j);
   p.hand=[p.baseDeck[i],p.baseDeck[j],...remaining.slice(0,3)];p.deck=remaining.slice(3);
   const materials=[{from:'hand',index:0},{from:'hand',index:1}];
   let templates;try{templates=rules.fusionOptions(g,seat,materials,catalog).templates;}catch{continue;}
   const templateId=templates.find(id=>!catalog[id].playable);
   if(templateId!=null)selected={materials,templateId};
  }
  assert.ok(selected,'The actual solo NPC deck must support its non-player fusion recipe');
  const next=apply(g,seat,{type:'fusion',...selected,slot:6});
  assert.equal(next.players[seat].field[6].id,selected.templateId);assert.equal(next.players[seat].field[6].fusion,true);
  assert.equal(rules.validDeck([selected.templateId],catalog,true),false,'Humans do not gain access to NPC-only templates');privateFusions++;
 }
 assert.equal(privateFusions,2);
});

test('shared team zones reject partner overwrite for either team and preserve owned control',()=>{
 for(const first of [0,1]){
  let g=accept(request(lobby(),0),2);g.activeSeat=first;
  g=apply(g,first,{type:'summon',slot:6,handIndex:0});g.activeSeat=first+2;
  assert.equal(g.fieldLayout,'team7');
  assert.throws(()=>apply(g,first+2,{type:'summon',slot:6,handIndex:0}),/Feldplatz/);
  assert.throws(()=>apply(g,first+2,{type:'replace',slot:6,handIndex:0}),/Feldplatz/);
  assert.throws(()=>apply(g,first+2,{type:'switch',slot:6}),/Positionswechsel/);
  const next=apply(g,first+2,{type:'summon',slot:5,handIndex:0});
  assert.equal(rules.teamField(next,next.players[first]).filter(Boolean).length,2);
 }
});
test('guardian and soul bond across personal ownership in the shared physical row',()=>{
 const g=accept(request(lobby(),0),2),a=g.players[0],b=g.players[2];
 a.field[5]={uid:8001,role:'guardian',mode:'def',def:1000};
 b.field[6]={uid:8002,role:'soul',mode:'def',def:1000};
 assert.equal(rules.soulBonds(a,g).length,1);assert.equal(rules.soulBonds(b,g).length,1);
 assert.equal(rules.bondArmor(g,a,a.field[5],{role:'combatant'},1000).dealt,650);
 assert.equal(rules.bondArmor(g,b,b.field[6],{role:'combatant'},1000).dealt,650);
});
test('a full shared row blocks new placement and AI preserves all seven unique physical zones',()=>{
 let g=accept(request(lobby(),0),2);const t=catalog[build.deck[0]];
 for(let i=0;i<7;i++)g.players[i%2?1:3].field[i]={...t,uid:9000+i,mode:'def',used:true,switched:true,placedRound:0,maxDef:t.def};
 g.activeSeat=1;assert.throws(()=>apply(g,1,{type:'summon',slot:0,handIndex:0}),/Feldplatz/);
 const next=rules.aiTurn(g,{catalog});
 for(let i=0;i<7;i++)assert.ok(!(next.players[1].field[i]&&next.players[3].field[i]));
 assert.ok(next.players.filter(p=>p.team===1).flatMap(p=>p.field).filter(Boolean).length<=7);
});
test('an already active legacy room is not silently remapped mid-duel',()=>{
 let g=accept(request(lobby(),0),2);delete g.fieldLayout;
 g=apply(g,0,{type:'summon',slot:6,handIndex:0});g.activeSeat=2;
 const next=apply(g,2,{type:'summon',slot:6,handIndex:0});
 assert.ok(next.players[0].field[6]&&next.players[2].field[6]);
});
