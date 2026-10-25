/* Arcane Duel 11.6.1 · new hand cards arrive from the right, only when drawn. */
'use strict';
(()=>{
 const motionOff=()=>animationSpeed==='instant'||document.body.classList.contains('ad-motion-disabled')||
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 let last=null;
 const priorRender=render;
 render=function(...args){
  const result=priorRender(...args);
  if(!game||uiMode!=='duel'){last=null;return result;}
  const g=game,viewer=g.mode==='pve'?0:g.active,p=g.players[viewer];
  const current=new Set(p.hand.map(c=>c.uid));
  const newly=last&&last.g===g&&last.viewer===viewer?
   [...current].filter(uid=>!last.ids.has(uid)):[];
  // The hand is rebuilt by rendering; only real NEW card UIDs enter.
  // Previous renders, selecting a card or changing its material flag never do.
  last={g,viewer,ids:current};
  if(motionOff()||!newly.length)return result;
  const root=document.getElementById('hand');
  if(!root)return result;
  const entering=new Set(newly);
  let i=0;
  root.querySelectorAll('[data-hand]').forEach(node=>{
   if(!entering.has(Number(node.dataset.hand)))return;
   node.classList.add('ad117-hand-incoming');
   node.style.setProperty('--ad117-delay',Math.min(i++,4)*85+'ms');
  });
  return result;
 };
 window.ArcaneHandDraw1161=Object.freeze({version:'11.6.1'});
})();
