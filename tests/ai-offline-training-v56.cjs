/* Arcane Duel 5.6 · offline policy tournament
 * Uses the actual game runtime. A policy is a candidate, not a claim that
 * a neural net autonomously learned mechanics. Never accesses live saves.
 * Seed split prevents selecting a winner on its own evaluation samples.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const sample=Number(process.env.ARCANE_TRAIN_SAMPLES||6);
if(!Number.isInteger(sample)||sample<3||sample>20)throw Error('ARCANE_TRAIN_SAMPLES must be 3..20');
const modes=['offensive','guardian','economy','balanced'];
const evaluate=(tier,policy,offset,n)=>{
 const runtime=boot({seed:1291+tier});
 const expr=`(()=>{const rows=[];for(let i=0;i<${n};i++){
  const seed=${offset}+i*8191+${tier}*331;
  const g=createGame({mode:'pve',context:'tournament',opponentId:${tier},seed,difficulty:'easy'});
  let error=null;
  try{simulateGame(g,'balanced','${policy}');}catch(e){error=String(e);}
  rows.push({seed,win:g.winner===1,loss:g.winner===0,draw:g.winner==null,
   turns:g.turn,errors:error});
 }return rows;})()`;
 const rows=runtime.run(expr,120000);
 return {wins:rows.filter(x=>x.win).length,losses:rows.filter(x=>x.loss).length,
  undecided:rows.filter(x=>x.draw).length,errors:rows.filter(x=>x.errors).map(x=>x.errors),
  avgTurns:rows.reduce((v,x)=>v+x.turns,0)/rows.length};
};
const report={schema:'arcane-offline-policy-benchmark-v56',type:'offline-policy-search',
 trainingMatches:0,holdoutMatches:0,tiers:[],notes:[
 'Uses real createGame/simulateGame, not a hand-written approximation',
 'Synthetic seeded test matches are not human-like player behavior',
 'Training policies affect baseline actions but hardcoded v5.5 ACE/fusion priorities override some policy choices',
 'Chosen candidate is advisory until compared to actual default and approved for release',
 'No online learning, no access to the players hidden hand, no save mutation']};
for(let tier=1;tier<=10;tier++){
 const train=modes.map(policy=>({policy,...evaluate(tier,policy,410011,sample)}));
 report.trainingMatches+=sample*modes.length;
 for(const t of train)assert.equal(t.errors.length,0,'tier '+tier+' train '+t.policy);
 const ranking=[...train].sort((a,b)=>b.wins-a.wins||a.undecided-b.undecided||
  modes.indexOf(a.policy)-modes.indexOf(b.policy));
 const winner=ranking[0].policy;
 // True holdout never influences selection. Compare both policies on identical new seeds.
 const baseline=['offensive','guardian','economy'][((tier-1)%3)]||'balanced';
 const holdoutWinner=evaluate(tier,winner,901113,sample);
 const holdoutBaseline=evaluate(tier,baseline,901113,sample);
 report.holdoutMatches+=2*sample;
 assert.equal(holdoutWinner.errors.length,0);
 assert.equal(holdoutBaseline.errors.length,0);
 report.tiers.push({tier,selectedByTraining:winner,defaultPolicy:baseline,
  training:train.map(x=>({policy:x.policy,wins:x.wins,draws:x.undecided})),
  holdout:{candidate:holdoutWinner,baseline:holdoutBaseline},
  improvedOnHoldout:holdoutWinner.wins>holdoutBaseline.wins});
}
const sum=report.tiers.reduce((x,r)=>x+(r.holdout.candidate.wins-r.holdout.baseline.wins),0);
report.holdoutNetAdditionalWins=sum;
report.safeToAutomaticallyApply=false;
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/arcane-ai-training-v56.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_AI_OFFLINE_TRAINING',JSON.stringify({trainingMatches:report.trainingMatches,
 holdoutMatches:report.holdoutMatches,holdoutNetAdditionalWins:sum,tiers:report.tiers.map(t=>({
 tier:t.tier,candidate:t.selectedByTraining,baseline:t.defaultPolicy,
 gain:t.holdout.candidate.wins-t.holdout.baseline.wins}))}));
