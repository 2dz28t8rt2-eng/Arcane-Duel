'use strict';
/* v16.1 Q-learning: warm start from accepted v16 TRAIN checkpoints;
   fresh seeds, independent train-validation, confirmation and sealed holdout. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1600-Q.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1600','artifacts/v1630'],
 ['ARCANE_V1600','ARCANE_V1630']
]){
 assert.ok(source.includes(a),'Missing trusted Q anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
