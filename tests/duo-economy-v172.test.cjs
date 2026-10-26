'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const e=require('../assets/duo-economy-v172.js');
const d=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(d.cards.map(c=>[c.id,c]));
const profile=(chapters=[])=>({
 owned_main:[...d.starterMain],owned_fusions:[...d.starterFusions],
 cleared_chapters:chapters,lv1_research:{},essence_binding:{},
 essence:5000,shards:70
});
test('pack menu has 1, 3, 5 and 10 cards with intended fusion ranges',()=>{
 const expectations={normal:[1,0,0],fusion:[1,1,1],material3:[3,0,0],
  fusion3:[3,1,2],fusion5:[5,2,3],fusion10:[10,3,5]};
 for(const [kind,[count,min,max]] of Object.entries(expectations)){
  const o=e.PACKS[kind];assert.equal(o.count,count);assert.deepEqual(o.fusions,[min,max]);
 }
});
test('all mixed packs guarantee the intended number of fusion templates',()=>{
 for(const [kind,[min,max]] of Object.entries({fusion3:[1,2],fusion5:[2,3],fusion10:[3,5]})){
  for(let selected=0;selected<=max-min;selected++){
   const r=e.packDraw(profile([1,2,3,4]),kind,catalog,n=>Math.min(selected,n-1));
   assert.equal(r.cards.length,e.PACKS[kind].count);
   assert.ok(r.fusionCount>=min&&r.fusionCount<=max);
   assert.equal(r.cards.filter(c=>c.fusion).length,r.fusionCount);
   assert.equal(r.cards.filter(c=>!c.fusion).length,r.normalCount);
  }
 }
});
test('packs never exceed 3 copies or draw lv1-exclusive special fusion',()=>{
 for(const kind of Object.keys(e.PACKS)){
  const p=profile([1,2,3,4]),r=e.packDraw(p,kind,catalog,n=>0);
  const count=x=>x.reduce((m,id)=>(m.set(id,(m.get(id)||0)+1),m),new Map());
  assert.ok([...count(r.owned_main).values()].every(n=>n<=3));
  assert.ok([...count(r.owned_fusions).values()].every(n=>n<=3));
  assert.ok(r.cards.every(c=>!catalog[c.id].lv1Exclusive));
  assert.equal(p.owned_main.length,d.starterMain.length,
   'drawing is pure until server CAS write');
  assert.equal(p.owned_fusions.length,d.starterFusions.length);
 }
});
test('higher level cards unlock through cleared 2v2 chapters only',()=>{
 assert.equal(e.maxCardLevel(profile([])),3);
 assert.equal(e.maxCardLevel(profile([1])),5);
 assert.equal(e.maxCardLevel(profile([1,2])),7);
 assert.equal(e.maxCardLevel(profile([1,2,3])),9);
 assert.equal(e.maxCardLevel(profile([1,2,3,4])),10);
 const pool=e.available(profile([]),d.starterMain,false,catalog);
 assert.ok(pool.length>10&&pool.every(c=>c.level<=3));
 assert.ok(pool.every(c=>!c.essenceMonster),'essence companions require chapter two');
});
test('Lv1 research is locked behind solo-independent 2v2 chapter completion',()=>{
 const blank=profile([]),c2=profile([1,2]),c3=profile([1,2,3]);
 assert.equal(e.researchOffer(blank,'lv1').unlocked,false);
 assert.equal(e.researchOffer(c2,'lv1').unlocked,true);
 assert.equal(e.researchOffer(blank,'essence').unlocked,false);
 assert.equal(e.researchOffer(c2,'essence').unlocked,true);
 c2.lv1_research={perk:true,rank:2};
 assert.equal(e.researchOffer(c2,'lv1').nextRank,3);
 assert.equal(e.researchOffer(c2,'lv1').unlocked,false);
 c3.lv1_research={perk:true,rank:5};
 assert.equal(e.researchOffer(c3,'lv1').maxed,true);
});
test('all pack and research definitions are affordable and positive',()=>{
 for(const o of Object.values(e.PACKS)){assert.ok(o.essence>0&&o.shards>0&&o.count>0);}
 for(const branch of Object.values(e.RESEARCH)){
  assert.equal(branch.costs.length,branch.maxRank);
  assert.equal(branch.chapterByRank.length,branch.maxRank);
  assert.ok(branch.costs.every(([ess,shard])=>ess>0&&shard>0));
 }
});
test('essence monsters are obtainable only after 2v2 chapter two',()=>{
 const low=e.available(profile([1]),d.starterMain,false,catalog);
 const high=e.available(profile([1,2]),d.starterMain,false,catalog);
 assert.ok(low.every(c=>!c.essenceMonster));
 assert.ok(high.some(c=>c.essenceMonster));
});
