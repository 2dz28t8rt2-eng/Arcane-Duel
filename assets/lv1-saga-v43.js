(function arcaneLv1Saga(){
 'use strict';
 const SW=window.ArcaneLv1Swarm;
 const STORIES=[
  {title:'Der hoffnungslose Forscher',dialog:'Du denkst wahrscheinlich, du bist stark, was? Mit deinen riesigen Monstern und lächerlichen Fusionen! Aber meine kleinen Freunde verbergen ein GEHEIMNIS! Komm schon! Ich zeige dir, wozu sie fähig sind!',after:'Schon wieder verloren ... Warum existieren diese winzigen Kreaturen überhaupt? Hör zu: In alten Aufzeichnungen ist von einem Schweben zwischen Welten die Rede. Hilfst du mir bei meiner Forschung?'},
  {title:'Die erste Regung',dialog:'Siehst du? Diese kleinen Wesen verschwinden nicht einfach! Ich habe es immer gesagt! Heute finden wir heraus, wie ihr Echo wirklich funktioniert!',after:'Wie hast DU das gemacht? Ich habe es doch entdeckt! Nun gut ... in der nächsten Schriftrolle wird von ganzen Schwärmen gesprochen.'},
  {title:'Die Stimme des Schwarms',dialog:'Ich habe ein paar stärkere Kreaturen mitgebracht. Nur zu Vergleichszwecken! Ich bin immer noch der größte Freund der kleinen Geister. Wirklich!',after:'Warum gehorchen sie ausgerechnet dir?! Ich habe ihnen ALLES gegeben. Vielleicht haben die anderen recht und diese winzigen Dinger sind wertlos.'},
  {title:'Die verworfene Lehre',dialog:'Genug mit deinem ewigen Geisterspiel! Ich habe Predatoren gezüchtet. Ein echter Duellant setzt auf Stärke – nicht auf kleine, zitternde Funken!',after:'Du wagst es, mich mit MEINER EIGENEN FORSCHUNG zu schlagen?! Ein letztes Duell. Dann wird endgültig klar, wer hier der Meister ist.'},
  {title:'Der letzte Funke',dialog:'ICH HABE JAHRE AN DIESE NUTZLOSEN KREATUREN VERSCHWENDET! Du hast meine Forschung gestohlen! Jetzt werde ich dir zeigen, was WAHRE MACHT bedeutet!',after:'Vielleicht war ich niemals derjenige, auf den sie gewartet haben. Nimm diese Karte. Ich werde nicht mehr duellieren. Aber meine Forschung ... die gebe ich nicht auf.'}
 ];
 const clean=x=>({offered:x?.offered===true,stage:Number.isInteger(x?.stage)?Math.min(5,Math.max(0,x.stage)):0,
  perk:x?.perk===true,aceGranted:x?.aceGranted===true,finalRewards:x?.finalRewards===true,
  story:Array.isArray(x?.story)?[...new Set(x.story.filter(n=>Number.isInteger(n)&&n>=1&&n<=5))]:[]});
 const saved=(()=>{try{return window.__arcaneLv1SavedProfile?.lv1Saga||window.__arcaneLv1OriginalSaga||JSON.parse(localStorage.getItem(SAVE_KEY)||'null')?.lv1Saga||null;}catch{return null;}})();
 const oldFresh=freshProfile,oldValidate=validateProfile;
 freshProfile=function(){const p=oldFresh();p.lv1Saga=clean();return p;};
 validateProfile=function(raw){const p=oldValidate(raw);p.lv1Saga=clean(raw?.lv1Saga);return p;};
 profile.lv1Saga=clean(saved||profile.lv1Saga);
 if(saved&&!window.__arcaneLv1SavedProfile)saveProfile();
 // The early engine validates a conservative view of cards it has not registered.
 // Rehydrate ONLY the approved Lv1 IDs after all extensions and validations exist.
 const storedFull=window.__arcaneLv1SavedProfile;
 if(storedFull){
  const legalNew=new Set(Object.values(SW.ids));
  const own=id=>Number.isInteger(storedFull.inventory?.[id])&&storedFull.inventory[id]>0&&storedFull.inventory[id]<=999999;
  for(const id of legalNew)if(own(id)){
   profile.inventory[id]=storedFull.inventory[id];
   const k=CARDS[id].fusionOnly?'fusionOwned':'unlocked';
   if(!profile[k].includes(id))profile[k].push(id);
   if(storedFull.unseen?.includes(id)&&!profile.unseen.includes(id))profile.unseen.push(id);
   if(storedFull.favorites?.includes(id)&&!profile.favorites.includes(id))profile.favorites.push(id);
   const rank=storedFull.enhancements?.[id];
   if(Number.isInteger(rank)&&rank>=0&&rank<=5)profile.enhancements[id]=rank;
  }
  const validMain=deck=>Array.isArray(deck)&&!mainDeckError(deck,profile.unlocked)&&!inventoryError(deck,profile.inventory);
  const validFusion=deck=>Array.isArray(deck)&&!fusionDeckError(deck)&&!inventoryError(deck,profile.inventory)&&deck.every(id=>profile.fusionOwned.includes(id));
  if(validMain(storedFull.activeDeck))profile.activeDeck=[...storedFull.activeDeck];
  if(validFusion(storedFull.fusionDeck))profile.fusionDeck=[...storedFull.fusionDeck];
  if(Array.isArray(storedFull.slots)&&storedFull.slots.length===3){
   const restored=storedFull.slots.map(slot=>({
    name:typeof slot.name==='string'&&slot.name.length<=50?slot.name:'Deck',
    main:validMain(slot.main)?[...slot.main]:[...profile.activeDeck],
    fusion:validFusion(slot.fusion)?[...slot.fusion]:[...profile.fusionDeck]
   }));
   profile.slots=restored;
  }
  if(storedFull.activeDuel){try{profile.activeDuel=validateDuelSnapshot(storedFull.activeDuel);}catch(e){console.warn('Lv1 Duell konnte nicht wiederhergestellt werden:',e.message);}}
  delete window.__arcaneLv1SavedProfile;
  saveProfile();
 }
 const state=()=>profile.lv1Saga||(profile.lv1Saga=clean());
 function eligible(){
  return RPG_BASE_CARDS.filter(c=>c.rpg&&c.level===1&&!c.retired&&!c.enemyOnly&&!c.essenceMonster&&!c.ace&&!c.fusionOnly&&!c.milestoneOnly);
 }
 function fraction(){
  const ids=[...new Set(eligible().map(c=>c.id))],owned=ids.filter(id=>(profile.inventory[id]||0)>0);
  return {n:owned.length,total:ids.length,threshold:Math.ceil(ids.length/3)};
 }
 function forced(){
  return playerLevel(profile)>=6||highestCleared(profile)>=5||fraction().n>=fraction().threshold;
 }
 function maybeOffer(g){
  const s=state();if(s.offered||s.stage>0||s.perk||g?.mode!=='pve'||g.surrendered||
   !['tournament','free'].includes(g.context)||g.automatic||g.context==='auto')return false;
  const tier=highestCleared(profile),chance=tier<=3?30:50;
  if(forced()||randomInt(g,100)<chance){s.offered=true;saveProfile();return true;}
  return false;
 }
 const ACE_SCENES=[
  {mood:'EUPHORIE',text:'Da ist sie! Lumira! Der erste Funke! Meine kostbarste Karte! Gleich wird sie ihre wahre Macht offenbaren. Ich WEISS es!',response:'Violette Flammen umkreisen Lumira. Doch der ersehnte Seelenblitz bleibt aus.'},
  {mood:'HOFFNUNG',text:'Lumira, ich vertraue dir. Diesmal muss es funktionieren! Ich habe die alten Glyphen entschlüsselt. Bitte ... zeig ihm, was in dir steckt!',response:'Ihr Siegel pulsiert. Ohne den Auserwählten antwortet die Karte nicht.'},
  {mood:'ZWEIFEL',text:'Wieder du, Lumira? Ich habe ALLES versucht. Warum hört diese Kreatur auf meinen Gegner, aber nicht auf mich?! Na los, enttäusch mich nicht wieder!',response:'Die magische Aura leuchtet, doch ihre Fähigkeiten bleiben versiegelt.'},
  {mood:'VERZWEIFLUNG',text:'Ich hatte geschworen, nie wieder auf dich zu setzen ... und doch kann ich dich nicht fortwerfen. Hörst du?! TU ENDLICH ETWAS!',response:'Er klammert sich an die Karte, die ihm längst keinen Sieg mehr verspricht.'},
  {mood:'LETZTE HOFFNUNG',text:'Lumira ... ein letztes Mal. Ich brauche dich nicht! Meine Predatoren werden siegen. Und trotzdem ... wenn du mich jemals erwählen wolltest, DANN JETZT!',response:'Lumiras Licht erlischt. Verzweifelt sucht der Fanatiker nach einer anderen Form von Macht.'}
 ];
 const DECK_PROFILES=[
  null,
  {name:'Die schwächsten Funken',cap:1,lv1:40,power:.38,lp:2000},
  {name:'Der unruhige Sammler',cap:2,lv1:32,power:.49,lp:3000},
  {name:'Der neidische Jäger',cap:4,lv1:14,power:.77,lp:4500},
  {name:'Die verworfene Lehre',cap:5,lv1:5,power:.73,lp:5200},
  {name:'Das letzte Aufbäumen',cap:7,lv1:0,power:.93,lp:7000}
 ];
 const OBJECTIVES=[
  {name:'Einführung',description:'Besiege den Level-1-Fanatiker im 2.000-LP-Duell.',goal:null},
  {name:'Floating',description:'Lass mindestens ein echtes Level-1-Monster das Feld verlassen und löse Floating aus.',goal:'floating'},
  {name:'Swarm',description:'Beschwöre ein echtes Level-1-Monster und löse eine Schwarmkopie aus.',goal:'swarm'},
  {name:'Fusion',description:'Erschaffe mindestens eine der drei exklusiven Level-1-Fusionen.',goal:'special'},
  {name:'Die letzte Prüfung',description:'Kombiniere Floating, Swarm und eine Spezialfusion im selben Duell.',goal:'all'}
 ];
 function mastered(g){const st=g?.lv1Saga?.stage||0,p=g?.lv1SagaProgress||{},goal=OBJECTIVES[st-1]?.goal;
  return !goal||(goal==='all'?(p.floating>0&&p.swarm>0&&p.special>0):p[goal]>0);
 }
 const oldReward=rewardMatch;
 rewardMatch=function(g){
  if(!g?.lv1Saga){
   const reward=oldReward(g);
   if(reward)maybeOffer(g);
   return reward;
  }
  if(g.rewardClaimed||profile.rewardLedger.includes(g.id))return null;
  g.rewardClaimed=true;profile.rewardLedger.push(g.id);profile.rewardLedger=profile.rewardLedger.slice(-512);
  const win=g.winner===0&&!g.surrendered,stage=g.lv1Saga.stage,s=state(),first=win&&mastered(g)&&stage===s.stage+1;
  const coins=first?stage===1?10:stage*25:0, xp=first?stage===1?5:10*stage:0;
  if(win)profile.wins++;else profile.losses++;
  if(first){
   s.stage=stage;s.offered=true;if(!s.story.includes(stage))s.story.push(stage);
   profile.coins=Math.min(1e9,profile.coins+coins);profile.xp=Math.min(1e9,profile.xp+xp);
   if(stage===5&&!s.finalRewards){
    s.perk=true;s.finalRewards=true;
    if(!s.aceGranted){addCard(SW.ids.ace);s.aceGranted=true;}
    const normal=eligible().map(c=>c.id);
    const special=[SW.ids.hive,SW.ids.protector,SW.ids.attacker];
    const bundles=[];
    for(let i=0;i<10;i++){
     if(randomInt(g,100)>=50)continue;
     const cards=[];
     for(let j=0;j<3;j++){
      const fusion=randomInt(g,100)<30;
      const pool=fusion?special:normal;
      const id=pool[randomInt(g,pool.length)];
      cards.push(id);addCard(id);
     }
     bundles.push(cards);
    }
    g.lv1BonusPacks=bundles;
   }
  }
  profile.history.unshift({opponent:1,win,turns:g.turn,coins,xp,at:Date.now(),context:'free'});
  profile.history=profile.history.slice(0,30);
  saveProfile();
  return {coins,xp,loot:null,charge:0,lv1Saga:stage,lv1StageNew:first,lv1Completed:stage===5&&first,
   lv1BonusPacks:g.lv1BonusPacks||[]};
 };
 const oldCreate=createGame;
 let stageWanted=0;
 function forty(levelCap=1,weakest=false,predator=false){
  const pool=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.essenceMonster&&!c.retired&&c.level<=levelCap)
   .sort((a,b)=>predator?(a.role==='predator'?-1:0)-(b.role==='predator'?-1:0)||b.atk-a.atk:
     weakest?a.atk+a.def-b.atk-b.def:a.level-b.level||a.id-b.id);
  const result=[],count=new Map();
  for(const c of pool){for(let n=0;n<3&&result.length<40;n++){result.push(c.id);count.set(c.id,(count.get(c.id)||0)+1);}if(result.length===40)break;}
  if(result.length<40)throw Error('Zu wenige zulässige Level-1-Karten für die Herausforderung.');
  return result;
 }
 function fanaticDeck(stage){
  const design=DECK_PROFILES[stage];
  const pool=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.retired&&!c.enemyOnly&&!c.essenceMonster&&c.level<=design.cap);
  const lv1=pool.filter(c=>c.level===1).sort((a,b)=>a.atk+a.def-b.atk-b.def||a.id-b.id);
  const hunters=pool.filter(c=>c.level>=2).sort((a,b)=>{
   const pa=a.role==='predator'?1:0,pb=b.role==='predator'?1:0;
   return pb-pa||b.atk-a.atk||b.level-a.level||a.id-b.id;
  });
  if(stage===1)return forty(1,true,false);
  const deck=[],count=new Map();
  const pick=(cards,limit)=>{for(const c of cards){
   while(deck.length<limit&&(count.get(c.id)||0)<3){deck.push(c.id);count.set(c.id,(count.get(c.id)||0)+1);}
   if(deck.length>=limit)break;
  }};
  pick(stage===2?lv1:[...lv1].reverse(),design.lv1);
  pick(hunters,40);
  if(deck.length<40)pick(lv1,40);
  if(deck.length!==40)throw Error('Fanatiker-Deck unvollständig: Kapitel '+stage);
  return deck;
 }
 function fusions(stage){
  const normal=RPG_FUSIONS.filter(c=>c.rpg&&!c.ace&&!c.lv1Exclusive&&!c.retired&&!c.enemyOnly)
   .sort((a,b)=>a.level-b.level||a.atk+a.def-b.atk-b.def);
  return normal.slice(0,15).map(c=>c.id);
 }
 function loanFusion(stage){
  const allowed=RPG_FUSIONS.filter(c=>c.rpg&&!c.retired&&!c.ace&&!c.enemyOnly&&
    (stage>=4||!c.lv1Exclusive));
  const picks=allowed.sort((a,b)=>a.level-b.level||a.id-b.id).slice(0,12).map(c=>c.id);
  if(stage>=4)picks.push(SW.ids.hive,SW.ids.protector,SW.ids.attacker);
  while(picks.length<15)picks.push(picks[picks.length%Math.max(1,picks.length)]);
  return picks.slice(0,15);
 }
 createGame=function(options={}){
  if(!stageWanted)return oldCreate(options);
  const stage=stageWanted,design=DECK_PROFILES[stage];
  const enemy={deck:fanaticDeck(stage),fusionDeck:fusions(stage),enhancements:{},
    power:design.power,flatBonus:0};
  const playerDeck=stage===1?options.deck:forty(1);
  const g=oldCreate({...options,mode:'pve',opponentId:1,context:'challenge',challenge:null,
   enemy,deck:playerDeck,fusionDeck:stage>=4?loanFusion(stage):options.fusionDeck,
   enhancements:stage===1?options.enhancements:{},flatBonus:stage===1?options.flatBonus:0});
  g.lv1Saga={stage};g.lv1SagaProgress={floating:0,swarm:0,special:0};g.lv1FanaticDeckName=design.name;
  g.maxLP=design.lp;g.players.forEach(p=>{p.lp=g.maxLP;p.shield=0;});
  if(stage===1)for(const c of g.players[1].hand)if(c.card){
   c.card.atk=Math.max(0,c.card.atk-30);c.card.def=Math.max(1,c.card.def-30);
  }
  // A special story signature is guaranteed in hand, but NOT part of the 40-card deck.
  const foe=g.players[1],returned=foe.hand.pop();
  if(returned)foe.deck.push(returned.id);
  const ace=newInstance(g,SW.ids.ace,1);
  ace.lv1FanaticSealed=true;foe.hand.unshift(ace);
  g.lv1FanaticAce={uid:ace.uid,dialogPending:false,dialogShown:false,played:false};
  logEvent(g,'Der Forscher beginnt mit seiner Lumira auf der Hand. Ihr Erwachen bleibt ihm verwehrt.');
  return g;
 };
 const oldFuse=fusedInstance;
 fusedInstance=function(g,materials,levels){
  const result=oldFuse(g,materials,levels);
  if(result&&g?.lv1Saga?.stage===1&&g.active===1&&result.card){
   result.card.atk=Math.max(0,result.card.atk-50);
   result.card.def=Math.max(1,result.card.def-50);
   if(result.rollMath){result.rollMath.penalty+=50;result.rollMath.final.atk=result.card.atk;result.rollMath.final.def=result.card.def;}
  }
  return result;
 };
 const oldInstance=newInstance;
 newInstance=function(g,id,owner=g.active){
  const c=oldInstance(g,id,owner);
  if(g?.lv1Saga?.stage===1&&owner===1&&c.card){
   c.card.atk=Math.max(0,c.card.atk-30);c.card.def=Math.max(1,c.card.def-30);
  }
  return c;
 };
 const oldStart=startDuel;
 startDuel=function(mode,id=0,context='free',difficulty='easy',challenge=null){
  if(context!=='lv1-saga')return oldStart(mode,id,context,difficulty,challenge);
  const stage=Number(challenge)||1,s=state();
  if(mode!=='pve'||stage<1||stage>5||stage>s.stage+1||!s.offered){toast('Dieser Forschungsabschnitt ist noch nicht freigeschaltet.');return;}
  stageWanted=stage;
  try{
   const originalUnlock=opponentUnlocked;opponentUnlocked=function(i){return i===1||originalUnlock(i);};
   let value;try{value=oldStart('pve',1,'challenge','easy',null);}finally{opponentUnlocked=originalUnlock;}
   if(game?.lv1Saga?.stage===stage&&uiMode==='duel'){
    const oldGo=$('modalGo')?.onclick;
    openModal(modalHtml('VERBOTENE FORSCHUNG · '+stage+'/5',STORIES[stage-1].title,'✦',
     STORIES[stage-1].dialog,
     '<p class="lv1-intro-note">Geliehene Karten für Stufe II–V · Der Forscher verändert mit jeder Niederlage sein Deck.</p>'+
     '<p>Duell-LP: '+game.maxLP.toLocaleString('de-AT')+'</p><p class="lv1-objective"><b>✦ Prüfungsziel:</b> '+escapeHtml(OBJECTIVES[stage-1].description)+'</p>',
     '<button class="btn primary" id="modalGo">DUELL STARTEN</button>'));
    $('modalGo').onclick=oldGo;
   }
   return value;
  }finally{stageWanted=0;}
 };
 function ritual(g){
  return '<section class="lv1-ritual" id="lv1Ritual"><div class="lv1-ritual-runes" aria-hidden="true">✧ ✦ ◇ ✧ ✴</div>'+
   '<div id="lv1RitualScene" class="lv1-ritual-scene"></div><div id="lv1RitualProgress" class="lv1-ritual-progress"></div>'+
   '<div class="lv1-ritual-buttons"><button class="btn primary" id="lv1RitualNext">NÄCHSTE PHASE</button>'+
   '<button class="btn" id="lv1RitualSkip">EVENT ABSCHLIESSEN</button></div></section>';
 }
 function playRitual(g){
  const scene=$('lv1RitualScene');if(!scene)return;
  const arts=[SW.ids.attacker,SW.ids.hive,SW.ids.protector,SW.ids.ace].map(id=>CARDS[id]);
  const moments=[
   ['DER ZUSAMMENBRUCH','Die letzte Predator-Fusion zerbricht. Die Arena fällt in Stille.',arts[0]],
   ['DER RUF DER GEISTER','Die kleinen Kreaturen vereinen sich. Nicht der Größte, sondern der Auserwählte hat ihre Stimmen gehört.',arts[1]],
   ['DAS VERGESSENE SIEGEL','Fünf Fragmente verschmelzen zu einem uralten Siegel. PERK: ERWACHEN DES SCHWARMS.',arts[2]],
   ['DAS VERMÄCHTNIS','Der Fanatiker überlässt dir Lumira – den ersten Funken. Seine Forschung endet nicht, aber sein Weg als Duellant.',arts[3]],
   ['DIE GABE DES SCHWARMS','Die einzigartige ACE-Karte und die gewonnenen Booster sind deiner Sammlung bereits gutgeschrieben.',arts[3]]
  ];
  let phase=0;
  const esc=escapeHtml;
  function draw(){
   const [name,body,art]=moments[phase];
   scene.innerHTML='<div class="lv1-ritual-burst" aria-hidden="true">✧ ✦ ✧ ✦ ◇ ✧</div>'+
    '<img class="lv1-ritual-card-art" src="'+esc(art.art)+'" alt="'+esc(art.name)+'">'+
    '<div class="lv1-ritual-narration"><small>KAPITEL '+(phase+1)+'/5</small><h2>'+esc(name)+'</h2><p>'+esc(body)+'</p></div>'+
    (phase===4?'<div class="lv1-ritual-packs">'+Array.from({length:10},(_,i)=>'<span class="'+(i<(g.lv1BonusPacks?.length||0)?'earned':'empty')+'">'+(i<(g.lv1BonusPacks?.length||0)?'✦ 3 KARTEN':'◇')+'</span>').join('')+'</div>':'');
   const bar=$('lv1RitualProgress');if(bar)bar.textContent='✦ '.repeat(phase+1)+'◇ '.repeat(4-phase);
   const button=$('lv1RitualNext');if(button)button.textContent=phase===4?'VERMÄCHTNIS ANSEHEN':'NÄCHSTE PHASE';
   scene.classList.remove('lv1-ritual-animate');void scene.offsetWidth;scene.classList.add('lv1-ritual-animate');
  }
  draw();
  const next=$('lv1RitualNext');if(next)next.onclick=()=>{if(phase<4){phase++;draw();}else{$('lv1Ritual')?.classList.add('lv1-ritual-done');next.disabled=true;}};
  const skip=$('lv1RitualSkip');if(skip)skip.onclick=()=>{phase=4;draw();if(next)next.textContent='EVENT ABSCHLIESSEN';};
 }
 const oldShow=showFinished;
 showFinished=function(){
  const g=game,show=g?.lv1Saga&&g.winner!==null&&!g.finishShown;
  const wasOffered=state().offered;
  const stage=g?.lv1Saga?.stage,previous=state().stage;
  oldShow();
  if(!show&&!wasOffered&&state().offered&&$('modal')){
   $('modal').insertAdjacentHTML('beforeend','<section class="lv1-story-result"><h3>✦ SELTSAME BEGEGNUNG</h3><p>Ein exzentrischer Duellant, besessen von Level-1-Kreaturen, wartet auf dich. Eine neue Forschungsreihe ist verfügbar.</p><button class="btn primary" id="lv1VisitFanatic">Den Forscher besuchen</button></section>');
   if($('lv1VisitFanatic'))$('lv1VisitFanatic').onclick=()=>{returnToMenu();window.ArcaneRoyalUI?.navigate?.('challenges');};
  }
  if(!show||!$('modal'))return;
  const success=g.winner===0&&!g.surrendered&&mastered(g)&&state().stage===stage;
  const after=STORIES[stage-1].after;
  const failedGoal=g.winner===0&&!mastered(g);
  const scene='<section class="lv1-story-result"><h3>✦ '+escapeHtml(STORIES[stage-1].title)+'</h3>'+
    '<p class="lv1-dialogue">„'+escapeHtml(success?after:failedGoal?'Ein Sieg allein genügt nicht. Du hast die besondere Forschungstechnik noch nicht angewendet.':'Du bist noch nicht bereit. Kehre zurück, wenn du die Geister verstehst.')+'“</p>'+
    (failedGoal?'<p class="lv1-objective"><b>Noch offen:</b> '+escapeHtml(OBJECTIVES[stage-1].description)+'</p>':'')+(success?'<p>Fragment '+stage+' von 5 entdeckt. '+(stage===5?'Das Vermächtnis ist erwacht.':'Nächste Forschung freigeschaltet.')+'</p>':'<p>Diese Stufe kann erneut versucht werden.</p>')+
    (stage===5&&success?ritual(g)+'<div class="lv1-unlock"><h3>✦ DAS ERWACHEN DES SCHWARMS ✦</h3><p>Schwarmperk dauerhaft freigeschaltet · ACE: Lumira erhalten</p>'+
      '<div class="lv1-booster-reveal">'+(g.lv1BonusPacks||[]).map((p,i)=>'<span>✧ Pack '+(i+1)+' · 3 Karten</span>').join('')+'</div>'+
      '<p>10 unabhängige Boosterwürfe à 50 %, 3 Level-1-Karten je gewonnenem Pack.</p></div>':'')+'</section>';
  $('modal').insertAdjacentHTML('beforeend',scene);
  if(stage===5&&success)playRitual(g);
  if($('modalAgain'))$('modalAgain').onclick=()=>{hideModal();game=null;startDuel('pve',1,'lv1-saga','easy',stage);};
 };
 const oldRenderMenu=renderMenu;
 function panel(){
  const s=state();if(!s.offered&&!forced())return '';
  if(!s.offered&&forced()){s.offered=true;saveProfile();}
  const next=Math.min(5,s.stage+1),esc=escapeHtml;
  return '<section class="menu-panel lv1-saga-panel" id="lv1Saga"><div class="lv1-saga-kicker">✦ VERBOTENE FORSCHUNG · '+s.stage+'/5</div>'+
   '<h2>Die vergessenen Funken</h2><p>Ein exzentrischer Level-1-Sammler glaubt, das Geheimnis der schwächsten Kreaturen entdeckt zu haben. Begegne ihm fünfmal und lüfte die Wahrheit hinter Floating, Swarm und Spezialfusionen.</p>'+
   '<div class="lv1-saga-road">'+STORIES.map((ch,i)=>'<button class="lv1-stage '+(i<s.stage?'done':i===s.stage?'next':'locked')+'" data-lv1-stage="'+(i+1)+'" '+(i>s.stage?'disabled':'')+'><span>'+(i<s.stage?'✓':i+1)+'</span><strong>'+esc(ch.title)+'</strong><small>'+(i<s.stage?'Geschichte entdeckt':i===s.stage?'Bereit zur Prüfung':'Noch gesperrt')+'</small></button>').join('')+'</div>'+
   (s.perk?'<div class="lv1-perk-label">✦ Perk: Erwachen des Schwarms aktiv · Urfunke gehört dir</div>':'<div class="lv1-perk-label">Finale: einzigartiges ACE + 10 × 50%-Chance auf Lv1-Dreierpacks</div>')+
   '<p class="lv1-saga-mini">Gesammelte Lv1-Kartenarten: '+fraction().n+' / '+fraction().total+'</p></section>';
 }
 renderMenu=function(){
  oldRenderMenu();
  if(uiMode!=='menu'||menuTab!=='challenges')return;
  const host=$('menuContent');if(host&&!host.querySelector('#lv1Saga'))host.insertAdjacentHTML('afterbegin',panel());
 };
 $('menuContent')?.addEventListener('click',e=>{
  const b=e.target.closest('[data-lv1-stage]');if(!b)return;
  const stage=Number(b.dataset.lv1Stage);startDuel('pve',1,'lv1-saga','easy',stage);
 });
 window.ArcaneLv1Saga=Object.freeze({version:'4.4.0',stories:STORIES,objectives:OBJECTIVES,mastered,state,maybeOffer,fraction,forced,forty,loanFusion});
 if(uiMode==='menu')renderMenu();
})();