/* Online 2v2 beta: own real singleplayer deck, canonical card art, explicit
 * fusion/attack/position controls, server-owned state and private hands.
 * This intentionally does NOT modify the user's singleplayer save.
 */
'use strict';
(()=>{
 const api='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
 const $=id=>document.getElementById(id),rules=window.ArcaneDuoRules,
  choices=window.ArcaneDuoBattleUI,recovery=window.ArcaneDuoRecovery168,
   economyRules=window.ArcaneDuoEconomy172;
 const key=id=>'arcane-duo-v2-session-'+id;
 const ownOrigin=()=>location.href.split('#')[0].split('?')[0];
 let catalog={},starterMain=[],starterFusions=[],fateIds=[],fateNames=[],profileDeck=[],profileFusions=[],
  profileUpgrades={},profileEnhancements={},profileEssence={},profileLv1={};
 let game=null,seat=-1,roomId='',token='',invite='',busy=false,refreshing=false,
  syncError='',syncedAt=0,sessionReady=true,syncFailures=0,lastPollAt=0;
 let duoProfile=null,duoProfileToken='',duoLastRoom=null,profileSaving=false,duoEconomy=null;
  let nameConfirmed=false,joinIntent=null,invitePreview=null,inviteRequested=false;
 const set=(id,text)=>$(id).textContent=String(text);
 const card=id=>catalog[id]||{name:'Karte '+id,level:'?',atk:'?',def:'?',role:'?'};
 const shownAtk=c=>rules.attackValue?rules.attackValue(c):c.atk;
 const name=id=>card(id).name;
 const fateIndex=id=>fateIds.indexOf(id);
 const displayName=c=>c?.predatorToken?'🐾 Rudelgeist · Lv '+c.level:
  c?.fate?'✦ '+(fateNames[fateIndex(c.id)]||'Schicksalsmonster'):name(c.id);
 const displayArt=c=>c?.fate?(window.ArcaneFateVisuals?.artFor(fateIndex(c.id))||''):
  card(c.id).art;
 const el=(tag,parent,text,cls)=>{
  const n=document.createElement(tag);if(cls)n.className=cls;
  if(text!==undefined)n.textContent=text;
  parent.append(n);return n;
 };
 const button=(text,parent,fn)=>{const b=el('button',parent,text,'primary');b.onclick=fn;b.disabled=busy||!!syncError;return b;};
 const selector=(label,options,parent)=>{
  const line=el('label',parent,undefined,'duo-choice');
  el('span',line,label);
  const input=el('select',line);
  for(const [value,text] of options){const opt=el('option',input,text);opt.value=String(value);}
  return input;
 };
 const section=(parent,title,help)=>{
  const node=el('section',parent,undefined,'duo-action-group');
  el('h3',node,title);if(help)el('p',node,help,'duo-action-help');
  return node;
 };
 const chapter=()=>rules.ENCOUNTERS.find(c=>c.id===Number($('duoChapter').value))||rules.CHAPTERS[0];
 function updateChapter(){
  const entry=$('duoEntry').value;
  if(entry==='chapter'&&Number($('duoChapter').value)>=11)$('duoChapter').value='1';
  if(entry==='quest'&&Number($('duoChapter').value)<11)$('duoChapter').value='11';
  $('duoChapterSelect').hidden=entry==='new';
  $('duoQuestInfo').hidden=entry!=='quest';
  const chosen=entry==='new'?rules.CHAPTERS[0]:chapter();
  const saga=entry==='quest',stage=chosen.id-10;
  $('duoCreate').textContent=entry==='new'?'Neue Kampagne erstellen':
   saga?'Fanatiker-Prüfung '+stage+' starten':'Kapitel '+chosen.id+' starten';
  set('duoChapterInfo',(saga?'Fanatiker-Prüfung '+stage:'Kapitel '+chosen.id)+' · '+chosen.name+
   '. Bis zu drei Leihkarten auf Level '+chosen.level+
   ' verbessern die schwächsten Deckplätze. Stärkere eigene Karten bleiben erhalten.'+
   (saga?' Ziel: '+({win:'Gewinnen',floating:'Floating auslösen',swarm:'Schwarm auslösen',
    special:'Exklusive Level-1-Fusion beschwören',all:'Floating, Schwarm und Spezialfusion kombinieren'}[chosen.goal]||'Prüfung bestehen')+'. '+chosen.dialogue:''));
 }
 function readProfile(snapshot){
  starterMain=[...snapshot.starterMain];starterFusions=[...snapshot.starterFusions];
  profileDeck=[];profileFusions=[];
  profileUpgrades={};profileEnhancements={};profileEssence={};profileLv1={};
  set('duoDeckInfo','Für dieses Abenteuer brauchst du einen eigenen Duellanten. '+
   'Erstelle ihn oben oder öffne dein bestehendes Profil mit deinem persönlichen Zugangslink. '+
   'Dein Einzelspieler-Spielstand bleibt unverändert.');
 }
 async function call(payload){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(api,{method:'POST',cache:'no-store',credentials:'omit',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   const data=await response.json();
   if(!response.ok||data.error)throw Error(data.error||'Serverfehler '+response.status);
   return data;
  }catch(e){
   if(e.name==='AbortError')throw Error('Der Online-Server antwortet nicht.');
   if(e instanceof TypeError)throw Error('Verbindung zum Online-Server fehlgeschlagen.');
   throw e;
  }finally{clearTimeout(timer);}
 }

 const duoProfileKey='arcane-duel-duo-v171-profile-key';
 const perkNames=Object.freeze({
  power:'Monstertraining',jagdinstinkt:'Jagdinstinkt',schildwall:'Schildwall',
  resilience:'Standhaftigkeit',combatDiscipline:'Kampfdisziplin',
  fusionLore:'Fusionskunde',fusionPrecision:'Runenpräzision',
  openingAegis:'Vorhut-Schutz'
 });
 const roleNames=Object.freeze({predator:'Predator',guardian:'Wächter',
  soul:'Seelenzehrer',resonator:'Resonator',combatant:'Allrounder',allrounder:'Allrounder'});
 function persistProfileToken(value){
  try{localStorage.setItem(duoProfileKey,value);}
  catch{set('duoProfileMessage','Browser-Speicherung blockiert. Sichere unbedingt den privaten Profil-Wiederherstellungslink.');}
 }
 function deckEditor(){
  if(!duoProfile)return;
  const zone=$('duoProfileDeckZone').value;
  const deck=zone==='main'?duoProfile.deck:duoProfile.fusions;
  const owned=zone==='main'?duoProfile.ownedMain:duoProfile.ownedFusions;
  const place=$('duoProfileDeckSlot'),chosen=Number(place.value),currentCard=$('duoProfileDeckCard');
  place.replaceChildren();
  for(let i=0;i<deck.length;i++){
   const opt=el('option',place,(i+1)+': '+name(deck[i]));opt.value=String(i);
  }
  place.value=chosen>=0&&chosen<deck.length?String(chosen):'0';
  currentCard.replaceChildren();
  for(const id of new Set(owned)){
   const opt=el('option',currentCard,name(id)+' · Lv '+card(id).level);opt.value=String(id);
  }
  currentCard.value=String(deck[Number(place.value)]??owned[0]??'');
  place.onchange=()=>{currentCard.value=String(deck[Number(place.value)]);};
 }

 const economyProfile=()=>({
  ...duoProfile,owned_main:duoProfile?.ownedMain||[],
  owned_fusions:duoProfile?.ownedFusions||[],
  cleared_chapters:duoProfile?.clearedChapters||[]
 });
 function renderCollectionTable(){
  if(!duoProfile||!economyRules)return;
  const zone=$('duoCollectionFilter').value;
  const term=$('duoCollectionSearch').value.trim().toLocaleLowerCase('de');
  const onlySpare=$('duoCollectionOnlySpare').checked;
  const target=$('duoCollectionRows');target.replaceChildren();
  const rows=economyRules.collectionRows(economyProfile(),catalog,zone);
  let shown=0;
  for(const item of rows){
   if(onlySpare&&!item.spare)continue;
   if(term&&!(item.name+' '+item.level+' '+(item.fusion?'fusion':'normal'))
     .toLocaleLowerCase('de').includes(term))continue;
   const tr=el('tr',target,undefined,item.spare?'duo-card-spare':'');
   tr.classList.toggle('ad184-duo-fusion',!!item.fusion);
   tr.classList.toggle('ad184-duo-advanced',item.level>=7);
   el('td',tr,item.name+' · #'+item.id);
   el('td',tr,(item.fusion?'Fusion':'Normal')+' · Lv '+item.level);
   el('td',tr,String(item.quantity));
   el('td',tr,String(item.used));
   el('td',tr,String(item.spare));
   el('td',tr,item.enhancement+'/5'+(item.protected?' · geschützt':''));
   shown++;
  }
  if(!shown){
   const tr=el('tr',target);const td=el('td',tr,
    'Keine passenden Karten.','duo-collection-empty');td.colSpan=6;
  }
 }
 function updateCollectionOffers(){
  if(!duoProfile||!economyRules)return;
  const p=economyProfile(),active=Number($('duoCardEnhanceSelect').value),
   available=Number($('duoCardRecycleSelect').value);
  const enhance=economyRules.enhanceOffer(p,active,catalog);
  if(!enhance){
   set('duoCardEnhanceOffer','Wähle eine Karte aus deinem aktiven Deck.');
   $('duoCardEnhanceBuy').disabled=true;
  }else if(enhance.maxed){
   set('duoCardEnhanceOffer','Maximalrang 5 erreicht.');
   $('duoCardEnhanceBuy').disabled=true;
  }else{
   set('duoCardEnhanceOffer','Rang '+enhance.rank+' → '+enhance.nextRank+
    ' · +'+enhance.bonusPerStat+' ATK / DEF je Rang · '+
    enhance.essence+' Essenz + '+enhance.shards+' Splitter');
   $('duoCardEnhanceBuy').disabled=duoProfile.essence<enhance.essence||
    duoProfile.shards<enhance.shards;
  }
  const recycle=economyRules.recycleOffer(p,available,catalog);
  if(!recycle){
   set('duoCardRecycleOffer','Keine zerlegbare Karte ausgewählt.');
   $('duoCardRecycleApply').disabled=true;
  }else{
   set('duoCardRecycleOffer','Noch '+recycle.spare+
    ' freie Exemplare · Rückgabe: '+recycle.essence+
    ' Essenz + '+recycle.shards+' Splitter');
   $('duoCardRecycleApply').disabled=!$('duoCardRecycleConfirm').checked;
  }
 }
 function renderCollection(){
  if(!duoProfile||!economyRules)return;
  const p=economyProfile(),rows=economyRules.collectionRows(p,catalog);
  const total=rows.reduce((n,x)=>n+x.quantity,0);
  const spare=rows.reduce((n,x)=>n+x.spare,0);
  set('duoCollectionTotals',total+' eigene Karten · '+rows.length+
   ' verschiedene Vorlagen · '+spare+' Exemplare außerhalb der Decks');
  const enhance=$('duoCardEnhanceSelect'),recycle=$('duoCardRecycleSelect'),
   selectedA=enhance.value,selectedR=recycle.value;
  enhance.replaceChildren();recycle.replaceChildren();
  for(const row of rows){
   if(row.used){
    const o=el('option',enhance,row.name+' (Lv '+row.level+
     ', Rang '+row.enhancement+'/5)');o.value=String(row.id);
   }
   if(row.recyclable){
    const o=el('option',recycle,row.name+' · '+row.spare+' frei');
    o.value=String(row.id);
   }
  }
  if([...enhance.options].some(o=>o.value===selectedA))enhance.value=selectedA;
  if([...recycle.options].some(o=>o.value===selectedR))recycle.value=selectedR;
  $('duoCardRecycleConfirm').checked=false;
  renderCollectionTable();updateCollectionOffers();
  window.ArcaneCollectionRewards184?.duoCollection?.({rows});
 }

 function updatePacing(){
  if(!duoProfile||!duoEconomy||!economyRules)return;
  const chapters=duoEconomy.rewards||economyRules.rewardTable(),
   cleared=(duoProfile.clearedChapters||[]).filter(n=>n>=1&&n<=10),
   lastClear=Math.max(0,...cleared),current=Math.max(1,lastClear);
  const next=lastClear>=rules.CHAPTERS.length?null:
   chapters.find(x=>x.chapter===lastClear+1);
  const credits=duoProfile.chapterCardCredits||0;
  set('duoFirstClearCards',credits?
   '🎁 '+credits+' Kapitelkarte'+(credits===1?'':'n')+' wartet'+(credits===1?'':'n')+' auf dich.':
   'Beim ersten Sieg in einem neuen Kapitel erhältst du drei Karten zur Auswahl.');
  $('duoChapterCardClaim').disabled=credits<=0;
  set('duoChapterClearPreview','Deine nächste Belohnung: '+
   (next?'Kapitel '+next.chapter+' · '+next.first.xp+' EP, '+
   next.first.essence+' Essenz, '+next.first.shards+
   ' Splitter und 3 garantierte Karten':'Alle zehn Kapitel erstmals abgeschlossen')+
   '. Ein weiterer Sieg in Kapitel '+current+' bringt '+
   chapters[current-1].repeat.essence+' Essenz und '+
   chapters[current-1].repeat.shards+' Splitter (bis zu dreimal täglich).');
  const selector=$('duoBalancePack'),currentPack=selector.value;
  selector.replaceChildren();
  for(const [key,offer] of Object.entries(duoEconomy.packs||{})){
   const opt=el('option',selector,offer.title+' · '+offer.essence+
    ' Essenz + '+offer.shards+' Splitter');opt.value=key;
  }
  if(duoEconomy.packs?.[currentPack])selector.value=currentPack;
  updatePacingGoal();
 }
 function updatePacingGoal(){
  if(!duoProfile||!duoEconomy||!economyRules)return;
  const choice=$('duoBalancePack').value,offer=duoEconomy.packs?.[choice];
  if(!offer)return;
  if(!(duoProfile.clearedChapters||[]).length){
   const missingEss=Math.max(0,offer.essence-duoProfile.essence),
    missingShards=Math.max(0,offer.shards-duoProfile.shards);
   set('duoBalanceGoal','Für '+offer.title+' brauchst du noch '+missingEss+
    ' Essenz und '+missingShards+
    ' Splitter. Nach deinem ersten Kapitelsieg kannst du gezielt dafür sammeln.');
   return;
  }
  const current=Math.max(1,...(duoProfile.clearedChapters||[]).filter(n=>n>=1&&n<=10));
  const progress=economyRules.afford({
   essence:duoProfile.essence,shards:duoProfile.shards},offer,current);
  set('duoBalanceGoal',progress.canBuy?
   '✓ Du hast genug für '+offer.title+'. Du findest es bei den Kartenpaketen.':
   'Dir fehlen noch '+progress.essenceShort+' Essenz und '+progress.shardsShort+
    ' Splitter. Mit etwa '+progress.repeatsNeeded+' weiteren Siegen in Kapitel '+
    current+' könntest du sie verdienen.');
 }
 function installProfile(data){
  duoProfile=data.profile;duoLastRoom=data.lastRoom??duoLastRoom;
  if(!nameConfirmed){$('duoNameInput').value=duoProfile.nickname;$('duoNameHint').textContent='Dein bisheriger 2v2-Name. Du kannst ihn hier ändern.';}
  $('duoHostName').value=duoProfile.nickname;
  duoEconomy=data.economy??duoEconomy;
  profileDeck=[...duoProfile.deck];profileFusions=[...duoProfile.fusions];
  profileUpgrades={...duoProfile.upgrades};
  profileEnhancements={...duoProfile.enhancements};
  profileEssence={...duoProfile.essenceBinding};
  profileLv1={...duoProfile.lv1Research};
  $('duoProfileCreateArea').hidden=true;
  $('duoProfileActive').hidden=false;
  const xpNext=150-(duoProfile.xp%150);
  set('duoProfileStats',duoProfile.nickname+' · Lv '+duoProfile.level+
   ' · '+duoProfile.xp+' EP (noch '+xpNext+' bis zum Aufstieg)'+
   ' · '+duoProfile.essence+' Essenz · '+duoProfile.shards+
   ' Splitter · '+duoProfile.wins+' Siege · '+
   duoProfile.ownedMain.length+' Hauptkarten / '+
   duoProfile.ownedFusions.length+' Fusionen');
  const cleared=duoProfile.clearedChapters||[],
   clearedMain=cleared.filter(n=>n>=1&&n<=10),
   clearedSaga=cleared.filter(n=>n>=11&&n<=15);
  set('duoProfileCleared',(clearedMain.length?
   'Geschaffte Kapitel: '+clearedMain.join(', '):'Dein Abenteuer beginnt in Kapitel I.')+
   (clearedSaga.length?' · Fanatiker-Saga: '+clearedSaga.map(n=>n-10).join(', ')+'/5':'')+
   (duoEconomy?.maxSagaStage?' · Fanatiker-Quest verfügbar':' · Quest ab Kapitel II'));
  set('duoDeckInfo','Dein Deck ist bereit: 40 Hauptkarten und '+
   profileFusions.length+' Fusionsvorlagen. Änderungen gelten für das nächste Duell.');
  const perks=$('duoProfilePerk'),current=perks.value;
  perks.replaceChildren();
  for(const [key,max]of Object.entries(rules.PERK_LIMITS)){
   const rank=duoProfile.upgrades[key]||0,price=100+rank*70;
   const opt=el('option',perks,(perkNames[key]||key)+' '+rank+'/'+max+
    (rank<max?' · '+price+' Essenz':' · Vollständig verbessert'));opt.value=key;
  }
  if(current&&rules.PERK_LIMITS[current])perks.value=current;
  $('duoProfileContinue').hidden=!duoLastRoom||!!roomId;
  for(const c of rules.ENCOUNTERS){
   const option=Array.from($('duoChapter').options).find(o=>Number(o.value)===c.id);
   if(option)option.disabled=c.id>=11?c.id>(duoEconomy?.maxSagaStage||0):
    c.id>(duoEconomy?.maxChapter||1);
  }
  if($('duoChapter').selectedOptions[0]?.disabled)$('duoChapter').value='1';
  updateChapter();

  const explainResearch=(branch,id,button)=>{
   const offer=duoEconomy?.[branch],node=$(id),control=$(button);
   if(!offer){node.textContent='Deine Fähigkeiten werden geladen …';control.disabled=true;return;}
   if(offer.maxed){node.textContent=offer.title+': vollständig freigeschaltet';control.disabled=true;return;}
   node.textContent=offer.title+' '+offer.rank+'/'+offer.maxRank+
    ' → Rang '+offer.nextRank+' · '+offer.essence+' Essenz + '+
    offer.shards+' Splitter · Abschluss Kapitel '+offer.requiredChapter+
    (offer.unlocked?' ✓':' nötig');
   control.disabled=!offer.unlocked||duoProfile.essence<offer.essence||
    duoProfile.shards<offer.shards;
  };
  explainResearch('lv1','duoResearchLv1Status','duoResearchLv1Buy');
  explainResearch('essence','duoResearchEssenceStatus','duoResearchEssenceBuy');
  const bind=$('duoEssenceBindCard'),prior=bind.value;bind.replaceChildren();
  for(const id of [...new Set(duoProfile.deck.filter(id=>
   duoProfile.ownedMain.includes(id)&&card(id).essenceMonster))]){
   const o=el('option',bind,name(id));o.value=String(id);
  }
  if(prior&&[...bind.options].some(o=>o.value===prior))bind.value=prior;
  $('duoEssenceBindSave').disabled=!bind.options.length||
   !duoProfile.essenceBinding?.researchRank;
  const max=duoEconomy?.maxCardLevel??3,nextChapter=duoEconomy?.maxChapter??1;
  set('duoProfileUnlockInfo','Du kannst Karten bis Level '+max+' sammeln und bis Kapitel '+
   nextChapter+' spielen.'+(duoEconomy?.maxSagaStage?
    ' Fanatiker-Saga bis Prüfung '+(duoEconomy.maxSagaStage-10)+'.':''));
  updatePacing();
  deckEditor();
  renderCollection();
  render();
 }
 async function fetchProfile(){
  if(!duoProfileToken)return;
  try{
   installProfile(await call({type:'profile',profileToken:duoProfileToken}));
   set('duoProfileMessage','✓ Dein Spielstand ist auf dem neuesten Stand.');
  }catch(e){set('duoProfileMessage','Dein Spielstand konnte nicht geladen werden: '+e.message);}
 }
 async function createDuoProfile(nameOverride){
  if(profileSaving||duoProfile)return;profileSaving=true;
  try{
   const data=await call({type:'profileCreate',name:nameOverride||$('duoHostName').value});
   duoProfileToken=data.profileToken;persistProfileToken(duoProfileToken);
   installProfile(data);
   set('duoProfileMessage','Dein Duellant ist bereit. Viel Spaß bei eurem ersten Abenteuer!');
  }catch(e){set('duoProfileMessage',e.message);}
  finally{profileSaving=false;}
 }
 async function profileOperation(type,extra){
  if(!duoProfile||profileSaving)return;
  profileSaving=true;
  try{
   const data=await call({type,profileToken:duoProfileToken,
    expectedRevision:duoProfile.revision,...extra});
   installProfile(data);
   if(type==='pack'&&Array.isArray(data.newCards)&&data.newCards.length){
    const granted=data.newCards.map(item=>({
     name:item.name||name(item.id),level:item.level||card(item.id).level,
     art:card(item.id).art,
     fusion:!!item.fusion||!!card(item.id).fusionOnly,ace:!!card(item.id).ace
    }));
    window.ArcanePackCinema178?.open(granted,{title:'DEIN NEUES KARTENPAKET',
     subtitle:'Diese Karten gehören jetzt zu deiner Sammlung'});
   }
   set('duoProfileMessage',Array.isArray(data.newCards)&&data.newCards.length?
    '✦ '+data.newCards.length+' neue Karte'+(data.newCards.length===1?' gehört':'n gehören')+
     ' jetzt dir! Du kannst sie vor dem nächsten Duell ins Deck legen.':
    data.chapterCard?'✦ '+data.chapterCard.name+' (Lv '+data.chapterCard.level+
     ') gehört jetzt dir!':
    data.newCard?'✦ '+data.newCard.name+' gehört jetzt dir!':
    data.enhanced?'✓ '+name(data.enhanced.id)+' ist jetzt auf Rang '+
     data.enhanced.rank+'/5. Die Verbesserung gilt ab deinem nächsten Duell.':
    data.recycled?'✓ Karte zerlegt. Du erhältst '+data.recycled.essence+
     ' Essenz und '+data.recycled.shards+' Splitter.':
    '✓ Deine Änderung wurde gespeichert.');
  }catch(e){set('duoProfileMessage',e.message);await fetchProfile();}
  finally{profileSaving=false;}
 }
 async function backupProfile(){
  if(!duoProfileToken)return;
  const url=ownOrigin()+'#duoprofile='+duoProfileToken;
  $('duoProfileBackupBox').hidden=false;
  $('duoProfileBackupLink').value=url;
  try{await navigator.clipboard.writeText(url);
   set('duoProfileMessage','Privaten 2v2-Profil-Link kopiert. Nicht weitergeben!');
  }catch{set('duoProfileMessage','Bitte den privaten Profil-Link aus dem Eingabefeld kopieren.');}
 }
 async function continueLastRoom(id=duoLastRoom?.roomId){
  if(!duoProfileToken||!id||busy)return;
  try{
   const r=await call({type:'state',roomId:id,token:duoProfileToken});
   roomId=id;token=duoProfileToken;seat=r.seat;invite='';load(r);
   history.replaceState(null,'',ownOrigin()+'#room='+roomId);
   set('duoStatus','Willkommen zurück! Dein letztes Duell ist wieder geöffnet.');
  }catch(e){set('duoProfileMessage','Dieses Duell lässt sich gerade nicht öffnen: '+e.message);}
 }

 function save(){
  try{sessionStorage.setItem(key(roomId),JSON.stringify({token,seat,invite:seat===0?invite:''}));}
  catch{sessionReady=false;}
 }
 function load(payload){
  const previous=game;
  if(previous&&payload.state?.revision<previous.revision)return;
  game=payload.state;seat=payload.seat;syncedAt=Date.now();syncError='';syncFailures=0;
  if(game.status!=='waiting')invite='';
  save();render();
  if(game.status!=='inviting_next'&&$('duoInviteDialog').dataset.mode==='next')dismissInvitation();
  window.ArcaneDuoCinematics167?.onState(previous,game);
  window.ArcaneDuoCinema170?.onState(previous,game,catalog,seat);
  window.ArcaneDuoStanceCinema191?.onState(previous,game,catalog);
  window.ArcaneDuoImpactCinema192?.onState(previous,game,catalog);
  window.ArcaneDuoStompCinema202?.onState(previous,game);
  window.ArcaneDuoAbilitiesCinema193?.onState(previous,game,catalog);
  window.ArcaneDuoPredator198?.onState(previous,game,catalog);
  window.ArcaneDuoUX204?.onState(previous,game,{seat,roomId,catalog});
  window.ArcaneDuoSoulBond206?.onState?.(previous,game);
  window.ArcaneDuoSound194?.onState(previous,game,catalog,seat);
  window.ArcaneSfx208?.onDuoState?.(previous,game,catalog,seat);
  if(previous&&previous.status!=='finished'&&game.status==='finished'&&
   game.winner===0&&duoProfileToken)fetchProfile();
 }
 async function refresh(){
  if(!roomId||!token||refreshing||busy)return;
  refreshing=true;lastPollAt=Date.now();
  try{
   const response=await call({type:'state',roomId,token});
   if(!game||response.state.revision!==game.revision)load(response);
   else{const recovered=!!syncError;syncedAt=Date.now();syncError='';syncFailures=0;
    if(recovered)render();else updateSaveState();}
  }catch(e){syncFailures=Math.min(syncFailures+1,4);syncError=e.message;
    set('duoStatus',e.message);render();}
  finally{refreshing=false;}
 }
 async function send(action){
  if(!game||busy)return;
  if(!(game.activeSeat===seat&&game.status==='active')&&
    !(action.type==='nextChapter'&&seat===0&&game.status==='finished'&&game.winner===0)&&
    !(['acceptNextChapter','declineNextChapter'].includes(action.type)&&seat===2&&game.status==='inviting_next'))return;
  // Capture the visible, local handcard before render() rebuilds the hand.
  // This ticket is visual-only and is discarded if the server rejects the action.
  const summonTicket=window.ArcaneDuoSummonCinema190?.capture?.({action,game,seat,catalog});
  window.ArcaneDuoUX204?.onActionStart(action);
  busy=true;render();let conflicted=false,confirmedSummon=null;
  try{
   const previous=game;
   const response=await call({type:'action',roomId,token,expectedRevision:game.revision,action});
   load(response);
   if(summonTicket&&window.ArcaneDuoSummonCinema190?.confirmed?.({ticket:summonTicket,
     before:previous,after:game}))confirmedSummon={ticket:summonTicket,before:previous,after:game};
   set('duoStatus','✓ Dein Zug ist gespeichert.');
   if(game?.status==='finished'&&game.winner===0)await fetchProfile();
  }catch(e){
   window.ArcaneDuoUX204?.onActionError();
   syncError=e.message;conflicted=recovery.isConflict(e.message);
   set('duoStatus',e.message);
  }finally{
   busy=false;render();
   // The second render has finished; the destination now has stable geometry.
   if(confirmedSummon)window.ArcaneDuoSummonCinema190?.play?.(confirmedSummon);
  }
  if(conflicted){
   await refresh();
   if(!syncError)set('duoStatus','Das Spiel hat sich inzwischen verändert. Bitte wähle deine Aktion noch einmal.');
  }
 }
 async function createRoom(){
  if(busy)return;busy=true;
  try{
   const entry=$('duoEntry').value;
   if(!duoProfileToken||!duoProfile)throw Error('Bitte zuerst ein eigenes 2v2-Profil erstellen.');
   const payload={type:'create',profileToken:duoProfileToken,entry,
    ...(entry!=='new'?{chapter:chapter().id}:{})};
   const r=await call(payload);
   roomId=r.roomId;token=r.token;seat=0;invite=r.invite;save();load(r);
   location.hash='room='+roomId;
   set('duoStatus','Dein Duell ist bereit! Lade jetzt deinen Partner ein.');
  }catch(e){set('duoStatus',e.message);}
  finally{busy=false;render();}
 }
 async function joinRoom(id,invitation){
  if(busy)return;busy=true;
  try{
   if(!duoProfileToken||!duoProfile)throw Error('Bitte zuerst ein eigenes 2v2-Profil erstellen.');
   const r=await call({type:'join',roomId:id,invite:invitation,
    profileToken:duoProfileToken});
   roomId=id;token=r.token;seat=2;invite='';save();load(r);
   location.hash='room='+roomId;
   set('duoStatus','Du bist dabei! Jetzt kämpft ihr gemeinsam.');
  }catch(e){set('duoStatus',e.message);return false;}
  finally{busy=false;render();}
  return true;
 }
 async function copyRecovery(){
  if(!roomId||!token||![0,2].includes(seat))return;
  const url=recovery.link(ownOrigin(),roomId,token);
  const input=$('duoRecoveryLink');input.value=url;input.hidden=false;
  $('duoRecoveryHelp').hidden=false;
  try{await navigator.clipboard.writeText(url);
   set('duoStatus','Privater Wiederherstellungslink kopiert. Nicht mit anderen teilen!');
  }catch{set('duoStatus','Bitte privaten Wiederherstellungslink manuell kopieren.');}
 }
 const format=c=>displayName(c)+' · Lv '+c.level+' · '+shownAtk(c)+'/'+c.def+
  ' · '+(c.mode==='def'?'DEF':'ATK')+(c.soul?' · ✦ '+c.soul+' Seele':'');
 function updateSaveState(){
  const node=$('duoSaveState');if(!node)return;
  node.dataset.sync=syncError?'offline':syncedAt?'saved':'pending';
  node.textContent=syncError?'⚠ Die Verbindung ist unterbrochen. '+syncError+
   ' Versuche es gleich noch einmal.':
   syncedAt?'☁ Gespeichert um '+new Date(syncedAt).toLocaleTimeString('de-AT')+
    (sessionReady?'':' · Bitte sichere deinen Zugangslink.'):
   '☁ Dein Duell wird automatisch gespeichert.';
 }
 function render(){
  const dock=$('duoActions'),track=$('duoTrack'),seats=$('duoSeats'),log=$('duoLog');
  const directGuide=$('ad187-attack-guide');
  if(directGuide){directGuide.hidden=true;directGuide.replaceChildren();}
  const fusionGuide=$('ad188-fusion-guide');
  if(fusionGuide){fusionGuide.hidden=true;fusionGuide.replaceChildren();}
  const summonGuide=$('ad189-summon-guide');
  if(summonGuide){summonGuide.hidden=true;summonGuide.replaceChildren();}
  $('duoBattleArena')?.classList.remove('ad189-summon-mode');
  dock.classList.remove('ad186-enhanced');
  for(const n of [dock,track,seats,log])n.replaceChildren();
  $('duoCreate').hidden=!!roomId||location.hash.startsWith('#join=');
  $('duoCreate').disabled=busy||!Object.keys(catalog).length||!duoProfile;
  $('duoAccept').hidden=!!roomId||!location.hash.startsWith('#join=');
  $('duoAccept').disabled=busy||!Object.keys(catalog).length||!duoProfile;
  $('duoRefresh').disabled=!roomId||busy||refreshing;
  const phase=choices.phase(game,seat),step=phase==='not-created'?0:phase==='waiting'?1:2;
  ['duoStepCreate','duoStepInvite','duoStepBattle'].forEach((id,i)=>{
   $(id).classList.toggle('current',step===i);$(id).classList.toggle('done',step>i);
  });
  updateSaveState();
  $('duoInviteBox').hidden=!(game?.status==='waiting'&&seat===0&&invite);
  if(!$('duoInviteBox').hidden)$('duoInvite').value=ownOrigin()+'#join='+roomId+'.'+invite;
  if(!game){
   $('duoRecoveryArea').hidden=true;
   set('duoTurnName',location.hash.startsWith('#join=')?
    'Nimm die Einladung an und kämpfe mit!':'Noch kein Duell gestartet');
   window.ArcaneDuoExperience185?.didRender?.({game,seat,roomId});
   return;
  }
  set('duoRoomId',roomId);
  $('duoRecoveryArea').hidden=![0,2].includes(seat);
  set('duoAlliedLP',game.teams[0].lp.toLocaleString('de-AT')+' LP'+
   (game.teams[0].shield?' · 🛡 '+game.teams[0].shield+' Schild':''));
  set('duoEnemyLP',game.teams[1].lp.toLocaleString('de-AT')+' LP');
  set('duoTurnName',game.status==='waiting'?'Dein Partner kann jetzt beitreten':
   game.status==='finished'?'Duell beendet':
   'Runde '+game.round+' · '+game.players[game.activeSeat].name+' am Zug');
  if(game.ruleset==='duo-v166'){
   const arena=game.round<=9?'Ab Runde 10 setzt die Arena beiden Teams zu.':
    'Am Rundenende verliert jedes Team '+rules.arenaDamage(game,game.round).toLocaleString('de-AT')+
    ' LP. Schilde helfen dagegen nicht.';
   el('p',track,'☄ '+arena,'duo-arena-forecast');
   if(game.fateEvent)el('p',track,'✦ Schicksalszug von '+
    game.players[game.fateEvent.ownerSeat].name+' in Runde '+game.fateEvent.round+
    ' – fünf Schicksalsmonster eilen zu Hilfe!','duo-fate-banner');
  }
  const milestones=$('duoChapterProgress');milestones.replaceChildren();
  const progressStages=game.entry==='quest'?rules.QUESTS:rules.CHAPTERS;
  for(const c of progressStages){
   const completed=(game.entry==='new'||game.entry==='quest')&&c.id<game.chapter||
    game.winner===0&&game.status==='finished'&&c.id===game.chapter&&
    (game.entry!=='quest'||game.questPassed===true);
   const selected=c.id===game.chapter;
   const skipped=!selected&&c.id<game.chapter&&!completed;
   const li=el('li',milestones,undefined,'duo-chapter-step'+
    (completed?' complete':selected?' current':skipped?' skipped':''));
   el('strong',li,game.entry==='quest'?'Prüfung '+(c.id-10):'Kapitel '+c.id);
   el('span',li,c.name);
   el('small',li,completed?'Geschafft':
    selected?game.winner===1?'Niederlage':game.status==='finished'?'Abgeschlossen':'Aktuelles Kapitel':
    skipped?'Übersprungen':'Noch nicht begonnen');
  }
  if(game.entry==='quest'){
   const current=rules.QUESTS.find(c=>c.id===game.chapter);
   if(current){
    el('p',track,'✧ '+current.name+' · '+current.dialogue,'duo-fate-banner');
    const q=game.questProgress||{};
    el('p',track,'Questziel: '+({win:'Duell gewinnen',floating:'Floating auslösen',
     swarm:'Schwarm auslösen',special:'Exklusive Level-1-Fusion durchführen',
     all:'Floating, Schwarm und exklusive Level-1-Fusion kombinieren'}[current.goal]||'Duell gewinnen')+
     ' · Floating '+(q.floating||0)+' · Schwarm '+(q.swarm||0)+
     ' · Spezialfusion '+(q.special||0),'duo-arena-forecast');
   }
  }
  const reward=rules.packIds(catalog,game.chapter);
  set('duoCurrentReward','Leihkarten für dieses Kapitel: '+reward.map(name).join(' · '));
  for(const p of game.players){
   el('span',track,p.name,'turn-seat '+(p.team===1?'enemy ':'')+
    (game.status==='active'&&game.activeSeat===p.seat?'current':''));
   const panel=el('article',seats,undefined,'seat '+(game.activeSeat===p.seat?'active':''));
   panel.dataset.seat=String(p.seat);
   el('h3',panel,p.name);
   el('small',panel,p.kind==='human'?(p.seat===0?'DEIN TEAM · GASTGEBER':'DEIN TEAM · PARTNER'):
    'GEGNER','duo-seat-kind');
   el('small',panel,p.hand.length+' Handkarten · '+p.deck.length+' im Hauptdeck · '+
    p.remainingFusion.length+' Fusionen verbleibend','duo-seat-count');
   if(p.team===0){
    const buffs=Object.entries(p.upgrades||{}).filter(([,rank])=>rank>0);
    el('small',panel,buffs.length?
     '✧ '+buffs.map(([key,rank])=>({
      power:'Training',jagdinstinkt:'Jagdinstinkt',schildwall:'Schildwall',
      resilience:'Standhaftigkeit',combatDiscipline:'Kampfdisziplin',
      fusionLore:'Fusionskunde',fusionPrecision:'Runenpräzision',
      openingAegis:'Vorhut-Schutz'}[key]||key)+' '+rank).join(' · '):
     '✧ Noch keine Verbesserungen','duo-perk-note');
    if(p.lv1?.perk)el('small',panel,'✧ Verbotene Forschung · Rang '+p.lv1.rank+
     '/5 · '+(p.lv1.charges||0)+' Geisterfunken','duo-perk-note');
   }
   const field=el('div',panel,undefined,'field');
   for(const [slot,c] of p.field.entries()){
    const cell=el('div',field,undefined,'field-cell '+(c?'filled':''));
    cell.dataset.slot=String(slot);
    if(!c){el('span',cell,'◇');continue;}
    const illustration=displayArt(c);
    if(illustration){
     const img=el('img',cell,undefined,'duo-field-art');img.src=illustration;
     img.alt='Illustration '+displayName(c);img.loading='lazy';
    }
    if(c.fate)cell.classList.add('duo-fate-card');
    el('span',cell,displayName(c));
    el('small',cell,'Lv '+c.level+' · '+shownAtk(c)+' ATK / '+c.def+' DEF',
     'duo-field-meta');
    el('small',cell,(c.mode==='def'?'🛡 Verteidigung':'⚔ Angriff')+
     (c.fusion?' · Fusion':'')+' · '+(roleNames[c.role]||'Monster'),'duo-card-level');
    if(c.fusion&&(c.materialsUsed||2)>=3){
     const shares={3:[70],4:[50,50],5:[50,50,30]}[c.materialsUsed]||[];
     const bonus=rules.stompBonus(c);
     el('small',cell,'✦ Stomp '+shares.map(pct=>(pct+bonus)+' %').join(' / ')+
      ' · −3 % ATK/DEF je Treffer','duo-soul-status');
    }
    if(c.role==='soul')el('small',cell,'✦ Seelenkraft '+(c.soul||0)+
     ' · Verdichtet '+(c.condensed||0)+' (+'+Math.floor((c.condensed||0)*.5)+
     ' ATK) · '+(c.soulCooldown>0?'wieder bereit in '+c.soulCooldown+' Zügen':'bereit'),
     'duo-soul-status');
    if(!c.fate&&p.essence?.chosen===c.id){
     const kind=card(c.id).essenceSchool;
     el('small',cell,'✦ Gebundene Essenz · '+
      (kind==='predator'?(c.essenceChoice===2?'2 × 70 %':'1 × 100 %'):
       kind==='fusion'?'Zusätzliche Fusionswürfe':'Erstangriff-Schutz'),
      'duo-soul-status');
    }
    if(c.guardLeft>0)el('small',cell,'✧ Letztes Bollwerk · '+c.guardLeft+
     ' gegnerische Züge immun','duo-soul-status');
    if(c.lv1Shield>0)el('small',cell,'◇ Schutzorb '+c.lv1Shield,'duo-soul-status');
    if(c.lv1Echo)el('small',cell,'◇ Geisterecho ohne Fähigkeit','duo-soul-status');
    if(card(c.id).lv1Special&&p.lv1?.perk)el('small',cell,
     '✦ '+card(c.id).lv1Special.toUpperCase(),'duo-soul-status');
    if((c.role==='combatant'||c.role==='allrounder')&&c.resonance)el('small',cell,
     '✧ Resonanz +'+(4+4*c.resonance)+' %','duo-card-level');
    cell.title='Feld '+(slot+1)+(c.used?' · Angriff verbraucht':'')+
     (c.placedRound>=game.round?' · noch nicht bereit':'');
   }
   if(p.lv1?.perk){
    const reserve=el('div',panel,undefined,'duo-ghost-reserve');
    el('strong',reserve,'✧ Geisterzonen ('+(p.lv1.ghostSlots||[]).length+'/5)');
    const grid=el('div',reserve,undefined,'field');
    (p.lv1.ghostSlots||[]).forEach((c,i)=>{
     const cell=el('div',grid,undefined,'field-cell duo-ghost-cell '+(c?'filled':''));
     cell.dataset.slot=String(i);
     if(!c){el('span',cell,'◇ Slot '+(i+1));return;}
     if(displayArt(c)){const img=el('img',cell,undefined,'duo-field-art');
      img.src=displayArt(c);img.alt=displayName(c);img.loading='lazy';}
     el('span',cell,displayName(c));
     el('small',cell,'Zone '+(i+1)+' · Lv '+c.level+' · '+shownAtk(c)+'/'+c.def+
      ' · '+(c.mode==='def'?'DEF':'ATK'));
    });
    if(p.lv1.choices?.length||p.lv1.offers?.length)el('small',reserve,
     (p.lv1.choices?.length||0)+' Geisterwahlen · '+
     (p.lv1.offers?.length||0)+' Schwarm-Echos bereit');
   }
  }
  for(const line of [...game.log].slice(-10).reverse())el('li',log,line);
  window.ArcaneDuoHand178?.sync({game,seat,roomId,catalog});
  window.ArcaneCombatIdentity183?.duoDidRender?.({game,roomId});
  window.ArcaneDuoExperience185?.didRender?.({game,seat,roomId});
  window.ArcaneDuoPredator198?.decorate?.({game,seat});
  window.ArcaneDuoUX204?.decorate?.({game,seat,roomId,catalog,send});
  window.ArcaneDuoSoulBond206?.decorate?.({game,seat,roomId,catalog});
  if(game.status!=='active'){
   if(game.status==='inviting_next'){
    el('p',dock,seat===0?'Dein Partner hat eine Einladung erhalten. Warte auf Bestätigung.':
     'Einladung zum nächsten Kapitel: Bitte beitreten oder ablehnen.');
    if(seat===2&&nameConfirmed)showInvitation('next',game.chapterInvite?.from||game.players[0].name,game.chapter+1);
    return;
   }
   const canContinue=game.entry==='quest'?game.chapter<15&&game.questPassed===true:
    game.chapter<rules.CHAPTERS.length;
   if(game.status==='finished'&&game.winner===0&&canContinue){
    if(seat===0)button('✦ Kapitel '+(game.chapter+1)+' starten',
     dock,()=>send({type:'nextChapter'}));
    else el('p',dock,'Kapitel gewonnen. Der Gastgeber startet das nächste.');
   }else el('p',dock,game.status==='waiting'?'Sobald dein Partner da ist, geht es los.':
    game.entry==='quest'&&game.winner===0&&game.questPassed!==true?
     'Ihr habt gewonnen, aber das Questziel fehlt. Wiederholt diese Prüfung.':
    game.winner===0?'Ihr habt diese Kampagne abgeschlossen!':'Das Duell ist zu Ende.');
   return;
  }
  if(game.activeSeat!==seat){
   el('p',dock,game.activeSeat%2===1?'Der Gegner ist am Zug.':
    'Dein Partner ist am Zug.','duo-turn-note');
   return;
  }
  const p=game.players[seat],legal=choices.legalChoices(game,seat);
  el('p',dock,'Du bist dran! Wähle eine Karte oder greife mit deinen Monstern an.',
   'duo-turn-note');
  if(legal.hand.length){
   const part=section(dock,'✦ Monster beschwören','Wähle Handkarte und Zone. Ein besetztes Feld kannst du bewusst ersetzen; die Karte wird erst nach Bestätigung verbraucht.');
   const row=el('div',part,undefined,'duo-choices');
   const hand=selector('Handkarte',legal.hand.map(x=>[x.index,
    displayName(x)+' · Lv '+card(x.id).level+
    (x.fate?' · '+x.atk+'/'+x.def+' · unverschmelzbar':'')]),row);
   const slot=selector('Monsterzone',p.field.map((c,i)=>[i,'Feld '+(i+1)+(c?' · '+displayName(c)+' (ersetzen)':' · frei')]),row);
   hand.dataset.ad189Hand='true';
   slot.dataset.ad189Slot='true';
   const summonCommit=button('Monster spielen / ersetzen',part,()=>{
    const destination=Number(slot.value),occupied=!!p.field[destination];
    if(occupied){
     const previous=displayName(p.field[destination]),next=displayName(legal.hand[Number(hand.selectedIndex)]);
     if(!confirm('„'+previous+'“ auf den Friedhof legen und durch „'+next+'“ ersetzen?'))return;
    }
    send({type:occupied?'replace':'summon',handIndex:Number(hand.value),slot:destination});
   });
   summonCommit.dataset.ad189Commit='true';
  }
  if(!p.summoned&&p.remainingFusion.length>=1){
   const part=section(dock,'✦ Fusion','Wähle zwei bis fünf Monster aus deiner Hand, deinem Feld oder dem Feld deines menschlichen Partners. '+
    'Verwendete verbündete Feldmonster werden beim Fusionieren ebenfalls verbraucht.');
   const allySeat=seat===0?2:0,ally=game.players[allySeat];
   const select=el('select',part,undefined,'duo-fusion-list');
   select.multiple=true;select.size=7;select.setAttribute('aria-label','Fusionsmaterialien');
   p.hand.forEach((item,i)=>{if(item?.fate||card(typeof item==='number'?item:item.id).ace)return;
    const id=typeof item==='number'?item:item.id;
    const opt=el('option',select,'Hand '+(i+1)+' · '+
     name(id)+' · Lv '+card(id).level);opt.value='hand:'+i;});
   p.field.forEach((c,i)=>{if(!c||c.fate||c.predatorToken||card(c.id).ace)return;const opt=el('option',select,
    'Feld '+(i+1)+' · '+displayName(c)+' · Lv '+c.level);opt.value='field:'+i;});
   if(ally?.team===p.team){
    ally.field.forEach((c,i)=>{if(!c||c.fate||c.predatorToken||card(c.id).ace)return;
     const opt=el('option',select,'Partner '+ally.name+' · Feld '+(i+1)+' · '+displayName(c)+' · Lv '+c.level);
     opt.value='allyField:'+i;});
   }
   if(p.lv1?.perk){
    (p.lv1.ghostSlots||[]).forEach((c,i)=>{if(!c||c.predatorToken||card(c.id).ace)return;
     const opt=el('option',select,'Geisterslot '+(i+1)+' · '+name(c.id)+
      ' · Lv '+c.level);opt.value='ghost:'+i;});
    for(let i=0;i<(p.lv1.charges||0);i++){
     const opt=el('option',select,'Geisterfunke '+(i+1)+' · Lv 2 · verbrauchbar');
     opt.value='charge:'+i;
    }
   }
   const outputs=el('div',part,undefined,'duo-choices');
   const core=selector('Kernmonster',[],outputs);
   const options=selector('Fusionsvorlage',[],outputs);
   const target=selector('Ergebnis-Feld',[],outputs);
   core.dataset.ad188Core='true';
   options.dataset.ad188Template='true';
   target.dataset.ad188Slot='true';
   const hint=el('p',part,'Bitte 2–5 Materialien auswählen.','duo-action-status');
   const preview=el('div',part,undefined,'duo-fusion-preview');
   const details=el('details',part,undefined,'duo-fusion-details');
   el('summary',details,'Wie kommt dieses Fusionsergebnis zustande?');
   const explanation=el('p',details);
   const maths=el('div',details,undefined,'duo-fusion-math');
   const commit=button('Jetzt fusionieren',part,()=>send({
    type:'fusion',materials:selected(),slot:Number(target.value),
    templateId:Number(options.value),coreIndex:Number(core.value)}));
   commit.dataset.ad188Commit='true';
   const selected=()=>[...select.selectedOptions].map(opt=>{
    const [from,index]=opt.value.split(':');return {from,index:Number(index)};
   });
   const update=(reset=true)=>{
    const keepTemplate=reset?null:options.value;
    const keepCore=reset?null:core.value;
    options.replaceChildren();target.replaceChildren();core.replaceChildren();
    preview.replaceChildren();maths.replaceChildren();explanation.textContent='';
    window.ArcaneDuoFusionGuide214?.clear(details);
    const materials=selected();commit.disabled=true;
    if(materials.length<2||materials.length>5){
     hint.textContent='Erforderlich: 2 bis 5 eigene oder verbündete Materialien.';return;
    }
    try{
     const sources=materials.map(m=>m.from==='charge'?
      {id:-1,level:2,role:'combatant',fusion:false}:m.from==='hand'?
      {id:p.hand[m.index],level:card(p.hand[m.index]).level}:
      m.from==='ghost'?p.lv1.ghostSlots[m.index]:
      m.from==='allyField'?ally?.field[m.index]:p.field[m.index]);
     const initial=rules.fusionLevel(sources);
     materials.forEach((m,i)=>{
      const label=(m.from==='hand'?'Hand ':m.from==='allyField'?'Partnerfeld ':m.from==='ghost'?'Geisterzone ':'Feld ')+(m.index+1)+
      ' · '+(m.from==='charge'?'Geisterfunke':name(sources[i].id))+
      ' (Lv '+sources[i].level+')';
      const op=el('option',core,label);op.value=i;
     });
     core.value=keepCore!==null&&Number(keepCore)<materials.length?
      keepCore:String(initial.coreIndex);
     const availability=rules.fusionOptions(game,seat,materials,catalog,
      {coreIndex:Number(core.value)});
     if(availability.rule.street)core.value=String(availability.rule.coreIndex);
     core.disabled=availability.rule.street;
     const slots=p.field.flatMap((c,i)=>!c||materials.some(m=>m.from==='field'&&m.index===i)?[i]:[]);
     for(const id of availability.templates){
      const op=el('option',options,name(id)+' · Lv '+card(id).level);op.value=id;
     }
     if(keepTemplate!==null&&availability.templates.includes(Number(keepTemplate)))
      options.value=keepTemplate;
     for(const id of slots){const op=el('option',target,'Feld '+(id+1));op.value=id;}
     commit.disabled=!availability.templates.length||!slots.length||busy||!!syncError;
     const {rule}=availability;
     const result=availability.templates.length?rules.fusionPreview(game,seat,materials,
      catalog,{coreIndex:Number(core.value),templateId:Number(options.value)}):null;
     const analysis=result?.analysis||availability.analysis;
     hint.textContent=analysis.pattern+' · Level '+(result?.resultingLevel??rule.level)+
      ' · '+availability.templates.length+' mögliche Fusionen';
     const lines=['✦ '+analysis.rolls+' Würfelpaare (ATK + DEF) · '+
      'bester gemeinsamer Wurf zählt',
      '✧ Fusionsqualität '+(analysis.quality>=1?'+':'')+
       Math.round((analysis.quality-1)*100)+' % · '+analysis.materialBlocks+
       ' verteilbare Materialpunkte à 10',
      '⚔ Rolle: '+({'predator':'Predator','guardian':'Wächter',
       'soul':'Seelenzehrer','resonator':'Resonator'}[analysis.role]||'Resonator')+
       (analysis.soulOdds?' · Seelenzehrer-Erwachen möglich':'')];
     if(analysis.resonancePct)lines.push('✧ Resonanzbonus +'+analysis.resonancePct+' %');
     if(analysis.precisionPct)lines.push('✧ Runenpräzision +'+analysis.precisionPct+' % Qualität');
     if(analysis.loreOpeningRoll)lines.push('✦ Fusionskunde: +1 echter Wurf bei der ersten Fusion');
     if(analysis.loreChainApplied)lines.push('✦ Fusionskunde: +3 % Kettenqualität (einmalig)');
     if(analysis.essenceRolls)lines.push('✦ Runenherz: +'+analysis.essenceRolls+
      ' Fusionswürfe durch das anwesende Essenzwesen');
     if(analysis.elemental)lines.push('✧ Alle Materialien teilen ein Element: Elementharmonie');
     if(materials.length>=3){
      const shares={3:[70],4:[50,50],5:[50,50,30]}[materials.length]||[];
      lines.push('✦ Fusions-Stomp: Hauptziel 100 % · Nebenziele '+shares.join(' / ')+
       ' % (+1–2 Prozentpunkte je Allrounder, +2–4 je Resonator, maximal +12). ' +
       'Jeder tatsächlich getroffene Gegner kostet 3 % eigene ATK UND DEF.');
     }
     if(analysis.role==='predator')lines.push('🐾 Rudelführer: '+
      (materials.length===2?'Basisbonus +3 % je Predator':
       materials.length===3?'1 zufällige Rudelführer-Fähigkeit':
       materials.length===4?'2 zufällige Rudelführer-Fähigkeiten':
       'alle 3 Rudelführer-Fähigkeiten')+
      ' · Kräfte werden erst bei der Fusion ausgewürfelt.');
     for(const line of lines)el('p',maths,line);
     el('p',preview,'✦ '+(roleNames[analysis.role]||'Resonator')+
      ' · '+analysis.rolls+' Chancen auf gute Kampfwerte');
     if(result){
      el('strong',preview,'Voraussichtliche Werte: '+
       result.atk[0]+'–'+result.atk[1]+' ATK · '+
       result.def[0]+'–'+result.def[1]+' DEF.');
      el('small',preview,'Die tatsächlichen Werte entstehen beim Fusionieren.',
       'duo-fusion-help');
     }
    if(analysis.specialLv1)el('strong',preview,
      '✦ Besondere Level-1-Fusion möglich!');
     explanation.textContent='Kernmonster Lv '+rule.core+
      (rule.street?' (bei vollständiger Straße automatisch die höchste Karte)':' (frei gewählt)')+
      ' · Materialabstand '+rule.distance.toFixed(2)+
      ' · Ranggewinn '+(rule.gain>=0?'+':'')+rule.gain+
      ' · Material-/Straßenbonus +'+rule.bonus+
      (rule.resonatorAscent?' · Resonator-Kette +1 (einmalig)':'')+
      ' · maximal Lv '+(result?.resultingLevel??rule.level)+
      '. Die Vorlagen-Auswahl beschränkt sich auf freigeschaltete Fusionen dieses Levels oder darunter.';
     window.ArcaneDuoFusionGuide214?.render({details,availability,result,materials,catalog});
    }catch(e){hint.textContent=e.message;}
   };
   select.onchange=()=>update(true);
   core.onchange=()=>update(false);
   options.onchange=()=>update(false);
   update(true);
  }
  if(p.lv1?.perk){
   const state=p.lv1,free=p.field.flatMap((c,i)=>c?[]:[i]),
    openGhost=(state.ghostSlots||[]).flatMap((c,i)=>c?[]:[i]),
    stationed=(state.ghostSlots||[]).flatMap((c,i)=>c?[{c,i}]:[]);
   const lv=section(dock,'✧ Verbotene Forschung · Level-1-Schwarm',
    'In den Geisterzonen kannst du zusätzliche Monster schützen und einsetzen. '+
    'Das Verlegen kostet ihre Aktion. Geisterfunken zählen beim Fusionieren als Level 2.');
   if(free.length&&state.offers?.length){
    const box=el('div',lv,undefined,'duo-choices');
    const offer=selector('Schwarm-Echo',state.offers.map((id,i)=>
     [i,name(id)+' · Effektlose Lv1-Kopie']),box);
    const target=selector('Freies Feld',free.map(i=>[i,'Feld '+(i+1)]),box);
    button('Echo kostenlos beschwören',box,()=>send({type:'lv1UseOffer',
     index:Number(offer.value),slot:Number(target.value)}));
   }
   if(free.length&&state.choices?.length){
    const box=el('div',lv,undefined,'duo-choices');
    const floating=selector('Floating-Auslöser',state.choices.map((id,i)=>
     [i,name(id)]),box);
    const kind=selector('Belohnung',[['echo','Effektloses Lv1-Echo'],
     ['deck','Echtes zufälliges Lv1 aus Deck']],box);
    const target=selector('Freies Feld',free.map(i=>[i,'Feld '+(i+1)]),box);
    button('Floating-Effekt nutzen',box,()=>send({type:'lv1Floating',
     index:Number(floating.value),kind:kind.value,slot:Number(target.value)}));
   }
   if(openGhost.length){
    const movables=p.field.flatMap((c,slot)=>c&&!c.used&&!c.switched&&
     c.lv1MovedTurn!==game.turn?[{c,slot}]:[]);
    if(movables.length){const box=el('div',lv,undefined,'duo-choices');
     const monster=selector('Monster verlegen',movables.map(x=>
      [x.slot,'Feld '+(x.slot+1)+' · '+name(x.c.id)]),box);
     const zone=selector('Freie Geisterzone',openGhost.map(i=>[i,'Zone '+(i+1)]),box);
     button('In Geisterzone verlegen',box,()=>send({type:'lv1Station',
      slot:Number(monster.value),ghostSlot:Number(zone.value)}));
    }
   }
   if(stationed.length){
    const available=stationed.filter(x=>!x.c.used&&!x.c.switched&&
     x.c.lv1MovedTurn!==game.turn);
    if(available.length){const box=el('div',lv,undefined,'duo-choices');
     const monster=selector('Geistermonster',available.map(x=>
      [x.i,'Zone '+(x.i+1)+' · '+name(x.c.id)]),box);
     button('Geisterposition wechseln',box,()=>send({type:'lv1GhostSwitch',
      ghostSlot:Number(monster.value)}));
     if(free.length){const target=selector('Rückkehrfeld',free.map(i=>
      [i,'Feld '+(i+1)]),box);
      button('Aus der Geisterzone zurückholen',box,()=>send({type:'lv1Return',
       ghostSlot:Number(monster.value),slot:Number(target.value)}));
     }
    }
   }
  }
  const switchables=p.field.flatMap((c,slot)=>c&&!c.used&&!c.switched&&
   !(c.essenceAttacks>0)?[{c,slot}]:[]);
  if(switchables.length){
   const part=section(dock,'🛡 Position wechseln','Ein Positionswechsel ist pro Monster und eigenem Zug möglich.');
   const which=selector('Eigenes Monster',switchables.map(x=>[x.slot,
    'Feld '+(x.slot+1)+' · '+name(x.c.id)+' → '+(x.c.mode==='def'?'ATK':'DEF')]),part);
   button('Position ändern',part,()=>send({type:'switch',slot:Number(which.value)}));
  }
  const predators=p.field.flatMap((c,slot)=>c&&c.id===p.essence?.chosen&&
   card(c.id).essenceSchool==='predator'&&c.mode==='atk'?[{c,slot}]:[]);
  if(predators.length){
   const part=section(dock,'✦ Reißzahn · Angriffswahl',
    'Entscheide vor dem ersten Angriff: einmal mit 100 % oder zweimal mit je 70 % Stärke. '+
    'Zwei Angriffe verbrauchen auch zweimal ATK durch Angriffsmüdigkeit.');
   for(const {c,slot}of predators){
    const mode=c.essenceChoice===2?1:2;
    const b=button('Feld '+(slot+1)+' · '+(mode===2?'2 × 70 % wählen':'1 × 100 % wählen'),
     part,()=>send({type:'essencePredatorMode',slot,mode}));
    b.disabled=busy||!!syncError||c.used||(c.essenceAttacks||0)>0||
     c.essenceLastToggle===p.ownTurns;
   }
  }
  // Soul actions are hosted by the selected card inspector (v20.7.1).
  if(legal.attackers.length){
   const part=section(dock,'⚔ Angriff','Gegnerische Monster blockieren direkte Angriffe.');
   const row=el('div',part,undefined,'duo-choices');
   const attack=selector('Angreifer',legal.attackers.map(x=>[
    (x.area||'field')+':'+x.slot,
    (x.area==='ghost'?'Geisterzone ':'Feld ')+(x.slot+1)+' · '+format(x.card)]),row);
   attack.dataset.ad187Source='true';
   const target=selector('Ziel',legal.targets.length?
    legal.targets.map(x=>[x.seat+':'+(x.area||'field')+':'+x.slot,
     x.name+' · '+(x.area==='ghost'?'Geisterzone ':'Feld ')+(x.slot+1)+
     ' · '+format(x.card)]):[['direct','Direkt gegen Team-LP']],row);
   target.dataset.ad187Target='true';
   const attackCommit=button('Angriff bestätigen',part,()=>{
    const src=legal.attackers.find(x=>(x.area||'field')+':'+x.slot===attack.value);
    const dst=target.value==='direct'?null:
     legal.targets.find(x=>x.seat+':'+(x.area||'field')+':'+x.slot===target.value);
    send(choices.attackCommand(src,dst));
   });
   attackCommit.dataset.ad187Commit='true';
  }
  button('Zug beenden →',el('div',dock,undefined,'duo-actions-footer'),
   ()=>send({type:'end'}));
  window.ArcaneDuoCombatFlow186?.enhance?.({dock,roomId,seat,game});
  window.ArcaneDuoDirectCards187?.enhance?.({game,seat,legal,dock,catalog,busy,syncError});
  window.ArcaneDuoFusion188?.enhance?.({game,seat,roomId,dock,send,busy,syncError});
  window.ArcaneDuoSummon189?.enhance?.({game,seat,legal,dock,catalog,busy,syncError});
  window.ArcaneDuoUX204?.decorate?.({game,seat,roomId,catalog,send});
 }
 function dismissInvitation(){
  const dialog=$('duoInviteDialog');
  dialog.hidden=true;dialog.dataset.mode='';
 }
 function showInvitation(mode,inviterName,chapter){
  if(!nameConfirmed)return;
  const dialog=$('duoInviteDialog'),identity=mode+':'+chapter+':'+inviterName;
  if(!dialog.hidden&&dialog.dataset.identity===identity)return;
  dialog.dataset.mode=mode;dialog.dataset.identity=identity;dialog.hidden=false;
  $('duoInviteTitle').textContent=inviterName+' lädt dich zu einem Duell ein';
  $('duoInviteInfo').textContent='Kapitel '+chapter+' · Du und dein Partner gegen zwei KIs.';
  $('duoInviteError').textContent='';
  $('duoInviteAccept').disabled=false;$('duoInviteDecline').disabled=false;
  $('duoInviteAccept').textContent='Beitreten';
  $('duoInviteAccept').onclick=async()=>{
   $('duoInviteAccept').disabled=true;
   if(mode==='join'){
    if(await joinRoom(joinIntent.id,joinIntent.secret)){
     joinIntent=null;invitePreview=null;dismissInvitation();
    }else{
     $('duoInviteError').textContent=$('duoStatus').textContent;
     $('duoInviteAccept').disabled=false;
    }
   }else{
    await send({type:'acceptNextChapter'});
    if(game?.status==='active')dismissInvitation();
    else{$('duoInviteError').textContent=$('duoStatus').textContent;
     $('duoInviteAccept').disabled=false;}
   }
  };
  $('duoInviteDecline').onclick=async()=>{
   $('duoInviteDecline').disabled=true;
   if(mode==='join'){
    joinIntent=null;invitePreview=null;dismissInvitation();
    history.replaceState(null,'',ownOrigin());
    set('duoStatus','Einladung abgelehnt. Du kannst weiterhin dein Profil verwalten.');
    render();
   }else{
    await send({type:'declineNextChapter'});
    if(game?.status==='finished')dismissInvitation();
    else{$('duoInviteError').textContent=$('duoStatus').textContent;
     $('duoInviteDecline').disabled=false;}
   }
  };
 }
 async function requestInvite(){
  if(!joinIntent||!nameConfirmed)return;
  if(!invitePreview){
   try{invitePreview=await call({type:'invitePreview',roomId:joinIntent.id,invite:joinIntent.secret});}
   catch(e){set('duoStatus','Einladung kann nicht geöffnet werden: '+e.message);
    joinIntent=null;history.replaceState(null,'',ownOrigin());return;}
  }
  showInvitation('join',invitePreview.inviterName,invitePreview.chapter);
 }
 async function confirmDuoName(){
  if(inviteRequested)return;
  const nickname=$('duoNameInput').value.trim();
  if(nickname.length<2||nickname.length>32){
   $('duoNameHint').textContent='Bitte 2–32 Zeichen für deinen Spielernamen eingeben.';return;
  }
  inviteRequested=true;$('duoNameConfirm').disabled=true;
  try{
   if(!duoProfile)await createDuoProfile(nickname);
   else if(duoProfile.nickname!==nickname)
    await profileOperation('profileName',{name:nickname});
   if(!duoProfile||duoProfile.nickname!==nickname){
    $('duoNameHint').textContent='Profilname konnte nicht gespeichert werden. Bitte erneut versuchen.';
    return;
   }
   nameConfirmed=true;$('duoNameGate').hidden=true;$('duoPage').inert=false;
   $('duoHostName').value=duoProfile.nickname;
   $('duoHostName').readOnly=true;
   render();
   if(joinIntent)await requestInvite();
  }finally{inviteRequested=false;$('duoNameConfirm').disabled=false;}
 }
 async function init(){
  try{
   const response=await fetch('assets/duo-card-catalog-v160.json?v=20261029-v2071-final');
   if(!response.ok)throw Error('Kartenkatalog fehlt.');
   const snapshot=await response.json();
   if(snapshot.schema!==1||snapshot.cards.length<400)throw Error('Kartenkatalog unvollständig.');
   catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
   fateIds=[...(snapshot.fateIds||[])];fateNames=[...(snapshot.fateNames||[])];
   readProfile(snapshot);
  }catch(e){set('duoDeckInfo','Karten konnten nicht geladen werden: '+e.message);return;}
  for(const c of rules.ENCOUNTERS){
   const o=el('option',$('duoChapter'),(c.id>=11?'Fanatiker '+(c.id-10):c.id)+' · '+c.name);
   o.value=c.id;
  }
  $('duoChapter').onchange=updateChapter;
  $('duoEntry').onchange=()=>{
   const entry=$('duoEntry').value;
   if(entry==='quest'&&Number($('duoChapter').value)<11)$('duoChapter').value='11';
   if(entry!=='quest'&&Number($('duoChapter').value)>=11)$('duoChapter').value='1';
   updateChapter();
  };
  updateChapter();
  $('duoNameConfirm').onclick=confirmDuoName;
  $('duoNameInput').addEventListener('keydown',e=>{if(e.key==='Enter')void confirmDuoName();});
  $('duoNameConfirm').disabled=true;
  $('duoCreate').onclick=createRoom;
  $('duoRefresh').onclick=refresh;
   $('duoRecoveryCopy').onclick=copyRecovery;
   $('duoProfileCreate').onclick=createDuoProfile;
   $('duoProfileBackup').onclick=backupProfile;
   $('duoProfileReload').onclick=fetchProfile;
   $('duoProfileContinue').onclick=()=>continueLastRoom();
   $('duoProfileUpgrade').onclick=()=>profileOperation('upgrade',
    {key:$('duoProfilePerk').value});
   $('duoChapterCardClaim').onclick=()=>profileOperation('chapterCard',{});
   $('duoBalancePack').onchange=updatePacingGoal;
   $('duoProfileBuyPack').onclick=()=>profileOperation('pack',
    {pack:$('duoProfilePack').value});
   $('duoProfileDeckZone').onchange=deckEditor;
   $('duoResearchLv1Buy').onclick=()=>profileOperation('research',{branch:'lv1'});
   $('duoResearchEssenceBuy').onclick=()=>profileOperation('research',{branch:'essence'});
   $('duoEssenceBindSave').onclick=()=>profileOperation('bindEssence',{
    cardId:Number($('duoEssenceBindCard').value)});
   $('duoCollectionFilter').onchange=renderCollectionTable;
   $('duoCollectionSearch').oninput=renderCollectionTable;
   $('duoCollectionOnlySpare').onchange=renderCollectionTable;
   $('duoCardEnhanceSelect').onchange=updateCollectionOffers;
   $('duoCardRecycleSelect').onchange=()=>{
    $('duoCardRecycleConfirm').checked=false;updateCollectionOffers();
   };
   $('duoCardRecycleConfirm').onchange=updateCollectionOffers;
   $('duoCardEnhanceBuy').onclick=()=>profileOperation('enhance',{
    cardId:Number($('duoCardEnhanceSelect').value)});
   $('duoCardRecycleApply').onclick=()=>{
    if(!$('duoCardRecycleConfirm').checked)return;
    $('duoCardRecycleConfirm').checked=false;
    profileOperation('recycle',{cardId:Number($('duoCardRecycleSelect').value)});
   };
   $('duoProfileDeckSave').onclick=()=>profileOperation('deckReplace',{
    zone:$('duoProfileDeckZone').value,
    slot:Number($('duoProfileDeckSlot').value),
    cardId:Number($('duoProfileDeckCard').value)});
  $('duoCopy').onclick=()=>navigator.clipboard.writeText($('duoInvite').value)
   .then(()=>set('duoStatus','Einladungslink kopiert.'))
   .catch(()=>set('duoStatus','Bitte den Link im Eingabefeld manuell kopieren.'));
  let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}
  catch{set('duoStatus','Ungültiger URL-Code.');}
  if(hash.startsWith('duoprofile=')){
   const recovered=hash.slice('duoprofile='.length);
   if(/^[a-f0-9]{64}$/.test(recovered)){
    duoProfileToken=recovered;
    const response=await call({type:'profile',profileToken:duoProfileToken}).catch(e=>{
     set('duoProfileMessage','Privater Profilzugang ungültig: '+e.message);return null;
    });
    if(response){
     persistProfileToken(duoProfileToken);installProfile(response);
     history.replaceState(null,'',ownOrigin());
    }
   }else set('duoProfileMessage','Ungültiger 2v2-Profil-Link.');
  }else{
   try{
    duoProfileToken=localStorage.getItem(duoProfileKey)||'';
    if(!/^[a-f0-9]{64}$/.test(duoProfileToken))duoProfileToken='';
    if(duoProfileToken)await fetchProfile();
   }catch{duoProfileToken='';}
  }
  if(hash.startsWith('join=')){
   const raw=hash.slice(5),i=raw.lastIndexOf('.'),id=raw.slice(0,i),secret=raw.slice(i+1);
   if(i>0&&/^[a-f0-9-]{36}$/.test(id)&&/^[a-f0-9]{64}$/.test(secret)){
    joinIntent={id,secret};
    $('duoAccept').onclick=()=>requestInvite();
    set('duoStatus','Einladung erkannt. Namen eingeben und Einladung bestätigen.');
   }else set('duoStatus','Ungültige Einladung.');
  }else if(recovery.parse(hash)?.kind==='resume'){
   const ref=recovery.parse(hash);
   try{
    const response=await call({type:'state',roomId:ref.roomId,token:ref.token});
    if(![0,2].includes(response.seat))throw Error('Sitzplatz nicht bestätigt.');
    roomId=ref.roomId;token=ref.token;seat=response.seat;invite='';
    load(response);
    history.replaceState(null,'',ownOrigin()+'#room='+roomId);
    set('duoStatus','Willkommen zurück! Du kannst weiterspielen.');
   }catch(e){set('duoStatus','Wiederherstellung fehlgeschlagen: '+e.message);}
  }else if(recovery.parse(hash)?.kind==='room'){
   const id=recovery.parse(hash).roomId;
   try{
    const stored=JSON.parse(sessionStorage.getItem(key(id))||'null');
    if(/^[a-f0-9]{64}$/.test(stored?.token||'')&&[0,2].includes(stored?.seat)){
     roomId=id;token=stored.token;seat=stored.seat;invite=stored.invite||'';
     await refresh();
    }else if(duoProfileToken)await continueLastRoom(id);
    else set('duoStatus','Bitte das persönliche 2v2-Profil wiederherstellen.');
   }catch{set('duoStatus','Raumzugang konnte nicht wiederhergestellt werden.');}
  }else if(!hash&&duoLastRoom?.roomId&&duoProfileToken){
   await continueLastRoom(duoLastRoom.roomId);
  }
  $('duoNameConfirm').disabled=false;
  $('duoNameInput').focus();
  render();
 }
 init();
 window.addEventListener('online',()=>{if(roomId)refresh();});
 window.addEventListener('offline',()=>{
  if(roomId){syncError='Keine Internetverbindung';render();}
 });
 window.addEventListener('focus',()=>{if(roomId)refresh();});
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&roomId)refresh();
 });
 setInterval(()=>{
   if(document.visibilityState==='hidden'||busy||!roomId||!token)return;
   if(navigator.onLine===false)return;
   if(Date.now()-lastPollAt>=recovery.pollDelay(syncFailures))refresh();
  },2500);
})();
