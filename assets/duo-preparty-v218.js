/* Arcane Duel Duo v21.8 · party formation -> shared menu -> combat.
 * UI is a thin wrapper over the existing authoritative 2v2 client.
 * No room secrets are stored outside its existing protected session handling.
 */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),api=window.ArcaneDuoParty218;
 if(!api){console.error('[Duo Party] Controller unavailable');return;}
 let lobbySection='menu',lastMode='';
 const origin=()=>location.href.split('#')[0].split('?')[0];
 const info=message=>{$('duoPartyStatus').textContent=message;};
 const select=(section)=>{
  const state=api.state();
  if(!['lobby','party_ready'].includes(state.game?.status))return;
  lobbySection=section;sync();
  const target={collection:'duoCollectionTotals',deck:'duoProfileDeckZone',
   profile:'duoProfileStats'}[section];
  if(target)$(target)?.scrollIntoView?.({behavior:'smooth',block:'center'});
 };
 function sync(){
  const s=api.state(),g=s.game,joined=!!g&&[0,2].includes(s.seat)&&g.status!=='waiting';
  const party=s.nameConfirmed&&!joined;
  const inMenu=['lobby','party_ready'].includes(g?.status);
  const menu=s.nameConfirmed&&joined&&inMenu&&lobbySection==='menu';
  const library=s.nameConfirmed&&joined&&inMenu&&lobbySection!=='menu';
  const battle=s.nameConfirmed&&joined&&!inMenu;
  $('duoPartyGate').hidden=!party;
  $('duoMainMenuGate').hidden=!menu;
  $('duoPage').hidden=!(library||battle);
  $('duoPage').inert=!(library||battle);
  $('duoPage').dataset.lobbyView=library?'true':'false';
  $('duoPage').dataset.lobbySection=library?lobbySection:'';
  $('duoReturnMenu').hidden=!library;
  const waiting=party&&g?.status==='waiting'&&s.seat===0&&!!s.invite;
  $('duoPartyWaiting').hidden=!waiting;
  $('duoPartyConfig').hidden=!!s.roomId||s.joinIntent;
  $('duoPartyCreate').disabled=s.busy||!s.profile||!s.catalogReady||!!s.roomId;
  $('duoPartyResume').hidden=!!s.roomId||s.joinIntent||!s.lastRoom?.roomId;
  $('duoPartyReset').hidden=!(party&&g?.status==='waiting'&&s.seat===0);
  if(waiting){
   $('duoPartyLink').value=origin()+'#join='+s.roomId+'.'+s.invite;
   $('duoPartyCode').value=s.roomId+'.'+s.invite;
   $('duoPartyWaitLabel').textContent='Schicke diesen Link an deinen Freund. Sobald er beitritt, öffnet sich für euch beide das Hauptmenü.';
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
  if(joined){
   $('duoMenuTeam').textContent=g.players[0].name+'  ✦  '+g.players[2].name;
   $('duoMenuStart').disabled=s.seat!==0||s.busy||g.status!=='lobby';
   $('duoMenuStart').textContent=s.seat===0?'Kampagne starten':'Auf Startanfrage warten';
   $('duoMenuStatus').textContent=g.status==='party_ready'?
    (s.seat===0?'Startanfrage verschickt. Dein Partner entscheidet, wann er bereit ist.':
      'Dein Partner hat eine Startanfrage geschickt. Du kannst noch dein Deck bearbeiten.'):
    (s.seat===0?'Kapitel '+g.chapter+' wählen und Startanfrage verschicken. Dein Partner bestätigt separat.':
      'Party verbunden. Du kannst deinen Duellanten unabhängig vom Partner verwalten.');
  }
  const pending=g?.status==='party_ready'&&joined;
  $('duoStartNotice').hidden=!pending;
  $('duoStartAccept').hidden=!pending||s.seat!==2;
  $('duoStartDecline').hidden=!pending||s.seat!==2;
  $('duoStartCancel').hidden=!pending||s.seat!==0;
  $('duoStartNoticeTitle').textContent=s.seat===0?
   'Warte auf die Zustimmung deines Partners':'Dein Partner lädt dich zum Duell ein';
  $('duoStartNoticeText').textContent=s.seat===0?
   'Beide können ihre Karten und Fähigkeiten weiter unabhängig verwalten.':
   'Du kannst erst dein Deck fertigstellen und dann zustimmen oder die Anfrage ablehnen.';
  // Do not show the legacy room-creation panel inside the actual game.
  $('duoSetupPanel').hidden=joined;
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
   info('Einladung gültig. Bestätige deinen Beitritt.');
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
  api.resetWaitingRoom();lobbySection='menu';lastMode='';
  info('Du kannst jetzt eine neue Party erstellen.');
  sync();
 };
 $('duoMenuStart').onclick=async()=>{
  const s=api.state();if(s.seat!==0||s.game?.status!=='lobby')return;
  $('duoMenuStatus').textContent='Startanfrage wird an deinen Partner gesendet …';
  await api.send({type:'startParty'});
  const after=api.state();
  if(after.game?.status!=='party_ready')
   $('duoMenuStatus').textContent=$('duoStatus').textContent||'Anfrage fehlgeschlagen. Bitte erneut versuchen.';
  sync();
 };
 $('duoStartAccept').onclick=async()=>{await api.send({type:'acceptPartyStart'});sync();};
 $('duoStartDecline').onclick=async()=>{await api.send({type:'declinePartyStart'});sync();};
 $('duoStartCancel').onclick=async()=>{await api.send({type:'cancelPartyStart'});sync();};
 $('duoMenuCollection').onclick=()=>select('collection');
 $('duoMenuDeck').onclick=()=>select('deck');
 $('duoMenuProfile').onclick=()=>select('profile');
 $('duoReturnMenu').onclick=()=>select('menu');
 window.ArcaneDuoPartyUI218=Object.freeze({sync,select});
 sync();
})();
