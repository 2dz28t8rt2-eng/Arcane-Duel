'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const rules=require('../assets/duo-shared-rules-v160.js');
const cards=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(cards.cards.map(card=>[card.id,card]));
const deck=cards.starterMain, fusions=cards.starterFusions;
const build=name=>({name,deck:[...deck],fusions:[...fusions],upgrades:{},enhancements:{},essence:{},lv1:{}});
const ctx={catalog,humanBuilds:{0:build('Host'),2:build('Gast')},now:1000};
const apply=(game,seat,action)=>rules.apply(game,seat,action,ctx);
function start(seed=123456){
 let game=rules.create({roomId:'shuffle-surrender-test',hostName:'Host',hostDeck:deck,
  hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,
  enemyFusionsB:fusions,personalDuoRules:true,catalog,randomSeed:seed});
 game=apply(game,2,{type:'join',...build('Gast'),deferStart:true});
 game=apply(game,0,{type:'requestDuel',chapter:1});
 return apply(game,2,{type:'acceptPartyStart',inviteId:game.partyStartInvite.id});
}
test('four decks are shuffled independently without altering the profiles and private hands',()=>{
 const game=start();
 for(const player of game.players){
  assert.deepEqual([...player.hand,...player.deck].sort((a,b)=>a-b),[...deck].sort((a,b)=>a-b));
  assert.deepEqual(player.baseDeck,deck);
  assert.notDeepEqual([...player.hand,...player.deck],deck);
 }
 assert.notDeepEqual(game.players[0].hand,game.players[2].hand);
 assert.ok(rules.view(game,0).players[2].hand.every(card=>card===null));
 assert.ok(rules.view(game,2).players[0].hand.every(card=>card===null));
 assert.notDeepEqual(start(987654).players[0].hand,game.players[0].hand);
});
test('either human may surrender outside their turn; the team loses and a replay resets it',()=>{
 for(const seat of [0,2]){
  const game=start();game.activeSeat=1;
  assert.throws(()=>apply(game,1,{type:'surrender'}),/menschlicher/);
  const finished=apply(game,seat,{type:'surrender'});
  assert.equal(finished.status,'finished');assert.equal(finished.winner,1);
  assert.equal(finished.surrenderedBy,seat);assert.equal(finished.revision,game.revision+1);
  assert.throws(()=>apply(finished,seat,{type:'surrender'}),/nicht aktiv/);
  const pending=apply(finished,0,{type:'requestDuel',chapter:1});
  const replay=apply(pending,2,{type:'acceptPartyStart',inviteId:pending.partyStartInvite.id});
  assert.equal(replay.surrenderedBy,null);
  assert.notDeepEqual(replay.players[0].hand,game.players[0].hand);
 }
});
