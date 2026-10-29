(function arcaneLv1Saga(){
 'use strict';
 const SW=window.ArcaneLv1Swarm;
 // Exclusive chapter-V antagonist. No overpowered passive abilities: the shock is visual and narrative.
 const CORRUPTED_ID=CARDS.length;
 const CORRUPTED_CARD={id:CORRUPTED_ID,name:'Lumiras Fall · Die verderbte Flamme',
  level:5,atk:920,def:220,kind:'spirit',element:'DUNKEL',role:'predator',
  color:'#ef4979',source:-1,rpg:true,fusionOnly:true,enemyOnly:true,milestoneOnly:true,
  rarity:'legendary',lv1FanaticCorrupt:true,
  art:'assets/custom-art/lv1-lumira-fall.webp',
  customArt:'assets/custom-art/lv1-lumira-fall.webp',
  desc:'Die verzweifelte, verdorbene Level-5-Predator-Fusion aus Lumiras Licht. Keine zusätzliche Kampffähigkeit; ihr Schrecken liegt in der Verwandlung und ihrem rohen Angriff.'};
 CARDS.push(CORRUPTED_CARD);
 RPG_FUSIONS.push(CORRUPTED_CARD);
 const STORIES=[
  {title:'Der hoffnungslose Forscher',dialog:'Du denkst wahrscheinlich, du bist stark, was? Mit deinen riesigen Monstern und lächerlichen Fusionen! Aber meine kleinen Freunde verbergen ein GEHEIMNIS! Komm schon! Ich zeige dir, wozu sie fähig sind!',after:'Schon wieder verloren ... Warum existieren diese winzigen Kreaturen überhaupt? Hör zu: In alten Aufzeichnungen ist von einem Schweben zwischen Welten die Rede. Hilfst du mir bei meiner Forschung?'},
  {title:'Die erste Regung',dialog:'Siehst du? Diese kleinen Wesen verschwinden nicht einfach! Ich habe es immer gesagt! Heute finden wir heraus, wie ihr Echo wirklich funktioniert!',after:'Wie hast DU das gemacht? Ich habe es doch entdeckt! Nun gut ... in der nächsten Schriftrolle wird von ganzen Schwärmen gesprochen.'},
  {title:'Die Stimme des Schwarms',dialog:'Ich habe ein paar stärkere Kreaturen mitgebracht. Nur zu Vergleichszwecken! Ich bin immer noch der größte Freund der kleinen Geister. Wirklich!',after:'Warum gehorchen sie ausgerechnet dir?! Ich habe ihnen ALLES gegeben. Vielleicht haben die anderen recht und diese winzigen Dinger sind wertlos.'},
  {title:'Die verworfene Lehre',dialog:'Genug mit deinem ewigen Geisterspiel! Ich habe Predatoren gezüchtet. Ein echter Duellant setzt auf Stärke – nicht auf kleine, zitternde Funken!',after:'Du wagst es, mich mit MEINER EIGENEN FORSCHUNG zu schlagen?! Ein letztes Duell. Dann wird endgültig klar, wer hier der Meister ist.'},
  {title:'Der letzte Funke',dialog:'ICH HABE JAHRE AN DIESE NUTZLOSEN KREATUREN VERSCHWENDET! Du hast meine Forschung gestohlen! Jetzt werde ich dir zeigen, was WAHRE MACHT bedeutet!',after:'Vielleicht war ich niemals derjenige, auf den sie gewartet haben. Nimm diese Karte. Ich werde nicht mehr duellieren. Aber meine Forschung ... die gebe ich nicht auf.'}
 ];
 const clean=x=>({offered:x?.offered===true,met:x?.met===true||x?.stage>=1,stage:Number.isInteger(x?.stage)?Math.min(5,Math.max(0,x.stage)):0,
  perk:x?.perk===true,aceGranted:x?.aceGranted===true,finalRewards:x?.finalRewards===true,invitationSeen:x?.invitationSeen===true,
  lumiraDeaths:Number.isInteger(x?.lumiraDeaths)?Math.min(99,Math.max(0,x.lumiraDeaths)):0,
  skillRank:x?.perk===true?Math.max(1,Math.min(5,Number.isInteger(x?.skillRank)?x.skillRank:1)):0,
  story:Array.isArray(x?.story)?[...new Set(x.story.filter(n=>Number.isInteger(n)&&n>=1&&n<=5))]:[]});
 const saved=(()=>{try{return window.__arcaneLv1SavedProfile?.lv1Saga||window.__arcaneLv1OriginalSaga||JSON.parse(localStorage.getItem(SAVE_KEY)||'null')?.lv1Saga||null;}catch{return null;}})();
 const oldFresh=freshProfile,oldValidate=validateProfile;
 freshProfile=function(){const p=oldFresh();p.lv1Saga=clean();return p;};
 validateProfile=function(raw){const p=oldValidate(raw);p.lv1Saga=clean(raw?.lv1Saga);return p;};
 // Reconcile historical pre-validation snapshots with the latest persisted
 // and in-memory quest progress. A stale pre-validation snapshot must NEVER
 // roll back a legitimately completed chapter after reloading the page.
 const persistedSaga=(()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')?.lv1Saga||null;}catch{return null;}})();
 const mergeProgress=(...versions)=>{
  const items=versions.filter(Boolean).map(clean);
  const result=clean(items.sort((a,b)=>b.stage-a.stage)[0]);
  for(const version of items){
   result.stage=Math.max(result.stage,version.stage);
   result.met||=version.met;result.offered||=version.offered;
   result.perk||=version.perk;result.aceGranted||=version.aceGranted;
   result.finalRewards||=version.finalRewards;
   result.invitationSeen||=version.invitationSeen;
   result.lumiraDeaths=Math.max(result.lumiraDeaths,version.lumiraDeaths);
   result.skillRank=Math.max(result.skillRank,version.skillRank||0);
   result.story=[...new Set([...result.story,...version.story])].sort((a,b)=>a-b);
  }
  if(result.stage>0){result.met=true;result.offered=true;}
  if(result.perk)result.skillRank=Math.max(1,result.skillRank);
  return result;
 };
 profile.lv1Saga=mergeProgress(profile.lv1Saga,saved,persistedSaga);
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
  {name:'Der unruhige Sammler',cap:2,lv1:32,power:.49,lp:2000},
  {name:'Der neidische Jäger',cap:4,lv1:14,power:.77,lp:4000},
  {name:'Die verworfene Lehre',cap:5,lv1:5,power:.73,lp:4000},
  {name:'Das letzte Aufbäumen',cap:7,lv1:0,power:.93,lp:8000}
 ];
 const OBJECTIVES=[
  {name:'Einführung',description:'Besiege den Level-1-Fanatiker im 2.000-LP-Duell.',goal:null},
  {name:'Floating',description:'Entdecke den Floating-Effekt, wenn ein Level-1-Monster das Feld verlässt. Ein Sieg schließt die Einführung in diese Mechanik ab.',goal:'floating'},
  {name:'Swarm',description:'Beschwöre ein echtes Level-1-Monster und löse eine Schwarmkopie aus.',goal:'swarm'},
  {name:'Fusion',description:'Erschaffe mindestens eine der drei exklusiven Level-1-Fusionen.',goal:'special'},
  {name:'Die letzte Prüfung',description:'Kombiniere Floating, Swarm und eine Spezialfusion im selben Duell.',goal:'all'}
 ];
 function mastered(g){const st=g?.lv1Saga?.stage||0,p=g?.lv1SagaProgress||{},goal=OBJECTIVES[st-1]?.goal;
  // Chapter II was a hard-lock even after a clear win when a lifecycle
  // callback failed to record Floating. Its demonstration is educational,
  // not a permanent progression blocker; other chapters keep their goals.
  if(st===2&&g?.winner===0&&!g?.surrendered)return true;
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
  if(g.lv1SagaPrologue){
   const win=g.winner===0&&!g.surrendered,s=state();
   g.rewardClaimed=true;
   profile.rewardLedger.push(g.id);profile.rewardLedger=profile.rewardLedger.slice(-512);
   if(win){s.met=true;s.offered=true;profile.wins++;profile.coins=Math.min(1e9,profile.coins+15);profile.xp=Math.min(1e9,profile.xp+10);}
   else profile.losses++;
   profile.history.unshift({opponent:1,win,turns:g.turn,coins:win?15:0,xp:win?10:0,at:Date.now(),context:'free'});
   profile.history=profile.history.slice(0,30);saveProfile();
   return {coins:win?15:0,xp:win?10:0,loot:null,charge:0,lv1Prologue:true,met:win};
  }
  g.rewardClaimed=true;profile.rewardLedger.push(g.id);profile.rewardLedger=profile.rewardLedger.slice(-512);
  const win=g.winner===0&&!g.surrendered,stage=g.lv1Saga.stage,s=state();
  // Count a genuine Floating exit already recorded in the battle event log
  // even when the chapter counter failed to survive its temporary state reset.
  if(win&&stage===2&&!(g.lv1SagaProgress?.floating>0)){
   const exits=(g.lv1State?.events||[]).filter(x=>x.type==='mourning');
   const realExit=exits.some(x=>g.players[0].graveyard.some(c=>
     dataOf(c).name===x.value&&dataOf(c).level===1&&!c.fusion&&!c.lv1Echo&&!c.lv1Ghost));
   if(realExit){g.lv1SagaProgress={...g.lv1SagaProgress,floating:1};
    logEvent(g,'Floating bestätigt: ein echtes Level-1-Monster hat das Feld verlassen.');}
  }
  const first=win&&mastered(g)&&stage===s.stage+1;
  const coins=first?stage===1?10:stage*25:0, xp=first?stage===1?5:10*stage:0;
  if(win)profile.wins++;else profile.losses++;
  if(first){
   s.stage=stage;s.offered=true;if(!s.story.includes(stage))s.story.push(stage);
   profile.coins=Math.min(1e9,profile.coins+coins);profile.xp=Math.min(1e9,profile.xp+xp);
   if(stage===5&&!s.finalRewards){
    s.perk=true;s.skillRank=Math.max(1,s.skillRank||0);s.finalRewards=true;
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
 let stageWanted=0,prologueWanted=false;
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
  const normal=RPG_FUSIONS.filter(c=>c.rpg&&!c.ace&&!c.lv1Exclusive&&!c.retired&&!c.enemyOnly);
  const min=[0,1,1,3,4,5][stage],max=[0,2,3,5,6,8][stage];
  const preferred=normal.filter(c=>c.level>=min&&c.level<=max);
  const byRole=(a,b)=>{
   const ah=a.role==='predator'||a.essenceSchool==='predator'?1:0;
   const bh=b.role==='predator'||b.essenceSchool==='predator'?1:0;
   return stage>=3?bh-ah||b.atk-a.atk||b.level-a.level:
    a.level-b.level||a.atk+a.def-b.atk-b.def;
  };
  const chosen=[...preferred.sort(byRole),...normal.filter(c=>!preferred.includes(c)).sort(byRole)];
  const ids=chosen.slice(0,stage===5?14:15).map(c=>c.id);
  if(stage===5)ids.push(CORRUPTED_ID);
  return ids;
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
  g.lv1Saga={stage};g.lv1SagaPrologue=prologueWanted;g.lv1SagaProgress={floating:0,swarm:0,special:0};g.lv1FanaticDeckName=design.name;
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
 const oldAiChoice=chooseAiAction;
 chooseAiAction=function(g,policy='balanced'){
  if(g?.lv1Saga&&g.mode==='pve'&&g.active===1&&!g.pending&&g.winner===null){
   const s=g.lv1FanaticAce,p=g.players[1];
   const ace=p.hand.find(c=>c.uid===s?.uid&&c.id===SW.ids.ace);
   // Forced summoning is the FIRST legal action, even if this is strategically poor.
   if(ace&&!g.summoned&&p.field.some(c=>!c))return {type:'normal',uid:ace.uid};
   if(g.lv1Saga.stage===5&&s?.played&&!g.lv1FanaticCorruptPending&&!g.lv1FanaticCorruptPlayed&&!g.summoned&&p.field.some(c=>!c)){
    const materials=p.hand.filter(c=>!c.fate&&c.id!==SW.ids.ace).slice(0,5);
    for(let n=5;n>=3;n--){
     const m=materials.slice(0,n);
     if(m.length===n&&p.remainingFusion.includes(CORRUPTED_ID)&&
        fusionOptions(g,m.map(c=>dataOf(c).level),m).some(c=>c.id===CORRUPTED_ID)){
       g.lv1FanaticCorruptIntent=true;
       return {type:'fusion',uids:m.map(c=>c.uid)};
     }
    }
   }
   return oldAiChoice(g,g.lv1Saga.stage>=3?'offensive':'economy');
  }
  return oldAiChoice(g,policy);
 };
 const oldPrepareHandFusion=prepareHandFusion;
 prepareHandFusion=function(g,uids,choice){
  const boss=!!(g?.lv1Saga?.stage===5&&g.active===1&&g.lv1FanaticCorruptIntent&&choice===undefined);
  if(boss)choice=CORRUPTED_ID;
  try{
   const result=oldPrepareHandFusion(g,uids,choice);
   if(boss&&result)g.lv1FanaticCorruptPending=true;
   return result;
  }finally{if(g)g.lv1FanaticCorruptIntent=false;}
 };
 const oldPlace=placePending;
 placePending=function(g,idx,choice){
  const uid=g?.pending?.card?.uid;
  const result=oldPlace(g,idx,choice);
  if(result&&g?.lv1Saga&&g.active===1){
   if(uid===g.lv1FanaticAce?.uid&&result.card?.id===SW.ids.ace){
    g.lv1FanaticAce.played=true;
    if(!g.lv1FanaticAce.dialogShown)g.lv1FanaticAce.dialogPending=true;
    logEvent(g,'Der Fanatiker ruft Lumira! Ihre Macht bleibt ohne den Erwachensperk versiegelt.');
   }
   if(result.card?.id===CORRUPTED_ID){
    g.lv1FanaticCorruptPlayed=true;
    g.lv1FanaticCorruptPending=false;
    g.lv1FanaticCorruptDialoguePending=true;
    logEvent(g,'LUMIRAS FALL! Der Fanatiker enthüllt seine verderbte Level-5-Predator-Fusion.');
   }
  }
  return result;
 };
 function showFanaticDialogue(g,kind){
  const stage=g.lv1Saga?.stage;
  if(!stage)return Promise.resolve();
  const ace=kind==='ace',data=ACE_SCENES[stage-1],art=ace?CARDS[SW.ids.ace]:CORRUPTED_CARD;
  const title=ace?'✦ LUMIRA · DER ERSTE FUNKE ✦':'✦ LUMIRAS FALL · DIE VERDERBTE FLAMME ✦';
  const speech=ace?data.text:'SIEH HIN! Ich habe Lumira nicht länger gebraucht! Ihr reines Licht war eine Lüge. Also habe ich daraus etwas erschaffen, das GEHORCHT – meinen eigenen Predator!';
  const note=ace?data.response:'Das Licht einer einst geliebten Karte zerreißt. Keine göttlichen Fähigkeiten – nur rohe Kraft und ein gebrochener Traum.';
  return new Promise(resolve=>{
   openModal(modalHtml(title,ace?'Hoffnung · '+data.mood:'Der endgültige Verrat',ace?'✧':'☄',
    speech,'<div class="lv1-ace-appearance '+(ace?'hope':'corrupt')+'"><img src="'+escapeHtml(art.art)+'" alt="'+escapeHtml(art.name)+'"><p>'+escapeHtml(note)+'</p></div>',
    '<button class="btn primary" id="lv1FanaticContinue">WEITERDUELLIEREN</button>'));
   const button=$('lv1FanaticContinue');
   if(button)button.onclick=()=>{hideModal();resolve();};
   else{hideModal();resolve();}
  });
 }
 async function flushFanaticDialogue(g){
   if(!g?.lv1Saga)return;
   if(g.lv1FanaticDeathDialoguePending){
    const speech=g.lv1FanaticDeathDialoguePending;g.lv1FanaticDeathDialoguePending=null;
    await new Promise(resolve=>{
     openModal(modalHtml('✦ LUMIRA IST GEFALLEN ✦','Der Forscher gerät ins Wanken','✧',
      '„'+escapeHtml(speech)+'“','<p>Mit jeder verlorenen Hoffnung verändert sich der Ton des Forschers.</p>',
      '<button class="btn primary" id="lv1DeathContinue">WEITERDUELLIEREN</button>'));
     const button=$('lv1DeathContinue');
     if(button)button.onclick=()=>{hideModal();resolve();};else{hideModal();resolve();}
    });
   }
  if(g.lv1FanaticAce?.dialogPending&&!g.lv1FanaticAce.dialogShown){
   g.lv1FanaticAce.dialogPending=false;
   g.lv1FanaticAce.dialogShown=true;
   await showFanaticDialogue(g,'ace');
  }
  if(g.lv1FanaticCorruptDialoguePending){
   g.lv1FanaticCorruptDialoguePending=false;
   await showFanaticDialogue(g,'corrupt');
  }
 }
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
  const intro=challenge==='prologue',stage=intro?1:Number(challenge)||1,s=state();
  if(mode!=='pve'||stage<1||stage>5||stage>s.stage+1||!s.offered||
    (intro&&s.met)||(!intro&&!s.met)){toast('Dieser Forschungsabschnitt ist noch nicht freigeschaltet.');return;}
  // The generic saved-duel discard handler restarts context='challenge' and
  // forgets the chosen Lv1 research stage. Keep the quest route on discard.
  if(profile.activeDuel&&!busy&&!aiRunning&&!storageConflict&&!profile.rewardQueue.length){
   openModal(modalHtml('GESPEICHERTES DUELL','Partie fortsetzen?','↶',
    'Du hast eine gespeicherte Einzelspielerpartie. Du kannst sie fortsetzen oder für die gewählte Forschungsprüfung verwerfen.','',
    '<button class="btn primary" id="resumeSaved">FORTSETZEN</button><button class="btn" id="discardSaved">VERWERFEN & FORSCHUNG STARTEN</button>'));
   $('resumeSaved').onclick=resumeDuel;
   $('discardSaved').onclick=()=>{profile.activeDuel=null;saveProfile();hideModal();
    startDuel('pve',1,'lv1-saga','easy',intro?'prologue':stage);};
   return;
  }
  stageWanted=stage;prologueWanted=intro;
  try{
   const originalUnlock=opponentUnlocked;opponentUnlocked=function(i){return i===1||originalUnlock(i);};
   let value;try{value=oldStart('pve',1,'challenge','easy',null);}finally{opponentUnlocked=originalUnlock;}
   if(game?.lv1Saga?.stage===stage&&uiMode==='duel'){
    const oldGo=$('modalGo')?.onclick;
    openModal(modalHtml(intro?'✦ UNBEKANNTE BEGEGNUNG':'VERBOTENE FORSCHUNG · '+stage+'/5',intro?'Der rätselhafte Duellant':STORIES[stage-1].title,'✦',
     stage===1?'Ein unbekannter Duellant tritt dir entgegen. Noch weißt du nichts von seiner Forschung. Beweise ihm in einem normalen Duell dein Können.':STORIES[stage-1].dialog,
     (stage===1?'<p>✧ Kein Forschungsziel – euer erstes Duell beginnt.</p>':
      '<p class="lv1-intro-note"><b>Dein Leihdeck:</b> Jede Forschungsprüfung stellt dir ein passendes Herausforderungsdeck bereit. Dein eigenes Deck bleibt erhalten.</p>'+
      '<p class="lv1-intro-note"><b>Temporäre Forschung:</b> '+(stage===2?'Floating ist für diesen Versuch aktiviert.':stage===3?'Floating und Swarm sind für diesen Versuch aktiviert.':'Floating, Swarm und die exklusiven Lv1-Fusionen sind für diesen Versuch aktiviert.')+' Nach dem Finale verwaltet der dauerhafte Skill „Verbotene Forschung“ alle Fähigkeiten.</p>'+
      '<p><b>Hinweis:</b> '+(stage===2?'Wenn ein echtes Level-1-Monster das Feld verlässt, kann sein Echo fortbestehen. Beobachte die Wechselwirkungen.':stage===3?'Kleine Kreaturen können weitere Funken herbeirufen. Nutze freie Plätze und das neue Echo.':stage===4?'Finde heraus, was geschieht, wenn schwache Geister ihre Kräfte in einer ungewöhnlichen Fusion verbinden.':'Nun greifen die Entdeckungen ineinander. Zeige, dass du sie im selben Duell beherrschst.')+'</p>')+
     '<p><b>Gegnerstrategie:</b> '+escapeHtml(game.lv1FanaticDeckName)+' · '+game.maxLP.toLocaleString('de-AT')+' LP</p>'+
     (stage===1?'':'<p class="lv1-objective"><b>Für das nächste Kapitel:</b> '+escapeHtml(OBJECTIVES[stage-1].description)+'</p>'),
     '<button class="btn primary" id="modalGo">DUELL STARTEN</button>'));
    $('modalGo').onclick=oldGo;
   }
   return value;
  }finally{stageWanted=0;prologueWanted=false;}
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
   ['DAS VERGESSENE SIEGEL','Fünf Fragmente verschmelzen zu einem uralten Siegel. SKILL: VERBOTENE FORSCHUNG – Floating, Swarm und Spezialfusionen werden dauerhaft verfügbar.',arts[2]],
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
  if(g.lv1SagaPrologue){
   const won=g.winner===0&&!g.surrendered;
   $('modal').insertAdjacentHTML('beforeend','<section class="lv1-story-result"><h3>✦ '+(won?'DER FORSCHER HAT DICH BEMERKT':'DER FREMDE WARTET')+'</h3><p>'+
    (won?'Du hast den unbekannten Duellanten besiegt. Nun offenbart er dir, weshalb er den schwächsten Monstern nachjagt: Die Forschungsreihe „Die vergessenen Funken“ beginnt.':'Der Fremde will ein Wiedersehen. Die verborgene Forschungsreihe bleibt vorerst verschlossen.')+'</p></section>');
   if($('modalAgain')){
    $('modalAgain').textContent=won?'ZUR FORSCHUNGSREIHE →':'ERNEUT HERAUSFORDERN';
    $('modalAgain').onclick=()=>{hideModal();game=null;
     if(won){menuTab='challenges';uiMode='menu';renderMenu();}
     else startDuel('pve',1,'lv1-saga','easy','prologue');
    };
   }
   return;
  }
  const success=g.winner===0&&!g.surrendered&&mastered(g)&&state().stage===stage;
  const after=STORIES[stage-1].after;
  const failedGoal=g.winner===0&&!mastered(g);
  const scene='<section class="lv1-story-result"><h3>✦ '+escapeHtml(STORIES[stage-1].title)+'</h3>'+
    '<p class="lv1-dialogue">„'+escapeHtml(success?after:failedGoal?'Ein Sieg allein genügt nicht. Du hast die besondere Forschungstechnik noch nicht angewendet.':'Du bist noch nicht bereit. Kehre zurück, wenn du die Geister verstehst.')+'“</p>'+
    (failedGoal?'<p class="lv1-objective"><b>Noch offen:</b> '+escapeHtml(OBJECTIVES[stage-1].description)+'</p>':'')+(success?'<p>Fragment '+stage+' von 5 entdeckt. '+(stage===5?'Das Vermächtnis ist erwacht.':'Nächste Forschung freigeschaltet.')+'</p>':'<p>Diese Stufe kann erneut versucht werden.</p>')+
    (stage===5&&success?ritual(g)+'<div class="lv1-unlock"><h3>✦ VERBOTENE FORSCHUNG ✦</h3><p>Floating, Swarm und Lv1-Spezialfusionen dauerhaft freigeschaltet · Passiver Rang 1: +5 ATK/DEF auf gewöhnliche Lv1-Monster · Lumira als ACE erhalten</p>'+
      '<div class="lv1-booster-reveal">'+(g.lv1BonusPacks||[]).map((p,i)=>'<span>✧ Pack '+(i+1)+' · 3 Karten</span>').join('')+'</div>'+
      '<p>10 unabhängige Boosterwürfe à 50 %, 3 Level-1-Karten je gewonnenem Pack.</p></div>':'')+'</section>';
  $('modal').insertAdjacentHTML('beforeend',scene);
  if(stage===5&&success)playRitual(g);
  if($('modalAgain')){
   const next=success&&stage<5?stage+1:stage;
   $('modalAgain').textContent=success&&stage<5?'NÄCHSTE PRÜFUNG →':'PRÜFUNG WIEDERHOLEN';
   $('modalAgain').onclick=()=>{hideModal();game=null;startDuel('pve',1,'lv1-saga','easy',next);};
  }
  if(failedGoal){
   const progress=g.lv1SagaProgress||{};
   const tip=stage===2?'Mindestens ein echtes Level-1-Monster muss das Feld verlassen; nur ein Sieg genügt nicht. Floating-Ereignisse: '+(progress.floating||0)+'.':
    stage===3?'Beschwöre ein echtes Lv1-Monster, damit ein Echo entsteht. Registriert: '+(progress.swarm||0)+'.':
    stage===4?'Schaffe eine der exklusiven Lv1-Fusionen. Registriert: '+(progress.special||0)+'.':
    'Erfülle die Kapitelziele innerhalb desselben Duells.';
   $('modal')?.insertAdjacentHTML('beforeend','<p class="lv1-objective"><b>Wieso geht es noch nicht weiter?</b> '+escapeHtml(tip)+'</p>');
  }
  if(g.lv1FanaticDeathDialoguePending){$('modal')?.insertAdjacentHTML('beforeend','<p class="lv1-dialogue">„'+escapeHtml(g.lv1FanaticDeathDialoguePending)+'“</p>');g.lv1FanaticDeathDialoguePending=null;}
 };
 const oldRenderMenu=renderMenu;
 function panel(){
  const s=state();if(!s.offered&&!forced())return '';
  if(!s.offered&&forced()){s.offered=true;saveProfile();}
  const next=Math.min(5,s.stage+1),esc=escapeHtml;
  return '<section class="menu-panel lv1-saga-panel" id="lv1Saga"><div class="lv1-saga-kicker">'+(s.stage===0&&!s.met?'✦ EIN FREMDER FORDERT DICH HERAUS':'✦ VERBOTENE FORSCHUNG · '+s.stage+'/5')+'</div>'+
   '<h2>'+(s.stage===0&&!s.met?'Der unbekannte Forscher':'Die vergessenen Funken')+'</h2><p>'+(s.stage===0&&!s.met?'Ein ungewöhnlicher Duellant fordert dich heraus. Ihr erstes Duell ist ein ganz normaler Kampf. Sein wahres Anliegen erfährst du erst danach.':'Ein Forscher glaubt, dass die schwächsten Monster ein großes Geheimnis bergen. In fünf Kapiteln erhältst du abgestimmte Herausforderungsdecks und kannst einen einzigartigen, bislang unbekannten Skill entdecken.')+'</p>'+
   (s.stage===0&&!s.met?'<div class="lv1-first-meeting"><p>✦ Ein fremder Duellant fordert dich heraus. Erst nach dieser Begegnung erfährst du, was hinter seinen Experimenten steckt.</p><button type="button" class="btn primary" data-lv1-stage="prologue">DEM FORSCHER BEGEGNEN →</button></div>':'<div class="lv1-saga-road">'+STORIES.map((ch,i)=>'<button class="lv1-stage '+(i<s.stage?'done':i===s.stage?'next':'locked')+'" data-lv1-stage="'+(i+1)+'" '+(i>s.stage?'disabled':'')+'><span>'+(i<s.stage?'✓':i+1)+'</span><strong>'+esc(ch.title)+'</strong><small>'+(i<s.stage?'Geschichte entdeckt':i===s.stage?'Bereit zur Prüfung':'Noch gesperrt')+'</small></button>').join('')+'</div>')+
   (s.perk?'<div class="lv1-perk-label">✦ VERBOTENE FORSCHUNG · Rang '+Math.max(1,s.skillRank||1)+'/5 · Floating, Swarm und Lv1-Spezialfusionen dauerhaft aktiv.</div>'+
    '<p class="lv1-saga-mini">Passiver Forschungsbonus: +'+Math.max(1,s.skillRank||1)*5+' ATK/DEF auf gewöhnliche Lv1-Monster. Lv1-Spezial-ACE Lumira behält ihre festen 111/111 Grundwerte.</p>'+
    (s.skillRank<5?'<button type="button" class="btn primary" data-lv1-skill-upgrade>Forschung verbessern · '+(120+180*Math.max(1,s.skillRank||1))+' Münzen</button>':'<p class="lv1-saga-mini">Maximaler Forschungsrang erreicht.</p>'):
   '<div class="lv1-perk-label">✦ Ein einzigartiger Skill und geheimnisvolle Belohnungen erwarten dich.</div>')+
   (s.stage?'<p class="lv1-saga-mini">Gesammelte Lv1-Kartenarten: '+fraction().n+' / '+fraction().total+'</p>':'')+'</section>';
 }
 renderMenu=function(){
  oldRenderMenu();
  if(uiMode!=='menu')return;
  const host=$('menuContent');if(!host)return;
  if(menuTab==='challenges'){
   if(!host.querySelector('#lv1Saga'))host.insertAdjacentHTML('afterbegin',panel());
  }else if(['tournament','free'].includes(menuTab)){
   // Quest giver stays discoverable from the screens players actually visit.
   const quest=state();
   if((quest.offered||forced())&&quest.stage<5&&!host.querySelector('#lv1QuestTeaser')){
    const section=document.createElement('section');section.id='lv1QuestTeaser';
    section.className='menu-panel lv1-saga-panel';
    section.innerHTML='<h3>✧ Der unbekannte Forscher</h3><p>Ein geheimnisvoller Duellant wartet auf deine Hilfe bei der verbotenen Level-1-Forschung.</p>'+
     '<button type="button" class="btn primary" data-lv1-open>Zur Forschungsreihe</button>';
    const openQuest=section.querySelector?.('[data-lv1-open]');
    if(openQuest)openQuest.onclick=()=>{menuTab='challenges';renderMenu();};
    host.prepend(section);
   }
  }
 };
 $('menuContent')?.addEventListener('click',e=>{
  const upgrade=e.target.closest('[data-lv1-skill-upgrade]');
  if(upgrade){
   const current=state(),rank=current.skillRank||1,cost=120+180*rank;
   if(!current.perk||rank>=5||storageConflict)return;
   if(profile.coins<cost){toast('Für die nächste Forschungsstufe fehlen Münzen.');return;}
   profile.coins-=cost;current.skillRank=rank+1;
   saveProfile();renderMenu();toast('Verbotene Forschung auf Rang '+current.skillRank+' verbessert.');
   return;
  }
  const b=e.target.closest('[data-lv1-stage]');if(!b)return;
  const stage=b.dataset.lv1Stage==='prologue'?'prologue':Number(b.dataset.lv1Stage);startDuel('pve',1,'lv1-saga','easy',stage);
 });
 window.ArcaneLv1Saga=Object.freeze({version:'5.5.1',stories:STORIES,objectives:OBJECTIVES,aceScenes:ACE_SCENES,deckProfiles:DECK_PROFILES,corruptedId:CORRUPTED_ID,fanaticDeck,flushFanaticDialogue,mastered,state,maybeOffer,fraction,forced,forty,loanFusion});
 if(uiMode==='menu')renderMenu();
})();