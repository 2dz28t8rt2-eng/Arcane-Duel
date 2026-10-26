/* Online 2v2 beta: own real singleplayer deck, canonical card art, explicit
 * fusion/attack/position controls, server-owned state and private hands.
 * This intentionally does NOT modify the user's singleplayer save.
 */
'use strict';
(()=>{
 const api='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
 const $=id=>document.getElementById(id),rules=window.ArcaneDuoRules,
  choices=window.ArcaneDuoBattleUI,recovery=window.ArcaneDuoRecovery168;
 const key=id=>'arcane-duo-v2-session-'+id;
 const ownOrigin=()=>location.href.split('#')[0].split('?')[0];
 let catalog={},starterMain=[],starterFusions=[],fateIds=[],fateNames=[],profileDeck=[],profileFusions=[],
  profileUpgrades={},profileEnhancements={},profileEssence={},profileLv1={};
 let game=null,seat=-1,roomId='',token='',invite='',busy=false,refreshing=false,
  syncError='',syncedAt=0,sessionReady=true,syncFailures=0,lastPollAt=0;
 const set=(id,text)=>$(id).textContent=String(text);
 const card=id=>catalog[id]||{name:'Karte '+id,level:'?',atk:'?',def:'?',role:'?'};
 const name=id=>card(id).name;
 const fateIndex=id=>fateIds.indexOf(id);
 const displayName=c=>c?.fate?'✦ '+(fateNames[fateIndex(c.id)]||'Schicksalsmonster'):name(c.id);
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
 const chapter=()=>rules.CHAPTERS.find(c=>c.id===Number($('duoChapter').value))||rules.CHAPTERS[0];
 function updateChapter(){
  const entry=$('duoEntry').value;
  $('duoChapterSelect').hidden=entry!=='chapter';
  const chosen=entry==='new'?rules.CHAPTERS[0]:chapter();
  $('duoCreate').textContent=entry==='new'?'Neue Kampagne erstellen':'Kapitel '+chosen.id+' starten';
  set('duoChapterInfo','Kapitel '+chosen.id+' · '+chosen.name+
   '. Je drei Leihkarten auf Level '+chosen.level+' ersetzen vorhandene Deckplätze.');
 }
 function readProfile(snapshot){
  starterMain=[...snapshot.starterMain];starterFusions=[...snapshot.starterFusions];
  profileDeck=[...starterMain];profileFusions=[...starterFusions];
  profileUpgrades={};profileEnhancements={};profileEssence={};profileLv1={};
  let message='Noch kein Singleplayer-Spielstand in diesem Browser gefunden. '+
   'Für die Beta wird ein gültiges Standarddeck verwendet.';
  try{
   const raw=localStorage.getItem('arcane-duel-rpg-profile-v4-reborn');
   if(raw){
    const p=JSON.parse(raw);
    if(rules.validDeck(p.activeDeck,catalog)&&rules.validDeck(p.fusionDeck,catalog,true)){
     profileDeck=[...p.activeDeck];profileFusions=[...p.fusionDeck];
     for(const [key,max]of Object.entries(rules.PERK_LIMITS)){
      const rank=p.upgrades?.[key];
      if(Number.isInteger(rank)&&rank>=0&&rank<=max)profileUpgrades[key]=rank;
     }
     const used=new Set([...profileDeck,...profileFusions]);
     for(const [key,rank]of Object.entries(p.enhancements||{})){
      if(used.has(Number(key))&&Number.isInteger(rank)&&rank>=1&&rank<=5)
       profileEnhancements[key]=rank;
     }
     if(p.essence?.chosen!==null&&p.essence?.chosen!==undefined&&
      profileDeck.includes(p.essence.chosen)&&catalog[p.essence.chosen]?.essenceMonster){
      const tier=Math.max(0,...(Array.isArray(p.cleared)?p.cleared:[]));
      profileEssence={chosen:p.essence.chosen,school:p.essence.school??null,
       tier,rank:p.essence.rank??0};
     }
     if(p.lv1Saga?.perk===true){profileLv1={perk:true,
      rank:Number.isInteger(p.lv1Saga.skillRank)?p.lv1Saga.skillRank:1};}
     rules.normalizedBuild(profileUpgrades,profileEnhancements,profileDeck,
      profileFusions,catalog,profileEssence,profileLv1);
     const active=Object.values(profileUpgrades).filter(Boolean).length;
     message='✓ Einzelspieler-Deck übernommen: 40 Hauptkarten, '+
      profileFusions.length+' Fusionen, '+active+' aktive Kampf-Ausbauten und '+
      Object.keys(profileEnhancements).length+' Kartenverstärkungen. '+
      (profileEssence.chosen!==undefined?'Essenzbindung aktiv. ':'')+
      (profileLv1.perk?'Verbotene Forschung Rang '+profileLv1.rank+' aktiv. ':'')+
      'Diese Beta liest die Ränge nur beim Raumbeitritt; dein Spielstand bleibt unverändert.';
    }else message='Das gespeicherte Deck entspricht nicht den gültigen Karten-/Kopienregeln. '+
      'Die Beta nutzt ein Standarddeck; deine Sammlung bleibt unverändert.';
   }
  }catch{
   profileDeck=[...starterMain];profileFusions=[...starterFusions];
   profileUpgrades={};profileEnhancements={};profileEssence={};profileLv1={};
   message='Lokaler Spielstand beziehungsweise Essenzbindung nicht verwendbar. '+
    'Sicheres Standarddeck aktiv; nichts überschrieben.';
  }
  set('duoDeckInfo',message);
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
  window.ArcaneDuoCinematics167?.onState(previous,game);
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
    !(action.type==='nextChapter'&&seat===0&&game.winner===0))return;
  busy=true;render();let conflicted=false;
  try{
   load(await call({type:'action',roomId,token,expectedRevision:game.revision,action}));
   set('duoStatus','Zug gespeichert und online synchronisiert.');
  }catch(e){
   syncError=e.message;conflicted=recovery.isConflict(e.message);
   set('duoStatus',e.message);
  }finally{busy=false;render();}
  if(conflicted){
   await refresh();
   if(!syncError)set('duoStatus','Ein anderer Zug war schneller. Stand aktualisiert – bitte erneut entscheiden.');
  }
 }
 async function createRoom(){
  if(busy)return;busy=true;
  try{
   const entry=$('duoEntry').value;
   const payload={type:'create',name:$('duoHostName').value,entry,
    deck:profileDeck,fusions:profileFusions,
    upgrades:profileUpgrades,enhancements:profileEnhancements,
    essence:profileEssence,lv1:profileLv1,
    ...(entry==='chapter'?{chapter:chapter().id}:{})};
   const r=await call(payload);
   roomId=r.roomId;token=r.token;seat=0;invite=r.invite;save();load(r);
   location.hash='room='+roomId;
   set('duoStatus','Online-Raum erstellt. Versende den Einladungslink.');
  }catch(e){set('duoStatus',e.message);}
  finally{busy=false;render();}
 }
 async function joinRoom(id,invitation){
  if(busy)return;busy=true;
  try{
   const r=await call({type:'join',roomId:id,invite:invitation,
    name:$('duoHostName').value,deck:profileDeck,fusions:profileFusions,
    upgrades:profileUpgrades,enhancements:profileEnhancements,
    essence:profileEssence,lv1:profileLv1});
   roomId=id;token=r.token;seat=2;invite='';save();load(r);
   location.hash='room='+roomId;
   set('duoStatus','Beitritt erfolgreich. Jetzt kämpft ihr gemeinsam!');
  }catch(e){set('duoStatus',e.message);}
  finally{busy=false;render();}
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
 const format=c=>displayName(c)+' · Lv '+c.level+' · '+c.atk+'/'+c.def+
  ' · '+(c.mode==='def'?'DEF':'ATK')+(c.soul?' · ✦ '+c.soul+' Seele':'');
 function updateSaveState(){
  const node=$('duoSaveState');if(!node)return;
  node.dataset.sync=syncError?'offline':syncedAt?'saved':'pending';
  node.textContent=syncError?'⚠ Synchronisierung: '+syncError+
   ' · Verbindung wiederherstellen oder aktualisieren.':
   syncedAt?'☁ Server bestätigt · '+new Date(syncedAt).toLocaleTimeString('de-AT')+
    (sessionReady?'':' · Raumzugang nicht im Tab gespeichert.'):
   '☁ Online-Spielstand wird nach jedem bestätigten Zug gespeichert.';
 }
 function render(){
  const dock=$('duoActions'),track=$('duoTrack'),seats=$('duoSeats'),log=$('duoLog');
  for(const n of [dock,track,seats,log])n.replaceChildren();
  $('duoCreate').hidden=!!roomId||location.hash.startsWith('#join=');
  $('duoCreate').disabled=busy||!Object.keys(catalog).length;
  $('duoAccept').hidden=!!roomId||!location.hash.startsWith('#join=');
  $('duoAccept').disabled=busy||!Object.keys(catalog).length;
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
    'Einladung annehmen, um mitzuspielen.':'Noch kein Online-Raum');
   return;
  }
  set('duoRoomId',roomId);
  $('duoRecoveryArea').hidden=![0,2].includes(seat);
  set('duoAlliedLP',game.teams[0].lp.toLocaleString('de-AT')+' LP'+
   (game.teams[0].shield?' · 🛡 '+game.teams[0].shield+' Schild':''));
  set('duoEnemyLP',game.teams[1].lp.toLocaleString('de-AT')+' LP');
  set('duoTurnName',game.status==='waiting'?'Warte auf deinen Partner':
   game.status==='finished'?(game.winner===0?'Gemeinsamer Sieg!':'Gemeinsame Niederlage'):
   'Runde '+game.round+' · '+game.players[game.activeSeat].name+' am Zug');
  if(game.ruleset==='duo-v166'){
   const arena=game.round<=9?'Arena-Zerfall ab Runde 10':
    'Arena-Zerfall: '+rules.arenaDamage(game,game.round).toLocaleString('de-AT')+
    ' LP pro Team nach dieser Runde · Schild schützt nicht';
   el('p',track,'☄ '+arena,'duo-arena-forecast');
   if(game.fateEvent)el('p',track,'✦ Schicksalszug von '+
    game.players[game.fateEvent.ownerSeat].name+' in Runde '+game.fateEvent.round+
    ' – fünf temporäre Schicksalsmonster!','duo-fate-banner');
  }
  const reward=rules.packIds(catalog,game.chapter);
  set('duoCurrentReward','Kapitel '+game.chapter+' · Bonuskarten: '+reward.map(name).join(' · '));
  for(const p of game.players){
   el('span',track,p.name,'turn-seat '+(p.team===1?'enemy ':'')+
    (game.status==='active'&&game.activeSeat===p.seat?'current':''));
   const panel=el('article',seats,undefined,'seat '+(game.activeSeat===p.seat?'active':''));
   panel.dataset.seat=String(p.seat);
   el('h3',panel,p.name);
   el('small',panel,p.hand.length+' Handkarten · '+p.deck.length+' im Hauptdeck · '+
    p.remainingFusion.length+' Fusionen verbleibend');
   if(p.team===0){
    const buffs=Object.entries(p.upgrades||{}).filter(([,rank])=>rank>0);
    el('small',panel,buffs.length?
     '✧ '+buffs.map(([key,rank])=>({
      power:'Training',jagdinstinkt:'Jagdinstinkt',schildwall:'Schildwall',
      resilience:'Standhaftigkeit',combatDiscipline:'Kampfdisziplin',
      fusionLore:'Fusionskunde',fusionPrecision:'Runenpräzision',
      openingAegis:'Vorhut-Schutz'}[key]||key)+' '+rank).join(' · '):
     '✧ Keine aktiven Kampf-Ausbauten','duo-perk-note');
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
    el('small',cell,'Lv '+c.level+' · '+c.atk+' ATK / '+c.def+' DEF',
     'duo-field-meta');
    el('small',cell,(c.mode==='def'?'🛡 DEF':'⚔ ATK')+
     (c.fusion?' · Fusion':'')+' · '+c.role,'duo-card-level');
    if(c.role==='soul')el('small',cell,'✦ '+(c.soul||0)+' Seele · '+
     (c.condensed||0)+' Verdichtung · CD '+(c.soulCooldown||0),
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
    if(c.lv1Echo)el('small',cell,'◇ Effektloses Lv1-Echo','duo-soul-status');
    if(card(c.id).lv1Special&&p.lv1?.perk)el('small',cell,
     '✦ '+card(c.id).lv1Special.toUpperCase(),'duo-soul-status');
    if(c.role==='combatant'&&c.resonance)el('small',cell,
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
     el('small',cell,'Zone '+(i+1)+' · Lv '+c.level+' · '+c.atk+'/'+c.def+
      ' · '+(c.mode==='def'?'DEF':'ATK'));
    });
    if(p.lv1.choices?.length||p.lv1.offers?.length)el('small',reserve,
     (p.lv1.choices?.length||0)+' Floating-Wahlen · '+
     (p.lv1.offers?.length||0)+' Schwarm-Echos bereit');
   }
  }
  for(const line of [...game.log].slice(-10).reverse())el('li',log,line);
  if(game.status!=='active'){
   if(game.status==='finished'&&game.winner===0&&game.chapter<4){
    if(seat===0)button('✦ Kapitel '+(game.chapter+1)+' starten',
     dock,()=>send({type:'nextChapter'}));
    else el('p',dock,'Kapitel gewonnen. Der Gastgeber startet das nächste.');
   }else el('p',dock,game.status==='waiting'?'Warte auf den Partner.':
    game.winner===0?'Alle Kapitel geschafft!':'Partie beendet.');
   return;
  }
  if(game.activeSeat!==seat){
   el('p',dock,game.activeSeat%2===1?'Die Gegner-KI führt ihren Zug aus.':
    'Dein Partner ist gerade am Zug.','duo-turn-note');
   return;
  }
  const p=game.players[seat],legal=choices.legalChoices(game,seat);
  el('p',dock,'Dein Zug: Beschwöre, fusioniere, wechsle die Position oder greife an.',
   'duo-turn-note');
  if(legal.hand.length){
   const part=section(dock,'✦ Beschwörung','Ein reguläres Monster pro Zug oder stattdessen eine Fusion.');
   const row=el('div',part,undefined,'duo-choices');
   const hand=selector('Handkarte',legal.hand.map(x=>[x.index,
    displayName(x)+' · Lv '+card(x.id).level+
    (x.fate?' · '+x.atk+'/'+x.def+' · unverschmelzbar':'')]),row);
   const slot=selector('Freier Feldplatz',legal.freeSlots.map(i=>[i,'Feld '+(i+1)]),row);
   button('Monster beschwören',part,()=>send({type:'summon',
    handIndex:Number(hand.value),slot:Number(slot.value)}));
  }
  if(!p.summoned&&p.remainingFusion.length>=1){
   const part=section(dock,'✦ Fusion','2–5 eigene Hand-/Feld-/Geistermonster auswählen (Strg-Klick für Mehrfachauswahl). '+
    'Du kannst ein Kernmonster bestimmen; die Vorschau erklärt den Würfelbonus vor der Fusion.');
   const select=el('select',part,undefined,'duo-fusion-list');
   select.multiple=true;select.size=7;select.setAttribute('aria-label','Fusionsmaterialien');
   p.hand.forEach((item,i)=>{if(item?.fate)return;
    const id=typeof item==='number'?item:item.id;
    const opt=el('option',select,'Hand '+(i+1)+' · '+
     name(id)+' · Lv '+card(id).level);opt.value='hand:'+i;});
   p.field.forEach((c,i)=>{if(!c||c.fate)return;const opt=el('option',select,
    'Feld '+(i+1)+' · '+displayName(c)+' · Lv '+c.level);opt.value='field:'+i;});
   if(p.lv1?.perk){
    (p.lv1.ghostSlots||[]).forEach((c,i)=>{if(!c)return;
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
   const hint=el('p',part,'Bitte 2–5 Materialien auswählen.','duo-action-status');
   const preview=el('div',part,undefined,'duo-fusion-preview');
   const details=el('details',part,undefined,'duo-fusion-details');
   el('summary',details,'Warum entsteht dieses Level?');
   const explanation=el('p',details);
   const commit=button('Ausgewählte Monster fusionieren',part,()=>send({
    type:'fusion',materials:selected(),slot:Number(target.value),
    templateId:Number(options.value),coreIndex:Number(core.value)}));
   const selected=()=>[...select.selectedOptions].map(opt=>{
    const [from,index]=opt.value.split(':');return {from,index:Number(index)};
   });
   const update=(reset=true)=>{
    const keepTemplate=reset?null:options.value;
    const keepCore=reset?null:core.value;
    options.replaceChildren();target.replaceChildren();core.replaceChildren();
    preview.replaceChildren();explanation.textContent='';
    const materials=selected();commit.disabled=true;
    if(materials.length<2||materials.length>5){
     hint.textContent='Erforderlich: 2 bis 5 eigene Materialien.';return;
    }
    try{
     const sources=materials.map(m=>m.from==='charge'?
      {id:-1,level:2,role:'combatant',fusion:false}:m.from==='hand'?
      {id:p.hand[m.index],level:card(p.hand[m.index]).level}:
      m.from==='ghost'?p.lv1.ghostSlots[m.index]:p.field[m.index]);
     const initial=rules.fusionLevel(sources);
     materials.forEach((m,i)=>{
      const label=(m.from==='hand'?'Hand ':'Feld ')+(m.index+1)+
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
     hint.textContent=analysis.pattern+' · Ziellevel '+(result?.resultingLevel??rule.level)+
      ' · '+availability.templates.length+' passende Vorlagen.';
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
     for(const line of lines)el('p',preview,line);
     if(result){
      el('strong',preview,'Voraussichtliche Werte: '+
       result.atk[0]+'–'+result.atk[1]+' ATK · '+
       result.def[0]+'–'+result.def[1]+' DEF.');
      el('small',preview,'Der Server würfelt erst bei Bestätigung; '+
       'die Vorschau ist ein möglicher Bereich.','duo-fusion-help');
     }
     if(analysis.specialLv1)el('strong',preview,
      '✦ Verbotene Forschung: 3–5 echte Lv1-Materialstufen → exklusive Lv1-Fusion.');
     explanation.textContent='Kernmonster Lv '+rule.core+
      (rule.street?' (bei vollständiger Straße automatisch die höchste Karte)':' (frei gewählt)')+
      ' · Materialabstand '+rule.distance.toFixed(2)+
      ' · Ranggewinn '+(rule.gain>=0?'+':'')+rule.gain+
      ' · Material-/Straßenbonus +'+rule.bonus+
      (rule.resonatorAscent?' · Resonator-Kette +1 (einmalig)':'')+
      ' · maximal Lv '+(result?.resultingLevel??rule.level)+
      '. Die Vorlagen-Auswahl beschränkt sich auf freigeschaltete Fusionen dieses Levels oder darunter.';
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
    'Geisterzonen sind zusätzliche Kampffelder. Verlegen und zurückholen verbraucht '+
    'die Aktion des Monsters. Geisterfunken zählen als Lv2-Material, nicht als Lv1.');
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
  const souls=p.field.flatMap((c,slot)=>c?.role==='soul'&&c.mode==='def'?
   [{c,slot}]:[]);
  if(souls.length){
   const part=section(dock,'✦ Seelenzehrer','Aktive Fähigkeiten nur in DEF: Pro Monster '+
    'eine Seelenaktion je eigenem Zug. Passive Seelenentzüge erfolgen beim nächsten eigenen Zug.');
   const which=selector('Seelenzehrer',souls.map(x=>[x.slot,
    'Feld '+(x.slot+1)+' · '+name(x.c.id)+' · '+(x.c.soul||0)+' Seele']),part);
   const actions=el('div',part,undefined,'duo-soul-actions');
   const focus=selector('Entzugsfokus',[['atk','ATK bevorzugen'],['def','DEF bevorzugen']],actions);
   const focusButton=button('Fokus setzen',actions,()=>send({type:'soulFocus',
    slot:Number(which.value),stat:focus.value}));
   const condense=button('Seele verdichten (75 % → DEF)',actions,
    ()=>send({type:'soulCondense',slot:Number(which.value)}));
   const discharge=button('Seelenentladung (130 % → LP)',actions,
    ()=>send({type:'soulDischarge',slot:Number(which.value)}));
   const raidTargets=game.players.filter(x=>x.team!==p.team)
    .flatMap(x=>x.field.flatMap((c,slot)=>c?[{seat:x.seat,slot,c,name:x.name}]:[]));
   if(raidTargets.length){
    const target=selector('Raubziel',raidTargets.map(x=>[x.seat+':'+x.slot,
     x.name+' · Feld '+(x.slot+1)+' · '+format(x.c)]),actions);
    const raid=button('Gezielter Seelenraub (250 %)',actions,()=>{
     const [targetSeat,targetSlot]=target.value.split(':').map(Number);
     send({type:'soulRaid',slot:Number(which.value),targetSeat,targetSlot});
    });
    const enabled=()=>{
     const c=p.field[Number(which.value)],used=c.lastSoulAction===p.ownTurns;
     raid.disabled=used||(c.raidCooldown||0)>0||busy||!!syncError;
     condense.disabled=used||(c.soulCooldown||0)>0||(c.soul||0)<40||busy||!!syncError;
     discharge.disabled=used||(c.soul||0)<40||busy||!!syncError;
     focusButton.disabled=c.level<5||c.lastDrainSwitch===p.ownTurns||busy||!!syncError;
    };
    which.onchange=enabled;enabled();
   }else{
    const enabled=()=>{
     const c=p.field[Number(which.value)],used=c.lastSoulAction===p.ownTurns;
     condense.disabled=used||(c.soulCooldown||0)>0||(c.soul||0)<40||busy||!!syncError;
     discharge.disabled=used||(c.soul||0)<40||busy||!!syncError;
     focusButton.disabled=c.level<5||c.lastDrainSwitch===p.ownTurns||busy||!!syncError;
    };which.onchange=enabled;enabled();
   }
  }
  if(legal.attackers.length){
   const part=section(dock,'⚔ Angriff','Gegnerische Monster blockieren direkte Angriffe.');
   const row=el('div',part,undefined,'duo-choices');
   const attack=selector('Angreifer',legal.attackers.map(x=>[
    (x.area||'field')+':'+x.slot,
    (x.area==='ghost'?'Geisterzone ':'Feld ')+(x.slot+1)+' · '+format(x.card)]),row);
   const target=selector('Ziel',legal.targets.length?
    legal.targets.map(x=>[x.seat+':'+(x.area||'field')+':'+x.slot,
     x.name+' · '+(x.area==='ghost'?'Geisterzone ':'Feld ')+(x.slot+1)+
     ' · '+format(x.card)]):[['direct','Direkt gegen Team-LP']],row);
   button('Angriff bestätigen',part,()=>{
    const src=legal.attackers.find(x=>(x.area||'field')+':'+x.slot===attack.value);
    const dst=target.value==='direct'?null:
     legal.targets.find(x=>x.seat+':'+(x.area||'field')+':'+x.slot===target.value);
    send(choices.attackCommand(src,dst));
   });
  }
  button('Zug beenden →',el('div',dock,undefined,'duo-actions-footer'),
   ()=>send({type:'end'}));
 }
 async function init(){
  try{
   const response=await fetch('assets/duo-card-catalog-v160.json?v=duo-v166');
   if(!response.ok)throw Error('Kartenkatalog fehlt.');
   const snapshot=await response.json();
   if(snapshot.schema!==1||snapshot.cards.length<400)throw Error('Kartenkatalog unvollständig.');
   catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
   fateIds=[...(snapshot.fateIds||[])];fateNames=[...(snapshot.fateNames||[])];
   readProfile(snapshot);
  }catch(e){set('duoDeckInfo','Karten konnten nicht geladen werden: '+e.message);return;}
  for(const c of rules.CHAPTERS){
   const o=el('option',$('duoChapter'),c.id+' · '+c.name);o.value=c.id;
  }
  $('duoChapter').onchange=updateChapter;$('duoEntry').onchange=updateChapter;
  updateChapter();
  $('duoCreate').onclick=createRoom;
  $('duoRefresh').onclick=refresh;
   $('duoRecoveryCopy').onclick=copyRecovery;
  $('duoCopy').onclick=()=>navigator.clipboard.writeText($('duoInvite').value)
   .then(()=>set('duoStatus','Einladungslink kopiert.'))
   .catch(()=>set('duoStatus','Bitte den Link im Eingabefeld manuell kopieren.'));
  let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}
  catch{set('duoStatus','Ungültiger URL-Code.');}
  if(hash.startsWith('join=')){
   const raw=hash.slice(5),i=raw.lastIndexOf('.'),id=raw.slice(0,i),secret=raw.slice(i+1);
   if(i>0&&/^[a-f0-9-]{36}$/.test(id)&&/^[a-f0-9]{64}$/.test(secret)){
    $('duoAccept').onclick=()=>joinRoom(id,secret);
    set('duoStatus','Einladung erkannt. Namen eingeben und beitreten.');
   }else set('duoStatus','Ungültige Einladung.');
  }else if(hash.startsWith('room=')){
   const id=hash.slice(5);
   try{
    const stored=JSON.parse(sessionStorage.getItem(key(id))||'null');
    if(/^[a-f0-9]{64}$/.test(stored?.token||'')&&[0,2].includes(stored?.seat)){
     roomId=id;token=stored.token;seat=stored.seat;invite=stored.invite||'';
     await refresh();
    }
   }catch{set('duoStatus','Raumzugang konnte nicht wiederhergestellt werden.');}
  }
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
