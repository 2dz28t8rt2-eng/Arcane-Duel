/* Arcane Duel v19.0 – server-confirmed hand-to-field summoning cinema.
 * Purely visual. No extra actions, gameplay mutations or opponent-hand reads.
 */
'use strict';
(()=>{
  const FLIGHT_MS=560,LAND_MS=840,PARTICLES=12;
  const idOf=c=>typeof c==='number'?c:c?.id;
  let sequence=0,stage=null,timers=[],claim=null;
  const reduced=()=>!!(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
    document.body?.classList.contains('ad-motion-disabled'));
  const finiteRect=r=>r&&[r.left,r.top,r.width,r.height].every(Number.isFinite)&&r.width>8&&r.height>8;
  function capture({action,game,seat,catalog={}}={}){
    if(action?.type!=='summon'||![0,2].includes(seat)||game?.status!=='active'||
       game.activeSeat!==seat||!Number.isInteger(action.handIndex)||
       !Number.isInteger(action.slot))return null;
    const player=game.players?.[seat];
    if(!player||!Array.isArray(player.field)||action.slot<0||
       action.slot>=player.field.length||player.field[action.slot]!=null)return null;
    const id=idOf(player.hand?.[action.handIndex]);
    if(!Number.isInteger(id))return null;
    const source=document.querySelector('#duoSeats .seat[data-seat="'+seat+'"] '+
      '.duo178-hand-card[data-index="'+action.handIndex+'"]');
    const rect=source?.getBoundingClientRect();
    if(!finiteRect(rect))return null;
    const template=catalog[id]||{};
    return {roomId:game.roomId,chapter:game.chapter,revision:game.revision,
      seat,slot:action.slot,handIndex:action.handIndex,cardId:id,
      name:String(template.name||source.textContent||'Monster').slice(0,90),
      level:template.level,art:typeof template.art==='string'&&template.art.length<1024?
        template.art:'',
      rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height},
      scrollX:window.scrollX||0,scrollY:window.scrollY||0};
  }
  function confirmed({ticket,before,after}={}){
    if(!ticket||!before||!after||after.roomId!==before.roomId||
       ticket.roomId!==before.roomId||after.chapter!==before.chapter||
       !Number.isSafeInteger(before.revision)||
       !Number.isSafeInteger(after.revision)||after.revision<=before.revision)return false;
    const was=before.players?.[ticket.seat],now=after.players?.[ticket.seat];
    return !!was&&!!now&&was.field?.[ticket.slot]==null&&
      idOf(was.hand?.[ticket.handIndex])===ticket.cardId&&
      idOf(now.field?.[ticket.slot])===ticket.cardId;
  }
  function ownsSummon(where){
    if(!claim||claim.consumed||Date.now()>claim.until||!where)return false;
    if(where.seat!==claim.seat||where.slot!==claim.slot||
       (where.area||'field')!=='field')return false;
    claim.consumed=true;return true;
  }
  function cleanup(){
    for(const timer of timers)clearTimeout(timer);
    timers=[];
    stage?.remove();stage=null;
    document.querySelectorAll('.ad190-awaiting,.ad190-arrived').forEach(cell=>
      cell.classList.remove('ad190-awaiting','ad190-arrived'));
  }
  function make(tag,cls,text,parent){
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=text;
    if(parent)parent.append(el);
    return el;
  }
  function play({ticket,before,after}={}){
    if(!confirmed({ticket,before,after})||reduced()||document.hidden||
       document.visibilityState==='hidden')return false;
    const target=document.querySelector('#duoSeats .seat[data-seat="'+ticket.seat+'"] > .field > '+
        '.field-cell[data-slot="'+ticket.slot+'"]');
    const destination=target?.getBoundingClientRect();
    if(!finiteRect(destination))return false;
    // Geometry captured before the request remains document-relative if the
    // player scrolls while waiting for server confirmation.
    const origin={...ticket.rect,left:ticket.rect.left+ticket.scrollX-(window.scrollX||0),
      top:ticket.rect.top+ticket.scrollY-(window.scrollY||0)};
    const viewportWidth=window.innerWidth||1200,viewportHeight=window.innerHeight||850;
    if(origin.left+origin.width<0||origin.left>viewportWidth||origin.top+origin.height<0||
       origin.top>viewportHeight)return false;
    cleanup();const stamp=++sequence;
    claim={seat:ticket.seat,slot:ticket.slot,until:Date.now()+2200,consumed:false};
    stage=make('div','ad190-summon-stage',undefined,document.body);
    stage.setAttribute('aria-hidden','true');
    const flight=make('div','ad190-flight-card',undefined,stage);
    flight.style.left=origin.left+'px';flight.style.top=origin.top+'px';
    flight.style.width=Math.min(146,Math.max(65,origin.width))+'px';
    flight.style.height=Math.min(165,Math.max(83,origin.height))+'px';
    const startX=origin.left+origin.width/2,startY=origin.top+origin.height/2;
    const endX=destination.left+destination.width/2,endY=destination.top+destination.height/2;
    const dx=endX-startX,dy=endY-startY;
    flight.style.setProperty('--ad190-dx',dx+'px');
    flight.style.setProperty('--ad190-dy',dy+'px');
    flight.style.setProperty('--ad190-half-x',dx*.48+'px');
    flight.style.setProperty('--ad190-half-y',dy*.32-42+'px');
    const art=make('div','ad190-card-art',undefined,flight);
    if(ticket.art){const img=make('img',undefined,undefined,art);img.src=ticket.art;img.alt='';}
    else art.textContent='✧';
    make('strong','ad190-card-name',ticket.name,flight);
    if(ticket.level)make('small','ad190-card-level','LEVEL '+ticket.level,flight);
    target.classList.add('ad190-awaiting');
    const at=ms=>{const timer=setTimeout(()=>{
      if(sequence!==stamp)return;
      target.classList.remove('ad190-awaiting');target.classList.add('ad190-arrived');
      flight.classList.add('ad190-flight-landed');
      const burst=make('div','ad190-summon-burst',undefined,stage);
      burst.style.left=endX+'px';burst.style.top=endY+'px';
      make('span','ad190-burst-ring',undefined,burst);
      make('span','ad190-burst-core','✦',burst);
      for(let i=0;i<PARTICLES;i++){
        const particle=make('i','ad190-summon-particle',undefined,burst);
        particle.style.setProperty('--ad190-angle',(i*360/PARTICLES)+'deg');
        particle.style.setProperty('--ad190-radius',(42+(i%3)*15)+'px');
        particle.style.animationDelay=((i%4)*32)+'ms';
      }
    },ms);timers.push(timer);};
    at(FLIGHT_MS);
    timers.push(setTimeout(()=>{if(sequence===stamp)cleanup();},FLIGHT_MS+LAND_MS));
    return true;
  }
  window.ArcaneDuoSummonCinema190=Object.freeze({version:'19.0.0',capture,confirmed,ownsSummon,play,
    timings:Object.freeze({flight:FLIGHT_MS,land:LAND_MS})});
})();
