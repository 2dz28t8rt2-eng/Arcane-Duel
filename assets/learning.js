/* Arcane Duel · Guided Combos and Fate Discovery · dev 2026-10-15
 * Safe extension loaded after evolution.js; never edits a player's real deck.
 */
'use strict';
(()=>{
const LESSONS=[
 {id:'pair',title:'Das Paar',icon:'Ⅱ',levels:[2,2],weights:{1:8,2:23,3:9},goal:'Paar',tip:'Zwei Monster derselben Stufe bilden ein Paar. Markiere beide Materialien und wähle eine passende Fusionsvorlage.'},
 {id:'lowpair',title:'Die Macht der Ersten',icon:'Ⅰ',levels:[1,1],weights:{1:21,2:19},goal:'lowpair',tip:'Ein Paar aus zwei Stufe-1-Monstern erhält einen zusätzlichen Qualitätsbonus. Stärke ist nicht alles.'},
 {id:'twopair',title:'Zwei Paare',icon:'Ⅳ',levels:[1,1,2,2],weights:{1:20,2:17,3:3},goal:'Zwei Paare',tip:'Verbinde zwei Paare unterschiedlicher Stufen in EINER Fusion, beispielsweise 1–1–2–2.'},
 {id:'triple',title:'Der Drilling',icon:'Ⅲ',levels:[2,2,2],weights:{1:8,2:26,3:6},goal:'Drilling',tip:'Drei Monster derselben Stufe ergeben einen Drilling. Die Zusatzwürfe sind bei der Auswahl der Fusion hilfreich.'},
 {id:'smallstraight',title:'Die kleine Straße',icon:'✧',levels:[1,2,3],weights:{1:13,2:13,3:14},goal:'Kleine Straße',tip:'Drei unmittelbar aufeinanderfolgende Stufen ergeben eine kleine Straße, vier bereits eine große.'},
 {id:'bigstraight',title:'Die große Straße',icon:'✦',levels:[1,2,3,4,5],weights:{1:8,2:8,3:8,4:8,5:8},goal:'Große Straße',tip:'Vier aufeinanderfolgende Stufen ergeben eine große Straße; fünf erhöhen den Bonus weiter.'},
 {id:'fullhouse',title:'Full House',icon:'✵',levels:[1,1,1,2,2],weights:{1:21,2:19},goal:'Full House',tip:'Ein Drilling UND ein Paar in einer Fusion: etwa 1–1–1–2–2.'},
 {id:'four',title:'Der Vierling',icon:'Ⅳ',levels:[1,1,1,1],weights:{1:21,2:19},goal:'Vierling',tip:'Vier Materialien mit derselben Stufe erzeugen einen Vierling.'},
 {id:'five',title:'Der Fünfling',icon:'Ⅴ',levels:[1,1,1,1,1],weights:{1:21,2:19},goal:'Fünfling',tip:'Fünf Monster derselben Stufe – fünf Materialien, ein seltener Qualitätsbonus.'},
 {id:'lowlevels',title:'Niedrigstufen-Synergie',icon:'✷',levels:[1,1,1],weights:{1:21,2:19},goal:'lowlevels',tip:'Ab drei Materialien geben Stufe 1 und 2 zusätzliche Prozentpunkte Qualität. Versuche zum Beispiel einen Drilling aus Stufe 1.'},
 {id:'elements',title:'Elementharmonie',icon:'◇',levels:[1,2,3],weights:{1:15,2:15,3:10},goal:'elements',tip:'Nimm für eine Fusion ausschließlich Monster desselben Elements. Die Elemente siehst du auf den Karten.'}
];
const LESSON_MAP=new Map(LESSONS.map(x=>[x.id,x]));
let selectedLesson=null;
const validLesson=id=>typeof id==='string'&&LESSON_MAP.has(id);
const lessonDone=()=>Array.isArray(profile.lessonCompleted)?profile.lessonCompleted:[];
function migrateLearning(p,raw){
 p.fateDiscovered=raw?.fateDiscovered===true;
 p.lessonCompleted=Array.isArray(raw?.lessonCompleted)?[...new Set(raw.lessonCompleted.filter(validLesson))]:[];
 p.lessonSeen=Array.isArray(raw?.lessonSeen)?[...new Set(raw.lessonSeen.filter(id=>Number.isInteger(id)&&id>=0&&id<CARDS.length))].slice(0,4000):[];
 return p;
}
const oldFresh=freshProfile,oldValidate=validateProfile;
freshProfile=function(){return migrateLearning(oldFresh(),null);};
validateProfile=function(raw){return migrateLearning(oldValidate(raw),raw);};
// The base game validates the save before this extension loads and drops unknown
// fields. Recover our versioned optional flags directly from that same save once.
let initialLearningSave=null;
try{const text=window.localStorage.getItem(SAVE_KEY);if(text)initialLearningSave=JSON.parse(text);}catch(e){/* invalid save: keep safe defaults */}
migrateLearning(profile,initialLearningSave||profile);

function markSeen(ids){
  const visited=new Set(profile.lessonSeen||[]);
  for(const id of ids)if(CARDS[id]&&Number.isInteger(id))visited.add(id);
  profile.lessonSeen=[...visited].slice(0,4000);
  saveProfile();
}
function lessonDeck(lesson){
 const eligible=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&c.level<=5);
 const output=[],copies=new Map();
 function take(level){
  const pool=eligible.filter(c=>c.level===level&& (copies.get(c.id)||0)<3);
  if(!pool.length)return false;
  // Prefer varied cards, with repeated levels rather than a single repeated identity.
  pool.sort((a,b)=>(copies.get(a.id)||0)-(copies.get(b.id)||0)||a.id-b.id);
  const id=pool[0].id;output.push(id);copies.set(id,(copies.get(id)||0)+1);return true;
 }
 for(const [lv,n] of Object.entries(lesson.weights))for(let i=0;i<n;i++)if(!take(Number(lv)))throw Error('Zu wenige Übungskarten auf Stufe '+lv);
 if(output.length!==40||mainDeckError(output))throw Error('Übungsdeck ist ungültig.');
 return output;
}
function fusionLoan(){
 const pool=RPG_FUSIONS.filter(c=>c.rpg&&c.fusionOnly&&!c.ace).sort((a,b)=>a.level-b.level||a.id-b.id);
 const deck=pool.slice(0,15).map(c=>c.id);
 if(fusionDeckError(deck))throw Error('Die Übungsfusionen sind nicht gültig.');
 return deck;
}
const oldCreate=createGame;
createGame=function(options={}){
 if(options.context!=='lesson')return oldCreate(options);
 const lesson=LESSON_MAP.get(selectedLesson);
 if(!lesson)throw Error('Keine Lernherausforderung ausgewählt.');
 const deck=lessonDeck(lesson),loanFusions=fusionLoan();
 markSeen([...deck,...loanFusions]);
 // Loan deck / enemy are purely ephemeral: inventory and the active deck remain untouched.
 const beginnerEnemy={deck:lessonDeck(LESSON_MAP.get('pair')),fusionDeck:[...RPG_START_FUSIONS,...RPG_START_FUSIONS],enhancements:{},power:.68,flatBonus:0};
 const g=oldCreate({...options,context:'challenge',deck,fusionDeck:loanFusions,enemy:beginnerEnemy,enhancements:{},flatBonus:0});
 g.lessonId=lesson.id;g.lessonPatterns=[];g.maxLP=6000;g.players.forEach(p=>p.lp=6000);
 return g;
};
const oldDuelValidate=validateDuelSnapshot;
validateDuelSnapshot=function(raw){
 const g=oldDuelValidate(raw);
 if(raw.lessonId!==undefined){
  if(!validLesson(raw.lessonId)||!Array.isArray(raw.lessonPatterns)||raw.lessonPatterns.length>100||raw.lessonPatterns.some(x=>typeof x!=='string'||x.length>60))throw Error('Ungültiger Lernfortschritt.');
  g.lessonId=raw.lessonId;g.lessonPatterns=[...raw.lessonPatterns];
 }
 return g;
};
function markLessonCombo(g,card){
 if(!validLesson(g?.lessonId)||g.active!==0||!card)return;
 const p=card.pattern||'Freie Fusion',levels=card.lessonLevels||[],elements=card.lessonElements||[];
 g.lessonPatterns=g.lessonPatterns||[];
 if(g.lessonPatterns.length>=100)return;
 g.lessonPatterns.push(p);
 if(p==='Paar'&&levels.length===2&&levels.every(x=>x===1))g.lessonPatterns.push('lowpair');
 if(p!=='Freie Fusion'&&levels.length>=3&&levels.some(x=>x===1||x===2))g.lessonPatterns.push('lowlevels');
 if(elements.length>=2&&elements.every(x=>x===elements[0]))g.lessonPatterns.push('elements');
}
const oldFused=fusedInstance;
fusedInstance=function(g,instances,levels){
 const result=oldFused(g,instances,levels);
 if(result&&validLesson(g.lessonId)&&g.active===0){
  result.lessonLevels=[...levels];result.lessonElements=instances.map(c=>dataOf(c).element);
 }
 return result;
};
const oldPlace=placePending;
placePending=function(g,idx,choice){
 const result=oldPlace(g,idx,choice);
 if(result?.card?.fusion)markLessonCombo(g,result.card);
 return result;
};
function accomplished(g){const goal=LESSON_MAP.get(g.lessonId)?.goal;return !!goal&&Array.isArray(g.lessonPatterns)&&g.lessonPatterns.includes(goal);}
const oldReward=rewardMatch;
rewardMatch=function(g){
 const reward=oldReward(g);
 if(!reward||!validLesson(g?.lessonId)||g.lessonPrizeChecked)return reward;
 g.lessonPrizeChecked=true;
 const passed=g.winner===0&&!g.surrendered&&accomplished(g);
 reward.lessonPassed=passed;
 if(passed&&!lessonDone().includes(g.lessonId)){
  profile.lessonCompleted.push(g.lessonId);
  const pack=packKey(1,'easy');profile.packs[pack]=Math.min(999999,(profile.packs[pack]||0)+1);
  reward.lessonPack=true;reward.lessonPackSource=1;saveProfile();
 }
 return reward;
};
const oldFinished=showFinished;
showFinished=function(){
 const g=game,firstPending=validLesson(g?.lessonId)&&!g.finishShown;
 oldFinished();
 if(!firstPending||!g||!$('modal'))return;
 const completed=accomplished(g),win=g.winner===0&&!g.surrendered;
 const already=lessonDone().includes(g.lessonId);
 const detail=win&&completed?`<strong>✓ Spezialkombination gemeistert!</strong> ${already?'Dein erstes Charakterpack wurde gutgeschrieben.':'Bereits abgeschlossen.'} Öffne deinen Vorrat unter <b>Fortschritt → Charakter-Boosterpacks</b> (Gegner I: ${profile.packs[packKey(1,'easy')]||0}).`:
  `<strong>Übungsziel noch nicht erreicht.</strong> ${win?'Du hast gewonnen, aber die geforderte Fusion nicht gespielt.':'Ein Sieg und die geforderte Fusion sind für den ersten Abschluss nötig.'}`;
 $('modal').insertAdjacentHTML('beforeend',`<div class="lesson-result">${detail}<p>Dein persönliches Deck wurde nicht verändert.</p></div>`);
 if($('modalAgain'))$('modalAgain').onclick=()=>{selectedLesson=g.lessonId;hideModal();game=null;startDuel('pve',1,'lesson');};
};
const oldStart=startDuel;
startDuel=function(mode,id=0,context='free',difficulty='easy',challenge=null){
 if(context==='lesson'){
  if(mode!=='pve'||id!==1||!opponentUnlocked(1)){toast('Lerne zuerst die drei Trainingsgegner kennen.');return;}
  if(!validLesson(selectedLesson)){toast('Bitte wähle eine Lernherausforderung aus.');return;}
 }
 return oldStart(mode,id,context,difficulty,challenge);
};

const oldFateAnimation=fateAnimation;
fateAnimation=async function(g){
 const event=g.fateEvent;if(!event)return;
 const first=!profile.fateDiscovered;
 await oldFateAnimation(g);
 if(!first)return;
 profile.fateDiscovered=true;saveProfile();
 await new Promise(resolve=>{
  const body=`<div class="lesson-fate-tutorial"><p><strong>Auch eine verlorene Schlacht ist nicht immer entschieden.</strong> Wenn ein Duellant in echte Bedrängnis gerät, kann das Schicksal sehr selten eingreifen – bei dir genauso wie bei deinem Gegner.</p><p>Ab Runde 3 werden verbleibende LP, Feldüberlegenheit und drohender tödlicher Schaden berücksichtigt. Die Chance je berechtigtem Zug liegt je nach Lage bei <b>1 %, 3 % oder höchstens 5 %</b>.</p><p>Deine bisherigen Handkarten werden ins Deck gemischt. Stattdessen erscheinen <b>fünf prunkvolle Schicksalsmonster</b>. Sie erhalten Werte, die das stärkste gegnerische Monster jeweils um 100 ATK und DEF übersteigen (bis zum Wertelimit). Du darfst weiterhin nur die übliche Beschwörungsaktion nutzen. Diese Monster können <b>niemals fusioniert werden</b>, verschwinden nach dem Duell und können höchstens einmal pro Seite erscheinen.</p><p><strong>Merke:</strong> Wer sich zu sicher fühlt, könnte das Schicksal herausfordern.</p></div>`;
  openModal(modalHtml('ERSTE BEGEGNUNG','Das Schicksal hat gesprochen','✦','Diese Erklärung erscheint nur bei deinem ersten Schicksalszug. Ab sofort findest du sie im Regelbuch.',body,'<button class="btn primary" id="fateLearningClose">WEITER ZUM DUELL</button>'));
  $('fateLearningClose').onclick=()=>{hideModal();resolve();};
 });
};

function cardsExample(levels){
 return `<div class="lesson-mini-cards" aria-label="Beispielstufen: ${levels.join(', ')}">${levels.map(l=>{
  const c=RPG_BASE_CARDS.find(x=>x.level===l&&x.rpg&&!x.fusionOnly);
  return `<span class="lesson-mini-card"><span class="lesson-mini-level">LV ${l}</span>${c?.art?`<img src="${c.art}" loading="lazy" alt="Monster Stufe ${l}">`:'<span class="lesson-mini-symbol">✧</span>'}</span>`;
 }).join('')}<span class="lesson-mini-equals">➜ ✧</span></div>`;
}
function teachingPanels(){
 const unlocked=opponentUnlocked(1),done=lessonDone();
 return `<section class="menu-panel lesson-overview" id="learningChallenges"><div class="lesson-eyebrow">✦ LERNPFAD · ${done.length}/${LESSONS.length} ABSCHLÜSSE</div><h2>Spezialkombinationen meistern</h2><p>Jede Lektion leiht dir ein <strong>passend zusammengestelltes 40-Karten-Deck</strong> und Fusionsvorlagen. Dein aktives Deck, deine Sammlung und deine Deckplätze bleiben unverändert. Spiele die gezeigte Kombination und gewinne das Übungsduell. Für den <b>ersten erfolgreichen Abschluss</b> bekommst du ein kleines Charakterpack von Gegner I.</p><p>${unlocked?'Wähle eine Übung.':'🔒 Nach den drei Trainingsgegnern verfügbar.'}</p><button class="btn" id="lessonHelp" type="button">? Anleitung & Beispiele</button></section><div class="lesson-grid">${LESSONS.map((l,i)=>`<article class="menu-panel lesson-card ${done.includes(l.id)?'lesson-complete':''}"><div class="lesson-eyebrow">LEKTION ${String(i+1).padStart(2,'0')} · ${done.includes(l.id)?'✓ GELERNT':'NOCH OFFEN'}</div><h3>${l.icon} ${l.title}</h3>${cardsExample(l.levels)}<p>${l.tip}</p><p class="lesson-reward">✦ Erster Erfolg: 1 Charakterpack · Übungsdeck inklusive</p><button class="btn primary" data-lesson="${l.id}" type="button" ${!unlocked?'disabled':''}>${done.includes(l.id)?'Erneut üben':'Übung starten'}</button></article>`).join('')}</div>`;
}
function chapter(title,content){return `<details class="arcane-rule-chapter lesson-chapter"><summary>${title}</summary><div class="arcane-rule-body">${content}</div></details>`;}
function guideAdditions(){
 const levels=LESSONS.slice(0,9).map(l=>`<article class="lesson-guide-item"><h4>${l.title}</h4>${cardsExample(l.levels)}<p>${l.tip}</p></article>`).join('');
 const intro=chapter('9 · Spezialkombinationen bildlich erklärt',`<p>Eine Kombination entsteht aus <b>Stufen</b> deiner Fusionsmaterialien, nicht aus dem Namen der Monster. Die folgenden Karten sind Beispiele. Ein kleiner Qualitätsbonus hilft beim Fusionswurf, zusätzliche Würfe erhöhen die Chance auf ein gutes Ergebnis.</p><div class="lesson-guide-grid">${levels}</div><p><b>Stufe 1 und 2:</b> Kombinationen mit mindestens drei Materialien können zusätzlich bis zu 8 Prozentpunkte Qualitätsbonus erhalten. Ein Paar aus zwei Stufe-1-Monstern besitzt einen eigenen Spezialbonus. Die Qualität hat eine Obergrenze – nicht jede beliebige Fusion ist deshalb automatisch stärker.</p><p>Übe die Kombinationen über <b>Challenges → Lernherausforderungen</b>. Dort erhältst du ein Übungsdeck ohne Einfluss auf deinen Deckbau.</p>`);
 const basics=chapter('10 · So liest du eine Monsterkarte',`<div class="lesson-card-guide">${cardsExample([1,2,3])}<div><p><strong>Oben:</strong> Name und LV (Stufe). <strong>Mitte:</strong> das Monsterbild und sein Element. <strong>Unten links:</strong> Angriffswert. <strong>Unten rechts:</strong> Verteidigungswert. Auf der Karte selbst stehen nur die Zahlen; ATK und DEF werden in der Anleitung erklärt.</p><p><strong>Beschwören:</strong> Handkarte auswählen und freie Feldzone wählen. <strong>Angreifen:</strong> eigenes Monster und gegnerisches Ziel wählen. <strong>Fusionieren:</strong> Materialien auswählen und danach eine der verfügbaren Vorlagen. Die Kartenrahmen helfen dir, normale Kreaturen, Fusionen, ACEs und besondere Karten auseinanderzuhalten.</p></div></div>`);
 const fate=profile.fateDiscovered?chapter('11 · Das Geheimnis des Schicksalszugs',`<p>Das Schicksal kann ab der dritten Runde selten eingreifen, wenn ein Duellant ernsthaft bedrängt wird: Wenige LP, ein schwaches Feld und drohende Niederlage erhöhen die Chance auf <b>1 %, 3 % oder maximal 5 % pro berechtigtem Zug</b>. Es gibt keine Garantie.</p><p>Fünf zufällige Schicksalskarten ersetzen die zurückgemischte Hand. Die Werte orientieren sich am stärksten Monster des Gegners im Deck, auf dem Feld oder im Friedhof, zuzüglich 100 ATK und 100 DEF (mit Werteobergrenze). Die Karten sind nicht fusionierbar, erscheinen höchstens einmal pro Duellant und verschwinden nach dem Kampf. Spieler und KI haben dieselben Chancen.</p>`):chapter('11 · Dunkle Vorzeichen',`<p>Hüte dich vor Hochmut. Wenn ein Duellant zu sehr in Bedrängnis gerät, kann sich das Schicksal wenden – gegen jeden, der sich seines Sieges zu sicher ist.</p>`);
 return intro+basics+fate;
}
const oldRules=showRules;
showRules=function(){
 oldRules();
 const modal=$('modal');if(!modal)return;
 // This overlays the evolved handbook, which ships the full current rule text.
 modal.innerHTML=modal.innerHTML.replace(/Poker-?Kombinationen/gi,'Spezialkombinationen').replace(/Poker-?Fusionsboni/gi,'Spezialkombinationsboni').replace(/Pokerbonus/gi,'Kombinationsbonus').replace(/Pokerkombinationen/gi,'Spezialkombinationen');
 if($('modalGo'))$('modalGo').onclick=hideModal;
 const handbook=modal.querySelector('.arcane-handbook');
 if(handbook){handbook.insertAdjacentHTML('beforeend',guideAdditions());const intro=handbook.querySelector('.arcane-rule-chapter');if(intro)intro.open=true;}
};
const oldMenu=renderMenu;
renderMenu=function(){
 oldMenu();
 const nav=$('menuNav');if(!nav)return;
 // Section labels distinguish play, learning, collection, rewards, and system options.
 for(const title of nav.querySelectorAll('.lesson-nav-heading'))title.remove();
 const categories=[['tournament','⚔ SPIELEN'],['challenges','✦ LERNEN'],['collection','▤ SAMMLUNG'],['shop','✧ BELOHNUNGEN'],['stats','◷ ÜBERSICHT']];
 for(const [id,text] of categories){const item=nav.querySelector(`[data-tab="${id}"]`);if(item)item.insertAdjacentHTML('beforebegin',`<div class="lesson-nav-heading" aria-hidden="true">${text}</div>`);}
 const hero=$('menuHero');if(hero){
  const oldIntro=hero.querySelector('.evo-welcome');if(oldIntro)oldIntro.innerHTML=oldIntro.innerHTML.replace(/Poker-?Kombinationen/gi,'Spezialkombinationen');
  hero.insertAdjacentHTML('beforeend',`<div class="lesson-quicknav"><button class="btn primary" type="button" data-lesson-tab="tournament">⚔ Turnier spielen</button><button class="btn" type="button" data-lesson-tab="challenges">✦ Kombinationen lernen</button><button class="btn" type="button" data-lesson-tab="collection">▤ Mein Deck</button><button class="btn" type="button" id="lessonQuickRules">? Spielregeln</button></div>`);
  $('lessonQuickRules').onclick=showRules;
 }
 if(menuTab==='challenges'){
  const content=$('menuContent');content.insertAdjacentHTML('afterbegin',teachingPanels());
  if($('lessonHelp'))$('lessonHelp').onclick=showRules;
 }
 if(menuTab==='lexicon')$('menuContent').insertAdjacentHTML('afterbegin',`<section class="menu-panel lesson-overview"><h2>✦ So liest du deine Sammlung</h2><p><strong>Unbekannt</strong> heißt: Diese Kreatur wurde noch nicht entdeckt. Im Kartenrahmen erkennst du ihre Art; die linke Zahl ist Angriff, die rechte Verteidigung. Fusionen werden im Fusionsdeck verwaltet, normale Monster im Hauptdeck.</p><button class="btn" id="lessonLexiconGuide">? Illustriertes Regelbuch öffnen</button></section>`);
 if($('lessonLexiconGuide'))$('lessonLexiconGuide').onclick=showRules;
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-lesson-tab]');if(b){menuTab=b.dataset.lessonTab;renderMenu();return;}
 const lesson=e.target.closest('[data-lesson]');if(lesson){
  if(!opponentUnlocked(1))return;
  selectedLesson=lesson.dataset.lesson;
  const l=LESSON_MAP.get(selectedLesson);if(!l)return;
  openModal(modalHtml('LERNHERAUSFORDERUNG',l.title,'✧','Ein Leihdeck wird nur für diese Partie zur Verfügung gestellt.',`${cardsExample(l.levels)}<p>${l.tip}</p><p><strong>Ziel:</strong> Führe diese Spezialkombination aus und <b>gewinne</b> das Duell. Beim ersten erfolgreichen Abschluss erhältst du ein kleines Charakterpack. Dein eigenes Deck bleibt unverändert.</p>`, '<button class="btn" id="lessonCancel">ABBRECHEN</button><button class="btn primary" id="lessonConfirm">ÜBUNG STARTEN</button>'));
  $('lessonCancel').onclick=hideModal;
  $('lessonConfirm').onclick=()=>{hideModal();startDuel('pve',1,'lesson','easy',null);};
 }
});
// The full lesson definition stays in the browser; no external services or admin controls.
window.ArcaneLearning={version:'1.1',markSeen,seen:id=>(profile.lessonSeen||[]).includes(id),lessons:LESSONS.map(x=>({id:x.id,title:x.title,levels:[...x.levels],weights:{...x.weights}})),buildDeck:id=>lessonDeck(LESSON_MAP.get(id)),isPassed:g=>accomplished(g)};
if(uiMode==='menu')renderMenu();
})();
