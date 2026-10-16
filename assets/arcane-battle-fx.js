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
 function beginCinema(){
  if(reduced()||!game||uiMode!=='duel')return Promise.resolve();
  const g=game,t=++key,fromLP=g.players.map(p=>Math.max(0,p.lp)),full=g.maxLP||8000;
  const pane=document.createElement('div');
  pane.className='ad-battle-intro';pane.setAttribute('role','status');
  pane.innerHTML='<div class="ad-battle-inner"><small>✧ DIE ARENA ERWACHT ✧</small><strong>DUELL STARTET</strong><span>✦ '+(g.mode==='pvp'?'ZWEI DUELLANTEN':'DIE SCHLACHT BEGINNT')+' ✦</span><i></i></div>';
  document.body.append(pane);
  busy=true;
  const mine=document.getElementById('myLP'),foe=document.getElementById('enemyLP');
  const left=document.getElementById('myLPBar'),right=document.getElementById('enemyLPBar');
  const started=performance.now();const duration=1350;
  const draw=(f)=>{
   if(game!==g||t!==key)return;
   if(mine)mine.textContent=String(Math.round(fromLP[0]*f));
   if(foe)foe.textContent=String(Math.round(fromLP[1]*f));
   if(left)left.style.width=(Math.max(0,fromLP[0]/full)*100*f)+'%';
   if(right)right.style.width=(Math.max(0,fromLP[1]/full)*100*f)+'%';
  };
  draw(0);
  return new Promise(resolve=>{
   let done=false;const close=()=>{if(done)return;done=true;pane.remove();if(game===g){busy=false;render();}resolve();};
   function frame(now){if(done||game!==g)return close();const f=Math.min(1,Math.max(0,(now-started)/duration));draw(1-Math.pow(1-f,2.3));if(f<1)requestAnimationFrame(frame);else close();}
   requestAnimationFrame(frame);setTimeout(close,2000);
  });
 }
 // A duel begins only after the player confirms the existing modal.
 const oldStart=startDuel;
 startDuel=function(...args){
  const result=oldStart(...args),go=document.getElementById('modalGo');
  if(!game||!go||uiMode!=='duel'||go.dataset.adIntroBound)return result;
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
  if(res?.destroyed?.length&&locations.length){
   for(const id of res.destroyed){
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
  const g=game,pending=g?.pending,big=pending?.kind==='fusion'&&(pending.card?.materialsUsed||0)>=4;
  await oldOwn(idx,...rest);
  if(!big||game!==g||g.pending||reduced())return;
  const cell=document.querySelector('[data-mine="'+idx+'"] .board-creature');if(!cell)return;
  const r=center(cell);if(!r)return;
  // Physical landing: quick wind-up, impact, dust cloud – never changes stats.
  cell.classList.add('ad-titan-impact');setTimeout(()=>cell.classList.remove('ad-titan-impact'),850);
  const table=document.querySelector('.table-surface');
  table?.classList.add('ad-impact-shake');
  setTimeout(()=>table?.classList.remove('ad-impact-shake'),410);
  sparks('ad-sparks-dust',r.x,r.y,40,true);
 };
 window.ArcaneBattleFX=Object.freeze({version:'1.0',beginCinema});
})();