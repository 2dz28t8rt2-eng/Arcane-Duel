'use strict';
/* Fail-closed v14.9.54 evaluation versus frozen v14.9.53 winner.
 * Main stages use 2+2+2 split, except hard-L10 stage 4 with 8+8+8.
 * Stage 7 H2H uses 6+6+6; focused stage 8 uses 4+4+4.
 * All results are paired by seed/seat/starter.
 * All selections are predeclared TRAIN+VALIDATION only; HOLDOUT remains sealed. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1554',names=[
 'guardian-champion','fusion-sequence-2ply','l10-guarded-worst-reply',
 'guarded-selective-defense','guarded-card-threat-defense','guarded-card-threat-attack-defense'
];
const stages=[],rows=[],noDecayRows=[],decayRows=[],headToHeadRows=[],focusedRows=[],seen=new Set(),decisionRows=[];
for(let stage=0;stage<9;stage++){
 const t=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'.json','utf8'));
 assert.equal(t.schema,'arcane-v1554-stage');assert.equal(t.stage,stage);
 assert.equal(t.allCases.length,stage===4?4608:stage===7?3456:stage===8?2304:1152);assert.equal(t.summaries.length,6);
 assert.equal(t.controls.holdoutNeverUsedForSelection,true);
 assert.equal(t.controls.independentTrainValidationHoldout,true);
 const trace=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'-train-actions.json','utf8'));
 assert.equal(trace.examples.length,stage===4?1536:stage===7?1152:stage===8?768:384);
 const audit=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'-decision-diffs.json','utf8'));
 assert.equal(audit.schema,'arcane-v1554-train-only-decision-diffs');
 assert.equal(audit.stage,stage);
 assert.equal(audit.controls.holdoutNeverInspected,true);
 assert.equal(audit.controls.firstDivergenceDoesNotEstablishCausality,true);
 assert.equal(audit.rows.length,stage===4?768:stage===7?576:stage===8?384:192);
 for(const d of audit.rows){
  assert.equal(d.split,'train');assert.ok(names.slice(3).includes(d.arm));
  assert.ok([0,1].includes(d.candidateWin)&&[0,1].includes(d.incumbentWin));
  assert.ok(d.firstDifferentIndex===null||d.firstDifferentIndex>=0);
  decisionRows.push({stage,...d});
 }
 for(const r of t.allCases){
  assert.equal(r.stage,stage);assert.ok(names.includes(r.arm));
  assert.ok([0,1].includes(r.seat)&&[0,1].includes(r.starter));
  assert.ok(Number.isInteger(r.scenario)&&r.scenario>=0&&r.scenario<(stage===4?24:stage===7?18:stage===8?12:6));
  const split=r.scenario<(stage===4?8:stage===7?6:stage===8?4:2)?'train':r.scenario<(stage===4?16:stage===7?12:stage===8?8:4)?'validation':'holdout';
  assert.equal(r.split,split);
  assert.equal(r.seed,15540000+(stage===6?5:stage)*200000+r.pair*10000+r.scenario*1550+r.starter*107);
  assert.ok([0,1].includes(r.win)&&r.turn>0&&Number.isFinite(r.reward));
  assert.equal(r.mirror,stage<=1);
  assert.equal(r.decayEnabled,stage===3||stage===6);
  assert.equal(r.decayPairStage,stage===6?5:stage);
  assert.equal(r.foeCheckpoint,stage===7?'guarded-v1553':r.scenario%2?'balanced-v1529':'champion-v1528');
  assert.equal(r.soulDisabled,false);assert.equal(r.counterDisabled,false);
  assert.ok(r.selfPlayCallsBySeat.every(x=>Number.isInteger(x)&&x>0));
  assert.ok(r.selfPlayStrategicBySeat.every(x=>Number.isInteger(x)&&x>0));
  assert.deepEqual(r.illegalSwitchesBySeat,[0,0]);
  assert.equal(r.finishAttacks+r.finishSwitches+r.finishEnds+
   r.breachSwitches+r.breachAttacks,0,'Old policy override leaked');
  const key=[stage,r.pair,r.scenario,r.starter,r.seat,r.arm].join('|');
  assert.ok(!seen.has(key),'Duplicate matched game '+key);seen.add(key);
 }
 for(let pair=0;pair<8;pair++)for(let sc=0;sc<(stage===4?24:stage===7?18:stage===8?12:6);sc++)
  for(let start=0;start<2;start++)for(let seat=0;seat<2;seat++)
   for(const arm of names)
    assert.ok(seen.has([stage,pair,sc,start,seat,arm].join('|')),'Unpaired game');
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
  assert.equal(arm[split].games,stage===4?256:stage===7?192:stage===8?128:64);
 }
 stages.push({stage,name:t.name,selected:'guardian-champion',promoted:false,
  selectedRolePolicy:t.summaries[0].rolePolicy,baseline:t.summaries[0],
  selectedSummary:t.summaries[0],summaries:t.summaries});
 if(stage===5)noDecayRows.push(...t.allCases);
 else if(stage===6)decayRows.push(...t.allCases);
 else if(stage===7)headToHeadRows.push(...t.allCases);
 else if(stage===8)focusedRows.push(...t.allCases);
 else rows.push(...t.allCases);
}
assert.equal(rows.length,9216);
assert.equal(noDecayRows.length,1152);
assert.equal(decayRows.length,1152);
assert.equal(headToHeadRows.length,3456);
assert.equal(focusedRows.length,2304);
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
assert.ok(directHeadToHead.every(x=>x.games===576));
const h2hReference=new Map(headToHeadRows.filter(r=>r.arm==='l10-guarded-worst-reply')
 .map(r=>[[r.pair,r.scenario,r.starter,r.seat].join('|'),r]));
assert.equal(h2hReference.size,576);
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
// Guardian/Hybrid and Allrounder/Predator VALIDATION are strict release gates.
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
 const hardL10ValidationVsGuardian=summary(gt(a.arm).filter(r=>r.stage===4&&r.split==='validation')).wins-
  summary(gt(base.arm).filter(r=>r.stage===4&&r.split==='validation')).wins;
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
  h2hTrainGain>=3&&h2hValidationGain>=6&&focusedValidationGain>=0;
 return {arm:a.arm,trainGain,validationGain,seatParity,groups,guardianGate,
  trainGainVsFrozen,validationGainVsFrozen,hardL10ValidationVsFrozen,
  hardL10ValidationVsGuardian,decayValidationVsFrozen,
  h2hTrainWins,h2hValidationWins,h2hTrainGain,h2hValidationGain,focusedValidationGain,
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
 incumbent:frozen.arm,incumbentFromRun:40245289489,
 legacyGuardian:'guardian-champion',legacyGuardianFromRun:39974390088,
 formerResearchChampion:oldTwoPly.arm,formerResearchChampionFromRun:40137913164,
 selectionBasedOn:['train','validation'],
 selectionGateStages:[0,1,2,3,4,7,8],holdoutSeenBySelector:false,
 requires:{trainGainVsGuardian:8,validationGainVsGuardian:8,
  trainGainVsFrozen:2,validationGainVsFrozen:6,seatNonRegression:true,
  hardL10VsGuardian:2,hardL10VsFrozen:2,fullDecayVsFrozen:0,
  directH2HTrainGain:3,directH2HValidationGain:6,
  focusedHardL10ValidationGain:0,seatVsFrozenTolerance:-1,
  subgroupValidationTolerance:-3},
 candidates:eligible,
 // These diagnostics are only attached after selection has finished.
 holdoutWins:byArm.get(chosen).splits.holdout.wins,
 holdoutReferenceWins:base.splits.holdout.wins,
 holdoutDifference:byArm.get(chosen).splits.holdout.wins-base.splits.holdout.wins,
 holdoutFrozenWins:frozen.splits.holdout.wins,
 holdoutDifferenceVsFrozen:byArm.get(chosen).splits.holdout.wins-frozen.splits.holdout.wins
};
const priorResearchChampion={
 arm:frozen.arm,sourceRun:40245289489,
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
  ['guardian-hybrid',r=>r.roleA==='guardian'&&r.roleB==='hybrid'],
  ['allrounder-predator',r=>r.roleA==='allrounder'&&r.roleB==='predator'],
  ['other-controls',r=>!((r.roleA==='guardian'&&r.roleB==='hybrid')||
   (r.roleA==='allrounder'&&r.roleB==='predator'))]
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
const report={schema:'arcane-v1554-protected-situational-defense-report',status:'completed',
 sourceSha:process.env.GITHUB_SHA||'unknown',
 totalDuels:17280,primaryDuels:9216,decayDiagnosticDuels:1152,noDecayDiagnosticDuels:1152,
 headToHeadDiagnosticDuels:3456,focusedDiagnosticDuels:2304,
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
  legalDefensiveActionSelection:true,headToHeadFrozenV1553:true,
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
  focusedL10ScenariosPerPair:12,directH2HScenariosPerPair:18,
  boundedVisibleEnemyAttackBranches:6,strictFrozenV1553PromotionGate:true,
  preciseLegalAttackTradeoff:true,publicFusionPatience:false,visibleThreatGatedDefense:true,
  perCardVisibleThreatAblation:true,scopedAttackOpportunityAblation:true,
  trainOnlyPairedFirstActionDivergence:true,firstDivergenceDoesNotProveCausality:true,
  qImprovementGateUsesTrainingOnly:true,qRequiredIndependentGainPercent:5,
  focusedL10HoldoutExcludedFromSelection:true,
  noProductionChanges:true},
 stages,arms,paired,globalSelection:selection,priorResearchChampion,decisionDiagnostics,
  noDecayArms,decayArms,pairedDecayArms,pairedDecayCases,
  directHeadToHead,pairedHeadToHead,focusedDiagnostic,
 limitations:[
 'Fusion survival after actual cloned counterattacks is measured only within the existing capped 2-attack forecast, not a complete opponent turn.',
 'Material scarcity uses only the candidate own hand after legally applying fusion on the clone; no hidden opposing hand is considered.',
 'Soul support experiments use public foe Guardian DEF and do not resolve the full counter-play game tree.',
 'Seat and starter subgroup differences can be sampling noise; allrounder and opponent-role subgroups are small.',
 'Enemy posture counterfactual is bounded: after own cloned legal attacks, an opponent ATK-to-DEF switch via actual baseApply is simulated in its NEXT legal positions phase, followed by up to two enemy attacks; no full-turn hidden information and no prediction of spell/active abilities.',
 'Adaptive defense margin uses fixed predeclared bounded 105-285 utility threshold, computed only from visible own/enemy fields, own/enemy LP and whether matched decay is enabled; no hidden opponent cards or results.',
 'Selective defense only invokes legal preview when current visible enemy attack threatens an unswitched own attacker; candidate threshold fixed before run, not tuned on holdout.',
 'New attack-vs-defense planner executes up to two own legal attacks before up to two visible opponent replies for both options, as a partial forecast, not an entire turn or hidden-hand search.',
 'New defensive preview only considers LEGAL switch actions in positions/guard phase and executes the selected switch through the real engine; it does not simulate arbitrary Soul activations or full enemy turns.',
 'Stage 7 uses the verified frozen v14.9.53 guarded research champion as the real opposing strategy. It now spans 18 scenarios per pair (6 each TRAIN/VALIDATION/HOLDOUT), with 192 distinct validation duels per arm. Holdout and Q training are excluded.',
 'New sequence-worst branch prioritizes visible enemy attack/target options by legal public board danger and probes at most ten first replies per candidate fusion; bounded counterfactual, not full minimax.',
 'New fusion sequencing simulates up to two legal own attacks then two legal replies, not a complete turn or hidden-hand game tree.',
 'LP-decay urgency scoring is active in all three selective-defense ablations only when decay is active (primary stage 3 and diagnostic stage 6).',
 'Opponent attack planning remains limited cloned-attack approximation, not a full adversarial turn search.',
 'Action mix and scoring diagnostics are descriptive rather than causal evidence.',
 'Role-specific policies are hand-engineered scoring variants, not comprehensive self-improving reinforcement learning.',
 'Older opponent checkpoint freezes Q and selected weights; it does not freeze the entire former engine source.',
 'All challengers face the v14.9.28 validated Guardian/Soul champion and the predefined v14.9.29 balanced opponent; the v14.9.31 holdout stays sealed for selection.',
 'The incumbent Guardian/Soul reference is rerun on the same decks, starter and RNG seeds as all candidate policies.',
 'Main stages 0, 1, 2 and 4 keep decay off while main stage 3 enables symmetric real LP decay; stages 5 and 6 have exactly paired seed/deck/opponent/starter settings and differ only in decay activation. Stages 5 and 6 remain excluded from promotion and Q training.',
 'This run challenges the guarded v14.9.50 winner retained through v14.9.53; it cannot silently roll back to Guardian or 2-ply checkpoint.',
 'Adaptive features use visible current LP, threats and Guardian/Soul board state; no hidden opponent hand knowledge.',
 'The fresh hard-L10 focus phase 8 has a predeclared TRAIN+VALIDATION non-regression gate; its sealed HOLDOUT is diagnostic only and never feeds training or candidate selection.',
 'New Guardian/Hybrid and Allrounder/Predator legal reply branches use only currently visible enemy cards and attack actions, never hidden opposing hands. The first reply is bounded to six prioritized candidates, then at most one greedy second reply.',
 'The hard-L10 stage uses 24 fresh scenarios per role pair (8 TRAIN, 8 VALIDATION, 8 sealed HOLDOUT); focused stage 8 uses 12 per pair (4 per split) for Guardian/Hybrid and Allrounder/Predator roles.',
 'Primary stage 3 now uses the REAL symmetric LP decay on fresh decks and paired seats. Matched stages 5 and 6 remain separate diagnostics and are never used for promotion.',
 'Any new challenger must beat the frozen v14.9.53 guarded checkpoint by at least six main validation wins, two hard-L10 validation wins above both that checkpoint and old Guardian, six H2H validation wins in the larger direct comparison, no focused or real-decay validation regression and protected seats. Sealed holdout is reported only after selection.',
 'Stage-by-stage paired candidate-versus-incumbent action divergences include TRAIN cases only; earliest differing action is not necessarily what caused a win or loss.',
 'Per-card visible attack danger and attack-preservation checks only inspect public board information and up to two legal own attacks. These fixed ablations cannot establish causal long-run improvement.',
 'New 5% Q-learning thresholds apply to two disjoint training-only validations; poor unseen holdout performance is a diagnostic, never selection feedback.',
 'Changing the live AI or main branch requires separate explicit validation.'
 ]};
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1554_COMPLETE '+JSON.stringify({
 total:report.totalDuels,globallySelected:selection.arm,
 selectionTrainGain:eligible.find(x=>x.arm===selection.arm)?.trainGain??0,
 selectionValidationGain:eligible.find(x=>x.arm===selection.arm)?.validationGain??0,
 selectionHoldoutDifference:selection.holdoutDifference,
 holdout:arms.map(x=>({arm:x.arm,wins:x.splits.holdout.wins})),
 validation:arms.map(x=>({arm:x.arm,wins:x.splits.validation.wins}))
}));
