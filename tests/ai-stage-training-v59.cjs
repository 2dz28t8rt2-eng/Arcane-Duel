/* Arcane Duel 5.9 · stage-aware engine-branch training.
 * Evaluation includes four player policies, stage-legal role decks and a
 * conservative/invested deck mix. Separate fixed seeds for training/holdout.
 * Live career/save is never altered; no weights are promoted automatically.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {makeTrainingDeck}=require('./helpers/stage-training-decks-v59.cjs');
const T=Number(process.env.ARCANE_STAGE_TIERS||10);
const ntrain=Number(process.env.ARCANE_STAGE_TRAIN_SEEDS||2);
const nhold=Number(process.env.ARCANE_STAGE_HOLDOUT_SEEDS||3);
if(!Number.isInteger(T)||T<1||T>10||
 !Number.isInteger(ntrain)||ntrain<2||ntrain>12||
 !Number.isInteger(nhold)||nhold<3||nhold>15)
 throw Error('Invalid stage training configuration.');
const vm=boot({seed:590091});
const meta=vm.run('({cards:CARDS.map(c=>({id:c.id,name:c.name,level:c.level,atk:c.atk,def:c.def,role:c.role,source:c.source,hard:c.hard,ace:c.ace,retired:c.retired,rpg:c.rpg,enemyOnly:c.enemyOnly,essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly})),defaultDeck:DEFAULT_DECK,startFusions:RPG_START_FUSIONS,opponents:RPG_OPPONENTS.map(o=>({level:o.level}))})');
const previous=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8'));
const playerStyles=[
 {name:'predator',policy:'offensive'},
 {name:'guardian',policy:'guardian'},
 {name:'fusion',policy:'economy'},
 {name:'balanced',policy:'balanced'}
];
const variants=['normal','invested'];
const OPTIONS=[
 {name:'field',params:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10}},
 {name:'survival',params:{material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10}},
 {name:'tempo',params:{material:.5,board:1.5,tempo:2.3,risk:.9,support:.8,future:.35,ace:10}},
 {name:'balanced',params:{material:.8,board:1.45,tempo:1.1,risk:1.2,support:1.1,future:.6,ace:10}}
];
const constructed=new Map();
for(let tier=1;tier<=T;tier++)for(const style of playerStyles)for(const variant of variants){
 const d=makeTrainingDeck(meta,tier,style.name,variant);
 assert.equal(d.deck.length,40);assert.ok(d.fusionDeck.length>=2);
 constructed.set([tier,style.name,variant].join(':'),d);
}
let played=0;
function simulate(tier,deck,playerPolicy,weights,params,seed){
 const config=params?JSON.stringify(params):'null';
 const code=`(()=>{
  ArcaneAiLearning56.setSandbox(${JSON.stringify(weights)},true);
  ArcaneAiLookahead58.setSandbox(null);
  ArcaneAiBranches59.setSandbox(${config},${!!params});
  ArcaneAiBranches59.resetCounters();
  const g=createGame({mode:'pve',context:'tournament',opponentId:${tier},
   deck:${JSON.stringify(deck.deck)},fusionDeck:${JSON.stringify(deck.fusionDeck)},
   seed:${seed},starter:${seed}%2,difficulty:'easy'});
  let error=null;
  let fusions=0,aces=0,heals=0,drains=0,attacks=0;
  const old=chooseAiAction;
  chooseAiAction=function(duel,policy){
   const a=old(duel,policy);
   if(duel===g&&g.active===1){
    if(a.type==='fusion'){fusions++;if(a.choice===ACE_CARD_IDS[${tier}])aces++;}
    if(a.type==='normal'&&g.players[1].hand.some(c=>c.uid===a.uid&&c.id===ACE_CARD_IDS[${tier}]))aces++;
    if(a.type==='arcane-guardian-heal')heals++;
    if(a.type==='arcane-soul-extract')drains++;
    if(a.type==='attack')attacks++;
   }
   return a;
  };
  try{simulateGame(g,'${playerPolicy}','balanced');}catch(e){error=String(e);}
  chooseAiAction=old;
  const branches=ArcaneAiBranches59.stats();
  ArcaneAiBranches59.setSandbox(null);
  ArcaneAiLearning56.setSandbox(null);
  return {winner:g.winner,lp:g.players[1].lp-g.players[0].lp,turn:g.turn,
   fusions,aces,heals,drains,attacks,branchChoices:branches.evaluated,
   publicReplies:branches.replies,invalidActions:branches.invalid,error};
 })()`;
 const row=vm.run(code,120000);played++;
 if(row.error||![0,1].includes(row.winner))
  throw Error('AI test duel failed tier '+tier+': '+row.error);
 if(row.invalidActions>8)throw Error('Excessive rejected simulated branches: '+row.invalidActions);
 return row;
}
function suite(tier,weights,params,seeds,styles=playerStyles){
 const detail=[];
 for(const style of styles)for(const variant of variants){
  const deck=constructed.get([tier,style.name,variant].join(':'));
  for(const seed of seeds)detail.push({stage:tier,style:style.name,variant,seed,
   ...simulate(tier,deck,style.policy,weights,params,seed)});
 }
 const n=detail.length;
 const sum=k=>detail.reduce((s,d)=>s+d[k],0);
 return {games:n,wins:detail.filter(d=>d.winner===1).length,
  npcWinRate:+(detail.filter(d=>d.winner===1).length*100/n).toFixed(1),
  avgLP:Math.round(sum('lp')/n),
  avgTurns:+(sum('turn')/n).toFixed(2),
  fusions:sum('fusions'),aces:sum('aces'),guardianHeals:sum('heals'),
  soulDrains:sum('drains'),attacks:sum('attacks'),
  branchChoices:sum('branchChoices'),publicReplies:sum('publicReplies'),
  rejectedSimBranches:sum('invalidActions'),
  byStyle:styles.map(s=>({style:s.name,
   wins:detail.filter(d=>d.style===s.name&&d.winner===1).length,
   games:detail.filter(d=>d.style===s.name).length}))};
}
const r={
 schema:'arcane-duel-stage-aware-engine-branches-v59',
 status:'offline-only',gameCode:'production runtime used for real actions',
 stageDecks:'40-card synthetic legal earlier-stage sources, no future or signature ACEs',
 playerStrategies:playerStyles.map(x=>x.name),deckVariants:variants,
 trainingSeedsPerStage:ntrain,holdoutSeedsPerStage:nhold,
 candidates:OPTIONS.map(x=>x.name),runAt:'2026-10-19',
 matches:0,holdoutMatches:0,trainMatches:0,
 entries:[],promotion:false,
 caveats:['Stage-source legality does not prove each card would have dropped in a real career.',
  'The training clones simulate one actual action and public-field replies; hidden draws are unknown.',
  'Two observed strategies for each deck do not replace manual career and human-play QA.',
  'Never enable a trained stage automatically without reliable independent validation.']
};
for(let tier=1;tier<=T;tier++){
 const profile=previous.profiles.find(x=>x.tier===tier);
 assert.ok(profile,'Missing previous learned weights for tier '+tier);
 const weights=profile.weights;
 const trainSeeds=Array.from({length:ntrain},(_,i)=>105811+tier*42013+i*1049);
 const testSeeds=Array.from({length:nhold},(_,i)=>905811+tier*51011+i*3529);
 const baselineTrain=suite(tier,weights,null,trainSeeds);
 const options=OPTIONS.map(x=>({name:x.name,params:x.params,
  training:suite(tier,weights,x.params,trainSeeds)}));
 const rank=options.map(x=>({
  ...x,fitness:(x.training.wins-baselineTrain.wins)*5000+
   (x.training.avgLP-baselineTrain.avgLP)+
   (x.training.aces-baselineTrain.aces)*6
 })).sort((a,b)=>b.fitness-a.fitness);
 const selected=rank[0];
 const baselineHold=suite(tier,weights,null,testSeeds);
 const resultHold=suite(tier,weights,selected.params,testSeeds);
 const deltaWins=resultHold.wins-baselineHold.wins;
 const deltaLP=resultHold.avgLP-baselineHold.avgLP;
 const aceGain=resultHold.aces-baselineHold.aces;
 const qualified=aceGain>=0&&
  (deltaWins>0||deltaWins===0&&deltaLP>75)&&
  resultHold.rejectedSimBranches<baselineHold.games*1.5;
 r.trainMatches+=baselineTrain.games+options.reduce((s,o)=>s+o.training.games,0);
 r.holdoutMatches+=baselineHold.games+resultHold.games;
 r.entries.push({tier,gameLevelCap:meta.opponents[tier-1].level,
  styleDecks:playerStyles.map(style=>({style:style.name,
   normal:constructed.get([tier,style.name,'normal'].join(':')).meta,
   invested:constructed.get([tier,style.name,'invested'].join(':')).meta})),
  trainedWeights:weights,trainingBaseline:baselineTrain,
  trainingCandidates:rank.map(x=>({name:x.name,fitness:x.fitness,
   wins:x.training.wins,avgLP:x.training.avgLP,aces:x.training.aces})),
  chosen:selected.name,chosenParams:selected.params,
  holdout:{baseline:baselineHold,candidate:resultHold,winGain:deltaWins,
   lpGain:deltaLP,aceGain,qualified},
  deployed:false});
 console.log('ARCANE_STAGE_V59_PROGRESS '+JSON.stringify({tier,
  trainingMatches:baselineTrain.games+options.reduce((s,o)=>s+o.training.games,0),
  selected:selected.name,holdoutWinGain:deltaWins,holdoutLPGain:deltaLP,
  simulationBranches:resultHold.branchChoices}));
}
r.matches=played;
r.holdoutWinGain=r.entries.reduce((v,x)=>v+x.holdout.winGain,0);
r.holdoutAverageLPGain=Math.round(r.entries.reduce((v,x)=>v+x.holdout.lpGain,0)/r.entries.length);
r.qualifiedTiers=r.entries.filter(x=>x.holdout.qualified).length;
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-stage-v59.json',JSON.stringify(r,null,2)+'\n');
console.log('ARCANE_STAGE_V59_SUMMARY '+JSON.stringify({
 matches:r.matches,trainingMatches:r.trainMatches,holdoutMatches:r.holdoutMatches,
 winGain:r.holdoutWinGain,avgLPGain:r.holdoutAverageLPGain,qualifiedTiers:r.qualifiedTiers,
 stages:r.entries.map(x=>({tier:x.tier,champion:x.chosen,winGain:x.holdout.winGain,
 lpGain:x.holdout.lpGain,aces:x.holdout.aceGain,pass:x.holdout.qualified}))}));
