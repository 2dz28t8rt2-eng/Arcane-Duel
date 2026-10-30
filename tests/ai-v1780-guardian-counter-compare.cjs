'use strict';
/* Matched v20.7 balance scenarios. Descriptive comparison only:
 * never transfer test outcomes to promotion or the production AI.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const MODES=require('./helpers/research-guardian-counter-v178.cjs').MODES;
const root='artifacts/v1780',out={schema:'arcane-v1780-balance-ablation',ruleVersion:'fixed-15/90/100/120-with-current-DEF-only',
experimentalOnly:true,productionChanged:false,ruleSelectionAutoApplied:false,
modeDefinitions:{
 control:'All normal Guardian templates keep original catalog stats; 35% survival counter, full healing',
 both22:'95% pool and 22/78 for both sides',
 candidate22:'95% pool and 22/78 only for the candidate seat',
 opponent22:'95% pool and 22/78 only for the opponent seat'
 },modes:{}};
let count=0;
for(const mode of MODES){
 const at=root+'/'+mode;
 const r=JSON.parse(fs.readFileSync(at+'/report.json','utf8'));
 const s=JSON.parse(fs.readFileSync(at+'/stage-8.json','utf8'));
 assert.equal(r.totalDuels,23040);assert.equal(s.stage,8);
 const pick=({split='validation',arm,role,core})=>s.allCases.filter(x=>
  x.split===split&&x.arm===arm&&x.roleB===role&&x.focusMode===core);
 const arms=['defender-v1780-survival-control','defender-v1780-counterplay','fusion-v1780-role-economics'];
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
  researchGoal:'Side-isolated 22/78 Guardian stats, actual counterstrike LP, defender survival under identical seats/seeds',
  totalDuels:r.totalDuels,
  promotionDiagnostic:r.globalSelection.promoted,
  electedDiagnostic:r.globalSelection.arm,
  mixedRoleByOpponent:co,
  guardianHealing:'unchanged 100% per DEF Guardian',
  statSpec:mode==='control'?{pool:1}:{pool:.95,atkShare:.22},
  statCohort:mode,
  observedCounterAndSurvival:(()=>{
   const cs=s.allCases.filter(x=>x.arm===arms[0]);
   const total={games:cs.length,candidate:{hits:0,survived:0,destroyed:0,counterLP:0,counterEvents:0,counterRaw:0,counterWaste:0,counterZeroLP:0,counterAtk:0},opponent:{hits:0,survived:0,destroyed:0,counterLP:0,counterEvents:0,counterRaw:0,counterWaste:0,counterZeroLP:0,counterAtk:0},affected:[0,0],atkDelta:[0,0],defDelta:[0,0]};
   for(const x of cs){const met=x.guardianV178Combat,setup=x.guardianV178Setup;
    if(!setup)throw Error('v17.7 per-duel stat overlay telemetry missing');
    for(let seat=0;seat<2;seat++){const dest=seat===x.seat?total.candidate:total.opponent;
     if(met){dest.hits+=met.hits[seat].guardian;dest.survived+=met.survived[seat].guardian;
      dest.destroyed+=met.destroyed[seat].guardian;dest.counterLP+=met.counter.guardian[seat];
      dest.counterEvents+=met.counterEvents.guardian[seat];
      dest.counterRaw+=met.counterRaw?.guardian[seat]||0;
      dest.counterWaste+=met.counterWaste?.guardian[seat]||0;
      dest.counterZeroLP+=met.counterZeroLP?.guardian[seat]||0;
      dest.counterAtk+=met.counterAtk?.guardian[seat]||0;}
     total.affected[seat]+=setup.adjusted[seat];total.atkDelta[seat]+=setup.atkDelta[seat];total.defDelta[seat]+=setup.defDelta[seat];
    }
   }
   return total;
  })(),
  observedCounterBySplit:(()=>{
   const cs=s.allCases.filter(x=>x.arm===arms[0]);
   const out={train:{},validation:{},holdout:{}};
   for(const x of cs){
    const row=out[x.split],met=x.guardianV178Combat,seat=x.seat;
    for(const [name,owner] of [['candidate',seat],['opponent',1-seat]]){
     const v=row[name]||(row[name]={games:0,counterEvents:0,counterRaw:0,counterLP:0,counterWaste:0,
      survivorHits:0,destroyedHits:0,rawOverActualGames:0});
     v.games++;if(!met)continue;
     const raw=met.counterRaw?.guardian[owner]||0,real=met.counter.guardian[owner];
     v.counterEvents+=met.counterEvents.guardian[owner];
     v.counterRaw+=raw;v.counterLP+=real;v.counterWaste+=Math.max(0,raw-real);
     v.survivorHits+=met.survived[owner].guardian;
     v.destroyedHits+=met.destroyed[owner].guardian;
     v.rawOverActualGames+=Number(raw>real);
    }
   }
   return out;
  })(),
  realAttacks:JSON.parse(fs.readFileSync(at+'/attack-telemetry.json','utf8')),
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
const control=new Map(stage8ByMode.control.map(x=>[key(x),x]));
assert.equal(control.size,2304);
out.causalPaired={gamesPerCohort:control.size,uniqueScenarioSeatKeys:new Set(
 stage8ByMode.control.map(x=>[x.stage,x.pair,x.scenario,x.starter,x.seat].join('|'))).size,
 effects:{}};
for(const mode of MODES.filter(x=>x!=='control')){
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
console.log('ARCANE_V1780_GUARDIAN_STATS_ABLATION_VERIFIED '+JSON.stringify({
 games:count,variants:MODES,
 defenderSurvivalFocus:Object.fromEntries(MODES.map(m=>[m,out.modes[m].mixedRoleByOpponent['defender-v1780-survival-control']]))}));
