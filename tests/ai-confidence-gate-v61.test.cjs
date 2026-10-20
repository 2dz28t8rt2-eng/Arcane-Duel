'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const evaluate=code=>boot({seed:61241}).run(code,120000);
test('confidence gate defaults to OFF and resets completely',()=>{
 const r=evaluate(`(()=>{const old=ArcaneAiBranches59.guard();
 ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,{guarded:true,margin:4});
 const enabled=ArcaneAiBranches59.guard();
 ArcaneAiBranches59.setSandbox(null);
 return {old,enabled,after:ArcaneAiBranches59.guard(),active:ArcaneAiBranches59.active()};})()`);
 assert.deepEqual(r.old,{enabled:false,margin:0});
 assert.deepEqual(r.enabled,{enabled:true,margin:4});
 assert.deepEqual(r.after,{enabled:false,margin:0});
 assert.equal(r.active,false);
});
test('invalid margin cannot be enabled',()=>{
 const r=evaluate(`(()=>{let invalid=0;
 for(const bad of [-1,26,NaN,Infinity]){
  try{ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,
   {guarded:true,margin:bad});}catch(e){invalid++;}
 }
 ArcaneAiBranches59.setSandbox(null);
 return invalid;})()`);
 assert.equal(r,4);
});
test('gated mode delegates combat phases back to the proven baseline',()=>{
 const r=evaluate(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:6,seed:61911});
  g.active=1;g.aiPhase='attacks';g.pending=null;
  ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.balanced,true);
  ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,{guarded:true,margin:3});
  const result=ArcaneAiBranches59.choose(g);
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
  return result;})()`);
 assert.equal(r,null);
});
test('large fallback threshold never forces worse simulated summon',()=>{
 const r=evaluate(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:3,seed:61241});
  g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;
  ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.balanced,true);
  ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,{guarded:true,margin:25});
  const baseline=ArcaneAiLearning56.rank(g);
  const choice=ArcaneAiBranches59.choose(g);
  const valid=!choice||baseline.some(x=>JSON.stringify(x.action)===JSON.stringify(choice.action))||
    ArcaneAiBranches59.candidates(g).some(x=>JSON.stringify(x.action)===JSON.stringify(choice.action));
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
  return {valid,hasOptions:baseline.length>0};})()`);
 assert.equal(r.valid,true);assert.equal(r.hasOptions,true);
});
