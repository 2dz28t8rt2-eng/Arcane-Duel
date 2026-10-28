'use strict';
/* v15.86 causal audit of 4 matched RNG/deck replications of opening recovery.
 * No selection from HOLDOUT and no automatic change to game rules.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='artifacts/v1586',matches=['mirror','cross'],stages=[9,10];
const modes=['baseline','cooldown'],replicates=[0,1,2,3];
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
   assert.equal(c.openingCooldownMode1586,mode);
   assert.ok(Number.isSafeInteger(c.openingCooldownAssignments1586)&&
    c.openingCooldownAssignments1586>=0);
   assert.ok(Number.isSafeInteger(c.openingCooldownBlocks1586)&&
    c.openingCooldownBlocks1586>=0);
   if(mode==='baseline'){
    assert.equal(c.openingCooldownAssignments1586,0);
    assert.equal(c.openingCooldownBlocks1586,0);
   }
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
assert.equal(sum(shards,s=>s.duels),12288);
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
    'realAttackSelfDamage1585','realAttackKills1585'])
    assert.deepEqual(c[field],b[field],'Candidate marker affected '+field);
   labelChecks++;
  }
 }
 if(mode==='cooldown'){
  const base=new Map(cohorts[[match,stage,'baseline'].join('|')].map(c=>[key(c),c]));
  let swapped=0,drawsIntroduced=0,drawsResolved=0;
  for(const c of rows){
   const b=base.get(key(c));assert.ok(b);
   for(const field of ['seed','seedA','seedB','seat','starter','roleA','roleB',
    'split','openingFiveEqual','openingDeckEqual','openingFusionEqual'])
    assert.deepEqual(c[field],b[field],'Causal arm changed '+field);
   assert.deepEqual(c.openingBeginning,b.openingBeginning,'Opening initial field changed');
   if(winner(c)!==winner(b))swapped++;
   if(c.timeout&&!b.timeout)drawsIntroduced++;
   if(!c.timeout&&b.timeout)drawsResolved++;
   matchedMechanismPairs++;
  }
  effects[[match,stage].join('|')]={differentWinnerOrDraw:swapped,
   drawsIntroduced,drawsResolved,comparisons:rows.length};
 }
}
assert.equal(starterPairs,6144);assert.equal(labelChecks,3072);
assert.equal(matchedMechanismPairs,6144);
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
   byFirstMover:sum(firstAttacks,({c,a})=>a.seat===c.starter?1:0),
   bySecondMover:sum(firstAttacks,({c,a})=>a.seat!==c.starter?1:0),
   meanTurn:aggregate(firstAttacks,({a})=>a.turn),
   meanEffectiveATK:aggregate(firstAttacks,({a})=>a.power),
   meanEnemyLPDamage:aggregate(firstAttacks,({a})=>a.enemyLPDamage),
   meanSelfLPDamage:aggregate(firstAttacks,({a})=>a.selfLPDamage),
   immediateCreatureKills:sum(firstAttacks,({a})=>a.enemyKills),
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
  openingCooldownAssignments:sum(independent,c=>c.openingCooldownAssignments1586),
  openingCooldownBlocks:sum(independent,c=>c.openingCooldownBlocks1586),
  totalActualAttacks:sum(independent,c=>c.realAttackActions1585[0]+c.realAttackActions1585[1]),
  totalAttackKills:sum(independent,c=>c.realAttackKills1585[0]+c.realAttackKills1585[1]),
  totalAttackLPDamage:sum(independent,c=>c.realAttackLPDamage1585[0]+c.realAttackLPDamage1585[1]),
  bySplit:splitRates};
}
for(const match of matches)for(const stage of stages){
 const treated=cohorts[[match,stage,'cooldown'].join('|')];
 assert.ok(sum(treated,c=>c.openingCooldownAssignments1586)>0,
  'Opening recovery was never assigned in '+match+' stage '+stage);
 assert.ok(sum(treated,c=>c.openingCooldownBlocks1586)>0,
  'Opening recovery never blocked a legal attack in '+match+' stage '+stage);
}
const report={schema:'arcane-v1586-opening-attack-recovery',status:'completed',
 totalDuels:12288,starterPairs,labelChecks,matchedMechanismPairs,
 modes,replicates,controls:{gameplayUntouched:true,attackTimingOnly:true,
 sameRngForStarterSwaps:true,replicateSpecificRngAndDeckSeeds:true,
 samePolicyBothSeats:true,fiveCardsBoth:true,noSixthCard:true,
 openingRecoveryOnly:true,statsUnchanged:true,
 exactMirrorDecks:true,oneSidedSeatPerksOff:true,arenaLPDecayDisabled:true,
 trainValidationFirst:true,automaticRulePromotion:false},
 byMatchStage:{},matchedEffects:effects,selection:{},
 caveats:[
  'This is a fixed-policy full-game simulator with independently seeded replicate batches, not neural retraining.',
  'Each replicate includes separate constructed deck seeds and duel RNG; deck archetypes, opponent pairs and scenario split definitions are shared.',
  'First-attack damage and creature destruction are recorded from actual combat, never hypothetical forecast clones.',
  'First-opponent-removal attribution is not trusted for rule selection; the reliable combat wrapper measures verified first attack and first attack kill.',
  'Recovery suppresses the same creature next personal-turn attack only after it attacks in its first own combat window; all combat strength and essence effects remain unchanged.',
  'Win conditional on first attacker or first killer is an association, not proof of causality.',
  'Mirror candidate-seat marker duplicates are not counted as independent duels.',
  'Timeouts are draws, reported separately and excluded from decided-game win rates.',
  'No gameplay changes are made automatically; exploratory selection must be confirmed on stable independent splits before a live rule is considered.'
 ]};
for(const match of matches)for(const stage of stages){
 const group=match+'-'+stage;report.byMatchStage[group]={};
 for(const mode of modes)report.byMatchStage[group][mode]=
  summarize(cohorts[[match,stage,mode].join('|')],match);
}
// The holdout split is never used to rank or approve a live rules change.
const trainValidate=(match,stage,mode)=>summarize(
 cohorts[[match,stage,mode].join('|')].filter(c=>c.split!=='holdout'),match);
const mirror=stages.map(stage=>{
 const b=trainValidate('mirror',stage,'baseline');
 const x=trainValidate('mirror',stage,'cooldown');
 return {stage,baselineSecondWin:b.secondWinRate,cooldownSecondWin:x.secondWinRate,
  cooldownDeviation:Math.abs(x.secondWinRate-.5),
  cooldownDrawRate:x.drawRate};
});
const cross=stages.map(stage=>{
 const b=trainValidate('cross',stage,'baseline');
 const x=trainValidate('cross',stage,'cooldown');
 return {stage,baselineCandidateWin:b.candidateWinRate,
  cooldownCandidateWin:x.candidateWinRate,
  difference:x.candidateWinRate-b.candidateWinRate};
});
report.selection={calculatedFrom:'TRAIN+VALIDATION only',mirror,cross,
 cooldownMeetsExploratoryGate:mirror.every(x=>x.cooldownDeviation<=.055&&x.cooldownDrawRate<=.05)&&
  cross.every(x=>Math.abs(x.difference)<=.08),
 anyGameplayChange:false,actionRequired:'Assess whether opening recovery reduces first-kill snowball without distorting Fusion/Predator matchups; keep live gameplay unchanged.'};
const dir=path.join(root,'analysis');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1586_COMPLETE '+JSON.stringify({status:report.status,
 duels:report.totalDuels,starterPairs,labelChecks,matchedMechanismPairs,
 selection:report.selection,
 summary:Object.fromEntries(Object.entries(report.byMatchStage).map(([group,results])=>[
  group,Object.fromEntries(Object.entries(results).map(([mode,s])=>[
   mode,{secondWin:s.secondWinRate,draws:s.draws,firstAttack:s.firstAttack,
    firstKill:s.firstAttackKill,firstRemoval:s.firstOpponentRemoval,
    splits:s.bySplit}]))]))}));
