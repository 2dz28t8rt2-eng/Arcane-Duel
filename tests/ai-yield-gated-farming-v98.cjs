/* Arcane Duel v9.8 - earn independent tournament IV inventory sources for matched deckbuilder tests.
 * No invented owned cards: play real training, tournament and farming games;
 * settle original rewardMatch, choose milestone prizes, buy affordable packs,
 * equip cards already present in actual profile.inventory.
 * Stop at unsolved tournament tier rather than gifting progress.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {soulBridgeCode}=require('./helpers/earned-soul-bridge-v67.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const careers=Number(process.env.ARCANE_V98_CAREERS||32);
const limit=Number(process.env.ARCANE_V98_TIER_ATTEMPTS||24);
if(!Number.isInteger(careers)||careers<1||careers>40||
 !Number.isInteger(limit)||limit<3||limit>30)throw Error('Invalid bounded career audit settings');
// Fresh isolated VM per arm, so identical paid resources and PRNG seeds
// yield a genuine paired progression comparison.
const choices=['balanced','offensive','guardian','economy','balanced','guardian','offensive','economy'];
const arms=['fixed-farm','vi-focused','vi-yield-stop'];
const careerSeedOffset=64000;
const results=[];
for(let run=0;run<careers;run++)for(const treatment of arms){
 const vm=boot({seed:670127+(careerSeedOffset+run)*317});
 const policy=choices[run%choices.length],plan=['investment','specialize','farm','hybrid'][run%4];
 const expr=`(()=>{
  profile=freshProfile();profile.guideSeen=true;profile.showcase.pending=false;
  const seed=${64127+(careerSeedOffset+run)*9301},policy='${policy}',plan='${plan}',
   strategy='late-shard',treatment='${treatment}',
   maxAttempts=${limit},snapshots=[],events=[];
  let serial=0,rewarded=0,training=0,farms=0,tournaments=0,boosters=0,
   bridgeRebuilds=0,bridgeMains=0,bridgeFusions=0,
   earlyBridgeCalls=0,earlyBridgeChanges=0,earlyBridgeMainChanges=0,earlyBridgeFusionChanges=0,
   shardCrafts=0,shardResearches=0,shardRerolls=0,shardsSpent=0,lastPurchaseTier=-1,purchasesOnTier=0,
   losses=0,winCount=0,packChoice=0,milestones=0,crafts=0,upgrades=0,
   buysAttempted=0,farmsSinceTier=0,adaptiveBatches=0,adaptiveFarmMatches=0,
   adaptiveFarmWins=0,streak=0,beforeFirstTierBossFarms=0,
   farmMatchesByTier={},farmXpByTier={},farmLootByTier={},tierAttempts={},
   tierWinAtAttempt={},tierFarmDecisions=[];
  const controller={summonObservations:0,normalOffered:0,legalFusionOffers:0,
   fusionAvailableTurns:0,freeSlotObservations:0,fullBoardObservations:0,
   noNormalHand:0,enemyAheadAtSummon:0,attackerOnBoardAtSummon:0,
   policyNormalChoices:0,policyFusionChoices:0,fusionMaterialsChosen:0,
   fusionTargetAtkSum:0,attacks:0,damageNpc:0};
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
      cardAvailable(c.id)&&sharedShards()>=cardCraftShardCost(c.id)+(["reserve-shard","reserve-no-reroll-shard","reserve-no-reroll-early-bridge-shard"].includes(strategy)?20:0))
      .sort((a,b)=>b.level-a.level||
       (b.atk+b.def)-(a.atk+a.def));
     // A cap of 3 owned copies avoids buying arbitrarily deep duplicates.
     const score=id=>{const c=CARDS[id];return (c.atk+c.def)/2+c.level*250+
       (policy==='guardian'&&(c.role==='guardian'||c.role==='soul')?120:0)+
       (policy==='offensive'&&c.role==='predator'?120:0);};
     const deckScore=ids=>ids.reduce((sum,id)=>sum+score(id),0);
     const oldScore=deckScore(profile.activeDeck);
     const best=pool.filter(c=>(profile.inventory[c.id]||0)<3).find(c=>{
      if(true)return true; // v8.3 fixes the v8.2 early purchase policy across all arms.
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
    if(shardResearches<5&&sharedShards()>=SHARD_RESEARCH_COST+(["reserve-shard","reserve-no-reroll-shard","reserve-no-reroll-early-bridge-shard"].includes(strategy)?20:0)){
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
    if(!["no-reroll-shard","reserve-no-reroll-shard","reserve-no-reroll-early-bridge-shard"].includes(strategy)&&shardRerolls<5&&profile.lastBooster&&
       !profile.lastBooster.rerolled&&sharedShards()>=SHARD_REROLL_COST+(["reserve-shard","reserve-no-reroll-shard","reserve-no-reroll-early-bridge-shard"].includes(strategy)?20:0)){
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
   // Isolated treatment: bring the *existing*, legal soul-bridge builder
   // forward to after II, without altering the live AI or fusion rules.
   const alreadyCleared=highestCleared();
   const bridgeBeforeIV=alreadyCleared>=2&&alreadyCleared<4&&
     ["early-bridge-shard","reserve-no-reroll-early-bridge-shard"].includes(strategy);
   if(alreadyCleared>=4||bridgeBeforeIV){
    const bridge=(function(){${soulBridgeCode}})();
    bridgeRebuilds+=Number(bridge.changed);
    bridgeMains+=Number(bridge.mainChanged);
    bridgeFusions+=Number(bridge.fusionChanged);
    if(bridgeBeforeIV){
     earlyBridgeCalls++;
     earlyBridgeChanges+=Number(bridge.changed);
     earlyBridgeMainChanges+=Number(bridge.mainChanged);
     earlyBridgeFusionChanges+=Number(bridge.fusionChanged);
    }
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
   const initialChoose=chooseAiAction,initialApply=applyAiAction;
   if(['fixed-farm','vi-focused','vi-efficient'].includes(treatment)){
    chooseAiAction=function(game,requested){
     if(game!==g||game.active!==0)return initialChoose(game,requested);
     return ((${summonPolicySource})(game,'tempo-board',controller))||
      initialChoose(game,requested);
    };
   }
   applyAiAction=function(game,action){
    if(game!==g||game.active!==0||action?.type!=='attack')
     return initialApply(game,action);
    const before=game.players[1].lp,result=initialApply(game,action);
    if(result){controller.attacks++;controller.damageNpc+=
     Math.max(0,before-game.players[1].lp);}
    return result;
   };
   try{simulateGame(g,policy);}
   finally{chooseAiAction=initialChoose;applyAiAction=initialApply;}
   const win=g.winner===0;
   if(g.winner===null)throw Error('Incomplete career match');
   const reward=rewardMatch(g);
   if(!reward)throw Error('Real rewardMatch failed');
   rewarded++;winCount+=Number(win);losses+=Number(!win);
   if(context==='free'&&tier>0){
    farms++;farmMatchesByTier[tier]=(farmMatchesByTier[tier]||0)+1;
    farmXpByTier[tier]=(farmXpByTier[tier]||0)+(reward.xp||0);
    farmLootByTier[tier]=(farmLootByTier[tier]||0)+Number(!!reward.loot?.card);
    if(treatment!=='fixed-farm'&&streak>0){adaptiveFarmMatches++;adaptiveFarmWins+=Number(win);}
   }
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
    earlyBridgeCalls,earlyBridgeChanges,earlyBridgeMainChanges,earlyBridgeFusionChanges,
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
  for(let tier=1;tier<=6;tier++){
   if(tier>1&&!profile.cleared.includes(tier-1))
    throw Error('Progress was not legitimately unlocked: '+tier);
   const snap=snapshot(tier);
   snapshots.push({tier:snap.tier,playerLevel:snap.playerLevel,
    coins:snap.coins,shardsAvailable:snap.shardsAvailable,
    ownedCardCopies:snap.ownedCardCopies,
    highestOwnedCardLevel:snap.highestOwnedCardLevel,
    averageMainLevel:snap.averageMainLevel,
    level7PlusEquipped:snap.level7PlusEquipped,
    fusionDeckSize:snap.fusionDeckSize,sourceMax:snap.sourceMax});
   let won=false;streak=0;
   const cap=tier<6?0:48;
   let farmedForThisBoss=0;
   tierAttempts[tier]=0;
   for(let attempt=0;attempt<maxAttempts;attempt++){
    tierAttempts[tier]++;
    won=duel(tier,'tournament');prepare();
    if(won){tierWinAtAttempt[tier]=attempt+1;break;}
    streak++;
    // Both strategies must face the actual boss before they farm.
    // Fixed retains historical batches after every three defeats.
    // Adaptive uses early recovery after two losses, genuine earned
    // duel rewards and a per-tier finite experiment farming budget.
    if(treatment==='fixed-farm'||tier<6){
     if(attempt%3===2)for(let k=0;k<farmAfter;k++){
      const farmTier=Math.max(0,tier-1);
      duel(farmTier,'free');farmsSinceTier++;prepare();
     }
    }else if(streak>=2&&farmedForThisBoss<cap){
     const farmTier=Math.max(0,tier-1),
      average=profile.activeDeck.reduce((v,id)=>v+CARDS[id].atk,0)/
       profile.activeDeck.length,
      visibleBoss=CARDS[OPPONENTS[tier].signature]?.atk||average,
      gap=average<visibleBoss*.55,
      xpFactor=farmingXpFactor(farmTier);
     // Lower remaining XP yield does not grant anything: it only
     // discourages repeatedly grinding lower, ineffective stages.
     const requested=6+(gap?2:0)+(xpFactor<.2?-2:0);
     const batch=Math.min(Math.max(2,requested),cap-farmedForThisBoss);
     if(batch>0){
      adaptiveBatches++;
      tierFarmDecisions.push({tier,afterAttempts:attempt+1,
       source:farmTier,avgDeckAtk:Math.round(average),
       bossSignatureAtk:visibleBoss,xpFactor:+xpFactor.toFixed(3),
       farmCount:batch});
      for(let k=0;k<batch;k++){
       duel(farmTier,'free');farmsSinceTier++;prepare();
       farmedForThisBoss++;
      }
     }
     streak=0;
    }
   }
   if(!won)break;
   streak=0; // Post-victory free duels are baseline farming, not failure recovery.
   // Replays against a BEATEN opponent improve the owned collection
   // while respecting drop odds, XP penalties and actual resource costs.
   for(let k=0;k<farmAfter;k++){
    duel(tier,'free');farmsSinceTier++;prepare();
   }
  }
  return {policy,plan,strategy,treatment,controller,training,snapshots,events,
   adaptiveBatches,adaptiveFarmMatches,adaptiveFarmWins,tierFarmDecisions,
   farmMatchesByTier,farmXpByTier,farmLootByTier,tierAttempts,tierWinAtAttempt,
   bridgeRebuilds,bridgeMains,bridgeFusions,
   earlyBridgeCalls,earlyBridgeChanges,earlyBridgeMainChanges,earlyBridgeFusionChanges,
   duels:serial,winCount,losses,farms,tournaments,
   boosters,packChoice,milestones,crafts,upgrades,buysAttempted,
   shardCrafts,shardResearches,shardRerolls,shardsSpent,
   cleared:Math.max(0,...profile.cleared),
   saveValid:!!validateProfile(JSON.parse(JSON.stringify(profile)))};
 })()`;
 const r=vm.run(expr,300000);
 if(r.error)throw Error('Career failed: '+r.error);
 assert.equal(r.training,3);assert.ok(r.saveValid);
 results.push({...r,run,treatment});
}
const names=['fixed-farm','vi-focused','vi-yield-stop'];
const pairs=Array.from({length:careers},(_,i)=>{
 const selected=results.filter(r=>r.run===i);
 assert.equal(selected.length,3,'Missing independent arm '+i);
 const variants=Object.fromEntries(names.map(name=>
  [name,selected.find(r=>r.treatment===name)]));
 for(const key of names){
  assert.ok(variants[key]);
  assert.equal(variants[key].policy,variants['fixed-farm'].policy);
  assert.equal(variants[key].plan,variants['fixed-farm'].plan);
 }
 // Earliest four+ tournament stages must be identical for all arms,
 // including actual earned cards and shop transactions.
 for(const key of ['vi-focused','vi-yield-stop']){
  const a=variants['fixed-farm'],b=variants[key];
  const early=run=>{
   const idx=run.events.findIndex(e=>e.tier===6&&e.context==='tournament');
   // Tier-V free duels during VI preparation occur AFTER the VI start.
   return idx>=0?run.events.slice(0,idx):run.events;
  };
  assert.equal(JSON.stringify(early(a)),JSON.stringify(early(b)),
   'Early-stage farming/control was not strictly identical: '+i+' '+key);
  assert.equal(a.snapshots.some(x=>x.tier===6),
   b.snapshots.some(x=>x.tier===6),
   'VI access diverged before intervention: '+i+' '+key);
 }
 return {careerId:i,policy:selected[0].policy,plan:selected[0].plan,variants};
});
function stats(rows,name){
 const sample=rows.map(r=>r.variants[name]);
 const total=k=>sample.reduce((n,r)=>n+r[k],0);
 const calls=t=>sample.reduce((n,r)=>n+(r.tierAttempts[t]||0),0);
 const farm=t=>sample.reduce((n,r)=>n+(r.farmMatchesByTier[t]||0),0);
 const earn=t=>sample.reduce((n,r)=>n+(r.farmXpByTier[t]||0),0);
 const winnerTurns=t=>sample.map(r=>r.tierWinAtAttempt[t]).filter(Number.isFinite);
 const vi=sample.map(r=>r.snapshots.find(x=>x.tier===6)).filter(Boolean);
 return {origins:rows.length,wonIV:sample.filter(r=>r.cleared>=4).length,
  wonV:sample.filter(r=>r.cleared>=5).length,
  wonVI:sample.filter(r=>r.cleared>=6).length,
  meanHighestTier:+(total('cleared')/sample.length).toFixed(2),
  genuineCareerDuels:total('duels'),rewardedDuels:total('duels'),
  freeDuels:total('farms'),tournamentDuels:total('tournaments'),
  wins:total('winCount'),losses:total('losses'),
  boosterPurchases:total('boosters'),shardsSpent:total('shardsSpent'),
  shardResearch:total('shardResearches'),cardCrafts:total('crafts'),
  adaptiveBatches:total('adaptiveBatches'),
  adaptiveFreeDuels:total('adaptiveFarmMatches'),
  adaptiveFreeWins:total('adaptiveFarmWins'),
  tierIVAttempts:calls(4),tierVAttempts:calls(5),tierVIAttempts:calls(6),
  freeDuelsVsV: farm(5),freeDuelsVsIV:farm(4),
  XPFromFreeVsV:earn(5),
  VIUnlocked:vi.length,
  VIStartingPlayerLevelMean:vi.length?
   +(vi.reduce((n,r)=>n+r.playerLevel,0)/vi.length).toFixed(2):null,
  VIStartingDeckLevelMean:vi.length?
   +(vi.reduce((n,r)=>n+r.averageMainLevel,0)/vi.length).toFixed(2):null,
  successfulVIAttemptMean:winnerTurns(6).length?
   +(winnerTurns(6).reduce((a,b)=>a+b,0)/winnerTurns(6).length).toFixed(2):null};
}
function paired(rows,name){
 const v=rows.map(r=>r.variants[name]),f=rows.map(r=>r.variants['fixed-farm']);
 const comparisons=rows.map(r=>r.variants[name].cleared-r.variants['fixed-farm'].cleared);
 const dif=t=>v.filter(r=>r.cleared>=t).length-f.filter(r=>r.cleared>=t).length;
 return {IVDelta:dif(4),VDelta:dif(5),VIDelta:dif(6),
  betterOrigins:comparisons.filter(x=>x>0).length,
  worseOrigins:comparisons.filter(x=>x<0).length,
  equalOrigins:comparisons.filter(x=>x===0).length,
  freeDuelDifference:v.reduce((n,r)=>n+r.farms,0)-f.reduce((n,r)=>n+r.farms,0),
  allDuelDifference:v.reduce((n,r)=>n+r.duels,0)-f.reduce((n,r)=>n+r.duels,0),
  newlyVI:rows.filter(r=>r.variants[name].cleared>=6&&
   r.variants['fixed-farm'].cleared<6).length,
  lostVI:rows.filter(r=>r.variants['fixed-farm'].cleared>=6&&
   r.variants[name].cleared<6).length};
}
const middle=careers/2;
const summarize=rows=>({arms:Object.fromEntries(names.map(name=>[name,stats(rows,name)])),
 comparisons:Object.fromEntries(names.slice(1).map(name=>[name,paired(rows,name)]))});
const train=summarize(pairs.slice(0,middle)),holdout=summarize(pairs.slice(middle)),
 overall=summarize(pairs);
const ranked=names.slice(1).map(name=>({name,...train.comparisons[name]}))
 .sort((a,b)=>b.VIDelta-a.VIDelta||b.betterOrigins-a.betterOrigins||
  a.allDuelDifference-b.allDuelDifference);
const picked=ranked[0];
const selected=picked.VIDelta>0?''
 +picked.name:'fixed-farm';
const hold=holdout.comparisons[selected];
// Predeclared strict gate: early career must not regress in either group,
// and >=2 independent holdout VI career wins added, fewer origins worsened.
const qualified=selected!=='fixed-farm'&&
 train.comparisons[selected].IVDelta===0&&train.comparisons[selected].VDelta===0&&
 hold.IVDelta===0&&hold.VDelta===0&&hold.VIDelta>=2&&
 hold.betterOrigins>hold.worseOrigins;
const report={schema:'arcane-yield-gated-vi-farming-v98',
 originOffset:careerSeedOffset,origins:careers,trainOrigins:middle,holdoutOrigins:middle,
 treatments:names,maxTournamentAttemptsPerTier:limit,
 bothPoliciesUseExactTempoBoard:true,earlyCareerStrictlyIdentical:true,
 train,holdout,overall,trainingRanking:ranked,selected,qualified,sourcePairs:pairs,
 constraints:[
  'Each source is a fresh independent career seed; three treatments are paired within it.',
  'Only late VI farming changes; the whole pre-VI game and rewards are identical per origin.',
  'Game rewards, XP decay, shards, packs, card crafting, decks and boss stats remain real.',
  'No card, XP, ACE, win or resource is fabricated; each match uses rewardMatch.',
  'The tournament-attempt and farming cap are experimental only; no production rule changes.',
  'The fixed-farming baseline already receives 2–5 free duels after three tournament losses.',
  'A gain in VI wins at much greater time/currency costs is a trade-off, not a universal improvement.',
  'Main, live NPC policies and user progression are untouched.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-selective-vi-farming-v98.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V98_SUMMARY '+JSON.stringify({
 origins:careers,actualEarnedDuels:Object.values(overall.arms)
  .reduce((a,v)=>a+v.genuineCareerDuels,0),
 train,holdout,overall,trainingRanking:ranked,selected,qualified}));
