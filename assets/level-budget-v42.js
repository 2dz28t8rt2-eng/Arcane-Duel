/* Level 1-10 PvE normal-monster budget. PvP classic cards and permanent
 * fusions/Essence school monsters are intentionally preserved.
 * Target: normalize ordinary card templates BEFORE Evolution takes
 * its fusion reference snapshots, and never renumber a catalog item.
 */
'use strict';
(()=>{
 const totals=Object.freeze([0,180,270,420,630,810,1030,1270,1530,1830,2150]);
 const original=workshopBudget;
 const budget=lv=>totals[lv]||original(lv);
 const shares={predator:.76,guardian:.25,soul:.22,support:.43,weaver:.40,combatant:.50};
 const rarityFactor=c=>c.ace?1.12:c.rarity==='legendary'||c.rarity==='mythic'?1.18:c.rarity==='epic'?1.13:c.rarity==='rare'?1.09:1;
 const round=n=>Math.round(n/10)*10;
 const changed=[];
 const unbound=[];
 workshopBudget=function(lv){return budget(lv);};
 for(const c of CARDS){
  if(c?.rpg&&c.fusionOnly){c.fusionRoleFree=true;unbound.push(c.id);}
 }
 function assign(c){
  const total=round(budget(c.level)*rarityFactor(c));
  const share=shares[c.role]??.5;
  const atk=Math.max(50,round(total*share));
  c.atk=atk;c.def=Math.max(50,total-atk);
 }
 for(const c of CARDS){
  if(!c||!c.rpg||c.fusionOnly||c.lv1Special||c.essenceMonster||c.id<20||c.level<1||c.level>10||c.retired)continue;
  // Store old values once for audit. Do not multiply them or capture later
  // rendering-compatibility mutations as a new baseline.
  Object.defineProperty(c,'arcaneOriginalStats',{value:{atk:c.atk,def:c.def},configurable:true});
  assign(c);changed.push(c.id);
 }
 function refresh(){
  // Late-loaded role/art modules are allowed to update visual metadata, but
  // they must not silently restore obsolete 3,000-stat combat templates.
  for(const id of changed){const c=CARDS[id];if(c&&!c.fusionOnly&&!c.retired)assign(c);}
 }
 window.ArcaneLevelBudget=Object.freeze({version:'4.2',totals,changed:Object.freeze(changed),rarityFactor,
  budget,shares:Object.freeze(shares),unbound:Object.freeze(unbound),refresh});
})();