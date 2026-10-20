/* Late-game collection appendix v7.1: exactly the imported 16 actual RPG cards.
 * Source of truth: assets/lategame-cards-v71.json. The IDs, art and lore
 * must match the live catalogue; validated by tests.
 */
'use strict';
(()=>{
 const additions=[
 {
  "id": 716,
  "name": "Vulkanbestie des Sturmruinenlands",
  "desc": "Die uralte Vulkanbestie jagt durch Asche und zerborstene Tempel. Ihr Predator-Fokus verstärkt Angriff und Jagdinstinkt.",
  "level": 7,
  "kind": "golem",
  "element": "FEUER",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-01.webp"
 },
 {
  "id": 717,
  "name": "Runenwächter der gefallenen Feste",
  "desc": "Runen versiegeln seinen schweren Panzer. Als Wächter schützt er die Linie und profitiert vom Schildwall.",
  "level": 7,
  "kind": "knight",
  "element": "ERDE",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-02.webp"
 },
 {
  "id": 718,
  "name": "Gruftwächter der verlorenen Seelen",
  "desc": "Aus den Hallen der Gruft zieht er verbliebene Essenz. Als Seelenzehrer nutzt er die vorhandene DEF- und Seelenentzug-Mechanik.",
  "level": 7,
  "kind": "spirit",
  "element": "DUNKEL",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-03.webp"
 },
 {
  "id": 719,
  "name": "Prismenchimäre des Kristalltempels",
  "desc": "Zahlreiche Facetten spiegeln gegnerische Taktiken. Ein Allrounder für ausgewogene Werte und Resonanz-Synergien.",
  "level": 7,
  "kind": "dragon",
  "element": "LICHT",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-04.webp"
 },
 {
  "id": 720,
  "name": "Blitzwyvern der Himmelsruinen",
  "desc": "Zwischen zerbrochenen Himmelsbrücken stürzt er sich auf seine Beute. Predator: hoher Angriff, geringe Verteidigung.",
  "level": 7,
  "kind": "dragon",
  "element": "WIND",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-05.webp"
 },
 {
  "id": 721,
  "name": "Eisenwurzel-Koloss",
  "desc": "Seine Wurzeln greifen tief in uralte Mauern. Wächter: standhafte Verteidigung und Schildwall-Synergie.",
  "level": 7,
  "kind": "golem",
  "element": "ERDE",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-06.webp"
 },
 {
  "id": 722,
  "name": "Mottenfürst des Mondschleiers",
  "desc": "Er lockt verlorene Seelen mit gespenstischem Mondlicht. Seelenzehrer mit starker DEF-Basis.",
  "level": 8,
  "kind": "insect",
  "element": "DUNKEL",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-07.webp"
 },
 {
  "id": 723,
  "name": "Basaltbasilisk des Lavakessels",
  "desc": "In seinem Blick erstarren die alten Lavaruinen. Predator mit schwerem Angriff und entsprechendem Risiko.",
  "level": 8,
  "kind": "serpent",
  "element": "FEUER",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-08.webp"
 },
 {
  "id": 724,
  "name": "Kathedralen-Leviathan",
  "desc": "Er umschließt den versunkenen Himmelstempel wie eine Festungsmauer. Wächter mit hoher Verteidigung.",
  "level": 8,
  "kind": "serpent",
  "element": "WASSER",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-09.webp"
 },
 {
  "id": 725,
  "name": "Chimäre des kosmischen Sturms",
  "desc": "Drei Wesenheiten teilen sich einen Körper. Allrounder: flexibel für gemischte Fusionen und Resonanz.",
  "level": 8,
  "kind": "dragon",
  "element": "LICHT",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-10.webp"
 },
 {
  "id": 726,
  "name": "Sphinxwächter des Mondlichts",
  "desc": "Der Hüter der Mondarchive lässt keine Eindringlinge passieren. Seine Stärke liegt in der DEF und im Schildwall.",
  "level": 8,
  "kind": "golem",
  "element": "LICHT",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-11.webp"
 },
 {
  "id": 727,
  "name": "Obsidian-Drache der Lavaruinen",
  "desc": "In seinen schwarzen Schuppen glüht das Herz des Vulkans. Predator: gefährlich beim Angriff, verwundbarer in DEF.",
  "level": 9,
  "kind": "dragon",
  "element": "FEUER",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-12.webp"
 },
 {
  "id": 728,
  "name": "Astraler Labyrinth-Minotaurus",
  "desc": "Er erkennt Wege zwischen den Sternbildern. Allrounder: ausgeglichene Werte und Resonanz-Potenzial.",
  "level": 9,
  "kind": "golem",
  "element": "DUNKEL",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-13.webp"
 },
 {
  "id": 729,
  "name": "Donnergreif des Himmelsbruchs",
  "desc": "Mit jedem Flügelschlag zerreißt er Wolken und Tempel. Predator mit ausgeprägter Offensive.",
  "level": 9,
  "kind": "bird",
  "element": "WIND",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-14.webp"
 },
 {
  "id": 730,
  "name": "Dornenholz-Hydra",
  "desc": "Aus jeder Wurzel wächst ein neuer Schlund. Seelenzehrer: enorme DEF für defensive Essenzmechaniken.",
  "level": 10,
  "kind": "serpent",
  "element": "ERDE",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-15.webp"
 },
 {
  "id": 731,
  "name": "Himmlischer Titan der Wolkenfestung",
  "desc": "Ein schwebender Titan schützt die letzte Himmelsfestung. Wächter mit monumentaler DEF und Schildwall-Synergie.",
  "level": 10,
  "kind": "golem",
  "element": "LICHT",
  "fusion": false,
  "manifestOf": null,
  "variantOf": null,
  "art": "assets/custom-art/lategame-v71/late-16.webp"
 }
];
 const collection=window.ARCANE_COLLECTION_V3;
 if(!Array.isArray(collection))throw Error('Collection manifest did not load');
 const existing=new Set(collection.map(c=>c.id));
 for(const card of additions){
  if(existing.has(card.id))throw Error('Duplicate late-game collection card '+card.id);
  collection.push(card);existing.add(card.id);
 }
 window.ArcaneCollectionLateGameV71=Object.freeze({count:additions.length,addedIds:Object.freeze(additions.map(c=>c.id))});
})();
