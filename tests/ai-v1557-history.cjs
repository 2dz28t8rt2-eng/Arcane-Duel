'use strict';
/* Carry forward verified v14.9.56 TRAIN-only replay examples and freeze the
 * retained guarded research champion. Never ingest validation/holdout. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1557',prior=process.env.ARCANE_PREVIOUS_ARTIFACT_DIR||'/tmp/arcane-prev';
fs.mkdirSync(root,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const previous=read(prior+'/training-q-and-examples.json');
assert.ok(Array.isArray(previous)&&previous.length===3);
assert.ok(previous.every(x=>x.learnedQ&&Object.keys(x.learnedQ).length>=160));
const old=read(prior+'/historical-train.json');
const provenance=read(prior+'/provenance.json');
assert.equal(old.schema,'arcane-v1513-train-only-replay');
assert.equal(old.sources.length,45);
assert.equal(old.sources.at(-1),40258011184);
assert.equal(provenance.holdoutAsTraining,false);
assert.equal(provenance.historicalTrainingExamples,old.examples.length);
assert.ok(old.excluded.includes('holdout')&&old.excluded.includes('testExamples'));
const priorReport=read(prior+'/report.json');
assert.equal(priorReport.status,'completed');
assert.equal(priorReport.totalDuels,17280);
assert.equal(priorReport.globalSelection.arm,'l10-guarded-worst-reply');
assert.equal(priorReport.globalSelection.promoted,false);
assert.equal(priorReport.controls.holdoutNeverUsedForSelection,true);
assert.equal(priorReport.controls.nonDefenderExactReplayParity,true);
assert.equal(priorReport.globalSelection.holdoutSeenBySelector,false);
fs.writeFileSync(root+'/frozen-v1555-champion.json',JSON.stringify({
 sourceRun:40258011184,arm:priorReport.globalSelection.arm,
 policy:priorReport.globalSelection.policy,selectionBasedOn:['train','validation'],
 holdoutUsed:false},null,2)+'\n');
const sourceId=40265036837;
const samples=[];
let discardedInvalid=provenance.invalidHistoricalExamplesDiscarded;
for(const arm of previous){
 assert.ok(Array.isArray(arm.replayExamples)&&arm.replayExamples.length>0);
 for(const sample of arm.replayExamples){
  if(!Array.isArray(sample.scored)||!sample.scored.length||
     !sample.scored.every(x=>typeof x.key==='string'&&Number.isFinite(x.reward))){
   discardedInvalid++;continue;
  }
  samples.push({sourceRun:sourceId,swarm:arm.swarm,pierce:arm.pierce,
   scored:sample.scored.map(x=>({key:x.key,reward:x.reward}))});
 }
}
assert.equal(samples.length,135,'v14.9.56 TRAIN replay example count changed');
const pack={schema:old.schema,sources:[...old.sources,sourceId],
 examples:[...old.examples,...samples],excluded:old.excluded};
assert.equal(pack.sources.length,46);
assert.equal(pack.examples.length,6072);
fs.writeFileSync(root+'/previous-training-q.json',JSON.stringify(previous)+'\n');
fs.writeFileSync(root+'/v1499-prior-q.json',JSON.stringify(previous)+'\n');
fs.writeFileSync(root+'/historical-train.json',JSON.stringify(pack)+'\n');
fs.writeFileSync(root+'/provenance.json',JSON.stringify({
 sourceRuns:pack.sources,priorQKeys:previous.map(x=>Object.keys(x.learnedQ).length),
 historicalTrainingExamples:pack.examples.length,
 invalidHistoricalExamplesDiscarded:discardedInvalid,holdoutAsTraining:false
},null,2)+'\n');
console.log('ARCANE_V1557_HISTORY '+JSON.stringify({
 sources:pack.sources.length,examples:pack.examples.length,discardedInvalid,
 priorQKeys:previous.map(x=>Object.keys(x.learnedQ).length)
}));
