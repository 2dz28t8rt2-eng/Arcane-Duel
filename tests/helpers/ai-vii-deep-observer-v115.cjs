'use strict';
// v11.5: Side-effect-free, true-action VII combat observer.
// It reads the existing active encounter; no cards, RNG, LP or AI actions are changed.
// This function is stringified into each fresh legal-career VM.
function deepViiObserver(g,{recordTrace=false,traceLimit=100}={}){
 const hero=g.players[0],boss=g.players[1];
 const actors=[0,1].map(side=>({
  turns:0,actions:0,failedActions:0,normal:0,fusionAttempts:0,fusionsStarted:0,
  fusionPlaced:0,fieldChains:0,byFusionLevel:{},byRole:{},maxFusionLevel:0,
  moves:0,switches:0,attackAttempts:0,successfulAttacks:0,fusionAttacks:0,
  fusionAttacksWithLiveAttacker:0,attackVsDef:0,attackVsAtk:0,directAttacks:0,
  destroyedEnemies:0,lpDamage:0,lpRestored:0,receivedLpDamage:0,
  fieldAttackerReadiness:0,readyFusionEnds:0,readyFusionWithoutAttack:0,
  canAttackButNoPlan:0,endsWithEnemyDefender:0,enemyDefenderSum:0,
  strongestEnemyDefender:0,shieldAtEndSum:0,emptyFieldEnds:0,
  equippedMaxTemplate:Math.max(0,...g.players[side].fusionDeck.map(id=>CARDS[id]?.level||0)),
  deckStarts:g.players[side].deck.length,
  topFusion:{level:0,atk:0,def:0},
  placedFusionUIDs:0,fusionCardTurnObservations:0
 }));
 const seen=[new Map(),new Map()],timeline=[],events={rounds:0,turns:0},perTurnFusionAttacks=[0,0];
 const compact=x=>Math.round((x||0)*10)/10;
 const emit=e=>{if(recordTrace&&timeline.length<traceLimit)timeline.push(e)};
 const safeData=c=>{if(!c)return null;const t=dataOf(c);return {uid:c.uid,name:t.name,
    level:t.level,atk:t.atk,def:t.def,mode:c.mode,fusion:!!c.fusion,
    role:c.roleOverride||t.role,attacked:!!c.attacked}};
 const readHealth=()=>g.players.map(p=>p.lp);
 function wrap(prior){
  return function(game,action){
   if(game!==g||!action)return prior(game,action);
   const side=game.active,me=game.players[side],enemy=game.players[1-side],r=actors[side];
   const beforeLP=readHealth(),beforeTurn=game.turn;
   const source=action.type==='attack'?safeData(me.field[action.ai]):null;
   const old=action.type==='place'?safeData(me.field[action.idx]):null;
   const target=action.type==='attack'&&action.di!==null?safeData(enemy.field[action.di]):null;
   const selected=action.type==='place'&&game.pending?safeData(game.pending.card):null;
   if(action.type==='end'){
    const defenders=enemy.field.filter(c=>c&&c.mode==='def').map(c=>dataOf(c).def);
    const ready=me.field.filter(c=>c&&!c.attacked&&c.mode==='atk');
    const readyFusions=ready.filter(c=>c.fusion);
    r.turns++;
    r.fieldAttackerReadiness+=ready.length;
    r.readyFusionEnds+=readyFusions.length;
    if(readyFusions.length&&!perTurnFusionAttacks[side])r.readyFusionWithoutAttack++;
    if(!me.field.some(Boolean))r.emptyFieldEnds++;
    r.endsWithEnemyDefender+=Number(defenders.length>0);
    r.strongestEnemyDefender=Math.max(r.strongestEnemyDefender,...defenders,0);
    r.enemyDefenderSum+=defenders.reduce((a,b)=>a+b,0);
    r.shieldAtEndSum+=enemy.shield||0;
    const plan=typeof attackPlan==='function'?attackPlan(game):null;
    if(readyFusions.length&&!plan)r.canAttackButNoPlan++;
    for(const c of me.field.filter(Boolean).filter(c=>c.fusion)){
     const info=seen[side].get(c.uid);
     if(info){info.boardTurnObservations++;r.fusionCardTurnObservations++;}
    }
    if(recordTrace&&timeline.length<traceLimit&&r.turns<=6)
     emit({turn:beforeTurn,side,action:'end',ownLP:me.lp,enemyLP:enemy.lp,
       board:me.field.filter(Boolean).map(safeData),opponentDefenders:defenders,
       attackReady:ready.length,readyFusions:readyFusions.length,attackPlan:plan?.type||null});
    perTurnFusionAttacks[side]=0;
   }
   r.actions++;
   if(action.type==='fusion')r.fusionAttempts++;
   if(action.type==='switch')r.switches++;
   if(action.type==='normal')r.normal++;
   if(action.type==='place')r.moves++;
   if(action.type==='attack')r.attackAttempts++;
   const result=prior(game,action);
   if(!result)r.failedActions++;
   const afterLP=readHealth();
   for(let other=0;other<2;other++){
    const delta=beforeLP[other]-afterLP[other];
    if(delta>0){
     actors[1-other].lpDamage+=delta;
     actors[other].receivedLpDamage+=delta;
    }else if(delta<0)actors[other].lpRestored+=-delta;
   }
   if(result&&action.type==='fusion')r.fusionsStarted++;
   if(result&&action.type==='place'&&(result.card?.fusion||result.fused)){
    const card=result.card,stats=safeData(card),lv=stats?.level||0,role=stats?.role||'unknown';
    r.fusionPlaced++;r.fieldChains+=Number(!!result.fused);
    r.byFusionLevel[lv]=(r.byFusionLevel[lv]||0)+1;
    r.byRole[role]=(r.byRole[role]||0)+1;
    r.maxFusionLevel=Math.max(r.maxFusionLevel,lv);
    r.placedFusionUIDs++;
    if(stats&&lv>=r.topFusion.level)r.topFusion={level:lv,atk:stats.atk,def:stats.def};
    seen[side].set(card.uid,{level:lv,atk:stats.atk,def:stats.def,boardTurnObservations:0,attacks:0});
    if(recordTrace)emit({turn:beforeTurn,side,action:result.fused?'chain-fusion':'placed-fusion',
     level:lv,role,stats,oldLevel:old?.level||null,
     heritage:card.fusionHeritage?.carriedPct||0});
   }
   if(result&&action.type==='attack'){
    r.successfulAttacks++;
    r.directAttacks+=Number(action.di===null);
    r.attackVsDef+=Number(target?.mode==='def');
    r.attackVsAtk+=Number(target?.mode==='atk');
    r.destroyedEnemies+=(result.destroyed||[]).filter(x=>String(x).startsWith((1-side)+':')).length;
    if(source?.fusion){
     r.fusionAttacks++;
     r.fusionAttacksWithLiveAttacker+=Number(seen[side].has(source.uid));
     perTurnFusionAttacks[side]++;
     if(seen[side].has(source.uid))seen[side].get(source.uid).attacks++;
    }
    if(recordTrace)emit({turn:beforeTurn,side,action:'attack',
     from:source,to:target||'LP',lpDamage:Math.max(0,beforeLP[1-side]-afterLP[1-side]),
     kills:(result.destroyed||[]).length});
   }else if(!result&&recordTrace&&timeline.length<traceLimit)
    emit({turn:beforeTurn,side,action:action.type,failed:true});
   return result;
  };
 }
 function finish(){
  const winner=g.winner;
  const heroLost=winner!==0;
  const player=actors[0],enemy=actors[1];
  const final={
   winner,heroLost,reason:heroLost?
    (player.fusionPlaced===0?'no-fusions-played':
     player.successfulAttacks===0?'no-successful-attacks':
     player.lpDamage===0?'attacked-without-life-point-damage':
     'some-life-point-damage-but-loss'):'victory',
   turns:g.turn,rounds:Math.max(player.turns,enemy.turns),
   finalLP:g.players.map(p=>p.lp),finalShield:g.players.map(p=>p.shield||0),
   deckRemaining:g.players.map(p=>p.deck.length),
   bySide:actors,
   avgObservedFusionBoardTurns:seen.map((m,i)=>m.size?compact([...m.values()].reduce((n,x)=>n+x.boardTurnObservations,0)/m.size):0),
   observedSummonedFusionAttacking:seen.map(m=>[...m.values()].filter(x=>x.attacks>0).length),
   handRemaining:g.players.map(p=>p.hand.length),
   fieldEnding:g.players.map(p=>p.field.filter(Boolean).map(safeData))
  };
  if(recordTrace)final.timeline=timeline;
  return final;
 }
 return {wrap,finish};
}
module.exports={deepViiObserverSource:deepViiObserver.toString()};
