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
    const duel=cur.predatorShowdown;
    actions.push({kind:'fusion',seat:p.seat,slot,area,name:p.name,
     showdown:duel?.newUid===c.uid&&duel.seat===p.seat?{
      outcome:duel.outcome,old:{...duel.old},new:{...duel.new}}:null,
     result:{id:c.id,level:c.level,atk:c.atk,def:c.def,role:c.role,
      pattern:String(c.pattern||'Fusion').slice(0,60),
      winnerIndex:c.rollMath.winnerIndex,rolls:trace,
      bonus:{atk:c.materialBonus?.atk||0,def:c.materialBonus?.def||0},
      quality:Number(c.quality)||1,
      predatorLeader:c.predatorLeader?{
       materials:c.predatorLeader.materials,
       powers:[...(c.predatorLeader.powers||[])]}:null}});
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
 let timers=[],sequence=0,layer=null,enabled=true,stopCalcLoop=null,orbitAudio=null;
 const reduced=()=>!!(typeof window!=='undefined'&&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||
   window.document?.body?.classList.contains('ad-motion-disabled')));
 function make(tag,cls,text,parent){
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=String(text);
  if(parent)parent.append(el);
  return el;
 }
 function clear(){
  orbitAudio?.pause?.();orbitAudio=null;
  stopCalcLoop?.();stopCalcLoop=null;
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
  skip.addEventListener('click',()=>{if(event.kind==='fusion')window.ArcaneSfx208?.stopAll?.();sequence++;clear();});
  make('div','duo-cinema170-kicker','✦ ARCANE DUEL · 2V2 ✦',inner);
  make('h3','duo-cinema170-title',
   event.kind==='fusion'?'FUSIONSRITUAL':'KARTENZUG',inner);
  const content=make('div','duo-cinema170-content',undefined,inner);
  return {inner,content,stamp:sequence};
 }
 function fusionSequence(event,catalog){
  const {inner,content,stamp}=base(event),r=event.result;
  make('p','duo-cinema170-owner',event.name+' · '+r.pattern,inner);
  const status=make('p','duo-cinema170-stage','MATERIALROTATION · FUSION WIRD VORBEREITET',content);
  const orbit=make('div','duo-cinema208-orbit',undefined,content);
  orbit.setAttribute('aria-hidden','true');
  const matCount=Math.max(2,Math.min(5,Number(r.materialsUsed||r.materials||3)));
  for(let i=0;i<matCount;i++){
   const mat=make('span','duo-cinema208-material','✧',orbit);
   mat.style.setProperty('--i',String(i));mat.style.setProperty('--n',String(matCount));
  }
  orbitAudio=window.ArcaneSfx208?.play?.('orbit')||null;
  const role=make('div','duo-cinema170-role','✦ '+(ROLE_NAMES[r.role]||'FUSION')+' ✦',content);
  const rolls=make('div','duo-cinema170-rolls',undefined,content);
  const choice=make('p','duo-cinema170-note','',content);
  const reward=make('div','duo-cinema170-reveal',undefined,content);
  const quality=Math.round((r.quality-1)*100);
  const alpha=r.predatorLeader;
  const stages=[
   ()=>{status.textContent='1 · ROLLENSTEMPEL';orbit.remove();role.classList.add('active');},
   ()=>{
    // Calculation sound intentionally disabled pending a replacement.
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
    stopCalcLoop?.();stopCalcLoop=null;
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
  if(alpha)stages.push(()=>{
   status.textContent='5 · RUDELFÜHRER ERWACHT';
   window.ArcaneSfx208?.play?.('roar');
   const names={swarm:'Rudelinstinkt',mark:'Blutspur',token:'Rudelruf'};
   const abilities=alpha.powers.map(power=>names[power]||power);
   const reveal=make('div','ad198-alpha-reveal',undefined,content);
   make('span','ad198-alpha-icon','🐾',reveal);
   make('strong','ad198-alpha-heading','RUDELFÜHRER · '+alpha.materials+' MATERIALIEN',reveal);
   make('p',undefined,'Grundbonus: +3 % Angriff je eigenem Predator',reveal);
   make('p','ad198-alpha-powers',abilities.length?abilities.join(' · '):
    'Basisfähigkeit · keine zusätzlichen Kräfte',reveal);
   reveal.classList.add('active');
   choice.textContent='🐾 Alle Kräfte wurden vom Server ausgewürfelt.';
  });
  // The 5.75-second card orbit plays in sync with the actual sampled fusion cue.
  schedule(stages[0],5750,stamp);
  const times=[6260,6980,7650];
  times.forEach((time,index)=>schedule(stages[index+1],time,stamp));
  if(alpha)schedule(stages[4],8250,stamp);
  if(event.showdown){
   schedule(()=>{
    clear();
    const old=event.showdown.old,newKing=event.showdown.new;
    const oldTemplate=catalog?.[old.id]||{},newTemplate=catalog?.[newKing.id]||{};
    if(typeof window!=='undefined')window.ArcanePredatorShowdown199?.play({
     outcome:event.showdown.outcome,
     old:{...old,name:oldTemplate.name||'Alter Rudelführer',art:oldTemplate.art},
     new:{...newKing,name:newTemplate.name||'Neuer Rudelführer',art:newTemplate.art}
    });
   },9850,stamp);
  }else schedule(clear,alpha?11200:8850,stamp);
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
 function ritualInstance(c){
  // The solo ritual separates inherited soul DEF from material bonuses;
  // the online reducer stores those amounts separately.
  return {...c,roleOverride:c.role,rollMath:{...c.rollMath,
   bonus:{...c.rollMath.bonus,def:(c.rollMath.bonus?.def||0)+(c.soulInheritance?.defBonus||0)},
   final:c.rollMath.final||{atk:c.atk,def:c.def}}};
 }
 function onState(previous,current,catalog,viewerSeat){
  const events=observed(previous,current);
  if(!enabled||!events.length||typeof document==='undefined'||reduced()||
     document.visibilityState==='hidden')return events;
  const event=events.find(x=>x.kind==='fusion')||
   events.find(x=>x.kind==='draw'&&x.seat!==viewerSeat);
  // Our actual hand row already animates own draws; the separate covered-card
  // overlay is reserved for teammates and enemies, whose cards stay private.
  if(!event)return events;
  // Non-cinematic server revisions (e.g. position switches) must not cancel
  // a pending Rudelführer showdown after the ordinary fusion ritual.
  sequence++;
  clear();
  if(event.kind==='fusion'&&window.ArcaneFusionCinema?.play){
   const c=current.players?.[event.seat]?.field?.[event.slot];
   const template=catalog?.[event.result.id];
   if(c&&template&&c.rollMath&&c.rollTrace){
    // Only already-public, consumed cards may be shown. Never read another
    // player's private hand; unknown materials use a neutral card back.
    const materials=[];
    for(const seat of [event.seat,event.seat^2]){
     const old=previous.players?.[seat],now=current.players?.[seat];
     if(!old||!now)continue;
     for(const card of (now.graveyard||[]).slice((old.graveyard||[]).length))
      if(card.from==='fusion'&&catalog[card.id]?.art)materials.push({art:catalog[card.id].art});
    }
    const back='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"%3E%3Crect width="120" height="180" rx="8" fill="%23121b2e"/%3E%3Cpath d="M60 32L94 90 60 148 26 90Z" fill="none" stroke="%23d7af61" stroke-width="4"/%3E%3C/svg%3E';
    const materialCount=Math.max(2,Math.min(5,c.materialsUsed||2));
    materials.length=Math.min(materials.length,materialCount);
    while(materials.length<materialCount)materials.push({art:back});
    const instance=ritualInstance(c);
    const target=document.querySelector('#duoSeats .seat[data-seat="'+event.seat+'"] > .field > .field-cell[data-slot="'+event.slot+'"]');
    Promise.resolve(window.ArcaneFusionCinema.play({instance,materials,battle:current,
     card:template,level:c.level,target,variant:'full',
     wait:ms=>new Promise(resolve=>setTimeout(resolve,ms)),
     playSound:kind=>window.ArcaneSfx208?.play?.(kind)})).catch(()=>fusionSequence(event,catalog));
   }else fusionSequence(event,catalog);
  }else if(event.kind==='fusion')fusionSequence(event,catalog);
  else if(!window.ArcaneBattlePresentation228)drawSequence(event);
  return events;
 }
 const setEnabled=value=>{enabled=value!==false;if(!enabled){sequence++;clear();
  if(typeof window!=='undefined')window.ArcaneFusionCinema?.cancel?.();}};
 return Object.freeze({version:'17.0',observed,onState,ritualInstance,setEnabled,isEnabled:()=>enabled});
});
