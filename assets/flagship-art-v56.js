/* Arcane Duel v5.6 original portrait integration.
 * Never create new card IDs or override combat values in this file.
 * The same original ACE portrait must be used in the live battle and collection.
 */
'use strict';
(()=>{
 const records=Object.freeze([
  {id:322,name:'Leerenorakel',path:'assets/custom-art/flagship/leerenorakel.webp'},
  {id:695,name:'Runengeist der Schwelle',path:'assets/custom-art/flagship/runengeist-der-schwelle.webp'}
 ]);
 const installed=[];
 for(const row of records){
  const card=CARDS[row.id];
  if(!card||card.name!==row.name||!card.fusionOnly)
   throw Error('Artwork-Identität passt nicht zu bestehender Fusions-ID '+row.id);
  card.art=row.path;
  card.customArt=row.path;
  card.artWave='flagship-5.6';
  installed.push({id:row.id,name:row.name,path:row.path});
 }
 window.ArcaneFlagshipArt56=Object.freeze({version:'5.6',installed});
})();