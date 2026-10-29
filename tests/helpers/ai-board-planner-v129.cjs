'use strict';
/* Arcane Duel v12.9 - isolated bounded combat search (no production impact).
 * Observable current board only: no peeking at opponent hand/deck or PRNG.
 * Search legal attack sequences to depth 3 and evaluate one enemy reply.
 * Move choice never changes actual game state until the real legal action runs.
 */
const boardPlannerSource=String.raw`function strategicBoardPolicy(g,statistics,learn){
 if(!g||g.winner!==null||g.pending||g.active!==0||g.turn===1)return null;
 if(!['positions','attacks','guard'].includes(g.aiPhase))return null;
 const ours=g.players[0],foe=g.players[1];
 const s=(c,i)=>{
  if(!c)return null;
  const d=dataOf(c);
  return {idx:i,id:c.id,mode:c.mode,atk:d.atk,def:d.def,
   level:d.level,fusion:!!c.fusion,role:c.roleOverride||CARDS[c.id]?.role||'',
   used:!canAttack(g,c),switched:!!c.switched};
 };
 const ally=ours.field.map(s),enemy=foe.field.map(s);
 const ar=ally.filter(c=>c&&!c.used&&c.mode==='atk'),targets=enemy.filter(Boolean);
 if(!ar.length){
  // Only switch a defensive creature when it can demonstrably defeat a
  // visible enemy (or attack directly) without wasting an already-used turn.
  if(g.aiPhase==='positions'){
   const options=ally.filter(c=>c&&c.mode==='def'&&!c.switched&&!ours.field[c.idx].attacked);
   for(const a of options){
    const canHit=targets.length?
     targets.some(t=>a.atk>(t.mode==='def'?t.def:t.atk)):
     a.atk>0;
    const risk=targets.some(t=>t.mode==='atk'&&t.atk>=a.atk);
    if(canHit&&(!risk||a.atk>=foe.lp+foe.shield)){
     statistics.switchesToAttack++;
     return {type:'switch',idx:a.idx};
    }
   }
  }
  return null;
 }
 const riskMultiplier=learn?.riskMultiplier||1;
 const cardWorth=c=>c?(c.atk*.38+c.def*.20+c.level*32+
   (c.fusion?160:0)+(c.role==='soul'?70:0)):0;
 function enemyReplyValue(state){
  const available=state.enemy.filter(c=>c&&c.mode==='atk');
  if(!available.length)return 0;
  const own=state.ally.filter(Boolean);
  // One plausible counterattack sequence: use strongest ready enemy
  // attacker against our most valuable vulnerable creature.
  let total=0;
  for(const attacker of [...available].sort((a,b)=>b.atk-a.atk).slice(0,3)){
   let best=0;
   for(const c of own){
    const wall=c.mode==='def'?c.def:c.atk;
    if(attacker.atk>wall){
     best=Math.max(best,cardWorth(c)*.58+
       (c.mode==='atk'?(attacker.atk-c.atk)*.12:0));
    }
   }
   if(!own.length)best=Math.max(best,Math.min(attacker.atk,state.lp0)*.32);
   total+=best;
  }
  return total*riskMultiplier;
 }
 function evaluate(state){
  const my=state.ally.filter(Boolean),them=state.enemy.filter(Boolean);
  const mine=my.reduce((n,c)=>n+cardWorth(c),0);
  const theirs=them.reduce((n,c)=>n+cardWorth(c),0);
  const pressure=my.filter(c=>c.mode==='atk').reduce((n,c)=>n+c.atk,0);
  const enemyPressure=them.filter(c=>c.mode==='atk').reduce((n,c)=>n+c.atk,0);
  return (state.lp1<=0?150000:0) + (state.lp0<=0?-150000:0)
   +(foe.lp-state.lp1)*1.35-(ours.lp-state.lp0)*1.55
   +(mine-th eirs)*.75+pressure*.06-enemyPressure*.07
   -enemyReplyValue(state);
 }
 function actions(state){
  const av=state.ally.filter(c=>c&&c.mode==='atk'&&!c.used);
  if(!av.length)return [];
  const en=state.enemy.filter(Boolean),out=[];
  for(const a of av){
   if(!en.length){out.push({ai:a.idx,di:null,value:a.atk*1.4});continue;}
   for(const t of en){
    const wall=t.mode==='def'?t.def:t.atk;
    const survive=t.mode==='def'||a.atk>t.atk;
    if(a.atk<wall||(!survive&&cardWorth(t)<cardWorth(a)*.85))continue;
    const kill=a.atk>wall || (a.atk===wall&&t.mode==='atk');
    const point=(kill?cardWorth(t):0)+(t.mode==='atk'?
      Math.max(0,a.atk-t.atk)*.5:0)-(survive?0:cardWorth(a));
    out.push({ai:a.idx,di:t.idx,value:point});
   }
  }
  return out.sort((a,b)=>b.value-a.value).slice(0,7);
 }
 function advance(state,a){
  const next={lp0:state.lp0,lp1:state.lp1,
   ally:state.ally.map(c=>c&&({...c})),
   enemy:state.enemy.map(c=>c&&({...c}))};
  const me=next.ally[a.ai];if(!me)return null;
  me.used=true;me.atk=Math.max(0,me.atk-30);
  if(a.di===null){
   const before=next.lp1;
   next.lp1=Math.max(0,next.lp1-Math.max(0,me.atk+30-foe.shield));
  }else{
   const victim=next.enemy[a.di];if(!victim)return null;
   const power=me.atk+30;
   if(victim.mode==='def'){
    if(power>victim.def)next.enemy[a.di]=null;
    else if(power<victim.def)next.lp0=Math.max(0,next.lp0-(victim.def-power));
   }else{
    if(power>=victim.atk)next.enemy[a.di]=null;
    if(power<=victim.atk)next.ally[a.ai]=null;
    if(power>victim.atk)next.lp1=Math.max(0,next.lp1-(power-victim.atk));
    else if(power<victim.atk)next.lp0=Math.max(0,next.lp0-(victim.atk-power));
   }
  }
  return next;
 }
 const start={ally,enemy,lp0:ours.lp,lp1:foe.lp};
 let nodes=0;
 function explore(state,depth){
  let best=evaluate(state);
  if(depth<=0||state.lp0===0||state.lp1===0)return best;
  for(const a of actions(state)){
   if(++nodes>240)break;
   const after=advance(state,a);
   if(!after)continue;
   best=Math.max(best,explore(after,depth-1));
  }
  return best;
 }
 const options=actions(start),baseline=evaluate(start);
 let best=null,bestValue=baseline+4;
 for(const a of options){
  if(nodes>235)break;
  const future=advance(start,a);
  const value=explore(future,2);
  if(value>bestValue){best={type:'attack',ai:a.ai,di:a.di};bestValue=value;}
 }
 statistics.scans++;statistics.nodes+=nodes;
 statistics.availableAttackOptions+=options.length;
 if(best){
  statistics.chosenAttacks++;
  statistics.expectedAdvantage+=bestValue-baseline;
  if(g.aiPhase!=='attacks')statistics.phaseOverrides++;
  g.aiPhase='attacks';
  return best;
 }
 statistics.skippedUnsafeAttacks++;
 // We skip any unsafe attack only if its estimated value is worse than
 // preserving the turn. The original fallback will otherwise attack by
 // fixed first-kill ordering.
 if(g.aiPhase==='attacks'){g.aiPhase='guard';return {type:'end'};}
 return null;
}`.replace('th eirs','theirs');
module.exports={boardPlannerSource};
