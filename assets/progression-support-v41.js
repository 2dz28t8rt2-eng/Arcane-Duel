/* Earned role cards, optional progression help and transparent fusion choices.
 * Duration rewards and additional Guardian buffs are not part of this update. */
'use strict';
(()=>{
 const modes=['defense','burst','fusion'],gates=[4,5,9],numerals=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
 const roleNames={guardian:'Wächter',soul:'Seelenzehrer',predator:'Predator',fusion:'Fusionsvorlage',combatant:'Allrounder',support:'Unterstützer',weaver:'Runenweber',hunter:'Jäger'};
 const esc=value=>escapeHtml(String(value));
 const tierOf=(p=profile)=>Math.max(0,...p.cleared);
 const capAt=tier=>tier>=7?10:tier>=5?8:tier>=3?6:4;
 function normalizePrizes(raw){
  const prizes={};
  for(const mode of modes)prizes[mode]=Array.from({length:5},(_,i)=>{
   const id=raw?.prizes?.[mode]?.[i];
   return Number.isInteger(id)&&CARDS[id]&&!CARDS[id].ace&&!CARDS[id].essenceMonster?id:null;
  });
  return {version:1,prizes};
 }
 const oldFresh=freshProfile,oldValidate=validateProfile;
 freshProfile=function(){const p=oldFresh();p.progressionSupport=normalizePrizes(null);return p;};
 validateProfile=function(raw){const p=oldValidate(raw);p.progressionSupport=normalizePrizes(raw?.progressionSupport);return p;};
 let initial=null;
 try{const saved=window.localStorage.getItem(SAVE_KEY);if(saved)initial=JSON.parse(saved);}catch(error){}
 profile.progressionSupport=normalizePrizes(initial?.progressionSupport||profile.progressionSupport);
 if(profile.activeDuel?.evolutionMode&&initial?.activeDuel?.id===profile.activeDuel.id&&Number.isInteger(initial.activeDuel.roleRewardTier)&&initial.activeDuel.roleRewardTier>=0&&initial.activeDuel.roleRewardTier<=10)profile.activeDuel.roleRewardTier=initial.activeDuel.roleRewardTier;
 const prizes=()=>profile.progressionSupport||(profile.progressionSupport=normalizePrizes(null));
 function rewardPlan(mode,stage,tier=tierOf()){
  if(!modes.includes(mode)||!Number.isInteger(stage)||stage<1||stage>5||!Number.isInteger(tier)||tier<0||tier>10)return null;
  const role=mode==='fusion'?'fusion':mode==='burst'?'predator':stage%2?'soul':'guardian';
  const targetLevel=Math.max(role==='fusion'?2:1,Math.min(capAt(tier),1+Math.floor(tier/2)+stage-1));
  const candidates=(role==='fusion'?RPG_FUSIONS:[...ARCANE_STAGE_IDS.values()].map(id=>CARDS[id])).filter(c=>{
   if(!c||!c.rpg||c.retired||c.enemyOnly||c.ace||c.essenceMonster||c.milestoneOnly||c.trainingReward||c.level>targetLevel)return false;
   if(role==='fusion')return c.fusionOnly&&(c.source||0)<=tier&&(c.requiredTier||0)<=tier;
   const root=CARDS[c.lineRoot??c.variantOf??c.id]||c;
   return !c.fusionOnly&&c.role===role&&(root.source||0)<=tier&&(root.requiredTier||0)<=tier;
  });
  const level=Math.max(0,...candidates.map(c=>c.level));
  return {mode,stage,tier,role,roleLabel:roleNames[role],targetLevel,level,ids:candidates.filter(c=>c.level===level).map(c=>c.id)};
 }
 const oldCreate=createGame,oldSnapshot=validateDuelSnapshot;
 createGame=function(options={}){
  const g=oldCreate(options);
  if(g.evolutionMode)g.roleRewardTier=tierOf();
  return g;
 };
 validateDuelSnapshot=function(raw){
  const g=oldSnapshot(raw);
  if(g.evolutionMode&&raw.roleRewardTier!==undefined){
   if(!Number.isInteger(raw.roleRewardTier)||raw.roleRewardTier<0||raw.roleRewardTier>10)throw Error('Ungültige Turnierstufe der Kartenprämie.');
   g.roleRewardTier=raw.roleRewardTier;
  }
  return g;
 };
 const oldReward=rewardMatch;
 rewardMatch=function(g){
  const result=oldReward(g);
  if(!result||storageConflict||!result.evolution||g.mode!=='pve'||g.context!=='challenge'||g.surrendered||g.winner!==0||result.objectives!==3)return result;
  const mode=g.evolutionMode,stage=g.evolutionStage;
  if(!modes.includes(mode)||!Number.isInteger(stage)||stage<1||stage>5||prizes().prizes[mode][stage-1]!==null)return result;
  const plan=rewardPlan(mode,stage,Math.min(tierOf(),g.roleRewardTier??tierOf()));
  if(!plan?.ids.length)return result;
  const least=Math.min(...plan.ids.map(id=>profile.inventory[id]||0));
  const pool=plan.ids.filter(id=>(profile.inventory[id]||0)===least);
  const id=pool[randomInt(g,pool.length)];
  addCard(id);prizes().prizes[mode][stage-1]=id;
  result.roleChallengeCard=id;result.roleChallengeStage=stage;
  g.roleChallengeCard=id;
  logEvent(g,'Kartenprämie für 3/3 Ziele: '+CARDS[id].name+' · Lv '+CARDS[id].level+' ('+plan.roleLabel+').');
  saveProfile();return result;
 };
 function lossStreak(tier,p=profile){
  if(!gates.includes(tier)||p.cleared.includes(tier))return 0;
  let losses=0;
  for(const entry of p.history){
   if(entry.context!=='tournament'||entry.opponent!==tier)continue;
   if(entry.win)break;
   losses++;
  }
  return losses;
 }
 function helpData(tier,p=profile){
  const losses=lossStreak(tier,p);if(losses<3)return null;
  const cards=p.activeDeck.map(id=>CARDS[id]).filter(Boolean),fusionCards=p.fusionDeck.map(id=>CARDS[id]).filter(Boolean);
  const guardians=cards.filter(c=>c.role==='guardian').length,souls=cards.filter(c=>c.role==='soul').length,predators=cards.filter(c=>c.role==='predator').length;
  const messages=tier===4?[
   'Nach Turnier III reicht die Monsterwerkstatt bis Stufe 6. Prüfe, ob du freie Kopien zu einer passenden höheren Stufe verbinden kannst.',
   'Ein gewonnenes Monster hilft erst, wenn es auch im aktiven Deck liegt. Vergleiche deine 40 Karten mit den neu verfügbaren Formen.'
  ]:tier===5?[
   'Vor dem Sieg über V liegt die Werkstattgrenze bei Stufe 6. Nutze diese Stufen gezielt und behalte genug kleine Materialien für passende Kombinationen.',
   'Vergleiche den Nutzen eines passenden Ausbaus mit weiteren Zufallsboostern. Der Ausbau sollte die Karten verbessern, die du tatsächlich spielst.'
  ]:[
   'Die Werkstatt kann inzwischen bis Stufe 10 gehen. Prüfe freie Familienkopien und deine Fusionsvorlagen, bevor du erneut mit denselben niedrigen Stufen antrittst.',
   'Eine hohe Fusionsvorlage reicht allein nicht. Deine Hand braucht ein passendes Materialbudget; mehrere schwache Fusionen können wertvolle Karten verbrauchen.'
  ];
  if(guardians+souls>=8){
   messages.push(souls===0?'Dein Deck enthält Wächter, aber keine Seelenzehrer. Ergänze offensive Seelenwirkung, damit die gewonnene Zeit auch gegnerische LP kostet.':guardians===0?'Dein Deck enthält Seelenzehrer, aber keine Wächter. Wächter in DEF können die gemeinsame Stellung erhalten.':'Wächter und Seelenzehrer gehören zusammen: Die Wächter halten die Stellung, Seelenbrand und bewusstes Entladen liefern den Druck.');
   if(!(p.upgrades.schildwall>0))messages.push('Schildwall verbessert gewöhnliche Wächter und Seelenzehrer gemeinsam. Prüfe den angezeigten Preis bei Skills & Perks.');
  }else if(predators>=12&&!(p.upgrades.jagdinstinkt>0))messages.push('Du spielst viele Predatoren. Prüfe Jagdinstinkt und konzentriere mehrere Angriffe auf ein wichtiges Ziel.');
  messages.push('Wenn ein Versuch scheitert, ändere zunächst eine konkrete Sache: Materialstufen, eine fehlende Vorlage, den Rollenmix oder einen passenden Ausbau.');
  return {tier,losses,cap:capAt(tierOf(p)),highest:Math.max(0,...cards.map(c=>c.level)),fusionLevels:[...new Set(fusionCards.map(c=>c.level))].sort((a,b)=>a-b),guardians,souls,predators,messages};
 }
 function openHelp(tier){
  const data=helpData(tier);if(!data)return;
  const levels=data.fusionLevels.length?data.fusionLevels.join(', '):'keine';
  openModal(modalHtml('HILFE ZUR TURNIERPRÜFUNG','Ein neuer Plan für Prüfung '+numerals[tier-1],'?',
   'Du kannst dein Deck gezielt weiterentwickeln. Diese Hinweise sind kostenlos und verändern deine Karten nicht.',
   '<div class="ad-progression-help"><div class="info-pills"><span>Hauptdeck bis Lv '+data.highest+'</span><span>Werkstatt bis Lv '+data.cap+'</span><span>Vorlagenstufen: '+esc(levels)+'</span></div>'+
   '<ol>'+data.messages.map(text=>'<li>'+esc(text)+'</li>').join('')+'</ol>'+
   '<div class="ad-help-links"><button class="btn" data-progression-go="collection">Hauptdeck prüfen</button><button class="btn" data-progression-go="workshop">Monsterwerkstatt</button><button class="btn" data-progression-go="fusions">Fusionsdeck prüfen</button><button class="btn" data-progression-go="upgrades">Skills & Perks</button></div></div>',
   '<button class="btn primary" id="adProgressionHelpClose">'+(uiMode==='duel'?'ZUM MENÜ':'SCHLIESSEN')+'</button>'));
  $('adProgressionHelpClose').onclick=()=>uiMode==='duel'?returnToMenu():hideModal();
 }
 function showChallengeRewards(){
  const panel=$('menuContent');if(!panel||menuTab!=='challenges')return;
  const intro=panel.querySelector('.evo-intro');
  if(intro&&!intro.querySelector('.ad-prize-explanation'))intro.insertAdjacentHTML('beforeend',
   '<p class="ad-prize-explanation"><b>Neue Kartenprämie:</b> Der erste vollständige Abschluss mit 3/3 Zielen je Stufe gibt eine passende Karte. Verteidigung ergänzt abwechselnd Seelenzehrer und Wächter, Burst gibt Predatoren, Fusion eine Vorlage. Die Stufe wächst mit Turnierfortschritt und Schwierigkeit; frühe Werkstattgrenzen gelten weiterhin. Die Prämie wird beim Duellstart festgelegt und sofort beim Erfolg vergeben.</p>');
  panel.querySelectorAll('button[data-evo-start]').forEach(button=>{
   if(button.querySelector('.ad-challenge-prize-note'))return;
   const info=window.ArcaneEvolution.decodeId(button.dataset.evoStart);if(!info)return;
   const id=prizes().prizes[info.mode][info.stage-1],plan=rewardPlan(info.mode,info.stage);
   const text=id!==null?'✓ Karte erhalten':plan?.level?plan.roleLabel+' · Lv '+plan.level+' bei 3/3':'Kartenprämie bei 3/3';
   button.classList.add('ad-reward-step');button.title=text;
   button.insertAdjacentHTML('beforeend','<small class="ad-challenge-prize-note">'+esc(text)+'</small>');
  });
  if(modes.some(mode=>profile.evolution.records[mode].some((n,i)=>n===3&&prizes().prizes[mode][i]===null))&&!panel.querySelector('.ad-legacy-prize-note'))
   intro?.insertAdjacentHTML('beforeend','<p class="ad-legacy-prize-note">Schon früher bestandene Stufen geben ihre neue Kartenprämie beim nächsten vollständigen 3/3-Abschluss.</p>');
 }
 function showMenuHelp(){
  if(!['tournament','free'].includes(menuTab))return;
  const tier=tierOf()+1,data=helpData(tier),panel=$('menuContent');
  if(!data||!panel||panel.querySelector('.ad-progress-help-entry'))return;
  const node=document.createElement('section');node.className='menu-panel ad-progress-help-entry';
  node.innerHTML='<h2>Eine Idee für Prüfung '+numerals[tier-1]+'</h2><p>Die letzten Versuche waren schwierig. Schau dir passende Möglichkeiten für deine aktuelle Sammlung an.</p><button class="btn" data-progression-help="'+tier+'">? Hinweise zu dieser Prüfung</button>';
  const banner=panel.querySelector('.atlas-content-banner');
  if(banner)banner.insertAdjacentElement('afterend',node);else panel.prepend(node);
 }
 const oldMenu=renderMenu;
 renderMenu=function(){oldMenu();if(uiMode==='menu'){showChallengeRewards();showMenuHelp();}};
 const oldFinished=showFinished;
 showFinished=function(){
  oldFinished();const g=game,modal=$('modal');if(!g||g.winner===null||!modal)return;
  if(Number.isInteger(g.roleChallengeCard)&&!modal.querySelector('.ad-challenge-prize'))modal.insertAdjacentHTML('beforeend',
   '<section class="arcane-reward-showcase ad-challenge-prize"><strong>✦ KARTENPRÄMIE · 3/3 ZIELE</strong>'+fullCardHtml({id:g.roleChallengeCard},'disabled')+
   '<p>'+esc(CARDS[g.roleChallengeCard].name)+' ist jetzt in deiner Sammlung. Du kannst die Karte selbst ins passende Deck legen.</p></section>');
  if(g.noAttackBonus>0&&!modal.querySelector('.ad-no-attack-reward'))modal.insertAdjacentHTML('beforeend','<p class="loot-banner ad-no-attack-reward">✦ Ohne Monsterangriff gewonnen: +'+g.noAttackBonus+' Essenz (10 % der regulären Duellbelohnung). Bereits im Gesamtbetrag enthalten.</p>');
  if(g.mode==='pve'&&g.context==='tournament'&&g.winner===1&&helpData(g.opponentId)&&!modal.querySelector('[data-progression-help]'))
   modal.querySelector('.modal-actions')?.insertAdjacentHTML('beforeend','<button class="btn" data-progression-help="'+g.opponentId+'">? Hilfe zu dieser Prüfung</button>');
 };
 document.addEventListener('click',event=>{
  const help=event.target.closest('button[data-progression-help]');
  if(help){openHelp(Number(help.dataset.progressionHelp));return;}
  const link=event.target.closest('button[data-progression-go]');
  if(!link||!['collection','workshop','fusions','upgrades'].includes(link.dataset.progressionGo))return;
  hideModal();if(uiMode==='duel'&&game?.winner!==null)returnToMenu();
  window.ArcaneRoyalUI?.navigate?.(link.dataset.progressionGo);
 });
 function fusionDecision(g,materials,template){
  const p=g.players[g.active],roleOf=window.ArcaneEssenceCombat.roleOf;
  const inherited=g.mode==='pve'?window.ArcaneRoleFusion.inheritance(materials):null;
  const role=inherited||template.role||'combatant';
  const field=materials.filter(c=>p.field.includes(c));
  const hand=materials.filter(c=>p.hand.includes(c));
  const pending=materials.length-field.length-hand.length;
  const awakening=inherited==='guardian'&&materials.length>=3;
  const guaranteed=awakening&&field.length>=3&&field.every(c=>['guardian','soul'].includes(roleOf(c)));
  const chance=awakening?(guaranteed?1:window.ArcaneRoleFusion.soulOdds(materials)):0;
  return {role,roleLabel:roleNames[role]||role,source:inherited?'Materialien':'Vorlage',field:field.length,hand:hand.length,pending,
   fieldChange:1-field.length,spentAttack:materials.some(c=>c.attacked),chance,
   remaining:countCard(p.remainingFusion,template.id)-1,
   materialAtk:materials.reduce((n,c)=>n+dataOf(c).atk,0),materialDef:materials.reduce((n,c)=>n+dataOf(c).def,0)};
 }
 const oldChoose=chooseFusionModal;
 chooseFusionModal=function(levels,materials,callback,extra=''){
  oldChoose(levels,materials,callback,extra);
  const modal=$('modal');if(!modal?.querySelector('.arcane-sealed-choices'))return;
  const first=modal.querySelector('[data-fusion-choice]'),template=CARDS[Number(first?.dataset.fusionChoice)];if(!template)return;
  const data=fusionDecision(game,materials,template);
  const sources=[data.hand?data.hand+' Handkarte'+(data.hand===1?'':'n'):'',data.field?data.field+' Feldmonster':'',data.pending?data.pending+' vorbereitete Fusion':''].filter(Boolean).join(' + ');
  const movement=data.field===0?'Du stellst eine Fusion auf ein freies Feld.':data.field===1?'Das Feldmaterial wird durch eine Fusion ersetzt.':'Aus '+data.field+' Feldmonstern wird eine Fusion; dadurch werden '+(data.field-1)+' Zonen frei.';
  modal.querySelector('.arcane-fusion-mystery')?.insertAdjacentHTML('beforebegin',
   '<section class="ad-fusion-decision"><h3>Was du für diese Fusion einsetzt</h3><p><b>'+esc(sources)+'</b> werden verbraucht und durch <b>eine Fusion</b> ersetzt. '+movement+'</p>'+
   (data.spentAttack?'<p class="ad-fusion-warning">Ein Material hat bereits angegriffen. Dieser verbrauchte Angriff bleibt verbraucht.</p>':'')+
   '<details><summary>Materialwerte vergleichen</summary><p>Die Materialien haben zusammen '+fmt(data.materialAtk)+' ATK und '+fmt(data.materialDef)+' DEF. Das ist kein direkter Stärkevergleich: Mehrere Monster können getrennt angreifen, blocken und Fähigkeiten einsetzen. Eine Fusion bündelt ihre Möglichkeiten auf einer Karte.</p></details></section>');
  modal.querySelectorAll('.arcane-sealed-choice').forEach(offer=>{
   const button=offer.querySelector('[data-fusion-choice]'),card=CARDS[Number(button?.dataset.fusionChoice)];if(!card)return;
   const d=fusionDecision(game,materials,card),v=game.mode==='pve'?fusionPreview(game,card,materials,levels):null;
   const awakening=d.chance?'<p>'+ (d.chance===1?'Seelenzehrer-Erwachen gesichert durch die Feldmaterialien.':'Zusätzlich '+(d.chance*100).toLocaleString('de-AT',{maximumFractionDigits:1})+' % Chance auf Seelenzehrer-Erwachen.')+'</p>':'';
   offer.insertAdjacentHTML('beforeend','<div class="ad-fusion-role-preview"><strong>Rolle: '+esc(d.roleLabel)+'</strong><small>Durch '+esc(d.source)+(v?' · '+esc(v.pattern):'')+'</small>'+awakening+'</div>');
   const stock=offer.querySelector('[data-fusion-stock]');if(stock)stock.textContent='LV '+card.level+' · danach '+d.remaining+' Vorlagenkopie'+(d.remaining===1?'':'n');
  });
 };
 const oldRules=showRules;
 showRules=function(){
  oldRules();const chapters=[...($('modal')?.querySelectorAll('.arcane-rule-chapter')||[])];
  const target=chapters.find(c=>/^8\s*·/.test(c.querySelector('summary')?.textContent||''));
  target?.querySelector('.arcane-rule-body')?.insertAdjacentHTML('beforeend',
   '<h3>Ein Sieg ohne Monsterangriff</h3><p>Gewinnst du ein manuelles PvE-Duell, ohne selbst eine Monsterattacke ausgeführt zu haben, erhältst du zusätzlich 10 % der regulären Essenzbelohnung, abgerundet. Auch ein Angriff ohne Schaden zählt als Angriff. Seelenbrand, Gegenschläge und Entladen sind erlaubt. Der Bonus gilt auf die reguläre Duellbelohnung einschließlich Schwierigkeits-, Beute- und Begegnungsfaktor, nicht auf einmalige Turnier-, Trainings- oder Challengeprämien. Er wird vor der Ernährung deines Essenzwesens verrechnet. Automatik, Leihdecklektionen, Spezialübungen und Geheimduelle geben diesen Bonus nicht. Bereits vor dieser Änderung begonnene Duelle haben keine vollständige Angriffsstatistik und erhalten ihn daher noch nicht.</p><h3>Eine passende Karte als Stufenprämie</h3><p>Je Spezialmodus und Stufe erhältst du einmal eine Karte, wenn du alle drei Ziele sicherst. Verteidigung gibt auf den Stufen 1, 3 und 5 einen Seelenzehrer, auf 2 und 4 einen Wächter. Burst gibt einen Predator, Fusion eine Fusionsvorlage.</p><p>Die Kartenstufe berücksichtigt deinen Turnierfortschritt und die gewählte Herausforderungsstufe. Vor Turnier III ist bei Stufe 4 Schluss; nach III gilt 6, nach V 8 und nach VII 10. Fehlt eine geeignete Vorlage auf der Zielstufe, wird eine passende niedrigere gewählt. Du siehst die verfügbare Prämie vor dem Start. Bei 1/3 oder 2/3 gibt es die bisherigen Essenzbelohnungen; die Kartenprämie braucht 3/3.</p><p>Die Prämie wird beim Duellstart festgelegt und nach dem Erfolg sofort gutgeschrieben. Wiederholungen geben keine weitere Kartenprämie. Frühere vollständige Abschlüsse kannst du für die neue Karte einmal vollständig wiederholen.</p>');
 };
 window.ArcaneProgressionSupport=Object.freeze({version:'4.1.0',rewardPlan,lossStreak,helpData,fusionDecision,openHelp});
 if(uiMode==='menu'){showChallengeRewards();showMenuHelp();}
})();
