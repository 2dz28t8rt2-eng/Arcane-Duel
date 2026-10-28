'use strict';
/* v15.83 replicates the draw-aware v15.82 aggregate on fresh duel RNG seeds.
 * TRAIN and VALIDATION alone determine any follow-up candidate; the same
 * independent HOLDOUT boundary remains sealed until after selection.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let code=fs.readFileSync(path.join(__dirname,'ai-v1582-deployment-delay-aggregate.cjs'),'utf8');
function once(from,to,label){
 assert.equal(code.split(from).length,2,'v15.83 aggregate source drift '+label);
 code=code.replace(from,to);
}
once("const root='artifacts/v1582'","const root='artifacts/v1583'",'shards');
once("schema:'arcane-v1582-deployment-delay-temporary-emergency-attack'",
 "schema:'arcane-v1583-independent-rng-deployment-replication'",'schema');
once("console.log('ARCANE_V1582_COMPLETE '","console.log('ARCANE_V1583_COMPLETE '",'output');
new Function('require','process','console','__dirname',code)(require,process,console,__dirname);
