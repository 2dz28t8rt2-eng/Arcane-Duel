'use strict';
// Learn bounded observational endgame contexts from v16.5 TRAIN actions
// collected under actual v20.6 Soul Bond combat. No other splits are loaded.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-endgame-learn.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1571','artifacts/v1660'],
 ['ARCANE_V1571','ARCANE_V1660'],
 ['sourceRun:40477542888','sourceRun:40868047550'],
 ['defender-v1569-mixed-control','defender-v1650-counterplay'],
 ['defender-v1569-endgame-control','defender-v1650-survival-control']
]){
 assert.ok(source.includes(a),'Missing rule-cohort learner anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console',source)(require,process,console);
