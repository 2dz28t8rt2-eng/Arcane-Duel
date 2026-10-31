'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const {fixture}=require('./helpers/duo-online-fixture-v221.cjs');
const catalog=Object.fromEntries(snapshot.cards.map(card=>[card.id,card]));
const hostDeck=[...snapshot.starterMain];
const guestDeck=[...hostDeck.slice(1),hostDeck[0]];
const build=(name,deck)=>({name,deck,fusions:[...snapshot.starterFusions],upgrades:{},enhancements:{},essence:{},lv1:{}});
const builds={0:build('Host',hostDeck),2:build('Gast',guestDeck)};
const ctx={catalog,humanBuilds:builds,now:1000};
const apply=(g,seat,action)=>rules.apply(g,seat,action,ctx);
test('loan builds are legal and respect the chosen opponent level in every encounter',()=>{
 for(const encounter of rules.ENCOUNTERS){
  const loan=rules.loanBuild(catalog,encounter.id);
  assert.ok(rules.validDeck(loan.deck,catalog));
  assert.ok(rules.validDeck(loan.fusions,catalog,true));
  assert.ok(loan.deck.every(id=>catalog[id].level<=encounter.level));
  assert.ok(loan.fusions.every(id=>catalog[id].level<=Math.max(2,encounter.level)));
 }
});
function lobby(){
 const g=rules.create({roomId:'personal-duo-test',hostName:'Host',hostDeck,
  hostFusions:snapshot.starterFusions,enemyDeckA:hostDeck,enemyDeckB:hostDeck,
  enemyFusionsA:snapshot.starterFusions,enemyFusionsB:snapshot.starterFusions,
  personalDuoRules:true,catalog});
 return apply(g,2,{type:'join',...builds[2],deferStart:true});
}
test('host chooses a duel, guests cannot invite, and both builds remain their own',()=>{
 const g=lobby();
 assert.throws(()=>apply(g,2,{type:'requestDuel',chapter:5}),/Host/);
 const pending=apply(g,0,{type:'requestDuel',chapter:5});
 assert.equal(pending.partyStartInvite.toSeat,2);
 const started=apply(pending,2,{type:'acceptPartyStart',inviteId:pending.partyStartInvite.id});
 for(const [seat,deck] of [[0,hostDeck],[2,guestDeck]]){
  const player=started.players[seat];
  assert.deepEqual([...player.hand,...player.deck].sort((a,b)=>a-b),[...deck].sort((a,b)=>a-b));
  assert.deepEqual(player.baseDeck,deck);
 }
 assert.ok(rules.view(started,0).players[2].hand.every(card=>card===null));
 assert.ok(rules.view(started,2).players[0].hand.every(card=>card===null));
});
test('AI opponents can use a teammate field card as fusion material',()=>{
 for(const seat of [1,3]){
  let g=lobby();
  const pending=apply(g,0,{type:'requestDuel',chapter:1});
  g=apply(pending,2,{type:'acceptPartyStart',inviteId:pending.partyStartInvite.id});
  g.activeSeat=seat;
  const teammate=seat^2,id=hostDeck.find(x=>catalog[x].level===1),card=catalog[id];
  const index=g.players[seat].hand.findIndex(x=>catalog[x]?.level===1);assert.ok(index>=0);
  g.players[teammate].field[6]={...card,uid:7700,mode:'atk',maxDef:card.def,placedRound:0,used:false,fusion:false};
  const materials=[{from:'hand',index},{from:'allyField',index:6}];
  const templates=rules.fusionOptions(g,seat,materials,catalog).templates;assert.ok(templates.length);
  const next=apply(g,seat,{type:'fusion',materials,slot:6,templateId:templates[0]});
  assert.equal(next.players[teammate].field[6],null);
  assert.equal(next.players[teammate].graveyard.filter(c=>c.id===id).length,1);
  assert.equal(next.players[seat].field[6].id,templates[0]);
 }
});
test('mixed progress limits the opponents and temporarily loans the advanced player a level-matched deck',()=>{
 const server=fixture();
 const h=server.handle({type:'profileCreate',name:'Fortgeschritten'});
 const b=server.handle({type:'profileCreate',name:'Anfänger'});
 const advanced=server.profiles.get(h.profileToken),original=[...advanced.deck];
 advanced.clearedChapters=[1,2,3];
 const room=server.handle({type:'create',profileToken:h.profileToken,personalDuoRules:true});
 const joined=server.handle({type:'join',profileToken:b.profileToken,roomId:room.roomId,invite:room.invite});
 assert.equal(joined.partyLimits.maxChapter,1);
 assert.equal(joined.partyLimits.loanSeatChapter,0);
 const action=(token,revision,action)=>server.handle({type:'action',roomId:room.roomId,token,expectedRevision:revision,action});
 assert.throws(()=>action(room.token,joined.state.revision,{type:'requestDuel',chapter:2}),/freigeschaltet/);
 const pending=action(room.token,joined.state.revision,{type:'requestDuel',chapter:1});
 const result=action(joined.token,pending.state.revision,{type:'acceptPartyStart',inviteId:pending.state.partyStartInvite.id});
 assert.equal(result.state.players[0].loanedDeck,true);
 assert.deepEqual(advanced.deck,original);
 assert.ok(server.rooms.get(room.roomId).game.players[0].baseDeck.every(id=>catalog[id].level<=2));
 assert.deepEqual(server.rooms.get(room.roomId).game.players[2].baseDeck,b.profile.deck);
});
test('the guest receives the loan when they are the more advanced member',()=>{
 const server=fixture();
 const h=server.handle({type:'profileCreate',name:'Anfänger'}),b=server.handle({type:'profileCreate',name:'Fortgeschritten'});
 const advanced=server.profiles.get(b.profileToken),original=[...advanced.deck];advanced.clearedChapters=[1,2,3];
 const room=server.handle({type:'create',profileToken:h.profileToken,personalDuoRules:true});
 const joined=server.handle({type:'join',profileToken:b.profileToken,roomId:room.roomId,invite:room.invite});
 assert.equal(joined.partyLimits.loanSeatChapter,2);
 const action=(token,revision,action)=>server.handle({type:'action',roomId:room.roomId,token,expectedRevision:revision,action});
 const pending=action(room.token,joined.state.revision,{type:'requestDuel',chapter:1});
 const started=action(joined.token,pending.state.revision,{type:'acceptPartyStart',inviteId:pending.state.partyStartInvite.id});
 assert.equal(started.state.players[0].loanedDeck,false);
 assert.equal(started.state.players[2].loanedDeck,true);
 assert.deepEqual(advanced.deck,original);
});
