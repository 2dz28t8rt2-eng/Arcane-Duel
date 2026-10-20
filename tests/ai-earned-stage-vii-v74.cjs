/* Arcane Duel v7.4: learn genuine VII player policies after legitimately rewarded VI farming.
 * Each candidate controls the SAME level-VI legal career inventory.
 * After the battle, only real rewardMatch can unlock VII, never profile edits.
 * Training and holdout draws use separate seeds; no live AI overrides.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const src=JSON.parse(fs.readFileSync('artifacts/ai-pilot-stage-vi-v68.json','utf8'));
const origins=Array.from(new Map((src.legitimateVIIProfiles||[])
 .map(x=>[x.sourceCareer+':'+x.seed+':'+x.starter,x])).values());
if(origins.length<1)throw Error('No real rewarded win over VI; cannot invent VII progress');
const train=Number(process.env.ARCANE_V74_TRAIN_SEEDS||4),
 hold=Number(process.env.ARCANE_V74_HOLD_SEEDS||9);
if(!Number.isInteger(train)||train<3||train>20||
 !Number.isInteger(hold)||hold<5||hold>30)
 throw Error('Bad pilot seed budget');
const options=['balanced','offensive','guardian','economy'],runtime=boot({seed:740707});
const {soulBridgeCode}=require('./helpers/earned-soul-bridge-v67.cjs');

const farmBudgets=[0,8,20],tiers=[],preparations=[];
for(const initial of origins)for(const farm of farmBudgets){
 const expr='(()=>{profile='+JSON.stringify(initial.profile)+
 ';const farm='+farm+`;
 let wins=0,boosters=0,crafts=0,upgrades=0;
 const before=profile.coins;
 function legal(){
  if(mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||
   inventoryError(profile.activeDeck,profile.inventory)||
   inventoryError(profile.fusionDeck,profile.inventory))
   throw Error('Unowned deck in earned career');
  validateProfile(JSON.parse(JSON.stringify(profile)));
 }
 legal();
 for(let i=0;i<farm;i++){
  const g=createGame({id:'v74-rewarded-VI-'+farm+'-'+i,mode:'pve',context:'free',opponentId:6,
   seed:740123+i*9413+farm*3181,starter:i%2,difficulty:'easy',
   deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],
   enhancements:profile.enhancements});
  simulateGame(g,'balanced','balanced');
  if(![0,1].includes(g.winner))throw Error('Unfinished VI farm');
  if(!rewardMatch(g))throw Error('Real free-duel VI reward missing');
  wins+=Number(g.winner===0);
  for(let t=0;t<20&&profile.rewardQueue.length;t++){
   const q=profile.rewardQueue[0],
    choice=q.cards?.length?[...q.cards].sort((a,b)=>
      (CARDS[b].atk+CARDS[b].def)-(CARDS[a].atk+CARDS[a].def))[0]:undefined;
   if(!finishMilestone(q.kind==='choice'?choice:undefined))
    throw Error('Milestone choice invalid');
  }
  if(profile.rewardQueue.length)throw Error('Pending milestone');
  if(i%3===2&&profile.coins>=boosterPrice(6,5)+100&&buyBooster(5))boosters++;
  for(let source=6;source>=4;source--){
   if(profile.packs[packKey(source,'easy')]>0&&openCharacterPack(source,'easy')){
    const best=profile.openPack.cards.map((id,index)=>({id,index}))
     .sort((a,b)=>CARDS[b.id].level-CARDS[a.id].level||
      CARDS[b.id].atk+CARDS[b.id].def-CARDS[a.id].atk-CARDS[a.id].def)[0];
    if(best&&!takePackCard(best.index))throw Error('Pack selection invalid');
    closeCharacterPack();
   }
  }
  if(i%4===3&&sharedShards()>=SHARD_CRAFT_COST){
   const pool=CARDS.filter(c=>c.rpg&&!c.retired&&!c.hard&&!c.ace&&
    !c.essenceMonster&&!c.workshopOnly&&c.source<=6&&c.level<=10&&
    cardAvailable(c.id)&&profile.coins>=cardCost(c.id)+100)
    .sort((a,b)=>b.level-a.level||b.atk+b.def-a.atk-a.def);
   if(pool.length&&craftCard(pool[0].id))crafts++;
  }
  if(i%5===4&&profile.upgrades.power<UPGRADES.power.max&&
   profile.coins>=upgradeCost('power')+150&&buyUpgrade('power'))upgrades++;
  equipBest();
  (function(){__BRIDGE_CODE__})();
  legal();
 }
 return {profile:JSON.parse(JSON.stringify(profile)),farm,wins,boosters,crafts,
  upgrades,before,after:profile.coins};
 })()`;
 const actual=expr.replace('__BRIDGE_CODE__',soulBridgeCode);
 const result=runtime.run(actual,300000);
 const s={...initial,profile:result.profile,farm};
 tiers.push(s);
 preparations.push({career:s.sourceCareer,farm,wins:result.wins,boosters:result.boosters,
  crafts:result.crafts,upgrades:result.upgrades,before:result.before,after:result.after});
}

let games=0,goodProfiles=0;
function match(s,policy,seed,starter,recordPromotion=false){
 const code=`(()=>{
  profile=${JSON.stringify(s.profile)};
  const player=profile.activeDeck,fusion=profile.fusionDeck;
  const legal=(deck)=>!inventoryError(deck,profile.inventory);
  if(!profile.cleared.includes(6)||profile.cleared.includes(7)||
   mainDeckError(player)||fusionDeckError(fusion)||!legal(player)||!legal(fusion))
   throw Error('Invalid stage VI arrival snapshot');
  const g=createGame({mode:'pve',context:'tournament',opponentId:7,
   id:'pilot-v74-${seed}-${starter}',seed:${seed},starter:${starter},
   deck:[...player],fusionDeck:[...fusion],enhancements:profile.enhancements,
   difficulty:'easy'});
  let error=null,legitimate=false,accepted=false;
  try{
   simulateGame(g,'${policy}','balanced');
   if(g.winner===0){
    // Only a REAL won match + the normal economy can unlock the next stage.
    const reward=rewardMatch(g);
    accepted=!!reward;
    legitimate=accepted&&profile.cleared.includes(7)&&
     !!validateProfile(JSON.parse(JSON.stringify(profile)));
   }
  }catch(e){error=String(e);}
  return {winner:g.winner,turns:g.turn,
   playerMinusNpcLP:g.players[0].lp-g.players[1].lp,
   reachedVIII:legitimate,rewarded:accepted,
   stageVIII:legitimate&&${recordPromotion}?JSON.parse(JSON.stringify(profile)):null,
   error};
 })()`;
 const row=runtime.run(code,120000);games++;
 if(row.error||![0,1].includes(row.winner)||row.winner===0&&!row.reachedVIII)
  throw Error('Actual stage VII replay failed: '+row.error);
 return row;
}
function evaluate(policyMode,seeds,phase,promote=false){
 const rows=[];
 for(const s of tiers)for(let i=0;i<seeds;i++){
  const seed=(phase==='train'?7427913:9831421)+s.sourceCareer*12071+s.farm*15773+i*13331;
  for(const starter of [0,1]){
   const policy=policyMode==='original'?s.policy:policyMode;
   const result=match(s,policy,seed,starter,promote);
   rows.push({careerId:s.sourceCareer,farm:s.farm,seed,starter,policy,...result});
  }
 }
 const count=rows.length,wins=rows.filter(x=>x.winner===0).length;
 const avgLP=Math.round(rows.reduce((s,r)=>s+r.playerMinusNpcLP,0)/count);
 return {games:count,playerWins:wins,avgLP,
  legitimateStageVIIIWins:rows.filter(x=>x.reachedVIII).length,
  perCareer:tiers.map(s=>({careerId:s.sourceCareer,farm:s.farm,original:s.policy,
   wins:rows.filter(x=>x.careerId===s.sourceCareer&&x.farm===s.farm&&x.winner===0).length,
   games:rows.filter(x=>x.careerId===s.sourceCareer&&x.farm===s.farm).length})),
  stageVIIISnapshots:promote?rows.filter(x=>x.stageVIII).slice(0,16).map(r=>({
   sourceCareer:r.careerId,seed:r.seed,starter:r.starter,
   policy:r.policy,profile:r.stageVIII})):[]
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
const report={schema:'real-earned-stage-vii-player-and-economy-v74',
 realEarnedInventories:origins.length,policyCandidates:options,
 trainPerInventory:train,holdPerInventory:hold,
 selectedBeforeHoldout:chosen,trainingBaseline:baselineTrain,
 rankedTraining:ranked.map(r=>({style:r.style,score:r.fitness,
  wins:r.training.playerWins,avgLP:r.training.avgLP})),
 holdout:{baseline:base,candidate,winGain,lpGain,qualified},
 legitimateVIIIProfiles:[],
 totalEngineMatches:games,noGiftedCardsOrWins:true,
 productionTurnierAiUnchanged:true};
const promoted=[...base.stageVIIISnapshots.map(s=>({...s,arm:'baseline'})),
 ...candidate.stageVIIISnapshots.map(s=>({...s,arm:'candidate'}))];
report.legitimateVIIIProfiles=promoted;
report.preparations=preparations;
report.farmBudgets=farmBudgets;
report.genuinelyEarnedVIIOrigins=origins.length;
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-earned-stage-vii-v74.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_EARNED_STAGE_VII_V74 '+JSON.stringify({
 matches:games,earnedInventories:origins.length,preparedVII:tiers.length,preparations,chosen,baselineTrainWins:baselineTrain.playerWins,
 candidateTrainWins:ranked[0].training.playerWins,
 baselineHoldoutWins:base.playerWins,candidateHoldoutWins:candidate.playerWins,
 additionalHoldoutWins:winGain,lpGain,qualified,
 legitPromotedVIII:promoted.length,
 uniqueSuccessfulSeeds:new Set(promoted.map(x=>x.seed)).size}));
