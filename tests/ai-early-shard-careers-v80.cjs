/* Arcane Duel v8.0 – isolate EARLY legal shard spending (after II) vs late spending (after IV).
 * No invented owned cards: play real training, tournament and farming games;
 * settle original rewardMatch, choose milestone prizes, buy affordable packs,
 * equip cards already present in actual profile.inventory.
 * Stop at unsolved tournament tier rather than gifting progress.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {soulBridgeCode}=require('./helpers/earned-soul-bridge-v67.cjs');
const careers=Number(process.env.ARCANE_V80_CAREERS||12);
const limit=Number(process.env.ARCANE_V80_TIER_ATTEMPTS||16);
if(!Number.isInteger(careers)||careers<1||careers>20||
 !Number.isInteger(limit)||limit<3||limit>22)throw Error('Invalid bounded career audit settings');
// Fresh isolated VM per arm, so identical paid resources and PRNG seeds
// yield a genuine paired progression comparison.
const choices=['balanced','offensive','guardian','economy','balanced','guardian','offensive','economy'];
const results=[];
for(let run=0;run<careers;run++)for(const strategy of ['late-shard','early-shard']){
 const vm=boot({seed:670127+run*317});
 const policy=choices[run%choices.length],plan=['investment','specialize','farm','hybrid'][run%4];
 const expr=`(()=>{
  profile=freshProfile();profile.guideSeen=true;profile.showcase.pending=false;
  const seed=${64127+run*9301},policy='${policy}',plan='${plan}',
   strategy='${strategy}',
   maxAttempts=${limit},snapshots=[],events=[];
  let serial=0,rewarded=0,training=0,farms=0,tournaments=0,boosters=0,
   bridgeRebuilds=0,bridgeMains=0,bridgeFusions=0,
   shardCrafts=0,shardResearches=0,shardRerolls=0,shardsSpent=0,
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
   if((strategy==='early-shard'&&highestCleared()>=2)||
      (strategy==='late-shard'&&highestCleared()>=4)){
    const beforeShards=sharedShards();
    if(shardCrafts<10){
     const pool=CARDS.filter(c=>c&&c.rpg&&!c.retired&&
      !c.fusionOnly&&!c.ace&&!c.essenceMonster&&!c.enemyOnly&&
      !c.questOnly&&!c.lv1Exclusive&&!c.fateOnly&&
      !c.milestoneOnly&&!c.workshopOnly&&!c.trainingReward&&!c.hard&&
      cardAvailable(c.id)&&sharedShards()>=cardCraftShardCost(c.id))
      .sort((a,b)=>b.level-a.level||
       (b.atk+b.def)-(a.atk+a.def));
     // A cap of 3 owned copies avoids buying arbitrarily deep duplicates.
     const best=pool.find(c=>(profile.inventory[c.id]||0)<3);
     if(best&&craftCard(best.id))shardCrafts++;
    }
    if(shardResearches<5&&sharedShards()>=SHARD_RESEARCH_COST){
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
    if(shardRerolls<5&&profile.lastBooster&&
       !profile.lastBooster.rerolled&&sharedShards()>=SHARD_REROLL_COST){
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
   if((strategy==='late-shard'||strategy==='early-shard')&&highestCleared()>=4){
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
   events.push({tier,context,won:win,
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
   return {tier,cleared:[...last],trainingWins:profile.trainingWins,
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
 console.log('ARCANE_CAREER_V80 '+JSON.stringify({policy:r.policy,plan:r.plan,strategy,
  duels:r.duels,cleared:r.cleared,boosters:r.boosters,
  bridgeRebuilds:r.bridgeRebuilds,bridgeMains:r.bridgeMains,
  bridgeFusions:r.bridgeFusions,
  crafts:r.crafts,upgrades:r.upgrades,milestones:r.milestones,
  shardCrafts:r.shardCrafts,shardResearches:r.shardResearches,
  shardRerolls:r.shardRerolls,shardsSpent:r.shardsSpent,
  snapshots:r.snapshots.map(s=>({
   tier:s.tier,level:s.playerLevel,coins:s.coins,
   maxCard:Math.max(...s.activeDeck.map(id=>vm.run('CARDS['+id+'].level'))),
   paidBoosters:s.boostersPurchased}))}));
}
const snapshots=results.flatMap((career,i)=>career.snapshots.map(s=>({
 careerId:career.run,arm:career.strategy,policy:career.policy,plan:career.plan,...s})));
const pairs=Array.from({length:careers},(_,run)=>{
 const baseline=results.find(x=>x.run===run&&x.strategy==='late-shard');
 const candidate=results.find(x=>x.run===run&&x.strategy==='early-shard');
 if(!baseline||!candidate)throw Error('Missing controlled arm '+run);
 const a=baseline.snapshots.filter(x=>x.tier<=2);
 const b=candidate.snapshots.filter(x=>x.tier<=2);
 // Before the early player's first eligible purchase (after clearing II), both paired careers MUST match.
 if(JSON.stringify(a)!==JSON.stringify(b))
  throw Error('Different career states BEFORE intervention, pair '+run);
 return {run,policy:baseline.policy,plan:baseline.plan,
  baselineCleared:baseline.cleared,candidateCleared:candidate.cleared,
  baselineDuels:baseline.duels,candidateDuels:candidate.duels,
  baseReached:baseline.snapshots.at(-1)?.tier,
  soulReached:candidate.snapshots.at(-1)?.tier,
  change: candidate.cleared-baseline.cleared,
  bridgeRebuilds:candidate.bridgeRebuilds,
  bridgeMains:candidate.bridgeMains,bridgeFusions:candidate.bridgeFusions,
  beforeEligibilityExactlyEqual:true};
});
const summaryByArm=Object.fromEntries(['late-shard','early-shard'].map(arm=>{
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
const independentByHalf=section=>Object.fromEntries(['late-shard','early-shard'].map(arm=>{
 const rows=section.filter(r=>r.strategy===arm);
 return [arm,{independentCareers:rows.length,
  reachedVIII:rows.filter(r=>r.cleared>=7).length,
  reachedIX:rows.filter(r=>r.cleared>=8).length,
  averageTournamentCleared:+(rows.reduce((a,r)=>a+r.cleared,0)/rows.length).toFixed(2)}]
}));
const report={schema:'arcane-timing-of-earned-shard-investments-v80',
 earlySpendingAfterCleared:2,lateSpendingAfterCleared:4,
 interventionBeforeTournament:3,
 stagedBeforeInterventionExactlyEqual:true,
 arms:['late-shard','early-shard'],pairs,stageSnapshots:snapshots.length,
 summaryByArm,trainingHalf:independentByHalf(trainingHalf),
 untouchedHoldoutHalf:independentByHalf(holdoutHalf),
 careers:careers,
 maxReached:Math.max(0,...snapshots.map(x=>x.tier)),
 realTrainingAndRewards:true,
 limitations:['Only executed duels grant progress and loot, actual random drop mechanics used.',
  'Snapshots are synthetic careers executed by scripted controllers; no actual user data.',
  'A failed tournament is a hard stop, never manually bypassed.',
  'Decks are auto-equipped from truly owned inventory; not optimized by human judgement.'],
 entries:snapshots};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-shard-timing-careers-v80.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_CAREER_SUMMARY_V80 '+JSON.stringify({careers:careers,
 snapshots:snapshots.length,maxReached:report.maxReached,
 entryStages:Object.fromEntries([...new Set(snapshots.map(s=>s.tier))].sort((a,b)=>a-b)
 .map(t=>[t,snapshots.filter(s=>s.tier===t).length])),
 pairs,stages7to10:snapshots.filter(x=>x.tier>=7).length,
 candidateProfiles: snapshots.filter(x=>x.arm==='early-shard'&&x.tier>=7).length,
 failures:0,summaryByArm,untouchedHoldoutHalf:report.untouchedHoldoutHalf}));
