/* Arcane Duel v11.9 — friendly, current bestiary and expanded handbook.
 * Presentation/read-only: does not mutate gameplay, inventory or save state.
 * The sixteen introduction pages and fourteen indexed rule chapters keep their IDs.
 */
'use strict';
(()=>{
 const esc=x=>escapeHtml(String(x??''));
 // The game engine already uses the v11.6 percentages; these old tooltips
 // were left behind by a late-loaded perk definition. Correct display only.
 if(UPGRADES.resilience)UPGRADES.resilience.desc='Verringert den levelabhängigen Kreaturenzerfall deiner Monster um 10 % pro Rang (maximal 20 %). Angriffsverschleiß bleibt unverändert.';
 if(UPGRADES.fusionLore)UPGRADES.fusionLore.desc='Die erste Fusion pro Duell erhält +1 echten Wertewurf. Die erste Kettenfusion kann zusätzlich einmalig +3 % Qualität erhalten.';
 if(UPGRADES.fusionPrecision)UPGRADES.fusionPrecision.desc='Verbessert die Qualität von Spezialfusionen. Vollständige Spezialstraßen profitieren besonders; auf Rang 3 erhalten Große und Gigantische Straßen einen zusätzlichen Wurf (innerhalb der Obergrenzen).';

 const labels={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',resonator:'Resonator',allrounder:'Allrounder',combatant:'Allrounder'};
 const types={normal:'Normales Monster',fusion:'Fusionsvorlage',ace:'ACE-Karte',essence:'Essenzwesen',special:'Sondermonster'};
 const roleOf=c=>c.role||rpgRole?.(c.id)?.role||'combatant';
 const typeOf=c=>c.ace?'ace':c.essenceMonster?'essence':c.fusionOnly?'fusion':c.lv1Exclusive||c.questOnly?'special':'normal';
 const owned=c=>Number(profile.inventory?.[c.id]||0)>0;
 const seen=c=>owned(c)||(profile.unlocked||[]).includes(c.id)||(profile.fusionOwned||[]).includes(c.id);
 const catalog=()=>CARDS.filter(c=>c&&c.rpg&&!c.retired&&!c.enemyOnly&&!c.fateOnly&&c.level>=1&&c.level<=10&&
  (!c.hard||seen(c))&&(!c.questOnly||seen(c))&&(!c.lv1Exclusive||seen(c)));
 const state={query:'',role:'',type:'',element:'',level:'',status:'known',page:0};
 const pageSize=12;
 const pickOptions=(values,current,all)=>'<option value="">'+esc(all)+'</option>'+
  values.map(x=>'<option value="'+esc(x[0])+'"'+(current===String(x[0])?' selected':'')+'>'+esc(x[1])+'</option>').join('');
 const cardRole=c=>labels[roleOf(c)]||'Allrounder';
 const info=c=>{
  if(window.ArcaneBestiaryView228)return window.ArcaneBestiaryView228.detail(c,{inventory:profile.inventory,deck:profile.activeDeck,fusions:profile.fusionDeck});
  const k=typeOf(c);
  const desc={predator:'Greift besonders gerne an. Gut, um Lücken in der gegnerischen Stellung zu schaffen.',
   guardian:'Hält die Stellung. In DEF schützt er Verbündete und kann nach Angriffen zurückschlagen.',
   soul:'Nutzt Seelenentzug, um gegnerische Monster zu schwächen und die eigene Stellung zu stärken.',
   resonator:'Wird bei Fusionen besonders interessant: Resonanz hilft der Qualität und mit zwei echten Resonator-Fusionen auch dem Level.',
   allrounder:'Flexibler Begleiter, der je nach Kombination verschiedene Fusionen unterstützt.',
   combatant:'Vielseitige Karte, deren Nutzen von deiner Deckstrategie abhängt.'};
  const explanatory=k==='ace'?'Ein besonderes Monster eines Turniergegners. Eine eigene ACE-Karte darf bei den Gegnern nur einmal im Deck liegen.':
   k==='fusion'?'Diese Vorlage muss im ausgerüsteten Fusionsdeck liegen. Deine Materialien und die Rolle bestimmen später ihre tatsächlichen Werte.':
   k==='essence'?'Ein besonderes, dauerhaft gewähltes Essenzwesen. Seine Schule und deine Perks können zusammenarbeiten.':
   k==='special'?'Eine Sonderkarte mit zusätzlichen Bedingungen. Schau dir die zugehörige Quest an.':
   'Eine normale Monsterkarte. Sie kann einzeln kämpfen, für Fusionen eingesetzt oder in der Werkstatt verwendet werden.';
  const count=Number(profile.inventory?.[c.id]||0);
  const inMain=(profile.activeDeck||[]).filter(id=>id===c.id).length;
  const inFusion=(profile.fusionDeck||[]).filter(id=>id===c.id).length;
  return '<div class="ad119-detail">'+
    '<div class="ad119-detail-art"><img src="'+esc(c.art)+'" alt="'+esc(c.name)+'"></div>'+
    '<div><p class="ad119-eyebrow">'+esc(types[k])+' · '+esc(cardRole(c))+'</p><h3>'+esc(c.name)+'</h3>'+
    '<p>Level <strong>'+c.level+'</strong> · Element <strong>'+esc(c.element)+'</strong></p>'+
    '<div class="ad119-detail-stats"><strong>⚔ ATK '+fmt(c.atk)+'</strong><strong>◆ DEF '+fmt(c.def)+'</strong></div>'+
    '<p>'+esc(explanatory)+'</p><p>'+esc(desc[roleOf(c)]||desc.combatant)+'</p>'+
    (c.desc?'<p class="ad119-flavor">'+esc(c.desc)+'</p>':'')+
    '<p class="ad119-stock">In deinem Besitz: <b>'+count+'</b> · Hauptdeck: <b>'+inMain+
    '</b> · Fusionsdeck: <b>'+inFusion+'</b></p></div></div>';
 };
 function detail(id){
  const card=CARDS[id];if(!card||!seen(card))return;
  openModal(modalHtml('MONSTERLEXIKON · KARTE ENTDECKT',esc(card.name),'✦',
    'Hier siehst du die Grundwerte dieser Kartenvariante. Im Duell können Fusionen, Perks, Rollen und Zerfall die Werte verändern.',
    info(card),'<button class="btn primary" id="ad119Return">Zurück zum Lexikon</button>'));
  $('ad119Return').onclick=()=>{hideModal();if(uiMode==='menu')renderMenu();};
 }
 function installLexicon(){
  const root=$('menuContent')?.querySelector('.monster-index');if(!root||menuTab!=='lexicon')return;
  if(window.ArcaneBestiaryView228)return window.ArcaneBestiaryView228.mount(root,{cards:catalog(),known:catalog().filter(seen).map(c=>c.id),inventory:profile.inventory,deck:profile.activeDeck,fusions:profile.fusionDeck,state,onDetail:detail});
  const all=catalog(),known=all.filter(seen),ownedCount=known.filter(owned).length;
  root.classList.add('ad119-lexicon');
  root.innerHTML='<div class="ad119-lexicon-intro"><div><p class="ad119-eyebrow">DEINE ENTDECKUNGEN</p>'+
   '<h2>Monsterlexikon</h2><p>Hier kannst du deine entdeckten Monster in Ruhe kennenlernen – auch die neuen höheren Stufen und Fusionsvorlagen. '+
   'Du siehst nur Namen und Bilder von Karten, die du schon kennst. Geheimnisse bleiben Geheimnisse.</p></div>'+
   '<div class="ad119-count"><strong>'+known.length+'</strong><span>entdeckt von '+all.length+' Kartenvarianten</span></div></div>'+
   '<p class="ad119-lexicon-tip">✧ <b>So liest du eine Karte:</b> ATK hilft beim Angriff, DEF schützt in der Verteidigung. '+
   'Noch wichtiger sind Rolle, Element und die Frage, ob die Karte zu deiner Strategie passt. '+
   'Eine Fusion kann im Duell andere Werte bekommen als ihre Vorlage im Lexikon.</p>'+
   '<div class="ad119-filters">'+
   '<label>Monster suchen<input type="search" id="ad119Search" placeholder="Zum Beispiel Funkenwyrm" value="'+esc(state.query)+'"></label>'+
   '<label>Kartentyp<select id="ad119Type">'+pickOptions(Object.entries(types),state.type,'Alle Arten')+'</select></label>'+
   '<label>Rolle<select id="ad119Role">'+pickOptions(Object.entries(labels).filter(([id])=>id!=='combatant'),state.role,'Alle Rollen')+'</select></label>'+
   '<label>Element<select id="ad119Element">'+pickOptions([...new Set(known.map(c=>c.element))].sort().map(x=>[x,x]),state.element,'Alle Elemente')+'</select></label>'+
   '<label>Level<select id="ad119Level">'+pickOptions(Array.from({length:10},(_,i)=>[i+1,'Level '+(i+1)]),state.level,'Alle Level')+'</select></label>'+
   '<label>Sammlung<select id="ad119Status">'+pickOptions([['known','Entdeckte Karten'],['owned','Nur Karten im Besitz']],state.status,'Alle bekannten')+'</select></label>'+
   '</div><p class="ad119-results" id="ad119Count" role="status"></p><div class="ad119-monster-grid" id="ad119Grid"></div>'+
   '<div class="ad119-pages"><button type="button" class="btn" id="ad119Prev">← Zurück</button><span id="ad119Page"></span>'+
   '<button type="button" class="btn" id="ad119Next">Weiter →</button></div>'+
   '<details class="ad119-lexicon-roles"><summary>Welche Rolle passt zu meinem Deck?</summary>'+
   '<p><b>Predatoren</b> setzen Gegner unter Druck. <b>Wächter</b> schützen und kontern. '+
   '<b>Seelenzehrer</b> sammeln Seelenessenz und schaden durch Seelenbrand. '+
   '<b>Allrounder</b> sind flexible Materialien; <b>Resonatoren</b> sind besonders bei Kettenfusionen interessant. '+
   'Ein starkes Team kann mehrere Rollen verbinden.</p></details>';
  function filtered(){
   const q=state.query.trim().toLocaleLowerCase('de');
   return known.filter(c=>(state.status!=='owned'||owned(c))&&
    (!q||(c.name+' '+c.element+' '+cardRole(c)).toLocaleLowerCase('de').includes(q))&&
    (!state.role||roleOf(c)===state.role)&&(!state.type||typeOf(c)===state.type)&&
    (!state.element||c.element===state.element)&&(!state.level||c.level===Number(state.level)))
    .sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name,'de')||a.id-b.id);
  }
  function draw(){
   const list=filtered(),pages=Math.max(1,Math.ceil(list.length/pageSize));
   state.page=Math.max(0,Math.min(state.page,pages-1));
   const cards=list.slice(state.page*pageSize,(state.page+1)*pageSize);
   root.querySelector('#ad119Count').textContent=list.length+' passende Karten · '+ownedCount+' Kartenvarianten im Besitz · '+(all.length-known.length)+' noch unbekannt';
   root.querySelector('#ad119Grid').innerHTML=cards.map(c=>'<button type="button" class="ad119-card" data-ad119-card="'+c.id+'" aria-label="'+esc(c.name)+' im Lexikon ansehen">'+
    '<span class="ad119-art"><img src="'+esc(c.art)+'" loading="lazy" alt=""></span>'+
    '<strong>'+esc(c.name)+'</strong><small>'+esc(types[typeOf(c)])+' · Lv '+c.level+'</small>'+
    '<span class="ad119-role">'+esc(cardRole(c))+' · '+esc(c.element)+'</span>'+
    '<span class="ad119-stats">⚔ '+fmt(c.atk)+' <span>◆ '+fmt(c.def)+'</span></span>'+
    '<span class="ad119-inventory">'+(owned(c)?'Im Besitz: '+Number(profile.inventory[c.id]||0):'Entdeckt · noch nicht im Besitz')+'</span></button>').join('')||
    '<p class="ad119-empty">Dazu hast du noch keine Karte entdeckt. Probiere eine andere Stufe oder einen anderen Filter – oder entdecke neue Monster im Spiel.</p>';
   root.querySelector('#ad119Page').textContent='Seite '+(state.page+1)+' von '+pages;
   root.querySelector('#ad119Prev').disabled=state.page===0;
   root.querySelector('#ad119Next').disabled=state.page===pages-1;
  }
  const binds={ad119Search:'query',ad119Type:'type',ad119Role:'role',ad119Element:'element',ad119Level:'level',ad119Status:'status'};
  for(const [id,key] of Object.entries(binds))root.querySelector('#'+id).addEventListener(id==='ad119Search'?'input':'change',e=>{
    state[key]=e.target.value;state.page=0;draw();
   });
  root.querySelector('#ad119Prev').onclick=()=>{state.page--;draw();};
  root.querySelector('#ad119Next').onclick=()=>{state.page++;draw();};
  root.querySelector('#ad119Grid').addEventListener('click',e=>{
   const btn=e.target.closest('[data-ad119-card]');if(btn)detail(Number(btn.dataset.ad119Card));
  });
  draw();
 }
 const earlierRender=renderMenu;
 renderMenu=function(...args){const result=earlierRender(...args);installLexicon();return result;};
 // Contextual beginner examples keep the existing 16 guided pages navigable.
 const guideTips={
  'Fusionen erschaffen':{heading:'Zwei Schritte, kein Geheimtrick',text:'Eine Handfusion entsteht aus zwei bis fünf Karten und einer ausgerüsteten Vorlage. Bei einer Feldfusion kannst du danach ein bereits liegendes Monster als weiteres Material verwenden. Du verbrauchst dabei die Karten im Duell, nicht in deiner Sammlung.'},
  'Welche Rolle erbt eine Fusion?':{heading:'Ein Tipp zur Rollenwahl',text:'Predator für offensive Fusionen, Wächter und Seelenzehrer für längere Duelle. Ohne eindeutige Materialmehrheit kann ein Resonator entstehen. Die Rolle prägt ATK und DEF bereits vor den Wertewürfen.'},
  'Dein Deck und deine Sammlung':{heading:'Neu im Monsterlexikon',text:'Das Bestiarium zeigt jetzt auch deine freigeschalteten höheren Monster, Fusionsvorlagen und besonderen Karten. Filtere nach Level, Element oder Rolle. Unbekannte Karten werden nicht gespoilert.'},
  'Mit jedem Duell stärker werden':{heading:'Zwei Werkstätten, zwei Ziele',text:'In der Monsterwerkstatt formst du Karten einer Familie um. In der Aufstiegsschmiede machst du aus drei freien Karten derselben Stufe eine höhere. Dafür brauchst du etwas Essenz und Geduld.'},
  'Bereit für die Arena!':{heading:'Vor jedem schweren Turniergegner',text:'Schau nach einer Niederlage zuerst auf dein Hauptdeck, dann auf deine Fusionsvorlagen. Sind passende Karten da, aber keine freien Kopien? Sammle gezielt weiter, bevor du deine Lieblingskarten einschmilzt.'}
 };
 function guide(){
  const modal=$('modal'),title=modal?.querySelector('.guide-header h2')?.textContent;
  if(!title)return;
  const ps=[...modal.querySelectorAll('.guide-spread .guide-page')];
  if(title==='Kleine Monster, gute Kombinationen'&&ps[0])ps[0].innerHTML=
   '<h3>Eine gute Kombination muss nicht teuer sein</h3><p>Zwei gleiche Level bilden ein Paar, drei gleiche einen Drilling. '+
   '<b>Lv 1 + 2 + 3</b> ist eine Kleine Straße, <b>Lv 1 + 2 + 3 + 4</b> eine Große Straße und '+
   '<b>Lv 1 + 2 + 3 + 4 + 5</b> eine <b>Gigantische Straße</b>. Die Reihenfolge beim Auswählen ist egal.</p>'+
   '<p>Weitere Muster sind Zwei Paare, Full House, Vierling und Fünfling. '+
   'Ein gemeinsames Element kann zusätzlich helfen. Nicht jedes Extra-Material lohnt sich: Frage dich immer, '+
   'welche Monster du danach noch auf der Hand hast.</p>';
  if(title==='Warum Werte im Duell sinken'&&ps[0])ps[0].innerHTML=
   '<h3>Jedes Monster wird irgendwann müde</h3><p>Nach dem geschützten ersten eigenen Zugende verliert ein Monster '+
   'an jedem späteren eigenen Zugende ATK und DEF. Entscheidend ist sein <b>Level</b>, nicht ob es eine Fusion ist.</p>'+
   '<p><b>Level 3: −30</b> pro Wert, <b>Level 6: −65</b>, <b>Level 9: −135</b>, '+
   '<b>Level 10: −170</b>. Das gilt auch für starke ACEs. '+
   'Standhaftigkeit verringert den Zerfall deiner Monster um 10 oder 20 %.</p>'+
   '<p>Anders als Kreaturenzerfall kostet auch jeder normale Angriff normalerweise 30 ATK. '+
   'Ab Runde 10 steigt außerdem der Schaden der Arena an beiden Spielern.</p>';
  if(title==='Mit jedem Duell stärker werden'&&ps[1])ps[1].innerHTML=
   '<h3>Die Monsterwerkstatt</h3><p>Hier bleibt die Summe der Levelpunkte erhalten. '+
   'Aus Karten derselben Familie mit <b>2 + 2 + 1</b> kann beispielsweise eine Karte auf Level 5 werden. '+
   'Die Werkstattgrenze wird durch Turniersiege angehoben.</p>'+
   '<h3>Die neue Aufstiegsschmiede</h3><p>Nach dem Sieg über V darfst du <b>drei freie Karten derselben Stufe</b> '+
   'gegen eine Karte der nächsthöheren Stufe eintauschen. Nach VI ist auch Level 10 möglich. '+
   'Normalmonster haben 60 %, Fusionsvorlagen 40 % Chance; nach zwei normalen Ergebnissen '+
   'derselben Zielstufe ist beim dritten Mal eine Fusion garantiert.</p>'+
   '<p>Die Materialien verschwinden dauerhaft aus deiner Sammlung; die Essenzkosten sinken durch <b>Schmiedekunst</b>. '+
   'Deckkarten und Favoriten bleiben geschützt.</p>';
  const tip=guideTips[title];if(tip&&modal&&!modal.querySelector('.ad119-guide-note')){
   const area=modal.querySelector('.guide-spread');
   area?.insertAdjacentHTML('afterend','<aside class="ad119-guide-note"><strong>✦ '+esc(tip.heading)+
    '</strong><p>'+esc(tip.text)+'</p></aside>');
  }
 }
 const earlierOpen=openModal;
 openModal=function(html){const result=earlierOpen(html);guide();return result;};
 const block=(heading,html)=>'<section class="ad119-rule-section"><h3>'+heading+'</h3>'+html+'</section>';
 function rewriteBook(){
  const modal=$('modal'),book=modal?.querySelector('.arcane-handbook');if(!book)return;
  const kicker=modal.querySelector('.modal-kicker');
  if(kicker)kicker.textContent='DAS DUELLANTENHANDBUCH';
  const intro=book.querySelector('.arcane-rule-intro');
  if(intro)intro.innerHTML='<b>Willkommen!</b> Hier findest du Antworten zu den Karten, Kämpfen und deinen Möglichkeiten. '+
   'Du musst nicht alles auf einmal lesen. Fang mit dem ersten Kapitel an oder suche nach einer Frage. '+
   'Wenn etwas im gemeinsamen 2v2 anders funktioniert, steht es dabei.';
  const ch=[...book.querySelectorAll('.arcane-rule-chapter')];
  const insert=(i,html)=>{const body=ch[i-1]?.querySelector('.arcane-rule-body');if(body)body.insertAdjacentHTML('beforeend',html);};
  insert(1,block('Ein ganz normaler erster Zug',
   '<p>Du bekommst fünf Handkarten. Eine normale Karte auf ein freies Feld legen, das gegnerische Feld ansehen, '+
   'einen sicheren Angriff wählen – das reicht für den Einstieg. Es ist völlig in Ordnung, die erste Fusion erst später zu versuchen.</p>'));
  insert(2,block('Wenn deine Angriffe nicht durchkommen',
   '<p>Gegen normale Angreifer entscheidet der ATK-Vergleich. Verteidiger im PvE haben dagegen DEF als Trefferpunkte. '+
   'Ein Wächter oder Seelenzehrer wehrt in DEF 35 % des Schadens ab und kann mit der Hälfte seiner ATK kontern. '+
   'Zwei kleinere Angreifer können einen großen Verteidiger gemeinsam schwächen. Achte auch auf den LP-Gegenschlag.</p>'));
  insert(3,block('Resonatoren: der einmalige zusätzliche Levelaufstieg',
   '<p>Setzt du <b>zwei echte Resonator-Fusionsmonster</b> in derselben Fusionskette als Material ein, kann sie '+
   '<b>einmalig +1 erreichbares Level</b> erhalten. Beispiel: Eine mögliche Lv9-Fusion kann damit Lv10 erlauben. '+
   'In derselben Kette löst ein dritter Resonator den Bonus nicht erneut aus. '+
   'Du brauchst weiterhin eine entsprechende Fusionsvorlage im eigenen Deck.</p>')+
   block('Die Kernkarte und die Weiterfusion',
   '<p>Wähle ein gutes Monster als Kernkarte. Seine Stufe bildet den Ausgangspunkt; die anderen Materialien '+
   'verbessern mit abnehmender Gewichtung die Möglichkeiten. Eine vorhandene Fusion lässt sich weiterverwenden. '+
   'Dabei können 35 % der neu gewonnenen Qualität (höchstens 15 Prozentpunkte) in den nächsten Schritt eingehen. '+
   'Schon vererbte Qualität wird nicht immer weiter vervielfacht.</p>'));
  insert(4,block('Eine Straße nach der anderen',
   '<p><b>1 + 2 + 3</b> heißt Kleine Straße, <b>1 + 2 + 3 + 4</b> Große Straße, '+
   '<b>1 + 2 + 3 + 4 + 5</b> Gigantische Straße. Die Zahlen dürfen in beliebiger Reihenfolge gewählt werden, '+
   'müssen aber aufeinanderfolgen. Alle tatsächlich gewählten Materialien zählen; '+
   'eine schlechte Mischung kann außerhalb einer echten Straße Qualitätsabzüge verursachen.</p>')+
   block('Ein Qualitätsbonus ist kein garantiertes ATK-Plus',
   '<p>Die Rolle und der Qualitätsfaktor verändern die Ausgangswerte <b>vor</b> den gemeinsamen ATK-/DEF-Würfen. '+
   'Anschließend kommen die Materialboni dazu. Mehr Würfe erhöhen die Chance auf ein gutes Ergebnis, '+
   'garantieren aber keinen bestimmten Wert. Nutze im Duell „? Warum dieses Level?“ für deine echte Kombination.</p>'));
  insert(5,block('Karten dauerhaft verbessern: Werkstatt oder Aufstieg?',
   '<p><b>Normale Monsterwerkstatt:</b> Karten derselben Monsterfamilie umformen; die Summe der Levelpunkte bleibt gleich. '+
   '<b>Aufstiegsschmiede:</b> Drei freie Karten <em>desselben Levels</em> und etwas Essenz werden dauerhaft '+
   'zu einer zufälligen Karte genau eines Levels darüber. Das sind zwei getrennte Funktionen.</p>'+
   '<p>Die Aufstiegsschmiede öffnet nach Gegner V (bis Lv9), und der Weg zu Lv10 nach Gegner VI. '+
   'Drei Fusionsvorlagen als Material ergeben garantiert eine höhere Fusionsvorlage. Bei anderen Mischungen gilt: '+
   '60 % normale Monster und 40 % Fusionen, sofern beide Arten erhältlich sind. '+
   'Nach zwei normalen Ergebnissen derselben Zielstufe ist die nächste Fusion garantiert. '+
   'Es müssen nach dem Schmieden mindestens 40 normale Karten für dein Hauptdeck vorhanden bleiben. '+
   'Die drei verwendeten Karten werden dauerhaft verbraucht, Deckkarten und Favoriten sind geschützt.</p>'));
  insert(6,block('Welche Einkäufe bringen dir wirklich etwas?',
   '<p>Mit <b>Essenz</b> kaufst du unter anderem Upgrades und Kartenangebote. '+
   '<b>Booster-Siegel</b> erleichtern den Zugang zu Kartenpacks, auch zu Fusionspacks. '+
   '<b>Splitter</b> helfen beim gezielten Ausbau. Ein Fusionspack hat je nach Größe nur einen Teil '+
   'garantierter Fusionskarten, die übrigen Karten sind gewöhnliche Monster. '+
   'Wähle nicht nur nach Level: Ein Wächter-Deck braucht andere Karten als ein Predator-Deck.</p>')+
   block('Schwierige Turnierduelle vorbereiten',
   '<p>Die späteren Turniergegner verlangen oft eine andere Antwort als die vorherige Prüfung. '+
   'Beobachte die gegnerischen Rollen im Kampf und passe deine Angriffe, Schutzkarten und Fusionen daran an. '+
   'Welche Überraschungen ein Gegner im Deck hat, findest du am besten selbst im Duell heraus.</p>'));
  insert(7,block('Fusionspacks statt reinem Zufallsfarming',
   '<p>Je nach Paketgröße kannst du einzelne oder mehrere Fusionsvorlagen erhalten. '+
   'Der übrige Inhalt wird mit normalen Monstern aufgefüllt. '+
   'Es lohnt sich besonders, wenn deinem Fusionsdeck passende Level fehlen. '+
   'Zusätzliche Booster-Siegel ersetzen aber keinen sinnvollen 40-Karten-Deckbau.</p>'));
  insert(8,block('Der neue levelabhängige Kreaturenzerfall',
   '<p>Ein frisch beschworenes Monster hat an seinem ersten eigenen Zugende Ruhe. Danach verliert es '+
   '<b>pro eigenem Zugende ATK und DEF</b>. Je höher das Level, desto stärker der Zerfall: '+
   'Lv1 −20, Lv2 −25, Lv3 −30, Lv4 −40, Lv5 −55, Lv6 −65, Lv7 −80, Lv8 −105, Lv9 −135, Lv10 −170. '+
   'Das gilt auch für Fusionsmonster. Standhaftigkeit reduziert die Werte auf deinen Monstern um 10 bzw. 20 %.</p>'+
   '<p>Der Abzug nach einem Angriff ist etwas anderes: Normalerweise kostet ein Angriff weitere 30 ATK. '+
   'Kampfdisziplin hilft dabei, nicht gegen den Zerfall zwischen den Zügen.</p>'));
  const last=ch[7]?.querySelector('.arcane-rule-body');
  if(last){const paragraphs=[...last.querySelectorAll('p')];
   const old=paragraphs.find(p=>p.textContent.includes('Fusionen bei')&&p.textContent.includes('25'));
   if(old)old.innerHTML='<b>Drei Arten von Zeitdruck:</b> Jeder Angriff kostet normalerweise ATK, '+
    'spätere Zugenden verursachen levelabhängigen Kreaturenzerfall an ATK und DEF, '+
    'und ab Runde 10 schadet die Arena beiden Seiten. '+
    'Level 10 verliert beim Kreaturenzerfall 170 pro Wert, Level 3 nur 30.';
  }
  // Match the expanded five-card street name to the live combat and bonus cinema.
  for(const row of book.querySelectorAll('.arcane-rule-table tbody tr')){
   const cell=row.querySelector('td');if(cell?.textContent.trim()==='Große Straße (5)')cell.textContent='Gigantische Straße (5)';
  }
  const summary=book.querySelector('.arcane-rule-chapter summary');
  if(summary)summary.setAttribute('title','Klicke ein Kapitel an, um seine Erklärung auszuklappen.');
 }
 const olderRules=showRules;
 showRules=function(...args){const result=olderRules(...args);rewriteBook();return result;};
 window.ArcaneHandbook119=Object.freeze({version:'11.9.0',catalog,roleOf,typeOf,seen,decay:[20,25,30,40,55,65,80,105,135,170],
  refresh:installLexicon});
})();
