/* Arcane Duel v11.3 - physical attack lunge and impact.
 * Animation-only: no damage, turn flags or combat RNG are ever modified here.
 * Honors Instant mode and reduced motion.
 */
'use strict';
(()=>{
 const reduced=()=>typeof window.matchMedia==='function'&&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function play(g,owner,ai,di){
  if(!g||animationSpeed==='instant'||reduced()||!document?.body)return false;
  const row=owner===0?'ownRow':'enemyRow',targetRow=owner===0?'enemyRow':'ownRow';
  const slot=$ (row)?.querySelector('[data-'+(owner===0?'mine':'enemy')+'="'+ai+'"]');
  const attacker=slot?.querySelector('.board-creature')||slot?.querySelector('.hand-card')||slot;
  const dest=di===null?$(owner===0?'enemyBanner':'myBanner'):
   $(targetRow)?.querySelector('[data-'+(owner===0?'enemy':'mine')+'="'+di+'"]');
  if(!attacker?.cloneNode||!attacker?.getBoundingClientRect||
     !dest?.getBoundingClientRect)return false;
  const src=attacker.getBoundingClientRect(),dst=dest.getBoundingClientRect();
  if(!Number.isFinite(src.left)||!Number.isFinite(dst.left)||src.width<=0)return false;
  const ghost=attacker.cloneNode(true);
  ghost.classList.add('ad113-attack-ghost');
  ghost.removeAttribute('id');ghost.removeAttribute('tabindex');
  ghost.style.position='fixed';
  ghost.style.left=src.left+'px';ghost.style.top=src.top+'px';
  ghost.style.width=src.width+'px';ghost.style.height=src.height+'px';
  ghost.style.zIndex='15001';ghost.style.pointerEvents='none';
  ghost.style.transformOrigin='center center';
  document.body.appendChild(ghost);
  const dx=dst.left+dst.width/2-(src.left+src.width/2);
  const dy=dst.top+dst.height/2-(src.top+src.height/2);
  const creature=g.players[owner]?.field?.[ai];
  const fresh=creature?.summonedTurn===g.turn;
  try{
   // A short wind-up makes newly summoned monsters feel responsive as well.
   await delay(fresh?55:18);
   if(ghost.animate){
    const motion=ghost.animate([
     {transform:'translate(0,0) scale(1)',filter:'brightness(1)'},
     {transform:'translate('+dx*.05+'px,'+dy*.05+'px) scale(.95)',filter:'brightness(1.15)',offset:.14},
     {transform:'translate('+dx*.55+'px,'+dy*.55+'px) scale(1.12)',filter:'brightness(1.65)',offset:.70},
     {transform:'translate('+dx*.85+'px,'+dy*.85+'px) scale(.97)',filter:'brightness(2.35)'}
    ],{duration:125,easing:'cubic-bezier(.12,.83,.18,1)',fill:'forwards'});
    // Hidden iframes and some browsers do not always settle WAAPI.finished.
    // Keep this strictly visual; never hold the turn or input indefinitely.
    await Promise.race([motion.finished.catch(()=>{}),delay(175)]);
    // Keep the ghost on the target before releasing WAAPI's fill state.
    ghost.style.transform='translate('+dx*.85+'px,'+dy*.85+'px) scale(.97)';
    motion.cancel();
   }else await delay(125);
   const burst=document.createElement('div');
   burst.className='ad113-attack-impact'+(owner===1?' ad113-foe-impact':'');
   burst.style.left=(dst.left+dst.width/2)+'px';
   burst.style.top=(dst.top+dst.height/2)+'px';
   burst.setAttribute('aria-hidden','true');
   burst.innerHTML='<span class="ad113-impact-core"></span><span class="ad117-impact-ring"></span><span class="ad117-impact-ring ad117-second-ring"></span>'+
    Array.from({length:32},(_,i)=>'<i style="--impact-index:'+i+';--impact-deg:'+(i*137.5%360)+'deg;--impact-distance:'+(38+i%7*9)+'px;--impact-delay:'+(i%5*12)+'ms"></i>').join('');
   document.body.appendChild(burst);
   ghost.classList.add('ad113-attack-hit');
   await delay(95);
   // Return the striking card to its zone BEFORE combat changes the board.
   // A destroyed target remains present until the caller commits the attack.
   if(ghost.animate){
    const retreat=ghost.animate([
     {transform:'translate('+dx*.85+'px,'+dy*.85+'px) scale(.97)',filter:'brightness(1.4)'},
     {transform:'translate(0px,0px) scale(1)',filter:'brightness(1)'}
    ],{duration:110,easing:'cubic-bezier(.28,.75,.25,1)',fill:'forwards'});
    await Promise.race([retreat.finished.catch(()=>{}),delay(160)]);
   }else await delay(110);
   burst.remove();
   return true;
  }finally{ghost.remove();}
 }
 window.ArcaneAttackFX=Object.freeze({version:'19.7.0',play});
})();
