/* Arcane Duel: independent 2v2 progression v17.2, deterministic rules only.
 * Server supplies a cryptographically random integer function. No solo profile access.
 */
(function(root,factory){
 const result=factory();
 if(typeof module==='object'&&module.exports)module.exports=result;
 if(root)root.ArcaneDuoEconomy172=result;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const PACKS=Object.freeze({
  normal:Object.freeze({title:'Einzelkarte',count:1,fusions:[0,0],essence:90,shards:1}),
  fusion:Object.freeze({title:'Einzelfusion',count:1,fusions:[1,1],essence:160,shards:2}),
  material3:Object.freeze({title:'3er Materialpaket',count:3,fusions:[0,0],essence:230,shards:2}),
  fusion3:Object.freeze({title:'3er Fusionsmix',count:3,fusions:[1,2],essence:390,shards:4}),
  fusion5:Object.freeze({title:'5er Fusionsmix',count:5,fusions:[2,3],essence:600,shards:6}),
  fusion10:Object.freeze({title:'10er Fusionsmix',count:10,fusions:[3,5],essence:1100,shards:10})
 });
 const RESEARCH=Object.freeze({
  lv1:Object.freeze({title:'Verbotene Forschung',maxRank:5,chapterByRank:[2,3,3,4,4],
   costs:[[240,3],[360,4],[480,5],[610,6],[750,7]]}),
  essence:Object.freeze({title:'Essenzforschung',maxRank:3,chapterByRank:[2,3,4],
   costs:[[200,3],[340,4],[500,6]]})
 });
 const maxChapter=p=>Math.min(4,Math.max(1,...(p.cleared_chapters||[]).map(x=>x+1)));
 const maxCardLevel=p=>Math.min(10,3+2*Math.max(0,...(p.cleared_chapters||[])));
 const copies=arr=>arr.reduce((m,id)=>(m.set(id,(m.get(id)||0)+1),m),new Map());
 function researchRank(p,branch){
  if(branch==='lv1')return Math.max(0,Math.min(5,Number(p.lv1_research?.rank)||0));
  if(branch==='essence')return Math.max(0,Math.min(3,Number(p.essence_binding?.researchRank)||0));
  return 0;
 }
 function researchOffer(p,branch){
  const def=RESEARCH[branch];if(!def)return null;
  const rank=researchRank(p,branch);
  if(rank>=def.maxRank)return {rank,maxRank:def.maxRank,maxed:true,title:def.title};
  const [essence,shards]=def.costs[rank],requiredChapter=def.chapterByRank[rank];
  const maxCleared=Math.max(0,...(p.cleared_chapters||[]));
  return {title:def.title,rank,maxRank:def.maxRank,nextRank:rank+1,
   essence,shards,requiredChapter,unlocked:maxCleared>=requiredChapter};
 }
 function available(p,collection,fusion,catalog){
  const owned=copies(collection),maxLevel=maxCardLevel(p);
  return Object.values(catalog).filter(c=>c.playable===true&&!c.ace&&
   !!c.fusionOnly===fusion&&!c.lv1Exclusive&&
   c.level<=maxLevel&&(owned.get(c.id)||0)<3&&
   (!c.essenceMonster||(!fusion&&Math.max(0,...(p.cleared_chapters||[]))>=2))
  );
 }
 function packDraw(p,kind,catalog,randomInt){
  const offer=PACKS[kind];if(!offer)throw Error('Unbekanntes 2v2-Kartenpaket.');
  if(typeof randomInt!=='function')throw Error('Serverseitige Zufallsquelle fehlt.');
  const fusions=offer.fusions[0]+(offer.fusions[1]>offer.fusions[0]?
   randomInt(offer.fusions[1]-offer.fusions[0]+1):0);
  const nextMain=[...p.owned_main],nextFusions=[...p.owned_fusions],results=[];
  const draw=(fusion)=>{
   const collection=fusion?nextFusions:nextMain;
   const pool=available(p,collection,fusion,catalog);
   if(!pool.length)throw Error('Im freigeschalteten Kartenpool sind keine weiteren Karten verfügbar.');
   const card=pool[randomInt(pool.length)];
   if(!card)throw Error('Ungültiges Kartenlos.');
   collection.push(card.id);
   results.push({id:card.id,name:card.name,level:card.level,fusion});
  };
  for(let i=0;i<fusions;i++)draw(true);
  for(let i=fusions;i<offer.count;i++)draw(false);
  return {offer,cards:results,owned_main:nextMain,owned_fusions:nextFusions,
   fusionCount:fusions,normalCount:offer.count-fusions};
 }
 return Object.freeze({version:'17.2',PACKS,RESEARCH,
  maxChapter,maxCardLevel,available,researchRank,researchOffer,packDraw});
});
