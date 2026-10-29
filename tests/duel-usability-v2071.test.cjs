'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const read=file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');
function match(){
 const deck=snapshot.starterMain,fusions=snapshot.starterFusions;
 const room=rules.create({roomId:'v2071-stage',catalog,hostName:'Host',
  hostDeck:deck,hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,
  enemyFusionsA:fusions,enemyFusionsB:fusions});
 return rules.apply(room,2,{type:'join',name:'Partner',deck,fusions},{catalog});
}
test('retired Supporter role has the same meaning in runtime, Duo and Edge catalogs',()=>{
 assert.equal(snapshot.cards.filter(c=>c.role==='support').length,0);
 const server=require('../supabase/functions/arcane-duo-v2/catalog.json');
 assert.deepEqual(snapshot,server);
 const runtime=boot({seed:2071});
 const old=runtime.run('CARDS.filter(c=>c.role==="support").length');
 assert.equal(old,0);
 for(const id of [8,328,368,384,463,671,680]){
  const role=runtime.run('CARDS['+id+'].role');
  assert.equal(role,catalog[id].role);
 }
});
test('Duo discard preparation keeps exactly one selected hand monster and consumes summon',()=>{
 const g=match(),before=[...g.players[0].hand];
 assert.ok(before.length>=3);
 const after=rules.apply(g,0,{type:'summon',handIndex:0,slot:0,discardIndices:[1,2]},{catalog});
 assert.equal(after.players[0].summoned,true);
 assert.equal(after.players[0].hand.length,before.length-3);
 assert.equal(after.players[0].field[0].id,typeof before[0]==='number'?before[0]:before[0].id);
 assert.equal(after.players[0].graveyard.length,g.players[0].graveyard.length+2);
});
test('Duo discard requires valid, distinct indices that exclude the keeper',()=>{
 const g=match();
 for(const discardIndices of [[0],[1,1],[99],[1,2,3,4,5]]){
  assert.throws(()=>rules.apply(g,0,
   {type:'summon',handIndex:0,slot:0,discardIndices},{catalog}));
 }
});
test('Soul actions remain forbidden in ATK but available immediately in DEF',()=>{
 let g=match();
 g=rules.apply(g,0,{type:'summon',handIndex:0,slot:0},{catalog});
 const soul=g.players[0].field[0];
 soul.role='soul';soul.soul=100;
 assert.equal(soul.mode,'atk');
 assert.throws(()=>rules.apply(g,0,{type:'soulDischarge',slot:0},{catalog}),
  /nur Seelenzehrer in DEF/i);
 soul.mode='def';
 const after=rules.apply(g,0,{type:'soulDischarge',slot:0},{catalog});
 assert.equal(after.players[0].field[0].soul,0);
 assert.equal(after.players[0].field[0].lastSoulAction,after.players[0].ownTurns);
});
test('Duo controls stage replace, Fusion, and discard; only the inspector has Soul action buttons',()=>{
 const fusion=read('assets/duo-fusion-cards-v188.js');
 const summon=read('assets/duo-summon-cards-v189.js');
 const large=read('assets/duo-ux-v204.js');
 const dock=read('assets/duo-parity-v160.js');
 const single=read('assets/essence-progression.js');
 assert.match(fusion,/data|ad207-duo-stage-modes/);
 assert.match(fusion,/discardIndices:/);
 assert.match(fusion,/contextmenu/);
 assert.match(fusion,/Alles abwählen/);
 assert.match(summon,/Beschwören \/ Ersetzen/);
 assert.match(large,/ad207-soul-abilities/);
 assert.match(large,/card.mode==='def'/);
 assert.doesNotMatch(dock,/const souls=p.field.flatMap/);
 assert.match(single,/const g=game,bar=\$\('largeCardPreview'\)/);
});
