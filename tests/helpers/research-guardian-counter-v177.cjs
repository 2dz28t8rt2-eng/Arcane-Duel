'use strict';
const assert=require('node:assert/strict');
const MODES=Object.freeze(['control','both22','candidate22','opponent22']);
function mode(){const m=process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V177||'';
 if(!MODES.includes(m))throw Error('Explicit v17.7 Guardian stat cohort required');
 return m;
}
function applies(cohort,owner,candidate){
 if(!MODES.includes(cohort)||![0,1].includes(owner)||![0,1].includes(candidate))throw Error('Invalid side');
 return cohort==='both22'||cohort==='candidate22'&&owner===candidate||cohort==='opponent22'&&owner!==candidate;
}
function transformCombat(src){
 const anchor="if(isDefender(d)&&!immuneBefore&&!endDefense&&q.field[di]===d){";
 const counter="const actual=damagePlayer(g,p.id,counter);g.damageDealt[q.id]+=actual;";
 const destroyed="if(endDefense){q.graveyard.push(d);q.field[di]=null;destroyed.push(q.id+':'+di);}";
 for(const [a,n] of [[anchor,'surviving defender'],[counter,'counterstrike'],[destroyed,'destroyed defender']])
  assert.equal(src.split(a).length,2,'v17.7 game source anchor changed: '+n);
 src=src.replace(destroyed,[
  "if(isDefender(d)&&!immuneBefore){",
  " const met=g.__guardianV177Combat||(g.__guardianV177Combat={hits:[{guardian:0,soul:0},{guardian:0,soul:0}],survived:[{guardian:0,soul:0},{guardian:0,soul:0}],destroyed:[{guardian:0,soul:0},{guardian:0,soul:0}],counter:{guardian:[0,0],soul:[0,0]},counterEvents:{guardian:[0,0],soul:[0,0]},defAfterHit:{guardian:[0,0],soul:[0,0]}});",
  " const typ=roleOf(d)==='guardian'?'guardian':'soul';",
  " met.hits[q.id][typ]++;",
  " met.defAfterHit[typ][q.id]+=Math.max(0,d.card?.def||0);",
  " if(endDefense)met.destroyed[q.id][typ]++;else met.survived[q.id][typ]++;",
  "}",
  destroyed
 ].join('\n'));
 src=src.replace(counter,[
  counter,
  "if(g.__guardianV177Combat){const typ=roleOf(d)==='guardian'?'guardian':'soul';",
  " g.__guardianV177Combat.counter[typ][q.id]+=actual;",
  " g.__guardianV177Combat.counterEvents[typ][q.id]++;",
  "}"
 ].join('\n'));
 return src;
}
const scriptLines=["(function(){"," const COHORT=__COHORT__;"," const originalNewInstance=newInstance;"," function reweightTemplate(model){","  if(!model||model.role!=='guardian'||!model.rpg||model.fusionOnly||model.ace||model.essenceMonster||model.retired||!Number.isInteger(model.level)||model.level<1||model.level>10)return null;","  const pool=round10((model.atk+model.def)*.95);","  const floor=Math.min(80,model.atk,Math.floor(pool/20)*10);","  const target=Math.max(floor,Math.min(pool-floor,round10(pool*.22)));","  const atk=Math.min(model.atk,target),def=pool-atk;","  if(atk<floor||def<floor||atk>model.atk)throw Error('Invalid v17.7 guardian model '+model.id);","  return {atk,def};"," }"," function apply(g,c,owner){","  if(!c||!c.card||c.__researchV177StatsDone||!g?.__guardianV177Setup)return c;","  const candidate=g.__guardianV177Setup.candidateSeat;","  const allowed=COHORT==='both22'||COHORT==='candidate22'&&owner===candidate||COHORT==='opponent22'&&owner!==candidate;","  if(!allowed)return c;","  const model=CARDS[c.id],newStats=reweightTemplate(model);if(!newStats)return c;","  const scale=g.players[owner]?.power||1;","  const atkBefore=c.card.atk,defBefore=c.card.def;","  c.card.atk=Math.max(0,round10(atkBefore+(newStats.atk-model.atk)*scale));","  c.card.def=Math.max(0,round10(defBefore+(newStats.def-model.def)*scale));","  c.__researchV177StatsDone=true;","  g.__guardianV177Setup.adjusted[owner]++;","  g.__guardianV177Setup.atkDelta[owner]+=c.card.atk-atkBefore;","  g.__guardianV177Setup.defDelta[owner]+=c.card.def-defBefore;","  return c;"," }"," newInstance=function(g,id,owner=g.active){return apply(g,originalNewInstance(g,id,owner),owner);};"," window.__guardianV177StartGame=function(g,candidateSeat){","  if(![0,1].includes(candidateSeat)||g.__guardianV177Setup)throw Error('Invalid/repeated v17.7 game setup');","  g.__guardianV177Setup={cohort:COHORT,candidateSeat,adjusted:[0,0],atkDelta:[0,0],defDelta:[0,0]};","  for(let owner=0;owner<2;owner++){const p=g.players[owner];","   for(const zone of [p.hand,p.field,p.graveyard])for(const c of zone)if(c)apply(g,c,owner);","  }","  return g.__guardianV177Setup;"," };"," window.__guardianV177Info=function(){return {cohort:COHORT,installed:true};};","})();"];
function installScript(cohort){
 if(!MODES.includes(cohort))throw Error('Invalid v17.7 cohort');
 return scriptLines.join('\n').replace('__COHORT__',JSON.stringify(cohort));
}
module.exports={MODES,mode,applies,transformCombat,installScript};
