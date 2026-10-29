'use strict';
/* Matched v20.7 balance scenarios. Descriptive comparison only:
 * never transfer test outcomes to promotion or the production AI.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {MODES}=require('./helpers/research-guardian-causal-v174.cjs');
const root='artifacts/v1740',out={schema:'arcane-v1740-balance-ablation',ruleVersion:'fixed-15/90/100/120-with-current-DEF-only',
experimentalOnly:true,productionChanged:false,ruleSelectionAutoApplied:false,
modeDefinitions:{
 none:'35% surviving counter; all Guardians heal for 100% on both seats',
 candidateOnly:'35% surviving counter; candidate DEF Guardians heal 100/55/40/33/28%, opponent normal',
 opponentOnly:'35% surviving counter; opponent DEF Guardians heal 100/55/40/33/28%, candidate normal',
 both:'35% surviving counter; both seats have 100/55/40/33/28% scaling'
 },modes:{}};
let count=0;
for(const mode of MODES){
 const at=root+'/'+mode;
 const r=JSON.parse(fs.readFileSync(at+'/report.json','utf8'));
 const s=JSON.parse(fs.readFileSync(at+'/stage-8.json','utf8'));
 assert.equal(r.totalDuels,23040);assert.equal(s.stage,8);
 const pick=({split='validation',arm,role,core})=>s.allCases.filter(x=>
  x.split===split&&x.arm===arm&&x.roleB===role&&x.focusMode===core);
 const arms=['defender-v1740-survival-control','defender-v1740-counterplay','fusion-v1740-role-economics'];
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
  researchGoal:'Causal side-specific healing test: candidate, opponent and both sides separate; count actual DEF regeneration and independent scenarios',
  totalDuels:r.totalDuels,
  promotionDiagnostic:r.globalSelection.promoted,
  electedDiagnostic:r.globalSelection.arm,
  mixedRoleByOpponent:co,
  guardianHealByActiveDefCount:[0,1,2,3,4,5].map(n=>require('./helpers/research-guardian-causal-v174.cjs').factor(n)),
  causalCohort:mode,
  healingTelemetry:(()=>{
   const all=s.allCases.filter(x=>x.arm===arms[0]);
   const sum=(key)=>[0,1].map(owner=>Array.from({length:6},(_,n)=>
    all.reduce((v,x)=>v+(x.guardianHealMetrics?.[key]?.[owner]?.[n]||0),0)));
   const events=sum('eventsByOwner'),restored=sum('actualDefByOwner');
   const turns=sum('turnsByOwner'),prevented=sum('preventedDefByScaleByOwner');
   const cap=sum('budgetLostAtCapByOwner');
   return {games:all.length,candidateSeatBreakdown:all.reduce((d,x)=>(d[x.seat]=(d[x.seat]||0)+1,d),{}),
    turnsByOwner:turns,eventsByOwner:events,restoredDefByOwner:restored,
    preventedDefByScaleByOwner:prevented,lostAtMaxDefByOwner:cap};
  })(),
  trainingBondChecks:telemetry.reduce((n,x)=>n+(x.defenderBondPlacementChecks||0),0),
  trainingBondSurvivors:telemetry.reduce((n,x)=>n+(x.defenderBondSurvivingPairs||0),0),
  trainingObservedEssenceGain:telemetry.reduce((n,x)=>n+(x.defenderBondObservedEssenceGain||0),0)
 };
 count+=r.totalDuels;
}
// Audit winner flips using uniquely matched case keys; no fake sample independence.
const stage8ByMode=Object.fromEntries(MODES.map(mode=>[mode,
 JSON.parse(fs.readFileSync(root+'/'+mode+'/stage-8.json','utf8')).allCases]));
const key=x=>[x.stage,x.pair,x.scenario,x.starter,x.seat,x.arm].join('|');
const control=new Map(stage8ByMode.none.map(x=>[key(x),x]));
assert.equal(control.size,2304);
out.causalPaired={gamesPerCohort:control.size,uniqueScenarioSeatKeys:new Set(
 stage8ByMode.none.map(x=>[x.stage,x.pair,x.scenario,x.starter,x.seat].join('|'))).size,
 effects:{}};
for(const mode of MODES.filter(x=>x!=='none')){
 const cases=stage8ByMode[mode],seen=new Set();
 let changed=0,improved=0,worsened=0,healingPresent=0;
 for(const x of cases){
  const id=key(x),base=control.get(id);
  assert.ok(base,'unmatched causal case '+id);assert.ok(!seen.has(id),'duplicate match');seen.add(id);
  if(x.win!==base.win){changed++;if(x.win>base.win)improved++;else worsened++;}
  if(x.guardianHealMetrics?.eventsByOwner?.some(z=>z.some(v=>v>0)))healingPresent++;
 }
 assert.equal(seen.size,control.size);
 out.causalPaired.effects[mode]={winnerChanged:changed,candidateImproved:improved,
  candidateWorsened:worsened,gamesWithAnyHealing:healingPresent};
}
assert.equal(count,92160);
fs.writeFileSync(root+'/balance-comparison.json',JSON.stringify(out,null,2)+'\n');
console.log('ARCANE_V1740_CAUSAL_HEALING_ABLATION_VERIFIED '+JSON.stringify({
 games:count,variants:MODES,
 defenderSurvivalFocus:Object.fromEntries(MODES.map(m=>[m,out.modes[m].mixedRoleByOpponent['defender-v1740-survival-control']]))}));
