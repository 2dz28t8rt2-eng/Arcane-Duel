/* Arcane Duel 5.5 — tournament deck curation, readable AI strategy,
 * visible ACE preparation and the permanent Lv1 research passive.
 * Opts out of Fanatiker, Eiman, PvP and special challenge fights.
 */
'use strict';
(()=>{
 const PROFILES=Object.freeze({
  1:{style:'attack',difficulty:'leicht',floor:1,aceTurn:8},
  2:{style:'defense',difficulty:'leicht',floor:1,aceTurn:8},
  3:{style:'fusion',difficulty:'leicht',floor:2,aceTurn:8},
  4:{style:'attack',difficulty:'mittel',floor:3,aceTurn:6},
  5:{style:'defense',difficulty:'mittel',floor:4,aceTurn:6},
  6:{style:'fusion',difficulty:'mittel',floor:4,aceTurn:6},
  7:{style:'attack',difficulty:'schwer',floor:5,aceTurn:4},
  8:{style:'defense',difficulty:'schwer',floor:6,aceTurn:4},
  9:{style:'fusion',difficulty:'schwer',floor:7,aceTurn:4},
  10:{style:'hybrid',difficulty:'finale',floor:8,aceTurn:4}
 });
 const profileFor=id=>PROFILES[id]||null;
 const LABELS={attack:'ANGRIFF · Schwarm und Tempo',defense:'VERTEIDIGUNG · Wächter heilen Seelenzehrer',
  fusion:'FUSION · Allrounder und Resonatoren',hybrid:'MEISTER · alle drei Strategien'};
 for(const [id,profile] of Object.entries(PROFILES)){
  const enemy=RPG_OPPONENTS[Number(id)];
  if(!enemy)continue;
  enemy.policy=profile.style==='attack'?'offensive':profile.style==='defense'?'guardian':
   profile.style==='fusion'?'economy':'balanced';
  enemy.aiArchetype=profile.style;
  enemy.aiDifficulty=profile.difficulty;
  enemy.desc='Strategie: '+LABELS[profile.style]+' · Schwierigkeit: '+profile.difficulty+
   '. Signatur-ACE wird gezielt vorbereitet und, wenn legal, bevorzugt gespielt.';
 }
 const role=c=>c?.roleOverride||CARDS[c?.id]?.role||c?.role||'combatant';
 const opponent=g=>g?.mode==='pve'&&g.context==='tournament'&&g.active===1&&
   !g.lv1Saga&&!g.showcase&&profileFor(g.opponentId);
 const normalPool=()=>RPG_BASE_CARDS.filter(c=>c?.rpg&&!c.retired&&!c.fusionOnly&&
  !c.ace&&!c.enemyOnly&&!c.essenceMonster&&!c.fateOnly&&
  !c.lv1Exclusive&&c.level>=1&&c.level<=10&&c.art?.startsWith('assets/'));
 const score=(c,style)=>{
  const defense=c.def,attack=c.atk,tag=role(c),level=c.level||1;
  if(style==='attack')return attack*1.7+defense*.23+level*65+(tag==='predator'?1100:0);
  if(style==='defense')return defense*1.65+attack*.22+level*60+(['soul','guardian'].includes(tag)?1150:0);
  if(style==='fusion')return (attack+defense)*.67+level*150+(tag==='combatant'?1050:0);
  return attack+defense+level*85+(['soul','guardian','predator','combatant'].includes(tag)?220:0);
 };
 function curate(id,difficulty,original){
  const p=profileFor(id);
  if(!p)return original;
  // A late opponent NEVER receives weak level-3 filler merely to reach 40.
  // Prefer legal high-level normal cards; keep the three-copies-per-ID limit.
  let floor=p.floor,pool=normalPool().filter(c=>c.level>=floor);
  // Never lower the finale below Lv7 even if the authored pool is short.
  const absoluteFloor=id===10?7:floor;
  while(pool.length<14&&floor>absoluteFloor){
   floor--;pool=normalPool().filter(c=>c.level>=floor);
  }
  if(pool.length<14)return original; // Do not crash old saves on a smaller catalogue.
  pool.sort((a,b)=>score(b,p.style)-score(a,p.style)||b.level-a.level||a.id-b.id);
  const selected=[],copies=new Map();
  const add=(cid)=>{
   if(selected.length>=40||(copies.get(cid)||0)>=3)return false;
   selected.push(cid);copies.set(cid,(copies.get(cid)||0)+1);return true;
  };
  const aceId=ACE_CARD_IDS[id],ace=CARDS[aceId];
  if(ace&&!ace.fusionOnly)for(let i=0;i<3;i++)add(aceId);
  const append=(items,n)=>{for(const c of items){
   for(let i=0;i<n&&selected.length<40;i++)add(c.id);
   if(selected.length>=40)break;
  }};
  if(p.style==='defense'){
   append(pool.filter(c=>role(c)==='soul'),2);
   append(pool.filter(c=>role(c)==='guardian'),2);
  }else if(p.style==='attack')append(pool.filter(c=>role(c)==='predator'),2);
  else if(p.style==='fusion')append(pool.filter(c=>role(c)==='combatant'),2);
  append(pool,3);
  if(selected.length!==40)return original;
  let fusionDeck=[...original.fusionDeck];
  if(ace?.fusionOnly){
   if(!fusionDeck.includes(aceId)){
    if(fusionDeck.length>=15)fusionDeck.pop();
    fusionDeck.push(aceId);
   }
   // One legal signature is better than an unreachable permanent placeholder.
   if(!fusionDeck.includes(aceId))throw Error('KI-ACE fehlt im Fusionsdeck von Gegner '+id);
  }
  return {...original,deck:selected,fusionDeck,
   power:Math.min(1.75,(original.power||1)*(id>=7?1.14:id>=4?1.07:1)),
   arcaneAiProfile:p.style};
 }
 const prevLoad=rpgEnemyLoadout;
 rpgEnemyLoadout=function(id,difficulty='easy',stage){
  const base=prevLoad(id,difficulty,stage);
  return profileFor(id)?curate(id,difficulty,base):base;
 };
 // The AI's ACE remains inside its legal 40-card deck. Its telegraphed
 // 'strategy search' moves an existing ACE closer to the top of that deck;
 // it does not create a free copy or inspect the human's hidden hand.
 function cueAce(g,p,profile){
  if(g.arcaneAceCue||g.aiPhase!=='summon'||g.summoned||g.turn<profile.aceTurn)return;
  const ace=ACE_CARD_IDS[g.opponentId],c=CARDS[ace];
  if(!c)return;
  const visible=[...p.hand,...p.field.filter(Boolean),...p.graveyard].some(x=>x.id===ace);
  if(visible){g.arcaneAceCue=true;return;}
  const index=p.deck.indexOf(ace);
  if(index<0){g.arcaneAceCue=true;return;}
  p.deck.splice(index,1);p.deck.unshift(ace);g.arcaneAceCue=true;
  logEvent(g,'✦ '+RPG_OPPONENTS[g.opponentId].name+
    ' bereitet sein ACE vor! Die Signaturkarte wird bei der nächsten Ziehphase verfügbar.');
 }
 function fusionCandidate(g,p,profile){
  const hand=p.hand.filter(c=>!c.fate),cards=p.remainingFusion||[];
  if(hand.length<2||!cards.length)return null;
  let best=null;
  const inspect=chosen=>{
   const levels=chosen.map(c=>dataOf(c).level),options=fusionOptions(g,levels,chosen)
    .filter(c=>cards.includes(c.id)&&canCompleteHandFusion(g,levels,c.id));
   for(const template of options){
    const isAce=template.id===ACE_CARD_IDS[g.opponentId];
    const value=baseStat(template,'atk',p)+baseStat(template,'def',p)*.6+
      template.level*130+(isAce?100000:0);
    if(!best||value>best.value)best={value,choice:template.id,uids:chosen.map(c=>c.uid),isAce};
   }
  };
  for(let i=0;i<hand.length;i++)for(let j=i+1;j<hand.length;j++){
   inspect([hand[i],hand[j]]);
   if(profile.difficulty!=='leicht')for(let k=j+1;k<hand.length;k++)inspect([hand[i],hand[j],hand[k]]);
  }
  return best;
 }
 function healPlan(g,p){
  const soul=p.field.map((c,i)=>({c,i})).filter(x=>x.c&&role(x.c)==='soul');
  for(const ally of soul){
   const base=baseStat(CARDS[ally.c.id],'def',p);
   if(ally.c.card.def>=base-50)continue;
   const guard=p.field.findIndex(c=>c&&role(c)==='guardian'&&c.mode==='def'&&!c.attacked&&!c.switched);
   if(guard>=0)return {type:'arcane-guardian-heal',guardian:guard,ally:ally.i};
  }
  return null;
 }
 function drainPlan(g,p){
  const soul=p.field.findIndex(c=>c&&role(c)==='soul'&&c.mode==='def'&&!c.attacked&&!c.switched);
  if(soul<0)return null;
  const targets=g.players[0].field.map((c,i)=>({c,i})).filter(x=>x.c);
  if(!targets.length)return null;
  targets.sort((a,b)=>dataOf(b.c).atk-dataOf(a.c).atk);
  return {type:'arcane-soul-extract',slot:soul,target:targets[0].i};
 }
 function actSupport(g,a){
  const p=g.players[g.active],enemy=g.players[1-g.active];
  if(a.type==='arcane-guardian-heal'){
   const guard=p.field[a.guardian],patient=p.field[a.ally];
   if(!guard||!patient||role(guard)!=='guardian'||role(patient)!=='soul'||
     guard.mode!=='def'||guard.attacked||guard.switched)return false;
   const cap=baseStat(CARDS[patient.id],'def',p),missing=Math.max(0,cap-patient.card.def);
   if(missing<20)return false;
   const heal=Math.min(missing,Math.max(45,Math.round(dataOf(guard).def*.22)));
   patient.card.def+=heal;guard.attacked=true;
   logEvent(g,CARDS[guard.id].name+' heilt '+CARDS[patient.id].name+' um '+heal+' DEF.');
   return true;
  }
  if(a.type==='arcane-soul-extract'){
   const soul=p.field[a.slot],target=enemy.field[a.target];
   if(!soul||!target||role(soul)!=='soul'||soul.mode!=='def'||soul.attacked||soul.switched)return false;
   const stat=target.mode==='def'?'def':'atk',amount=Math.min(120,Math.ceil(target.card[stat]*.10));
   if(amount<=0)return false;
   target.card[stat]=Math.max(0,target.card[stat]-amount);
   soul.card.def+=Math.ceil(amount*.65);soul.attacked=true;
   logEvent(g,CARDS[soul.id].name+' entzieht '+amount+' '+stat.toUpperCase()+
     ' und verwandelt die Energie in '+Math.ceil(amount*.65)+' DEF.');
   return true;
  }
  return false;
 }
 const previousAction=applyAiAction;
 applyAiAction=function(g,a){
  if(a?.type==='arcane-guardian-heal'||a?.type==='arcane-soul-extract')
   return actSupport(g,a);
  if(a?.type==='fusion'&&a.choice!==undefined){
   return prepareHandFusion(g,a.uids,a.choice);
  }
  return previousAction(g,a);
 };
 const oldAi=chooseAiAction;
 chooseAiAction=function(g,policy='balanced'){
  const strategy=opponent(g);
  if(!strategy)return oldAi(g,policy);
  const p=g.players[1];
  cueAce(g,p,strategy);
  if(!g.pending&&g.aiPhase==='summon'&&!g.summoned){
   const ace=ACE_CARD_IDS[g.opponentId],normalAce=p.hand.find(c=>c.id===ace);
   if(normalAce&&p.field.some(c=>!c))return {type:'normal',uid:normalAce.uid};
   const candidate=fusionCandidate(g,p,strategy);
   if(candidate?.isAce||candidate&&(['fusion','hybrid'].includes(strategy.style)))
    return {type:'fusion',uids:candidate.uids,choice:candidate.choice};
   const empty=p.field.findIndex(c=>!c);
   if(empty>=0&&p.hand.length){
    const hand=[...p.hand].sort((a,b)=>{
     const ta=dataOf(a),tb=dataOf(b);
     return score(tb,strategy.style)-score(ta,strategy.style);
    });
    return {type:'normal',uid:hand[0].uid};
   }
  }
  if(!g.pending&&g.aiPhase==='positions'){
   const guard=p.field.findIndex(c=>c&&['guardian','soul'].includes(role(c))&&
      c.mode==='atk'&&!c.attacked&&!c.switched&&
      (strategy.style==='defense'||dataOf(c).def>=dataOf(c).atk*.95));
   if(guard>=0)return {type:'switch',idx:guard};
   // Never switch an 800 DEF guardian with 200 ATK to attack for its
   // insignificant damage. Defence uses support and absorb actions.
   if(strategy.style==='defense')g.aiPhase='attacks';
  }
  if(!g.pending&&g.aiPhase==='attacks'&&['defense','hybrid'].includes(strategy.style)){
   if(strategy.difficulty!=='leicht'){
    const heal=healPlan(g,p);if(heal)return heal;
    const drain=drainPlan(g,p);if(drain)return drain;
   }
  }
  return oldAi(g,strategy.style==='attack'?'offensive':
    strategy.style==='fusion'?'economy':strategy.style==='defense'?'guardian':policy);
 };
 // Swarm bonus counts NORMAL Predator creatures. Existing fusion bonuses and
 // passive Allrounder/Resonator values are unchanged.
 const oldEffective=effectiveAttack;
 effectiveAttack=function(g,c,d){
  const base=oldEffective(g,c,d);
  if(!g||!c||c.fusion||role(c)!=='predator')return base;
  const owner=g.players.findIndex(p=>p.field.includes(c));
  if(owner<0)return base;
  const pack=g.players[owner].field.filter(x=>x&&!x.fusion&&role(x)==='predator').length;
  const bonus=Math.min(8,Math.max(0,pack-1)*2);
  return Math.round(base*(1+bonus/100));
 };
 const oldRoleBonus=normalRoleBonus;
 normalRoleBonus=function(c,stat,owner=0,upgrades){
  const current=oldRoleBonus(c,stat,owner,upgrades);
  const skill=profile?.lv1Saga;
  if(owner!==0||!skill?.perk||!c?.rpg||c.fusionOnly||c.ace||
     c.level!==1||!['atk','def'].includes(stat))return current;
  return current+5*Math.max(1,Math.min(5,skill.skillRank||1));
 };
 window.ArcaneAiRevamp55=Object.freeze({version:'5.5.0',PROFILES,profileFor,
  getScenario:g=>opponent(g)||null,
  predatorSwarm:(g,c)=>c&&g?effectiveAttack(g,c,null)-oldEffective(g,c,null):0});
})();
