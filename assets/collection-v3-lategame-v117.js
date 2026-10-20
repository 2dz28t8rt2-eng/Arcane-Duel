/* Collection companion for effect-free late-game cards v11.7. */
'use strict';
(()=>{
 const entries=[{"name":"Pyrokarx, Aschenkralle","level":7,"desc":"Eine gewaltige Feuerbestie mit sengenden Schwingen und obsidianharten Klauen.","kind":"lion","element":"FEUER","art":"assets/custom-art/lategame-v117/pyrokarx-aschenkralle.webp"},{"name":"Nyssara, Spiegelkönigin","level":8,"desc":"Eine uralte Königin, die verborgene Seelen hinter geborstenen Spiegeln bewacht.","kind":"spirit","element":"DUNKEL","art":"assets/custom-art/lategame-v117/nyssara-spiegelkoenigin.webp"},{"name":"Varkor, Sturmzunge","level":8,"desc":"Ein sturmgeborener Basilisk mit blitzdurchzogenen Schuppen.","kind":"serpent","element":"WIND","art":"assets/custom-art/lategame-v117/varkor-sturmzunge.webp"},{"name":"Kael'Rath, Runenfürst des Zeniths","level":9,"desc":"Ein Runenfürst, dessen Monolithen die Kräfte der Elemente bündeln.","kind":"dragon","element":"LICHT","art":"assets/custom-art/lategame-v117/kaelrath-runenfuerst.webp"},{"name":"Thalmyr, Kathedralen-Leviathan","level":9,"desc":"Ein uraltes Seewesen, das die Mauern versunkener Tempel umschlingt.","kind":"serpent","element":"WASSER","art":"assets/custom-art/lategame-v117/thalmyr-leviathan.webp"},{"name":"Cerberon, Blutmondwacht","level":8,"desc":"Dreiköpfiger Hüter des Blutmondtors, gekettet an eine vergessene Festung.","kind":"wolf","element":"FEUER","art":"assets/custom-art/lategame-v117/cerberon-blutmondwacht.webp"},{"name":"Gravomor, Kettenkoloss","level":10,"desc":"Ein Koloss aus unzerbrechlichen Ruinenplatten, zusammengehalten von uralten Ketten.","kind":"golem","element":"ERDE","art":"assets/custom-art/lategame-v117/gravomor-kettenkoloss.webp"},{"name":"Orphaziel, Richter der Leere","level":9,"desc":"Ein Richter der Leere, umgeben von endlosen Ketten und heimatlosen Seelen.","kind":"spirit","element":"DUNKEL","art":"assets/custom-art/lategame-v117/orphaziel-richter.webp"},{"name":"Asterion, Seraph des Sternenbruchs","level":10,"desc":"Ein sternengeborener Seraphendrache mit zerrissenen Himmelsringen.","kind":"dragon","element":"LICHT","art":"assets/custom-art/lategame-v117/asterion-seraph.webp"},{"name":"Xarzul, Kaiser der Finsternis","level":10,"desc":"Der geflügelte Kaiser der Finsternis trägt die Glut einer schwarzen Sonne im Herzen.","kind":"dragon","element":"DUNKEL","art":"assets/custom-art/lategame-v117/xarzul-kaiser.webp"}];
 // Mirror the in-game installation gate. The gallery must never show missing art.
 const ARTWORKS_COMPLETE=true;
 if(!ARTWORKS_COMPLETE){
  window.ArcaneCollectionLateGameV117=Object.freeze({count:0,plannedCount:entries.length,status:'awaiting-original-art'});
  return;
 }
 const collection=window.ARCANE_COLLECTION_V3,first=732;
 if(!Array.isArray(collection)||collection.some(c=>c.id>=first))
  throw Error('LateGame 11.7 collection IDs conflict');
 entries.forEach((s,i)=>{
  const c={id:first+i,name:s.name,desc:s.desc,level:s.level,kind:s.kind,
   element:s.element,fusion:false,manifestOf:null,variantOf:null,art:s.art};
  collection.push(c);
  if(typeof Image==='function'){
   const img=new Image();
   img.onload=()=>{c.art=s.art;window.dispatchEvent(new Event('arcane-lategame-art-ready'));};
   img.onerror=()=>{};
   img.src=s.art;
  }
 });
 window.ArcaneCollectionLateGameV117=Object.freeze({firstId:first,count:entries.length});
})();
