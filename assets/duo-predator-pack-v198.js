/* Arcane Duel 2v2 v19.8 – server-confirmed Rudelführer presentation.
 * All combat, roll, token and pursuit decisions live in duo-shared-rules.
 * This layer only decorates public cards / plays short non-blocking effects.
 */
'use strict';
(()=>{
 const powers=Object.freeze({swarm:'Rudelinstinkt',mark:'Blutspur',token:'Rudelruf'});
 let layer=null,timer=null,stamp=0;
 const reduced=()=>!!(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
  document.body?.classList.contains('ad-motion-disabled'));
 const position=(seat,slot,area='field')=>document.querySelector(
  '#duoSeats .seat[data-seat="'+seat+'"] '+(area==='ghost'?'.duo-ghost-reserve .duo-ghost-cell':
   '> .field > .field-cell')+'[data-slot="'+slot+'"]');
 function cardPosition(game,seat,uid){
  const index=game?.players?.[seat]?.field?.findIndex(c=>c?.uid===uid)??-1;
  return index>=0?position(seat,index):null;
 }
 function place(tag,cls,text,parent){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;
  parent?.append(el);return el;
 }
 function leader(player){
  return player?.field?.filter(c=>c?.fusion&&c.role==='predator'&&c.predatorLeader)
   .sort((a,b)=>(b.predatorLeader.bornUid||b.uid)-
    (a.predatorLeader.bornUid||a.uid))[0]||null;
 }
 function decorate({game}={}){
  if(!game?.players)return;
  const hunt=game.predatorPursuit;
  for(const player of game.players){
   const alpha=leader(player);
   player.field.forEach((card,slot)=>{
    if(!card)return;
    const cell=position(player.seat,slot);if(!cell)return;
    if(card.uid===alpha?.uid){
     cell.classList.add('ad198-alpha');
     const names=alpha.predatorLeader.powers.map(power=>powers[power]||power);
     const label='Rudelführer · '+alpha.predatorLeader.materials+' Materialien · '+
      (names.length?names.join(', '):'Basisbonus');
     const crown=place('span','ad198-crown','♛',cell);
     crown.setAttribute('aria-label',label);crown.title=label;
    }
    if(card.predatorToken){
     cell.classList.add('ad198-token');
     const tag=place('span','ad198-token-label','🐾 TOKEN',cell);
     tag.title='Rudelgeist · schwächer als ein normales Monster · niemals fusionierbar';
    }
    if(hunt&&hunt.turn===game.turn&&hunt.targetUid===card.uid&&
       game.players[hunt.ownerSeat]?.team!==player.team){
     cell.classList.add('ad198-hunted');
     const marker=place('span','ad198-hunt-crosshair','⊗',cell);
     marker.title='Blutspur – weitere eigene Predator-Angreifer verursachen mehr Schaden';
     marker.setAttribute('aria-label','Blutspur: Ziel markiert');
    }
   });
   (player.lv1?.ghostSlots||[]).forEach((card,slot)=>{
    if(!card||!hunt||hunt.turn!==game.turn||hunt.targetUid!==card.uid||
       game.players[hunt.ownerSeat]?.team===player.team)return;
    const cell=position(player.seat,slot,'ghost');if(!cell)return;
    cell.classList.add('ad198-hunted');
    const marker=place('span','ad198-hunt-crosshair','⊗',cell);
    marker.title='Blutspur: Markiertes Monster in der Geisterzone';
   });
  }
 }
 function center(node){
  const rect=node?.getBoundingClientRect();
  if(!rect||rect.width<3||rect.height<3)return null;
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
 }
 function cleanup(){
  clearTimeout(timer);timer=null;layer?.remove();layer=null;
 }
 function confirmed(before,after){
  return !!before&&!!after&&before.roomId===after.roomId&&
   before.chapter===after.chapter&&after.revision>before.revision;
 }
 function analyze(before,after){
  if(!confirmed(before,after))return [];
  const result=[],hit=after.predatorImpact;
  if(hit?.revision===after.revision&&hit.followups>0){
   result.push({kind:'hunt',...hit});
  }
  for(const player of after.players||[]){
   const previous=before.players?.[player.seat];if(!previous)continue;
   const old=new Set((previous.field||[]).filter(Boolean).map(c=>c.uid));
   player.field?.forEach((card,slot)=>{
    if(card?.predatorToken&&!old.has(card.uid))result.push({kind:'token',
     seat:player.seat,slot,level:card.level});
   });
  }
  return result;
 }
 function burst(point,heavy){
  if(!point||!layer)return;
  const circle=place('div','ad198-hunt-impact'+(heavy?' ad198-finish':''),undefined,layer);
  circle.style.left=point.x+'px';circle.style.top=point.y+'px';
  place('span','ad198-hunt-ring',undefined,circle);
  place('span','ad198-hunt-claw',heavy?'☷':'✦',circle);
  for(let i=0;i<(heavy?22:14);i++){
   const spark=place('i','ad198-hunt-spark',undefined,circle);
   spark.style.setProperty('--ad198-angle',i*360/(heavy?22:14)+'deg');
   spark.style.setProperty('--ad198-distance',(35+i%4*15)+'px');
  }
 }
 function onState(before,after){
  const events=analyze(before,after);
  if(!confirmed(before,after))return events;
  stamp++;cleanup();
  if(!events.length||reduced()||document.hidden||
     document.visibilityState==='hidden')return events;
  layer=place('div','ad198-predator-stage',undefined,document.body);
  layer.setAttribute('aria-hidden','true');
  const now=stamp;
  for(const event of events){
   if(event.kind==='hunt'){
    const target=center(position(event.targetSeat,event.targetSlot,event.targetArea));
    const origin=center(cardPosition(before,event.ownerSeat,event.attackerUid)||
     cardPosition(after,event.ownerSeat,event.attackerUid));
    if(origin&&target){
     const slash=place('div','ad198-hunt-streak','✦',layer);
     slash.style.left=origin.x+'px';slash.style.top=origin.y+'px';
     slash.style.setProperty('--ad198-dx',(target.x-origin.x)+'px');
     slash.style.setProperty('--ad198-dy',(target.y-origin.y)+'px');
    }
    const label=place('strong','ad198-hunt-notice',
     'BLUTSPUR · +'+Math.round(event.bonusPct*100)+' %',layer);
    label.style.left=(target?.x||window.innerWidth/2)+'px';
    label.style.top=(target?.y||window.innerHeight/2)-60+'px';
    burst(target,event.broken);
   }else{
    const target=center(position(event.seat,event.slot));
    if(target){
     const halo=place('div','ad198-token-arrival','🐾',layer);
     halo.style.left=target.x+'px';halo.style.top=target.y+'px';
    }
   }
  }
  timer=setTimeout(()=>{if(now===stamp)cleanup();},1150);
  return events;
 }
 window.ArcaneDuoPredator198=Object.freeze({version:'19.8.0',analyze,decorate,onState,
  leader,cleanup});
})();
