/* Arcane Duel KI v18.6 LIVE: legal, public-state tactical bridge for PvE.
 * Research-only Soul actions and hidden player cards are never used.
 */
'use strict';
(()=>{
 const legacyChoose=chooseAiAction,copy=x=>JSON.parse(JSON.stringify(x));
 let enabled=true;
 const stats={calls:0,legal:0,followups:0,overrides:0,finishers:0,errors:0};
 const role=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const eligible=g=>enabled&&g?.mode==='pve'&&g.active===1&&!g.strategicTraining&&
  g.winner===null&&!g.pending&&g.aiPhase==='attacks'&&
  Number.isInteger(g.opponentId)&&g.opponentId>=3&&g.opponentId<=10&&
  g.players?.[1]?.field?.some(c=>c&&['guardian','soul'].includes(role(c)))&&
  typeof window.ArcaneAiBranches59?.publicState==='function'&&
  typeof window.ArcaneEssenceCombat?.soulBonds==='function';
 function observe(g){
  const own=g.players[1],enemy=g.players[0];
  const cards=p=>p.field.filter(Boolean).map(c=>({atk:dataOf(c).atk,def:dataOf(c).def,
   soul:c.essenceCombat?.soul||0,condensed:c.essenceCombat?.condensed||0}));
  const a=cards(own),b=cards(enemy);
  const bonds=window.ArcaneEssenceCombat.soulBonds(g,1)
   .filter(x=>x.guardian.mode==='def'&&x.soul.mode==='def');
  return {ownLP:own.lp,enemyLP:enemy.lp,ownShield:own.shield||0,enemyShield:enemy.shield||0,
   ownCount:a.length,enemyCount:b.length,
   ownAtk:a.reduce((n,c)=>n+c.atk,0),ownDef:a.reduce((n,c)=>n+c.def+c.soul+c.condensed,0),
   enemyAtk:b.reduce((n,c)=>n+c.atk,0),enemyDef:b.reduce((n,c)=>n+c.def+c.soul+c.condensed,0),
   soulReserve:a.reduce((n,c)=>n+c.soul,0),bondCount:bonds.length,
   bondReserve:bonds.reduce((n,x)=>n+(x.soul.essenceCombat?.soul||0),0)};
 }
 function value(before,after){
  // Values are research strategy hypotheses, NOT game-rule formulas.
  const d=k=>before[k]-after[k];
  return d('enemyLP')*.26-d('ownLP')*.59+
   d('enemyShield')*.14-d('ownShield')*.22+
   d('enemyCount')*150-d('ownCount')*520+
   d('enemyAtk')*.16+d('enemyDef')*.06-
   d('ownAtk')*.08-d('ownDef')*.12-
   d('soulReserve')*.15-d('bondCount')*120-d('bondReserve')*.18;
 }
 function candidates(g){
  const p=g.players[1],e=g.players[0],targets=e.field.map((c,i)=>c?i:null).filter(i=>i!==null),out=[];
  if(!targets.length)targets.push(null);
  for(let i=0;i<p.field.length;i++)if(p.field[i]&&canAttack(g,p.field[i]))
   for(const di of targets)out.push({type:'attack',ai:i,di});
  return out;
 }
 function trial(g,action,start,follow=true){
  if(action?.type!=='attack'||!Number.isInteger(action.ai))return null;
  const state=window.ArcaneAiBranches59.publicState(g);
  if(!applyAiAction(state,action))return null;
  stats.legal++;
  const win=state.winner===1;
  let score=win?1000000:value(start,observe(state)),sequenceWin=false;
  if(follow&&!win&&state.winner===null&&state.active===1){
   const urgent=state.players[0].lp<=4000||state.players[1].lp<=3000;
   const budget=urgent?16:10;
   let best=-Infinity,checks=0;
   for(const next of candidates(state)){
    if(checks++>=budget)break;
    const after=copy(state);
    if(!applyAiAction(after,next))continue;
    stats.followups++;
    const finalWin=after.winner===1,s=finalWin?850000:value(start,observe(after));
    if(s>best){best=s;sequenceWin=finalWin;}
   }
   if(best>-Infinity)score+=best*.33;
  }
  return {score,win,sequenceWin};
 }
 function plan(g,previous=null){
  if(!eligible(g))return null;
  const start=observe(g),old=trial(g,previous,start);
  if(old?.win)return null; // never replace a guaranteed legacy finisher
  let best=null,bestResult=null,checks=0;
  for(const move of candidates(g)){
   if(checks++>=24)break;
   const result=trial(g,move,start);
   if(result&&(!bestResult||result.score>bestResult.score)){best=move;bestResult=result;}
   if(result?.win)break;
  }
  if(!bestResult)return null;
  const changed=previous?.type!=='attack'||previous.ai!==best.ai||
   (previous.di??null)!==(best.di??null);
  if(!changed)return null;
  const margin=bestResult.score-(old?.score??-25),finisher=bestResult.win||
   (bestResult.sequenceWin&&!old?.sequenceWin);
  // Legal guardian/soul support actions remain authoritative unless this
  // engine-proven attack wins on the current turn.
  if(previous?.type!=='attack'&&!finisher)return null;
  if(!finisher&&!(bestResult.score>=40&&margin>=110))return null;
  return {action:best,finisher,margin,reason:bestResult.win?'instant-win':
   bestResult.sequenceWin?'legal-sequence':'visible-board'};
 }
 chooseAiAction=function(g,policy='balanced'){
  if(!eligible(g))return legacyChoose(g,policy);
  stats.calls++;
  const previous=legacyChoose(g,policy);
  if(g.aiPhase!=='attacks'||g.pending||g.winner!==null)return previous;
  try{
   const result=plan(g,previous);
   if(result){
    stats.overrides++;
    if(result.finisher)stats.finishers++;
    return result.action;
   }
  }catch(err){
   stats.errors++;
   console.warn('Arcane KI v18.6: legal tactical planner fallback',err);
  }
  return previous;
 };
 window.ArcaneAiProduction186=Object.freeze({
  version:'18.6-live.1',supported:eligible,plan,
  enabled:()=>enabled,setEnabled(v){enabled=v===true;return enabled;},
  stats:()=>({...stats}),resetStats(){for(const k of Object.keys(stats))stats[k]=0;}
 });
})();