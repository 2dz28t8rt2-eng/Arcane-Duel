/* Arcane Duel 3.0 · menu clarity and Essence discovery.
 * Pure presentation: does not grant cards, rewards, stats or unlocks.
 */
'use strict';
(()=>{
 if(typeof renderMenu!=='function')return;
 const ROLE={
  predator:'PREDATOR',guardian:'WÄCHTER',soul:'SEELENZEHRER',
  hunter:'JÄGER',support:'UNTERSTÜTZER',weaver:'RUNENWEBER',combatant:'ALLROUNDER'
 };
 let invitationShown=false;
 const roleOf=id=>{
  const c=CARDS[id];return c?.role||'combatant';
 };
 function addRole(parent,id,large=false){
  if(!parent||!Number.isInteger(id)||!CARDS[id]||parent.querySelector('.arcane-role-readout'))return;
  const role=roleOf(id),badge=document.createElement('div');
  badge.className='arcane-role-readout arcane-role-'+role;
  badge.textContent=(large?'MONSTERKLASSE · ':'')+(ROLE[role]||role.toUpperCase());
  if(large)parent.prepend(badge);
  else {
   const actions=parent.querySelector('.collection-actions');
   if(actions)parent.insertBefore(badge,actions);
  }
 }
 function decoratePreview(id){
  const meta=$('deckSidePreview')?.querySelector('.deck-preview-meta');
  if(!meta)return;
  if(!Number.isInteger(id)){
   const marked=document.querySelector('#menuContent .collection-item.preview-selected [data-preview-card]');
   id=Number(marked?.dataset.previewCard);
  }
  if(Number.isInteger(id)&&CARDS[id])addRole(meta,id,true);
 }
 function decorate(){
  if(uiMode!=='menu'||!['collection','fusions'].includes(menuTab))return;
  document.querySelectorAll('#menuContent .deck-editor-grid .collection-item').forEach(item=>{
   const card=item.querySelector('[data-preview-card]');
   if(card)addRole(item,Number(card.dataset.previewCard));
  });
  decoratePreview();
 }
 function essenceInvitation(){
  if(invitationShown||uiMode!=='menu'||!profile.cleared?.includes(3))return;
  const api=window.ArcaneEssenceCombat;if(!api?.essence)return;
  const essence=api.essence();
  if(essence.chosen!==null||!(essence.intro>=0&&essence.intro<=3))return;
  if(!$('overlay')?.classList.contains('hidden'))return;
  invitationShown=true;
  const complete=essence.intro===3;
  const description=complete?
   'Du hast alle drei Schulprüfungen abgeschlossen. Jetzt darfst du genau ein Essenzmonster dauerhaft an dich binden. Die Wahl ist einmalig und unwiderruflich.':
   'Nach Turniergegner III hast du die drei Schulen freigeschaltet: Predatoren, Runenfusion und Bollwerk. Spiele ihre drei kostenlosen Lehrduelle mit Leihdecks. Erst danach wählst du dein persönliches Essenzmonster.';
  openModal(modalHtml('✦ DIE ESSENZSCHULEN',complete?'Deine Essenzbindung wartet':'Ein neuer Pfad öffnet sich','✦',
   'Die Wahl deines Begleiters ist keine zufällige Kartenbelohnung.',
   '<div class="arcane-essence-ceremony"><div class="essence-ceremony-glyph">✧</div>'+
   '<h3>'+(complete?'Drei Schulen gemeistert':'Die Essenzwesen rufen dich')+'</h3><p>'+description+'</p>'+
   '<p><b>'+essence.intro+' / 3 Schulprüfungen bestanden</b></p></div>',
   '<button class="btn" id="clarityEssenceLater">SPÄTER</button>'+
   '<button class="btn primary" id="clarityEssenceGo">'+(complete?'MEIN ESSENZWESEN WÄHLEN':'ZUR ESSENZAKADEMIE')+'</button>'));
  $('clarityEssenceLater').onclick=hideModal;
  $('clarityEssenceGo').onclick=()=>{
   hideModal();
   window.ArcaneRoyalUI?.navigate?.('challenges');
   if(complete){
    const pick=document.querySelector('[data-essence-open-choice]');
    if(pick)pick.click();
   }
  };
 }
 const previousRender=renderMenu;
 renderMenu=function(){
  previousRender();
  decorate();
  if(uiMode==='menu'&&profile.cleared?.includes(3)&&!invitationShown)setTimeout(essenceInvitation,75);
 };
 const previousPreview=updateDeckPreview;
 updateDeckPreview=function(fusion,id){previousPreview(fusion,id);decoratePreview(id);};
 window.ArcaneClarityUpdate=Object.freeze({version:'1.0.0',decorate,essenceInvitation});
 if(uiMode==='menu')renderMenu();
})();