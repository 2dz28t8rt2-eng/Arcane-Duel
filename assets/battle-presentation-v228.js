/* Shared, presentation-only primitives for solo and server-authoritative 2v2.
 * Callers own persistence, rules and private data; this module only accepts DOM
 * nodes and already-public visual values. Cancellation never changes a duel.
 */
'use strict';
((root)=>{
 const doc=root.document,wait=ms=>new Promise(resolve=>root.setTimeout(resolve,ms));
 const reduced=()=>doc.body?.classList.contains('ad-motion-disabled')||
  root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||
  (typeof animationSpeed!=='undefined'&&animationSpeed==='instant');
 const point=node=>{const r=node?.getBoundingClientRect();return r&&r.width>0&&r.height>0?
  {x:r.left+r.width/2,y:r.top+r.height/2}:null;};
 async function settled(animation,ms){
  try{await Promise.race([animation.finished?.catch?.(()=>{}),wait(ms+80)].filter(Boolean));}
  finally{try{animation.finish();}catch{animation.cancel();}}
 }
 function sparks(cls,x,y,count=24,heavy=false){
  if(reduced()||!Number.isFinite(x)||!Number.isFinite(y))return;
  const host=doc.createElement('div');host.className='ad-burst '+cls;
  host.setAttribute('aria-hidden','true');host.style.left=x+'px';host.style.top=y+'px';
  for(let i=0;i<count;i++){
   const spark=doc.createElement('i'),a=i/count*Math.PI*2;
   spark.style.setProperty('--dx',Math.round(Math.cos(a)*(heavy?88:47)+(i%3-1)*11)+'px');
   spark.style.setProperty('--dy',Math.round(Math.sin(a)*(heavy?44:30)-19)+'px');
   spark.style.setProperty('--delay',(i%5)*21+'ms');spark.style.setProperty('--scale',String(.7+i%5*.25));host.append(spark);
  }
  doc.body.append(host);root.setTimeout(()=>host.remove(),1000);
 }
 function landingDust(cell,heavy=false){
  if(reduced()||!cell?.isConnected)return;
  const r=cell.getBoundingClientRect(),table=cell.closest('.table-surface,.duo-battle');
  table?.classList.add('ad-impact-shake');root.setTimeout(()=>table?.classList.remove('ad-impact-shake'),410);
  sparks('ad-sparks-dust',r.left+r.width/2,r.bottom-5,heavy?36:22,heavy);
 }
 async function land(cell,{owner=0,uid='',materials=0,valid=()=>true,phase=null}={}){
  if(reduced()||!valid()||!cell?.isConnected||!cell.animate)return false;
  const r=cell.getBoundingClientRect(),w=cell.offsetWidth||r.width,h=cell.offsetHeight||r.height;
  if(w<=0||h<=0)return false;
  const ghost=doc.createElement('div');ghost.className='ad-summon-ghost';ghost.dataset.owner=String(owner);ghost.dataset.uid=String(uid);ghost.setAttribute('aria-hidden','true');
  ghost.style.cssText='left:'+(r.left+r.width/2-w/2)+'px;top:'+(r.top+r.height/2-h/2)+'px;width:'+w+'px;height:'+h+'px;';
  const clone=cell.cloneNode(true);clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  clone.classList.remove('evo-fusion-awaiting','evo-fusion-landed','ad-summon-hidden','summon-anim','ad-titan-impact');ghost.append(clone);
  cell.classList.add('ad-summon-hidden');doc.body.append(ghost);
  try{
   const mass=materials>=3,ms=mass?245:480;
   const animation=ghost.animate([{transform:'scale(4.8)',opacity:.06},{transform:'scale(1.55)',opacity:.6,offset:mass?.35:.48},{transform:'scale(1)',opacity:1,offset:mass?.79:.84},{transform:'scale(1)',opacity:1}],{duration:ms,easing:'cubic-bezier(.55,.02,.7,1)',fill:'forwards'});
   if(phase)await phase.animate(animation,ms+60);else await settled(animation,ms);
  }finally{
   cell.classList.remove('ad-summon-hidden');ghost.remove();
   if(valid()&&cell.isConnected){cell.classList.add('evo-fusion-landed');landingDust(cell,materials>=4);root.setTimeout(()=>cell.classList.remove('evo-fusion-landed'),materials>=3?460:900);}
  }
  return true;
 }
 function flash(node,color){
  if(!node||reduced())return;node.style.setProperty('--ad-receive-color',color);node.classList.add('ad-energy-receive');root.setTimeout(()=>node.classList.remove('ad-energy-receive'),650);
 }
 function floatAt(node,message,kind='soul'){
  const p=point(node);if(!p||!message||reduced())return;
  const el=doc.createElement('div');el.className='ad-role-stat-float';el.dataset.kind=kind;
  el.textContent=message;el.style.left=p.x+'px';el.style.top=p.y+'px';el.setAttribute('aria-hidden','true');doc.body.append(el);root.setTimeout(()=>el.remove(),1100);
 }
 async function projectile(from,to,color,kind='soul'){
  if(!from||!to||reduced())return;
  const host=doc.createElement('div');host.className='ad-arc-projectile ad-projectile-'+kind;host.style.setProperty('--ad-energy',color);host.setAttribute('aria-hidden','true');
  const dx=to.x-from.x,dy=to.y-from.y,len=Math.max(1,Math.hypot(dx,dy)),bend=Math.min(115,Math.max(42,len*.23));
  const cx=(from.x+to.x)/2-dy/len*bend,cy=(from.y+to.y)/2+dx/len*bend,duration=kind==='counter'?350:860,stagger=kind==='counter'?7:24;
  const frames=[];for(let i=0;i<=24;i++){const t=i/24;frames.push({transform:'translate('+(Math.pow(1-t,2)*from.x+2*(1-t)*t*cx+t*t*to.x)+'px,'+(Math.pow(1-t,2)*from.y+2*(1-t)*t*cy+t*t*to.y)+'px)',opacity:i===0?0:i===24?0:1,offset:t});}
  for(let i=0;i<11;i++){const star=doc.createElement('i');star.textContent=i===0?'✦':'✧';host.append(star);}doc.body.append(host);
  try{await Promise.all([...host.children].map((star,i)=>star.animate?settled(star.animate(frames,{duration,delay:i*stagger,easing:'ease-in-out',fill:'both'}),duration+i*stagger):Promise.resolve()));}
  finally{host.remove();}
 }
 function dissolve(node,art){
  const p=point(node);if(!p||reduced())return;
  sparks('ad-sparks-destruction',p.x,p.y);
  const ghost=doc.createElement('div');ghost.className='ad-monster-dissolve';ghost.style.left=p.x+'px';ghost.style.top=p.y+'px';
  const img=doc.createElement('img');img.src=art;img.alt='';ghost.append(img);ghost.setAttribute('aria-hidden','true');doc.body.append(ghost);root.setTimeout(()=>ghost.remove(),740);
 }
 async function intro({valid=()=>true,label='DIE SCHLACHT BEGINNT'}={}){
  if(reduced()||!valid())return;
  const pane=doc.createElement('div');pane.className='ad-battle-intro';pane.setAttribute('role','status');
  pane.innerHTML='<div class="ad-battle-inner"><small>✧ DIE ARENA ERWACHT ✧</small><strong>DUELL STARTET</strong><span></span><i></i></div>';
  pane.querySelector('span').textContent='✦ '+label+' ✦';doc.body.append(pane);
  // Remove a scene promptly if its caller left the duel during a network update.
  let timer;try{await new Promise(resolve=>{const start=Date.now();const step=()=>{if(!valid()||Date.now()-start>=1650)resolve();else timer=root.setTimeout(step,50);};step();});}finally{root.clearTimeout(timer);pane.remove();}
 }
 function fillLP({draw,valid=()=>true,screen=null}={}){
  if(reduced()){if(valid())draw(1);return Promise.resolve();}
  return new Promise(resolve=>{
   let done=false,raf=0;const start=root.performance.now();
   if(screen)screen.dataset.lpPhase='filling';
   const close=()=>{if(done)return;done=true;root.cancelAnimationFrame(raf);root.clearTimeout(timer);screen?.removeAttribute('data-lp-phase');if(valid())draw(1);resolve();};
   const timer=root.setTimeout(close,2750);
   function frame(now){if(!valid())return close();const f=Math.min(1,Math.max(0,(now-start)/2400));draw(f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2);if(f<1)raf=root.requestAnimationFrame(frame);else close();}
   raf=root.requestAnimationFrame(frame);
  });
 }
 // The same title, timing and sound cue precede the result modal in both modes.
 async function outcome({won,valid=()=>true,reveal=()=>{}}={}){
  await wait(reduced()?200:1500);if(!valid())return;
  root.ArcaneSfx208?.result?.(won?'win':'lose');await wait(reduced()?40:145);if(!valid())return;
  const node=doc.createElement('div');node.className='ad197-outcome '+(won?'ad197-victory':'ad197-defeat');node.textContent=won?'Sieg':'Niederlage';node.setAttribute('role','status');doc.body.append(node);
  try{await wait(reduced()?300:1000);if(valid())reveal();await wait(reduced()?80:750);}finally{node.remove();}
 }
 async function defenderSequence({targets=[],steps=[],play,valid=()=>true}){
  if(reduced()||!valid()||!steps.length)return;
  const orbs=new Map();
  try{
   for(const {key,node} of targets){
    const p=point(node);if(!p)continue;
    const orb=doc.createElement('div');orb.className='ad-soul-orb';orb.style.left=p.x+'px';orb.style.top=p.y+'px';orb.setAttribute('aria-hidden','true');doc.body.append(orb);orbs.set(key,orb);
   }
   await wait(330);
   for(const step of steps){if(!valid()||reduced())break;await play(step,orbs);await wait(110);}
  }finally{for(const orb of orbs.values()){orb.classList.add('ad-orb-dismiss');root.setTimeout(()=>orb.remove(),280);}}
 }
 async function counter(source,banner,amount,{valid=()=>true}={}){
  if(reduced()||!valid())return;
  const goal=point(banner);await projectile(point(source),goal,'#ff214c','counter');
  if(!valid())return;
  flash(banner,'#ff214c');banner?.classList.add('ad-counter-damage');
  if(amount>0){floatAt(banner,'−'+amount+' LP · GEGENSCHLAG','counter-damage');root.ArcaneSfx208?.play?.('damage');}
  const shock=doc.createElement('div');shock.className='ad-counter-impact';shock.setAttribute('aria-hidden','true');
  if(goal){shock.style.left=goal.x+'px';shock.style.top=goal.y+'px';doc.body.append(shock);root.setTimeout(()=>shock.remove(),480);}
  root.setTimeout(()=>banner?.classList.remove('ad-counter-damage'),450);
 }
 root.ArcaneBattlePresentation228=Object.freeze({reduced,point,sparks,landingDust,land,flash,floatAt,projectile,dissolve,intro,fillLP,outcome,defenderSequence,counter});
})(typeof window==='undefined'?globalThis:window);
