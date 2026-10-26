/* Arcane Duel 2v2 v17.0: actual confirmed fusion roll cinema and private draw motion.
 * Rendering only. The two humans occupy seats 0/2; the two NPCs occupy 1/3.
 * Fusions use the confirmed rollTrace/rollMath. Opponent hands always remain face down.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.ArcaneDuoCinema170=api;
})(typeof window!=="undefined"?window:null,function(){
 'use strict';
 const MAX_ROLLS=12,MAX_DRAW=5,ROLE_NAMES=Object.freeze({
  predator:'PREDATOR',guardian:'WÄCHTER',soul:'SEELENZEHRER',
  resonator:'RESONATOR',combatant:'ALLROUNDER'
 });
 const presentPositions=(p)=>{
  const list=[];
  (p.field||[]).forEach((c,slot)=>{if(c)list.push({c,slot,area:'field'});});
  (p.lv1?.ghostSlots||[]).forEach((c,slot)=>{if(c)list.push({c,slot,area:'ghost'});});
  return list;
 };
 const observed=(prev,cur)=>{
  if(!prev||!cur||prev.roomId!==cur.roomId||
    !Number.isSafeInteger(prev.revision)||!Number.isSafeInteger(cur.revision)||
    cur.revision<=prev.revision||prev.chapter!==cur.chapter)return [];
  const actions=[],fate=cur.fateEvent&&
   (prev.fateEvent?.ownerSeat!==cur.fateEvent.ownerSeat||
    prev.fateEvent?.round!==cur.fateEvent.round);
  for(const p of cur.players||[]){
   const old=prev.players?.[p.seat];if(!old)continue;
   const existing=new Set(presentPositions(old).map(x=>x.c.uid));
   for(const {c,slot,area} of presentPositions(p)){
    if(!c?.fusion||!Array.isArray(c.rollTrace)||!c.rollMath||
      existing.has(c.uid))continue;
    const trace=c.rollTrace.slice(0,MAX_ROLLS)
     .map(x=>({atk:Number(x.atk)||0,def:Number(x.def)||0}));
    if(trace.length===0)continue;
    actions.push({kind:'fusion',seat:p.seat,slot,area,name:p.name,
     result:{id:c.id,level:c.level,atk:c.atk,def:c.def,role:c.role,
      pattern:String(c.pattern||'Fusion').slice(0,60),
      winnerIndex:c.rollMath.winnerIndex,rolls:trace,
      bonus:{atk:c.materialBonus?.atk||0,def:c.materialBonus?.def||0},
      quality:Number(c.quality)||1}});
   }
   // The server exposes hand *counts* to both seats, never rival hand identities.
   // Fate exchanges are already handled by the established fate visual and
   // may replace five cards at once, so do not also play a hand-draw animation.
   const diff=Math.max(0,(p.hand?.length||0)-(old.hand?.length||0));
   if(diff&&!fate){
    actions.push({kind:'draw',seat:p.seat,count:Math.min(diff,MAX_DRAW),
     name:p.name,hidden:true});
   }
  }
  // Favor a confirmed fusion sequence if several server-side AI actions
  // arrived in a single revision; avoid a long backlog after reconnecting.
  const fusion=actions.find(x=>x.kind==='fusion');
  return fusion?[fusion,...actions.filter(x=>x.kind==='draw').slice(0,2)]:
   actions.filter(x=>x.kind==='draw').slice(0,3);
 };
 let timers=[],sequence=0,layer=null,enabled=true;
 const reduced=()=>!!(typeof window!=='undefined'&&window.matchMedia&&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 function make(tag,cls,text,parent){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=String(text);
  if(parent)parent.append(el);
  return el;
 }
 function clear(){
  timers.forEach(clearTimeout);timers=[];
  if(layer?.isConnected)layer.remove();layer=null;
 }
 function schedule(fn,ms,stamp){
  timers.push(setTimeout(()=>{if(stamp===sequence)fn();},ms));
 }
 function host(){
  return document.querySelector('.duo-battle')||document.body;
 }
 function base(event){
  clear();layer=make('section','duo-cinema170',undefined,host());
  layer.setAttribute('role','status');layer.setAttribute('aria-live','polite');
  const inner=make('div','duo-cinema170-inner',undefined,layer);
  const skip=make('button','duo-cinema170-skip','Animation überspringen',inner);
  skip.type='button';skip.setAttribute('aria-label','Animation überspringen');
  skip.addEventListener('click',()=>{sequence++;clear();});
  make('div','duo-cinema170-kicker','✦ ARCANE DUEL · 2V2 ✦',inner);
  make('h3','duo-cinema170-title',
   event.kind==='fusion'?'FUSIONSRITUAL':'KARTENZUG',inner);
  const content=make('div','duo-cinema170-content',undefined,inner);
  return {inner,content,stamp:sequence};
 }
 function fusionSequence(event,catalog){
  const {inner,content,stamp}=base(event),r=event.result;
  make('p','duo-cinema170-owner',event.name+' · '+r.pattern,inner);
  const status=make('p','duo-cinema170-stage','1 · ROLLENSTEMPEL',content);
  const role=make('div','duo-cinema170-role','✦ '+(ROLE_NAMES[r.role]||'FUSION')+' ✦',content);
  const rolls=make('div','duo-cinema170-rolls',undefined,content);
  const choice=make('p','duo-cinema170-note','',content);
  const reward=make('div','duo-cinema170-reveal',undefined,content);
  const quality=Math.round((r.quality-1)*100);
  const stages=[
   ()=>{status.textContent='1 · ROLLENSTEMPEL';role.classList.add('active');},
   ()=>{
    status.textContent='2 · ATK-/DEF-WÜRFE';
    role.classList.remove('active');role.classList.add('stamped');
    r.rolls.forEach((x,i)=>{
     const die=make('span','duo-cinema170-die',
      (i+1)+': '+x.atk+' ⚔ / '+x.def+' 🛡',rolls);
     if(i===r.winnerIndex)die.classList.add('best');
    });
    choice.textContent='Bester gemeinsamer Wurf: '+(r.winnerIndex+1)+
     ' von '+r.rolls.length;
   },
   ()=>{
    status.textContent='3 · MATERIAL- UND QUALITÄTSBONI';
    choice.textContent='Materialbonus +'+r.bonus.atk+' ATK / +'+r.bonus.def+
     ' DEF · Qualität '+(quality>=0?'+':'')+quality+' %';
   },
   ()=>{
    status.textContent='4 · FUSION VOLLENDET';
    reward.replaceChildren();
    make('strong','duo-cinema170-level','LEVEL '+r.level,reward);
    const template=catalog?.[r.id]||{};
    if(typeof template.art==='string'&&template.art.length<1024){
     const img=make('img','duo-cinema170-art',undefined,reward);
     img.src=template.art;img.alt=template.name||'Fusionsmonster';
    }
    make('strong','duo-cinema170-name',template.name||'Fusionsmonster',reward);
    make('strong','duo-cinema170-stats',
     r.atk+' ATK  ·  '+r.def+' DEF',reward);
    reward.classList.add('visible');
    choice.textContent='Bestätigtes Ergebnis vom Online-Server';
   }
  ];
  stages[0]();
  const times=[450,1250,2000];
  times.forEach((time,index)=>schedule(stages[index+1],time,stamp));
  schedule(clear,3500,stamp);
 }
 function drawSequence(event){
  const {inner,content,stamp}=base(event);
  make('p','duo-cinema170-owner',event.name+' zieht '+event.count+
   ' Karte'+(event.count===1?'':'n')+'.',inner);
  const group=make('div','duo-cinema170-backs',undefined,content);
  for(let i=0;i<event.count;i++){
   const back=make('span','duo-cinema170-back','✧',group);
   back.style.setProperty('--draw-i',i);
   back.setAttribute('aria-label','Verdeckte Karte');
  }
  make('p','duo-cinema170-note','Karteninhalte bleiben nur dem Besitzer bekannt.',content);
  schedule(clear,1500,stamp);
 }
 function onState(previous,current,catalog,viewerSeat){
  const events=observed(previous,current);
  sequence++;
  clear();
  if(!enabled||!events.length||typeof document==='undefined'||reduced()||
     document.visibilityState==='hidden')return events;
  const event=events.find(x=>x.kind==='fusion')||
   events.find(x=>x.kind==='draw'&&x.seat!==viewerSeat);
  // Our actual hand row already animates own draws; the separate covered-card
  // overlay is reserved for teammates and enemies, whose cards stay private.
  if(!event)return events;
  if(event.kind==='fusion')fusionSequence(event,catalog);
  else drawSequence(event);
  return events;
 }
 const setEnabled=value=>{enabled=value!==false;if(!enabled){sequence++;clear();}};
 return Object.freeze({version:'17.0',observed,onState,setEnabled,isEnabled:()=>enabled});
});
