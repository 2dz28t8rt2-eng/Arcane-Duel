'use strict';
/* Research-only, predeclared causal scoring A/B. TRAIN+VALIDATION select;
 * the sealed HOLDOUT is observed only after that choice has been frozen.
 * Do NOT reuse v15.73's six-arm auto-promotion gate for this focused study.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {MODES}=require('./helpers/ai-counterplay-v1575.cjs');
const root='artifacts/v1575',stages=[2,9,10];
const challenger='fusion-v1574-stomp-conscious';
const frozen=['guardian-champion','fusion-sequence-2ply',
 'l10-guarded-worst-reply','defender-v1573-survival-control',
 'defender-v1573-counterplay'];
const metrics=['stompAttackEvaluations','stompSplashKills','stompSplashChip',
 'stompFatigueCosts','stompPredatorWindows','realCandidateStomps',
 'realOpponentStomps','realCandidateSplashHits','realCandidateSplashKills',
 'realCandidateSplashDefLost','realCandidateSplashCounterLP',
 'realCandidateAttackFatigueAtk','realCandidateAttackFatigueDef',
 'realPredatorFusionAttacks','realPredatorFusionKills',
 'realOpponentPredatorKillsCandidateFusion','stompReplySearchTrials',
 'stompReplySearchKills','stompPredatorFusionEvaluations'];
const key=c=>[c.stage,c.pair,c.scenario,c.starter,c.seat,c.roleA,c.roleB].join('|');
const sum=(rows,name)=>rows.reduce((n,c)=>n+(Number(c[name])||0),0);
const picked=(c,s)=>c.filter(x=>x.split===s);
function summary(rows){
 const n=rows.length;
 return {games:n,wins:sum(rows,'win'),winRate:n?sum(rows,'win')/n:null,
  timeouts:rows.filter(x=>x.timeout).length,
  meanTurns:n?sum(rows,'turn')/n:null,
  seats:Object.fromEntries([0,1].map(seat=>{
   const a=rows.filter(x=>x.seat===seat);
   return [seat,{games:a.length,wins:sum(a,'win')}];
  })),
  actual:Object.fromEntries(metrics.filter(x=>x.startsWith('real')).map(x=>[x,sum(rows,x)])),
  forecasts:Object.fromEntries(metrics.filter(x=>!x.startsWith('real')).map(x=>[x,sum(rows,x)])),
  largeFusions:Object.fromEntries([3,4,5].map(size=>[size,rows.reduce((n,x)=>
   n+(x.multiFusionChosenBySize?.[size]||0),0)]))};
}
const all=new Map(), stageAudit=[];
for(const mode of MODES){
 const rows=[];
 for(const stage of stages){
  const file=path.join(root,mode,'stage-'+stage+'.json');
  assert.ok(fs.existsSync(file),'Missing predeclared research stage '+file);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(data.stage,stage);assert.ok(data.controls?.holdoutNeverUsedForSelection);
  const expected=stage===2?1152:2304;
  assert.equal(data.allCases.length,expected,'Stage size changed');
  for(const c of data.allCases){
   assert.ok([...frozen,challenger].includes(c.arm),'Unknown arm');
   assert.ok(['train','validation','holdout'].includes(c.split));
   assert.ok(c.illegalSwitchesBySeat?.every(x=>x===0),'Illegal switch');
   for(const field of metrics)assert.ok(Number.isFinite(c[field]),'Missing '+field);
   rows.push(c);
  }
  stageAudit.push({mode,stage,duels:expected,candidate:
   summary(data.allCases.filter(c=>c.arm===challenger))});
 }
 assert.equal(rows.length,5760);
 const latest=rows.filter(c=>c.arm===challenger);
 assert.equal(latest.length,960);
 const keys=new Set(latest.map(key));assert.equal(keys.size,960);
 for(const arm of frozen){
  const fixed=rows.filter(c=>c.arm===arm);
  assert.equal(fixed.length,960);
  assert.equal(new Set(fixed.map(key)).size,960);
 }
 all.set(mode,{rows,candidate:latest});
}
const reference=all.get('baseline');
const baselineCases=new Map(reference.candidate.map(c=>[key(c),c]));
const baselineAll=new Map(reference.rows.map(c=>[c.arm+'|'+key(c),c]));
for(const mode of MODES.filter(x=>x!=='baseline')){
 const experiment=all.get(mode);
 for(const row of experiment.rows){
  const from=baselineAll.get(row.arm+'|'+key(row));
  assert.ok(from,'Missing paired baseline '+mode+'/'+key(row));
  for(const f of ['seed','seedA','seedB','seat','starter','split',
   'decayEnabled','tier','foeTier'])assert.deepEqual(row[f],from[f],
    'Mismatch in immutable deck/setup '+mode+'/'+f);
  if(row.arm!==challenger){
   for(const field of ['win','reason','turn','timeout'])
    assert.deepEqual(row[field],from[field],
     'Unchanged frozen control diverged: '+mode+'/'+row.arm+'/'+field);
  }
 }
}
const diagnostics=[];
for(const mode of MODES){
 const cases=all.get(mode).candidate;
 const splits=Object.fromEntries(['train','validation'].map(split=>
  [split,summary(picked(cases,split))]));
 const byStage=Object.fromEntries(stages.map(stage=>[stage,summary(cases.filter(x=>x.stage===stage))]));
 const comparisons={};
 for(const split of ['train','validation']){
  const paired=picked(cases,split);
  let improved=0,regressed=0;
  for(const c of paired){const b=baselineCases.get(key(c));assert.ok(b);
   if(c.win&&!b.win)improved++;
   if(!c.win&&b.win)regressed++;
  }
  comparisons[split]={improved,regressed,net:improved-regressed};
 }
 diagnostics.push({mode,splits,byStage,comparisons,
  predatorVsFusion:summary(cases.filter(c=>c.roleA==='predator'&&c.roleB==='fusion')),
  fusionVsPredator:summary(cases.filter(c=>c.roleA==='fusion'&&c.roleB==='predator')),
  fusionRole:summary(cases.filter(c=>c.roleA==='fusion')),
  predatorRole:summary(cases.filter(c=>c.roleA==='predator'))});
}
// This is an evaluation of scoring variants, not training a new neural model.
// Predeclared eligibility: validation improvement, no more than 2 losses
// versus baseline on predator swarm validation, reasonable per-seat parity.
const eligible=diagnostics.filter(r=>r.mode!=='baseline').map(r=>{
 const base=diagnostics[0];
 const stage10=all.get(r.mode).candidate.filter(c=>c.stage===10&&c.split==='validation');
 const prior10=all.get('baseline').candidate.filter(c=>c.stage===10&&c.split==='validation');
 const predatorDiff=sum(stage10,'win')-sum(prior10,'win');
 const seats=r.splits.validation.seats;
 const baseSeats=base.splits.validation.seats;
 const worstSeatDiff=Math.min(...[0,1].map(s=>seats[s].wins-baseSeats[s].wins));
 const validationGain=r.splits.validation.wins-base.splits.validation.wins;
 return {mode:r.mode,validationGain,predatorStageValidationGain:predatorDiff,
  worstSeatValidationGain:worstSeatDiff,
  eligible:validationGain>0&&predatorDiff>=-2&&worstSeatDiff>=-5};
});
const leader=eligible.filter(x=>x.eligible).sort((a,b)=>
 b.validationGain-a.validationGain||b.predatorStageValidationGain-a.predatorStageValidationGain)[0];
const selected=leader?.mode||'baseline';
// HOLDOUT not opened or scored until selected has been determined above.
const sealedHoldout=Object.fromEntries(MODES.map(mode=>[mode,
 summary(picked(all.get(mode).candidate,'holdout'))]));
for(const diagnostic of diagnostics)
 diagnostic.splits.holdout=sealedHoldout[diagnostic.mode];
const report={schema:'arcane-v1575-paired-ablation',status:'completed',
 stages,modes:MODES,totalDuels:MODES.length*5760,
 candidateDuels:MODES.length*960,
 controls:{researchOnly:true,noProductionChanges:true,
   engineAndDeckSeedsIdenticalAcrossArms:true,unchangedFrozenControlsExact:true,
   candidateInheritedFromV1574:true,trainValidationSelectedOnly:true,
   holdoutNeverUsedForSelection:true,actualTelemetryOnlyOnMainGame:true,
   stochasticScoringAblationsChangeEvaluationNotRules:true,
   previousGlobalChampionStillFrozen:true,
   noAutomaticDeployment:true},
 baselineResearchChampion:'fusion-v1574-stomp-conscious',
 selection:{mode:selected,eligible,reason:leader?'Predeclared validation and predator-safety gate':'No ablation improved validation without violating predator or seat safety',
  holdoutSeenBySelector:false,promotionToProduction:false},
 stageAudit,diagnostics,sealedHoldout};
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1575_COMPLETE '+JSON.stringify({duels:report.totalDuels,
 selection:report.selection,holdout:Object.fromEntries(MODES.map(m=>[m,sealedHoldout[m].wins])),
 realCandidateStomps:Object.fromEntries(diagnostics.map(d=>[d.mode,
  d.splits.train.actual.realCandidateStomps+d.splits.validation.actual.realCandidateStomps+
  d.splits.holdout.actual.realCandidateStomps]))}));
