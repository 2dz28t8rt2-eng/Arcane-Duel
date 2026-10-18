/* Arcane Duel 5.1 · focused QA follow-up.
 * Keeps existing cards, saves, role balance and PvP untouched.
 */
'use strict';
(()=>{
 const levelDecayExtra=c=>{
  const level=Math.max(1,Math.min(10,Number(dataOf(c)?.level)||1));
  return Math.ceil((level-1)/2)*4; // LV1 0, LV5 8, LV10 20.
 };
 const lastAttack=attack;
 attack=function(g,ai,di){
  const attacker=g?.players?.[g.active]?.field?.[ai]||null;
  const defender=di===null?null:g?.players?.[1-g.active]?.field?.[di]||null;
  const versusDefense=defender?.mode==='def';
  const turn=g?.turn;
  const result=lastAttack(g,ai,di);
  if(!result||!attacker||g?.mode!=='pve')return result;
  // A creature that has committed an attack may not rotate back to DEF,
  // even if later modules modify the ordinary attacked flag.
  attacker.arcaneAttackTurn=turn;
  if(versusDefense&&g.players[g.active]?.field?.[ai]===attacker&&attacker.card){
   const cost=20; // Additional ATK wear against a defending creature.
   attacker.card.atk=Math.max(0,attacker.card.atk-cost);
   attacker.attackFatigue=(attacker.attackFatigue||0)+cost;
   logEvent(g,dataOf(attacker).name+': −'+cost+' zusätzliche ATK durch Angriff auf DEF.');
  }
  return result;
 };
 const lastSwitch=switchPosition;
 switchPosition=function(g,idx){
  const unit=g?.players?.[g.active]?.field?.[idx];
  if(unit&&(unit.attacked||unit.arcaneAttackTurn===g.turn))return false;
  return lastSwitch(g,idx);
 };
 const lastPlace=placePending;
 placePending=function(g,idx,...args){
  const old=g?.players?.[g.active]?.field?.[idx];
  const incoming=g?.pending?.card;
  const attackSpent=!!(old?.attacked||incoming?.attacked||
    old?.arcaneAttackTurn===g?.turn||incoming?.arcaneAttackTurn===g?.turn);
  const result=lastPlace(g,idx,...args);
  if(result?.card&&attackSpent){
   result.card.attacked=true;
   result.card.arcaneAttackTurn=g.turn;
  }
  return result;
 };
 const lastChoose=chooseAiAction;
 chooseAiAction=function(g,...args){
  const action=lastChoose(g,...args);
  if(g?.mode==='pve'&&g.active===1&&action?.type==='switch'){
   const unit=g.players[1]?.field?.[action.idx];
   if(unit?.attacked||unit?.arcaneAttackTurn===g.turn){
    // Do not get stuck in an invalid AI switch loop.
    g.aiPhase='end';
    return {type:'end'};
   }
  }
  return action;
 };
 const lastAdvance=advanceTurn;
 advanceTurn=function(g,...args){
  if(!g)return lastAdvance(g,...args);
  const turn=g.turn,owner=g.active;
  const eligible=g.mode==='pve'&&g.winner===null&&!g.pending&&
    g.evolutionMode!=='burst'?
    g.players[owner].field.filter(c=>c?.card&&c.summonedTurn!==turn):[];
  const result=lastAdvance(g,...args);
  if(result===false||g.turn===turn||g.mode!=='pve')return result;
  for(const c of eligible){
   if(!g.players[owner].field.includes(c)||!c.card)continue;
   const extra=levelDecayExtra(c);
   if(!extra)continue;
   for(const stat of ['atk','def'])
    c.card[stat]=Math.max(0,c.card[stat]-extra);
   c.decayTotal=(c.decayTotal||0)+extra;
   logEvent(g,dataOf(c).name+': zusätzlicher Stufenzerfall −'+extra+' ATK/DEF.');
  }
  return result;
 };
 const previousDecay=decayDescription;
 decayDescription=function(c){
  const html=previousDecay(c);
  if(!html||!game||game.mode!=='pve'||!c?.decayClass)return html;
  const extra=levelDecayExtra(c);
  if(!extra)return html.replace('Angriff: zusätzlich −30 ATK.',
    'Angriff: −30 ATK, gegen DEF weitere −20 ATK.');
  return html.replace('</p>',
   '<br><b>Stufenzerfall:</b> Zusätzlich −'+extra+
   ' ATK/DEF pro regulärem eigenen Zugende (Lv '+dataOf(c).level+
   '). Angriffe auf DEF verursachen außerdem −20 ATK.</p>');
 };
 // Existing v5.0 handles card inspection inside #duelScreen. This closes it
 // from any other part of the page, including the left-hand inspector itself.
 document.addEventListener('click',event=>{
  if(!game||uiMode!=='duel'||busy||aiRunning||game.pending||
    event.target.closest('[data-hand],[data-mine],[data-enemy]'))return;
  const panel=document.getElementById('largeCardPreview');
  if(!panel?.querySelector('.hand-card.tc-card'))return;
  enemyPreviewIndex=null;
  game.selection=null;
  panel.classList.remove('ad-inspected');
  renderCardPreview();
 });
 // Reveal the battlefield BEFORE an active soul ability animates. The combat
 // handler runs in the bubble phase; moving the viewport in capture ensures
 // that the target, orb and projectile are visible on narrow displays.
 document.getElementById('duelScreen')?.addEventListener('click',event=>{
  const button=event.target.closest('button[data-essence-target],button[data-essence-combat]');
  if(!button||button.disabled||!game||uiMode!=='duel'||busy)return;
  const target=button.dataset.essenceTarget!==undefined?
   document.getElementById('enemyRow'):document.getElementById('ownRow');
  target?.scrollIntoView({block:'center',behavior:'instant'});
 },true);
 // The deck must use the same normal-monster formula as a fresh PvE summon.
 // Keep the separate essence-monster and rolled-fusion previews untouched.
 const previousProfileCard=profileCard;
 profileCard=function(card){
  const result=previousProfileCard(card);
  if(!card||!result?.card||card.essenceMonster||card.fusionOnly)return result;
  const loadout={id:0,power:1,enhancements:profile.enhancements,
   flatBonus:monsterTrainingBonus(profile.upgrades.power)};
  for(const stat of ['atk','def'])result.card[stat]=round10(baseStat(card,stat,loadout));
  return result;
 };
 // A visible shortcut on duel-related menus helps players discover quests early.
 const olderRenderMenu=renderMenu;
 renderMenu=function(...args){
  const result=olderRenderMenu(...args);
  if(uiMode!=='menu'||!['tournament','free','upgrades'].includes(menuTab))return result;
  const host=document.getElementById('menuContent');
  if(host&&!document.getElementById('adQuestEntrance')){
   host.insertAdjacentHTML('afterbegin',
    '<section class="ad-quest-entrance" id="adQuestEntrance">'+
    '<div><strong>✦ SAMMELBARE QUESTS & BELOHNUNGEN</strong>'+
    '<p>Deine Aufgaben laufen beim Spielen mit. Prüfe regelmäßig, welche Belohnungen bereitliegen.</p></div>'+
    '<button type="button" class="btn primary" id="adGoQuests">QUESTS ANSEHEN →</button></section>');
   document.getElementById('adGoQuests')?.addEventListener('click',()=>{
    menuTab='challenges';renderMenu();
    document.getElementById('menuContent')?.scrollIntoView({block:'start',behavior:'smooth'});
   });
  }
  return result;
 };
 // Upgrade text makes the exact stat increase explicit without implying that
 // any specialization is categorically superior.
 if(typeof UPGRADES==='object'){
  if(UPGRADES.power)UPGRADES.power.desc=
   'Jede Stufe erhöht bei allen eigenen Monstern ATK und DEF um jeweils: '+
   '+35 / +25 / +15 / +10 / +8 / +6 / +4 / +3 / +2 / +2. '+
   'Nach allen 10 Stufen: insgesamt +110 ATK und +110 DEF je Monster.';
  if(UPGRADES.resilience)UPGRADES.resilience.desc=
   'Verringert den normalen ATK- und DEF-Zerfall am eigenen Zugende: '+
   'Rang 1 um 3, Rang 2 um 6 Punkte je Wert. '+
   'Stufenabhängiger Zusatzzerfall und Abnutzung durch Angriffe bleiben erhalten.';
 }
 window.ArcaneQaFollowup=Object.freeze({version:'5.1',levelDecayExtra});
 if(uiMode==='menu')renderMenu();
})();