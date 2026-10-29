'use strict';
/* Preregistered mechanism isolation, never tune a rule from HOLDOUT.
 * Each factor replays the same 40-card source, same RNG seed, same starting
 * player/seat and same AI policy on both sides. No sixth start card.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='artifacts/v1581',matches=['mirror','cross'],stages=[9,10];
const factors=['baseline','equal-opening-attacks','no-creature-decay',
 'no-attack-stat-loss','no-predator-swarm','no-predator-pierce'];
const arm='fusion-v1574-stomp-conscious';
const key=c=>[c.stage,c.pair,c.scenario,c.starter,c.seat,c.arm].join('|');
const winner=c=>c.win?c.seat:1-c.seat;
const secondWins=c=>winner(c)===1-c.starter;
const sums=(a,get)=>a.reduce((n,c)=>n+get(c),0);
const percent=(n,d)=>d?n/d:null;
const artifacts=[],cohorts={};
for(const match of matches)for(const stage of stages)for(const factor of factors){
 const rows=[];
 for(let pair=0;pair<8;pair++)for(let chunk=0;chunk<2;chunk++){
  const file=path.join(root,match,factor,`stage-${stage}-pair-${pair}-chunk-${chunk}.json`);
  assert.ok(fs.existsSync(file),'Required shard missing: '+file);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(data.stage,stage);assert.equal(data.pair,pair);assert.equal(data.chunk,chunk);
  assert.equal(data.cases.length,24,'Single-policy, six-scenario, two-starter, two-seat shard');
  for(const c of data.cases){
   assert.equal(c.matchType,match);assert.equal(c.diagnosticFactor,factor);
   assert.equal(c.stage,stage);assert.equal(c.arm,arm);
   assert.equal(c.extraCardSecond,0);assert.deepEqual(c.actualStartingHands,[5,5]);
   assert.ok(['train','validation','holdout'].includes(c.split));
   assert.ok(c.illegalSwitchesBySeat?.every(x=>x===0),'Illegal self-play move');
   assert.equal(c.openingRuleFlags?.factor,factor);
   assert.equal(c.openingRuleFlags?.arenaDecayDisabled,true,
    'Primary 9/10 stages keep arena LP decay disabled, as in v15.80');
   assert.equal(c.openingBeginning?.length,2);assert.equal(c.openingTimeline?.length,
    Math.min(6,c.turn-1),'Opening must be captured at each completed real turn');
   assert.ok(c.openingTimeline.every((t,i)=>t.turn===i+1&&t.owner===(c.starter+i)%2));
   assert.ok(Object.keys(c.openingActionByTurn||{}).every(t=>+t>=1&&+t<=6));
   if(match==='mirror'){
    assert.equal(c.openingFiveEqual,true);assert.equal(c.openingDeckEqual,true);
    assert.equal(c.openingFusionEqual,true);
   }
   if(factor==='no-predator-swarm')assert.equal(c.openingRuleFlags.predatorSwarm,0);
   else assert.equal(c.openingRuleFlags.predatorSwarm,.02);
   if(factor==='no-predator-pierce')assert.equal(c.openingRuleFlags.predatorPierce,0);
   else assert.equal(c.openingRuleFlags.predatorPierce,.10);
   if(factor==='equal-opening-attacks')
    assert.equal(c.openingActionByTurn?.[2]?.types?.attack||0,0,
     'No second-player attack on its personal first turn');
   if(factor==='no-creature-decay'){
    assert.ok(c.openingTimeline.every(t=>t.outgoingAtkLoss===0&&t.outgoingDefLoss===0),
     'Creature decay was not fully disabled');
   }
   rows.push(c);
  }
 }
 assert.equal(rows.length,384);
 assert.equal(new Set(rows.map(key)).size,384,'Duplicated research scenario');
 assert.equal(rows.filter(c=>c.split==='train').length,128);
 assert.equal(rows.filter(c=>c.split==='validation').length,128);
 assert.equal(rows.filter(c=>c.split==='holdout').length,128);
 cohorts[[match,stage,factor].join('|')]=rows;
 artifacts.push({match,stage,factor,duels:rows.length});
}
assert.equal(sums(artifacts,c=>c.duels),9216);
let labelChecks=0,starterPairs=0,matchedMechanismPairs=0;
for(const match of matches)for(const stage of stages)for(const factor of factors){
 const rows=cohorts[[match,stage,factor].join('|')];
 const starters=new Map(rows.filter(c=>c.starter===0).map(c=>[[c.pair,c.scenario,c.seat].join('|'),c]));
 for(const c of rows.filter(c=>c.starter===1)){
  const b=starters.get([c.pair,c.scenario,c.seat].join('|'));
  assert.ok(b,'Unpaired second starter');
  for(const field of ['seed','seedA','seedB','seat','roleA','roleB','split'])
   assert.deepEqual(c[field],b[field],'Starter changed '+field);
  starterPairs++;
 }
 if(match==='mirror'){
  const seat0=new Map(rows.filter(c=>c.seat===0).map(c=>[[c.pair,c.scenario,c.starter].join('|'),c]));
  for(const c of rows.filter(c=>c.seat===1)){
   const b=seat0.get([c.pair,c.scenario,c.starter].join('|'));
   assert.ok(b);assert.equal(winner(c),winner(b),'Candidate-marker leakage');
   labelChecks++;
  }
 }
 if(factor!=='baseline'){
  const base=new Map(cohorts[[match,stage,'baseline'].join('|')].map(c=>[key(c),c]));
  for(const c of rows){
   const b=base.get(key(c));assert.ok(b);
   for(const field of ['seed','seedA','seedB','seat','starter','pair','scenario',
    'roleA','roleB','split','openingFiveEqual','openingDeckEqual','openingFusionEqual'])
    assert.deepEqual(c[field],b[field],'Mechanism ablation changed '+field);
   assert.deepEqual(c.openingBeginning,b.openingBeginning,'Mechanism changed opening state');
   matchedMechanismPairs++;
  }
 }
}
assert.equal(starterPairs,4608);assert.equal(labelChecks,2304);
assert.equal(matchedMechanismPairs,7680);
const predator=cohorts['mirror|10|baseline'];
assert.ok(sums(predator,c=>c.openingActionByTurn?.[2]?.types?.attack||0)>0,
 'Control must contain legal second-player attacks in global turn 2');
const noFatigue=matches.flatMap(m=>stages.flatMap(s=>cohorts[[m,s,'no-attack-stat-loss'].join('|')]));
assert.ok(sums(noFatigue,c=>c.openingAttackStatRestorations||0)>0,
 'Attack-stat-loss ablation did not intercept any actual attacks');
const noDecay=matches.flatMap(m=>stages.flatMap(s=>cohorts[[m,s,'baseline'].join('|')]));
assert.ok(sums(noDecay,c=>sums(c.openingTimeline,t=>t.outgoingAtkLoss))>0,
 'Baseline creature decay did not occur');

function summarize(rows,match){
 const unique=match==='mirror'?rows.filter(c=>c.seat===0):rows;
 const second=sums(unique,c=>secondWins(c)?1:0);
 const wins=sums(rows,c=>c.win);
 const turns=[];
 for(let t=1;t<=6;t++){
  const present=rows.flatMap(c=>c.openingTimeline.filter(x=>x.turn===t).map(x=>({c,x})));
  const n=present.length;
  const avg=(fn)=>n?sums(present,fn)/n:null;
  turns.push({turn:t,games:n,
   firstLP:avg(({c,x})=>x.before[c.starter].lp),
   secondLP:avg(({c,x})=>x.before[1-c.starter].lp),
   firstField:avg(({c,x})=>x.before[c.starter].board),
   secondField:avg(({c,x})=>x.before[1-c.starter].board),
   firstATK:avg(({c,x})=>x.before[c.starter].atk),
   secondATK:avg(({c,x})=>x.before[1-c.starter].atk),
   outgoingDecayATK:sums(present,({x})=>x.outgoingAtkLoss),
   outgoingDecayDEF:sums(present,({x})=>x.outgoingDefLoss),
   attacks:sums(rows,c=>c.openingActionByTurn?.[t]?.types?.attack||0),
   summons:sums(rows,c=>c.openingActionByTurn?.[t]?.types?.normal||0),
   fusions:sums(rows,c=>c.openingActionByTurn?.[t]?.types?.fusion||0),
   missedReady:sums(rows,c=>c.openingActionByTurn?.[t]?.missedReadyAttacks||0)});
 }
 return {games:rows.length,wins,winRate:percent(wins,rows.length),
  independentGames:unique.length,secondWins:second,
  secondWinRate:percent(second,unique.length),
  byCandidateSeat:Object.fromEntries([0,1].map(seat=>{const group=rows.filter(c=>c.seat===seat);
   return [seat,{games:group.length,rate:percent(sums(group,c=>c.win),group.length)}];})),
  turnTimeline:turns,
  realPredatorFusionAttacks:sums(rows,c=>c.realPredatorFusionAttacks||0),
  realPredatorFusionKills:sums(rows,c=>c.realPredatorFusionKills||0),
  realCandidateStomps:sums(rows,c=>c.realCandidateStomps||0),
  realCandidateSplashKills:sums(rows,c=>c.realCandidateSplashKills||0),
  attackStatLossRestorations:sums(rows,c=>c.openingAttackStatRestorations||0),
  timeouts:rows.filter(c=>c.timeout).length};
}
const report={schema:'arcane-v1581-six-turn-mechanism-causal-ablation',status:'completed',
 totalDuels:9216,matchedMechanismPairs,starterPairs,labelChecks,
 controls:{noSixthCard:true,sameDeckAcrossAblations:true,sameRNGStarterSwap:true,
  sameAIOnBothSides:true,oneSidedPerksOff:true,mirrorDecksIdentical:true,
  researchOnly:true,priorTrainOnly:true,arenaLPDecayDisabledInAllArms:true,
  trainValidationBeforeHoldout:true,noPromotion:true},
 factors,byMatchStage:{},selection:{},sealedHoldout:{},
 caveats:[
  'Fixed research policies in full simulated duels; no neural weight training.',
  'An equal-opening-attacks ablation blocks attacking on both players personal first turn only.',
  'No-creature-decay sets both cards natural ATK and DEF decay to zero, without disabling other actions.',
  'No-attack-stat-loss restores an attacker current ATK/DEF if an actual attack reduced them; this includes ordinary and Stomp expenditure.',
  'Swarm and armor piercing are disabled symmetrically; they are different mechanisms.',
  'The original v15.80 mirror tests reported 50% candidate wins by symmetry; second-mover rates here use each unique result only once.',
  'Ablations are causal test interventions, not balanced proposed live-game rules.'
 ]};
for(const match of matches)for(const stage of stages){
 const group=match+'-'+stage;
 report.byMatchStage[group]={};report.sealedHoldout[group]={};
 for(const factor of factors){
  const rows=cohorts[[match,stage,factor].join('|')];
  const train=rows.filter(c=>c.split==='train');
  const validation=rows.filter(c=>c.split==='validation');
  const holdout=rows.filter(c=>c.split==='holdout');
  report.byMatchStage[group][factor]={train:summarize(train,match),
   validation:summarize(validation,match),all:summarize(rows,match)};
  report.sealedHoldout[group][factor]=summarize(holdout,match);
 }
}
// Freeze causal diagnostic recommendation using TRAIN and VALIDATION only.
const diagnosticBaseline=cohorts['mirror|10|baseline'].filter(c=>c.split!=='holdout');
const prior=summarize(diagnosticBaseline,'mirror');
const factorEffects=factors.slice(1).map(factor=>{
 const cases=cohorts[['mirror',10,factor].join('|')].filter(c=>c.split!=='holdout');
 const s=summarize(cases,'mirror');
 const fus=summarize(cohorts[['mirror',9,factor].join('|')]
  .filter(c=>c.split!=='holdout'),'mirror');
 const fusionBaseline=summarize(cohorts['mirror|9|baseline']
  .filter(c=>c.split!=='holdout'),'mirror');
 return {factor,predatorSecondBefore:prior.secondWinRate,
  predatorSecondAfter:s.secondWinRate,
  predatorImbalanceReduction:Math.abs(prior.secondWinRate-.5)-Math.abs(s.secondWinRate-.5),
  fusionSecondBefore:fusionBaseline.secondWinRate,
  fusionSecondAfter:fus.secondWinRate,
  fusionImbalanceIncrease:Math.abs(fus.secondWinRate-.5)-Math.abs(fusionBaseline.secondWinRate-.5)};
}).sort((a,b)=>b.predatorImbalanceReduction-a.predatorImbalanceReduction);
const candidate=factorEffects[0];
report.selection={calculatedFrom:'TRAIN+VALIDATION only',
 rankedFactorEffects:factorEffects,
 candidateIfSubstantial: candidate.predatorImbalanceReduction>=.08&&
  candidate.fusionImbalanceIncrease<=.08?candidate.factor:null,
 anyGameplayChange:false};
// The held-out outcomes are stored separately, after the choice is frozen.
const dir=path.join(root,'analysis');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
const compact={status:report.status,totalDuels:report.totalDuels,
 mechanismCheck:{matchedMechanismPairs,starterPairs,labelChecks},
 selection:report.selection,
 summary:Object.fromEntries(Object.entries(report.byMatchStage).map(([k,v])=>
  [k,Object.fromEntries(Object.entries(v).map(([f,x])=>[f,{
   candidateWin:x.all.winRate,secondWin:x.all.secondWinRate,
   trainSecondWin:x.train.secondWinRate,validationSecondWin:x.validation.secondWinRate,
   holdoutSecondWin:report.sealedHoldout[k][f].secondWinRate}]))]))};
console.log('ARCANE_V1581_COMPLETE '+JSON.stringify(compact));
