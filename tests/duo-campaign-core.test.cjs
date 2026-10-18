'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../assets/duo-campaign-core.js');
const deck=id=>Array(40).fill(id);
const catalog=Object.freeze({
  10:{id:10,name:'Verbündeter Wolf',atk:450,def:350},
  20:{id:20,name:'Gegner-Schild',atk:280,def:400},
  30:{id:30,name:'Partner-Falke',atk:370,def:260},
  40:{id:40,name:'Gegner-Bestie',atk:330,def:290}
});
function waiting(){
 return core.createLobby({roomId:'unit-room-12',hostName:'Host',hostDeck:deck(10),
 enemyDeckA:deck(20),enemyDeckB:deck(40)});
}
function active(){
 return core.apply(waiting(),2,{type:'join',name:'Partner',deck:deck(30)});
}
const apply=(g,id,action)=>core.apply(g,id,action,{catalog});
test('four seats are host, opponent A, partner, opponent B in that exact order',()=>{
 assert.equal(core.order(),'Du → Gegner A → Partner → Gegner B');
 assert.deepEqual(core.SEATS.map(p=>p.team),[0,1,0,1]);
});
test('room opens locked, with partner seat reserved but not present',()=>{
 const g=waiting();
 assert.equal(g.status,'waiting');assert.equal(g.activeSeat,0);
 assert.equal(g.players[2].deck.length,0);assert.deepEqual(g.teams.map(t=>t.lp),[12000,12000]);
});
test('invalid, short or malformed host decks cannot initialize a lobby',()=>{
 assert.throws(()=>core.createLobby({roomId:'valid-room',hostDeck:[10],enemyDeckA:deck(20),enemyDeckB:deck(40)}));
 assert.throws(()=>core.createLobby({roomId:'bad',hostDeck:deck(10),enemyDeckA:deck(20),enemyDeckB:deck(40)}));
});
test('join starts match without changing host or AI deck ownership',()=>{
 const g=active();
 assert.equal(g.status,'active');assert.equal(g.players[2].name,'Partner');
 assert.deepEqual(g.players.map(x=>x.hand[0]),[10,20,30,40]);
 assert.ok(g.players.every(x=>x.hand.length===5&&x.deck.length===35));
});
test('room cannot advance before invitation acceptance or be joined twice',()=>{
 assert.throws(()=>apply(waiting(),0,{type:'end'}),/nicht aktiv/);
 assert.throws(()=>apply(active(),2,{type:'join',name:'Other',deck:deck(30)}),/nicht beitreten/);
});
test('only the active seat may act',()=>{
 const g=active();
 assert.throws(()=>apply(g,2,{type:'end'}),/nicht am Zug/);
 assert.throws(()=>apply(g,1,{type:'summon',slot:0,handIndex:0}),/nicht am Zug/);
});
test('turns progress host → A → partner → B → host without skipping',()=>{
 let g=active();
 for(const [seat,next]of [[0,1],[1,2],[2,3],[3,0]]){
  g=apply(g,seat,{type:'end'});assert.equal(g.activeSeat,next);
 }
 assert.equal(g.round,2);assert.equal(g.turn,4);
});
test('each player summons from own deck only and cannot summon twice',()=>{
 let g=active();
 g=apply(g,0,{type:'summon',slot:0,handIndex:0});
 assert.equal(g.players[0].field[0].id,10);
 assert.equal(g.players[2].field[0],null);
 assert.throws(()=>apply(g,0,{type:'summon',slot:1,handIndex:0}),/bereits beschworen/);
});
test('AI turn deploys its own card and transfers control to the partner',()=>{
 let g=active();g=apply(g,0,{type:'end'});
 g=core.aiTurn(g,{catalog});
 assert.equal(g.activeSeat,2);assert.equal(g.players[1].field[0].id,20);
});
test('the partner cannot touch the host hand or field',()=>{
 let g=active();g=apply(g,0,{type:'summon',slot:0,handIndex:0});
 g=apply(g,0,{type:'end'});g=core.aiTurn(g,{catalog});
 g=apply(g,2,{type:'summon',slot:1,handIndex:0});
 assert.equal(g.players[2].field[1].id,30);
 assert.equal(g.players[0].field[1],null);
});
test('newly summoned monsters cannot attack before the next round',()=>{
 let g=active();g=apply(g,0,{type:'summon',slot:0,handIndex:0});
 assert.throws(()=>apply(g,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null}),/nächste Runde/);
});
test('opponent monsters on EITHER enemy field prevent direct attacks',()=>{
 let g=active();
 g=apply(g,0,{type:'summon',slot:0,handIndex:0});g=apply(g,0,{type:'end'});
 g=core.aiTurn(g,{catalog});g=apply(g,2,{type:'end'});g=core.aiTurn(g,{catalog});
 assert.equal(g.round,2);
 assert.throws(()=>apply(g,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null}),/gegnerische Kreaturen/);
});
test('team LP damage is shared between both allies while decks remain independent',()=>{
 let g=active();
 // Round 1 empty fields: no combat until next round.
 for(const seat of [0,1,2,3])g=apply(g,seat,{type:'end'});
 // On Round 2, create an attacker from Host's hand. Cannot attack until Round 3.
 g=apply(g,0,{type:'summon',slot:0,handIndex:0});
 for(const seat of [0,1,2,3])g=apply(g,seat,{type:'end'});
 const before=g.teams[1].lp;
 g=apply(g,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(g.teams[1].lp,before-450);
 assert.equal(g.teams[0].lp,12000);
});
