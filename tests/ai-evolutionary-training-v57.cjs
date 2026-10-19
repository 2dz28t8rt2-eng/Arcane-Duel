/* Genuine iterative offline weight optimization using actual Arcane Duel battles.
 * No network, no user saves, no hidden player information, no live weight writes.
 * Every training epoch evaluates mutated action scoring against the unchanged AI.
 * Seeds used in the final holdout are kept completely separate from training.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const trainN=Number(process.env.ARCANE_EVOLUTION_TRAIN_SEEDS||5),
      holdN=Number(process.env.ARCANE_EVOLUTION_HOLDOUT_SEEDS||8),
      maxTier=Number(process.env.ARCANE_EVOLUTION_TIERS||10);
if(!Number.isSafeInteger(trainN)||trainN<2||trainN>12||
   !Number.isSafeInteger(holdN)||holdN<3||holdN>20||
   !Number.isSafeInteger(maxTier)||maxTier<1||maxTier>10)
 throw Error('Invalid deterministic AI evolution parameters');
const vm=boot({seed:57119});
const presets=vm.run('ArcaneAiLearning56.PRESETS');
const dimensions=['attack','defense','tempo','quality','ace','cost','counter'];
let randSeed=0xCA57BEEF;
const rand=()=>{randSeed=(Math.imul(randSeed,1664525)+1013904223)>>>0;return randSeed/4294967296;};
const clamp=n=>Math.max(0,Math.min(15,Math.round(n*100)/100));
function mutate(parent,level){
 const weights={...parent};
 for(const key of dimensions){
  if(key==='ace')continue; // The signed ACE priority is not trained away.
  const delta=(rand()-.5)*level;
  weights[key]=clamp(weights[key]+delta);
 }
 return weights;
}
let played=0,changed=0;
function match(tier,weights,seed,humanPolicy='balanced'){
 const mode=weights?JSON.stringify(weights):'null';
 const result=vm.run(`(()=>{
  ArcaneAiLearning56.setSandbox(${mode},${!!weights});
  const g=createGame({mode:'pve',context:'tournament',opponentId:${tier},
   seed:${seed},difficulty:'easy'});
  let error=null;
  try{simulateGame(g,'${humanPolicy}','balanced');}catch(e){error=String(e);}
  ArcaneAiLearning56.setSandbox(null);
  return {win:g.winner===1,loss:g.winner===0,turns:g.turn,
   ownLP:g.players[1].lp,enemyLP:g.players[0].lp,error};
 })()`,120000);
 played++;
 if(result.error)throw Error('Tournament '+tier+', seed '+seed+': '+result.error);
 return result;
}
const scoreResults=(g,tier,seeds,policies=['balanced'])=>{
 let wins=0,delta=0,turns=0;
 for(const humanPolicy of policies)for(const seed of seeds){
  const r=match(tier,g,seed,humanPolicy);
  wins+=r.win?1:0;
  delta+=r.ownLP-r.enemyLP;
  turns+=r.turns;
 }
 const count=seeds.length*policies.length;
 return {wins,margin:Math.round(delta/count),avgTurns:Math.round(10*turns/count)/10,
  testedHumanPolicies:policies.length};
};
const fingerprint=w=>dimensions.map(k=>String(w[k])).join(':');
const report={schema:'arcane-ai-evolutionary-learning-v57b',kind:'offline-evolutionary-weight-search',
 trainingSeedsPerTier:trainN,holdoutSeedsPerTier:holdN,holdoutPlayerStyles:['balanced','offensive','guardian','economy'],generations:2,
 populationParents:5,offspringPerGeneration:8,
 tierRows:[],totalMatches:0,activatedInProduction:false,cautions:[
  'Optimizes heuristics, not a neural language model',
  'Training/holdout use the actual game mechanics and scripted synthetic human policy',
  'Selected results need larger holdout, multiple human styles and real career QA before rollout',
  'No unsupervised real-time changes to game or player data'
 ]};
for(let tier=1;tier<=maxTier;tier++){
 const trainSeeds=Array.from({length:trainN},(_,i)=>100270+tier*13703+i*2711);
 const holdSeeds=Array.from({length:holdN},(_,i)=>880131+tier*39007+i*9419);
 const baselineTraining=scoreResults(null,tier,trainSeeds);
 const archetype=['attack','defense','fusion'][(tier-1)%3]||'hybrid';
 const allowed=archetype==='attack'?['predator','tempo','balanced']:
   archetype==='defense'?['bastion','balanced']:
   archetype==='fusion'?['alchemist','balanced']:
   Object.keys(presets);
 let seen=new Set(),candidates=allowed.map(name=>({...presets[name]}));
 let history=[];
 for(let gen=0;gen<3;gen++){
  const samples=candidates.filter(w=>!seen.has(fingerprint(w)));
  const leaderboard=samples.map(w=>{
   seen.add(fingerprint(w));
   const metrics=scoreResults(w,tier,trainSeeds);
   // An extra win dominates every realistic HP margin; when games are equal,
   // optimize the margin as a secondary, graded feedback signal.
   const fitness=(metrics.wins-baselineTraining.wins)*100000+
    (metrics.margin-baselineTraining.margin);
   return {weights:w,metrics,fitness};
  }).sort((a,b)=>b.fitness-a.fitness||a.metrics.avgTurns-b.metrics.avgTurns);
  if(!leaderboard.length)break;
  history.push({generation:gen,bestFitness:leaderboard[0].fitness,
   bestWins:leaderboard[0].metrics.wins});
  if(gen===0||!report.tierRows.length)changed++;
  if(gen===0)var champion=leaderboard[0];
  else if(leaderboard[0].fitness>champion.fitness)champion=leaderboard[0];
  if(gen===2)break;
  candidates=[champion.weights,...Array.from({length:8},()=>mutate(champion.weights,gen===0?2:1))];
 }
 const playerStyles=['balanced','offensive','guardian','economy'];
 const candidate=scoreResults(champion.weights,tier,holdSeeds,playerStyles);
 const baseline=scoreResults(null,tier,holdSeeds,playerStyles);
 const gain=candidate.wins-baseline.wins;
 const improved=gain>0||gain===0&&candidate.margin>baseline.margin;
 // Never automatically switch on a new AI as a result of this small holdout.
 report.tierRows.push({tier,archetype,trainBaseline:baselineTraining,history,
  selectedWeights:champion.weights,selectedTrain:champion.metrics,
  holdout:{candidate,baseline,winGain:gain,
   marginGain:candidate.margin-baseline.margin,improved},
  activateInProduction:false});
}
report.totalMatches=played;
report.holdoutWinGain=report.tierRows.reduce((n,row)=>n+row.holdout.winGain,0);
report.holdoutMeanMarginGain=Math.round(report.tierRows.reduce((n,row)=>
 n+row.holdout.marginGain,0)/report.tierRows.length);
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/arcane-ai-evolution-v57.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_AI_EVOLUTION',JSON.stringify({matches:played,tiers:maxTier,
 holdoutWinGain:report.holdoutWinGain,holdoutMeanMarginGain:report.holdoutMeanMarginGain,
 tiersWithImprovedMetrics:report.tierRows.filter(r=>r.holdout.improved).length,
 results:report.tierRows.map(r=>({tier:r.tier,winGain:r.holdout.winGain,
 marginGain:r.holdout.marginGain,learned:r.selectedWeights}))}));
