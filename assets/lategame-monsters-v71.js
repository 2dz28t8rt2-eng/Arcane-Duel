/* Arcane Duel – 16 new NORMAL endgame monsters, v7.1.
 * Stable IDs 716–731. Loaded after all existing catalogue scripts.
 * Role effects reuse existing battle mechanics; no invented active abilities.
 * Art uses procedural fallback until the approved ZIP is imported.
 */
'use strict';
(()=>{
 const ARTWORK_INSTALLED=false; // AUTO-ENABLED by verified artwork-import workflow
 const EXPECTED_FIRST_ID=716;
 if(CARDS.length!==EXPECTED_FIRST_ID)
  throw Error('LateGame v7.1: Karten-ID-Konflikt – bestehender Katalog hat '+CARDS.length+' Karten statt 716.');
 const specs=[
  {
    "id": 716,
    "name": "Vulkanbestie des Sturmruinenlands",
    "level": 7,
    "role": "predator",
    "atk": 960,
    "def": 310,
    "element": "FEUER",
    "kind": "golem",
    "color": "#ec8d5e",
    "source": 5,
    "requiredTier": 5,
    "desc": "Die uralte Vulkanbestie jagt durch Asche und zerborstene Tempel. Ihr Predator-Fokus verstärkt Angriff und Jagdinstinkt.",
    "effectText": "Jagdinstinkt · Predator-Angriffsrolle",
    "art": "assets/custom-art/lategame-v71/late-01.webp"
  },
  {
    "id": 717,
    "name": "Runenwächter der gefallenen Feste",
    "level": 7,
    "role": "guardian",
    "atk": 320,
    "def": 950,
    "element": "ERDE",
    "kind": "knight",
    "color": "#a1afc9",
    "source": 5,
    "requiredTier": 5,
    "desc": "Runen versiegeln seinen schweren Panzer. Als Wächter schützt er die Linie und profitiert vom Schildwall.",
    "effectText": "Schildwall · Wächter-Verteidigungsrolle",
    "art": "assets/custom-art/lategame-v71/late-02.webp"
  },
  {
    "id": 718,
    "name": "Gruftwächter der verlorenen Seelen",
    "level": 7,
    "role": "soul",
    "atk": 280,
    "def": 990,
    "element": "DUNKEL",
    "kind": "spirit",
    "color": "#9c8ac8",
    "source": 5,
    "requiredTier": 5,
    "desc": "Aus den Hallen der Gruft zieht er verbliebene Essenz. Als Seelenzehrer nutzt er die vorhandene DEF- und Seelenentzug-Mechanik.",
    "effectText": "Seelenentzug · Seelenzehrer in Verteidigungsposition",
    "art": "assets/custom-art/lategame-v71/late-03.webp"
  },
  {
    "id": 719,
    "name": "Prismenchimäre des Kristalltempels",
    "level": 7,
    "role": "allrounder",
    "atk": 670,
    "def": 600,
    "element": "LICHT",
    "kind": "dragon",
    "color": "#d7b0ec",
    "source": 5,
    "requiredTier": 5,
    "desc": "Zahlreiche Facetten spiegeln gegnerische Taktiken. Ein Allrounder für ausgewogene Werte und Resonanz-Synergien.",
    "effectText": "Resonanz · Allrounder-Rolle",
    "art": "assets/custom-art/lategame-v71/late-04.webp"
  },
  {
    "id": 720,
    "name": "Blitzwyvern der Himmelsruinen",
    "level": 7,
    "role": "predator",
    "atk": 980,
    "def": 290,
    "element": "WIND",
    "kind": "dragon",
    "color": "#95c6ed",
    "source": 6,
    "requiredTier": 6,
    "desc": "Zwischen zerbrochenen Himmelsbrücken stürzt er sich auf seine Beute. Predator: hoher Angriff, geringe Verteidigung.",
    "effectText": "Jagdinstinkt · Predator-Angriffsrolle",
    "art": "assets/custom-art/lategame-v71/late-05.webp"
  },
  {
    "id": 721,
    "name": "Eisenwurzel-Koloss",
    "level": 7,
    "role": "guardian",
    "atk": 350,
    "def": 920,
    "element": "ERDE",
    "kind": "golem",
    "color": "#93b59b",
    "source": 6,
    "requiredTier": 6,
    "desc": "Seine Wurzeln greifen tief in uralte Mauern. Wächter: standhafte Verteidigung und Schildwall-Synergie.",
    "effectText": "Schildwall · Wächter-Verteidigungsrolle",
    "art": "assets/custom-art/lategame-v71/late-06.webp"
  },
  {
    "id": 722,
    "name": "Mottenfürst des Mondschleiers",
    "level": 8,
    "role": "soul",
    "atk": 340,
    "def": 1190,
    "element": "DUNKEL",
    "kind": "insect",
    "color": "#aa9bd4",
    "source": 6,
    "requiredTier": 6,
    "desc": "Er lockt verlorene Seelen mit gespenstischem Mondlicht. Seelenzehrer mit starker DEF-Basis.",
    "effectText": "Seelenentzug · Seelenzehrer in Verteidigungsposition",
    "art": "assets/custom-art/lategame-v71/late-07.webp"
  },
  {
    "id": 723,
    "name": "Basaltbasilisk des Lavakessels",
    "level": 8,
    "role": "predator",
    "atk": 1150,
    "def": 380,
    "element": "FEUER",
    "kind": "serpent",
    "color": "#e28b62",
    "source": 6,
    "requiredTier": 6,
    "desc": "In seinem Blick erstarren die alten Lavaruinen. Predator mit schwerem Angriff und entsprechendem Risiko.",
    "effectText": "Jagdinstinkt · Predator-Angriffsrolle",
    "art": "assets/custom-art/lategame-v71/late-08.webp"
  },
  {
    "id": 724,
    "name": "Kathedralen-Leviathan",
    "level": 8,
    "role": "guardian",
    "atk": 390,
    "def": 1140,
    "element": "WASSER",
    "kind": "serpent",
    "color": "#89c4d9",
    "source": 7,
    "requiredTier": 7,
    "desc": "Er umschließt den versunkenen Himmelstempel wie eine Festungsmauer. Wächter mit hoher Verteidigung.",
    "effectText": "Schildwall · Wächter-Verteidigungsrolle",
    "art": "assets/custom-art/lategame-v71/late-09.webp"
  },
  {
    "id": 725,
    "name": "Chimäre des kosmischen Sturms",
    "level": 8,
    "role": "allrounder",
    "atk": 790,
    "def": 740,
    "element": "LICHT",
    "kind": "dragon",
    "color": "#d9abec",
    "source": 7,
    "requiredTier": 7,
    "desc": "Drei Wesenheiten teilen sich einen Körper. Allrounder: flexibel für gemischte Fusionen und Resonanz.",
    "effectText": "Resonanz · Allrounder-Rolle",
    "art": "assets/custom-art/lategame-v71/late-10.webp"
  },
  {
    "id": 726,
    "name": "Sphinxwächter des Mondlichts",
    "level": 8,
    "role": "guardian",
    "atk": 420,
    "def": 1110,
    "element": "LICHT",
    "kind": "golem",
    "color": "#d2c9a7",
    "source": 7,
    "requiredTier": 7,
    "desc": "Der Hüter der Mondarchive lässt keine Eindringlinge passieren. Seine Stärke liegt in der DEF und im Schildwall.",
    "effectText": "Schildwall · Wächter-Verteidigungsrolle",
    "art": "assets/custom-art/lategame-v71/late-11.webp"
  },
  {
    "id": 727,
    "name": "Obsidian-Drache der Lavaruinen",
    "level": 9,
    "role": "predator",
    "atk": 1390,
    "def": 440,
    "element": "FEUER",
    "kind": "dragon",
    "color": "#d97862",
    "source": 7,
    "requiredTier": 7,
    "desc": "In seinen schwarzen Schuppen glüht das Herz des Vulkans. Predator: gefährlich beim Angriff, verwundbarer in DEF.",
    "effectText": "Jagdinstinkt · Predator-Angriffsrolle",
    "art": "assets/custom-art/lategame-v71/late-12.webp"
  },
  {
    "id": 728,
    "name": "Astraler Labyrinth-Minotaurus",
    "level": 9,
    "role": "allrounder",
    "atk": 970,
    "def": 860,
    "element": "DUNKEL",
    "kind": "golem",
    "color": "#b3a0d6",
    "source": 8,
    "requiredTier": 8,
    "desc": "Er erkennt Wege zwischen den Sternbildern. Allrounder: ausgeglichene Werte und Resonanz-Potenzial.",
    "effectText": "Resonanz · Allrounder-Rolle",
    "art": "assets/custom-art/lategame-v71/late-13.webp"
  },
  {
    "id": 729,
    "name": "Donnergreif des Himmelsbruchs",
    "level": 9,
    "role": "predator",
    "atk": 1340,
    "def": 490,
    "element": "WIND",
    "kind": "bird",
    "color": "#9ed0e6",
    "source": 8,
    "requiredTier": 8,
    "desc": "Mit jedem Flügelschlag zerreißt er Wolken und Tempel. Predator mit ausgeprägter Offensive.",
    "effectText": "Jagdinstinkt · Predator-Angriffsrolle",
    "art": "assets/custom-art/lategame-v71/late-14.webp"
  },
  {
    "id": 730,
    "name": "Dornenholz-Hydra",
    "level": 10,
    "role": "soul",
    "atk": 460,
    "def": 1690,
    "element": "ERDE",
    "kind": "serpent",
    "color": "#88b78b",
    "source": 8,
    "requiredTier": 8,
    "desc": "Aus jeder Wurzel wächst ein neuer Schlund. Seelenzehrer: enorme DEF für defensive Essenzmechaniken.",
    "effectText": "Seelenentzug · Seelenzehrer in Verteidigungsposition",
    "art": "assets/custom-art/lategame-v71/late-15.webp"
  },
  {
    "id": 731,
    "name": "Himmlischer Titan der Wolkenfestung",
    "level": 10,
    "role": "guardian",
    "atk": 520,
    "def": 1630,
    "element": "LICHT",
    "kind": "golem",
    "color": "#d7cbad",
    "source": 9,
    "requiredTier": 9,
    "desc": "Ein schwebender Titan schützt die letzte Himmelsfestung. Wächter mit monumentaler DEF und Schildwall-Synergie.",
    "effectText": "Schildwall · Wächter-Verteidigungsrolle",
    "art": "assets/custom-art/lategame-v71/late-16.webp"
  }
];
 const roster=[];
 for(const spec of specs){
  const {id,art,element,kind,color,name,level,role,atk,def,source,requiredTier,desc,effectText}=spec;
  if(id!==CARDS.length||!RPG_OPPONENTS[source]||!UPDATE_B_LOOT[source])
   throw Error('LateGame v7.1: Quellgegner oder Karten-ID ungueltig: '+id);
  const inserted=addRpgCard({name,level,atk,def,kind,element,color,role,source,requiredTier,
   desc,art,effectText,rpg:true,rarity:'common',fusionOnly:false,retired:false,
   ace:false,milestoneOnly:false,workshopOnly:false,essenceMonster:false,trainingReward:false});
  if(inserted!==id)throw Error('LateGame v7.1: Unerwartete ID '+inserted);
  const c=CARDS[id];
  if(!ARTWORK_INSTALLED){c.art=window.ArcaneArt?.makeArt?.(c)||makeArt(c);c.customArt=c.art;}
  else c.customArt=c.art;
  c.artWave='7.1';
  UPDATE_B_SET.add(id);UPDATE_B_MAIN_IDS.push(id);UPDATE_B_ACTIVE_IDS.push(id);
  RPG_BASE_CARDS.push(c);
  RPG_OPPONENTS[source].loot.push(id);
  UPDATE_B_LOOT[source].easy.push(id);UPDATE_B_LOOT[source].hard.push(id);
  roster.push({id,name,level,role,source,atk,def,art,effectText});
 }
 window.ArcaneLateGameV71=Object.freeze({version:'7.1.0',count:roster.length,
  artworksInstalled:ARTWORK_INSTALLED,roster:Object.freeze(roster)});
})();
