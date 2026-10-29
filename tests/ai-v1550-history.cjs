'use strict';
/* Carry forward the verified 38-run TRAIN-only corpus from v14.9.49 and add
 * only its new TRAIN replay examples. Never ingest holdout/test examples. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1550',prior=process.env.ARCANE_PREVIOUS_ARTIFACT_DIR||'/tmp/arcane-prev';
fs.mkdirSync(root,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const previous=read(prior+'/training-q-and-examples.json');
assert.ok(Array.isArray(previous)&&previous.length===3);
assert.ok(previous.every(x=>x.learnedQ&&Object.keys(x.learnedQ).length>=160));
const old=read(prior+'/historical-train.json');
const provenance=read(prior+'/provenance.json');
assert.equal(old.schema,'arcane-v1513-train-only-replay');
assert.equal(old.sources.length,38);
assert.equal(old.sources.at(-1),40220761209);
assert.equal(provenance.holdoutAsTraining,false);
assert.equal(provenance.historicalTrainingExamples,old.examples.length);
assert.ok(old.excluded.includes('holdout')&&old.excluded.includes('testExamples'));
const sourceId=40225941367;
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
assert.equal(samples.length,135,'v14.9.49 TRAIN replay example count changed');
const pack={schema:old.schema,sources:[...old.sources,sourceId],
 examples:[...old.examples,...samples],excluded:old.excluded};
assert.equal(pack.sources.length,39);
assert.equal(pack.examples.length,5127);
fs.writeFileSync(root+'/previous-training-q.json',JSON.stringify(previous)+'\n');
fs.writeFileSync(root+'/v1499-prior-q.json',JSON.stringify(previous)+'\n');
fs.writeFileSync(root+'/historical-train.json',JSON.stringify(pack)+'\n');
fs.writeFileSync(root+'/provenance.json',JSON.stringify({
 sourceRuns:pack.sources,priorQKeys:previous.map(x=>Object.keys(x.learnedQ).length),
 historicalTrainingExamples:pack.examples.length,
 invalidHistoricalExamplesDiscarded:discardedInvalid,holdoutAsTraining:false
},null,2)+'\n');
console.log('ARCANE_V1550_HISTORY '+JSON.stringify({
 sources:pack.sources.length,examples:pack.examples.length,discardedInvalid,
 priorQKeys:previous.map(x=>Object.keys(x.learnedQ).length)
}));
