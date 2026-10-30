'use strict';
// Final offline-only v17.8 causal Guardian research: same four cohorts as v17.7.
// Record pre-cap 35% counterstrike expectation alongside actual LP loss.
const assert=require('node:assert/strict');
const previous=require('./research-guardian-counter-v177.cjs');
const MODES=previous.MODES;
function mode(){const m=process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V178||'';
 if(!MODES.includes(m))throw Error('Explicit v17.8 Guardian stat cohort required');return m;}
function applies(cohort,owner,candidate){return previous.applies(cohort,owner,candidate);}
function installScript(cohort){
 if(!MODES.includes(cohort))throw Error('Unknown v17.8 cohort');
 return previous.installScript(cohort).replaceAll('__guardianV177','__guardianV178')
 .replaceAll('__researchV177','__researchV178');
}
function transformCombat(original){
 let code=previous.transformCombat(original).replaceAll('__guardianV177Combat','__guardianV178Combat');
 const attack='const actual=damagePlayer(g,p.id,counter);g.damageDealt[q.id]+=actual;';
 assert.equal(code.split(attack).length,2,'v17.8 actual-LP counterstrike anchor changed');
 code=code.replace(attack,'const beforeCounterLP=p.lp;'+attack);
 const event='g.__guardianV178Combat.counterEvents[typ][q.id]++;';
 assert.equal(code.split(event).length,2,'v17.8 actual counterstrike event anchor changed');
 const met=`
 const cm=g.__guardianV178Combat;
 if(!cm.counterRaw)cm.counterRaw={guardian:[0,0],soul:[0,0]};
 if(!cm.counterWaste)cm.counterWaste={guardian:[0,0],soul:[0,0]};
 if(!cm.counterZeroLP)cm.counterZeroLP={guardian:[0,0],soul:[0,0]};
 if(!cm.counterLowLP)cm.counterLowLP={guardian:[0,0],soul:[0,0]};
 if(!cm.counterBeforeLP)cm.counterBeforeLP={guardian:[0,0],soul:[0,0]};
 if(!cm.counterAtk)cm.counterAtk={guardian:[0,0],soul:[0,0]};
 cm.counterRaw[typ][q.id]+=counter;
 cm.counterWaste[typ][q.id]+=Math.max(0,counter-actual);
 cm.counterZeroLP[typ][q.id]+=Number(actual===0);
 cm.counterLowLP[typ][q.id]+=Number(beforeCounterLP<counter);
 cm.counterBeforeLP[typ][q.id]+=beforeCounterLP;
 cm.counterAtk[typ][q.id]+=dataOf(d).atk;
 `;
 code=code.replace(event,event+met);
 return code;
}
module.exports={MODES,mode,applies,transformCombat,installScript};
