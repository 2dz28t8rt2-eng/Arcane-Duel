/* Arcane Duel 6.9 – initial opponent-VII AI tests using a REAL earned
 * tournament-VI win and its actual rewardMatch-updated profile.
 * No fabricated cards, progress, coins or prior-boss victories.
 * Only one earned profile is available; this cannot justify promotion.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const earned=JSON.parse(fs.readFileSync('artifacts/ai-pilot-stage-vi-v68.json','utf8'));
const profiles=earned.legitimateVIIProfiles;
if(!profiles?.length)throw Error('No truly unlocked VII profile; refusing fake test');
const trained=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles;
const baseWeights=trained.find(x=>x.tier===7)?.weights;
if(!baseWeights)throw Error('No existing tier VII model');
const ntrain=Number(process.env.ARCANE_VII_TRAIN_SEEDS||5),
 nhold=Number(process.env.ARCANE_VII_HOLDOUT_SEEDS||12);
if(!Number.isInteger(ntrain)||ntrain<3||ntrain>10||
 !Number.isInteger(nhold)||nhold<5||nhold>18)
 throw Error('Invalid VII evaluation samples');
const options=[
 {name:'existing',param:null,guard:null},
 {name:'gated-field',param:{material:.7,board:2.15,tempo:.9,risk:1.3,support:.8,future:.65,ace:10},
  guard:{guarded:true,margin:3}},
 {name:'gated-survival',param:{material:1.25,board:1.15,tempo:.5,risk:2.4,support:1.9,future:1.5,ace:10},
  guard:{guarded:true,margin:3}},
 {name:'gated-balanced',param:{material:.8,board:1.45,tempo:1.1,risk:1.2,support:1.1,future:.6,ace:10},
  guard:{guarded:true,margin:5}}
];
const styles=['balanced','guardian','offensive','economy'];
const vm=boot({seed:691901});
let games=0;
function duel(record,method,seed,starter,style){
 const expr=`(()=>{
   profile=${JSON.stringify(record.profile)};
   if(!profile.cleared.includes(6)||profile.cleared.includes(7)||
    mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||
    inventoryError(profile.activeDeck,profile.inventory)||
    inventoryError(profile.fusionDeck,profile.inventory))
    throw Error('Tier VII inventory not really earned or illegal');
   ArcaneAiLearning56.setSandbox(${JSON.stringify(baseWeights)},true);
   ArcaneAiLookahead58.setSandbox(null);
   ArcaneAiBranches59.setSandbox(${JSON.stringify(method.param)},${!!method.param},
    ${JSON.stringify(method.guard)});
   const g=createGame({mode:'pve',context:'tournament',opponentId:7,
    starter:${starter},seed:${seed},difficulty:'easy',
    id:'real-stage7-v69-${seed}-${starter}',
    deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],
    enhancements:profile.enhancements});
   const aceId=ACE_CARD_IDS[7],npc=g.players[1];
   const ownsAce=npc.originalDeck.includes(aceId)||npc.remainingFusion.includes(aceId);
   if(!ownsAce)throw Error('Real boss VII has no signature ACE');
   const confirmed=new Set(),prior=applyAiAction;
   applyAiAction=function(battle,action){
    const accepted=prior(battle,action);
    if(accepted&&battle===g)for(const card of battle.players[1].field)
     if(card?.id===aceId)confirmed.add(card.uid);
    return accepted;
   };
   let error=null;try{simulateGame(g,'${style}','balanced');}catch(e){error=String(e);}
   applyAiAction=prior;
   const branches=ArcaneAiBranches59.stats();
   ArcaneAiBranches59.setSandbox(null);ArcaneAiLearning56.setSandbox(null);
   return {winner:g.winner,error,turns:g.turn,
    npcMargin:g.players[1].lp-g.players[0].lp,
    confirmedAces:confirmed.size,ownsAce,
    simBranches:branches.evaluated};
 })()`;
 const result=vm.run(expr,120000);games++;
 if(result.error||![0,1].includes(result.winner)||!result.ownsAce)
  throw Error('VII simulation error: '+result.error);
 return result;
}
function suite(method,seeds,phase){
 const result=[];
 for(let career=0;career<profiles.length;career++)for(const style of styles)
  for(let i=0;i<seeds;i++)for(const starter of [0,1]){
   const record=profiles[career];
   const seed=(phase==='train'?7901311:9912717)+career*87119+
    styles.indexOf(style)*5321+i*17903;
   result.push({career,style,starter,...duel(record,method,seed,starter,style)});
  }
 const n=result.length;
 const sum=k=>result.reduce((a,r)=>a+r[k],0);
 return {games:n,npcWins:result.filter(x=>x.winner===1).length,
  meanNpcLP:Math.round(sum('npcMargin')/n),
  trueAceSummons:sum('confirmedAces'),
  gamesWithAce:result.filter(x=>x.confirmedAces>0).length,
  actionBranches:sum('simBranches'),
  playerWins:result.filter(x=>x.winner===0).length,
  byStyle:styles.map(style=>({style,wins:result.filter(x=>x.style===style&&x.winner===1).length,
   games:result.filter(x=>x.style===style).length}))};
}
const baselineTrain=suite(options[0],ntrain,'train');
const ranked=options.slice(1).map(o=>({name:o.name,method:o,
 metrics:suite(o,ntrain,'train')})).map(x=>({...x,fitness:
 (x.metrics.npcWins-baselineTrain.npcWins)*5000+
 (x.metrics.meanNpcLP-baselineTrain.meanNpcLP)})).sort((a,b)=>b.fitness-a.fitness);
const selected=ranked[0].fitness>0?ranked[0].method:options[0];
const baseline=suite(options[0],nhold,'hold');
const challenger=selected===options[0]?baseline:suite(selected,nhold,'hold');
const winGain=challenger.npcWins-baseline.npcWins;
const lpGain=challenger.meanNpcLP-baseline.meanNpcLP;
const qualifies=profiles.length>=3&&winGain>=3&&lpGain>=0&&
 challenger.gamesWithAce>=baseline.gamesWithAce;
const report={schema:'arcane-genuine-tier7-first-ai-tests-v69',
 earnedVIIProfiles:profiles.length,profileOrigins:profiles.map(p=>({
 sourceCareer:p.sourceCareer,sourceVISeed:p.seed,earnedBy:p.arm})),
 baseline:'trained-v57',selectionBeforeHoldout:selected.name,
 trainSeeds:ntrain,holdoutSeeds:nhold,
 trainingBaseline:baselineTrain,
 candidates:ranked.map(x=>({name:x.name,fitness:x.fitness,metrics:x.metrics})),
 holdout:{baseline,challenger,winGain,lpGain,qualifies},
 totalDuels:games,
 noAutoDeploy:true,
 caveats:['Only one real earned tier-VII profile exists: NOT representative.',
  'The player policies are scripted, not human skill models.',
  'No train/holdout seed overlap; but deck inventory diversity is insufficient for production.',
  'Boss signature ACE owned and observed, confirmed summons tracked.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-earned-stage-vii-v69.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_EARNED_VII_SUMMARY_V69 '+JSON.stringify({
 duels:games,earnedInventories:profiles.length,selected:selected.name,
 baselineNpcWins:baseline.npcWins,challengerNpcWins:challenger.npcWins,
 baselineAceGames:baseline.gamesWithAce,candidateAceGames:challenger.gamesWithAce,
 winGain,lpGain,qualifies}));
