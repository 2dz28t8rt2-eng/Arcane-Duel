'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1520';
const names=['role-reference','curriculum-inherited','curriculum-breach','curriculum-patient'];
const stages=[];
const seen=new Set();
const all=[];
for(let s=0;s<4;s++){
 const file=root+'/stage-'+s+'.json';
 assert.ok(fs.existsSync(file),'Missing stage '+s);
 const t=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(t.schema,'arcane-v1520-stage');
 assert.equal(t.stage,s);assert.equal(t.allCases.length,512);
 assert.equal(t.controls.holdoutUsedForSelection,false);
 assert.ok(names.includes(t.chosenArm));
 assert.equal(t.summaries.length,4);
 const trace=JSON.parse(fs.readFileSync(root+'/stage-'+s+'-train-actions.json','utf8'));
 assert.equal(trace.examples.length,384,'Action history must only contain training');
 for(const r of t.allCases){
  assert.equal(r.stage,s);
  assert.ok(names.includes(r.arm)&&[0,1].includes(r.seat)&&[0,1].includes(r.starter));
  assert.equal(r.split,r.scenario===3?'holdout':'train');
  assert.equal(r.seed,15200000+s*100000+r.pair*10000+r.scenario*331+r.starter*17);
  assert.ok(r.seedA!==r.seedB,'Different roles must have distinct deck seeds');
  assert.ok([0,1].includes(r.win));
  assert.ok(r.turn>0&&Number.isFinite(r.reward));
  assert.ok(r.enemyOffense>=0&&r.enemySummons>=0);
  if(s<3)assert.equal(r.enemyOffense,0,'Passive siege leaked opponent attacks');
  if(s===0)assert.equal(r.enemySummons,0,'Static fortress unexpectedly summoned');
  const key=[s,r.pair,r.scenario,r.starter,r.seat,r.arm].join('|');
  assert.ok(!seen.has(key),'Duplicated matched case '+key);seen.add(key);
 }
 for(let pair=0;pair<8;pair++)for(let scenario=0;scenario<4;scenario++)
  for(let starter=0;starter<2;starter++)for(let seat=0;seat<2;seat++)
  for(const name of names)
    assert.ok(seen.has([s,pair,scenario,starter,seat,name].join('|')),
     'Missing fully paired game');
 const reported=t.summaries.find(x=>x.arm===t.chosenArm);
 assert.deepEqual(t.selectedWeights,reported.weights,'Checkpoint weights mismatch');
 const expected=[...t.summaries].filter(x=>x.weights).sort((a,b)=>
   b.train.wins-a.train.wins||
   b.train.meanReward-a.train.meanReward||a.arm.localeCompare(b.arm))[0];
 assert.equal(t.chosenArm,expected.arm,'Holdout used for selection');
 stages.push({stage:s,name:t.name,selected:t.chosenArm,weights:t.selectedWeights,
  baseline:t.summaries[0],selectedSummary:reported,
  summaries:t.summaries,
  strategyOutcomes:t.summaries.map(x=>({arm:x.arm,
   trainWins:x.train.wins,holdoutWins:x.holdout.wins,
   avgTrainingReward:x.train.meanReward,
   holdoutMeanTurns:x.holdout.meanTurns}))});
 all.push(...t.allCases);
}
assert.equal(all.length,2048);
assert.equal(all.filter(x=>x.split==='holdout').length,512);
assert.equal(all.filter(x=>x.split==='train').length,1536);
const armStats=names.map(name=>{
 const pool=all.filter(r=>r.arm===name);
 const sum=rows=>({games:rows.length,wins:rows.reduce((n,r)=>n+r.win,0),
  timeouts:rows.filter(x=>x.timeout).length,opponentAttackActions:rows.reduce((n,r)=>n+r.enemyOffense,0),
  meanTurns:rows.reduce((n,r)=>n+r.turn,0)/Math.max(1,rows.length)});
 return {arm:name,...sum(pool),holdout:sum(pool.filter(r=>r.split==='holdout')),
  byStage:Object.fromEntries([0,1,2,3].map(s=>[s,sum(pool.filter(r=>r.stage===s))]))};
});
const result={schema:'arcane-v1520-completed-four-stage-siege-study',status:'completed',
 sourceSha:process.env.GITHUB_SHA||'unknown',
 totalDuels:2048,holdoutDuels:512,trainDuels:1536,
 researchOnly:true,productionModified:false,
 controls:{stageOrder:'0 > 1 > 2 > 3',
  stages:['static-fortress','growing-fortress','hard-growing-fortress','escalating-resistance'],
  equalStartingLP:true,noOpponentActiveOffenseStages012:true,
  trueGuardianCounterstrikeAndCreatureDecayEnabled:true,
  arenaLPDecayDisabled:true,validFortressCardsRemovedFromDeck:true,
  bothSeats:true,bothStarters:true,matchedSeeds:true,holdoutNeverUsedForSelection:true},
 stages,armStats,
 limitations:[
 'This research adapts hand-coded offense scoring weights based on train-only duels; it does NOT constitute reinforcement learning of all card abilities.',
 'Prior historical Q is imported and separately trained using Predator ATTACK-vs-PASS only.',
 'Static and growing fortresses deliberately grant a legal initial defensive garrison; it is an asymmetric offense teaching task.',
 'Passive defender counterstrike and creature decay remain active; the opponent cannot initiate active attacks until escalating resistance.',
 'Holdout stage scenarios are diagnostic only; stage-to-stage inherited weights are selected from the TRAIN split.',
 'The final escalation permits zero attacks initially, one later, and up to two per opponent turn after turn 20.',
 'No gameplay changes or silent promotion into main.'
 ]};
fs.writeFileSync(root+'/report.json',JSON.stringify(result,null,2)+'\n');
console.log('ARCANE_V1520_COMPLETE '+JSON.stringify({games:result.totalDuels,
 holdout:result.holdoutDuels,train:result.trainDuels,
 selected:stages.map(s=>({stage:s.stage,arm:s.selected,trainWins:s.selectedSummary.train.wins,
  holdoutWins:s.selectedSummary.holdout.wins,baselineHoldout:s.baseline.holdout.wins})),
 arms:armStats.map(x=>({arm:x.arm,wins:x.wins,holdout:x.holdout.wins}))}));
