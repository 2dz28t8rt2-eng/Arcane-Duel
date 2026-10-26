'use strict';
(()=>{
 const api='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo';
 const $=id=>document.getElementById(id),core=window.ArcaneDuoCore,ui=window.ArcaneDuoBattleUI;
 const catalog={1:{name:'Runenfuchs',atk:260,def:170},2:{name:'Mooswächter',atk:140,def:340},
  3:{name:'Klingenwolf',atk:420,def:150},4:{name:'Sternenrufer',atk:300,def:290},
  5:{name:'Dornenschreiter',atk:350,def:210},6:{name:'Eisenhüter',atk:180,def:450},
  7:{name:'Aschenritter',atk:440,def:220},8:{name:'Glutgreif',atk:460,def:310},
  101:{name:'Wurzelwacht',atk:360,def:390,level:2},
  102:{name:'Glutspäher',atk:460,def:270,level:2},
  103:{name:'Sternenfalter',atk:420,def:310,level:2},
  201:{name:'Runenjäger',atk:610,def:500,level:4},
  202:{name:'Felsbastion',atk:420,def:780,level:4},
  203:{name:'Frostgreif',atk:720,def:410,level:4},
  301:{name:'Donnerkoloss',atk:950,def:660,level:6},
  302:{name:'Schattenhüter',atk:660,def:1070,level:6},
  303:{name:'Himmelsdrache',atk:1080,def:570,level:6},
  401:{name:'Aetherarchon',atk:1360,def:970,level:8},
  402:{name:'Leviathan der Tiefe',atk:1030,def:1400,level:8},
  403:{name:'Klingenseraph',atk:1560,def:810,level:8}};
 let game=null,roomId='',token='',seat=-1,busy=false,refreshing=false,invite='',lastSync=0,syncError='',sessionReady=true;
 const set=(id,value)=>$(id).textContent=String(value);
 const ownOrigin=()=>location.href.split('#')[0].split('?')[0];
 const chapter=()=>core.CHAPTERS.find(x=>x.id===Number($('duoChapter').value))||core.CHAPTERS[0];
 const selectedChapter=()=>$('duoEntry').value==='new'?core.CHAPTERS[0]:chapter();
 const preview=()=>{
  const ch=selectedChapter(),pack=core.chapterPack(ch.id),level=core.CHAPTER_LEVEL[ch.id];
  $('duoChapterSelect').hidden=$('duoEntry').value!=='chapter';
  $('duoCreate').textContent=$('duoEntry').value==='new'?'Neue Kampagne erstellen':'Kapitel '+ch.id+' direkt starten';
  set('duoChapterInfo',ch.name+' – '+ch.description);
  set('duoRewardInfo','✦ Beide Verbündeten erhalten je 3 Level-'+level+'-Karten: '+pack.map(id=>catalog[id].name).join(' · ')+'. Die Karten werden ins 40-Karten-Deck übernommen.');
 };
 const savedKey=id=>'arcane-duo-session-'+id;
 async function call(obj){
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),12000);
  try{
   const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},
    credentials:'omit',cache:'no-store',body:JSON.stringify(obj),signal:ctrl.signal});
   let data;try{data=await r.json()}catch{throw Error('Antwort vom Raumserver fehlt.')}
   if(!r.ok||data.error)throw Error(data.error||'Serverfehler '+r.status);
   return data;
  }catch(e){
   if(e.name==='AbortError')throw Error('Der Raumserver antwortet nicht. Prüfe deine Verbindung und aktualisiere den Raum.');
   if(e instanceof TypeError)throw Error('Verbindung zum Raumserver fehlgeschlagen. Bitte Netzwerk und Browser prüfen.');
   throw e;
  }finally{clearTimeout(timeout);}
 }
 const notice=t=>set('duoStatus',t);
 function save(){
  try{sessionStorage.setItem(savedKey(roomId),JSON.stringify({token,seat,invite:seat===0?invite:''}));}
  catch{sessionReady=false;}
 }
 function loadState(data){
  game=data.state;seat=data.seat;syncError='';lastSync=Date.now();
  if(game.status!=='waiting'&&invite){invite='';save();}
  render();
 }
 async function send(action){
  if(!game||busy||!(seat===game.activeSeat||(action.type==='nextChapter'&&seat===0&&game.status==='finished'&&game.winner===0)))return;
  busy=true;render();
  try{const result=await call({type:'action',roomId,token,expectedRevision:game.revision,action});loadState(result);notice('Zug erfolgreich synchronisiert.')}
  catch(e){syncError=e.message;notice(e.message);await refresh();}
  finally{busy=false;render();}
 }
 async function refresh(){
  if(!roomId||!token||refreshing)return;
  refreshing=true;
  try{const r=await call({type:'state',roomId,token});
   if(!game||r.state.revision!==game.revision)loadState(r);
   else {lastSync=Date.now();syncError='';render();}
  }catch(e){syncError=e.message;notice(e.message);render();}
  finally{refreshing=false;}
 }
 async function createRoom(){
  if(busy)return;busy=true;
  try{
   const entry=$('duoEntry').value;
   const r=await call({type:'create',name:$('duoHostName').value||'Duellant A',entry,
    ...(entry==='chapter'?{chapter:chapter().id}:{})});
   roomId=r.roomId;token=r.token;seat=0;invite=r.invite;save();loadState(r);
   const url=ownOrigin()+'#join='+roomId+'.'+invite;
   $('duoInvite').value=url;$('duoInviteBox').hidden=false;
   location.hash='room='+roomId;notice('Raum erstellt. Versende jetzt den Einladungslink.');
  }catch(e){notice(e.message)}
  finally{busy=false;render()}
 }
 async function joinRoom(id,inviteToken){
  if(busy)return;busy=true;
  try{
   const r=await call({type:'join',roomId:id,invite:inviteToken,name:$('duoHostName').value||'Verbündeter'});
   roomId=id;token=r.token;seat=2;invite='';save();loadState(r);
   location.hash='room='+id;notice('Beitritt erfolgreich! Ihr könnt jetzt gemeinsam kämpfen.');
   $('duoInviteBox').hidden=true;
  }catch(e){notice(e.message)}
  finally{busy=false;render()}
 }
 const item=(tag,parent,txt,cls='')=>{
  const n=document.createElement(tag);if(cls)n.className=cls;
  if(txt!==undefined)n.textContent=txt;
  parent.append(n);return n;
 };
 function action(label,click,parent){
  const b=item('button',parent,label,'primary');b.disabled=busy||!!syncError;b.onclick=click;return b;
 }
 function selector(label,options,parent){
  const wrapper=item('label',parent,undefined,'duo-choice');
  item('span',wrapper,label);
  const input=item('select',wrapper);
  for(const [value,text] of options){const o=item('option',input,text);o.value=String(value);}
  return input;
 }
 function actionGroup(parent,heading,help){
  const group=item('section',parent,undefined,'duo-action-group');
  item('h3',group,heading);
  if(help)item('p',group,help,'duo-action-help');
  return group;
 }
 function formatTime(stamp){return new Date(stamp).toLocaleTimeString('de-AT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
 function render(){
  const track=$('duoTrack'),seats=$('duoSeats'),actions=$('duoActions'),log=$('duoLog');
  for(const el of [track,seats,actions,log])el.replaceChildren();
  $('duoCreate').disabled=busy||!!roomId;
  $('duoCreate').hidden=!!roomId||location.hash.startsWith('#join=');
  $('duoAccept').hidden=!!roomId||!location.hash.startsWith('#join=');
  $('duoJoin').hidden=true;
  $('duoRefresh').disabled=!roomId||busy||refreshing;
  const stage=ui.phase(game,seat),steps=[$('duoStepCreate'),$('duoStepInvite'),$('duoStepBattle')];
  const current=stage==='not-created'?0:stage==='waiting'?1:2;
  steps.forEach((node,index)=>{node.classList.toggle('current',index===current);node.classList.toggle('done',index<current);});
  const saveBox=$('duoSaveState');saveBox.classList.toggle('error',!!syncError);
  set('duoSaveState',syncError?'⚠ Synchronisierung fehlgeschlagen: '+syncError+'. Nicht blind erneut klicken – erst den Raumstand aktualisieren.':
   lastSync?'☁ Online-Spielstand auf dem Server · zuletzt bestätigt '+formatTime(lastSync)+
   ' · Jeder akzeptierte Zug wird automatisch gespeichert.':
   '☁ Noch kein Online-Spielstand. Ein Raum und seine Züge werden automatisch serverseitig gespeichert.');
  if(!sessionReady)saveBox.textContent+=' Achtung: Der Browser verweigert die Tab-Speicherung. Nach Neuladen ist der Zugang möglicherweise verloren.';
  $('duoInviteBox').hidden=!(game?.status==='waiting'&&seat===0&&!!invite);
  if(!$('duoInviteBox').hidden)$('duoInvite').value=ownOrigin()+'#join='+roomId+'.'+invite;
  if(!game){set('duoTurnName',location.hash.startsWith('#join=')?'Einladung annehmen, um mitzuspielen.':'Noch kein Online-Raum');return;}
  set('duoRoomId',roomId);set('duoAlliedLP',game.teams[0].lp.toLocaleString('de-AT')+' LP');
  const chapterNumber=game.chapter||1;
  const pack=game.chapterPack||core.chapterPack(chapterNumber);
  set('duoCurrentReward','Kapitel '+chapterNumber+' · ✦ je 3 Level-'+(game.chapterLevel||core.CHAPTER_LEVEL[chapterNumber])+'-Karten: '+pack.map(id=>catalog[id]?.name||'Karte '+id).join(' · '));
  $('duoCurrentReward').hidden=false;
  set('duoEnemyLP',game.teams[1].lp.toLocaleString('de-AT')+' LP');
  set('duoTurnName',game.status==='waiting'?'Warte auf deinen Partner':
   game.status==='finished'?(game.winner===0?'Gemeinsamer Sieg!':'Die Gegner haben gewonnen!'):
   'Runde '+game.round+' · '+game.players[game.activeSeat].name+' ist am Zug');
  for(const s of core.SEATS){
   const p=game.players[s.id];
   item('div',track,p.name,'turn-seat '+(p.team===1?'enemy ':'')+(game.activeSeat===s.id&&game.status==='active'?'current':''));
   const node=item('article',seats,undefined,'seat '+(game.activeSeat===s.id&&game.status==='active'?'active':''));
   item('h3',node,p.name);
   item('small',node,(s.kind==='ai'?'KI':'Verbündeter')+' · '+p.hand.length+' Handkarten · '+p.deck.length+' im Deck'+
    (p.seat===seat?' · Deine Karten':' · Verdeckte Hand'));
   const field=item('div',node,undefined,'field');
   for(const [slot,c] of p.field.entries()){
    const cell=item('div',field,c?(catalog[c.id]?.name||'Karte '+c.id):'◇','field-cell '+(c?'filled':''));
    if(c){
     item('small',cell,c.atk+' ATK / '+c.def+' DEF','duo-field-meta');
     cell.title='Feld '+(slot+1)+(c.used?' · hat schon angegriffen':
      c.placedRound>=game.round?' · erst nächste Runde bereit':' · angriffsbereit');
    }else cell.title='Freier Feldplatz '+(slot+1);
   }
  }
  for(const line of [...game.log].slice(-8).reverse())item('li',log,line);
  if(game.status!=='active'){
   if(game.status==='finished'&&game.winner===0&&game.chapter<4){
    if(seat===0)action('✦ Weiter zu Kapitel '+(game.chapter+1)+' →',()=>send({type:'nextChapter'}),actions);
    else item('p',actions,'Kapitel gewonnen! Warte, bis der Gastgeber das nächste Kapitel startet.');
   }else item('p',actions,game.status==='waiting'?'Einladung geöffnet? Der Partner kann über den Link beitreten.':
    game.status==='finished'&&game.winner===0?'✦ Alle Kapitel abgeschlossen!':'Partie beendet.');
   return;
  }
  if(seat!==game.activeSeat){
   item('p',actions,game.activeSeat%2===1?'Der KI-Gegner führt seinen Zug aus. Der Stand wird automatisch aktualisiert.':
    'Dein Partner ist am Zug. Seine Aktionen erscheinen hier automatisch.','duo-turn-note');
   return;
  }
  const p=game.players[seat],choices=ui.legalChoices(game,seat);
  item('p',actions,'Du bist am Zug. Entscheide selbst, welche Karte auf welchen Feldplatz kommt und welches Monster du angreifst.','duo-turn-note');
  if(choices.hand.length){
   const group=actionGroup(actions,'✦ Monster beschwören','Du darfst in diesem Zug genau eine Karte aus deiner Hand beschwören.');
   const row=item('div',group,undefined,'duo-choices');
   const hand=selector('Handkarte',choices.hand.map(c=>[c.index,(catalog[c.id]?.name||'Karte '+c.id)+
    ' · '+(catalog[c.id]?.atk||'?')+' ATK / '+(catalog[c.id]?.def||'?')+' DEF']),row);
   const slot=selector('Eigener freier Feldplatz',choices.freeSlots.map(n=>[n,'Feld '+(n+1)]),row);
   action('Gewählte Karte beschwören',()=>send({type:'summon',slot:Number(slot.value),handIndex:Number(hand.value)}),group);
  }else{
   const reason=p.summoned?'Du hast in diesem Zug bereits beschworen.':
    !p.hand.length?'Keine Handkarte verfügbar.':'Alle sieben Feldplätze sind belegt.';
   item('p',actions,'Beschwören: '+reason,'duo-action-help');
  }
  if(choices.attackers.length){
   const group=actionGroup(actions,'⚔ Gezielter Angriff','Ein Monster kann einmal pro Zug angreifen. Direkte LP-Angriffe sind nur bei zwei leeren Gegnerfeldern möglich.');
   const row=item('div',group,undefined,'duo-choices');
   const from=selector('Angreifendes Monster',choices.attackers.map(c=>[c.slot,
    'Feld '+(c.slot+1)+' · '+(catalog[c.card.id]?.name||'Karte '+c.card.id)+' ('+c.card.atk+' ATK)']),row);
   const target=selector('Gegnerisches Ziel',choices.targets.length?choices.targets.map(c=>[c.seat+':'+c.slot,
    c.name+' · Feld '+(c.slot+1)+' · '+(catalog[c.card.id]?.name||'Karte '+c.card.id)+
    ' ('+(c.card.mode==='def'?c.card.def+' DEF':c.card.atk+' ATK')+')']):[['direct','Direkt auf gegnerische Team-LP']],row);
   action('Angriff bestätigen',()=>{
    const picked=choices.attackers.find(c=>c.slot===Number(from.value));
    const goal=target.value==='direct'?null:choices.targets.find(c=>c.seat+':'+c.slot===target.value);
    send(ui.attackCommand(picked,goal));
   },group);
  }else{
   item('p',actions,'Angriff: '+(choices.waiting.length?
    choices.waiting.length+' Monster sind erst ab der nächsten Runde bereit.':'Aktuell kein angriffsbereites Monster.'),'duo-action-help');
  }
  const footer=item('div',actions,undefined,'duo-actions-footer');
  action('Zug beenden → Nächster Spieler',()=>send({type:'end'}),footer);
 }
 core.CHAPTERS.forEach(ch=>{
  const o=document.createElement('option');o.value=ch.id;o.textContent=ch.id+' · '+ch.name;$('duoChapter').append(o);
 });
 $('duoChapter').onchange=preview;
 $('duoEntry').onchange=preview;
 preview();
 $('duoCreate').onclick=createRoom;
 $('duoRefresh').onclick=()=>{notice('Prüfe den Online-Spielstand …');refresh();};
 $('duoCopy').onclick=()=>navigator.clipboard.writeText($('duoInvite').value)
  .then(()=>notice('Einladungslink kopiert.')).catch(()=>{ $('duoInvite').select();notice('Link markiert – bitte manuell kopieren.'); });
 $('duoJoin').disabled=true;
 let fragment='';try{fragment=decodeURIComponent(location.hash.slice(1));}
 catch{notice('Der Einladungslink enthält ungültige Zeichen.');}
 if(fragment.startsWith('join=')){
  const raw=fragment.slice(5),i=raw.lastIndexOf('.'),id=raw.slice(0,i),secret=raw.slice(i+1);
  if(i>0&&/^[a-f0-9-]{36}$/.test(id)&&/^[a-f0-9]{64}$/.test(secret)){
   const joinButton=$('duoAccept');joinButton.hidden=false;
   joinButton.onclick=()=>joinRoom(id,secret);
   notice('Einladung gefunden! Gib deinen Namen ein und bestätige den Beitritt.');
  }else notice('Der Einladungslink ist ungültig.');
 }else if(fragment.startsWith('room=')){
  const id=fragment.slice(5);try{
   const stored=JSON.parse(sessionStorage.getItem(savedKey(id))||'null');
   if(/^[a-f0-9]{64}$/.test(stored?.token||'')&&[0,2].includes(stored.seat)){
    roomId=id;token=stored.token;seat=stored.seat;
    invite=seat===0&&/^[a-f0-9]{64}$/.test(stored.invite||'')?stored.invite:'';
    notice('Gespeicherten Raumzugang in diesem Tab gefunden. Raum wird geladen …');refresh();
   }
  }catch{}
 }
 setInterval(()=>{if(document.visibilityState!=='hidden'&&!busy)refresh();},2500);
 render();
})();
