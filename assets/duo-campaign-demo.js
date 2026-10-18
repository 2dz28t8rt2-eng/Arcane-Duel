'use strict';
(()=>{
 const api='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo';
 const $=id=>document.getElementById(id),core=window.ArcaneDuoCore;
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
 let game=null,roomId='',token='',seat=-1,busy=false,invite='';
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
  const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});
  let data;try{data=await r.json()}catch{throw Error('Antwort vom Raumserver fehlt.')}
  if(!r.ok||data.error)throw Error(data.error||'Serverfehler '+r.status);
  return data;
 }
 const notice=t=>set('duoStatus',t);
 function save(){sessionStorage.setItem(savedKey(roomId),JSON.stringify({token,seat}));}
 function loadState(data){game=data.state;seat=data.seat;render();}
 async function send(action){
  if(!game||busy||!(seat===game.activeSeat||(action.type==='nextChapter'&&seat===0&&game.status==='finished'&&game.winner===0)))return;
  busy=true;render();
  try{const result=await call({type:'action',roomId,token,expectedRevision:game.revision,action});loadState(result);notice('Zug erfolgreich synchronisiert.')}
  catch(e){notice(e.message);await refresh();}
  finally{busy=false;render();}
 }
 async function refresh(){
  if(!roomId||!token)return;
  try{const r=await call({type:'state',roomId,token});
   if(!game||r.state.revision!==game.revision)loadState(r);
  }catch(e){notice(e.message);}
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
   roomId=id;token=r.token;seat=2;save();loadState(r);invite='';
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
  const b=item('button',parent,label,'primary');b.disabled=busy;b.onclick=click;return b;
 }
 function render(){
  const track=$('duoTrack'),seats=$('duoSeats'),actions=$('duoActions'),log=$('duoLog');
  for(const el of [track,seats,actions,log])el.replaceChildren();
  $('duoCreate').disabled=busy||!!roomId;
  $('duoJoin').hidden=true;
  if(!game){set('duoTurnName','Noch kein Online-Raum');return}
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
   item('div',track,p.name,'turn-seat '+(p.team===1?'enemy ':'')+(game.activeSeat===s.id?'current':''));
   const node=item('article',seats,undefined,'seat '+(game.activeSeat===s.id?'active':''));
   item('h3',node,p.name);
   item('small',node,(s.kind==='ai'?'KI':'Verbündeter')+' · '+p.hand.length+' Handkarten · '+p.deck.length+' im Deck');
   const field=item('div',node,undefined,'field');
   for(const c of p.field)item('div',field,c?catalog[c.id]?.name+' '+c.atk+'/'+c.def:'◇','field-cell '+(c?'filled':''));
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
   item('p',actions,game.activeSeat%2===1?'Der Gegner führt seinen Zug aus.':'Warte, bis dein Partner seinen Zug abgeschlossen hat.');
   return;
  }
  const p=game.players[seat];
  if(!p.summoned&&p.hand.length&&p.field.some(c=>!c)){
   const sel=item('select',actions);
   p.hand.forEach((id,i)=>{
    const op=item('option',sel,(catalog[id]?.name||'Karte')+' · '+catalog[id]?.atk+'/'+catalog[id]?.def);op.value=i;
   });
   action('Karte beschwören',()=>send({type:'summon',slot:p.field.findIndex(c=>!c),handIndex:Number(sel.value)}),actions);
  }
  const attacker=p.field.findIndex(c=>c&&!c.used&&c.placedRound<game.round);
  if(attacker>=0){
   const targets=game.players.filter(x=>x.team!==p.team).flatMap(x=>x.field.map((c,i)=>c?{seat:x.seat,slot:i}:null).filter(Boolean));
   action('Angreifen',()=>send({type:'attack',slot:attacker,targetSeat:targets[0]?.seat??null,targetSlot:targets[0]?.slot??null}),actions);
  }
  action('Zug beenden →',()=>send({type:'end'}),actions);
 }
 core.CHAPTERS.forEach(ch=>{
  const o=document.createElement('option');o.value=ch.id;o.textContent=ch.id+' · '+ch.name;$('duoChapter').append(o);
 });
 $('duoChapter').onchange=preview;
 $('duoEntry').onchange=preview;
 preview();
 $('duoCreate').onclick=createRoom;
 $('duoCopy').onclick=()=>navigator.clipboard.writeText($('duoInvite').value)
  .then(()=>notice('Einladungslink kopiert.')).catch(()=>{ $('duoInvite').select();notice('Link markiert – bitte manuell kopieren.'); });
 $('duoJoin').disabled=true;
 const fragment=decodeURIComponent(location.hash.slice(1));
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
   if(stored?.token&&[0,2].includes(stored.seat)){roomId=id;token=stored.token;seat=stored.seat;refresh();}
  }catch{}
 }
 setInterval(()=>{if(document.visibilityState!=='hidden'&&!busy)refresh();},2500);
 render();
})();
