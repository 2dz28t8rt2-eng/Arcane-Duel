'use strict';
/* v14.9.26: Fitted research priors from PREVIOUS v14.9.25 TRAIN-ONLY self-play,
 * not a causal effect estimate, and NEVER from holdout data. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const dir='/tmp/arcane-history/v1525',out='artifacts/v1526';
fs.mkdirSync(out,{recursive:true});
const samples=[];
for(let i=0;i<5;i++){
 const v=JSON.parse(fs.readFileSync(dir+'/stage-'+i+'-train-actions.json','utf8'));
 assert.equal(v.stage,i);
 for(const r of v.examples){
  if(r.arm!=='symmetric-reference')continue; // no winner-selected policy bias
  assert.ok(r.win===0||r.win===1);
  const actions=r.actions||[];
  const summons=actions.filter(a=>a.type==='normal');
  const fusions=actions.filter(a=>a.type==='fusion');
  const attacks=actions.filter(a=>a.type==='attack');
  const observed=actions.filter(a=>['normal','fusion','attack','switch'].includes(a.type));
  const guarded=summons.filter(a=>['guardian','soul'].includes(a.actorRole)).length;
  const boards=actions.filter(a=>Array.isArray(a.ownRoles)&&a.ownRoles.length>0);
  const supported=boards.filter(a=>a.ownRoles.some(role=>['guardian','soul'].includes(role))).length;
  samples.push({win:r.win,stage:i,guarded:guarded/Math.max(1,summons.length),
   boardSupport:supported/Math.max(1,boards.length),
   fusionRate:fusions.length/Math.max(1,observed.length),
   attackRate:attacks.length/Math.max(1,observed.length)});
 }
}
assert.ok(samples.length>=400&&samples.length<=500,'Unexpected historical TRAIN examples');
const winners=samples.filter(r=>r.win),losers=samples.filter(r=>!r.win);
assert.ok(winners.length>100&&losers.length>100,'Insufficient winners and losers');
const avg=(a,k)=>a.reduce((s,x)=>s+x[k],0)/a.length;
const diff=k=>avg(winners,k)-avg(losers,k);
const clamp=(v,a,b)=>Math.round(Math.max(a,Math.min(b,v))*1000)/1000;
const weights={
 support:clamp(1+(diff('guarded')*.45+diff('boardSupport')*.55),.78,1.4),
 reserve:clamp(1-diff('fusionRate')*.85,.78,1.4),
 breach:clamp(1+diff('attackRate')*.45,.8,1.3)
};
assert.ok(Object.values(weights).every(Number.isFinite));
const result={
 schema:'arcane-v1526-observational-selfplay-priors',
 source:39937859539,sourceStageRange:[0,1,2,3,4],
 inputArm:'symmetric-reference',samples:samples.length,
 winners:winners.length,losers:losers.length,holdoutUsed:false,
 fitting:'bounded win/loss action-association on game-normalized public TRAIN actions only',
 caveat:'Correlations do NOT prove causal improvement. New weights require paired train win gate and independent holdout.',
 differences:Object.fromEntries(['guarded','boardSupport','fusionRate','attackRate'].map(k=>[k,diff(k)])),
 weights
};
fs.writeFileSync(out+'/selfplay-priors.json',JSON.stringify(result,null,2)+'\n');
console.log('ARCANE_V1526_SELFPLAY_PRIORS '+JSON.stringify(result));
