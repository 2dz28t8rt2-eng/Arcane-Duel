/* Arcane Duel v11.4 - paired old/v11.3 fusion algorithm with equal progressive earned farming for matched deckbuilder tests.
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
const {boardPlannerSource}=require('./helpers/ai-board-planner-v129.cjs');
const {offensivePolicySource}=require('./helpers/x-offensive-ai-v127.cjs');
const careers=Number(process.env.ARCANE_V129_CAREERS||32);
const limit=Number(process.env.ARCANE_V129_TIER_ATTEMPTS||24);
if(!Number.isInteger(careers)||careers<1||careers>40||
 !Number.isInteger(limit)||limit<3||limit>30)throw Error('Invalid bounded career audit settings');
// Fresh isolated VM per arm, so identical paid resources and PRNG seeds
// yield a genuine paired progression comparison.
const choices=['balanced','offensive','guardian','economy','balanced','guardian','offensive','economy'];
// A: original IV without tempo (v12.3 diagnostic); B: original IV WITH tempo;
// C: softened IV WITH tempo. Each uses identical matched origins and rewards.
const arms=['tempo-baseline','strategic-lookahead','strategic-online-feedback'];
const careerSeedOffset=129610;
const results=[];
for(let run=0;run<careers;run++)for(const treatment of arms){
 const vm=boot({seed:670127+(careerSeedOffset+run)*317,withoutRoster125:false,x128Mode:'full'});
 vm.exec(boardPlannerSource);
 vm.exec(offensivePolicySource);
 const policy=choices[run%choices.length],plan=['investment','specialize','farm','hybrid'][run%4];
 const expr=`(()=>{
  profile=freshProfile();profile.guideSeen=true;profile.showcase.pending=false;
  const seed=${64127+(careerSeedOffset+run)*9301},policy='${policy}',plan='${plan}',
   strategy='late-shard',treatment='${treatment}',
   maxAttempts=${limit},snapshots=[],events=[];
  let serial=0,rewarded=0,training=0,farms=0,tournaments=0,boosters=0,fusionPacks=0,lastShopWin=-1,preparationByTier={},v7Attempts=0,v7Fusions=0,v7Attacks=0,v7Damage=0,v7Kills=0,v7Turns=0,v7TotalDamage=0,fusionPulls=0,normalPackCards=0,mixedPackCards=0,
   normalSealSpent=0,fusionSealSpent=0,sealsEarned=0,extraShardsEarned=0,upgradesV109=0,
   bridgeRebuilds=0,bridgeMains=0,bridgeFusions=0,
   earlyBridgeCalls=0,earlyBridgeChanges=0,earlyBridgeMainChanges=0,earlyBridgeFusionChanges=0,
   shardCrafts=0,shardResearches=0,shardRerolls=0,shardsSpent=0,lastPurchaseTier=-1,purchasesOnTier=0,
   losses=0,winCount=0,packChoice=0,milestones=0,crafts=0,upgrades=0,
   buysAttempted=0,farmsSinceTier=0,adaptiveBatches=0,adaptiveFarmMatches=0,
   adaptiveFarmWins=0,streak=0,beforeFirstTierBossFarms=0,
   farmMatchesByTier={},farmXpByTier={},farmLootByTier={},tierAttempts={},
   tierWinAtAttempt={},tierFarmDecisions=[],yieldSkipped=0,measuredBatches=0,
   yieldUseful=0,yieldWeak=0,actualFarmXp=0,actualFarmLoot=0,
   lastFarmWeak=false,roiLastBatch=0,viPhaseMatches=0,bossTierInProgress=0,
   meaningfulDeckWaves=0,weakQualityWaves=0,qualityGainTotal=0,legitFusionGainTotal=0,
   hybridQualityBatches=0,hybridIntenseBatches=0,hybridCrossed45=false,
   recentViHands=[],viRealHandChecks=0,viFusionReadyChecks=0,
   viPlayableChoices=0,viMaxFusionLevel=0,viZeroChoiceHands=0,
   readinessFarmWaves=0,readinessRetrySkippedWaves=0,readinessCheckTrace=[],
   realVIHandFusions=0,realVIFieldFusions=0,realVIPlacedFusions=0,
   realVIFusionMaterialCount=0,realVIFusionAtkSum=0,realVIFusionDefSum=0,
   realVIWallBreaks=0,realVIAttackDamage=0,realVIKills=0,
   impactSmallWaves=0,impactIntensiveWaves=0,recentVICombat=[],
    uidFusionInstances=0,uidFusionAttacks=0,uidFusionDamage=0,
    uidFusionKills=0,uidFusionTurns=0,uidFusionMaterials=0,
    allFusionPlaced=0,allFieldFusions=0,allFusionHeritage=0,allRoleMismatches=0,
    rejectedFuseChoices=0,rejectedFusionPlacements=0,maxFusionPlacedLevel=0,
    actualFusionLevelHistogram={},actualFusionByTournamentStage={},actualFusionByFarmStage={},giantStreetFusions=0,
    forgeCount=0,forgeCost=0,forgeFusion=0,forgeNormal=0,forgeLevel10=0,forgeUnavailable=0,forgeLevels={},forgeHistory=[],
    backtracks=0,smartWaves=0,investmentCycles=0,farmSourceMatches={},farmSourceWins={},farmStrategyHistory=[],forgeStrategyHistory=[],
    opponentIVCombat=[],ivPolicyCalls=0,ivPolicyNormal=0,ivPolicyFusion=0,
    ivAttacks=0,ivDamage=0,ivKills=0,ivFusionPlacements=0,ivLPLost=0;
  const controller={summonObservations:0,normalOffered:0,legalFusionOffers:0,
   fusionAvailableTurns:0,freeSlotObservations:0,fullBoardObservations:0,
   noNormalHand:0,enemyAheadAtSummon:0,attackerOnBoardAtSummon:0,
   policyNormalChoices:0,policyFusionChoices:0,fusionMaterialsChosen:0,
   fusionTargetAtkSum:0,attacks:0,damageNpc:0};
  const shopBudget=plan==='farm'?8:plan==='specialize'?12:plan==='hybrid'?12:14;
  const farmAfter=plan==='farm'?5:plan==='hybrid'?4:plan==='specialize'?3:2;
  // Same genuine shop/perk strategy in both arms. No fabricated rewards.
  const progressive=true; // Identical increased legal farm time on both arms
  const deepFarm={4:4,5:6,6:8,7:12,8:16,9:20,10:24};
  const validDeck=(p)=>!mainDeckError(p.activeDeck)&&!fusionDeckError(p.fusionDeck);
  // v12.1 forge-only is the common control; the new policies are isolated.
  const endgameMemory=treatment==='endgame-memory'||treatment==='combined-v122';
  const phaseSwitch=treatment==='phase-switch'||treatment==='combined-v122';
  const targeted=true;
  const weakForgeSpentByTier={};
  const acquiredIds={};
  let farmWins=0,cardDrops=0,normalDrops=0,fusionDrops=0,highDrops=0,lootedByTier={},avoidedTries=0;
  const sourceLocks={},forgePhases={};
  const perkPurchases={},perkPurchaseLogs=[],boostersBySize={},fusionPacksBySize={},
    packOpened={character:0,normal:0,fusion:0},packCharactersPicked={},
    activeAiActions={player:{},npc:{}},skillActions={player:{},npc:{}},
    passiveExposure={jagdinstinkt:0,schildwall:0,kolossenkraft:0,schwarminstinkt:0,grosswildjaeger:0},
    bossSkillStats={7:{},10:{}},bossPerkRanks={7:[],10:[]};
  const xBattles=[],xAttackerStats={npc:{},player:{}},xEndReasons={},xPreBossState=[],
    strategicStats={scans:0,nodes:0,availableAttackOptions:0,chosenAttacks:0,
     expectedAdvantage:0,phaseOverrides:0,skippedUnsafeAttacks:0,
     switchesToAttack:0},
    learning={riskMultiplier:1,updates:0,positive:0,negative:0,history:[]},
    planning=treatment!=='tempo-baseline',
    online=treatment==='strategic-online-feedback',
    offensiveAudit={attackPhaseOverrides:0,soulActionsProposed:0,healsProposed:0,
      guardSwitchesSkipped:0},packDecisions={tenNormalPriority:0,fusionShortfall:0,
      mixedChosen:0,smallChosen:0,unaffordable:0};
  const aggressive=false; // Isolate X boss strength: identical current tempo-board AI for all arms.
  const adaptive=false; // Identical genuine buy-now strategy and earned economy.
  let tenPackWaits=0,tenPackPurchases=0,tenAffordableMisses=0;
  const skillType=x=>['arcane-guardian-heal','arcane-soul-extract'].includes(x)||
    /skill|ability|active|condense|discharge|raid|bastion/i.test(x);
  function boughtUpgrade(key){
    const purchased=buyUpgrade(key);
    if(purchased){
      perkPurchases[key]=(perkPurchases[key]||0)+1;
      if(perkPurchaseLogs.length<150)perkPurchaseLogs.push({tier:highestCleared(),
        key,rank:profile.upgrades[key],coins:profile.coins});
    }
    return purchased;
  }
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
     if(best&&takePackCard(best.i)){
      packChoice++;packOpened.character++;
      packCharactersPicked[source]=(packCharactersPicked[source]||0)+1;
      closeCharacterPack();
     }
    }
   }
   if(allowPurchase){
    const tier=highestCleared();
    // All investments call the actual economy operations and pay their
    // ordinary costs: no direct inventory/coins/upgrades assignment.
    if((plan==='specialize'||plan==='hybrid')&&upgrades<8){
     const normalRoles=profile.activeDeck.reduce((m,id)=>{
       const c=CARDS[id];if(c?.role==='predator')m.predator++;
       if(c?.role==='guardian'||c?.role==='soul')m.defender++;
       return m;
     },{predator:0,defender:0});
     const focus=normalRoles.predator>=normalRoles.defender?'jagdinstinkt':'schildwall';
     const order=adaptive?[focus,'power','learning','starter',
       focus==='schildwall'?'jagdinstinkt':'schildwall']:
       policy==='offensive'?['jagdinstinkt','power','starter','learning']:
       policy==='guardian'?['schildwall','power','starter','learning']:
       ['power','starter','learning','jagdinstinkt'];
     const available=order.find(k=>UPGRADES[k]&&
      profile.upgrades[k]<UPGRADES[k].max&&
      profile.coins>=upgradeCost(k)+(tier>=4?75:110));
     if(available&&boughtUpgrade(available)){upgrades++;buysAttempted++;}
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
    // Same opportunities, same real paid rewards, different investments.
    if(tier>=2&&upgradesV109<6){
     const perks=tier>=6?['kolossenkraft','schwarminstinkt','grosswildjaeger']:
      ['grosswildjaeger','schwarminstinkt','kolossenkraft'];
     const perk=perks.find(k=>profile.upgrades[k]<UPGRADES[k].max&&
      profile.coins>=upgradeCost(k)+(tier>=4?90:140));
     if(perk&&boughtUpgrade(perk)){upgradesV109++;upgrades++;buysAttempted++;}
    }
    // Exactly one purchase opportunity for every third earned victory.
    // Removes old unequal hard limits on normal vs fusion packs.
    if(winCount>=3&&winCount%3===0&&lastShopWin!==winCount){
     lastShopWin=winCount;
     const market=window.ArcaneFusionPackV109,seals=profile.boosterSeals||0;
     const fusionAllowed=
       tier>=2&&market&&market.fusionPackPool(tier).fusion.length>0;
     const tenPrice=fusionAllowed?market.fusionPackPrice(10):Infinity;
     // Use 10-card packs when we need normal cards/material; cheaper fusion
     // packs when existing main deck is strong but fusion deck lags.
     const mainLevel=profile.activeDeck.reduce((v,id)=>v+CARDS[id].level,0)/40;
     const fusionLevel=profile.fusionDeck.reduce((v,id)=>v+CARDS[id].level,0)/
       Math.max(1,profile.fusionDeck.length);
     const mainWeak=mainLevel<Math.max(3,tier-1.5);
     const fusionShort=profile.fusionDeck.length<Math.min(12,6+tier)||
       fusionLevel<Math.max(3,tier-1);
     const wantTen=adaptive&&mainWeak&&!fusionShort;
     if(adaptive){
       if(mainWeak)packDecisions.tenNormalPriority++;
       if(fusionShort)packDecisions.fusionShortfall++;
     }
     const fCount=fusionAllowed?
       (adaptive?(wantTen?(seals>=tenPrice?10:null):
         [5,3,1].find(n=>seals>=market.fusionPackPrice(n))):
       [10,5,3,1].find(n=>seals>=market.fusionPackPrice(n))):null;
     if(adaptive&&fusionAllowed&&!fCount)packDecisions.unaffordable++;
     if(adaptive&&fCount){if(fCount===10)packDecisions.mixedChosen++;else packDecisions.smallChosen++;}
     const saving=false;
     if(saving&&!fCount)tenPackWaits++;
     if(saving&&seals>=tenPrice&&!fCount)tenAffordableMisses++;
     if(fCount){
      const old=profile.boosterSeals;
      if(market.buyFusionPack(fCount)){
       fusionPacks++;packOpened.fusion++;
       if(saving)tenPackPurchases++;
       fusionPacksBySize[fCount]=(fusionPacksBySize[fCount]||0)+1;fusionSealSpent+=old-profile.boosterSeals;
       mixedPackCards+=profile.lastBooster.cards.length;
       fusionPulls+=profile.lastBooster.cards.filter(id=>CARDS[id].fusionOnly).length;
       buysAttempted++;
      }
     }else if(!saving){
      const n=[10,5,3,1].find(n=>seals>=boosterPrice(tier,n));
      if(n){
       const old=profile.boosterSeals;
       if(buyBooster(n)){
        boosters++;packOpened.normal++;
        boostersBySize[n]=(boostersBySize[n]||0)+1;normalSealSpent+=old-profile.boosterSeals;
        normalPackCards+=profile.lastBooster.cards.length;
        buysAttempted++;
       }
      }
     }
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
   // Real three-card paid crafting between battles. No grants, cheats or deck materials.
   if(highestCleared()>=5&&forgeCount<24){
    const forge=window.ArcaneAscensionForge116;
    if(!forge)throw Error('Missing live v11.6 ascension forge');
    const cap=forge.cap(),choices=Array.from({length:cap-3},(_,i)=>cap-i-1)
     .filter(lv=>lv>=3&&forge.suggested(lv)&&forge.safeRecipe(forge.suggested(lv),lv)&&
      profile.coins>=forge.price(lv+1)+45&&
      (forge.outputPool(lv+1,false).length+forge.outputPool(lv+1,true).length)>0);
    const mainLevel=profile.activeDeck.reduce((n,id)=>n+CARDS[id].level,0)/profile.activeDeck.length;
    const lowTen=profile.activeDeck.map(id=>CARDS[id].level).sort((a,b)=>a-b).slice(0,10).reduce((a,b)=>a+b,0)/10;
    const tierGoal=Math.min(10,Math.max(3,highestCleared()+1));
    // v12.2 changes ONLY phase-switch groups: at most two weak-quarter
    // improvement crafts per cleared tier. Then prioritize actual high-rank
    // fusion templates; never fabricate missing materials.
    const currentTier=highestCleared();
    const hasWeakGap=lowTen<Math.max(2,tierGoal-3);
    const needsMain=hasWeakGap&&(!phaseSwitch||(weakForgeSpentByTier[currentTier]||0)<2);
    if(targeted)choices.sort((a,b)=>{
      const score=lv=>!needsMain?lv*100:
       (lv+1<=tierGoal?(lv+1)*100:-1000-Math.abs(lv+1-tierGoal)*100);
      return score(b)-score(a)||b-a;
    });
    const candidate=choices[0];
    if(candidate){
     let ids=forge.suggested(candidate);const before=profile.coins;
     if(targeted&&!needsMain){
      const fusions=[];
      for(const c of forge.inputPool(candidate).filter(c=>c.fusionOnly)){
       for(let i=0;i<Math.min(freeCopies(c.id),3-fusions.length);i++)fusions.push(c.id);
       if(fusions.length===3)break;
      }
      if(fusions.length===3&&forge.safeRecipe(fusions,candidate))ids=fusions;
     }
     if(targeted){
      const phase=needsMain?'improve-lowest-quarter':'focus-high-level-fusions';
      forgePhases[phase]=(forgePhases[phase]||0)+1;
     }
     if(targeted&&forgeStrategyHistory.length<75)
      forgeStrategyHistory.push({afterTier:highestCleared(),mainLevel:+mainLevel.toFixed(2),
       goal:tierGoal,priority:needsMain?'raise-main-level':'highest-tier',materialLevel:candidate,
       allFusion:ids.every(id=>CARDS[id].fusionOnly)});
     if(phaseSwitch&&needsMain)weakForgeSpentByTier[currentTier]=(weakForgeSpentByTier[currentTier]||0)+1;
     const outcome=forge.forge(candidate,ids);
     if(!outcome.ok)throw Error('Forge rejected a verified real recipe: '+outcome.message);
     forgeCount++;forgeCost+=before-profile.coins;
     forgeFusion+=Number(outcome.fusion);forgeNormal+=Number(!outcome.fusion);
     forgeLevel10+=Number(outcome.level===10);
     forgeLevels[outcome.level]=(forgeLevels[outcome.level]||0)+1;
     if(forgeHistory.length<30)forgeHistory.push({afterTier:highestCleared(),input:candidate,
       outputLevel:outcome.level,outputId:outcome.id,fusion:outcome.fusion,
       cost:outcome.cost,pity:outcome.pity});
    }else forgeUnavailable++;
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
   if(bossTierInProgress===6&&((context==='tournament'&&tier===6)||
      (context==='free'&&tier===5))){
    if(viPhaseMatches>=75)throw Error('VI budget crossed');
    viPhaseMatches++;
   }
   const id='real-career-v64-'+seed+'-'+(++serial);
   const g=createGame({id,mode:'pve',context,opponentId:tier,
    seed:(seed*179+serial*3307+tier*1021)>>>0||1,
    starter:serial%2,deck:[...profile.activeDeck],
    fusionDeck:[...profile.fusionDeck],enhancements:profile.enhancements,
    difficulty:'easy'});
   const initialChoose=chooseAiAction,initialApply=applyAiAction;
   const isVIPhase=bossTierInProgress===6&&((context==='tournament'&&tier===6)||
    (context==='free'&&tier===5));
   const xEncounter=context==='tournament'&&tier===10;
   const xTrace=xEncounter?{
     actions:{player:{},npc:{}},aceId:ACE_CARD_IDS[10],
     npcAcePlaced:0,npcLevel10FusionPlaced:0,npcFusionPlaced:0,
     playerFusionPlaced:0,npcMonstersDestroyed:0,playerMonstersDestroyed:0,
     damageToPlayer:0,damageToNpc:0,playerStrikes:0,npcStrikes:0,
     npcCardsPlaced:{},npcAttackDamageById:{},playerAttackDamageById:{},
     turnsWithNpcAce:0,turnsWithNpcLevel10:0,scannedTurns:new Set(),
     playerLpAtStart:g.players[0].lp,npcLpAtStart:g.players[1].lp,
     initialPlayerDeck:g.players[0].deck.length,
     initialPlayerFusionTemplates:g.players[0].fusionDeck.length
   }:null;
   const inspectedTurns=new Set();
   const ivEncounter=context==='tournament'&&tier===4;
   const controllerStart={...controller},ivStartLP=ivEncounter?g.players[0].lp:0;
   const handMeasure={observations:0,playableTurns:0,options:0,maxLvl:0,zeroChoices:0};
   function inspectLegalOwnFusions(game){
    const p=game.players[0],cards=p.hand.filter(c=>!isFateCard(c));
    const cap=Math.min(5,cards.length);
    const choices=new Set();let legalCombos=0;
    for(let mask=0;mask<(1<<cap);mask++){
     const material=[];
     for(let i=0;i<cap;i++)if(mask&(1<<i))material.push(cards[i]);
     if(material.length<2||material.length>5)continue;
     const levels=material.map(c=>dataOf(c).level);
     const valid=fusionOptions(game,levels,material).filter(c=>
      canCompleteHandFusion(game,levels,c.id));
     if(valid.length){legalCombos++;for(const c of valid)choices.add(c.id);}
    }
    const highest=Math.max(0,...[...choices].map(id=>CARDS[id]?.level||0));
    return {legalCombos,optionCount:choices.size,highest};
   }
   // v12.3 accidentally used obsolete arm names; both IV arms MUST run tempo-board.
   if(['tempo-baseline','strategic-lookahead','strategic-online-feedback'].includes(treatment)){
    chooseAiAction=function(game,requested){
     if(game!==g||game.active!==0)return initialChoose(game,requested);
     if(isVIPhase&&!game.pending&&!game.summoned&&
        (!game.aiPhase||game.aiPhase==='summon')&&
        !inspectedTurns.has(game.turn)){
      inspectedTurns.add(game.turn);
      const f=inspectLegalOwnFusions(game);
      handMeasure.observations++;
      handMeasure.playableTurns+=Number(f.optionCount>0);
      handMeasure.options+=f.optionCount;
      handMeasure.maxLvl=Math.max(handMeasure.maxLvl,f.highest);
      handMeasure.zeroChoices+=Number(f.optionCount===0);
     }
     const offense=aggressive?xOffensivePolicy(game,offensiveAudit):null;
     const tactical=planning&&context==='tournament'&&tier>=7?
       strategicBoardPolicy(game,strategicStats,learning):null;
     return tactical||offense||((${summonPolicySource})(game,'tempo-board',controller))||
      initialChoose(game,requested);
    };
   }
   const combat={fusionPrepared:0,fusionPlaced:0,fieldFusions:0,
    materials:0,atkSum:0,defSum:0,wallBreaks:0,
    playerDamage:0,enemyKills:0,realAttacks:0,strongFusionWithOutcome:0};
   applyAiAction=function(game,action){
    if(game!==g||game.active!==0)return initialApply(game,action);
    if(action?.type==='fusion'){
     const wall=Math.max(0,...game.players[1].field.filter(Boolean).map(c=>{
      const x=dataOf(c);return c.mode==='def'?x.def:x.atk;
     }));
     const result=initialApply(game,action);
     if(!result)rejectedFuseChoices++;
     if(result&&game.pending?.kind==='fusion'){
      const t=dataOf(game.pending.card);
      combat.fusionPrepared++;
      combat.materials+=action.uids?.length||0;
      combat.atkSum+=t.atk;combat.defSum+=t.def;
      combat.wallBreaks+=Number(wall>0&&t.atk>wall);
     }
     return result;
    }
    if(action?.type==='place'){
     const fusionPending=game.pending?.kind==='fusion',hasOld=!!game.players[0].field[action.idx];
     const result=initialApply(game,action);
     if(!result&&fusionPending)rejectedFusionPlacements++;
     if(result){
      if(fusionPending)combat.fusionPlaced++;
      if((fusionPending||result.fused)&&result.card){
       const lv=dataOf(result.card).level;
       maxFusionPlacedLevel=Math.max(maxFusionPlacedLevel,lv);
       actualFusionLevelHistogram[lv]=(actualFusionLevelHistogram[lv]||0)+1;
       const group=context==='tournament'?actualFusionByTournamentStage:actualFusionByFarmStage;
       group[tier]??={};group[tier][lv]=(group[tier][lv]||0)+1;
       allFusionPlaced++;allFieldFusions+=Number(!!result.fused);
       allFusionHeritage+=Number(result.card.fusionHeritage?.carriedPct||0);
       allRoleMismatches+=Number(!!result.card.roleOverride&&dataOf(result.card).role!==result.card.roleOverride);
       giantStreetFusions+=Number(String(result.card.pattern||'').includes('Gigantische'));
      }
      if(result.fused||hasOld)combat.fieldFusions++;
     }
     return result;
    }
    if(action?.type==='attack'){
     const before=game.players[1].lp,result=initialApply(game,action);
     if(result){
      controller.attacks++;controller.damageNpc+=Math.max(0,before-game.players[1].lp);
      combat.realAttacks++;
      combat.playerDamage+=Math.max(0,before-game.players[1].lp);
      combat.enemyKills+=(result.destroyed||[]).filter(x=>String(x).startsWith('1:')).length;
     }
     return result;
    }
    return initialApply(game,action);
   };
   // Second decorator: exact field instance ID, not all-player attacks.
   const observedApply=applyAiAction,trackedUIDs=new Map();
   let incomingMaterials=0;
   const impact={instances:0,attacks:0,damage:0,kills:0,turns:0,materials:0};
   applyAiAction=function(game,action){
    if(game!==g||game.active!==0)return observedApply(game,action);
    const p=game.players[0],e=game.players[1];
    const old=action?.type==='place'?p.field[action.idx]:null,
     wasFusion=action?.type==='place'&&game.pending?.kind==='fusion',
     oldTrace=old?trackedUIDs.get(old.uid):null,
     attacker=action?.type==='attack'?p.field[action.ai]:null,
     attackingTrace=attacker?trackedUIDs.get(attacker.uid):null,
     beforeLP=e.lp;
    const result=observedApply(game,action);
    if(result&&action?.type==='fusion'&&game.pending?.kind==='fusion')
     incomingMaterials=action.uids?.length||0;
    if(result&&action?.type==='place'){
     if(wasFusion||result.fused){
      const consumed=(wasFusion?incomingMaterials:1)+
        (result.fused?(oldTrace?.materials||1):0);
      if(old)trackedUIDs.delete(old.uid);
      trackedUIDs.set(result.card.uid,{materials:consumed,turns:0});
      impact.instances++;impact.materials+=consumed;
     }
     incomingMaterials=0;
    }
    if(result&&action?.type==='attack'&&attackingTrace){
     impact.attacks++;
     impact.damage+=Math.max(0,beforeLP-e.lp);
     impact.kills+=(result.destroyed||[]).filter(x=>String(x).startsWith('1:')).length;
    }
    if(action?.type==='end'){
     for(const c of p.field.filter(Boolean)){
      const found=trackedUIDs.get(c.uid);
      if(found){found.turns++;impact.turns++;}
     }
    }
    return result;
   };
   // Inspect REAL successful actions rather than equating an owned skill
   // with an activation. Passive perk exposure is recorded separately.
   const observingApply=applyAiAction;
   applyAiAction=function(game,action){
    const actor=game.active===0?'player':'npc',kind=String(action?.type||'unknown');
    const before=game.active,p=game.players[0];
    const npc=game.players[1];
    const xMyLp=xTrace?p.lp:0,xNpcLp=xTrace?npc.lp:0;
    const attacker=xTrace&&action?.type==='attack'?
      game.players[before].field[action.ai]?.id:null;
    const xFusionPending=xTrace&&action?.type==='place'&&game.pending?.kind==='fusion';
    const result=observingApply(game,action);
    if(game===g&&result){
     if(xTrace){
       xTrace.actions[actor][kind]=(xTrace.actions[actor][kind]||0)+1;
       xTrace.damageToPlayer+=Math.max(0,xMyLp-p.lp);
       xTrace.damageToNpc+=Math.max(0,xNpcLp-npc.lp);
       if(kind==='attack'){
         const damage=actor==='npc'?Math.max(0,xMyLp-p.lp):Math.max(0,xNpcLp-npc.lp);
         const item=xAttackerStats[actor],key=String(attacker??'unknown');
         item[key]??={attempts:0,damage:0,card:attacker!=null?CARDS[attacker]?.name||null:null};
         item[key].attempts++;item[key].damage+=damage;
         xTrace[actor==='npc'?'npcStrikes':'playerStrikes']++;
         if(actor==='npc')xTrace.npcAttackDamageById[key]=(xTrace.npcAttackDamageById[key]||0)+damage;
         else xTrace.playerAttackDamageById[key]=(xTrace.playerAttackDamageById[key]||0)+damage;
       }
       if(kind==='place'&&result.card){
         if(actor==='npc'){
           const cid=result.card.id;
           xTrace.npcCardsPlaced[cid]=(xTrace.npcCardsPlaced[cid]||0)+1;
           if(cid===xTrace.aceId)xTrace.npcAcePlaced++;
           if(xFusionPending||result.fused){
             xTrace.npcFusionPlaced++;
             if(dataOf(result.card).level===10)xTrace.npcLevel10FusionPlaced++;
           }
         }else if(xFusionPending||result.fused)xTrace.playerFusionPlaced++;
       }
       if(kind==='end'&&!xTrace.scannedTurns.has(game.turn)){
         xTrace.scannedTurns.add(game.turn);
         xTrace.turnsWithNpcAce+=Number(npc.field.some(c=>c?.id===xTrace.aceId));
         xTrace.turnsWithNpcLevel10+=Number(npc.field.some(c=>c&&c.fusion&&dataOf(c).level===10));
       }
     }
     const map=activeAiActions[actor];map[kind]=(map[kind]||0)+1;
     if(skillType(kind)){
       skillActions[actor][kind]=(skillActions[actor][kind]||0)+1;
     }
     if(before===0&&kind==='end'){
       const crew=p.field.filter(Boolean).map(c=>dataOf(c).role||CARDS[c.id]?.role||'');
       if((profile.upgrades.jagdinstinkt||0)>0&&crew.includes('predator'))
        passiveExposure.jagdinstinkt++;
       if((profile.upgrades.schildwall||0)>0&&crew.some(r=>r==='guardian'||r==='soul'))
        passiveExposure.schildwall++;
       for(const key of ['kolossenkraft','schwarminstinkt','grosswildjaeger'])
        if((profile.upgrades[key]||0)>0)passiveExposure[key]++;
     }
     if(context==='tournament'&&(tier===7||tier===10)){
       const entry=bossSkillStats[tier];const actorKey=actor+'_'+kind;
       entry[actorKey]=(entry[actorKey]||0)+1;
     }
    }
    return result;
   };
   try{simulateGame(g,policy);}
   finally{chooseAiAction=initialChoose;applyAiAction=initialApply;}
   if(online&&context==='tournament'&&tier>=6){
     // Transparent bounded within-career outcome feedback. This does NOT
     // claim a globally trained or persistent cross-session model.
     const prior=learning.riskMultiplier;
     const dealt=combat.playerDamage;
     const delta=g.winner===0?-.025:
       dealt<1200?-.06:dealt>4000?.055:.015;
     learning.riskMultiplier=Math.max(.68,Math.min(1.42,prior+delta));
     learning.updates++;
     if(g.winner===0)learning.positive++;else learning.negative++;
     if(learning.history.length<70)learning.history.push({
       tier,won:g.winner===0,damage:dealt,
       before:+prior.toFixed(3),after:+learning.riskMultiplier.toFixed(3)});
   }
   if(context==='tournament'&&(tier===7||tier===10)){
     if(bossPerkRanks[tier].length<30)bossPerkRanks[tier].push({...profile.upgrades});
   }
   if(xTrace){
     const gameOver=g.winner===0?'player-win':g.players[0].lp<=0?'player-lp-zero':
       g.players[0].deck.length===0?'player-deck-empty':
       g.players[1].lp<=0?'npc-lp-zero':'other-loss';
     xEndReasons[gameOver]=(xEndReasons[gameOver]||0)+1;
     xBattles.push({
       win:g.winner===0,rounds:g.turn,
       outcome:gameOver,playerLP:g.players[0].lp,npcLP:g.players[1].lp,
       playerDeckRemaining:g.players[0].deck.length,npcDeckRemaining:g.players[1].deck.length,
       playerFieldRemaining:g.players[0].field.filter(Boolean).length,
       npcFieldRemaining:g.players[1].field.filter(Boolean).length,
       npcAcePlaced:xTrace.npcAcePlaced,
       npcLevel10FusionPlaced:xTrace.npcLevel10FusionPlaced,npcFusionPlaced:xTrace.npcFusionPlaced,
       playerFusionPlaced:xTrace.playerFusionPlaced,
       npcStrikes:xTrace.npcStrikes,playerStrikes:xTrace.playerStrikes,
       damageToPlayer:xTrace.damageToPlayer,damageToNpc:xTrace.damageToNpc,
       turnsWithNpcAce:xTrace.turnsWithNpcAce,turnsWithNpcLevel10:xTrace.turnsWithNpcLevel10,
       npcCardsPlaced:xTrace.npcCardsPlaced,actions:xTrace.actions,
       npcAttackDamageById:xTrace.npcAttackDamageById,
       playerAttackDamageById:xTrace.playerAttackDamageById
     });
   }
   if(ivEncounter){
    const policyCalls=controller.summonObservations-controllerStart.summonObservations;
    const policyNormals=controller.policyNormalChoices-controllerStart.policyNormalChoices;
    const policyFusions=controller.policyFusionChoices-controllerStart.policyFusionChoices;
    if(policyCalls<=0)
      throw Error('Tempo-board controller did not run against IV');
    ivPolicyCalls+=policyCalls;ivPolicyNormal+=policyNormals;ivPolicyFusion+=policyFusions;
    ivAttacks+=combat.realAttacks;ivDamage+=combat.playerDamage;
    ivKills+=combat.enemyKills;ivFusionPlacements+=combat.fusionPlaced;
    ivLPLost+=Math.max(0,ivStartLP-g.players[0].lp);
    opponentIVCombat.push({
      attempt:opponentIVCombat.length+1,won:g.winner===0,rounds:g.turn,
      playerLP:g.players[0].lp,opponentLP:g.players[1].lp,
      lpLost:Math.max(0,ivStartLP-g.players[0].lp),
      attackActions:combat.realAttacks,playerDamage:combat.playerDamage,
      enemyKills:combat.enemyKills,fusionsPrepared:combat.fusionPrepared,
      fusionsPlaced:combat.fusionPlaced,fieldFusions:combat.fieldFusions,
      fusionsWithImpact:impact.instances,fusionAttacks:impact.attacks,
      fusionDamage:impact.damage,fusionKills:impact.kills,
      summonPolicyCalls:policyCalls,normalSelections:policyNormals,
      fusionSelections:policyFusions,
      legalFusionObservations:handMeasure.observations
    });
   }
   if(context==='tournament'&&tier===7){
    v7Attempts++;v7Fusions+=impact.instances;v7Attacks+=impact.attacks;
    v7Damage+=impact.damage;v7Kills+=impact.kills;v7Turns+=impact.turns;
    v7TotalDamage+=combat.playerDamage;
   }
   if(isVIPhase){
    uidFusionInstances+=impact.instances;
    uidFusionAttacks+=impact.attacks;
    uidFusionDamage+=impact.damage;
    uidFusionKills+=impact.kills;
    uidFusionTurns+=impact.turns;
    uidFusionMaterials+=impact.materials;
    realVIHandFusions+=combat.fusionPrepared;
    realVIPlacedFusions+=combat.fusionPlaced;
    realVIFieldFusions+=combat.fieldFusions;
    realVIFusionMaterialCount+=combat.materials;
    realVIFusionAtkSum+=combat.atkSum;
    realVIFusionDefSum+=combat.defSum;
    realVIWallBreaks+=combat.wallBreaks;
    realVIAttackDamage+=combat.playerDamage;
    realVIKills+=combat.enemyKills;
    if(context==='tournament'&&tier===6){
     // Count actual executed monster and damage outcomes, not options
     // merely being possible in a hypothetical or actual hand.
     const meaningful=impact.instances>0&&
      (impact.damage>=300||impact.kills>=1||impact.turns>=2);
     recentVICombat.push({fusions:combat.fusionPlaced,
      fieldFusions:combat.fieldFusions,wallBreaks:combat.wallBreaks,
      realDamage:combat.playerDamage,enemyKills:combat.enemyKills,
      uidDamage:impact.damage,uidKills:impact.kills,
      uidAttacks:impact.attacks,uidTurns:impact.turns,
      uidMaterials:impact.materials,meaningful,win:g.winner===0});
     if(recentVICombat.length>4)recentVICombat.shift();
    }
    viRealHandChecks+=handMeasure.observations;
    viFusionReadyChecks+=handMeasure.playableTurns;
    viPlayableChoices+=handMeasure.options;
    viMaxFusionLevel=Math.max(viMaxFusionLevel,handMeasure.maxLvl);
    viZeroChoiceHands+=handMeasure.zeroChoices;
    if(context==='tournament'&&tier===6){
     recentViHands.push({...handMeasure,win:g.winner===0});
     if(recentViHands.length>4)recentViHands.shift();
    }
   }
   const win=g.winner===0;
   if(g.winner===null)throw Error('Incomplete career match');
   const reward=rewardMatch(g);
   if(!reward)throw Error('Real rewardMatch failed');
   rewarded++;winCount+=Number(win);losses+=Number(!win);
   if(context==='free'&&tier>0){
    farms++;farmMatchesByTier[tier]=(farmMatchesByTier[tier]||0)+1;
    farmXpByTier[tier]=(farmXpByTier[tier]||0)+(reward.xp||0);
    farmLootByTier[tier]=(farmLootByTier[tier]||0)+Number(!!reward.loot?.card);
    if(streak>0){adaptiveFarmMatches++;adaptiveFarmWins+=Number(win);}
   }
   if(context==='tournament')tournaments++;
    sealsEarned+=Number(reward.boosterSeals||0);
    extraShardsEarned+=Number(reward.extraShards||0);
   if(context==='free'&&win)farmWins++;
   const drop=reward.loot?.card??null;
   if(drop!=null&&CARDS[drop]){
    acquiredIds[drop]=(acquiredIds[drop]||0)+1;
    cardDrops++;normalDrops+=Number(!CARDS[drop].fusionOnly);
    fusionDrops+=Number(!!CARDS[drop].fusionOnly);
    highDrops+=Number(CARDS[drop].level>=7);
    if(context==='free'){
     const item=lootedByTier[tier]??={cards:0,high:0,normal:0,fusion:0};
     item.cards++;item.high+=Number(CARDS[drop].level>=7);
     item.normal+=Number(!CARDS[drop].fusionOnly);
     item.fusion+=Number(!!CARDS[drop].fusionOnly);
    }
   }
   events.push({tier,context,won:win,playerLevel:playerLevel(profile),
    deckAverageLevel:profile.activeDeck.reduce((sum,id)=>sum+CARDS[id].level,0)/profile.activeDeck.length,
    loot:reward.loot?.card??null,coins:reward.coins,xp:reward.xp});
   return win;
  }
  // Remember a failed source until actual earned card improvements.
  function power(){return {main:profile.activeDeck.reduce((n,id)=>n+CARDS[id].level,0)/40,
   attack:profile.activeDeck.reduce((n,id)=>n+CARDS[id].atk,0)/40,
   fusion:profile.fusionDeck.reduce((n,id)=>n+CARDS[id].level,0)/Math.max(1,profile.fusionDeck.length)};}
  function locked(tier){
   const old=sourceLocks[tier];if(!old)return false;
   const now=power();
   if(now.main-old.main>=.25||now.attack-old.attack>=70||
     now.fusion-old.fusion>=.6||farmWins-old.wins>=40){delete sourceLocks[tier];return false;}
   return true;
  }
  // Memory is used exclusively for preparation and recovery around X.
  // Stages I-IX continue the exact v12.1 focused-forge farming schedule.
  function smartFarm(nextBoss,maximum,phase){
   let total=0,wins=0,source=Math.min(highestCleared(),nextBoss-1),group=0;
   while(total<maximum){
    if(bossTierInProgress===6&&source===5&&viPhaseMatches>=70)source=4;
    if(source>0&&locked(source)){source--;backtracks++;avoidedTries++;continue;}
    const size=Math.min(5,maximum-total),before=power(),start=events.length;
    let success=0;
    for(let i=0;i<size;i++){
     if(bossTierInProgress===6&&source===5&&viPhaseMatches>=70)source=4;
     const won=duel(source,'free');success+=Number(won);wins+=Number(won);
     total++;farmsSinceTier++;
     farmSourceMatches[source]=(farmSourceMatches[source]||0)+1;
     farmSourceWins[source]=(farmSourceWins[source]||0)+Number(won);
    }
    const drops=events.slice(start).filter(x=>x.loot!=null).length;
    prepare();investmentCycles++;smartWaves++;group++;
    const after=power();
    const improved=after.main-before.main>=.08||after.attack-before.attack>=12||after.fusion-before.fusion>=.15;
    if(farmStrategyHistory.length<300)farmStrategyHistory.push({
     forTier:nextBoss,phase,source,fights:size,wins:success,drops,improved,
     deckLevelGain:+(after.main-before.main).toFixed(3)});
    if(success/size<.6&&source>0){
     sourceLocks[source]={...after,wins:farmWins};source--;backtracks++;
    }
    // Revisit a stronger source only after its failure lock clears.
    if(group%3===0){
     let top=Math.min(highestCleared(),nextBoss-1);
     while(top>source&&locked(top))top--;
     if(top>source)source=top;
    }
   }
   return {matches:total,wins};
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
    fusionAverageLevel:+(fusions.reduce((n,c)=>n+c.level,0)/Math.max(1,fusions.length)).toFixed(2),
    fusionAverageAtk:+(fusions.reduce((n,c)=>n+c.atk,0)/Math.max(1,fusions.length)).toFixed(2),
    fusionAverageDef:+(fusions.reduce((n,c)=>n+c.def,0)/Math.max(1,fusions.length)).toFixed(2),
    fusionSpecies:new Set(fusions.map(c=>c.id)).size,
    uniqueMainCards:new Set(profile.activeDeck).size,
    ownedCardCopies:ownedEntries.reduce((sum,[,n])=>sum+n,0),
    highestOwnedCardLevel:ownedHighest,shardsAvailable:sharedShards(),
    playerLevel:playerLevel(profile),coins:profile.coins,
     seals:profile.boosterSeals,discovered:profile.discoveredCards.length,
     ranks:Object.fromEntries(['grosswildjaeger','kolossenkraft','schwarminstinkt'].map(k=>[k,profile.upgrades[k]||0])),
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
  for(let tier=1;tier<=10;tier++){
   bossTierInProgress=tier;
   if(tier>1&&!profile.cleared.includes(tier-1))
    throw Error('Progress was not legitimately unlocked: '+tier);
   const snap=snapshot(tier);
   if(tier===10)xPreBossState.push({mainLevel:snap.averageMainLevel,
     fusionLevel:snap.fusionAverageLevel,coins:snap.coins,
     copies:snap.ownedCardCopies,ranks:{...profile.upgrades},
     mainDeck:snap.activeDeck,fusionDeck:snap.fusionDeck});
   snapshots.push({tier:snap.tier,playerLevel:snap.playerLevel,
    coins:snap.coins,shardsAvailable:snap.shardsAvailable,
     seals:snap.seals,discovered:snap.discovered,ranks:snap.ranks,
    ownedCardCopies:snap.ownedCardCopies,
    highestOwnedCardLevel:snap.highestOwnedCardLevel,
    averageMainLevel:snap.averageMainLevel,
    level7PlusEquipped:snap.level7PlusEquipped,
    fusionDeckSize:snap.fusionDeckSize,sourceMax:snap.sourceMax,
    fusionAverageLevel:snap.fusionAverageLevel,fusionAverageAtk:snap.fusionAverageAtk,
    fusionAverageDef:snap.fusionAverageDef,fusionSpecies:snap.fusionSpecies,
    activeDeck:snap.activeDeck,fusionDeck:snap.fusionDeck,
    enhancements:snap.enhancements,inventoryOwned:snap.inventoryOwned,
    legitimatelyCleared:snap.cleared});
   let won=false;streak=0;
   // Progressive pre-boss preparation from stage IV, exclusively on won tiers.
   // Does not block live player progression.
   const baseCap=tier<6?0:Math.min(128,48+(tier-6)*20);
   const cap=progressive&&tier>=7?Math.min(300,170+(tier-7)*35):baseCap;
   const priorPrep=snapshot(tier);
   const plannedPrep=progressive?(deepFarm[tier]||0):0;
   let prepDuels=0,prepWins=0;
   if(endgameMemory&&tier===10&&plannedPrep){
    const sample=smartFarm(tier,plannedPrep,'pre-boss');
    prepDuels=sample.matches;prepWins=sample.wins;
   }else for(let k=0;k<plannedPrep;k++){
    if(tier===6&&viPhaseMatches>=72)break;
    const previous=tier-1;
    if(!profile.cleared.includes(previous))throw Error('Farm source not cleared: '+previous);
    const win=duel(previous,'free');prepDuels++;prepWins+=Number(win);
    farmsSinceTier++;prepare();
   }
   const afterPrep=snapshot(tier);
   preparationByTier[tier]={plannedPrep,prepDuels,prepWins,source:tier>1?tier-1:0,
    before:{mainLevel:priorPrep.averageMainLevel,mainCopies:priorPrep.ownedCardCopies,
     fusionLevel:priorPrep.fusionAverageLevel,fusionAtk:priorPrep.fusionAverageAtk,
     shards:priorPrep.shardsAvailable,seals:priorPrep.seals,coins:priorPrep.coins,
     cardsLevel7:priorPrep.level7PlusEquipped},
    after:{mainLevel:afterPrep.averageMainLevel,mainCopies:afterPrep.ownedCardCopies,
     fusionLevel:afterPrep.fusionAverageLevel,fusionAtk:afterPrep.fusionAverageAtk,
     shards:afterPrep.shardsAvailable,seals:afterPrep.seals,coins:afterPrep.coins,
     cardsLevel7:afterPrep.level7PlusEquipped}};

   let farmedForThisBoss=0;
   tierAttempts[tier]=0;
   for(let attempt=0;attempt<maxAttempts;attempt++){
    if(tier===6&&viPhaseMatches>=75)break;
    tierAttempts[tier]++;
    won=duel(tier,'tournament');prepare();
    if(won){tierWinAtAttempt[tier]=attempt+1;break;}
    streak++;
    // Both strategies must face the actual boss before they farm.
    // Fixed retains historical batches after every three defeats.
    // Adaptive uses early recovery after two losses, genuine earned
    // duel rewards and a per-tier finite experiment farming budget.
    if(tier<6){
     if(attempt%3===2&&endgameMemory&&tier===10){
      smartFarm(tier,farmAfter,'early-boss-recovery');
     }else if(attempt%3===2)for(let k=0;k<farmAfter;k++){
      if(tier===6&&viPhaseMatches>=75)break;
      const farmTier=Math.max(0,tier-1);
      duel(farmTier,'free');farmsSinceTier++;prepare();
     }
    }else if(streak>=2&&farmedForThisBoss<cap&&(tier!==6||viPhaseMatches<72)){
     // The impact arm still farms: only batch size changes when a
     // genuinely executed fusion already fought a relevant visible threat.
     // Never treat mere legal options as proof of boss readiness.
     const farmTier=Math.max(0,tier-1),
      average=profile.activeDeck.reduce((v,id)=>v+CARDS[id].atk,0)/
       profile.activeDeck.length,
      visibleBoss=CARDS[OPPONENTS[tier].signature]?.atk||average,
      gap=average<visibleBoss*.55,
      xpFactor=farmingXpFactor(farmTier);
     // Lower remaining XP yield does not grant anything: it only
     // discourages repeatedly grinding lower, ineffective stages.
     // Predetermined switch: budget-conscious for first 45 VI-related fights;
     // after 45, unchanged intensive VI farming with no further skip gate.
     const qualityPhase=false; // identical validated VI fusion controller on all arms
     const recent=recentVICombat.slice(-2);
     const tangible=recent.some(x=>x.meaningful);
     const intenseRequest=6+Math.max(0,tier-6)*2+(gap?2:0)+(xpFactor<.2?-2:0);
     const requested=progressive&&tier>=7?Math.max(intenseRequest,10+(tier-7)*3):intenseRequest;
     const batch=Math.max(0,Math.min(Math.max(2,requested),
       cap-farmedForThisBoss,tier===6?75-viPhaseMatches:cap));
     if(batch>0){
      if(treatment==='vi-uid-impact'){
       impactSmallWaves+=Number(tangible);
       impactIntensiveWaves+=Number(!tangible);
       readinessCheckTrace.push({afterAttempts:attempt+1,
        lastTwoVICombat:recent.map(x=>({fusions:x.fusions,
         uidDamage:x.uidDamage,uidKills:x.uidKills,
         uidAttacks:x.uidAttacks,uidTurns:x.uidTurns,
         uidMaterials:x.uidMaterials,meaningful:x.meaningful})),requested,batch});
      }
      const prior={
       level:playerLevel(profile),
       atk:profile.activeDeck.reduce((v,id)=>v+CARDS[id].atk,0)/profile.activeDeck.length,
       avgLevel:profile.activeDeck.reduce((v,id)=>v+CARDS[id].level,0)/profile.activeDeck.length,
       copies:Object.values(profile.inventory).reduce((v,n)=>v+Number(n||0),0),
       fusions:profile.fusionDeck.length,
       deckDef:profile.activeDeck.reduce((v,id)=>v+CARDS[id].def,0)/profile.activeDeck.length,
       materialsL4:profile.activeDeck.filter(id=>CARDS[id].level>=4).length,
       ownedFusionTemplates:profile.fusionDeck.filter(id=>
        (profile.inventory[id]||0)>0&&!!CARDS[id]).length,
       shards:sharedShards(),coins:profile.coins
      };
      let batchXp=0,batchLoot=0;
      adaptiveBatches++;
      tierFarmDecisions.push({tier,afterAttempts:attempt+1,
       source:farmTier,avgDeckAtk:Math.round(average),
       bossSignatureAtk:visibleBoss,xpFactor:+xpFactor.toFixed(3),
       farmCount:batch});
      if(endgameMemory&&tier===10){
       const first=events.length,result=smartFarm(tier,batch,'boss-recovery');
       farmedForThisBoss+=result.matches;
       const earned=events.slice(first).filter(e=>e.context==='free');
       if(earned.length!==result.matches)throw Error('Missing actual adaptive farming match');
       batchXp=earned.reduce((n,e)=>n+Number(e.xp||0),0);
       batchLoot=earned.filter(e=>e.loot!==null&&e.loot!==undefined).length;
       tierFarmDecisions[tierFarmDecisions.length-1].sources=
        farmStrategyHistory.filter(x=>x.forTier===tier&&x.phase==='boss-recovery')
         .slice(-Math.ceil(batch/5)).map(x=>x.source);
      }else for(let k=0;k<batch;k++){
       const eventIndex=events.length;
       duel(farmTier,'free');farmsSinceTier++;prepare();
       farmedForThisBoss++;
       const earned=events[eventIndex];
       if(!earned||earned.context!=='free')throw Error('Missing genuine farming reward');
       batchXp+=Number(earned.xp||0);
       batchLoot+=Number(earned.loot!==null&&earned.loot!==undefined);
      }
      const atkNow=profile.activeDeck.reduce((v,id)=>v+CARDS[id].atk,0)/profile.activeDeck.length,
       lvlNow=profile.activeDeck.reduce((v,id)=>v+CARDS[id].level,0)/profile.activeDeck.length,
       copyNow=Object.values(profile.inventory).reduce((v,n)=>v+Number(n||0),0);
      const atkGain=atkNow-prior.atk,deckLevelGain=lvlNow-prior.avgLevel,
       levelGain=playerLevel(profile)-prior.level,
       copyGain=copyNow-prior.copies,
       fusionGain=profile.fusionDeck.length-prior.fusions,
       defGain=profile.activeDeck.reduce((v,id)=>v+CARDS[id].def,0)/
         profile.activeDeck.length-prior.deckDef,
       level4MaterialGain=profile.activeDeck.filter(id=>CARDS[id].level>=4).length-
         prior.materialsL4,
       ownedFusionTemplateGain=profile.fusionDeck.filter(id=>
        (profile.inventory[id]||0)>0&&!!CARDS[id]).length-prior.ownedFusionTemplates;
      // Observable, realized progress only. XP and coins are audited
      // separately because they do not automatically strengthen a deck.
      const useful=atkGain>=10||deckLevelGain>=.08||
       levelGain>0||fusionGain>0||copyGain>=2;
      measuredBatches++;yieldUseful+=Number(useful);yieldWeak+=Number(!useful);
      // This signal explicitly excludes inventory-only and XP-only gains;
      // it uses genuine equipped-card and actually owned fusion-template gains.
      const qualitySignal=atkGain>=15||defGain>=20||deckLevelGain>=.10||
       level4MaterialGain>=1||ownedFusionTemplateGain>0||
       (levelGain>0&&(atkGain>0||defGain>0));
      meaningfulDeckWaves+=Number(qualitySignal);
      weakQualityWaves+=Number(!qualitySignal);
      qualityGainTotal+=Math.max(0,atkGain)+Math.max(0,defGain)/2;
      legitFusionGainTotal+=Math.max(0,ownedFusionTemplateGain);
      roiLastBatch=(atkGain>=15?8:0)+(defGain>=20?6:0)+
       (deckLevelGain>=.10?7:0)+(level4MaterialGain>=1?6:0)+
       (ownedFusionTemplateGain>0?7:0)+(levelGain>0?2:0);
      actualFarmXp+=batchXp;actualFarmLoot+=batchLoot;lastFarmWeak=!qualitySignal;
      tierFarmDecisions[tierFarmDecisions.length-1].realYield={
       xp:batchXp,loot:batchLoot,
       atkGain:+atkGain.toFixed(2),deckLevelGain:+deckLevelGain.toFixed(3),
       levelGain,copyGain,fusionGain,defGain:+defGain.toFixed(2),
       level4MaterialGain,ownedFusionTemplateGain,qualitySignal,roiLastBatch,
       netShards:sharedShards()-prior.shards,netCoins:profile.coins-prior.coins,
       useful
      };
     }
     streak=0;
    }
   }
   if(!won)break;
   streak=0; // Post-victory free duels are baseline farming, not failure recovery.
   // Replays against a BEATEN opponent improve the owned collection
   // while respecting drop odds, XP penalties and actual resource costs.
   const postCount=farmAfter+(tier>=6?Math.min(5,tier-5):0)+(progressive&&tier>=4?Math.min(8,tier-3):0);
   if(endgameMemory&&tier===9)smartFarm(tier+1,postCount,'post-victory');
   else for(let k=0;k<postCount;k++){
    duel(tier,'free');farmsSinceTier++;prepare();
   }
  }
  // Do not claim to know whether a drop is equipped: measure exact actual
  // copies in both real decks against the earned drop IDs. No card grants.
  const dropInstalled={main:0,fusion:0,unique:0,uninstalled:0,highUnused:0};
  for(const [id,n] of Object.entries(acquiredIds)){
   const card=CARDS[Number(id)];
   const inMain=profile.activeDeck.filter(x=>x===Number(id)).length;
   const inFusion=profile.fusionDeck.filter(x=>x===Number(id)).length;
   const installed=Math.min(n,inMain+inFusion);
   dropInstalled.main+=Math.min(n,inMain);
   dropInstalled.fusion+=Math.min(n,inFusion);
   dropInstalled.unique+=Number(installed>0);
   dropInstalled.uninstalled+=Math.max(0,n-installed);
   if(card?.level>=7&&!installed)dropInstalled.highUnused+=n;
  }
  const finalDeckStrength={
   avgMainLevel:+(profile.activeDeck.reduce((n,id)=>n+CARDS[id].level,0)/40).toFixed(2),
   avgMainAtk:+(profile.activeDeck.reduce((n,id)=>n+CARDS[id].atk,0)/40).toFixed(1),
   avgFusionLevel:+(profile.fusionDeck.reduce((n,id)=>n+CARDS[id].level,0)/Math.max(1,profile.fusionDeck.length)).toFixed(2),
   highMain:profile.activeDeck.filter(id=>CARDS[id].level>=7).length,
   highFusion:profile.fusionDeck.filter(id=>CARDS[id].level>=7).length,
   normalCopies:Object.entries(profile.inventory).reduce((n,[id,count])=>n+Number(count||0)*Number(!!CARDS[Number(id)]?.rpg&&!CARDS[Number(id)]?.fusionOnly),0)
  };
  return {policy,plan,strategy,treatment,controller,training,snapshots,events,
   dropInstalled,finalDeckStrength,weakForgeSpentByTier,
   opponentIVCombat,ivPolicyCalls,ivPolicyNormal,ivPolicyFusion,
   perkPurchases,perkPurchaseLogs,boostersBySize,fusionPacksBySize,
   strategicStats,learning,
   offensiveAudit,packDecisions,
   xBattles,xAttackerStats,xEndReasons,xPreBossState,tenPackWaits,tenPackPurchases,tenAffordableMisses,
   packOpened,packCharactersPicked,activeAiActions,skillActions,
   passiveExposure,bossSkillStats,bossPerkRanks,
   ivAttacks,ivDamage,ivKills,ivFusionPlacements,ivLPLost,
   adaptiveBatches,adaptiveFarmMatches,adaptiveFarmWins,tierFarmDecisions,
   yieldSkipped,measuredBatches,yieldUseful,yieldWeak,actualFarmXp,actualFarmLoot,
   viPhaseMatches,readinessFarmWaves,readinessRetrySkippedWaves,
   viRealHandChecks,viFusionReadyChecks,viPlayableChoices,
   viMaxFusionLevel,viZeroChoiceHands,readinessCheckTrace,
   uidFusionInstances,uidFusionAttacks,uidFusionDamage,
   uidFusionKills,uidFusionTurns,uidFusionMaterials,
   allFusionPlaced,allFieldFusions,allFusionHeritage,allRoleMismatches,
   rejectedFuseChoices,rejectedFusionPlacements,maxFusionPlacedLevel,
   actualFusionLevelHistogram,actualFusionByTournamentStage,actualFusionByFarmStage,
   giantStreetFusions,
   forgeCount,forgeCost,forgeFusion,forgeNormal,forgeLevel10,forgeUnavailable,forgeLevels,forgeHistory,
   backtracks,smartWaves,investmentCycles,farmSourceMatches,farmSourceWins,farmStrategyHistory,forgeStrategyHistory,
   cardDrops,normalDrops,fusionDrops,highDrops,lootedByTier,avoidedTries,forgePhases,
   realVIHandFusions,realVIFieldFusions,realVIPlacedFusions,
   realVIFusionMaterialCount,realVIFusionAtkSum,realVIFusionDefSum,
   realVIWallBreaks,realVIAttackDamage,realVIKills,
   impactSmallWaves,impactIntensiveWaves,
   meaningfulDeckWaves,weakQualityWaves,
   qualityGainTotal,legitFusionGainTotal,
   farmMatchesByTier,farmXpByTier,farmLootByTier,tierAttempts,tierWinAtAttempt,preparationByTier,
   bridgeRebuilds,bridgeMains,bridgeFusions,
   earlyBridgeCalls,earlyBridgeChanges,earlyBridgeMainChanges,earlyBridgeFusionChanges,
   duels:serial,winCount,losses,farms,tournaments,
   boosters,fusionPacks,fusionPulls,normalPackCards,mixedPackCards,
   v7Attempts,v7Fusions,v7Attacks,v7Damage,v7Kills,v7Turns,v7TotalDamage,
    normalSealSpent,fusionSealSpent,sealsEarned,extraShardsEarned,upgradesV109,
    finalSeals:profile.boosterSeals,finalRanks:{...profile.upgrades},
    packChoice,milestones,crafts,upgrades,buysAttempted,
   shardCrafts,shardResearches,shardRerolls,shardsSpent,
   cleared:Math.max(0,...profile.cleared),
   saveValid:!!validateProfile(JSON.parse(JSON.stringify(profile)))};
 })()`;
 const r=vm.run(expr,300000);
 if(r.error)throw Error('Career failed: '+r.error);
 assert.equal(r.training,3);assert.ok(r.saveValid);
 assert.ok(r.opponentIVCombat.length>0,'career must actually attempt IV');
 assert.ok(r.ivPolicyCalls>0,'both arms must execute tempo-board');
 assert.ok(r.opponentIVCombat.every(x=>x.summonPolicyCalls>0),'IV diagnostic skipped controller');
 assert.equal(r.opponentIVCombat.length,r.tierAttempts[4]||0,'Every IV tournament battle must be logged');
 results.push({...r,run,treatment});
 console.log('ARCANE_V129_PROGRESS '+JSON.stringify({origin:run+1,arm:treatment,cleared:r.cleared,duels:r.duels,drops:r.cardDrops}));
}


const byArm={}, train=Math.floor(careers/2);
for(const arm of arms){
 const subset=results.filter(r=>r.treatment===arm);
 const agg={origins:subset.length,duels:subset.reduce((n,r)=>n+r.duels,0),
  freeDuels:subset.reduce((n,r)=>n+r.farms,0),byTier:{}};
 for(let tier=1;tier<=10;tier++){
  const reached=subset.filter(r=>r.snapshots.some(x=>x.tier===tier)),
   victors=subset.filter(r=>r.tierWinAtAttempt[tier]);
  agg.byTier[tier]={reached:reached.length,victors:victors.length,
   bossAttempts:reached.reduce((n,r)=>n+(r.tierAttempts[tier]||0),0),
   postAndPriorFreeFights:reached.reduce((n,r)=>n+(r.farmMatchesByTier[tier-1]||0),0),
   attemptsToWin:victors.map(r=>r.tierWinAtAttempt[tier])};
 }
 byArm[arm]=agg;
}
for(let run=0;run<careers;run++){
 const rs=arms.map(t=>results.find(r=>r.run===run&&r.treatment===t));
 assert(rs.every(r=>r&&r.training===3&&r.saveValid),'Missing matched real career');
}
const summarise=rs=>Object.fromEntries(arms.map(arm=>{
 const xs=rs.filter(r=>r.treatment===arm);
 const tier7=xs.map(r=>r.snapshots.find(s=>s.tier===7)).filter(Boolean);
 const sum=f=>xs.reduce((n,r)=>n+f(r),0);
 const mean=(ys,f)=>ys.length?+(ys.reduce((n,r)=>n+f(r),0)/ys.length).toFixed(2):null;
 return [arm,{origins:xs.length,duels:sum(r=>r.duels),
  reachedVII:tier7.length,clearedVI:xs.filter(r=>r.cleared>=6).length,
  clearedVII:xs.filter(r=>r.cleared>=7).length,clearedX:xs.filter(r=>r.cleared>=10).length,
  boughtFusions:sum(r=>r.fusionPulls),boughtNormalCards:sum(r=>r.normalPackCards),
  actualCardDrops:sum(r=>r.cardDrops),actualHighLevelDrops:sum(r=>r.highDrops),
  mixedPackCards:sum(r=>r.mixedPackCards),totalPacks:sum(r=>r.boosters+r.fusionPacks),
  spentSeals:sum(r=>r.normalSealSpent+r.fusionSealSpent),
  earnedSeals:sum(r=>r.sealsEarned),remainingSeals:sum(r=>r.finalSeals),
  newPerkRanks:sum(r=>r.upgradesV109),extraShards:sum(r=>r.extraShardsEarned),
  atVII:{mainLevel:mean(tier7,r=>r.averageMainLevel),
   fusionLevel:mean(tier7,r=>r.fusionAverageLevel),
   fusionAtk:mean(tier7,r=>r.fusionAverageAtk),
   fusionDef:mean(tier7,r=>r.fusionAverageDef),
   fusionSpecies:mean(tier7,r=>r.fusionSpecies)},
  VIICombat:{attempts:sum(r=>r.v7Attempts),fusionInstances:sum(r=>r.v7Fusions),
   fusionAttacks:sum(r=>r.v7Attacks),fusionDamage:sum(r=>r.v7Damage),
   fusionKills:sum(r=>r.v7Kills),fusionTurns:sum(r=>r.v7Turns),
   playerDamage:sum(r=>r.v7TotalDamage)}}];
}));
const realFusionSummary=xs=>Object.fromEntries(arms.map(arm=>{
 const rs=xs.filter(r=>r.treatment===arm),sum=fn=>rs.reduce((n,r)=>n+fn(r),0),levels={},byStage={};
 for(const r of rs){for(const [lv,n] of Object.entries(r.actualFusionLevelHistogram))
  levels[lv]=(levels[lv]||0)+n;
  for(const [tier,h] of Object.entries(r.actualFusionByTournamentStage)){
   byStage[tier]??={};
   for(const [lv,n] of Object.entries(h))byStage[tier][lv]=(byStage[tier][lv]||0)+n;
  }
 }
 return [arm,{placed:sum(r=>r.allFusionPlaced),chains:sum(r=>r.allFieldFusions),
  highestLevel:Math.max(0,...rs.map(r=>r.maxFusionPlacedLevel)),levels,bossLevelDistribution:byStage,
  giantStraights:sum(r=>r.giantStreetFusions),
  inheritedQuality:sum(r=>r.allFusionHeritage),roleMismatches:sum(r=>r.allRoleMismatches),
  rejectedFusions:sum(r=>r.rejectedFuseChoices),rejectedPlacements:sum(r=>r.rejectedFusionPlacements)}];
}));
const forgeSummary=rs=>Object.fromEntries(arms.map(arm=>{
 const xs=rs.filter(r=>r.treatment===arm),sum=fn=>xs.reduce((n,r)=>n+fn(r),0),levels={};
 for(const r of xs)for(const [lv,n] of Object.entries(r.forgeLevels))
  levels[lv]=(levels[lv]||0)+n;
 return [arm,{crafts:sum(x=>x.forgeCount),coinsSpent:sum(x=>x.forgeCost),
  fusionOutputs:sum(x=>x.forgeFusion),normalOutputs:sum(x=>x.forgeNormal),
  level10Outputs:sum(x=>x.forgeLevel10),noAvailableRecipe:sum(x=>x.forgeUnavailable),
  outputLevels:levels}];
}));
const comparison=ns=>Object.fromEntries(arms.filter(arm=>arm!=='tempo-baseline').map(arm=>{
 let better=0,worse=0,same=0;
 for(const n of ns){
  const a=results.find(r=>r.run===n&&r.treatment==='tempo-baseline');
  const b=results.find(r=>r.run===n&&r.treatment===arm);
  if(b.cleared>a.cleared)better++;else if(b.cleared<a.cleared)worse++;else same++;
 }
 return [arm,{better,worse,same}];
}));
const training={byArm:summarise(results.filter(r=>r.run<train)),
 forge:forgeSummary(results.filter(r=>r.run<train)),
 fusion:realFusionSummary(results.filter(r=>r.run<train)),
 comparison:comparison(Array.from({length:train},(_,i)=>i))};
const holdout={byArm:summarise(results.filter(r=>r.run>=train)),
 forge:forgeSummary(results.filter(r=>r.run>=train)),
 fusion:realFusionSummary(results.filter(r=>r.run>=train)),
 comparison:comparison(Array.from({length:careers-train},(_,i)=>train+i))};
const report={schema:'arcane-strategic-board-lookahead-v129',
 origins:careers,trainOrigins:train,holdoutOrigins:careers-train,
 control:'Three matched full 12.8 careers against identical balanced opponents and same buy-now economy: default tempo-board combat, bounded visible-board depth-three attack search, and the same search with bounded per-career outcome feedback. No card or boss changes.',
 totalCareers:results.length,
 totalRealDuelRewards:results.reduce((n,r)=>n+r.duels,0),
 offset:careerSeedOffset,arms,byArm,training,holdout,overallFusion:realFusionSummary(results),overallForge:forgeSummary(results),
 farmSchedule:{4:4,5:6,6:8,7:12,8:16,9:20,10:24},
 experiment:'Compare board-aware lookahead, counterattack threat evaluation and within-career online feedback with the existing tempo baseline using the same earned decks, progression and 32 paired origins.',
 raw:results.map(r=>({run:r.run,treatment:r.treatment,split:r.run<train?'train':'holdout',
  maxTierReached:Math.max(...r.snapshots.map(x=>x.tier)),
  highestReallyCleared:r.cleared,
  totalMatches:r.duels,freeMatches:r.farms,tournamentMatches:r.tournaments,
  shardsSpent:r.shardsSpent,boosters:r.boosters,
  VIICombat:{attempts:r.v7Attempts,fusions:r.v7Fusions,attacks:r.v7Attacks,damage:r.v7Damage,kills:r.v7Kills,turns:r.v7Turns,totalDamage:r.v7TotalDamage},
  economy:{perkPurchases:r.perkPurchases,perkPurchaseLogs:r.perkPurchaseLogs,
    finalPerkRanks:r.finalRanks,normalBoosterPurchases:r.boosters,
    fusionPackPurchases:r.fusionPacks,characterPacksOpened:r.packOpened.character,
    packsOpened:r.packOpened,normalBoosterSizes:r.boostersBySize,
    fusionPackSizes:r.fusionPacksBySize,characterPackChoices:r.packCharactersPicked,
    normalBoosterCards:r.normalPackCards,
    mixedPackCards:r.mixedPackCards,fusionCardsFromPacks:r.fusionPulls,
    sealsSpent:{normal:r.normalSealSpent,fusion:r.fusionSealSpent}},
  policies:{offensive:r.offensiveAudit,packDecisions:r.packDecisions,
   boardPlanner:r.strategicStats,feedback:r.learning},
  xDiagnostic:{battleCount:r.xBattles.length,battles:r.xBattles,
    biggestAttackers:r.xAttackerStats,endReasons:r.xEndReasons,
    beforeX:r.xPreBossState},
  tenPackStrategy:{waitOpportunities:r.tenPackWaits,
    tenPacksPurchased:r.tenPackPurchases,
    affordableMissed:r.tenAffordableMisses},
  skillAudit:{realSuccessfulActionTypes:r.activeAiActions,
    activeSkillActionTypes:r.skillActions,
    passiveEligibleOwnTurns:r.passiveExposure,bossActionTypes:r.bossSkillStats,
    recordedBossPerkRanks:r.bossPerkRanks},
  IVCombat:{attempts:r.opponentIVCombat.length,policyCalls:r.ivPolicyCalls,
   normalSelections:r.ivPolicyNormal,fusionSelections:r.ivPolicyFusion,
   playerAttackActions:r.ivAttacks,damageToEnemy:r.ivDamage,
   enemyMonstersKilled:r.ivKills,playerFusionPlacements:r.ivFusionPlacements,
   lpLost:r.ivLPLost,duels:r.opponentIVCombat},
  forge:{crafts:r.forgeCount,cost:r.forgeCost,fusions:r.forgeFusion,normals:r.forgeNormal,level10:r.forgeLevel10,unavailable:r.forgeUnavailable,levels:r.forgeLevels,history:r.forgeHistory,priorities:r.forgeStrategyHistory,phases:r.forgePhases,weakCraftsByTier:r.weakForgeSpentByTier},
  utilization:{dropsEquipped:r.dropInstalled,finalDeckStrength:r.finalDeckStrength},
  acquisition:{drops:r.cardDrops,normal:r.normalDrops,fusion:r.fusionDrops,level7Plus:r.highDrops,farmByTier:r.lootedByTier},
  adaptivePolicy:{tierBacktracks:r.backtracks,measuredWaves:r.smartWaves,investments:r.investmentCycles,
   farmingMatchesBySource:r.farmSourceMatches,farmingWinsBySource:r.farmSourceWins,history:r.farmStrategyHistory,avoidedRetry:r.avoidedTries},
  actualFusion:{totalPlaced:r.allFusionPlaced,fieldChains:r.allFieldFusions,
   highestLevel:r.maxFusionPlacedLevel,levels:r.actualFusionLevelHistogram,
   tournamentLevels:r.actualFusionByTournamentStage,farmLevels:r.actualFusionByFarmStage,
   giantStreets:r.giantStreetFusions,inheritedQualityPctTotal:r.allFusionHeritage,
   roleMismatches:r.allRoleMismatches,rejectedFuseChoices:r.rejectedFuseChoices,
   rejectedFusionPlacements:r.rejectedFusionPlacements},
  fusionPacks:r.fusionPacks,fusionPulls:r.fusionPulls,normalPackCards:r.normalPackCards,mixedPackCards:r.mixedPackCards,
  sealsEarned:r.sealsEarned,normalSealSpent:r.normalSealSpent,fusionSealSpent:r.fusionSealSpent,
  extraShardsEarned:r.extraShardsEarned,upgradesV109:r.upgradesV109,finalSeals:r.finalSeals,finalRanks:r.finalRanks,
  tierAttempts:r.tierAttempts,tierWinAtAttempt:r.tierWinAtAttempt,
  farmMatchesByTier:r.farmMatchesByTier,expEarnedByFarmTier:r.farmXpByTier,
  lootByFarmTier:r.farmLootByTier,
  actualFarmDecisions:r.tierFarmDecisions,preparationByTier:r.preparationByTier,
  earnedDeck:(()=>{
   const last=r.snapshots.at(-1);
   const owned=last.inventoryOwned;
   const copies=(xs)=>xs.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});
   for(const [id,num] of Object.entries(copies(last.activeDeck)))
    assert.ok(num<=(owned[id]||0),'Main deck contains unearned cards');
   for(const [id,num] of Object.entries(copies(last.fusionDeck)))
    assert.ok(num<=(owned[id]||0),'Fusion deck contains unearned cards');
   assert.equal(last.activeDeck.length,40);
   return {legitimatelyEarned:true,reached:last.tier,
    cleared:last.legitimatelyCleared,activeDeck:last.activeDeck,
    fusionDeck:last.fusionDeck,enhancements:last.enhancements,
    inventoryOwned:owned};
  })(),
  snapshotProgression:r.snapshots.map(x=>({
   tier:x.tier,playerLevel:x.playerLevel,averageMainLevel:x.averageMainLevel,
   coins:x.coins,shardsAvailable:x.shardsAvailable,seals:x.seals,discovered:x.discovered,ranks:x.ranks,
   ownedCardCopies:x.ownedCardCopies,highestOwnedCardLevel:x.highestOwnedCardLevel,
   fusionDeckSize:x.fusionDeckSize,fusionAverageLevel:x.fusionAverageLevel,
   fusionAverageAtk:x.fusionAverageAtk,fusionAverageDef:x.fusionAverageDef,fusionSpecies:x.fusionSpecies})),saveValid:r.saveValid})),
 caveats:[
  'Tier-scaled 6-to-10 farming is intentional, not a flaw to minimize away.',
  'Boss IX/X fairness cannot be assessed from VI inventory; progression must be earned.',
  'No invented cards, XP, awards, NPC debuffs or tournament victories.',
  'All three arms have identical full v12.8 X roster/multiplier and other NPCs, earned decks, perks and economy; only tactical choice and optional intra-career feedback differ.',
  'VII retains four level-10 fusion slots but two other normal cards were lowered by one level; VIII has two normal cards increased by one level. X remains v12.5.',
  'Both arms assert actively executed tempo-board player AI calls on IV; VII and X are unchanged except for the explicit roster substitutions.',
  'Per-match IV diagnostics report observed completed player attack actions, dealt LP damage, killed NPC units, and actually placed fusions. They cannot identify the exact enemy card responsible for a loss without more opponent instrumentation.',
  'Every fusion-level measure counts an actual successfully placed monster, not merely a proposed card.',
  'Equal initial seeds may produce different later cards and battles due to divergent genuine decisions.',
  'Stage IV-X progressive pre-boss prep uses 4/6/8/12/16/20/24 earned replays of cleared opponents.',
  'VII-X recovery budgets and post-victory farming also scale, without weakening the bosses.',
  'Stage VI maintains its original 75-match phase limit; all decks remain inventory/legal validated.',
  'This test does not force live users to grind or give free cards/resources.',
  'Perk stat buffs and roster swap apply to both groups; neither test arm receives free items or modifies its opponent difficulty beyond the committed game rules.',
  'Actual packs have different card counts and seal prices. Spending and obtained card quality are reported.',
  'Booster purchase size, costs and produced cards are measured through actual successful purchases; character packs require an actual open and pick.',
  'Skills are counted only for real successful supported AI action types; passive perk ranks and eligible field turns are tracked separately, not misreported as activation.',
  'Browser-only active skill UI buttons, if not available to the offline duel AI, will show zero activations; zero does not mean the perk itself fails.',
  'A larger number of free fights changes raw card and booster totals, so also compare per-career and per-fight performance.',
  'Planner tests depth up to three current-turn attacks with a bounded approximation of one enemy reply; it sees only face-up board, not hidden future draws. Stats are predictions, not exact cloned game states.',
  'The online feedback modifies a bounded risk preference based only on actual earlier duels within the SAME career; it is not persistent cross-career training. No reward or data are added artificially.',
  'The X trace captures successful game actions, played NPC cards, LP damage by actual attacker ID and final deck/LP state; LP damage from passive mechanics may not have an attacking ID.',
  'An end-of-game empty deck does not prove deck-out as the loss cause; reported causes prioritize zero LP and otherwise mark depleted deck as suggestive only.',
  'VII combat traces actual fusion instances, attacks and monster damage, not hypothetical options.',
  'Measures acquisition strategies inside v10.9, not an invalid pre-v10.9 counterfactual.',
  'Tier VI retains a 75-relevant-match offline cap, tiers VII-X progressively allow more farming; these are test budgets, not game rules.'
 ]};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-board-strategy-v129.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V129_CAREER_SUMMARY '+JSON.stringify({
 origins:careers,totalMatches:report.totalRealDuelRewards,training,holdout,byArm}));
