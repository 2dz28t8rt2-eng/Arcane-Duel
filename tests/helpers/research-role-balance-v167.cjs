'use strict';
/* v16.7 TEST RUNTIME ONLY. Never loaded by a production HTML page.
 * A/B variant is symmetrical for both seats and frozen policies.
 * Explicitly remove pre-v20.7 DEF-only research ability restriction.
 */
const assert=require('node:assert/strict');
const MODES=Object.freeze(['control','predator15','fusionEssence20','fusionCounter55','combined']);
function mode(){
 const name=process.env.ARCANE_RESEARCH_BALANCE||'';
 if(!MODES.includes(name))throw Error('v16.7 simulation requires explicit balance variant');
 return name;
}
function patch(code,before,after,label){
 assert.equal(code.split(before).length,2,'v16.7 missing/duplicate live mechanics: '+label);
 return code.replace(before,after);
}
function transform(code,balance){
 if(!MODES.includes(balance))throw Error('invalid v16.7 balance '+balance);
 // Authoritative v20.7 live abilities work from ATK or DEF.
 code=patch(code,
  "const owner=g.active,creature=g.players[owner].field[action.idx];\n  if(!creature||!isSoul(creature)||creature.mode!=='def')return false;",
  "const owner=g.active,creature=g.players[owner].field[action.idx];\n  if(!creature||!isSoul(creature))return false;",
  'research Soul stance parity');
 const pierce=balance==='predator15'||balance==='combined';
 const essence=balance==='fusionEssence20'||balance==='combined';
 const counter=balance==='fusionCounter55'||balance==='combined';
 if(pierce)code=patch(code,
  "const predatorPierce=roleOf(a)==='predator'?\n     (g.strategicTraining?.symmetricSides?\n      (g.strategicTraining.predatorArmorPierce||0):.10):0;",
  "const predatorPierce=roleOf(a)==='predator'?.15:0;",
  '15pp Predator piercing (both seats)');
 if(essence){
  code=patch(code,
   "let earned=0,drainedDef=0,drainedAtk=0;const targets=[];",
   "let earned=0,drainedDef=0,drainedAtk=0,bonusEarned=0;const targets=[];",
   'passive bonus scratch');
  code=patch(code,
   "earned+=lost.atk+lost.def;drainedDef+=lost.def;",
   "earned+=lost.atk+lost.def;\n   if(target.fusion===true)bonusEarned+=Math.floor((lost.atk+lost.def)*.20);\n   drainedDef+=lost.def;",
   'passive fusion-only extra stored essence');
  code=patch(code,
   "const gain=storeDrainedEnergy(g,creature,owner,earned);\n  window.ArcaneDefenderFX?.record",
   "const gain=storeDrainedEnergy(g,creature,owner,earned+bonusEarned);\n  window.ArcaneDefenderFX?.record",
   'passive store with unchanged extraction and burn');
  code=patch(code,
   "const gained=storeDrainedEnergy(game,creature,0,actual);",
   "const gained=storeDrainedEnergy(game,creature,0,actual+(target.fusion===true?Math.floor(actual*.20):0));",
   'player Fusion raid');
  code=patch(code,
   "const gain=storeDrainedEnergy(g,creature,owner,earned);\n   layer.raidCooldown=3;",
   "const gain=storeDrainedEnergy(g,creature,owner,earned+(target.fusion===true?Math.floor(earned*.20):0));\n   layer.raidCooldown=3;",
   'both-seat research Fusion raid');
 }
 if(counter){
  code=patch(code,
   "const counter=isDefender(d.c)?Math.floor(Math.max(0,dataOf(d.c).atk)*.5):0;",
   "const counter=isDefender(d.c)?Math.floor(Math.max(0,dataOf(d.c).atk)*(a.c.fusion===true?.55:.50)):0;",
   'AI threat forecast parity');
  code=patch(code,
   "const counter= Math.floor(Math.max(0,dataOf(d).atk)*.5);",
   "const counter= Math.floor(Math.max(0,dataOf(d).atk)*(a.fusion===true?.55:.50));",
   'fusion-attacker-specific real counter damage');
 }
 return code;
}
module.exports={MODES,mode,transform};
