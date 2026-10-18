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
 const saved=(()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')?.lv1Saga||null;}catch{return null;}})();
 const oldFresh=freshProfile,oldValidate=validateProfile;
 freshProfile=function(){const p=oldFresh();p.lv1Saga=clean();return p;};
 validateProfile=function(raw){const p=oldValidate(raw);p.lv1Saga=clean(raw?.lv1Saga);return p;};
 profile.lv1Saga=clean(saved||profile.lv1Saga);
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
 const oldReward=rewardMatch;
 rewardMatch=function(g){
  if(!g?.lv1Saga){
   const reward=oldReward(g);
   if(reward)maybeOffer(g);
   return reward;
  }
  if(g.rewardClaimed||profile.rewardLedger.includes(g.id))return null;
  g.rewardClaimed=true;profile.rewardLedger.push(g.id);profile.rewardLedger=profile.rewardLedger.slice(-512);
  const win=g.winner===0&&!g.surrendered,stage=g.lv1Saga.stage,s=state(),first=win&&stage===s.stage+1;
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
  profile.history.unshift({opponent:1,win,turns:g.turn,coins,xp,at:Date.now(),context:'challenge'});
  profile.history=profile.history.slice(0,30);
  saveProfile();
  return {coins,xp,loot:null,charge:0,lv1Saga:stage,lv1StageNew:first,lv1Completed:stage===5&&first,
   lv1BonusPacks:g.lv1BonusPacks||[]};
 };
 const oldCreate=createGame;
 let stageWanted=0;
 function forty(levelCap=1,weakest=false,predator=false){
  const pool=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.essenceMonster&&!c.retired&&c.level<=levelCap)
   .sort((a,b)=>predator?(b.role==='predator'?1:0)-(a.role==='predator'?1:0)||b.atk-a.atk:
     weakest?a.atk+a.def-b.atk-b.def:a.level-b.level||a.id-b.id);
  const result=[],count=new Map();
  for(const c of pool){for(let n=0;n<3&&result.length<40;n++){result.push(c.id);count.set(c.id,(count.get(c.id)||0)+1);}if(result.length===40)break;}
  if(result.length<40)throw Error('Zu wenige zulässige Level-1-Karten für die Herausforderung.');
  return result;
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
  const stage=stageWanted,cap=[0,1,1,2,3,4][stage];
  const enemy={deck:forty(cap,stage===1,stage>=3),fusionDeck:fusions(stage),enhancements:{},
    power:[0,.38,.55,.62,.68,.78][stage],flatBonus:0};
  const playerDeck=stage===1?options.deck:forty(1);
  const g=oldCreate({...options,mode:'pve',opponentId:1,context:'challenge',challenge:null,
   enemy,deck:playerDeck,fusionDeck:stage>=4?loanFusion(stage):options.fusionDeck,
   enhancements:stage===1?options.enhancements:{},flatBonus:stage===1?options.flatBonus:0});
  g.lv1Saga={stage};g.maxLP=[0,2000,3000,4000,5000,6500][stage];
  g.players.forEach(p=>{p.lp=g.maxLP;p.shield=0;});
  if(stage===1)for(const c of g.players[1].hand)if(c.card){
   c.card.atk=Math.max(0,c.card.atk-30);c.card.def=Math.max(1,c.card.def-30);
  }
  return g;
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
   const value=oldStart('pve',1,'challenge','easy',null);
   if(game?.lv1Saga?.stage===stage&&uiMode==='duel'){
    const oldGo=$('modalGo')?.onclick;
    openModal(modalHtml('VERBOTENE FORSCHUNG · '+stage+'/5',STORIES[stage-1].title,'✦',
     STORIES[stage-1].dialog,
     '<p class="lv1-intro-note">Geliehene Karten für Stufe II–V · Der Forscher verändert mit jeder Niederlage sein Deck.</p>'+
     '<p>Duell-LP: '+game.maxLP.toLocaleString('de-AT')+'</p>',
     '<button class="btn primary" id="modalGo">DUELL STARTEN</button>'));
    $('modalGo').onclick=oldGo;
   }
   return value;
  }finally{stageWanted=0;}
 };
 const oldShow=showFinished;
 showFinished=function(){
  const g=game,show=g?.lv1Saga&&g.winner!==null&&!g.finishShown;
  const stage=g?.lv1Saga?.stage,previous=state().stage;
  oldShow();
  if(!show||!$('modal'))return;
  const success=g.winner===0&&!g.surrendered&&state().stage===stage;
  const after=STORIES[stage-1].after;
  const scene='<section class="lv1-story-result"><h3>✦ '+escapeHtml(STORIES[stage-1].title)+'</h3>'+
    '<p class="lv1-dialogue">„'+escapeHtml(success?after:'Du bist noch nicht bereit. Kehre zurück, wenn du die Geister verstehst.')+'“</p>'+
    (success?'<p>Fragment '+stage+' von 5 entdeckt. '+(stage===5?'Das Vermächtnis ist erwacht.':'Nächste Forschung freigeschaltet.')+'</p>':'<p>Diese Stufe kann erneut versucht werden.</p>')+
    (stage===5&&success?'<div class="lv1-unlock"><h3>✦ DAS ERWACHEN DES SCHWARMS ✦</h3><p>Schwarmperk dauerhaft freigeschaltet · ACE: Urfunke erhalten</p>'+
      '<div class="lv1-booster-reveal">'+(g.lv1BonusPacks||[]).map((p,i)=>'<span>✧ Pack '+(i+1)+' · 3 Karten</span>').join('')+'</div>'+
      '<p>10 unabhängige Boosterwürfe à 50 %, 3 Level-1-Karten je gewonnenem Pack.</p></div>':'')+'</section>';
  $('modal').insertAdjacentHTML('beforeend',scene);
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
 window.ArcaneLv1Saga=Object.freeze({version:'4.3.0',stories:STORIES,state,maybeOffer,fraction,forced,forty,loanFusion});
 if(uiMode==='menu')renderMenu();
})();