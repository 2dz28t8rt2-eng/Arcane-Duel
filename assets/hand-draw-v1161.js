/* Arcane Duel 11.6.1 · new hand cards arrive from the right, only when drawn. */
'use strict';
(()=>{
 const motionOff=()=>animationSpeed==='instant'||document.body.classList.contains('ad-motion-disabled')||
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 let last=null;
 // Opening cards are already in the authoritative hand. Keep them concealed
 // until the LP-fill cinematic finishes, then reveal those actual card nodes.
 function revealOpeningHand(){
  const screen=document.getElementById('duelScreen'),root=document.getElementById('hand');
  screen?.classList.remove('ad-opening-hand-wait');
  root?.removeAttribute('aria-hidden');
  if(!root||motionOff())return Promise.resolve();
  const cards=[...root.querySelectorAll('[data-hand]')];
  cards.forEach((node,i)=>{
   const rect=node.getBoundingClientRect();
   const flight=Math.max(160,window.innerWidth-rect.left+Math.max(40,rect.width*.3));
   node.style.setProperty('--ad117-from',Math.round(flight)+'px');
   node.style.setProperty('--ad117-delay',i*75+'ms');
   node.classList.add('ad117-hand-incoming');
  });
  return new Promise(resolve=>setTimeout(resolve,340+Math.max(0,cards.length-1)*75+65));
 }
 const priorRender=render;
 render=function(...args){
  const result=priorRender(...args);
  if(document.getElementById('duelScreen')?.classList.contains('ad-opening-hand-wait')){
   const count=document.getElementById('handCount');
   if(count)count.textContent='(0 / 5)';
  }
  if(!game||uiMode!=='duel'){last=null;return result;}
  const g=game,viewer=g.mode==='pve'?0:g.active,p=g.players[viewer];
  const current=new Set(p.hand.map(c=>c.uid));
  const newly=last&&last.g===g?
   [...current].filter(uid=>!last.ids[viewer].has(uid)):[];
  // The hand is rebuilt by rendering; only real NEW card UIDs enter.
  // Previous renders, selecting a card or changing its material flag never do.
  // Track both local seats, including when the PVP camera switches sides.
  last={g,ids:g.players.map(side=>new Set(side.hand.map(c=>c.uid)))};
  if(motionOff()||!newly.length)return result;
  const root=document.getElementById('hand');
  if(!root)return result;
  const entering=new Set(newly);
  let i=0;
  root.querySelectorAll('[data-hand]').forEach(node=>{
   if(!entering.has(Number(node.dataset.hand)))return;
   // Calculate the actual distance to the right viewport edge. This is a
   // proper screen-entry flight, not just a small nudge within the hand.
   const rect=node.getBoundingClientRect();
   const flight=Math.max(140,window.innerWidth-rect.left+Math.max(32,rect.width*.3));
   node.style.setProperty('--ad117-from',Math.round(flight)+'px');
   node.classList.add('ad117-hand-incoming');
   node.style.setProperty('--ad117-delay',Math.min(i++,4)*55+'ms');
  });
  return result;
 };
 window.ArcaneHandDraw1161=Object.freeze({version:'17.8',revealOpeningHand});
})();
