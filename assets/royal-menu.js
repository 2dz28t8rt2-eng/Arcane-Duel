/* ARCANE DUEL 3.0 · Menu hierarchy and illustrated searchable handbook.
   Loaded after learning.js; preserves all existing tabs and gameplay callbacks. */
'use strict';
(()=>{
const oldMenu=renderMenu;
const oldRules=showRules;
const collapsedGroups=new Set();
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=[
 {id:'play',icon:'⚔',title:'Duellieren',subtitle:'Arena, Duelle & PvP',tabs:['tournament','free','pvp']},
 {id:'deck',icon:'▤',title:'Deck & Sammlung',subtitle:'Karten und Deckbau',tabs:['collection','fusions','decks','lexicon']},
 {id:'missions',icon:'✧',title:'Herausforderungen',subtitle:'Lernpfad und Quests',tabs:['challenges']},
 {id:'growth',icon:'✦',title:'Fortschritt',subtitle:'Skills, Belohnungen & Booster-Shop',tabs:['workshop','upgrades','xp','shop','packs']},
 {id:'options',icon:'⚙',title:'Spielstand & Extras',subtitle:'Chronik und Optionen',tabs:['stats','settings']}
];
const descriptions={
 tournament:['Die zehn Prüfungen','Fordere den nächsten Turnierduellanten heraus und erschließe neue Karten.'],
 free:['Freie Duelle','Trainiere und sammle Beute gegen bekannte Gegner.'],
 pvp:['Lokales PvP','Spiele mit zwei Personen am selben Gerät.'],
 challenges:['Lernpfad & Herausforderungen','Übe Kombinationen mit Leihdecks und erfülle Spezialmissionen.'],
 lexicon:['Wissen & Monsterlexikon','Startanleitung, aktuelles Regelbuch und Kartensammlung an einem Ort.'],
 collection:['Dein Hauptdeck','Wähle und verstärke genau 40 Hauptkarten.'],
 fusions:['Deine Fusionen','Verwalte die Vorlagen für mächtige Verschmelzungen.'],
 decks:['Deckplätze','Organisiere deine drei Deckvarianten.'],
 shop:['Booster-Shop','Entdecke neue Kreaturen und Sonderangebote.'],
 packs:['Charakter-Boosterpacks','Öffne bereits verdiente Charakter-Boosterpacks.'],
 xp:['Levelbelohnungen','Sieh deine nächsten Fortschrittsmeilensteine.'],
 workshop:['Monsterwerkstatt','Verbinde und zerlege freie Monster derselben Familie.'],
 upgrades:['Skills & Perks','Passe deine langfristigen Verbesserungen an.'],
 stats:['Chronik & Hinweise','Deine Duelle, Taktiken und Statistiken.'],
 settings:['Einstellungen und Spielstandoptionen','Speichern, Import, Export und Einstellungen.']
};
function go(tab){
 const item=$('menuNav')?.querySelector('[data-tab="'+tab+'"]');
 if(!item)return;
 item.click(); // run the game's native navigation handler, including deck-draft setup
}
function openStart(){
 if(window.ArcaneExpansion?.showGuide)window.ArcaneExpansion.showGuide(0);
 else showRules();
}
function renderRoyalMenu(){
 oldMenu();
 if(uiMode!=='menu')return;
 const nav=$('menuNav'),hero=$('menuHero'),panel=$('menuContent'),screen=$('menuScreen');
 if(!nav||!hero||!panel||!screen)return;
 // Put the existing nav inside the menu grid; listeners and native deck actions survive.
 if(nav.parentElement!==screen)screen.insertBefore(nav,hero);
 screen.classList.add('fm-screen');document.body.classList.add('fm-menu-active');
 const tabs=new Map([...nav.querySelectorAll('button[data-tab]')].map(btn=>[btn.dataset.tab,btn]));
 nav.replaceChildren();nav.className='fm-navigation';
 nav.innerHTML='<div class="fm-nav-brand"><span>✧</span><div><strong>ARCANE DUEL</strong><small>4.1 · BESTIARIUM</small></div></div>';
 const titles={tournament:'Turnier',free:'Freie Duelle',pvp:'Lokales PvP',collection:'Hauptdeck',fusions:'Fusionsdeck',decks:'Deckplätze',lexicon:'Monsterlexikon',challenges:'Challenges & Quests',workshop:'Monsterwerkstatt',upgrades:'Skills & Perks',xp:'Levelbelohnungen',shop:'Booster-Shop',packs:'Charakter-Boosterpacks',stats:'Chronik',settings:'Einstellungen und Spielstandoptionen'};
 const activeGroup=categories.find(g=>g.tabs.includes(menuTab))||categories[0];
 for(const group of categories){
  const active=group.id===activeGroup.id,section=document.createElement('section');section.className='fm-menu-group'+(active?' selected':'');
  section.innerHTML='<button type="button" class="fm-group-button" data-fm-group="'+group.id+'" aria-expanded="'+(active&&!collapsedGroups.has(group.id))+'">'+
   '<span class="fm-group-icon">'+group.icon+'</span><span class="fm-group-copy"><strong>'+group.title+'</strong><small>'+group.subtitle+'</small></span><span class="fm-arrow">'+(active&&!collapsedGroups.has(group.id)?'⌄':'›')+'</span></button>';
  if(active){
   const sub=document.createElement('div');sub.className='fm-submenu';sub.hidden=collapsedGroups.has(group.id);
   for(const id of group.tabs){const button=tabs.get(id);if(!button)continue;button.textContent=titles[id];sub.append(button);}
   section.append(sub);
  }
  nav.append(section);
 }
 const help=document.createElement('div');help.className='fm-help';
 help.innerHTML='<button type="button" class="fm-rule-link" data-royal="rules">📖 <strong>Regel-Lexikon</strong><small>Alle Mechaniken & Suche</small></button>'+
 '<button type="button" class="fm-start-link" data-royal="start">✧ Startanleitung</button>'+ 
 '<button type="button" class="fm-start-link fm-hint-link" data-royal="stats">✦ Taktische Hinweise kaufen · Chronik</button>';
 nav.append(help);
 const hidden=document.createElement('div');hidden.hidden=true;hidden.className='fm-tab-storage';
 for(const [,button] of tabs)if(!button.isConnected)hidden.append(button);
 nav.append(hidden);
 const slot=$('activeSlotSelect'),current=descriptions[menuTab]||descriptions.tournament;
 hero.innerHTML='<div class="fm-hero-content"><div><span class="fm-eyebrow">✦ ARCANE DUEL 4.1 · '+safe(activeGroup.title)+'</span>'+
 '<h1>'+safe(current[0])+'</h1><p>'+safe(current[1])+'</p></div>'+
 '<div class="fm-hero-utility"><button type="button" class="fm-hero-rules" data-royal="rules">📖 Regel-Lexikon</button>'+
 '<label>Aktives Deck <span id="fmDeckSlot"></span></label></div></div>'+
 (profile.activeDuel?'<div class="fm-resume-bar"><b>↶ Laufendes Duell</b><button type="button" class="btn primary" data-royal="resume">Duell fortsetzen</button></div>':'')+
 (profile.migrationMessage?'<p class="fm-migration">'+safe(profile.migrationMessage)+'</p>':'');
 if(slot)$('fmDeckSlot').append(slot);
 if(menuTab==='upgrades'){
  const groups=[['⚔ Kampf & Schutz',['power','starter','combatDiscipline','openingAegis','resilience']],
   ['✧ Fusion & Kombinationen',['fusionLore','fusionPrecision']],
   ['✦ Ressourcen & Training',['loot','learning','tempo']]];
  panel.innerHTML='<div class="fm-perk-intro"><h2>Duellanten-Akademie</h2><p>Spezialisierte Fähigkeiten mit festen Obergrenzen. Deine bestehenden Ränge bleiben unverändert.</p></div>'+
  groups.map(([heading,keys])=>'<section class="fm-perk-category"><h3>'+heading+'</h3><div class="fm-perk-grid">'+keys.map(key=>{
   const u=UPGRADES[key];if(!u)return '';
   const rank=profile.upgrades[key]||0,maxed=rank>=u.max,cost=maxed?0:upgradeCost(key);
   return '<article class="fm-perk-card"><div class="fm-perk-head"><strong>'+safe(u.name)+'</strong><span>'+rank+' / '+u.max+'</span></div>'+
   '<p>'+safe(u.desc)+'</p><div class="fm-perk-ranks">'+Array.from({length:u.max},(_,i)=>'<i class="'+(i<rank?'filled':'')+'"></i>').join('')+'</div>'+
   '<button class="btn" type="button" data-action="upgrade" data-key="'+key+'" '+(maxed||profile.coins<cost?'disabled':'')+'>'+
   (maxed?'✓ Maximal':cost+' Essenz · Verbessern')+'</button></article>';
  }).join('')+'</div></section>').join('');
  bindMenu();
 }
 if(['upgrades','xp','shop','packs'].includes(menuTab)){
  const notice=document.createElement('div');notice.className='fm-shop-guide';notice.innerHTML='<strong>✦ Fortschritt & Shop</strong><span>Unter Fortschritt findest du auch den Booster-Shop und die Charakter-Boosterpacks.</span><button type="button" class="btn" data-royal="shop">Zum Booster-Shop</button>';panel.prepend(notice);
 }
 if(menuTab==='lexicon'){
  const entry=document.createElement('section');entry.className='menu-panel fm-lexicon-intro';
  entry.innerHTML='<h2>📖 Schneller zu den Spielregeln</h2><p>Regelbuch und Einstieg sind ab sofort getrennt und sofort erreichbar.</p>'+
   '<div class="fm-lexicon-links"><button type="button" data-royal="rules"><strong>📖 Regel-Lexikon</strong><small>Mechaniken & Suchfunktion</small></button>'+
   '<button type="button" data-royal="start"><strong>✧ Startanleitung</strong><small>Für Neulinge</small></button>'+
   '<button type="button" data-royal="challenges"><strong>⚔ Lernherausforderungen</strong><small>Spielend lernen</small></button></div>'+
   '<div class="royal-fate-entry"><span>Die zehn Schicksalsmonster kennenlernen</span><button class="btn" data-royal="gallery">✦ Schicksalsgalerie · Spoiler</button></div>';
  panel.prepend(entry);
 }
 if(menuTab!=='challenges'&&menuTab!=='upgrades'){
  const first=[...panel.children].find(el=>el.matches?.('.menu-panel')&&!el.classList.contains('fm-lexicon-intro'));
  const lead=first?.querySelector(':scope > p');
  if(lead&&lead.textContent.length>220){const more=document.createElement('details');more.className='fm-extra-info';more.innerHTML='<summary>Tipps & Hintergrund</summary>';lead.replaceWith(more);more.append(lead);}
 }
}
renderMenu=renderRoyalMenu;
function showGallery(){
 const gallery=window.ArcaneFateVisuals;if(!gallery)return;
 const list=gallery.entries.map((item,i)=>'<button class="royal-gallery-card" type="button" data-gallery-card="'+i+'" style="--gallery-color:'+item.primary+';--gallery-accent:'+item.accent+'">'+
 '<img loading="lazy" src="'+gallery.artFor(i)+'" alt="'+safe(item.name)+'"><strong>'+safe(item.name)+'</strong><span>'+safe(item.motto)+'</span></button>').join('');
 openModal(modalHtml('✦ SCHICKSALSKUNST','Galerie der zehn Erscheinungen','✧',
 'Alle Designs sind exklusiv für den Schicksalszug. Im Duell bleibt das Eingreifen selten.',
 '<div class="royal-gallery-grid">'+list+'</div>',
 '<button class="btn primary" id="royalGalleryClose">ZURÜCK</button>'));
 $('modal')?.classList.add('royal-gallery-modal');
 $('royalGalleryClose').onclick=hideModal;
 $('modal').querySelectorAll('[data-gallery-card]').forEach(button=>button.onclick=()=>{
  const i=Number(button.dataset.galleryCard),item=gallery.entries[i];
  if(!item)return;
  openModal(modalHtml('✦ SCHICKSALSMONSTER',item.name,item.symbol,item.motto,
   '<div class="royal-gallery-large" style="--gallery-color:'+item.primary+'"><img src="'+gallery.artFor(i)+'" alt="'+safe(item.name)+'"><p>'+safe(item.kind)+' · Individueller Rahmen, eigene Aura und prunkvoller Karten-Reveal.</p></div>',
   '<button class="btn primary" id="royalGalleryBack">← ZUR GALERIE</button>'));
  $('royalGalleryBack').onclick=showGallery;
 });
}
function openGallery(){
 if(profile.fateDiscovered){showGallery();return;}
 openModal(modalHtml('GEHEIME KARTEN','Schicksalsgalerie enthüllen?','✧',
 'Die Galerie zeigt zehn noch unentdeckte Schicksalsmonster.',
 '<p>Diese Vorschau enthält <b>Spoiler</b>. Im normalen Duell bleibt das Schicksal geheim, bis es zum ersten Mal eingreift.</p>',
 '<button class="btn" id="royalSpoilerCancel">ZURÜCK</button><button class="btn primary" id="royalSpoilerOpen">GALERIE ENTHÜLLEN</button>'));
 $('royalSpoilerCancel').onclick=hideModal;
 $('royalSpoilerOpen').onclick=showGallery;
}
const delegate=e=>{
 const button=e.target.closest('[data-royal]');
 if(!button)return;
 const action=button.dataset.royal;
 if(action==='rules'){showRules();return;}
 if(action==='start'){openStart();return;}
 if(action==='gallery'){openGallery();return;}
 if(action==='forge'){go('workshop');return;}
 if(action==='resume'){resumeDuel();return;}
 if(categories.some(group=>group.tabs.includes(action))){go(action);return;}
};
$('menuScreen')?.addEventListener('click',delegate);
 $('menuNav')?.addEventListener('click',e=>{const btn=e.target.closest('[data-fm-group]');if(!btn)return;const group=categories.find(g=>g.id===btn.dataset.fmGroup);if(!group)return;const submenu=btn.closest('.fm-menu-group')?.querySelector('.fm-submenu');if(group.tabs.includes(menuTab)&&submenu){submenu.hidden=!submenu.hidden;if(submenu.hidden)collapsedGroups.add(group.id);else collapsedGroups.delete(group.id);btn.setAttribute('aria-expanded',String(!submenu.hidden));const arrow=btn.querySelector('.fm-arrow');if(arrow)arrow.textContent=submenu.hidden?'›':'⌄';return;}collapsedGroups.delete(group.id);go(group.tabs[0]);});
function makeText(node,cls,label){const p=document.createElement(node);p.className=cls;p.textContent=label;return p;}
function decorateRules(){
 oldRules();
 const modal=$('modal'),book=modal?.querySelector('.arcane-handbook');
 if(!book||book.querySelector('.royal-handbook-intro'))return;
 if(!book.querySelector('#fm-perk-rule')){
  book.insertAdjacentHTML('beforeend',
   '<details class="arcane-rule-chapter" id="fm-perk-rule"><summary>12 · Skills, Perks &amp; sichere Investitionen</summary>'+
   '<div class="arcane-rule-body"><h3>Ein Ausbau soll zu deinen gespielten Karten passen</h3><p>Ausbauten kosten Essenz und wirken dauerhaft im Einzelspieler-Modus. Lies vor dem Kauf, welche Karten sie betreffen. Ein Bonus auf normale Monster erhöht nicht automatisch die Referenzwerte deiner Fusionen.</p>'+
   '<p><b>Jagdinstinkt</b> verbessert normale Predatoren. <b>Schildwall</b> verbessert normale Wächter und Seelenzehrer gemeinsam. Beide haben höchstens fünf Ränge und skalieren mit der Monsterstufe. Bei Stufe 5 gibt ein Rang Jagdinstinkt beispielsweise 55 ATK und 15 DEF; ein Rang Schildwall gibt einem passenden Verteidiger 15 ATK und 60 DEF.</p>'+
   '<p>Normale Wächter und Seelenzehrer erhalten zusätzlich einen DEF-Grundbonus aus 9 % des Budgets ihrer Monsterstufe. Ab Stufe 6 erhalten normale Monster je weiterer Stufe 20 ATK und DEF. Diese Grundboni sind unabhängig davon, ob du schon eine Rollenspezialisierung gekauft hast.</p>'+
   '<p><b>Monstertraining</b> ist ein allgemeiner Wertebonus mit höchstens 110 ATK und DEF. <b>Grundausbildung</b> betrifft die ursprünglichen 20 Startkarten – nicht jede später erhaltene Stufe-1-Karte. Prüfe deshalb, wie viele dieser Karten du noch im aktiven Deck spielst. <b>Standhaftigkeit</b> verringert den gewöhnlichen Kreaturenzerfall.</p>'+
   '<p><b>Fusionskunde</b> gibt deiner ersten Fusion einen zusätzlichen Wertewurf. <b>Runenpräzision</b> verbessert geeignete Spezialkombinationen mit mindestens drei Materialien um 1,5 Prozentpunkte Qualität je Rang, höchstens 4,5 Punkte. Die allgemeine Qualitätsgrenze von 148 % und die Obergrenze von sieben Würfen bleiben bestehen.</p>'+
   '<p><b>Kampfdisziplin</b> senkt den Angriffsverschleiß von 30 auf 28, 26 oder 24 ATK. <b>Vorhut-Schutz</b> gibt 25 Schildpunkte je Rang, höchstens 75 zusätzlich; die gesamte Schildgrenze bleibt 600.</p>'+
   '<p>Beutestudien, Werkzeugkunde und Trainingsroutine unterstützen Belohnungen, Herstellung beziehungsweise Automatik. Wenn du gerade an einer Prüfung festhängst, ist die passende Karte oder Fusionsvorlage manchmal nützlicher als ein weiterer allgemeiner Ausbau.</p></div></details>');
 }
 let chapters=[];
 const intro=document.createElement('div');intro.className='royal-handbook-intro';
 const heading=makeText('h3','', 'Willkommen im Duellantenhandbuch');
 const desc=makeText('p','','Beginne mit den drei Schritten oder springe direkt zur gesuchten Mechanik. Alle Kapitel lassen sich einzeln aufklappen.');
 const steps=document.createElement('div');steps.className='royal-start-steps';
 for(const [num,title,info] of [
  ['01','Karten ausspielen','Eine Handkarte wählen → auf ein freies Feld beschwören.'],
  ['02','Kämpfen','Eigene Angreifer wählen → gegnerisches Monster oder direkte Attacke.'],
  ['03','Verschmelzen','Zwei bis fünf Materialien markieren → Fusionsvorlage wählen.']
 ]){
  const element=document.createElement('div');element.className='royal-start-step';
  element.append(makeText('b','',num+' · '+title),makeText('span','',info));steps.append(element);
 }
 const searchLabel=document.createElement('label');searchLabel.className='royal-search-label';
 searchLabel.textContent='Thema suchen';
 const input=document.createElement('input');input.className='royal-rule-search';input.type='search';
 input.placeholder='z. B. Schicksalszug, Zerfall, Paar, Level …';input.setAttribute('aria-label','Regelbuch nach Stichwort durchsuchen');
 searchLabel.append(input);
 const directory=document.createElement('nav');directory.className='royal-rule-directory';directory.setAttribute('aria-label','Kapitel direkt öffnen');
 const empty=makeText('p','royal-rules-empty','Keine passenden Kapitel gefunden. Versuche einen kürzeren Suchbegriff.');
 empty.hidden=true;
 const normal=s=>String(s).toLocaleLowerCase('de-AT').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 let links=[];
 function filterChapters(){
  const needle=normal(input.value.trim());let count=0;
  chapters.forEach((chapter,i)=>{
   const hit=!needle||normal(chapter.textContent).includes(needle);
   chapter.hidden=!hit;links[i].hidden=!hit;
   if(hit)count++;
   if(needle&&hit)chapter.open=true;
  });
  empty.hidden=count>0;
 }
 function rebuildDirectory(){
  chapters=[...book.querySelectorAll('.arcane-rule-chapter')];links=[];directory.replaceChildren();
  chapters.forEach((chapter,index)=>{
   const title=chapter.querySelector('summary')?.textContent?.trim()||'Kapitel '+(index+1);
   if(!chapter.id)chapter.id='royal-rule-'+index;
   const jump=document.createElement('button');jump.type='button';jump.textContent=title;
   jump.setAttribute('aria-controls',chapter.id);
   jump.onclick=()=>{chapter.open=true;chapter.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
   links.push(jump);directory.append(jump);
  });
  filterChapters();
 }
 input.addEventListener('input',()=>{
  if(book.querySelectorAll('.arcane-rule-chapter').length!==chapters.length)rebuildDirectory();
  else filterChapters();
 });
 intro.append(heading,desc,steps,searchLabel,directory,empty);
 book.insertBefore(intro,book.firstChild);
 rebuildDirectory();
 // Later rule modules append Essence chapters within this same call stack.
 // Build their navigation and searchable entries after those additions as well.
 Promise.resolve().then(()=>{if(book.isConnected)rebuildDirectory();});
}
showRules=decorateRules;
window.ArcaneRoyalUI={version:'royal-1',navigate:go,openStart};
if(uiMode==='menu')renderMenu();
})();
