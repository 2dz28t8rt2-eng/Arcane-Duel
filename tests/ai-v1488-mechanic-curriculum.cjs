'use strict';
/* Arcane Duel v14.8.8 – symmetrical mechanic curriculum, measured decision
 * divergence and independently selected summon/fusion risk policy.
 * Isolated research runner; product code, perks and champion remain unchanged.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const stage=process.env.ARCANE_V1488_STAGE||'train';
const root='artifacts/v1488';
const shard=Number(process.env.ARCANE_V1488_SHARD||0);
const shards=3;
assert.ok(['train','select','holdout','aggregate'].includes(stage));
if(['train','holdout'].includes(stage))assert.ok(shard>=0&&shard<shards&&Number.isInteger(shard));

function aggregateRows(rows){
 const keys=['games','wins','seat0Wins','starterWins','decisions','meaningful','diverged',
  'bySummon','byPositions','byAttacks','placementResolved','replyEvaluations','invalid'];
 const r=Object.fromEntries(keys.map(k=>[k,0]));
 for(const row of rows)for(const k of keys)r[k]+=row[k]||0;
 r.winRate=r.games?r.wins/r.games:0;
 r.divergenceRate=r.meaningful?r.diverged/r.meaningful:0;
 return r;
}
function selectFromTraining(){
 const parts=Array.from({length:shards},(_,i)=>
  JSON.parse(fs.readFileSync(root+'/train-'+i+'.json','utf8')));
 for(let i=0;i<parts.length;i++){
  assert.equal(parts[i].schema,'arcane-v1488-training-shard');
  assert.equal(parts[i].shard,i);
  assert.equal(parts[i].scenarioCount,7);
  assert.equal(parts[i].controls.symmetry,'test-only');
  assert.deepEqual(parts[i].profiles,[.05,.15,.35]);
 }
 const all=parts.flatMap(x=>x.seeds);
 assert.equal(new Set(all).size,21,'Training scene seeds duplicated');
 const profiles=[.05,.15,.35].map(materialCost=>{
  const entries=parts.map(x=>x.results.find(y=>y.materialCost===materialCost));
  assert.ok(entries.every(Boolean));
  return {materialCost,...aggregateRows(entries)};
 });
 // Training only: choose highest win rate; conservative middle coefficient
 // wins exact ties. Independent holdout has NEVER been read here.
 profiles.sort((a,b)=>b.winRate-a.winRate||
  Math.abs(a.materialCost-.15)-Math.abs(b.materialCost-.15));
 const selected=profiles[0].materialCost;
 const document={schema:'arcane-v1488-frozen-training-selection',
  chosenMaterialCost:selected,trainingProfiles:profiles,
  trainScenes:all.length,policyFrozenBeforeHoldout:true,
  holdoutReadDuringSelection:false,testOnly:true};
 fs.mkdirSync(root,{recursive:true});
 fs.writeFileSync(root+'/selection.json',JSON.stringify(document,null,2)+'\n');
 console.log('ARCANE_V1488_SELECTION '+JSON.stringify(document));
}
function combineHoldout(){
 const selected=JSON.parse(fs.readFileSync(root+'/selection.json','utf8'));
 assert.equal(selected.schema,'arcane-v1488-frozen-training-selection');
 const parts=Array.from({length:shards},(_,i)=>
  JSON.parse(fs.readFileSync(root+'/holdout-'+i+'.json','utf8')));
 for(let i=0;i<parts.length;i++){
  assert.equal(parts[i].schema,'arcane-v1488-holdout-shard');
  assert.equal(parts[i].shard,i);
  assert.equal(parts[i].scenarioCount,7);
  assert.equal(parts[i].materialCost,selected.chosenMaterialCost);
  assert.equal(parts[i].controls.symmetry,'test-only');
  assert.equal(parts[i].aggregate.invalid,0);
 }
 const unique=parts.flatMap(x=>x.seeds);
 assert.equal(new Set(unique).size,21);
 const trainingSeeds=Array.from({length:shards},(_,i)=>
  JSON.parse(fs.readFileSync(root+'/train-'+i+'.json','utf8'))).flatMap(x=>x.seeds);
 assert.equal(new Set([...trainingSeeds,...unique]).size,42,'Train/holdout overlap');
 const merged=aggregateRows(parts.map(x=>x.aggregate));
 assert.equal(merged.games,168);
 assert.equal(merged.invalid,0);
 const styles=['predator','guardian','fusion','soul','allrounder','tempo','hybrid'];
 const byStyle=Object.fromEntries(styles.map(s=>
  [s,aggregateRows(parts.flatMap(x=>x.byStyle[s]||[]))]));
 assert.ok(styles.every(s=>byStyle[s].games===24),'Every style needs 24 mirrored holdout duels');
 const final={schema:'arcane-v1488-strategic-mechanic-curriculum',
  status:'completed',sourceCommit:process.env.GITHUB_SHA||'unknown',
  testedWithVerifiedV1486SymmetricVM:true,
  productionIntegrated:false,championPromoted:false,
  selectedMaterialCost:selected.chosenMaterialCost,
  training:selected.trainingProfiles,holdout:{...merged,byStyle,
   traces:parts.flatMap(x=>x.examples).slice(0,36)},
  controls:{trainScenes:21,unseenHoldoutScenes:21,styles,
   mirrorBothSeats:true,starterBothSeats:true,identicalStartingCards:true,
   symmetricalFusionRulesTestOnly:true,skillsAndPerksDisabledTestOnly:true,
   publicOpponentRepliesOnly:true,zeroInvalidActions:true},
  promotionEligible:false,
  conclusions:{
   reportedWinRateIsNotProofOfLearning:true,
   meaningfulDecisionsCountOnlyWhenAtLeastTwoLegalCandidateActions:true,
   modelCheckpointUpdated:false,
   limitedToFirstEightTurnsForLegacyPlannerCompatibility:true
  },
  caveats:[
   'The material-cost coefficient is selected from train-only mirrored games, not an outcome-trained neural network.',
   'Visible counterplay is limited to on-board enemy attacks and omits unknown future summons and card draws.',
   'Summon placement is actually resolved through the engine, but sampled random fusion outcomes are not an expected value across multiple RNG seeds.',
   'The reference baseline uses the frozen v14.7 planner and is not changed by this run.',
   'Despite full seven-style coverage, 21 independent held-out scenes cannot establish universal tactical superiority.',
   'All new roles and special skills remain disabled inside the isolated fairness simulator, not the playable game.'
  ]};
 fs.writeFileSync(root+'/report.json',JSON.stringify(final,null,2)+'\n');
 console.log('ARCANE_V1488_RESULT '+JSON.stringify({
  selectedMaterialCost:final.selectedMaterialCost,training:final.training,
  holdout:merged,byStyle,promotionEligible:false,productionIntegrated:false}));
}
if(stage==='select'){selectFromTraining();process.exit(0);}
if(stage==='aggregate'){combineHoldout();process.exit(0);}

function lookahead1488(g,w,stats,mode='candidate'){
 if(mode!=='candidate')return lookahead1487(g,w,stats,mode);
 if(g.winner!==null||g.pending||g.turn>8||
    !['summon','positions','attacks'].includes(g.aiPhase))
   return lookahead1487(g,w,stats,mode);
 const own=g.active,phase=g.aiPhase;
 const reference=JSON.parse(JSON.stringify(g));
 const baselineStat={choices:0,bySide:[0,0],support:0,fusions:0,attacks:0,
  finalRankedTraces:[],traceIntegrityErrors:0,sameStateComparisons:0,sameStateOverrides:0,
  resolvedSamples:[],unresolvedBranches:0};
 const old=lookahead139(reference,w,baselineStat,'candidate')||
  decision135(reference,w,false,null,baselineStat);
 // Evaluate all offered types, not just raw invocation counts.
 const available=choices135(g,stats).filter(c=>
  phase==='summon'?['normal','fusion'].includes(c.action.type):
  phase==='positions'?['switch','advance-phase'].includes(c.action.type):
  ['attack','arcane-soul-extract','arcane-guardian-heal','end'].includes(c.action.type));
 const diverse=new Set(available.map(x=>JSON.stringify(x.action)));
 const meaningful=diverse.size>=2;
 let candidate=null;
 if(phase!=='summon'){
  candidate=lookahead1487(g,w,stats,'candidate');
 }else if(meaningful){
  const ranked=available.map(x=>({action:x.action,
   prior:x.base+x.features.reduce((n,v,i)=>n+v*w[i],0)}))
   .sort((a,b)=>b.prior-a.prior);
  const shortlist=[
   ...ranked.filter(x=>x.action.type==='normal').slice(0,3),
   ...ranked.filter(x=>x.action.type==='fusion').slice(0,6)
  ];
  const start=boardValue139(g,own);
  const scored=[];
  for(const c of shortlist){
   const result=resolvedBranch143(g,c.action,own,stats);
   if(!result||!result.game||result.game.pending)continue;
   const next=result.game;
   const delta=boardValue139(next,own)-start;
   const opponent=visibleReply1487(next,own,1);
   const material=Math.max(0,result.materialCount-1);
   const cfg=ARCANE1488_CONFIG||{};
   const components={
    prior:.16*c.prior,completePlacement:2.35*delta,
    visibleReply:-.2*opponent.penalty,
    material:-(cfg.materialCost??.15)*material,
    fusionReserve:c.action.type==='fusion'?-.06:0,
    remainingCards:Math.min(5,next.players[own].hand.length)*.008
   };
   scored.push({action:c.action,score:Object.values(components).reduce((s,v)=>s+v,0),
    components,postPlacementCardCount:next.players[own].field.filter(Boolean).length,
    materialCount:result.materialCount,placementSlot:result.placementSlot,
    replyCount:opponent.replyCount});
  }
  if(scored.length){
   scored.sort((a,b)=>b.score-a.score);
   candidate=scored[0].action;
   stats.v1488PlacementResolved=(stats.v1488PlacementResolved||0)+scored.length;
   stats.v1488CounterChecks=(stats.v1488CounterChecks||0)+
    scored.reduce((s,x)=>s+x.replyCount,0);
   if(ARCANE147_TRACE){
    const store=stats.v1488Examples||(stats.v1488Examples=[]);
    if(store.length<12)store.push({phase,turn:g.turn,publicBefore:snapState(g),
     baselineAction:old,selected:candidate,
     ranked:scored.slice(0,6).map(x=>({...x,score:+x.score.toFixed(5)})),
     note:'Full legal engine placement, sampled fusion roll, public on-board counterattacks only'});
   }
  }
 }
 candidate=candidate||old;
 stats.v1488Decisions=(stats.v1488Decisions||0)+1;
 if(meaningful)stats.v1488Meaningful=(stats.v1488Meaningful||0)+1;
 const differs=JSON.stringify(candidate)!==JSON.stringify(old);
 if(meaningful&&differs)stats.v1488Diverged=(stats.v1488Diverged||0)+1;
 const p=stats.v1488ByPhase||(stats.v1488ByPhase={});
 const bucket=p[phase]||(p[phase]={decisions:0,meaningful:0,diverged:0});
 bucket.decisions++;
 if(meaningful)bucket.meaningful++;
 if(meaningful&&differs)bucket.diverged++;
 if(ARCANE147_TRACE&&meaningful){
  const diag=stats.v1488DivergenceExamples||(stats.v1488DivergenceExamples=[]);
  if(diag.length<12)diag.push({phase,turn:g.turn,publicState:snapState(g),
   legalOptions:available.length,reference:old,candidate,differs});
 }
 return candidate;
}

function run1488(){
 const selected=stage==='holdout'?
  JSON.parse(fs.readFileSync(root+'/selection.json','utf8')):null;
 if(stage==='holdout')assert.equal(selected.schema,'arcane-v1488-frozen-training-selection');
 const report147=JSON.parse(fs.readFileSync('artifacts/history-v147/report.json','utf8'));
 assert.equal(report147.schema,'arcane-v147-final-score-transparent-mirrors');
 const profiles=report147.selectedProfiles;
 const groups={offense:['predator','tempo'],defense:['guardian','soul'],
  fusion:['fusion','allrounder','hybrid']};
 const group=s=>Object.keys(groups).find(k=>groups[k].includes(s.style));
 const modes=[
  {name:'starter0',starterOverride:0,flipOpeningHands:false},
  {name:'starter1',starterOverride:1,flipOpeningHands:false},
  {name:'starter0_reverse',starterOverride:0,flipOpeningHands:true},
  {name:'starter1_reverse',starterOverride:1,flipOpeningHands:true}
 ];
 const chosenScenes=(stage==='train'?train:holdout).filter((_,i)=>i%shards===shard);
 assert.equal(chosenScenes.length,7);
 const stylesForShard=new Set(chosenScenes.map(s=>s.style));
 assert.equal(stylesForShard.size,7,'Expected one scenario for each of seven strategies per shard');
 function playSide(s,condition,profileCost,roles,capture=false){
  const scene={...s,...condition,neutralSkills:true,
   lockIdenticalOpenings:true,fusionAuditArm:'symmetric',
   policy1487:{risk:.2},policy1488:{materialCost:profileCost}};
  const res=play(scene,model.weights,model.weights,'none','attacks',false,
   2,'always',2.35,roles,
   {bySide:roles.map(()=>profiles[group(s)]),oldProfile:profiles[group(s)]},capture);
  const o=res.openingAudit;
  assert.ok(o?.strictIdenticalOpenings);
  assert.equal(o.fusionAuditArm,'symmetric');
  assert.equal(o.skillMetadata,0);
  assert.equal(JSON.stringify(o.handsDetailed[0]),JSON.stringify(o.handsDetailed[1]));
  assert.equal(JSON.stringify(o.decksRemaining[0]),JSON.stringify(o.decksRemaining[1]));
  assert.equal(JSON.stringify(o.fusionStock[0]),JSON.stringify(o.fusionStock[1]));
  assert.deepEqual(o.openingShield,[0,0]);
  assert.equal(res.invalid,0,'Illegal game action');
  return res;
 }
 function compute(s,condition,profileCost,capture=false){
  const a=playSide(s,condition,profileCost,['candidate','prior147'],capture);
  const b=playSide(s,condition,profileCost,['prior147','candidate'],capture);
  const t=[a.tally,b.tally];
  const sum=k=>t.reduce((n,v)=>n+(v[k]||0),0);
  const phases={};
  for(const phase of ['summon','positions','attacks']){
   phases[phase]=t.reduce((p,x)=>{
    const s=x.v1488ByPhase?.[phase]||{};
    for(const k of ['decisions','meaningful','diverged'])p[k]=(p[k]||0)+(s[k]||0);
    return p;
   },{decisions:0,meaningful:0,diverged:0});
  }
  return {games:2,wins:Number(a.winner===0)+Number(b.winner===1),
   seat0Wins:Number(a.winner===0)+Number(b.winner===0),
   starterWins:Number(a.winner===condition.starterOverride)+Number(b.winner===condition.starterOverride),
   decisions:sum('v1488Decisions'),meaningful:sum('v1488Meaningful'),
   diverged:sum('v1488Diverged'),
   bySummon:phases.summon.diverged,byPositions:phases.positions.diverged,
   byAttacks:phases.attacks.diverged,
   placementResolved:sum('v1488PlacementResolved'),
   replyEvaluations:sum('v1488CounterChecks')+sum('v1487Replies'),
   invalid:a.invalid+b.invalid,
   phases,
   examples:capture?t.flatMap(x=>[
    ...(x.v1488Examples||[]),
    ...(x.v1488DivergenceExamples||[])
   ]).slice(0,8):[]};
 }
 const output={schema:'arcane-v1488-'+(stage==='train'?'training':'holdout')+'-shard',
  shard,scenarioCount:chosenScenes.length,sourceCommit:process.env.GITHUB_SHA||'unknown',
  seeds:chosenScenes.map(s=>s.seed),
  styles:chosenScenes.map(s=>s.style),
  fingerprints:chosenScenes.map(s=>s.deck.fingerprint),
  controls:{symmetry:'test-only',identicalHands:true,zeroStartShields:true,
   neutralSkills:true,completePlacement:true,visibleEnemyResponsesOnly:true},
  productionIntegrated:false,promotionEligible:false};
 fs.mkdirSync(root,{recursive:true});
 if(stage==='train'){
  const coefficients=[.05,.15,.35];
  const results=[];
  for(const materialCost of coefficients){
   const rows=[];
   for(const s of chosenScenes)for(const c of modes.slice(0,2))
    rows.push(compute(s,c,materialCost));
   const combined=aggregateRows(rows);
   assert.equal(combined.games,28);
   results.push({materialCost,...combined});
   console.log('ARCANE_V1488_TRAIN_SHARD '+JSON.stringify({shard,materialCost,...combined}));
  }
  output.profiles=coefficients;output.results=results;
 }else{
  output.materialCost=selected.chosenMaterialCost;
  const rows=[];
  const byStyle={};
  const examples=[];
  for(const s of chosenScenes){
   byStyle[s.style]=[];
   for(const c of modes){
    const res=compute(s,c,output.materialCost,examples.length<20);
    rows.push(res);
    byStyle[s.style].push({...res,examples:undefined});
    examples.push(...res.examples);
   }
  }
  output.aggregate=aggregateRows(rows);
  output.byStyle=byStyle;
  output.examples=examples.slice(0,30);
  assert.equal(output.aggregate.games,56);
  console.log('ARCANE_V1488_HOLDOUT_SHARD '+JSON.stringify({shard,...output.aggregate}));
 }
 fs.writeFileSync(root+'/'+stage+'-'+shard+'.json',JSON.stringify(output,null,2)+'\n');
}
const prior=fs.readFileSync('tests/ai-v1486-three-arm-symmetric-training.cjs','utf8');
const limit=prior.indexOf('const run=String.raw');
assert.ok(limit>0);
const v1486Prelude=prior.slice(0,limit);
// Same controlled engine from v14.8.6, without invoking its old match matrices.
const injection=[
  'patch('+JSON.stringify("+'\\n'+lookahead148.toString()+'\\n'+explain146.toString()")+','+
   JSON.stringify("+'\\n'+lookahead148.toString()+'\\n'+visibleReply1487.toString()+'\\n'+lookahead1487.toString()+'\\n'+lookahead1488.toString()+'\\n'+explain146.toString()")+');',
  'patch('+JSON.stringify("'suggested=lookahead148(game,weights,tally,ARCANE144_SIDES[side]);',")+','+
   JSON.stringify("'suggested=lookahead1488(game,weights,tally,ARCANE144_SIDES[side]);',")+');',
  'patch('+JSON.stringify("vm.exec('var ARCANE147_TRACE='+String(auditCapture)+';');")+','+
   JSON.stringify("vm.exec('var ARCANE147_TRACE='+String(auditCapture)+';');\n vm.exec('var ARCANE1487_CONFIG='+JSON.stringify(scene.policy1487||{})+';');\n vm.exec('var ARCANE1488_CONFIG='+JSON.stringify(scene.policy1488||{})+';');")+');',
  'script=script.replace("function play(scene",POLICY_SOURCE+"\\nfunction play(scene");',
  "new Function('require','process','console',script+RUN_SOURCE)(require,process,console);"
].join('\n');
const v1487=fs.readFileSync('tests/ai-v1487-two-ply-training.cjs','utf8');
const functions=v1487.slice(v1487.indexOf('function visibleReply1487('),v1487.indexOf('function run1487(){'));
assert.ok(functions.includes('function lookahead1487('));
const policySource=functions+'\n'+lookahead1488.toString();
new Function('require','process','console','POLICY_SOURCE','RUN_SOURCE',
 v1486Prelude+'\n'+injection)(require,process,console,policySource,'('+run1488.toString()+')();');
