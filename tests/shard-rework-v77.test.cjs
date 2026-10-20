'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('Normal craft prices are level-based and have no Essence charge; Fusion keeps its original dual price',()=>{
 const rows=boot({seed:7701}).run(`(()=>{profile.trainingWins=3;profile.cleared=[1,2,3,4,5,6,7,8,9,10];profile.shards[0]=800;profile.coins=100000;
  const normal=[2,4,7,9].map(level=>{
   const c=CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.trainingReward&&
    !c.milestoneOnly&&!c.hard&&!c.essenceMonster&&!c.enemyOnly&&
    !c.questOnly&&!c.lv1Exclusive&&!c.fateOnly&&!c.workshopOnly&&
    c.level===level&&cardAvailable(c.id));
   if(!c)throw Error('Missing normal at level '+level);
   const before=sharedShards(),coins=profile.coins,n=profile.inventory[c.id]||0;
   return {level,cost:cardCraftShardCost(c.id),ok:craftCard(c.id),
    shards:before-sharedShards(),coins:coins-profile.coins,
    copies:(profile.inventory[c.id]||0)-n};
  });
  const c=CARDS.find(c=>c.rpg&&c.fusionOnly&&!c.ace&&!c.essenceMonster&&
   !c.milestoneOnly&&!c.trainingReward&&!c.workshopOnly&&!c.hard&&
   !c.enemyOnly&&!c.questOnly&&!c.lv1Exclusive&&!c.fateOnly&&cardAvailable(c.id));
  if(!c)throw Error('No craftable fusion');
  const prior=sharedShards(),coins=profile.coins,price=cardCost(c.id);
  const fusion={ok:craftCard(c.id),cost:cardCraftShardCost(c.id),
   shards:prior-sharedShards(),coins:coins-profile.coins,expectedEssence:price};
  const ace=ACE_CARD_IDS[10],before=sharedShards(),aceCraft=craftCard(ace);
  return {normal,fusion,aceCraft,shardsAfterAce:before-sharedShards()};
 })()`);
 assert.deepEqual(rows.normal.map(r=>r.cost),[10,18,28,40]);
 for(const r of rows.normal){assert.equal(r.ok,true);assert.equal(r.shards,r.cost);
  assert.equal(r.coins,0);assert.equal(r.copies,1);}
 assert.equal(rows.fusion.ok,true);assert.equal(rows.fusion.cost,30);
 assert.equal(rows.fusion.shards,30);assert.equal(rows.fusion.coins,rows.fusion.expectedEssence);
 assert.equal(rows.aceCraft,false);assert.equal(rows.shardsAfterAce,0);
});
test('Normal crafting cannot bypass the tournament gate or balance',()=>{
 const r=boot({seed:7702}).run(`(()=>{
 const high=CARDS.find(c=>c.id>=716&&c.id<=731&&c.level>=7);
 const before=sharedShards(),coin=profile.coins,copies=profile.inventory[high.id]||0;
 const ok=craftCard(high.id);
 return {ok,shards:before-sharedShards(),coins:coin-profile.coins,
  copies:(profile.inventory[high.id]||0)-copies};
 })()`);
 assert.deepEqual(r,{ok:false,shards:0,coins:0,copies:0});
});
test('Research offers three distinct eligible cards with persisted choice and charged only once',()=>{
 const r=boot({seed:7703}).run(`(()=>{profile.trainingWins=3;profile.cleared=[1,2,3,4,5,6,7,8,9,10];profile.shards[0]=800;profile.coins=100000;
 const role=SHARD_RESEARCH_ROLES.find(s=>shardResearchPool(s).length>=3);
 if(!role)throw Error('No research role has 3 cards');
 const before=sharedShards(),ok=beginShardResearch(role);
 const offered=[...profile.shardResearch.offers],repeat=beginShardResearch(role);
 const saved=validateProfile(JSON.parse(JSON.stringify(profile))).shardResearch;
 const prior=profile.inventory[offered[1]]||0;
 const chosen=takeShardResearchCard(1),again=takeShardResearchCard(1);
 return {role,ok,offered,repeated:repeat,persisted:saved?.offers,
  chosen,again,remaining:profile.shardResearch,
  cardCopies:(profile.inventory[chosen]||0)-prior,spent:before-sharedShards(),
  eligible:offered.every(id=>CARDS[id].role===role&&!CARDS[id].ace&&
   !CARDS[id].fusionOnly&&CARDS[id].rpg)};
 })()`);
 assert.equal(r.ok,true);assert.equal(r.repeated,false);
 assert.equal(new Set(r.offered).size,3);assert.deepEqual(r.persisted,r.offered);
 assert.equal(r.chosen,r.offered[1]);assert.equal(r.again,false);
 assert.equal(r.spent,12);assert.equal(r.cardCopies,1);
 assert.equal(r.remaining,null);assert.equal(r.eligible,true);
});
test('Role research save rejects forged ACE offer and no role can bypass legal pool',()=>{
 const r=boot({seed:7704}).run(`(()=>{profile.trainingWins=3;profile.cleared=[1,2,3,4,5,6,7,8,9,10];profile.shards[0]=800;profile.coins=100000;
 const role=SHARD_RESEARCH_ROLES.find(s=>shardResearchPool(s).length>=3);
 beginShardResearch(role);
 const raw=JSON.parse(JSON.stringify(profile));
 raw.shardResearch.offers[1]=ACE_CARD_IDS[10];
 let rejected=false;try{validateProfile(raw)}catch(e){rejected=true}
 return {rejected,legitimate:shardResearchPool(role).every(c=>cardAvailable(c.id))};
 })()`);
 assert.equal(r.rejected,true);assert.equal(r.legitimate,true);
});
test('Receipt reroll exchanges a genuinely unreserved starter: once, for 5 shards, no extra cards',()=>{
 const r=boot({seed:7705}).run(`(()=>{profile.trainingWins=3;profile.cleared=[1,2,3,4,5,6,7,8,9,10];profile.shards[0]=800;profile.coins=100000;profile.boosterSeals=100000;
 profile.upgrades.starter=0;
 let index=-1;
 for(let trial=0;trial<12;trial++){
  if(!buyBooster(5))throw Error('Cannot buy booster');
  index=profile.lastBooster.cards.findIndex(id=>DEFAULT_DECK.includes(id)&&
   (profile.inventory[id]||0)>Math.max(1,reservedCopies(id))&&
   !profile.favorites.includes(id));
  if(index>=0)break;
 }
 if(index<0)throw Error('No available starter in receipt');
 const original=profile.lastBooster.cards[index],old=profile.inventory[original];
 const count=Object.values(profile.inventory).reduce((a,b)=>a+b,0),shards=sharedShards(),coins=profile.coins;
 const next=rerollBoosterStarter(index),repeat=rerollBoosterStarter(index);
 const save=validateProfile(JSON.parse(JSON.stringify(profile)));
 return {next,repeat,used:profile.lastBooster.rerolled,saveUsed:save.lastBooster.rerolled,
  oldCopies:old-profile.inventory[original],
  totalCopies:Object.values(profile.inventory).reduce((a,b)=>a+b,0)-count,
  spent:shards-sharedShards(),coinsUsed:coins-profile.coins,
  normal:boosterPools(profile.lastBooster.tier).normal.includes(next),
  ace:!!CARDS[next].ace,receiptId:profile.lastBooster.cards[index]};
 })()`);
 assert.equal(r.repeat,false);assert.equal(r.used,true);assert.equal(r.saveUsed,true);
 assert.equal(r.oldCopies,1);assert.equal(r.totalCopies,0);assert.equal(r.spent,5);
 assert.equal(r.coinsUsed,0);assert.equal(r.normal,true);assert.equal(r.ace,false);
 assert.equal(r.receiptId,r.next);
});
test('Actual shop exposes role research and shard receipt actions',()=>{
 const m=boot({seed:7706}).run(`(()=>{
 profile.lastBooster={tier:0,cards:[DEFAULT_DECK[0]],rerolled:false};
 const html=shopMarkup();
 return {roles:SHARD_RESEARCH_ROLES.every(role=>html.includes('data-role="'+role+'"')),
  research:html.includes('data-action="shard-research"'),
  reroll:html.includes('data-action="shard-reroll"'),
  craft:html.includes('10 ◆')&&html.includes('40 ◆')};
 })()`);
 assert.equal(Object.values(m).every(Boolean),true);
});
