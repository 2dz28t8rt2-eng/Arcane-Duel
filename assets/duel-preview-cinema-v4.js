/* Arcane Duel 4.1 – same card flight for the battlefield and deck.
 * Reuses ArcanePreviewMotion.fly and enhanceTraits without changing battle commands.
 */
'use strict';
(()=>{
 const motion=window.ArcanePreviewMotion;
 if(!motion)return;
 const duel=()=>document.getElementById('duelScreen');
 const inspector=()=>document.getElementById('largeCardPreview');
 let requested=null,lastSource=null,enemySource=null;
 const sourceFor=origin=>{
  if(!origin)return null;
  if(origin.selector)return document.querySelector(origin.selector);
  return origin.node?.isConnected?origin.node:null;
 };
 function capture(event){
  if(uiMode!=='duel'||!game)return;
  const card=event.target.closest('[data-hand],[data-mine],[data-enemy]');
  if(!card||!duel()?.contains(card))return;
  const type=card.hasAttribute('data-hand')?'hand':card.hasAttribute('data-mine')?'mine':'enemy';
  const creature=type==='hand'?card:card.querySelector('.board-creature');
  if(!creature)return;
  if(type==='enemy'&&game.selection?.type==='field'&&inputAllowed())return;
  const key=type==='hand'?card.dataset.hand:type==='mine'?card.dataset.mine:card.dataset.enemy;
  const selector=type==='hand'?'#hand [data-hand="'+key+'"]':
    type==='mine'?'#ownRow [data-mine="'+key+'"] .board-creature':
    '#enemyRow [data-enemy="'+key+'"] .board-creature';
  requested={type,key,selector,node:creature,rect:creature.getBoundingClientRect()};
 }
 duel()?.addEventListener('click',capture,true);
 function fly(from,to,element){
  if(!from||!to||!element||!motion.enabled())return;
  motion.fly(from,to,element);
 }
 function entering(element){
  if(!element||!motion.enabled())return;
  element.classList.add('ad-preview-card-arrive');
  const anim=element.animate([
   {opacity:.12,transform:'translateY(12px) scale(.95)',filter:'brightness(1.4)'},
   {opacity:1,transform:'translateY(0) scale(1)',filter:'brightness(1)'}
  ],{duration:430,easing:'cubic-bezier(.18,.8,.2,1)'});
  anim.onfinish=()=>element.classList.remove('ad-preview-card-arrive');
  anim.oncancel=()=>element.classList.remove('ad-preview-card-arrive');
 }
 // The core repeatedly re-renders. Only an actual user card click launches a
 // card flight; incidental state redraws never restart animations.
 const previousRender=renderCardPreview;
 renderCardPreview=function(...args){
  const root=inspector();
  const old=root?.querySelector('.hand-card.tc-card');
  const oldRect=old?.getBoundingClientRect();
  const req=requested?.type==='enemy'?null:requested;
  if(req)requested=null;
  const result=previousRender(...args);
  if(!root||uiMode!=='duel')return result;
  motion.enhanceTraits(root);
  if(!req)return result;
  const current=root.querySelector('.hand-card.tc-card');
  if(current){
   fly(req.rect,current.getBoundingClientRect(),req.node);
   entering(root);
   lastSource=req;
  }else if(old&&lastSource){
   const origin=sourceFor(lastSource),target=origin?.getBoundingClientRect();
   fly(oldRect,target,old);
   lastSource=null;
  }
  return result;
 };
 // Opponent card inspections appear in a modal. They use the IDENTICAL travel
 // from their small battlefield monster into the large preview and back.
 const previousEnemy=onEnemySlot;
 onEnemySlot=function(...args){
  const req=requested?.type==='enemy'?requested:null;
  if(req)requested=null;
  const result=previousEnemy(...args);
  if(!req)return result;
  const modal=document.getElementById('modal');
  const large=modal?.querySelector('.arcane-enemy-large .hand-card.tc-card');
  if(!large)return result; // A selected attacker instead performed a battle action.
  motion.enhanceTraits(modal);
  fly(req.rect,large.getBoundingClientRect(),req.node);
  entering(modal.querySelector('.arcane-enemy-large'));
  enemySource=req;
  return result;
 };
 const previousHide=hideModal;
 hideModal=function(...args){
  const modal=document.getElementById('modal');
  const large=modal?.querySelector('.arcane-enemy-large .hand-card.tc-card');
  if(large&&enemySource){
   const from=large.getBoundingClientRect(),to=sourceFor(enemySource)?.getBoundingClientRect();
   fly(from,to,large);
   enemySource=null;
  }
  return previousHide(...args);
 };
 const originalClear=clearSelection;
 clearSelection=function(...args){
  const before=inspector()?.querySelector('.hand-card.tc-card');
  const rect=before?.getBoundingClientRect();
  const result=originalClear(...args);
  if(before&&rect&&!inspector()?.querySelector('.hand-card.tc-card')&&lastSource){
   fly(rect,sourceFor(lastSource)?.getBoundingClientRect(),before);
   lastSource=null;
  }
  return result;
 };
 window.ArcaneDuelCardCinema=Object.freeze({
  version:'4.1.0',
  inspect:()=>inspector()?.querySelector('.hand-card.tc-card')||null,
  sharedMotion:()=>window.ArcanePreviewMotion===motion
 });
})();