/* Arcane Duel — ROLE-WAVE 1. Artwork files supplied separately as binary WebP.
 * Enabled only once all ten final artworks have been installed in GitHub.
 * Install before loadProfile() to retain stable persisted card IDs.
 */
'use strict';
(()=>{
 const records=Object.freeze([
  {
    "key": "flammenjaeger-rethar",
    "name": "Flammenjäger Rethar",
    "role": "predator",
    "kind": "wolf",
    "element": "FEUER",
    "level": 4,
    "requiredTier": 2,
    "color": "#e5785b",
    "desc": "Ein rasender Jäger, dessen glühende Pranken selbst Eisen zerreißen.",
    "style": "predator",
    "art": "assets/role-wave1/flammenjaeger-rethar.webp"
  },
  {
    "key": "schattenklinge-zyrr",
    "name": "Schattenklinge Zyrr",
    "role": "predator",
    "kind": "wolf",
    "element": "DUNKEL",
    "level": 3,
    "requiredTier": 1,
    "color": "#ba8adb",
    "desc": "Lauert im Schatten der Ruinen und schlägt blitzschnell aus dem Hinterhalt zu.",
    "style": "predator",
    "art": "assets/role-wave1/schattenklinge-zyrr.webp"
  },
  {
    "key": "eisenbastion-gorrath",
    "name": "Eisenbastion Gorrath",
    "role": "guardian",
    "kind": "golem",
    "element": "FEUER",
    "level": 5,
    "requiredTier": 3,
    "color": "#d99b72",
    "desc": "Ein uralter Lavakoloss, der mit seinem Panzer ganze Angriffe verschluckt.",
    "style": "defender",
    "art": "assets/role-wave1/eisenbastion-gorrath.webp"
  },
  {
    "key": "dornenschild-varuk",
    "name": "Dornenschild Varuk",
    "role": "guardian",
    "kind": "stag",
    "element": "ERDE",
    "level": 4,
    "requiredTier": 2,
    "color": "#8eaf72",
    "desc": "Sein mit Dornen und Wurzeln verwachsener Körper bildet eine lebende Festung.",
    "style": "defender",
    "art": "assets/role-wave1/dornenschild-varuk.webp"
  },
  {
    "key": "ewige-wacht-lysar",
    "name": "Ewige Wacht Lysar",
    "role": "guardian",
    "kind": "lion",
    "element": "LICHT",
    "level": 6,
    "requiredTier": 4,
    "color": "#d8c997",
    "desc": "Beschützt das Sternentor und hält die Linie, wenn alle anderen weichen.",
    "style": "guardian",
    "art": "assets/role-wave1/ewige-wacht-lysar.webp"
  },
  {
    "key": "runenwacht-aegis",
    "name": "Runenwacht Aegis",
    "role": "guardian",
    "kind": "knight",
    "element": "ERDE",
    "level": 5,
    "requiredTier": 3,
    "color": "#76c6cf",
    "desc": "Trägt schwebende Runenschilde und hält feindliche Kräfte auf Distanz.",
    "style": "guardian",
    "art": "assets/role-wave1/runenwacht-aegis.webp"
  },
  {
    "key": "seelenbrut-malgris",
    "name": "Seelenbrut Malgris",
    "role": "soul",
    "kind": "spirit",
    "element": "DUNKEL",
    "level": 5,
    "requiredTier": 3,
    "color": "#ab82d1",
    "desc": "Ein unheilvoller Geist, der vergessene Seelen zu neuer Kraft bündelt.",
    "style": "soul",
    "art": "assets/role-wave1/seelenbrut-malgris.webp"
  },
  {
    "key": "leerenpakt-nythor",
    "name": "Leerenpakt Nythor",
    "role": "soul",
    "kind": "spirit",
    "element": "DUNKEL",
    "level": 4,
    "requiredTier": 2,
    "color": "#c7a8e9",
    "desc": "Bewacht das Tor der Geisterwelt und zehrt von der letzten Lebenskraft.",
    "style": "soul",
    "art": "assets/role-wave1/leerenpakt-nythor.webp"
  },
  {
    "key": "sturmschmied-kael",
    "name": "Sturmschmied Kael",
    "role": "combatant",
    "kind": "bird",
    "element": "WIND",
    "level": 6,
    "requiredTier": 4,
    "color": "#86c9e6",
    "desc": "Vereinigt das Gleichgewicht von Geschwindigkeit und Widerstand.",
    "style": "allrounder",
    "art": "assets/role-wave1/sturmschmied-kael.webp"
  },
  {
    "key": "elementsynthese-orin",
    "name": "Elementsynthese Orin",
    "role": "combatant",
    "kind": "stag",
    "element": "LICHT",
    "level": 3,
    "requiredTier": 1,
    "color": "#d5ca83",
    "desc": "Ein uraltes Waldwesen, dessen Resonanz Verbündete und Fusionen stärkt.",
    "style": "allrounder",
    "art": "assets/role-wave1/elementsynthese-orin.webp"
  }
].map(c=>Object.freeze(c)));
 // Keep disabled until artwork files actually exist on development.
 const ASSETS_COMPLETE=false;
 let installedIds=[];
 function install(){
  if(!ASSETS_COMPLETE)return {status:'awaiting-artworks',installed:0};
  if(installedIds.length)return {status:'installed',installed:installedIds.length,ids:[...installedIds]};
  if(typeof addRpgCard!=='function'||!Array.isArray(RPG_BASE_CARDS)||!Array.isArray(UPDATE_B_MAIN_IDS)||
   !Array.isArray(UPDATE_B_ACTIVE_IDS)||!UPDATE_B_SET)throw Error('Role Wave 1: catalogue not ready');
  const ids=[];
  for(const spec of records){
   const id=addRpgCard({name:spec.name,level:spec.level,atk:100,def:100,kind:spec.kind,
    element:spec.element,color:spec.color,role:spec.role,roleStyle:spec.style,
    art:spec.art,customArt:spec.art,artWave:'role-wave1',
    source:spec.requiredTier,requiredTier:spec.requiredTier,rarity:'common',
    fusionOnly:false,ace:false,retired:false,workshopOnly:false,
    desc:spec.desc});
   const c=CARDS[id];RPG_BASE_CARDS.push(c);UPDATE_B_MAIN_IDS.push(id);
   UPDATE_B_ACTIVE_IDS.push(id);UPDATE_B_SET.add(id);ids.push(id);
  }
  installedIds=ids;
  return {status:'installed',installed:ids.length,ids:[...ids]};
 }
 window.ArcaneRoleWave1=Object.freeze({version:'0.1',enabled:ASSETS_COMPLETE,
  cards:records,install,get installedIds(){return [...installedIds];}});
})();
