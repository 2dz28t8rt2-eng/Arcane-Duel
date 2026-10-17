/* Existing approved artwork belongs to the whole normal monster family.
 * Repair only unillustrated sibling levels, never substitute unrelated art. */
'use strict';
(()=>{
 const illustrated=c=>typeof c?.art==='string'&&c.art.startsWith('assets/');
 const groups=new Map(),repaired=[];
 for(const [key,id] of ARCANE_STAGE_IDS){
  const root=Number(key.split(':')[0]);if(!groups.has(root))groups.set(root,[]);
  groups.get(root).push(CARDS[id]);
 }
 for(const family of groups.values()){
  const sources=family.filter(illustrated),paths=[...new Set(sources.map(c=>c.art))];
  // A family with several deliberately distinct illustrations needs an explicit
  // mapping. Do not guess which design a missing variant should inherit.
  if(paths.length!==1)continue;
  const source=sources[0];
  for(const card of family){
   if(illustrated(card))continue;
   card.art=source.art;card.customArt=source.art;
   if(source.artWave)card.artWave=source.artWave;
   repaired.push(card.id);
  }
 }
 function audit(){
  const active=CARDS.filter(c=>c&&!c.retired),missing=active.filter(c=>!illustrated(c));
  const motifs=new Map();
  for(const c of missing){const root=c.lineRoot??c.variantOf??c.id;if(!motifs.has(root))motifs.set(root,{id:root,name:CARDS[root].name,cards:[],enemyOnly:!!c.enemyOnly,essence:!!c.essenceMonster});motifs.get(root).cards.push(c.id);}
  return {active:active.length,missingCards:missing.length,missingMotifs:motifs.size,repairedCards:repaired.length,motifs:[...motifs.values()]};
 }
 window.ArcaneArtworkCoverage=Object.freeze({version:'4.1.0',repaired:Object.freeze(repaired),audit});
})();
