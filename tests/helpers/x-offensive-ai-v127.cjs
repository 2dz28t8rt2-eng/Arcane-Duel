'use strict';
/* v12.7 offline player AI policy, intentionally not a global game rule.
 * Attack as soon as it is legally possible, keep attacking, and avoid the
 * default defensive switch in guard phase. Use already-existing support
 * actions only when there are no legal attacks; no artificial free actions.
 */
const offensivePolicySource=`function xOffensivePolicy(g,stat){
 if(!g||g.active!==0||g.winner!==null||g.pending)return null;
 const p=g.players[0],e=g.players[1],phase=g.aiPhase;
 if(phase==='positions'||phase==='attacks'||phase==='guard'){
  const plan=attackPlan(g);
  if(plan){
   if(phase==='positions'||phase==='guard')stat.attackPhaseOverrides++;
   g.aiPhase='attacks';
   return {type:'attack',...plan};
  }
 }
 if(phase==='attacks'||phase==='guard'){
  const role=c=>c?.roleOverride||CARDS[c?.id]?.role||'';
  // Activations below are supported by the existing NPC support-action
  // dispatcher, subject to its same eligibility checks and turn costs.
  for(let i=0;i<5;i++){
   const soul=p.field[i];
   if(!soul||role(soul)!=='soul'||soul.mode!=='def'||soul.attacked||soul.switched)continue;
   const target=e.field.map((c,j)=>({c,j})).filter(x=>x.c&&
     x.c.card?.[x.c.mode==='def'?'def':'atk']>0)
    .sort((a,b)=>dataOf(b.c).atk-dataOf(a.c).atk)[0];
   if(target){
    stat.soulActionsProposed++;
    return {type:'arcane-soul-extract',slot:i,target:target.j};
   }
  }
  for(let i=0;i<5;i++){
   const patient=p.field[i];
   if(!patient||role(patient)!=='soul'||!patient.card)continue;
   const healNeeded=baseStat(CARDS[patient.id],'def',p)-patient.card.def;
   if(healNeeded<20)continue;
   const j=p.field.findIndex((c,k)=>Math.abs(k-i)===1&&c&&
     role(c)==='guardian'&&c.mode==='def'&&!c.attacked&&!c.switched);
   if(j>=0){
    stat.healsProposed++;
    return {type:'arcane-guardian-heal',guardian:j,ally:i};
   }
  }
  if(phase==='guard'){
   stat.guardSwitchesSkipped++;
   g.aiPhase='end';
   return {type:'end'};
  }
 }
 return null;
}`;
module.exports={offensivePolicySource};
