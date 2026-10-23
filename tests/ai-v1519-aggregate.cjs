'use strict';
// Strict study verification. No holdout replay actions enter training archives.
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1519',names=['baseline-heuristic','gated-Q',
 'Q-one-counter-planner','Q-two-counter-planner','Q-two-counter-role-aware','Q-two-counter-fusion-guard-mild',
 'Q-two-counter-fusion-guard-strong','Q-two-counter-soul-focus'];
const roles=['predator','guardian','soul','fusion','hybrid','allrounder'];
const pairs=[];for(const a of roles)for(const b of roles)if(a!==b)pairs.push([a,b]);
const metrics=['qMoves','lookaheadChecks','lookaheadChanges',
 'firstCounterAttacks','secondCounterChecks','secondCounterOpportunities',
 'attackFirstCounters','attackSecondChecks','attackSecondOpportunities','attackSecondCounters',
 'summonChecks','summonLegal','summonChanges','fusionChanges',
 'fusionGuardEvaluations','fusionGuardTotalPenalty','soulFocusEvaluations',
 'doubleCounters','soulActions'];
const rows=[],seen=new Set(),trainingActions=[];let mismatch=0;
for(let idx=0;idx<40;idx++){
 const p=root+'/shards/part-'+String(idx).padStart(2,'0')+'.json';
 assert.ok(fs.existsSync(p),'Missing shard '+idx);
 const part=JSON.parse(fs.readFileSync(p,'utf8'));
 assert.equal(part.schema,'arcane-v1519-crossdeck-shard');
 assert.equal(part.shardIndex,idx);assert.equal(part.shardCount,40);
 assert.equal(part.duelsPerShard,128);assert.equal(part.cases.length,128);
 const mirror=idx>=32,rolesHere=mirror?[roles[(idx-32)%6],roles[(idx-32)%6]]:
 idx===30?['predator','guardian']:idx===31?['fusion','guardian']:pairs[idx];
 const tier=[7,10][idx%2],stage=[0,6,10][Math.floor(idx/2)%3];
 const byMatch=new Map();
 for(const r of part.cases){
  assert.equal(r.shardIndex,idx);assert.equal(r.mirror,mirror);
  assert.equal(r.candidateRole,rolesHere[0]);assert.equal(r.opponentRole,rolesHere[1]);
  assert.equal(r.tier,tier);assert.equal(r.stage,stage);
  assert.equal(r.split,r.scenario===3?'holdout':'train');
  assert.equal(r.deckSeedB,mirror?r.deckSeedA:1700+idx*97+r.scenario*31);
  assert.ok(names.includes(r.arm));assert.ok([0,1].includes(r.seat));
  assert.ok([0,1].includes(r.starter)&&[0,1].includes(r.win));
  assert.ok(Number.isInteger(r.scenario)&&r.scenario>=0&&r.scenario<4);
  assert.ok(r.initialLP[0]===r.initialLP[1]&&r.initialLP[0]>0,'LP inequality');
  assert.equal(typeof r.timeout,'boolean');
  for(const k of metrics)assert.ok(Number.isInteger(r[k])&&r[k]>=0,'Invalid '+k);
  assert.ok(['offensive','economy','balanced'].includes(r.opponentPolicy),
   'Opponent tactic not recorded');
  assert.equal(r.opponentPolicy,['offensive','economy','balanced','balanced'][r.scenario],
   'Mismatched opponent tactic for scenario');
  assert.equal(r.decayEnabled,(idx+r.scenario)%2===0,'Decay comparison is not paired');
  const key=[idx,r.scenario,r.starter,r.seat,r.arm].join('|');
  assert.ok(!seen.has(key),'Duplicated matched benchmark case');
  seen.add(key);byMatch.set(key,r);
  assert.ok(Array.isArray(r.actionTape));
  if(r.split==='holdout')assert.equal(r.actionTape.length,0,'Holdout action log leaked into training');
  if(r.split==='train'&&r.actionTape.length){
   trainingActions.push({schema:'arcane-v1519-action-trajectory',
    sourceSha:part.sourceSha,matchKey:key,model:r.arm,
    candidateRole:r.candidateRole,opponentRole:r.opponentRole,
    stage:r.stage,tier:r.tier,starter:r.starter,seat:r.seat,
    won:r.win,timeout:r.timeout,trajectory:r.actionTape});
  }
  const {actionTape,...pure}=r;rows.push(pure);
 }
 for(let i=0;i<4;i++)for(const starter of [0,1])for(const seat of [0,1])
 for(const model of names){
  const key=[idx,i,starter,seat,model].join('|');
  assert.ok(byMatch.has(key),'Missing pair '+key);
 }
}
assert.equal(rows.length,5120);
assert.equal(rows.filter(r=>!r.mirror).length,4096);
assert.equal(rows.filter(r=>r.mirror).length,1024);
assert.equal(rows.filter(r=>r.split==='holdout').length,1280);
assert.equal(rows.filter(r=>r.split==='train').length,3840);
assert.equal(pairs.length,30);
const groups=names.map(model=>{
 const pool=rows.filter(r=>r.arm===model);
 const sum=r=>({games:r.length,wins:r.reduce((n,x)=>n+x.win,0),
  timeouts:r.filter(x=>x.timeout).length});
 const record={model,...sum(pool),
  cross:sum(pool.filter(x=>!x.mirror)),mirror:sum(pool.filter(x=>x.mirror)),
  train:sum(pool.filter(x=>x.split==='train')),
  holdout:sum(pool.filter(x=>x.split==='holdout')),
  bySeat:Object.fromEntries([0,1].map(seat=>[seat,sum(pool.filter(r=>r.seat===seat))])),
  byStarter:Object.fromEntries([0,1].map(starter=>[starter,sum(pool.filter(r=>r.starter===starter))])),
  byRole:Object.fromEntries(roles.map(role=>[role,sum(pool.filter(r=>r.candidateRole===role))])),
  byOpponent:Object.fromEntries(roles.map(role=>[role,sum(pool.filter(r=>r.opponentRole===role))])),
  byOpponentPolicy:Object.fromEntries(['offensive','economy','balanced'].map(policy=>[policy,
    sum(pool.filter(r=>r.opponentPolicy===policy))])),
  byDecay:Object.fromEntries(['true','false'].map(v=>[v,sum(pool.filter(r=>String(r.decayEnabled)===v))])),
  byTier:Object.fromEntries([7,10].map(tier=>[tier,sum(pool.filter(r=>r.tier===tier))])),
  byStage:Object.fromEntries([0,6,10].map(stage=>[stage,sum(pool.filter(r=>r.stage===stage))])),
  actionTypes:{}};
 for(const m of metrics)record[m]=pool.reduce((n,r)=>n+r[m],0);
 for(const r of pool)for(const [k,v] of Object.entries(r.chosenActionTypes||{}))
  record.actionTypes[k]=(record.actionTypes[k]||0)+v;
 assert.equal(record.games,640);assert.equal(record.cross.games,512);
 assert.equal(record.mirror.games,128);assert.equal(record.holdout.games,160);
 return record;
});
const baseline=new Map(rows.filter(r=>r.arm===names[0]).map(r=>[
 [r.shardIndex,r.scenario,r.starter,r.seat].join('|'),r]));
const paired=names.slice(1).map(model=>{
 let additionalWins=0,regressions=0,identical=0,holdoutPlus=0,holdoutMinus=0;
 for(const r of rows.filter(x=>x.arm===model)){
  const key=[r.shardIndex,r.scenario,r.starter,r.seat].join('|'),b=baseline.get(key);
  assert.ok(b,'Missing baseline matched case');
  if(r.win>b.win){additionalWins++;if(r.split==='holdout')holdoutPlus++;}
  else if(r.win<b.win){regressions++;if(r.split==='holdout')holdoutMinus++;}
  else identical++;
 }
 return {model,additionalWins,regressions,identical,holdoutPlus,holdoutMinus};
});
const deepBase=new Map(rows.filter(r=>r.arm==='Q-two-counter-planner').map(r=>[
 [r.shardIndex,r.scenario,r.starter,r.seat].join('|'),r]));
const roleDifferences=rows.filter(r=>r.arm==='Q-two-counter-role-aware')
 .reduce((z,r)=>{const prev=deepBase.get([r.shardIndex,r.scenario,r.starter,r.seat].join('|'));
  assert.ok(prev,'No paired depth2 control');
  const field=r.split==='holdout'?'holdout':'training';
  z[field].games++;
  if(r.win>prev.win)z[field].better++;
  if(r.win<prev.win)z[field].worse++;
  return z;},{training:{games:0,better:0,worse:0},holdout:{games:0,better:0,worse:0}});
const roleBaseline=new Map(rows.filter(r=>r.arm==='Q-two-counter-role-aware').map(r=>[
 [r.shardIndex,r.scenario,r.starter,r.seat].join('|'),r]));
const actionIndex=new Map(trainingActions.map(e=>[e.matchKey,e]));
const candidateNames=['Q-two-counter-fusion-guard-mild',
 'Q-two-counter-fusion-guard-strong','Q-two-counter-soul-focus'];
const focusedExperiments={};
function signature(a){return [
 a.turn,a.phase,a.type,a.actorId,a.ai,a.di,a.targetId,a.fusionChoice,a.fusionSize
].join('|');}
for(const model of candidateNames){
 const outcome={training:{games:0,better:0,worse:0},holdout:{games:0,better:0,worse:0},
  byRole:{},byDecay:{true:{games:0,better:0,worse:0},false:{games:0,better:0,worse:0}},
  actions:{pairedTrainGames:0,differentGames:0,firstDifferentActions:[],byRole:{}}};
 for(const r of rows.filter(r=>r.arm===model)){
  const prefix=[r.shardIndex,r.scenario,r.starter,r.seat].join('|');
  const control=roleBaseline.get(prefix);
  assert.ok(control,'Missing role-aware comparator');
  assert.equal(r.decayEnabled,control.decayEnabled);
  assert.equal(r.opponentPolicy,control.opponentPolicy);
  const split=r.split==='holdout'?'holdout':'training';
  outcome[split].games++;
  const one=outcome.byRole[r.candidateRole]||(outcome.byRole[r.candidateRole]={games:0,better:0,worse:0});
  const dec=outcome.byDecay[String(r.decayEnabled)];
  for(const item of [one,dec])item.games++;
  if(r.win>control.win){outcome[split].better++;one.better++;dec.better++;}
  else if(r.win<control.win){outcome[split].worse++;one.worse++;dec.worse++;}
  if(r.split!=='train')continue;
  const prev=actionIndex.get(prefix+'|Q-two-counter-role-aware');
  const candidate=actionIndex.get(prefix+'|'+model);
  assert.ok(prev&&candidate,'Missing paired training-only action trace');
  const baseActions=prev.trajectory.map(signature);
  const nextActions=candidate.trajectory.map(signature);
  const min=Math.min(baseActions.length,nextActions.length);
  let at=0;while(at<min&&baseActions[at]===nextActions[at])at++;
  outcome.actions.pairedTrainGames++;
  if(at!==baseActions.length||at!==nextActions.length){
   outcome.actions.differentGames++;
   outcome.actions.byRole[r.candidateRole]=(outcome.actions.byRole[r.candidateRole]||0)+1;
   if(outcome.actions.firstDifferentActions.length<18)
    outcome.actions.firstDifferentActions.push({match:prefix,
     role:r.candidateRole,old:prev.trajectory[at]||null,new:candidate.trajectory[at]||null,
     baselineWon:control.win,candidateWon:r.win});
  }
 }
 assert.equal(outcome.training.games,480);assert.equal(outcome.holdout.games,160);
 assert.equal(outcome.actions.pairedTrainGames,480);
 // These deliberately target one role only; unrelated archetypes must not regress.
 const target=model.includes('fusion')?'fusion':'soul';
 for(const [role,stats] of Object.entries(outcome.byRole)){
  if(role===target)continue;
  assert.equal(stats.better+stats.worse,0,'Unexpected change outside target role: '+model+' '+role);
 }
 focusedExperiments[model]=outcome;
}
const q=JSON.parse(fs.readFileSync(root+'/report.json','utf8'));
const provenance=JSON.parse(fs.readFileSync(root+'/provenance.json','utf8'));
assert.ok(q.priorCheckpointLoaded,'Learning did not persist');
assert.ok(q.historicalSources.length>=3,'Training history missing');
assert.equal(provenance.holdoutAsTraining,false);
const report={schema:'arcane-v1519-80-20-crossdeck-curriculum',
 status:'completed',sourceSha:process.env.GITHUB_SHA||'unknown',
 totalMatches:rows.length,shards:40,shardGames:128,
 controls:{crossDeckRatio:0.8,mirrorRatio:0.2,all30OrderedCrossRolePairs:true,
  sameDecksAndHandForAllComparedPolicies:true,
  bothSeats:true,bothStarters:true,equalInitialLP:true,
  independentHoldoutScenario:true,noAsymmetricHandicaps:true,
  noProductionPromotion:true,arenaLPDecayMatchedOnAndOff:true},
 historicalTrainingSources:q.historicalSources,historicalReplayCount:provenance.historicalTrainingExamples,
 modelSummary:groups,pairedVersusBaseline:paired,pairedRoleVersusPlainDepth2:roleDifferences,
 focusedExperiments,archivedTrainingTrajectories:trainingActions.length,
 independentHoldoutGames:1280,
 plannerDiagnostics:{twoCounter:groups.filter(g=>g.model==='Q-two-counter-planner'||g.model==='Q-two-counter-role-aware').map(g=>({
   secondSummonCounters:g.doubleCounters,secondAttackCounters:g.attackSecondCounters,
   summonOpportunities:g.secondCounterOpportunities,attackOpportunities:g.attackSecondOpportunities}))},
 limitations:[
  '80/20 is measured in matches; all candidate seats/starters are crossed per scenario.',
  'Cross-role rival is a fixed nonlearning archetype policy; matched win rate is not self-play equilibrium.',
  'Opponent and candidate are distinct legal benchmark 40-card decks; no extra stats, LP or predeployed handicap.',
  'Tier 7/10, 0/6/10 attack unlock; arena LP decay enabled or disabled symmetrically within each matched scenario.',
  'Stored game trajectories have terminal outcomes but are NOT causal values for each action.',
  'Tactical Q still trains mainly Predator attack-vs-pass; role skill learning is not fully implemented.',
  'Holdout scenario 3 is never passed to Q training; only training action traces are archived.',
  'No live-game changes or unreviewed Q model promotion.']};
fs.writeFileSync(root+'/fullmatch.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(root+'/fullmatch-cases.json',JSON.stringify(rows)+'\n');
fs.writeFileSync(root+'/training-action-trajectories.json',JSON.stringify({
 schema:'arcane-v1519-training-only-outcome-trajectories',
 note:'Complete candidate public-board action sequences with terminal outcomes; not per-action causal supervision.',
 provenance:q.historicalSources,examples:trainingActions})+'\n');
console.log('ARCANE_V1519_COMPLETE '+JSON.stringify({games:rows.length,
 cross:4096,mirror:1024,trainingTraces:trainingActions.length,
  allTrajectoryActions:trainingActions.reduce((n,x)=>n+x.trajectory.length,0),
  secondCounterActions:groups.find(g=>g.model==='Q-two-counter-planner').doubleCounters+
   groups.find(g=>g.model==='Q-two-counter-planner').attackSecondCounters,
 history:q.historicalSources,pairedRoleVersusPlainDepth2:roleDifferences,
 focusedExperiments:Object.fromEntries(Object.entries(focusedExperiments).map(([k,v])=>[k,{training:v.training,holdout:v.holdout,differentActionGames:v.actions.differentGames}])),
 policies:groups.map(g=>({model:g.model,games:g.games,wins:g.wins,
  crossWins:g.cross.wins,mirrorWins:g.mirror.wins,holdoutWins:g.holdout.wins,
  doubleCounters:g.doubleCounters})),paired}));
