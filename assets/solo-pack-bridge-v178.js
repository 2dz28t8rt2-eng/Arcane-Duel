/* Solo booster confirmation -> presentation of actual granted cards. */
'use strict';
(()=>{
 const previous=buyBooster;
 buyBooster=function(...args){
  const result=previous(...args);
  if(result&&profile?.lastBooster?.cards?.length){
   const rewards=profile.lastBooster.cards.map(id=>{
    const c=CARDS[id]||{};
    const art=typeof dataOf==='function'?dataOf({id}).art:c.art;
    return {name:c.name,level:c.level,art,fusion:!!c.fusionOnly,ace:!!c.ace};
   });
   window.ArcanePackCinema178?.open(rewards,{title:'BOOSTER ENTSIEGELT',
    subtitle:'Deine neuen Monster sind bereits in der Sammlung'});
  }
  return result;
 };
})();
