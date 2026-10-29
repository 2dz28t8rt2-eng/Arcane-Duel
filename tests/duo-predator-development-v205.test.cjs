'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const deck=snapshot.starterMain,fusions=snapshot.starterFusions;
const act=(g,seat,action)=>rules.apply(g,seat,action,{catalog});
function create(){
 const waiting=rules.create({roomId:'duo-predator-growth-205',hostName:'Host',
  hostDeck:deck,hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,
  enemyFusionsA:fusions,enemyFusionsB:fusions,catalog,randomSeed:205});
 return act(waiting,2,{type:'join',name:'Partner',deck,fusions});
}
test('2v2 client and Supabase Edge authoritative reducers have identical bytes',()=>{
 assert.equal(fs.readFileSync('assets/duo-shared-rules-v160.js','utf8'),
 fs.readFileSync('supabase/functions/arcane-duo-v2/duo-rules.js','utf8'));
});
test('normal 2v2 Predator advances after subsequent completed own turns, max 102%',()=>{
 let g=create();
 g.players[0].hand=[9];
 g=act(g,0,{type:'summon',slot:0,handIndex:0});
 const c=g.players[0].field[0];
 assert.equal(c.role,'predator');
 assert.equal(c.predatorEvolutionAge,0);
 assert.equal(c.predatorBornOwnTurn,0);
 let values=[c.predatorEvolutionAge];
 for(let n=0;n<5;n++){
  const prev=g.players[0].field[0].predatorEvolutionAge;
  g=act(g,0,{type:'end'});
  values.push(g.players[0].field[0]?.predatorEvolutionAge);
  if(n<4){
   for(const seat of [1,2,3])g=act(g,seat,{type:'end'});
   assert.equal(g.activeSeat,0);
  }
 }
 assert.deepEqual(values,[0,0,1,2,3,4]);
 assert.equal(g.players[0].field[0].predatorEvolutionAge,4);
 assert.equal(g.players[0].field[0].predatorBornOwnTurn,0);
 const publicState=rules.view(g,0);
 assert.equal(publicState.players[0].field[0].predatorEvolutionAge,4);
});
test('Fusion and special tokens are exempt; 2v2 inspector shows development and total',()=>{
 const src=fs.readFileSync('assets/duo-ux-v204.js','utf8');
 assert.match(src,/growthPct/);
 assert.match(src,/ENTWICKLUNG/);
 assert.match(src,/Gesamt/);
 const g=create();
 g.players[0].hand=[9,9,9];
 const available=rules.fusionOptions(g,0,[0,1,2].map(index=>({from:'hand',index})),catalog);
 const fused=act(g,0,{type:'fusion',slot:0,materials:[0,1,2].map(index=>({from:'hand',index})),
  templateId:available.templates[0]});
 assert.equal(fused.players[0].field[0].fusion,true);
 assert.equal(fused.players[0].field[0].predatorEvolutionAge,undefined);
});
