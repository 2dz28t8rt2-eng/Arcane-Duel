/* Arcane Duel: genuine fusion reveal based on the user's heavy-stamp / floating-card storyboard.
 * Presentation only: does NOT roll, grant cards, mutate game state or decide a battle.
 */
'use strict';
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const num=v=>Math.max(0,Math.floor(Number(v)||0)).toLocaleString('de-AT');
 const STAMPS={predator:'PREDATOR',guardian:'VERTEIDIGER',soul:'SEELENZEHRER',resonator:'RESONATOR'};
 let running=false,particleLoader=null;
 const completedLandings=new WeakMap();
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
  const color={predator:'#f26c66',guardian:'#75c7f9',soul:'#da9eff',resonator:'#e6beff'}[role]||'#c8b0ff';
  return engine.load({id:'arcane-fusion-motes',options:{
   fullScreen:{enable:false},fpsLimit:40,
   particles:{number:{value:host.dataset.variant==='field'?58:26,density:{enable:false}},color:{value:[color,'#f2d29a','#cfb0ff']},
    shape:{type:['circle','star']},opacity:{value:{min:.15,max:.7}},size:{value:{min:1,max:3}},
    move:{enable:true,speed:{min:.4,max:1.2},direction:'none',outModes:{default:'out'}},
    links:{enable:false},collisions:{enable:false}},
   interactivity:{events:{onHover:{enable:false},onClick:{enable:false}}}
  }});
 }

 async function play({instance:c,materials=[],battle:g,card:t,level,variant='full',wait,playSound,target=null}){
  if(running)return;
  if(!c?.fusion||!t||!g)return;
  if(!Array.isArray(c.rollTrace)||!c.rollMath)return;
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
  running=true;
  const role=c.roleOverride||c.rollMath.role||t.role||'combatant';
  const seal=STAMPS[role]||'',rolls=c.rollTrace,math=c.rollMath;
  const soul=c.soulInheritance&&c.soulInheritance.energy>0?c.soulInheritance:null;
  const owner=g.players.findIndex(p=>p.field?.some(mon=>mon?.uid===c.uid));
  const index=owner<0?-1:g.players[owner].field.findIndex(mon=>mon?.uid===c.uid);
  const slot=target||(index<0?null:document.querySelector(owner===0?'#ownRow [data-mine="'+index+'"]':'#enemyRow [data-enemy="'+index+'"]'));
  const boardCard=slot?.querySelector('.board-creature');
  let landed=false,sharedLanding=false;
  const overlay=document.createElement('div');
  overlay.className='evo-summon evo-fusion-scene evo-stamp-scene ritual-overlay';
  overlay.dataset.role=role;overlay.dataset.owner=String(owner<0?g.active:owner);
  overlay.dataset.variant=variant;
  overlay.dataset.soulInherited=soul?'true':'false';
  overlay.setAttribute('role','status');
  overlay.setAttribute('aria-label',(variant==='field'?'Feldfusion':'Handfusion')+' von '+t.name+': '+rolls.length+' echte Wertewürfe');
  overlay.innerHTML=
   '<div class="ritual-window">'+
    '<div class="ritual-particles" id="arcane-fusion-motes" aria-hidden="true"></div>'+
    '<div class="evo-mat-count">✧ '+(variant==='field'?'FELDFUSION':'HANDFUSION')+' · '+(c.materialsUsed||materials.length||2)+' MATERIALIEN · '+esc(c.pattern||'FUSION')+' ✧</div>'+
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
  // AI fusion material snapshots can be lost after an intermediate AI phase.
  // Preserve every known source; if a snapshot is incomplete, still display
  // the full number of merged materials instead of a single frozen card.
  const wanted=Math.max(2,Math.min(5,c.materialsUsed||materials.length||2));
  const samples=materials.length>=wanted?materials:materials.concat(
   Array.from({length:wanted-materials.length},()=>({art:t.art,level:t.level})));

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
  const clock=wait||((ms)=>new Promise(resolve=>setTimeout(resolve,ms)));
  const phases=window.ArcaneCinemaPhases.create(overlay,clock);
  wait=phases.wait;
  const particleTask=motes(overlay,role).catch(()=>null);
  let stopCalcLoop=null;
  const fusionAudio=window.ArcaneSfx208?.play?.('orbit')||null;
  if(!window.ArcaneSfx208)playSound('summon');
  try{
   // 1. Material orbit and actual fusion merge: there is no popup yet.
   await phases.run('Materialrotation',async()=>{
   overlay.classList.add('evo-phase-orbit');await wait(3900);
   overlay.classList.remove('evo-phase-orbit');overlay.classList.add('evo-phase-merge');
   await wait(1850);
   });
   // Skipping this phase must also silence the long fusion sample immediately.
   fusionAudio?.pause?.();
   // 2. Open a completely empty calculation window, card rises above it.
   await phases.run('Enthüllung',async()=>{
   overlay.classList.add('evo-phase-shell');await wait(590);
   overlay.classList.add('evo-phase-reveal');await wait(1050);
   });
   // 3. The stored field energy passes visibly between material and result.
   // The already committed soulInheritance is the sole authority for displayed values.
   if(soul&&window.ArcaneSoulCinema?.play){
    try{await phases.run('Seelen-Erbe',()=>window.ArcaneSoulCinema.play(overlay,materials,soul,ms=>phases.wait(ms,clock)));}
    catch(error){console.warn('Seelen-Cinema übersprungen:',error);}
   }
   // 4. A single severe blow permanently assigns its precomputed role.
   if(seal)await phases.run('Rollenprägung',async()=>{
    overlay.classList.add('evo-stamp-impact','ritual-screen-shake');playSound('summon');
    await wait(460);overlay.classList.remove('ritual-screen-shake');await wait(370);
   });
   // After the role's card seal, stamp the ACTUAL combination quality across
   // the whole scene. This does not re-roll or modify the persisted numbers.
   if(window.ArcaneFusionBonus?.stamp){
    try{await phases.run('Spezialbonus',()=>window.ArcaneFusionBonus.stamp(overlay,c,ms=>phases.wait(ms,clock),1));}
    catch(error){console.warn('Bonus-Cinema übersprungen:',error);}
   }
   await phases.run('Werteberechnung',async()=>{
   overlay.classList.add('evo-phase-rolls','evo-stamp-settled');
   // Experimental calculation sample disabled until a replacement is selected.
   const weights=math.roleWeights||{atk:1,def:1};
   const information=document.createElement('div');
   information.className='evo-role-math';
   information.textContent='Rollenprägung VOR Würfen: ATK ×'+Number(weights.atk).toFixed(2).replace('.',',')+
    ' / DEF ×'+Number(weights.def).toFixed(2).replace('.',',')+
    ' · Basis '+num(math.base?.atk)+' / '+num(math.base?.def);
   log.append(information);
   if(c.resonanceFusion?.bonusPct){const note=document.createElement('div');note.className='ritual-resonance-note';note.textContent='✦ MATERIAL-RESONANZ: +'+c.resonanceFusion.bonusPct+' % Fusionsqualität (vor den Würfen)';log.append(note);}
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
     ['+ Material',math.bonus?.atk,Math.max(0,(math.bonus?.def||0)-(soul?.defBonus||0)),''],
     ['− Abzug',math.penalty,math.penalty,'']
    ]){
     const node=line(label,a,d,css);
     node.classList.add('evo-calc-stamped','stamped');await wait(260);
    }
    if(soul){
     const bonus=line('✦ SEELEN-ERBE',0,soul.defBonus,'ritual-soul-inherit-line');
     bonus.classList.add('evo-calc-stamped','stamped');
     const note=document.createElement('div');note.className='ritual-soul-energy-note';
     note.textContent='✦ '+num(soul.energy)+' eingesetzte Seelenenergie · '+num(soul.carried)+' Energie übertragen';
     log.append(note);await wait(490);
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
   });
   // End the loop once the final ATK/DEF values reach the fusion card.
   stopCalcLoop?.();stopCalcLoop=null;
   // Predator alpha's abilities are already rolled and saved on the instance.
   // Show the PAW + short skill explanations in the SAME calculation window,
   // after all numeric rolls have been absorbed and before landing.
   if(c.predatorLeader&&window.ArcanePredatorPack?.cinemaReveal){
    try{await phases.run('Rudelführer erwacht',()=>
      window.ArcanePredatorPack.cinemaReveal({overlay,instance:c,wait:ms=>phases.wait(ms,clock)}));}
    catch(error){console.warn('Rudelführer-Enthüllung übersprungen:',error);}
   }
   await phases.run('Fertige Karte',async()=>{overlay.classList.add('evo-card-locked');await wait(soul?900:650);});
   // 7. Flight to actual occupied zone; no change to authoritative state.
   await phases.run(boardCard?'Platzierung':'Ritualabschluss',async()=>{
   if(boardCard&&window.ArcaneSummonFX){
    overlay.classList.remove('evo-phase-rolls');overlay.classList.add('evo-phase-landing','ad-depth-landing');actor.style.opacity='0';
    await window.ArcaneSummonFX.land(g,c,{phase:phases});landed=true;sharedLanding=true;
   }else if(slot&&typeof actor.animate==='function'){
    overlay.classList.remove('evo-phase-rolls');
    overlay.classList.add('evo-phase-landing');
    const from=actor.getBoundingClientRect(),to=(boardCard||slot).getBoundingClientRect();
    const dx=to.left+to.width/2-(from.left+from.width/2);
    const dy=to.top+to.height/2-(from.top+from.height/2);
    const sx=to.width/Math.max(1,from.width),sy=to.height/Math.max(1,from.height);
    const target='translateX(-50%) translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')';
    const flight=actor.animate([
     {transform:'translateX(-50%) translate(0,0) scale(1)',opacity:1},
     {transform:target,opacity:1,offset:.9},
     {transform:target,opacity:0}
    ],{duration:650,easing:'cubic-bezier(.45,0,.8,.55)',fill:'forwards'});
    await Promise.race([
     new Promise(resolve=>{flight.onfinish=resolve;flight.oncancel=resolve;}),
     clock(850)
    ]);
    landed=true;
   }else{overlay.classList.add('evo-card-land');await wait(550);}
   });
  }finally{
   fusionAudio?.pause?.();
   stopCalcLoop?.(); // Skipped, cancelled and failed rituals must not leave audio playing.
   phases.close();
   overlay.remove();running=false;
   particleTask.then(container=>container?.destroy?.()).catch(()=>{});
   if(boardCard){
    boardCard.classList.remove('evo-fusion-awaiting');
    boardCard.classList.add('evo-fusion-landed');
    if(landed){
     if(!completedLandings.has(g))completedLandings.set(g,new Set());
     completedLandings.get(g).add(c.uid);
     if(!sharedLanding)window.ArcaneBattleFX?.landingDust?.(boardCard,(c.materialsUsed||0)>=4);
    }
    setTimeout(()=>boardCard.classList.remove('evo-fusion-landed'),900);
   }
  }
 }
 window.ArcaneFusionCinema=Object.freeze({version:'2.2.0',play,landed:(g,uid)=>!!completedLandings.get(g)?.has(uid)});
})();
