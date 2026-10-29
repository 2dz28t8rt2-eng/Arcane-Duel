/* Arcane Duel v20.7 – visual Seelenstoß, source of truth remains essence-combat.js. */
'use strict';
(()=>{
 const sleep=n=>new Promise(done=>setTimeout(done,n));
 const center=el=>{const r=el?.getBoundingClientRect();return r&&r.width?{x:r.left+r.width/2,y:r.top+r.height/2}:null;};
 async function play(g,idx,damage){
  if(typeof document==='undefined'||animationSpeed==='instant'||window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
  const source=document.querySelector('#ownRow [data-mine="'+idx+'"] .board-creature')||
   document.querySelector('#ownRow [data-mine="'+idx+'"]');
  const target=document.getElementById('enemyBanner')||document.getElementById('enemyLP');
  const a=center(source),b=center(target);
  if(!a||!b)return;
  const stage=document.createElement('div');stage.className='ad207-soul-stage';
  stage.setAttribute('aria-hidden','true');document.body.append(stage);
  const orb=document.createElement('div');orb.className='ad207-soul-orb';
  orb.style.left=a.x+'px';orb.style.top=a.y+'px';stage.append(orb);
  for(let i=0;i<12;i++){
   const spark=document.createElement('i');spark.className='ad207-spark';spark.style.setProperty('--n',i);
   spark.style.setProperty('--angle',i*30+'deg');orb.append(spark);
  }
  try{
   await sleep(630);
   if(!stage.isConnected)return;
   orb.classList.add('ad207-charged');
   const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
   const beam=document.createElement('div');beam.className='ad207-soul-beam';
   beam.style.left=a.x+'px';beam.style.top=a.y+'px';beam.style.width=len+'px';
   beam.style.transform='rotate('+angle+'rad)';stage.append(beam);
   await sleep(305);
   const hit=document.createElement('div');hit.className='ad207-soul-hit';
   hit.style.left=b.x+'px';hit.style.top=b.y+'px';stage.append(hit);
   for(let i=0;i<9;i++){const skull=document.createElement('span');skull.textContent=i%3?'☠':'✧';skull.style.setProperty('--angle',i*40+'deg');skull.className='ad207-soul-skull';hit.append(skull);}
   const popup=document.createElement('strong');popup.className='ad207-soul-damage';popup.textContent='SEELENSTOSS · −'+Math.max(0,damage)+' LP';
   popup.style.left=b.x+'px';popup.style.top=(b.y-48)+'px';stage.append(popup);
   await sleep(650);
  }finally{stage.remove();}
 }
 window.ArcaneSoulBurst207=Object.freeze({version:'20.7',play});
})();