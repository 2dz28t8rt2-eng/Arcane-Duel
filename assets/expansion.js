/* Arcane Duel – Alpha 2.2 development extension.
   Isolated from the original engine. Profile additions are optional, version 3 persists.
   Never deployed independently from assets/game.js. */
(function(){
'use strict';

const stored={
 validateProfile, freshProfile, renderMenu, renderHud, renderMenu16,
 menuAction, regularOpponentPanel, trainingPanel, shopMarkup, navMarkup,
 showFinished, rewardMatch, showRules, showToast, boosterPools, rollBooster,
 cardAvailable, showCopyAscension, showSell, showSalvage, fusionAnimation,
 bolt, damageFloat, xpHelpText
};

const aceIds=ACE_CARD_IDS; // Already registered by game.js before loading saved profiles.
const checkIds=(raw,limit=10)=>{
 if(!Array.isArray(raw)||raw.length>limit||new Set(raw).size!==raw.length||raw.some(x=>!Number.isInteger(x)||x<1||x>10))return [];
 return [...raw];
};
function normalizeExtras(p,raw={}){
 p.acePurchased=checkIds(raw.acePurchased);
 p.aceHints=checkIds(raw.aceHints);
 p.tournamentLosses=Array.isArray(raw.tournamentLosses)&&raw.tournamentLosses.length===11
  ?raw.tournamentLosses.map(v=>Number.isInteger(v)&&v>=0&&v<=1e9?v:0):Array(11).fill(0);
 p.guideSeen=raw.guideSeen===true;
 return p;
}
validateProfile=function(raw){return normalizeExtras(stored.validateProfile(raw),raw)};
freshProfile=function(){return normalizeExtras(stored.freshProfile(),{})};
normalizeExtras(profile,profile);

/* Ace acquisition: guaranteed single purchase; thereafter ultra-rare booster chance.
   The purchased ACE is the exact monster template used by its tournament opponent.
   Existing 314 card IDs are stable; new ACE cards are appended. */
function aceCost(tier,p=profile){
 const base=Math.ceil(OPPONENTS[tier].coins*14+180);
 const discount=Math.max(.48,1-.018*Math.max(0,playerLevel(p)-OPPONENTS[tier].level));
 return Math.ceil(base*discount/10)*10;
}
function buyAce(tier){
 if(storageConflict||!Number.isInteger(tier)||tier<1||tier>10||
    !profile.cleared.includes(tier)||profile.acePurchased.includes(tier)||profile.coins<aceCost(tier))return false;
 profile.coins-=aceCost(tier);
 profile.acePurchased.push(tier);
 addCard(aceIds[tier]);
 saveProfile();
 return true;
}
cardAvailable=function(id){if(CARDS[id]?.ace)return false;return stored.cardAvailable(id)};
boosterPools=function(tier){
 const p=stored.boosterPools(tier);
 p.normal=p.normal.filter(id=>!CARDS[id].ace);
 // Validation of saved boosters uses this pool, but rolling itself treats ACE separately.
 p.rare=[...p.rare,...profile.acePurchased.filter(tierId=>tierId<=tier).map(tierId=>aceIds[tierId])];
 return p;
};
rollBooster=function(tier,g={seed:rng(0xffffffff)||1},count=10){
 if(![1,3,5,10].includes(count))throw Error('Ungültige Boostergröße.');
 const pools=boosterPools(tier),rareCommon=pools.rare.filter(id=>!CARDS[id].ace),cards=[];
 const eligible=profile.acePurchased.filter(t=>t<=tier);
 for(let slot=0;slot<count;slot++){
  const roll=randomInt(g,100),cut=count===10?(slot<8?[85,98]:slot===8?[40,75]:[15,50]):count===5&&slot===4?[60,88]:[85,98];
  const pool=roll<cut[0]?pools.starter:roll<cut[1]?pools.normal:rareCommon;
  const picked=pool.length?pool[randomInt(g,pool.length)]:pools.starter[randomInt(g,pools.starter.length)];
  const rareAce=eligible.length&&randomInt(g,10000)<35; // 0.35 % each slot
  cards.push(rareAce?aceIds[eligible[randomInt(g,eligible.length)]]:picked);
 }
 return cards;
};
const aceShop=()=>'<section class="menu-panel ace-market"><h2>✦ Ace-Monster · Einmalige Angebote</h2>'+
 '<p>Besiegte Turnierduellanten schalten genau das ACE-Monster frei, das sie selbst einsetzen – inklusive Typ und Werten. Jeder direkte Kauf ist einmalig. Nach dem Kauf kann die Karte mit nur <b>0,35 % je Boosterkarte</b> erneut gezogen werden. Der Preis sinkt mit deinem Spielerlevel.</p>'+
 '<div class="ace-grid">'+OPPONENTS.slice(1).map(o=>{
  const id=aceIds[o.id],c=CARDS[id],done=profile.acePurchased.includes(o.id),locked=!profile.cleared.includes(o.id);
  const portrait=locked?'<div class="ace-thumbnail ace-unknown" aria-label="Noch nicht entdeckt">?</div>':'<img class="ace-thumbnail" src="'+c.art+'" alt="'+escapeHtml(c.name)+'">';
  return '<article class="ace-offer evo-ace-tier-'+o.id+(locked?' ace-locked':'')+'"><div class="ace-offer-head">'+portrait+'<div><span class="ace-eyebrow">✦ ACE-MONSTER</span><b>'+(locked?'Unbekanntes ACE':escapeHtml(c.name))+'</b><small>'+(locked?'Besiege diesen Turniergegner, um die Karte zu entdecken.':'Level '+c.level+' · '+(c.fusionOnly?'Fusion':'Normales Monster')+' · '+fmt(c.atk)+' ATK / '+fmt(c.def)+' DEF')+'</small></div></div>'+
   '<small>'+ (locked?'Gesperrt · Turnierstufe '+o.id+' besiegen':done?'Kauf abgeschlossen · Booster-Chance freigeschaltet':'Einmaliger Kauf · '+fmt(aceCost(o.id))+' Essenz')+'</small>'+
   menuButton(locked?'Noch gesperrt':done?'✓ Bereits gekauft':'Ace kaufen','buy-ace','data-id="'+o.id+'"',locked||done||profile.coins<aceCost(o.id))+'</article>';
 }).join('')+'</div><p class="pool-note">Noch nicht besiegte Turniergegner und ihre Ace-Karten bleiben verborgen.</p></section>';

function fusionPackPrice(){return Math.ceil(boosterPrice(highestCleared(),10)*1.8/10)*10;}
function buyFusionPack(){
 const tier=highestCleared(),pool=boosterPools(tier).rare.filter(id=>!CARDS[id].ace&&CARDS[id].fusionOnly&&!CARDS[id].milestoneOnly);
 if(storageConflict||profile.rewardQueue.length||profile.coins<fusionPackPrice()||!pool.length)return false;
 const id=pool[rng(pool.length)];profile.coins-=fusionPackPrice();addCard(id);profile.lastBooster={tier,cards:[id]};saveProfile();return true;
}
shopMarkup=function(){const tier=highestCleared(),available=boosterPools(tier).rare.some(id=>CARDS[id].fusionOnly&&!CARDS[id].ace);
 return stored.shopMarkup()+'<section class="menu-panel fusion-market"><h2>✧ Fusionsbooster</h2><p>Eine garantierte Fusionsvorlage aus bereits erreichten Turnierstufen. Keine Ace- oder Meilensteinmonster.</p>'+menuButton('1 Fusion · '+fmt(fusionPackPrice())+' Essenz','fusion-pack','',!available||profile.coins<fusionPackPrice())+'</section>'+aceShop();
};
navMarkup=function(){return stored.navMarkup().replace('>Freimodus<','>Freie Duelle<').replace('>Ausbau<','>Skills & Perks<')};

function popupHelp(title,body){
 openModal(modalHtml('SO FUNKTIONIERT ES',title,'?',body,'','<button class="btn primary" id="helpDismiss">VERSTANDEN · ESC</button>'));
 $('helpDismiss').onclick=hideModal;
}
/* Profile reset safety: always act on the active page's own SAVE_KEY,
   never clear() or remove unrelated saves, and never replace a concurrent edit. */
function resetProfileKind(){
 return 'Spielstand';
}
function showResetConfirmation(){
 if(storageConflict||!storageWritable){
  popupHelp('Zurücksetzen momentan nicht möglich','Der Browser meldet einen Speicherkonflikt oder blockiert das Speichern. Exportiere deinen Stand und lade diese Seite neu, bevor du etwas zurücksetzt.');
  return;
 }
 const kind=resetProfileKind();
 openModal(modalHtml('SPIELSTAND · SICHERHEITSABFRAGE 1/2','Spielstand zurücksetzen?','⚠',
  'Du möchtest deinen <b>'+kind+'</b> zurücksetzen. Alle Karten, Decks, Ressourcen, Siege, freigeschalteten Gegner und laufenden Partien dieses Profils gehen dabei verloren. '+
  '<br><br>Diese Aktion kann nur durch den Import einer zuvor exportierten Sicherung rückgängig gemacht werden.',
  '<p class="reset-backup-hint">Tipp: Exportiere deinen aktuellen Spielstand vorher als JSON-Datei.</p>',
  '<button class="btn" id="resetCancel1">ABBRECHEN</button><button class="btn reset-continue" id="resetNext1">JA, WEITER ZU SCHRITT 2</button>'));
 $('resetCancel1').onclick=hideModal;
 $('resetNext1').onclick=showResetFinalConfirmation;
}
function showResetFinalConfirmation(){
 const kind=resetProfileKind();
 openModal(modalHtml('SPIELSTAND · SICHERHEITSABFRAGE 2/2','Letzte Bestätigung','⚠',
  'Wirklich den <b>'+kind+'</b> vollständig auf den Ausgangszustand zurücksetzen?'+
  '<br><br>Dein Spielstand startet danach wieder mit den ursprünglichen Karten und ohne erspielten Fortschritt.',
  '<label class="reset-verification" for="resetVerifyInput">Tippe zur Bestätigung <strong>ZURÜCKSETZEN</strong> ein:'+
  '<input id="resetVerifyInput" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ZURÜCKSETZEN" aria-label="ZURÜCKSETZEN eingeben"></label>'+
  '<p class="reset-warning" role="note">Achtung: Kein automatisches Backup. Nur eine bereits exportierte JSON-Sicherung ermöglicht eine Wiederherstellung.</p>',
  '<button class="btn" id="resetCancel2">NEIN, ABBRECHEN</button>'+
  '<button class="btn reset-confirm" id="resetConfirm2" disabled>ENDGÜLTIG ZURÜCKSETZEN</button>'));
 $('resetCancel2').onclick=hideModal;
 const input=$('resetVerifyInput'),confirm=$('resetConfirm2');
 input.oninput=()=>confirm.disabled=input.value.trim()!=='ZURÜCKSETZEN';
 confirm.onclick=()=>{
  if(confirm.disabled||input.value.trim()!=='ZURÜCKSETZEN')return;
  if(!resetCurrentProfile()){
   popupHelp('Zurücksetzen nicht durchgeführt','Der Spielstand konnte nicht sicher gespeichert werden. Deine vorhandenen Daten wurden nicht absichtlich überschrieben. Bitte prüfe den Browser-Speicher, exportiere dein Profil und lade die Seite erneut.');
  }
 };
 input.focus?.();
}
function resetCurrentProfile(){
 if(storageConflict||!storageWritable)return false;
 try{
  // A second browser tab might have written to this exact profile meanwhile.
  if(window.localStorage.getItem(SAVE_KEY)!==lastStoredProfile){
   markStorageConflict();
   return false;
  }
  const next=freshProfile();
  // Validate the replacement before committing a single atomic storage write.
  validateProfile(next);
  const serialized=JSON.stringify(next);
  window.localStorage.setItem(SAVE_KEY,serialized);
  lastStoredProfile=serialized;
  // Reload instead of mutating in-memory duels, packs, timers, and deck drafts.
  window.location.reload();
  return true;
 }catch(error){
  storageWarning='Zurücksetzen konnte nicht gespeichert werden. Dein bisheriger Spielstand bleibt nach Möglichkeit erhalten.';
  return false;
 }
}

function dropHelp(){
 popupHelp('Dropladungen: Woher und wofür?',
 'Ein abgeschlossenes manuelles Duell gibt eine Dropladung. Beim ersten Sieg über einen neuen Turniergegner wird dein Vorrat komplett aufgefüllt. Aktivierte Dropladungen verstärken deine nächsten Autokämpfe: 50 % statt 30 % Essenz/XP und 20 % statt 12 % Kartenchance. Eine Ladung wird nach jedem abgeschlossenen Autokampf verbraucht, auch bei einer Niederlage. Mehr Platz erhältst du durch Levelbelohnungen.');
}
renderHud=function(){
 stored.renderHud();
 const b=$('hudDropToggle');
 if(b){
  b.setAttribute('data-help','Automatikbonus: 50 % Essenz/XP und 20 % Kartenchance statt 30 % und 12 %. Verbraucht eine Ladung pro Autokampf, auch bei Niederlage. Manuelle Duelle geben +1; erster Turniersieg füllt alles auf.');
  b.setAttribute('aria-label','Dropladungen: '+(profile.useDropCharges?'aktiv':'inaktiv')+'. Zum Ein- oder Ausschalten klicken; Hilfe beim Darüberfahren.');
  b.title='Dropladungen: Manuelle Duelle +1, erster Turniersieg volle Aufladung. Bei Auto 50 % Essenz/XP und 20 % Kartenchance.';
  const oldClick=b.onclick;
  b.onclick=()=>{oldClick?.();if(uiMode==='menu')renderMenu();};
 }
 if($('hudShardsHelp'))$('hudShardsHelp').onclick=()=>popupHelp('Splitter sammeln und einsetzen',
  'Alle erhaltenen Splitter gehören zu einem einzigen gemeinsamen Vorrat. Für die Herstellung einer Karte benötigst du 30 Splitter und die angezeigte Essenzmenge.');
};
/* Free duel cards show real auto-loot, highlighted when boost active.
   Quick-open pack button follows original profile.packs indices. */
regularOpponentPanel=function(o,tournament){
 let h=stored.regularOpponentPanel(o,tournament);
 if(tournament){
  const loss=profile.tournamentLosses[o.id]||0;
  if(loss&&!profile.cleared.includes(o.id)){
   const c=CARDS[o.aceCard],hint=profile.aceHints.includes(o.id);
   const low=round10(c.atk*.8),high=round10(c.atk*1.2);
   h=h.replace('</article>','<div class="ace-clue"><b>Nach deiner Niederlage: Acemonster-Spur</b><p>Geschätzte Angriffsstärke: '+fmt(low)+'–'+fmt(high)+' ATK.</p>'+
   (hint?'<p>'+escapeHtml(o.name)+' bevorzugt '+escapeHtml(o.policy==='guardian'?'Verteidigung und geduldige Züge':o.policy==='offensive'?'schnelle Angriffe':'ausgewogene Spielzüge')+'. Achte auf seine Fusionen.</p>':
   menuButton('Weiteren Hinweis kaufen · '+fmt(40+o.id*20)+' Essenz','buy-hint','data-id="'+o.id+'"',profile.coins<40+o.id*20))+'</div></article>');
  }
  return h;
 }
 const boosted=profile.useDropCharges&&profile.dropCharges>0;
 const multi=boosted?'.5':'.3';
 const power=boosted?.5:.3,drop=boosted?20:12;
 const k=packKey(o.id,difficultySelection[o.id]);
 const totalCoins=Math.floor(o.coins*(difficultySelection[o.id]==='hard'?1.6:1)*(1+.05*profile.upgrades.loot)*power);
 const noviceBonus=Math.max(0,10-playerLevel(profile))*.065;
 const totalXp=Math.floor(o.xp*(difficultySelection[o.id]==='hard'?1.6:1)*(1+.1*profile.upgrades.learning)*power*(1+noviceBonus));
 const extra='<div class="reward-preview"><strong>'+(boosted?'✦ DROPLADUNG AKTIV':'Aktuelle Autokampf-Beute')+'</strong>'+
  '<div>'+fmt(totalCoins)+' Essenz · '+fmt(totalXp)+' XP · '+(boosted?'2':'1')+' Splitter · Kartenchance '+drop+' %</div>'+
  '<small>'+ (boosted?'Der nächste automatische Kampf verbraucht eine Ladung.':'Aktiviere oben die Dropladungen, um den besseren Ertrag zu sehen.')+'</small></div>'+
  '<div class="pack-shortcut"><span>Charakterpacks verfügbar: <b>'+profile.packs[k]+'</b></span>'+
  menuButton('1 Pack öffnen','quick-pack','data-id="'+o.id+'" data-mode="'+difficultySelection[o.id]+'"',!profile.packs[k]||!!profile.openPack)+'</div>';
 h=h.replace('class="menu-panel opponent-card"','class="menu-panel opponent-card'+(boosted?' charged-opponent':'')+'"');
 return h.replace('</article>',extra+'</article>');
};
trainingPanel=function(){
 const h=stored.trainingPanel(),k=packKey(0,'easy');
 return h.replace('</section>','<div class="pack-shortcut"><span>Moos-Packs bereit: '+profile.packs[k]+'</span>'+
 menuButton('1 Pack öffnen','quick-pack','data-id="0" data-mode="easy"',!profile.packs[k]||!!profile.openPack)+'</div></section>');
};

function buyHint(id){
 if(storageConflict||id<1||id>10||profile.cleared.includes(id)||!(profile.tournamentLosses[id]>0)||profile.aceHints.includes(id))return false;
 const price=40+id*20;if(profile.coins<price)return false;
 profile.coins-=price;profile.aceHints.push(id);saveProfile();return true;
}

menuAction=function(d){
 if(d.action==='reset-profile'){showResetConfirmation();return;}
 if(d.action==='monster-index-next'){monsterIndexPage++;renderMenu();return;}
 if(d.action==='monster-index-prev'){monsterIndexPage=Math.max(0,monsterIndexPage-1);renderMenu();return;}
 if(d.action==='auto-report'){showAutoReport();return;}
 if(d.action==='fusion-pack'){if(buyFusionPack()){renderMenu();popupHelp('Fusionsbooster geöffnet','Du hast <b>'+escapeHtml(CARDS[profile.lastBooster.cards[0]].name)+'</b> erhalten.');}else popupHelp('Fusionsbooster','Zu wenig Essenz oder noch keine geeignete Fusion freigeschaltet.');return;}
 if(profile.rewardQueue.length){showMilestone();return;}
 if(d.action==='quick-pack'){const id=Number(d.id);if(openCharacterPack(id,d.mode||'easy'))showPack();else popupHelp('Kein Pack verfügbar','Für diesen Duellanten hast du gerade kein vollständiges Pack. Gewonnene Duelle füllen den Packfortschritt.');return;}
 if(d.action==='buy-ace'){if(buyAce(Number(d.id))){renderMenu();popupHelp('Ace-Monster freigeschaltet!','Deine neue Ace-Karte ist in der Sammlung. Sie kann nun mit einer sehr geringen Chance im Booster-Shop erscheinen.');}else popupHelp('Kauf nicht möglich','Du musst diesen Turniergegner besiegt haben, genug Essenz besitzen und darfst sein einmaliges Ace-Angebot noch nicht gekauft haben.');return;}
 if(d.action==='buy-hint'){const id=Number(d.id);if(buyHint(id)){renderMenu();popupHelp('Neuer Hinweis',OPPONENTS[id].name+' bevorzugt '+(OPPONENTS[id].policy==='guardian'?'defensive Spielzüge.':'seine gewohnte Kampfstrategie.')+' Beobachte die Reihenfolge seiner Fusionen.');}return;}
 if(d.action==='guide'){showGuide(0);return;}
 return stored.menuAction(d);
};
let introShowing=false;
const pages=[
  {
    "title": "Willkommen in Arcane Duel",
    "sub": "Ein guter erster Zug ist mehr wert als zwanzig Regeln auf einmal.",
    "left": "<h3>Worum es im Duell geht</h3><p>Du gewinnst, wenn die Lebenspunkte deines Gegners auf null fallen. Dafür baust du eine Stellung aus Monstern auf, greifst an und nutzt ihre Rollen. Manchmal ist ein schneller Angriff richtig. Manchmal gewinnt eine gut geschützte Gruppe, die den Gegner langsam zermürbt.</p><p>Dein Weg beginnt mit <b>drei Trainingssiegen</b>. Danach warten zehn Turnierprüfungen. Neue Karten und Möglichkeiten kommen mit deinem Fortschritt dazu.</p>",
    "right": "<h3>Lies so viel, wie du gerade brauchst</h3><p>Für den Anfang reichen die nächsten drei Kapitel: eine Karte lesen, ein Monster beschwören und einen Kampf verstehen. Die späteren Seiten erklären Rollen, Fusionen und deine Sammlung genauer.</p><p>Über die <b>Kapitelwahl</b> kannst du direkt zu einem Thema springen. Du darfst das Buch jederzeit schließen und später im Hauptmenü über <b>Startanleitung</b> wieder öffnen. Das durchsuchbare <b>Regel-Lexikon</b> ist zum Nachschlagen da.</p>"
  },
  {
    "title": "Deine Monsterkarte",
    "sub": "Links steht dein Angriff, rechts deine Verteidigung – und dazwischen die Stufe.",
    "left": "<h3>Eine Karte zum Anschauen</h3><figure class=\"ad-guide-figure\"><img src=\"assets/finished-cards/wave01/ascheling.png\" alt=\"Beispiel einer vollständigen Monsterkarte: Ascheling\" loading=\"lazy\"><figcaption>Schau zuerst auf die Werte und die Rolle. Das Bild erzählt dir, welches Wesen vor dir steht.</figcaption></figure>",
    "right": "<h3>Was die Angaben bedeuten</h3><p><b>ATK</b> ist der Angriffswert unten links. <b>DEF</b> steht unten rechts und wird im Einzelspielerduell zu den Trefferpunkten eines Monsters in Verteidigungsposition. Das <b>Stufensiegel zwischen den Werten</b> zeigt seine Monsterstufe.</p><p>Unter dem Bild findest du <b>Rolle und Element</b>. Ein Wächter spielt sich anders als ein Predator, selbst wenn beide dieselbe Stufe haben. Das Element ist unter anderem für gleichartige Fusionsmaterialien wichtig. Es gibt keinen allgemeinen Kreislauf wie „Feuer schlägt Erde“.</p><p>Der Rahmen hilft dir, Stufe und Kartenart wiederzuerkennen. Für deine Entscheidung zählen die tatsächlichen Werte, die Rolle und die Situation auf dem Feld.</p>"
  },
  {
    "title": "Dein erster Zug",
    "sub": "Erst eine Stellung aufbauen, dann gezielt handeln.",
    "left": "<h3>Vom Nachziehen bis zum Zugende</h3><p>Zu Beginn deines Zuges wird deine Hand auf fünf Karten aufgefüllt. Du hast fünf Monsterzonen und normalerweise <b>eine Beschwörung pro Zug</b>. Wähle eine Handkarte und anschließend eine freie eigene Zone.</p><p>Du kannst dein Monster in Angriff oder Verteidigung stellen, mit erlaubten Angreifern kämpfen und danach den Zug beenden. Im <b>allerersten Zug des gesamten Duells</b> ist noch kein Angriff möglich. Ab dem nächsten Zug gelten die normalen Angriffsregeln.</p>",
    "right": "<h3>Tippen, prüfen, entscheiden</h3><p>Solange eine normale Beschwörung nur vorbereitet ist, kannst du sie durch erneutes Antippen der Karte zurücknehmen. Nach dem tatsächlichen Ausspielen ist die Beschwörung verbraucht.</p><p>Für einen Angriff wählst du dein eigenes Monster und danach das Ziel. Ist das gegnerische Feld leer, ist ein direkter Angriff auf die Lebenspunkte möglich. Jedes Monster greift normalerweise einmal an und darf seine Position einmal pro Zug wechseln.</p><p>Tippe auf eine Karte, um ihre große Ansicht zu lesen. Das funktioniert auch bei den gegnerischen Monstern. Gerade vor einem Angriff lohnt sich dieser Blick.</p>"
  },
  {
    "title": "Angriff und Verteidigung",
    "sub": "Ein Angriff auf Lebenspunkte funktioniert anders als ein Treffer gegen eine Stellung.",
    "left": "<h3>Wenn beide Monster angreifen</h3><p>Hier werden die <b>ATK-Werte</b> verglichen. Dein Monster mit 980 ATK besiegt einen Angreifer mit 760 ATK. Die Differenz von <b>220</b> trifft die gegnerischen Lebenspunkte; ein vorhandener Schild kann Schaden abfangen.</p><p>Bei gleichen ATK werden beide Monster zerstört. Hat dein Angreifer weniger ATK, verlierst du ihn und nimmst die Differenz als LP-Schaden. Greife deshalb nicht nur an, weil noch ein Angriff möglich ist.</p>",
    "right": "<h3>Wenn das Ziel verteidigt</h3><p>In neuen Einzelspielerduellen sind die verbliebenen DEF seine <b>Monster-HP</b>. Treffer bauen diese HP ab. Mehrere Angreifer können gemeinsam einen starken Blocker besiegen. Überschüssiger Schaden wird dabei nicht automatisch zu LP-Schaden.</p><p>Wächter und Seelenzehrer wehren in DEF-Position <b>35 % des Angriffsschadens</b> ab. Aus 1.000 ATK werden dann 650 DEF-Schaden. Außerdem trifft dich ihr <b>Gegenschlag mit der Hälfte ihrer aktuellen ATK</b> – auch wenn dieser Treffer sie zerstört.</p><p class=\"royal-guide-note\">Im lokalen PvP gilt die klassische Verteidigung: Dort kann ein zu schwacher Angriff Rückstoßschaden verursachen. Die neuen DEF-HP-Regeln gelten im Einzelspieler-Modus.</p>"
  },
  {
    "title": "Mit Predatoren spielen",
    "sub": "Hohe ATK sind am stärksten, wenn deine Angriffe zusammenarbeiten.",
    "left": "<h3>Eine Lücke schaffen</h3><p>Predatoren stecken einen großen Teil ihres Potenzials in den Angriff. Sie können gegnerische Angreifer früh ausschalten und viel Druck auf ein freies Feld machen.</p><p>Gegen eine starke Verteidigung hilft oft <b>konzentrierter Schaden</b>: Zwei Angreifer treffen dasselbe Ziel, statt zwei Blocker nur ein wenig zu beschädigen. Ein gefährlicher Seelenzehrer kann ein wichtigeres Ziel sein als das Monster mit den niedrigsten DEF.</p>",
    "right": "<h3>Worauf du achten solltest</h3><p>Nach jedem Angriff verliert ein überlebender eigener Angreifer normalerweise <b>30 ATK</b>. Spätere Angriffe sind also schwächer. Der Ausbau Kampfdisziplin mildert diesen Verschleiß.</p><p>Rechne vor einem Angriff auf Wächter oder Seelenzehrer auch den Gegenschlag ein. Ein Treffer kann ihre Stellung schwächen und dich trotzdem das Duell kosten.</p><p><b>Jagdinstinkt</b> verbessert normale Predatoren dauerhaft. Eine Fusion bekommt diesen normalen Rollenbonus nicht einfach zusätzlich; ihre Werte entstehen durch die eigene Fusionsrechnung.</p>"
  },
  {
    "title": "Wächter und Seelenzehrer gemeinsam",
    "sub": "Die einen halten die Stellung. Die anderen machen aus dieser Zeit offensiven Druck.",
    "left": "<h3>Eine gemeinsame Mannschaft</h3><p><b>Wächter</b> regenerieren zu Beginn des eigenen Zuges Grund-DEF anderer verbündeter Verteidiger in DEF-Position. Sie heilen sich dadurch nicht selbst und erhöhen die DEF nicht über den gespeicherten Grundhöchstwert.</p><p><b>Seelenzehrer</b> brauchen diese Unterstützung: In DEF-Position schwächen sie das gegnerische Feld, sammeln Seelenessenz und verursachen direkten Seelenbrand. So kann eine Verteidigergruppe gewinnen, ohne ständig ihre Stellung für Angriffe aufzugeben.</p>",
    "right": "<h3>So greift die Kombination ineinander</h3><p>Stehen beispielsweise zwei Wächter neben mehreren Seelenzehrern, helfen die Wächter beim Erhalt der Stellung. Die Seelenzehrer verringern währenddessen gegnerische Werte und setzen den Gegner unter LP-Druck.</p><p>Beide Rollen profitieren in DEF-Position von Rüstung und Gegenschlag. <b>Schildwall</b> unterstützt normale Wächter <em>und</em> normale Seelenzehrer.</p><p>Eine einzige hohe DEF-Zahl ersetzt dieses Zusammenspiel nicht. Achte darauf, ob du genug offensive Seelenwirkung aufbaust. Ist das Gegnerfeld leer, kann auch ein gezielter Wechsel zum direkten Angriff den Kampf beenden.</p>"
  },
  {
    "title": "Seelenessenz richtig einsetzen",
    "sub": "Zusätzlicher Schutz und direkter Schaden kommen aus demselben Vorrat.",
    "left": "<h3>Absaugen und Seelenbrand</h3><p>Zu Beginn deines Zuges schwächt ein Seelenzehrer in DEF-Position die ATK und DEF gegnerischer Monster. Daraus entsteht <b>gespeicherte Seelenessenz</b>, die seine Verteidigung als weitere Schutzschicht ergänzt.</p><p>Schon das Absaugen verursacht <b>Seelenbrand</b>: bis zu 175 % der entzogenen Werte treffen die gegnerischen LP, begrenzt durch die Stufe des Seelenzehrers. Ohne gegnerische Monster gibt es keine Werte zum Absaugen.</p>",
    "right": "<h3>Entladen oder verdichten?</h3><p>Mit <b>Seelenstoß</b> entlädst du den gesamten Vorrat einmal pro eigenem Zug für <b>130 %</b> direkten Schaden. Aus 100 gespeicherter Seelenessenz werden 130 Schaden vor einem möglichen Schild. Du brauchst mindestens 40 Seelenessenz.</p><p><b>Verdichten</b> wandelt stattdessen 75 % des Vorrats in stabilere DEF um. Diese Schicht zerfällt über drei eigene Zugenden ohne Burn; die Fähigkeit hat drei eigene Züge Abklingzeit.</p><p>Entladen bringt den Sieg näher, nimmt dir aber den zusätzlichen Schutz. Verdichten hilft, wenn deine Stellung gerade den nächsten Angriff überstehen muss.</p>"
  },
  {
    "title": "Fusionen erschaffen",
    "sub": "Materialien geben dir Möglichkeiten. Die Fusionsvorlage legt fest, welche Gestalt du rufen kannst.",
    "left": "<h3>Eine Handfusion vorbereiten</h3><p>Aktiviere <b>Touch-Fusion</b> und markiere zwei bis fünf passende Handmonster. Am Computer geht die Materialwahl auch mit Rechtsklick. Wähle danach eine verfügbare Fusionsvorlage und eine eigene Feldzone.</p><p>Alle markierten Materialien werden tatsächlich verbraucht. Eine Fusion ist deshalb eine Entscheidung über deine Handkarten, deine nächste Stellung und die verbleibenden Fusionsvorlagen.</p>",
    "right": "<h3>Dein Fusionsdeck ist ein Vorrat</h3><p>Eine Vorlage muss in deinem <b>Fusionsdeck</b> liegen. Ihre Stufe muss zum berechneten Materialbudget passen. Eine sichtbare oder entdeckte Karte im Lexikon gehört dir dadurch noch nicht.</p><p>Jeder Fusionsschritt verbraucht eine mitgenommene <b>Kopie für dieses Duell</b>. Mehrere Kopien derselben Vorlage können mehrere Beschwörungen ermöglichen. Dein dauerhafter Kartenbesitz wird dadurch nicht aufgebraucht.</p><p>Eine Feldfusion verbindet eine vorbereitete Handkarte mit einem vorhandenen Feldmonster. Über die freie Feldfusion kannst du zusätzlich mehrere eigene Feldmonster auswählen. Bereits verbrauchte Angriffe werden durch das Verschmelzen nicht einfach erneuert.</p>"
  },
  {
    "title": "Kleine Monster, gute Kombinationen",
    "sub": "Bei Spezialkombinationen zählen die Stufen deiner Materialien.",
    "left": "<h3>Muster erkennen</h3><p><b>1 + 1</b> ist ein Paar. <b>2 + 2 + 2</b> ist ein Drilling. <b>1 + 2 + 3</b> ergibt eine kleine Straße. Vier oder fünf unmittelbar aufeinanderfolgende Stufen bilden eine große Straße.</p><p>Auch zwei Paare, Full House, Vierling und Fünfling helfen. Niedrige Stufen sind dadurch weiterhin nützlich. Materialien desselben Elements können zusätzlich <b>Elementharmonie</b> erzeugen.</p>",
    "right": "<h3>Was ein Bonus wirklich bringt</h3><p>Eine gute Kombination kann die Qualität erhöhen, weitere Wertewürfe geben oder höhere Vorlagen erlauben. Stufen, die weit auseinanderliegen, können die Qualität jedoch wieder senken.</p><p>ATK und DEF werden gemeinsam gewürfelt. Der Wurf mit der <b>höchsten Summe beider Werte</b> gewinnt. Es werden nicht der beste Angriff aus einem Wurf und die beste Verteidigung aus einem anderen zusammengesucht.</p><p>Unter <b>Herausforderungen → Lernherausforderungen</b> kannst du jedes Muster mit einem passenden Leihdeck üben. Die genauen Bonuswerte stehen im Regel-Lexikon.</p>"
  },
  {
    "title": "Welche Rolle erbt eine Fusion?",
    "sub": "Die Rolle prägt die Werte bereits vor dem Würfeln.",
    "left": "<h3>Materialien bestimmen die Richtung</h3><p>Zwei Predatoren vererben Predator. Zwei Seelenzehrer bleiben Seelenzehrer. Wächter und Seelenzehrer zählen bei gemischten Gruppen gemeinsam zur Verteidigerseite.</p><p>Bei größeren Gruppen braucht eine Seite eine echte Mehrheit. Fehlt diese, kann die Rolle der gewählten Vorlage den Ausschlag geben. Deshalb lohnt sich ein Blick auf die Rollen deiner Materialien, bevor du die Fusion bestätigst.</p>",
    "right": "<h3>Verteidiger bleiben nicht automatisch Seelenzehrer</h3><p>Eine Wächterfusion verschiebt den Ausgangswert in Richtung DEF. Eine Predatorfusion verschiebt ihn in Richtung ATK. Erst danach werden die tatsächlichen Wertewürfe ausgeführt.</p><p>Aus zwei Verteidigermaterialien entsteht nicht zufällig ein neuer Seelenzehrer. Ab drei geeigneten Materialien kann eine Wächterfusion erwachen; mehr und höherstufige Materialien erhöhen die Chance. Zwei bereits vorhandene Seelenzehrer brauchen dieses Erwachen nicht.</p><p>Der Rollenstempel und die Rechnung gehören zur tatsächlich entstandenen Fusion. Der feste Vorlagenwert allein ist keine Garantie für ihre endgültigen Kampfwerte.</p>"
  },
  {
    "title": "Warum Werte im Duell sinken",
    "sub": "Angriffsverschleiß, Kreaturenzerfall und Arenadruck sind drei verschiedene Dinge.",
    "left": "<h3>Deine Monster altern</h3><p>Ein frisch beschworenes Monster bleibt an seinem ersten eigenen Zugende vom Kreaturenzerfall verschont. Ab späteren eigenen Zugenden verliert es ATK und DEF.</p><p>Die ursprünglichen Startkarten beginnen bei <b>20</b> Punkten je Wert, andere normale Monster bei <b>30</b> und Fusionen bei <b>25</b>. Mit dem Alter sinkt der Abzug; ohne zusätzliche Ausbauten liegen die Mindestwerte bei 10, 20 beziehungsweise 15.</p><p>Das betrifft auch Monster, die nicht angreifen. Standhaftigkeit und bestimmte defensive Spezialisierungen können den Grundwertzerfall verringern.</p>",
    "right": "<h3>Auch die Arena wartet nicht ewig</h3><p>Ab <b>Runde 10</b> verlieren beide Seiten durch die Arena zusätzliche Lebenspunkte. Dieser Schaden steigt. Eine Stellung muss also irgendwann auch zum Sieg führen.</p><p>Gespeicherte Seelenessenz hat ihren eigenen Zerfall und ist nicht dasselbe wie deine Grund-DEF. Ihr natürlicher Verfall verursacht nur noch einen Teil als Burn.</p><p>Achte außerdem auf deinen Nachziehstapel: Ist er zu Beginn deines Zuges leer, verlierst du. Karten auf der Hand allein verhindern das nicht.</p>"
  },
  {
    "title": "Dein Deck und deine Sammlung",
    "sub": "Entdecken, besitzen und ins Deck nehmen sind drei verschiedene Schritte.",
    "left": "<h3>Was du mitnehmen darfst</h3><p>Dein <b>Hauptdeck hat genau 40 Karten</b>. Normalerweise sind höchstens drei Kopien derselben Karte erlaubt; besondere Karten können strengere Grenzen haben. Im Fusionsdeck liegen <b>2 bis 15 Vorlagenkopien</b>.</p><p>Du hast drei Deckplätze. Achte beim Wechsel darauf, welches Deck gerade aktiv ist. Eine neu erhaltene Karte wird nicht automatisch Teil deiner gewünschten Strategie.</p>",
    "right": "<h3>Eine Familie, mehrere Stufen</h3><p>Normale Monsterfamilien können bis Stufe 10 entwickelt werden. Die Varianten sind eigene Karten mit eigenen Werten, auch wenn sie sich ein Bild teilen. Deine Spieler-XP-Stufe ist etwas anderes als die Stufe eines einzelnen Monsters.</p><p>Das Lexikon zeigt mehr, als du bereits besitzt. Für deinen Deckbau zählt der tatsächliche Bestand. Beim Entdecken einer Fusion bekommst du deshalb nicht automatisch eine freie Kopie dieser Vorlage.</p><p>Vergleiche bei neuen Karten nicht nur die größte Zahl: Frage dich, welche Lücke sie im Deck schließt und welche Fusionsmuster dadurch häufiger werden.</p>"
  },
  {
    "title": "Besser werden ohne blind zu farmen",
    "sub": "Turniersiege öffnen neue Wege. Die Werkstatt macht aus passenden Karten gezielte Stufen.",
    "left": "<h3>Wenn eine Prüfung schwierig wird</h3><p>Prüfe zuerst dein aktives Deck und die verfügbaren Fusionskopien. Vielleicht fehlt dir eine passende Zwischenstufe, vielleicht verbrauchst du zu viele Materialien für einen kleinen Gewinn.</p><p>Essenz, XP, Splitter und Karten haben unterschiedliche Aufgaben. Booster verbreitern deine Sammlung; Herstellung gibt dir gezieltere Karten. Ausbauten wirken dauerhaft, können aber nur bestimmte Kartenarten betreffen.</p><p>Sehr leichte Gegner wiederholt zu besiegen bringt mit steigendem Spielerlevel weniger Fortschritt. Eine neue Turnierprüfung kann sich mehr lohnen als noch eine Runde beim frühesten Gegner.</p>",
    "right": "<h3>Die Monsterwerkstatt</h3><p>Hier kombinierst du <b>gewöhnliche Karten derselben Familie</b> oder teilst eine höhere Stufe auf. Die Summe der Stufen bleibt erhalten: Aus 2 + 2 + 1 kann beispielsweise Stufe 5 werden.</p><p>Die Werkstattgrenze beginnt bei Stufe 4. Nach Turnier III steigt sie auf 6, nach V auf 8 und nach VII auf 10. Im Deck verwendete oder geschützte Karten stehen nicht einfach als freies Material zur Verfügung.</p><p>Das ist eine dauerhafte Veränderung deines Inventars. Eine Kampffusion im Duell ist dagegen nur eine Gestalt für diese Partie.</p>"
  },
  {
    "title": "Üben, Quests und Belohnungen",
    "sub": "Ein passendes Übungsdeck hilft dir, eine Mechanik wirklich zu verstehen.",
    "left": "<h3>Gezielt statt zufällig lernen</h3><p>Die Lernherausforderungen leihen dir ein 40-Karten-Deck und passende Fusionsvorlagen. Spiele die verlangte Kombination und gewinne das Übungsduell. Der erste erfolgreiche Abschluss bringt ein kleines Charakterpack.</p><p>In den Spezialherausforderungen Verteidigung, Burst und Fusion arbeitest du an drei aufeinander aufbauenden Zielen. Nach einem erreichten Ziel kannst du aussteigen. Spielst du weiter und verlierst, ist die Belohnung dieses Versuchs verloren.</p>",
    "right": "<h3>Aktive Aufgaben bewusst verfolgen</h3><p>Bis zu drei Tagesquests sind gleichzeitig aktiv. Nur aktive Aufgaben sammeln Fortschritt; neu nachrückende Quests beginnen bei null. Pro Tag zählen höchstens 15 abgeschlossene oder übersprungene Aufgaben.</p><p>Beim Überspringen gibt es keine Belohnung. Hast du ein Ziel erfüllt, hole den Fortschritt über die angezeigte Schaltfläche ab.</p><p>Charakterpacks bieten drei unterschiedliche Karten zur Auswahl. Deine erste Auswahl ist kostenlos; weitere angezeigte Karten können Essenz kosten. Entscheide, was deinem Deck gerade wirklich hilft.</p>"
  },
  {
    "title": "Dein Essenzwesen und deine Schule",
    "sub": "Nach Turnier III öffnen sich drei zusätzliche Lehrduelle.",
    "left": "<h3>Erst ausprobieren, dann binden</h3><p>Die drei Lehrduelle stellen dir Predatoren, Fusionen und die Verteidiger-Spielweise mit Leihdecks vor. Danach kannst du <b>ein einziges Essenzmonster</b> wählen.</p><p>Diese Kartenwahl ist für deinen Spielstand endgültig. Lies deshalb die Beschreibung in Ruhe. Die Karte gehört dir anschließend, muss aber von dir in dein 40-Karten-Hauptdeck aufgenommen werden.</p>",
    "right": "<h3>Karte und passiver Perk sind getrennt</h3><p>Nach dem Monster wählst du deine passive Schule. Stimmen die Schule und dein Essenzwesen überein, entsteht zusätzliche Resonanz. Einen späteren Schulwechsel musst du erst über einen aufwendigen Weg erschließen; die einmal gewählte Karte bleibt dabei dieselbe.</p><p>Dein Begleiter entwickelt sich an Turniermeilensteinen weiter. Wenn du ihn im aktiven Deck führst, ernährt er sich aus einem Teil neu verdienter Duellbelohnungen. Die Belohnungsanzeige berücksichtigt diese Aufnahme bereits.</p><p>Du musst diese Bindung nicht mit den normalen Ausbauten Jagdinstinkt und Schildwall verwechseln: Das sind eigenständige Fortschrittssysteme.</p>"
  },
  {
    "title": "Bereit für die Arena!",
    "sub": "Nimm für den nächsten Kampf eine konkrete Idee mit.",
    "left": "<h3>Ein sinnvoller nächster Schritt</h3><p>Als Einsteiger beginnst du mit einem normalen Zug und einem klaren Angriffsziel. Danach übst du ein Fusionsmuster, das in deinem Deck tatsächlich vorkommt.</p><p>Wenn du Verteidiger spielen möchtest, baue <b>Wächter und Seelenzehrer gemeinsam</b> auf. Wenn du Predatoren spielst, suche gute Angriffe und verschwende ihre Stärke nicht an beliebige Ziele. Bei Fusionen prüfst du vor allem, welchen Gewinn der Materialverbrauch bringt.</p>",
    "right": "<h3>Du brauchst keinen perfekten Plan</h3><p>Schau nach einem schwierigen Duell auf eine konkrete Frage: War meine Stellung zu langsam? Fehlte eine Vorlage? Habe ich einen Gegenschlag übersehen? Oder hätten mehrere getrennte Monster mehr bewirkt als diese Fusion?</p><p>Die Startanleitung findest du wieder im Hauptmenü. Im <b>Regel-Lexikon</b> kannst du Begriffe wie Rüstung, Seelenstoß, Werkstatt oder Straße suchen und die passende Erklärung direkt öffnen.</p><p class=\"royal-guide-note\">Dein nächster Zug muss nicht alles lösen. Er sollte dir eine bessere Stellung geben.</p>"
  }
];
function showGuide(page=0){
 const index=Math.max(0,Math.min(pages.length-1,page)),p=pages[index];
 introShowing=true;
 openModal('<div class="guide-header"><small>DUELLANTENHANDBUCH · SEITE '+(index+1)+' / '+pages.length+'</small><h2>'+p.title+'</h2><p>'+p.sub+'</p></div>'+
 '<div class="guide-spread"><section class="guide-page">'+p.left+'</section><section class="guide-page">'+p.right+'</section></div>'+
 '<label class="ad-guide-chapters" for="guideChapter">Kapitel wählen<select id="guideChapter" aria-label="Kapitel der Startanleitung wählen">'+pages.map((item,i)=>'<option value="'+i+'" '+(i===index?'selected':'')+'>'+(i+1)+'. '+item.title+'</option>').join('')+'</select></label>'+
 '<div class="guide-footer">'+(index?'<button class="btn" id="guidePrev">← Zurück</button>':'<span></span>')+
 '<button class="btn" id="guideClose">Buch schließen</button>'+
 (index===pages.length-1?'<button class="btn primary" id="guideNext">Ab ins Duell!</button>':'<button class="btn primary" id="guideNext">Weiter →</button>')+'</div>');
 $('modal').classList.add('guide-modal');
 $('guideChapter').onchange=event=>showGuide(Number(event.target.value));
 if($('guidePrev'))$('guidePrev').onclick=()=>showGuide(index-1);
 $('guideClose').onclick=()=>finishGuide();
 $('guideNext').onclick=()=>index+1===pages.length?finishGuide():showGuide(index+1);
}
function finishGuide(){
 introShowing=false;
 profile.guideSeen=true;saveProfile();hideModal();
 if(uiMode==='menu')renderMenu();
 // One-time in-game orientation, not a transient toast.
 if(!$('overlay').classList.contains('hidden'))return;
 popupHelp('Duellantenhandbuch gespeichert','Startanleitung und durchsuchbares Regel-Lexikon findest du direkt im Hauptmenü.');
}
const previousHideModal=hideModal;
hideModal=function(){
 if(introShowing){introShowing=false;profile.guideSeen=true;saveProfile();}
 previousHideModal();
};
showRules=function(){showGuide(0)};
function formatWording(html){
 return html.replaceAll('Freimodus','Freie Duelle').replaceAll('Fusionskopien','Fusionskarten')
  .replaceAll('Fusionskopie','Fusionskarte').replaceAll('Kopienaufstiege','Kartenverstärkungen')
  .replaceAll('Kopienaufstieg','Kartenverstärkung').replaceAll('Kopien','Karten')
  .replaceAll('Kopie(n)','Karten').replaceAll('Exemplar(e)','Karten im Besitz')
  .replaceAll('Exemplare','Karten im Besitz').replaceAll('Exemplar','Karte');
}
function showAutoReport(){
 const fights=profile.history.filter(h=>h.context==='auto').slice(0,10);
 const wins=fights.filter(h=>h.win).length,coins=fights.reduce((n,h)=>n+h.coins,0),xp=fights.reduce((n,h)=>n+h.xp,0);
 openModal(modalHtml('AUTOKAMPF-BERICHT','Deine letzten '+fights.length+' Kämpfe','⚔','Hier kannst du die letzten automatischen Kämpfe jederzeit nachlesen.',
 '<div class="info-pills"><span>'+wins+' Siege</span><span>+'+fmt(coins)+' Essenz</span><span>+'+fmt(xp)+' XP</span></div><ol class="auto-report-list">'+fights.map(h=>'<li><b>'+(h.win?'✦ Sieg':'✕ Niederlage')+'</b> gegen '+escapeHtml(OPPONENTS[h.opponent].name)+' · +'+fmt(h.coins)+' Essenz · +'+fmt(h.xp)+' XP</li>').join('')+'</ol>',
 '<button class="btn primary" id="autoReportClose">Schließen</button>'));
 $('autoReportClose').onclick=hideModal;
}
let monsterIndexPage=0;
function monsterIndexMarkup(){
 const catalog=UPDATE_B_ACTIVE_IDS.map(id=>CARDS[id]).filter(c=>!c.ace||ownsCard(c.id)),known=catalog.filter(c=>ownsCard(c.id)),pages=Math.max(1,Math.ceil(catalog.length/12));
 monsterIndexPage=Math.min(monsterIndexPage,pages-1);
 const slice=catalog.slice(monsterIndexPage*12,(monsterIndexPage+1)*12);
 return '<section class="menu-panel monster-index"><h2>Monsterlexikon</h2><p>'+known.length+' von '+catalog.length+' Monsterarten entdeckt. Noch nicht besessene Monster bleiben verborgen.</p><div class="monster-index-grid">'+slice.map(c=>ownsCard(c.id)?'<article class="monster-index-entry"><img src="'+c.art+'" alt="'+escapeHtml(c.name)+'"><b>'+escapeHtml(c.name)+'</b><small>Level '+c.level+' · '+c.element+' · ATK '+fmt(c.atk)+' · DEF '+fmt(c.def)+'</small></article>':'<article class="monster-index-entry undiscovered"><div class="monster-silhouette" aria-label="Noch nicht entdeckt">?</div><b>Unbekannt</b><small>Noch nicht entdeckt</small></article>').join('')+'</div><div class="monster-index-pages">'+menuButton('← Zurück','monster-index-prev','',monsterIndexPage===0)+'<span>Seite '+(monsterIndexPage+1)+' / '+pages+'</span>'+menuButton('Weiter →','monster-index-next','',monsterIndexPage>=pages-1)+'</div></section>';
}
function bindCollectionFilters(){
 const root=$('menuContent'),grid=root.querySelector('.collection-grid');if(!grid)return;
 const cards=sourceCards(menuTab==='fusions'),items=[...grid.querySelectorAll('.collection-item')];
 const controls=Object.fromEntries(['cardSearch','cardElement','cardLevel','cardStatus','cardSort'].map(id=>[id,root.querySelector('#'+id)]));
 const update=()=>{
  const name=controls.cardSearch.value.trim().toLocaleLowerCase('de'),element=controls.cardElement.value,level=controls.cardLevel.value,status=controls.cardStatus.value,draft=menuTab==='fusions'?fusionDraft:deckDraft;
  const sorted=[];let count=0;
  cards.forEach((c,i)=>{const owned=profile.inventory[c.id]||0,visible=(!name||c.name.toLocaleLowerCase('de').includes(name))&&(!element||c.element===element)&&(!level||c.level===Number(level))&&(!status||status==='owned'&&owned>0||status==='deck'&&draft.includes(c.id)||status==='new'&&profile.unseen.includes(c.id)||status==='enhance'&&freeCopies(c.id)>=enhanceCost(c.id).copies);
   items[i].hidden=!visible;if(visible)count++;sorted.push({c,node:items[i]});
  });
  const sort=controls.cardSort.value;if(sort!=='default')sorted.sort((a,b)=>sort==='name'?a.c.name.localeCompare(b.c.name):sort==='atk'?b.c.atk-a.c.atk:b.c.def-a.c.def);
  for(const x of sorted)grid.appendChild(x.node);
  root.querySelector('#filterCount').textContent=count+' von '+cards.length+' Karten angezeigt';
 };
 for(const el of Object.values(controls))el.addEventListener(el.tagName==='INPUT'?'input':'change',update);
 update();
}
renderMenu=function(){
 stored.renderMenu();
 const el=$('menuContent');
 if(!el)return;
 if(menuTab==='lexicon')el.innerHTML=
  '<section class="menu-panel guide-entry"><h2>Duellantenhandbuch</h2><p>Alle Regeln und Mechaniken mit visuellen Beispielen – jederzeit hier nachlesen.</p>'+
  menuButton('📖 Duellantenhandbuch öffnen','guide')+'</section>'+monsterIndexMarkup()+el.innerHTML;
 if(menuTab==='free'){
  const threshold=Math.max(10,highestCleared()*4+5),dropFactor=Math.max(.4,1-.12*Math.max(0,playerLevel(profile)-threshold));
  el.insertAdjacentHTML('afterbegin','<section class="menu-panel"><h2>Fortschrittsbonus</h2><p>Bei einem sehr hohen Spielerlevel im Verhältnis zur Turnierstufe werden alte Freie-Duelle-Drops schrittweise seltener. Dein aktueller Drop-Faktor: <b>'+Math.round(dropFactor*100)+' %</b> der normalen Chance. Neue Turnierstufen heben die Grenze an. Die Essenz- und XP-Basisbelohnung bleibt bestehen.</p></section>');
 }
 if(menuTab==='free'){
  el.insertAdjacentHTML('afterbegin','<section class="menu-panel auto-history"><h2>⚔ Autokampf-Ergebnisse</h2><p>Die letzten zehn automatischen Kämpfe mit Essenz, XP und Sieg/Niederlage jederzeit ansehen.</p>'+menuButton('Ergebnisbericht öffnen','auto-report')+'</section>');
 }
 if(menuTab==='upgrades'){
  const h=el.querySelector('h2');if(h)h.textContent='Skills & Perks';
  const intro=el.querySelector('.menu-panel > p');if(intro)intro.textContent='Wähle Kampf-, Fusions- und Komfortvorteile. Monstertraining hat abnehmende Boni.';
 }
 if(['collection','fusions'].includes(menuTab)){
  const grid=el.querySelector('.collection-grid');
  if(grid){
   const section=document.createElement('section');section.className='menu-panel collection-filters';
   section.innerHTML='<h3>Karten filtern</h3><div class="filter-controls"><label>Suche <input id="cardSearch" type="search" placeholder="Name"></label><label>Element <select id="cardElement"><option value="">Alle</option>'+[...new Set(sourceCards(menuTab==='fusions').map(c=>c.element))].map(v=>'<option>'+escapeHtml(v)+'</option>').join('')+'</select></label><label>Stufe <select id="cardLevel"><option value="">Alle</option>'+Array.from({length:10},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('')+'</select></label><label>Status <select id="cardStatus"><option value="">Alle</option><option value="owned">Besitz</option><option value="deck">Im Deck</option><option value="new">Neu</option><option value="enhance">Verstärkbar</option></select></label><label>Sortierung <select id="cardSort"><option value="default">Standard</option><option value="atk">ATK</option><option value="def">DEF</option><option value="name">Name</option></select></label></div><small id="filterCount"></small>';
   grid.parentNode.insertBefore(section,grid);
  }
 }
 if(menuTab==='settings'){
  el.insertAdjacentHTML('beforeend','<section class="menu-panel reset-panel" aria-label="Spielstand zurücksetzen">'+
   '<h2>Spielstand zurücksetzen</h2>'+
   '<p>Hier kannst du den aktuellen <b>'+resetProfileKind()+'</b> vollständig neu beginnen. <b>Alle Fortschritte dieses Spielstands werden überschrieben.</b></p>'+
   '<p>Du musst den Vorgang zweimal ausdrücklich bestätigen. Bitte Spielstand vorher sichern.</p>'+
   menuButton('Spielstand zurücksetzen …','reset-profile')+'</section>');
 }
 const intro=el.querySelector('.menu-panel > p');if(intro)intro.classList.add('tab-intro');
 el.innerHTML=formatWording(el.innerHTML);
 const hero=$('menuHero');if(hero)hero.innerHTML=formatWording(hero.innerHTML);
 bindMenu();
 if(['collection','fusions'].includes(menuTab))bindCollectionFilters();
 if($('alwaysXPHelp'))$('alwaysXPHelp').onclick=showXPHelp;
};
stored.showFinished=stored.showFinished||showFinished;
showFinished=function(){
 if(!game)return;
 const wasNew=game.mode==='pve'&&game.context==='tournament'&&game.winner===0&&!profile.cleared.includes(game.opponentId);
 stored.showFinished();
 if(wasNew){
  const o=OPPONENTS[game.opponentId];
  const html='<section class="first-win-box"><h3>✦ Erste Turnierprüfung bestanden!</h3>'+
   '<p>Die nächste Prüfung ist freigeschaltet. Das ACE-Monster des besiegten Duellanten kann ab jetzt <b>einmalig im Shop gegen Essenz gekauft</b> werden. Es wird nicht kostenlos vergeben.</p>'+
   '<p>Zusätzliche Turnierbelohnungen, einschließlich Erfahrung und Essenz, werden in deiner Ergebnisübersicht angezeigt.</p></section>';
  const modal=$('modal');if(modal)modal.insertAdjacentHTML('afterbegin',html);
 }
};
rewardMatch=function(g){
 const before=g.mode==='pve'&&g.context==='tournament'&&g.winner!==0&&!g.surrendered;
 const ret=stored.rewardMatch(g);
 if(before&&ret){profile.tournamentLosses[g.opponentId]=(profile.tournamentLosses[g.opponentId]||0)+1;saveProfile();}
 return ret;
};
// Format modal text BEFORE controls receive onclick handlers.
const baseOpenModal=openModal;
openModal=function(html){$('modal').classList.remove('guide-modal','fusion-choice-modal');return baseOpenModal(formatWording(html));};

showToast=function(msg){
 if(typeof msg==='string'&&/^Wozu|^Was bedeutet|^Wie funktioniert/i.test(msg))return popupHelp('Hilfe',escapeHtml(msg));
 return stored.showToast(msg);
};
document.addEventListener('keydown',function(event){
 if(event.key==='Escape'&&!$('overlay').classList.contains('hidden')){
  if(introShowing)finishGuide();else hideModal();
  event.preventDefault();event.stopImmediatePropagation();return;
 }
 if((event.key===' '||event.code==='Space')&&!event.repeat&&!event.ctrlKey&&!event.altKey&&!event.metaKey){
  if(event.target?.closest?.('input,textarea,select,[contenteditable],button,a'))return;
  const visible=!$('overlay').classList.contains('hidden');
  const start=visible&&$('modalGo')&&$('modalGo').textContent.includes('DUELL STARTEN');
  if(start&&typeof $('modalGo').onclick==='function'){
   event.preventDefault();event.stopImmediatePropagation();$('modalGo').click();
  }
 }
},true);

/* FX keep core damage math deterministic: decorations are DOM-only. */
bolt=function(a,b){
 stored.bolt(a,b);
 if(animationSpeed==='instant'||!document.body)return;
 const spark=document.createElement('div');spark.className='combat-impact';
 spark.style.left=b.x+'px';spark.style.top=b.y+'px';
 spark.innerHTML='<i></i><i></i><i></i><i></i>';
 document.body.append(spark);setTimeout(()=>spark.remove(),530);
 const target=document.elementFromPoint?.(b.x,b.y)?.closest?.('.monster-slot,.player-banner,.board-creature');
 if(target){target.classList.remove('impact-shake');void target.offsetWidth;target.classList.add('impact-shake');setTimeout(()=>target.classList.remove('impact-shake'),480);}
};
damageFloat=function(p,value){
 stored.damageFloat(p,value);
 if(animationSpeed==='instant')return;
 const n=document.createElement('div');n.className='combat-damage';n.textContent=String(value);
 n.style.left=p.x+'px';n.style.top=p.y+'px';document.body.append(n);setTimeout(()=>n.remove(),950);
};
fusionAnimation=async function(level){
 if(animationSpeed==='instant')return;
 const fx=document.createElement('div');fx.className='magic-summon';
 fx.innerHTML='<span class="magic-ring"></span><span class="magic-core">✧ Lv '+level+' ✧</span>';
 document.body.append(fx);sound('summon');await animationWait(350);fx.remove();
};

window.ArcaneExpansion={
 version:'2.2.0-dev',aceIds,aceCost,buyAce,buyHint,buyFusionPack,fusionPackPrice,showGuide,resetCurrentProfile,showResetConfirmation,
 featureCount:pages.length,closeGuide:finishGuide
};
if(!profile.guideSeen&&!profile.rewardQueue.length&&!profile.openPack&&!profile.activeDuel)showGuide(0);
})();
