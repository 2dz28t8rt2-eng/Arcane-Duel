/* Arcane-Duel Fusion Wave III v1.30: 10 normal fusion blueprints.
 * All ten original illustrations are required before cards become selectable.
 * Blueprints have NO role; summoned instances inherit role from material stamps.
 * Existing card IDs, special Lv1 fusions, and balance rules stay unchanged.
 */
'use strict';
(()=>{
 const specs=[{"id":752,"name":"Kristallwyvern im Ruinenkathedralenlicht","level":2,"slug":"kristallwyvern-im-ruinenkathedralenlicht","element":"WASSER","kind":"dragon","source":1,"requiredTier":1,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/kristallwyvern-im-ruinenkathedralenlicht.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":753,"name":"Violettes Chimärenbiest in Ruinen","level":2,"slug":"violettes-chimaerenbiest-in-ruinen","element":"DUNKEL","kind":"wolf","source":1,"requiredTier":1,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/violettes-chimaerenbiest-in-ruinen.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":754,"name":"Runenbasilisk im Kathedralengarten","level":2,"slug":"runenbasilisk-im-kathedralengarten","element":"ERDE","kind":"serpent","source":1,"requiredTier":1,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/runenbasilisk-im-kathedralengarten.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":755,"name":"Dreiköpfiger Sturmwolf im Ruinenheiligtum","level":3,"slug":"dreikoepfiger-sturmwolf-im-ruinenheiligtum","element":"WIND","kind":"wolf","source":1,"requiredTier":1,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/dreikoepfiger-sturmwolf-im-ruinenheiligtum.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":756,"name":"Kosmischer Kristallkoloss im Mondlicht","level":3,"slug":"kosmischer-kristallkoloss-im-mondlicht","element":"LICHT","kind":"golem","source":1,"requiredTier":1,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/kosmischer-kristallkoloss-im-mondlicht.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":757,"name":"Kathedralenhydra im Himmelsheiligtum","level":3,"slug":"kathedralenhydra-im-himmelsheiligtum","element":"WASSER","kind":"serpent","source":1,"requiredTier":1,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/kathedralenhydra-im-himmelsheiligtum.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":758,"name":"Himmlischer Zeitdrache über den Ruinen","level":5,"slug":"himmlischer-zeitdrache-ueber-den-ruinen","element":"LICHT","kind":"dragon","source":3,"requiredTier":3,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/himmlischer-zeitdrache-ueber-den-ruinen.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":759,"name":"Infernaler Mantikor im Ruinenhimmel","level":5,"slug":"infernaler-mantikor-im-ruinenhimmel","element":"FEUER","kind":"lion","source":3,"requiredTier":3,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/infernaler-mantikor-im-ruinenhimmel.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":760,"name":"Vulkanischer Löwenkönig im Ruinensturm","level":7,"slug":"vulkanischer-loewenkoenig-im-ruinensturm","element":"FEUER","kind":"lion","source":5,"requiredTier":5,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/vulkanischer-loewenkoenig-im-ruinensturm.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."},{"id":761,"name":"Kosmischer Dornenkoloss im Eclipse-Tempel","level":7,"slug":"kosmischer-dornenkoloss-im-eclipse-tempel","element":"DUNKEL","kind":"golem","source":5,"requiredTier":5,"rarity":"rare","fusionOnly":true,"role":null,"art":"assets/custom-art/fusion-wave3-v130/kosmischer-dornenkoloss-im-eclipse-tempel.webp","desc":"Reguläre Fusionsvorlage ohne festen Rollentag. Die tatsächliche Rolle wird ausschließlich aus ihren Fusionsmaterialien bestimmt."}];
 const ARTWORKS_COMPLETE=true;
 if(!ARTWORKS_COMPLETE){
  window.ArcaneFusionWaveV130=Object.freeze({
   status:'awaiting-artwork-upload',installed:0,
   plannedCount:specs.length,artworksInstalled:false,
   roleSource:'materials-only',specifications:Object.freeze(specs)});
  return;
 }
 const FIRST_ID=752;
 if(!Array.isArray(CARDS)||CARDS.length!==FIRST_ID
  ||!Array.isArray(RPG_FUSIONS)||typeof addRpgCard!=='function'
  ||typeof FUSION_POWER==='undefined')
  throw Error('Fusion Wave v130: base catalogue changed or fusion budget unavailable');
 if(specs.length!==10||specs.some((s,i)=>s.id!==FIRST_ID+i||
  !s.art.startsWith('assets/custom-art/fusion-wave3-v130/')))
  throw Error('Fusion Wave v130: unexpected manifest IDs or artwork paths');
 const round10=n=>Math.round(n/10)*10;
 const ids=[];
 for(let i=0;i<specs.length;i++){
  const s=specs[i];
  if(!RPG_OPPONENTS[s.source]||!UPDATE_B_LOOT[s.source])
   throw Error('Fusion Wave v130: missing opponent loot source '+s.source);
  // Standard blueprint budget, matching fusion wave v129. The existing game
  // table has no LV3 value, so use the already-established LV2/LV4 midpoint.
  const midpoint=FUSION_POWER[s.level]??(s.level===3?round10((FUSION_POWER[2]+FUSION_POWER[4])/2):0);
  if(!(midpoint>0))throw Error('Fusion Wave v130: missing level budget '+s.level);
  const bias=((i%3)-1)*.035;
  const atk=round10(midpoint*(.91+bias));
  const def=round10(midpoint*(.91-bias));
  const id=addRpgCard({
   name:s.name,level:s.level,kind:s.kind,element:s.element,
   source:s.source,requiredTier:s.requiredTier,
   art:s.art,customArt:s.art,
   atk,def,rarity:'rare',fusionOnly:true,rpg:true,retired:false,
   ace:false,workshopOnly:false,milestoneOnly:false,
   trainingReward:false,enemyOnly:false,
   ability:undefined,effectText:'',desc:s.desc,artWave:'fusion-v130'
  });
  if(id!==s.id)throw Error('Fusion Wave v130: card ID drift '+id+' != '+s.id);
  const c=CARDS[id];delete c.role;delete c.roleStyle;c.fusionRoleFree=true;
  RPG_FUSIONS.push(c);UPDATE_B_SET.add(id);UPDATE_B_ACTIVE_IDS.push(id);
  RPG_OPPONENTS[s.source].loot.push(id);
  UPDATE_B_LOOT[s.source].easy.push(id);
  UPDATE_B_LOOT[s.source].hard.push(id);
  ids.push(id);
 }
 UPDATE_B_FUSION_IDS=Object.freeze([...UPDATE_B_FUSION_IDS,...ids]);
 window.ArcaneFusionWaveV130=Object.freeze({
  status:'active',installed:ids.length,
  ids:Object.freeze(ids),artworksInstalled:true,roleSource:'materials-only',
  audit:()=>ids.map(id=>{const c=CARDS[id];return {
   id,level:c.level,name:c.name,atk:c.atk,def:c.def,
   role:c.role??null,art:c.art,
   inFusionPool:RPG_FUSIONS.some(f=>f.id===id),
   inLoot:RPG_OPPONENTS[c.source].loot.includes(id),
   inBooster:UPDATE_B_FUSION_IDS.includes(id)
  };})
 });
})();
