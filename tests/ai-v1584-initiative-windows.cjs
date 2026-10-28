'use strict';
/* v15.84 research-only causal test: which seat benefits when the first legal
 * combat window moves, independent from attack/defense stat adjustments?
 * Four timing gates and the user's one-personal-turn deployment delay share
 * fixed decks, policy, shuffled starting hand, symmetric seat perks and seeds.
 * This run advances the independent duel RNG by another fixed +120000.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const modes=['baseline','release3','release4','release5','delay'];
const mode=process.env.ARCANE_V1584_MODE;
assert.ok(modes.includes(mode),'Unknown v15.84 initiative mode');
process.env.ARCANE_V1582_MODE=mode;

const original=fs.readFileSync;
let patchedSeedSource=0;
fs.readFileSync=function(file,...args){
 const source=original.call(this,file,...args);
 if(!String(file).replace(/\\/g,'/').endsWith('/ai-v1574-stomp-selfplay.cjs'))
  return source;
 const old="once('15730000+','15740000+');";
 const replacement="once('15730000+','15980000+');";
 assert.equal(source.split(old).length,2,'v15.84 independent seed anchor drift');
 patchedSeedSource++;
 return source.replace(old,replacement);
};
try{
 let script=original.call(fs,path.join(__dirname,'ai-v1582-deployment-delay.cjs'),'utf8');
 function once(needle,replacement,reason){
  assert.equal(script.split(needle).length,2,'v15.84 simulator anchor drift: '+reason);
  script=script.replace(needle,replacement);
 }
 once("const MODES=['baseline','delay','emergency50-locked','emergency50-open'];",
  "const MODES=['baseline','release3','release4','release5','delay'];",
  'only the preregistered timing arms are allowed');
 const anchor=" '  if(scene.deploymentMode===\"baseline\"||!c||!game)return base;',";
 once(anchor,anchor+'\n'+
  " '  if(scene.deploymentMode.startsWith(\"release\"))',\n"+
  " '   return base&&game.turn>=Number(scene.deploymentMode.slice(7));',",
  'attack release gate applied to real and cloned game states');
 once("'artifacts/v1582/'+match+'/'+deploymentMode",
  "'artifacts/v1584/'+match+'/'+deploymentMode",'isolated research shards');
 once("'arcane-v1582-'+match+'-'+deploymentMode+'-'",
  "'arcane-v1584-'+match+'-'+deploymentMode+'-'",'independent provenance');
 new Function('require','process','console','__dirname',script)(require,process,console,__dirname);
}finally{fs.readFileSync=original;}
assert.equal(patchedSeedSource,1,'Expected one and only one RNG seed transformation');
