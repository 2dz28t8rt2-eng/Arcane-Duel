'use strict';
/* Deployment-oriented AI comparison under live post-v21.2 rules; no auto-promotion.
 * Preserve matched starts, frozen champion gates and unseen HOLDOUT.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const MODES=['baseline','optimized'],root='artifacts/v1830';
const data={schema:'arcane-v1830-live-rule-learning',liveCombat:true,guardianPool:.95,
 guardianAtkShare:.22,modeDefinitions:{
  baseline:'Latest frozen experimental defender research candidate on the live catalogue',
  optimized:'Legal same-turn combinations, real visible board threats and Soul-Bond protection'
 },modes:{},paired:{},championCandidate:null};
let duels=0;
for(const mode of MODES){
 const dir=root+'/'+mode,r=JSON.parse(fs.readFileSync(dir+'/report.json')),
  stage=JSON.parse(fs.readFileSync(dir+'/stage-8.json')),
  offense=JSON.parse(fs.readFileSync(dir+'/attack-telemetry.json'));
 assert.equal(r.status,'completed');assert.equal(r.totalDuels,23040);
 assert.equal(r.globalSelection.holdoutSeenBySelector,false);
 assert.equal(stage.stage,8);assert.equal(stage.allCases.length,2304);
 assert.equal(offense.totalGames,23040);assert.equal(offense.attackMetricsMissing,0);
 assert.ok(offense.sample.allAttacks>0);
 assert.ok(stage.allCases.every(x=>x.guardianV178Setup?.adjusted?.every(n=>n===0)),
  'No research-only stat nerfs may be applied on top of production 22/78');
 const next=JSON.parse(fs.readFileSync(dir+'/next-run-endgame-learner.json'));
 assert.equal(next.split,'train');assert.equal(next.validationUsed,false);
 assert.equal(next.holdoutUsed,false);assert.equal(next.sourceRun,0);
 const survivor=r.arms.find(x=>x.arm==='defender-v1830-survival-control');
 const counterplay=r.arms.find(x=>x.arm==='defender-v1830-counterplay');
 assert.ok(survivor&&counterplay);
 const summarize=x=>Object.fromEntries(['train','validation','holdout'].map(k=>
  [k,{wins:x.splits[k].wins,games:x.splits[k].games}]));
 const roleFocus={};
 for(const split of ['validation','holdout'])for(const opponent of ['predator','fusion'])
  for(const core of ['guardian-core','mixed-50','soul-core']){
   const filtered=stage.allCases.filter(x=>x.arm===survivor.arm&&x.split===split&&x.roleB===opponent&&x.focusMode===core);
   assert.equal(filtered.length,16);
   roleFocus[split+'/'+opponent+'/'+core]={wins:filtered.reduce((n,x)=>n+x.win,0),games:filtered.length};
  }
 const tactical=stage.allCases.reduce((z,x)=>{
  for(const name of ['v1830TacticalChecks','v1830LegalTrials','v1830TacticalOverrides','v1830ThreatRemoved','v1830FinisherOverrides','v1830ReplyTrials','v1830ReplyAwareOverrides','v1830SequenceTrials','v1830SequenceFinishers','v1830BoardEvaluations','v1830BondEvaluations'])
   z[name]+=Number(x[name]||0);
  if(Number(x.v1830TacticalOverrides||0)>0)z.gamesWithOverrides++;
  const traces=x.v1830DecisionTraces||[];
  assert.ok(Array.isArray(traces)&&traces.length<=6);
  for(const t of traces){
   assert.ok(t.chosen?.type==='attack'&&Number.isInteger(t.chosen.ai));
   assert.ok(['visible-finisher','two-attack-finisher','bond-preservation','safe-threat-removal','lp-pressure','board-control'].includes(t.reason));
   assert.ok(t.attackerUid!==null);
   assert.ok(typeof t.expectedImmediateWin==='boolean');
   assert.ok(typeof t.expectedVisibleReply==='boolean');
   assert.ok(Number.isFinite(t.expectedDamage)&&t.expectedDamage>=0);
   assert.equal(t.expectedVisibleReply,false);
   assert.ok(typeof t.expectedSequenceWin==='boolean');
   assert.ok(Number.isFinite(t.expectedBondChange));
   assert.ok(Number.isFinite(t.expectedBoardThreatRemoved));
   assert.ok(Number.isFinite(t.expectedReplyLP)&&t.expectedReplyLP>=0);
   assert.ok(Number.isFinite(t.expectedReplyLoss)&&t.expectedReplyLoss>=0);
   z.traceRecords++;
   z.reasonCounts[t.reason]=(z.reasonCounts[t.reason]||0)+1;
   const bySplit=z.tracesBySplit[x.split]||(z.tracesBySplit[x.split]={records:0,duels:0});
   bySplit.records++;
  }
  if(traces.length)z.tracesBySplit[x.split].duels++;

  return z;
 },{v1830TacticalChecks:0,v1830LegalTrials:0,v1830TacticalOverrides:0,
 v1830ThreatRemoved:0,v1830FinisherOverrides:0,v1830ReplyTrials:0,v1830ReplyAwareOverrides:0,v1830SequenceTrials:0,v1830SequenceFinishers:0,v1830BoardEvaluations:0,v1830BondEvaluations:0,gamesWithOverrides:0,traceRecords:0,reasonCounts:{},tracesBySplit:{}});
 assert.ok(tactical.traceRecords<=tactical.v1830TacticalOverrides);
 if(mode==='optimized')assert.equal(tactical.v1830TacticalOverrides>=tactical.traceRecords,true);
 if(mode==='baseline')assert.equal(tactical.v1830TacticalOverrides,0,
   'Frozen comparison must never use experimental attack overrides');
 data.modes[mode]={totalDuels:r.totalDuels,promoted:r.globalSelection.promoted,
  bestCandidate:r.globalSelection.arm,
  candidateGates:r.globalSelection.candidates,
  survival:summarize(survivor),counterplay:summarize(counterplay),
  roleFocus,tactical,attacks:offense.sample,trainOnlyCheckpoint:{games:next.games,nonzero:next.nonzero},
  nextModelReadyForValidationOnly:next.nonzero>0};
 duels+=r.totalDuels;
}
const all=Object.fromEntries(MODES.map(mode=>[mode,
 JSON.parse(fs.readFileSync(root+'/'+mode+'/stage-8.json')).allCases]));
const key=x=>[x.stage,x.pair,x.scenario,x.starter,x.seat,x.arm].join('|');
const previous=new Map(all.baseline.map(x=>[key(x),x]));assert.equal(previous.size,2304);
let changes=0,improved=0,worsened=0;const seen=new Set();
for(const x of all.optimized){const k=key(x),a=previous.get(k);
 assert.ok(a&&!seen.has(k),'Missing matched baseline or duplicated scenario');seen.add(k);
 for(const prop of ['seed','seedA','seedB','roleA','roleB','focusMode'])
  assert.deepEqual(x[prop],a[prop],'v17.9 unmatched split/seed/deck '+prop);
 if(x.win!==a.win){changes++;if(x.win>a.win)improved++;else worsened++;}
}
assert.equal(seen.size,2304);
data.paired={casesPerMode:2304,uniqueScenarioSeatKeys:new Set(all.baseline.map(x=>
 [x.stage,x.pair,x.scenario,x.starter,x.seat].join('|'))).size,
 winnerChanged:changes,optimizedImproved:improved,optimizedWorsened:worsened,
 tacticalChecksOptimized:data.modes.optimized.tactical.v1830TacticalChecks,
 legalClonedAttacksOptimized:data.modes.optimized.tactical.v1830LegalTrials,
 realOverridesOptimized:data.modes.optimized.tactical.v1830TacticalOverrides,
 finishersOptimized:data.modes.optimized.tactical.v1830FinisherOverrides,
 replyTrialsOptimized:data.modes.optimized.tactical.v1830ReplyTrials,
 replyAwareOverridesOptimized:data.modes.optimized.tactical.v1830ReplyAwareOverrides,
 reasonCountsOptimized:data.modes.optimized.tactical.reasonCounts,
 traceRecordsOptimized:data.modes.optimized.tactical.traceRecords,
 traceSplitsOptimized:data.modes.optimized.tactical.tracesBySplit,
 gamesWithOverridesOptimized:data.modes.optimized.tactical.gamesWithOverrides};
assert.equal(duels,46080);
data.championCandidate=data.modes.optimized.bestCandidate;
data.promotedAutomatically=false;data.integrationGate='manual approval only after complete holdout/H2H and engine parity';
fs.writeFileSync(root+'/ai-comparison.json',JSON.stringify(data,null,2)+'\n');
console.log('ARCANE_V1830_DEPLOYMENT_RESEARCH_VERIFIED '+JSON.stringify({
 duels,modes:MODES,paired:data.paired,optimizedPromotionDiagnostic:data.modes.optimized.promoted,
 optimizedNewTrainContexts:data.modes.optimized.trainOnlyCheckpoint.nonzero}));
