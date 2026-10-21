'use strict';
/* Independent v12.7 MIRROR benchmark. Does NOT award or unlock cards.
 * Player receives the real current X main/fusion IDs exclusively inside a
 * throwaway simulated match. Includes both native boss power and power=1
 * equalized setup; game rules and NPC behavior remain active otherwise.
 */
const fs=require('node:fs'), assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {summonPolicySource}=require('./helpers/ai-pre-attack-v92.cjs');
const {offensivePolicySource}=require('./helpers/x-offensive-ai-v127.cjs');
const seeds=Number(process.env.ARCANE_V127_MIRROR_SEEDS||32);
if(!Number.isInteger(seeds)||seeds<1||seeds>64)throw Error('Invalid mirror seeds');
const conditions=['native-tempo','native-aggressive','equal-power-tempo','equal-power-aggressive'];
const entries=[];
for(let i=0;i<seeds;i++)for(const condition of conditions){
 const vm=boot({seed:1277001+i*710});
 vm.exec(summonPolicySource);vm.exec(offensivePolicySource);
 const aggressive=condition.endsWith('aggressive'),equal=condition.startsWith('equal');
 const code=`(()=>{
  profile=freshProfile();
  const x=rpgEnemyLoadout(10,'easy');
  const control={summonObservations:0,normalOffered:0,legalFusionOffers:0,
   fusionAvailableTurns:0,freeSlotObservations:0,fullBoardObservations:0,
   noNormalHand:0,enemyAheadAtSummon:0,attackerOnBoardAtSummon:0,
   policyNormalChoices:0,policyFusionChoices:0,fusionMaterialsChosen:0,
   fusionTargetAtkSum:0,attacks:0,damageNpc:0};
  const stats={attackPhaseOverrides:0,soulActionsProposed:0,healsProposed:0,
    guardSwitchesSkipped:0},counts={player:{},npc:{}};
  const boss={...x,power:${equal?'1':'x.power'}};
  const game=createGame({id:'x-mirror-${i}-${condition}',mode:'pve',
    context:'tournament',opponentId:10,seed:${124210+i*1771},starter:${i%2},
    difficulty:'easy',deck:[...x.deck],fusionDeck:[...x.fusionDeck],enemy:boss});
  if(game.players[0].originalDeck.length!==40||game.players[1].originalDeck.length!==40)
    throw Error('Mirror missing 40 main cards');
  const tally=arr=>arr.reduce((m,id)=>(m[id]=(m[id]||0)+1,m),{});
  if(JSON.stringify(tally(game.players[0].originalDeck))!==
     JSON.stringify(tally(game.players[1].originalDeck))) {
    const a=tally(game.players[0].originalDeck),b=tally(game.players[1].originalDeck);
    if(Object.keys({...a,...b}).some(id=>a[id]!==b[id]))throw Error('Mirror main ID mismatch');
  }
  if(x.fusionDeck.some((id,j)=>id!==game.players[0].fusionDeck[j]))
    throw Error('Mirror player fusion ID mismatch');
  const oldChoice=chooseAiAction,oldApply=applyAiAction;
  let playerAttacks=0,npcAttacks=0,playerFusion=0,npcFusion=0;
  const dmg={player:0,npc:0},skill={player:0,npc:0};
  chooseAiAction=function(g,policy){
    if(g!==game||g.active!==0)return oldChoice(g,policy);
    const force=${aggressive?'xOffensivePolicy(g,stats)':'null'};
    return force||summonPolicy(g,'tempo-board',control)||oldChoice(g,policy);
  };
  applyAiAction=function(g,a){
    const owner=g.active,one=g.players[0].lp,two=g.players[1].lp,
      pending=g.pending?.kind==='fusion',type=a?.type;
    const v=oldApply(g,a);
    if(g===game&&v){
      dmg.player+=Math.max(0,two-g.players[1].lp);
      dmg.npc+=Math.max(0,one-g.players[0].lp);
      if(type==='attack'){if(owner===0)playerAttacks++;else npcAttacks++;}
      if(type==='place'&&(pending||v.fused)){if(owner===0)playerFusion++;else npcFusion++;}
      if(type==='arcane-soul-extract'||type==='arcane-guardian-heal')skill[owner===0?'player':'npc']++;
    }
    return v;
  };
  try{simulateGame(game,'balanced','balanced');}
  finally{chooseAiAction=oldChoice;applyAiAction=oldApply;}
  if(game.winner===null)throw Error('Mirror unfinished');
  return {condition:'${condition}',run:${i},starter:${i%2},
    exactMirror:true,equalPower:${equal},npcPower:game.players[1].power,
    playerPower:game.players[0].power,
    bossAceId:ACE_CARD_IDS[10],aceCopies:x.fusionDeck.filter(x=>x===ACE_CARD_IDS[10]).length,
    won:game.winner===0,turns:game.turn,playerLP:game.players[0].lp,npcLP:game.players[1].lp,
    playerAttacks,npcAttacks,playerFusion,npcFusion,damage:dmg,skills:skill,
    policyCalls:control.summonObservations,attackOverrides:stats.attackPhaseOverrides,
    supportOffers:stats.soulActionsProposed+stats.healsProposed,
    playerDeckRemaining:game.players[0].deck.length,npcDeckRemaining:game.players[1].deck.length};
 })()`;
 const entry=vm.run(code,300000);
 assert(entry.exactMirror&&entry.policyCalls>0,'Mirror controller not active');
 if(equal)assert.equal(entry.npcPower,entry.playerPower,'Equal-power condition failed');
 entries.push(entry);
 console.log('ARCANE_V127_MIRROR_PROGRESS '+JSON.stringify({run:i+1,condition,win:entry.won,attacks:entry.playerAttacks,enemyPower:entry.npcPower}));
}
const groups={};
for(const name of conditions){
 const e=entries.filter(x=>x.condition===name);
 const sum=k=>e.reduce((n,x)=>n+x[k],0);
 groups[name]={matches:e.length,wins:sum('won'),losses:e.length-sum('won'),
   attacks:sum('playerAttacks'),npcAttacks:sum('npcAttacks'),
   playerFusion:sum('playerFusion'),npcFusion:sum('npcFusion'),
   playerDamage:e.reduce((n,x)=>n+x.damage.player,0),
   npcDamage:e.reduce((n,x)=>n+x.damage.npc,0),
   supportActivations:e.reduce((n,x)=>n+x.skills.player,0),
   playerDeckEmptyLoss:e.filter(x=>!x.won&&x.playerDeckRemaining===0).length};
}
const report={schema:'arcane-v127-x-mirror',seeds,conditions,groups,raw:entries,
 caveats:['Exact deck IDs, including ACE, are copied only into disposable match state, not earned inventory or saved career.',
 'Native condition retains NPC tournament power advantage. Equal-power condition sets NPC to power 1 before initial cards are created, but NPC AI behavior and special ACE logic may still differ.',
 'The baseline and aggressive strategies both use the legal tempo-board summon policy; only the tactical follow-up differs.',
 'No rewards, packs, XP, tournament progression, account or game save are awarded by mirror matches.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-x-mirror-v127.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V127_MIRROR_SUMMARY '+JSON.stringify({groups}));
