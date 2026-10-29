'use strict';
/* v15.93: first monster guard causal research and real fusion counterplay */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const modes=['baseline','once','turn2','normalOnly','onceNormal'];
const matches=['mirror','cross'],stages=[9,10],replicates=[0,1,2];
const shardRoot='artifacts/v1593',cohorts={},effects={};
const sum=(xs,f)=>xs.reduce((n,x)=>n+f(x),0);
const rate=(n,d)=>d?n/d:null;
const win=c=>c.timeout?null:c.win?c.seat:1-c.seat;
const wilson=(wins,total)=>{
 if(!total)return null;
 const z=1.9599639845,p=wins/total,d=1+z*z/total;
 const center=(p+z*z/(2*total))/d;
 const radius=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;
 return [center-radius,center+radius];
};
const key=c=>[c.replicate,c.stage,c.pair,c.scenario,c.starter,c.seat].join('|');
let shards=0,records=0,starterPairs=0,labelChecks=0,matchedMechanismPairs=0;
for(const match of matches)for(const stage of stages)for(const mode of modes){
 const rows=[];
 for(const replicate of replicates)for(let pair=0;pair<8;pair++)for(let chunk=0;chunk<2;chunk++){
  const file=path.join(shardRoot,'r'+replicate,match,mode,
   'stage-'+stage+'-pair-'+pair+'-chunk-'+chunk+'.json');
  assert.ok(fs.existsSync(file),'Missing shard '+file);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(data.stage,stage);assert.equal(data.pair,pair);
  assert.equal(data.chunk,chunk);assert.equal(data.cases.length,24);
  shards++;records+=24;
  for(const c of data.cases){
   assert.equal(c.stage,stage);assert.equal(c.matchType,match);
   assert.equal(c.predatorEvolutionMode1593,mode);
   assert.equal(c.openingRuleFlags?.arenaDecayDisabled,true);
   assert.ok(c.openingRuleFlags.predatorSwarm>0);
   assert.ok(c.openingRuleFlags.predatorPierce>0);
   assert.deepEqual(c.actualStartingHands,[5,5]);
   assert.equal(c.extraCardSecond,0);
   assert.ok(['train','validation','holdout'].includes(c.split));
   assert.ok(c.illegalSwitchesBySeat.every(n=>n===0));
   for(const f of ['realAttackActions1585','realAttackKills1585',
    'actualFusionActionsBySeat1593','actualFirstTurnFusionActionsBySeat1593',
    'actualFusionsUnderPredatorPressureBySeat1593',
    'actualPredatorThreatTurnsBySeat1593']){
    assert.ok(Array.isArray(c[f])&&c[f].length===2,
     'Missing actual live telemetry '+f+' in '+file);
    assert.ok(c[f].every(n=>Number.isSafeInteger(n)&&n>=0),'Bad '+f);
   }
   assert.ok(Array.isArray(c.actualFirstFusionTurnBySeat1593)&&
    c.actualFirstFusionTurnBySeat1593.length===2);
   assert.ok(c.selfPlayActionTypesBySeat?.length===2);
   for(let seat=0;seat<2;seat++){
    const actual=c.actualFusionActionsBySeat1593[seat];
    const existing=c.selfPlayActionTypesBySeat[seat].fusion||0;
    assert.ok(actual>=existing,
     'Real fusion audit missed successful AI fusion action: '+file+' '+seat);
    assert.ok(c.actualFirstTurnFusionActionsBySeat1593[seat]<=actual);
    assert.ok(c.actualFusionsUnderPredatorPressureBySeat1593[seat]<=actual);
    assert.ok(c.actualPredatorThreatTurnsBySeat1593[seat]<=c.turn);
    if(actual>0)assert.ok(Number.isInteger(c.actualFirstFusionTurnBySeat1593[seat]));
   }
   assert.ok(c.firstAttack1585===null||
    (c.firstAttack1585.turn>=2&&Number.isFinite(c.firstAttack1585.power)));
   if(c.firstAttack1585){
    const a=c.firstAttack1585;
    assert.ok(typeof a.attackerIsFusion==='boolean');
    assert.ok(typeof a.targetIsFusion==='boolean');
    assert.ok(Number.isFinite(a.defenderShieldBefore));
    assert.ok(Number.isFinite(a.defenderShieldAfter));
    assert.ok(a.targetEffectiveATK===null||Number.isFinite(a.targetEffectiveATK));
   }
   const secondSeat=1-c.starter;
   for(const f of ['protectedOpeningCard1593','protectedOpeningCardFusion1593',
      'openingProtectionHits1593','openingPreventedKills1593',
      'openingSavedFusion1593','openingSavedNormal1593'])
     assert.ok(Number.isSafeInteger(c[f])&&c[f]>=0,'Invalid guard telemetry '+f);
   assert.ok(c.protectedOpeningCard1593<=1);
   assert.ok(c.protectedOpeningCardFusion1593<=c.protectedOpeningCard1593);
   assert.equal(c.openingSavedFusion1593+c.openingSavedNormal1593,c.openingPreventedKills1593);
   assert.ok(c.openingPreventedKills1593<=c.openingProtectionHits1593);
   assert.ok(Array.isArray(c.openingGuardEvents1593));
   assert.equal(c.openingGuardEvents1593.length,c.openingProtectionHits1593);
   for(const event of c.openingGuardEvents1593){
     assert.equal(event.turn,2);
     assert.equal(event.attacker,secondSeat);
     assert.equal(typeof event.preventedKill,'boolean');
   }
   if(mode==='baseline')assert.equal(c.openingProtectionHits1593,0);
   if(['normalOnly','onceNormal'].includes(mode)){
     assert.equal(c.protectedOpeningCardFusion1593,0);
     assert.equal(c.openingSavedFusion1593,0);
   }
   if(['once','onceNormal'].includes(mode))
     assert.ok(c.openingProtectionHits1593<=1,'Single use guard repeated');
   assert.deepEqual(c.openingBeginning.map(p=>p.shield),[0,0],
     'Opening shield unexpectedly present');
   assert.ok(c.openingFieldByTurn1593&&typeof c.openingFieldByTurn1593==='object',
     'Missing observed early-turn field telemetry');
   for(const snapshot of Object.values(c.openingFieldByTurn1593)){
    assert.equal(snapshot.players.length,2);
    for(const p of snapshot.players){
     assert.ok(Number.isSafeInteger(p.field)&&p.field>=0&&p.field<=5);
     assert.ok(Number.isSafeInteger(p.hand)&&p.hand>=0);
     assert.ok(Number.isSafeInteger(p.graveyard)&&p.graveyard>=0);
    }
   }
   assert.equal(c.openingActionByTurn?.[1]?.types?.attack||0,0);
   assert.equal(c.predatorEvolutionAssignments1593,0);
   assert.equal(c.predatorEvolutionTicks1593,0);
   if(match==='mirror'){
    assert.equal(c.openingFiveEqual,true);
    assert.equal(c.openingDeckEqual,true);
    assert.equal(c.openingFusionEqual,true);
   }
   rows.push({...c,replicate});
  }
 }
 assert.equal(rows.length,1152);
 assert.equal(new Set(rows.map(key)).size,1152);
 for(const split of ['train','validation','holdout'])
  assert.equal(rows.filter(c=>c.split===split).length,384);
 cohorts[[match,stage,mode].join('|')]=rows;
}
assert.equal(records,23040);assert.equal(shards,960);
const unchangedOpening=(x)=>{
 const z=JSON.parse(JSON.stringify(x));
 for(const seat of z)delete seat.shield;
 return z;
};
for(const match of matches)for(const stage of stages)for(const mode of modes){
 const rows=cohorts[[match,stage,mode].join('|')];
 const starter0=new Map(rows.filter(c=>c.starter===0)
  .map(c=>[[c.replicate,c.pair,c.scenario,c.seat].join('|'),c]));
 for(const c of rows.filter(c=>c.starter===1)){
  const b=starter0.get([c.replicate,c.pair,c.scenario,c.seat].join('|'));
  assert.ok(b,'Missing opposite starter');
  for(const f of ['seed','seedA','seedB','seat','roleA','roleB','split'])
   assert.deepEqual(c[f],b[f],'Mismatched paired source '+f);
  starterPairs++;
 }
 if(match==='mirror'){
  const seat0=new Map(rows.filter(c=>c.seat===0).map(c=>[
   [c.replicate,c.pair,c.scenario,c.starter].join('|'),c]));
  for(const c of rows.filter(c=>c.seat===1)){
   const b=seat0.get([c.replicate,c.pair,c.scenario,c.starter].join('|'));
   assert.ok(b);assert.equal(win(c),win(b));
   assert.equal(c.turn,b.turn);
   for(const f of ['firstAttack1585','realAttackActions1585',
    'actualFusionActionsBySeat1593','actualFusionsUnderPredatorPressureBySeat1593',
    'actualFirstTurnFusionActionsBySeat1593','openingTimeline',
    'openingProtectionHits1593','openingPreventedKills1593','openingGuardEvents1593'])
    assert.deepEqual(c[f],b[f],'Duplicated mirror differs: '+f);
   labelChecks++;
  }
 }
 if(mode!=='baseline'){
  const base=new Map(cohorts[[match,stage,'baseline'].join('|')].map(c=>[key(c),c]));
  let swapped=0,drawsIntroduced=0,drawsResolved=0;
  for(const c of rows){
   const b=base.get(key(c));assert.ok(b);
   for(const f of ['seed','seedA','seedB','seat','starter','roleA','roleB',
    'split','openingFiveEqual','openingDeckEqual','openingFusionEqual'])
    assert.deepEqual(c[f],b[f],'Intervention changed randomized control '+f);
   assert.deepEqual(unchangedOpening(c.openingBeginning),
    unchangedOpening(b.openingBeginning),'Intervention changed starting board');
   assert.equal(c.openingRuleFlags.predatorSwarm,b.openingRuleFlags.predatorSwarm);
   assert.equal(c.openingRuleFlags.predatorPierce,b.openingRuleFlags.predatorPierce);
   if(win(c)!==win(b))swapped++;
   if(c.timeout&&!b.timeout)drawsIntroduced++;
   if(!c.timeout&&b.timeout)drawsResolved++;
   matchedMechanismPairs++;
  }
  effects[[match,stage,mode].join('|')]={swapped,drawsIntroduced,drawsResolved,
   matchedCases:rows.length};
 }
}
assert.equal(starterPairs,11520);
assert.equal(labelChecks,5760);
assert.equal(matchedMechanismPairs,18432);
function summarize(input,match){
 const rows=match==='mirror'?input.filter(c=>c.seat===0):input;
 const n=rows.length,decided=rows.filter(c=>!c.timeout);
 const first=rows.filter(c=>c.firstAttack1585);
 const killed=first.filter(c=>c.firstAttack1585.enemyKills>0);
 const fusions=sum(rows,c=>c.actualFusionActionsBySeat1593[0]+c.actualFusionActionsBySeat1593[1]);
 const firstOwnTurnFusions=sum(rows,c=>c.actualFirstTurnFusionActionsBySeat1593[0]+c.actualFirstTurnFusionActionsBySeat1593[1]);
 const fusionCounterattacks=sum(rows,c=>c.actualFusionsUnderPredatorPressureBySeat1593[0]+c.actualFusionsUnderPredatorPressureBySeat1593[1]);
 const firstRolePairs={};const firstModeCounts={};const firstAttackerWin={wins:0,decided:0};
 for(const c of first){
  const a=c.firstAttack1585;
  const role=a.attackerRole+'>'+a.targetRole;
  firstRolePairs[role]??={attacks:0,kills:0};
  firstRolePairs[role].attacks++;
  firstRolePairs[role].kills+=(a.enemyKills>0?1:0);
  firstModeCounts[a.targetMode]=(firstModeCounts[a.targetMode]||0)+1;
  if(!c.timeout){firstAttackerWin.decided++;if(win(c)===a.seat)firstAttackerWin.wins++;}
 }
 const firstAttackSecond=sum(first,c=>c.firstAttack1585.seat!==c.starter?1:0);
 const openingAt=(turn)=>{
  const available=rows.filter(c=>c.openingFieldByTurn1593?.[turn]?.players?.length===2);
  const secondMinusFirst=available.map(c=>{
   const p=c.openingFieldByTurn1593[turn].players;
   return p[1-c.starter].field-p[c.starter].field;
  });
  const deficit=available.filter(c=>{
   const p=c.openingFieldByTurn1593[turn].players;
   return p[c.starter].field<p[1-c.starter].field;
  });
  return {observed:available.length,meanSecondBoardLead:rate(sum(secondMinusFirst,x=>x),available.length),
   firstPlayerBehindRate:rate(deficit.length,available.length),
   firstPlayerBehindWins:rate(sum(deficit,c=>win(c)===c.starter?1:0),deficit.filter(c=>!c.timeout).length),
   meanTotalGraveyard:rate(sum(available,c=>sum(c.openingFieldByTurn1593[turn].players,p=>p.graveyard)),available.length),
   meanTotalFusionActions:rate(sum(available,c=>sum(c.openingFieldByTurn1593[turn].players,p=>p.fusions)),available.length)};
 };
 return {independentDuels:n,draws:n-decided.length,
  secondWinRate:rate(sum(decided,c=>win(c)!==c.starter?1:0),decided.length),
  secondWinWilson95:wilson(sum(decided,c=>win(c)!==c.starter?1:0),decided.length),
  candidateWinRate:rate(sum(decided,c=>c.win?1:0),decided.length),
  firstAttack:{observed:first.length,secondMoverFirstAttack:firstAttackSecond,
   secondMoverFirstAttackRate:rate(firstAttackSecond,first.length),
   firstAttackKillRate:rate(killed.length,first.length),
   firstAttackerWinRate:rate(firstAttackerWin.wins,firstAttackerWin.decided),
   meanTurn:rate(sum(first,c=>c.firstAttack1585.turn),first.length),
   meanATK:rate(sum(first,c=>c.firstAttack1585.power),first.length),
   meanDefenderDEF:rate(sum(first,c=>c.firstAttack1585.targetEffectiveDEF||0),first.length),
   firstRolePairs,firstTargetModes:firstModeCounts},
  fusion:{verifiedRealFusionActions:fusions,
   firstOwnTurnFusionActions:firstOwnTurnFusions,
   fusionsWithPredatorPresent:fusionCounterattacks,
   duelsWithFusionUnderPredatorPressure:sum(rows,c=>
    c.actualFusionsUnderPredatorPressureBySeat1593.some(v=>v>0)?1:0),
   predatorThreatTurns:sum(rows,c=>
    c.actualPredatorThreatTurnsBySeat1593[0]+c.actualPredatorThreatTurnsBySeat1593[1]),
   fusionPredatorKills:sum(rows,c=>
    c.fusionPredatorKillsBySeat1593[0]+c.fusionPredatorKillsBySeat1593[1])},
  opening:{afterTurn2:openingAt(2),afterTurn4:openingAt(4),afterTurn6:openingAt(6),
   firstRemovalByTurn2:sum(rows,c=>c.firstOpponentRemoval1585?.turn===2?1:0)},
  protection:{
    eligible:sum(rows,c=>c.protectedOpeningCard1593),
    fusionEligible:sum(rows,c=>c.protectedOpeningCardFusion1593),
    hits:sum(rows,c=>c.openingProtectionHits1593),
    preventedDeaths:sum(rows,c=>c.openingPreventedKills1593),
    savedFusion:sum(rows,c=>c.openingSavedFusion1593),
    savedNormal:sum(rows,c=>c.openingSavedNormal1593),
    duelsWithSavedMonster:sum(rows,c=>c.openingPreventedKills1593>0?1:0),
    starterWinsAfterSave:rate(sum(rows,c=>c.openingPreventedKills1593>0&&!c.timeout&&win(c)===c.starter?1:0),
      rows.filter(c=>c.openingPreventedKills1593>0&&!c.timeout).length)},
  averageTurns:rate(sum(rows,c=>c.turn),n),
  attackInGlobalTurn2:sum(rows,c=>c.openingActionByTurn?.[2]?.types?.attack||0)};
}
const report={schema:'arcane-v1593-first-monster-protection-audit',
 status:'completed',totalDuels:records,independentDuels:17280,
 starterPairs,labelChecks,matchedMechanismPairs,shards,modes,replicates,
 controls:{onlyOpeningShieldChangedInLiveGame:true,samePolicyBothSeats:true,
 noAutomaticPromotion:true,secondDrawerExtraCard:0,startingHands:[5,5],
 unchangedSwarm:true,unchangedArmorPierce:true,unalteredPredatorDEF:true,
 initialShieldRemovedInLiveGame:true,
 allPredatorStatsUnchanged:true,
 protectionMechanism:'starting player first monster, protection only versus attacks in turn 2',
 ablations:{baseline:'no monster protection',
  once:'first strike against opening monster prevents its destruction, including Fusion',
  turn2:'opening monster cannot be destroyed by attacks in turn two, including Fusion',
  normalOnly:'entire turn-two protection, first normal monster only',
  onceNormal:'first strike protection, first normal monster only'},
 holdoutSelectionUsed:false},
 byMatchStage:{},matchedEffects:effects,diagnosis:{},
 caveats:[
  'Fixed-policy real combat simulator with independently seeded replicate decks, not neural-network training.',
  'Mirror candidate-seat labels are duplicate markers; 576 independent duels per mirror condition.',
  'Causal comparisons use matched seeds and identical opening cards, but interventions can alter all later AI decisions.',
  'All modes preserve the second-player attack opportunity, its LP damage and attack fatigue.',
  'The automatic 200-point starter shield has been removed from the production development branch for both seats.',
  'Protection restores a destroyed monster to its original field slot, removes its graveyard record, and preserves at least 1 DEF if exhausted.',
  'Fusion counters read successful real engine fusion action deltas at the underlying action wrapper; conventional recorded fusion decisions are cross-checked independently.',
  'The simulator does not prove an unchosen Fusion was legally available; missing counterplay is not proof of irrational AI.',
  'Solo PvE Rudelfuehrer exclusive boss perk not included in symmetric self-play.',
  'AI forecast copies also apply protection; this is fixed-policy self-play and not retraining.',
  'A restored card may have non-reversible secondary effects; do not promote without further engine-level implementation.',
  'Swarm +2% and ten percentage-point armor penetration kept unchanged.',
  'Holdout is displayed after diagnostic precommitment; no variant was selected or promoted to live play.'
 ]};
for(const match of matches)for(const stage of stages){
 const group=match+'-'+stage;report.byMatchStage[group]={};
 for(const mode of modes){
  const data=cohorts[[match,stage,mode].join('|')];
  const summary=summarize(data,match);
  summary.bySplit=Object.fromEntries(['train','validation','holdout'].map(split=>[
   split,summarize(data.filter(c=>c.split===split),match)]));
  report.byMatchStage[group][mode]=summary;
 }
}
for(const group of ['mirror-10','mirror-9','cross-10','cross-9']){
 const baseline=report.byMatchStage[group].baseline;
 report.diagnosis[group]=Object.fromEntries(modes.map(mode=>{
  const s=report.byMatchStage[group][mode];
  return [mode,{secondWin:s.secondWinRate,
   deltaSecondWin:s.secondWinRate-baseline.secondWinRate,
   firstAttackSecond:s.firstAttack.secondMoverFirstAttackRate,
   firstAttackerWin:s.firstAttack.firstAttackerWinRate,
   firstKill:s.firstAttack.firstAttackKillRate,
   turn2Attacks:s.attackInGlobalTurn2,
   realFusions:s.fusion.verifiedRealFusionActions,
   fusionReplies:s.fusion.fusionsWithPredatorPresent,
   guardHits:s.protection.hits,preventedDeaths:s.protection.preventedDeaths,
   savedFusion:s.protection.savedFusion,
   holdoutSecondWin:s.bySplit.holdout.secondWinRate}];
 }));
}
assert.ok(sum(Object.values(report.byMatchStage).flatMap(x=>Object.values(x)),
 s=>s.fusion.verifiedRealFusionActions)>0,'Fusion instrumentation did not capture real actions');
for(const group of ['mirror-10','cross-10'])
 for(const mode of modes)
  assert.ok(report.byMatchStage[group][mode].fusion.verifiedRealFusionActions>0,
   'No Predator-vs-Fusion actions captured '+group+' '+mode);
const output=path.join(shardRoot,'analysis');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1593_CAUSAL_AUDIT '+JSON.stringify({
 status:report.status,totalDuels:report.totalDuels,independentDuels:report.independentDuels,
 starterPairs,labelChecks,matchedMechanismPairs,diagnosis:report.diagnosis}));
