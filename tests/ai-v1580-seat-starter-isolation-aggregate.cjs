'use strict';
/* Causal seat/starter isolation with identical starter-pair RNG and exact
 * mirror decks. Report candidate-seat marker leakage separately from starter
 * and absolute seat effects. HOLDOUT remains sealed until validation decision.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root='artifacts/v1580',matches=['cross','mirror'],stages=[9,10],extras=[0,1];
const frozen=['guardian-champion','fusion-sequence-2ply','l10-guarded-worst-reply',
 'defender-v1573-survival-control','defender-v1573-counterplay'];
const challenger='fusion-v1574-stomp-conscious',allArms=[...frozen,challenger];
const fields=['realCandidateStomps','realOpponentStomps','realCandidateSplashHits',
 'realCandidateSplashKills','realCandidateSplashDefLost','realCandidateSplashCounterLP',
 'realPredatorFusionAttacks','realPredatorFusionKills',
 'realOpponentPredatorKillsCandidateFusion','fusionMultiMaterialChosen',
 'fusionMultiMaterialOpportunities','largeFusionPredatorThreatWindows'];
const sum=(a,f)=>a.reduce((n,x)=>n+(Number(x[f])||0),0);
const key=c=>[c.matchType,c.stage,c.pair,c.scenario,c.starter,c.seat,c.roleA,c.roleB,c.arm].join('|');
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
for(const match of matches)for(const extra of extras){
 const rows=[];
 for(const stage of stages){
  const file=path.join(root,match,`second${extra}`,`stage-${stage}.json`);
  assert.ok(fs.existsSync(file),'Missing required complete stage '+file);
  const d=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(d.stage,stage);assert.ok(d.controls?.holdoutNeverUsedForSelection);
  assert.equal(d.allCases.length,2304,'Expected all 8 pairs × 12 scenarios × 2 starters × 2 seats × 6 arms');
  for(const c of d.allCases){
   assert.equal(c.stage,stage);assert.ok(allArms.includes(c.arm));
   assert.equal(c.roleA,roleStage(stage));
   assert.equal(c.roleB,match==='mirror'?roleStage(stage):roleStage(stage===9?10:9));
   assert.equal(c.matchType,match);
   assert.equal(c.extraCardSecond,extra);
   assert.equal(c.extraCardBeneficiarySeat,1-c.starter);
   assert.equal(c.candidateDrawsSecond,c.seat!==c.starter);
   const expectedHands=[5,5];expectedHands[1-c.starter]=extra?6:5;
   assert.deepEqual(c.actualStartingHands,expectedHands,
    'Only the genuine second mover receives the card, irrespective of seat');
   if(match==='mirror'){
    assert.equal(c.openingFiveEqual,true,'Mirror initial five do not match');
    assert.equal(c.openingDeckEqual,true,'Mirror source deck order differs');
    assert.equal(c.openingFusionEqual,true,'Mirror fusion stock differs');
   }
   assert.equal(c.openingFourActionsBySeat?.length,2);
   assert.equal(c.openingFirstActionsBySeat?.length,2);
   assert.ok(['train','validation','holdout'].includes(c.split));
   assert.ok(c.illegalSwitchesBySeat?.every(n=>n===0));
   assert.ok(Array.isArray(c.largeFusionUniqueBySeat)&&c.largeFusionUniqueBySeat.length===2);
   assert.ok(Array.isArray(c.largeFusionPresenceTurnsBySeat)&&c.largeFusionPresenceTurnsBySeat.length===2);
   for(const f of fields)assert.ok(Number.isFinite(c[f]),'Missing main-game metric '+f);
   rows.push(c);
  }
  stageAudit.push({match,extra,stage,duels:2304,
   candidate:summary(d.allCases.filter(c=>c.arm===challenger))});
 }
 assert.equal(rows.length,4608);
 for(const arm of allArms){
  const x=rows.filter(c=>c.arm===arm);
  assert.equal(x.length,768);
  assert.equal(new Set(x.map(key)).size,768,'Duplicate matched scenario');
 }
 cohorts[match+'-'+extra]={rows,candidate:rows.filter(c=>c.arm===challenger)};
}
const allControl=matches.flatMap(match=>cohorts[match+'-0'].rows);
const allTreatment=matches.flatMap(match=>cohorts[match+'-1'].rows);
const paired=new Map(allControl.map(c=>[key(c),c]));
const pairedEffects={candidate:{bySeat:{0:{gain:0,loss:0},1:{gain:0,loss:0}},
 byDrawOrder:{first:{gain:0,loss:0},second:{gain:0,loss:0}},
 bySeatStarter:Object.fromEntries(['0-0','0-1','1-0','1-1'].map(k=>[k,{gain:0,loss:0}])),
 byStage:{9:{gain:0,loss:0},10:{gain:0,loss:0}},
 byMatch:{cross:{gain:0,loss:0},mirror:{gain:0,loss:0}}},
 allArms:{gain:0,loss:0}};
for(const c of allTreatment){
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
   pairedEffects.candidate.byMatch[c.matchType][change]++;
  }
 }
}
// With STARTER randomized independently of matchSeed, changing the starter
// alone must keep identical source decks, seed and candidate seat.
const starterParity={verifiedPairs:0};
const byStarter=new Map(allControl.concat(allTreatment)
 .filter(c=>c.starter===0).map(c=>[
 [c.matchType,c.extraCardSecond,c.stage,c.pair,c.scenario,c.seat,c.arm].join('|'),c]));
for(const c of allControl.concat(allTreatment).filter(c=>c.starter===1)){
 const k=[c.matchType,c.extraCardSecond,c.stage,c.pair,c.scenario,c.seat,c.arm].join('|');
 const b=byStarter.get(k);assert.ok(b,'Missing paired alternate starter '+k);
 for(const f of ['seed','seedA','seedB','stage','pair','scenario','seat','roleA','roleB','arm','split'])
  assert.deepEqual(c[f],b[f],'Starter-only switch changed '+f);
 starterParity.verifiedPairs++;
}
assert.equal(starterParity.verifiedPairs,9216);
// Under strict 5/5 MIRROR decks with identical policies, merely relabeling
// candidateSeat should never change the winner. This catches a candidate
// label leaking into game decisions, instead of confusing it with seat bias.
function markerLeakage(rows){
 const left=new Map(rows.filter(c=>c.matchType==='mirror'&&c.seat===0)
  .map(c=>[[c.extraCardSecond,c.stage,c.pair,c.scenario,c.starter,c.arm].join('|'),c]));
 let checks=0,violations=0;const samples=[];
 for(const c of rows.filter(c=>c.matchType==='mirror'&&c.seat===1)){
  const k=[c.extraCardSecond,c.stage,c.pair,c.scenario,c.starter,c.arm].join('|');
  const b=left.get(k);assert.ok(b,'Missing candidate-seat mirror '+k);
  const winnerB=b.win?0:1,winnerC=c.win?1:0;
  if(winnerB!==winnerC){violations++;if(samples.length<8)samples.push({k,winnerB,winnerC});}
  checks++;
 }
 return {checks,violations,rate:checks?violations/checks:null,samples};
}
const diagnosticBeforeHoldout=markerLeakage(allControl.concat(allTreatment)
 .filter(c=>c.split!=='holdout'));
const candidate={cross:{},mirror:{}};
for(const match of matches)for(const extra of extras){
 const rows=cohorts[match+'-'+extra].candidate;
 candidate[match][extra]={
  train:summary(pick(rows,'train')),
  validation:summary(pick(rows,'validation')),
  byStage:Object.fromEntries(stages.map(stage=>[stage,summary(rows.filter(c=>c.stage===stage))])),
  // HOLDOUT must not be opened until the validation-only recommendation is frozen.
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
const validationDecision={};
for(const match of matches){
 const val0=pick(cohorts[match+'-0'].candidate,'validation');
 const val1=pick(cohorts[match+'-1'].candidate,'validation');
 const g0=stages.map(s=>gap(val0,s)),g1=stages.map(s=>gap(val1,s));
 const spreadBefore=stages.map(s=>spread(val0,s)),spreadAfter=stages.map(s=>spread(val1,s));
 const totalSpreadBefore=sum(spreadBefore,'range'),totalSpreadAfter=sum(spreadAfter,'range');
 const imbalanceBefore=g0.reduce((n,x)=>n+x.absolute,0);
 const imbalanceAfter=g1.reduce((n,x)=>n+x.absolute,0);
 const harmByRole=stages.map(stage=>({stage,
  candidateWinsBefore:sum(val0.filter(c=>c.stage===stage),'win'),
  candidateWinsAfter:sum(val1.filter(c=>c.stage===stage),'win')}));
 validationDecision[match]={recommendSecondMoverSixthCardForFurtherReview:
  totalSpreadAfter+0.03<totalSpreadBefore&&harmByRole.every(x=>
   Math.abs(x.candidateWinsAfter-x.candidateWinsBefore)<=12),
  gapByRoleBefore:g0,gapByRoleAfter:g1,spreadBefore,spreadAfter,
  totalSpreadBefore,totalSpreadAfter,imbalanceBefore,imbalanceAfter,harmByRole,
  candidateMarkerLeaksBeforeHoldout:diagnosticBeforeHoldout.violations,
  selectionUsesTrainValidationOnly:true,holdoutOpenedAfterDecision:true,
  noAutomaticRuleChange:true};
}
const sealedHoldout={cross:{},mirror:{}};
for(const match of matches)for(const extra of extras){
 sealedHoldout[match][extra]=summary(pick(cohorts[match+'-'+extra].candidate,'holdout'));
 candidate[match][extra].holdout=sealedHoldout[match][extra];
}
const diagnosticHoldout=markerLeakage(allControl.concat(allTreatment)
 .filter(c=>c.split==='holdout'));
const report={schema:'arcane-v1580-seat-starter-deck-rng-isolation',status:'completed',
 totalDuels:18432,candidateDuels:3072,
 comparison:'Same-starter-seed 5/5 versus second-to-act 5/6, both actual Predator/Fusion roles and exact symmetric-deck mirrors; four seat/starter combinations',
 controls:{realDeckDraw:true,exactStartingHandsVerified:true,secondMoverRegardlessOfSeat:true,
  starterSeatFactorial:true,starterSeedParityVerified:true,exactMirroredDecks:true,
  candidateLabelLeakageMeasured:true,pairedSeeds:true,
  candidateAndOpponentSamePolicy:true,oneSidedBoostsDisabled:true,
  neitherRoleGetsPermanentRuleBuff:true,holdoutNeverUsedForSelection:true,
  noProductionCodeChanged:true},
 stageAudit,candidate,pairedEffects,validationDecision,sealedHoldout,starterParity,
 candidateMarkerDiagnostic:{trainValidation:diagnosticBeforeHoldout,holdout:diagnosticHoldout},
 caveats:[
  'These are full simulated duels between fixed research policies, not neural weight training.',
  'Both starter choices share the exact same random seed; starter*107 confounding from earlier runs has been removed.',
  'Mirror arms give both seats the exact same ordered deck, opening five and Fusion inventory; cross arms preserve distinct role decks.',
  'A mirror candidate-seat relabel can diagnose leakage into AI decisions; it does not by itself prove production gameplay has the same bug.',
  'Fusions presence is sampled once per turn, so it is a conservative lifetime proxy.',
  'Predator opportunities count turns with a ready Predator facing large Fusion; not all attacks are necessarily lethal.',
  'A six-card starting hand is a test-only balance option until explicitly approved for live gameplay.'
 ]};
for(const match of matches)for(const extra of extras){
 assert.ok(candidate[match][extra].byStage[9].measured.realCandidateStomps>0);
 if(match==='cross')
  assert.ok(candidate[match][extra].byStage[10].measured.realPredatorFusionAttacks>0);
}
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2)+'\n');
const compactByRole={},compactHoldout={};
for(const match of matches){
 compactByRole[match]={};compactHoldout[match]={};
 for(const extra of extras){
  compactByRole[match][extra]={};
  for(const stage of stages){
   const s=candidate[match][extra].byStage[stage];
   compactByRole[match][extra][stage]={wins:s.wins,rate:s.winRate,
    bySeat:s.bySeat,byDrawOrder:s.byDrawOrder,bySeatAndStarter:s.bySeatAndStarter,
    stomps:s.measured.realCandidateStomps,
    predatorAttacksOnBigFusion:s.measured.realPredatorFusionAttacks,
    predatorKillsBigFusion:s.measured.realPredatorFusionKills,
    largeFusionUniqueCandidate:s.uniqueLargeFusionCandidate};
  }
  const h=sealedHoldout[match][extra];
  compactHoldout[match][extra]={wins:h.wins,rate:h.winRate};
 }
}
console.log('ARCANE_V1580_COMPLETE '+JSON.stringify({
 duels:report.totalDuels,starterParity,
 candidateMarkerDiagnostic:report.candidateMarkerDiagnostic,
 validationDecision,byRole:compactByRole,holdout:compactHoldout}));
