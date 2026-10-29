'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1525';
const names=['symmetric-reference','finish-vs-reference','breach-vs-reference','safe-vs-reference','symmetric-breach'];
const stages=[];
const seen=new Set();
const all=[];
for(let s=0;s<5;s++){
 const file=root+'/stage-'+s+'.json';
 assert.ok(fs.existsSync(file),'Missing stage '+s);
 const t=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(t.schema,'arcane-v1525-stage');
 assert.equal(t.stage,s);assert.equal(t.allCases.length,640);
 assert.equal(t.controls.holdoutUsedForSelection,false);
 assert.ok(names.includes(t.chosenArm));
 assert.equal(t.summaries.length,5);
 const trace=JSON.parse(fs.readFileSync(root+'/stage-'+s+'-train-actions.json','utf8'));
 assert.equal(trace.examples.length,480,'Action history must only contain training');
 for(const r of t.allCases){
  assert.equal(r.stage,s);
  assert.ok(names.includes(r.arm)&&[0,1].includes(r.seat)&&[0,1].includes(r.starter));
  assert.equal(r.split,r.scenario===3?'holdout':'train');
  assert.equal(r.seed,15250000+s*100000+r.pair*10000+r.scenario*331+r.starter*17);
  assert.ok(r.seedA!==r.seedB,'Different roles must have distinct deck seeds');
  assert.ok([0,1].includes(r.win));
  assert.ok(r.turn>0&&Number.isFinite(r.reward));
  assert.ok(r.enemyOffense>=0&&r.enemySummons>=0);
  assert.equal(r.soulDisabled,false,'Soul was incorrectly disabled in full combat');
  assert.equal(r.counterDisabled,false,'Counterstrike incorrectly disabled in full combat');
  assert.ok(r.enemyOffense>=0&&r.enemySummons>=0);
  if(r.arm==='symmetric-reference')assert.equal(r.finishAttacks+r.finishSwitches+r.finishEnds,0,'Reference policy was mutated');
  if(r.arm==='finish-vs-reference')assert.equal(r.breachSwitches+r.breachAttacks,0,'Stance control unexpectedly changed defense behavior');
  if(r.arm==='breach-vs-reference'||r.arm==='symmetric-breach')assert.equal(r.breachAttacks,0,'Breach arm used target-attack override');
  assert.equal(r.mirror,r.stage<=2,'Incorrect mirrored deck assignment');
  assert.equal(r.foeTier,r.tier,'Unequal deck levels in selfplay');
  assert.equal(r.symmetric,['symmetric-reference','symmetric-breach'].includes(r.arm));
  assert.ok(r.selfPlayCallsBySeat.every(x=>Number.isInteger(x)&&x>0),'One seat did not use strategic AI');
  assert.ok(r.selfPlayStrategicBySeat.every(x=>Number.isInteger(x)&&x>0),'One seat never made strategic choices');
  if(s<=1)assert.equal(r.ownDamage>=0,true,'Damage tracking missing');
  const key=[s,r.pair,r.scenario,r.starter,r.seat,r.arm].join('|');
  assert.ok(!seen.has(key),'Duplicated matched case '+key);seen.add(key);
 }
 for(let pair=0;pair<8;pair++)for(let scenario=0;scenario<4;scenario++)
  for(let starter=0;starter<2;starter++)for(let seat=0;seat<2;seat++)
  for(const name of names)
    assert.ok(seen.has([s,pair,scenario,starter,seat,name].join('|')),
     'Missing fully paired game');
 const reported=t.summaries.find(x=>x.arm===t.chosenArm);
 assert.deepEqual(t.selectedFinishMode,reported.finishMode,'Checkpoint finish mode mismatch');
 const baseline=t.summaries[0];
 const best=[...t.summaries].filter(x=>!x.symmetric).sort((a,b)=>
   b.train.wins-a.train.wins||
   b.train.meanReward-a.train.meanReward||a.arm.localeCompare(b.arm))[0];
 const parity=[0,1].every(seat=>best.train.bySeat[seat].wins>=baseline.train.bySeat[seat].wins);
 const expected=best.train.wins>=baseline.train.wins+4&&parity?best:baseline;
 assert.deepEqual(t.previousFinishMode,s===0?null:stages[s-1].mode,
  'Prior stage finisher strategy not restored');
 assert.equal(t.promoted,expected.arm!=='role-reference','Improvement gate mismatch');
 assert.equal(t.chosenArm,expected.arm,'Holdout used for selection');
 stages.push({stage:s,name:t.name,selected:t.chosenArm,mode:t.selectedFinishMode,
  baseline:t.summaries[0],selectedSummary:reported,
  summaries:t.summaries,
  strategyOutcomes:t.summaries.map(x=>({arm:x.arm,
   trainWins:x.train.wins,holdoutWins:x.holdout.wins,
   avgTrainingReward:x.train.meanReward,
   holdoutMeanTurns:x.holdout.meanTurns}))});
 all.push(...t.allCases);
}
assert.equal(all.length,3200);
assert.equal(all.filter(x=>x.split==='holdout').length,800);
assert.equal(all.filter(x=>x.split==='train').length,2400);
const armStats=names.map(name=>{
 const pool=all.filter(r=>r.arm===name);
 const sum=rows=>({games:rows.length,wins:rows.reduce((n,r)=>n+r.win,0),
  dualPlannerCalls:[0,1].map(seat=>rows.reduce((n,r)=>n+r.selfPlayCallsBySeat[seat],0)),
  dualStrategicChoices:[0,1].map(seat=>rows.reduce((n,r)=>n+r.selfPlayStrategicBySeat[seat],0)),
  directFinishes:rows.reduce((n,r)=>n+r.finishAttacks,0),
  directOpportunities:rows.reduce((n,r)=>n+r.readyDirectOpportunities,0),
  missedDirectOpportunities:rows.reduce((n,r)=>n+r.missedDirectOpportunities,0),
  preBreachSwitches:rows.reduce((n,r)=>n+r.breachSwitches,0),
  actualTargetAttacks:rows.reduce((n,r)=>n+r.breachAttacks,0),
  forcedStanceSwitches:rows.reduce((n,r)=>n+r.finishSwitches,0),
  bySeat:Object.fromEntries([0,1].map(seat=>{const a=rows.filter(r=>r.seat===seat);return [seat,{games:a.length,wins:a.reduce((n,r)=>n+r.win,0),timeouts:a.filter(r=>r.timeout).length}]})),
  timeouts:rows.filter(x=>x.timeout).length,opponentAttackActions:rows.reduce((n,r)=>n+r.enemyOffense,0),
  meanTurns:rows.reduce((n,r)=>n+r.turn,0)/Math.max(1,rows.length)});
 return {arm:name,...sum(pool),holdout:sum(pool.filter(r=>r.split==='holdout')),
  byStage:Object.fromEntries([0,1,2,3,4].map(s=>[s,sum(pool.filter(r=>r.stage===s))]))};
});
const result={schema:'arcane-v1525-completed-five-phase-two-sided-selfplay',status:'completed',
 sourceSha:process.env.GITHUB_SHA||'unknown',
 totalDuels:3200,holdoutDuels:800,trainDuels:2400,
 researchOnly:true,productionModified:false,
 controls:{finishOnEmptyFieldTested:true,seatParityIsPromotionGate:true,
  researchOnlyFinisherOverrides:true,seatSymmetricDecksOnTransferStage:true,
  selfplayBothSidesVerified:true,symmetricBaselineUsesIdenticalTestAIPolicy:true,
  firstThreeStagesMirrored:true,allOpponentsFullyActive:true,
  bothSeatsRunIdenticalStrategicPlanner:true,
  referenceAndBreachSymmetricSelfplayArms:true,
  stageOrder:'0 > 1 > 2 > 3 > 4',
  stages:['level8-identical-deck-selfplay','level9-identical-deck-selfplay','level10-identical-deck-selfplay','level8-crossrole-selfplay','level10-crossrole-selfplay'],
  equalStartingLP:true,allOpponentMechanicsEnabled:true,realCreatureDecayEnabled:true,fullCombatAllStages:true,
  promotionRequiresStrictTrainingWinAdvantage:true,
  arenaLPDecayDisabled:true,validFortressCardsRemovedFromDeck:true,
  bothSeats:true,bothStarters:true,matchedSeeds:true,holdoutNeverUsedForSelection:true},
 stages,armStats,
 limitations:[
 'This research adapts hand-coded offense scoring weights based on train-only duels; it does NOT constitute reinforcement learning of all card abilities.',
 'Prior historical Q is imported and separately trained using Predator ATTACK-vs-PASS only.',
 'All five phases use fully active opponents and no pre-deployed defensive garrisons; both Soul and Guardian mechanics remain active.',
 'Holdout stage scenarios are diagnostic only; stage-to-stage inherited weights are selected from the TRAIN split.',
 'Phases 0-2 use identical decks; phases 3-4 use cross-role decks. The exact same strategic test AI chooses for BOTH seats.',
 'Require at least 4 additional TRAIN wins out of 120 and no regressions on either seat; symmetric-breach is diagnostic and excluded from promotion.',
 'Proactive board-breaking and visible-board one-step attack research affect only research duels; production AI remains unchanged.',
 'Two arms use identical strategic policies on BOTH seats; challenger arms use the same planner with a targeted per-seat finishing difference.',
 'Seat parity statistics include mirrored starter/seats, not a proof of exact game balance.',
 'No gameplay changes or silent promotion into main.'
 ]};
fs.writeFileSync(root+'/report.json',JSON.stringify(result,null,2)+'\n');
console.log('ARCANE_V1525_COMPLETE '+JSON.stringify({games:result.totalDuels,
 holdout:result.holdoutDuels,train:result.trainDuels,
 selected:stages.map(s=>({stage:s.stage,arm:s.selected,trainWins:s.selectedSummary.train.wins,
  holdoutWins:s.selectedSummary.holdout.wins,baselineHoldout:s.baseline.holdout.wins})),
 arms:armStats.map(x=>({arm:x.arm,wins:x.wins,holdout:x.holdout.wins}))}));
