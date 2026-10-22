'use strict';
// v14.8.6 OOM-safe independent-process aggregator. No duel is replayed here.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const arm=process.env.ARCANE_V1486_ARM;
assert.ok(['baseline','neutral','symmetric'].includes(arm),'Bad ablation arm');
const dir='artifacts/v1486/'+arm;
const expectedTrain=Number(process.env.ARCANE_V1486_TRAIN||84);
const expectedHoldout=Number(process.env.ARCANE_V1486_HOLDOUT||84);
const files=[0,1,2,3].map(i=>{
 const report=JSON.parse(fs.readFileSync(dir+'/shards/report-'+i+'.json','utf8'));
 const examples=JSON.parse(fs.readFileSync(dir+'/shards/opening-'+i+'.json','utf8'));
 assert.equal(report.schema,'arcane-v1486-controlled-fusion-poker-ablation');
 assert.equal(report.shardIndex,i,'Shard identity mismatch');
 assert.equal(report.ablationArm,arm,'Ablation arm mismatch');
 assert.equal(examples.arm,arm,'Sample arm mismatch');
 assert.equal(report.shardCount,4,'Unexpected shard scheme');
 assert.equal(examples.shardIndex,i,'Example and report shard mismatch');
 assert.equal(report.productionIntegrated,false);
 assert.equal(report.promotionEligible,false);
 assert.equal(report.fullTrainScenarios,expectedTrain);
 assert.equal(report.fullHoldoutScenarios,expectedHoldout);
 assert.ok(report.neutralizedAssertions.bothHandsAndDeckOrdersEqual);
 assert.ok(report.neutralizedAssertions.bothFusionPoolsEqual);
 assert.ok(report.neutralizedAssertions.bothStartingShieldsEqual);
 for(const example of examples.examples) {
  for(const c of Object.values(example.comparisons)){
   assert.equal(c.handIds.length,2);
   assert.equal(JSON.stringify(c.handIds[0]),JSON.stringify(c.handIds[1]),
     'Heldout starting hand mismatch');
   assert.equal(c.drawOrderMatches,true,'Heldout deck draw order mismatch');
   assert.equal(c.fusionPoolsMatch,true,'Heldout fusion deck mismatch');
   assert.equal(JSON.stringify(c.openingShield),'[0,0]','Heldout shields not equal');
  }
 }
 assert.ok(report.neutralizedAssertions.allUpgradesZero);
 assert.ok(report.neutralizedAssertions.allCardAbilitiesAndRolesRemoved);
 assert.ok(report.neutralizedAssertions.allCardAbilitiesRestoredOutsideTestMode);
 assert.ok(report.neutralizedAssertions.noPersistedGameChanges);
 assert.ok(report.holdout.scenarios>0);
 return {report,examples};
});
assert.equal(new Set(files.map(x=>x.report.sourceCommit)).size,1,
 'Shards must be generated from identical git revision');
const counts={};
const count=(obj,k,n)=>{obj[k]=(obj[k]||0)+n};
const addValues=(to,from)=>{
 for(const [key,value] of Object.entries(from)){
  if(typeof value==='number')count(to,key,value);
  else if(Array.isArray(value)) {
   if(!to[key])to[key]=Array(value.length).fill(0);
   assert.equal(to[key].length,value.length);
   for(let i=0;i<value.length;i++)to[key][i]+=value[i];
  } else if(value && typeof value==='object')addValues(to[key]||(to[key]={}),value);
  else if(!(key in to))to[key]=value;
  else assert.equal(to[key],value,'Contradictory shard field '+key);
 }
 return to;
};
const first=files[0].report;
const train={}, conditions={}, openingDiagnostics={},
 mirror={}, openingEffects={};
let holdoutCount=0,neutralExamples=[];
const allExamples=[],pilotCases=[],reinstatement=[];
for(const {report:r,examples:e} of files){
 holdoutCount+=r.holdout.scenarios;
 for(const [k,stats] of Object.entries(r.training)){
  addValues(train[k]||(train[k]={}),stats);
 }
 for(const [k,stats] of Object.entries(r.holdout.conditions)){
  addValues(conditions[k]||(conditions[k]={}),stats);
 }
 for(const [k,stats] of Object.entries(r.pilot.openingDiagnostics)){
  addValues(openingDiagnostics[k]||(openingDiagnostics[k]={}),stats);
 }
 addValues(mirror,r.holdout.mirrorReversals);
 addValues(openingEffects,r.holdout.openingEffects);
 allExamples.push(...e.examples);
 pilotCases.push(...e.pilotCases);
 reinstatement.push(...e.disabledSkillControls);
}
assert.equal(holdoutCount,expectedHoldout,'Independent heldout scenario count mismatch');
for(const [k,row] of Object.entries(conditions))
 assert.equal(row.scenarios,expectedHoldout,'Each factorial condition must cover every heldout scenario '+k);
assert.equal(Object.keys(conditions).length,4,'Expected four start conditions');
assert.equal(mirror.pairs,expectedHoldout*4,'Each condition must contain a mirror pair');
assert.equal(mirror.sameSeatWinner+mirror.shiftedSeatWinner,mirror.pairs);
assert.equal(mirror.candidateBoth+mirror.oldBoth+mirror.sameSeatWinner,mirror.pairs);
assert.equal(openingEffects.scenarios,expectedHoldout);
assert.equal(allExamples.length,Math.min(18,expectedHoldout)*4,
 'Every shard must include up to 18 independent replay examples');
assert.equal(new Set(allExamples.map(x=>x.seed)).size,allExamples.length,
 'Duplicate heldout scenario in independent shards');
assert.ok(reinstatement.every(x=>x.neutralSkillMetadata===0&&x.originalSkillMetadata>0));
assert.ok(pilotCases.every(x=>x.openingStrictEqual),'Pilot opening identity failed');
for(const [k,row] of Object.entries(train))assert.ok(row.duels>0,'Missing strategy '+k);
const final={
 ...first,
 ablationArm:arm,
 sourceCommit:first.sourceCommit,
 shardIndex:null,
 status:'completed-all-shards-with-verified-identical-starts',
 aggregation:{shardCount:4,independentNodeProcesses:4,
  reportSources:files.map((_,i)=>'shards/report-'+i+'.json'),
  expectedTrain,expectedHoldout,
  maxPerShard:Math.ceil(expectedHoldout/4),
  reason:'Memory-safe four-process controlled full dataset'},
 pilot:{samples:pilotCases.length,neutralVerification:reinstatement,
  openingDiagnostics},
 training:train,
 holdout:{...first.holdout,scenarios:holdoutCount,
  conditions,mirrorReversals:mirror,
  openingEffects,
  firstPlayerBreakdown:{
   starter0Base:conditions.starter0_base.baselineWins,
   starter1Base:conditions.starter1_base.baselineWins,
   starter0SwappedHands:conditions.starter0_swapped_hands.baselineWins,
   starter1SwappedHands:conditions.starter1_swapped_hands.baselineWins
  }},
 productionIntegrated:false,promotionEligible:false
};
fs.writeFileSync(dir+'/report.json',JSON.stringify(final,null,2)+'\n');
fs.writeFileSync(dir+'/opening-examples.json',JSON.stringify({
 schema:'arcane-v1486-identical-start-ablation-replays',
 aggregation:{independentShards:4,heldoutScenarios:holdoutCount},
 examples:allExamples,pilotCases,disabledSkillControls:reinstatement
},null,2)+'\n');
console.log('ARCANE_V1486_AGGREGATE '+JSON.stringify({
 arm,
 status:'completed-all-shards',
 trainScenarios:expectedTrain,holdoutScenarios:holdoutCount,
 neutralModeVerified:reinstatement.every(x=>x.neutralSkillMetadata===0),
 allPilotOpeningsEqual:pilotCases.every(x=>x.openingStrictEqual),
 sampledHoldoutHandsEqual:allExamples.every(x=>Object.values(x.comparisons).every(c=>
 JSON.stringify(c.handIds[0])===JSON.stringify(c.handIds[1])&&c.drawOrderMatches&&c.fusionPoolsMatch)),
 priorSkillsRecoverable:reinstatement.every(x=>x.originalSkillMetadata>0),
 modes:Object.fromEntries(Object.entries(conditions).map(([k,x])=>[k,{
  matches:x.scenarios*3,baselineSeat0Wins:x.baselineWins[0],
  baselineSeat1Wins:x.baselineWins[1],
  candidateWins:x.candidateWins,
  sameSeatWinner:x.sameSeatWinner,
  changedActions:x.tacticalChanged}])),
 openingEffects,mirrors:mirror,productionIntegrated:false
}));
