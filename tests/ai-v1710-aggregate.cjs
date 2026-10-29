'use strict';
if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='predator15Triad90')throw Error('v17.1 must retain 15/90/100/120');
/* Inherit the unweakened v16 exact seed/seat, non-defender parity,
   frozen-champion, H2H, TRAIN+VALIDATION and sealed holdout gates. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'ai-v1600-aggregate.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1600','artifacts/v1710/'+require('./helpers/research-guardian-heal-v171.cjs').mode()],
 ['arcane-v1600','arcane-v1710'],
 ['16000000+','17100000+'],
 ['defender-v1600-','defender-v1710-'],
 ['fusion-v1600-','fusion-v1710-']
]){
 assert.ok(source.includes(a),'Missing strict aggregate anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
