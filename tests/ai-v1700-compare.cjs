'use strict';
/* v17.0 cold-vs-learned: same REAL experimental rules, same seeds/seats.
 * Two reports are post-hoc comparisons only; never select/publish a policy
 * using holdout and never infer causality from observational context alone.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1700';
const cohorts=['cold','learned'];
const out={
 schema:'arcane-v1700-frozen-policy-learned-context-ablation',
 ruleVariant:'predator15Triad90',sourceTrainingRun:40917461921,
 rules:{predatorPiercePP:15,drainPredator:90,drainGuardianSoul:100,drainFusion:120},
 trainingModelProvenance:'v16.9 predator15Triad90, TRAIN-only learned values',
 gameplayChanges:false,championAutoPromotion:false,cohorts:{}
};
let count=0;
const aggregate=(cases,field)=>{
 const x=cases.filter(field);
 const seats={};
 for(const seat of [0,1]){const s=x.filter(y=>y.seat===seat);seats[seat]={games:s.length,wins:s.reduce((n,y)=>n+y.win,0)}}
 return {games:x.length,wins:x.reduce((n,y)=>n+y.win,0),seats,
  bondChecks:x.reduce((n,y)=>n+(y.defenderBondPlacementChecks||0),0),
  survivingBonds:x.reduce((n,y)=>n+(y.defenderBondSurvivingPairs||0),0),
  observedEssenceGain:x.reduce((n,y)=>n+(y.defenderBondObservedEssenceGain||0),0)};
};
for(const cohort of cohorts){
 const at=root+'/'+cohort;
 const r=JSON.parse(fs.readFileSync(at+'/report.json','utf8'));
 const s=JSON.parse(fs.readFileSync(at+'/stage-8.json','utf8'));
 const model=JSON.parse(fs.readFileSync(at+'/endgame-learner.json','utf8'));
 const next=JSON.parse(fs.readFileSync(at+'/next-run-endgame-learner.json','utf8'));
 assert.equal(r.status,'completed');assert.equal(r.totalDuels,23040);
 assert.equal(r.stages.length,11);assert.equal(r.arms.length,6);
 assert.equal(s.stage,8);
 assert.equal(r.globalSelection.holdoutSeenBySelector,false);
 assert.ok(r.controls.holdoutNeverUsedForSelection&&r.controls.noProductionChanges);
 assert.equal(model.sourceRun,cohort==='learned'?40917461921:0);
 assert.equal(model.holdoutUsed,false);assert.equal(model.validationUsed,false);
 assert.equal(cohort==='learned'?model.nonzero>=3:model.nonzero===0,true);
 assert.equal(next.validationUsed,false);assert.equal(next.holdoutUsed,false);
 assert.equal(next.split,'train');
 const def='defender-v1700-survival-control',mixed='defender-v1700-counterplay';
 const measured={};
 for(const split of ['train','validation','holdout']){
  measured[split]={};
  for(const policy of [def,mixed]){
   measured[split][policy]={};
   for(const foe of ['predator','fusion']){
    measured[split][policy][foe]={};
    for(const core of ['guardian-core','mixed-50','soul-core']){
     measured[split][policy][foe][core]=aggregate(s.allCases,
       x=>x.split===split&&x.arm===policy&&x.roleB===foe&&x.focusMode===core);
    }
   }
  }
 }
 out.cohorts[cohort]={
  duels:r.totalDuels,championDiagnostic:r.globalSelection.arm,
  promoted:r.globalSelection.promoted,modelContextCount:model.nonzero,
  nextModelContextCount:next.nonzero,nextModelTrainingDuels:next.games,
  measured,stage8Cases:s.allCases.length
 };
 count+=r.totalDuels;
}
assert.equal(count,46080);
assert.equal(out.cohorts.cold.stage8Cases,out.cohorts.learned.stage8Cases);
out.duels=count;
fs.writeFileSync(root+'/cold-vs-learned-comparison.json',JSON.stringify(out,null,2)+'\n');
console.log('ARCANE_V1700_LEARNED_VS_COLD_VERIFIED '+JSON.stringify({
 duels:count,trainingSource:out.sourceTrainingRun,
 coldContext:out.cohorts.cold.modelContextCount,
 learnedContext:out.cohorts.learned.modelContextCount,
 promoted:Object.fromEntries(cohorts.map(c=>[c,out.cohorts[c].promoted])),
 focus:Object.fromEntries(cohorts.map(c=>[c,out.cohorts[c].measured.validation['defender-v1700-survival-control'].predator]))
}));
