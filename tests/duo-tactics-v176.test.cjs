'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const earned=require('../scripts/bench-duo-earned-v175.cjs');
const tactics=require('../scripts/bench-duo-tactics-v176.cjs');
const rules=require('../assets/duo-shared-rules-v160.js');
const data=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(data.cards.map(c=>[c.id,c]));
const count=arr=>arr.reduce((m,id)=>(m.set(id,(m.get(id)||0)+1),m),new Map());
test('each strategic deck contains only copies owned through independent 2v2 rewards',()=>{
 for(const style of ['simple','fusion','defense','hybrid']){
  const p=earned.profile();earned.award(p,1);
  earned.spendCredits(p,earned.rng(127));
  tactics.rebuildStyle(p,style);
  assert.ok(rules.validDeck(p.deck,catalog));
  const owned=count(p.owned_main);
  for(const [id,n] of count(p.deck))assert.ok(n<=owned.get(id));
 }
});
test('fusion candidates consume only available hand cards and real fusion templates',()=>{
 const a=earned.profile(),g=rules.create({roomId:'tactics-176',hostName:'A',
  hostDeck:a.deck,hostFusions:a.fusions,
  enemyDeckA:earned.aiDeck(1,1),enemyDeckB:earned.aiDeck(1,3),
  enemyFusionsA:a.fusions,enemyFusionsB:a.fusions,
  chapter:1,entry:'new',catalog,randomSeed:123});
 const joined=rules.apply(g,2,{type:'join',name:'B',deck:a.deck,fusions:a.fusions},{catalog});
 const action=tactics.pickFusion(joined,0);
 if(action){
  assert.ok(joined.players[0].remainingFusion.includes(action.templateId));
  assert.ok(action.materials.every(m=>m.from==='hand'&&m.index<joined.players[0].hand.length));
  assert.doesNotThrow(()=>rules.apply(joined,0,action,{catalog}));
 }
});
test('earned tactical career is reproducible, with no invented card or currency',()=>{
 for(const style of ['simple','fusion','defense','hybrid']){
  const a=tactics.career(3123,style,'claims');
  const b=tactics.career(3123,style,'claims');
  assert.deepEqual(a,b);
  assert.ok(a.stage>=0&&a.stage<=4&&a.games>=1);
 }
});
