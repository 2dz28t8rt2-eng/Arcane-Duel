/* Arcane Duel v15.7: event-led presentation, never combat authority.
 * A bounded burst and a brief explanation accompany meaningful battle events.
 * No timers, frame loops, random rolls or DOM nodes persist when idle.
 */
'use strict';
(()=>{
  const ELEMENTS={FEUER:'#ffb174',WASSER:'#81ddff',ERDE:'#a9e7a5',WIND:'#a5f2dd',LICHT:'#ffe8a3',DUNKEL:'#d5acff',ARKAN:'#dec2ff'};
  const metrics={shown:0,suppressed:0,peakSparks:0,peakDurationMs:0};
  const observed=new WeakMap();
  const initialised=new WeakSet();
  let active=null,lastPulseAt=-Infinity;
  const deferred=new Set();
  const now=()=>window.performance?.now?.()??Date.now();
  const settings=()=>window.ArcaneElementAura155?.readIntensity?.()||'normal';
  const reduced=()=>animationSpeed==='instant'||document.body.classList.contains('ad-motion-disabled')||
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const tier=level=>level>=9?4:level>=7?3:level>=4?2:1;
  const styleFor=(kind,level,element)=>({kind,level:Math.max(1,Math.min(10,Number(level)||1)),
    tier:kind==='ace'?4:tier(Number(level)||1),element:ELEMENTS[String(element||'').toUpperCase()]?String(element).toUpperCase():'ARKAN'});
  function classify(message){
    if(typeof message!=='string')return null;
    if(/(?:material[\s-]*)?resonanz|resonator[\s-]*aufstieg/i.test(message))
      return {kind:'resonance',label:'Resonanz verstärkt die Fusion'};
    if(/seelen(?:raub|entzug|brand|[\s-]*erbe)|\bentzieht\b|\bverdichtet\b/i.test(message))
      return {kind:'soul',label:/verdichtet/i.test(message)?'Seelenenergie wird verdichtet':'Seelenenergie wird eingesetzt'};
    return null;
  }
  function trackedCards(g){
    const cards=[];
    for(let owner=0;owner<(g?.players?.length||0);owner++){
      const p=g.players[owner];
      p?.field?.forEach((c,index)=>{if(c)cards.push({card:c,owner,index,data:dataOf(c)});});
    }
    return cards;
  }
  function findElement(g,source){
    if(!source)return null;
    const viewer=g.mode==='pve'?0:g.active;
    return document.querySelector('#'+(source.owner===viewer?'ownRow [data-mine="':'enemyRow [data-enemy="')+
      source.index+'"] .board-creature.tc-card');
  }
  function burst(g,{kind,label,level=1,element='ARKAN',source=null},retries=0){
    if(!g||g!==game||uiMode!=='duel'){
      if(retries)deferred.delete(kind);
      return false;
    }
    if(reduced()||document.hidden){
      if(retries)deferred.delete(kind);
      metrics.suppressed++;return false;
    }
    const intensity=settings();
    if(intensity==='subtle'&&kind==='resonance'){
      if(retries)deferred.delete(kind);
      metrics.suppressed++;return false;
    }
    if(document.querySelector('.ritual-overlay, .evo-fusion-scene, #overlay:not(.hidden)')){
      if(!retries&&deferred.has(kind)){metrics.suppressed++;return false;}
      deferred.add(kind);
      if(retries>=60){deferred.delete(kind);metrics.suppressed++;return false;}
      setTimeout(()=>burst(g,{kind,label,level,element,source},retries+1),270);
      return false;
    }
    if(retries)deferred.delete(kind);
    const t=now();
    if(t-lastPulseAt<380&&kind!=='ace'){metrics.suppressed++;return false;}
    lastPulseAt=t;
    const start=now(),visual=styleFor(kind,level,element);
    const anchor=findElement(g,source);
    const bounds=anchor?.getBoundingClientRect();
    const screen=document.getElementById('duelScreen')?.getBoundingClientRect();
    const viewportW=window.innerWidth||1200,viewportH=window.innerHeight||900;
    const x=Math.max(90,Math.min(viewportW-90,bounds?bounds.left+bounds.width/2:(screen?.left||0)+(screen?.width||viewportW)/2));
    const y=Math.max(85,Math.min(viewportH-110,bounds?bounds.top+bounds.height/2:(screen?.top||0)+(screen?.height||viewportH)*.48));
    const count=intensity==='subtle'?4:intensity==='epic'?Math.min(18,visual.tier*4+2):Math.min(12,visual.tier*3+1);
    // A single global burst replaces the previous burst: bounded DOM and no queue buildup.
    active?.remove();
    const host=document.createElement('div');host.className='ad157-event ad157-'+kind;
    host.dataset.tier=String(visual.tier);host.dataset.element=visual.element;
    host.style.setProperty('--ad157-color',ELEMENTS[visual.element]);
    host.style.left=x+'px';host.style.top=y+'px';
    host.setAttribute('role','status');host.setAttribute('aria-live','polite');
    const halo=document.createElement('span');halo.className='ad157-halo';halo.setAttribute('aria-hidden','true');host.append(halo);
    const particles=document.createElement('span');particles.className='ad157-particles';particles.setAttribute('aria-hidden','true');
    for(let i=0;i<count;i++){
      const spark=document.createElement('i'),angle=2*Math.PI*i/count,radius=40+visual.tier*16;
      spark.style.setProperty('--tx',Math.round(Math.cos(angle)*radius)+'px');
      spark.style.setProperty('--ty',Math.round(Math.sin(angle)*radius*.6)+'px');
      spark.style.setProperty('--delay',i%4*28+'ms');particles.append(spark);
    }
    host.append(particles);
    const notice=document.createElement('span');notice.className='ad157-notice';notice.textContent=label;
    host.append(notice);document.body.append(host);active=host;
    metrics.shown++;metrics.peakSparks=Math.max(metrics.peakSparks,count);
    metrics.peakDurationMs=Math.max(metrics.peakDurationMs,now()-start);
    setTimeout(()=>{if(active===host)active=null;host.remove();},1550);
    return true;
  }
  function onLog(g,message){
    if(g!==game||uiMode!=='duel')return;
    const info=classify(message);if(!info)return;
    const source=trackedCards(g).find(x=>message.startsWith(x.data.name))||null;
    const element=source?.data.element||'ARKAN',level=source?.data.level||4;
    // The rule engine logs before the final field render: allow the DOM to settle.
    setTimeout(()=>burst(g,{...info,source,element,level}),40);
  }
  function observeField(g){
    if(!g||uiMode!=='duel'||g!==game)return;
    const cards=trackedCards(g),known=observed.get(g)||new Set();observed.set(g,known);
    if(!initialised.has(g)){
      cards.forEach(x=>known.add(x.card.uid));initialised.add(g);return;
    }
    for(const x of cards){
      if(known.has(x.card.uid))continue;
      known.add(x.card.uid);
      const ace=x.data.ace===true,level=Number(x.data.level)||1;
      if(!ace&&!(x.card.fusion&&level>=7))continue;
      const kind=ace?'ace':'fusion';
      const label=ace?'ACE beschworen · '+x.data.name:'Mächtige Fusion · '+x.data.name+' (Lv '+level+')';
      // An existing cinema owns the long reveal; this is its brief field-level coda.
      setTimeout(()=>burst(g,{kind,label,level,element:x.data.element,source:x}),120);
    }
  }
  const previousLog=logEvent;
  logEvent=function(g,message){const result=previousLog.apply(this,arguments);
    try{onLog(g,message);}catch(error){console.warn('Ereigniseffekt ausgelassen:',error);}
    return result;};
  const previousRender=render;
  render=function(){const result=previousRender.apply(this,arguments);
    try{observeField(game);}catch(error){console.warn('Feldhighlight ausgelassen:',error);}
    return result;};
  window.ArcaneEventFX157=Object.freeze({version:'15.7.0',tier,styleFor,classify,burst,
    metrics:()=>({...metrics}),reduced});
})();
