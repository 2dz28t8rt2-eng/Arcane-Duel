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
   // Recently played creatures deliberately take a beat before attacking.
   await delay(fresh?850:160);
   if(ghost.animate){
    const motion=ghost.animate([
     {transform:'translate(0,0) scale(1)',filter:'brightness(1)'},
     {transform:'translate('+dx*.08+'px,'+dy*.08+'px) scale(.90)',filter:'brightness(1.15)',offset:.18},
     {transform:'translate('+dx*.75+'px,'+dy*.75+'px) scale(1.12)',filter:'brightness(1.6)',offset:.71},
     {transform:'translate('+dx+'px,'+dy+'px) scale(.84)',filter:'brightness(2.35)'}
    ],{duration:480,easing:'cubic-bezier(.19,.72,.16,1)',fill:'forwards'});
    // Hidden iframes and some browsers do not always settle WAAPI.finished.
    // Keep this strictly visual; never hold the turn or input indefinitely.
    await Promise.race([motion.finished.catch(()=>{}),delay(620)]);
    motion.cancel();
   }else await delay(480);
   const burst=document.createElement('div');
   burst.className='ad113-attack-impact'+(owner===1?' ad113-foe-impact':'');
   burst.style.left=(dst.left+dst.width/2)+'px';
   burst.style.top=(dst.top+dst.height/2)+'px';
   burst.setAttribute('aria-hidden','true');
   burst.innerHTML='<span class="ad113-impact-core"></span>'+
    Array.from({length:12},(_,i)=>'<i style="--impact-index:'+i+'"></i>').join('');
   document.body.appendChild(burst);
   ghost.classList.add('ad113-attack-hit');
   await delay(280);
   burst.remove();
   return true;
  }finally{ghost.remove();}
 }
 window.ArcaneAttackFX=Object.freeze({version:'11.3.0',play});
})();
