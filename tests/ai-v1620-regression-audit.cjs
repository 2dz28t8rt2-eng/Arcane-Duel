'use strict';
/*
 * v16.2 – descriptive analysis of v16.1 TRAIN-only first divergences.
 * NOT causal labels, not a reward model, not access to VALIDATION/HOLDOUT.
 * Prior regressions motivate a predeclared role-specific counterfactual search.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const input=process.env.ARCANE_PREVIOUS_ARTIFACT_DIR;
assert.ok(input&&fs.existsSync(input),'Prior TRAIN artifact location required');
const stages=[4,7,8],rows=[];
for(const stage of stages){
 const p=path.join(input,`stage-${stage}-decision-diffs.json`);
 const d=JSON.parse(fs.readFileSync(p,'utf8'));
 assert.equal(d.stage,stage);
 assert.equal(d.controls.holdoutNeverInspected,true);
 assert.equal(d.controls.firstDivergenceDoesNotEstablishCausality,true);
 assert.ok(d.rows.length>=100,'Missing prior TRAIN decisions');
 assert.ok(d.rows.every(x=>x.split==='train'));
 rows.push(...d.rows.map(x=>({...x,stage})));
}
const summarize=items=>({
 cases:items.length,
 improvements:items.filter(x=>x.candidateWin===1&&x.incumbentWin===0).length,
 regressions:items.filter(x=>x.candidateWin===0&&x.incumbentWin===1).length,
 byFirstDifferentAction:Object.fromEntries(
  [...new Set(items.map(x=>x.candidateAction?.type).filter(Boolean))].sort()
   .map(type=>[type,items.filter(x=>x.candidateAction?.type===type&&
     x.candidateWin===0&&x.incumbentWin===1).length])
 )
});
const byStage=Object.fromEntries(stages.map(stage=>[stage,summarize(rows.filter(x=>x.stage===stage))]));
const byArm=Object.fromEntries([...new Set(rows.map(x=>x.arm))].sort()
 .map(arm=>[arm,summarize(rows.filter(x=>x.arm===arm))]));
const data={
 schema:'arcane-v1620-prior-train-regression-hypotheses',
 sourceRun:40843620929,priorVersion:'v16.1',split:'train',
 validationUsed:false,holdoutUsed:false,
 firstDifferenceIsNotCausality:true,
 intendedChange:'predeclared legal visible-board defender reply/raid/survival experiments',
 stages,byStage,byArm,
 limitations:[
  'First-different-action is descriptive and can occur before an unrelated cause of defeat.',
  'Scenarios from one previous run are not independent causal labels.',
  'Only new TRAIN and VALIDATION determine later champion promotion.'
 ]
};
fs.mkdirSync('artifacts/v1620',{recursive:true});
fs.writeFileSync('artifacts/v1620/prior-train-regression-hypotheses.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_V1620_TRAIN_FAILURE_HYPOTHESES '+JSON.stringify({byStage,byArm}));
