/* Arcane Duel 4.1 · approved art overrides, presentation only.
 * Runs AFTER all artwork waves. Card ownership, IDs and combat never change.
 * Two fresh artworks are independently probed; if an asset is not yet deployed,
 * preserve the previous image instead of leaving a broken card.
 */
'use strict';
(()=>{
 const pack=[
  [320,'monster-0320.webp'],[74,'monster-0074.webp'],[181,'monster-0181.webp'],
  [318,'monster-0318.webp'],[316,'monster-0316.webp'],[53,'monster-0053.webp'],
  [62,'monster-0062.webp'],[315,'monster-0315.webp'],[260,'monster-0260.webp'],
  [70,'monster-0070.webp']
 ];
 const artRoot='assets/custom-art/generated-4-1/';
 const latest=[['Funkenwyrm','funkenwyrm-new.webp'],['Waldschlund','waldschlund-new.webp']];
 const applied=[],missing=[];
 function assign(card,path){
  if(!card)return false;
  card.art=path;card.customArt=path;card.artWave='4.1';
  applied.push({id:card.id,name:card.name,art:path});
  return true;
 }
 for(const [id,art] of pack){
  const c=CARDS[id];if(!c||c.id!==id){missing.push('ID '+id);continue;}
  assign(c,artRoot+art);
 }
 const checkImage=path=>new Promise(resolve=>{
  // The complete battle runtime also runs without DOM/Image inside Node.js.
  if(typeof Image==='undefined'){resolve(false);return;}
  const im=new Image();
  im.onload=()=>resolve(true);
  im.onerror=()=>resolve(false);
  im.src=path;
 });
 // Do not depend on a game server that serves missing local artwork.
 // This is also compatible with offline/pinned previews when a browser cache is stale.
 Promise.all(latest.map(async([name,asset])=>{
  const matching=CARDS.filter(c=>c?.name===name);
  if(matching.length!==1){missing.push(name+' (Zuordnung '+matching.length+')');return;}
  const path=artRoot+asset+'?v=artfix-20261017-2';
  if(await checkImage(path))assign(matching[0],path);
  else missing.push(name+' (Bilddatei fehlt)');
 })).then(()=>{
  if(typeof uiMode==='undefined')return;
  try{
   if(uiMode==='duel'&&typeof render==='function')render();
   else if(uiMode==='menu'&&typeof renderMenu==='function')renderMenu();
  }catch(e){console.warn('Artwork-Refresh',e);}
 });
 window.ArcaneArtworkHotfix=Object.freeze({version:'4.1',pack:pack.length,applied,missing});
})();