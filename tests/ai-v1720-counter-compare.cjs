'use strict';
/* Matched v20.7 balance scenarios. Descriptive comparison only:
 * never transfer test outcomes to promotion or the production AI.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {MODES}=require('./helpers/research-counterstrike-v172.cjs');
const root='artifacts/v1720',out={schema:'arcane-v1720-balance-ablation',ruleVersion:'fixed-15/90/100/120-with-current-DEF-only',
experimentalOnly:true,productionChanged:false,ruleSelectionAutoApplied:false,
modeDefinitions:{
 legacy50:'Historical 50% counter, even when Defender dies; 100% Guardian healing, 15/90/100/120 roles',
 survivor35:'Shipped 35% counter only on survival; 100% Guardian healing, 15/90/100/120 roles',
 survivor35Heal85:'Shipped 35% counter only on survival; 85% Guardian-to-Guardian, 100% Guardian-to-Soul healing, 15/90/100/120 roles'
 },modes:{}};
let count=0;
for(const mode of MODES){
 const at=root+'/'+mode;
 const r=JSON.parse(fs.readFileSync(at+'/report.json','utf8'));
 const s=JSON.parse(fs.readFileSync(at+'/stage-8.json','utf8'));
 assert.equal(r.totalDuels,23040);assert.equal(s.stage,8);
 const pick=({split='validation',arm,role,core})=>s.allCases.filter(x=>
  x.split===split&&x.arm===arm&&x.roleB===role&&x.focusMode===core);
 const arms=['defender-v1720-survival-control','defender-v1720-counterplay','fusion-v1720-role-economics'];
 const co={};
 for(const arm of arms){
  co[arm]={};
  for(const role of ['predator','fusion']){
   co[arm][role]={};
   for(const core of ['guardian-core','mixed-50','soul-core']){
    const a=pick({arm,role,core});
    co[arm][role][core]={games:a.length,wins:a.reduce((n,x)=>n+x.win,0),
     seat0:a.filter(x=>x.seat===0).reduce((n,x)=>n+x.win,0),
     seat1:a.filter(x=>x.seat===1).reduce((n,x)=>n+x.win,0)};
   }
  }
 }
 const telemetry=s.allCases.filter(x=>x.arm===arms[0]&&x.split==='train');
 out.modes[mode]={
  researchGoal:'Reduce disposable Defender counter damage while retaining viable Guardian/Soul mixed compositions vs Predator and Fusion',
  totalDuels:r.totalDuels,
  promotionDiagnostic:r.globalSelection.promoted,
  electedDiagnostic:r.globalSelection.arm,
  mixedRoleByOpponent:co,
  counterRules:require('./helpers/research-counterstrike-v172.cjs').tuning(mode),
  trainingBondChecks:telemetry.reduce((n,x)=>n+(x.defenderBondPlacementChecks||0),0),
  trainingBondSurvivors:telemetry.reduce((n,x)=>n+(x.defenderBondSurvivingPairs||0),0),
  trainingObservedEssenceGain:telemetry.reduce((n,x)=>n+(x.defenderBondObservedEssenceGain||0),0)
 };
 count+=r.totalDuels;
}
assert.equal(count,69120);
fs.writeFileSync(root+'/balance-comparison.json',JSON.stringify(out,null,2)+'\n');
console.log('ARCANE_V1720_COUNTERSTRIKE_ABLATION_VERIFIED '+JSON.stringify({
 games:count,variants:MODES,
 defenderSurvivalFocus:Object.fromEntries(MODES.map(m=>[m,out.modes[m].mixedRoleByOpponent['defender-v1720-survival-control']]))}));
