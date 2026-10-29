'use strict';
/* v17.4: causal Guardian healing, candidate-vs-opponent assigned by sceneResult seat.
 * None / candidate only / opponent only / both; all other rules are held fixed.
 * Instrument ACTUAL turn-transition healing, not projected stats alone.
 */
const assert=require('node:assert/strict');
const MODES=Object.freeze(['none','candidateOnly','opponentOnly','both']);
const RATE=Object.freeze([0,1,.55,.40,.33,.28]);
function mode(){const v=process.env.ARCANE_RESEARCH_GUARDIAN_CAUSAL_V174||'';
 if(!MODES.includes(v))throw Error('v17.4 requires explicit causal healing cohort');
 return v;
}
function factor(n){if(!Number.isInteger(n)||n<0||n>5)throw Error('Guardian count 0..5 required');return RATE[n];}
function reduced(cohort,owner,candidateSeat){
 if(!MODES.includes(cohort)||![0,1].includes(owner)||![0,1].includes(candidateSeat))
  throw Error('v17.4 valid mode, owner and candidate seat required');
 return cohort==='both'||(cohort==='candidateOnly'&&owner===candidateSeat)||
  (cohort==='opponentOnly'&&owner!==candidateSeat);
}
function swapOnce(s,a,b,name){assert.equal(s.split(a).length,2,'v17.4 healing anchor invalid: '+name);return s.replace(a,b);}
function transform(src,cohort){
 if(!MODES.includes(cohort))throw Error('Invalid v17.4 mode');
 const anchor="for(const guardian of team.filter(c=>roleOf(c)==='guardian'&&c.mode==='def')){";
 const heal="const layer=statLayer(ally),amount=Math.min(150,25+dataOf(guardian).level*12);";
 const after="const before=ally.card.def;ally.card.def=Math.min(layer.maxDef,ally.card.def+amount);";
 assert.equal(src.split(anchor).length,2,'guardian loop changed');
 assert.equal(src.split(heal).length,2,'healing formula changed');
 assert.equal(src.split(after).length,2,'heal application changed');
 assert.ok(src.includes("const allies=team.filter(c=>isDefender(c)&&c.mode==='def');"));
 assert.ok(src.includes("if(ally===guardian||!ally.card)continue;"));
 const init=`const healingGuardians=team.filter(c=>roleOf(c)==='guardian'&&c.mode==='def');
   const guardianCount=Math.min(5,healingGuardians.length);
   const candidateSeat=g.strategicTraining?.researchHealCandidateSeat;
   if(candidateSeat!==0&&candidateSeat!==1)throw Error('v17.4 missing candidateSeat in full-match runtime');
   const scaled=(${JSON.stringify(cohort)}==='both')||
    (${JSON.stringify(cohort)}==='candidateOnly'&&owner===candidateSeat)||
    (${JSON.stringify(cohort)}==='opponentOnly'&&owner!==candidateSeat);
   const guardianHealScale=scaled?[0,1,.55,.40,.33,.28][guardianCount]:1;
   const metrics=g.__researchGuardianHealMetrics||(g.__researchGuardianHealMetrics={
    turnsByOwner:[Array(6).fill(0),Array(6).fill(0)],
    eventsByOwner:[Array(6).fill(0),Array(6).fill(0)],
    actualDefByOwner:[Array(6).fill(0),Array(6).fill(0)],
    possibleUnscaledDefByOwner:[Array(6).fill(0),Array(6).fill(0)],
    preventedDefByScaleByOwner:[Array(6).fill(0),Array(6).fill(0)],
    budgetLostAtCapByOwner:[Array(6).fill(0),Array(6).fill(0)],
    soulActualDefByOwner:[0,0],guardianActualDefByOwner:[0,0]
   });
   metrics.turnsByOwner[owner][guardianCount]++;
   for(const guardian of healingGuardians){`;
 src=swapOnce(src,anchor,init,'per-turn healer count');
 src=swapOnce(src,heal,
  'const layer=statLayer(ally),baseHeal=Math.min(150,25+dataOf(guardian).level*12),amount=Math.floor(baseHeal*guardianHealScale);',
  'scaled base per real healer');
 src=swapOnce(src,after,
  `const before=ally.card.def;
     const missing=Math.max(0,layer.maxDef-before),availableWithoutScale=Math.min(missing,baseHeal);
     ally.card.def=Math.min(layer.maxDef,ally.card.def+amount);
     const actual=Math.max(0,ally.card.def-before);
     metrics.eventsByOwner[owner][guardianCount]++;
     metrics.actualDefByOwner[owner][guardianCount]+=actual;
     metrics.possibleUnscaledDefByOwner[owner][guardianCount]+=availableWithoutScale;
     metrics.preventedDefByScaleByOwner[owner][guardianCount]+=Math.max(0,availableWithoutScale-actual);
     metrics.budgetLostAtCapByOwner[owner][guardianCount]+=Math.max(0,baseHeal-availableWithoutScale);
     if(roleOf(ally)==='soul')metrics.soulActualDefByOwner[owner]+=actual;
     else if(roleOf(ally)==='guardian')metrics.guardianActualDefByOwner[owner]+=actual;`,
  'record real healing and DEF cap');
 return src;
}
module.exports={MODES,RATE,mode,factor,reduced,transform};
