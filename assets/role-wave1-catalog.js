/* Arcane Duel — ROLE-WAVE 1+2. All 15 original WebP assets are installed directly in Git.
 * Enabled only once all 15 final artworks have been installed in GitHub.
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
  },
  {
    "key": "ascheklauen-vyrak",
    "name": "Ascheklauen Vyrak",
    "role": "predator",
    "kind": "wolf",
    "element": "FEUER",
    "level": 5,
    "requiredTier": 3,
    "color": "#e97545",
    "desc": "Vyrak jagt durch vulkanische Felsspalten und bezwingt Gegner mit explosiver Geschwindigkeit.",
    "style": "predator",
    "art": "assets/role-wave1/ascheklauen-vyrak.webp",
    "customArt": "assets/role-wave1/ascheklauen-vyrak.webp"
  },
  {
    "key": "erdwacht-kolgran",
    "name": "Erdwacht Kolgran",
    "role": "guardian",
    "kind": "golem",
    "element": "ERDE",
    "level": 4,
    "requiredTier": 2,
    "color": "#b6aa7f",
    "desc": "Kolgrans Granitpanzer bildet eine natürliche Festung gegen die schwersten Angriffe.",
    "style": "defender",
    "art": "assets/role-wave1/erdwacht-kolgran.webp",
    "customArt": "assets/role-wave1/erdwacht-kolgran.webp"
  },
  {
    "key": "lichtseher-auralis",
    "name": "Lichtseher Auralis",
    "role": "guardian",
    "kind": "stag",
    "element": "LICHT",
    "level": 6,
    "requiredTier": 4,
    "color": "#f1dc9c",
    "desc": "Auralis hütet den Sternenhain und stärkt mit seiner Präsenz die Verteidigungslinie.",
    "style": "guardian",
    "art": "assets/role-wave1/lichtseher-auralis.webp",
    "customArt": "assets/role-wave1/lichtseher-auralis.webp"
  },
  {
    "key": "nekroschlund-zayth",
    "name": "Nekroschlund Zayth",
    "role": "soul",
    "kind": "serpent",
    "element": "DUNKEL",
    "level": 5,
    "requiredTier": 3,
    "color": "#b37ce2",
    "desc": "Seine Klauen ziehen Seelenenergie aus jeder Wunde und lassen das Dunkel wachsen.",
    "style": "soul",
    "art": "assets/role-wave1/nekroschlund-zayth.webp",
    "customArt": "assets/role-wave1/nekroschlund-zayth.webp"
  },
  {
    "key": "sturmreiter-zephyx",
    "name": "Sturmreiter Zephyx",
    "role": "combatant",
    "kind": "bird",
    "element": "WIND",
    "level": 4,
    "requiredTier": 2,
    "color": "#73cbd3",
    "desc": "Zephyx verbindet schnelle Attacken mit einem anpassungsfähigen Schutzgefieder.",
    "style": "allrounder",
    "art": "assets/role-wave1/sturmreiter-zephyx.webp",
    "customArt": "assets/role-wave1/sturmreiter-zephyx.webp"
  }
].map(c=>Object.freeze(c)));
 // All fifteen WebP originals have been installed and verified on development.
 const ASSETS_COMPLETE=true;
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
