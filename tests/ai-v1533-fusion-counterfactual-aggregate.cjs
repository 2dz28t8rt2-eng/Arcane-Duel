'use strict';
/* Fail-closed v14.9.30 cross-role generalization evaluation, after all stage files are written.
 * Split train/validation/holdout by scenario seed (2+2+2) per stage. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1533',names=[
 'guardian-champion','role-economy','fusion-opportunity','counterfactual-fusion','fusion-recovery'
];
const stages=[],rows=[],seen=new Set();
for(let stage=0;stage<5;stage++){
 const t=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'.json','utf8'));
 assert.equal(t.schema,'arcane-v1533-stage');assert.equal(t.stage,stage);
 assert.equal(t.allCases.length,960);assert.equal(t.summaries.length,5);
 assert.equal(t.controls.holdoutNeverUsedForSelection,true);
 assert.equal(t.controls.independentTrainValidationHoldout,true);
 const trace=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'-train-actions.json','utf8'));
 assert.equal(trace.examples.length,320);
 for(const r of t.allCases){
  assert.equal(r.stage,stage);assert.ok(names.includes(r.arm));
  assert.ok([0,1].includes(r.seat)&&[0,1].includes(r.starter));
  assert.ok(Number.isInteger(r.scenario)&&r.scenario>=0&&r.scenario<6);
  const split=r.scenario<2?'train':r.scenario<4?'validation':'holdout';
  assert.equal(r.split,split);
  assert.equal(r.seed,15330000+stage*200000+r.pair*10000+r.scenario*947+r.starter*41);
  assert.ok([0,1].includes(r.win)&&r.turn>0&&Number.isFinite(r.reward));
  assert.equal(r.mirror,stage<=1);
  assert.equal(r.foeCheckpoint,r.scenario%2?'balanced-v1529':'champion-v1528');
  assert.equal(r.soulDisabled,false);assert.equal(r.counterDisabled,false);
  assert.ok(r.selfPlayCallsBySeat.every(x=>Number.isInteger(x)&&x>0));
  assert.ok(r.selfPlayStrategicBySeat.every(x=>Number.isInteger(x)&&x>0));
  assert.deepEqual(r.illegalSwitchesBySeat,[0,0]);
  assert.equal(r.finishAttacks+r.finishSwitches+r.finishEnds+
   r.breachSwitches+r.breachAttacks,0,'Old policy override leaked');
  const key=[stage,r.pair,r.scenario,r.starter,r.seat,r.arm].join('|');
  assert.ok(!seen.has(key),'Duplicate matched game '+key);seen.add(key);
 }
 for(let pair=0;pair<8;pair++)for(let sc=0;sc<6;sc++)
  for(let start=0;start<2;start++)for(let seat=0;seat<2;seat++)
   for(const arm of names)
    assert.ok(seen.has([stage,pair,sc,start,seat,arm].join('|')),'Unpaired game');
 const baseline=t.summaries[0];
 assert.equal(baseline.arm,'guardian-champion');
 assert.equal(t.chosenArm,'guardian-champion','No stage-local strategy selection allowed');
 assert.equal(t.promoted,false,'Stage-local promotion must be disabled');
 assert.deepEqual(t.selectedRolePolicy,t.summaries[0].rolePolicy);
 assert.equal(t.controls.incumbentChampionPolicyVerified,true);
 assert.equal(t.controls.currentOpponentAlsoUsesChampion,true);
 assert.equal(t.previousSelectedRolePolicy,null);
 assert.equal(t.controls.globalSelectionOnly,true);
 assert.equal(t.controls.noStageToStagePolicyInheritance,true);
 assert.deepEqual(t.trainCandidate,baseline.train);
 assert.deepEqual(t.validationCandidate,baseline.validation);
 assert.deepEqual(t.holdoutCandidate,baseline.holdout);
 for(const arm of t.summaries)for(const split of ['train','validation','holdout']){
  assert.equal(arm[split].games,64);
 }
 stages.push({stage,name:t.name,selected:'guardian-champion',promoted:false,
  selectedRolePolicy:t.summaries[0].rolePolicy,baseline:t.summaries[0],
  selectedSummary:t.summaries[0],summaries:t.summaries});
 rows.push(...t.allCases);
}
assert.equal(rows.length,4800);
for(const split of ['train','validation','holdout'])
 assert.equal(rows.filter(r=>r.split===split).length,1600);
const summary=cases=>{
 const n=cases.length;
 return {games:n,wins:cases.reduce((x,r)=>x+r.win,0),
  timeouts:cases.filter(r=>r.timeout).length,
  avgTurns:cases.reduce((x,r)=>x+r.turn,0)/Math.max(n,1),
  bySeat:Object.fromEntries([0,1].map(seat=>{
   const subset=cases.filter(r=>r.seat===seat);
   return [seat,{games:subset.length,wins:subset.reduce((x,r)=>x+r.win,0)}];
  }))};
};
const arms=names.map(arm=>{
 const filtered=rows.filter(r=>r.arm===arm);
 const splits=Object.fromEntries(['train','validation','holdout'].map(split=>
  [split,summary(filtered.filter(r=>r.split===split))]));
 const opponents=Object.fromEntries(['champion-v1528','balanced-v1529'].map(checkpoint=>
  [checkpoint,summary(filtered.filter(r=>r.foeCheckpoint===checkpoint))]));
 const roleTypes=Object.fromEntries(['guardian','soul','predator','fusion','allrounder','hybrid']
  .map(role=>[role,summary(filtered.filter(r=>r.roleA===role))]));
 const calls=[0,1].map(seat=>filtered.reduce((x,r)=>x+r.selfPlayCallsBySeat[seat],0));
 const decisions=[0,1].map(seat=>filtered.reduce((x,r)=>x+r.selfPlayStrategicBySeat[seat],0));
 const chosenActions={};
 for(const r of filtered)for(const [action,num] of Object.entries(r.candidateActionMix||{}))
  chosenActions[action]=(chosenActions[action]||0)+num;
 const evaluations={
  fusionVisibleReply:filtered.reduce((n,r)=>n+r.fusionReplyEvaluations,0),
  attackVisibleReply:filtered.reduce((n,r)=>n+r.attackReplyEvaluations,0),
  fusionOpportunity:filtered.reduce((n,r)=>n+(r.fusionOpportunityEvaluations||0),0),
  legalCounterfactualFusion:filtered.reduce((n,r)=>n+(r.counterfactualFusionEvaluations||0),0),
  forecastChanged:filtered.reduce((n,r)=>n+(r.forecastChanges||0),0),
  fusionForecastChanged:filtered.reduce((n,r)=>n+(r.fusionForecastChanges||0),0)
 };
 const hardL10=summary(filtered.filter(r=>r.stage===4));
 return {arm,...summary(filtered),splits,opponents,roleTypes,calls,decisions,
  chosenActions,evaluations,hardL10};
});
const paired=['train','validation','holdout'].map(split=>{
 const c=rows.filter(r=>r.split===split),stageResults=[];
 for(let st=0;st<5;st++){
  const ref=new Map(c.filter(r=>r.stage===st&&r.arm==='guardian-champion').map(r=>
   [[r.pair,r.scenario,r.starter,r.seat].join('|'),r]));
  for(const arm of names.slice(1)){
   let flippedWin=0,flippedLoss=0;
   for(const r of c.filter(r=>r.stage===st&&r.arm===arm)){
    const b=ref.get([r.pair,r.scenario,r.starter,r.seat].join('|'));
    assert.ok(b,'Missing paired baseline');
    if(r.win&&!b.win)flippedWin++;
    if(!r.win&&b.win)flippedLoss++;
   }
   stageResults.push({stage:st,arm,flippedWin,flippedLoss});
  }
 }
 return {split,stageResults};
});
// Select ONE fixed strategic profile globally across all five research phases.
// TRAIN and VALIDATION are allowed for selection. HOLDOUT is never consulted.
const byArm=new Map(arms.map(a=>[a.arm,a]));
const base=byArm.get('guardian-champion');
const gt=x=>rows.filter(r=>r.arm===x);
const compare=(arm,split,key,selector)=>
 summary(gt(arm).filter(r=>r.split===split&&selector(r))).wins-
 summary(gt('guardian-champion').filter(r=>r.split===split&&selector(r))).wins;
const groupChecks=arm=>{
 const mirror=compare(arm,'validation','mirror',r=>r.stage<=1);
 const crossRole=compare(arm,'validation','cross-role',r=>r.stage>=2);
 const current=compare(arm,'validation','champion-Q',r=>r.foeCheckpoint==='champion-v1528');
 const older=compare(arm,'validation','balanced-Q',r=>r.foeCheckpoint==='balanced-v1529');
 const hardL10=compare(arm,'validation','hard-L10-crossrole',r=>r.stage===4);
 return {mirror,crossRole,current,older,hardL10};
};
const eligible=arms.slice(1).map(a=>{
 const trainGain=a.splits.train.wins-base.splits.train.wins;
 const validationGain=a.splits.validation.wins-base.splits.validation.wins;
 const seatParity=[0,1].every(seat=>
  a.splits.train.bySeat[seat].wins>=base.splits.train.bySeat[seat].wins&&
  a.splits.validation.bySeat[seat].wins>=base.splits.validation.bySeat[seat].wins);
 const groups=groupChecks(a.arm);
 return {arm:a.arm,trainGain,validationGain,seatParity,groups,
  qualifies:trainGain>=8&&validationGain>=8&&seatParity&&
   Object.entries(groups).every(([key,delta])=>delta>=(key==='hardL10'?0:-3))};
});
const selectedCandidates=eligible.filter(x=>x.qualifies).sort((a,b)=>
 b.validationGain-a.validationGain||b.trainGain-a.trainGain||a.arm.localeCompare(b.arm));
const chosen=selectedCandidates[0]?.arm||'guardian-champion';
const selection={
 arm:chosen,promoted:chosen!=='guardian-champion',
 policy:rows.find(x=>x.arm===chosen)?.rolePolicy??null,
 incumbent:'guardian-champion',incumbentFromRun:39974390088,
 priorBalancedCandidateRun:39983397260,
 selectionBasedOn:['train','validation'],holdoutSeenBySelector:false,
 requires:{trainGain:8,validationGain:8,seatNonRegression:true,
  subgroupValidationTolerance:-3,hardL10CrossroleNonRegression:true},
 candidates:eligible,
 // These diagnostics are only attached after selection has finished.
 holdoutWins:byArm.get(chosen).splits.holdout.wins,
 holdoutReferenceWins:base.splits.holdout.wins,
 holdoutDifference:byArm.get(chosen).splits.holdout.wins-base.splits.holdout.wins
};
const report={schema:'arcane-v1533-global-role-selection-report',status:'completed',
 sourceSha:process.env.GITHUB_SHA||'unknown',
 totalDuels:4800,trainDuels:1600,validationDuels:1600,holdoutDuels:1600,
 controls:{bothSeatsUseFullStrategicAI:true,noIllegalMoves:true,
  trainValidationHoldoutSeparated:true,holdoutNeverUsedForSelection:true,
  globalFiveStageSelection:true,stageLocalPromotionDisabled:true,
  reigningChampionAsReference:true,currentOpponentUsesChampion:true,
  balancedResearchOpponent:true,unseenDeckSeeds:true,expandedCrossRoleDecks:true,
  deliberateHardL10CrossRoleFocus:true,visibleEnemyLevelAssessment:true,
  oneVisibleReplyEvaluation:true,componentAblation:true,actionMixDiagnostics:true,
  clonedLegalAttackResponseUsed:true,fusionValueAblations:true,
  historicalQOpponentPool:true,perSeatPromotionGate:true,
  fullCombat:true,arenaLPDecayResearchOnlyOff:true,
  noProductionChanges:true},
 stages,arms,paired,globalSelection:selection,
 limitations:[
 'The existing forecast applies a legally simulated enemy attack (up to two attacks where available) to a clone; this is not a full opponent turn or game tree.',
 'Action mix and scoring diagnostics are descriptive rather than causal evidence.',
 'Role-specific policies are hand-engineered scoring variants, not comprehensive self-improving reinforcement learning.',
 'Older opponent checkpoint freezes Q and selected weights; it does not freeze the entire former engine source.',
 'All challengers face the v14.9.28 validated Guardian/Soul champion and the predefined v14.9.29 balanced opponent; the v14.9.31 holdout stays sealed for selection.',
 'The incumbent Guardian/Soul reference is rerun on the same decks, starter and RNG seeds as all candidate policies.',
 'The default arena LP decay is disabled symmetrically in research as in prior AI studies.',
 'Adaptive features use visible current LP, threats and Guardian/Soul board state; no hidden opponent hand knowledge.',
 'Changing the live AI or main branch requires separate explicit validation.'
 ]};
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1533_COMPLETE '+JSON.stringify({
 total:report.totalDuels,globallySelected:selection.arm,
 selectionTrainGain:eligible.find(x=>x.arm===selection.arm)?.trainGain??0,
 selectionValidationGain:eligible.find(x=>x.arm===selection.arm)?.validationGain??0,
 selectionHoldoutDifference:selection.holdoutDifference,
 holdout:arms.map(x=>({arm:x.arm,wins:x.splits.holdout.wins})),
 validation:arms.map(x=>({arm:x.arm,wins:x.splits.validation.wins}))
}));
