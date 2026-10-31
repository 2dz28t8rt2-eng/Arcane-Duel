/* Arcane Duel singleplayer: visible release metadata, separate from save schema. */
'use strict';
(()=>{
 const version=document.querySelector('meta[name="arcane-duel-version"]')?.content||'';
 if(!/^v?\d+\.\d+\.\d+(?:-(?:dev|rc)\.\d+)?$/.test(version))return;
 const full=version.replace(/^v/,'');
 const labels=['arcaneSoloVersionTitle','arcaneSoloVersionSettings','arcaneSoloVersionHeader'];
 document.querySelectorAll('[data-arcane-version]').forEach(node=>{node.textContent=full;});
 for(const id of labels){
  const node=document.getElementById(id);
  if(node){node.textContent='Arcane Duel '+full;node.title='Arcane Duel · '+full;}
 }
 document.documentElement.dataset.arcaneDuelVersion=version;
 document.title='ARCANE DUEL · '+full;
 window.ArcaneDuelRelease=Object.freeze({
  version:full,mode:'all',
  channel:version.includes('-dev.')?'development':version.includes('-rc.')?'candidate':'stable'
 });
})();
