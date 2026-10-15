/* ARCANE DUEL 3.0 · Menu hierarchy and illustrated searchable handbook.
   Loaded after learning.js; preserves all existing tabs and gameplay callbacks. */
'use strict';
(()=>{
const oldMenu=renderMenu;
const oldRules=showRules;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=[
 {label:'⚔ SPIELEN',tabs:['tournament','free','pvp']},
 {label:'✦ LERNEN',tabs:['challenges','lexicon']},
 {label:'▤ SAMMLUNG',tabs:['collection','fusions','decks']},
 {label:'✧ FORTSCHRITT',tabs:['shop','packs','xp','upgrades']},
 {label:'⚙ SYSTEM',tabs:['stats','settings']}
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
 packs:['Charakterpacks','Öffne bereits verdiente Charakterpacks.'],
 xp:['Levelbelohnungen','Sieh deine nächsten Fortschrittsmeilensteine.'],
 upgrades:['Skills & Perks','Passe deine langfristigen Verbesserungen an.'],
 stats:['Chronik & Hinweise','Deine Duelle, Taktiken und Statistiken.'],
 settings:['Spielstand','Speichern, Import, Export und Einstellungen.']
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
 const nav=$('menuNav'),hero=$('menuHero'),panel=$('menuContent');
 if(!nav||!hero||!panel)return;
 const buttons=new Map([...nav.querySelectorAll('[data-tab]')].map(b=>[b.dataset.tab,b]));
 nav.innerHTML='';
 nav.classList.add('royal-menu-sections');
 for(const category of categories){
  const group=document.createElement('div');group.className='royal-nav-section';
  group.setAttribute('role','group');group.setAttribute('aria-label',category.label.replace(/^[^\wÄÖÜ]+/,''));
  const title=document.createElement('span');title.className='royal-nav-label';title.textContent=category.label;
  group.append(title);
  for(const tab of category.tabs){
   const button=buttons.get(tab);
   if(button){if(tab==='lexicon')button.textContent='📖 Regeln & Lexikon';group.append(button);}
  }
  nav.append(group);
 }
 for(const [name,btn] of buttons)if(!categories.some(c=>c.tabs.includes(name)))nav.append(btn);
 const utility=document.createElement('div');utility.className='royal-hero-utility';
 while(hero.firstChild)utility.append(hero.firstChild); // DOM move retains native select/resume handlers
 const primary=profile.activeDuel?'<button class="btn primary" type="button" data-royal="resume">↶ Duell fortsetzen</button>':
 '<button class="btn primary" type="button" data-royal="tournament">⚔ Abenteuer starten</button>';
 const cleared=Array.isArray(profile.cleared)?profile.cleared.length:0;
 const heroBlock=document.createElement('section');heroBlock.className='royal-menu-hero';
 heroBlock.innerHTML='<div><span class="royal-menu-kicker">✦ ARCANE DUEL 3.0 · BESTIARIUM REBORN</span>'+
 '<h1>Dein Duell. Deine Legende.</h1>'+
 '<p>Gestalte dein Deck, meistere Spezialkombinationen und entdecke das seltene Eingreifen des Schicksals. Beginne mit der Arena – alles Weitere erschließt sich Schritt für Schritt.</p>'+
 '<div class="royal-menu-actions">'+primary+
 '<button class="btn" type="button" data-royal="collection">▤ Deck bearbeiten</button>'+
 '<button class="btn" type="button" data-royal="pvp">⚔ Lokales PvP</button></div></div>'+
 '<div class="royal-menu-aside"><button class="royal-menu-feature" type="button" data-royal="rules">'+
 '<span class="royal-feature-icon" aria-hidden="true">📖</span><span><strong>Regel-Lexikon</strong>'+
 '<small>Alle Mechaniken, illustriert und durchsuchbar. Ein Klick genügt.</small></span></button>'+
 '<button class="royal-menu-feature" type="button" data-royal="start">'+
 '<span class="royal-feature-icon" aria-hidden="true">✧</span><span><strong>Startanleitung</strong>'+
 '<small>Für neue Duellanten: Ziel, Karten, Zug und Fusion.</small></span></button>'+
 '<div class="royal-menu-status">✦ Turnierfortschritt: '+cleared+' / 10 Prüfungen · Deckplatz '+(profile.activeSlot+1)+'</div></div>';
 hero.append(heroBlock,utility);
 const current=descriptions[menuTab]||descriptions.tournament;
 const focus=document.createElement('div');focus.className='royal-menu-focus';
 focus.innerHTML='<div><strong>'+safe(current[0])+'</strong><p>'+safe(current[1])+'</p></div>'+
 '<div class="royal-menu-actions"><button class="btn" type="button" data-royal="rules">📖 Regel-Lexikon</button>'+
 '<button class="btn" type="button" data-royal="start">✧ Erste Schritte</button></div>';
 panel.insertBefore(focus,panel.firstChild);
 if(menuTab==='lexicon'){
  const entry=document.createElement('section');entry.className='menu-panel lesson-overview';
  entry.innerHTML='<div class="lesson-eyebrow">✦ WISSENSPFAD</div><h2>Womit möchtest du beginnen?</h2>'+
  '<div class="royal-start-steps"><button class="royal-menu-feature" type="button" data-royal="start">'+
  '<span class="royal-feature-icon">①</span><span><strong>Geführter Einstieg</strong><small>Das Spiel in kurzen illustrierten Seiten entdecken.</small></span></button>'+
  '<button class="royal-menu-feature" type="button" data-royal="rules">'+
  '<span class="royal-feature-icon">②</span><span><strong>Alle Spielregeln</strong><small>Suche, Themenübersicht und aktuelle Werte.</small></span></button>'+
  '<button class="royal-menu-feature" type="button" data-royal="challenges">'+
  '<span class="royal-feature-icon">③</span><span><strong>Spielend lernen</strong><small>Spezialkombinationen mit Leihdeck üben.</small></span></button></div>';
  panel.insertBefore(entry,focus.nextSibling);
 }
}
renderMenu=renderRoyalMenu;
const delegate=e=>{
 const button=e.target.closest('[data-royal]');
 if(!button)return;
 const action=button.dataset.royal;
 if(action==='rules'){showRules();return;}
 if(action==='start'){openStart();return;}
 if(action==='resume'){resumeDuel();return;}
 if(['tournament','collection','pvp','challenges','lexicon','free'].includes(action)){go(action);return;}
};
$('menuScreen')?.addEventListener('click',delegate);
function makeText(node,cls,label){const p=document.createElement(node);p.className=cls;p.textContent=label;return p;}
function decorateRules(){
 oldRules();
 const modal=$('modal'),book=modal?.querySelector('.arcane-handbook');
 if(!book||book.querySelector('.royal-handbook-intro'))return;
 const chapters=[...book.querySelectorAll('.arcane-rule-chapter')];
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
 const links=[];
 chapters.forEach((chapter,index)=>{
  const title=chapter.querySelector('summary')?.textContent?.trim()||'Kapitel '+(index+1);
  chapter.id='royal-rule-'+index;
  const jump=document.createElement('button');jump.type='button';jump.textContent=title;
  jump.setAttribute('aria-controls',chapter.id);
  jump.onclick=()=>{chapter.open=true;chapter.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
  links.push(jump);directory.append(jump);
 });
 input.addEventListener('input',()=>{
  const needle=normal(input.value.trim());let count=0;
  chapters.forEach((chapter,i)=>{
   const hit=!needle||normal(chapter.textContent).includes(needle);
   chapter.hidden=!hit;links[i].hidden=!hit;
   if(hit)count++;
   if(needle&&hit)chapter.open=true;
  });
  empty.hidden=count>0;
 });
 intro.append(heading,desc,steps,searchLabel,directory,empty);
 book.insertBefore(intro,book.firstChild);
}
showRules=decorateRules;
window.ArcaneRoyalUI={version:'royal-1',navigate:go,openStart};
if(uiMode==='menu')renderMenu();
})();