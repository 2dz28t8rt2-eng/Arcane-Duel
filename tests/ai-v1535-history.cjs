'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1535';fs.mkdirSync(root,{recursive:true});
function read(p){assert.ok(fs.existsSync(p),'Missing archive: '+p);return JSON.parse(fs.readFileSync(p,'utf8'));}
const previous=read('/tmp/arcane-prev/training-q-and-examples.json');
assert.ok(Array.isArray(previous)&&previous.length===3,'Bad previous Q snapshot');
assert.ok(previous.every(x=>x.learnedQ&&Object.keys(x.learnedQ).length>=160),'Q reset is forbidden');
fs.writeFileSync(root+'/previous-training-q.json',JSON.stringify(previous)+'\n');
fs.writeFileSync(root+'/v1497-prior-q.json',JSON.stringify(previous)+'\n');
const sources=[
 {id:39803691439,path:'/tmp/arcane-history/v1511/training-q-and-examples.json'},
 {id:39843438099,path:'/tmp/arcane-history/v1512/training-q-and-examples.json'},
 {id:39847734409,path:'/tmp/arcane-history/v1513/training-q-and-examples.json'},
 {id:39851537706,path:'/tmp/arcane-history/v1514/training-q-and-examples.json'},
 {id:39855753529,path:'/tmp/arcane-history/v1515/training-q-and-examples.json'},
 {id:39858417967,path:'/tmp/arcane-history/v1516/training-q-and-examples.json'},
 {id:39862370629,path:'/tmp/arcane-history/v1517/training-q-and-examples.json'},
 {id:39904678414,path:'/tmp/arcane-history/v1518/training-q-and-examples.json'},
 {id:39907484021,path:'/tmp/arcane-history/v1519/training-q-and-examples.json'},
 {id:39911997726,path:'/tmp/arcane-history/v1520/training-q-and-examples.json'},
 {id:39919243971,path:'/tmp/arcane-history/v1521/training-q-and-examples.json'},
 {id:39925937764,path:'/tmp/arcane-history/v1522/training-q-and-examples.json'},
 {id:39930044938,path:'/tmp/arcane-history/v1523/training-q-and-examples.json'},
 {id:39933155444,path:'/tmp/arcane-history/v1524/training-q-and-examples.json'},
 {id:39937859539,path:'/tmp/arcane-history/v1525/training-q-and-examples.json'},
 {id:39942452732,path:'/tmp/arcane-history/v1526/training-q-and-examples.json'},
 {id:39963832441,path:'/tmp/arcane-history/v1527/training-q-and-examples.json'},
 {id:39974390088,path:'/tmp/arcane-history/v1528/training-q-and-examples.json'},
 {id:39983397260,path:'/tmp/arcane-history/v1529/training-q-and-examples.json'},
 {id:40031690133,path:'/tmp/arcane-history/v1530/training-q-and-examples.json'},
 {id:40073805406,path:'/tmp/arcane-history/v1531/training-q-and-examples.json'},
 {id:40076895921,path:'/tmp/arcane-history/v1532/training-q-and-examples.json'},
 {id:40080727988,path:'/tmp/arcane-history/v1533/training-q-and-examples.json'},
 {id:40094049613,path:'/tmp/arcane-history/v1534/training-q-and-examples.json'}];
const examples=[],seen=new Set();let discardedInvalid=0;
for(const source of sources){
 const groups=read(source.path);
 assert.ok(Array.isArray(groups)&&groups.length===3,'Unexpected archived arms');
 for(const arm of groups){
  assert.ok(arm.learnedQ&&Array.isArray(arm.replayExamples)&&arm.replayExamples.length>0);
  for(const sample of arm.replayExamples){
   // Historical engines could serialize NaN rewards as null in JSON.
   // Drop the WHOLE contaminated example, never coerce null to zero.
   if(!Array.isArray(sample.scored)||!sample.scored.length||
      !sample.scored.every(a=>typeof a.key==='string'&&Number.isFinite(a.reward))){
      discardedInvalid++;continue;
   }
   const key=[source.id,arm.swarm,arm.pierce,sample.seed,sample.i].join('|');
   if(seen.has(key))continue;
   seen.add(key);
   examples.push({sourceRun:source.id,swarm:arm.swarm,pierce:arm.pierce,
    scored:sample.scored.map(a=>({key:a.key,reward:a.reward}))});
  }
 }
}
assert.ok(examples.length>=120,'Missing meaningful archived training examples');
const pack={schema:'arcane-v1513-train-only-replay',sources:sources.map(s=>s.id),
 examples,excluded:['holdout','testExamples','fullmatch-cases']};
fs.writeFileSync(root+'/historical-train.json',JSON.stringify(pack)+'\n');
fs.writeFileSync(root+'/provenance.json',JSON.stringify({
 sourceRuns:pack.sources,priorQKeys:previous.map(x=>Object.keys(x.learnedQ).length),
 historicalTrainingExamples:examples.length,invalidHistoricalExamplesDiscarded:discardedInvalid,holdoutAsTraining:false},null,2)+'\n');
console.log('ARCANE_V1535_HISTORY '+JSON.stringify({sources:pack.sources,examples:examples.length,discardedInvalid,
 priorQKeys:previous.map(x=>Object.keys(x.learnedQ).length)}));
