'use strict';
/* Fail-closed v14.9.30 cross-role generalization evaluation, after all stage files are written.
 * Split train/validation/holdout by scenario seed (2+2+2) per stage. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1542',names=[
 'guardian-champion','fusion-postreply-material','fusion-sequence-2ply','fusion-sequence-worst','fusion-sequence-guardian-worst'
];
const stages=[],rows=[],noDecayRows=[],decayRows=[],seen=new Set();
for(let stage=0;stage<7;stage++){
 const t=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'.json','utf8'));
 assert.equal(t.schema,'arcane-v1542-stage');assert.equal(t.stage,stage);
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
  assert.equal(r.seed,15420000+(stage>=5?5:stage)*200000+r.pair*10000+r.scenario*1433+r.starter*79);
  assert.ok([0,1].includes(r.win)&&r.turn>0&&Number.isFinite(r.reward));
  assert.equal(r.mirror,stage<=1);
  assert.equal(r.decayEnabled,stage===6);
  assert.equal(r.decayPairStage,stage>=5?5:stage);
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
 if(stage===5)noDecayRows.push(...t.allCases);
 else if(stage===6)decayRows.push(...t.allCases);
 else rows.push(...t.allCases);
}
assert.equal(rows.length,4800);
assert.equal(noDecayRows.length,960);
assert.equal(decayRows.length,960);
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
// Exact paired counterfactual: only the symmetrical decay switch differs.
// Comparison is diagnostic, never used for choosing strategy or training Q.
const abKey=r=>[r.arm,r.pair,r.scenario,r.starter,r.seat].join('|');
const noDecayByKey=new Map(noDecayRows.map(r=>[abKey(r),r]));
assert.equal(noDecayByKey.size,960);
const pairedDecayCases=decayRows.map(on=>{
 const off=noDecayByKey.get(abKey(on));
 assert.ok(off,'Missing matched no-decay duel');
 for(const field of ['seed','seedA','seedB','starter','seat','roleA','roleB','pair','scenario','arm','foeCheckpoint']){
  assert.deepEqual(on[field],off[field],'A/B mismatch: '+field);
 }
 assert.equal(off.decayEnabled,false);assert.equal(on.decayEnabled,true);
 return {key:abKey(on),arm:on.arm,pair:on.pair,scenario:on.scenario,
  split:on.split,seat:on.seat,starter:on.starter,roleA:on.roleA,roleB:on.roleB,
  winOff:off.win,winOn:on.win,turnsOff:off.turn,turnsOn:on.turn,
  reasonOff:off.reason,reasonOn:on.reason,
  enemyDamageOff:off.enemyDamage,enemyDamageOn:on.enemyDamage,
  ownDamageOff:off.ownDamage,ownDamageOn:on.ownDamage,
  ownLostOff:off.ownLost,ownLostOn:on.ownLost,
  actionTapeOff:off.arm==='fusion-postreply-material'?off.actions:undefined,
  actionTapeOn:on.arm==='fusion-postreply-material'?on.actions:undefined
 };
});
assert.equal(pairedDecayCases.length,960);
const pairedDecayArms=names.map(arm=>{
 const cases=pairedDecayCases.filter(r=>r.arm===arm);
 const reduced=cases=>{
  const changedToWin=cases.filter(r=>r.winOn&&!r.winOff).length,
   changedToLoss=cases.filter(r=>!r.winOn&&r.winOff).length;
  return {games:cases.length,
   winsOff:cases.reduce((n,r)=>n+r.winOff,0),
   winsOn:cases.reduce((n,r)=>n+r.winOn,0),
   changedToWin,changedToLoss,net:changedToWin-changedToLoss,
   byStarter:Object.fromEntries([0,1].map(starter=>
    [starter,{games:cases.filter(r=>r.starter===starter).length,
      winsOff:cases.filter(r=>r.starter===starter).reduce((n,r)=>n+r.winOff,0),
      winsOn:cases.filter(r=>r.starter===starter).reduce((n,r)=>n+r.winOn,0)}]))};
 };
 return {arm,...reduced(cases),
  bySeat:Object.fromEntries([0,1].map(seat=>
   [seat,reduced(cases.filter(r=>r.seat===seat))])),
  byRole:Object.fromEntries([...new Set(cases.map(r=>r.roleA))].sort().map(role=>
   [role,reduced(cases.filter(r=>r.roleA===role))])),
  byPair:Object.fromEntries([...new Set(cases.map(r=>r.pair))].sort((a,b)=>a-b).map(pair=>
   [pair,reduced(cases.filter(r=>r.pair===pair))])),
  splitStats:Object.fromEntries(['train','validation','holdout'].map(split=>
   [split,reduced(cases.filter(r=>r.split===split))]))
 };
});
assert.ok(pairedDecayArms.every(a=>a.games===192));
// A separately frozen diagnostic set: NEVER fed to challenger promotion gate.
const noDecayArms=names.map(arm=>{
 const cases=noDecayRows.filter(r=>r.arm===arm);
 return {arm,...summary(cases),bySeat:Object.fromEntries([0,1].map(seat=>
  [seat,summary(cases.filter(r=>r.seat===seat))]))};
});
// A separately frozen diagnostic set: NEVER fed to challenger promotion gate.
const decayArms=names.map(arm=>{
 const cases=decayRows.filter(r=>r.arm===arm);
 return {arm, ...summary(cases),
  splits:Object.fromEntries(['train','validation','holdout'].map(split=>
   [split,summary(cases.filter(r=>r.split===split))])),
  hardFusionGuardian:summary(cases.filter(r=>r.roleA==='fusion'&&r.roleB==='guardian')),
  seats:Object.fromEntries([0,1].map(seat=>
   [seat,summary(cases.filter(r=>r.seat===seat))]))
 };
});
assert.ok(decayArms.every(x=>x.games===192),'Decay diagnostic arms must each have 192 duels');
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
  softFusion:filtered.reduce((n,r)=>n+(r.softFusionEvaluations||0),0),
  adaptiveCounter:filtered.reduce((n,r)=>n+(r.adaptiveCounterEvaluations||0),0),
  attackReplyTrials:filtered.reduce((n,r)=>n+(r.attackReplySimulations||0),0),
  attackReplyHits:filtered.reduce((n,r)=>n+(r.attackReplyHits||0),0),
  attackReplyLoss:filtered.reduce((n,r)=>n+(r.attackReplyLoss||0),0),
  allrounderGuardChecks:filtered.reduce((n,r)=>n+(r.allrounderGuardChecks||0),0),
  allrounderOpeningChecks:filtered.reduce((n,r)=>n+(r.allrounderOpeningChecks||0),0),
  guardianBreakEvaluations:filtered.reduce((n,r)=>n+(r.guardianBreakEvaluations||0),0),
  guardianBreakViable:filtered.reduce((n,r)=>n+(r.guardianBreakViable||0),0),
  guardianSoulEvaluations:filtered.reduce((n,r)=>n+(r.guardianSoulEvaluations||0),0),
  guardianFacingActions:filtered.reduce((n,r)=>n+(r.guardianFacingActions||0),0),
  postReplyFusionChecks:filtered.reduce((n,r)=>n+(r.postReplyFusionChecks||0),0),
  postReplyFusionSurvivors:filtered.reduce((n,r)=>n+(r.postReplyFusionSurvivors||0),0),
  postReplyFusionLosses:filtered.reduce((n,r)=>n+(r.postReplyFusionLosses||0),0),
  postReplyMaterialChecks:filtered.reduce((n,r)=>n+(r.postReplyMaterialChecks||0),0),
  sequenceFusionChecks:filtered.reduce((n,r)=>n+(r.sequenceFusionChecks||0),0),
  sequenceLegalOwnAttacks:filtered.reduce((n,r)=>n+(r.sequenceLegalOwnAttacks||0),0),
  sequenceLegalEnemyReplies:filtered.reduce((n,r)=>n+(r.sequenceLegalEnemyReplies||0),0),
  sequenceUtilityGain:filtered.reduce((n,r)=>n+(r.sequenceUtilityGain||0),0),
  decayUrgencyChecks:filtered.reduce((n,r)=>n+(r.decayUrgencyChecks||0),0),
  worstReplySearches:filtered.reduce((n,r)=>n+(r.worstReplySearches||0),0),
  worstReplyLegalTrials:filtered.reduce((n,r)=>n+(r.worstReplyLegalTrials||0),0),
  worstReplyMoreDangerous:filtered.reduce((n,r)=>n+(r.worstReplyMoreDangerous||0),0),
  worstReplyGuardianSearches:filtered.reduce((n,r)=>n+(r.worstReplyGuardianSearches||0),0),
  forecastChanged:filtered.reduce((n,r)=>n+(r.forecastChanges||0),0),
  fusionForecastChanged:filtered.reduce((n,r)=>n+(r.fusionForecastChanges||0),0)
 };
 const hardL10=summary(filtered.filter(r=>r.stage===4));
 // Keep start-player / candidate seat completely separate: starter 0/1 is ABSOLUTE seat.
 const seatByStarter=Object.fromEntries(['train','validation','holdout'].map(split=>[
  split,Object.fromEntries([0,1].map(seat=>[
   seat,Object.fromEntries([0,1].map(starter=>[
    starter,summary(filtered.filter(r=>r.split===split&&r.seat===seat&&r.starter===starter))
   ]))
  ]))
 ]));
 const fusionAgainstGuardian=Object.fromEntries(['train','validation','holdout'].map(split=>[
  split,Object.fromEntries([0,1,2,3,4].map(stage=>[
   stage,Object.fromEntries([0,1].map(seat=>[
    seat,Object.fromEntries([0,1].map(starter=>[
     starter,summary(filtered.filter(r=>r.split===split&&r.stage===stage&&r.roleA==='fusion'&&r.roleB==='guardian'&&r.seat===seat&&r.starter===starter))
    ]))
   ]))
  ]))
 ]));
 const fusionGuardianActionMix=Object.fromEntries(['train','validation','holdout'].map(split=>[
  split,filtered.filter(r=>r.split===split&&r.stage===4&&r.roleA==='fusion'&&r.roleB==='guardian').reduce((acc,r)=>{
   for(const [key,num] of Object.entries(r.candidateActionMix||{}))acc[key]=(acc[key]||0)+num;
   return acc;
  },{})
 ]));
 const allrounderSeatTwo=Object.fromEntries(['train','validation','holdout'].map(split=>[
  split,Object.fromEntries([0,1,2,3,4].map(stage=>[
   stage,summary(filtered.filter(r=>r.split===split&&r.seat===1&&r.roleA==='allrounder'&&r.stage===stage))
  ]))
 ]));
 const allrounderByOpponent=Object.fromEntries(['train','validation','holdout'].map(split=>[
  split,Object.fromEntries(['allrounder','fusion','predator','guardian','soul','hybrid'].map(roleB=>[
   roleB,summary(filtered.filter(r=>r.split===split&&r.seat===1&&r.roleA==='allrounder'&&r.roleB===roleB))
  ]))
 ]));
 const seatRoleStarter=Object.fromEntries(['train','validation','holdout'].map(split=>[
  split,Object.fromEntries(['guardian','soul','predator','fusion','allrounder','hybrid'].map(roleA=>[
   roleA,Object.fromEntries([0,1].map(seat=>[
    seat,Object.fromEntries([0,1].map(starter=>[
     starter,summary(filtered.filter(r=>r.split===split&&r.roleA===roleA&&r.seat===seat&&r.starter===starter))
    ]))
   ]))
  ]))
 ]));
 const pairedSeatRoleAudit=Object.fromEntries(['train','validation','holdout'].map(split=>[
  split,Object.fromEntries([0,1].map(seat=>[
   seat,Object.fromEntries([...new Set(filtered.map(r=>r.roleA))].sort().map(role=>[
    role,summary(filtered.filter(r=>r.split===split&&r.seat===seat&&r.roleA===role))
   ]))
  ]))
 ]));
 const hardL10ByPair=Object.fromEntries([...new Set(filtered.filter(r=>r.stage===4).map(r=>r.pair))].sort((a,b)=>a-b).map(pair=>[
  pair,Object.fromEntries(['train','validation','holdout'].map(split=>[
   split,summary(filtered.filter(r=>r.stage===4&&r.pair===pair&&r.split===split))
  ]))
 ]));
 return {arm,...summary(filtered),splits,opponents,roleTypes,calls,decisions,
  chosenActions,evaluations,hardL10,pairedSeatRoleAudit,hardL10ByPair,
  seatByStarter,allrounderSeatTwo,allrounderByOpponent,seatRoleStarter,
  fusionAgainstGuardian,fusionGuardianActionMix};
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
const confirmationMaterial=eligible.find(x=>x.arm==='fusion-postreply-material');
const priorResearchChampion={
 arm:'fusion-postreply-material',sourceRun:40123309581,
 status:'previously-promoted-research-champion',
 revalidated:!!confirmationMaterial?.qualifies,
 // Do not silently replace the v14.9.38 promoted research policy with the old baseline.
 // If replication fails, report it; further independent testing will determine next steps.
 retainedForResearchReview:true
};
const report={schema:'arcane-v1542-global-role-selection-report',status:'completed',
 sourceSha:process.env.GITHUB_SHA||'unknown',
 totalDuels:6720,primaryDuels:4800,decayDiagnosticDuels:960,noDecayDiagnosticDuels:960,
 trainDuels:1600,validationDuels:1600,holdoutDuels:1600,
 controls:{bothSeatsUseFullStrategicAI:true,noIllegalMoves:true,
  trainValidationHoldoutSeparated:true,holdoutNeverUsedForSelection:true,
  globalFiveStageSelection:true,stageLocalPromotionDisabled:true,
  reigningChampionAsReference:true,currentOpponentUsesChampion:true,
  balancedResearchOpponent:true,unseenDeckSeeds:true,expandedCrossRoleDecks:true,
  deliberateHardL10CrossRoleFocus:true,visibleEnemyLevelAssessment:true,
  oneVisibleReplyEvaluation:true,componentAblation:true,actionMixDiagnostics:true,
  clonedLegalAttackResponseUsed:true,fusionValueAblations:true,
  visibleL10AdaptiveCounter:true,limitedContextualFusion:true,
  legalClonedAttackResponseAfterAttack:true,seatRoleDiagnostics:true,
  matchedSeatStarterAudit:true,allrounderPolicyAblation:true,
  guardianBreakEvaluation:true,guardianSoulEvaluation:true,
  postReplyFusionSurvivalAudit:true,postReplyMaterialAudit:true,
  fusionGuardianPerSeatStarterAudit:true,
  historicalQOpponentPool:true,perSeatPromotionGate:true,
  fullCombat:true,arenaLPDecayResearchOnlyOff:true,
  independentFullDecayDiagnostic:true,decayExcludedFromPromotion:true,
  exactMatchedDecayAB:true,abBothStagesExcludedFromPromotion:true,
  legalTwoPlyOwnAndEnemyReply:true,fullDecayUrgencyAblation:true,
  boundedVisibleWorstReplySearch:true,targetedGuardianSoulReplySearch:true,
  seatTwoPairedOutcomeTracing:true,
  replicatedPromotedPolicyFrozen:true,
  noProductionChanges:true},
 stages,arms,paired,globalSelection:selection,priorResearchChampion,
  noDecayArms,decayArms,pairedDecayArms,pairedDecayCases,
 limitations:[
 'Fusion survival after actual cloned counterattacks is measured only within the existing capped 2-attack forecast, not a complete opponent turn.',
 'Material scarcity uses only the candidate own hand after legally applying fusion on the clone; no hidden opposing hand is considered.',
 'Soul support experiments use public foe Guardian DEF and do not resolve the full counter-play game tree.',
 'Seat and starter subgroup differences can be sampling noise; allrounder and opponent-role subgroups are small.',
 'New sequence-worst branch enumerates at most 12 legal first enemy visible attack/target branches per candidate fusion then a second legal attack; bounded counterfactual, not full minimax.',
 'New fusion sequencing simulates up to two legal own attacks then two legal replies, not a complete turn or hidden-hand game tree.',
 'LP decay urgency score is applied only in diagnostic stage 6 and cannot influence primary five-stage promotion.',
 'Opponent attack planning remains limited cloned-attack approximation, not a full adversarial turn search.',
 'Action mix and scoring diagnostics are descriptive rather than causal evidence.',
 'Role-specific policies are hand-engineered scoring variants, not comprehensive self-improving reinforcement learning.',
 'Older opponent checkpoint freezes Q and selected weights; it does not freeze the entire former engine source.',
 'All challengers face the v14.9.28 validated Guardian/Soul champion and the predefined v14.9.29 balanced opponent; the v14.9.31 holdout stays sealed for selection.',
 'The incumbent Guardian/Soul reference is rerun on the same decks, starter and RNG seeds as all candidate policies.',
 'Main stages 0-4 keep decay off; stages 5 and 6 share precisely identical seed/deck/opponent/starter settings, stage 5 without and stage 6 with symmetric LP decay. BOTH diagnostic stages are excluded from promotion and Q training.',
 'This run confirms or challenges the already promoted v14.9.38 research champion; it does not silently roll back that policy based on one additional experiment.',
 'Adaptive features use visible current LP, threats and Guardian/Soul board state; no hidden opponent hand knowledge.',
 'Changing the live AI or main branch requires separate explicit validation.'
 ]};
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1542_COMPLETE '+JSON.stringify({
 total:report.totalDuels,globallySelected:selection.arm,
 selectionTrainGain:eligible.find(x=>x.arm===selection.arm)?.trainGain??0,
 selectionValidationGain:eligible.find(x=>x.arm===selection.arm)?.validationGain??0,
 selectionHoldoutDifference:selection.holdoutDifference,
 holdout:arms.map(x=>({arm:x.arm,wins:x.splits.holdout.wins})),
 validation:arms.map(x=>({arm:x.arm,wins:x.splits.validation.wins}))
}));
