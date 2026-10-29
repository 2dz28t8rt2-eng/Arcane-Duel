'use strict';
/* Fail-closed v14.9.27 generalization evaluation, after all stage files are written.
 * Split train/validation/holdout by scenario seed (2+2+2) per stage. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1528',names=[
 'pool-reference','guardian-soul-board','fusion-threat','counter-risk','board-adaptive'
];
const stages=[],rows=[],seen=new Set();
for(let stage=0;stage<5;stage++){
 const t=JSON.parse(fs.readFileSync(root+'/stage-'+stage+'.json','utf8'));
 assert.equal(t.schema,'arcane-v1528-stage');assert.equal(t.stage,stage);
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
  assert.equal(r.seed,15280000+stage*200000+r.pair*10000+r.scenario*431+r.starter*23);
  assert.ok([0,1].includes(r.win)&&r.turn>0&&Number.isFinite(r.reward));
  assert.equal(r.mirror,stage<=2);
  assert.equal(r.foeCheckpoint,r.scenario%2?'v1526':'latest');
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
 assert.equal(baseline.arm,'pool-reference');
 assert.equal(t.chosenArm,'pool-reference','No stage-local strategy selection allowed');
 assert.equal(t.promoted,false,'Stage-local promotion must be disabled');
 assert.equal(t.selectedRolePolicy,null);
 assert.equal(t.previousSelectedRolePolicy,null);
 assert.equal(t.controls.globalSelectionOnly,true);
 assert.equal(t.controls.noStageToStagePolicyInheritance,true);
 assert.deepEqual(t.trainCandidate,baseline.train);
 assert.deepEqual(t.validationCandidate,baseline.validation);
 assert.deepEqual(t.holdoutCandidate,baseline.holdout);
 for(const arm of t.summaries)for(const split of ['train','validation','holdout']){
  assert.equal(arm[split].games,64);
 }
 stages.push({stage,name:t.name,selected:'pool-reference',promoted:false,
  selectedRolePolicy:null,baseline:t.summaries[0],
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
 const opponents=Object.fromEntries(['latest','v1526'].map(checkpoint=>
  [checkpoint,summary(filtered.filter(r=>r.foeCheckpoint===checkpoint))]));
 const roleTypes=Object.fromEntries(['guardian','soul','predator','fusion','allrounder','hybrid']
  .map(role=>[role,summary(filtered.filter(r=>r.roleA===role))]));
 const calls=[0,1].map(seat=>filtered.reduce((x,r)=>x+r.selfPlayCallsBySeat[seat],0));
 const decisions=[0,1].map(seat=>filtered.reduce((x,r)=>x+r.selfPlayStrategicBySeat[seat],0));
 return {arm,...summary(filtered),splits,opponents,roleTypes,calls,decisions};
});
const paired=['train','validation','holdout'].map(split=>{
 const c=rows.filter(r=>r.split===split),stageResults=[];
 for(let st=0;st<5;st++){
  const ref=new Map(c.filter(r=>r.stage===st&&r.arm==='pool-reference').map(r=>
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
const base=byArm.get('pool-reference');
const gt=x=>rows.filter(r=>r.arm===x);
const compare=(arm,split,key,selector)=>
 summary(gt(arm).filter(r=>r.split===split&&selector(r))).wins-
 summary(gt('pool-reference').filter(r=>r.split===split&&selector(r))).wins;
const groupChecks=arm=>{
 const mirror=compare(arm,'validation','mirror',r=>r.stage<=2);
 const crossRole=compare(arm,'validation','cross-role',r=>r.stage>=3);
 const current=compare(arm,'validation','current-Q',r=>r.foeCheckpoint==='latest');
 const older=compare(arm,'validation','older-Q',r=>r.foeCheckpoint==='v1526');
 return {mirror,crossRole,current,older};
};
const eligible=arms.slice(1).map(a=>{
 const trainGain=a.splits.train.wins-base.splits.train.wins;
 const validationGain=a.splits.validation.wins-base.splits.validation.wins;
 const seatParity=[0,1].every(seat=>
  a.splits.train.bySeat[seat].wins>=base.splits.train.bySeat[seat].wins&&
  a.splits.validation.bySeat[seat].wins>=base.splits.validation.bySeat[seat].wins);
 const groups=groupChecks(a.arm);
 return {arm:a.arm,trainGain,validationGain,seatParity,groups,
  qualifies:trainGain>=12&&validationGain>=10&&seatParity&&
   Object.values(groups).every(delta=>delta>=-4)};
});
const selectedCandidates=eligible.filter(x=>x.qualifies).sort((a,b)=>
 b.validationGain-a.validationGain||b.trainGain-a.trainGain||a.arm.localeCompare(b.arm));
const chosen=selectedCandidates[0]?.arm||'pool-reference';
const selection={
 arm:chosen,promoted:chosen!=='pool-reference',
 policy:rows.find(x=>x.arm===chosen)?.rolePolicy??null,
 selectionBasedOn:['train','validation'],holdoutSeenBySelector:false,
 requires:{trainGain:12,validationGain:10,seatNonRegression:true,
  subgroupValidationTolerance:-4},
 candidates:eligible,
 // These diagnostics are only attached after selection has finished.
 holdoutWins:byArm.get(chosen).splits.holdout.wins,
 holdoutReferenceWins:base.splits.holdout.wins,
 holdoutDifference:byArm.get(chosen).splits.holdout.wins-base.splits.holdout.wins
};
const report={schema:'arcane-v1528-global-role-selection-report',status:'completed',
 sourceSha:process.env.GITHUB_SHA||'unknown',
 totalDuels:4800,trainDuels:1600,validationDuels:1600,holdoutDuels:1600,
 controls:{bothSeatsUseFullStrategicAI:true,noIllegalMoves:true,
  trainValidationHoldoutSeparated:true,holdoutNeverUsedForSelection:true,
  globalFiveStageSelection:true,stageLocalPromotionDisabled:true,
  historicalQOpponentPool:true,perSeatPromotionGate:true,
  fullCombat:true,arenaLPDecayResearchOnlyOff:true,
  noProductionChanges:true},
 stages,arms,paired,globalSelection:selection,
 limitations:[
 'Role-specific policies are hand-engineered scoring variants, not comprehensive self-improving reinforcement learning.',
 'Older opponent checkpoint freezes Q and selected weights; it does not freeze the entire former engine source.',
 'Fixed policies are selected globally across five phases on TRAIN+VALIDATION only; HOLDOUT is untouched and not used to select.',
 'The incumbent reference is rerun on exactly the same decks, starter and RNG seeds as all candidate policies.',
 'The default arena LP decay is disabled symmetrically in research as in prior AI studies.',
 'Adaptive features use visible current LP, threats and Guardian/Soul board state; no hidden opponent hand knowledge.',
 'Changing the live AI or main branch requires separate explicit validation.'
 ]};
fs.writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1528_COMPLETE '+JSON.stringify({
 total:report.totalDuels,globallySelected:selection.arm,
 selectionTrainGain:eligible.find(x=>x.arm===selection.arm)?.trainGain??0,
 selectionValidationGain:eligible.find(x=>x.arm===selection.arm)?.validationGain??0,
 selectionHoldoutDifference:selection.holdoutDifference,
 holdout:arms.map(x=>({arm:x.arm,wins:x.splits.holdout.wins})),
 validation:arms.map(x=>({arm:x.arm,wins:x.splits.validation.wins}))
}));
