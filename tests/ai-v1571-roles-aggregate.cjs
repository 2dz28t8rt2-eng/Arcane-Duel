'use strict';
/* Fail-closed v14.9.71 role-scoped defender evaluation versus frozen v14.9.55 winner.
 * Main stages use 2+2+2 split, except hard-L10 stage 4 with 8+8+8.
 * Stage 7 H2H uses 6+6+6; focused stage 8 uses 4+4+4.
 * All results are paired by seed/seat/starter.
 * All selections are predeclared TRAIN+VALIDATION only; HOLDOUT remains sealed. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1571',names=[
 'guardian-champion','fusion-sequence-2ply','l10-guarded-worst-reply',
 'defender-v1569-endgame-control','defender-v1569-mixed-control','role-identity-conditional-fusion'
];
const stages=[],rows=[],noDecayRows=[],decayRows=[],headToHeadRows=[],focusedRows=[],fusionFocusRows=[],seen=new Set(),decisionRows=[];
for(let stage=0;stage<10;stage++){
 const t=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'.json','utf8'));
 assert.equal(t.schema,'arcane-v1571-stage');assert.equal(t.stage,stage);
 assert.equal(t.allCases.length,stage===4?4608:stage===7?4608:stage===8||stage===9?2304:1152);assert.equal(t.summaries.length,6);
 assert.equal(t.controls.holdoutNeverUsedForSelection,true);
 assert.equal(t.controls.independentTrainValidationHoldout,true);
 const trace=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'-train-actions.json','utf8'));
 assert.equal(trace.examples.length,stage===4?1536:stage===7?1536:stage===8||stage===9?768:384);
 const audit=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'-decision-diffs.json','utf8'));
 assert.equal(audit.schema,'arcane-v1571-train-only-decision-diffs');
 assert.equal(audit.stage,stage);
 assert.equal(audit.controls.holdoutNeverInspected,true);
 assert.equal(audit.controls.firstDivergenceDoesNotEstablishCausality,true);
 assert.equal(audit.rows.length,stage===4?768:stage===7?768:stage===8||stage===9?384:192);
 for(const d of audit.rows){
  assert.equal(d.split,'train');assert.ok(names.slice(3).includes(d.arm));
  assert.ok([0,1].includes(d.candidateWin)&&[0,1].includes(d.incumbentWin));
  assert.ok(d.firstDifferentIndex===null||d.firstDifferentIndex>=0);
  decisionRows.push({stage,...d});
 }
 for(const r of t.allCases){
  assert.equal(r.stage,stage);assert.ok(names.includes(r.arm));
  assert.ok([0,1].includes(r.seat)&&[0,1].includes(r.starter));
  assert.ok(Number.isInteger(r.scenario)&&r.scenario>=0&&r.scenario<(stage===4?24:stage===7?24:stage===8||stage===9?12:6));
  const split=r.scenario<(stage===4?8:stage===7?8:stage===8||stage===9?4:2)?'train':r.scenario<(stage===4?16:stage===7?16:stage===8||stage===9?8:4)?'validation':'holdout';
  assert.equal(r.split,split);
  assert.equal(r.seed,15710000+(stage===6?5:stage)*200000+
    (stage===8||stage===9?r.focusGroup:r.pair)*10000+r.scenario*1550+r.starter*107);
  if(stage===9){
   const modes=['fusion-mixed','fusion-allrounder','fusion-predator','predator-swarm'];
   assert.equal(r.fusionMode,modes[r.pair%4]);
   assert.equal(r.focusGroup,Math.floor(r.pair/4));
   assert.ok(r.fusionMaterialRoles);
   assert.equal(Object.values(r.fusionMaterialRoles).reduce((x,n)=>x+n,0),40);
   assert.ok(r.fusionMaterialTargets);
   assert.equal(r.roleA,'fusion');
  }
  if(stage===8){
   const modes=['mixed-50','guardian-core','soul-core','mixed-50',
    'guardian-core','soul-core','mixed-60g','mixed-40g'];
   const groups=[0,0,0,1,1,1,0,0];
   const counts={'mixed-50':[10,10],'mixed-60g':[12,8],
    'mixed-40g':[8,12],'guardian-core':[20,0],'soul-core':[0,20]};
   assert.equal(r.focusMode,modes[r.pair]);
   assert.equal(r.focusGroup,groups[r.pair]);
   assert.deepEqual([r.defenderCore.guardian,r.defenderCore.soul,
    r.defenderCore.support],[...counts[r.focusMode],20]);
  }
  assert.ok([0,1].includes(r.win)&&r.turn>0&&Number.isFinite(r.reward));
  assert.equal(r.mirror,stage<=1);
  assert.equal(r.decayEnabled,stage===3||stage===6);
  assert.equal(r.decayPairStage,stage===6?5:stage);
  assert.equal(r.foeCheckpoint,stage===7?'guarded-v1555':r.scenario%2?'balanced-v1529':'champion-v1528');
  assert.equal(r.soulDisabled,false);assert.equal(r.counterDisabled,false);
  assert.ok(r.selfPlayCallsBySeat.every(x=>Number.isInteger(x)&&x>0));
  assert.ok(r.selfPlayStrategicBySeat.every(x=>Number.isInteger(x)&&x>0));
  assert.deepEqual(r.illegalSwitchesBySeat,[0,0]);
  assert.equal(r.finishAttacks+r.finishSwitches+r.finishEnds+
   r.breachSwitches+r.breachAttacks,0,'Old policy override leaked');
  const key=[stage,r.pair,r.scenario,r.starter,r.seat,r.arm].join('|');
  assert.ok(!seen.has(key),'Duplicate matched game '+key);seen.add(key);
 }
 for(let pair=0;pair<8;pair++)for(let sc=0;sc<(stage===4?24:stage===7?24:stage===8||stage===9?12:6);sc++)
  for(let start=0;start<2;start++)for(let seat=0;seat<2;seat++)
   for(const arm of names)
    assert.ok(seen.has([stage,pair,sc,start,seat,arm].join('|')),'Unpaired game');
 // New decision rules are deliberately disabled outside Soul and Guardian.
 // For identical decks, seat, starter and RNG, not even one existing Fusion,
 // Predator, Allrounder or Hybrid outcome/action is permitted to drift.
 const fixtureKey=r=>[r.pair,r.scenario,r.starter,r.seat].join('|');
 const frozenNonDefender=new Map(t.allCases.filter(r=>r.arm==='l10-guarded-worst-reply')
  .map(r=>[fixtureKey(r),r]));
 for(const r of t.allCases.filter(r=>stage!==9&&names.slice(3).includes(r.arm)&&
   !['soul','guardian'].includes(r.roleA))){
  const frozenCase=frozenNonDefender.get(fixtureKey(r));
  assert.ok(frozenCase,'Missing role-safe frozen control');
  assert.equal(r.win,frozenCase.win,'Role-safe win changed: '+r.arm+'/'+r.roleA);
  assert.equal(r.reward,frozenCase.reward,'Role-safe reward changed: '+r.arm+'/'+r.roleA);
  assert.deepEqual(r.candidateActionMix,frozenCase.candidateActionMix,
   'Role-safe decisions changed: '+r.arm+'/'+r.roleA);
 }
 const baseline=t.summaries[0];
 assert.equal(baseline.arm,'guardian-champion');
 assert.equal(t.chosenArm,'guardian-champion','No stage-local strategy selection allowed');
 assert.equal(t.promoted,false,'Stage-local promotion must be disabled');
 assert.deepEqual(t.selectedRolePolicy,t.summaries[0].rolePolicy);
 assert.equal(t.controls.incumbentChampionPolicyVerified,true);
 assert.equal(t.controls.currentOpponentAlsoUsesChampion,stage!==7);
 assert.equal(t.previousSelectedRolePolicy,null);
 assert.equal(t.controls.globalSelectionOnly,true);
 assert.equal(t.controls.noStageToStagePolicyInheritance,true);
 assert.deepEqual(t.trainCandidate,baseline.train);
 assert.deepEqual(t.validationCandidate,baseline.validation);
 assert.deepEqual(t.holdoutCandidate,baseline.holdout);
 for(const arm of t.summaries)for(const split of ['train','validation','holdout']){
  assert.equal(arm[split].games,stage===4?256:stage===7?256:stage===8||stage===9?128:64);
 }
 stages.push({stage,name:t.name,selected:'guardian-champion',promoted:false,
  selectedRolePolicy:t.summaries[0].rolePolicy,baseline:t.summaries[0],
  selectedSummary:t.summaries[0],summaries:t.summaries});
 if(stage===5)noDecayRows.push(...t.allCases);
 else if(stage===6)decayRows.push(...t.allCases);
 else if(stage===7)headToHeadRows.push(...t.allCases);
 else if(stage===8)focusedRows.push(...t.allCases);
 else if(stage===9)fusionFocusRows.push(...t.allCases);
 else rows.push(...t.allCases);
}
assert.equal(rows.length,9216);
assert.equal(noDecayRows.length,1152);
assert.equal(decayRows.length,1152);
assert.equal(headToHeadRows.length,4608);
assert.equal(focusedRows.length,2304);
assert.equal(fusionFocusRows.length,2304);
for(const split of ['train','validation','holdout'])
 assert.equal(rows.filter(r=>r.split===split).length,3072);
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
assert.equal(noDecayByKey.size,1152);
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
  actionTapeOff:off.arm==='fusion-sequence-tradeoff-context'?off.actions:undefined,
  actionTapeOn:on.arm==='fusion-sequence-tradeoff-context'?on.actions:undefined
 };
});
assert.equal(pairedDecayCases.length,1152);
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
// H2H duels have the frozen v14.9.50 champion on the OPPOSING seat.
// Their predeclared TRAIN+VALIDATION gate is used for candidate qualification;
// sealed HOLDOUT is never used to tune or qualify strategies, nor to train Q.
const directHeadToHead=names.map(arm=>{
 const mine=headToHeadRows.filter(r=>r.arm===arm);
 const c=summary(mine);
 return {arm,...c,
   bySplit:Object.fromEntries(['train','validation','holdout'].map(split=>
     [split,summary(mine.filter(r=>r.split===split))])),
   byRole:Object.fromEntries([...new Set(mine.map(r=>r.roleA))].sort().map(role=>
     [role,summary(mine.filter(r=>r.roleA===role))]))
 };
});
assert.ok(directHeadToHead.every(x=>x.games===768));
const h2hReference=new Map(headToHeadRows.filter(r=>r.arm==='l10-guarded-worst-reply')
 .map(r=>[[r.pair,r.scenario,r.starter,r.seat].join('|'),r]));
assert.equal(h2hReference.size,768);
const pairedHeadToHead=names.filter(arm=>arm!=='l10-guarded-worst-reply').map(arm=>{
 let toWin=0,toLoss=0;
 for(const r of headToHeadRows.filter(r=>r.arm===arm)){
  const ref=h2hReference.get([r.pair,r.scenario,r.starter,r.seat].join('|'));
  assert.ok(ref);
  if(r.win&&!ref.win)toWin++;
  if(!r.win&&ref.win)toLoss++;
 }
 return {arm,improvedMatches:toWin,regressedMatches:toLoss,net:toWin-toLoss};
});
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
  defenseProbes:filtered.reduce((n,r)=>n+(r.defenseProbes||0),0),
  defenseLegalSwitches:filtered.reduce((n,r)=>n+(r.defenseLegalSwitches||0),0),
  defenseChosen:filtered.reduce((n,r)=>n+(r.defenseChosen||0),0),
  defenseReplyAttacks:filtered.reduce((n,r)=>n+(r.defenseReplyAttacks||0),0),
  defenseTradeoffChecks:filtered.reduce((n,r)=>n+(r.defenseTradeoffChecks||0),0),
  defenseTradeoffOwnAttacks:filtered.reduce((n,r)=>n+(r.defenseTradeoffOwnAttacks||0),0),
  defenseTradeoffSwitches:filtered.reduce((n,r)=>n+(r.defenseTradeoffSwitches||0),0),
  defenseMarginChecks:filtered.reduce((n,r)=>n+(r.defenseMarginChecks||0),0),
  defenseMarginRejected:filtered.reduce((n,r)=>n+(r.defenseMarginRejected||0),0),
  defenseMarginAccepted:filtered.reduce((n,r)=>n+(r.defenseMarginAccepted||0),0),
  contextMarginChecks:filtered.reduce((n,r)=>n+(r.contextMarginChecks||0),0),
  contextMarginTotal:filtered.reduce((n,r)=>n+(r.contextMarginTotal||0),0),
  contextMarginLow:filtered.reduce((n,r)=>n+(r.contextMarginLow||0),0),
  contextMarginHigh:filtered.reduce((n,r)=>n+(r.contextMarginHigh||0),0),
  contextMarginDecay:filtered.reduce((n,r)=>n+(r.contextMarginDecay||0),0),
  enemyPostureSearches:filtered.reduce((n,r)=>n+(r.enemyPostureSearches||0),0),
  enemyPostureCandidates:filtered.reduce((n,r)=>n+(r.enemyPostureCandidates||0),0),
  enemyPostureLegal:filtered.reduce((n,r)=>n+(r.enemyPostureLegal||0),0),
  enemyPostureWorse:filtered.reduce((n,r)=>n+(r.enemyPostureWorse||0),0),
  enemyPostureGuardianSearches:filtered.reduce((n,r)=>n+(r.enemyPostureGuardianSearches||0),0),
  tacticalReplyChecks:filtered.reduce((n,r)=>n+(r.tacticalReplyChecks||0),0),
  tacticalReplyCandidates:filtered.reduce((n,r)=>n+(r.tacticalReplyCandidates||0),0),
  tacticalReplyLegal:filtered.reduce((n,r)=>n+(r.tacticalReplyLegal||0),0),
  tacticalReplyWorst:filtered.reduce((n,r)=>n+(r.tacticalReplyWorst||0),0),
  tacticalReplyGuardian:filtered.reduce((n,r)=>n+(r.tacticalReplyGuardian||0),0),
  tacticalReplyAllrounder:filtered.reduce((n,r)=>n+(r.tacticalReplyAllrounder||0),0),
  preciseAttackChecks:filtered.reduce((n,r)=>n+(r.preciseAttackChecks||0),0),
  preciseAttackSwing:filtered.reduce((n,r)=>n+(r.preciseAttackSwing||0),0),
  fusionPatienceChecks:filtered.reduce((n,r)=>n+(r.fusionPatienceChecks||0),0),
  fusionPatiencePenalties:filtered.reduce((n,r)=>n+(r.fusionPatiencePenalties||0),0),
  defenseThreatGated:filtered.reduce((n,r)=>n+(r.defenseThreatGated||0),0),
  defenseThreatEligible:filtered.reduce((n,r)=>n+(r.defenseThreatEligible||0),0),
  defenseAttackLockChecks:filtered.reduce((n,r)=>n+(r.defenseAttackLockChecks||0),0),
  defenseAttackLocks:filtered.reduce((n,r)=>n+(r.defenseAttackLocks||0),0),
  defenseArmorChecks:filtered.reduce((n,r)=>n+(r.defenseArmorChecks||0),0),
  defenseArmorRejected:filtered.reduce((n,r)=>n+(r.defenseArmorRejected||0),0),
  defenseCardThreatChecks:filtered.reduce((n,r)=>n+(r.defenseCardThreatChecks||0),0),
  defenseCardThreatRejected:filtered.reduce((n,r)=>n+(r.defenseCardThreatRejected||0),0),
  defenseScopedAttackChecks:filtered.reduce((n,r)=>n+(r.defenseScopedAttackChecks||0),0),
  defenseScopedAttackLocks:filtered.reduce((n,r)=>n+(r.defenseScopedAttackLocks||0),0),
  defenderAbilityChecks:filtered.reduce((n,r)=>n+(r.defenderAbilityChecks||0),0),
  defenderAbilityAlternatives:filtered.reduce((n,r)=>n+(r.defenderAbilityAlternatives||0),0),
  defenderAbilityOverrides:filtered.reduce((n,r)=>n+(r.defenderAbilityOverrides||0),0),
  defenderAbilityLethals:filtered.reduce((n,r)=>n+(r.defenderAbilityLethals||0),0),
  defenderCondenseChosen:filtered.reduce((n,r)=>n+(r.defenderCondenseChosen||0),0),
  defenderCondenseApplied:filtered.reduce((n,r)=>n+(r.defenderCondenseApplied||0),0),
  defenderCondenseOffered:filtered.reduce((n,r)=>n+(r.defenderCondenseOffered||0),0),
  defenderRaidPreferred:filtered.reduce((n,r)=>n+(r.defenderRaidPreferred||0),0),
  defenderDischargePreferred:filtered.reduce((n,r)=>n+(r.defenderDischargePreferred||0),0),
  defenderScopedSkipped:filtered.reduce((n,r)=>n+(r.defenderScopedSkipped||0),0),
  defenderCriticalReplyChecks:filtered.reduce((n,r)=>n+(r.defenderCriticalReplyChecks||0),0),
  defenderCriticalReplySkipped:filtered.reduce((n,r)=>n+(r.defenderCriticalReplySkipped||0),0),
  defenderReserveEvaluations:filtered.reduce((n,r)=>n+(r.defenderReserveEvaluations||0),0),
  defenderReservePenaltyTotal:filtered.reduce((n,r)=>n+(r.defenderReservePenaltyTotal||0),0),
  defenderFutureEvaluations:filtered.reduce((n,r)=>n+(r.defenderFutureEvaluations||0),0),
  defenderFuturePenaltyTotal:filtered.reduce((n,r)=>n+(r.defenderFuturePenaltyTotal||0),0),
  defenderDischargeWindowChecks:filtered.reduce((n,r)=>n+(r.defenderDischargeWindowChecks||0),0),
  defenderDischargeWindowPenalties:filtered.reduce((n,r)=>n+(r.defenderDischargeWindowPenalties||0),0),
  defenderCondenseTimingChecks:filtered.reduce((n,r)=>n+(r.defenderCondenseTimingChecks||0),0),
  defenderPostReplyForecasts:filtered.reduce((n,r)=>n+(r.defenderPostReplyForecasts||0),0),
  defenderPostReplyLegal:filtered.reduce((n,r)=>n+(r.defenderPostReplyLegal||0),0),
  defenderPostReplyWins:filtered.reduce((n,r)=>n+(r.defenderPostReplyWins||0),0),
  defenderPostReplyValueTotal:filtered.reduce((n,r)=>n+(r.defenderPostReplyValueTotal||0),0),
  defenderStrikeForecasts:filtered.reduce((n,r)=>n+(r.defenderStrikeForecasts||0),0),
  defenderStrikeSwitches:filtered.reduce((n,r)=>n+(r.defenderStrikeSwitches||0),0),
  defenderStrikeAttacks:filtered.reduce((n,r)=>n+(r.defenderStrikeAttacks||0),0),
  defenderCounterstrikeForecasts:filtered.reduce((n,r)=>n+(r.defenderCounterstrikeForecasts||0),0),
  defenderCounterstrikeHits:filtered.reduce((n,r)=>n+(r.defenderCounterstrikeHits||0),0),
  defenderHoldDecisions:filtered.reduce((n,r)=>n+(r.defenderHoldDecisions||0),0),
  defenderAttackTradeoffs:filtered.reduce((n,r)=>n+(r.defenderAttackTradeoffs||0),0),
  defenderDischargeCounterfactuals:filtered.reduce((n,r)=>n+(r.defenderDischargeCounterfactuals||0),0),
  defenderDischargeAvoidedRisks:filtered.reduce((n,r)=>n+(r.defenderDischargeAvoidedRisks||0),0),
  defenderDecayContextChecks:filtered.reduce((n,r)=>n+(r.defenderDecayContextChecks||0),0),
  defenderDecayUrgencyBoosts:filtered.reduce((n,r)=>n+(r.defenderDecayUrgencyBoosts||0),0),
  defenderDecayCondenseDeferrals:filtered.reduce((n,r)=>n+(r.defenderDecayCondenseDeferrals||0),0),
  defenderDangerousDischarges:filtered.reduce((n,r)=>n+(r.defenderDangerousDischarges||0),0),
  defenderAdaptiveSwitchChecks:filtered.reduce((n,r)=>n+(r.defenderAdaptiveSwitchChecks||0),0),
  defenderAdaptiveSwitchAttacks:filtered.reduce((n,r)=>n+(r.defenderAdaptiveSwitchAttacks||0),0),
  defenderPairedForecasts:filtered.reduce((n,r)=>n+(r.defenderPairedForecasts||0),0),
  defenderPairedReplyAttacks:filtered.reduce((n,r)=>n+(r.defenderPairedReplyAttacks||0),0),
  defenderPairedSoulSurvivals:filtered.reduce((n,r)=>n+(r.defenderPairedSoulSurvivals||0),0),
  defenderPairedCounterDamage:filtered.reduce((n,r)=>n+(r.defenderPairedCounterDamage||0),0),
  defenderPairedAvoidedCondense:filtered.reduce((n,r)=>n+(r.defenderPairedAvoidedCondense||0),0),
  defenderPairedLowSoul:filtered.reduce((n,r)=>n+(r.defenderPairedLowSoul||0),0),
  defenderL10SelectiveChecks:filtered.reduce((n,r)=>n+(r.defenderL10SelectiveChecks||0),0),
  defenderL10SelectiveRuns:filtered.reduce((n,r)=>n+(r.defenderL10SelectiveRuns||0),0),
  defenderL10SelectiveSkipped:filtered.reduce((n,r)=>n+(r.defenderL10SelectiveSkipped||0),0),
  defenderL10ThreatRemoved:filtered.reduce((n,r)=>n+(r.defenderL10ThreatRemoved||0),0),
  defenderL10LowEssenceChecks:filtered.reduce((n,r)=>n+(r.defenderL10LowEssenceChecks||0),0),
  defenderContestChecks:filtered.reduce((n,r)=>n+(r.defenderContestChecks||0),0),
  defenderContestLegalRaids:filtered.reduce((n,r)=>n+(r.defenderContestLegalRaids||0),0),
  defenderContestReplyAttacks:filtered.reduce((n,r)=>n+(r.defenderContestReplyAttacks||0),0),
  defenderContestRaidBetter:filtered.reduce((n,r)=>n+(r.defenderContestRaidBetter||0),0),
  defenderContestDischargeBetter:filtered.reduce((n,r)=>n+(r.defenderContestDischargeBetter||0),0),
  defenderContestAvoidedLethals:filtered.reduce((n,r)=>n+(r.defenderContestAvoidedLethals||0),0),
  defenderContestThreatRemoved:filtered.reduce((n,r)=>n+(r.defenderContestThreatRemoved||0),0),
  defenderThreatCompareChecks:filtered.reduce((n,r)=>n+(r.defenderThreatCompareChecks||0),0),
  defenderThreatReplyAttacks:filtered.reduce((n,r)=>n+(r.defenderThreatReplyAttacks||0),0),
  defenderThreatRaidCredits:filtered.reduce((n,r)=>n+(r.defenderThreatRaidCredits||0),0),
  defenderThreatDischargePenalties:filtered.reduce((n,r)=>n+(r.defenderThreatDischargePenalties||0),0),
  defenderThreatSoulSurvivals:filtered.reduce((n,r)=>n+(r.defenderThreatSoulSurvivals||0),0),
  defenderThreatImmediateRemovals:filtered.reduce((n,r)=>n+(r.defenderThreatImmediateRemovals||0),0),
  defenderThreatLethalRejects:filtered.reduce((n,r)=>n+(r.defenderThreatLethalRejects||0),0),
  defenderThreatGuardianChecks:filtered.reduce((n,r)=>n+(r.defenderThreatGuardianChecks||0),0),
  defenderUnifiedChecks:filtered.reduce((n,r)=>n+(r.defenderUnifiedChecks||0),0),
  defenderUnifiedAttackChecks:filtered.reduce((n,r)=>n+(r.defenderUnifiedAttackChecks||0),0),
  defenderUnifiedRaidChecks:filtered.reduce((n,r)=>n+(r.defenderUnifiedRaidChecks||0),0),
  defenderUnifiedDischargeChecks:filtered.reduce((n,r)=>n+(r.defenderUnifiedDischargeChecks||0),0),
  defenderUnifiedReplies:filtered.reduce((n,r)=>n+(r.defenderUnifiedReplies||0),0),
  defenderUnifiedThreatRelief:filtered.reduce((n,r)=>n+(r.defenderUnifiedThreatRelief||0),0),
  defenderUnifiedOwnLosses:filtered.reduce((n,r)=>n+(r.defenderUnifiedOwnLosses||0),0),
  defenderUnifiedEnemyLosses:filtered.reduce((n,r)=>n+(r.defenderUnifiedEnemyLosses||0),0),
  defenderUnifiedSoulSurvival:filtered.reduce((n,r)=>n+(r.defenderUnifiedSoulSurvival||0),0),
  defenderUnifiedReplyLethals:filtered.reduce((n,r)=>n+(r.defenderUnifiedReplyLethals||0),0),
  defenderEndgameContextChecks:filtered.reduce((n,r)=>n+(r.defenderEndgameContextChecks||0),0),
  defenderEndgameLearnedBiases:filtered.reduce((n,r)=>n+(r.defenderEndgameLearnedBiases||0),0),
  defenderEndgameExtendedReplies:filtered.reduce((n,r)=>n+(r.defenderEndgameExtendedReplies||0),0),
  defenderEndgameFollowupAttacks:filtered.reduce((n,r)=>n+(r.defenderEndgameFollowupAttacks||0),0),
  defenderEndgameProjectedLosses:filtered.reduce((n,r)=>n+(r.defenderEndgameProjectedLosses||0),0),
  defenderCooperationChecks:filtered.reduce((n,r)=>n+(r.defenderCooperationChecks||0),0),
  defenderCooperationReplyAttacks:filtered.reduce((n,r)=>n+(r.defenderCooperationReplyAttacks||0),0),
  defenderCooperationBothSurvive:filtered.reduce((n,r)=>n+(r.defenderCooperationBothSurvive||0),0),
  defenderCooperationGuardianLost:filtered.reduce((n,r)=>n+(r.defenderCooperationGuardianLost||0),0),
  defenderCooperationSoulLost:filtered.reduce((n,r)=>n+(r.defenderCooperationSoulLost||0),0),
  defenderCooperationCounters:filtered.reduce((n,r)=>n+(r.defenderCooperationCounters||0),0),
  defenderCooperationRolePreservedValue:filtered.reduce((n,r)=>n+(r.defenderCooperationRolePreservedValue||0),0),
  defenderCondenseThreatOpportunities:filtered.reduce((n,r)=>n+(r.defenderCondenseThreatOpportunities||0),0),
  defenderCondenseLegalTrials:filtered.reduce((n,r)=>n+(r.defenderCondenseLegalTrials||0),0),
  defenderCondenseRejectedTrials:filtered.reduce((n,r)=>n+(r.defenderCondenseRejectedTrials||0),0),
  defenderCondenseOfferedSoulTotal:filtered.reduce((n,r)=>n+(r.defenderCondenseOfferedSoulTotal||0),0),
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
// Select ONE new profile with predeclared TRAIN+VALIDATION gates. Besides five
// main stages, stage 7's actual head-to-head and stage 8's fixed difficult
// targeted Soul/Guardian VALIDATION is a strict release gate.
// Stage 5/6 remain controlled diagnostics; no HOLDOUT enters selection.
const byArm=new Map(arms.map(a=>[a.arm,a]));
const base=byArm.get('guardian-champion');
 const oldTwoPly=byArm.get('fusion-sequence-2ply');
const frozen=byArm.get('l10-guarded-worst-reply');
assert.ok(base&&oldTwoPly&&frozen);
const h2hByArm=new Map(directHeadToHead.map(x=>[x.arm,x]));
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
 const activeDecay=compare(arm,'validation','active-decay-crossrole',r=>r.stage===3);
 return {mirror,crossRole,current,older,hardL10,activeDecay};
};
const phaseWins=(source,arm,split)=>source.filter(r=>r.arm===arm&&r.split===split)
 .reduce((n,r)=>n+r.win,0);
// Predeclared mixed-vs-pure evaluation: exact opponent decks, seeds,
 // positions and starters are shared by focused pairs 0/1/2 and 3/4/5.
const matchedFocus=(arm,split,pair)=>phaseWins(
 focusedRows.filter(r=>r.pair===pair),arm,split);
const mixedCoreAudits=names.map(arm=>{
 const groups=[{enemy:'predator',mix:0,guardian:1,soul:2},
  {enemy:'fusion',mix:3,guardian:4,soul:5}];
 return {arm,groups:groups.map(g=>({
  opponent:g.enemy,
  mixed50:Object.fromEntries(['train','validation','holdout'].map(split=>
   [split,matchedFocus(arm,split,g.mix)])),
  guardianCore:Object.fromEntries(['train','validation','holdout'].map(split=>
   [split,matchedFocus(arm,split,g.guardian)])),
  soulCore:Object.fromEntries(['train','validation','holdout'].map(split=>
   [split,matchedFocus(arm,split,g.soul)]))
 })),ratioVariants:Object.fromEntries([6,7].map(pair=>
  [['mixed-60g','mixed-40g'][pair-6],
  Object.fromEntries(['train','validation','holdout'].map(split=>
   [split,matchedFocus(arm,split,pair)]))]))};
});
const fusionIdentityAudits=names.map(arm=>{
 const own=fusionFocusRows.filter(r=>r.arm===arm);
 const byMode=Object.fromEntries(['fusion-mixed','fusion-allrounder',
  'fusion-predator','predator-swarm'].map(mode=>{
  const c=own.filter(r=>r.fusionMode===mode);
  return [mode,{roles:c[0]?.fusionMaterialRoles||{},
   splits:Object.fromEntries(['train','validation','holdout'].map(sp=>
    [sp,summary(c.filter(r=>r.split===sp))])),
   fusionChosen:c.reduce((n,r)=>n+(r.candidateActionMix?.fusion||0),0),
   materialsPaid:c.reduce((n,r)=>n+(r.fusionIdentityChosenMaterials||0),0),
   resonatorChosen:c.reduce((n,r)=>n+(r.fusionIdentityChosenResonators||0),0),
   normalSummons:c.reduce((n,r)=>n+(r.candidateActionMix?.normal||0),0)}];
 }));
 const checks=['fusionIdentityChecks','fusionIdentityNetUtility','fusionIdentityMaterialOnField',
  'fusionIdentitySurvivors','fusionIdentityResonators','fusionIdentitySwarmCosts',
  'fusionIdentityChosen','fusionIdentityChosenMaterials','fusionIdentityChosenResonators'];
 return {arm,overall:summary(own),byMode,
  observed:Object.fromEntries(checks.map(k=>[k,own.reduce((n,r)=>n+(r[k]||0),0)]))};
});
const eligible=arms.slice(3).map(a=>{
 const trainGain=a.splits.train.wins-base.splits.train.wins;
 const validationGain=a.splits.validation.wins-base.splits.validation.wins;
 const trainGainVsFrozen=a.splits.train.wins-frozen.splits.train.wins;
 const validationGainVsFrozen=a.splits.validation.wins-frozen.splits.validation.wins;
 const hardL10ValidationVsFrozen=summary(gt(a.arm).filter(r=>r.stage===4&&r.split==='validation')).wins-
  summary(gt(frozen.arm).filter(r=>r.stage===4&&r.split==='validation')).wins;
 const decayValidationVsFrozen=summary(gt(a.arm).filter(r=>r.stage===3&&r.split==='validation')).wins-
  summary(gt(frozen.arm).filter(r=>r.stage===3&&r.split==='validation')).wins;
 const h2hTrainWins=phaseWins(headToHeadRows,a.arm,'train');
 const h2hValidationWins=phaseWins(headToHeadRows,a.arm,'validation');
 const h2hTrainGain=h2hTrainWins-phaseWins(headToHeadRows,frozen.arm,'train');
 const h2hValidationGain=h2hValidationWins-phaseWins(headToHeadRows,frozen.arm,'validation');
 const focusedValidationGain=phaseWins(focusedRows,a.arm,'validation')-
  phaseWins(focusedRows,frozen.arm,'validation');
 const fusionFocusValidationGain=phaseWins(fusionFocusRows,a.arm,'validation')-
  phaseWins(fusionFocusRows,'defender-v1569-mixed-control','validation');
 const fusionFocusTrainGain=phaseWins(fusionFocusRows,a.arm,'train')-
  phaseWins(fusionFocusRows,'defender-v1569-mixed-control','train');
 const fusionIdentityGate=a.arm==='role-identity-conditional-fusion'?
  fusionFocusValidationGain>=0&&fusionFocusTrainGain>=-2:true;
 const focusedMixValidationGain=[0,3,6,7].reduce((total,pair)=>
  total+matchedFocus(a.arm,'validation',pair)-
  matchedFocus('defender-v1569-mixed-control','validation',pair),0);
 const coreSynergyByOpponent=[{mix:0,guardian:1,soul:2},
  {mix:3,guardian:4,soul:5}].map(g=>{
   const wins=matchedFocus(a.arm,'validation',g.mix);
   return {mixed:wins,guardian:matchedFocus(a.arm,'validation',g.guardian),
    soul:matchedFocus(a.arm,'validation',g.soul)};
 });
 const mixedBeatsBothPure=coreSynergyByOpponent.every(g=>
  g.mixed>=g.guardian&&g.mixed>=g.soul);
 const mixedSafeVsPrior=focusedMixValidationGain>=0;
 const mixedSynergyGate=a.arm==='role-identity-conditional-fusion'?
  mixedSafeVsPrior&&mixedBeatsBothPure:true;
 const hardL10ValidationVsGuardian=summary(gt(a.arm).filter(r=>r.stage===4&&r.split==='validation')).wins-
  summary(gt(base.arm).filter(r=>r.stage===4&&r.split==='validation')).wins;
 const roleDelta=(source,split,role)=>phaseWins(source.filter(r=>r.roleA===role),a.arm,split)-
  phaseWins(source.filter(r=>r.roleA===role),frozen.arm,split);
 const fusionTrainGain=roleDelta(rows,'train','fusion');
 const fusionValidationGain=roleDelta(rows,'validation','fusion');
 const predatorValidationGain=roleDelta(rows,'validation','predator');
 const fusionNonRegression=fusionTrainGain>=0&&fusionValidationGain>=0;
 const seatParity=[0,1].every(seat=>
  a.splits.train.bySeat[seat].wins>=base.splits.train.bySeat[seat].wins&&
  a.splits.validation.bySeat[seat].wins>=base.splits.validation.bySeat[seat].wins);
 const seatNonRegressionVsFrozen=[0,1].every(seat=>
  a.splits.validation.bySeat[seat].wins>=frozen.splits.validation.bySeat[seat].wins-1&&
  a.splits.train.bySeat[seat].wins>=frozen.splits.train.bySeat[seat].wins-2);
 const groups=groupChecks(a.arm);
 const guardianGate=trainGain>=8&&validationGain>=8&&seatParity&&
  Object.entries(groups).every(([key,delta])=>delta>=(key==='hardL10'?2:-3));
 const championGate=trainGainVsFrozen>=2&&validationGainVsFrozen>=6&&
  hardL10ValidationVsFrozen>=2&&hardL10ValidationVsGuardian>=2&&
  decayValidationVsFrozen>=0&&seatNonRegressionVsFrozen&&
  h2hTrainGain>=4&&h2hValidationGain>=8&&focusedValidationGain>=0&&
  fusionNonRegression&&predatorValidationGain>=-1&&mixedSynergyGate&&fusionIdentityGate;
 return {arm:a.arm,trainGain,validationGain,seatParity,groups,guardianGate,
  trainGainVsFrozen,validationGainVsFrozen,hardL10ValidationVsFrozen,
  hardL10ValidationVsGuardian,decayValidationVsFrozen,
  h2hTrainWins,h2hValidationWins,h2hTrainGain,h2hValidationGain,focusedValidationGain,
  fusionFocusValidationGain,fusionFocusTrainGain,fusionIdentityGate,
  focusedMixValidationGain,coreSynergyByOpponent,mixedSafeVsPrior,
  mixedBeatsBothPure,mixedSynergyGate,
  fusionTrainGain,fusionValidationGain,predatorValidationGain,fusionNonRegression,
  seatNonRegressionVsFrozen,qualifies:guardianGate&&championGate};
});
const selectedCandidates=eligible.filter(x=>x.qualifies).sort((a,b)=>
 b.h2hValidationGain-a.h2hValidationGain||
 b.validationGainVsFrozen-a.validationGainVsFrozen||b.validationGain-a.validationGain||
 b.trainGain-a.trainGain||a.arm.localeCompare(b.arm));
// Never discard a previously promoted champion just because a fresh seeded
// cohort is noisy. Neither holdout nor independent decay A/B can promote it.
const chosen=selectedCandidates[0]?.arm||frozen.arm;
const selection={
 arm:chosen,promoted:chosen!==frozen.arm,
 policy:rows.find(x=>x.arm===chosen)?.rolePolicy??null,
 incumbent:frozen.arm,incumbentFromRun:40258011184,
 legacyGuardian:'guardian-champion',legacyGuardianFromRun:39974390088,
 formerResearchChampion:oldTwoPly.arm,formerResearchChampionFromRun:40137913164,
 selectionBasedOn:['train','validation'],
 selectionGateStages:[0,1,2,3,4,7,8],holdoutSeenBySelector:false,
 requires:{trainGainVsGuardian:8,validationGainVsGuardian:8,
  trainGainVsFrozen:2,validationGainVsFrozen:6,seatNonRegression:true,
  hardL10VsGuardian:2,hardL10VsFrozen:2,fullDecayVsFrozen:0,
  directH2HTrainGain:4,directH2HValidationGain:8,
  focusedHardL10ValidationGain:0,mixedSafeVsPrior:true,mixedBeatsPureControls:true,
   fusionFocusNonRegression:true,
  seatVsFrozenTolerance:-1,
  subgroupValidationTolerance:-3,fusionNonRegression:true,
  predatorValidationTolerance:-1},
 candidates:eligible,
 // These diagnostics are only attached after selection has finished.
 holdoutWins:byArm.get(chosen).splits.holdout.wins,
 holdoutReferenceWins:base.splits.holdout.wins,
 holdoutDifference:byArm.get(chosen).splits.holdout.wins-base.splits.holdout.wins,
 holdoutFrozenWins:frozen.splits.holdout.wins,
 holdoutDifferenceVsFrozen:byArm.get(chosen).splits.holdout.wins-frozen.splits.holdout.wins
};
const priorResearchChampion={
 arm:frozen.arm,sourceRun:40258011184,
 status:'previously-promoted-research-champion',
 revalidated:frozen.splits.validation.wins>=base.splits.validation.wins,
 // Freeze previously promoted policy regardless of one new cohort.
 retainedForResearchReview:true
};
// Focus TRAIN+VALIDATION are protected qualifying constraints; focus HOLDOUT
// is still appended only after selection, never used for parameter tuning.
const focusedDiagnostic=names.map(arm=>{
 const own=focusedRows.filter(r=>r.arm===arm);
 const roleMatchups=[
  ['soul-offense',r=>r.roleA==='soul'],
  ['guardian-counterplay',r=>r.roleA==='guardian'],
  ['other-controls',r=>r.roleA!=='soul'&&r.roleA!=='guardian']
 ];
 return {arm,overall:summary(own),
  groups:Object.fromEntries(roleMatchups.map(([name,predicate])=>
   [name,Object.fromEntries(['train','validation','holdout'].map(split=>
    [split,summary(own.filter(r=>r.split===split&&predicate(r)))]))]))};
});
// Training-only first-decision divergence observations, never selection input.
// Report descriptive counts and examples; a divergent action does NOT establish cause.
const decisionDiagnostics=names.slice(3).map(arm=>{
 const mine=decisionRows.filter(r=>r.arm===arm);
 const regressions=mine.filter(r=>r.incumbentWin===1&&r.candidateWin===0);
 const improvements=mine.filter(r=>r.incumbentWin===0&&r.candidateWin===1);
 const brokenDownByStage=Object.fromEntries(Array.from({length:9},(_,stage)=>{
  const own=mine.filter(r=>r.stage===stage);
  return [stage,{games:own.length,improvements:own.filter(r=>r.incumbentWin===0&&r.candidateWin===1).length,
   regressions:own.filter(r=>r.incumbentWin===1&&r.candidateWin===0).length}];
 }));
 const types=Object.fromEntries([...new Set(regressions.map(r=>r.candidateAction?.type||'none'))].map(type=>
  [type,regressions.filter(r=>(r.candidateAction?.type||'none')===type).length]));
 return {arm,trainCases:mine.length,improvements:improvements.length,
  regressions:regressions.length,net:improvements.length-regressions.length,
  firstDivergentActionTypesInRegressions:types,byStage:brokenDownByStage,
  exampleRegressions:regressions.slice(0,16),exampleImprovements:improvements.slice(0,16)};
});
const report={schema:'arcane-v1571-defender-sequences-report',status:'completed',
 sourceSha:process.env.GITHUB_SHA||'unknown',
 totalDuels:20736,primaryDuels:9216,decayDiagnosticDuels:1152,noDecayDiagnosticDuels:1152,
 headToHeadDiagnosticDuels:4608,focusedDiagnosticDuels:2304,
 fusionIdentityDuels:2304,
 trainDuels:3072,validationDuels:3072,holdoutDuels:3072,
 controls:{bothSeatsUseFullStrategicAI:true,noIllegalMoves:true,
  trainValidationHoldoutSeparated:true,holdoutNeverUsedForSelection:true,
  globalFiveStageSelection:true,additionalHeadToHeadGate:true,
  additionalFocusedRoleGate:true,stageLocalPromotionDisabled:true,
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
  fullCombat:true,arenaLPDecayResearchOnlyOff:false,
  mainValidationIncludesRealDecay:true,mainDecayStage:3,
  independentFullDecayDiagnostic:true,independentDecayPairExcludedFromPromotion:true,
  exactMatchedDecayAB:true,abBothStagesExcludedFromPromotion:true,
  legalTwoPlyOwnAndEnemyReply:true,fullDecayUrgencyAblation:true,
  boundedVisibleWorstReplySearch:true,targetedGuardianSoulReplySearch:true,
  legalDefensiveActionSelection:true,headToHeadFrozenV1555:true,
  offenseVsDefenseSameHorizon:true,frozenLegacyDefenseControl:false,
  defenseMarginAblation:true,predeclaredDefenseMargin:260,
  contextualDefenseMargin:true,contextualMarginMin:105,contextualMarginMax:285,
  nextTurnEnemyPostureSearch:true,guardianSoulPostureSubset:true,
  contextualMarginSelectionOnlyUsesVisibleInfo:true,
  directH2HTrainValidationRequiredForPromotion:true,
  seatTwoPairedOutcomeTracing:true,
  replicatedPromotedPolicyFrozen:true,
  targetedLegalGuardianReplies:true,targetedLegalAllrounderReplies:true,
  extendedHardL10SamplePerRole:true,hardL10ScenariosPerPair:24,
  focusedL10ScenariosPerPair:12,directH2HScenariosPerPair:24,
  boundedVisibleEnemyAttackBranches:6,strictFrozenV1555PromotionGate:true,
  preciseLegalAttackTradeoff:true,publicFusionPatience:false,visibleThreatGatedDefense:true,
  damageAwareDefenderActions:true,boundedVisibleReplyDefenderActions:true,
  defenderRoleScopedPlanner:true,selectiveCriticalReplySearch:true,
  nonLethalEssenceReserveScoring:true,fusionNonRegressionGate:true,
  nonDefenderExactReplayParity:true,
  futureVisibleDamageOpportunityCost:true,tacticalCondenseLegalityAudited:true,
   boundedLegalSoulFollowupAfterEnemyAttacks:true,condenseAtkFromRemainingShield:true,
  sameTurnCondenseSwitchAttackResearch:true,
  counterstrikeVsImmediateAttackChoice:true,
  dischargeVsRaidLegalReplyCounterfactual:true,
  publicArenaDecayUrgencyForDefender:true,
  riskyDischargeVisibleSurvivalGate:true,
  seatSymmetricConditionalStrikeMargin:true,
  boundedLegalActionCounterfactualRerank:true,
  retainedV1562StabilityAsExactPolicyControl:true,
  selectiveVisibleHighTierSoulThreatForecasts:true,
  v1563CounterfactualExactControlRetained:true,
  legalRaidVersusNonLethalDischargeContest:true,
  retainedV1564FollowupAndSelectiveControls:true,
  roleScopedVerifiedSoulThreatRelief:true,
  conditionalNonLethalDischargeSurvivalValue:true,
  exactV1565RaidContestAndPostReplyControls:true,
  unifiedVisibleOpponentReplyForAllThreeAttackClasses:true,
  unchangedV1566PostreplyAndThreatControls:true,
  previousRunTRAINOnlyFailureWindowLearning:true,
  extendedEndgamePublicReplyAndAttackForecast:true,
  endgameObservationalBiasCapped:true,
  v1567UnifiedControlExactReplay:true,
  balancedMixedGuardianSoulDecksFromSourceLegalCards:true,
  fixedSupportCoreAndMatchedOpponentRng:true,
  cooperationScoredOnlyFromRealVisibleReplies:true,
  explicitMixedVsPureValidationPromotionGate:true,
  uniformRolePolicyForAllDefenderDeckRatios:true,
  fusionMaterialVsSwarmBenchmarks:true,
  fusionMaterialCostAndResonatorDiagnostics:true,
  fusionRoleIdentityValidationGate:true,
  formerV1556BestUnpromotedPolicyRetainedAsAblation:true,
  targetedSoulGuardianMatchups:true,fusionAndPredatorControls:true,
  trainOnlyPairedFirstActionDivergence:true,firstDivergenceDoesNotProveCausality:true,
  qImprovementGateUsesTrainingOnly:true,qRequiredIndependentGainPercent:5,
  focusedL10HoldoutExcludedFromSelection:true,
  noProductionChanges:true},
 stages,arms,paired,globalSelection:selection,priorResearchChampion,decisionDiagnostics,
  noDecayArms,decayArms,pairedDecayArms,pairedDecayCases,
  directHeadToHead,pairedHeadToHead,focusedDiagnostic,mixedCoreAudits,fusionIdentityAudits,
 limitations:[
 'Fusion survival after actual cloned counterattacks is measured only within the existing capped 2-attack forecast, not a complete opponent turn.',
 'Material scarcity uses only the candidate own hand after legally applying fusion on the clone; no hidden opposing hand is considered.',
 'Soul support experiments use public foe Guardian DEF and do not resolve the full counter-play game tree.',
 'Seat and starter subgroup differences can be sampling noise; allrounder and opponent-role subgroups are small.',
 'Enemy posture counterfactual is bounded: after own cloned legal attacks, an opponent ATK-to-DEF switch via actual baseApply is simulated in its NEXT legal positions phase, followed by up to two enemy attacks; no full-turn hidden information and no prediction of spell/active abilities.',
 'Adaptive defense margin uses fixed predeclared bounded 105-285 utility threshold, computed only from visible own/enemy fields, own/enemy LP and whether matched decay is enabled; no hidden opponent cards or results.',
 'Selective defense only invokes legal preview when current visible enemy attack threatens an unswitched own attacker; candidate threshold fixed before run, not tuned on holdout.',
 'New attack-vs-defense planner executes up to two own legal attacks before up to two visible opponent replies for both options, as a partial forecast, not an entire turn or hidden-hand search.',
 'v14.9.71 benchmark constructs source-legal level-10 20-card defensive cores with Guardian/Soul mixes (10/10 12/8 8/12), Guardian-only and Soul-only defense cores, plus identical 20 support cards per seed. Stage 8 shares actual enemy decks, random seeds, starting seat and starter between mixed and pure controls. Synergy is evaluated from concrete surviving roles, card losses and counterdamage after up to two legal public enemy attacks; no invented card buffs. Focus validation, never focus holdout, contributes to predeclared strict promotion gates.',
 'Stage 9 holds the AI candidateRole=fusion constant for all four constructed role profiles in paired cohorts against Guardians and Souls, preserving legal material sources. Fusion action economics and surviving Resonators are diagnostic, not proof that their costs are causally optimal.',
  'Stage 8 holds candidateRole=soul constant across ALL Guardian/Soul ratios, eliminating the earlier preference-label confound while retaining the Soul-capable strategic planner.',
  'Stage 7 uses the verified frozen v14.9.55 guarded research champion as the opposing strategy. It spans 24 scenarios per pair (8 each TRAIN/VALIDATION/HOLDOUT), with 256 distinct validation duels per arm. Holdout and Q training are excluded.',
 'New sequence-worst branch prioritizes visible enemy attack/target options by legal public board danger and probes at most ten first replies per candidate fusion; bounded counterfactual, not full minimax.',
 'New fusion sequencing simulates up to two legal own attacks then two legal replies, not a complete turn or hidden-hand game tree.',
 'Condense is enabled only for the tactical-condense candidate, and its 3-turn cooldown, guarded soul transfer and opportunity scoring are checked in the research simulator against public essence-combat rules. It has not yet been validated as a production AI ability.',
 'Opponent attack planning remains limited cloned-attack approximation, not a full adversarial turn search.',
 'Action mix and scoring diagnostics are descriptive rather than causal evidence.',
 'Role-specific policies are hand-engineered scoring variants, not comprehensive self-improving reinforcement learning.',
 'Older opponent checkpoint freezes Q and selected weights; it does not freeze the entire former engine source.',
 'All challengers face the v14.9.28 validated Guardian/Soul champion and the predefined v14.9.29 balanced opponent; the v14.9.31 holdout stays sealed for selection.',
 'The incumbent Guardian/Soul reference is rerun on the same decks, starter and RNG seeds as all candidate policies.',
 'Main stages 0, 1, 2 and 4 keep decay off while main stage 3 enables symmetric real LP decay; stages 5 and 6 have exactly paired seed/deck/opponent/starter settings and differ only in decay activation. Stages 5 and 6 remain excluded from promotion and Q training.',
 'This run challenges the guarded champion retained through v14.9.55; it cannot silently roll back to Guardian or 2-ply checkpoint.',
 'Adaptive features use visible current LP, threats and Guardian/Soul board state; no hidden opponent hand knowledge.',
 'The fresh hard-L10 focus phase 8 has a predeclared TRAIN+VALIDATION non-regression gate; its sealed HOLDOUT is diagnostic only and never feeds training or candidate selection.',
 'Targeted Soul and Guardian matchup branches use only currently visible enemy cards and legal attacks; fusion and predator control pairs detect unintended strategy crossover.',
 'The hard-L10 stage uses 24 fresh scenarios per role pair (8 TRAIN, 8 VALIDATION, 8 sealed HOLDOUT); focused stage 8 uses 12 per pair (4 per split), including Soul/Guardian and fusion/predator controls.',
 'Primary stage 3 now uses the REAL symmetric LP decay on fresh decks and paired seats. Matched stages 5 and 6 remain separate diagnostics and are never used for promotion.',
 'Any challenger must beat the frozen v14.9.55 champion by at least six main validation wins, two hard-L10 validation wins above both that champion and old Guardian, six H2H validation wins, no fusion train/validation regression, at most one predator validation loss, and protected seats. Holdout is reported only after selection.',
 'Stage-by-stage paired candidate-versus-incumbent action divergences include TRAIN cases only; earliest differing action is not necessarily what caused a win or loss.',
 'The v14.9.56 best unpromoted policy is an explicit control for isolated future-value and tactical-condense changes. We do not infer causal long-run improvement without direct frozen-champion TRAIN and VALIDATION tests.',
 'New 5% Q-learning thresholds apply to two disjoint training-only validations; poor unseen holdout performance is a diagnostic, never selection feedback.',
 'Changing the live AI or main branch requires separate explicit validation.'
 ]};
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1557_COMPLETE '+JSON.stringify({
 total:report.totalDuels,globallySelected:selection.arm,
 selectionTrainGain:eligible.find(x=>x.arm===selection.arm)?.trainGain??0,
 selectionValidationGain:eligible.find(x=>x.arm===selection.arm)?.validationGain??0,
 selectionHoldoutDifference:selection.holdoutDifference,
 holdout:arms.map(x=>({arm:x.arm,wins:x.splits.holdout.wins})),
 validation:arms.map(x=>({arm:x.arm,wins:x.splits.validation.wins}))
}));
