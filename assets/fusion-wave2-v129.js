/* Fusion Wave II v12.9 – visually approved art, no fixed fusion roles.
 * Manifest registered only AFTER the original WebP files are installed.
 */
'use strict';
(()=>{
 const specs=[{"id":742,"slug":"runensphinx-der-schwelle","name":"Runensphinx der Schwelle","level":3,"element":"LICHT","kind":"lion","source":1,"requiredTier":1,"art":"assets/custom-art/fusion-wave2-v129/runensphinx-der-schwelle.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":743,"slug":"glimmermaul-hydraling","name":"Glimmermaul-Hydraling","level":3,"element":"WASSER","kind":"serpent","source":1,"requiredTier":1,"art":"assets/custom-art/fusion-wave2-v129/glimmermaul-hydraling.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":744,"slug":"nebelklaue-chimaere","name":"Nebelklaue-Chimäre","level":4,"element":"DUNKEL","kind":"wolf","source":2,"requiredTier":2,"art":"assets/custom-art/fusion-wave2-v129/nebelklaue-chimaere.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":745,"slug":"splitterbastion","name":"Splitterbastion","level":4,"element":"ERDE","kind":"golem","source":2,"requiredTier":2,"art":"assets/custom-art/fusion-wave2-v129/splitterbastion.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":746,"slug":"brandfeder-moloch","name":"Brandfeder-Moloch","level":5,"element":"FEUER","kind":"lion","source":3,"requiredTier":3,"art":"assets/custom-art/fusion-wave2-v129/brandfeder-moloch.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":747,"slug":"dornenwyvern-ebonhain","name":"Dornenwyvern von Ebonhain","level":5,"element":"ERDE","kind":"dragon","source":3,"requiredTier":3,"art":"assets/custom-art/fusion-wave2-v129/dornenwyvern-ebonhain.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":748,"slug":"mondspiegel-seraph","name":"Mondspiegel-Seraph","level":6,"element":"LICHT","kind":"dragon","source":4,"requiredTier":4,"art":"assets/custom-art/fusion-wave2-v129/mondspiegel-seraph.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":749,"slug":"abyssaler-glockenrochen","name":"Abyssaler Glockenrochen","level":6,"element":"WASSER","kind":"serpent","source":4,"requiredTier":4,"art":"assets/custom-art/fusion-wave2-v129/abyssaler-glockenrochen.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":750,"slug":"chronoluchs-der-ruinen","name":"Chronoluchs der Ruinen","level":7,"element":"WIND","kind":"wolf","source":5,"requiredTier":5,"art":"assets/custom-art/fusion-wave2-v129/chronoluchs-der-ruinen.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."},{"id":751,"slug":"kathedralen-manticor","name":"Kathedralen-Manticor","level":8,"element":"LICHT","kind":"lion","source":6,"requiredTier":6,"art":"assets/custom-art/fusion-wave2-v129/kathedralen-manticor.webp","rarity":"rare","fusionOnly":true,"role":null,"desc":"Fusionsvorlage ohne festen Rollentag. Die Rolle der beschworenen Fusion ergibt sich ausschließlich aus den Materialien."}];
 const ARTWORKS_COMPLETE=true;
 if(!ARTWORKS_COMPLETE){
  window.ArcaneFusionWaveV129=Object.freeze({status:'awaiting-artwork-upload',
   installed:0,plannedCount:specs.length,artworksInstalled:false,
   specifications:Object.freeze(specs)});
  return;
 }
 const START_ID=742;
 if(CARDS.length!==START_ID||typeof FUSION_POWER==='undefined'||!Array.isArray(RPG_FUSIONS))
  throw Error('Fusion Wave v129: incompatible catalogue or unavailable fusion budget');
 if(specs.length!==10||!specs.every((x,i)=>x.id===START_ID+i))
  throw Error('Fusion Wave v129: invalid stable card IDs');
 const round10=n=>Math.round(n/10)*10,ids=[];
 for(let i=0;i<specs.length;i++){
  const s=specs[i];
  if(!RPG_OPPONENTS[s.source]||!UPDATE_B_LOOT[s.source])
   throw Error('Fusion Wave v129: missing loot source '+s.source);
  // These are BLUEPRINT midpoints, not final fusion stats. The current fusion
  // rules apply materials, quality, levels, the dynamic stamp, and real rolls.
  // The original fusion chart intentionally jumps from LV2 to LV4.
  // Interpolate the missing LV3 midpoint without changing any existing level.
  const midpoint=FUSION_POWER[s.level]??(s.level===3?Math.round((FUSION_POWER[2]+FUSION_POWER[4])/20)*10:0);
  if(!(midpoint>0))throw Error('Fusion Wave v129: missing level '+s.level);
  const atk=round10(midpoint*(.91+((i%3)-1)*.035));
  const def=round10(midpoint*(.91-((i%3)-1)*.035));
  const id=addRpgCard({name:s.name,level:s.level,element:s.element,kind:s.kind,
   source:s.source,requiredTier:s.requiredTier,art:s.art,customArt:s.art,
   atk,def,rarity:'rare',fusionOnly:true,rpg:true,retired:false,ace:false,
   workshopOnly:false,milestoneOnly:false,trainingReward:false,enemyOnly:false,
   ability:undefined,effectText:'',desc:s.desc,artWave:'fusion-v129'});
  if(id!==s.id)throw Error('Fusion Wave v129: card ID drift: '+id+' != '+s.id);
  const card=CARDS[id];delete card.role;delete card.roleStyle;card.fusionRoleFree=true;
  RPG_FUSIONS.push(card);UPDATE_B_SET.add(id);UPDATE_B_ACTIVE_IDS.push(id);
  RPG_OPPONENTS[s.source].loot.push(id);
  UPDATE_B_LOOT[s.source].easy.push(id);UPDATE_B_LOOT[s.source].hard.push(id);
  ids.push(id);
 }
 UPDATE_B_FUSION_IDS=Object.freeze([...UPDATE_B_FUSION_IDS,...ids]);
 window.ArcaneFusionWaveV129=Object.freeze({status:'active',installed:ids.length,
  ids:Object.freeze(ids),artworksInstalled:true,roleSource:'materials-only'});
})();
