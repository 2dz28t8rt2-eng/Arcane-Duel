'use strict';
/* Offline-only v17.6 Guardian card balance test: -5% pool with 22% or 20% ATK.
 * NO change to live assets, fusion/ACE/Essence, or non-Guardian roles.
 */
const assert=require('node:assert/strict');
const MODES=Object.freeze(['control','guardian22','guardian20']);
const SPECS=Object.freeze({control:Object.freeze({budget:1,atkShare:null}),
 guardian22:Object.freeze({budget:.95,atkShare:.22}),
 guardian20:Object.freeze({budget:.95,atkShare:.20})});
function mode(){const m=process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V176||'';
 if(!MODES.includes(m))throw Error('Explicit v17.6 Guardian stat cohort required');
 return m;
}
function eligible(c){return !!c&&c.role==='guardian'&&c.rpg===true&&!c.retired&&
 !c.fusionOnly&&!c.essenceMonster&&!c.ace&&
 Number.isInteger(c.level)&&c.level>=1&&c.level<=10;}
function round10(x){return Math.round(x/10)*10;}
function reweight(c,variant){
 if(!MODES.includes(variant))throw Error('Invalid Guardian stat variant');
 if(!eligible(c)||variant==='control')return null;
 const beforeAtk=c.atk,beforeDef=c.def,oldPool=beforeAtk+beforeDef;
 if(!Number.isFinite(oldPool)||oldPool<160||beforeAtk<0||beforeDef<0)
  throw Error('Unusable Guardian template stat pool');
 const pool=round10(oldPool*SPECS[variant].budget);
 const floor=Math.min(80,Math.floor(pool/20)*10);
 const targetAtk=Math.max(floor,Math.min(pool-floor,round10(pool*SPECS[variant].atkShare)));
 const atk=Math.min(beforeAtk,targetAtk),def=pool-atk;
 if(atk<floor||def<floor||atk>beforeAtk||atk+def!==pool)
  throw Error('Illegal v17.6 stat distribution');
 return {atk,def,oldPool,newPool:pool,atkReduced:beforeAtk-atk,defChange:def-beforeDef};
}
function transform(src,variant){
 if(!MODES.includes(variant))throw Error('Invalid Guardian stat variant');
 const anchor="const SAVE_KEY='arcane-duel-rpg-profile-v4-reborn'";
 assert.equal(src.split(anchor).length,2,'v17.6 post-catalog overlay anchor missing');
 if(variant==='control')return src;
 const injection=[
  '// TEST SIMULATOR ONLY: Guardian stat pool and reweighting v17.6',
  'window.__arcaneResearchGuardianStatsApply=function(){',
  'const __arcaneResearchGuardianStats={cohort:'+JSON.stringify(variant)+',changed:0,unchangedAtk:0,oldAtk:0,newAtk:0,oldDef:0,newDef:0,changedIds:[]};',
  'for(const __card of CARDS){',
  " if(!__card||__card.role!=='guardian'||!__card.rpg||__card.retired||__card.fusionOnly||__card.essenceMonster||__card.ace||",
  '  !Number.isInteger(__card.level)||__card.level<1||__card.level>10)continue;',
  ' const __originalAtk=__card.atk,__originalDef=__card.def;',
  ' const __oldPool=__originalAtk+__originalDef;',
  ' const __pool=round10(__oldPool*.95);',
  ' const __min=Math.min(80,Math.floor(__pool/20)*10);',
  ' const __targetAtk=Math.max(__min,Math.min(__pool-__min,round10(__pool*'+SPECS[variant].atkShare+')));',
  ' const __newAtk=Math.min(__originalAtk,__targetAtk);',
  ' const __newDef=__pool-__newAtk;',
  " if(__newAtk<__min||__newDef<__min||__newAtk>__originalAtk||__pool!==__newAtk+__newDef)throw Error('Illegal test Guardian stat distribution');",
  ' __arcaneResearchGuardianStats.changed++;',
  ' __arcaneResearchGuardianStats.unchangedAtk+=Number(__newAtk===__originalAtk);',
  ' __arcaneResearchGuardianStats.oldAtk+=__originalAtk;',
  ' __arcaneResearchGuardianStats.newAtk+=__newAtk;',
  ' __arcaneResearchGuardianStats.oldDef+=__originalDef;',
  ' __arcaneResearchGuardianStats.newDef+=__newDef;',
  ' __arcaneResearchGuardianStats.changedIds.push(__card.id);',
  ' __card.atk=__newAtk;__card.def=__newDef;',
  '}',
  'window.__arcaneResearchGuardianStats=__arcaneResearchGuardianStats;',
  '};',
 ].join('\n');
 return src.replace(anchor,injection+'\n'+anchor);
}
module.exports={MODES,SPECS,mode,eligible,reweight,transform};
