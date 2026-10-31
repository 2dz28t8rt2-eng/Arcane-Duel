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
  if(state.game?.status!=='lobby')return;
  lobbySection=section;sync();
  const target={collection:'duoCollectionTotals',deck:'duoProfileDeckZone',
   profile:'duoProfileStats'}[section];
  if(target)$(target)?.scrollIntoView?.({behavior:'smooth',block:'center'});
 };
 function sync(){
  const s=api.state(),g=s.game,joined=!!g&&[0,2].includes(s.seat)&&g.status!=='waiting';
  const party=s.nameConfirmed&&!joined;
  const menu=s.nameConfirmed&&joined&&g.status==='lobby'&&lobbySection==='menu';
  const library=s.nameConfirmed&&joined&&g.status==='lobby'&&lobbySection!=='menu';
  const battle=s.nameConfirmed&&joined&&g.status!=='lobby';
  $('duoPartyGate').hidden=!party;
  $('duoMainMenuGate').hidden=!menu;
  $('duoPage').hidden=!(library||battle);
  $('duoPage').inert=!(library||battle);
  $('duoPage').dataset.lobbyView=library?'true':'false';
  $('duoReturnMenu').hidden=!library;
  const waiting=party&&g?.status==='waiting'&&s.seat===0&&!!s.invite;
  $('duoPartyWaiting').hidden=!waiting;
  $('duoPartyConfig').hidden=!!s.roomId||s.joinIntent;
  $('duoPartyCreate').disabled=s.busy||!s.profile||!s.catalogReady||!!s.roomId;
  $('duoPartyResume').hidden=!!s.roomId||s.joinIntent||!s.lastRoom?.roomId;
  $('duoPartyReset').hidden=!(party&&g?.status==='waiting'&&s.seat===0);
  if(waiting){
   $('duoPartyLink').value=origin()+'#join='+s.roomId+'.'+s.invite;
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
   $('duoMenuStart').textContent=s.seat===0?'⚔ Kampagne starten':'⚔ Auf Party-Leiter warten';
   $('duoMenuStatus').textContent=s.seat===0?
    'Dein Partner ist da. Starte Kapitel '+g.chapter+', sobald ihr beide bereit seid.':
    'Party verbunden. Der Leiter startet das Duell für euch beide.';
  }
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
  $('duoMenuStatus').textContent='Das gemeinsame Duell wird gestartet …';
  await api.send({type:'startParty'});
  const after=api.state();
  if(after.game?.status!=='active')
   $('duoMenuStatus').textContent=$('duoStatus').textContent||'Start fehlgeschlagen. Bitte erneut versuchen.';
  sync();
 };
 $('duoMenuCollection').onclick=()=>select('collection');
 $('duoMenuDeck').onclick=()=>select('deck');
 $('duoMenuProfile').onclick=()=>select('profile');
 $('duoReturnMenu').onclick=()=>select('menu');
 window.ArcaneDuoPartyUI218=Object.freeze({sync,select});
 sync();
})();
