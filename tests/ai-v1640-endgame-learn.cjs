'use strict';
/* v16.1 training-only contextual learner from genuine v16.0 TRAIN traces.
   Validation and holdout are never loaded here; observational credit is capped. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-endgame-learn.cjs'),'utf8');
const mappings=[
 ['artifacts/v1571','artifacts/v1640'],
 ['arcane-v1571','arcane-v1640'],
 ['ARCANE_V1571','ARCANE_V1630'],
 ['sourceRun:40477542888','sourceRun:40852605154'],
 ['defender-v1569-mixed-control','defender-v1630-counterplay'],
 ['defender-v1569-endgame-control','defender-v1630-survival-control']
];
for(const [a,b] of mappings){
 assert.ok(source.includes(a),'Missing trusted endgame anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console',source)(require,process,console);
