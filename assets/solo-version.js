/* Arcane Duel singleplayer: visible release metadata, separate from save schema. */
'use strict';
(()=>{
 const version=document.querySelector('meta[name="arcane-duel-version"]')?.content||'';
 if(!/^v?\d+\.\d+\.\d+(?:-(?:dev|rc)\.\d+)?$/.test(version))return;
 const full='v'+version.replace(/^v/,'');
 const labels=['arcaneSoloVersionTitle','arcaneSoloVersionSettings','arcaneSoloVersionHeader'];
 for(const id of labels){
  const node=document.getElementById(id);
  if(node){node.textContent='Singleplayer '+full;node.title='Arcane Duel · '+full;}
 }
 document.documentElement.dataset.arcaneDuelVersion=version;
 document.title='ARCANE DUEL · '+full+' · Das Vergoldete Archiv';
 window.ArcaneDuelRelease=Object.freeze({
  version,mode:'singleplayer',
  channel:version.includes('-dev.')?'development':version.includes('-rc.')?'candidate':'stable'
 });
})();
