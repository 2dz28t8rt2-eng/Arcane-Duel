/* Arcane Duel 4.0 – non-invasive artwork revamp foundation.
 * All existing IDs, owned cards, art and names remain unchanged until approved.
 */
'use strict';
(()=>{
 const overlay=Object.freeze({
  // Future entries use stable numeric card IDs, NEVER an existing name as key.
  // e.g. 123: {art:'assets/artworks/boss/unique-wyrm.webp',name:'...'}
 });
 const tier=level=>level<=2?'initiate':level<=5?'adept':level<=7?'elite':level<=9?'mythic':'sovereign';
 const family=card=>card.essenceMonster?'essence':card.ace?'ace':card.fusionOnly?'fusion':'base';
 const key=card=>family(card)+'/'+tier(Number(card.level)||1)+'/'+String(card.id).padStart(4,'0');
 function resolve(card){
  if(!card||!Number.isInteger(card.id))return null;
  const value=overlay[card.id];if(!value)return null;
  if(typeof value.art!=='string'||!/^assets\/artworks\/[a-z0-9/_-]+\.(webp|png)$/i.test(value.art))return null;
  return {id:card.id,art:value.art,name:typeof value.name==='string'?value.name:null,
   family:family(card),tier:tier(Number(card.level)||1)};
 }
 function audit(catalog){
  const rows=catalog.filter(card=>card&&Number.isInteger(card.id));
  const duplicates=rows.length-new Set(rows.map(card=>card.id)).size;
  return {count:rows.length,duplicates,missingLevel:rows.filter(card=>!Number.isInteger(card.level)||card.level<1).map(card=>card.id),
   status:duplicates===0?'ready':'duplicate IDs',categories:['base','fusion','essence','ace'],
   tiers:['initiate','adept','elite','mythic','sovereign']};
 }
 window.ArcaneArtCatalog=Object.freeze({version:'4.0.0',key,tier,family,resolve,audit});
})();