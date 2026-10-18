/* Arcane Duel – v5.0 first QA pass: inspect UX, guidance, milestone transitions, research invite. */
'use strict';
(()=>{
 const escape=x=>escapeHtml(String(x));
 // Restore the ACE's element on actual battlefield cards for the matching
 // colored aura; fullCardHtml already exposes this attribute.
 const priorBoard=cardHtml;
 cardHtml=function(c,...args){
  const html=priorBoard(c,...args),data=dataOf(c);
  if(!data?.ace||!html.includes('class="board-creature'))return html;
  return html.replace('class="board-creature',
   'data-element="'+escapeHtml(data.element||'')+'" class="board-creature');
 };
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
 // Support is currently a contextual passive, not a missing active button.
 // Its real combat buff applies only when the essence-combat ruleset is active.
 const previousRules=showRules;
 showRules=function(...args){
  const result=previousRules(...args);
  const root=$('modal');
  if(root&&!root.querySelector('.ad-qa-support-help')){
   const info='<section class="ad-qa-support-help"><h3>✦ Unterstützer</h3>'+
    '<p>Unterstützer besitzen eine eher ausgeglichene ATK-/DEF-Verteilung. '+
    'In Essenzduellen verstärkt ein Unterstützer in <b>DEF-Position</b> die ATK anderer, '+
    'nicht fusionierter eigener Angreifer um maximal +160 '+
    '(Grundbonus +25 sowie +8 je Level des Angreifers). '+
    '<b>Außerhalb der Essenzregeln haben Unterstützer derzeit keine eigene aktive Spezialfähigkeit.</b></p>'+
    '<p><b>Allrounder:</b> Als Fusionsmaterial verbessern sie die Fusionsqualität; '+
    'über mehrere überlebte Züge sammeln sie auf dem Feld zusätzliche Resonanzladungen. '+
    'Eine rollenlose Fusion wird zum Resonator und erhält eine stärkere Resonanzmechanik.</p></section>';
   root.insertAdjacentHTML('beforeend',info);
  }
  return result;
 };
 if($('rulesBtn'))$('rulesBtn').onclick=showRules;
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
  openModal(modalHtml('??? · UNBEKANNTER DUELLANT','Ein Fremder sucht dich','✦',
   'Ein ungewöhnlicher Duellant möchte dich herausfordern. Niemand weiß genau, weshalb er von winzigen Monstern so besessen ist.',
   '<p>Ein unbekannter Forscher fordert dich heraus. Hinter seinen Experimenten verbergen sich ein einzigartiger Skill und geheimnisvolle Belohnungen.</p>',
   '<button class="btn primary" id="adFanaticVisit">HERAUSFORDERUNG ANSEHEN</button><button class="btn" id="adFanaticLater">SPÄTER</button>'));
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