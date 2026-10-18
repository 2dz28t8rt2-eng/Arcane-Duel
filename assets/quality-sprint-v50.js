/* Arcane Duel – v5.0 first QA pass: inspect UX, guidance, milestone transitions, research invite. */
'use strict';
(()=>{
 const escape=x=>escapeHtml(String(x));
 // Enemy card reading uses the existing large left-hand inspector instead of a modal.
 const previousEnemy=onEnemySlot;
 onEnemySlot=function(idx){
  if(game?.selection?.type==='field'&&inputAllowed())return previousEnemy(idx);
  if(!game||uiMode!=='duel')return;
  const viewer=game.mode==='pve'?0:game.active,enemy=game.players[1-viewer]?.field[idx];
  if(!enemy)return;
  enemyPreviewIndex=idx;
  game.selection=null;
  renderCardPreview();
  const el=$('largeCardPreview');
  if(el)el.classList.add('ad-inspected');
 };
 const screen=$('duelScreen');
 screen?.addEventListener('click',event=>{
  if(!game||uiMode!=='duel'||event.target.closest('[data-hand],[data-mine],[data-enemy]'))return;
  const preview=$('largeCardPreview');
  if(!preview||(!preview.classList.contains('ad-inspected')&&!preview.querySelector('.hand-card')))return;
  // Backdrop click dismisses just the preview; never cancels committed fusions.
  if(game.pending)return;
  enemyPreviewIndex=null;
  game.selection=null;
  preview.classList.remove('ad-inspected');
  renderCardPreview();
 });
 // Visible, claimable side quests deserve a dedicated prominent entry point.
 function questsBanner(){
  if(uiMode!=='menu'||menuTab!=='challenges')return;
  const host=$('menuContent');
  if(!host||host.querySelector('#adQuestReminder'))return;
  const active=host.querySelectorAll('.evo-quest').length;
  const ready=host.querySelectorAll('.evo-quest-ready').length;
  if(!active)return;
  host.insertAdjacentHTML('afterbegin',
   '<div id="adQuestReminder" class="ad-qa-promo"><div><b>✦ SAMMELBARE QUESTS</b><p>'+
   active+' aktive Aufgaben'+(ready?' · '+ready+' Belohnung(en) abholbereit!':' · Fortschritt durch normales Spielen')+
   '</p></div><button class="btn primary" id="adQuestJump">QUESTS ANSEHEN</button></div>');
  $('adQuestJump')?.addEventListener('click',()=>host.querySelector('.evo-quests')?.scrollIntoView({behavior:'smooth',block:'start'}));
 }
 // Visible glow on eligible monster ascensions; no misleading glow when missing copies.
 function ascensionGlow(){
  if(uiMode!=='menu'||!['collection','fusions'].includes(menuTab))return;
  for(const node of document.querySelectorAll('#menuContent [data-preview-card]')){
   const id=Number(node.dataset.previewCard);
   if(!Number.isInteger(id)||!CARDS[id])continue;
   const cost=enhanceCost(id),rank=profile.enhancements[id]||0;
   const eligible=rank<5&&freeCopies(id)>=cost.copies;
   node.classList.toggle('ad-upgrade-ready',eligible);
   if(eligible)node.title=(node.title?node.title+' · ':'')+'Aufstieg verfügbar';
  }
 }
 function announceFanatic(){
  const saga=window.ArcaneLv1Saga;
  if(!saga||uiMode!=='menu'||game||profile.rewardQueue?.length||
    !$('overlay')?.classList.contains('hidden'))return;
  const state=saga.state();
  if(state.stage!==0||!saga.forced()||state.invitationSeen)return;
  state.offered=true;state.invitationSeen=true;
  saveProfile();
  openModal(modalHtml('✦ DER FANATIKER IST DA','Die vergessenen Funken','✦',
   'Du hast die Voraussetzungen für den Level-1-Forscher erfüllt. Er wartet mit einer ungewöhnlichen Forschungsreihe auf dich.',
   '<p>Fünf Herausforderungen · Floating · Schwarm · drei Spezialfusionen · einzigartiges ACE und Booster-Belohnungen.</p>',
   '<button class="btn primary" id="adFanaticVisit">ZUM FORSCHER</button><button class="btn" id="adFanaticLater">SPÄTER</button>'));
  $('adFanaticVisit').onclick=()=>{hideModal();menuTab='challenges';renderMenu();$('lv1Saga')?.scrollIntoView({block:'start'});};
  $('adFanaticLater').onclick=()=>hideModal();
 }
 const prevMenu=renderMenu;
 renderMenu=function(...args){
  const result=prevMenu(...args);
  questsBanner();ascensionGlow();announceFanatic();
  return result;
 };
 // Milestones should celebrate the level before revealing the already-earned cards.
 const prevMilestone=showMilestone;
 let milestonePreview=null;
 showMilestone=function(...args){
  const reward=profile.rewardQueue?.[0];
  if(!reward)return prevMilestone(...args);
  const id=reward.level+':'+reward.kind+':'+(reward.tier||'');
  if(milestonePreview!==id){
   milestonePreview=id;
   openModal(modalHtml('✦ LEVELAUFSTIEG ✦','LEVEL '+reward.level+' ERREICHT','✦',
    'Ein neuer Meilenstein! Deine Belohnung wartet bereits.',
    '<div class="ad-levelup-orbit" aria-hidden="true"><span>✧</span><strong>'+reward.level+'</strong><span>✧</span></div>'+
    '<p>Bestätige, um '+(reward.kind==='choice'?'deine Belohnung auszuwählen':'deine Karten und Belohnungen aufzudecken')+'.</p>',
    '<button class="btn primary" id="adMilestoneReveal">BELOHNUNG AUFDECKEN</button>'));
   const el=$('modal');el?.classList.add('ad-levelup-modal');
   $('adMilestoneReveal')?.addEventListener('click',()=>prevMilestone(...args));
   return;
  }
  return prevMilestone(...args);
 };
 window.ArcaneQualitySprint=Object.freeze({version:'5.0',questsBanner,ascensionGlow,announceFanatic});
 if(uiMode==='menu')renderMenu();
})();