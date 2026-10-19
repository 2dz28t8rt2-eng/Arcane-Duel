/* Arcane Duel v8.2 – isolated A/B tests for purchase value, shard reserve and paid reroll decisions.
 * No invented owned cards: play real training, tournament and farming games;
 * settle original rewardMatch, choose milestone prizes, buy affordable packs,
 * equip cards already present in actual profile.inventory.
 * Stop at unsolved tournament tier rather than gifting progress.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {soulBridgeCode}=require('./helpers/earned-soul-bridge-v67.cjs');
const careers=Number(process.env.ARCANE_V82_CAREERS||20);
const limit=Number(process.env.ARCANE_V82_TIER_ATTEMPTS||16);
if(!Number.isInteger(careers)||careers<1||careers>32||
 !Number.isInteger(limit)||limit<3||limit>22)throw Error('Invalid bounded career audit settings');
// Fresh isolated VM per arm, so identical paid resources and PRNG seeds
// yield a genuine paired progression comparison.
const choices=['balanced','offensive','guardian','economy','balanced','guardian','offensive','economy'];
const arms=['late-shard','early-shard','value-shard','reserve-shard','no-reroll-shard'];
const results=[];
for(let run=0;run<careers;run++)for(const strategy of arms){
 const vm=boot({seed:670127+run*317});
 const policy=choices[run%choices.length],plan=['investment','specialize','farm','hybrid'][run%4];
 const expr=`(()=>{
  profile=freshProfile();profile.guideSeen=true;profile.showcase.pending=false;
  const seed=${64127+run*9301},policy='${policy}',plan='${plan}',
   strategy='${strategy}',
   maxAttempts=${limit},snapshots=[],events=[];
  let serial=0,rewarded=0,training=0,farms=0,tournaments=0,boosters=0,
   bridgeRebuilds=0,bridgeMains=0,bridgeFusions=0,
   shardCrafts=0,shardResearches=0,shardRerolls=0,shardsSpent=0,lastPurchaseTier=-1,purchasesOnTier=0,
   losses=0,winCount=0,packChoice=0,milestones=0,crafts=0,upgrades=0,
   buysAttempted=0,farmsSinceTier=0;
  const shopBudget=plan==='farm'?8:plan==='specialize'?12:plan==='hybrid'?12:14;
  const farmAfter=plan==='farm'?5:plan==='hybrid'?4:plan==='specialize'?3:2;
  const validDeck=(p)=>!mainDeckError(p.activeDeck)&&!fusionDeckError(p.fusionDeck);
  function settle(){
   for(let loops=0;loops<15&&profile.rewardQueue.length;loops++){
    const q=profile.rewardQueue[0];
    const option=q.cards?.length?[...q.cards].sort((a,b)=>
     (CARDS[b].atk+CARDS[b].def)-(CARDS[a].atk+CARDS[a].def))[0]:null;
    if(!finishMilestone(q.kind==='choice'?option:undefined))
     throw Error('Actual milestone reward could not be settled');
    milestones++;
   }
   if(profile.rewardQueue.length)throw Error('Pending milestone queue remains');
  }
  function prepare(allowPurchase=true){
   settle();
   for(let source=0;source<=Math.max(0,...profile.cleared);source++){
    if(profile.packs[packKey(source,'easy')]>0&&openCharacterPack(source,'easy')){
     const c=[...profile.openPack.cards],best=c.map((id,i)=>({id,i})).sort((a,b)=>
      (CARDS[b.id].atk+CARDS[b.id].def)-(CARDS[a.id].atk+CARDS[a.id].def))[0];
     if(best&&takePackCard(best.i)){packChoice++;closeCharacterPack();}
    }
   }
   if(allowPurchase){
    const tier=highestCleared();
    // All investments call the actual economy operations and pay their
    // ordinary costs: no direct inventory/coins/upgrades assignment.
    if((plan==='specialize'||plan==='hybrid')&&upgrades<8){
     const order=policy==='offensive'?['jagdinstinkt','power','starter','learning']:
      policy==='guardian'?['schildwall','power','starter','learning']:
      ['power','starter','learning','jagdinstinkt'];
     const available=order.find(k=>UPGRADES[k]&&
      profile.upgrades[k]<UPGRADES[k].max&&
      profile.coins>=upgradeCost(k)+(tier>=4?75:110));
     if(available&&buyUpgrade(available)){upgrades++;buysAttempted++;}
    }
    if((plan==='farm'||plan==='specialize'||plan==='hybrid')&&crafts<10&&
     sharedShards()>=SHARD_CRAFT_COST){
     const pool=CARDS.filter(c=>c.rpg&&!c.retired&&!c.hard&&
      !c.workshopOnly&&!c.ace&&!c.essenceMonster&&
      c.source>=0&&c.source<=tier&&c.level<=10&&
      cardAvailable(c.id)&&profile.coins>=cardCost(c.id)+(tier>=4?60:120))
      .sort((a,b)=>b.level-a.level||
       (b.atk+b.def)-(a.atk+a.def));
     if(pool.length&&craftCard(pool[0].id)){crafts++;buysAttempted++;}
    }
    const count=plan==='investment'?5:plan==='farm'?3:5;
    if(boosters<shopBudget&&profile.coins>=boosterPrice(tier,count)+90){
     if(buyBooster(count)){boosters++;buysAttempted++;}
    }
   }

   // v8.0: compare early after-II and late after-IV legitimate shard investment.
   // Every new card comes from craftCard, research choice or paid receipt reroll.
   // Never mutate inventory/shards, enemy unlocks, ACEs or Essence directly.
   if((strategy==='late-shard'&&highestCleared()>=4)||
      (strategy!=='late-shard'&&highestCleared()>=2)){
    const beforeShards=sharedShards();
    if(shardCrafts<10){
     const pool=CARDS.filter(c=>c&&c.rpg&&!c.retired&&
      !c.fusionOnly&&!c.ace&&!c.essenceMonster&&!c.enemyOnly&&
      !c.questOnly&&!c.lv1Exclusive&&!c.fateOnly&&
      !c.milestoneOnly&&!c.workshopOnly&&!c.trainingReward&&!c.hard&&
      cardAvailable(c.id)&&sharedShards()>=cardCraftShardCost(c.id)+(strategy==='reserve-shard'?20:0))
      .sort((a,b)=>b.level-a.level||
       (b.atk+b.def)-(a.atk+a.def));
     // A cap of 3 owned copies avoids buying arbitrarily deep duplicates.
     const score=id=>{const c=CARDS[id];return (c.atk+c.def)/2+c.level*250+
       (policy==='guardian'&&(c.role==='guardian'||c.role==='soul')?120:0)+
       (policy==='offensive'&&c.role==='predator'?120:0);};
     const deckScore=ids=>ids.reduce((sum,id)=>sum+score(id),0);
     const oldScore=deckScore(profile.activeDeck);
     const best=pool.filter(c=>(profile.inventory[c.id]||0)<3).find(c=>{
      if(strategy!=='value-shard')return true;
      const owned={...profile.inventory,[c.id]:(profile.inventory[c.id]||0)+1};
      const preview=strongestMainDeck([...new Set([...profile.unlocked,c.id])],
        profile.enhancements,owned);
      const actuallyEquipped=preview.filter(id=>id===c.id).length>
        profile.activeDeck.filter(id=>id===c.id).length;
      return actuallyEquipped&&deckScore(preview)-oldScore>=
        (highestCleared()<4?180:140);
     });
     if(best&&craftCard(best.id))shardCrafts++;
    }
    if(shardResearches<5&&sharedShards()>=SHARD_RESEARCH_COST+(strategy==='reserve-shard'?20:0)){
     const roles=SHARD_RESEARCH_ROLES.map(role=>({role,pool:shardResearchPool(role)}))
      .filter(x=>x.pool.length>=3).sort((a,b)=>
       Math.max(...b.pool.map(c=>c.level*1000+c.atk+c.def))-
       Math.max(...a.pool.map(c=>c.level*1000+c.atk+c.def)));
     if(roles.length&&beginShardResearch(roles[0].role)){
      const chosen=profile.shardResearch.offers.map((id,i)=>({id,i}))
       .sort((a,b)=>(CARDS[b.id].level*1000+CARDS[b.id].atk+CARDS[b.id].def)-
          (CARDS[a.id].level*1000+CARDS[a.id].atk+CARDS[a.id].def))[0];
      if(!chosen||takeShardResearchCard(chosen.i)!==chosen.id)
       throw Error('Paid shard research failed in v7.9 career');
      shardResearches++;
     }
    }
    if(strategy!=='no-reroll-shard'&&shardRerolls<5&&profile.lastBooster&&
       !profile.lastBooster.rerolled&&sharedShards()>=SHARD_REROLL_COST+(strategy==='reserve-shard'?20:0)){
     const index=profile.lastBooster.cards.findIndex(id=>
      DEFAULT_DECK.includes(id)&&(profile.inventory[id]||0)>
       Math.max(1,reservedCopies(id))&&!profile.favorites.includes(id));
     if(index>=0&&rerollBoosterStarter(index)!==false)shardRerolls++;
    }
    if(sharedShards()>beforeShards)throw Error('Shard purchases minted resources');
    shardsSpent+=beforeShards-sharedShards();
   }
   const oldMain=[...profile.activeDeck],oldFusion=[...profile.fusionDeck];
   equipBest();
   // Stage V is already cleared IV; before that ALL decks remain identical.
   if(highestCleared()>=4){
    const bridge=(function(){${soulBridgeCode}})();
    bridgeRebuilds+=Number(bridge.changed);
    bridgeMains+=Number(bridge.mainChanged);
    bridgeFusions+=Number(bridge.fusionChanged);
   }
   if(!validDeck(profile)){
    profile.activeDeck=oldMain;profile.fusionDeck=oldFusion;
    if(!validDeck(profile))throw Error('Actual inventory produces illegal deck');
   }
  }
  function duel(tier,context){
   const id='real-career-v64-'+seed+'-'+(++serial);
   const g=createGame({id,mode:'pve',context,opponentId:tier,
    seed:(seed*179+serial*3307+tier*1021)>>>0||1,
    starter:serial%2,deck:[...profile.activeDeck],
    fusionDeck:[...profile.fusionDeck],enhancements:profile.enhancements,
    difficulty:'easy'});
   simulateGame(g,policy);
   const win=g.winner===0;
   if(g.winner===null)throw Error('Incomplete career match');
   const reward=rewardMatch(g);
   if(!reward)throw Error('Real rewardMatch failed');
   rewarded++;winCount+=Number(win);losses+=Number(!win);
   if(context==='free'&&tier>0)farms++;
   if(context==='tournament')tournaments++;
   events.push({tier,context,won:win,playerLevel:playerLevel(profile),
    deckAverageLevel:profile.activeDeck.reduce((sum,id)=>sum+CARDS[id].level,0)/profile.activeDeck.length,
    loot:reward.loot?.card??null,coins:reward.coins,xp:reward.xp});
   return win;
  }
  function snapshot(tier){
   if(!validDeck(profile))throw Error('Snapshot violates deck rules tier '+tier);
   const own=profile.inventory;const count=(ids)=>{
    const m={};for(const id of ids)m[id]=(m[id]||0)+1;
    return Object.entries(m).every(([id,n])=>n<=(own[id]||0));
   };
   if(!count(profile.activeDeck)||!count(profile.fusionDeck))
    throw Error('Unowned cards in a real-played deck: '+tier);
   const last=profile.cleared,inventory=JSON.parse(JSON.stringify(profile));
   const equipped=profile.activeDeck.map(id=>CARDS[id]).filter(Boolean);
   const fusions=profile.fusionDeck.map(id=>CARDS[id]).filter(Boolean);
   const levels={};const roles={};
   for(const c of equipped){levels[c.level]=(levels[c.level]||0)+1;
    const role=c.role||'other';roles[role]=(roles[role]||0)+1;}
   const ownedEntries=Object.entries(own).filter(([id,n])=>n>0&&CARDS[Number(id)]);
   const ownedHighest=ownedEntries.length?
    Math.max(...ownedEntries.map(([id])=>CARDS[Number(id)].level||0)):0;
   return {tier,cleared:[...last],trainingWins:profile.trainingWins,
    mainDeckLevelCounts:levels,mainDeckRoleCounts:roles,
    averageMainLevel:+(equipped.reduce((a,c)=>a+c.level,0)/Math.max(1,equipped.length)).toFixed(2),
    level7PlusEquipped:equipped.filter(c=>c.level>=7).length,
    fusionDeckSize:fusions.length,
    fusionDeckLevels:fusions.map(c=>c.level),
    uniqueMainCards:new Set(profile.activeDeck).size,
    ownedCardCopies:ownedEntries.reduce((sum,[,n])=>sum+n,0),
    highestOwnedCardLevel:ownedHighest,shardsAvailable:sharedShards(),
    playerLevel:playerLevel(profile),coins:profile.coins,
    activeDeck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],
    enhancements:JSON.parse(JSON.stringify(profile.enhancements)),
    inventoryOwned:JSON.parse(JSON.stringify(own)),
    boostersPurchased:boosters,packChoices:packChoice,
    crafts,upgrades,earnedFarms:farms,shopPurchases:buysAttempted,
    shardCrafts,shardResearches,shardRerolls,shardsSpent,
    bridgeRebuilds,bridgeMains,bridgeFusions,
    achievements:milestones,rewardedMatches:rewarded,
    sourceMax:Math.max(0,...last),provenance:'snapshot immediately before a REAL tournament attempt',
    profile:inventory};
  }
  for(let i=0;i<20&&profile.trainingWins<3;i++){
   duel(0,'free');if(i%2===1)prepare();
  }
  training=profile.trainingWins;
  if(training!==3)return {policy,plan,training,snapshots,error:'Could not complete real introduction'};
  prepare();
  for(let tier=1;tier<=10;tier++){
   if(tier>1&&!profile.cleared.includes(tier-1))
    throw Error('Progress was not legitimately unlocked: '+tier);
   snapshots.push(snapshot(tier));
   let won=false;
   for(let attempt=0;attempt<maxAttempts;attempt++){
    won=duel(tier,'tournament');prepare();
    if(won)break;
    if(attempt%3===2)for(let k=0;k<farmAfter;k++){
     const farmTier=Math.max(0,tier-1);
     duel(farmTier,'free');farmsSinceTier++;prepare();
    }
   }
   if(!won)break;
   // Replays against a BEATEN opponent improve the owned collection
   // while respecting drop odds, XP penalties and actual resource costs.
   for(let k=0;k<farmAfter;k++){
    duel(tier,'free');farmsSinceTier++;prepare();
   }
  }
  return {policy,plan,strategy,training,snapshots,events,
   bridgeRebuilds,bridgeMains,bridgeFusions,
   duels:serial,winCount,losses,farms,tournaments,
   boosters,packChoice,milestones,crafts,upgrades,buysAttempted,
   shardCrafts,shardResearches,shardRerolls,shardsSpent,
   cleared:Math.max(0,...profile.cleared),
   saveValid:!!validateProfile(JSON.parse(JSON.stringify(profile)))};
 })()`;
 const r=vm.run(expr,300000);
 if(r.error)throw Error('Career failed: '+r.error);
 assert.equal(r.training,3);assert.ok(r.saveValid);
 results.push({...r,run,strategy});
 console.log('ARCANE_CAREER_V82 '+JSON.stringify({policy:r.policy,plan:r.plan,strategy,
  duels:r.duels,cleared:r.cleared,boosters:r.boosters,
  bridgeRebuilds:r.bridgeRebuilds,bridgeMains:r.bridgeMains,
  bridgeFusions:r.bridgeFusions,
  crafts:r.crafts,upgrades:r.upgrades,milestones:r.milestones,
  shardCrafts:r.shardCrafts,shardResearches:r.shardResearches,
  shardRerolls:r.shardRerolls,shardsSpent:r.shardsSpent,
  snapshots:r.snapshots.map(s=>({
   tier:s.tier,level:s.playerLevel,coins:s.coins,
   shards:s.shardsAvailable,avgMainLevel:s.averageMainLevel,level7Plus:s.level7PlusEquipped,
   fusionCount:s.fusionDeckSize,ownedHighest:s.highestOwnedCardLevel,
   maxCard:Math.max(...s.activeDeck.map(id=>vm.run('CARDS['+id+'].level'))),
   paidBoosters:s.boostersPurchased}))}));
}
const snapshots=results.flatMap((career,i)=>career.snapshots.map(s=>({
 careerId:career.run,arm:career.strategy,policy:career.policy,plan:career.plan,...s})));
const pairs=Array.from({length:careers},(_,run)=>{
 const baseline=results.find(x=>x.run===run&&x.strategy==='early-shard');
 if(!baseline)throw Error('Missing early reference for '+run);
 return {run,policy:baseline.policy,plan:baseline.plan,
  arms:Object.fromEntries(arms.map(arm=>{
   const r=results.find(x=>x.run===run&&x.strategy===arm);
   if(!r)throw Error('Missing controlled arm '+run+' '+arm);
   const a=baseline.snapshots.filter(x=>x.tier<=2);
   const b=r.snapshots.filter(x=>x.tier<=2);
   if(JSON.stringify(a)!==JSON.stringify(b))
    throw Error('Paired careers differ BEFORE intervention '+run+' '+arm);
   return [arm,{cleared:r.cleared,duels:r.duels,shardsSpent:r.shardsSpent,
    wonIV:r.cleared>=4,wonVII:r.cleared>=7,
    tier4Before:r.snapshots.find(x=>x.tier===4)?.averageMainLevel??null,
    exactPreIntervention:true}];
  }))};
});
const summaryByArm=Object.fromEntries(arms.map(arm=>{
 const entries=results.filter(r=>r.strategy===arm);
 return [arm,{careers:entries.length,
  reachedVIII:entries.filter(r=>r.snapshots.some(s=>s.tier===8)).length,
  reachedIX:entries.filter(r=>r.snapshots.some(s=>s.tier===9)).length,
  reachedX:entries.filter(r=>r.snapshots.some(s=>s.tier===10)).length,
  wonX:entries.filter(r=>r.cleared>=10).length,
  wonVII:entries.filter(r=>r.cleared>=7).length,
  meanCleared:+(entries.reduce((a,r)=>a+r.cleared,0)/entries.length).toFixed(2),
  paidShardCrafts:entries.reduce((a,r)=>a+(r.shardCrafts||0),0),
  paidResearches:entries.reduce((a,r)=>a+(r.shardResearches||0),0),
  paidRerolls:entries.reduce((a,r)=>a+(r.shardRerolls||0),0),
  shardsSpent:entries.reduce((a,r)=>a+(r.shardsSpent||0),0)}];
}));
const trainingHalf=results.filter(r=>r.run<Math.floor(careers/2));
const holdoutHalf=results.filter(r=>r.run>=Math.floor(careers/2));
const independentByHalf=section=>Object.fromEntries(arms.map(arm=>{
 const rows=section.filter(r=>r.strategy===arm);
 return [arm,{independentCareers:rows.length,
  reachedVIII:rows.filter(r=>r.cleared>=7).length,
  reachedIX:rows.filter(r=>r.cleared>=8).length,
  averageTournamentCleared:+(rows.reduce((a,r)=>a+r.cleared,0)/rows.length).toFixed(2)}]
}));
const preIV=Object.fromEntries(arms.map(arm=>{
 const candidates=results.filter(r=>r.strategy===arm);
 const stage4=candidates.map(r=>r.snapshots.find(s=>s.tier===4)).filter(Boolean);
 return [arm,{tier4Entered:stage4.length,tier4Won:candidates.filter(r=>r.cleared>=4).length,
  meanLevelBeforeIV:stage4.length?+(stage4.reduce((sum,s)=>sum+s.averageMainLevel,0)/stage4.length).toFixed(2):null,
  meanShardsBeforeIV:stage4.length?+(stage4.reduce((sum,s)=>sum+s.shardsAvailable,0)/stage4.length).toFixed(1):null,
  meanFusionCountBeforeIV:stage4.length?+(stage4.reduce((sum,s)=>sum+s.fusionDeckSize,0)/stage4.length).toFixed(1):null}];
}));
const diagnosticByTier=Object.fromEntries(arms.map(arm=>{
 const careersForArm=results.filter(r=>r.strategy===arm);
 return [arm,Array.from({length:10},(_,i)=>{
  const tier=i+1;
  const reached=careersForArm.filter(r=>r.snapshots.some(s=>s.tier===tier));
  const wins=reached.filter(r=>r.cleared>=tier);
  const trials=reached.reduce((sum,r)=>sum+r.events.filter(e=>e.context==='tournament'&&e.tier===tier).length,0);
  return {tier,reached:reached.length,won:wins.length,tournamentAttempts:trials};
 })];
}));
const report={schema:'arcane-isolated-earned-economy-training-v82',
 baselineLate:'late-shard',baselineEarly:'early-shard',
 isolatedArms:{'value-shard':'early-shard plus minimum equipped deck gain threshold',
  'reserve-shard':'early-shard plus 20-shard minimum balance after each spend',
  'no-reroll-shard':'early-shard without paid booster rerolls'},
 interventionAfterTier:{'late-shard':4,'early-shard':2,'value-shard':2,
  'reserve-shard':2,'no-reroll-shard':2},
 stagedBeforeInterventionExactlyEqual:true,
 arms,pairs,stageSnapshots:snapshots.length,summaryByArm,preIV,diagnosticByTier,
 trainingHalf:independentByHalf(trainingHalf),
 untouchedHoldoutHalf:independentByHalf(holdoutHalf),
 careers,maxReached:Math.max(0,...snapshots.map(x=>x.tier)),
 realTrainingAndRewards:true,
 limitations:['Careers are simulated by scripted player policies, not human players.',
 'Arms are paired at source; after interventions, RNG trajectories can diverge.',
 'Holdout seeds are reported separately; no tuning against holdout.',
 'Fusion deck legality is checked; actual in-hand fusion feasibility is not directly measured.',
 'No player decks, shards, currency or tournament clears are directly granted.'],
 entries:snapshots};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-economy-isolation-v82.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_CAREER_SUMMARY_V82 '+JSON.stringify({
 careersPerArm:careers,arms,stageSnapshots:snapshots.length,
 summaryByArm,preIV,trainingHalf:report.trainingHalf,
 untouchedHoldoutHalf:report.untouchedHoldoutHalf,
 diagnosticByTier,pairs:pairs.map(p=>({run:p.run,
  results:Object.fromEntries(arms.map(a=>[a,p.arms[a].cleared]))})),
 failures:0}));
