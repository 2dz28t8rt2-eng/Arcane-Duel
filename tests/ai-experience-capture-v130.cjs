'use strict';
/* v13.0: real action-transition capture for future, cross-run policy training.
 * No hidden opposing hand/deck is read; no permanent player inventory changed.
 * A final win label is a weak outcome signal, NOT proof an action was optimal.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const history=require('../models/ai-policy-history-v130.json');
const origins=Number(process.env.ARCANE_V130_SEEDS||16);
if(!Number.isInteger(origins)||origins<2||origins>64)throw Error('Invalid origins');
const records=[],duels=[],policy='tempo-board';
for(let run=0;run<origins;run++){
 const vm=boot({seed:130100+run*43,x128Mode:'full'});vm.exec(summonPolicySource);
 const expr=`(()=>{
  const x=rpgEnemyLoadout(10,'easy'),g=createGame({
    id:'experience-v130-${run}',mode:'pve',context:'tournament',
    opponentId:10,seed:${130101+run*109},starter:${run%2},
    deck:[...x.deck],fusionDeck:[...x.fusionDeck]
  });
  const stats={summonObservations:0,normalOffered:0,legalFusionOffers:0,
   fusionAvailableTurns:0,freeSlotObservations:0,fullBoardObservations:0,
   noNormalHand:0,enemyAheadAtSummon:0,attackerOnBoardAtSummon:0,
   policyNormalChoices:0,policyFusionChoices:0,fusionMaterialsChosen:0,
   fusionTargetAtkSum:0,attacks:0,damageNpc:0};
  const known=c=>!c?null:{
    id:c.id,mode:c.mode,atk:dataOf(c).atk,def:dataOf(c).def,
    level:dataOf(c).level,role:c.roleOverride||CARDS[c.id]?.role||'combatant',
    fusion:!!c.fusion,attacked:!!c.attacked,switched:!!c.switched
  };
  const publicState=()=>{
   const me=g.players[0],enemy=g.players[1];
   return {
    turn:g.turn,phase:g.aiPhase,active:g.active,
    playerLP:me.lp,enemyLP:enemy.lp,
    playerShield:me.shield,enemyShield:enemy.shield,
    myField:me.field.map(known),enemyVisibleField:enemy.field.map(known),
    myHand:me.hand.map(c=>({id:c.id,level:dataOf(c).level})),
    myRemainingFusion:me.remainingFusion?.length??0,
    availableAttacks:me.field.map((c,i)=>c&&canAttack(g,c)?i:null)
     .filter(i=>i!==null),
    // Intentionally no enemy.hand or enemy.deck, nor RNG state.
   };
  };
  const actions=[];
  const oldChoose=chooseAiAction,oldApply=applyAiAction;
  chooseAiAction=function(game,style){
   if(game!==g||game.active!==0)return oldChoose(game,style);
   return summonPolicy(game,'tempo-board',stats)||oldChoose(game,style);
  };
  applyAiAction=function(game,a){
   if(game!==g||game.active!==0)return oldApply(game,a);
   const before=publicState(),winnerBefore=g.winner;
   const value=oldApply(game,a);
   if(value&&actions.length<220){
    const after=publicState();
    const delta={
     enemyLP:before.enemyLP-after.enemyLP,
     myLP:after.playerLP-before.playerLP,
     myBoard:after.myField.filter(Boolean).length-before.myField.filter(Boolean).length,
     enemyBoard:before.enemyVisibleField.filter(Boolean).length-after.enemyVisibleField.filter(Boolean).length
    };
    const reward=delta.enemyLP/1000+delta.myLP/1000+
     delta.myBoard*.25+delta.enemyBoard*.35;
    actions.push({before,action:JSON.parse(JSON.stringify(a)),
      after,delta,reward:+reward.toFixed(5),winnerChanged:winnerBefore!==g.winner});
   }
   return value;
  };
  try{simulateGame(g,'balanced','balanced');}
  finally{chooseAiAction=oldChoose;applyAiAction=oldApply;}
  if(g.winner===null||!actions.length)throw Error('No complete tracked duel');
  return {won:g.winner===0,turn:g.turn,actions,policyCalls:stats.summonObservations,
    ownLastLP:g.players[0].lp,npcLastLP:g.players[1].lp};
 })()`;
 const res=vm.run(expr,300000);
 assert(res.actions.length>0);
 assert(!res.actions.some(x=>'enemyHand' in x.before||'enemyDeck' in x.before));
 const split=run<Math.floor(origins/2)?'train':'holdout';
 duels.push({run,split,won:res.won,turn:res.turn,
   actions:res.actions.length,policyCalls:res.policyCalls});
 for(let i=0;i<res.actions.length;i++){
  const a=res.actions[i];records.push({run,split,actionIndex:i,
    ...a,finalWon:res.won,terminalOutcomeIsNotCausalCredit:true});
 }
 console.log('ARCANE_V130_REPLAY '+JSON.stringify({run:run+1,split,win:res.won,actions:res.actions.length}));
}
const report={schema:'arcane-action-experiences-v130',
 rulesSnapshot:'development-v12.8',historySchema:history.schema,
 historicalComparisons:history.history.length,
 actualExperienceCount:records.length,episodes:duels.length,
 trainCount:records.filter(x=>x.split==='train').length,
 holdoutCount:records.filter(x=>x.split==='holdout').length,
 method:'actual observed state, supported action, observed next state and immediate reward; player sees only public enemy field',
 noOpponentHiddenInformation:true,modelTrained:false,
 warnings:[
 'The final winner is an episode label, not a reliable individual-action advantage.',
 'Observed rewards are from a single executed action; a true counterfactual policy needs additional safe simulated alternatives.',
 'Do not train on holdout; never compare different X-balance regimes without revalidation.',
 'This collection builds reusable source data; no automatic promotion to production AI.'
 ],duels,transitions:records};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-experiences-v130.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V130_EXPERIENCE_SUMMARY '+JSON.stringify({
 episodes:duels.length,transitions:records.length,train:report.trainCount,holdout:report.holdoutCount,
 historicExperiments:report.historicalComparisons}));
