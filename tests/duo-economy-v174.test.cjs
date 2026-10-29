'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const e=require('../assets/duo-economy-v172.js');
const d=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(d.cards.map(c=>[c.id,c]));
const profile=chapters=>({cleared_chapters:chapters,owned_main:[...d.starterMain],
 owned_fusions:[...d.starterFusions],essence:105,shards:2});
test('first and repeat reward previews match chapter-I payout policy',()=>{
 const c=e.rewardTable()[0];assert.deepEqual(c.first,{xp:60,essence:105,shards:2,chapterCards:3});
 assert.deepEqual(c.repeat,{xp:30,essence:42,shards:1,chapterCards:0});
 assert.equal(e.REPEAT_RATE.dailyLimit,3);
});
test('shop affordability predicts separate essence and shard shortages',()=>{
 const p=profile([1]);const fusion=e.afford(p,e.PACKS.fusion,1);
 assert.equal(fusion.essenceShort,55);assert.equal(fusion.shardsShort,0);
 assert.equal(fusion.repeatsNeeded,2);
 const material=e.afford(p,e.PACKS.material3,1);
 assert.equal(material.repeatsNeeded,3);
});
test('earned chapter card pool is empty before a chapter win',()=>{
 assert.deepEqual(e.chapterCardPool(profile([]),catalog),[]);
});
test('earned chapter cards stay within upper two unlocked levels',()=>{
 for(const chapters of [[1],[1,2],[1,2,3],[1,2,3,4]]){
  const p=profile(chapters),maximum=e.maxCardLevel(p),pool=e.chapterCardPool(p,catalog);
  assert.ok(pool.length>0);
  assert.ok(pool.every(c=>c.level>=maximum-1&&c.level<=maximum));
  assert.ok(pool.every(c=>!c.essenceMonster&&!c.lv1Exclusive&&!c.ace&&!c.fusionOnly));
 }
});
test('three/five/ten packs retain fusion quotas despite stage guarantee',()=>{
 for(const [type,limits] of Object.entries({fusion3:[1,2],fusion5:[2,3],fusion10:[3,5]})){
  for(let i=0;i<=limits[1]-limits[0];i++){
   const p=profile([1,2,3,4]),r=e.packDraw(p,type,catalog,max=>Math.min(i,max-1));
   assert.equal(r.cards.length,e.PACKS[type].count);
   assert.ok(r.fusionCount>=limits[0]&&r.fusionCount<=limits[1]);
   assert.ok(r.cards.some(c=>c.level>=e.maxCardLevel(p)-1));
  }
 }
});
