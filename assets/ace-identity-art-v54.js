/* Arcane Duel 5.4 — faithful ACE portraits instead of procedural ACE emblems.
 * Every purchasable ACE is the very same creature as its tournament owner's
 * original signature. Reuse THAT creature's curated illustration, not a
 * generic generated SVG. No card names/IDs/stats/rules are changed.
 */
'use strict';
(()=>{
 const approvedPortraits=Object.freeze({
  1:'assets/custom-art/generated-4-1/monster-0314.webp', // Argentum-Koloss
  2:'assets/custom-art/generated-4-1/monster-0315.webp', // Phönix Myrra
  3:'assets/custom-art/generated-4-1/monster-0316.webp', // Sylvan
  4:'assets/custom-art/wave6-03.webp', // Mondsturm-Leviathan
  5:'assets/custom-art/generated-4-1/monster-0318.webp', // Aschewyrm Rakh
  6:'assets/custom-art/generated-4-1/monster-0319.webp', // Nox-Albtraum
  7:'assets/custom-art/generated-4-1/monster-0320.webp', // Himmelskrone
  10:'assets/artworks/wave01/aetherwyrm.webp' // Ätherwyrm der Kronen
 });
 const improvements=[],unresolved=[];
 for(const npc of RPG_OPPONENTS.slice(1)){
  const ace=CARDS[ACE_CARD_IDS[npc.id]],signature=CARDS[npc.originalSignature];
  if(!ace||!signature){unresolved.push({tier:npc.id,reason:'missing card'});continue;}
  // Prefer the final live signature portrait; older customArt can point to an obsolete wave.
  const image=approvedPortraits[npc.id]||signature.art||signature.customArt;
  if(typeof image!=='string'||!/^assets\/[\w/.-]+\.(?:webp|png|jpe?g)$/i.test(image)){
   unresolved.push({tier:npc.id,name:ace.name,source:npc.originalSignature,reason:'no approved raster illustration'});
   continue;
  }
  ace.art=image;ace.customArt=image;ace.artWave='ace-signature';
  ace.artIdentitySourceId=signature.id;
  improvements.push({tier:npc.id,id:ace.id,name:ace.name,art:image,signatureId:signature.id});
 }
 window.ArcaneAceArt54=Object.freeze({version:'5.4',improvements,unresolved});
 if(unresolved.length)console.warn('ACE portrait audit: missing curated original signature art',unresolved);
})();