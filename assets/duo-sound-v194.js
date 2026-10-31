/* Arcane Duel v19.4 – opt-in, synthesized 2v2 audio cues.
 * Client-only. All cues are derived from confirmed public state changes.
 */
'use strict';
(()=>{
 const STORE_KEY='arcane-duo-sound-v194',DEFAULT_VOLUME=35,MAX_CUES=5;
 let enabled=false,volume=DEFAULT_VOLUME,ctx=null,master=null,noise=null;
 let timers=[],generation=0,mounted=false;
 const $=id=>document.getElementById(id);
 const n=value=>Math.max(0,Number(value)||0);
 const visible=()=>document.visibilityState!=='hidden'&&!document.hidden;
 const same=(a,b)=>!!a&&!!b&&a.roomId===b.roomId&&
  a.chapter===b.chapter&&Number.isSafeInteger(a.revision)&&
  Number.isSafeInteger(b.revision)&&b.revision>a.revision;
 function linesSince(before,after){
  if(!same(before,after))return [];
  const a=before.log||[],b=after.log||[];
  if(b.length>=a.length&&a.every((v,i)=>v===b[i]))return b.slice(a.length);
  for(let x=Math.min(a.length,b.length);x>0;x--){
   if(a.slice(-x).every((v,i)=>v===b[i]))return b.slice(x);
  }
  return [];
 }
 function analyze(before,after,catalog={},viewerSeat=0){
  if(!same(before,after))return [];
  const logs=linesSince(before,after),cues=[];
  if(!logs.length)return [];
  const animated=window.ArcaneDuoCinema170?.observed?.(before,after)||[];
  const fusion=animated.find(x=>x.kind==='fusion');
  if(fusion||logs.some(l=>/ fusioniert \d+ eigene Monster zu /.test(l)))
   cues.push({kind:'fusion',delay:460});
  else if(logs.some(l=>/ beschwört /.test(l)))cues.push({kind:'summon',delay:330});
  const draw=animated.find(x=>x.kind==='draw'&&x.seat===viewerSeat)||
   animated.find(x=>x.kind==='draw');
  if(fusion?.result?.predatorLeader?.materials>=4)
   cues.push({kind:'alphaHowl',delay:2710});
  if(draw&&draw.count>0)cues.push({kind:'draw',count:Math.min(3,draw.count),delay:120});
  const abilities=window.ArcaneDuoAbilitiesCinema193?.analyze?.(before,after,catalog)||[];
  const kinds=new Set();
  for(const item of abilities){
   const kind=item.kind==='raid'||item.kind==='drain'?'siphon':item.kind;
   if(kinds.has(kind))continue;
   kinds.add(kind);
   cues.push({kind,delay:kind==='resonance'?850:
    kind==='drain'||kind==='siphon'?480:240});
   if(kinds.size>=2)break;
  }
  const attack=logs.some(line=>/ greift .* in (?:ATK|DEF) an/.test(line)||
   / · direkter Angriff: \d+ /.test(line));
  if(attack){
   cues.push({kind:'attack',delay:120});
   const hits=window.ArcaneDuoImpactCinema192?.analyze?.(before,after,catalog)||[];
   const hit=hits.find(x=>x.kind==='hit'&&x.amount>0)||
    hits.find(x=>x.kind==='lp'&&x.amount>0);
   const ward=hits.some(x=>x.kind==='ward'||x.kind==='block');
   if(hit)cues.push({kind:hit.heavy?'heavy':'hit',delay:395});
   else if(ward)cues.push({kind:'shield',delay:460});
   if(hits.some(x=>x.kind==='counter'))cues.push({kind:'counter',delay:1010});
  }
  if(before.status!=='finished'&&after.status==='finished'){
   const player=(after.players||[]).find(x=>x.seat===viewerSeat);
   if(player)cues.push({kind:player.team===after.winner?'win':'lose',delay:900});
  }
  const ordered=cues.sort((a,b)=>a.delay-b.delay);
  if(ordered.length<=MAX_CUES)return ordered;
  const ending=ordered.find(c=>c.kind==='win'||c.kind==='lose');
  const rest=ordered.filter(c=>c!==ending).slice(0,MAX_CUES-(ending?1:0));
  if(ending)rest.push(ending);
  return rest.sort((a,b)=>a.delay-b.delay);
 }
 function loadSetting(){
  try{
   const data=JSON.parse(window.localStorage?.getItem(STORE_KEY)||'null');
   if(data&&typeof data==='object'){
    enabled=data.enabled===true;
    if(Number.isFinite(data.volume))volume=Math.max(0,Math.min(100,Math.round(data.volume)));
   }
  }catch{/* Private mode must not disable the controls. */}
 }
 function storeSetting(){
  try{window.localStorage?.setItem(STORE_KEY,JSON.stringify({enabled,volume}));}catch{}
 }
 function updateUI(hint){
  const root=$('ad194-sound-controls'),button=$('ad194-sound-toggle');
  if(!root||!button)return;
  root.dataset.enabled=String(enabled);
  button.setAttribute('aria-pressed',String(enabled));
  button.textContent=enabled?'🔊 Ton an':'🔇 Ton aus';
  const slider=$('ad194-sound-volume');if(slider)slider.value=String(volume);
  const output=$('ad194-sound-value');if(output)output.textContent=volume+' %';
  const status=$('ad194-sound-hint');if(status&&hint!==undefined)status.textContent=hint;
 }
 function unlock(){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return false;
  try{
   if(!ctx){
    ctx=new Audio();master=ctx.createGain();
    const compressor=ctx.createDynamicsCompressor?.();
    if(compressor){
     compressor.threshold.value=-14;compressor.knee.value=9;
     compressor.ratio.value=5;compressor.attack.value=.004;
     compressor.release.value=.12;
     master.connect(compressor);compressor.connect(ctx.destination);
    }else master.connect(ctx.destination);
    noise=ctx.createBuffer(1,Math.max(1,Math.floor(ctx.sampleRate*.48)),ctx.sampleRate);
    const pcm=noise.getChannelData(0);let seed=2026194;
    for(let i=0;i<pcm.length;i++){
     seed=(Math.imul(seed,1664525)+1013904223)>>>0;
     pcm[i]=(seed/2147483648-1)*.75;
    }
   }
   if(ctx.state==='suspended')ctx.resume?.().catch(()=>{});
   master.gain.setTargetAtTime(enabled?volume/100*.36:0,ctx.currentTime,.012);
   return true;
  }catch{return false;}
 }
 function tone(freq,finish,at,duration,kind='sine',strength=.25){
  if(!ctx||!master)return;
  const oscillator=ctx.createOscillator(),amp=ctx.createGain();
  oscillator.type=kind;
  oscillator.frequency.setValueAtTime(Math.max(25,freq),at);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(25,finish),at+duration);
  amp.gain.setValueAtTime(.0001,at);
  amp.gain.exponentialRampToValueAtTime(Math.max(.001,strength),at+.012);
  amp.gain.exponentialRampToValueAtTime(.0001,at+duration);
  oscillator.connect(amp);amp.connect(master);
  oscillator.start(at);oscillator.stop(at+duration+.012);
 }
 function rustle(at,duration,cutoff,strength=.16){
  if(!ctx||!noise)return;
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
  src.buffer=noise;filter.type='bandpass';filter.frequency.setValueAtTime(cutoff,at);
  filter.Q.value=.7;
  amp.gain.setValueAtTime(.0001,at);
  amp.gain.exponentialRampToValueAtTime(strength,at+.015);
  amp.gain.exponentialRampToValueAtTime(.0001,at+duration);
  src.connect(filter);filter.connect(amp);amp.connect(master);
  src.start(at);src.stop(at+duration+.01);
 }
 function sound(kind,count=1){
  // A network poll is never permission to start a suspended audio context.
  // Only an actual user gesture calls unlock(). This also prevents queued
  // audio bursts suddenly playing when an old tab regains focus.
  if(!enabled||!visible()||!ctx||ctx.state!=='running')return false;
  // v20.8 sampled sounds own these events; do not overlay synthetic duplicates.
  if(window.ArcaneBattlePresentation228&&window.ArcaneSfx208)return true;
  if(window.ArcaneSfx208&&['draw','summon','fusion','alphaHowl','win','lose'].includes(kind))return true;
  const t=ctx.currentTime+.018;
  switch(kind){
   case 'draw':
    for(let i=0;i<Math.min(3,count);i++){
     const at=t+i*.105;rustle(at,.115,1650+i*170,.16);
     tone(720+i*65,1040+i*80,at,.105,'sine',.085);
    }break;
   case 'summon':
    tone(280,590,t,.32,'triangle',.18);
    tone(560,830,t+.075,.27,'sine',.11);break;
   case 'fusion':
    tone(165,300,t,.62,'triangle',.23);
    tone(270,580,t+.085,.54,'sine',.21);
    tone(420,980,t+.18,.49,'sine',.13);
    rustle(t+.2,.25,2550,.075);break;
   case 'alphaHowl':
    tone(250,95,t,.63,'sawtooth',.11);
    tone(310,112,t+.09,.7,'triangle',.17);
    rustle(t+.13,.42,940,.12);break;
   case 'attack':
    rustle(t,.16,720,.19);tone(310,110,t,.23,'sawtooth',.13);break;
   case 'hit':
    tone(175,70,t,.24,'triangle',.34);rustle(t,.15,480,.17);break;
   case 'heavy':
    tone(145,42,t,.37,'sawtooth',.4);tone(80,45,t+.03,.35,'sine',.32);
    rustle(t,.2,260,.24);break;
   case 'shield':
    tone(790,500,t,.28,'sine',.23);tone(1190,930,t+.025,.22,'triangle',.11);break;
   case 'counter':
    tone(520,220,t,.28,'triangle',.24);tone(175,96,t+.055,.28,'sine',.23);break;
   case 'condense':
    tone(320,520,t,.4,'sine',.2);tone(480,745,t+.07,.37,'triangle',.13);
    tone(650,930,t+.15,.31,'sine',.08);break;
   case 'siphon':
    tone(810,250,t,.56,'sine',.16);tone(235,105,t+.13,.4,'triangle',.17);break;
   case 'focus':
    tone(780,1060,t,.24,'sine',.16);tone(1170,1150,t+.08,.18,'sine',.07);break;
   case 'resonance':
    tone(520,690,t,.28,'sine',.21);tone(785,950,t+.095,.32,'sine',.17);break;
   case 'discharge':
    tone(155,540,t,.29,'sawtooth',.19);tone(620,80,t+.25,.37,'triangle',.34);
    rustle(t+.22,.25,820,.2);break;
   case 'packBreak':
    tone(390,115,t,.31,'triangle',.23);rustle(t+.065,.16,1750,.18);break;
   case 'packOpen':
    tone(220,580,t,.43,'sine',.22);tone(460,990,t+.09,.45,'triangle',.12);
    rustle(t+.05,.22,2600,.12);break;
   case 'packFlip':
    rustle(t,.1,1500,.12);tone(600,930,t+.03,.12,'sine',.08);break;
   case 'packRare':
    tone(440,660,t,.34,'sine',.18);tone(660,990,t+.13,.4,'sine',.18);
    tone(990,1320,t+.25,.4,'sine',.09);break;
   case 'packAce':
    tone(196,392,t,.64,'triangle',.22);
    [523,659,784,1046].forEach((freq,i)=>
     tone(freq,freq*1.025,t+.12+i*.13,.45,'sine',.18));break;
   case 'win':
    [392,494,587].forEach((freq,i)=>tone(freq,freq*1.03,t+i*.155,.36,'sine',.22));break;
   case 'lose':
    [392,330,262].forEach((freq,i)=>tone(freq,freq*.88,t+i*.18,.37,'triangle',.17));break;
   default:return false;
  }
  return true;
 }
 function cancel(){generation++;timers.forEach(clearTimeout);timers=[];}
 function setEnabled(value){
  enabled=value===true;
  cancel();
  if(enabled){
   if(!unlock())enabled=false;
   else if(ctx.state==='running')sound('resonance');
   else ctx.resume?.().then(()=>{if(enabled)sound('resonance');}).catch(()=>{});
  }else if(ctx&&master){
   master.gain.setTargetAtTime(0,ctx.currentTime,.007);
  }
  storeSetting();updateUI(enabled?'Ton ist eingeschaltet.':'Ton ist ausgeschaltet.');
  return enabled;
 }
 function setVolume(value){
  volume=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  if(ctx&&master)master.gain.setTargetAtTime(enabled?volume/100*.36:0,
   ctx.currentTime,.012);
  storeSetting();updateUI();return volume;
 }
 function onState(before,after,catalog={},viewerSeat=0){
  const cues=analyze(before,after,catalog,viewerSeat);
  if(before&&after&&before.revision!==after.revision)cancel();
  if(!enabled||!visible()||!ctx||ctx.state!=='running'||!cues.length)return cues;
  const stamp=generation;
  for(const cue of cues)timers.push(setTimeout(()=>{
   if(generation===stamp)sound(cue.kind,cue.count||1);
  },cue.delay));
  return cues;
 }
 function mount(){
  if(mounted||!$('ad194-sound-controls'))return false;
  mounted=true;loadSetting();
  const button=$('ad194-sound-toggle'),slider=$('ad194-sound-volume');
  button?.addEventListener('click',()=>setEnabled(!enabled));
  slider?.addEventListener('input',()=>setVolume(slider.value));
  const gesture=()=>{if(enabled&&(!ctx||ctx.state!=='running'))unlock();};
  window.addEventListener?.('pointerdown',gesture,{passive:true});
  window.addEventListener?.('keydown',gesture);
  updateUI(enabled?'Ton ist bereit. Einmal klicken, um ihn freizugeben.':
   'Ton ist zunächst ausgeschaltet.');
  if(!window.AudioContext&&!window.webkitAudioContext){
   if(button)button.disabled=true;
   updateUI('Dieser Browser unterstützt leider keine Duellklänge.');
  }
  return true;
 }
 function playPreview(kind){
  if(!enabled||!unlock())return false;
  if(ctx.state==='running')return sound(kind);
  ctx.resume?.().then(()=>{if(enabled)sound(kind);}).catch(()=>{});
  return true;
 }
 window.ArcaneDuoSound194=Object.freeze({version:'19.4.0',analyze,linesSince,
  onState,mount,setEnabled,setVolume,playPreview,
  isEnabled:()=>enabled,getVolume:()=>volume,cancel});
 // On pages without a 2v2 battle panel, the pack ritual can still share
 // the same saved sound preference; playback remains gesture-gated.
 loadSetting();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})();
