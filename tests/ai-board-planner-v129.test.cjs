'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const {boardPlannerSource}=require('./helpers/ai-board-planner-v129.cjs');
test('v12.9 strategic policy only considers current visible board and returns a legal attack choice',()=>{
 const vm=boot({seed:12941});vm.exec(boardPlannerSource);
 const x=vm.run(`(()=>{
  const g=createGame({mode:'pve',context:'tournament',opponentId:10,seed:15135,starter:0});
  const stat={scans:0,nodes:0,availableAttackOptions:0,chosenAttacks:0,
   expectedAdvantage:0,phaseOverrides:0,skippedUnsafeAttacks:0,switchesToAttack:0};
  g.turn=3;g.active=0;g.aiPhase='attacks';
  const me=g.players[0],them=g.players[1];
  me.field=[null,null,null,null,null];
  them.field=[null,null,null,null,null];
  const def=me.originalDeck.find(id=>CARDS[id]?.level>=4)||me.originalDeck[0];
  const mon=newInstance(g,def,0);mon.card={...mon.card,atk:1800,def:1200};
  mon.mode='atk';mon.attacked=false;me.field[0]=mon;
  const output=strategicBoardPolicy(g,stat,null);
  return {output,stats:stat};
 })()`);
 assert.equal(x.output.type,'attack');assert.equal(x.output.ai,0);assert.equal(x.output.di,null);
 assert.ok(x.stats.scans>0&&x.stats.availableAttackOptions>0);
});
test('v12.9 bounded strategic planner completes real X mirror duels without illegal actions',()=>{
 for(const seed of [12911,12912]){
  const vm=boot({seed});vm.exec(boardPlannerSource);vm.exec(summonPolicySource);
  const r=vm.run(`(()=>{
   const x=rpgEnemyLoadout(10,'easy');
   const g=createGame({mode:'pve',context:'tournament',opponentId:10,
     id:'planner-smoke-${seed}',seed:${seed},starter:0,
     deck:x.deck,fusionDeck:x.fusionDeck});
   const stats={scans:0,nodes:0,availableAttackOptions:0,chosenAttacks:0,
    expectedAdvantage:0,phaseOverrides:0,skippedUnsafeAttacks:0,switchesToAttack:0};
   const ctrl={summonObservations:0,normalOffered:0,legalFusionOffers:0,
    fusionAvailableTurns:0,freeSlotObservations:0,fullBoardObservations:0,
    noNormalHand:0,enemyAheadAtSummon:0,attackerOnBoardAtSummon:0,
    policyNormalChoices:0,policyFusionChoices:0,fusionMaterialsChosen:0,
    fusionTargetAtkSum:0,attacks:0,damageNpc:0};
   const origin=chooseAiAction;let actions=0;
   chooseAiAction=function(game,mode){
    if(game!==g||game.active!==0)return origin(game,mode);
    const a=strategicBoardPolicy(game,stats,null)||
      summonPolicy(game,'tempo-board',ctrl)||origin(game,mode);
    if(a?.type==='attack'&&(!canAttack(game,game.players[0].field[a.ai])||
      (a.di===null&&game.players[1].field.some(Boolean))||
      (a.di!==null&&!game.players[1].field[a.di])))throw Error('illegal planned attack');
    actions++;return a;
   };
   try{simulateGame(g,'balanced','balanced');}
   finally{chooseAiAction=origin;}
   return {winner:g.winner,turns:g.turn,actions,stats,ctrlCalls:ctrl.summonObservations};
  })()`);
  assert.ok([0,1].includes(r.winner));assert.ok(r.actions>1);
  assert.ok(r.stats.scans>0,r.stats);assert.ok(r.ctrlCalls>0,r);
 }
});
