/* Arcane Duel solo v19.9: actual rolled leadership succession.
 * Never run in symmetric AI research or classic mode. */
'use strict';
(()=>{
 const enabled=g=>g?.mode==='pve'&&!g.strategicTraining?.symmetricSides;
 const round10=v=>Math.max(0,Math.round(v/10)*10);
 const leader=p=>p?.field?.filter(c=>c?.fusion&&c.predatorLeader)
  .sort((a,b)=>(b.predatorLeader.bornUid||b.uid)-
   (a.predatorLeader.bornUid||a.uid))[0]||null;
 const face=c=>{
  const d=dataOf(c);
  return {uid:c.uid,id:c.id,name:d.name,art:d.art,level:d.level,
   atk:d.atk,def:d.def};
 };
 const previousPlace=placePending;
 placePending=function(g,...args){
  const p=g?.players?.[g.active];
  const predecessor=enabled(g)?leader(p):null;
  const result=previousPlace(g,...args);
  if(!result||!enabled(g)||!result.card?.predatorLeader)return result;
  // If the old alpha was consumed by a field fusion, it cannot fight again.
  if(!predecessor||!p.field.includes(predecessor))return result;
  const newcomer=result.card,old=face(predecessor),young=face(newcomer);
  const roll=randomInt(g,100),outcome=roll<30?'struggle':roll<50?'overthrow':'stalemate';
  if(outcome==='struggle'){
   for(const card of [predecessor,newcomer]){
    const stats=dataOf(card);
    card.card={...card.card,atk:round10(stats.atk*.85),def:round10(stats.def*.85)};
   }
   logEvent(g,'🐾 Machtkampf: Alter und neuer Rudelführer verlieren 15 % ATK / DEF.');
  }else if(outcome==='overthrow'){
   const oldSlot=p.field.indexOf(predecessor);
   if(oldSlot>=0){p.field[oldSlot]=null;delete predecessor.predatorLeader;
    p.graveyard.push(predecessor);}
   logEvent(g,'🐾 Rudelführersturz: Der neue Alpha zerfleischt den alten.');
  }else logEvent(g,'🐾 Patt: Beide überleben. Der neue Rudelführer übernimmt.');
  // The former alpha is never reactivated after its successor disappears.
  for(const card of p.field)if(card&&card!==newcomer&&card.predatorLeader)
   delete card.predatorLeader;
  g.predatorShowdown={outcome,seat:g.active,oldUid:old.uid,newUid:young.uid,
   old,new:young,penaltyPct:outcome==='struggle'?15:0,presented:false};
  return result;
 };
 const originalSlot=onOwnSlot;
 onOwnSlot=async function(...args){
  const before=typeof game!=='undefined'?game?.predatorShowdown:null;
  // Await the ordinary fusion cinema before staging the leadership showdown.
  const result=await originalSlot.apply(this,args);
  const event=typeof game!=='undefined'?game?.predatorShowdown:null;
  if(event&&event!==before&&!event.presented){
   event.presented=true;
   await window.ArcanePredatorShowdown199?.play(event);
   if(typeof render==='function')render();
  }
  return result;
 };
})();
