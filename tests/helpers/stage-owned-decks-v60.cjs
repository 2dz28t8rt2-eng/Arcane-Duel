/* Arcane Duel v6.0 stage decks – ownership-bounded synthetic inventories.
 * Start with the REAL freshProfile inventory, then conservatively add cards
 * from PREVIOUS opponents' ordinary loot (no current/future wins).
 * This does not simulate actual randomized drop odds or purchases.
 */
'use strict';
const {STYLES}=require('./stage-training-decks-v59.cjs');
const VARIANTS=['normal','invested'];
const KEY=c=>Number(c.id);
const count=(ids)=>{const m=new Map();for(const id of ids)m.set(id,(m.get(id)||0)+1);return m;};
function legalCard(c,tier,catalogue){
 if(!c||!Number.isInteger(c.id)||!Number.isInteger(c.level)||c.level<1||
    c.level>10||c.retired||c.hard||c.ace||c.enemyOnly||c.essenceMonster||
    c.lv1Exclusive||c.workshopOnly||c.fateOnly||c.milestoneOnly||
    c.manifestOf!==undefined&&c.manifestOf!==null||c.eventOnly||
    c.questOnly||c.legendaryOnly||c.fate||c.source>tier-1)return false;
 const starter=new Set([...catalogue.defaultDeck,...catalogue.startFusions]);
 return starter.has(c.id)||Number.isInteger(c.source)&&c.source>=0&&
   c.source<tier&&catalogue.opponents.slice(0,tier).some(o=>o.loot.includes(c.id));
}
function availableInventory(data,tier,variant){
 if(!Number.isInteger(tier)||tier<1||tier>10)throw Error('Tier 1–10');
 if(!VARIANTS.includes(variant))throw Error('Unknown inventory variant');
 const {cards,opponents,initialInventory,defaultDeck,startFusions}=data;
 if(!Array.isArray(cards)||!Array.isArray(opponents)||!initialInventory)
  throw Error('Incomplete real catalogue/inventory');
 const baseCount=new Map();
 for(const [key,amount] of Object.entries(initialInventory)){
  const id=Number(key);
  if(Number.isInteger(id)&&Number.isInteger(amount)&&amount>0&&cards[id]&&
     legalCard(cards[id],tier,data))
   baseCount.set(id,Math.min(3,amount));
 }
 // Only PREVIOUS cleared opponents. Free training is 0; tier 1 has NOT
 // beaten opponent 1. An invested variant represents more repeatable
 // previous-stage farming, never free future cards.
 const multiplier=variant==='invested'?2:1;
 for(let stage=0;stage<tier;stage++){
  const o=opponents[stage];if(!o)continue;
  for(const id of new Set(o.loot)){
   const c=cards[id];
   if(!legalCard(c,tier,data))continue;
   const previous=baseCount.get(id)||0;
   baseCount.set(id,Math.min(3,previous+multiplier));
  }
 }
 return baseCount;
}
function makeStageOwnedDeck(data,tier,style,variant='normal'){
 if(!STYLES.includes(style)||!VARIANTS.includes(variant))throw Error('Invalid deck style');
 const cards=data.cards,own=availableInventory(data,tier,variant);
 // The tournament before the currently challenged stage bounds collection
 // quality. Do not use a high-level milestone monster just because its
 // source number is low.
 const levelCap=Math.min(10,Number(data.opponents[tier-1]?.level)||4);
 const role=c=>c.role||c.roleOverride||'';
 function score(c){
  const atk=Number(c.atk)||0,def=Number(c.def)||0,r=role(c),lv=c.level||1;
  const bonus=style==='predator'?(atk*1.85+def*.22+(r==='predator'?620:0)):
   style==='guardian'?(def*1.85+atk*.28+(r==='guardian'?600:0)+(r==='soul'?400:0)):
   style==='soul'?(def*1.35+atk*.36+(r==='soul'?780:0)+(r==='guardian'?500:0)):
   style==='fusion'?(atk*.72+def*.63+lv*145+(r==='combatant'?420:0)):
   (atk+def*.96);
  return bonus+lv*70;
 }
 const starters=new Set(data.defaultDeck);
 const legal=Array.from(own).filter(([id,n])=>n>0&&
  cards[id].level<=levelCap&&legalCard(cards[id],tier,data));
 const main=legal.filter(([id])=>!cards[id].fusionOnly);
 const sorted=[...main].sort((a,b)=>score(cards[b[0]])-score(cards[a[0]])||a[0]-b[0]);
 const original=sorted.filter(([id])=>starters.has(id));
 const extras=sorted.filter(([id])=>!starters.has(id));
 const firstPick=variant==='invested'?extras:original;
 const secondPick=variant==='invested'?original:extras;
 const deck=[],used=new Map();
 function take(pairs,max=40){for(const [id,quantity] of pairs){
  while(deck.length<max&&(used.get(id)||0)<quantity){
   used.set(id,(used.get(id)||0)+1);deck.push(id);
  }
 }}
 // Start from the player's actual initial inventory; replace some copies
 // with earned earlier-stage cards according to the selected strategy.
 if(variant==='invested'){take(firstPick,28);take(secondPick,40);}
 else{take(original,30);take(extras,40);}
 take(sorted,40);
 if(deck.length!==40)throw Error('Cannot assemble 40 owned stage cards: '+tier+' '+style);
 const fusion=legal.filter(([id])=>cards[id].fusionOnly)
  .sort((a,b)=>score(cards[b[0]])-score(cards[a[0]])||a[0]-b[0]);
 const fusionDeck=[],fusedUsed=new Map();
 for(const [id,n] of fusion){
  while(fusionDeck.length<15&&(fusedUsed.get(id)||0)<n){
   fusedUsed.set(id,(fusedUsed.get(id)||0)+1);fusionDeck.push(id);
  }
 }
 if(fusionDeck.length<2)throw Error('Need >=2 legitimately owned starter fusions');
 const mainMax=Math.max(...deck.map(id=>cards[id].level));
 const full=[...deck,...fusionDeck];
 if(full.some(id=>!legalCard(cards[id],tier,data)||cards[id].level>levelCap))
  throw Error('Deck violates stage source/level cap');
 for(const [id,n] of count(full))if(n>(own.get(id)||0))
  throw Error('Invented or duplicated ownership of card '+id);
 return {tier,style,variant,deck,fusionDeck,ownership:Object.fromEntries(own),
  meta:{levelCap,mainHighest:mainMax,mainAvg:Math.round(
   deck.reduce((s,id)=>s+cards[id].level,0)/40*100)/100,
   mainDistinct:new Set(deck).size,fusionDistinct:new Set(fusionDeck).size,
   priorLootMaxSource:tier-1,
   initialCount:[...Object.values(data.initialInventory)].reduce((s,v)=>s+Number(v),0),
   newLootCards:deck.filter(id=>!starters.has(id)).length,
   maxOwnedCopies:Math.max(...[...own.values()])}};
}
module.exports={availableInventory,makeStageOwnedDeck,legalCard,STYLES,VARIANTS};
