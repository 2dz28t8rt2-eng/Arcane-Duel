/* Arcane Duel 19.7: short scene curtains, visible DEF and LP-hit staging.
 * Presentation only. Damage is calculated exactly once by the duel engine.
 */
'use strict';
(()=>{
 const id=name=>document.getElementById(name);
 const reduce=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const delay=ms=>new Promise(done=>setTimeout(done,ms));
 let curtain=null,trackLabel=null,transition=0,lastDuelState=null,fxCtx=null;
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
  const total=reduce()?70:duration;
  // Duel music begins behind the long black frame, not when it is lifted.
  await delay(enteringDuel&&!reduce()?330:Math.min(total,600));
  if(token!==transition)return;
  audio?.setTransientMuted?.(false);
  if(enteringDuel)updateTrackLabel();
  await delay(enteringDuel&&!reduce()?Math.max(0,total-330):Math.max(0,total-Math.min(total,600)));
  if(token!==transition)return;
  layer.classList.remove('ad197-active');
  if(trackLabel)trackLabel.classList.remove('ad197-now-playing-active');
 }
 function syncDuel(){
  const root=id('duelScreen');if(!root)return;
  const active=!root.hidden;
  if(lastDuelState===null){lastDuelState=active;return;}
  if(lastDuelState!==active){lastDuelState=active;void blackout(active?2850:1950,active);}
 }
 const root=id('duelScreen');
 if(root){new MutationObserver(syncDuel).observe(root,{attributes:true,attributeFilter:['hidden']});syncDuel();}
 const next=id('ad182-primary'),quickbar=next?.parentElement;
 if(quickbar&&id('switchBtn')){
  const button=document.createElement('button');button.type='button';button.id='ad197-switch';
  button.className='btn';button.textContent='↻ In DEF drehen';button.disabled=true;
  button.title='Gewähltes Feldmonster einmal pro Zug in ATK/DEF wechseln (vor einem Angriff).';
  button.addEventListener('click',()=>{const original=id('switchBtn');if(original&&!original.disabled)original.click();});
  quickbar.insertBefore(button,next);
  const oldRender=render;
  render=function(...args){
   const result=oldRender.apply(this,args),source=id('switchBtn');
   button.disabled=!source||source.disabled||source.hidden;
   button.textContent=source?.textContent||'↻ Position wechseln';
   return result;
  };
  id('ownRow')?.addEventListener('dblclick',event=>{
   if(!event.target.closest('[data-mine]'))return;
   const selected=Number(event.target.closest('[data-mine]').dataset.mine);
   if(game?.selection?.type==='field'&&game.selection.idx===selected&&!id('switchBtn').disabled)id('switchBtn').click();
  });
 }
 function slash(level){
  // A short original broadband sword-swipe; no external sample is required.
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
   fxCtx=fxCtx||new Audio();if(fxCtx.state==='suspended')void fxCtx.resume();
   const when=fxCtx.currentTime,frames=Math.ceil(fxCtx.sampleRate*.105),buffer=fxCtx.createBuffer(1,frames,fxCtx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/frames,2);
   const source=fxCtx.createBufferSource(),filter=fxCtx.createBiquadFilter(),gain=fxCtx.createGain();
   filter.type='bandpass';filter.frequency.setValueAtTime(level>1?1500:2300,when);filter.frequency.exponentialRampToValueAtTime(420,when+.1);filter.Q.value=.65;
   gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(level>1?.12:.07,when+.009);gain.gain.exponentialRampToValueAtTime(.0001,when+.11);
   source.buffer=buffer;source.connect(filter);filter.connect(gain);gain.connect(fxCtx.destination);source.start(when);source.stop(when+.11);
  }catch{}
 }
 async function showDamage(victim,amount){
  if(!Number.isFinite(amount)||amount<=0||reduce())return;
  const banner=id(victim===0?'myBanner':'enemyBanner');
  if(!banner||banner.getClientRects().length===0)return;
  const rect=(banner.querySelector('.lp-track')||banner).getBoundingClientRect();
  const level=amount>=3000?3:amount>=1200?2:amount>=500?1:0;
  const node=document.createElement('div');node.className='ad197-damage'+(level>=2?' ad197-heavy':level>=1?' ad197-mid':'');
  node.style.left=rect.left+rect.width/2+'px';
  node.style.top=(victim===0?rect.top-13:rect.bottom+35)+'px';
  node.style.setProperty('--power',String(1+level*.45));
  node.textContent='−'+Math.round(amount).toLocaleString('de-AT');
  node.innerHTML+=Array.from({length:8+level*5},(_,i)=>'<i style="--a:'+Math.round(i*360/(8+level*5))+'deg"></i>').join('');
  document.body.append(node);
  try{await delay(360);node.classList.add('ad197-burst');slash(level);await delay(280);}finally{node.remove();}
 }
 window.ArcaneDamageFX=Object.freeze({play:showDamage});
 const oldFinished=typeof showFinished==='function'?showFinished:null;
 const queued=new WeakSet();
 if(oldFinished)showFinished=function(...args){
  const g=game;
  if(!g||g.winner===null||g.finishShown||queued.has(g))return;
  queued.add(g);
  // Leave the last battle position readable. There is intentionally NO black
  // curtain here: the outcome lettering belongs on the unchanged battlefield.
  const victory=g.winner===0;
  // Claim rewards and persist the finished game immediately. Only the RESULT
  // display is delayed: asynchronous saving must never alter duel semantics.
  document.body.classList.add('ad197-result-hold');
  const outcome=oldFinished.apply(this,args);
  if(!dropChargesUnlocked())for(const pill of id('modal')?.querySelectorAll('.info-pills span')||[]){
   if(pill.textContent.includes('Dropladung'))pill.textContent='Dropladungen noch gesperrt';
  }
  void (async()=>{
   await delay(reduce()?200:1500);
   if(game!==g||uiMode!=='duel'){document.body.classList.remove('ad197-result-hold');return;}
   const announcement=document.createElement('div');
   announcement.className='ad197-outcome '+(victory?'ad197-victory':'ad197-defeat');
   announcement.textContent=victory?'Sieg':'Niederlage';
   announcement.setAttribute('role','status');
   document.body.append(announcement);
   window.ArcaneSfx208?.result?.(victory?'win':'lose');
   await delay(reduce()?300:1000);
   if(game!==g||uiMode!=='duel'){announcement.remove();document.body.classList.remove('ad197-result-hold');return;}
   const overlay=id('overlay');
   overlay?.classList.add('ad197-result-reveal');
   document.body.classList.remove('ad197-result-hold');
   await delay(reduce()?80:750);
   overlay?.classList.remove('ad197-result-reveal');
   announcement.remove();
  })();
  return outcome;
 };
 window.ArcaneDuelPolish197=Object.freeze({version:'19.7.0',blackout});
})();
