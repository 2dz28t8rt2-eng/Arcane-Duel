'use strict';
/* Inherit the unweakened v16 exact seed/seat, non-defender parity,
   frozen-champion, H2H, TRAIN+VALIDATION and sealed holdout gates. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const cohort=process.env.ARCANE_V1700_COHORT;
if(!['cold','learned'].includes(cohort))throw Error('v17.0 requires cold or learned cohort');
if(require('./ai-v1700-research-baseline.cjs').selectedVariant!=='predator15Triad90')throw Error('Unexpected v17.0 research rules');
if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='predator15Triad90')throw Error('v17.0 rule mismatch');

let source=fs.readFileSync(path.join(__dirname,'ai-v1600-aggregate.cjs'),'utf8');
for(const [a,b] of [
 ['artifacts/v1600','artifacts/v1700/'+process.env.ARCANE_V1700_COHORT],
 ['arcane-v1600','arcane-v1700'],
 ['16000000+','17000000+'],
 ['defender-v1600-','defender-v1700-'],
 ['fusion-v1600-','fusion-v1700-']
]){
 assert.ok(source.includes(a),'Missing strict aggregate anchor '+a);
 source=source.split(a).join(b);
}
new Function('require','process','console','__dirname',source)(require,process,console,__dirname);
