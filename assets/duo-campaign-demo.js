'use strict';
(()=>{
 const core=window.ArcaneDuoCore;
 const get=id=>document.getElementById(id);
 const catalog={
  1:{name:'Runenfuchs',atk:260,def:170},2:{name:'Mooswächter',atk:140,def:340},
  3:{name:'Klingenwolf',atk:420,def:150},4:{name:'Sternenrufer',atk:300,def:290},
  5:{name:'Dornenschreiter',atk:350,def:210},6:{name:'Eisenhüter',atk:180,def:450},
  7:{name:'Aschenritter',atk:440,def:220},8:{name:'Glutgreif',atk:460,def:310}
 };
 const names=id=>catalog[id]?.name||'Karte '+id;
 let game=null;
 const deck=ids=>Array.from({length:40},(_,i)=>ids[i%ids.length]);
 const chapter=()=>core.CHAPTERS.find(x=>x.id===Number(get('duoChapter').value))||core.CHAPTERS[0];
 const randomCode=()=>{
  const a=new Uint8Array(9);crypto.getRandomValues(a);
  return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
 };
 const show=(id,v)=>get(id).textContent=String(v);
 const take=(seat,action)=>{
  try{game=core.apply(game,seat,action,{catalog});paint();return true}
  catch(e){show('duoStatus',e.message);return false}
 };
 core.CHAPTERS.forEach(ch=>{
  const opt=document.createElement('option');opt.value=ch.id;
  opt.textContent=ch.id+' · '+ch.name;get('duoChapter').append(opt);
 });
 get('duoChapter').addEventListener('change',()=>show('duoChapterInfo',chapter().description));
 show('duoChapterInfo',chapter().description);
 get('duoCreate').onclick=()=>{
  game=core.createLobby({roomId:randomCode(),hostName:get('duoHostName').value||'Du',
   hostDeck:deck([1,2,3,4]),enemyDeckA:deck([2,5,6]),enemyDeckB:deck([3,7,8]),chapter:chapter().id});
  get('duoJoin').disabled=false;show('duoRoomId',game.roomId);
  show('duoStatus','Raum erstellt – noch nicht gestartet. Simuliere nun den Beitritt deines Partners.');
  paint();
 };
 get('duoJoin').onclick=()=>{
  if(!game)return;
  if(take(2,{type:'join',name:get('duoPartnerName').value||'Partner',deck:deck([4,1,6,3])}))
   get('duoJoin').disabled=true;
 };
 const node=(tag,cl,txt,parent)=>{
  const el=document.createElement(tag);if(cl)el.className=cl;if(txt!==undefined)el.textContent=txt;
  parent.append(el);return el;
 };
 const button=(label,cb,parent)=>{
  const el=node('button','primary',label,parent);el.onclick=cb;return el;
 };
 function paint(){
  const track=get('duoTrack'),seats=get('duoSeats'),actions=get('duoActions'),log=get('duoLog');
  for(const el of [track,seats,actions,log])el.replaceChildren();
  if(!game){show('duoTurnName','Warte auf einen lokalen Raum');return}
  show('duoAlliedLP',game.teams[0].lp.toLocaleString('de-AT')+' LP');
  show('duoEnemyLP',game.teams[1].lp.toLocaleString('de-AT')+' LP');
  show('duoTurnName',game.status==='waiting'?'Warte auf deinen Partner':
    game.status==='finished'?(game.winner===0?'Sieg des Bündnisses!':'Die Gegner gewinnen!'):
    'Runde '+game.round+' · '+game.players[game.activeSeat].name+' ist am Zug');
  for(const seat of core.SEATS){
   const p=game.players[seat.id];
   node('div','turn-seat '+(seat.team===1?'enemy ':'')+(game.activeSeat===seat.id&&game.status==='active'?'current':''),p.name,track);
   const box=node('article','seat '+(game.activeSeat===seat.id&&game.status==='active'?'active':''),undefined,seats);
   node('h3','',p.name,box);
   node('small','',(seat.kind==='ai'?'KI-Gegner':'Verbündeter')+' · '+p.hand.length+' Handkarten · '+p.deck.length+' im Deck',box);
   const field=node('div','field',undefined,box);
   for(const c of p.field)node('div','field-cell '+(c?'filled':''),c?names(c.id)+' '+c.atk+'/'+c.def:'◇',field);
  }
  for(const entry of [...game.log].slice(-8).reverse())node('li','',entry,log);
  if(game.status==='waiting'){node('p','micro','Die zweite menschliche Position ist reserviert.',actions);return}
  if(game.status==='finished')return;
  const seat=game.activeSeat,p=game.players[seat];
  if(seat===1||seat===3){
   button('KI-Zug ausführen',()=>{
    try{game=core.aiTurn(game,{catalog});paint()}catch(e){show('duoStatus',e.message)}
   },actions);return;
  }
  if(!p.summoned&&p.hand.length&&p.field.some(c=>!c)){
   const chooser=node('select','',undefined,actions);
   p.hand.forEach((id,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=names(id)+' · '+catalog[id].atk+'/'+catalog[id].def;chooser.append(opt)});
   button('Karte beschwören',()=>{
    const slot=p.field.findIndex(c=>!c);
    take(seat,{type:'summon',slot,handIndex:Number(chooser.value)});
   },actions);
  }
  const attacker=p.field.findIndex(c=>c&&!c.used&&c.placedRound<game.round);
  if(attacker>=0){
   const targets=game.players.filter(x=>x.team!==p.team).flatMap(x=>x.field.map((c,i)=>c?{seat:x.seat,slot:i}:null).filter(Boolean));
   button('Angreifen',()=>{
    take(seat,{type:'attack',slot:attacker,targetSeat:targets[0]?.seat??null,targetSlot:targets[0]?.slot??null});
   },actions);
  }
  button('Zug beenden →',()=>take(seat,{type:'end'}),actions);
 }
 paint();
})();