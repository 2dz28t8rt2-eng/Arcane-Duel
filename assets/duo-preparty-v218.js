/* Arcane Duel Duo v21.8 · party formation -> shared menu -> combat.
 * UI is a thin wrapper over the existing authoritative 2v2 client.
 * No room secrets are stored outside its existing protected session handling.
 */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),api=window.ArcaneDuoParty218;
 if(!api){console.error('[Duo Party] Controller unavailable');return;}
 let lobbySection='menu',lastMode='',entered=false,resultMenu=false,menuBootstrapped=false;
 const origin=()=>location.href.split('#')[0].split('?')[0];
 const info=message=>{$('duoPartyStatus').textContent=message;};
 const select=(section)=>{
  const state=api.state();
  if(!state.game&&!state.profile||state.game&&!['waiting','lobby','party_ready','finished','inviting_next'].includes(state.game.status))return;
  if(state.game?.status==='finished')resultMenu=true;
  lobbySection=section;
  if(section==='deck'||section==='fusions'){
   $('duoProfileDeckZone').value=section==='fusions'?'fusion':'main';
   $('duoProfileDeckZone').onchange?.();
  }
  sync();
  const target={collection:'duoCollectionTotals',deck:'duoProfileDeckZone',
   profile:'duoProfileStats'}[section];
  if(target)$(target)?.scrollIntoView?.({behavior:'smooth',block:'center'});
 };
 function sync(){
  const s=api.state(),g=s.game,attached=!!g&&[0,2].includes(s.seat);
  if(s.nameConfirmed&&!menuBootstrapped&&(!s.joinIntent||attached)){
   menuBootstrapped=true;entered=true;lobbySection='menu';
  }
  const joined=attached&&g.status!=='waiting';
  const party=s.nameConfirmed&&!entered;
  const personal=s.nameConfirmed&&(attached||!!s.profile&&!s.joinIntent);
  const inMenu=!g&&!!s.profile||['waiting','lobby','party_ready'].includes(g?.status)||g?.status==='inviting_next'||g?.status==='finished'&&resultMenu;
  const menu=personal&&entered&&inMenu&&lobbySection==='menu';
  const library=personal&&entered&&inMenu&&lobbySection!=='menu';
  const battle=personal&&attached&&entered&&!inMenu;
  $('duoPartyGate').hidden=!party;
  $('duoMainMenuGate').hidden=!menu;
  $('duoPage').hidden=!(library||battle);
  $('duoPage').inert=!(library||battle);
  $('duoPage').dataset.lobbyView=library?'true':'false';
  $('duoPage').dataset.lobbySection=library?lobbySection:'';
  $('duoSoloWorkspace').hidden=!library;
  const titles={profile:'Chronik & Hinweise',shop:'Booster-Shop',
   deck:'Hauptdeck',fusions:'Fusionsdeck',collection:'Monsterwerkstatt',upgrades:'Ausbau'};
  $('duoSoloMenuTitle').textContent=titles[lobbySection]||'Dein Duellant';
  $('duoSoloMenuSubtitle').textContent='Deine Karten, Verbesserungen und Fortschritte bleiben vollständig unabhängig von deinem Partner.';
  const p=s.profile;
  $('duoSoloProfileHud').textContent=p?
   p.nickname+'  ·  Lv '+p.level+'  ·  '+p.essence+' Essenz  ·  '+p.shards+' Splitter  ·  '+p.xp+' EP':'';
  for(const id of Object.keys(titles)){
   const tabId='duoSoloTab'+id[0].toUpperCase()+id.slice(1);
   $(tabId).classList.toggle('active',library&&lobbySection===id);
  }
  $('duoReturnMenu').hidden=!library;
  const waiting=party&&g?.status==='waiting'&&s.seat===0&&!!s.invite;
  $('duoPartyWaiting').hidden=!waiting;
  $('duoPartyConfig').hidden=attached||s.joinIntent;
  $('duoPartyInviteReady').hidden=!party||!s.joinIntent||!s.joinPreview;
  if(s.joinPreview)$('duoPartyInviter').textContent=
   s.joinPreview.inviterName+' lädt dich in seine Gruppe ein · Kapitel '+s.joinPreview.chapter+'.';
  $('duoPartyAccept').disabled=s.busy||!s.profile||!s.catalogReady;
  $('duoPartyGroup').hidden=!party||!attached;
  $('duoPartyEnter').disabled=!attached||s.busy;
  if(attached){
   $('duoPartyGroupMembers').textContent=g.status==='waiting'?
    g.players[0].name+' (Party-Leiter) · Noch kein Partner beigetreten':
    g.players[0].name+' (Party-Leiter)  ✦  '+g.players[2].name+' (Mitspieler)';
  }
  $('duoPartyCreate').disabled=s.busy||!s.profile||!s.catalogReady||!!s.roomId;
  $('duoPartyResume').hidden=!!s.roomId||s.joinIntent||!s.lastRoom?.roomId;
  $('duoPartyReset').hidden=!(party&&g?.status==='waiting'&&s.seat===0);
  if(waiting){
   $('duoPartyLink').value=origin()+'?join='+s.roomId+'.'+s.invite;
   $('duoPartyCode').value=s.roomId+'.'+s.invite;
   $('duoPartyWaitLabel').textContent='Schicke den Einladungslink oder den Raumcode. Dein Partner bestätigt den Beitritt separat.';
  }
  if(party){
   const mode=s.joinIntent?'invited':g?.status==='waiting'?'waiting':'new';
   if(mode!==lastMode){
    lastMode=mode;
    info(mode==='invited'?'Einladung erkannt. Bestätige deine Einladung, um der Party beizutreten.':
     mode==='waiting'?(s.invite?'Deine Party wartet auf den Partner.':'Einladungslink fehlt nach Wiederherstellung. Erstelle eine neue Party.'):
      'Erstelle eine Party und lade deinen Mitspieler ein. Erst danach geht es ins Hauptmenü.');
   }
  }
  if(attached){
   $('duoMenuTeam').textContent=g.players[0].name+'  ✦  '+(g.status==='waiting'?'Partner wird erwartet':g.players[2].name);
   $('duoMenuStart').disabled=s.busy||g.status!=='lobby';
   $('duoMenuStart').textContent=g.status==='waiting'?'Partner noch nicht verbunden':'Duell anfragen';
   const ownRequest=g.partyStartInvite?.fromSeat===s.seat;
   $('duoMenuStatus').textContent=g.status==='party_ready'?
    (ownRequest?'Startanfrage verschickt. Dein Partner entscheidet, wann er bereit ist.':
      'Dein Partner hat eine Startanfrage geschickt. Du kannst dein Deck weiter bearbeiten.'):
    (g.status==='waiting'?'Die Gruppe ist erstellt. Lade deinen Partner über „Gruppe & Einladung“ ein.':
     'Du kannst Kapitel '+g.chapter+' anfragen oder deinen Duellanten unabhängig vorbereiten.');
  }
  const pending=g?.status==='party_ready'&&joined;
  $('duoStartNotice').hidden=!pending;
  $('duoStartAccept').hidden=!pending||s.seat!==g.partyStartInvite?.toSeat;
  $('duoStartDecline').hidden=!pending||s.seat!==g.partyStartInvite?.toSeat;
  $('duoStartCancel').hidden=!pending||s.seat!==g.partyStartInvite?.fromSeat;
  $('duoStartNoticeTitle').textContent=s.seat===g?.partyStartInvite?.fromSeat?
   'Warte auf die Zustimmung deines Partners':(g?.players[g.partyStartInvite?.fromSeat]?.name||'Dein Partner')+' lädt dich zum Duell ein';
  $('duoStartNoticeText').textContent=s.seat===g?.partyStartInvite?.fromSeat?
   'Beide können ihre Karten und Fähigkeiten weiter unabhängig verwalten.':
   'Du kannst erst dein Deck fertigstellen und dann zustimmen oder die Anfrage ablehnen.';
  // Do not show the legacy room-creation panel inside the actual game.
  $('duoSetupPanel').hidden=attached;
  if(g?.status==='active')resultMenu=false;
  window.ArcaneDuoSolo221?.sync?.({entered,lobbySection,inMenu,menu,library,battle});
 }
 function moveChapterControls(){
  const target=$('duoPartyChapterControls');
  if(target.childElementCount)return;
  for(const id of ['duoEntry','duoChapter']){
   const field=$(id);
   if(field?.closest('label'))target.append(field.closest('label'));
  }
  for(const id of ['duoQuestInfo','duoChapterInfo']){
   if($(id))target.append($(id));
  }
 }
 async function copyInvite(){
  const value=$('duoPartyLink').value;
  if(!value){info('Einladungslink nicht verfügbar.');return;}
  try{await navigator.clipboard.writeText(value);info('Einladungslink kopiert. Schicke ihn an deinen Partner.');}
  catch{$('duoPartyLink').focus();$('duoPartyLink').select();info('Link im Eingabefeld markieren und manuell kopieren.');}
 }
 moveChapterControls();
 $('duoPartyCreate').onclick=async()=>{
  info('Party wird erstellt …');
  await api.createRoom();
  if(!api.state().roomId)info($('duoStatus').textContent||'Party konnte nicht erstellt werden.');
  sync();
 };
 $('duoPartyAccept').onclick=async()=>{
  $('duoPartyAccept').disabled=true;info('Du trittst der Gruppe bei …');
  try{
   const accepted=await api.acceptPendingInvite();
   if(accepted)info('Erfolgreich beigetreten! Du kannst jetzt „Spiel betreten“ wählen.');
   else info($('duoStatus').textContent||'Der Beitritt konnte nicht abgeschlossen werden.');
  }catch(e){info('Beitritt fehlgeschlagen: '+e.message);}
  finally{sync();}
 };
 $('duoPartyDecline').onclick=()=>{api.declinePendingInvite();lastMode='';sync();};
 $('duoPartyEnter').onclick=()=>{
  if(!api.state().game)return;
  entered=true;lobbySection='menu';sync();
 };
 $('duoMenuParty').onclick=()=>{entered=false;sync();};
 $('duoPartyCopy').onclick=copyInvite;
 $('duoPartyCopyCode').onclick=async()=>{
  const value=$('duoPartyCode').value;
  if(!value){info('Raumcode noch nicht verfügbar.');return;}
  try{await navigator.clipboard.writeText(value);info('Raumcode kopiert. Dein Partner kann ihn im Beitrittsfeld einfügen.');}
  catch{$('duoPartyCode').select();info('Bitte den Raumcode aus dem Feld manuell kopieren.');}
 };
 $('duoJoinManual').onclick=async()=>{
  const button=$('duoJoinManual');button.disabled=true;
  info('Einladung wird geprüft …');
  try{
   await api.pasteInvite($('duoJoinValue').value);
   info('Einladung gültig. Klicke auf „Gruppe beitreten“.');
  }catch(e){info('Beitritt nicht möglich: '+e.message);}
  finally{button.disabled=false;sync();}
 };
 $('duoJoinValue').addEventListener('keydown',event=>{
  if(event.key==='Enter'){event.preventDefault();$('duoJoinManual').click();}
 });
 $('duoPartyResume').onclick=async()=>{
  info('Letzte Partie wird geladen …');
  await api.continueLastRoom();
  if(!api.state().roomId)info($('duoProfileMessage').textContent||'Letzte Partie konnte nicht geöffnet werden.');
  sync();
 };
 $('duoPartyReset').onclick=()=>{
  api.resetWaitingRoom();entered=false;lobbySection='menu';lastMode='';
  info('Du kannst jetzt eine neue Party erstellen.');
  sync();
 };
 $('duoMenuStart').onclick=async()=>{
  const s=api.state();if(![0,2].includes(s.seat)||s.game?.status!=='lobby')return;
  $('duoMenuStatus').textContent='Startanfrage wird an deinen Partner gesendet …';
  await api.send({type:'startParty'});
  const after=api.state();
  if(after.game?.status!=='party_ready')
   $('duoMenuStatus').textContent=$('duoStatus').textContent||'Anfrage fehlgeschlagen. Bitte erneut versuchen.';
  sync();
 };
 $('duoStartAccept').onclick=async()=>{entered=true;await api.send({type:'acceptPartyStart'});sync();};
 $('duoStartDecline').onclick=async()=>{await api.send({type:'declinePartyStart'});sync();};
 $('duoStartCancel').onclick=async()=>{await api.send({type:'cancelPartyStart'});sync();};
 for(const section of ['profile','shop','deck','fusions','collection','upgrades']){
  $('duoSoloTab'+section[0].toUpperCase()+section.slice(1)).onclick=()=>select(section);
 }
 $('duoMenuCollection').onclick=()=>select('collection');
 $('duoMenuDeck').onclick=()=>select('deck');
 $('duoMenuProfile').onclick=()=>select('profile');
 $('duoReturnMenu').onclick=()=>select('menu');
 window.ArcaneDuoPartyUI218=Object.freeze({sync,select,returnToMenu:()=>{
  if(!['finished','inviting_next','party_ready','lobby'].includes(api.state().game?.status))return;
  entered=true;resultMenu=true;lobbySection='menu';sync();
 }});
 sync();
})();
