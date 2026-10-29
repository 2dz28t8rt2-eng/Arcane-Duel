'use strict';
/* Independent-RNG replication of the complete draw-safe v15.82 experiment.
 * Decks, starter swaps, opening hands and fixed research AI stay identical;
 * only the duel RNG seed receives a preregistered, uniform +120000 offset.
 * This is a research-only wrapper: no live game/UI modifications.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const mode=process.env.ARCANE_V1583_MODE;
assert.ok(['baseline','delay','emergency50-locked','emergency50-open'].includes(mode));
process.env.ARCANE_V1582_MODE=mode;
const original=fs.readFileSync;
let patchedSeedSource=0;
fs.readFileSync=function(file,...args){
 const source=original.call(this,file,...args);
 if(!String(file).replace(/\\/g,'/').endsWith('/ai-v1574-stomp-selfplay.cjs'))
  return source;
 // v15.80 must first preserve the upstream 15710000+ source anchor, and
 // v15.73 must still translate that to 15730000+.  Only the final v15.74
 // seed transformation is changed; all ancestor source contracts stay valid.
 const old="once('15730000+','15740000+');";
 const replacement="once('15730000+','15860000+');";
 assert.equal(source.split(old).length,2,'v15.83 independent-seed source drift');
 patchedSeedSource++;
 return source.replace(old,replacement);
};
try{
 let script=original.call(fs,path.join(__dirname,'ai-v1582-deployment-delay.cjs'),'utf8');
 function once(needle,replacement,label){
  assert.equal(script.split(needle).length,2,'v15.83 output source drift '+label);
  script=script.replace(needle,replacement);
 }
 once("'artifacts/v1582/'+match+'/'+deploymentMode",
  "'artifacts/v1583/'+match+'/'+deploymentMode",'shards');
 once("'arcane-v1582-'+match+'-'+deploymentMode+'-'",
  "'arcane-v1583-'+match+'-'+deploymentMode+'-'",'provenance');
 new Function('require','process','console','__dirname',script)(require,process,console,__dirname);
}finally{fs.readFileSync=original;}
assert.equal(patchedSeedSource,1,'Expected exactly one independent-RNG override');
