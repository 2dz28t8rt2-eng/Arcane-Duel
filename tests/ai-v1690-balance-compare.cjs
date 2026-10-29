'use strict';
/* Matched v20.7 balance scenarios. Descriptive comparison only:
 * never transfer test outcomes to promotion or the production AI.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {MODES}=require('./helpers/research-role-balance-v169.cjs');
const root='artifacts/v1690',out={schema:'arcane-v1690-balance-ablation',ruleVersion:'latest-live-rules-v20.7-plus-DEF-only',
experimentalOnly:true,productionChanged:false,ruleSelectionAutoApplied:false,
modeDefinitions:{
 control10:'10pp Predator piercing, 100% neutral Soul drain vs every nonfusion target',
 predator15:'15pp Predator piercing, unchanged 100% Soul drain',
 predator15Fusion20:'15pp Predator piercing, 120% real Fusion Soul drain, 100% other',
 predator10Triad80:'10pp Predator piercing, 80% Predator/100% Defender/120% Fusion real drain',
 predator15Triad90:'15pp Predator piercing, 90% Predator/100% Defender/120% Fusion real drain',
 predator15Triad80:'15pp Predator piercing, 80% Predator/100% Defender/120% Fusion real drain'
 },modes:{}};
let count=0;
for(const mode of MODES){
 const at=root+'/'+mode;
 const r=JSON.parse(fs.readFileSync(at+'/report.json','utf8'));
 const s=JSON.parse(fs.readFileSync(at+'/stage-8.json','utf8'));
 assert.equal(r.totalDuels,23040);assert.equal(s.stage,8);
 const pick=({split='validation',arm,role,core})=>s.allCases.filter(x=>
  x.split===split&&x.arm===arm&&x.roleB===role&&x.focusMode===core);
 const arms=['defender-v1690-survival-control','defender-v1690-counterplay','fusion-v1690-role-economics'];
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
  researchGoal:'Predator competitive, not dominant vs Guardian/Soul (evaluate only, do not auto-balance)',
  totalDuels:r.totalDuels,
  promotionDiagnostic:r.globalSelection.promoted,
  electedDiagnostic:r.globalSelection.arm,
  mixedRoleByOpponent:co,
  trainingBondChecks:telemetry.reduce((n,x)=>n+(x.defenderBondPlacementChecks||0),0),
  trainingBondSurvivors:telemetry.reduce((n,x)=>n+(x.defenderBondSurvivingPairs||0),0),
  trainingObservedEssenceGain:telemetry.reduce((n,x)=>n+(x.defenderBondObservedEssenceGain||0),0)
 };
 count+=r.totalDuels;
}
assert.equal(count,138240);
fs.writeFileSync(root+'/balance-comparison.json',JSON.stringify(out,null,2)+'\n');
console.log('ARCANE_V1690_ABLATION_VERIFIED '+JSON.stringify({
 games:count,variants:MODES,
 defenderSurvivalFocus:Object.fromEntries(MODES.map(m=>[m,out.modes[m].mixedRoleByOpponent['defender-v1690-survival-control']]))}));
