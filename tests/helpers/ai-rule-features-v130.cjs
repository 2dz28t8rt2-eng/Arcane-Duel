'use strict';
/* v13.0 rule-to-features bridge for offline training.
 * Uses only live engine checks; public enemy field and own private cards.
 * Feature extraction is read-only and cannot override the actual rules.
 */
const ruleFeatureSource=String.raw`function tacticalRuleFeatures(g){
 if(!g||g.mode!=='pve')return null;
 const me=g.players[0],other=g.players[1];
 const role=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const live=c=>c?dataOf(c):null;
 const target=other.field.map((c,i)=>({c,i})).filter(x=>x.c);
 const attacks=[];
 for(let i=0;i<me.field.length;i++){
  const c=me.field[i];
  if(!canAttack(g,c))continue;
  if(!target.length){attacks.push({from:i,to:null,kind:'direct',estimatedAttack:effectiveAttack(g,c,null)});continue;}
  for(const {c:enemy,i:j} of target){
   const power=effectiveAttack(g,c,enemy),defense=enemy.mode==='def'?live(enemy).def:live(enemy).atk;
   attacks.push({from:i,to:j,kind:power>defense?'kill':power===defense?'tie':'unsafe',
    estimatedAttack:power,targetResistance:defense,enemyRole:role(enemy)});
  }
 }
 const combos=[];
 if(g.active===0&&!g.pending&&!g.summoned){
  const hand=me.hand.filter(c=>!isFateCard(c)).slice(0,5);
  const inspect=(picked)=>{
   if(picked.length<2)return;
   const levels=picked.map(c=>live(c).level);
   for(const template of fusionOptions(g,levels,picked)){
    if(!me.remainingFusion?.includes(template.id)||
       !canCompleteHandFusion(g,levels,template.id))continue;
    combos.push({materialIds:picked.map(c=>c.id),choice:template.id,
     level:template.level,role:role(template),materialCount:picked.length});
   }
  };
  const recur=(chosen,start)=>{
   if(chosen.length>=2)inspect(chosen);
   if(chosen.length>=5)return;
   for(let i=start;i<hand.length;i++)recur([...chosen,hand[i]],i+1);
  };
  recur([],0);
 }
 const own=me.field.filter(Boolean),enemy=other.field.filter(Boolean);
 return {
  legalAttacks:attacks,legalFusionChoices:combos,
  availableAttackers:own.filter(c=>canAttack(g,c)).length,
  directAttackAllowed:enemy.length===0&&g.turn!==1,
  ownBoardRoles:own.reduce((n,c)=>(n[role(c)]=(n[role(c)]||0)+1,n),{}),
  enemyVisibleRoles:enemy.reduce((n,c)=>(n[role(c)]=(n[role(c)]||0)+1,n),{}),
  decayRates:me.field.map(c=>c?creatureDecayRate(g,c,0):null),
  fieldSlotsFree:me.field.filter(c=>!c).length,
  switchablePositions:me.field.map((c,i)=>c&&!c.attacked&&!c.switched?i:null)
   .filter(i=>i!==null),
  handCount:me.hand.length,ownDeckLeft:me.deck.length,
  remainingFusionCopies:me.remainingFusion?.length||0,
  bossAceOnEnemyField:other.field.some(c=>c?.id===ACE_CARD_IDS[g.opponentId]),
  actualEnemyLP:other.lp,actualOwnLP:me.lp
 };
}`;
module.exports={ruleFeatureSource};
