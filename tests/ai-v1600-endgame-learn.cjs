'use strict';
/* Update observational endgame priors exclusively from v14.9.71 TRAIN traces.
 * The resulting biases remain bounded and never inspect VALIDATION/HOLDOUT. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-endgame-learn.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1571','artifacts/v1600'],
 ['arcane-v1571','arcane-v1600'],
 ['ARCANE_V1571','ARCANE_V1600'],
 ['sourceRun:40477542888','sourceRun:40513311546']
]){
 assert.ok(source.includes(a),'Missing learner anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console',source)(require,process,console);
