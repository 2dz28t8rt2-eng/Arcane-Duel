/* Arcane Duel v9.4 - earn independent tournament IV inventory sources for matched deckbuilder tests.
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
const careers=Number(process.env.ARCANE_V94_CAREERS||32);
const limit=Number(process.env.ARCANE_V94_TIER_ATTEMPTS||16);
if(!Number.isInteger(careers)||careers<1||careers>40||
 !Number.isInteger(limit)||limit<3||limit>22)throw Error('Invalid bounded career audit settings');
// Fresh isolated VM per arm, so identical paid resources and PRNG seeds
// yield a genuine paired progression comparison.
const choices=['balanced','offensive','guardian','economy','balanced','guardian','offensive','economy'];
const arms=['baseline','tempo-board'];
const careerSeedOffset=48000;
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
   buysAttempted=0,farmsSinceTier=0;
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
   if(treatment==='tempo-board'){
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
  return {policy,plan,strategy,treatment,controller,training,snapshots,events,
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
const pairs=Array.from({length:careers},(_,i)=>{
 const source=results.filter(r=>r.run===i);
 assert.equal(source.length,2,'Missing paired arm '+i);
 return {careerId:i,policy:source[0].policy,plan:source[0].plan,
  baseline:source.find(r=>r.treatment==='baseline'),
  tempo:source.find(r=>r.treatment==='tempo-board')};
});
function overview(rows,key){
 const arr=rows.map(r=>r[key]),sum=k=>arr.reduce((n,r)=>n+r[k],0),
 tierDuel=t=>arr.reduce((n,r)=>n+r.events.filter(e=>e.context==='tournament'&&e.tier===t).length,0),
 ctrl=k=>arr.reduce((n,r)=>n+r.controller[k],0);
 return {sources:rows.length,wonIV:arr.filter(r=>r.cleared>=4).length,
  wonV:arr.filter(r=>r.cleared>=5).length,
  wonVI:arr.filter(r=>r.cleared>=6).length,
  meanCleared:+(sum('cleared')/rows.length).toFixed(2),
  totalDuels:sum('duels'),totalRewarded:sum('duels'),
  totalWins:sum('winCount'),totalLosses:sum('losses'),
  tournamentDuels:sum('tournaments'),farmDuels:sum('farms'),
  attemptsIV:tierDuel(4),attemptsV:tierDuel(5),attemptsVI:tierDuel(6),
  boosters:sum('boosters'),crafts:sum('crafts'),
  upgrades:sum('upgrades'),shardsSpent:sum('shardsSpent'),
  research:sum('shardResearches'),shardCrafts:sum('shardCrafts'),
  summonsNormal:ctrl('policyNormalChoices'),summonsFusion:ctrl('policyFusionChoices'),
  actualAttackActions:ctrl('attacks'),damageNpc:ctrl('damageNpc'),
  avgLastDeckLevel:+(arr.reduce((v,r)=>v+(r.snapshots.at(-1)?.averageMainLevel||0),0)/rows.length).toFixed(2),
  avgLastCoins:+(arr.reduce((v,r)=>v+(r.snapshots.at(-1)?.coins||0),0)/rows.length).toFixed(1)};
}
function paired(rows){
 const is=(r,tier,key)=>r[key].cleared>=tier;
 return {IVDelta:rows.filter(r=>is(r,4,'tempo')).length-rows.filter(r=>is(r,4,'baseline')).length,
  VIDelta:rows.filter(r=>is(r,6,'tempo')).length-rows.filter(r=>is(r,6,'baseline')).length,
  better:rows.filter(r=>r.tempo.cleared>r.baseline.cleared).length,
  worse:rows.filter(r=>r.tempo.cleared<r.baseline.cleared).length,
  equal:rows.filter(r=>r.tempo.cleared===r.baseline.cleared).length,
  improvedIV:rows.filter(r=>is(r,4,'tempo')&&!is(r,4,'baseline')).length,
  lostIV:rows.filter(r=>is(r,4,'baseline')&&!is(r,4,'tempo')).length,
  improvedVI:rows.filter(r=>is(r,6,'tempo')&&!is(r,6,'baseline')).length,
  lostVI:rows.filter(r=>is(r,6,'baseline')&&!is(r,6,'tempo')).length};
}
const split=careers/2;
const summary=rows=>({baseline:overview(rows,'baseline'),
 tempo:overview(rows,'tempo'),paired:paired(rows)});
const training=summary(pairs.slice(0,split)),holdout=summary(pairs.slice(split)),
 all=summary(pairs);
const qualified=training.paired.IVDelta>=2&&holdout.paired.IVDelta>=3&&
 holdout.paired.better>holdout.paired.worse&&holdout.paired.VIDelta>=0;
const report={schema:'arcane-real-career-ab-v94',seedOffset:careerSeedOffset,
 careersPerArm:careers,trainSources:split,holdoutSources:careers-split,
 training,holdout,overall:all,qualified,originPairs:pairs,
 notes:['Both arms start from independent freshProfile on identical initial seeds',
  'The same late-shard purchase, farm, draw, and deck-building rules are used for both arms.',
  'Divergent match outcomes can legitimately produce different later rewards and deck collections.',
  'All career rewards use genuine rewardMatch, never synthetic wins or free cards.',
  'Tempo-board policy source is identical to original v9.2 experiment.',
  'No changes to production NPC AI, game rules, or main branch.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-real-career-ab-v94.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V94_SUMMARY '+JSON.stringify({sources:careers,
 totalRealDuels:all.baseline.totalDuels+all.tempo.totalDuels,
 training,holdout,overall:all,qualified}));
