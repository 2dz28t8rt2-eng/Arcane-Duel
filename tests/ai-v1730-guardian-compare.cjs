'use strict';
/* Matched v20.7 balance scenarios. Descriptive comparison only:
 * never transfer test outcomes to promotion or the production AI.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {MODES}=require('./helpers/research-guardian-scale-v173.cjs');
const root='artifacts/v1730',out={schema:'arcane-v1730-balance-ablation',ruleVersion:'fixed-15/90/100/120-with-current-DEF-only',
experimentalOnly:true,productionChanged:false,ruleSelectionAutoApplied:false,
modeDefinitions:{
 control100:'35% survivor-only counter (shipped Solo) and unchanged full Guardian healing',
 guardianScale:'35% survivor-only counter and exact per-active-DEF-Guardian healing schedule 100/55/40/33/28%'
 },modes:{}};
let count=0;
for(const mode of MODES){
 const at=root+'/'+mode;
 const r=JSON.parse(fs.readFileSync(at+'/report.json','utf8'));
 const s=JSON.parse(fs.readFileSync(at+'/stage-8.json','utf8'));
 assert.equal(r.totalDuels,23040);assert.equal(s.stage,8);
 const pick=({split='validation',arm,role,core})=>s.allCases.filter(x=>
  x.split===split&&x.arm===arm&&x.roleB===role&&x.focusMode===core);
 const arms=['defender-v1730-survival-control','defender-v1730-counterplay','fusion-v1730-role-economics'];
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
  researchGoal:'Replace old 85% Guardian heal experiment with number-of-DEF-Guardians-scaled healing; improve mixed Guardian/Soul synergy versus pure-Guardian mass healing',
  totalDuels:r.totalDuels,
  promotionDiagnostic:r.globalSelection.promoted,
  electedDiagnostic:r.globalSelection.arm,
  mixedRoleByOpponent:co,
  guardianHealByActiveDefCount:[0,1,2,3,4,5].map(n=>require('./helpers/research-guardian-scale-v173.cjs').fraction(n,mode)),
  trainingBondChecks:telemetry.reduce((n,x)=>n+(x.defenderBondPlacementChecks||0),0),
  trainingBondSurvivors:telemetry.reduce((n,x)=>n+(x.defenderBondSurvivingPairs||0),0),
  trainingObservedEssenceGain:telemetry.reduce((n,x)=>n+(x.defenderBondObservedEssenceGain||0),0)
 };
 count+=r.totalDuels;
}
assert.equal(count,46080);
fs.writeFileSync(root+'/balance-comparison.json',JSON.stringify(out,null,2)+'\n');
console.log('ARCANE_V1730_GUARDIAN_SCALING_ABLATION_VERIFIED '+JSON.stringify({
 games:count,variants:MODES,
 defenderSurvivalFocus:Object.fromEntries(MODES.map(m=>[m,out.modes[m].mixedRoleByOpponent['defender-v1730-survival-control']]))}));
