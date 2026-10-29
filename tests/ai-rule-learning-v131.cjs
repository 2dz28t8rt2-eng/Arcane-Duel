'use strict';
/* Arcane Duel v13.1 - offline observed-action learning + bounded board lookahead.
 * Experimental only: does not modify game AI, decks or human progression.
 * Fits ONLY prior v13.0 train episodes. Existing holdout is read for evaluation,
 * never fitting, thresholds, model selection or policy promotions.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const {ruleFeatureSource}=require('./helpers/ai-rule-features-v130.cjs');
const historical=require('../models/ai-policy-history-v130.json');
const sourcePath=path.resolve('artifacts/ai-experiences-v130.json');
if(!fs.existsSync(sourcePath))throw Error('Missing authentic v13.0 experience artifact; download workflow run 39623655878 first.');
const archive=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
assert.equal(archive.schema,'arcane-action-experiences-v130');
assert.equal(archive.noOpponentHiddenInformation,true);
assert.equal(archive.modelTrained,false);
assert.equal(historical.holdoutNeverForTraining,true);
assert.ok(archive.episodes>=30&&archive.actualExperienceCount>=100);
const train=archive.transitions.filter(x=>x.split==='train');
const holdout=archive.transitions.filter(x=>x.split==='holdout');
assert.ok(train.length>100&&holdout.length>100);
assert.equal(new Set(train.map(x=>x.run)).size+new Set(holdout.map(x=>x.run)).size,archive.episodes);
assert.ok(!train.some(x=>holdout.some(y=>y.run===x.run)));
for(const r of archive.transitions){
 assert.ok(!('enemyHand' in r.before)&&!('enemyDeck' in r.before));
 assert.ok(!('enemyHand' in r.after)&&!('enemyDeck' in r.after));
}

// Identical feature extractor for offline replay and the injected live policy.
// All fields are visible to the acting player, except its own private hand.
function attackFeatures(s,a){
 if(!s||a?.type!=='attack'||!Number.isInteger(a.ai))return null;
 const my=s.myField?.[a.ai],enemy=a.di===null?null:s.enemyVisibleField?.[a.di];
 if(!my|| (a.di!==null&&!enemy))return null;
 const atk=Number(my.atk)||0,wall=enemy?(enemy.mode==='def'?Number(enemy.def)||0:Number(enemy.atk)||0):0;
 const mine=s.myField.filter(Boolean),theirs=s.enemyVisibleField.filter(Boolean);
 const enemyMax=Math.max(0,...theirs.map(c=>Number(c.atk)||0));
 const role=String(my.role||'').toLowerCase(),erole=String(enemy?.role||'').toLowerCase();
 return [
  1,atk/3000,wall/3000,Math.max(-2,Math.min(2,(atk-wall)/3000)),
  enemy?1:0,enemy?.mode==='def'?1:0,
  mine.length/5,theirs.length/5,
  Math.min(2,(Number(s.playerLP)||0)/10000),Math.min(2,(Number(s.enemyLP)||0)/10000),
  enemyMax/3000,Math.min(1,(Number(my.level)||1)/10),
  my.fusion?1:0,(role.includes('soul')||role.includes('seelen'))?1:0,
  (erole.includes('soul')||erole.includes('seelen'))?1:0,
  enemy?0:(atk>=Number(s.enemyLP)||0?1:0)
 ];
}
function dot(w,x){return x.reduce((n,v,i)=>n+v*w[i],0);}
function clip(v){return Math.max(-4,Math.min(4,Number(v)||0));}
const samples=rows=>rows.map(r=>({x:attackFeatures(r.before,r.action),y:clip(r.reward)}))
 .filter(r=>r.x&&Number.isFinite(r.y));
const tr=samples(train),te=samples(holdout);
assert.ok(tr.length>=15, 'Expected genuine observed training attacks');
assert.ok(te.length>=15, 'Expected untouched attack holdout');
const features=tr[0].x.length;
const weights=new Array(features).fill(0);
const mean=tr.reduce((s,x)=>s+x.y,0)/tr.length;
weights[0]=mean;
const lambda=.008,learningRate=.07;
for(let epoch=0;epoch<1100;epoch++){
 const grad=new Array(features).fill(0);
 for(const r of tr){
  const error=dot(weights,r.x)-r.y;
  for(let j=0;j<features;j++)grad[j]+=error*r.x[j];
 }
 for(let j=0;j<features;j++){
  const reg=j===0?0:lambda*weights[j];
  weights[j]-=learningRate*(grad[j]/tr.length+reg);
 }
}
const mse=(set,predict)=>set.reduce((sum,s)=>sum+(predict(s)-s.y)**2,0)/set.length;
const predictiveEvaluation={
 trainAttacks:tr.length,holdoutAttacks:te.length,
 trainMSE:+mse(tr,s=>dot(weights,s.x)).toFixed(5),
 holdoutMSE:+mse(te,s=>dot(weights,s.x)).toFixed(5),
 constantHoldoutMSE:+mse(te,()=>mean).toFixed(5),
 measuredAgainst:'observed immediate reward (not counterfactual optimal move)'
};
assert.ok(weights.every(Number.isFinite));
const trainedModel={
 schema:'arcane-tactical-reward-model-v131',trained:true,
 origin:'Authentic v13.0 GitHub Actions 39623655878 action transitions',
 historySchemas:historical.history.length,
 dataTrainRuns:[...new Set(train.map(x=>x.run))],
 dataHoldoutRuns:[...new Set(holdout.map(x=>x.run))],
 features:'public-board-attack-v131',weights:weights.map(w=>+w.toFixed(8)),
 method:'regularized linear regression on observed attack immediate rewards, 1100 deterministic epochs',
 limitation:'Association only: observed actions have no paired engine-validated counterfactual returns.',
 productionActive:false,policyAutoPromoted:false
};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-rule-model-v131.json',JSON.stringify(trainedModel,null,2)+'\n');

// This is the same observation surface as the v13.0 capture: no opponent
// private hand/deck, shuffled draw order, hidden RNG or internal engine state.
function visibleBoard(g){
 const known=c=>!c?null:{
  id:c.id,mode:c.mode,atk:dataOf(c).atk,def:dataOf(c).def,
  level:dataOf(c).level,role:c.roleOverride||CARDS[c.id]?.role||'',
  fusion:!!c.fusion,attacked:!!c.attacked,switched:!!c.switched
 };
 return {
  turn:g.turn,playerLP:g.players[0].lp,enemyLP:g.players[1].lp,
  myField:g.players[0].field.map(known),
  enemyVisibleField:g.players[1].field.map(known)
 };
}
// Simple depth-2 player search with one visible-board counterattack estimate.
// Hypothetical combat is an ordering heuristic only; the actual engine
// validates every chosen action and resolves real abilities and decay.
function hypothetical(s,a){
 const n={...s,myField:s.myField.map(c=>c&&({...c})),
  enemyVisibleField:s.enemyVisibleField.map(c=>c&&({...c}))};
 const m=n.myField[a.ai];if(!m)return null;
 m.attacked=true;
 const strength=Math.max(0,m.atk-30);
 if(a.di===null){
  if(n.enemyVisibleField.some(Boolean))return null;
  n.enemyLP=Math.max(0,n.enemyLP-strength);
  return n;
 }
 const foe=n.enemyVisibleField[a.di];if(!foe)return null;
 const wall=foe.mode==='def'?foe.def:foe.atk;
 if(strength>wall)n.enemyVisibleField[a.di]=null;
 if(foe.mode==='atk'&&strength<=foe.atk)n.myField[a.ai]=null;
 if(foe.mode==='atk')n.enemyLP=Math.max(0,n.enemyLP-Math.max(0,strength-foe.atk));
 return n;
}
function candidateActions(s,eligible){
 const enemy=s.enemyVisibleField.map((c,i)=>c?i:null).filter(x=>x!==null);
 const out=[];
 for(let i=0;i<s.myField.length;i++){
  const c=s.myField[i];
  if(!c||c.mode!=='atk'||c.attacked||(eligible&&!eligible.includes(i)))continue;
  if(!enemy.length)out.push({type:'attack',ai:i,di:null});
  else for(const k of enemy)out.push({type:'attack',ai:i,di:k});
 }
 return out;
}
function learnedAttackPolicy(g,w,stats){
 if(!g||g.active!==0||g.pending||g.winner!==null||g.turn<=1||g.aiPhase!=='attacks')return null;
 const f=tacticalRuleFeatures(g);
 if(!f?.legalAttacks?.length)return null;
 const s=visibleBoard(g);
 const allowed=new Set(f.legalAttacks.map(a=>a.from+':'+String(a.to)));
 const options=candidateActions(s,f.availableAttackers===undefined?null:
  f.legalAttacks.map(x=>x.from)).filter(a=>allowed.has(a.ai+':'+String(a.di)));
 let chosen=null,best=-Infinity;
 for(const action of options){
  const x=attackFeatures(s,action);
  if(!x)continue;
  const next=hypothetical(s,action);if(!next)continue;
  const predicted=dot(w,x);
  let bestFollowing=0;
  for(const b of candidateActions(next)){
   const fx=attackFeatures(next,b);
   if(fx)bestFollowing=Math.max(bestFollowing,dot(w,fx));
  }
  // An opponent may retaliate with currently visible attackers; this
  // is an estimate, never knowledge of its future hand or draw.
  const retaliation=Math.max(0,...next.enemyVisibleField.filter(Boolean)
   .map(c=>c.mode==='atk'?c.atk:0));
  const exposed=Math.max(0,...next.myField.filter(Boolean)
   .map(c=>c.mode==='atk'?c.atk:c.def));
  const counterRisk=Math.max(0,retaliation-exposed)/3000;
  const lethal=next.enemyLP===0?6:0;
  const score=predicted+.4*bestFollowing-.35*counterRisk+lethal;
  if(score>best){best=score;chosen=action;}
 }
 stats.considered+=options.length;
 if(!chosen||!Number.isFinite(best))return null;
 // Low-confidence cases fall back to the proven existing AI, not a forced guess.
 if(best < -.6){stats.abstained++;return null;}
 stats.chosen++;
 return chosen;
}
const injected=[attackFeatures,dot,visibleBoard,hypothetical,candidateActions,learnedAttackPolicy]
 .map(f=>f.toString()).join('\n');
const tiers=[3,7,9,10];
const starts=Number(process.env.ARCANE_V131_STARTS||16);
const offset=Number(process.env.ARCANE_V131_SEED_OFFSET||0);
assert.ok(Number.isInteger(starts)&&starts>=2&&starts<=32);
assert.ok(Number.isInteger(offset)&&offset>=0&&offset<=100000);
function play(tier,seed,mode){
 const vm=boot({seed:seed+17,x128Mode:'full'});
 vm.exec(summonPolicySource);
 vm.exec(ruleFeatureSource);
 vm.exec(injected);
 vm.exec('var V131_WEIGHTS='+JSON.stringify(weights)+';');
 const result=vm.run('(()=>{'+
  'const x=rpgEnemyLoadout(10,"easy");'+
  'const g=createGame({id:"v131-check",mode:"pve",context:"tournament",opponentId:'+tier+
  ',seed:'+seed+',starter:'+(seed%2)+',deck:[...x.deck],fusionDeck:[...x.fusionDeck]});'+
  'const audit={considered:0,chosen:0,abstained:0,invalid:0};'+
  'const opts={summonObservations:0,normalOffered:0,legalFusionOffers:0,'+
  'fusionAvailableTurns:0,freeSlotObservations:0,fullBoardObservations:0,noNormalHand:0,'+
  'enemyAheadAtSummon:0,attackerOnBoardAtSummon:0,policyNormalChoices:0,'+
  'policyFusionChoices:0,fusionMaterialsChosen:0,fusionTargetAtkSum:0,attacks:0,damageNpc:0};'+
  'const original=chooseAiAction,apply=applyAiAction;'+
  'chooseAiAction=function(game,style){'+
   'if(game!==g||game.active!==0)return original(game,style);'+
   (mode==='learned'?'const a=learnedAttackPolicy(game,V131_WEIGHTS,audit);if(a)return a;':'')+
   'return summonPolicy(game,"tempo-board",opts)||original(game,style);'+
  '};'+
  'applyAiAction=function(game,a){const res=apply(game,a);'+
   'if(game===g&&game.active===0&&a?.type==="attack"&&!res)audit.invalid++;'+
   'return res;};'+
  'try{simulateGame(g,"balanced","balanced");}finally{chooseAiAction=original;applyAiAction=apply;}'+
  'return {winner:g.winner,turn:g.turn,audit,policyCalls:opts.summonObservations};'+
 '})()',120000);
 assert.ok([0,1].includes(result.winner));
 assert.equal(result.audit.invalid,0,'Illegal attack proposal reached engine');
 return {win:result.winner===0,turn:result.turn,...result.audit};
}
const comparison=[];
for(const tier of tiers){
 let base=0,learned=0,chosen=0,considered=0,invalid=0;
 for(let i=0;i<starts;i++){
  // Fresh starts outside the original v13.0 experience capture.
  const seed=131100+offset+tier*1000+i*53;
  const a=play(tier,seed,'baseline'),b=play(tier,seed,'learned');
  base+=Number(a.win);learned+=Number(b.win);
  chosen+=b.chosen;considered+=b.considered;invalid+=b.invalid;
 }
 comparison.push({tier,starts,baselineWins:base,learnedWins:learned,
  learnedAttackChoices:chosen,considered,invalid,
  deltaWins:learned-base});
 console.log('ARCANE_V131_TIER '+JSON.stringify(comparison[comparison.length-1]));
}
const byTier=Object.fromEntries(comparison.map(c=>[c.tier,c]));
const promotionEligible=starts>=16&&
 predictiveEvaluation.holdoutMSE<predictiveEvaluation.constantHoldoutMSE&&
 comparison.every(x=>x.invalid===0)&&
 byTier[9].learnedWins>=byTier[9].baselineWins&&
 byTier[10].learnedWins>=byTier[10].baselineWins&&
 comparison.reduce((n,x)=>n+x.deltaWins,0)>=4&&
 comparison.reduce((n,x)=>n+x.learnedAttackChoices,0)>0;
const report={
 schema:'arcane-rule-learning-v131',experimentalOnly:true,
 githubSourceRun:39623655878,historyExperiments:historical.history.length,
 trainEpisodes:new Set(train.map(x=>x.run)).size,
 archiveHoldoutEpisodes:new Set(holdout.map(x=>x.run)).size,
 archiveTransitions:archive.actualExperienceCount,
 predictiveEvaluation,
 search:'Two own attack actions and one visible-enemy-response risk heuristic; all real actions checked by game engine',
 tiers:comparison,modelTrained:true,
 trainedParameters:weights.length,ruleBook:'docs/AI-REGELWERK-V130.md',
 promotionEligible,productionIntegrated:false,
 explanation:promotionEligible?
  'Promising candidate under conservative preliminary gate; still requires additional independent confirmation and explicit integration':
  'No automatic promotion: keep existing tempo AI until a reliable advantage is shown.',
 caveats:[
  'Learning estimates observed immediate reward, not an optimal action counterfactual.',
  'Hypothetical lookahead approximates abilities, defense, decay and opponent behavior; the engine alone resolves actual duels.',
  'Original v13.0 holdout never influenced fitting, weight selection or thresholds.',
  'No human PvE opponent behavior, inventory or economy was changed.',
  'A trained artifact does not automatically persist as live game AI; deployment requires a separate validated code update.'
 ]
};
fs.writeFileSync('artifacts/ai-rule-training-v131.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V131_SUMMARY '+JSON.stringify({
 trained:report.modelTrained,trainEpisodes:report.trainEpisodes,
 attacks:tr.length,untouchedHoldout:te.length,holdoutMSE:predictiveEvaluation.holdoutMSE,
 baselineMSE:predictiveEvaluation.constantHoldoutMSE,tiers:comparison,
 productionIntegrated:false,promotionEligible
}));
