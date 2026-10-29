'use strict';
/* v15.89 matched base-stat threshold study (85/80/75%) with live Swarm.
 * No evolution, no HOLDOUT selection and no live rule promotion.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='artifacts/v1589',matches=['mirror','cross'],stages=[9,10];
const modes=['baseline','base85','base80','base75'],replicates=[0,1,2,3];
const key=c=>[c.replicate,c.stage,c.pair,c.scenario,c.starter,c.seat,c.arm].join('|');
const winner=c=>c.timeout?null:(c.win?c.seat:1-c.seat);
const sum=(rows,fn)=>rows.reduce((n,c)=>n+fn(c),0);
const rate=(n,d)=>d?n/d:null;
const wilson=(wins,total)=>{
 if(!total)return null;
 const z=1.9599639845,p=wins/total,d=1+z*z/total;
 const centre=(p+z*z/(2*total))/d;
 const radius=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;
 return [centre-radius,centre+radius];
};
const cohorts={},shards=[];
for(const match of matches)for(const stage of stages)for(const mode of modes){
 const rows=[];
 for(const replicate of replicates)for(let pair=0;pair<8;pair++)for(let chunk=0;chunk<2;chunk++){
  const file=path.join(root,'r'+replicate,match,mode,
   `stage-${stage}-pair-${pair}-chunk-${chunk}.json`);
  assert.ok(fs.existsSync(file),'Missing bounded research shard: '+file);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(data.stage,stage);assert.equal(data.pair,pair);assert.equal(data.chunk,chunk);
  assert.equal(data.cases.length,24,'Unexpected shard sample count');
  for(const c of data.cases){
   assert.equal(c.matchType,match);assert.equal(c.deploymentMode,'baseline');
   assert.equal(c.predatorEvolutionMode1589,mode);
   for(const field of ['predatorEvolutionAssignments1589',
    'predatorEvolutionTicks1589','predatorEvolutionAttacks1589']){
    assert.ok(Number.isSafeInteger(c[field])&&c[field]>=0,'Invalid '+field);
   }
   assert.ok(c.predatorEvolutionAttackAges1589&&
    typeof c.predatorEvolutionAttackAges1589==='object');
   assert.ok(Object.entries(c.predatorEvolutionAttackAges1589).every(
    ([age,n])=>Number.isInteger(+age)&&+age>=0&&+age<=6&&
     Number.isSafeInteger(n)&&n>=0),'Invalid age buckets');
   assert.equal(Object.values(c.predatorEvolutionAttackAges1589).
    reduce((x,n)=>x+n,0),c.predatorEvolutionAttacks1589);
   if(mode==='baseline'){
    assert.equal(c.predatorEvolutionAssignments1589,0);
    assert.equal(c.predatorEvolutionTicks1589,0);
    assert.equal(c.predatorEvolutionAttacks1589,0);
   }
   assert.ok(Number.isFinite(c.openingRuleFlags?.predatorSwarm));
   assert.ok(Number.isFinite(c.openingRuleFlags?.predatorPierce));
   assert.ok(c.openingRuleFlags.predatorSwarm>0,
    'Swarming was accidentally disabled');
   assert.equal(c.stage,stage);assert.equal(c.arm,'fusion-v1574-stomp-conscious');
   assert.equal(c.extraCardSecond,0);assert.deepEqual(c.actualStartingHands,[5,5]);
   assert.equal(c.diagnosticFactor,'baseline');
   assert.equal(c.openingRuleFlags?.arenaDecayDisabled,true);
   assert.ok(['train','validation','holdout'].includes(c.split));
   assert.ok(c.illegalSwitchesBySeat?.every(n=>n===0));
   if(match==='mirror'){
    assert.equal(c.openingFiveEqual,true);assert.equal(c.openingDeckEqual,true);
    assert.equal(c.openingFusionEqual,true);
   }
   for(const field of ['realAttackActions1585','realAttackLPDamage1585',
    'realAttackSelfDamage1585','realAttackKills1585']){
    assert.ok(Array.isArray(c[field])&&c[field].length===2,'Missing '+field);
    assert.ok(c[field].every(v=>Number.isSafeInteger(v)&&v>=0),'Invalid '+field);
   }
   for(const field of ['firstAttack1585','firstAttackKill1585']){
    const a=c[field];assert.ok(a===null||typeof a==='object','Missing '+field);
    if(a){
     assert.ok([0,1].includes(a.seat)&&a.turn>=2,'Illegal first combat turn');
     assert.ok(Number.isFinite(a.power)&&a.power>=0,'Invalid effective attack');
     if(field==='firstAttack1585'){
      assert.ok(typeof a.attackerRole==='string'&&a.attackerRole.length>0);
      assert.ok(typeof a.targetRole==='string'&&a.targetRole.length>0);
      assert.ok(['atk','def','none'].includes(a.targetMode));
      assert.ok(a.targetEffectiveDEF===null||(Number.isFinite(a.targetEffectiveDEF)&&a.targetEffectiveDEF>=0));
     }
     for(const n of ['enemyLPDamage','selfLPDamage','enemyKills','ownLosses'])
      assert.ok(Number.isSafeInteger(a[n])&&a[n]>=0,'Invalid attack damage '+n);
    }
   }
   if(c.firstAttackKill1585)assert.ok(c.firstAttackKill1585.enemyKills>0);
   if(c.firstOpponentRemoval1585){
    const f=c.firstOpponentRemoval1585;
    assert.ok([0,1].includes(f.seat)&&f.removed>0&&f.turn>=1);
   }
   const release=2;
   for(let turn=1;turn<release;turn++)
    assert.equal(c.openingActionByTurn?.[turn]?.types?.attack||0,0,
     'Premature attack in '+mode);
   if(c.firstAttack1585)assert.ok(c.firstAttack1585.turn>=release);
   assert.equal(c.emergencyAttackActions,0);assert.equal(c.emergencyHalfDamageChecks,0);
   assert.equal(c.openingTimeline?.length,Math.min(6,c.turn-1));
   assert.ok(c.openingTimeline.every((t,i)=>t.turn===i+1&&t.owner===(c.starter+i)%2));
   rows.push({...c,replicate});
  }
  shards.push({match,stage,mode,replicate,pair,chunk,duels:24});
 }
 assert.equal(rows.length,1536);assert.equal(new Set(rows.map(key)).size,1536);
 for(const split of ['train','validation','holdout'])
  assert.equal(rows.filter(c=>c.split===split).length,512);
 cohorts[[match,stage,mode].join('|')]=rows;
}
assert.equal(sum(shards,s=>s.duels),24576);
let starterPairs=0,labelChecks=0,matchedMechanismPairs=0;
const effects={};
for(const match of matches)for(const stage of stages)for(const mode of modes){
 const rows=cohorts[[match,stage,mode].join('|')];
 const starter0=new Map(rows.filter(c=>c.starter===0)
  .map(c=>[[c.replicate,c.pair,c.scenario,c.seat].join('|'),c]));
 for(const c of rows.filter(c=>c.starter===1)){
  const b=starter0.get([c.replicate,c.pair,c.scenario,c.seat].join('|'));
  assert.ok(b,'Missing paired opposite starter');
  for(const field of ['seed','seedA','seedB','seat','roleA','roleB','split'])
   assert.deepEqual(c[field],b[field],'Starter swap changed '+field);
  starterPairs++;
 }
 if(match==='mirror'){
  const marker0=new Map(rows.filter(c=>c.seat===0)
   .map(c=>[[c.replicate,c.pair,c.scenario,c.starter].join('|'),c]));
  for(const c of rows.filter(c=>c.seat===1)){
   const b=marker0.get([c.replicate,c.pair,c.scenario,c.starter].join('|'));
   assert.ok(b,'Missing marker duplicate');
   assert.equal(c.timeout,b.timeout);assert.equal(winner(c),winner(b));
   assert.equal(c.turn,b.turn);
   for(const field of ['firstAttack1585','firstAttackKill1585',
    'firstOpponentRemoval1585','realAttackActions1585','realAttackLPDamage1585',
    'realAttackSelfDamage1585','realAttackKills1585',
    'predatorEvolutionAssignments1589','predatorEvolutionTicks1589',
    'predatorEvolutionAttacks1589','predatorEvolutionAttackAges1589'])
    assert.deepEqual(c[field],b[field],'Candidate marker affected '+field);
   labelChecks++;
  }
 }
 if(mode!=='baseline'){
  const base=new Map(cohorts[[match,stage,'baseline'].join('|')].map(c=>[key(c),c]));
  let swapped=0,drawsIntroduced=0,drawsResolved=0;
  for(const c of rows){
   const b=base.get(key(c));assert.ok(b);
   for(const field of ['seed','seedA','seedB','seat','starter','roleA','roleB',
    'split','openingFiveEqual','openingDeckEqual','openingFusionEqual'])
    assert.deepEqual(c[field],b[field],'Causal arm changed '+field);
   assert.deepEqual(c.openingBeginning,b.openingBeginning,'Opening initial field changed');
   assert.equal(c.openingRuleFlags.predatorSwarm,b.openingRuleFlags.predatorSwarm,
    'Swarming varied between matched arms');
   assert.equal(c.openingRuleFlags.predatorPierce,b.openingRuleFlags.predatorPierce,
    'Armor pierce varied between matched arms');
   if(winner(c)!==winner(b))swapped++;
   if(c.timeout&&!b.timeout)drawsIntroduced++;
   if(!c.timeout&&b.timeout)drawsResolved++;
   matchedMechanismPairs++;
  }
  effects[[match,stage,mode].join('|')]={differentWinnerOrDraw:swapped,
   drawsIntroduced,drawsResolved,comparisons:rows.length};
 }
}
assert.equal(starterPairs,12288);assert.equal(labelChecks,6144);
assert.equal(matchedMechanismPairs,18432);
for(const mode of modes){
 const rows=cohorts[['mirror',10,mode].join('|')];
 assert.ok(sum(rows,c=>c.realAttackActions1585[0]+c.realAttackActions1585[1])>0,
  'No real Predator attacks recorded');
 const release=2;
 assert.ok(sum(rows,c=>c.openingActionByTurn?.[release]?.types?.attack||0)>0,
  'No real attack in first permitted turn');
}

function summarize(rows,match){
 const independent=match==='mirror'?rows.filter(c=>c.seat===0):rows;
 const n=independent.length,draws=sum(independent,c=>c.timeout?1:0);
 const resolved=n-draws;
 const second=sum(independent,c=>winner(c)!==null&&winner(c)!==c.starter?1:0);
 const firstAttacks=independent.map(c=>({c,a:c.firstAttack1585})).filter(x=>x.a);
 const firstKills=independent.map(c=>({c,a:c.firstAttackKill1585})).filter(x=>x.a);
 const firstRemovals=independent.map(c=>({c,a:c.firstOpponentRemoval1585})).filter(x=>x.a);
 const withResult=rows.filter(c=>!c.timeout);
 const candidateWins=sum(withResult,c=>c.win?1:0);
 const aggregate=(events,fn)=>events.length?sum(events,fn)/events.length:null;
 const firstAttackerWins=sum(firstAttacks,({c,a})=>winner(c)===a.seat?1:0);
 const firstKillerWins=sum(firstKills,({c,a})=>winner(c)===a.seat?1:0);
 const firstRemoverWins=sum(firstRemovals,({c,a})=>winner(c)===a.seat?1:0);
 const determined=(events)=>events.filter(({c})=>winner(c)!==null).length;
 const splits=Object.fromEntries(['train','validation','holdout'].map(split=>[
  split,independent.filter(c=>c.split===split)]));
 const splitRates=Object.fromEntries(Object.entries(splits).map(([split,cases])=>{
  const resolved=cases.filter(c=>!c.timeout),win=sum(resolved,c=>winner(c)!==c.starter?1:0);
  return [split,{duels:cases.length,draws:cases.length-resolved.length,
   secondWinRate:rate(win,resolved.length),secondWinWilson95:wilson(win,resolved.length)}];
 }));
 return {duelRecords:rows.length,independentDuels:n,draws,drawRate:rate(draws,n),
  resolvedDuels:resolved,secondWins:second,secondWinRate:rate(second,resolved),
  secondScoreRate:rate(second+.5*draws,n),secondWinWilson95:wilson(second,resolved),
  candidateWins,candidateWinRate:rate(candidateWins,withResult.length),
  meanTurns:aggregate(independent.map(c=>({c})),({c})=>c.turn),
  firstAttack:{observed:firstAttacks.length,
   immediateKillDuels:sum(firstAttacks,({a})=>a.enemyKills>0?1:0),
   immediateKillRate:rate(sum(firstAttacks,({a})=>a.enemyKills>0?1:0),
    firstAttacks.length),
   byFirstMover:sum(firstAttacks,({c,a})=>a.seat===c.starter?1:0),
   bySecondMover:sum(firstAttacks,({c,a})=>a.seat!==c.starter?1:0),
   meanTurn:aggregate(firstAttacks,({a})=>a.turn),
   meanEffectiveATK:aggregate(firstAttacks,({a})=>a.power),
   meanEnemyLPDamage:aggregate(firstAttacks,({a})=>a.enemyLPDamage),
   meanSelfLPDamage:aggregate(firstAttacks,({a})=>a.selfLPDamage),
   immediateCreatureKills:sum(firstAttacks,({a})=>a.enemyKills),
   targetedRoles:Object.fromEntries([...new Set(firstAttacks.map(({a})=>a.targetRole))]
    .sort().map(role=>[role,{attacks:firstAttacks.filter(({a})=>a.targetRole===role).length,
     kills:firstAttacks.filter(({a})=>a.targetRole===role&&a.enemyKills>0).length}])),
   meanTargetEffectiveDEF:aggregate(firstAttacks.filter(({a})=>Number.isFinite(a.targetEffectiveDEF)),({a})=>a.targetEffectiveDEF),
   winnerWasFirstAttackerRate:rate(firstAttackerWins,determined(firstAttacks))},
  firstAttackKill:{observed:firstKills.length,
   byFirstMover:sum(firstKills,({c,a})=>a.seat===c.starter?1:0),
   bySecondMover:sum(firstKills,({c,a})=>a.seat!==c.starter?1:0),
   meanTurn:aggregate(firstKills,({a})=>a.turn),
   winnerWasFirstKillerRate:rate(firstKillerWins,determined(firstKills))},
  firstOpponentRemoval:{observed:firstRemovals.length,
   byAction:Object.fromEntries([...new Set(firstRemovals.map(({a})=>a.action))]
    .map(action=>[action,firstRemovals.filter(({a})=>a.action===action).length])),
   winnerWasFirstRemoverRate:rate(firstRemoverWins,determined(firstRemovals))},
  evolution:{assignments:sum(independent,c=>c.predatorEvolutionAssignments1589),
   ticks:sum(independent,c=>c.predatorEvolutionTicks1589),
   attacks:sum(independent,c=>c.predatorEvolutionAttacks1589),
   ageHistogram:Object.fromEntries([0,1,2,3,4,5,6].map(age=>[age,
    sum(independent,c=>c.predatorEvolutionAttackAges1589[age]||0)]))},
  totalActualAttacks:sum(independent,c=>c.realAttackActions1585[0]+c.realAttackActions1585[1]),
  totalAttackKills:sum(independent,c=>c.realAttackKills1585[0]+c.realAttackKills1585[1]),
  totalAttackLPDamage:sum(independent,c=>c.realAttackLPDamage1585[0]+c.realAttackLPDamage1585[1]),
  bySplit:splitRates};
}
for(const match of matches)for(const stage of stages)
 for(const mode of ['base85','base80','base75']){
  const treated=cohorts[[match,stage,mode].join('|')];
  assert.ok(sum(treated,c=>c.predatorEvolutionAssignments1589)>0,
   'No deployed Predator evolved in '+match+'/'+stage+'/'+mode);
  assert.ok(sum(treated,c=>c.predatorEvolutionTicks1589)>0,
   'Predators never aged in '+match+'/'+stage+'/'+mode);
  assert.ok(sum(treated,c=>c.predatorEvolutionAttacks1589)>0,
   'Evolved Predators never attacked in '+match+'/'+stage+'/'+mode);
 }
const report={schema:'arcane-v1589-predator-base-threshold',status:'completed',
 totalDuels:24576,starterPairs,labelChecks,matchedMechanismPairs,
 modes,replicates,controls:{gameplayUntouched:true,productionSwarmUnchanged:true,
 swarmAndPierceMatchedAcrossArms:true,statScalingOnDeployedPredatorsOnly:true,
 baseFactors:{base85:.85,base80:.80,base75:.75},
 progressiveGrowthDisabled:true,productionArmorPierceUnchanged:true,
 sameRngForStarterSwaps:true,replicateSpecificRngAndDeckSeeds:true,
 samePolicyBothSeats:true,fiveCardsBoth:true,noSixthCard:true,
 exactMirrorDecks:true,oneSidedSeatPerksOff:true,arenaLPDecayDisabled:true,
 trainValidationFirst:true,automaticRulePromotion:false},
 byMatchStage:{},matchedEffects:effects,selection:{},
 caveats:[
  'This is a fixed-policy full-game simulator with independently seeded replicate batches, not neural retraining.',
  'Each replicate includes separate constructed deck seeds and duel RNG; deck archetypes, opponent pairs and scenario split definitions are shared.',
  'First-attack damage and creature destruction are recorded from actual combat, never hypothetical forecast clones.',
  'First-opponent-removal attribution is not trusted for rule selection; the reliable combat wrapper measures verified first attack and first attack kill.',
  'Three fixed thresholds reduce Predator attack and defensive HP to 85%, 80% or 75% of current values. No evolution growth is applied. This isolates basic strength before timing changes.',
  'Research-only age counters are retained for an audit of deployed instances, but age does not affect any stat in v15.89.',
  'Only deployed Predator ATK and DEF are scaled in the combat view and HP damage path. Essence layers, +2% Swarm and Predator armor-pierce remain unchanged.',
  'Natural decay and attack fatigue continue to reduce stored base stats, independent of the age multiplier.',
  'Win conditional on first attacker or first killer is an association, not proof of causality.',
  'Mirror candidate-seat marker duplicates are not counted as independent duels.',
  'Timeouts are draws, reported separately and excluded from decided-game win rates.',
  'No gameplay or Swarm rule changes are made automatically; independent evidence is required before promotion.'
 ]};
for(const match of matches)for(const stage of stages){
 const group=match+'-'+stage;report.byMatchStage[group]={};
 for(const mode of modes)report.byMatchStage[group][mode]=
  summarize(cohorts[[match,stage,mode].join('|')],match);
}
// Holdout remains sealed from selection; it is reported after selection only.
const trainValidate=(match,stage,mode)=>summarize(
 cohorts[[match,stage,mode].join('|')].filter(c=>c.split!=='holdout'),match);
const candidates=['base85','base80','base75'].map(mode=>{
 const mirror=stages.map(stage=>{
  const b=trainValidate('mirror',stage,'baseline');
  const x=trainValidate('mirror',stage,mode);
  return {stage,baselineSecondWin:b.secondWinRate,testedSecondWin:x.secondWinRate,
   baselineSeatDeviation:Math.abs(b.secondWinRate-.5),
   testedSeatDeviation:Math.abs(x.secondWinRate-.5),
   baselineFirstAttackKillRate:b.firstAttack.immediateKillRate,
   testedFirstAttackKillRate:x.firstAttack.immediateKillRate,drawRate:x.drawRate};
 });
 const cross=stages.map(stage=>{
  const b=trainValidate('cross',stage,'baseline');
  const x=trainValidate('cross',stage,mode);
  return {stage,baselineCandidateWin:b.candidateWinRate,
   testedCandidateWin:x.candidateWinRate,
   testedDistanceFromFifty:Math.abs(x.candidateWinRate-.5),
   baselineDistanceFromFifty:Math.abs(b.candidateWinRate-.5)};
 });
 const pred=mirror.find(x=>x.stage===10),fusion=mirror.find(x=>x.stage===9);
 const meetsExploratoryGate=pred.testedSeatDeviation<=.12&&
  pred.testedFirstAttackKillRate<=pred.baselineFirstAttackKillRate-.05&&
  fusion.testedSeatDeviation<=.08&&
  cross.every(x=>x.testedDistanceFromFifty<=Math.max(.12,x.baselineDistanceFromFifty+.03))&&
  mirror.every(x=>x.drawRate<=.05);
 const score=2*pred.testedFirstAttackKillRate+pred.testedSeatDeviation+
  .5*cross.reduce((sum,x)=>sum+x.testedDistanceFromFifty,0);
 return {mode,mirror,cross,meetsExploratoryGate,score,
  firstAttackKillReduction:pred.baselineFirstAttackKillRate-pred.testedFirstAttackKillRate};
});
const eligible=candidates.filter(x=>x.meetsExploratoryGate)
 .sort((a,b)=>a.score-b.score);
report.selection={calculatedFrom:'TRAIN+VALIDATION only',candidates,
 exploratoryWinner:eligible[0]?.mode||null,
 anyGameplayChange:false,
 actionRequired:'Review whether 75/80/85% Predator ATK+DEF reduces early lethal attacks and improves symmetric fairness and cross-role Fusion matchups. Preserve Swarm; no automatic live nerf.'};
const dir=path.join(root,'analysis');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1589_COMPLETE '+JSON.stringify({status:report.status,
 duels:report.totalDuels,starterPairs,labelChecks,matchedMechanismPairs,
 selection:report.selection,
 summary:Object.fromEntries(Object.entries(report.byMatchStage).map(([group,results])=>[
  group,Object.fromEntries(Object.entries(results).map(([mode,s])=>[
   mode,{secondWin:s.secondWinRate,draws:s.draws,firstAttack:s.firstAttack,
    firstKill:s.firstAttackKill,evolution:s.evolution,meanTurns:s.meanTurns,
    splits:s.bySplit}]))]))}));
