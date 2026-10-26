/* Arcane Duel 19.7: short scene curtains, visible DEF and LP-hit staging.
 * Presentation only. Damage is calculated exactly once by the duel engine.
 */
'use strict';
(()=>{
 const id=name=>document.getElementById(name);
 const reduce=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const delay=ms=>new Promise(done=>setTimeout(done,ms));
 let curtain=null,transition=0,lastDuelState=null,fxCtx=null;
 function ensureCurtain(){
  if(curtain)return curtain;
  curtain=document.createElement('div');curtain.className='ad197-screen-curtain';
  curtain.setAttribute('aria-hidden','true');document.body.append(curtain);
  return curtain;
 }
 async function blackout(duration=1200){
  const token=++transition,layer=ensureCurtain(),audio=window.ArcaneSoundscape;
  layer.classList.add('ad197-active');audio?.setTransientMuted?.(true);
  await delay(reduce()?70:duration);
  if(token!==transition)return;
  layer.classList.remove('ad197-active');audio?.setTransientMuted?.(false);
 }
 function syncDuel(){
  const root=id('duelScreen');if(!root)return;
  const active=!root.hidden;
  if(lastDuelState===null){lastDuelState=active;return;}
  if(lastDuelState!==active){lastDuelState=active;void blackout(1250);}
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
  try{await delay(165);node.classList.add('ad197-burst');slash(level);await delay(145);}finally{node.remove();}
 }
 window.ArcaneDamageFX=Object.freeze({play:showDamage});
 const oldFinished=typeof showFinished==='function'?showFinished:null;
 if(oldFinished)showFinished=function(...args){
  const wasShown=game?.finishShown,result=oldFinished.apply(this,args);
  if(game?.finishShown&&!wasShown)void blackout(1250);
  return result;
 };
 window.ArcaneDuelPolish197=Object.freeze({version:'19.7.0',blackout});
})();
