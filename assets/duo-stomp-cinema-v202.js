/* Arcane Duel 2v2 · v20.2 elemental fusion Stomp cinematic.
 * Reads exclusively confirmed server events; never affects combat or RNG.
 */
'use strict';
(()=>{
 const COLORS={FEUER:['#ff4c19','#ffb451'],WASSER:['#1ea9ff','#92efff'],
  ERDE:['#74dc55','#ddff9a'],WIND:['#48e4a7','#dbfff2'],
  LICHT:['#ffce40','#fff9c8'],DUNKEL:['#a05aff','#f1b5ff']};
 const NS='http://www.w3.org/2000/svg';
 let stage=null,timers=[],generation=0;
 const reduced=()=>document.hidden||document.visibilityState==='hidden'||
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
  document.body?.classList.contains('ad-motion-disabled');
 function inspect(before,after){
  if(!before||!after||before.roomId!==after.roomId||
   before.chapter!==after.chapter||after.revision<=before.revision)return null;
  const event=after.stompEvent;
  if(!event||event.revision!==after.revision||!Array.isArray(event.hits)||
   !event.hits.length||event.materials<3)return null;
  if(![0,1,2,3].includes(event.sourceSeat)||!Number.isInteger(event.sourceSlot)||
   ![0,1,2,3].includes(event.primary?.seat)||!Number.isInteger(event.primary?.slot))
   return null;
  return event;
 }
 function clear(){generation++;timers.forEach(clearTimeout);timers=[];stage?.remove();stage=null;
  document.getElementById('duoSeats')?.classList.remove('ad202-shake');}
 function point(where){
  if(!where)return null;
  const node=document.querySelector('#duoSeats .seat[data-seat="'+where.seat+
   '"] > .field > .field-cell[data-slot="'+where.slot+'"]');
  const rect=node?.getBoundingClientRect?.();
  if(!rect||rect.width<2||rect.height<2||rect.right<0||rect.left>innerWidth||
   rect.bottom<0||rect.top>innerHeight)return null;
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
 }
 function ray(svg,start,end,type){
  for(const layer of ['halo','core']){
   const line=document.createElementNS(NS,'path');
   line.setAttribute('d','M '+start.x+' '+start.y+' L '+end.x+' '+end.y);
   line.setAttribute('class','ad202-ray ad202-'+type+' ad202-'+layer);
   line.setAttribute('pathLength','100');svg.append(line);
  }
 }
 function burst(host,where,primary,pct){
  const p=point(where);if(!p)return;
  const el=document.createElement('div');el.className='ad202-burst'+
   (primary?' ad202-burst-primary':' ad202-burst-splash');
  el.style.left=p.x+'px';el.style.top=p.y+'px';
  for(let i=0;i<(primary?28:13);i++){
   const particle=document.createElement('i');
   particle.style.setProperty('--angle',(i*137.508)+'deg');
   particle.style.setProperty('--distance','-'+(40+i%7*11)+'px');
   particle.style.setProperty('--delay',(i%6*16)+'ms');el.append(particle);
  }
  if(!primary){const amount=document.createElement('strong');
   amount.textContent=pct+' %';el.append(amount);}
  host.append(el);
 }
 function draw(event){
  const start=point({seat:event.sourceSeat,slot:event.sourceSlot}),
   primary=point(event.primary);
  if(!start||!primary)return false;
  const colors=COLORS[String(event.element||'LICHT').toUpperCase()]||COLORS.LICHT;
  stage=document.createElement('div');stage.className='ad202-stomp-stage';
  stage.setAttribute('aria-hidden','true');
  stage.style.setProperty('--ad202-color',colors[0]);
  stage.style.setProperty('--ad202-light',colors[1]);
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);
  svg.setAttribute('width',String(innerWidth));svg.setAttribute('height',String(innerHeight));
  ray(svg,start,primary,'primary');
  for(const hit of event.hits){const secondary=point(hit);
   if(secondary)ray(svg,primary,secondary,'secondary');}
  stage.append(svg);burst(stage,event.primary,true);
  for(const hit of event.hits)burst(stage,hit,false,hit.pct);
  document.body.append(stage);return true;
 }
 function onState(before,after){
  const event=inspect(before,after);
  if(!event){
   if(before&&after&&after.revision>before.revision)clear();
   return null;
  }
  clear();if(reduced()||!draw(event))return event;
  const stamp=generation;
  const schedule=(ms,fn)=>timers.push(setTimeout(()=>{
   if(stamp===generation&&stage&&!reduced())fn();
  },ms));
  schedule(35,()=>stage.classList.add('ad202-firing'));
  schedule(270,()=>stage.classList.add('ad202-splitting'));
  schedule(340,()=>document.getElementById('duoSeats')?.classList.add('ad202-shake'));
  schedule(510,()=>document.getElementById('duoSeats')?.classList.remove('ad202-shake'));
  schedule(750,()=>{document.getElementById('duoSeats')?.classList.remove('ad202-shake');clear();});
  return event;
 }
 window.ArcaneDuoStompCinema202=Object.freeze({version:'20.2',inspect,onState,clear});
})();
