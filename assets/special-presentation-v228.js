/* Shared special-effect scenes. Only public geometry and confirmed values enter here. */
'use strict';
(()=>{
 const shared=window.ArcaneBattlePresentation228,delay=ms=>new Promise(r=>setTimeout(r,ms));
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const audioSettings=()=>window.ArcaneDuoSound194?{enabled:window.ArcaneDuoSound194.isEnabled(),volume:window.ArcaneDuoSound194.getVolume()/100}:window.ArcaneSoundscape?.getSettings?.();
 let fxCtx=null;
 const POWERS=Object.freeze({
  swarm:{title:'Rudelinstinkt',desc:'Rudelbonus zusätzlich +0,5 Prozentpunkte je Predator.'},
  mark:{title:'Blutspur',desc:'Folgeangriffe auf markierte Ziele +3 % Schaden.'},
  token:{title:'Rudelruf',desc:'Alle 3 eigenen Züge ein schwacher, nicht fusionierbarer Predator-Token bei freiem Feldplatz.'}
 });
 function howl(){
  if(shared.reduced()||document.hidden)return;
  const audio=audioSettings();
  if(audio&&(!audio.enabled||audio.volume<=0))return;
  try{
   const Ctx=window.AudioContext||window.webkitAudioContext;
   if(!Ctx)return;
   const ctx=new Ctx(),t=ctx.currentTime;
   const master=ctx.createGain();master.gain.setValueAtTime(.0001,t);
   master.gain.exponentialRampToValueAtTime(.09*(audio?audio.volume/.35:1),t+.14);
   master.gain.exponentialRampToValueAtTime(.0001,t+1.4);
   master.connect(ctx.destination);
   for(const [base,detune,volume] of [[175,0,.7],[233,-18,.3]]){
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sawtooth';osc.frequency.setValueAtTime(base,t);
    osc.frequency.exponentialRampToValueAtTime(base*1.45,t+.45);
    osc.frequency.exponentialRampToValueAtTime(base*.90,t+1.35);
    osc.detune.value=detune;gain.gain.value=volume;
    osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+1.45);
   }
   setTimeout(()=>ctx.close().catch(()=>{}),1650);
  }catch(_){} // Browser autoplay restrictions: never block summoning.
 }
 const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 async function cinemaReveal({overlay,instance,wait}){
  const info=instance?.predatorLeader;
  if(!info||!overlay)return;
  const panel=overlay.querySelector('.evo-popup-panel'),rolls=panel?.querySelector('.evo-rolls');
  if(!panel||!rolls)return;
  // Called only after the fusion's final rolled values and material bonuses
  // have been displayed and absorbed. No gameplay RNG or perk selection here.
  overlay.classList.remove('evo-calc-absorb','ad198-reveal-fade');
  overlay.classList.add('ad198-leader-reveal');
  const chosen=(info.powers||[]).filter(p=>POWERS[p]);
  window.ArcaneSfx208?.play?.('roar');
  rolls.innerHTML='<div class="ad198-pack-paw" aria-hidden="true">🐾</div>'+
   '<div class="ad198-awake-title">RUDELFÜHRER ERWACHT</div>'+
   '<div class="ad198-awake-sub">'+(info.predatorMaterials||info.materials)+
   ' PREDATOREN · '+info.materials+' MATERIALIEN</div>'+
   '<div class="ad198-skill ad198-skill-base"><b>♛ Rudelführer · Grundbonus</b>'+
   '<span>Rudelbonus: +3 % statt +2 % je aktivem Predator.</span></div>'+
   '<div class="ad198-perk-heading">ERHALTENE BONUS-PERKS · '+chosen.length+'</div>';
  if(info.materials>=4)howl();
  try{
   await wait(550);
   // Reveal each saved, preselected perk separately with a high-contrast color.
   // Keep the complete list visible long enough to read before fading it out.
   for(const power of chosen){
    const item=document.createElement('div');
    item.className='ad198-skill ad198-skill-chosen ad198-skill-'+power;
    item.setAttribute('role','status');
    item.innerHTML='<b>✦ '+esc(POWERS[power].title)+'</b>'+
     '<span>'+esc(POWERS[power].desc)+'</span>';
    rolls.append(item);
    panel.scrollTop=panel.scrollHeight;
    await wait(850);
   }
   await wait(4800); // Give newcomers time to read every rolled pack ability.
   overlay.classList.add('ad198-reveal-fade');
   await wait(900);
  }finally{
   overlay.classList.remove('ad198-leader-reveal','ad198-reveal-fade');
  }
 }
 function bloodImpact(el,killed,art,layer){
  if(shared.reduced())return;
  const r=el?.getBoundingClientRect();if(!r)return;

  layer?.classList.add('ad198-pack-shake');
  setTimeout(()=>layer?.classList.remove('ad198-pack-shake'),310);
  const burst=document.createElement('span');
  burst.className='ad198-blood-impact';
  burst.style.left=(r.left+r.width/2)+'px';burst.style.top=(r.top+r.height/2)+'px';
  burst.setAttribute('aria-hidden','true');
  for(let i=0;i<19;i++){
   const d=document.createElement('i'),a=i*Math.PI*2/19;
   d.style.setProperty('--dx',Math.round(Math.cos(a)*(32+(i%5)*10))+'px');
   d.style.setProperty('--dy',Math.round(Math.sin(a)*(23+(i%6)*7))+'px');
   burst.append(d);
  }
  document.body.append(burst);setTimeout(()=>burst.remove(),580);
  if(!killed)return;
  const tear=document.createElement('span');tear.className='ad198-claw-finish';
  tear.style.left=(r.left+r.width/2)+'px';tear.style.top=(r.top+r.height/2)+'px';
  tear.style.width=r.width+'px';tear.style.height=r.height+'px';
  tear.setAttribute('aria-hidden','true');
  for(const side of ['left','right']){
   const half=document.createElement('img');half.className='ad198-torn-'+side;
   half.alt='';half.src=art||'';tear.append(half);
  }
  const claws=document.createElement('span');claws.className='ad198-claw-lines';
  claws.innerHTML='<i></i><i></i><i></i>';tear.append(claws);
  document.body.append(tear);setTimeout(()=>tear.remove(),860);
 }
 function stompScene({from,to,targets=[],colors:col}){
  if(shared.reduced()||!from||!to)return null;
  const host=document.createElement('div');host.className='ad-stomp-scene';host.setAttribute('aria-hidden','true');
  host.style.setProperty('--stomp-color',col[0]);host.style.setProperty('--stomp-light',col[1]);
  const w=window.innerWidth||1280,h=window.innerHeight||800;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('width',w);svg.setAttribute('height',h);
  function beam(a,b,kind,branch=0){const d='M '+a.x+' '+a.y+' L '+b.x+' '+b.y;
   for(const layer of ['glow','core']){
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',d);path.setAttribute('class','ad-stomp-ray '+kind+' ad-stomp-'+layer);
    path.setAttribute('pathLength','100');
    if(kind==='ad-stomp-secondary')path.style.setProperty('--stomp-branch-delay',branch*55+'ms');
    svg.append(path);
   }
  }
  beam(from,to,'ad-stomp-primary');
  targets.forEach((t,i)=>beam(to,t,'ad-stomp-secondary',i));
  const core=document.createElement('div');core.className='ad-stomp-impact';core.style.left=to.x+'px';core.style.top=to.y+'px';
  const bursts=[core];targets.forEach((t,i)=>{
   const n=document.createElement('div');n.className='ad-stomp-impact ad-stomp-small';
   n.style.left=t.x+'px';n.style.top=t.y+'px';
   // Match each burst's start to the END of its corresponding 190ms ray.
   n.style.setProperty('--stomp-branch-delay',i*55+'ms');
   bursts.push(n);
  });
  for(const burst of bursts){const amount=burst===core?30:16;
   for(let i=0;i<amount;i++){const spark=document.createElement('i');
    spark.style.setProperty('--stomp-angle',(i*137.508)+'deg');
    spark.style.setProperty('--stomp-distance','-'+(52+(i%7)*13)+'px');
    spark.style.setProperty('--stomp-delay',(i%7)*13+'ms');burst.append(spark);}
  }
  host.append(svg,...bursts);document.body.append(host);return host;
 }
 function beamSound(){
  // Original synthesized burst; no external sound assets or extra downloads.
  try{
   const config=audioSettings();
   if(config?.enabled===false||config?.volume===0)return;
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
   const ctx=new Audio(),now=ctx.currentTime,level=clamp(config?.volume??.35,0,1);
   const out=ctx.createGain();out.gain.value=Math.min(.16,level*.25);out.connect(ctx.destination);
   const tone=ctx.createOscillator(),envelope=ctx.createGain();
   tone.type='sawtooth';tone.frequency.setValueAtTime(215,now);
   tone.frequency.exponentialRampToValueAtTime(58,now+.48);
   envelope.gain.setValueAtTime(.0001,now);
   envelope.gain.exponentialRampToValueAtTime(.28,now+.035);
   envelope.gain.exponentialRampToValueAtTime(.0001,now+.57);
   tone.connect(envelope);envelope.connect(out);tone.start(now);tone.stop(now+.59);
   const bass=ctx.createOscillator(),impact=ctx.createGain();
   bass.type='sine';bass.frequency.setValueAtTime(110,now+.24);
   bass.frequency.exponentialRampToValueAtTime(35,now+.62);
   impact.gain.setValueAtTime(.0001,now);
   impact.gain.setValueAtTime(.0001,now+.24);
   impact.gain.exponentialRampToValueAtTime(.75,now+.262);
   impact.gain.exponentialRampToValueAtTime(.0001,now+.69);
   bass.connect(impact);impact.connect(out);bass.start(now+.24);bass.stop(now+.7);
   setTimeout(()=>ctx.close().catch(()=>{}),920);
  }catch(_){/* Audio permissions must never cancel a duel. */}
 }
 function slash(level){
  // A short original broadband sword-swipe; no external sample is required.
  try{
   const config=audioSettings();if(config?.enabled===false||config?.volume===0)return;
   const volume=(config?.volume??.35)/.35;
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
   fxCtx=fxCtx||new Audio();if(fxCtx.state==='suspended')void fxCtx.resume();
   const when=fxCtx.currentTime,frames=Math.ceil(fxCtx.sampleRate*.105),buffer=fxCtx.createBuffer(1,frames,fxCtx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/frames,2);
   const source=fxCtx.createBufferSource(),filter=fxCtx.createBiquadFilter(),gain=fxCtx.createGain();
   filter.type='bandpass';filter.frequency.setValueAtTime(level>1?1500:2300,when);filter.frequency.exponentialRampToValueAtTime(420,when+.1);filter.Q.value=.65;
   gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime((level>1?.12:.07)*volume,when+.009);gain.gain.exponentialRampToValueAtTime(.0001,when+.11);
   source.buffer=buffer;source.connect(filter);filter.connect(gain);gain.connect(fxCtx.destination);source.start(when);source.stop(when+.11);
  }catch{}
 }
 async function damageAt(banner,amount,own=false){
  if(!Number.isFinite(amount)||amount<=0||shared.reduced()||!shared.point(banner))return;
  const rect=(banner.querySelector('.lp-track')||banner).getBoundingClientRect();
  const level=amount>=3000?3:amount>=1200?2:amount>=500?1:0;
  const node=document.createElement('div');node.className='ad197-damage'+(level>=2?' ad197-heavy':level>=1?' ad197-mid':'');
  node.style.left=rect.left+rect.width/2+'px';
  node.style.top=(own?rect.top-13:rect.bottom+35)+'px';
  node.style.setProperty('--power',String(1+level*.45));
  node.textContent='−'+Math.round(amount).toLocaleString('de-AT');
  node.innerHTML+=Array.from({length:8+level*5},(_,i)=>'<i style="--a:'+Math.round(i*360/(8+level*5))+'deg"></i>').join('');
  document.body.append(node);
  try{await delay(360);node.classList.add('ad197-burst');slash(level);await delay(280);}finally{node.remove();}
 }
 let curtain=null,trackLabel=null,transition=0;
 function ensureCurtain(){
  if(curtain)return curtain;
  curtain=document.createElement('div');curtain.className='ad197-screen-curtain';
  curtain.setAttribute('aria-hidden','true');document.body.append(curtain);
  trackLabel=document.createElement('div');trackLabel.className='ad197-now-playing';
  curtain.append?.(trackLabel);
  return curtain;
 }
 function updateTrackLabel(){
  if(!trackLabel)return;
  const track=window.ArcaneSoundscape?.getNowPlaying?.();
  trackLabel.textContent=track?.title&&track?.artist?'♫ '+track.title+' — '+track.artist:'';
  trackLabel.classList.remove('ad197-now-playing-active');
  if(trackLabel.textContent){void trackLabel.offsetWidth;trackLabel.classList.add('ad197-now-playing-active');}
 }
 async function blackout(duration=2100,enteringDuel=false){
  const token=++transition,layer=ensureCurtain(),audio=window.ArcaneSoundscape;
  layer.classList.add('ad197-active');audio?.setTransientMuted?.(true);
  if(trackLabel){trackLabel.textContent='';trackLabel.classList.remove('ad197-now-playing-active');}
  const total=shared.reduced()?70:duration;
  // Duel music begins behind the long black frame, not when it is lifted.
  await delay(enteringDuel&&!shared.reduced()?330:Math.min(total,600));
  if(token!==transition)return;
  audio?.setTransientMuted?.(false);
  if(enteringDuel)updateTrackLabel();
  await delay(enteringDuel&&!shared.reduced()?Math.max(0,total-330):Math.max(0,total-Math.min(total,600)));
  if(token!==transition)return;
  layer.classList.remove('ad197-active');
  if(trackLabel)trackLabel.classList.remove('ad197-now-playing-active');
 }
 window.ArcaneSpecialPresentation228=Object.freeze({POWERS,cinemaReveal,bloodImpact,stompScene,beamSound,damageAt,blackout});
})();
