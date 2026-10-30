'use strict';
if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='control10')throw Error('v17.7 must retain 15/90/100/120');
// TRAIN-only endgame learning AFTER complete current-rules 5-arm research.
// Output is a NEXT-GENERATION checkpoint, not retroactively applied to v16.7.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const balance=require('./helpers/research-ai-v186.cjs').mode();
const root='artifacts/v1860/'+balance;
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-endgame-learn.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1571',root],
 ['ARCANE_V1571','ARCANE_V1860'],
 ['sourceRun:40477542888','sourceRun:0'],
 ['defender-v1569-mixed-control','defender-v1860-counterplay'],
 ['defender-v1569-endgame-control','defender-v1860-survival-control'],
 ["root+'/endgame-learner.json'","root+'/next-run-endgame-learner.json'"]
]){
 assert.ok(source.includes(a),'Missing next-generation learner anchor '+a);
 source=source.split(a).join(b);
}
assert.equal(path.resolve(process.env.ARCANE_PREVIOUS_ARTIFACT_DIR||''),path.resolve(root),
 'Learning must read ONLY the current research cohort');
new Function('require','process','console',source)(require,process,console);
const learned=JSON.parse(fs.readFileSync(root+'/next-run-endgame-learner.json'));
assert.ok(learned.games>=500&&learned.nonzero>=3);
assert.equal(learned.validationUsed,false);assert.equal(learned.holdoutUsed,false);
console.log('ARCANE_V1860_NEXT_GENERATION_TRAIN_LEARNED '+JSON.stringify({balance,games:learned.games,actions:learned.actions,nonzero:learned.nonzero}));
