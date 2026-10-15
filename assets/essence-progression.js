/* Arcane Duel · Essence progression, discovery and training interface.
 * No rewrite of base menu or quests. Specialization and companion are opt-in
 * until the player completes all three explicitly signposted learning duels.
 */
'use strict';
(()=>{
 const C=window.ArcaneEssenceCombat;if(!C)return;
 const names={predator:'Predatoren',fusion:'Runenfusion',defense:'Bollwerk'};
 const labels={predator:'Reißzahn · Die ungezähmte Vorhut',fusion:'Runenherz · Die arkane Stimme',defense:'Aschenhort · Der unnachgiebige Wächter'};
 const intro=['predator','fusion','defense'];
 const E=()=>C.essence(), tier=()=>Math.max(0,...profile.cleared);
 const esc=x=>escapeHtml(String(x));
 const examReward=stage=>25+stage*15;
 function teachPanel(){
  const e=E(),step=e.intro;
  if(tier()<3)return '';
  if(step<3){
   const key=intro[step];
   return '<section class="menu-panel essence-academy"><span class="essence-eyebrow">✧ NEUE SCHULE · 3 GRUNDPRÜFUNGEN</span>'+
    '<h2>Der Ruf der Essenzwesen</h2><p>Nach der dritten Turnierprüfung stehen dir drei kurze, geführte Probe-Duelle offen. Du spielst sie mit vorgefertigten Leihdecks, ohne deinen eigenen Kartenbestand zu verändern.</p>'+
    '<div class="essence-training-stages">'+intro.map((id,i)=>'<div class="'+(step===i?'current':step>i?'done':'locked')+'"><b>'+(i+1)+'. '+names[id]+'</b><small>'+(step>i?'✓ Bestanden':step===i?'JETZT LERNEN':'Noch verschlossen')+'</small></div>').join('')+'</div>'+
    '<p>Du lernst zuerst Predatoren, danach Fusionen und zuletzt die Verteidiger. Anschließend triffst du deine einmalige Kartenwahl.</p>'+
    '<button class="btn primary" data-essence-intro="'+step+'">✦ '+names[key]+' üben</button></section>';
  }
  if(e.chosen===null)return '<section class="menu-panel essence-academy"><span class="essence-eyebrow">✧ DREI PRÜFUNGEN GEMEISTERT</span><h2>Deine Bindung wartet</h2>'+
   '<p>Du darfst jetzt <b>ein einziges Essenzmonster</b> wählen. Diese Karte kannst du in diesem Spielstand <b>nie austauschen</b>. Erst danach wählst du den passiven Perk, den du später unter sehr schweren Bedingungen wechseln kannst.</p>'+
   '<button type="button" class="btn primary" data-essence-open-choice>✦ Essenzwesen kennenlernen und wählen</button></section>';
  if(!e.school)return '<section class="menu-panel essence-academy"><h2>Deine zweite Entscheidung</h2><p>Du hast dein Essenzmonster gewählt. Jetzt wähle die aktive Spezialisierung; nur dieser passive Bonus ist unter strengen Bedingungen später wechselbar.</p>'+
   '<button class="btn primary" data-essence-open-perk>Passiven Bonus wählen</button></section>';
  return '';
 }
 function essenceDashboard(){
  const e=E();
  if(e.chosen===null)return '';
  const card=CARDS[e.chosen],school=e.school||'nicht gewählt',rank=C.perkRank(tier());
  const milestones=[100,250,450,700,1050],need=milestones[e.rank]||0;
  const canGrow=e.rank<C.rankCap(tier())&&e.nourished>=need&&profile.coins>=C.nextCost(e.rank);
  const resonance=e.school===card.essenceSchool;
  let html='<section class="menu-panel essence-dashboard"><div class="essence-eyebrow">✦ GEBUNDENES ESSENZWESEN</div>'+
   '<h2>'+esc(card.name)+'</h2><p>Entwicklung: <strong>Stufe '+C.evolvedLevel(tier())+'</strong> · Verstärkung '+e.rank+'/'+C.rankCap(tier())+
   ' · Genährte Essenz: <strong>'+e.nourished+'</strong> · Aktiver Perk: <b>'+esc(names[school]||school)+'</b> (Rang '+rank+')</p>'+
   '<p class="essence-status '+(resonance?'resonant':'')+'">'+(resonance?'✦ Resonanz aktiv: Karte und Perk gehören zusammen.':'◇ Keine Resonanz: Dein Essenzmonster behält die Grundfähigkeit, erhält aber nicht seine einzigartige Perk-Synergie.')+'</p>'+
   '<p>Es ernährt sich ausschließlich, wenn seine Karte im <b>aktiven Hauptdeck</b> geführt wird: 5 % der nach dem Duell erhaltenen Essenz, zuzüglich 2 Essenz je eigenem Monster-Kill und 3 Essenz je eigenem Feldzug. Es entwickelt sich an Turniermeilensteinen automatisch; Verstärkungen kosten zusätzlich Essenz.</p>';
  if(e.rank<C.rankCap(tier()))html+='<div class="essence-upgrade">Nächste Verstärkung: '+C.nextCost(e.rank)+' Essenz aus deiner Kasse · gespeiste Essenz mindestens '+need+
   ' <button class="btn primary" data-essence-upgrade '+(!canGrow?'disabled':'')+'>Verstärken</button></div>';
  else html+='<p class="essence-upgrade">Dein aktueller Turnierfortschritt setzt die Verstärkungsgrenze. Weitere Formen und Ränge folgen später.</p>';
  if(!e.school)html+='<p><button class="btn primary" data-essence-open-perk>Passiven Bonus wählen</button></p>';
  if(e.loreRead&&e.school){
   html+='<details class="essence-secret"><summary>✧ Die verborgene Umprägung</summary><p>Du kannst deine Bindung nicht lösen, wohl aber nach einer fünfteiligen Prüfung die Ausrichtung deines Perks verändern. Die exklusive Karte bleibt unverändert. Die alte Resonanz geht verloren, falls die Schulen nicht mehr zusammenpassen.</p>';
   if(!e.switchTarget)html+='<div class="essence-choice-buttons">'+C.schools.filter(x=>x!==e.school).map(k=>'<button class="btn" data-essence-switch="'+k+'">Zur Schule '+names[k]+' wechseln</button>').join('')+'</div>';
   else {
    const cost=750+Math.max(0,tier()-3)*130;
    html+='<p>Neue Schule: <b>'+names[e.switchTarget]+'</b> · Prüfung '+e.switchStep+'/5 · Gebühr danach '+cost+' Essenz.</p>'+
     '<div class="essence-choice-buttons">'+(e.switchStep<5?'<button class="btn primary" data-essence-exam="'+e.switchStep+'">Prüfung '+(e.switchStep+1)+'/5 starten</button>':
     '<button class="btn primary" data-essence-commit '+(profile.coins<cost?'disabled':'')+'>Neue Schule festlegen · '+cost+' Essenz</button>')+
     '<button class="btn ghost" data-essence-abandon>Prüfungsreihe abbrechen</button></div>';
   }
   html+='</details>';
  }
  html+='</section>';
  return html;
 }
 function loreMarkup(){
  const e=E();if(e.chosen===null||!e.school)return '';
  return '<details class="arcane-rule-chapter essence-lore"><summary>13 · Das Bündnis der Essenzwesen</summary>'+
   '<div class="arcane-rule-body"><p>Die ersten Essenzwesen waren keine gezähmten Monster. Sie bemerkten, dass menschliche Duellanten eine besondere Kraft sammelten: Essenz. Sie konnten diese Macht nicht selbst in der Arena gewinnen, doch sie konnten sie aus einem Bund mit einem Menschen beziehen.</p>'+
   '<p>So entstand ein Abkommen aus freiem Willen und Eigennutz. Die Essenzwesen folgen Menschen nicht aus Gehorsam. Sie wählen die Zusammenarbeit, weil jede Schlacht sie nährt und sie durch die Entschlossenheit ihres Duellanten neue Formen annehmen. Im Gegenzug stärken sie den Menschen, der ihnen Essenz überlässt.</p>'+
   '<p>Die <b>einmalige Wahl deines Essenzmonsters ist unwiderruflich</b>. Es wächst bei Turniermeilensteinen automatisch. Der passive Spezialisierungsbonus dagegen folgt deiner gewählten Schule. <b>Wenn Karte und Perk dieselbe Schule teilen, erhält das Essenzmonster Resonanz.</b> Wechselst du die Schule, verlierst du diese Resonanz, behältst aber die Karte, ihre Formen und ihre eigene Grundkraft.</p>'+
   '<p>Alte Schriften erzählen, dass man den Bund neu prägen könne, sofern man jede Lehre der neuen Schule bewusst durchschreitet. Ein solcher Weg wird niemandem einfach geschenkt.</p>'+
   (e.loreRead?'<p>✦ Du kennst nun das Geheimnis der Umprägung. Suche deine Bindung bei den Skills & Perks.</p>':
   '<button type="button" class="btn primary" data-essence-read>Die alte Schrift bis zum Ende entschlüsseln</button>')+
   '</div></details>';
 }
 function menuExtras(){
  if(uiMode!=='menu')return;
  const p=$('menuContent');if(!p)return;
  if(menuTab==='challenges')p.insertAdjacentHTML('beforeend',teachPanel());
  if(menuTab==='upgrades')p.insertAdjacentHTML('beforeend',essenceDashboard());
  if(menuTab==='lexicon'&&E().school)p.insertAdjacentHTML('beforeend','<section class="menu-panel essence-lore-teaser"><h2>✧ Die vergessenen Schriften</h2><p>Ein neues Kapitel erzählt vom Bund zwischen Duellanten und Essenzwesen.</p>'+loreMarkup()+'</section>');
 }
 const roleLabel={predator:'PREDATOR',guardian:'WÄCHTER',soul:'SEELENZEHRER',support:'UNTERSTÜTZER',weaver:'RUNENWEBER',hunter:'JÄGER',combatant:'KÄMPFER'};
 const roleText={
  predator:'Predator: verursacht erhöhten Druck gegen Verteidiger-HP.',
  guardian:'Wächter: regeneriert in DEF-Position die Grund-DEF verbündeter Verteidiger.',
  soul:'Seelenzehrer: saugt ATK und DEF aller gegnerischen Monster ab. Gespeicherte Seelen-DEF verursacht beim Zerfall Burn; Verdichten schafft stabilen Schutz.',
  support:'Unterstützer: verstärkt in DEF-Position den Angriff verbündeter gewöhnlicher Monster.',
  weaver:'Runenweber: unterstützt präzise Fusionen.',
  hunter:'Jäger: spezialisiert auf große Fusionsgegner.',
  combatant:'Allrounder: eine ausgewogene Kreatur ohne zusätzlichen Rollenbonus.'
 };
 const originalFullCardHtml=fullCardHtml;
 fullCardHtml=function(card,attrs='',classes='',badge=''){
  const html=originalFullCardHtml(card,attrs,classes,badge),c=CARDS[card?.id],role=c?.role;
  if(!role||role==='combatant'||!html.includes('<div class="hand-title">'))return html;
  const text=c.essenceMonster?'ESSENZWESEN':roleLabel[role]||role;
  return html.replace('<div class="hand-title">','<span class="essence-role-chip essence-role-'+role+'">'+esc(text)+'</span><div class="hand-title">');
 };
 const oldDetail=cardDetailPanel;
 cardDetailPanel=function(card,fusion){
  if(!card)return oldDetail(card,fusion);
  if(card.essenceMonster){
   const inDeck=deckDraft.filter(id=>id===card.id).length,lv=C.evolvedLevel(tier());
   return '<aside class="deck-side-preview" id="deckSidePreview"><div class="deck-side-sticky"><div class="deck-preview-card">'+fullCardHtml(profileCard(card))+'</div>'+
   '<div class="deck-preview-meta"><h3>'+esc(card.name)+'</h3><p>Ein unwiderruflich gebundenes Essenzmonster. Stufe '+lv+'. Unverkäuflich, unzerlegbar und nur einmal im Besitz. Formen wachsen automatisch mit dem Turnier; Verstärkung unter Skills &amp; Perks.</p>'+
   '<p>'+esc(roleText[card.role]||'')+'</p><p>Im Hauptdeck: '+inDeck+'/1</p>'+
   '<div class="deck-preview-actions"><button class="btn" data-action="copy" data-id="'+card.id+'" data-delta="-1" '+(!inDeck?'disabled':'')+'>Aus dem Deck nehmen</button>'+
   '<button class="btn primary" data-action="copy" data-id="'+card.id+'" data-delta="1" '+(inDeck||deckDraft.length>=40?'disabled':'')+'>Ins Deck legen</button></div>'+
   '<p>Das Hauptdeck benötigt weiterhin genau 40 Karten. Tausche eine andere Karte aus, um Platz zu schaffen.</p></div></div></aside>';
  }
  const result=oldDetail(card,fusion);
  const note=roleText[card.role]||'';
  return note?result.replace('<div class="deck-preview-pills">','<p class="essence-role-description"><strong>'+esc(roleLabel[card.role]||card.role)+':</strong> '+esc(note)+'</p><div class="deck-preview-pills">'):result;
 };
 const normalProfileCard=profileCard;
 profileCard=function(c){
  const display=normalProfileCard(c);
  if(c?.id===E().chosen&&c.essenceMonster){
   const lev=C.evolvedLevel(tier());
   display.card.level=lev;
   display.card.atk=Math.min(10000,display.card.atk+lev*45+E().rank*35);
   display.card.def=Math.min(10000,display.card.def+lev*70+E().rank*55);
  }
  return display;
 };
 const previousCardEditor=cardEditor;
 cardEditor=function(card,fusion){
  const html=previousCardEditor(card,fusion);
  return card?.id===E().chosen?html.replace('Stufe '+card.level+' ·','Stufe '+C.evolvedLevel(tier())+' ·'):html;
 };
 const oldMenu=renderMenu;renderMenu=function(){oldMenu();menuExtras();};
 const oldRules=showRules;showRules=function(){
  oldRules();const modal=$('modal'),book=modal?.querySelector('.arcane-handbook');
  if(!book)return;
  if(!book.querySelector('#essenceCombatRules'))book.insertAdjacentHTML('beforeend',
   '<details class="arcane-rule-chapter" id="essenceCombatRules"><summary>14 · Monsterrollen, DEF-HP &amp; Seelenessenz</summary>'+
   '<div class="arcane-rule-body"><p>In neuen Einzelspielerduellen verteidigt jedes Monster in DEF-Position mit seinen verbliebenen DEF-Punkten wie mit Monster-HP. Mehrere schwächere Angriffe können einen starken Blocker besiegen. Im lokalen PvP bleiben die klassischen Regeln unverändert.</p>'+
   '<p><b>Predatoren</b> sind gegen Verteidigungsstellungen gefährlicher. <b>Wächter</b> regenerieren Grund-DEF verbündeter Blocker; <b>Unterstützer</b> stärken normale Angreifer. <b>Seelenzehrer</b> schwächen in DEF-Position gegnerische Monster um 10 ATK und 10 DEF plus pro Stufe einen 5-Punkte-Wurf. Dabei verursacht Seelenbrand zusätzlich direkten LP-Schaden bis zu 40 + 30 pro Stufe.</p>'+
   '<p>Diese Energie erscheint als <b>instabile Seelenessenz</b>, die zusätzliche DEF verleiht. Verfällt instabile Seelenessenz natürlich, verursacht sie nur noch 35 % des verfallenden Anteils als LP-Burn; wird sie durch einen Angriff zerstört, verursacht sie halb so viel Burn. Jeder Seelenzehrer kann gesammelte Energie zudem einmal pro eigenem Zug mit 110 % Stärke offensiv entladen. <b>Verdichten</b> wandelt einen Teil davon für drei eigene Zugenden in stabile DEF um, mit drei Zügen Cooldown. Verdichtete DEF zerfällt ohne Burn, während neue Seelenessenz weiterhin gesammelt wird.</p>'+
   '<p><b>Wertebonus</b>: Normale Wächter und Seelenzehrer erhalten +9 % ihres Stufenbudgets als DEF. Ab Level 6 erhalten alle normalen Kreaturen pro höherer Stufe zusätzlich je 20 ATK und DEF. Die Ausbauten Jagdinstinkt und Schildwall unter Fortschritt spezialisieren normale Predatoren beziehungsweise Wächter/Seelenzehrer; dieser Bonus erhöht die Fusionsreferenz nicht.</p>'+ 
   '<p><b>Gegenschlag</b>: Ein angegriffener Verteidiger verursacht 50 % seiner aktuellen ATK als direkten LP-Schaden. Dies ersetzt in der neuen DEF-HP-Regel den alten Rückstoß. <b>Bollwerk</b> verringert nur den normalen Grundwertzerfall der Verteidiger (Rang 1: 15 %, Rang 3: 25 %); höhere Ränge verbessern die Seelenaufnahme. Rang 5 ermöglicht einmal pro Duell das <b>Letzte Bollwerk</b>: ein tödlich getroffener Verteidiger überlebt mit 1 Grund-DEF und erhält Schutz vor Angriffen für zwei weitere gegnerische Züge.</p>'+
   '<p><b>LP-Kurve</b>: Turnier I–III 4.000, IV–VI 6.000, VII–VIII 7.000, IX–X 10.000. Lokales PvP 8.000.</p>'+
   '</div></details>');
  if(E().school&&!book.querySelector('.essence-lore'))book.insertAdjacentHTML('beforeend',loreMarkup());
 };
 const oldReward=rewardMatch;
 rewardMatch=function(g){
  const result=oldReward(g);
  if(!result||g.mode!=='pve'||g.surrendered)return result;
  const e=E();
  if(g.essenceTrial&&g.winner===0&&!result.pvp){
   // A completed trial grants its small progress reward only once,
   // when the corresponding stage actually advances. Replays must not mint Essence.
   let completedStage=-1;
   if(g.essenceTrial==='intro-'+e.intro&&e.intro<3){
    completedStage=e.intro;e.intro++;
   }else if(e.switchTarget&&g.essenceTrial==='switch-'+e.switchTarget+'-'+e.switchStep&&e.switchStep<5){
    completedStage=e.switchStep;e.switchStep++;
   }
   if(completedStage>=0){
    const reward=examReward(completedStage);
    profile.coins=Math.min(1e9,profile.coins+reward);
    result.essenceExamReward=reward;
    saveProfile();
   }
  }
  if(g.essenceParticipated&&e.chosen!==null&&g.essenceTrial===null&&result.coins>0){
   const feed=Math.floor(result.coins*.05)+2*(g.essenceKills||0)+3*(g.essenceTurns||0);
   // Never consume the player's previously saved Essence: only this duel's earnings.
   const actual=Math.min(Math.max(0,result.coins),profile.coins,Math.max(0,feed));
   profile.coins-=actual;e.nourished=Math.min(1e9,e.nourished+actual);
   result.essenceFood=actual;result.coins-=actual;g.essenceFoodReported=actual;
   saveProfile();
  }
  return result;
 };
 const oldFinished=showFinished;
 showFinished=function(){
  const g=game,wasTrial=!!g?.essenceTrial,success=g?.winner===0&&!g?.surrendered;
  oldFinished();
  if(g?.essenceParticipated&&g.essenceFoodReported>0&&$('modal')){
   $('modal').insertAdjacentHTML('beforeend','<p class="loot-banner">✦ Essenzwesen hat '+g.essenceFoodReported+' Essenz aus dieser Duellbelohnung aufgenommen. Die angezeigte Essenzbelohnung ist bereits netto.</p>');
  }
  if(!wasTrial||!$('modal'))return;
  const passed=success?'✓ Prüfung bestanden':'Prüfung noch nicht bestanden';
  $('modal').insertAdjacentHTML('beforeend','<div class="essence-exam-result"><strong>'+passed+'</strong><p>'+(success?'Deine Bindung wächst durch Erfahrung. '+(E().intro===3&&!E().chosen?'Alle drei Übungen geschafft – wähle als Nächstes dein Essenzwesen.':'Die nächste Prüfung wartet im Menü.'):'Du kannst die Prüfung mit dem Leihdeck erneut versuchen. Deine eigene Sammlung bleibt unverändert.')+'</p></div>');
  // Explicit ceremonial reveal at the exact moment the third school lesson is won.
  if(success&&E().intro===3&&E().chosen===null){
   const box=document.createElement('section');box.className='arcane-essence-ceremony';
   box.innerHTML='<div class="essence-ceremony-glyph">✧</div><h3>Alle drei Essenzschulen gemeistert!</h3>'+
    '<p>Dein persönliches Essenzwesen wartet auf dich. Wähle es bewusst: <b>Diese Karte ist eine einmalige, unwiderrufliche Bindung.</b></p>';
   $('modal').insertBefore(box,$('modal').querySelector('.modal-actions'));
   const choose=document.createElement('button');choose.type='button';
   choose.className='btn primary';choose.id='essenceCeremonyChoose';
   choose.textContent='✦ ESSENZWESEN JETZT KENNENLERNEN';
   choose.onclick=()=>{returnToMenu();openChoice();};
   $('modal').querySelector('.modal-actions')?.append(choose);
  }
 };
 function openChoice(){
  if(E().intro!==3||E().chosen!==null)return;
  openModal(modalHtml('EINMALIGE BINDUNG','Wähle dein Essenzmonster','✦',
   'ACHTUNG: Diese Wahl ist für diesen Spielstand UNWIDERRUFLICH. Die beiden nicht gewählten Essenzmonster bleiben unerreichbar. Deinen passiven Perk wählst du anschließend separat.',
   '<div class="essence-card-choices">'+C.schools.map(k=>'<article>'+fullCardHtml({id:C.monsterIds[k]})+
    '<h3>'+esc(labels[k])+'</h3><p>Einzigartiger Begleiter. Entwickelt sich automatisch mit deinem Turnierfortschritt.</p><button type="button" class="btn primary" data-essence-pick="'+k+'">Diese Karte dauerhaft wählen</button></article>').join('')+'</div>',
   '<button class="btn" id="essenceChoiceBack">NOCH NICHT ENTSCHEIDEN</button>'));
  $('essenceChoiceBack').onclick=hideModal;
 }
 function openPerk(){
  if(E().chosen===null||E().school)return;
  openModal(modalHtml('ZWEITE ENTSCHEIDUNG','Wähle deinen passiven Perk','✦',
   'Anders als deine exklusive Karte kann dieser Bonus später über einen geheimen, aufwendigen Weg geändert werden. Wählst du den Perk deiner Essenzmonster-Schule, entsteht zusätzliche Resonanz.',
   '<div class="essence-card-choices">'+C.schools.map(k=>'<article><h3>'+names[k]+'</h3><p>'+(k==='predator'?'Gewöhnliche Angreifer gewinnen an Tempo, Reißzahn kann seine Mehrfachangriffe entfesseln.':k==='fusion'?'Deine Fusionen profitieren von hochwertigen Würfen und Runenherz harmoniert mit ihnen.':'Bollwerk schützt Verteidiger vor Zerfall und verbessert ihre Seelenaufnahme.')+'</p>'+
    '<p>'+(CARDS[E().chosen].essenceSchool===k?'✦ Resonanz mit deinem Essenzmonster':'Keine exklusive Resonanz')+'</p>'+
    '<button type="button" class="btn primary" data-essence-perk="'+k+'">Diesen Perk wählen</button></article>').join('')+'</div>',
   '<button class="btn" id="essencePerkBack">ENTSCHEIDUNG VERTAGEN</button>'));
  $('essencePerkBack').onclick=hideModal;
 }
 function confirmPermanent(k){
  if(E().intro!==3||E().chosen!==null||!C.schools.includes(k))return;
  const id=C.monsterIds[k],name=CARDS[id].name;
  openModal(modalHtml('ENDGÜLTIGE WAHL',name,'✦',
   'Du kannst dieses Essenzmonster in diesem Spielstand niemals durch eines der beiden anderen ersetzen. Nur dein später gewählter passiver Perk ist austauschbar.',
   '<p>Diese Karte bleibt dauerhaft dein Begleiter. Sie kann aus deinem Deck entfernt werden, aber nicht aus deinem Besitz. Du musst sie selbst in dein 40-Karten-Deck aufnehmen.</p>',
   '<button class="btn" id="essenceCancel">ABBRECHEN</button><button class="btn primary" id="essenceConfirm">JA · DIESES ESSENZMONSTER ENDGÜLTIG BINDEN</button>'));
  $('essenceCancel').onclick=openChoice;
  $('essenceConfirm').onclick=()=>{
   if(E().chosen!==null||storageConflict)return;
   addCard(id);E().chosen=id;saveProfile();hideModal();renderMenu();openPerk();
  };
 }
 function readLore(){
  if(!E().school||E().loreRead)return;
  E().loreRead=true;saveProfile();toast('Eine uralte Kunst der Umprägung wurde entdeckt.');
  if(uiMode==='menu')renderMenu();
  else showRules();
 }
 function actExam(kind,stage){
  const e=E();
  if(kind==='intro'){
   if(tier()<3||e.intro!==stage||e.chosen!==null)return;
   C.beginTrial('intro-'+stage,intro[stage],stage);
  }else{
   if(!e.loreRead||!e.switchTarget||stage!==e.switchStep)return;
   C.beginTrial('switch-'+e.switchTarget+'-'+stage,e.switchTarget,stage);
  }
 }
 function executeAction(btn){
  const e=E(),d=btn.dataset;
  if(d.essenceIntro!==undefined){actExam('intro',Number(d.essenceIntro));return;}
  if(d.essenceOpenChoice!==undefined){openChoice();return;}
  if(d.essenceOpenPerk!==undefined){openPerk();return;}
  if(d.essencePick!==undefined){confirmPermanent(d.essencePick);return;}
  if(d.essencePerk!==undefined){
   if(e.chosen===null||e.school||!C.schools.includes(d.essencePerk)||storageConflict)return;
   e.school=d.essencePerk;saveProfile();hideModal();renderMenu();
   toast('Die Spezialisierung ist aktiv. Weitere Schriften warten im Lexikon.');
   return;
  }
  if(d.essenceRead!==undefined){readLore();return;}
  if(d.essenceUpgrade!==undefined){
   const min=[100,250,450,700,1050][e.rank];if(e.chosen===null||e.rank>=C.rankCap(tier())||e.nourished<min||profile.coins<C.nextCost(e.rank)||storageConflict)return;
   const cost=C.nextCost(e.rank);profile.coins-=cost;e.rank++;e.spent+=cost;saveProfile();renderMenu();return;
  }
  if(d.essenceSwitch!==undefined){
   if(!e.loreRead||!e.school||!C.schools.includes(d.essenceSwitch)||d.essenceSwitch===e.school||e.switchTarget||storageConflict)return;
   e.switchTarget=d.essenceSwitch;e.switchStep=0;saveProfile();renderMenu();return;
  }
  if(d.essenceExam!==undefined){actExam('switch',Number(d.essenceExam));return;}
  if(d.essenceAbandon!==undefined){
   if(!e.switchTarget||storageConflict)return;
   e.switchTarget=null;e.switchStep=0;saveProfile();renderMenu();return;
  }
  if(d.essenceCommit!==undefined){
   const price=750+Math.max(0,tier()-3)*130;
   if(!e.switchTarget||e.switchStep!==5||profile.coins<price||storageConflict)return;
   const from=e.school,to=e.switchTarget;
   openModal(modalHtml('UMPRÄGUNG','Neue Spezialisierung aktivieren','✦',
    'Endgültiger Abschluss der fünf Prüfungen. Deine exklusive Essenzmonster-Karte bleibt unverändert. Passt sie nicht zur neuen Schule, verlierst du ihre zusätzliche Resonanz.',
    '<p>Wechsel: '+names[from]+' → '+names[to]+' · '+price+' Essenz.</p>',
    '<button class="btn" id="essenceNoSwitch">ABBRECHEN</button><button class="btn primary" id="essenceYesSwitch">PERK WECHSELN</button>'));
   $('essenceNoSwitch').onclick=hideModal;
   $('essenceYesSwitch').onclick=()=>{
    if(storageConflict||E().switchStep!==5||profile.coins<price)return;
    profile.coins-=price;E().school=to;E().switchTarget=null;E().switchStep=0;saveProfile();hideModal();renderMenu();
   };
  }
 }
 $('menuScreen')?.addEventListener('click',ev=>{const btn=ev.target.closest('button[data-essence-intro],button[data-essence-open-choice],button[data-essence-open-perk],button[data-essence-upgrade],button[data-essence-switch],button[data-essence-exam],button[data-essence-abandon],button[data-essence-commit],button[data-essence-read]');if(btn)executeAction(btn)});
 $('overlay')?.addEventListener('click',ev=>{const btn=ev.target.closest('button[data-essence-pick],button[data-essence-perk],button[data-essence-read]');if(btn)executeAction(btn)});
 const oldRender=render;
 render=function(){
  oldRender();
  const g=game,bar=$('duelScreen')?.querySelector('.control-stack');
  if(!bar||!g||!g.essenceRules||g.mode!=='pve')return;
  bar.querySelector('.essence-actions')?.remove();
  if(g.active!==0||g.winner!==null||busy||aiRunning)return;
  const sel=g.selection?.type==='field'?g.players[0].field[g.selection.idx]:null;if(!sel)return;
  const e=sel.essenceCombat;if(!e)return;
  let html='';
  if(CARB(sel)==='soul'&&sel.mode==='def'){
   html+='<small>Seelenessenz '+e.soul+' · Verdichtet '+e.condensed+' · Cooldown '+e.cooldown+'</small>';
   html+='<button class="btn" data-essence-combat="condense" '+(e.cooldown||e.soul<40?'disabled':'')+'>◇ Verdichten (3 Züge)</button>';
   if((CARDS[sel.id]?.soulRank||0)>=3)html+='<div class="essence-target"><small>Entzugsfokus: '+(e.drainPreference===1?'ATK':e.drainPreference===2?'DEF':'Ausgewogen')+'</small>'+
    '<button type="button" class="btn ghost" data-essence-drain="atk" '+(e.lastDrainSwitch===g.turn?'disabled':'')+'>ATK priorisieren</button>'+
    '<button type="button" class="btn ghost" data-essence-drain="def" '+(e.lastDrainSwitch===g.turn?'disabled':'')+'>DEF priorisieren</button></div>';

   html+='<button class="btn" data-essence-combat="discharge" '+(e.soul<40||e.lastDischarge===g.turn?'disabled':'')+'>✦ Seelenstoß · Entladen (110 %)</button>';
  }
  if(sel.id===E().chosen&&CARDS[sel.id].essenceSchool==='predator'&&g.essenceSchool==='predator'){
   html+='<button class="btn" data-essence-combat="predator" '+(e.attacksThisTurn||e.lastToggle===g.turn?'disabled':'')+'>'+
   (e.doubleChoice===2?'Angriffsform: 2 × 70 %':'Angriffsform: 1 × 100 %')+'</button>';
  }
  if(html)bar.insertAdjacentHTML('beforeend','<div class="essence-actions"><strong>✦ Kreaturenfähigkeit</strong>'+html+'</div>');
 };
 const CARB=c=>CARDS[c?.id]?.role;
 $('duelScreen')?.addEventListener('click',ev=>{
  const button=ev.target.closest('button[data-essence-combat],button[data-essence-drain]');if(!button)return;
  if(!game||game.selection?.type!=='field')return;
  const idx=game.selection.idx;
  if(button.dataset.essenceCombat==='condense')C.condense(idx);
  if(button.dataset.essenceDrain)C.chooseDrain(idx,button.dataset.essenceDrain);
  else if(button.dataset.essenceCombat==='discharge')C.discharge(idx);
  else if(button.dataset.essenceCombat==='predator')C.predatorMode(idx);
 });
 window.ArcaneEssenceProgression={version:'1.0.0'};
 if(uiMode==='menu')renderMenu();
})();