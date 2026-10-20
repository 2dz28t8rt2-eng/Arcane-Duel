/* Arcane Duel v6.8: learn effective pilot policy on actually earned VI-decks.
 * Each candidate controls the SAME level-VI legal career inventory.
 * After the battle, only real rewardMatch can unlock VII, never profile edits.
 * Training and holdout draws use separate seeds; no live AI overrides.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const src=JSON.parse(fs.readFileSync('artifacts/ai-career-soul-bridge-v67.json','utf8'));
const tiers=src.entries.filter(x=>x.arm==='soul-bridge'&&x.tier===6);
if(tiers.length<2)throw Error('No genuine earned opponent-VI inventories');
const train=Number(process.env.ARCANE_PILOT_TRAIN_SEEDS||8),
 hold=Number(process.env.ARCANE_PILOT_HOLDOUT_SEEDS||18);
if(!Number.isInteger(train)||train<3||train>20||
 !Number.isInteger(hold)||hold<5||hold>30)
 throw Error('Bad pilot seed budget');
const options=['balanced','offensive','guardian','economy'],runtime=boot({seed:680707});
let games=0,goodProfiles=0;
function match(s,policy,seed,starter,recordPromotion=false){
 const code=`(()=>{
  profile=${JSON.stringify(s.profile)};
  const player=profile.activeDeck,fusion=profile.fusionDeck;
  const legal=(deck)=>!inventoryError(deck,profile.inventory);
  if(!profile.cleared.includes(5)||profile.cleared.includes(6)||
   mainDeckError(player)||fusionDeckError(fusion)||!legal(player)||!legal(fusion))
   throw Error('Invalid stage VI arrival snapshot');
  const g=createGame({mode:'pve',context:'tournament',opponentId:6,
   id:'pilot-v68-${seed}-${starter}',seed:${seed},starter:${starter},
   deck:[...player],fusionDeck:[...fusion],enhancements:profile.enhancements,
   difficulty:'easy'});
  let error=null,legitimate=false,accepted=false;
  try{
   simulateGame(g,'${policy}','balanced');
   if(g.winner===0){
    // Only a REAL won match + the normal economy can unlock the next stage.
    const reward=rewardMatch(g);
    accepted=!!reward;
    legitimate=accepted&&profile.cleared.includes(6)&&
     !!validateProfile(JSON.parse(JSON.stringify(profile)));
   }
  }catch(e){error=String(e);}
  return {winner:g.winner,turns:g.turn,
   playerMinusNpcLP:g.players[0].lp-g.players[1].lp,
   reachedVII:legitimate,rewarded:accepted,
   stageVII:legitimate&&${recordPromotion}?JSON.parse(JSON.stringify(profile)):null,
   error};
 })()`;
 const row=runtime.run(code,120000);games++;
 if(row.error||![0,1].includes(row.winner)||row.winner===0&&!row.reachedVII)
  throw Error('Actual stage VI replay failed: '+row.error);
 return row;
}
function evaluate(policyMode,seeds,phase,promote=false){
 const rows=[];
 for(const s of tiers)for(let i=0;i<seeds;i++){
  const seed=(phase==='train'?4817913:9731421)+s.careerId*12071+i*13331;
  for(const starter of [0,1]){
   const policy=policyMode==='original'?s.policy:policyMode;
   const result=match(s,policy,seed,starter,promote);
   rows.push({careerId:s.careerId,seed,starter,policy,...result});
  }
 }
 const count=rows.length,wins=rows.filter(x=>x.winner===0).length;
 const avgLP=Math.round(rows.reduce((s,r)=>s+r.playerMinusNpcLP,0)/count);
 return {games:count,playerWins:wins,avgLP,
  legitimateStageVIIWins:rows.filter(x=>x.reachedVII).length,
  perCareer:tiers.map(s=>({careerId:s.careerId,original:s.policy,
   wins:rows.filter(x=>x.careerId===s.careerId&&x.winner===0).length,
   games:rows.filter(x=>x.careerId===s.careerId).length})),
  stageVIISnapshots:promote?rows.filter(x=>x.stageVII).slice(0,8).map(r=>({
   sourceCareer:r.careerId,seed:r.seed,starter:r.starter,
   policy:r.policy,profile:r.stageVII})):[]
 };
}
const baselineTrain=evaluate('original',train,'train');
const search=options.map(style=>({style,
 training:evaluate(style,train,'train')}));
const ranked=search.map(r=>({...r,fitness:
 (r.training.playerWins-baselineTrain.playerWins)*5000+
 r.training.avgLP-baselineTrain.avgLP})).sort((a,b)=>b.fitness-a.fitness);
const chosen=ranked[0].fitness>0?ranked[0].style:'original';
const base=evaluate('original',hold,'hold',true);
const candidate=chosen==='original'?base:evaluate(chosen,hold,'hold',true);
const winGain=candidate.playerWins-base.playerWins;
const lpGain=candidate.avgLP-base.avgLP;
const qualified=chosen!=='original'&&winGain>=4&&lpGain>=0;
const report={schema:'real-owned-career-stage-vi-pilot-training-v68',
 realEarnedInventories:tiers.length,policyCandidates:options,
 trainPerInventory:train,holdPerInventory:hold,
 selectedBeforeHoldout:chosen,trainingBaseline:baselineTrain,
 rankedTraining:ranked.map(r=>({style:r.style,score:r.fitness,
  wins:r.training.playerWins,avgLP:r.training.avgLP})),
 holdout:{baseline:base,candidate,winGain,lpGain,qualified},
 legitimateVIIProfiles:[],
 totalEngineMatches:games,noGiftedCardsOrWins:true,
 productionTurnierAiUnchanged:true};
const promoted=[...base.stageVIISnapshots.map(s=>({...s,arm:'baseline'})),
 ...candidate.stageVIISnapshots.map(s=>({...s,arm:'candidate'}))];
report.legitimateVIIProfiles=promoted;
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-pilot-stage-vi-v68.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_PILOT_STAGE_VI_V68 '+JSON.stringify({
 matches:games,earnedInventories:tiers.length,chosen,baselineTrainWins:baselineTrain.playerWins,
 candidateTrainWins:ranked[0].training.playerWins,
 baselineHoldoutWins:base.playerWins,candidateHoldoutWins:candidate.playerWins,
 additionalHoldoutWins:winGain,lpGain,qualified,
 legitPromotedVII:promoted.length,
 uniqueSuccessfulSeeds:new Set(promoted.map(x=>x.seed)).size}));
