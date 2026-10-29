'use strict';
/* Preregistered 1-personal-turn deployment delay; optional temporary 50%
 * attack strength. Candidate selection uses TRAIN+VALIDATION, not HOLDOUT.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='artifacts/v1582',matches=['mirror','cross'],stages=[9,10];
const modes=['baseline','delay','emergency50-locked','emergency50-open'];
const arm='fusion-v1574-stomp-conscious';
const key=c=>[c.stage,c.pair,c.scenario,c.starter,c.seat,c.arm].join('|');
// A duel that reaches the simulation's turn cap is unresolved.  Both seat
// markers report win=0 in that case, so `c.win ? seat : 1-seat` would invent
// opposite winners and incorrectly report a candidate-marker leak.
const winner=c=>c.timeout?null:(c.win?c.seat:1-c.seat);
const secondWins=c=>winner(c)===null?null:winner(c)!==c.starter;
const candidateOutcome=c=>c.timeout?'draw':c.win?'win':'loss';
assert.equal(winner({seat:0,win:0,timeout:true}),null);
assert.equal(winner({seat:1,win:0,timeout:true}),null);
assert.equal(secondWins({seat:1,starter:0,win:0,timeout:true}),null);
const sum=(rows,fn)=>rows.reduce((n,c)=>n+fn(c),0);
const rate=(n,d)=>d?n/d:null;
const cohorts={},shards=[];
for(const match of matches)for(const stage of stages)for(const mode of modes){
 const rows=[];
 for(let pair=0;pair<8;pair++)for(let chunk=0;chunk<2;chunk++){
  const file=path.join(root,match,mode,`stage-${stage}-pair-${pair}-chunk-${chunk}.json`);
  assert.ok(fs.existsSync(file),'Missing deployment shard: '+file);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(data.stage,stage);assert.equal(data.pair,pair);assert.equal(data.chunk,chunk);
  assert.equal(data.cases.length,24);
  for(const c of data.cases){
   assert.equal(c.matchType,match);assert.equal(c.deploymentMode,mode);
   assert.equal(c.stage,stage);assert.equal(c.arm,arm);
   assert.equal(c.extraCardSecond,0);assert.deepEqual(c.actualStartingHands,[5,5]);
   assert.equal(c.diagnosticFactor,'baseline');
   assert.equal(c.openingRuleFlags?.factor,'baseline');
   assert.equal(c.openingRuleFlags?.arenaDecayDisabled,true);
   assert.ok(['train','validation','holdout'].includes(c.split));
   assert.ok(c.illegalSwitchesBySeat?.every(n=>n===0));
   assert.equal(c.openingTimeline?.length,Math.min(6,c.turn-1));
   assert.ok(c.openingTimeline.every((t,i)=>t.turn===i+1&&t.owner===(c.starter+i)%2));
   if(match==='mirror'){
    assert.equal(c.openingFiveEqual,true);assert.equal(c.openingDeckEqual,true);
    assert.equal(c.openingFusionEqual,true);
   }
   for(const f of ['freshAttackActions','emergencyAttackActions','emergencyHalfDamageChecks'])
    assert.ok(Number.isSafeInteger(c[f])&&c[f]>=0,'Missing attack action counter '+f);
   if(mode==='baseline'){
    assert.equal(c.emergencyAttackActions,0);assert.equal(c.emergencyHalfDamageChecks,0);
    assert.equal(c.openingActionByTurn?.[1]?.types?.attack||0,0);
   }else if(mode==='delay'){
    assert.equal(c.freshAttackActions,0,'Fresh unit attacked despite deployment delay');
    assert.equal(c.emergencyAttackActions,0);
   }else{
    assert.equal(c.emergencyAttackActions,c.freshAttackActions,
     'Every early attack must be the optional half-strength action');
    assert.equal(c.emergencyHalfDamageChecks,c.emergencyAttackActions);
    if(mode==='emergency50-locked')assert.equal(c.openingActionByTurn?.[1]?.types?.attack||0,0);
   }
   rows.push(c);
  }
 }
 assert.equal(rows.length,384);
 assert.equal(new Set(rows.map(key)).size,384);
 for(const split of ['train','validation','holdout'])
  assert.equal(rows.filter(c=>c.split===split).length,128);
 cohorts[[match,stage,mode].join('|')]=rows;
 shards.push({match,stage,mode,duels:384});
}
assert.equal(sum(shards,s=>s.duels),6144);
let starterPairs=0,labelChecks=0,matchedMechanismPairs=0;
const effects={};
for(const match of matches)for(const stage of stages)for(const mode of modes){
 const rows=cohorts[[match,stage,mode].join('|')];
 const starters=new Map(rows.filter(c=>c.starter===0).map(c=>[[c.pair,c.scenario,c.seat].join('|'),c]));
 for(const c of rows.filter(c=>c.starter===1)){
  const b=starters.get([c.pair,c.scenario,c.seat].join('|'));assert.ok(b);
  for(const f of ['seed','seedA','seedB','seat','roleA','roleB','split'])
   assert.deepEqual(c[f],b[f],'Starter swap changed '+f);
  starterPairs++;
 }
 if(match==='mirror'){
  const marker=new Map(rows.filter(c=>c.seat===0).map(c=>[[c.pair,c.scenario,c.starter].join('|'),c]));
  for(const c of rows.filter(c=>c.seat===1)){
   const b=marker.get([c.pair,c.scenario,c.starter].join('|'));
   assert.ok(b);
   assert.equal(c.timeout,b.timeout,'Marker changed draw/timeout status');
   assert.equal(winner(c),winner(b),'Marker leaked into duel');
   assert.equal(c.turn,b.turn,'Marker changed duel duration');
   labelChecks++;
  }
 }
 if(mode!=='baseline'){
  const base=new Map(cohorts[[match,stage,'baseline'].join('|')].map(c=>[key(c),c]));
  let gain=0,loss=0,drawsIntroduced=0,drawsResolved=0;
  for(const c of rows){
   const b=base.get(key(c));assert.ok(b);
   for(const f of ['seed','seedA','seedB','seat','starter','pair','scenario',
    'roleA','roleB','split','openingFiveEqual','openingDeckEqual','openingFusionEqual'])
    assert.deepEqual(c[f],b[f],'Deployment treatment changed '+f);
   assert.deepEqual(c.openingBeginning,b.openingBeginning,'Initial board differs');
   const actual=candidateOutcome(c),control=candidateOutcome(b);
   if(actual==='draw'&&control!=='draw')drawsIntroduced++;
   if(actual!=='draw'&&control==='draw')drawsResolved++;
   if(actual==='win'&&control!=='win')gain++;
   if(actual==='loss'&&control!=='loss')loss++;
   matchedMechanismPairs++;
  }
  effects[[match,stage,mode].join('|')]={candidateGains:gain,candidateLosses:loss,
   drawsIntroduced,drawsResolved};
 }
}
assert.equal(starterPairs,3072);assert.equal(labelChecks,1536);
assert.equal(matchedMechanismPairs,4608);
const predBaseline=cohorts['mirror|10|baseline'];
assert.ok(sum(predBaseline,c=>c.freshAttackActions)>0);
assert.ok(sum(predBaseline,c=>c.openingActionByTurn?.[2]?.types?.attack||0)>0);
const emergencies=matches.flatMap(m=>stages.flatMap(s=>
 ['emergency50-locked','emergency50-open'].flatMap(mode=>cohorts[[m,s,mode].join('|')])));
assert.ok(sum(emergencies,c=>c.emergencyHalfDamageChecks)>0,'No real optional attacks at 50%');
const opens=cohorts['mirror|10|emergency50-open'];
assert.ok(sum(opens,c=>c.openingActionByTurn?.[1]?.types?.attack||0)>0,
 'Open variant never exercised the permitted half-strength global turn-one attack');

function summarize(rows,match){
 const independent=match==='mirror'?rows.filter(c=>c.seat===0):rows;
 const n=independent.length,draws=sum(independent,c=>c.timeout?1:0),resolved=n-draws;
 const second=sum(independent,c=>secondWins(c)===true?1:0);
 const candidateDraws=sum(rows,c=>c.timeout?1:0),candidateResolved=rows.length-candidateDraws;
 const candidateWins=sum(rows,c=>c.win?1:0);
 const timeline=[];
 for(let turn=1;turn<=6;turn++){
  const known=independent.flatMap(c=>c.openingTimeline.filter(x=>x.turn===turn)
   .map(x=>({c,x})));
  const count=known.length,mean=fn=>count?sum(known,fn)/count:null;
  timeline.push({turn,games:count,
   firstLP:mean(({c,x})=>x.before[c.starter].lp),
   secondLP:mean(({c,x})=>x.before[1-c.starter].lp),
   firstBoard:mean(({c,x})=>x.before[c.starter].board),
   secondBoard:mean(({c,x})=>x.before[1-c.starter].board),
   firstATK:mean(({c,x})=>x.before[c.starter].atk),
   secondATK:mean(({c,x})=>x.before[1-c.starter].atk),
   attacks:sum(independent,c=>c.openingActionByTurn?.[turn]?.types?.attack||0)});
 }
 return {games:rows.length,independentDuels:n,draws,drawRate:rate(draws,n),
  resolvedDuels:resolved,secondWins:second,secondWinRate:rate(second,resolved),
  secondScoreRate:rate(second+.5*draws,n),
  candidateWins,candidateDraws,candidateWinRate:rate(candidateWins,candidateResolved),
  candidateScoreRate:rate(candidateWins+.5*candidateDraws,rows.length),
  freshAttackActions:sum(rows,c=>c.freshAttackActions),
  emergencyAttackActions:sum(rows,c=>c.emergencyAttackActions),
  emergencyHalfDamageChecks:sum(rows,c=>c.emergencyHalfDamageChecks),
  realStomps:sum(rows,c=>c.realCandidateStomps||0),
  realPredatorFusionKills:sum(rows,c=>c.realPredatorFusionKills||0),
  timeouts:rows.filter(c=>c.timeout).length,
  firstSixTurns:timeline};
}
const report={schema:'arcane-v1582-deployment-delay-temporary-emergency-attack',
 status:'completed',totalDuels:6144,starterPairs,labelChecks,matchedMechanismPairs,
 modes,controls:{gameplayUntouched:true,noSixthCard:true,fiveCardsBoth:true,
 sameRngForStarterSwaps:true,samePolicyBothSides:true,exactMirrorDecks:true,
 oneSidedSeatPerksOff:true,arenaLPDecayDisabled:true,temporaryCombatMultiplierOnly:true,
 trainValidationFirst:true,automaticRulePromotion:false},
 modeDetails:{baseline:'Existing live turn-one global attack lock, fresh monsters may attack from turn two.',
  delay:'No freshly summoned creature attacks until its owners next personal turn.',
  'emergency50-locked':'A fresh monster may voluntarily attack at 50% effective strength, but the old global turn-one lock remains.',
  'emergency50-open':'A fresh monster may voluntarily attack at 50% effective strength even on global turn one; old turn-one lock removed only for this action.'},
 comparisons:effects,byMatchStage:{},selection:{},sealedHoldout:{},
 caveats:[
  'Simulated legal full-game duels using one fixed research AI, not neural retraining.',
  'The 50% emergency option is selected by the research AI as an attack action; a live UI button is not shipped.',
  '50% affects only computed combat strength, never permanently halves the card attack stat. Existing normal attack fatigue/essence costs still apply.',
  'One-turn delay means the card cannot attack on the personal turn it is placed; it becomes fully ready on the owners following personal turn.',
  'The two emergency variants distinguish the legacy first global turn attack prohibition, which confounded prior symmetry assumptions.',
  'Comparisons isolate the new deployment and emergency mechanism; no changes to user campaign or multiplayer rules.',
  'Mirror outcomes are candidate-marker duplicates and therefore counted once per actual result for second-mover win rates.',
  'A turn-limit timeout is an unresolved duel, not a loss. Draws are recorded separately and excluded from resolved-game win rates; score rates award half a point per draw.'
 ]};
for(const match of matches)for(const stage of stages){
 const group=match+'-'+stage;report.byMatchStage[group]={};report.sealedHoldout[group]={};
 for(const mode of modes){
  const rows=cohorts[[match,stage,mode].join('|')];
  report.byMatchStage[group][mode]={train:summarize(rows.filter(c=>c.split==='train'),match),
   validation:summarize(rows.filter(c=>c.split==='validation'),match),
   all:summarize(rows,match)};
  report.sealedHoldout[group][mode]=summarize(rows.filter(c=>c.split==='holdout'),match);
 }
}
// Select an experimental follow-up candidate on TRAIN+VALIDATION only.
const validationSelection=modes.slice(1).map(mode=>{
 const merged=stage=>cohorts[['mirror',stage,mode].join('|')].filter(c=>c.split!=='holdout');
 const predator=summarize(merged(10),'mirror').secondWinRate;
 const fusion=summarize(merged(9),'mirror').secondWinRate;
 const cross=stages.map(stage=>{
  const rows=cohorts[['cross',stage,mode].join('|')].filter(c=>c.split!=='holdout');
  const base=cohorts[['cross',stage,'baseline'].join('|')].filter(c=>c.split!=='holdout');
  return {stage,candidateWin:summarize(rows,'cross').candidateWinRate,
   baselineWin:summarize(base,'cross').candidateWinRate};
 });
 return {mode,predatorSecondWinRate:predator,fusionSecondWinRate:fusion,
  maxMirrorDeviation:Math.max(Math.abs(predator-.5),Math.abs(fusion-.5)),
  cross,anyCrossRoleShiftOver10pp:cross.some(x=>Math.abs(x.candidateWin-x.baselineWin)>.1),
  maxTrainValidationDrawRate:Math.max(...[9,10].map(stage=>
   summarize(merged(stage),'mirror').drawRate))};
}).sort((a,b)=>a.maxMirrorDeviation-b.maxMirrorDeviation);
report.selection={calculatedFrom:'TRAIN+VALIDATION only',ranked:validationSelection,
 candidateForFurtherTesting:validationSelection[0].maxMirrorDeviation<=.08&&
  !validationSelection[0].anyCrossRoleShiftOver10pp&&
  validationSelection[0].maxTrainValidationDrawRate<=.05?validationSelection[0].mode:null,
 anyGameplayChange:false};
const dir=path.join(root,'analysis');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
const compact={status:report.status,duels:report.totalDuels,starterPairs,labelChecks,
 matchedMechanismPairs,selection:report.selection,
 summary:Object.fromEntries(Object.entries(report.byMatchStage).map(([k,v])=>[k,
  Object.fromEntries(Object.entries(v).map(([m,x])=>[m,{
   candidateWin:x.all.candidateWinRate,secondWin:x.all.secondWinRate,
   draws:x.all.draws,drawRate:x.all.drawRate,
   freshAttackActions:x.all.freshAttackActions,
   emergencyActions:x.all.emergencyAttackActions,
   trainSecondWin:x.train.secondWinRate,validationSecondWin:x.validation.secondWinRate,
   holdoutSecondWin:report.sealedHoldout[k][m].secondWinRate}]))]))};
console.log('ARCANE_V1582_COMPLETE '+JSON.stringify(compact));
