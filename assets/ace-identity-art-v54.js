/* Arcane Duel 5.4 — faithful ACE portraits instead of procedural ACE emblems.
 * Every purchasable ACE is the very same creature as its tournament owner's
 * original signature. Reuse THAT creature's curated illustration, not a
 * generic generated SVG. No card names/IDs/stats/rules are changed.
 */
'use strict';
(()=>{
 const improvements=[],unresolved=[];
 for(const npc of RPG_OPPONENTS.slice(1)){
  const ace=CARDS[ACE_CARD_IDS[npc.id]],signature=CARDS[npc.originalSignature];
  if(!ace||!signature){unresolved.push({tier:npc.id,reason:'missing card'});continue;}
  const image=signature.customArt||signature.art;
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