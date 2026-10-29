'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='artifacts/v1486';
const arms=['baseline','neutral','symmetric'];
const load=x=>JSON.parse(fs.readFileSync(x,'utf8'));
const results=Object.fromEntries(arms.map(a=>[a,{report:load(root+'/'+a+'/report.json'),
 examples:load(root+'/'+a+'/opening-examples.json')}]));
const conditions=Object.keys(results.baseline.report.holdout.conditions);
assert.equal(conditions.length,4);
const expected=Number(process.env.ARCANE_V1486_HOLDOUT||84);
const summary={},caseMap={};
for(const arm of arms){
 const {report:r,examples:e}=results[arm];
 assert.equal(r.ablationArm,arm);assert.equal(r.productionIntegrated,false);
 assert.equal(r.holdout.scenarios,expected);
 assert.equal(e.examples.length,Math.min(18,expected)*4);
 const a=r.holdout.conditions;
 assert.deepEqual(Object.keys(a).sort(),conditions.slice().sort());
 const baselineSeat0=conditions.reduce((s,k)=>s+a[k].baselineWins[0],0);
 const baselineSeat1=conditions.reduce((s,k)=>s+a[k].baselineWins[1],0);
 const candidateWins=conditions.reduce((s,k)=>s+a[k].candidateWins,0);
 const oldWins=conditions.reduce((s,k)=>s+a[k].oldWins,0);
 const mirrorPairs=r.holdout.mirrorReversals.pairs;
 assert.equal(baselineSeat0+baselineSeat1,expected*4);
 assert.equal(candidateWins+oldWins,expected*8);
 assert.equal(mirrorPairs,expected*4);
 summary[arm]={baselineSeat0,baselineSeat1,baselineSeat0Pct:+(baselineSeat0/(expected*4)*100).toFixed(2),
  candidateWins,oldWins,candidatePct:+(candidateWins/(expected*8)*100).toFixed(2),
  starter0Original:a.starter0_base.baselineWins,
  starter1Original:a.starter1_base.baselineWins,
  starter0TemplateB:a.starter0_swapped_hands.baselineWins,
  starter1TemplateB:a.starter1_swapped_hands.baselineWins,
  sameSeatWinner:r.holdout.mirrorReversals.sameSeatWinner,
  tacticalCompared:conditions.reduce((s,k)=>s+a[k].tacticalCompared,0),
  tacticalChanged:conditions.reduce((s,k)=>s+a[k].tacticalChanged,0)};
 const detail={};
 for(const scene of e.examples){
  assert.ok(!detail[scene.seed],'Duplicate seed in arm '+arm);
  detail[scene.seed]=scene;
 }
 caseMap[arm]=detail;
}
for(const arm of arms.slice(1)){
 assert.deepEqual(Object.keys(caseMap.baseline).sort(),Object.keys(caseMap[arm]).sort(),
 'Ablation arms must replay same seed and scenario set');
 for(const seed of Object.keys(caseMap.baseline)){
  const first=caseMap.baseline[seed],second=caseMap[arm][seed];
  assert.equal(first.deckFingerprint,second.deckFingerprint,'Deck changed between treatments');
  for(const condition of conditions){
   const one=first.comparisons[condition],two=second.comparisons[condition];
   assert.deepEqual(one.handIds,two.handIds,'Different opening hand in paired arm '+arm);
   assert.deepEqual(one.openingShield,two.openingShield,'Different opening shields');
   assert.equal(one.drawOrderMatches,true);
   assert.equal(two.drawOrderMatches,true);
   assert.equal(two.fusionPoolsMatch,true);
  }
 }
}
const paired={};
for(const arm of arms.slice(1)){
 let changedAgainstBaseline=0,totalPairs=0,seat0To1=0,seat1To0=0;
 for(const seed of Object.keys(caseMap.baseline))
  for(const condition of conditions){
   const a=caseMap.baseline[seed].comparisons[condition].baselineSeat,
    b=caseMap[arm][seed].comparisons[condition].baselineSeat;
   totalPairs++;if(a!==b){changedAgainstBaseline++;if(a===0)seat0To1++;else seat1To0++;}
  }
 paired[arm]={totalMatchedBaselineSelftests:totalPairs,changedWinnerSeat:changedAgainstBaseline,
  seat0To1,seat1To0};
}
const report={
 schema:'arcane-v1486-controlled-a-b-c-full-mirror-comparison',
 sourceCommit:results.baseline.report.sourceCommit,
 status:'completed',sourceIsolated:true,
 controls:{identicalStartingHandsAndFullDeckOrder:true,sameScenarioSeedsAcrossArms:true,
  sameFirstPlayerAcrossArms:true,constantAiPoliciesAndWeights:true,
  skillsAndPerksDisabledInEachArm:true,
  player0NpcFusionStrengthOnlyVariedThroughIsolatedRules:true},
 scenarios:expected,conditions:conditions.length,
 gamesPerArm:expected*4*3,totalDuelGames:expected*4*3*arms.length,
 arms:summary,matchedSampleAblations:paired,
 previousRun:{schema:'arcane-v1484-identical-opening-resource-controlled-training',
  independentBaselineSeat0Wins:283,independentSelfTests:336,
  caveat:'Same scenarios are reused in this new controlled A/B/C experiment, unlike unrelated future random pools.'},
 conclusions:[
  'The training-candidate profile is held constant and is not promoted automatically.',
  'Ablation B replaces removed role tags with a non-fallback sentinel, eliminating synthetic allrounder resonance.',
  'Ablation C also makes NPC tuned fusion quality use the same player-side scoring function and bonus-roll rules.',
  'Uncorrected remaining PvE-specific seat rules may persist; a non-50% seat split does not invalidate the experimental isolation.',
  'All game mechanic modifications are temporary in-memory changes inside offline test VMs.'
 ],
 productionIntegrated:false,promotionEligible:false};
assert.equal(new Set(arms.map(a=>results[a].report.sourceCommit)).size,1,'Mixed commits in A/B/C');
fs.writeFileSync(root+'/comparison.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1486_THREE_ARM_COMPARISON '+JSON.stringify({
  sampleCount:expected,totalDuels:report.totalDuelGames,arms:summary,
  matchedSampleAblations:paired,productionIntegrated:false
}));
