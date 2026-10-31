/* Online transport around the original singleplayer application. No second menu. */
'use strict';
(()=>{
 if(!window.ArcaneDuoSelfHost229)return;
 const id=x=>document.getElementById(x),clone=x=>JSON.parse(JSON.stringify(x));
 const tokenKey='arcane-duel-duo-v171-profile-key',metaKey='arcane-personal-cloud-v230';
 const originalSave=saveProfile;
 let profileToken=localStorage.getItem(tokenKey)||'',meta=JSON.parse(localStorage.getItem(metaKey)||'null'),
  ready=false,connecting=null,saving=null,dirty=false,installing=false,timer=null,room=null,seat=-1,state=null,
  polling=false,acting=false,invite='',limits=null,lastInvite=null,completed=null,lastRoom=null,
  hostWaitingOpen=false,openingGroup=null;
 const persist=()=>localStorage.setItem(metaKey,JSON.stringify(meta));
 const statusNode=document.createElement('span');statusNode.id='onlineSync230';statusNode.setAttribute('role','status');
 document.querySelector('.mast-actions')?.append(statusNode);
 const status=text=>{statusNode.textContent=text;};
 async function api(body,path='/api/duo'){
  const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),15000);
  try{const response=await fetch(path,{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:abort.signal});
   const result=await response.json();if(!response.ok||result.error)throw Error(result.error||'Verbindung fehlgeschlagen.');return result;
  }finally{clearTimeout(timeout);}
 }
 function backup(reason){
  // Retain the full local save before changing identity or migrating formats.
  localStorage.setItem('arcane-personal-backup-'+Date.now(),JSON.stringify({reason,profile:clone(profile),extras:window.ArcaneCompleteBackup155.makeBackup().extras,meta}));
 }
 function install(data,{render=true}={}){
  installing=true;
  try{const localExtras=window.ArcaneCompleteBackup155.makeBackup().extras;profile=validateProfile(data.save);meta={id:data.id,revision:data.revision,dirty:false};dirty=false;persist();
   for(const key of Object.keys(localExtras))localStorage.removeItem(key);
   if(profile.extras230)for(const [key,value]of Object.entries(profile.extras230))localStorage.setItem(key,JSON.stringify(value));
   originalSave();deckDraft=[...profile.activeDeck];fusionDraft=[...profile.fusionDeck];
   if(render&&uiMode==='menu')renderMenu();
  }finally{installing=false;}
  status('Spielstand gespeichert');
 }
 saveProfile=function(...args){
  if(!installing)profile.extras230=window.ArcaneCompleteBackup155.makeBackup().extras;
  const result=originalSave(...args);
  if(result&&!installing&&profileToken&&meta&&!game?.online230){dirty=true;meta.dirty=true;persist();clearTimeout(timer);timer=setTimeout(()=>flush().catch(report),650);}
  return result;
 };
 function report(e){status('Lokal gespeichert · Online-Abgleich offen');toast(e?.message||String(e));}
 function choice(title,left,right){return new Promise(resolve=>{
  const summary=p=>'<p>'+escapeHtml(p.duelistName||'Duellant')+' · '+p.xp+' XP · '+p.coins+' Essenz · '+p.cleared.length+' Turniersiege</p>';
  openModal(modalHtml('PERSÖNLICHER SPIELSTAND',title,'▤',
   'Ein Spielstand wird für beide Spielmodi verwendet. Beide bisherigen Fassungen bleiben als Sicherung erhalten. Guthaben werden nicht addiert.',
   '<section><h3>Auf diesem Gerät</h3>'+summary(left)+'</section><section><h3>Online gespeichert</h3>'+summary(right)+'</section>',
   '<button class="btn" id="onlineChooseLocal230">DIESEN GERÄTESTAND ÜBERNEHMEN</button><button class="btn primary" id="onlineChooseCloud230">ONLINE-STAND ÜBERNEHMEN</button>'));
  id('onlineChooseLocal230').onclick=()=>{hideModal();resolve('solo');};id('onlineChooseCloud230').onclick=()=>{hideModal();resolve('online');};
 });}
 async function connect(){
  if(ready)return;
  if(connecting)return connecting;
  connecting=(async()=>{
   let created=false;
   if(!profileToken){const p=await api({type:'profileCreate',name:profile.duelistName,avatarId:profile.avatarId});profileToken=p.profileToken;localStorage.setItem(tokenKey,profileToken);created=true;}
   let data;
   try{data=await api({type:'load',profileToken},'/api/player-save');}
   catch(e){if(!/Profilzugang/.test(e.message))throw e;await api({type:'legacyImport',profileToken});data=await api({type:'load',profileToken},'/api/player-save');}
   if(!data.save){
    const selected=created?'solo':await choice('Welchen bisherigen Fortschritt möchtest du verwenden?',profile,data.legacy);
    backup('profile-adoption');
    profile.extras230=window.ArcaneCompleteBackup155.makeBackup().extras;
    data=await api({type:'adopt',choice:selected,expectedRevision:data.revision,profileToken,save:profile},'/api/player-save');install(data);
   }else if(meta?.id===data.id&&meta.dirty){
    if(meta.revision!==data.revision){const selected=await choice('Dieser Spielstand wurde auch auf einem anderen Gerät geändert.',profile,data.save);backup('conflict');if(selected==='online')install(data);else{meta.revision=data.revision;dirty=true;}}
    else dirty=true;
   }else{if(meta?.id!==data.id)backup('restore-cloud-profile');install(data);}
   lastRoom=data.lastRoom;
   if(lastRoom?.status==='active'&&dirty){backup('pending-local-changes-during-online-duel');install(data);toast('Dein laufendes Online-Duell wird fortgesetzt. Abweichende lokale Änderungen wurden gesichert.');}
   ready=true;if(dirty)await flush();status('Spielstand gespeichert');
  })();
  try{return await connecting;}finally{connecting=null;}
 }
 async function flush(){
  if(saving){await saving;if(dirty)return flush();return;}
  if(!ready||!dirty||game?.online230||state?.status==='active')return;
  const sent=clone(profile);dirty=false;status('Spielstand wird gespeichert …');
  saving=(async()=>{
   try{const data=await api({type:'save',profileToken,expectedRevision:meta.revision,save:sent},'/api/player-save');
    meta.revision=data.revision;meta.dirty=dirty;persist();status(dirty?'Änderungen werden gespeichert …':'Spielstand gespeichert');
   }catch(e){dirty=true;meta.dirty=true;persist();if(/inzwischen geändert/.test(e.message))ready=false;throw e;}
  })();try{await saving;}finally{saving=null;}
  if(dirty)return flush();
 }
 async function loadOutcome(){return api({type:'load',profileToken},'/api/player-save');}
 async function enterMenu(){
  const title=window.ArcaneTitleGate;if(!title?.isOpen())return;
  // close() starts the original transition; it does not return its completion.
  // Wait before opening dialogs or locking the guest menu with inert.
  title.close();
  await new Promise(resolve=>{const done=()=>title.isOpen()?requestAnimationFrame(done):resolve();done();});
 }
 function rememberRoom(){localStorage.setItem('arcane-personal-room-v230',JSON.stringify({id:room,profileId:meta.id,seat,...(seat===0&&invite?{invite}:{})}));}
 function closeWaiting(){hostWaitingOpen=false;hideModal();}
 function waiting({open=false}={}){
  if(!state||state.groupReleased!==false)return;
  const host=seat===0,joined=state.status==='lobby';
  if(host){if(open)hostWaitingOpen=true;if(!hostWaitingOpen)return;}
  if(!host)document.querySelector('.app').inert=true;
  openModal(modalHtml('DEINE GRUPPE',host?'Spieler einladen':'Du bist einer Gruppe beigetreten. Warte auf Host.','✉',
   host?'Sende diesen Link an deinen Mitspieler. Sobald er beigetreten ist, kannst du fortsetzen.':'Dein eigener Fortschritt bleibt erhalten.',
   host&&invite?'<label>Einladungslink<input id="onlineInviteLink230" readonly value="'+escapeHtml(invite)+'"></label>':'',
   host?(invite?'<button class="btn" id="onlineCopy230">LINK KOPIEREN</button>':!joined?'<button class="btn" id="onlineNewLink230">NEUEN LINK ERSTELLEN</button>':'')+'<button class="btn '+(joined?'primary':'')+'" id="onlineContinue230" '+(!joined?'disabled':'')+'>FORTSETZEN</button><button class="btn" id="onlineWaitingClose230">SCHLIESSEN</button>':''));
  if(host){
   if(id('onlineCopy230'))id('onlineCopy230').onclick=()=>navigator.clipboard.writeText(invite).then(()=>toast('Einladungslink kopiert.')).catch(()=>{id('onlineInviteLink230')?.select();});
   if(id('onlineNewLink230'))id('onlineNewLink230').onclick=()=>createGroup().catch(report);
   id('onlineContinue230').onclick=()=>send({type:'continueGroup'}).catch(report);
   id('onlineWaitingClose230').onclick=closeWaiting;
  }
 }
 async function consume(payload){
  if(state&&payload.state&&payload.state.revision<state.revision)return;
  seat=payload.seat??seat;limits=payload.partyLimits||limits;
  const prior=state;state=payload.state||state;if(!state)return;
  if(state.groupReleased===false){
   if(seat===0&&!hostWaitingOpen&&prior?.status==='waiting'&&state.status==='lobby')toast('Dein Mitspieler ist beigetreten. Öffne 2 vs. 2, um fortzusetzen.');
   if(!prior||prior.revision!==state.revision)waiting();return;
  }
  if(prior?.groupReleased===false){hostWaitingOpen=false;document.querySelector('.app').inert=false;hideModal();returnToMenu();}
  if(state.status!=='party_ready'&&id('onlineCancelInvitation230'))hideModal();
  if(state.status==='active'||state.status==='finished'&&game?.online230){
   await window.ArcaneOnlineBattle230.accept(payload,{seat,room});
   return;
  }
  if(state.status==='party_ready'&&seat===0&&lastInvite!==state.partyStartInvite?.id){
   lastInvite=state.partyStartInvite.id;
   openModal(modalHtml('GEMEINSAMES DUELL','Einladung gesendet','✉','Warte auf die Antwort deines Mitspielers.','',
    '<button class="btn" id="onlineCancelInvitation230">EINLADUNG ZURÜCKNEHMEN</button>'));
   id('onlineCancelInvitation230').onclick=()=>send({type:'cancelPartyStart',inviteId:state.partyStartInvite.id}).catch(report);
  }
  if(state.status==='party_ready'&&state.partyStartInvite?.toSeat===seat&&lastInvite!==state.partyStartInvite.id){
   const invitation=state.partyStartInvite;lastInvite=invitation.id;
   openModal(modalHtml('EINLADUNG ZUM DUELL','Möchtest du beitreten?','⚔',
    escapeHtml(state.players[0].name)+' lädt dich zum gemeinsamen Duell gegen '+escapeHtml(window.ArcaneDuoRules.ENCOUNTERS.find(c=>c.id===invitation.chapter)?.name||'die Gegner')+' ein.',
    '<p>Du verwendest deinen persönlichen Fortschritt. Bei unterschiedlichen Turnierstufen erhält der fortgeschrittene Spieler für dieses Duell ein Leihdeck.</p>',
    '<button class="btn primary" id="onlineAccept230">JA</button><button class="btn" id="onlineDecline230">NEIN</button>'));
   id('onlineAccept230').onclick=async()=>{try{if(game&&uiMode==='duel'){toast('Beende zuerst dein laufendes Einzelspielerduell.');return;}await flush();hideModal();await send({type:'acceptPartyStart',inviteId:invitation.id});}catch(e){report(e);}};
   id('onlineDecline230').onclick=()=>{hideModal();send({type:'declinePartyStart',inviteId:invitation.id}).catch(report);};
  }
 }
 async function poll(){
  if(!room||polling||acting||window.ArcaneOnlineBattle230?.playing())return;
  polling=true;try{await consume(await api({type:'state',roomId:room,token:profileToken,afterRevision:window.ArcaneOnlineBattle230?.revision()??state?.revision??-1}));}
  catch(e){status('Verbindung unterbrochen · erneuter Versuch läuft');}finally{polling=false;}
 }
 async function send(action){
  if(acting)throw Error('Bitte den laufenden Spielzug abwarten.');
  acting=true;
  try{const payload=await api({type:'action',roomId:room,token:profileToken,expectedRevision:state.revision,action});await consume(payload);return payload;}
  catch(e){throw e;}finally{acting=false;}
 }
 async function createGroup(){
  const payload=await api({type:'create',profileToken,personalDuoRules:true,sharedClient:true});
  room=payload.roomId;seat=0;state=null;invite=new URL('index.html',location.href).href+'?party='+encodeURIComponent(room)+'#invite='+payload.invite;
  hostWaitingOpen=true;
  rememberRoom();await consume(payload);
 }
 async function invitePlayer(){
  if(openingGroup)return openingGroup;
  openingGroup=(async()=>{
   await enterMenu();await connect();await flush();
   if(room&&state?.status==='active'){toast('Beende zuerst das laufende gemeinsame Duell.');return;}
   if(room&&state&&state.status!=='finished'){
    if(seat!==0){toast('Nur der ursprüngliche Host kann Spieler einladen.');return;}
    if(state.groupReleased===false){waiting({open:true});return;}
    return duelMenu();
   }
   await createGroup();
  })();
  try{return await openingGroup;}finally{openingGroup=null;}
 }
 async function duelMenu(){
  await enterMenu();await connect();await flush();
  if(!room)return invitePlayer();
  await poll();
  if(state?.groupReleased===false){waiting({open:true});return;}
  if(seat!==0){toast('Der Host wählt den Gegner und lädt dich zum Duell ein.');return;}
  if(game&&uiMode==='duel'){toast('Beende zuerst dein laufendes Duell.');return;}
  const max=limits?.maxChapter||1,opponents=window.ArcaneDuoRules.ENCOUNTERS.filter(o=>o.id<=10?o.id<=max:o.id<=(limits?.maxSagaStage||0));
  openModal(modalHtml('GEMEINSAMES DUELL','Gegner wählen','⚔','Es stehen nur die Gegner zur Verfügung, die beide Spieler freigeschaltet haben.',
   '<div class="menu-grid">'+opponents.map(o=>'<button class="btn" data-online-opponent="'+o.id+'">'+escapeHtml(o.name)+'</button>').join('')+'</div>',
   '<button class="btn" id="onlineClose230">ZURÜCK</button>'));
  id('onlineClose230').onclick=hideModal;
  document.querySelectorAll('[data-online-opponent]').forEach(b=>b.onclick=()=>{hideModal();send({type:'requestDuel',chapter:Number(b.dataset.onlineOpponent)}).then(()=>toast('Einladung gesendet. Warte auf die Antwort.')).catch(report);});
 }
 document.addEventListener('click',e=>{
  const button=e.target.closest?.('#duoQuickInvite,#duoCampaignLab,[data-ad196-action="duo"]');if(!button)return;
  e.preventDefault();e.stopImmediatePropagation();(button.id==='duoQuickInvite'?invitePlayer():duelMenu()).catch(report);
 },true);
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||state?.groupReleased!==false)return;
  if(seat===2||hostWaitingOpen){e.preventDefault();e.stopImmediatePropagation();if(seat===0)closeWaiting();}
 },true);
 const oldMenu=renderMenu;
 renderMenu=function(...args){const r=oldMenu(...args);
  const hint=id('arcaneSaveHint158');if(hint)hint.textContent='Dein persönlicher Spielstand gilt für Einzelspieler und gemeinsame Duelle. Sichere deinen Fortschritt regelmäßig als Datei.';
  const entry=id('duoCampaignLab');if(entry){entry.textContent='⚔ Gemeinsam 2 vs. 2 spielen';entry.href='#online';}
  const link=id('duoQuickInvite');if(link){link.href='#invite';link.title='Einladungslink für deine Gruppe erstellen';}
  if(ready&&profile.onlineLegacy230?.chapterCardCredits>0&&menuTab==='shop'&&!id('onlineLegacyClaim230')){
   const button=document.createElement('button');button.id='onlineLegacyClaim230';button.className='btn';
   button.textContent='Bisherige Online-Kapitelbelohnung abholen · '+profile.onlineLegacy230.chapterCardCredits+' offen';
   button.onclick=async()=>{button.disabled=true;try{await flush();const result=await api({type:'chapterCard',profileToken,expectedRevision:meta.revision});install(await loadOutcome());toast('Erhalten: '+result.chapterCard.name);}catch(e){report(e);button.disabled=false;}};
   id('menuContent').prepend(button);
  }
  if(ready&&!id('onlineRecovery230')){
   const b=document.createElement('button');b.id='onlineRecovery230';b.className='btn tiny';b.textContent='Persönlichen Spielstand auf anderem Gerät öffnen';
   b.onclick=()=>{const link=new URL('index.html',location.href).href+'#profile='+profileToken;
    openModal(modalHtml('DEIN SPIELSTAND','Privater Wiederherstellungslink','▤','Dieser Link öffnet deinen persönlichen Spielstand. Gib ihn nur auf deinen eigenen Geräten ein. Zum Einladen verwende den Einladungsbutton.',
     '<input id="onlineRecoveryLink230" readonly value="'+escapeHtml(link)+'">','<button class="btn" id="onlineRecoveryClose230">SCHLIESSEN</button>'));
    id('onlineRecoveryLink230').onclick=e=>e.target.select();id('onlineRecoveryClose230').onclick=hideModal;};
   document.querySelector('.mast-actions')?.append(b);
  }
  return r;
 };
 window.ArcaneOnline230={send,flush,connect,install,loadOutcome,report,invitePlayer,duelMenu,
  snapshot:()=>({room,seat,state,ready,revision:meta?.revision,dirty}),
  getOutcome:()=>completed,setOutcome:r=>{completed=r;}};
 setInterval(()=>{void poll();},1200);
 const query=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));
 const oldJoin=/^([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(hash.get('join')||'');
 const joining=query.get('party')||query.get('room')||oldJoin?.[1],invitation=hash.get('invite')||oldJoin?.[2];
 const recovery=hash.get('profile');
 if(recovery&&/^[a-f0-9]{64}$/.test(recovery)){profileToken=recovery;localStorage.setItem(tokenKey,recovery);history.replaceState(null,'',location.pathname+location.search);}
 async function initialize(){
  if(joining&&invitation){await enterMenu();await connect();await flush();
   const payload=await api({type:'join',roomId:joining,invite:invitation,profileToken,deferStart:true});room=joining;seat=2;rememberRoom();history.replaceState(null,'',location.pathname);await consume(payload);
  }else if(profileToken){await connect();const previous=JSON.parse(localStorage.getItem('arcane-personal-room-v230')||'null');
   if(hash.get('room')){room=hash.get('room');await poll();rememberRoom();}
   else if(lastRoom?.status==='active'){room=lastRoom.id;seat=lastRoom.seat;rememberRoom();await poll();}
   else if(previous?.profileId===meta.id){room=previous.id;seat=previous.seat;invite=seat===0?previous.invite||'':'';if(seat===2)await enterMenu();await poll();}
  }
  if(query.has('invitePlayer')){const url=new URL(location.href);url.searchParams.delete('invitePlayer');history.replaceState(null,'',url);await invitePlayer();}
  if(uiMode==='menu')renderMenu();
 }
 void initialize().catch(report);
 statusNode.addEventListener('click',()=>connect().then(flush).catch(report));
 window.addEventListener('online',()=>connect().then(flush).catch(report));
})();
