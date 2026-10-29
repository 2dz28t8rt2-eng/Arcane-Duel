'use strict';
/* Inherit the unweakened v16 exact seed/seat, non-defender parity,
   frozen-champion, H2H, TRAIN+VALIDATION and sealed holdout gates. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1600-aggregate.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1600','artifacts/v1640'],
 ['arcane-v1600','arcane-v1640'],
 ['16000000+','16400000+'],
 ['defender-v1600-','defender-v1640-'],
 ['fusion-v1600-','fusion-v1640-']
]){
 assert.ok(source.includes(a),'Missing strict aggregate anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
