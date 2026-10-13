/* Arcane Duel – Alpha 1.9 development extension.
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
   Cards are ordinary summonable cards, weaker than their tournament signatures.
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
 '<p>Besiegte Turnierduellanten schalten jeweils eine junge, etwas schwächere Ace-Karte frei. Jeder direkte Kauf ist einmalig. Nach dem Kauf kann die Karte mit nur <b>0,35 % je Boosterkarte</b> erneut gezogen werden. Der Preis sinkt mit deinem Spielerlevel.</p>'+
 '<div class="ace-grid">'+OPPONENTS.slice(1).filter(o=>profile.cleared.includes(o.id)).map(o=>{
  const id=aceIds[o.id],c=CARDS[id],done=profile.acePurchased.includes(o.id);
  return '<article class="ace-offer"><b>'+escapeHtml(c.name)+'</b><small>Level '+c.level+' · '+fmt(c.atk)+' ATK / '+fmt(c.def)+' DEF</small>'+
   '<small>'+ (done?'Kauf abgeschlossen · Booster-Chance freigeschaltet':'Einmaliger Kauf · '+fmt(aceCost(o.id))+' Essenz')+'</small>'+
   menuButton(done?'✓ Bereits gekauft':'Ace kaufen','buy-ace','data-id="'+o.id+'"',done||profile.coins<aceCost(o.id))+'</article>';
 }).join('')+'</div><p class="pool-note">Noch nicht besiegte Turniergegner und ihre Ace-Karten bleiben verborgen.</p></section>';

shopMarkup=function(){return stored.shopMarkup()+aceShop()};
navMarkup=function(){return stored.navMarkup().replace('>Freimodus<','>Freie Duelle<').replace('>Ausbau<','>Skills & Perks<')};

function popupHelp(title,body){
 openModal(modalHtml('SO FUNKTIONIERT ES',title,'?',body,'','<button class="btn primary" id="helpDismiss">VERSTANDEN · ESC</button>'));
 $('helpDismiss').onclick=hideModal;
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
  'Splitter sind an den jeweiligen Gegner gebunden. Du erhältst sie durch Duelle und kannst im Deckbau damit Karten herstellen. Für eine Herstellung benötigst du normalerweise 20 passende Splitter plus Essenz.');
};
/* Free duel cards show real auto-loot, highlighted when boost active.
   Quick-open pack button follows original profile.packs indices. */
regularOpponentPanel=function(o,tournament){
 let h=stored.regularOpponentPanel(o,tournament);
 if(tournament){
  const loss=profile.tournamentLosses[o.id]||0;
  if(loss&&!profile.cleared.includes(o.id)){
   const c=CARDS[o.signature],hint=profile.aceHints.includes(o.id);
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
 if(profile.rewardQueue.length){showMilestone();return;}
 if(d.action==='quick-pack'){const id=Number(d.id);if(openCharacterPack(id,d.mode||'easy'))showPack();else popupHelp('Kein Pack verfügbar','Für diesen Duellanten hast du gerade kein vollständiges Pack. Gewonnene Duelle füllen den Packfortschritt.');return;}
 if(d.action==='buy-ace'){if(buyAce(Number(d.id))){renderMenu();popupHelp('Ace-Monster freigeschaltet!','Deine neue Ace-Karte ist in der Sammlung. Sie kann nun mit einer sehr geringen Chance im Booster-Shop erscheinen.');}else popupHelp('Kauf nicht möglich','Du musst diesen Turniergegner besiegt haben, genug Essenz besitzen und darfst sein einmaliges Ace-Angebot noch nicht gekauft haben.');return;}
 if(d.action==='buy-hint'){const id=Number(d.id);if(buyHint(id)){renderMenu();popupHelp('Neuer Hinweis',OPPONENTS[id].name+' bevorzugt '+(OPPONENTS[id].policy==='guardian'?'defensive Spielzüge.':'seine gewohnte Kampfstrategie.')+' Beobachte die Reihenfolge seiner Fusionen.');}return;}
 if(d.action==='guide'){showGuide(0);return;}
 return stored.menuAction(d);
};
let introShowing=false;
const pages=[
 {title:'Willkommen in der Arena',sub:'Dein erstes Abenteuer beginnt hier.',left:'<h3>Das Ziel</h3><p>Besiege die Duellanten der Arena, sammle Monsterkarten und erweitere dein Deck. Jeder Gegner spielt etwas anders.</p><div class="guide-symbol">⚔</div>',right:'<h3>Dein Weg</h3><p>Trainieren → Turnierkämpfe gewinnen → Karten sammeln → stärkere Fusionen finden.</p><div class="guide-pill">✦ Besiege 10 Turnierduellanten</div>'},
 {title:'Deine Monsterkarten',sub:'Eine Karte, drei wichtige Informationen.',left:'<h3>Angriff und Verteidigung</h3><div class="guide-figure"><b>✦✦✦✦</b><div class="guide-icon">♞</div><span>ATK 980 &nbsp; DEF 760</span></div>',right:'<h3>Was bedeuten die Zahlen?</h3><p><b>ATK</b> bestimmt die Stärke beim Angreifen. <b>DEF</b> schützt ein verteidigendes Monster.</p><p>Silbergraue Rahmen markieren Startkarten. Fusionen leuchten violett; andere Rahmenfarben zeigen das Level.</p>'},
 {title:'So funktioniert ein Duell',sub:'Jeder Zug ist eine kleine Entscheidung.',left:'<h3>Dein eigener Zug</h3><p>Du ziehst auf fünf Handkarten auf und darfst eine Karte beschwören oder fusionieren. Anschließend kannst du mit deinen Monstern angreifen.</p><div class="guide-pill">1 Beschwörung je Zug</div>',right:'<h3>Ein Angriff</h3><div class="guide-numbers"><b>980 ATK</b><span>⚔</span><b>760 ATK</b></div><p>Der stärkere Angreifer gewinnt. Unterschied: <b>220 LP Schaden</b>. Gegen Verteidigung gelten andere Regeln.</p>'},
 {title:'Fusionen',sub:'Mehrere Monster ergeben eine neue Karte.',left:'<h3>Materialien markieren</h3><p>Markiere mindestens zwei Handkarten per Rechtsklick oder Touch-Fusion. Wähle eine passende Fusionskarte und ein freies Feld.</p><div class="guide-numbers"><b>Lv 2</b><span>＋</span><b>Lv 3</b><span>→</span><b>Fusion</b></div>',right:'<h3>Wertewurf verstehen</h3><p>Die neue Karte würfelt Werte zwischen 94 % und 106 % ihrer verstärkten Basiswerte. Bei zwei Würfen gewinnt das ATK/DEF-Paar mit der höheren Summe.</p><p>Deine Materialien können zusätzliche Punkte als <b>Materialbonus</b> liefern. Die Vorschau zeigt die möglichen Bereiche.</p>'},
 {title:'Kreaturenzerfall',sub:'Starke Monster bleiben nicht für immer stark.',left:'<h3>Automatischer Zerfall</h3><p>Ein Monster verliert in späteren eigenen Zügen Angriff und Verteidigung. Wer lange überlebt, verliert pro Zug nach und nach weniger.</p><div class="guide-pill">Fusion: −50 → −45 → −40 ...</div>',right:'<h3>Angriffe kosten Kraft</h3><p>Nach jedem Angriff verliert das überlebende Monster zusätzlich <b>30 ATK</b>. So können selbst sehr starke Gegner mit der Zeit geschwächt werden.</p>'},
 {title:'Beute und Dropladungen',sub:'Siege bringen Fortschritt.',left:'<h3>Nach dem Kampf</h3><p>Du erhältst Essenz, Erfahrungspunkte, Splitter und manchmal neue Karten. Besiegte Turniergegner schalten Freie Duelle frei.</p>',right:'<h3>Dropladungen</h3><p>Aktivierte Ladungen verbessern automatische Kämpfe. Eine wird pro Kampf verbraucht. Der erste Sieg über einen neuen Turniergegner füllt deinen Vorrat vollständig auf.</p>'},
 {title:'Deckbau und Skills',sub:'Stelle dir deinen Spielstil zusammen.',left:'<h3>Dein Deck</h3><p>Im Hauptdeck verwendest du genau 40 Karten. Im Fusionsdeck liegen deine Fusionskarten, die im Duell begrenzt einsetzbar sind.</p>',right:'<h3>Skills & Perks</h3><p>Investiere Essenz in Werteverbesserungen, Belohnungen und die Trainingsroutine. Unter „Freie Duelle“ kannst du Charakterpacks sammeln.</p>'},
 {title:'Bereit zum Spielen?',sub:'Du kannst jederzeit zurückblättern.',left:'<h3>Starte dein erstes Training</h3><p>Du musst nicht alle Details sofort beherrschen. Beginne mit ein paar einfachen Duellen und lerne die Fusionen Schritt für Schritt.</p><div class="guide-symbol">✧</div>',right:'<h3>Dieses Buch bleibt erhalten</h3><p>Im Menü findest du das <b>Duellantenhandbuch</b> jederzeit im <b>Lexikon</b>. Du kannst es auch jetzt schließen und später weiterblättern.</p>'}
];
function showGuide(page=0){
 const index=Math.max(0,Math.min(pages.length-1,page)),p=pages[index];
 introShowing=true;
 openModal('<div class="guide-header"><small>DUELLANTENHANDBUCH · SEITE '+(index+1)+' / '+pages.length+'</small><h2>'+p.title+'</h2><p>'+p.sub+'</p></div>'+
 '<div class="guide-spread"><section class="guide-page">'+p.left+'</section><section class="guide-page">'+p.right+'</section></div>'+
 '<div class="guide-footer">'+(index?'<button class="btn" id="guidePrev">← Zurück</button>':'<span></span>')+
 '<button class="btn" id="guideClose">Buch schließen</button>'+
 (index===pages.length-1?'<button class="btn primary" id="guideNext">Ab ins Duell!</button>':'<button class="btn primary" id="guideNext">Weiter →</button>')+'</div>');
 $('modal').classList.add('guide-modal');
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
 popupHelp('Duellantenhandbuch gespeichert','Du kannst das vollständige Handbuch jederzeit unter <b>Lexikon → Duellantenhandbuch</b> erneut öffnen.');
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
renderMenu=function(){
 stored.renderMenu();
 const el=$('menuContent');
 if(!el)return;
 if(menuTab==='lexicon')el.innerHTML=
  '<section class="menu-panel guide-entry"><h2>Duellantenhandbuch</h2><p>Alle Regeln und Mechaniken mit visuellen Beispielen – jederzeit hier nachlesen.</p>'+
  menuButton('📖 Duellantenhandbuch öffnen','guide')+'</section>'+el.innerHTML;
 if(menuTab==='upgrades'){
  const h=el.querySelector('h2');if(h)h.textContent='Skills & Perks';
 }
 const intro=el.querySelector('.menu-panel > p');if(intro)intro.classList.add('tab-intro');
 el.innerHTML=formatWording(el.innerHTML);
 const hero=$('menuHero');if(hero)hero.innerHTML=formatWording(hero.innerHTML);
 bindMenu();
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
   '<p>Du erhältst eine besondere Fusionskarte und ihre beschwörbare Gestalt: <b>'+escapeHtml(CARDS[o.loot[2]].name)+'</b> und <b>'+escapeHtml(CARDS[o.easyManifest].name)+'</b>.</p>'+
   '<p>Außerdem: 6 zusätzliche Splitter, dreifache Basisessenz und <b>vollständig aufgefüllte Dropladungen ('+dropChargeCap()+')</b>. Eine jüngere Ace-Karte ist nun im Booster-Shop erhältlich.</p></section>';
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
openModal=function(html){$('modal').classList.remove('guide-modal');return baseOpenModal(formatWording(html));};

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
 version:'1.9.0-dev',aceIds,aceCost,buyAce,buyHint,showGuide,
 featureCount:pages.length,closeGuide:finishGuide
};
if(!profile.guideSeen&&!profile.rewardQueue.length&&!profile.openPack&&!profile.activeDuel)showGuide(0);
})();
