/* Arcane Duel v11.7: ten normal endgame monsters, no custom card effects.
 * Stats: the existing ArcaneLevelBudget, never text baked into art.
 */
'use strict';
(()=>{
 const specs=[{"slug":"pyrokarx-aschenkralle","name":"Pyrokarx, Aschenkralle","level":7,"role":"predator","element":"FEUER","kind":"lion","color":"#ed6a35","source":5,"requiredTier":5,"desc":"Eine gewaltige Feuerbestie mit sengenden Schwingen und obsidianharten Klauen.","art":"assets/custom-art/lategame-v117/pyrokarx-aschenkralle.webp"},{"slug":"nyssara-spiegelkoenigin","name":"Nyssara, Spiegelkönigin","level":8,"role":"soul","element":"DUNKEL","kind":"spirit","color":"#a991d8","source":6,"requiredTier":6,"desc":"Eine uralte Königin, die verborgene Seelen hinter geborstenen Spiegeln bewacht.","art":"assets/custom-art/lategame-v117/nyssara-spiegelkoenigin.webp"},{"slug":"varkor-sturmzunge","name":"Varkor, Sturmzunge","level":8,"role":"predator","element":"WIND","kind":"serpent","color":"#71bcf1","source":6,"requiredTier":6,"desc":"Ein sturmgeborener Basilisk mit blitzdurchzogenen Schuppen.","art":"assets/custom-art/lategame-v117/varkor-sturmzunge.webp"},{"slug":"kaelrath-runenfuerst","name":"Kael'Rath, Runenfürst des Zeniths","level":9,"role":"combatant","element":"LICHT","kind":"dragon","color":"#dcb97b","source":7,"requiredTier":7,"desc":"Ein Runenfürst, dessen Monolithen die Kräfte der Elemente bündeln.","art":"assets/custom-art/lategame-v117/kaelrath-runenfuerst.webp"},{"slug":"thalmyr-leviathan","name":"Thalmyr, Kathedralen-Leviathan","level":9,"role":"guardian","element":"WASSER","kind":"serpent","color":"#71c4dd","source":7,"requiredTier":7,"desc":"Ein uraltes Seewesen, das die Mauern versunkener Tempel umschlingt.","art":"assets/custom-art/lategame-v117/thalmyr-leviathan.webp"},{"slug":"cerberon-blutmondwacht","name":"Cerberon, Blutmondwacht","level":8,"role":"guardian","element":"FEUER","kind":"wolf","color":"#bb5364","source":7,"requiredTier":7,"desc":"Dreiköpfiger Hüter des Blutmondtors, gekettet an eine vergessene Festung.","art":"assets/custom-art/lategame-v117/cerberon-blutmondwacht.webp"},{"slug":"gravomor-kettenkoloss","name":"Gravomor, Kettenkoloss","level":10,"role":"guardian","element":"ERDE","kind":"golem","color":"#d3a269","source":8,"requiredTier":8,"desc":"Ein Koloss aus unzerbrechlichen Ruinenplatten, zusammengehalten von uralten Ketten.","art":"assets/custom-art/lategame-v117/gravomor-kettenkoloss.webp"},{"slug":"orphaziel-richter","name":"Orphaziel, Richter der Leere","level":9,"role":"soul","element":"DUNKEL","kind":"spirit","color":"#ab8ac6","source":7,"requiredTier":7,"desc":"Ein Richter der Leere, umgeben von endlosen Ketten und heimatlosen Seelen.","art":"assets/custom-art/lategame-v117/orphaziel-richter.webp"},{"slug":"asterion-seraph","name":"Asterion, Seraph des Sternenbruchs","level":10,"role":"combatant","element":"LICHT","kind":"dragon","color":"#e6d9ba","source":8,"requiredTier":8,"desc":"Ein sternengeborener Seraphendrache mit zerrissenen Himmelsringen.","art":"assets/custom-art/lategame-v117/asterion-seraph.webp"},{"slug":"xarzul-kaiser","name":"Xarzul, Kaiser der Finsternis","level":10,"role":"combatant","element":"DUNKEL","kind":"dragon","color":"#d18365","source":9,"requiredTier":9,"desc":"Der geflügelte Kaiser der Finsternis trägt die Glut einer schwarzen Sonne im Herzen.","art":"assets/custom-art/lategame-v117/xarzul-kaiser.webp"}];
 // Do not expose cards before all ten original artwork binaries are committed.
 // Once the approved files are uploaded, change this flag to true.
 const ARTWORKS_COMPLETE=true;
 if(!ARTWORKS_COMPLETE){
  window.ArcaneLateGameV117=Object.freeze({version:'11.7.0',status:'awaiting-original-art',
   count:0,plannedCount:specs.length,artworksInstalled:false,
   proposed:Object.freeze(specs)});
  return;
 }
 const FIRST_ID=732;
 if(!window.ArcaneLevelBudget||typeof addRpgCard!=='function'||!Array.isArray(CARDS)||CARDS.length!==FIRST_ID)
  throw Error('LateGame 11.7: unexpected card catalog, missing level budget, or changed IDs');
 const rule=window.ArcaneLevelBudget,round10=n=>Math.round(n/10)*10;
 const roster=[];
 for(const s of specs){
  if(!RPG_OPPONENTS[s.source]||!UPDATE_B_LOOT[s.source])throw Error('Invalid endgame loot source: '+s.name);
  // 'combatant' activates the actual Allrounder system; 'resonator'
  // is a fusion-instance tag and must not be put on ordinary monster cards.
  const total=round10(rule.budget(s.level)*rule.rarityFactor({rarity:'common'}));
  const atk=Math.max(50,round10(total*(rule.shares[s.role]??.5))),def=Math.max(50,total-atk);
  const id=addRpgCard({name:s.name,level:s.level,role:s.role,element:s.element,
   kind:s.kind,color:s.color,source:s.source,requiredTier:s.requiredTier,
   atk,def,rarity:'common',rpg:true,retired:false,fusionOnly:false,ace:false,
   workshopOnly:false,milestoneOnly:false,essenceMonster:false,trainingReward:false,
   ability:undefined,effectText:'',desc:s.desc});
  const c=CARDS[id];c.artWave='11.7';
  c.art=s.art;
  c.customArt=c.art;
  RPG_BASE_CARDS.push(c);UPDATE_B_SET.add(id);
  UPDATE_B_MAIN_IDS.push(id);UPDATE_B_ACTIVE_IDS.push(id);
  RPG_OPPONENTS[s.source].loot.push(id);
  UPDATE_B_LOOT[s.source].easy.push(id);UPDATE_B_LOOT[s.source].hard.push(id);
  roster.push({id,name:s.name,level:s.level,role:s.role,atk,def,art:s.art});
 }
 window.ArcaneLateGameV117=Object.freeze({version:'11.7.0',count:roster.length,
  ids:Object.freeze(roster.map(c=>c.id)),roster:Object.freeze(roster),
  artworksInstalled:true,
  audit:()=>roster.map(r=>{const c=CARDS[r.id];return {...r,atk:c.atk,def:c.def,
   effectFree:c.ability==null&&!c.effectText,activeArt:c.art};})});
})();
