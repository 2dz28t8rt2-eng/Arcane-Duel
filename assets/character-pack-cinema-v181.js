/* The character pack is rolled and saved BEFORE this opening animation.
 * Its established three-card choice, free pick and optional purchases are untouched.
 */
'use strict';
(()=>{
 const previous=showPack;
 const seen=new Set(),order=[];
 showPack=function(...args){
  const result=previous.apply(this,args),p=profile?.openPack;
  if(!p||p.taken?.length||!Array.isArray(p.cards)||p.cards.length!==3||
     !window.ArcanePackCinema178?.open)return result;
  const key=[p.created,p.source,p.difficulty,...p.cards].join(':');
  if(seen.has(key))return result;
  seen.add(key);order.push(key);
  if(order.length>24)seen.delete(order.shift());
  const choices=p.cards.map(id=>{
   const card=CARDS[id]||{};
   return {name:card.name,level:card.level,
    art:typeof dataOf==='function'?dataOf({id}).art:card.art,
    fusion:!!card.fusionOnly,ace:!!card.ace};
  });
  window.ArcanePackCinema178.open(choices,{
   title:'DEIN CHARAKTERPACK',
   subtitle:'Enthülle deine drei Möglichkeiten',selection:true
  });
  return result;
 };
 // A pack resumed during startup may have rendered before this enhancement loaded.
 window.addEventListener('load',()=>{
  if(profile?.openPack&&!profile.openPack.taken?.length&&uiMode==='menu'&&
     document.querySelector('#modal .pack-grid'))showPack();
 },{once:true});
})();
