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
 function resolve(g,predecessor,newcomer){
  if(!enabled(g)||!newcomer?.predatorLeader)return null;
  const p=g.players[g.active];
  // A fusion may consume the former king as material: no ghost showdown.
  if(!predecessor||predecessor===newcomer||!p.field.includes(predecessor)||
     !p.field.includes(newcomer))return null;
  const old=face(predecessor),young=face(newcomer);
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
  // The old king cannot regain leadership when the newcomer leaves the field.
  for(const card of p.field)if(card&&card!==newcomer&&card.predatorLeader)
   delete card.predatorLeader;
  g.predatorShowdown={outcome,seat:g.active,oldUid:old.uid,newUid:young.uid,
   old,new:young,penaltyPct:outcome==='struggle'?15:0,presented:false};
  return g.predatorShowdown;
 }
 const previousPlace=placePending;
 placePending=function(g,...args){
  const p=g?.players?.[g.active];
  const predecessor=enabled(g)?leader(p):null;
  const result=previousPlace(g,...args);
  if(result)resolve(g,predecessor,result.card);
  return result;
 };
 // The alternative hand+field fusion directly writes the field; share the
 // same settled game rule and cinematic, never duplicate another RNG roll.
 window.ArcanePredatorShowdownSolo199=Object.freeze({
  capture:g=>enabled(g)?leader(g.players?.[g.active]):null,resolve});
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
 const originalAiAction=applyAiAction;
 applyAiAction=function(g,action){
  const before=g?.predatorShowdown;
  const result=originalAiAction.apply(this,arguments);
  const event=g?.predatorShowdown;
  // AI fusions use the same settled rules; they have no onOwnSlot callback.
  if(enabled(g)&&typeof game!=='undefined'&&game===g&&
   typeof uiMode!=='undefined'&&uiMode==='duel'&&
   event&&event!==before&&!event.presented){
   event.presented=true;
   window.ArcanePredatorShowdown199?.play(event);
  }
  return result;
 };
})();
