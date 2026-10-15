/* Arcane Duel: genuine fusion reveal based on the user's heavy-stamp / floating-card storyboard.
 * Presentation only: does NOT roll, grant cards, mutate game state or decide a battle.
 */
'use strict';
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const num=v=>Math.max(0,Math.floor(Number(v)||0)).toLocaleString('de-AT');
 const STAMPS={predator:'PREDATOR',guardian:'VERTEIDIGER',soul:'SEELENZEHRER'};
 let running=false,particleLoader=null;
 function addScript(url,check){
  if(check())return Promise.resolve();
  return new Promise((ok,fail)=>{
   const tag=document.createElement('script');tag.src=url;tag.async=true;tag.crossOrigin='anonymous';
   tag.onload=()=>check()?ok():fail(new Error('missing particle engine'));
   tag.onerror=()=>fail(new Error('particle CDN unavailable'));document.head.append(tag);
  });
 }
 async function motes(host,role){
  // Optional tsParticles Slim from its official browser CDN, backed by CSS sparks.
  if(!particleLoader)particleLoader=(async()=>{
   await addScript('https://cdn.jsdelivr.net/npm/@tsparticles/engine@4/tsparticles.engine.min.js',()=>!!window.tsParticles);
   await addScript('https://cdn.jsdelivr.net/npm/@tsparticles/slim@4/tsparticles.slim.bundle.min.js',()=>!!window.loadSlim);
   await window.loadSlim(window.tsParticles);return window.tsParticles;
  })().catch(()=>null);
  const engine=await particleLoader;if(!engine||!host.isConnected)return null;
  const color={predator:'#f26c66',guardian:'#75c7f9',soul:'#da9eff'}[role]||'#c8b0ff';
  return engine.load({id:'arcane-fusion-motes',options:{
   fullScreen:{enable:false},fpsLimit:40,
   particles:{number:{value:host.dataset.variant==='field'?58:26,density:{enable:false}},color:{value:[color,'#f2d29a','#cfb0ff']},
    shape:{type:['circle','star']},opacity:{value:{min:.15,max:.7}},size:{value:{min:1,max:3}},
    move:{enable:true,speed:{min:.4,max:1.2},direction:'none',outModes:{default:'out'}},
    links:{enable:false},collisions:{enable:false}},
   interactivity:{events:{onHover:{enable:false},onClick:{enable:false}}}
  }});
 }

 async function play({instance:c,materials=[],battle:g,card:t,level,variant='full',wait,playSound}){
  if(running)return;
  if(!c?.fusion||!t||!g)return;
  if(!Array.isArray(c.rollTrace)||!c.rollMath)return;
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
  running=true;
  const role=c.roleOverride||c.rollMath.role||t.role||'combatant';
  const seal=STAMPS[role]||'',rolls=c.rollTrace,math=c.rollMath;
  const owner=g.players.findIndex(p=>p.field?.some(mon=>mon?.uid===c.uid));
  const index=owner<0?-1:g.players[owner].field.findIndex(mon=>mon?.uid===c.uid);
  const slot=index<0?null:document.querySelector(owner===0?'#ownRow [data-mine="'+index+'"]':'#enemyRow [data-enemy="'+index+'"]');
  const boardCard=slot?.querySelector('.board-creature');
  const overlay=document.createElement('div');
  overlay.className='evo-summon evo-fusion-scene evo-stamp-scene ritual-overlay';
  overlay.dataset.role=role;
  overlay.dataset.variant=variant;
  overlay.setAttribute('role','status');
  overlay.setAttribute('aria-label','Fusion von '+t.name+': '+rolls.length+' echte Wertewürfe');
  overlay.innerHTML=
   '<div class="ritual-window">'+
    '<div class="ritual-particles" id="arcane-fusion-motes" aria-hidden="true"></div>'+
    '<div class="evo-mat-count">✧ '+(c.materialsUsed||materials.length||2)+' MATERIALIEN · '+esc(c.pattern||'FUSION')+' ✧</div>'+
    '<div class="evo-visual-stage">'+
     '<div class="ritual-sparks" aria-hidden="true"></div>'+ 
     '<div class="evo-material-layer" aria-hidden="true"></div>'+
     '<div class="evo-fusion-core" aria-hidden="true">✧</div>'+
     '<div class="evo-fusion-result monster-card">'+
      '<div class="ritual-card-name">'+esc(t.name)+'</div>'+
      '<div class="ritual-card-art"><img alt="" src="'+esc(t.art)+'">'+
       (seal?'<div class="evo-role-seal evo-seal-'+role+' role-stamp '+(role==='guardian'?'defender':role)+'">'+esc(seal)+'</div>':'')+
      '</div>'+
      '<div class="ritual-card-level">LV '+esc(level)+'</div>'+
      '<div class="ritual-card-stats">'+
       '<div class="ritual-stat atk">ATK <b data-fusion-atk>≈ '+num(math.base?.atk??t.atk)+'</b></div>'+
       '<div class="ritual-stat def">DEF <b data-fusion-def>≈ '+num(math.base?.def??t.def)+'</b></div>'+
      '</div>'+
     '</div>'+
     '<div class="evo-fusion-flash" aria-hidden="true"></div>'+
    '</div>'+
    '<div class="evo-popup-panel math-zone">'+
     '<div class="evo-calc-heading">DIE FUSIONSWÜRFE · '+rolls.length+'</div>'+
     '<div class="evo-rolls" aria-live="off"></div>'+
    '</div>'+
   '</div>';
  const layer=overlay.querySelector('.evo-material-layer');
  const sparkContainer=overlay.querySelector('.ritual-sparks');
  for(let i=0;i<(variant==='field'?38:18);i++){
   const spark=document.createElement('span');spark.className='ritual-spark';
   spark.style.setProperty('--angle',i*(variant==='field'?9.47:20)+'deg');
   spark.style.setProperty('--delay',(-i*.11)+'s');sparkContainer.append(spark);
  }
  const samples=materials.length?materials:[{art:t.art,level:t.level}];
  for(let i=0;i<samples.length;i++){
   const item=document.createElement('div'),img=document.createElement('img');
   const angle=-Math.PI/2+2*Math.PI*i/samples.length;
   item.className='evo-actual-material';
   item.style.setProperty('--start-x',Math.round(Math.cos(angle)*118)+'px');
   item.style.setProperty('--start-y',Math.round(Math.sin(angle)*84)+'px');
   item.style.setProperty('--spin',Math.round(360+i*38)+'deg');
   img.src=samples[i].art;img.alt='';item.append(img);layer.append(item);
  }
  const panel=overlay.querySelector('.evo-popup-panel'),log=overlay.querySelector('.evo-rolls');
  const actor=overlay.querySelector('.evo-fusion-result'),atk=overlay.querySelector('[data-fusion-atk]'),def=overlay.querySelector('[data-fusion-def]');
  const line=(name,a,d,extra='')=>{
   const el=document.createElement('div');
   el.className='evo-calc-row math-row '+extra;
   el.innerHTML='<span>'+esc(name)+'</span><b class="evo-calc-atk">'+num(a)+'</b><b class="evo-calc-def">'+num(d)+'</b>';
   log.append(el);panel.scrollTop=panel.scrollHeight;
   return el;
  };
  // Visual digits 1..9 NEVER consume the battle RNG.
  const reel=(n,tick,offset)=>{
   const digits=String(Math.max(1,Math.floor(Number(n)||1))).length;
   return Array.from({length:digits},(_,i)=>String(1+(7*tick+5*i+3*offset)%9)).join('');
  };
  if(boardCard)boardCard.classList.add('evo-fusion-awaiting');
  document.body.append(overlay);
  const particleTask=motes(overlay,role).catch(()=>null);
  playSound('summon');
  try{
   // 1. Material orbit and actual fusion merge: there is no popup yet.
   overlay.classList.add('evo-phase-orbit');await wait(samples.length>=4?1100:960);
   overlay.classList.remove('evo-phase-orbit');overlay.classList.add('evo-phase-merge');
   await wait(670);
   // 2. Open a completely empty calculation window, card rises above it.
   overlay.classList.add('evo-phase-shell');await wait(590);
   overlay.classList.add('evo-phase-reveal');await wait(1050);
   // 3. A single severe blow permanently assigns its precomputed role.
   if(seal){
    overlay.classList.add('evo-stamp-impact','ritual-screen-shake');playSound('summon');
    await wait(460);overlay.classList.remove('ritual-screen-shake');await wait(370);
   }
   overlay.classList.add('evo-phase-rolls','evo-stamp-settled');
   const weights=math.roleWeights||{atk:1,def:1};
   const information=document.createElement('div');
   information.className='evo-role-math';
   information.textContent='Rollenprägung VOR Würfen: ATK ×'+Number(weights.atk).toFixed(2).replace('.',',')+
    ' / DEF ×'+Number(weights.def).toFixed(2).replace('.',',')+
    ' · Basis '+num(math.base?.atk)+' / '+num(math.base?.def);
   log.append(information);
   log.insertAdjacentHTML('beforeend','<div class="evo-calc-cols"><span>BESTER WURF GEWINNT</span><b>ATK</b><b>DEF</b></div>');
   // 4. Each real roll: two synchronized reels, then separate ink stamp.
   for(let i=0;i<rolls.length;i++){
    const draw=rolls[i],item=line('Wurf '+(i+1),0,0,'evo-calc-spinning');
    const values=item.querySelectorAll('b');
    atk.parentElement.classList.add('rolling');def.parentElement.classList.add('rolling');
    for(let tick=0;tick<12;tick++){
     values[0].textContent=reel(draw.atk,tick,i);
     values[1].textContent=reel(draw.def,tick,i+3);
     atk.textContent=reel(draw.atk,tick,i+5);
     def.textContent=reel(draw.def,tick,i+8);
     await wait(53+tick*3);
    }
    values[0].textContent=num(draw.atk);values[1].textContent=num(draw.def);
    atk.textContent=num(draw.atk);def.textContent=num(draw.def);
    atk.parentElement.classList.remove('rolling');def.parentElement.classList.remove('rolling');
    item.classList.remove('evo-calc-spinning');
    item.classList.add('evo-calc-stamped','stamped');
    if(i===math.winnerIndex)item.classList.add('evo-calc-winning');
    await wait(320);
   }
   // 5. Standard vertical arithmetic: the other rolls were alternatives, NOT sum terms.
   const best=rolls[math.winnerIndex]||math.winner;
   if(best){
    log.insertAdjacentHTML('beforeend','<div class="evo-calc-divider"></div>');
    for(const [label,a,d,css] of [
     ['Bester Wurf',best.atk,best.def,'evo-calc-winning'],
     ['+ Material',math.bonus?.atk,math.bonus?.def,''],
     ['− Abzug',math.penalty,math.penalty,'']
    ]){
     const node=line(label,a,d,css);
     node.classList.add('evo-calc-stamped','stamped');await wait(260);
    }
    log.insertAdjacentHTML('beforeend','<div class="evo-calc-divider evo-double"></div>');
    const result=line('= ENDWERT',math.final.atk,math.final.def,'evo-calc-final');
    result.classList.add('evo-calc-stamped','stamped');
    overlay.classList.add('evo-calc-sum');await wait(960);
    // 6. All mathematics is sucked into the monster card; only then final numbers.
    overlay.classList.add('evo-calc-absorb');await wait(770);
    atk.textContent=num(math.final.atk);def.textContent=num(math.final.def);
   }else{
    atk.textContent=num(t.atk);def.textContent=num(t.def);
   }
   overlay.classList.add('evo-card-locked');await wait(850);
   // 7. Flight to actual occupied zone; no change to authoritative state.
   if(slot&&typeof actor.animate==='function'){
    overlay.classList.add('evo-phase-landing');
    const from=actor.getBoundingClientRect(),to=slot.getBoundingClientRect();
    const dx=to.left+to.width/2-(from.left+from.width/2);
    const dy=to.top+to.height/2-(from.top+from.height/2);
    const scale=Math.min(1,Math.max(.15,to.width/Math.max(1,from.width)));
    const flight=actor.animate([
     {transform:'translateX(-50%) translate(0,0) scale(1)',opacity:1},
     {transform:'translateX(-50%) translate('+dx+'px,'+dy+'px) scale('+scale+')',opacity:0}
    ],{duration:720,easing:'cubic-bezier(.22,.69,.2,1)',fill:'forwards'});
    await Promise.race([
     new Promise(resolve=>{flight.onfinish=resolve;flight.oncancel=resolve;}),
     wait(890)
    ]);
   }else{overlay.classList.add('evo-card-land');await wait(550);}
  }finally{
   overlay.remove();running=false;
   particleTask.then(container=>container?.destroy?.()).catch(()=>{});
   if(boardCard){
    boardCard.classList.remove('evo-fusion-awaiting');
    boardCard.classList.add('evo-fusion-landed');
    setTimeout(()=>boardCard.classList.remove('evo-fusion-landed'),900);
   }
  }
 }
 window.ArcaneFusionCinema=Object.freeze({version:'2.0.0',play});
})();