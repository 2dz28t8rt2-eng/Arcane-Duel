/* Arcane Duel v19.3 – public, server-confirmed ability effects in 2v2.
 * Visuals only. No actions, card rolls, private hands or stat writes.
 */
'use strict';
(()=>{
 const MAX_EVENTS=6,LIFE=1900,STAGGER=240;
 let layer=null,timers=[],generation=0;
 const number=x=>Math.max(0,Number(x)||0);
 const reduced=()=>!!(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
  document.body?.classList.contains('ad-motion-disabled'));
 const zone=(p,area)=>area==='ghost'?(p.lv1?.ghostSlots||[]):(p.field||[]);
 function confirmed(before,after){
  return !!before&&!!after&&before.roomId===after.roomId&&
   before.chapter===after.chapter&&Number.isSafeInteger(before.revision)&&
   Number.isSafeInteger(after.revision)&&after.revision>before.revision;
 }
 function linesSince(before,after){
  if(!confirmed(before,after))return [];
  const old=before.log||[],now=after.log||[];
  if(now.length>=old.length&&old.every((line,i)=>line===now[i]))return now.slice(old.length);
  for(let count=Math.min(old.length,now.length);count>0;count--){
   if(old.slice(-count).every((line,i)=>line===now[i]))return now.slice(count);
  }
  return [];
 }
 function pairs(before,after){
  const result=[];
  for(const player of after.players||[]){
   const prior=(before.players||[]).find(p=>p.seat===player.seat);
   if(!prior)continue;
   for(const area of ['field','ghost']){
    zone(player,area).forEach((card,slot)=>{
     const old=zone(prior,area)[slot];
     if(!card||!old||old.uid==null||old.uid!==card.uid) return;
     result.push({before:old,after:card,owner:player,
      where:{seat:player.seat,slot,area}});
    });
   }
  }
  return result;
 }
 function findUnique(rows,name,catalog,predicate){
  const found=rows.filter(row=>row.after.role==='soul'&&
   String(catalog[row.after.id]?.name||'')===name&&predicate(row));
  return found.length===1?found[0]:null;
 }
 function targetFor(rows,source,targetName,catalog,atk,def){
  const found=rows.filter(row=>row.owner.team!==source.owner.team&&
   String(catalog[row.after.id]?.name||'')===targetName&&
   number(row.before.atk)-number(row.after.atk)===atk&&
   number(row.before.def)-number(row.after.def)===def);
  return found.length===1?found[0].where:null;
 }
 function analyze(before,after,catalog={}){
  if(!confirmed(before,after))return [];
  const logs=linesSince(before,after),rows=pairs(before,after),events=[],used=new Set();
  if(!logs.length)return [];
  const key=row=>[row.where.seat,row.where.area,row.where.slot,row.after.uid].join(':');
  const take=(name,predicate)=>{
   const row=findUnique(rows,name,catalog,r=>!used.has(key(r))&&predicate(r));
   if(row)used.add(key(row));
   return row;
  };
  for(const line of logs){
   let m=/^(.+?) verdichtet (\d+) Seele: \+(\d+) ATK\b/.exec(String(line));
   if(m){
    const spent=+m[2],row=take(m[1],r=>
     r.after.mode==='def'&&number(r.before.soul)-number(r.after.soul)===spent&&
     number(r.after.condensed)>number(r.before.condensed)&&
     number(r.after.soulCooldown)>number(r.before.soulCooldown));
    if(row){
     const atk=Math.floor(number(row.after.condensed)*.5)-
      Math.floor(number(row.before.condensed)*.5);
     events.push({kind:'condense',where:row.where,
      shield:number(row.after.condensed)-number(row.before.condensed),atk});
    }
    continue;
   }
   m=/^(.+?) raubt (.+?) (\d+) ATK \/ (\d+) DEF und speichert (\d+) Seele\.$/.exec(String(line));
   if(m){
    const [atk,def,gain]=[+m[3],+m[4],+m[5]];
    const row=take(m[1],r=>r.after.mode==='def'&&
     number(r.after.soul)-number(r.before.soul)===gain&&
     number(r.after.raidCooldown)>number(r.before.raidCooldown));
    if(row)events.push({kind:'raid',where:row.where,
     from:targetFor(rows,row,m[2],catalog,atk,def),gain,atk,def});
    continue;
   }
   m=/^(.+?) entzieht beiden Gegnerfeldern (\d+) ATK \/ (\d+) DEF und speichert (\d+) Seele\.$/.exec(String(line));
   if(m){
    const [atk,def,gain]=[+m[2],+m[3],+m[4]];
    const row=take(m[1],r=>r.after.mode==='def'&&
     number(r.after.soul)-number(r.before.soul)===gain&&
     (after.players||[]).find(p=>p.seat===r.where.seat)?.ownTurns>
     (before.players||[]).find(p=>p.seat===r.where.seat)?.ownTurns);
    if(row)events.push({kind:'drain',where:row.where,
     from:(after.players||[]).filter(p=>p.team!==row.owner.team)
      .map(p=>({seat:p.seat,area:'seat'})),gain,atk,def});
    continue;
   }
   m=/^(.+?) konzentriert den Seelenentzug auf (ATK|DEF)\.$/.exec(String(line));
   if(m){
    const preference=m[2]==='ATK'?1:2;
    const row=take(m[1],r=>r.after.mode==='def'&&
     r.after.drainPreference===preference&&
     r.after.lastDrainSwitch!==r.before.lastDrainSwitch);
    if(row)events.push({kind:'focus',where:row.where,stat:m[2]});
    continue;
   }
   m=/^(.+?) · Seelenentladung: (\d+) (?:LP Schaden|Schaden durch Vorhut-Schutz abgefangen)\.$/.exec(String(line));
   if(m){
    const row=take(m[1],r=>r.after.mode==='def'&&number(r.before.soul)>=40&&
     number(r.after.soul)===0&&r.after.lastSoulAction!==r.before.lastSoulAction);
    if(row)events.push({kind:'discharge',where:row.where,
     targetTeam:1-row.owner.team});
   }
  }
  // Resonance grows on the owner's confirmed turn, not with each polling tick.
  const nextTurn=new Set(logs.filter(l=>/ ist am Zug und zieht bis auf fünf Handkarten\.$/.test(String(l)))
   .map(l=>String(l).slice(0,-' ist am Zug und zieht bis auf fünf Handkarten.'.length)));
  const resonance=rows.filter(r=>r.after.resonance>r.before.resonance&&
   r.owner.ownTurns>(before.players||[]).find(p=>p.seat===r.owner.seat)?.ownTurns&&
   nextTurn.has(r.owner.name)&&
   (r.after.role==='combatant'||(r.after.role==='resonator'&&r.after.fusion)))
   .sort((a,b)=>a.where.seat-b.where.seat||a.where.slot-b.where.slot);
  for(const row of resonance.slice(0,Math.max(0,MAX_EVENTS-events.length))){
   const pct=row.after.role==='combatant'?4+4*row.after.resonance:
    10+10*row.after.resonance;
   events.push({kind:'resonance',where:row.where,pct});
  }
  return events.slice(0,MAX_EVENTS);
 }
 function clear(){
  generation++;for(const timer of timers)clearTimeout(timer);timers=[];
  layer?.remove();layer=null;
 }
 function create(tag,cls,parent,text){
  const node=document.createElement(tag);node.className=cls||'';
  if(text!==undefined)node.textContent=text;
  parent?.append(node);return node;
 }
 function anchor(where){
  if(!where)return null;
  const panel='#duoSeats .seat[data-seat="'+where.seat+'"]';
  if(where.area==='seat')return document.querySelector(panel);
  return document.querySelector(where.area==='ghost'?
   panel+' .duo-ghost-reserve .duo-ghost-cell[data-slot="'+where.slot+'"]':
   panel+' > .field > .field-cell[data-slot="'+where.slot+'"]');
 }
 function point(where){
  const rect=anchor(where)?.getBoundingClientRect();
  if(!rect||![rect.left,rect.top,rect.width,rect.height].every(Number.isFinite)||
   rect.width<5||rect.height<5||rect.right<0||rect.left>window.innerWidth||
   rect.bottom<0||rect.top>window.innerHeight)return null;
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
 }
 function mote(from,to,kind){
  if(!from||!to||!layer)return;
  const el=create('div','ad193-mote ad193-mote-'+kind,layer,'✦');
  el.style.left=from.x+'px';el.style.top=from.y+'px';
  el.style.setProperty('--ad193-dx',(to.x-from.x)+'px');
  el.style.setProperty('--ad193-dy',(to.y-from.y)+'px');
 }
 function burst(where,kind,title,detail){
  const center=point(where);
  if(!center||!layer)return null;
  const node=create('div','ad193-burst ad193-'+kind,layer);
  node.style.left=center.x+'px';node.style.top=center.y+'px';
  create('div','ad193-glyph',node,
   ({condense:'◆',raid:'✦',drain:'✦',focus:'◎',discharge:'☄',resonance:'✧'})[kind]);
  const label=create('div','ad193-label',node);
  create('strong','',label,title);
  if(detail)create('small','',label,detail);
  for(let i=0;i<8;i++){
   const spark=create('i','ad193-spark',node);
   spark.style.setProperty('--ad193-angle',(i*45)+'deg');
  }
  return center;
 }
 function play(event){
  if(!event||reduced()||document.hidden||document.visibilityState==='hidden')return false;
  if(!point(event.where))return false;
  if(!layer){layer=create('div','ad193-ability-stage',document.body);
   layer.setAttribute('aria-hidden','true');}
  if(event.kind==='condense'){
   burst(event.where,'condense','VERDICHTEN',
    '+'+event.atk+' ATK · +'+event.shield+' Schutz');
  }else if(event.kind==='raid'){
   const from=point(event.from),to=point(event.where);
   mote(from,to,'raid');
   burst(event.where,'raid','SEELENRAUB',
    '+'+event.gain+' Seele · −'+event.atk+' ATK / −'+event.def+' DEF');
  }else if(event.kind==='drain'){
   const to=point(event.where);
   for(const from of event.from||[])mote(point(from),to,'drain');
   burst(event.where,'drain','SEELENENTZUG',
    '+'+event.gain+' Seele · −'+event.atk+' ATK / −'+event.def+' DEF');
  }else if(event.kind==='focus'){
   burst(event.where,'focus','SEELENFOKUS',event.stat+' bevorzugt');
  }else if(event.kind==='discharge'){
   const to=document.getElementById(event.targetTeam===0?'duoAlliedLP':'duoEnemyLP');
   const rect=to?.getBoundingClientRect();
   if(rect?.width>0&&rect?.height>0)mote(point(event.where),
    {x:rect.left+rect.width/2,y:rect.top+rect.height/2},'discharge');
   burst(event.where,'discharge','SEELENENTLADUNG','Gespeicherte Energie entfesselt');
  }else if(event.kind==='resonance'){
   burst(event.where,'resonance','RESONANZ','Jetzt +'+event.pct+' %');
  }else return false;
  return true;
 }
 function onState(before,after,catalog={}){
  const events=analyze(before,after,catalog);
  if(!events.length){
   if(before&&after&&(!confirmed(before,after)?before.roomId!==after.roomId||
     before.chapter!==after.chapter: true))clear();
   return [];
  }
  clear();const stamp=generation;
  events.forEach((event,index)=>timers.push(setTimeout(()=>{
   if(generation===stamp)play(event);
  },120+index*STAGGER)));
  timers.push(setTimeout(()=>{if(generation===stamp)clear();},
   120+(events.length-1)*STAGGER+LIFE));
  return events;
 }
 window.ArcaneDuoAbilitiesCinema193=Object.freeze({version:'19.3.0',analyze,linesSince,
  onState,play,clear});
})();
