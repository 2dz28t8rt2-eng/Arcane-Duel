/* Arcane Duel 7.5 – real (earned and reward-validated) career tier-VIII
 * holdout, with v7.3 "fusion-precision" frozen and compared against v5.7.
 * No invented decks / cards / levels. Neither boss policy is activated.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const earned=JSON.parse(fs.readFileSync('artifacts/ai-earned-stage-vii-v74.json','utf8'));
const snapshots=earned.legitimateVIIIProfiles||[];
if(!snapshots.length)throw Error('No actually unlocked VIII career; do NOT counterfeit VIII saves');
const policyNames=['balanced','offensive','guardian','economy'];
const vm=boot({seed:750251});
const old=JSON.parse(fs.readFileSync('docs/ai-evolved-weights-v57.json','utf8')).profiles
 .find(x=>x.tier===8)?.weights;
if(!old)throw Error('Missing original VIII trained weights');
const weights={
 'trained-v57':old,
 'frozen-fusion-precision':{
  ...old,
  quality:Math.min(15,Math.round(old.quality*4*100)/100),
  cost:Math.min(15,Math.round(old.cost*.65*100)/100),
  tempo:Math.min(15,Math.round(old.tempo*.7*100)/100),
  ace:old.ace
 }
};
const budget=Number(process.env.ARCANE_V75_HOLD_SEEDS||10);
if(!Number.isInteger(budget)||budget<6||budget>20)throw Error('Bad earned holdout seed count');
let duels=0;
function run(record,policy,config,seed,starter){
 const expr='(()=>{profile='+JSON.stringify(record.profile)+
 ';if(!profile.cleared.includes(7)||profile.cleared.includes(8))'+
 "throw Error('Must arrive through genuinely won VII');"+
 "if(mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||"+
 "inventoryError(profile.activeDeck,profile.inventory)||"+
 "inventoryError(profile.fusionDeck,profile.inventory))"+
 "throw Error('VIII player is using unowned cards');"+
 "validateProfile(JSON.parse(JSON.stringify(profile)));"+
 'ArcaneAiLearning56.setSandbox('+JSON.stringify(weights[config])+',true);'+
 'ArcaneAiLookahead58.setSandbox(null);ArcaneAiBranches59.setSandbox(null);'+
 "const g=createGame({id:'v75-earned-'+String("+seed+")+'-'+String("+starter+"),"+
 "mode:'pve',context:'tournament',opponentId:8,difficulty:'easy',"+
 'seed:'+seed+',starter:'+starter+','+
 "deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],"+
 "enhancements:profile.enhancements});"+
 "const ace=ACE_CARD_IDS[8];"+
 "if(!g.players[1].originalDeck.includes(ace)&&"+
 "!g.players[1].remainingFusion.includes(ace))"+
 "throw Error('VIII authentic boss signature ACE missing');"+
 "let aceSeen=false;const original=applyAiAction;"+
 "applyAiAction=function(b,a){const ok=original(b,a);"+
 "if(ok&&b===g)aceSeen=aceSeen||g.players[1].field.some(c=>c?.id===ace);return ok;};"+
 "let error=null,earnedIX=null;"+
 "try{simulateGame(g,"+JSON.stringify(policy)+",'balanced');"+
 "if(g.winner===0){if(!rewardMatch(g)||!profile.cleared.includes(8))"+
 "throw Error('Won VIII without real rewarded progression');"+
 "validateProfile(JSON.parse(JSON.stringify(profile)));"+
 "earnedIX=JSON.parse(JSON.stringify(profile));}}catch(e){error=String(e);}"+
 "applyAiAction=original;ArcaneAiLearning56.setSandbox(null);"+
 "return {error,winner:g.winner,aceSeen,npcMargin:g.players[1].lp-g.players[0].lp,"+
 "earnedIX,turns:g.turn};})()";
 const r=vm.run(expr,120000);duels++;
 if(r.error||![0,1].includes(r.winner))
  throw Error('Earned VIII duel failed '+r.error);
 return r;
}
const records=[];
for(let index=0;index<snapshots.length;index++){
 const snapshot=snapshots[index];
 for(const pilot of policyNames)for(let i=0;i<budget;i++)for(const starter of [0,1]){
  const seed=7513301+index*82721+policyNames.indexOf(pilot)*7431+i*19237;
  for(const config of Object.keys(weights)){
   records.push({source:index,career:snapshot.sourceCareer,seed,starter,pilot,
    config,...run(snapshot,pilot,config,seed,starter)});
  }
 }
}
const aggregate=config=>{
 const rows=records.filter(r=>r.config===config);
 return {games:rows.length,npcWins:rows.filter(r=>r.winner===1).length,
  playerWins:rows.filter(r=>r.winner===0).length,
  bossACEGames:rows.filter(r=>r.aceSeen).length,
  meanNPCMargin:Math.round(rows.reduce((a,r)=>a+r.npcMargin,0)/rows.length),
  byPilot:policyNames.map(pilot=>{
   const p=rows.filter(r=>r.pilot===pilot);
   return {pilot,playerWins:p.filter(r=>r.winner===0).length,games:p.length};
  })
 };
};
const baseline=aggregate('trained-v57'),experimental=aggregate('frozen-fusion-precision');
const earnedIX=records.filter(x=>x.earnedIX).slice(0,8).map(x=>({
 originCareer:x.career,originSnapshot:x.source,seed:x.seed,pilot:x.pilot,
 config:x.config,profile:x.earnedIX}));
const winGain=experimental.npcWins-baseline.npcWins;
const marginGain=experimental.meanNPCMargin-baseline.meanNPCMargin;
const independentOrigins=new Set(snapshots.map(x=>x.sourceCareer)).size;
const suitable=independentOrigins>=4&&experimental.playerWins>=Math.ceil(experimental.games*.2)&&
 experimental.bossACEGames>=baseline.bossACEGames&&winGain>=3&&marginGain>=0;
// Distinguish rare tactical unlocks from cards genuinely obtained.
const catalogue=vm.run('CARDS.map(c=>c?({id:c.id,level:c.level,role:c.role,source:c.source,fusion:c.fusionOnly}):null)');
const inventoryAudit=snapshots.map((x,index)=>{
 const p=x.profile,main=p.activeDeck;
 const stats=main.map(id=>catalogue[id]).filter(Boolean);
 const high=stats.filter(c=>c.level>=7);
 const newIds=Array.from({length:16},(_,i)=>716+i);
 const acquired=newIds.filter(id=>(p.inventory[id]||0)>0);
 return {index,originCareer:x.sourceCareer,cleared:[...p.cleared],
  playerCoins:p.coins,mainDeckSize:main.length,
  maxNormalLevel:Math.max(...stats.map(c=>c.level)),
  totalHighLevelNormalCopies:high.length,
  uniqueHighLevelNormals:new Set(high.map(c=>c.id)).size,
  newLategameCardsOwned:acquired.map(id=>({id,copies:p.inventory[id]})),
  newLategameCopiesEquipped:main.filter(id=>newIds.includes(id)).length,
  distinctMain:new Set(main).size,
  distinctFusion:new Set(p.fusionDeck).size};
});
const report={schema:'real-earned-tier8-balance-check-v75',
 inventoryAudit,
 genuineEarnedVIIIProfiles:snapshots.length,independentOriginalCareers:independentOrigins,
 seedFamily:'7513301-third-party-holdout',seedCount:budget,
 playerPilots:policyNames,
 oldWeights:weights['trained-v57'],frozenWeights:weights['frozen-fusion-precision'],
 baseline,experimental,winGain,marginGain,
 earnedIX,reallyEarnedIXCount:earnedIX.length,
 eligibleForLiveDeployment:suitable,
 noRewardOrCardGifts:true,totalMatches:duels,
 limitations:['Only earned VIII snapshots; if based on one original career, they are correlated.',
  'Player controllers are scripted and are not human-skilled.',
  'No AI tuning on this holdout, the fusion candidate was frozen in v7.3.',
  'The experimental model is not live without an additional actual career balance gate.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-earned-VIII-fairness-v75.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_EARNED_VIII_FAIRNESS_V75 '+JSON.stringify({
 genuineEarnedVIIIProfiles:snapshots.length,independentOriginalCareers:independentOrigins,
 matches:duels,inventoryAudit,baseline,experimental,winGain,marginGain,
 realIXUnlocks:earnedIX.length,suitable}));
