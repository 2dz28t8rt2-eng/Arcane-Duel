/* Soul inheritance ceremony. Presentation ONLY; never changes a monster stat or game RNG.
 * Plays inside existing skip-aware fusion phase; reduced motion and instant mode are
 * handled by the caller. All particles are DOM/CSS (no network or paid assets).
 */
'use strict';
(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 async function play(overlay,materials,soul,wait){
  if(!overlay?.isConnected||!soul?.energy||!Number.isSafeInteger(soul.defBonus))return;
  const charged=(materials||[]).filter(m=>m.field&&m.soul>0);
  // A restored save may not include presentation snapshots; the authoritative
  // stored bonus still gets a legible generic orb / math row, never fabricated art.
  const chosen=charged[0]||null;
  const stage=overlay.querySelector('.evo-visual-stage');if(!stage)return;
  const host=document.createElement('div');
  host.className='soul-cinema-layer';host.setAttribute('aria-hidden','true');
  host.innerHTML='<div class="soul-hidden-orb"></div>'+
   '<div class="soul-source-card">'+
    (chosen?'<img alt="" src="'+esc(chosen.art)+'">':'<div class="soul-generic-card">✦</div>')+
    '<span>'+(chosen?esc(chosen.name):'Seelen-Erbe')+'</span></div>'+
   '<div class="soul-shatter"></div><div class="soul-projectiles"></div>';
  stage.append(host);
  const fragments=host.querySelector('.soul-shatter');
  for(let i=0;i<12;i++){
   const shard=document.createElement('i');shard.className='soul-shard';
   shard.style.setProperty('--i',String(i));
   shard.style.setProperty('--angle',(i*30)+'deg');
   shard.style.setProperty('--distance',(48+(i%4)*17)+'px');
   if(chosen?.art)shard.style.setProperty('--soul-image','url("'+chosen.art.replace(/["\\]/g,'')+'")');
   fragments.append(shard);
  }
  try{
   host.classList.add('soul-phase-material');
   await wait(480);
   host.classList.add('soul-phase-shatter');
   await wait(510);
   const trail=host.querySelector('.soul-projectiles');
   // Concave crescent cores and short star tails orbit outward before converging.
   // Pure presentational motion: independent of game seeds and outcomes.
   for(let i=0;i<19;i++){
    const orb=document.createElement('i');orb.className='soul-arc-projectile';
    const theta=i*2.39996;
    orb.style.setProperty('--arc-x',Math.round(Math.cos(theta)*(50+i%5*11))+'px');
    orb.style.setProperty('--arc-y',Math.round(Math.sin(theta)*(41+i%4*13))+'px');
    orb.style.setProperty('--lag',(i%5*33)+'ms');
    orb.innerHTML='<span class="soul-comet">✦</span>';
    trail.append(orb);
   }
   host.classList.add('soul-phase-transfer');
   overlay.classList.add('soul-inheritance-impact');
   await wait(1030);
  }finally{host.remove();}
 }
 window.ArcaneSoulCinema=Object.freeze({version:'1.0.0',play});
})();
