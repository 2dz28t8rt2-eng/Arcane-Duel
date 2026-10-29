'use strict';
/* Fresh TRAIN-only Q evaluation from the frozen earlier Q checkpoint. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1571-Q.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1571','artifacts/v1572'],
 ['ARCANE_V1571','ARCANE_V1572']
]){
 assert.ok(source.includes(a),'Missing Q anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console',source)(require,process,console);
