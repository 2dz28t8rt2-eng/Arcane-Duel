/* Arcane Duel 6.4 – high-stage earned inventory AI evaluation with genuinely earned career decks.
 * Input comes from real simulations of rewardMatch/booster/milestone actions,
 * not from freely assembled synthetic inventories. Policy candidates are
 * chosen by training-seed performance; entirely new holdout seeds confirm.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const input=JSON.parse(fs.readFileSync('artifacts/ai-real-careers-v64.json','utf8'));
const testN=Number(process.env.ARCANE_CAREER_TRAIN_SEEDS||3);
const holdN=Number(process.env.ARCANE_CAREER_HOLDOUT_SEEDS||5);
if(!Number.isInteger(testN)||testN<2||testN>12||
 !Number.isInteger(holdN)||holdN<3||holdN>20)throw Error('Invalid test cohort size');
assert.ok(input.stageSnapshots>0);
const prev=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const vm=boot({seed:632211});
const methods=[
 {name:'trained-v57',params:null,gate:null},
 {name:'gated-field',params:{material:.7,board:2.15,tempo:.9,risk:1.3,
  support:.8,future:.65,ace:10},gate:{guarded:true,margin:3}},
 {name:'gated-survival',params:{material:1.25,board:1.15,tempo:.5,risk:2.4,
  support:1.9,future:1.5,ace:10},gate:{guarded:true,margin:3}},
 {name:'fusion-preservation',params:{material:1.25,board:1.15,tempo:.5,risk:2.4,
  support:1.9,future:1.5,ace:10},gate:{guarded:true,margin:3,fusionPremium:5}}
];
const roles=['balanced','offensive','guardian'];
const sort=rows=>rows.sort((a,b)=>(a.tier-b.tier)||a.careerId-b.careerId);
const snapshots=sort([...input.entries]);
let games=0;
function run(snapshot,method,seed,starter,playerPolicy){
 const expected=prev.find(x=>x.tier===snapshot.tier)?.weights;
 assert.ok(expected,'Training weights missing for opponent '+snapshot.tier);
 const expr=`(()=>{
  profile=${JSON.stringify(snapshot.profile)};
  // This is a copy of a completed REAL sequence of rewards; never advance
  // or add player inventory between the paired comparison branches.
  const own=profile.inventory,main=profile.activeDeck,fusions=profile.fusionDeck;
  const count=(cards)=>{const result={};for(const id of cards)result[id]=(result[id]||0)+1;
   return Object.entries(result).every(([id,n])=>n<=(own[id]||0));};
  if(!count(main)||!count(fusions)||mainDeckError(main)||fusionDeckError(fusions))
   throw Error('Invalid earned snapshot deck');
  if(profile.cleared.includes(${snapshot.tier}))
   throw Error('Test snapshot already defeated current opponent');
  if(${snapshot.tier}>1&&!profile.cleared.includes(${snapshot.tier-1}))
   throw Error('Test opponent is not legitimately unlocked');
  ArcaneAiLearning56.setSandbox(${JSON.stringify(expected)},true);
  ArcaneAiLookahead58.setSandbox(null);
  ArcaneAiBranches59.setSandbox(${JSON.stringify(method.params)},${!!method.params},
   ${JSON.stringify(method.gate)});
  const g=createGame({mode:'pve',context:'tournament',opponentId:${snapshot.tier},
   id:'earned-comparison-v64-${seed}-${starter}',
   starter:${starter},seed:${seed},difficulty:'easy',
   deck:[...main],fusionDeck:[...fusions],enhancements:profile.enhancements});
  const ace=ACE_CARD_IDS[${snapshot.tier}],seen=new Set();
  const original=applyAiAction;
  applyAiAction=function(duel,action){
   const ok=original(duel,action);
   if(ok&&duel===g)for(const card of g.players[1].field)
    if(card&&card.id===ace)seen.add(card.uid);
   return ok;
  };
  let error=null;
  try{simulateGame(g,'${playerPolicy}','balanced');}catch(e){error=String(e);}
  applyAiAction=original;
  const stats=ArcaneAiBranches59.stats();
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
  return {winner:g.winner,error,turns:g.turn,lpMargin:g.players[1].lp-g.players[0].lp,
   aceSummoned:seen.size,opponentAceIsReal:g.players[1].remainingFusion.includes(ace)||
    g.players[1].originalDeck.includes(ace),branches:stats.evaluated,
   cardsUnchanged:count(main)&&count(fusions)};
 })()`;
 const r=vm.run(expr,120000);games++;
 if(r.error||![0,1].includes(r.winner)||!r.cardsUnchanged)
  throw Error('Earned profile match failure '+snapshot.tier+': '+r.error);
 return r;
}
function testCohort(tier,policy,seeds,phase){
 const rows=snapshots.filter(x=>x.tier===tier),results=[];
 for(const snapshot of rows)for(const playerPolicy of roles)
  for(let index=0;index<seeds;index++)for(const starter of [0,1]){
   const seed=(phase==='train'?9133981:2673911)+tier*89131+
    snapshot.careerId*1311+roles.indexOf(playerPolicy)*761+index*3701;
   results.push({career:snapshot.careerId,style:playerPolicy,starter,
    ...run(snapshot,policy,seed,starter,playerPolicy)});
  }
 const count=results.length,sum=k=>results.reduce((v,x)=>v+x[k],0);
 return {games:count,npcWins:results.filter(x=>x.winner===1).length,
  avgLP:Math.round(sum('lpMargin')/count),
  avgTurns:Math.round(sum('turns')/count*10)/10,
  confirmedAceSummons:sum('aceSummoned'),
  gamesWithAce:results.filter(x=>x.aceSummoned>0).length,
  byStageInventory:rows.map(s=>({careerId:s.careerId,
   playerLevel:s.playerLevel,ownedUnique:Object.keys(s.inventoryOwned).length,
   boosts:s.boostersPurchased}))};
}
const report={schema:'arcane-optimized-earned-career-policy-v64',
 snapshots:snapshots.length,careers:input.careers,
 trainingSeedsPerSnapshot:testN,holdoutSeedsPerSnapshot:holdN,
 modes:methods.map(x=>x.name),tiers:[],games:0,
 noAutoDeployment:true,baseline:'original previously trained AI v5.7',
 cautions:['Snapshots are earned by scripted careers, not humans.',
 'Training and holdout seeds are disjoint; rank selected before holdout.',
 'Insufficient data for tiers unreachable in real careers.',
 'No boost or gear granted to a player without using actual economy functions.']};
const minTier=Number(process.env.ARCANE_CAREER_TRAIN_MIN_TIER||4);
if(!Number.isInteger(minTier)||minTier<1||minTier>10)throw Error('Invalid training tier');
const tiers=[...new Set(snapshots.map(s=>s.tier))].filter(t=>t>=minTier)
 .sort((a,b)=>a-b);
for(const tier of tiers){
 const baselineTrain=testCohort(tier,methods[0],testN,'train');
 const attempts=methods.slice(1).map(x=>({method:x,
  metrics:testCohort(tier,x,testN,'train')}));
 const champion=attempts.map(x=>({
  ...x,fitness:(x.metrics.npcWins-baselineTrain.npcWins)*10000+
   x.metrics.avgLP-baselineTrain.avgLP
 })).sort((a,b)=>b.fitness-a.fitness)[0];
 // Don't promote any trained policy on a non-positive training difference.
 const winner=champion.fitness>0?champion.method:methods[0];
 const base=testCohort(tier,methods[0],holdN,'hold');
 const candidate=winner.name===methods[0].name?base:testCohort(tier,winner,holdN,'hold');
 const gain=candidate.npcWins-base.npcWins,lpGain=candidate.avgLP-base.avgLP;
 const qualified=winner.name!==methods[0].name&&gain>=3&&lpGain>=0&&
  snapshots.filter(x=>x.tier===tier).length>=3&&
  candidate.gamesWithAce>=base.gamesWithAce;
 report.tiers.push({tier,realSnapshots:snapshots.filter(x=>x.tier===tier).length,
  trainingBaseline:baselineTrain,
  training:attempts.map(x=>({name:x.method.name,npcWins:x.metrics.npcWins,
   avgLP:x.metrics.avgLP})),
  champion:winner.name,
  holdout:{baseline:base,candidate,winGain:gain,lpGain,qualified}});
 console.log('ARCANE_OPTIMIZED_POLICY_STAGE_V64 '+JSON.stringify({tier,
  snapshots:snapshots.filter(x=>x.tier===tier).length,
  trainingGames:baselineTrain.games+attempts.reduce((v,x)=>v+x.metrics.games,0),
  holdoutGames:base.games+(winner.name===methods[0].name?0:candidate.games),
  champion:winner.name,holdoutWinGain:gain,lpGain,qualified,
  baseAce:base.gamesWithAce,candidateAce:candidate.gamesWithAce}));
}
report.games=games;
report.holdoutWinGain=report.tiers.reduce((v,x)=>v+x.holdout.winGain,0);
report.qualifyingTiers=report.tiers.filter(x=>x.holdout.qualified).map(x=>x.tier);
fs.writeFileSync('artifacts/ai-optimized-policy-v64.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_OPTIMIZED_POLICY_SUMMARY_V64 '+JSON.stringify({games,tiers:tiers.length,
 trueInventorySnapshots:snapshots.length,holdoutWinGain:report.holdoutWinGain,
 qualifyingTiers:report.qualifyingTiers}));
