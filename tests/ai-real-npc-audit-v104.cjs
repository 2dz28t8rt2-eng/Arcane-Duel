'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const vm=boot({seed:830144});
const expr=`(()=>{
 profile=freshProfile();profile.guideSeen=true;
 const tiers=[1,2,3,4,5,6,7,8,9,10],each=12;
 const results=[], policies=['balanced','offensive','guardian','economy'];
 for(const tier of tiers)for(let i=0;i<each;i++){
  const g=createGame({id:'npc-v104-'+tier+'-'+i,mode:'pve',context:'free',
   opponentId:tier,seed:(290001+tier*3307+i*9197)>>>0,
   starter:i%2,deck:[...profile.activeDeck],
   fusionDeck:[...profile.fusionDeck],enhancements:profile.enhancements,
   difficulty:'easy'});
  const priorChoose=chooseAiAction,priorApply=applyAiAction;
  let npcActions=0,acePlays=0,normal=0,handFusions=0,fieldFusions=0,
   attacks=0,positions=0,invalid=0,switchAfterAttack=0,damagePlayer=0,
   npcKills=0,fusionPlaces=0,attackFatigueSwitches=0;
  const attackedByUID=new Map(),actorPolicies=policies[i%policies.length];
  const ownedACE=[...g.players[1].deck,...g.players[1].fusionDeck,
   ...g.players[1].hand].filter(c=>{
    const id=typeof c==='object'?c.id:c;
    return !!CARDS[id]?.ace;
   }).length;
  chooseAiAction=function(game,p){
   // Only observe: do not replace NPC decision logic or peek at player hand.
   return priorChoose(game,p);
  };
  applyAiAction=function(game,action){
   if(game!==g||game.active!==1)return priorApply(game,action);
   const npc=game.players[1],enemy=game.players[0];
   const actor=action?.type==='attack'?npc.field[action.ai]:null;
   const switcher=action?.type==='switch'?npc.field[action.idx]:null;
   const prevEnemyLP=enemy.lp;
   const hadOld=action?.type==='place'&&!!npc.field[action.idx];
   const pending=action?.type==='place'?game.pending:null;
   const result=priorApply(game,action);
   npcActions++;
   if(!result){invalid++;return result;}
   if(action.type==='normal')normal++;
   if(action.type==='fusion')handFusions++;
   if(action.type==='place'){
    if(result.fused||hadOld)fieldFusions++;
    if(pending?.kind==='fusion')fusionPlaces++;
    if(CARDS[result.card?.id]?.ace)acePlays++;
   }
   if(action.type==='attack'){
    attacks++;
    if(actor)attackedByUID.set(actor.uid,game.turn);
    damagePlayer+=Math.max(0,prevEnemyLP-enemy.lp);
    npcKills+=(result.destroyed||[]).filter(k=>String(k).startsWith('0:')).length;
   }
   if(action.type==='switch'){
    positions++;
    if(switcher&&attackedByUID.get(switcher.uid)===game.turn)
     switchAfterAttack++;
    if(switcher?.attacked)attackFatigueSwitches++;
   }
   return result;
  };
  try{simulateGame(g,'balanced',actorPolicies);}
  finally{chooseAiAction=priorChoose;applyAiAction=priorApply;}
  if(g.winner===null||invalid||switchAfterAttack||attackFatigueSwitches)
   throw Error('Illegal or incomplete NPC action at tier '+tier+' seed '+i+
    ': '+JSON.stringify({invalid,switchAfterAttack,attackFatigueSwitches}));
  results.push({tier,run:i,policy:actorPolicies,npcWin:g.winner===1,
   npcActions,acePlays,ownedACE,normal,handFusions,fieldFusions,attacks,
   positions,damagePlayer,npcKills,fusionPlaces,
   invalid,switchAfterAttack,attackFatigueSwitches});
 }
 const sum=(rows,key)=>rows.reduce((n,x)=>n+x[key],0);
 const summaries=tiers.map(tier=>{
  const rows=results.filter(x=>x.tier===tier);
  return {tier,matches:rows.length,npcWins:sum(rows,'npcWin'),
   aceAvailablePoolSlots:sum(rows,'ownedACE'),acePlaced:sum(rows,'acePlays'),
   normal:sum(rows,'normal'),handFusions:sum(rows,'handFusions'),
   fusedPlacements:sum(rows,'fusionPlaces'),fieldFusions:sum(rows,'fieldFusions'),
   attacks:sum(rows,'attacks'),positionChanges:sum(rows,'positions'),
   actualPlayerLPDamage:sum(rows,'damagePlayer'),actualPlayerKills:sum(rows,'npcKills')};
 });
 return {schema:'arcane-v104-real-npc-actions',sampleLimitations:[
  'These are existing unmodified NPC policies against the legal starter player deck, not a calibrated late-game human-match fairness result.',
  'An ACE in a deck/hand/fusion-pool is not proof the NPC drew or could legally play it.',
  'Policy allocations (balanced/offensive/guardian/economy) are controlled isolated experiments, not evidence of NPC learning.',
  'All actions use the game engine; neither NPC cards nor hidden player information are inspected or modified by the NPC.'
 ],matches:results.length,invalid:sum(results,'invalid'),
 switchAfterAttack:sum(results,'switchAfterAttack'),
 switchedExhaustedAttacker:sum(results,'attackFatigueSwitches'),
 totalNPCActions:sum(results,'npcActions'),npcWins:sum(results,'npcWin'),
 acePlays:sum(results,'acePlays'),handFusions:sum(results,'handFusions'),
 fieldFusions:sum(results,'fieldFusions'),attacks:sum(results,'attacks'),
 summaries,results};
})()`;
const r=vm.run(expr,300000);
if(r.error)throw Error(r.error.stack||String(r.error));
assert.equal(r.matches,120);assert.equal(r.invalid,0);
assert.equal(r.switchAfterAttack,0);assert.equal(r.switchedExhaustedAttacker,0);
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-real-npc-audit-v104.json',JSON.stringify(r,null,2)+'\n');
console.log('ARCANE_V104_NPC_SUMMARY '+JSON.stringify({
 matches:r.matches,npcWins:r.npcWins,actions:r.totalNPCActions,
 acePlays:r.acePlays,handFusions:r.handFusions,fieldFusions:r.fieldFusions,
 attacks:r.attacks,invalid:r.invalid,switchAfterAttack:r.switchAfterAttack,
 switchedExhaustedAttacker:r.switchedExhaustedAttacker,tiers:r.summaries}));
