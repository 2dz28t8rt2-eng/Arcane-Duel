/* Arcane Duel v7.6 – no-balance-change probability audit of the REAL shop,
 * legal sources and spendable shards. Zero game data/profile mutations.
 * Distribution quotes are theoretical for each already-cleared tier.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const rt=boot({seed:76091});
const data=rt.run(`(()=>({
 cardCount:CARDS.length,
 shards:{craftCost:SHARD_CRAFT_COST,salvageNormal:2,salvageFusion:4},
 perks:Object.entries(UPGRADES).map(([key,p])=>({
  key,name:p.name,description:p.desc,base:p.base,max:p.max
 })),
 tiers:[3,4,5,6,7,8,9,10].map(tier=>{
  const b=boosterPools(tier);
  const info=ids=>({
   count:ids.length,
   normalSeven:ids.filter(id=>CARDS[id].level>=7&&!CARDS[id].fusionOnly).length,
   late16:ids.filter(id=>id>=716&&id<=731).length,
   uniqueIds:new Set(ids).size,
   maxNormalLevel:Math.max(0,...ids.filter(id=>!CARDS[id].fusionOnly).map(id=>CARDS[id].level))
  });
  const reward=lootWeights(tier,'easy');
  const lateIds=reward.filter(x=>x.id>=716&&x.id<=731);
  const total=reward.reduce((a,x)=>a+x.weight,0);
  return {tier,boosterPrice5:boosterPrice(tier,5),boosterPrice10:boosterPrice(tier,10),
    pools:{starter:info(b.starter),normal:info(b.normal),rare:info(b.rare)},
    loot:{total,entries:reward.length,late16Count:lateIds.length,
     late16Weight:lateIds.reduce((a,x)=>a+x.weight,0),
     allNormalSevenWeight:reward.filter(x=>CARDS[x.id].level>=7&&!CARDS[x.id].fusionOnly).reduce((a,x)=>a+x.weight,0)},
    new16:CARDS.slice(716,732).filter(c=>c.requiredTier<=tier).map(c=>({id:c.id,lv:c.level,source:c.source}))
  };
 })
}))()`);
assert.equal(data.cardCount,732);
const booster5=[{starter:.85,normal:.13,rare:.02},{starter:.85,normal:.13,rare:.02},
 {starter:.85,normal:.13,rare:.02},{starter:.85,normal:.13,rare:.02},
 {starter:.60,normal:.28,rare:.12}];
const booster10=[...Array.from({length:8},()=>({starter:.85,normal:.13,rare:.02})),
 {starter:.40,normal:.35,rare:.25},{starter:.15,normal:.35,rare:.50}];
const expectation=(tier,slots,filter)=>{
 const p=tier.pools;
 const share=pool=>pool.count?pool[filter]/pool.count:0;
 return {
  starter:slots.reduce((a,x)=>a+x.starter,0),
  normal:slots.reduce((a,x)=>a+x.normal,0),
  rare:slots.reduce((a,x)=>a+x.rare,0),
  wanted:slots.reduce((a,x)=>a+x.normal*share(p.normal)+x.starter*share(p.starter)+x.rare*share(p.rare),0),
  chanceAtLeastOne:1-slots.reduce((a,x)=>a*(1-(x.normal*share(p.normal)+x.starter*share(p.starter)+x.rare*share(p.rare))),1)
 };
};
const rows=data.tiers.map(t=>({
 tier:t.tier,
 unlockableNew16:t.new16.length,
 fivePack:{price:t.boosterPrice5,
  normalSeven:expectation(t,booster5,'normalSeven'),
  newLate16:expectation(t,booster5,'late16')},
 tenPack:{price:t.boosterPrice10,
  normalSeven:expectation(t,booster10,'normalSeven'),
  newLate16:expectation(t,booster10,'late16')},
 normalPool:t.pools.normal,
 freeDuelEasy:{
  rewardChanceWin:0.4,
  newLate16ConditionalWeightPercent:t.loot.late16Weight,
  newLate16PerWinBeforeFarmPenalty:.4*t.loot.late16Weight/100,
  normalLv7PlusPerWinBeforeFarmPenalty:.4*t.loot.allNormalSevenWeight/100
 },
 expectedShardsPerWonManualDuel:3,
 directCraftShardPrice:data.shards.craftCost
}));
const base={schema:'arcane-v76-real-economy-catalogue-audit',
 metadata:{
  cards:data.cardCount,perks:data.perks.length,
  staticAnalysis:true,noShopChanges:true,noSkillChanges:true,
  sources:[
    'Game shop rollBooster(): first 4 of a 5-pack = 85% starter / 13% normal / 2% rare, last=60%/28%/12%',
    'Loot frequency 40% on a won manual free duel BEFORE farmingDropFactor, real source weights measured through lootWeights.',
    'Crafting consumes 30 shared shards AND cardCost(id) Essence.',
    'Salvage refunds 2 normal or 4 fusion shards with saved deck reservation checks.'
  ],
  importantCaveats:[
   'Booster math is exact conditional on pool composition, not observed career acquisition.',
   'The probabilities apply to a single purchase at a chosen already-cleared tier.',
   'Free duel drops are adjusted by farmingDropFactor; repeated farming can have lower probabilities.',
   'The free-duel reward chance is separate from winning probability.',
   'A newly owned card may not be equipped or strategically suited.',
   'This report does not change skills, items, drop rates, NPCs or saves.'
  ]},
 shardSink:data.shards, existingPerks:data.perks,tiers:rows};
for(const t of rows){
 assert.ok(Math.abs(t.fivePack.normalSeven.starter-4)<1e-9);
 assert.ok(t.fivePack.newLate16.wanted>=0&&t.fivePack.newLate16.chanceAtLeastOne<=1);
 assert.ok(t.freeDuelEasy.newLate16PerWinBeforeFarmPenalty>=0);
 assert.ok(t.normalPool.late16<=16);
}
assert.equal(data.shards.craftCost,30);
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-v76-real-economy-audit.json',JSON.stringify(base,null,2)+'\n');
for(const t of rows)console.log('ARCANE_V76_TIER '+JSON.stringify({
 tier:t.tier,normalPool:t.normalPool.count,newInPool:t.normalPool.late16,
 availableLate16:t.unlockableNew16,
 fivePackExpectedStarter:t.fivePack.newLate16.starter,
 fivePackExpectedNewLate16:+t.fivePack.newLate16.wanted.toFixed(4),
 fivePackChanceNewLate16:+(100*t.fivePack.newLate16.chanceAtLeastOne).toFixed(2),
 tenPackChanceNewLate16:+(100*t.tenPack.newLate16.chanceAtLeastOne).toFixed(2),
 lateDropPerWonFreeDuelPct:+(100*t.freeDuelEasy.newLate16PerWinBeforeFarmPenalty).toFixed(2)}));
console.log('ARCANE_V76_SUMMARY '+JSON.stringify({cards:data.cardCount,
 perks:data.perks.length,tiers:rows.length,craftShards:data.shards.craftCost,
 salvageNormal:data.shards.salvageNormal,salvageFusion:data.shards.salvageFusion,
 fivePackExpectedStarters:4,liveBalanceUntouched:true}));
