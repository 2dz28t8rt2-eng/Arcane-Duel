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
  essence:Object.freeze({title:'Essenzwesen-Paket',count:1,fusions:[0,0],essence:350,shards:4,special:'essence'}),
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
   if(offer.special==='essence'&&Math.max(0,...(p.cleared_chapters||[]))<2)
    throw Error('Essenzwesen-Pakete benötigen einen Sieg in 2v2-Kapitel II.');
   const pool=available(p,collection,fusion,catalog).filter(c=>
    offer.special==='essence'?c.essenceMonster===true:true);
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

 const ENHANCEMENT_MAX=5;
 function enhanceOffer(p,id,catalog){
  const c=catalog?.[id],rank=Number(p.enhancements?.[id]||0);
  if(!Number.isInteger(id)||!c?.playable||!Number.isInteger(rank)||
    rank<0||rank>ENHANCEMENT_MAX)return null;
  const collection=c.fusionOnly?p.owned_fusions:p.owned_main;
  const deck=c.fusionOnly?p.fusions:p.deck;
  if(!collection.includes(id)||!deck.includes(id))return null;
  if(rank===ENHANCEMENT_MAX)return {id,rank,maxed:true,maxRank:ENHANCEMENT_MAX};
  return {id,rank,maxRank:ENHANCEMENT_MAX,nextRank:rank+1,
   essence:75+55*rank+(c.fusionOnly?35:0),
   shards:1+Math.floor(rank/2)+(c.fusionOnly?1:0),
   bonusPerStat:(id<20?10:c.fusionOnly?20:30)};
 }
 function recycleOffer(p,id,catalog){
  const c=catalog?.[id];
  if(!Number.isInteger(id)||!c?.playable||c.ace||c.lv1Exclusive||
   c.essenceMonster||c.fateOnly)return null;
  const collection=c.fusionOnly?p.owned_fusions:p.owned_main;
  const deck=c.fusionOnly?p.fusions:p.deck;
  const quantity=collection.filter(x=>x===id).length;
  const used=deck.filter(x=>x===id).length;
  const spare=quantity-used;
  if(spare<=0)return null;
  return {id,quantity,used,spare,fusion:!!c.fusionOnly,
   essence:(c.fusionOnly?42:18)+Math.max(1,Number(c.level)||1)*5,
   shards:c.fusionOnly?2:1};
 }
 function collectionRows(p,catalog,zone='all'){
  const result=[];
  for(const fusion of [false,true]){
   if(zone!=='all'&&zone!==(fusion?'fusion':'main'))continue;
   const owned=fusion?p.owned_fusions:p.owned_main,deck=fusion?p.fusions:p.deck;
   for(const [id,quantity] of copies(owned)){
    const c=catalog?.[id];if(!c)continue;
    const used=deck.filter(x=>x===id).length,offer=recycleOffer(p,id,catalog);
    result.push({id,name:c.name,level:c.level,role:c.role,
     fusion,quantity,used,spare:Math.max(0,quantity-used),
     enhancement:Number(p.enhancements?.[id]||0),
     recyclable:!!offer,protected:!!c.lv1Exclusive||!!c.essenceMonster});
   }
  }
  return result.sort((a,b)=>b.level-a.level||a.fusion-b.fusion||
   a.name.localeCompare(b.name,'de')||a.id-b.id);
 }

 return Object.freeze({version:'17.3',PACKS,RESEARCH,
  maxChapter,maxCardLevel,available,researchRank,researchOffer,packDraw,
  ENHANCEMENT_MAX,enhanceOffer,recycleOffer,collectionRows});
});
