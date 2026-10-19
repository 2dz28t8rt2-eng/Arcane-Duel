/* Arcane Duel v5.8: bounded public-information tactical forecast.
 * Offline only until verified; NO look at player hand/deck, NO engine-state
 * mutation and NO perfect-information simulation of unrevealed draws.
 * Multi-turn forecasts are heuristic, NOT an exact game-tree search.
 */
'use strict';
(()=>{
 const PARAMS=['depth','board','survival','ace','tempo','support','blend'];
 const STANDARD=Object.freeze({depth:2,board:1.3,survival:1.1,ace:1.5,tempo:.7,support:1.1,blend:1});
 const DEPTH=Object.freeze({1:1,2:1,3:1,4:2,5:2,6:2,7:3,8:3,9:3,10:3});
 let enabled=false,config=STANDARD;
 const isMatch=g=>g?.mode==='pve'&&g.context==='tournament'&&g.active===1&&
  g.opponentId>=1&&g.opponentId<=10&&!g.lv1Saga&&!g.showcase&&g.winner===null;
 const role=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const details=c=>dataOf(c);
 const enemyPublic=g=>g.players[0].field.filter(Boolean);
 const one=(v)=>Math.max(0,Number(v)||0);
 function perspective(g){
  // Intentional isolation: the opposing hand, deck, graveyard and hidden
  // strategy are NEVER queried, even by a property getter.
  const enemy=enemyPublic(g);
  const own=g.players[1].field.filter(Boolean);
  const threats=enemy.map(c=>{
   const d=details(c);
   return {atk:one(d.atk),def:one(d.def),mode:c.mode,
    fusion:!!c.fusion,level:one(d.level),role:role(c)};
  });
  return {
   enemyCount:enemy.length,
   maxEnemyAtk:Math.max(0,...threats.map(x=>x.atk)),
   minEnemyGuard:threats.length?Math.min(...threats.map(x=>x.mode==='def'?x.def:x.atk)):0,
   enemyThreat:threats.reduce((s,x)=>s+x.atk*(x.fusion?1.12:1),0),
   defenseWalls:threats.filter(x=>x.mode==='def'&&['soul','guardian'].includes(x.role)).length,
   ownCount:own.length,
   ownForce:own.reduce((s,x)=>s+one(details(x).atk)+one(details(x).def)*.65,0),
   adjacentSupport:g.players[1].field.some((c,i,field)=>c&&
    ((role(c)==='guardian'&&(role(field[i-1])==='soul'||role(field[i+1])==='soul'))||
     (role(c)==='soul'&&(role(field[i-1])==='guardian'||role(field[i+1])==='guardian')))),
   enemyLP:one(g.players[0].lp),
   ownLP:one(g.players[1].lp)
  };
 }
 function supportActions(g){
  if(!isMatch(g)||g.aiPhase!=='attacks'||g.pending)return [];
  const p=g.players[1],e=g.players[0],options=[];
  for(let i=0;i<5;i++){
   const a=p.field[i];
   if(!a||a.mode!=='def'||a.attacked||a.switched)continue;
   if(role(a)==='guardian'){
    for(const j of [i-1,i+1]){
     const ally=p.field[j];
     if(!ally||role(ally)!=='soul')continue;
     const missing=Math.max(0,baseStat(CARDS[ally.id],'def',p)-details(ally).def);
     if(missing<20)continue;
     const heal=Math.min(missing,Math.max(45,Math.round(details(a).def*.22)));
     options.push({kind:'heal',action:{type:'arcane-guardian-heal',guardian:i,ally:j},
      gain:heal,provider:a,affected:ally,target:null});
    }
   }
   if(role(a)==='soul'){
    for(let j=0;j<5;j++){
     const target=e.field[j];
     if(!target)continue;
     const stat=target.mode==='def'?'def':'atk';
     const amount=Math.min(120,Math.ceil(one(target.card?.[stat])*.10));
     if(amount<1)continue;
     options.push({kind:'drain',action:{type:'arcane-soul-extract',slot:i,target:j},
      gain:amount,provider:a,affected:a,target});
    }
   }
  }
  return options;
 }
 function forecast(g,candidate,opt=config){
  if(!isMatch(g))return null;
  const state=perspective(g),depth=Math.min(opt.depth,DEPTH[g.opponentId]);
  const action=candidate.action||{},kind=candidate.kind||
   (action.type==='attack'?'attack':action.type==='fusion'?'fusion':
    action.type==='normal'?'normal':action.type);
  const result={depth,board:0,survival:0,ace:0,tempo:0,support:0,action:kind};
  if(kind==='normal'||kind==='fusion'){
   const card=candidate.template;
   if(!card)return null;
   const attack=one(card.atk),defense=one(card.def);
   const opponentAtk=state.maxEnemyAtk;
   const guard=state.minEnemyGuard;
   const decay=kind==='fusion'?50:30;
   const baseSurvival=opponentAtk<=0?1:
    Math.min(1,Math.max(.10,(defense+attack*.32+140)/(opponentAtk+140)));
   // This is a bounded PUBLIC-field forecast, not a prediction of cards in
   // the opponent's hidden hand or future draws.
   for(let turn=1;turn<=depth;turn++){
    const factor=Math.pow(.79,turn-1);
    const estimatedAtk=Math.max(0,attack-decay*turn);
    const estimatedDef=Math.max(0,defense-decay*turn);
    const survival=Math.pow(baseSurvival,turn);
    const damage=state.enemyCount?
     Math.max(0,estimatedAtk-guard)*.30:
     estimatedAtk*.42;
    result.board+=factor*survival*(estimatedAtk+estimatedDef*.55)/1050;
    result.survival+=factor*(survival-.5)*(estimatedDef/1050);
    result.tempo+=factor*survival*damage/900;
   }
   result.board-=state.defenseWalls*.05;
   result.ace=candidate.isAce?1:0;
   result.support=state.adjacentSupport?(.12*depth):0;
   if(candidate.role==='guardian'||candidate.role==='soul'){
    const complementary=state.adjacentSupport||
     g.players[1].field.some(c=>c&&role(c)===(candidate.role==='soul'?'guardian':'soul'));
    if(complementary)result.support+=.6*depth;
   }
   if(kind==='fusion')result.tempo-=(candidate.materialCount-1)*.30;
  }else if(kind==='attack'){
   const target=candidate.target,attacker=candidate.attacker;
   if(!attacker)return null;
   const attack=one(details(attacker).atk);
   if(candidate.lethal)result.tempo=30;
   else if(!target)result.tempo=one(candidate.damage)/900*depth;
   else{
    const td=details(target),defense=target.mode==='def'?one(td.def):one(td.atk);
    const destroyed=one(candidate.damage)>0||attack>defense;
    const threat=one(td.atk);
    result.board=(destroyed?threat/750:.1)*depth;
    result.survival=(destroyed?threat/1200:0)*depth;
    result.tempo=one(candidate.damage)/1000;
   }
  }else if(kind==='heal'||kind==='drain'){
   const gain=one(candidate.gain);
   result.support=gain/155*depth;
   result.survival=(kind==='heal'?gain/400:gain/570)*depth;
   result.board=kind==='drain'?gain/320*depth:0;
   result.tempo=-.15*depth; // A support skill consumes that monster's attack.
  }else return null;
  const projected=(opt.board*result.board+opt.survival*result.survival+
   opt.ace*result.ace+opt.tempo*result.tempo+opt.support*result.support);
  result.total=Math.round(projected*1000)/1000;
  return result;
 }
 function plan(g){
  if(!isMatch(g)||!ArcaneAiLearning56.active())return [];
  const budget=ArcaneAiLearning56.limits[g.opponentId].alternatives;
  let candidates=[];
  if(g.aiPhase==='summon'&&!g.pending&&!g.summoned){
   candidates=ArcaneAiLearning56.rank(g);
  }else if(g.aiPhase==='attacks'&&!g.pending){
   candidates=ArcaneAiLearning56.rankAttacks(g);
   candidates.push(...supportActions(g).map(x=>({...x,score:0})));
  }
  if(!candidates.length)return [];
  return candidates.slice(0,budget+5).map(c=>{
   const future=forecast(g,c);
   const score=(Number.isFinite(c.score)?c.score:0)*config.blend+(future?.total??-10000);
   return {...c,future,plannedScore:Math.round(score*1000)/1000};
  }).sort((a,b)=>b.plannedScore-a.plannedScore||
    (b.isAce?1:0)-(a.isAce?1:0));
 }
 const original=chooseAiAction;
 chooseAiAction=function(g,policy='balanced'){
  if(enabled&&isMatch(g)&&ArcaneAiLearning56.active()){
   const options=plan(g);
   if(options.length)return options[0].action;
  }
  return original(g,policy);
 };
 function setSandbox(next,flag=true){
  if(next===null){enabled=false;config=STANDARD;return;}
  if(!next||PARAMS.some(k=>!Number.isFinite(next[k])||next[k]<0||
   next[k]>(k==='depth'?3:5))||!Number.isInteger(next.depth)||
   next.depth<1)throw Error('Ungültige Planungskonfiguration');
  config=Object.freeze(Object.fromEntries(PARAMS.map(k=>[k,next[k]])));
  enabled=flag===true;
 }
 window.ArcaneAiLookahead58=Object.freeze({version:'5.8.0',STANDARD,DEPTH,
  perspective,supportActions,forecast,plan,setSandbox,active:()=>enabled});
})();
