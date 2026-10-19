/* Arcane Duel v5.9 – stage-appropriate SYNTHETIC training decks.
 * Use cards plausibly obtainable before the given tournament opponent: only
 * starter cards plus ordinary earlier-stage rewards (source <= tier-1).
 * These are NOT acquired player inventories or proof of actual drop odds.
 * No ACE, hard-only, unreleased or special quest cards are manufactured.
 */
'use strict';
const STYLES=['predator','guardian','fusion','balanced','soul'];
function catalogue(stage){
 return {cards:stage.cards,defaultDeck:stage.defaultDeck,
  startFusions:stage.startFusions,opponents:stage.opponents};
}
function seedHash(a,b,c){let v=(Math.imul(a+1,73856093)^Math.imul(b+1,19349663)^Math.imul(c+1,83492791))>>>0;v^=v>>>16;v=Math.imul(v,0x7feb352d);v^=v>>>15;return (v>>>0)/4294967296;}
function makeTrainingDeck(catalogue,tier,style,variant='normal'){
 if(!Number.isInteger(tier)||tier<1||tier>10)throw Error('Tournament tier 1–10 required');
 if(!STYLES.includes(style)||!['normal','invested','conservative'].includes(variant))
  throw Error('Unknown training deck archetype or progression variant');
 const {cards,defaultDeck,startFusions,opponents}=catalogue;
 if(!Array.isArray(cards)||!Array.isArray(defaultDeck)||!Array.isArray(opponents))throw Error('Invalid game catalogue');
 const levelCap=Math.min(10,Number(opponents[tier-1]?.level)||3);
 const maxSource=tier-1;
 const starters=new Set(defaultDeck);
 const allowed=c=>{
  if(!c||c.retired||c.hard||c.ace||c.enemyOnly||c.essenceMonster||
   c.lv1Exclusive||c.workshopOnly||c.fateOnly||c.level<1||c.level>levelCap)
   return false;
  if(starters.has(c.id)||startFusions.includes(c.id))return true;
  return Number.isInteger(c.source)&&c.source>=0&&c.source<=maxSource;
 };
 const role=c=>c.role||c.roleOverride||'';
 const score=c=>{
  const atk=c.atk||0,def=c.def||0,level=c.level||0,r=role(c);
  let v=style==='predator'?atk*1.9+def*.25+(r==='predator'?480:0):
   style==='guardian'?def*1.7+atk*.28+(r==='guardian'?550:0)+(r==='soul'?280:0):
   style==='soul'?def*1.25+atk*.32+(r==='soul'?640:0)+(r==='guardian'?310:0):
   style==='fusion'?atk*.8+def*.65+level*90+(r==='combatant'?320:0):
   atk+def*.9;
  v+=level*45;
  // Varied decks avoid uniform best-stat lineups and model realistic play styles.
  const jitter=(seedHash(tier,c.id,STYLES.indexOf(style))*2-1)*(variant==='invested'?70:175);
  return v+jitter;
 };
 const eligible=cards.filter(allowed);
 const main=eligible.filter(c=>!c.fusionOnly&& !c.ace);
 const fusion=eligible.filter(c=>c.fusionOnly&&c.rpg);
 const base=main.filter(c=>starters.has(c.id));
 const advanced=main.filter(c=>!starters.has(c.id));
 if(base.length<14)throw Error('Need 14 distinct legal starter cards');
 const ranked=(pool)=>[...pool].sort((a,b)=>score(b)-score(a)||a.id-b.id);
 const core=ranked(base),extra=ranked(advanced);
 const slots=[];
 const counts=new Map();
 function append(list,limit){
  for(const c of list){if(slots.length>=limit)break;
   const n=counts.get(c.id)||0;
   if(n>=3)continue;
   slots.push(c.id);counts.set(c.id,n+1);
  }
 }
 const starterQuota=Math.max(8,Math.round((35-tier*2.7)*(variant==='invested'?.8:variant==='conservative'?1.2:1)));
 const quota=Math.min(40,starterQuota);
 const baseRepeats=[...core,...core,...core];
 append(baseRepeats,quota);
 const extraRepeats=[...extra,...extra,...extra];
 append(extraRepeats,40);
 append(baseRepeats,40);
 if(slots.length!==40)throw Error('Could not assemble 40 legal stage cards: tier '+tier);
 // Keep a broad main roster; repeated copies are legal but diversity matters.
 const ownedFusions=ranked(fusion.filter(c=>!c.ace));
 const start=cards.filter(c=>startFusions.includes(c.id)&&c.fusionOnly&&c.level<=levelCap);
 const fused=[...new Map([...start,...ownedFusions].map(c=>[c.id,c])).values()];
 const target=Math.min(15,Math.max(2,4+Math.floor(tier*.9)));
 const fusionDeck=fused.slice(0,target).map(c=>c.id);
 if(fusionDeck.length<2)throw Error('Insufficient stage-legal fusion choices');
 const sources=[...new Set(slots.map(id=>cards[id].source).filter(Number.isInteger))];
 return {tier,style,variant,deck:slots,fusionDeck,
  meta:{levelCap,maxSource,mainDistinct:counts.size,
   sources:sources.sort((a,b)=>a-b),
   minLevel:Math.min(...slots.map(id=>cards[id].level)),
   maxLevel:Math.max(...slots.map(id=>cards[id].level)),
   averageLevel:Math.round(100*slots.reduce((s,id)=>s+cards[id].level,0)/40)/100,
   starterCards:slots.filter(id=>starters.has(id)).length,
   fusionDistinct:new Set(fusionDeck).size}};
}
module.exports={makeTrainingDeck,STYLES,catalogue};
