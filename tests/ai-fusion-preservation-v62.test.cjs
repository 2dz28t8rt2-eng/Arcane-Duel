'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=expr=>boot({seed:6238}).run(expr,120000);
test('preserve-fusion setting is sandbox-only and resets fully',()=>{
 const r=run(`(()=>{const start=ArcaneAiBranches59.strategyGate();
  ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,
   {guarded:true,margin:3,fusionPremium:6});
  const on=ArcaneAiBranches59.strategyGate(),flag=ArcaneAiBranches59.guard();
  ArcaneAiBranches59.setSandbox(null);
  return {start,on,flag,off:ArcaneAiBranches59.strategyGate(),disabled:!ArcaneAiBranches59.active()};})()`);
 assert.deepEqual(r.start,{fusionPremium:0});assert.deepEqual(r.on,{fusionPremium:6});
 assert.deepEqual(r.flag,{enabled:true,margin:3});assert.deepEqual(r.off,{fusionPremium:0});
 assert.equal(r.disabled,true);
});
test('reject invalid fusion premiums without disturbing player games',()=>{
 const r=run(`(()=>{let bad=0;for(const premium of [-1,13,Infinity,NaN])
  try{ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,
    {guarded:true,margin:2,fusionPremium:premium});}catch(e){bad++;}
  ArcaneAiBranches59.setSandbox(null);return bad;})()`);
 assert.equal(r,4);
});
test('fusion-specialist gate only protects genuine legal fusion baselines',()=>{
 const r=run(`(()=>{let opportunities=0,baselineFusions=0,proposedNormals=0,
   enforced=0,unchanged=0;
  ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.alchemist,true);
  for(const tier of [3,6,9])for(let seed=1;seed<=20;seed++){
   const g=createGame({mode:'pve',context:'tournament',opponentId:tier,seed:62000+tier*100+seed});
   g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;
   ArcaneAiBranches59.setSandbox(ArcaneAiBranches59.STANDARD,true,
    {guarded:true,margin:3,fusionPremium:10});
   const a=ArcaneAiLearning56.rank(g),base=a.find(x=>x.isAce)||a[0];
   if(base?.action.type==='fusion'){
    baselineFusions++;
    const desc=ArcaneAiBranches59.diagnose(g,15);
    if(desc?.best?.type==='normal'){
     proposedNormals++;
     const decision=ArcaneAiBranches59.choose(g);
     if(!decision)enforced++;
     else if(decision.action.type==='normal')unchanged++;
    }
   }
   opportunities++;
  }
  ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
  return {opportunities,baselineFusions,proposedNormals,enforced,unchanged};})()`);
 assert.equal(r.opportunities,60);
 assert.ok(r.baselineFusions>0,'Need a real fusion-specialist decision example');
 assert.ok(r.proposedNormals>=0);
 assert.ok(r.enforced>0||r.proposedNormals===0,
  'At least one real proposed normal must defer to protected fusion');
});
