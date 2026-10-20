(function runTraining(){
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const source=JSON.parse(fs.readFileSync('artifacts/ai-earned-preiv-v93.json','utf8'));
const n=Number(process.env.ARCANE_V93_CAREERS||32),repeats=Number(process.env.ARCANE_V93_MATCH_SEEDS||2);
assert.ok(Number.isInteger(n)&&n>=24&&n<=40&&n%2===0);
assert.ok(Number.isInteger(repeats)&&repeats>=1&&repeats<=4);
assert.equal(source.entries.length,n);
const arms=['baseline','tempo-board'];
const vm=boot({seed:930611}),results=[];let games=0;
function fight(career,variant,seed,starter){
 const script=`(()=>{
  profile=${JSON.stringify(career.profile)};
  const original=JSON.stringify(profile),variant=${JSON.stringify(variant)},policy=${JSON.stringify(career.policy)};
  if(mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||
   inventoryError(profile.activeDeck,profile.inventory)||
   inventoryError(profile.fusionDeck,profile.inventory))
    throw Error('v9.3 source deck illegally held');
  const g=createGame({mode:'pve',context:'tournament',opponentId:4,
   id:'v93-${seed}-${starter}-${variant}',seed:${seed},starter:${starter},
   deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],
   enhancements:profile.enhancements,difficulty:'easy'});
  const stats={ownTurns:0,summonObservations:0,noNormalHand:0,
   normalOffered:0,legalFusionOffers:0,fusionAvailableTurns:0,
   freeSlotObservations:0,fullBoardObservations:0,enemyAheadAtSummon:0,
   attackerOnBoardAtSummon:0,policyNormalChoices:0,policyFusionChoices:0,
   fusionMaterialsChosen:0,fusionTargetAtkSum:0,normalAttempts:0,
   fusionAttempts:0,placements:0,failedActions:0,
   peakPlacedAtk:0,canBeatEnemyAtPlace:0,firstAttackTurn:null,attacks:0,
   cardsDestroyed:0,damageNpc:0,damageSelf:0,
   ownPeakAtStart:0,enemyPeakAtStart:0};
  const previousChoose=chooseAiAction,previousApply=applyAiAction,seen=new Set();
  chooseAiAction=function(game,requested){
   if(game!==g||game.active!==0)return previousChoose(game,requested);
   const p=game.players[0],enemy=game.players[1];
   if(game.aiPhase==='summon'&&!seen.has(game.turn)){
    seen.add(game.turn);stats.ownTurns++;
    const own=Math.max(0,...p.field.filter(Boolean).map(c=>dataOf(c).atk));
    const foe=Math.max(0,...enemy.field.filter(Boolean).map(c=>dataOf(c).atk));
    stats.ownPeakAtStart+=own;stats.enemyPeakAtStart+=foe;
   }
   const action=(${summonPolicySource})(game,variant,stats);
   return action||previousChoose(game,requested);
  };
  applyAiAction=function(game,action){
   if(game!==g||game.active!==0)return previousApply(game,action);
   const enemy=game.players[1],self=game.players[0],
    e0=enemy.field.filter(Boolean).length,l0=enemy.lp,s0=self.lp;
   const kind=action.type;
   if(kind==='normal')stats.normalAttempts++;
   if(kind==='fusion')stats.fusionAttempts++;
   const result=previousApply(game,action);
   if(!result){stats.failedActions++;return result;}
   if(kind==='place'){
    stats.placements++;
    const picked=self.field[action.idx];
    if(picked){
     const power=dataOf(picked).atk;
     stats.peakPlacedAtk=Math.max(stats.peakPlacedAtk,power);
     const block=Math.max(0,...enemy.field.filter(Boolean).map(c=>
       c.mode==='def'?dataOf(c).def:dataOf(c).atk));
     if(power>block)stats.canBeatEnemyAtPlace++;
    }
   }
   if(kind==='attack'){
    stats.attacks++;
    if(stats.firstAttackTurn===null)stats.firstAttackTurn=game.turn;
    stats.cardsDestroyed+=Math.max(0,e0-enemy.field.filter(Boolean).length);
    stats.damageNpc+=Math.max(0,l0-enemy.lp);
    stats.damageSelf+=Math.max(0,s0-self.lp);
   }
   return result;
  };
  try{simulateGame(g,policy,'balanced');}
  finally{chooseAiAction=previousChoose;applyAiAction=previousApply;}
  if(g.winner===null||stats.failedActions)
   throw Error('v9.3 bad game or illegal action: '+stats.failedActions);
  if(JSON.stringify(profile)!==original)throw Error('v9.3 test changed earned player save');
  return {won:g.winner===0,lpDiff:g.players[0].lp-g.players[1].lp,
   fusions:Number(g.totalFusions?.[0]||0),stats};
 })()`;
 const value=vm.run(script,180000);games++;return value;
}
for(const c of source.entries){
 const variants={};
 for(const arm of arms){
  const runs=[];
  for(let k=0;k<repeats;k++)for(const starter of [0,1]){
   const seed=(9341711+c.careerId*16673+k*1327+starter*419)>>>0;
   runs.push(fight(c,arm,seed,starter));
  }
  const sum=key=>runs.reduce((acc,row)=>acc+row.stats[key],0);
  variants[arm]={games:runs.length,wins:runs.filter(x=>x.won).length,
   avgLP:+(runs.reduce((a,x)=>a+x.lpDiff,0)/runs.length).toFixed(2),
   fusions:runs.reduce((a,x)=>a+x.fusions,0),attacks:sum('attacks'),
   cardsDestroyed:sum('cardsDestroyed'),damageNpc:sum('damageNpc'),
   normalAttempts:sum('normalAttempts'),fusionAttempts:sum('fusionAttempts'),
   placements:sum('placements'),fusionOffers:sum('legalFusionOffers'),
   fusionAvailableTurns:sum('fusionAvailableTurns'),
   ownTurns:sum('ownTurns'),noNormalHand:sum('noNormalHand'),
   fullBoard:sum('fullBoardObservations'),freeSlot:sum('freeSlotObservations'),
   enemyAhead:sum('enemyAheadAtSummon'),
   policyNormalChoices:sum('policyNormalChoices'),policyFusionChoices:sum('policyFusionChoices'),
   canBeatEnemyAtPlace:sum('canBeatEnemyAtPlace'),
   peakPlacedAtkMean:+(runs.reduce((acc,x)=>acc+x.stats.peakPlacedAtk,0)/runs.length).toFixed(2),
   firstAttackMatches:runs.filter(x=>x.stats.firstAttackTurn!==null).length};
 }
 results.push({careerId:c.careerId,policy:c.policy,variants});
 console.log('ARCANE_V93_ORIGIN '+JSON.stringify({careerId:c.careerId,
  wins:Object.fromEntries(arms.map(a=>[a,variants[a].wins])),
  attacks:Object.fromEntries(arms.map(a=>[a,variants[a].attacks]))}));
}
const mid=n/2,train=results.slice(0,mid),holdout=results.slice(mid);
function summary(items){
 return Object.fromEntries(arms.map(a=>{
  const rows=items.map(x=>x.variants[a]),total=k=>rows.reduce((s,r)=>s+r[k],0);
  return [a,{origins:items.length,games:total('games'),wins:total('wins'),
   avgLP:+(rows.reduce((s,r)=>s+r.avgLP,0)/items.length).toFixed(1),
   attacks:total('attacks'),damageNpc:total('damageNpc'),
   destroyed:total('cardsDestroyed'),fusions:total('fusions'),
   ownTurns:total('ownTurns'),noNormalHand:total('noNormalHand'),
   fullBoard:total('fullBoard'),freeSlot:total('freeSlot'),
   fusionOffers:total('fusionOffers'),fusionAvailableTurns:total('fusionAvailableTurns'),
   normalAttempts:total('normalAttempts'),fusionAttempts:total('fusionAttempts'),
   policyNormals:total('policyNormalChoices'),policyFusions:total('policyFusionChoices'),
   enemyAhead:total('enemyAhead'),canBeatEnemyAtPlace:total('canBeatEnemyAtPlace'),
   peakPlacedAtkMean:+(rows.reduce((s,r)=>s+r.peakPlacedAtkMean,0)/items.length).toFixed(1),
   matchesWithAttack:total('firstAttackMatches')}];
 }));
}
function paired(rows,arm){
 const delta=rows.map(r=>r.variants[arm].wins-r.variants.baseline.wins),
 lp=rows.map(r=>r.variants[arm].avgLP-r.variants.baseline.avgLP);
 return {winsDelta:delta.reduce((a,b)=>a+b,0),
  better:delta.filter(x=>x>0).length,equal:delta.filter(x=>x===0).length,
  worse:delta.filter(x=>x<0).length,
  avgLPDelta:+(lp.reduce((a,b)=>a+b,0)/rows.length).toFixed(1)};
}
const ranked=arms.filter(a=>a!=='baseline').map(arm=>({arm,...paired(train,arm)}))
 .sort((a,b)=>b.winsDelta-a.winsDelta||b.avgLPDelta-a.avgLPDelta);
const first=ranked[0],selected=first.winsDelta>0||
 first.winsDelta===0&&first.avgLPDelta>0?first.arm:'baseline';
const holdoutPairs=Object.fromEntries(arms.filter(a=>a!=='baseline')
 .map(arm=>[arm,paired(holdout,arm)]));
const qualified=selected==='tempo-board'&&
 paired(train,'tempo-board').winsDelta>=0&&
 holdoutPairs['tempo-board'].winsDelta>=3&&
 holdoutPairs['tempo-board'].better>holdoutPairs['tempo-board'].worse;
const report={schema:'arcane-pre-registered-tempo-board-validation-v93',
 seedOffset:source.careerSeedOffset,sourceCareerMatches:source.earnedMatches,
 sourceCareerIVWins:source.completedIV,independentOrigins:n,
 trainOrigins:mid,holdoutOrigins:mid,diagnosticGames:games,
 arms,training:summary(train),holdout:summary(holdout),
 rankedTraining:ranked,selectedByTraining:selected,holdoutPairs,qualified,
 originResults:results,
 limitations:['All source cards and currencies were earned legally in real career games.',
 'No rewardMatch occurs in the controlled diagnostic games.',
 'Only player-side match choices were changed; no live NPC AI or game logic modified.',
 'Hands are searched for two to five materials using actual owned template and engine legality checks.',
 'Enemy hand/deck is not inspected by candidate scoring.',
 'Field placement and in-play fusion are resolved by the unchanged game engine.',
 'Statistical independent units are source careers, not repeated matched duels.',
 'Only boss IV was tested; complete new career IV/VI follow-up required for rollout.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-pre-attack-v93.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V93_SUMMARY '+JSON.stringify({
 origins:n,sourceCareerMatches:source.earnedMatches,
 sourceCareerIVWins:source.completedIV,diagnosticGames:games,
 training:report.training,holdout:report.holdout,
 rankedTraining:ranked,selected,holdoutPairs,qualified}));
})();
