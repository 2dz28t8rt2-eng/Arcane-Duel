'use strict';
/* v15.77 research report: natural 40-card Predator/Fusion duels.
 * Predeclared, paired control checks; look at HOLDOUT only after selecting on
 * TRAIN/VALIDATION. No live AI change or automatic model promotion.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='artifacts/v1577';
const modes=['baseline','reply-aware'],locks=[0,4],stages=[9,10];
const arms=['guardian-champion','fusion-sequence-2ply',
 'l10-guarded-worst-reply','defender-v1573-survival-control',
 'defender-v1573-counterplay','fusion-v1574-stomp-conscious'];
const challenger=arms.at(-1), frozen=arms.slice(0,-1);
const fields=['realCandidateStomps','realOpponentStomps',
 'realCandidateSplashHits','realCandidateSplashKills',
 'realCandidateSplashDefLost','realCandidateSplashCounterLP',
 'realCandidateAttackFatigueAtk','realCandidateAttackFatigueDef',
 'realPredatorFusionAttacks','realPredatorFusionKills',
 'realOpponentPredatorKillsCandidateFusion','fusionMultiMaterialChosen',
 'fusionMultiMaterialOpportunities','stompReplySearchTrials',
 'stompReplySearchKills','stompPredatorFusionEvaluations'];
const splits=['train','validation','holdout'];
const k=c=>[c.stage,c.pair,c.scenario,c.starter,c.seat,c.roleA,c.roleB].join('|');
const sum=(r,f)=>r.reduce((n,x)=>n+(Number(x[f])||0),0);
const pick=(rows,split)=>rows.filter(x=>x.split===split);
function stats(rows){
 const games=rows.length,wins=sum(rows,'win');
 return {games,wins,winRate:games?wins/games:null,
  timeouts:rows.filter(x=>x.timeout).length,
  meanTurns:games?sum(rows,'turn')/games:null,
  seats:Object.fromEntries([0,1].map(seat=>{
   const a=rows.filter(x=>x.seat===seat);
   return [seat,{games:a.length,wins:sum(a,'win'),winRate:a.length?sum(a,'win')/a.length:null}];
  })),
  byMaterial:Object.fromEntries([3,4,5].map(n=>[n,rows.reduce((s,c)=>
   s+(c.multiFusionChosenBySize?.[n]||0),0)])),
  actual:Object.fromEntries(fields.map(f=>[f,sum(rows,f)]))};
}
const experiment=new Map(),stageAudit=[];
for(const lock of locks)for(const mode of modes){
 const cohort=`${mode}-lock${lock}`,rows=[];
 for(const stage of stages){
  const p=path.join(root,cohort,`stage-${stage}.json`);
  assert.ok(fs.existsSync(p),'Missing complete stage '+p);
  const data=JSON.parse(fs.readFileSync(p,'utf8'));
  assert.equal(data.stage,stage);
  assert.ok(data.controls?.holdoutNeverUsedForSelection);
  assert.equal(data.allCases.length,2304,'Missing mirrored full duels '+p);
  for(const c of data.allCases){
   assert.equal(c.stage,stage);assert.ok(arms.includes(c.arm));
   assert.ok(splits.includes(c.split));
   assert.equal(c.roleA,stage===9?'fusion':'predator');
   assert.equal(c.roleB,stage===9?'predator':'fusion');
   assert.equal(c.illegalSwitchesBySeat?.length,2);
   assert.ok(c.illegalSwitchesBySeat.every(n=>n===0));
   for(const f of fields)assert.ok(Number.isFinite(c[f]),'Missing real telemetry '+f);
   rows.push(c);
  }
  stageAudit.push({cohort,stage,duels:2304,candidate:stats(data.allCases.filter(x=>x.arm===challenger))});
 }
 assert.equal(rows.length,4608);
 for(const arm of arms){
  const matched=rows.filter(x=>x.arm===arm);
  assert.equal(matched.length,768);
  assert.equal(new Set(matched.map(k)).size,768,'Non-unique seed/seat/game');
 }
 experiment.set(cohort,{rows,candidate:rows.filter(x=>x.arm===challenger)});
}
const parityChecks=[];
for(const lock of locks){
 const ref=experiment.get(`baseline-lock${lock}`).rows;
 const keyRow=new Map(ref.map(x=>[`${x.arm}|${k(x)}`,x]));
 for(const row of experiment.get(`reply-aware-lock${lock}`).rows){
  const initial=keyRow.get(`${row.arm}|${k(row)}`);
  assert.ok(initial,'Missing causal pair');
  for(const f of ['seed','seedA','seedB','seat','starter','split','tier','foeTier','roleA','roleB'])
   assert.deepEqual(row[f],initial[f],`Inconsistent ${f}`);
  if(frozen.includes(row.arm))for(const f of ['win','reason','turn','timeout'])
   assert.deepEqual(row[f],initial[f],`Frozen control drift ${f}/${row.arm}`);
 }
 parityChecks.push({lock,unchangedFrozenControls:true,pairedSeeds:true});
}
const comparisons={},diagnostics={};
for(const lock of locks){
 const baseline=experiment.get(`baseline-lock${lock}`).candidate;
 const old=new Map(baseline.map(c=>[k(c),c]));
 for(const mode of modes){
  const cohort=`${mode}-lock${lock}`;
  const cs=experiment.get(cohort).candidate;
  const comparison={};
  for(const split of ['train','validation']){
   let improved=0,regressed=0;
   for(const c of pick(cs,split)){
    const b=old.get(k(c));assert.ok(b);
    if(c.win&&!b.win)improved++;
    if(!c.win&&b.win)regressed++;
   }
   comparison[split]={improved,regressed,net:improved-regressed};
  }
  comparisons[cohort]=comparison;
  diagnostics[cohort]={
   byStage:Object.fromEntries(stages.map(stage=>[stage,stats(cs.filter(c=>c.stage===stage))])),
   train:stats(pick(cs,'train')),
   validation:stats(pick(cs,'validation')),
   // Holdout is deliberately not read/scored before selection, below.
   actualPredatorAttacksOnLargeFusion:sum(cs,'realPredatorFusionAttacks'),
   realLargeFusionOpponentStomps:sum(cs,'realOpponentStomps'),
   realLargeFusionCandidateStomps:sum(cs,'realCandidateStomps')
  };
 }
}
// Only the truly natural, no-attack-lock games choose a research winner;
// the 4-turn symmetric warmup is a sensitivity analysis, not a substitute.
const naturalBase=experiment.get('baseline-lock0').candidate;
const naturalReply=experiment.get('reply-aware-lock0').candidate;
const nVal=pick(naturalBase,'validation'),rVal=pick(naturalReply,'validation');
const valStage=(c,stage)=>sum(c.filter(x=>x.stage===stage),'win');
const stage9Gain=valStage(rVal,9)-valStage(nVal,9);
const stage10Gain=valStage(rVal,10)-valStage(nVal,10);
const overallGain=sum(rVal,'win')-sum(nVal,'win');
const seatSafety=[0,1].every(seat=>
 sum(rVal.filter(x=>x.seat===seat),'win')>=
 sum(nVal.filter(x=>x.seat===seat),'win')-4);
const eligible=overallGain>0&&stage9Gain>=-2&&stage10Gain>=0&&seatSafety;
const selected=eligible?'reply-aware':'baseline';
const selection={mode:selected,basis:'Only natural lock0 VALIDATION; sealed HOLDOUT excluded',
 naturalValidationNet:overallGain,fusionStageGain:stage9Gain,
 predatorStageGain:stage10Gain,seatSafety,eligible,
 noAutomaticPromotion:true,holdoutSeenBySelector:false};
const sealedHoldout={};
for(const lock of locks)for(const mode of modes){
 const cohort=`${mode}-lock${lock}`;
 sealedHoldout[cohort]=stats(pick(experiment.get(cohort).candidate,'holdout'));
 diagnostics[cohort].holdout=sealedHoldout[cohort];
}
const candidateDuels=modes.length*locks.length*stages.length*384;
const report={schema:'arcane-v1577-natural-predator-fusion',status:'completed',
 description:'Real 40-card full-match selfplay; natural lock0 vs symmetric lock4 curriculum; paired seats, starter and seed; no forced field setup',
 totalDuels:18432,candidateDuels,
 controls:{unchangedFrozenControlsExact:true,independentMirroredSeats:true,
  trainingQPreexistingNoHoldout:true,allMainGameDamageTelemetry:true,
  noPlayerZeroBonuses:true,noProductionAiChanges:true,noAutomaticDeployment:true,
  priorFixedBoardV1576NotComparableAsWinrate:true},
 stageAudit,parityChecks,comparisons,selection,diagnostics,sealedHoldout,
 opportunities:{naturalPredatorVsLargeFusion:sum(naturalBase.filter(c=>c.stage===10),'realPredatorFusionAttacks'),
   naturalFusionStomps:sum(naturalBase.filter(c=>c.stage===9),'realCandidateStomps'),
   warmupPredatorVsLargeFusion:sum(experiment.get('baseline-lock4').candidate.filter(c=>c.stage===10),'realPredatorFusionAttacks')},
 caveat:'Comparisons estimate policy-specific in-simulator success, not real-world balance. Fusion encounters and opponent policy are sampled, not exhaustive.'};
assert.ok(report.opportunities.naturalPredatorVsLargeFusion>0,
 'Study did not generate real Predator attacks on naturally built large fusion');
assert.ok(report.opportunities.naturalFusionStomps>0,
 'Study did not generate natural fusion Stomp attacks');
assert.equal(report.candidateDuels,3072);
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1577_COMPLETE '+JSON.stringify({
 duels:report.totalDuels,candidateDuels:report.candidateDuels,
 selection,opportunities:report.opportunities,
 naturalBaseline:diagnostics['baseline-lock0'].byStage,
 naturalReplyAware:diagnostics['reply-aware-lock0'].byStage}));
