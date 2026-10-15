/* Arcane Duel – accessible menu, duel and reveal refinements.
 * Loaded after the core, evolution, Academy and tactical advisor.
 * No replay/save schema changes; the pending-hand cancellation happens before
 * an actual summon and never refunds a committed fusion.
 */
'use strict';
(()=>{
 const esc=v=>escapeHtml(String(v));
 const roleName={predator:'PREDATOR',guardian:'WÄCHTER',soul:'SEELENZEHRER',
  support:'UNTERSTÜTZER',weaver:'RUNENWEBER',hunter:'JÄGER',combatant:'ALLROUNDER'};
 const roleOf=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const previousCard=fullCardHtml;
 fullCardHtml=function(c,attrs='',classes='',badge=''){
  let html=previousCard(c,attrs,classes,badge);
  // Actual digit count, rather than a global 23px style, sets the fit of long stats.
  html=html.replace(/<strong class="stat-value">([0-9]+)<\/strong>/g,(match,digits)=>
   digits.length>=5?'<strong class="stat-value arcane-stat-long">'+digits+'</strong>':match);
  const role=roleOf(c),label=roleName[role]||roleName.combatant;
  const stamp='<span class="arcane-card-role arcane-role-'+esc(role)+'" title="Monsterrolle: '+esc(label)+'">'+esc(label)+'</span>';
  return html.replace('<div class="hand-type">',stamp+'<div class="hand-type">');
 };
 // Show the role directly on both miniature field cards, including an inherited
 // role that exists only on this fused instance.
 const previousBoardCard=cardHtml;
 cardHtml=function(c,side){
  const html=previousBoardCard(c,side);
  const role=roleOf(c),label=roleName[role]||roleName.combatant;
  return html.replace('<div class="board-name">',
   '<span class="arcane-board-role arcane-board-'+esc(role)+'" title="Monsterrolle: '+esc(label)+'">'+esc(label)+'</span><div class="board-name">');
 };
 // Clicking an already prepared normal card cancels it, instead of forcing a summon.
 const previousHand=onHand;
 onHand=function(uid){
  if(!inputAllowed()||!game)return;
  if(game.pending?.kind==='normal'){
   const existing=game.pending.card?.uid;
   game.pending=null;game.selection=null;
   if(existing===uid){render();return;}
  }
  return previousHand(uid);
 };
 $('summonStage')?.addEventListener('click',event=>{
  const card=event.target.closest('.stage-card');if(!card||!inputAllowed()||game?.pending?.kind!=='normal')return;
  game.pending=null;game.selection=null;render();
  toast('Beschwörung zurückgezogen. Du kannst eine andere Handkarte wählen.');
 });
 // A card on the opposing field is readable even when no attack is selected.
 const oldEnemy=onEnemySlot;
 onEnemySlot=function(idx){
  if(game?.selection?.type==='field'&&inputAllowed())return oldEnemy(idx);
  const foe=game?.players[game.mode==='pve'?1:1-game.active],card=foe?.field[idx];
  if(!card||aiRunning)return;
  const t=dataOf(card);
  openModal(modalHtml('GEGNERISCHE KREATUR',esc(t.name),'✦',
   'Du kannst ihre aktuellen Werte und Fähigkeiten untersuchen. Zurück im Duell kannst du den Angreifer auswählen.',
   '<div class="arcane-enemy-large">'+fullCardHtml(card,'disabled','enemy-inspection')+
   '<p><b>Rolle:</b> '+esc(roleName[roleOf(card)]||roleOf(card))+
   ' · <b>Position:</b> '+(card.mode==='def'?'Verteidigung':'Angriff')+
   ' · <b>ATK:</b> '+t.atk+' · <b>DEF:</b> '+t.def+'</p>'+
   (card.essenceCombat?'<p>Seelenessenz: '+card.essenceCombat.soul+
   ' · Verdichtet: '+card.essenceCombat.condensed+'</p>':'')+'</div>',
   '<button type="button" class="btn primary" id="arcaneCloseEnemy">ZUM DUELL</button>'));
  $('arcaneCloseEnemy').onclick=hideModal;
 };
 const oldRender=render;
 render=function(){
  oldRender();
  if(!game||uiMode!=='duel')return;
  // Keep opponent cards inspectable even outside the player's active turn.
  $('enemyRow')?.querySelectorAll('button[data-enemy]').forEach(b=>{
   if(b.querySelector('.tc-card')||b.querySelector('.hand-card')||game.players[1-(game.mode==='pve'?0:game.active)]?.field[Number(b.dataset.enemy)])b.disabled=false;
  });
  const stage=$('summonStage');
  if(stage&&game.pending?.kind==='fusion'){
   const card=game.pending.card,t=dataOf(card),m=card.rollMath;
   const range=stat=>{
    if(!m?.base)return '?';
    const v=m.base[stat],pen=m.penalty||0,extra=m.bonus?.[stat]||0;
    return fmt(Math.max(0,Math.floor(v*.88/10)*10-pen-10))+'–'+fmt(Math.max(0,Math.ceil(v*1.12/10)*10+extra-pen+10));
   };
   if(game.pending.revealed&&!game.cinemaActive){
    // REAL first-phase end values only after the complete pre-placement ritual.
    stage.innerHTML='<div class="stage-card arcane-fusion-ready-card">'+
     fullCardHtml(card,'disabled','arcane-pending-fusion')+'</div>'+
     '<div class="stage-copy"><span class="step">SCHRITT 2 · FUSION ENTHÜLLT</span>'+
     '<b>'+esc(t.name)+' · LV '+t.level+'</b><br>ATK '+fmt(t.atk)+' / DEF '+fmt(t.def)+
     '<br>Wähle jetzt eine Monsterzone. Auf belegten Zonen entsteht eine <b>zweite, schnellere Fusion</b>.</div>';
   }else{
    stage.innerHTML='<div class="arcane-fusion-concealed"><span>✧ FUSION IM RITUAL ✧</span>'+
     '<strong>'+esc(t.name)+'</strong><p>Potenzial · ATK '+range('atk')+' · DEF '+range('def')+
     '</p><p>Die echten Würfe werden gerade in der Fusionsanimation enthüllt.</p></div>';
   }
  }else if(stage&&game.pending?.kind==='normal'){
   const card=stage.querySelector('.stage-card');
   if(card){card.classList.add('arcane-stage-cancel');card.title='Erneut antippen, um die Beschwörung zurückzuziehen';}
  }
 };
 // Fusion identity/art is selectable, but numerical power is not previewed.
 chooseFusionModal=function(levels,materials,callback,extra=''){
  const options=fusionOptions(game,levels).filter(c=>game.pending||canCompleteHandFusion(game,levels,c.id))
   .sort((a,b)=>b.level-a.level||b.atk-a.atk);
  if(!options.length){toast(fusionFailureReason(game,levels));return;}
  const safeImage=c=>/^(assets\/|data:image\/svg\+xml)/.test(c.art||'')?c.art:'';
  const body='<p>Materialien: '+materials.map(c=>esc(dataOf(c).name)).join(' + ')+'</p>'+
   '<p class="arcane-fusion-mystery">Die Bereiche zeigen nur das mögliche Potenzial. Die echten Würfe und Endwerte werden erst bei der Fusion enthüllt.</p>'+
   '<div class="pool-grid fusion-choice-grid arcane-sealed-choices">'+options.map(c=>{
    const img=safeImage(c),v=game.mode==='pve'?fusionPreview(game,c,materials,levels):null;
    const forecast=v?'<span class="arcane-fusion-potential">ATK '+fmt(v.atk[0])+'–'+fmt(v.atk[1])+' · DEF '+fmt(v.def[0])+'–'+fmt(v.def[1])+'</span><small>'+v.rolls+' Wertewürfe · kein fester Endwert</small>':'';
    return '<article class="arcane-sealed-choice"><button type="button" class="arcane-fusion-pick" data-fusion-choice="'+c.id+'">'+
     (img?'<img src="'+img+'" alt="" loading="lazy">':'<span class="arcane-fusion-emblem">✧</span>')+
     '<strong>'+esc(c.name)+'</strong><span>LV '+c.level+' · '+(countCard(game.players[game.active].remainingFusion,c.id)-1)+' weitere Karten</span>'+
     forecast+'<small>Fusionskarte auswählen</small></button></article>';
   }).join('')+'</div>';
  openModal(modalHtml('FUSION', 'Welches Wesen soll entstehen?', '✧',
   'Du bestimmst die Fusionskarte. Was die Vereinigung wirklich bewirkt, bleibt bis zur Beschwörung verborgen.',
   body,'<button type="button" class="btn" id="fusionCancel">ZURÜCK</button>'));
  $('modal').classList.add('fusion-choice-modal','pool-modal');
  $('fusionCancel').onclick=hideModal;
  let done=false;
  $('modal').querySelectorAll('[data-fusion-choice]').forEach(btn=>btn.onclick=()=>{
   if(done)return;done=true;hideModal();callback(Number(btn.dataset.fusionChoice));
  });
 };
 // Large deck preview appears near the pressed card, not far above viewport.
 let previewAnchor=null;
 document.querySelector('#menuScreen')?.addEventListener('click',e=>{
  const btn=e.target.closest('[data-preview-card]');
  if(!btn)return;
  const box=btn.getBoundingClientRect();
  previewAnchor={x:box.right,y:box.top};
 },true);
 const oldPreview=updateDeckPreview;
 updateDeckPreview=function(fusion,id){
  oldPreview(fusion,id);
  if(!previewAnchor||window.innerWidth<850)return;
  const panel=$('deckSidePreview');if(!panel)return;
  panel.classList.add('arcane-floating-preview');
  panel.style.top=Math.max(8,Math.min(previewAnchor.y,window.innerHeight-140))+'px';
  panel.style.left=Math.max(8,Math.min(previewAnchor.x+12,window.innerWidth-370))+'px';
  const sticky=panel.querySelector('.deck-side-sticky');if(sticky)sticky.style.position='static';
  const close=document.createElement('button');close.type='button';
  close.className='arcane-preview-close';close.textContent='×';close.title='Kartenvorschau schließen';
  close.onclick=()=>{panel.classList.remove('arcane-floating-preview');panel.style.top='';panel.style.left='';};
  panel.prepend(close);
 };
 const previousMenu=renderMenu;
 renderMenu=function(){
  previousMenu();
  if(uiMode!=='menu')return;
  const area=$('menuContent');if(!area)return;
  // Change text nodes only: replacing innerHTML would discard the game's event handlers.
  const walker=document.createTreeWalker(area,4);
  let node;
  while((node=walker.nextNode())){
   node.nodeValue=node.nodeValue
    .replaceAll('ATK-betonte Karten','Karten mit hoher Angriffskraft')
    .replaceAll('DEF-betonte Karten','Karten mit hoher Verteidigungskraft')
    .replaceAll('unverbindlicher Vorschlag','Tipp für deinen nächsten Kampf')
    .replace(/Charakterpack(s?)(?!-Booster)/g,'Charakter-Boosterpack$1');
  }
  area.querySelectorAll('.fm-extra-info').forEach(details=>{
   const summary=details.querySelector('summary');
   if(summary)summary.textContent='Tipps zu diesem Bereich';
  });

 };
 window.ArcaneInterfaceUpdate={version:'1.0.0',roleName};
})();
