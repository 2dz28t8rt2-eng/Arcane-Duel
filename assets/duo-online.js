/* Arcane Duel — browser client for a private, server-authorized duo room. */
'use strict';
(()=>{
 const cfg=window.ArcaneDuoOnlineConfig||{},$=id=>document.getElementById(id);
 const catalog={1:['Runenfuchs',260,170],2:['Mooswächter',140,340],3:['Klingenwolf',420,150],4:['Sternenrufer',300,290],5:['Dornenschreiter',350,210],6:['Eisenhüter',180,450],7:['Aschenritter',440,220],8:['Glutgreif',460,310]};
 const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.projectUrl||'');
 const endpoint=configured?cfg.projectUrl.replace(/\/$/,'')+'/functions/v1/'+(cfg.functionName||'duo-room'):'';
 const storeKey='arcane-duo-online-seat-v1', invite=new URLSearchParams(location.hash.slice(1));
 const incoming=/^[0-9a-f]{24}$/.test(invite.get('room')||'')&&/^[0-9a-f]{64}$/.test(invite.get('invite')||'');
 let identity=null,state=null,version=null,inviteLink='',busy=false,loading=false;
 const setText=(id,s)=>$(id).textContent=String(s),message=s=>setText('duoOnlineStatus',s);
 const title=id=>catalog[id]?.[0]||'Karte '+id;
 const box=(type,parent,text,cls)=>{
  const el=document.createElement(type);if(cls)el.className=cls;
  if(text!==undefined)el.textContent=String(text);
  parent.append(el);return el;
 };
 const button=(name,fn,parent)=>{const b=box('button',parent,name,'primary');b.onclick=fn;return b;};
 const select=(pairs,parent)=>{
  const s=box('select',parent);
  for(const [value,label]of pairs){const o=box('option',s,label);o.value=value;}
  return s;
 };
 const show=tab=>{
  $('duoOnlineCreate').hidden=tab!=='create';
  $('duoOnlineJoin').hidden=tab!=='join';
  $('duoOnlineRoom').hidden=tab!=='room';
 };
 async function call(body){
  if(!configured)throw Error('Der Supabase-Raumserver ist noch nicht eingerichtet.');
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  try{
   const response=await fetch(endpoint,{method:'POST',body:JSON.stringify(body),
    headers:{'Content-Type':'application/json'},credentials:'omit',cache:'no-store',signal:ctrl.signal});
   const data=await response.json();
   if(!response.ok)throw Error(data?.error||'HTTP '+response.status);
   return data;
  }finally{clearTimeout(timer);}
 }
 function save(id,seat,token){
  identity={roomId:id,seat,token};sessionStorage.setItem(storeKey,JSON.stringify(identity));
 }
 function accept(data){
  if(!data?.state)return;
  state=data.state;version=data.revision;
  show('room');setText('duoOnlineRoomCode',identity.roomId.toUpperCase());
  setText('duoOnlineRole',identity.seat===0?'Du bist der Gastgeber.':'Du bist der eingeladene Partner.');
  render();
 }
 async function refresh(quiet=true){
  if(!identity||busy||loading)return;loading=true;
  try{
   const data=await call({op:'state',roomId:identity.roomId,token:identity.token});
   if(!state||version!==data.revision)accept(data);
   if(!quiet)message('Spielstand aktualisiert.');
  }catch(e){if(!quiet)message(e.message);}finally{loading=false;}
 }
 async function act(command){
  if(!identity||busy||state?.status!=='active'||state.activeSeat!==identity.seat)return;
  busy=true;
  try{
   const data=await call({op:'act',roomId:identity.roomId,token:identity.token,expectedRevision:version,action:command});
   accept(data);message('Zug gespeichert und synchronisiert.');
  }catch(e){message(e.message);}
  finally{busy=false;}
 }
 function render(){
  if(!state)return;
  setText('duoOnlineFriendlyLP',state.teams[0].lp.toLocaleString('de-AT')+' LP');
  setText('duoOnlineEnemyLP',state.teams[1].lp.toLocaleString('de-AT')+' LP');
  setText('duoOnlineTurn',state.status==='waiting'?'Warten auf den Partner':
   state.status==='finished'?(state.winner===0?'Bündnis gewinnt!':'Gegner gewinnen!'):
   'Runde '+state.round+' · '+state.players[state.activeSeat].name+' ist am Zug');
  const track=$('duoOnlineTrack'),seats=$('duoOnlineSeats'),actions=$('duoOnlineActions'),log=$('duoOnlineLog');
  for(const el of [track,seats,actions,log])el.replaceChildren();
  for(const p of state.players){
   box('div',track,p.name,'turn-seat '+(p.team===1?'enemy ':'')+
    (p.seat===state.activeSeat&&state.status==='active'?'current':''));
   const holder=box('article',seats,undefined,'seat '+(p.seat===state.activeSeat&&state.status==='active'?'active':''));
   box('h3',holder,p.name);
   box('small',holder,(p.kind==='ai'?'KI':'Verbündeter')+' · '+(p.handCount??p.hand.length)+
    ' Handkarten · '+(p.deckCount??p.deck.length)+' im Deck');
   const field=box('div',holder,undefined,'field');
   for(const c of p.field)box('div',field,c?title(c.id)+' '+c.atk+'/'+c.def:'◇','field-cell '+(c?'filled':''));
  }
  for(const event of state.log.slice(-8).reverse())box('li',log,event);
  if(state.status!=='active'||state.activeSeat!==identity.seat){
   box('p',actions,state.status==='waiting'?'Einladung noch nicht angenommen.':
    'Dein Partner oder die KI ist gerade am Zug. Diese Seite aktualisiert sich automatisch.','micro');
   return;
  }
  const me=state.players[identity.seat];
  box('strong',actions,'Dein Zug: '+me.name);
  if(!me.summoned&&me.hand.length&&me.field.some(c=>!c)){
   const hand=select(me.hand.map((id,i)=>[i,title(id)]),actions);
   const places=select(me.field.flatMap((c,i)=>c?[]:[[i,'Feld '+(i+1)]]),actions);
   button('Beschwören',()=>act({type:'summon',handIndex:Number(hand.value),slot:Number(places.value)}),actions);
  }
  const attackers=me.field.flatMap((c,i)=>c&&!c.used&&c.placedRound<state.round?[[i,title(c.id)+' (Feld '+(i+1)+')']]:[]);
  if(attackers.length){
   const from=select(attackers,actions);
   const enemies=state.players.filter(p=>p.team!==me.team).flatMap(p=>p.field.flatMap((c,i)=>
     c?[[p.seat+':'+i,p.name+' · '+title(c.id)+' (Feld '+(i+1)+')']]:[]));
   const to=select(enemies.length?enemies:[['direct','Direkter LP-Angriff']],actions);
   button('Angreifen',()=>{
    const target=to.value==='direct'?[null,null]:to.value.split(':').map(Number);
    act({type:'attack',slot:Number(from.value),targetSeat:target[0],targetSlot:target[1]});
   },actions);
  }
  button('Zug beenden →',()=>act({type:'end'}),actions);
 }
 const chapters=['Der Pakt am zerbrochenen Tor','Die Zwillinge der Asche','Das verlorene Siegel','Krone der Vier'];
 chapters.forEach((name,i)=>{const o=box('option',$('duoOnlineChapter'),(i+1)+' · '+name);o.value=i+1;});
 $('duoOnlineCreateBtn').disabled=!configured;
 $('duoOnlineJoinBtn').disabled=!configured;
 $('duoOnlineCreateBtn').onclick=async()=>{
  if(busy)return;busy=true;
  try{
   const result=await call({op:'create',name:$('duoOnlineName').value,chapter:Number($('duoOnlineChapter').value)});
   save(result.roomId,0,result.token);
   const url=new URL(location.href);url.hash='room='+result.roomId+'&invite='+result.inviteToken;
   inviteLink=url.href;$('duoOnlineInviteUrl').value=inviteLink;
   $('duoOnlineInviteBox').hidden=false;accept(result);
   message('Raum erstellt! Schicke den privaten Einladungslink an deinen Partner.');
  }catch(e){message(e.message);}finally{busy=false;}
 };
 $('duoOnlineJoinBtn').onclick=async()=>{
  if(!incoming||busy)return;busy=true;
  try{
   const result=await call({op:'join',roomId:invite.get('room'),inviteToken:invite.get('invite'),
    name:$('duoOnlinePartnerName').value});
   save(result.roomId,2,result.token);
   history.replaceState(null,'',location.pathname+location.search);
   accept(result);message('Einladung angenommen. Der Gastgeber beginnt.');
  }catch(e){message(e.message);}finally{busy=false;}
 };
 $('duoOnlineCopy').onclick=async()=>{
  try{await navigator.clipboard.writeText(inviteLink);message('Einladungslink kopiert.');}
  catch{$('duoOnlineInviteUrl').select();message('Bitte den markierten Link manuell kopieren.');}
 };
 $('duoOnlineRefresh').onclick=()=>refresh(false);
 if(!configured){
  $('duoOnlineNotice').textContent='Online-Code vorbereitet. Ein Supabase-Projekt muss noch angelegt und der Raumserver aktiviert werden.';
  show('create');message('Noch kein Supabase-Projekt hinterlegt.');
 }else{
  let previous=null;
  try{previous=JSON.parse(sessionStorage.getItem(storeKey)||'null');}catch{}
  if(previous&&/^[0-9a-f]{24}$/.test(previous.roomId)&&
    /^[0-9a-f]{64}$/.test(previous.token)&&
    (!incoming||previous.roomId===invite.get('room')&&previous.seat===2)){
   identity=previous;show('room');refresh(false);
  }else show(incoming?'join':'create');
 }
 setInterval(()=>{if(!document.hidden)refresh(true);},2500);
 window.addEventListener('focus',()=>refresh(true));
})();