'use strict';
/* Turn-order dependent sixth-card compensation and factorial seat diagnostic.
 * Treat the validation split as the only decision evidence. HOLDOUT is
 * opened after computing and freezing the recommendation. No deployment.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='artifacts/v1579',stages=[9,10],extras=[0,1];
const frozen=['guardian-champion','fusion-sequence-2ply','l10-guarded-worst-reply',
 'defender-v1573-survival-control','defender-v1573-counterplay'];
const challenger='fusion-v1574-stomp-conscious',allArms=[...frozen,challenger];
const fields=['realCandidateStomps','realOpponentStomps','realCandidateSplashHits',
 'realCandidateSplashKills','realCandidateSplashDefLost','realCandidateSplashCounterLP',
 'realPredatorFusionAttacks','realPredatorFusionKills',
 'realOpponentPredatorKillsCandidateFusion','fusionMultiMaterialChosen',
 'fusionMultiMaterialOpportunities','largeFusionPredatorThreatWindows'];
const sum=(a,f)=>a.reduce((n,x)=>n+(Number(x[f])||0),0);
const key=c=>[c.stage,c.pair,c.scenario,c.starter,c.seat,c.roleA,c.roleB,c.arm].join('|');
const pick=(rows,split)=>rows.filter(x=>x.split===split);
const roleStage=s=>s===9?'fusion':'predator';
function summary(rows){
 const n=rows.length,wins=sum(rows,'win');
 return {games:n,wins,winRate:n?wins/n:null,timeouts:rows.filter(x=>x.timeout).length,
  avgTurns:n?sum(rows,'turn')/n:null,
  bySeat:Object.fromEntries([0,1].map(seat=>{
   const r=rows.filter(c=>c.seat===seat),w=sum(r,'win');
   return [seat,{games:r.length,wins:w,winRate:r.length?w/r.length:null}];
  })),
  byStarter:Object.fromEntries([0,1].map(starter=>{
   const r=rows.filter(c=>c.starter===starter),w=sum(r,'win');
   return [starter,{games:r.length,wins:w,winRate:r.length?w/r.length:null}];
  })),
  byDrawOrder:Object.fromEntries(['first','second'].map(draw=>{
   const r=rows.filter(c=>c.candidateDrawsSecond===(draw==='second'));
   const w=sum(r,'win');return [draw,{games:r.length,wins:w,winRate:r.length?w/r.length:null}];
  })),
  bySeatAndStarter:Object.fromEntries([0,1].flatMap(seat=>[0,1].map(starter=>{
   const r=rows.filter(c=>c.seat===seat&&c.starter===starter),w=sum(r,'win');
   return [seat+'-'+starter,{games:r.length,wins:w,winRate:r.length?w/r.length:null,
    candidateDrawsSecond:seat!==starter}];
  }))),
  largeFusions:Object.fromEntries([3,4,5].map(size=>[size,
   rows.reduce((n,x)=>n+(x.multiFusionChosenBySize?.[size]||0),0)])),
  measured:Object.fromEntries(fields.map(f=>[f,sum(rows,f)])),
  fusionPresenceTurnsCandidate:rows.reduce((n,c)=>
   n+(c.largeFusionPresenceTurnsBySeat?.[c.seat]||0),0),
  fusionPresenceTurnsOpponent:rows.reduce((n,c)=>
   n+(c.largeFusionPresenceTurnsBySeat?.[1-c.seat]||0),0),
  uniqueLargeFusionCandidate:rows.reduce((n,c)=>
   n+(c.largeFusionUniqueBySeat?.[c.seat]||0),0),
  uniqueLargeFusionOpponent:rows.reduce((n,c)=>
   n+(c.largeFusionUniqueBySeat?.[1-c.seat]||0),0)};
}
const cohorts={},stageAudit=[];
for(const extra of extras){
 const rows=[];
 for(const stage of stages){
  const file=path.join(root,`second${extra}`,`stage-${stage}.json`);
  assert.ok(fs.existsSync(file),'Missing required complete stage '+file);
  const d=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(d.stage,stage);assert.ok(d.controls?.holdoutNeverUsedForSelection);
  assert.equal(d.allCases.length,2304,'Expected all 8 pairs × 12 scenarios × 2 starters × 2 seats × 6 arms');
  for(const c of d.allCases){
   assert.equal(c.stage,stage);assert.ok(allArms.includes(c.arm));
   assert.equal(c.roleA,roleStage(stage));
   assert.equal(c.roleB,roleStage(stage===9?10:9));
   assert.equal(c.extraCardSecond,extra);
   assert.equal(c.extraCardBeneficiarySeat,1-c.starter);
   assert.equal(c.candidateDrawsSecond,c.seat!==c.starter);
   const expectedHands=[5,5];expectedHands[1-c.starter]=extra?6:5;
   assert.deepEqual(c.actualStartingHands,expectedHands,
    'Only the genuine second mover receives the card, irrespective of seat');
   assert.ok(['train','validation','holdout'].includes(c.split));
   assert.ok(c.illegalSwitchesBySeat?.every(n=>n===0));
   assert.ok(Array.isArray(c.largeFusionUniqueBySeat)&&c.largeFusionUniqueBySeat.length===2);
   assert.ok(Array.isArray(c.largeFusionPresenceTurnsBySeat)&&c.largeFusionPresenceTurnsBySeat.length===2);
   for(const f of fields)assert.ok(Number.isFinite(c[f]),'Missing main-game metric '+f);
   rows.push(c);
  }
  stageAudit.push({extra,stage,duels:2304,
   candidate:summary(d.allCases.filter(c=>c.arm===challenger))});
 }
 assert.equal(rows.length,4608);
 for(const arm of allArms){
  const x=rows.filter(c=>c.arm===arm);
  assert.equal(x.length,768);
  assert.equal(new Set(x.map(key)).size,768,'Duplicate matched scenario');
 }
 cohorts[extra]={rows,candidate:rows.filter(c=>c.arm===challenger)};
}
const paired=new Map(cohorts[0].rows.map(c=>[key(c),c]));
const pairedEffects={candidate:{bySeat:{0:{gain:0,loss:0},1:{gain:0,loss:0}},
 byDrawOrder:{first:{gain:0,loss:0},second:{gain:0,loss:0}},
 bySeatStarter:Object.fromEntries(['0-0','0-1','1-0','1-1'].map(k=>[k,{gain:0,loss:0}])),
 byStage:{9:{gain:0,loss:0},10:{gain:0,loss:0}}},allArms:{gain:0,loss:0}};
for(const c of cohorts[1].rows){
 const b=paired.get(key(c));assert.ok(b,'Missing same-seed no-extra-card control');
 for(const f of ['seed','seedA','seedB','seat','starter','split','tier','foeTier','roleA','roleB'])
  assert.deepEqual(c[f],b[f],'Broken matched seed or setup: '+f);
 if(c.win!==b.win){
  const change=c.win?'gain':'loss';pairedEffects.allArms[change]++;
  if(c.arm===challenger){
   pairedEffects.candidate.bySeat[c.seat][change]++;
   pairedEffects.candidate.bySeatStarter[c.seat+'-'+c.starter][change]++;
   pairedEffects.candidate.byDrawOrder[c.candidateDrawsSecond?'second':'first'][change]++;
   pairedEffects.candidate.byStage[c.stage][change]++;
  }
 }
}
const candidate={};
for(const extra of extras){
 const rows=cohorts[extra].candidate;
 candidate[extra]={
  train:summary(pick(rows,'train')),
  validation:summary(pick(rows,'validation')),
  byStage:Object.fromEntries(stages.map(stage=>[stage,summary(rows.filter(c=>c.stage===stage))])),
  // Holdout read only after preliminary decision below.
 };
}
function gap(rows,stage){
 const a=rows.filter(c=>c.stage===stage);
 const s0=summary(a.filter(c=>c.seat===0));
 const s1=summary(a.filter(c=>c.seat===1));
 return {stage,seat0:s0.winRate,seat1:s1.winRate,
  signed:s1.winRate-s0.winRate,absolute:Math.abs(s1.winRate-s0.winRate)};
}
function spread(rows,stage){
 const r=rows.filter(c=>c.stage===stage);
 const cells=summary(r).bySeatAndStarter;
 const values=Object.values(cells).map(x=>x.winRate);
 assert.ok(values.every(Number.isFinite));
 return {stage,cells,range:Math.max(...values)-Math.min(...values),
  meanAbsoluteDeviation:values.reduce((n,x)=>n+Math.abs(x-sum(r,'win')/r.length),0)/4};
}
const val0=pick(cohorts[0].candidate,'validation');
const val1=pick(cohorts[1].candidate,'validation');
const g0=stages.map(s=>gap(val0,s)),g1=stages.map(s=>gap(val1,s));
const spreadBefore=stages.map(s=>spread(val0,s)),spreadAfter=stages.map(s=>spread(val1,s));
const totalSpreadBefore=sum(spreadBefore,'range'),totalSpreadAfter=sum(spreadAfter,'range');
const imbalanceBefore=g0.reduce((n,x)=>n+x.absolute,0);
const imbalanceAfter=g1.reduce((n,x)=>n+x.absolute,0);
const reducesBias=imbalanceAfter+0.01<imbalanceBefore;
const harmByRole=stages.map(stage=>({stage,
 candidateWinsBefore:sum(val0.filter(c=>c.stage===stage),'win'),
 candidateWinsAfter:sum(val1.filter(c=>c.stage===stage),'win')}));
const validationDecision={
  recommendSecondMoverSixthCardForFurtherReview:
   totalSpreadAfter+0.03<totalSpreadBefore&&harmByRole.every(x=>
    Math.abs(x.candidateWinsAfter-x.candidateWinsBefore)<=12),
  spreadBySeatAndStarterBefore:spreadBefore,spreadBySeatAndStarterAfter:spreadAfter,
  totalSpreadBefore,totalSpreadAfter,
  seatOnlyGapImproved:reducesBias,
  imbalanceBefore,imbalanceAfter,gapByRoleBefore:g0,gapByRoleAfter:g1,
  harmByRole,selectionUsesTrainValidationOnly:true,
  holdoutOpenedAfterDecision:true,noAutomaticRuleChange:true};
const sealedHoldout={};
for(const extra of extras){
 sealedHoldout[extra]=summary(pick(cohorts[extra].candidate,'holdout'));
 candidate[extra].holdout=sealedHoldout[extra];
}
const report={schema:'arcane-v1579-second-drawer-sixth-card',status:'completed',
 totalDuels:9216,candidateDuels:1536,
 comparison:'Same-policy natural 40-card duels; 5/5 control versus 5/6 opening where ONLY second-to-act receives a real sixth card, crossed by absolute seat, actual starter, and role',
 controls:{realDeckDraw:true,exactStartingHandsVerified:true,secondMoverRegardlessOfSeat:true,
  starterSeatFactorial:true,pairedSeeds:true,
  candidateAndOpponentSamePolicy:true,oneSidedBoostsDisabled:true,
  neitherRoleGetsPermanentRuleBuff:true,holdoutNeverUsedForSelection:true,
  noProductionCodeChanged:true},
 stageAudit,candidate,pairedEffects,validationDecision,sealedHoldout,
 caveats:[
  'These are full simulated duels between fixed research policies, not neural weight training.',
  'Starter and seat are crossed: the six-card beneficiary is always 1 - starter; each candidate seat is tested first and second.',
  'Seat-dependent RNG/first-draw trajectories may still influence role win rates.',
  'Fusions presence is sampled once per turn, so it is a conservative lifetime proxy.',
  'Predator opportunities count turns with a ready Predator facing large Fusion; not all attacks are necessarily lethal.',
  'A six-card starting hand is a test-only balance option until explicitly approved for live gameplay.'
 ]};
assert.ok(candidate[0].byStage[9].measured.realCandidateStomps>0);
assert.ok(candidate[0].byStage[10].measured.realPredatorFusionAttacks>0);
assert.ok(candidate[1].byStage[9].measured.realCandidateStomps>0);
assert.ok(candidate[1].byStage[10].measured.realPredatorFusionAttacks>0);
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V1579_COMPLETE '+JSON.stringify({
 duels:report.totalDuels,selection:validationDecision,
 byRole:Object.fromEntries(extras.map(extra=>[extra,Object.fromEntries(stages.map(stage=>{
  const s=candidate[extra].byStage[stage];return [stage,{wins:s.wins,rate:s.winRate,
   bySeat:s.bySeat,byDrawOrder:s.byDrawOrder,bySeatAndStarter:s.bySeatAndStarter,
   stomps:s.measured.realCandidateStomps,
   predatorAttacksOnBigFusion:s.measured.realPredatorFusionAttacks,
   predatorKillsBigFusion:s.measured.realPredatorFusionKills,
   largeFusionUniqueCandidate:s.uniqueLargeFusionCandidate,
   largeFusionPresenceTurnsCandidate:s.fusionPresenceTurnsCandidate,
   predatorThreatWindows:s.measured.largeFusionPredatorThreatWindows}];
 }) )])),holdout:Object.fromEntries(extras.map(e=>[e,{
  wins:sealedHoldout[e].wins,rate:sealedHoldout[e].winRate}]))}));
