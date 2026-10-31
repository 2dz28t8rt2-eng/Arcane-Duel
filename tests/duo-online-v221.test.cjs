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
 const handIndex=g.players[0].hand.findIndex(x=>catalog[x]?.level===1);assert.ok(handIndex>=0);
 g.players[2].field[6]={...t,uid:9500,mode:'atk',maxDef:t.def,placedRound:0,used:false,fusion:false};
 const materials=[{from:'hand',index:handIndex},{from:'allyField',index:6}];
 const templates=rules.fusionOptions(g,0,materials,catalog).templates;assert.ok(templates.length);
 const next=apply(g,0,{type:'fusion',materials,slot:6,templateId:templates[0]});
 assert.equal(next.players[2].field[6],null);assert.equal(next.players[2].graveyard.filter(c=>c.id===id).length,1);
 assert.equal(next.players[0].field[6].id,templates[0]);assert.equal(g.players[2].graveyard.length,0);
 assert.throws(()=>apply(next,0,{type:'fusion',materials,slot:6,templateId:templates[0]}));
});
