/* Arcane Duel – optional, presentation-only battle cinematics.
 * Loaded last: actual combat/rewards are committed by the existing engine.
 */
'use strict';
(()=>{
 const reduced=()=>animationSpeed==='instant'||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 let key=0;
 const safeRemove=(el,ms)=>{setTimeout(()=>el.remove(),ms);return el;};
 function sparks(cls,x,y,count,heavy=false){
  if(reduced()||!Number.isFinite(x)||!Number.isFinite(y))return;
  const host=document.createElement('div');host.className='ad-burst '+cls;
  host.setAttribute('aria-hidden','true');host.style.left=x+'px';host.style.top=y+'px';
  for(let i=0;i<count;i++){
   const spark=document.createElement('i');const a=(i/count)*Math.PI*2;
   spark.style.setProperty('--dx',Math.round(Math.cos(a)*(heavy?88:47)+(i%3-1)*11)+'px');
   spark.style.setProperty('--dy',Math.round(Math.sin(a)*(heavy?44:30)-19)+'px');
   spark.style.setProperty('--delay',(i%5)*21+'ms');
   spark.style.setProperty('--scale',String(.7+i%5*.25));
   host.append(spark);
  }
  document.body.append(host);safeRemove(host,1000);
 }
 function center(el){
  const r=el?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null;
 }
 function landingDust(cell,heavy=false){
  if(reduced()||!cell?.isConnected)return;
  const rect=cell.getBoundingClientRect(),table=document.querySelector('.table-surface');
  table?.classList.add('ad-impact-shake');
  setTimeout(()=>table?.classList.remove('ad-impact-shake'),410);
  sparks('ad-sparks-dust',rect.left+rect.width/2,rect.bottom-5,heavy?36:22,heavy);
 }
 function beginCinema(){
  if(reduced()||!game||uiMode!=='duel')
   return window.ArcaneHandDraw1161?.revealOpeningHand?.()||Promise.resolve();
  const g=game,t=++key,fromLP=g.players.map(p=>Math.max(0,p.lp)),full=g.maxLP||8000;
  const pane=document.createElement('div');
  pane.className='ad-battle-intro';pane.setAttribute('role','status');
  pane.innerHTML='<div class="ad-battle-inner"><small>✧ DIE ARENA ERWACHT ✧</small><strong>DUELL STARTET</strong><span>✦ '+(g.mode==='pvp'?'ZWEI DUELLANTEN':'DIE SCHLACHT BEGINNT')+' ✦</span><i></i></div>';
  document.body.append(pane);
  busy=true;
  const mine=document.getElementById('myLP'),foe=document.getElementById('enemyLP');
  const left=document.getElementById('myLPBar'),right=document.getElementById('enemyLPBar');
  const screen=document.getElementById('duelScreen');
  const introDuration=1650,fillDuration=2400;
  const draw=f=>{
   if(game!==g||t!==key)return;
   if(mine)mine.textContent=String(Math.round(fromLP[0]*f));
   if(foe)foe.textContent=String(Math.round(fromLP[1]*f));
   if(left)left.style.width=(Math.max(0,fromLP[0]/full)*100*f)+'%';
   if(right)right.style.width=(Math.max(0,fromLP[1]/full)*100*f)+'%';
  };
  render();draw(0);if(screen)screen.dataset.lpPhase='intro';
  return new Promise(resolve=>{
   let done=false,raf=0;
   const close=async()=>{
    if(done)return;done=true;cancelAnimationFrame(raf);pane.remove();
    if(game===g&&t===key){
     screen?.removeAttribute('data-lp-phase');render();
     try{await window.ArcaneHandDraw1161?.revealOpeningHand?.();}
     finally{if(game===g&&t===key){busy=false;render();}}
    }
    resolve();
   };
   // Keep LP at zero while the start screen is visible. Only then reveal
   // the slower, visible fill on the unobscured battlefield.
   setTimeout(()=>{
    pane.remove();if(done||game!==g||t!==key)return close();
    if(screen)screen.dataset.lpPhase='filling';
    const started=performance.now();
    function frame(now){
     if(done||game!==g||t!==key)return close();
     const f=Math.min(1,Math.max(0,(now-started)/fillDuration));
     draw(f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2);
     if(f<1)raf=requestAnimationFrame(frame);else close();
    }
    raf=requestAnimationFrame(frame);
   },introDuration);
   // Also releases input if a hidden tab throttles animation frames.
   setTimeout(close,introDuration+fillDuration+350);
  });
 }
 // A duel begins only after the player confirms the existing modal.
 const oldStart=startDuel;
 startDuel=function(...args){
  const result=oldStart(...args),go=document.getElementById('modalGo');
  if(!game||!go||uiMode!=='duel'||go.dataset.adIntroBound)return result;
  document.getElementById('duelScreen')?.classList.add('ad-opening-hand-wait');
  document.getElementById('hand')?.setAttribute('aria-hidden','true');
  const count=document.getElementById('handCount');if(count)count.textContent='(0 / 5)';
  go.dataset.adIntroBound='1';
  go.onclick=async()=>{
   const g=game;hideModal();
   try{await beginCinema();}finally{if(game===g&&g.mode==='pve'&&g.active===1&&g.winner===null)runAi();}
  };
  return result;
 };
 // Preserve the reward/lesson/fate overlays, enhance only the existing result modal.
 const oldFinish=showFinished;
 showFinished=function(...args){
  const result=oldFinish(...args),g=game;
  if(!g||g.winner===null||!g.finishShown)return result;
  const modal=document.getElementById('modal');
  if(!modal||modal.classList.contains('ad-outcome'))return result;
  if(!modal.textContent.includes('Sieg')&&!modal.textContent.includes('Niederlage')&&!modal.textContent.includes('gewinnt'))return result;
  const won=g.winner===(g.mode==='pve'?0:g.active);
  modal.classList.add('ad-outcome',won?'ad-outcome-win':'ad-outcome-loss');
  const banner=document.createElement('div');banner.className='ad-outcome-banner';
  banner.setAttribute('aria-hidden','true');
  banner.innerHTML='<span>'+ (won?'✦ TRIUMPH ✦':'✧ GEFALLEN ✧')+'</span><div class="ad-outcome-sigil">'+(won?'✷':'✥')+'</div>';
  modal.prepend(banner);
  if(!reduced()&&won){
   const rect=modal.getBoundingClientRect();
   sparks('ad-sparks-victory',rect.left+rect.width/2,rect.top+100,32);
  }
  return result;
 };
 // Snapshot cards before the real engine moves destroyed monsters to the graveyard.
 const oldAttack=attack;
 attack=function(g,ai,di){
  let locations=[];
  if(g===game&&!reduced()&&uiMode==='duel'){
   const viewer=g.mode==='pve'?0:g.active;
   for(const side of [0,1])for(let idx=0;idx<5;idx++){
    const card=g.players[side]?.field[idx];if(!card)continue;
    const el=document.querySelector('[data-'+(side===viewer?'mine':'enemy')+'="'+idx+'"] .board-creature');
    const c=center(el);if(c)locations.push({id:side+':'+idx,x:c.x,y:c.y,art:dataOf(card).art});
   }
  }
  const res=oldAttack(g,ai,di);
  if(res?.destroyed?.length&&g===game&&uiMode==='duel'){
   // This is the committed destruction event, after the impact cinematic.
   // Sound must also work in instant/reduced-motion mode, where visual
   // locations and particles are intentionally unavailable.
   for(const id of res.destroyed){
    window.ArcaneSfx208?.play?.('destroy');
    const item=locations.find(x=>x.id===id);if(!item)continue;
    sparks('ad-sparks-destruction',item.x,item.y,24);
    const ghost=document.createElement('div');ghost.className='ad-monster-dissolve';
    ghost.style.left=item.x+'px';ghost.style.top=item.y+'px';
    const img=document.createElement('img');img.src=item.art;img.alt='';ghost.append(img);
    ghost.setAttribute('aria-hidden','true');document.body.append(ghost);safeRemove(ghost,740);
   }
  }
  return res;
 };
 const oldOwn=onOwnSlot;
 onOwnSlot=async function(idx,...rest){
  const g=game,pending=g?.pending,owner=g?.active,before=g?.players[owner]?.field[idx]?.uid;
  await oldOwn(idx,...rest);
  const placed=g?.players[owner]?.field[idx];
  if(!pending||game!==g||g.pending||!placed?.fusion||placed.uid===before||reduced())return;
  if(window.ArcaneFusionCinema?.landed?.(g,placed.uid))return;
  if(window.ArcaneSummonFX)await window.ArcaneSummonFX.land(g,placed);

 };
 window.ArcaneBattleFX=Object.freeze({version:'1.1',beginCinema,landingDust,introDuration:1650,fillDuration:2400});
})();
