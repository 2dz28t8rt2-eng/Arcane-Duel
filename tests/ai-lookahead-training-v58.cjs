/* Arcane Duel v5.8 · multi-turn public-board AI tournament.
 *
 * Train 1–3 turn heuristic forecasts using the REAL turn/combat engine.
 * NEVER change the live opponents. Baseline: last trained v5.7 scorer.
 * Holdout uses disjoint seeds and four scripted player archetypes.
 * Fixed seeds and reproducible mutations; no private data or user saves.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const trainN=Number(process.env.ARCANE_LOOK_TRAIN_SEEDS||5);
const holdN=Number(process.env.ARCANE_LOOK_HOLD_SEEDS||8);
const tierCount=Number(process.env.ARCANE_LOOK_TIERS||10);
if(!Number.isSafeInteger(trainN)||trainN<2||trainN>15||
   !Number.isSafeInteger(holdN)||holdN<3||holdN>20||
   !Number.isSafeInteger(tierCount)||tierCount<1||tierCount>10)
 throw Error('Invalid reproducible training inputs.');
const original=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8'));
assert.equal(original.profiles.length,10);
const vm=boot({seed:580112});
const STYLES=['balanced','offensive','guardian','economy'];
const TRAIN_STYLES=['balanced','guardian','offensive'];
const fields=['board','survival','ace','tempo','support','blend'];
let mutationSeed=0x589B27C5;
const next=()=>{mutationSeed=(Math.imul(mutationSeed,1664525)+1013904223)>>>0;return mutationSeed/4294967296;};
const clamp=v=>Math.round(Math.max(0,Math.min(5,v))*100)/100;
let total=0,invalid=0;
function duel(tier,weights,config,seed,style){
 const cfg=config?JSON.stringify(config):'null';
 const result=vm.run(`(()=>{
  ArcaneAiLearning56.setSandbox(${JSON.stringify(weights)},true);
  ArcaneAiLookahead58.setSandbox(${cfg},${!!config});
  const g=createGame({mode:'pve',context:'tournament',opponentId:${tier},
   seed:${seed},difficulty:'easy'});
  let error=null,attacks=0,supports=0,aces=0,fusions=0,normal=0;
  const previous=chooseAiAction;
  chooseAiAction=function(duel,policy){
   const action=previous(duel,policy);
   if(duel===g&&g.active===1){
    if(action.type==='attack')attacks++;
    if(action.type==='arcane-soul-extract'||action.type==='arcane-guardian-heal')supports++;
    if(action.type==='fusion'){fusions++;if(action.choice===ACE_CARD_IDS[${tier}])aces++;}
    if(action.type==='normal'){
     normal++;
     if(g.players[1].hand.some(c=>c.uid===action.uid&&c.id===ACE_CARD_IDS[${tier}]))aces++;
    }
   }
   return action;
  };
  try{simulateGame(g,'${style}','balanced');}catch(e){error=String(e);}
  chooseAiAction=previous;
  ArcaneAiLookahead58.setSandbox(null);
  ArcaneAiLearning56.setSandbox(null);
  return {win:g.winner===1,draw:g.winner===null,lp:g.players[1].lp-g.players[0].lp,
   turns:g.turn,attacks,supports,aces,fusions,normal,error};
 })()`,120000);
 total++;
 if(result.error){invalid++;throw Error('AI match failed tier '+tier+', seed '+seed+', style '+style+': '+result.error);}
 if(result.draw)throw Error('Incomplete game in evaluation');
 return result;
}
function measure(tier,weights,config,seeds,styles){
 let wins=0,lp=0,turns=0,aces=0,fusions=0,supports=0,attacks=0;
 for(const style of styles)for(const seed of seeds){
  const m=duel(tier,weights,config,seed,style);
  wins+=Number(m.win);lp+=m.lp;turns+=m.turns;
  aces+=m.aces;fusions+=m.fusions;supports+=m.supports;attacks+=m.attacks;
 }
 const n=seeds.length*styles.length;
 return {matches:n,wins,winRate:Math.round(wins*1000/n)/10,
  averageLPMargin:Math.round(lp/n),meanTurns:Math.round(turns/n*10)/10,
  aces,fusions,supports,attacks};
}
function fingerprint(cfg){return JSON.stringify(cfg);}
function sampleConfig(tier){
 const depth=tier<=3?1:tier<=6?2:3;
 return [
  {depth,board:1.3,survival:1.1,ace:1.5,tempo:.7,support:1.1,blend:1},
  {depth,board:2.3,survival:.9,ace:2,tempo:1.3,support:.6,blend:.8},
  {depth,board:.9,survival:2.2,ace:2,tempo:.35,support:1.8,blend:1.3},
  {depth,board:1.5,survival:.8,ace:2.4,tempo:1.9,support:1,blend:.5},
  {depth,board:1,survival:1.6,ace:1.9,tempo:.6,support:2.3,blend:.6}
 ];
}
function mutate(w,generation){
 const nextCfg={...w};
 for(const key of fields){
  if(next()<.85)nextCfg[key]=clamp(w[key]+(next()-.5)*(generation===1?2.1:1.1));
 }
 return nextCfg;
}
function seedsFor(tier,phase,count){
 const start=phase==='train'?175811:915733;
 return Array.from({length:count},(_,i)=>start+tier*39091+i*3571);
}
const report={version:'multi-turn-v58',engine:'actual-Arcane-Duel-runtime',status:'sandbox-only',
 seedPolicy:'separate fixed training and holdout ranges',
 planning:'bounded heuristic 1–3-turn public-board prediction, not omniscient perfect-information tree',
 playerStylesTraining:TRAIN_STYLES,playerStylesHoldout:STYLES,
 trainingSeedCount:trainN,holdoutSeedCount:holdN,
 totalMatches:0,errors:0,tiers:[],promotion:'never automatic',
 warnings:['Only observed opponent board is forecast; future draws are not known.',
 'We compare to previously trained v5.7 per-tier weights, not to a random AI.',
 'Small simulated holdout samples do not establish human win rate or live balance.',
 'A single fixed player deck cannot represent all human acquisition/progression stages.',
 'If holdout performance degrades, retain the previous tournament profile.']};
for(let tier=1;tier<=tierCount;tier++){
 const trained=original.profiles.find(p=>p.tier===tier);
 assert.ok(trained&&trained.weights,'Last trained profile missing '+tier);
 const weight=trained.weights;
 const trSeeds=seedsFor(tier,'train',trainN),hoSeeds=seedsFor(tier,'hold',holdN);
 const baseline=measure(tier,weight,null,trSeeds,TRAIN_STYLES);
 const seen=new Set();let pool=sampleConfig(tier);
 let leader=null;const progress=[];
 for(let generation=0;generation<3;generation++){
  const population=pool.filter(p=>!seen.has(fingerprint(p)));
  for(const p of population)seen.add(fingerprint(p));
  const outcomes=population.map(cfg=>{
   const m=measure(tier,weight,cfg,trSeeds,TRAIN_STYLES);
   const winGain=m.wins-baseline.wins;
   const fitness=winGain*100000+(m.averageLPMargin-baseline.averageLPMargin)*1.1+
    (m.aces-baseline.aces)*6+(m.supports-baseline.supports)*.4;
   return {config:cfg,metrics:m,fitness};
  }).sort((a,b)=>b.fitness-a.fitness||a.metrics.meanTurns-b.metrics.meanTurns);
  if(outcomes[0]&&(!leader||outcomes[0].fitness>leader.fitness))leader=outcomes[0];
  progress.push({generation,candidates:population.length,
   championFitness:leader?.fitness??0,trainingWins:leader?.metrics?.wins??0});
  if(generation===2)break;
  pool=[leader.config,...Array.from({length:6},()=>mutate(leader.config,generation+1))];
 }
 const holdBase=measure(tier,weight,null,hoSeeds,STYLES);
 const holdPlan=measure(tier,weight,leader.config,hoSeeds,STYLES);
 const winGain=holdPlan.wins-holdBase.wins;
 const lpGain=holdPlan.averageLPMargin-holdBase.averageLPMargin;
 const aceGain=holdPlan.aces-holdBase.aces;
 const eligible=winGain>0||winGain===0&&lpGain>0&&aceGain>=-1;
 report.tiers.push({tier,depth:leader.config.depth,startingWeights:weight,
  trainingBaseline:baseline,trainingChampion:leader.metrics,
  evolution:progress,chosen:leader.config,
  holdout:{baseline:holdBase,trained:holdPlan,winGain,lpGain,aceGain,eligible},
  deployed:false});
}
report.totalMatches=total;report.errors=invalid;
report.holdoutWinGain=report.tiers.reduce((v,t)=>v+t.holdout.winGain,0);
report.holdoutLPMarginGain=Math.round(report.tiers.reduce((v,t)=>v+t.holdout.lpGain,0)/report.tiers.length);
report.improvedTiers=report.tiers.filter(t=>t.holdout.eligible).length;
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/arcane-ai-lookahead-training-v58.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_LOOKAHEAD_58',JSON.stringify({totalMatches:total,errors:invalid,winGain:report.holdoutWinGain,
 avgLPMarginGain:report.holdoutLPMarginGain,improvedTiers:report.improvedTiers,
 tiers:report.tiers.map(x=>({id:x.tier,depth:x.depth,winGain:x.holdout.winGain,
 lpGain:x.holdout.lpGain,aceGain:x.holdout.aceGain,eligible:x.holdout.eligible}))}));
