/* Arcane Duel 2v2 v16.7 – client-only, server-confirmed battle choreography.
 * Does not mutate state, send actions or inspect hidden opponent hands.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.ArcaneDuoCinematics167=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const MAX_EVENTS=3,MAX_SPARKS=6;
 const loc=(seat,slot,area="field")=>({seat,slot,area});
 const occupants=p=>[
  ...(p.field||[]).map((c,slot)=>({c,where:loc(p.seat,slot)})),
  ...((p.lv1?.ghostSlots)||[]).map((c,slot)=>({c,where:loc(p.seat,slot,"ghost")}))
 ];
 const same=(a,b)=>!!a&&!!b&&(a.uid&&b.uid?a.uid===b.uid:a.id===b.id);
 const unitsChanged=(before,after)=>{
  const old=before?.players||[],now=after?.players||[],changes=[];
  for(const p of now){
   const was=old[p.seat];if(!was)continue;
   const original=occupants(was),current=occupants(p);
   current.forEach((spot,i)=>{
    const prior=original[i]?.c,card=spot.c;
    if(!prior&&card)changes.push({kind:"appeared",where:spot.where,card});
    else if(prior&&!card)changes.push({kind:"destroyed",where:spot.where,card:prior});
    else if(prior&&card&&same(prior,card)&&
     (card.atk<prior.atk||card.def<prior.def))
      changes.push({kind:"hit",where:spot.where,card});
    else if(prior&&card&&!same(prior,card))
      changes.push({kind:"appeared",where:spot.where,card});
   });
  }
  return changes;
 };
 function recentLines(previous,current){
  const before=previous?.log||[],after=current?.log||[];
  if(after.length>=before.length&&before.every((x,i)=>x===after[i]))
   return after.slice(before.length);
  // Rebuilt logs on chapter changes must not be replayed.
  if(previous?.chapter!==current?.chapter)return [];
  let overlap=0;
  for(let count=Math.min(before.length,after.length);count>0;count--){
   if(before.slice(-count).every((line,i)=>line===after[i])){overlap=count;break;}
  }
  return overlap?after.slice(overlap):after.slice(-2);
 }
 function describe(previous,current){
  if(!previous||!current||previous.roomId!==current.roomId||
   previous.revision===current.revision)return [];
  if(previous.chapter!==current.chapter)return [{type:"chapter",text:"Neues Kapitel beginnt."}];
  const changes=unitsChanged(previous,current),lines=recentLines(previous,current);
  const events=[];
  const newly=changes.filter(x=>x.kind==="appeared"),
   harmed=changes.filter(x=>x.kind==="hit"||x.kind==="destroyed");
  for(const line of lines){
   const text=String(line).slice(0,220);
   if(/schicksalszug/i.test(text)){
    const owner=current.fateEvent?.ownerSeat;
    events.push({type:"fate",text,where:newly.find(x=>x.where.seat===owner)?.where});
   }else if(/fusioniert/i.test(text)){
    events.push({type:"fusion",text,where:newly.shift()?.where});
   }else if(/greift\b/i.test(text)){
    const attacker=(previous.players||[]).find(p=>text.startsWith(p.name+" greift"));
    const source=attacker&&occupants(attacker).find(x=>x.c&&
      occupants(current.players[attacker.seat]||attacker).some(y=>
       y.where.slot===x.where.slot&&y.where.area===x.where.area&&
       y.c&&y.c.used&&!x.c.used));
    events.push({type:"attack",text,from:source?.where,
     where:harmed.find(x=>x.where.seat!==attacker?.seat)?.where});
   }else if(/direkter Angriff/i.test(text)){
    const attacker=(previous.players||[]).find(p=>text.startsWith(p.name+" · direkter Angriff"));
    const source=attacker&&occupants(attacker).find(x=>x.c&&
     occupants(current.players[attacker.seat]||attacker).some(y=>
      y.where.slot===x.where.slot&&y.where.area===x.where.area&&
      y.c&&y.c.used&&!x.c.used));
    events.push({type:"attack",text,from:source?.where,
     where:attacker?{team:1-attacker.team}:null});
   }else if(/arena-zerfall/i.test(text)){
    events.push({type:"arena",text});
   }else if(/beschwört/i.test(text)){
    events.push({type:"summon",text,where:newly.shift()?.where});
   }
  }
  if(events.some(e=>e.type==="attack")){
   const destroyed=harmed.find(x=>x.kind==="destroyed");
   if(destroyed)events.push({type:"destroy",
    text:"Ein Monster wurde durch den Angriff zerstört.",where:destroyed.where});
  }
  if(!events.length&&newly.length)events.push({type:"summon",
   text:"Ein Monster ist auf dem Spielfeld erschienen.",where:newly[0].where});
  if(!events.length&&harmed.some(x=>x.kind==="destroyed"))
   events.push({type:"destroy",text:"Ein Monster wurde zerstört.",
    where:harmed.find(x=>x.kind==="destroyed").where});
  return events.slice(-MAX_EVENTS);
 }
 let stage=null,notice=null,pending=[],serial=0;
 function ensureUI(){
  const arena=document.querySelector(".duo-battle");
  if(!arena)return false;
  if(!stage||!stage.isConnected){
   stage=document.createElement("div");stage.id="duoFxStage";
   stage.className="duo-fx-stage";stage.setAttribute("aria-hidden","true");
   arena.append(stage);
  }
  if(!notice||!notice.isConnected){
   notice=document.createElement("div");notice.id="duoFxNotice";
   notice.className="duo-fx-notice";notice.setAttribute("role","status");
   notice.setAttribute("aria-live","polite");arena.append(notice);
  }
  return true;
 }
 const reduced=()=>typeof window!=="undefined"&&window.matchMedia&&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const endpoint=where=>{
  if(!where)return null;
  if(where.team===0||where.team===1)return document.getElementById(
   where.team===0?'duoAlliedLP':'duoEnemyLP');
  const selector='.seat[data-seat="'+where.seat+'"] '+
   (where.area==="ghost"?'.duo-ghost-cell':'.field>.field-cell')+
   '[data-slot="'+where.slot+'"]';
  return document.querySelector(selector);
 };
 function center(node){
  if(!node||!stage)return null;
  const rect=node.getBoundingClientRect(),host=stage.getBoundingClientRect();
  return {x:rect.left-host.left+rect.width/2,y:rect.top-host.top+rect.height/2,
   width:Math.min(rect.width,100),height:Math.min(rect.height,95)};
 }
 function burst(point,type){
  if(!point)return;
  const ring=document.createElement("span");
  ring.className="duo-fx-burst duo-fx-"+type;
  ring.style.left=point.x+"px";ring.style.top=point.y+"px";
  stage.append(ring);
  for(let i=0;i<MAX_SPARKS;i++){
   const spark=document.createElement("i");
   spark.className="duo-fx-spark";
   spark.style.setProperty("--angle",String(i*360/MAX_SPARKS)+"deg");
   ring.append(spark);
  }
 }
 function travel(source,destination,sourceNode){
  if(!source||!destination)return;
  const phantom=sourceNode?.classList?.contains('filled')?
   sourceNode.cloneNode(true):document.createElement('span');
  phantom.className=sourceNode?.classList?.contains('filled')?
   'duo-fx-lunging-card':'duo-fx-projectile';
  if(!sourceNode?.classList?.contains('filled'))phantom.textContent='✦';
  phantom.removeAttribute('id');
  phantom.style.left=source.x+'px';phantom.style.top=source.y+'px';
  phantom.style.setProperty('--move-x',(destination.x-source.x)*.5+'px');
  phantom.style.setProperty('--move-y',(destination.y-source.y)*.5+'px');
  stage.append(phantom);
 }
 function present(e,sequence){
  if(sequence!==serial||!ensureUI())return;
  notice.textContent=e.text;notice.classList.add("visible");
  if(reduced()||document.visibilityState==="hidden")return;
  stage.replaceChildren();
  const to=center(endpoint(e.where)),from=center(endpoint(e.from));
  if(e.type==="attack"){
   travel(from,to,endpoint(e.from));
   pending.push(setTimeout(()=>{
    if(sequence===serial)burst(to||from,"hit");
   },240));
  }
  else if(e.type==="arena"){burst(center(document.querySelector("#duoAlliedLP")),"arena");}
  else if(e.type==="fusion"||e.type==="fate"||e.type==="summon"||
    e.type==="destroy"){
   // v19.0 owns only confirmed summons from this player's visible hand.
   // Keep the familiar burst for partner and opponent summons.
   if(e.type!=="summon"||!window.ArcaneDuoSummonCinema190?.ownsSummon?.(e.where))
    burst(to,e.type);
  }
 }
 function onState(previous,current){
  const events=describe(previous,current);
  serial++;const sequence=serial;
  pending.forEach(clearTimeout);pending=[];
  if(!events.length||!ensureUI())return events;
  events.forEach((e,i)=>{pending.push(setTimeout(()=>present(e,sequence),i*650));});
  pending.push(setTimeout(()=>{if(sequence===serial&&stage){
   stage.replaceChildren();notice?.classList.remove("visible");
  }},events.length*650+1350));
  return events;
 }
 return Object.freeze({version:"16.7",describe,unitsChanged,recentLines,onState});
});
