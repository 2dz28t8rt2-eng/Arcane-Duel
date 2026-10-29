'use strict';
/* v16.8 - ONLY the research VM. Never loaded by game HTML or server.
 * Fusion Drain 20% increases ACTUALLY REMOVED ATK/DEF, NOT merely stored essence.
 * One proportional increase, no second conversion multiplier. Real fused
 * instances only; equal mode for both seats and the frozen champion.
 */
const assert=require('node:assert/strict');
const MODES=Object.freeze([
 'control','predator125','predator15','fusionDrain20',
 'fusionDrain20Predator125','fusionDrain20Predator15'
]);
function mode(){
 const m=process.env.ARCANE_RESEARCH_BALANCE_V168||'';
 if(!MODES.includes(m))throw Error('v16.8 requires explicit balanced research mode');
 return m;
}
function patch(code,before,after,label){
 assert.equal(code.split(before).length,2,'v16.8 missing or multiple combat hooks: '+label);
 return code.replace(before,after);
}
function transform(code,m){
 assert.ok(MODES.includes(m),'Invalid mode '+m);
 // Research overlays must not change DEF-only activation legality.
 const pierce=m.includes('predator125')?.125:m.includes('predator15')?.15:.10;
 if(pierce!==.10)code=patch(code,
  "const predatorPierce=roleOf(a)==='predator'?\n     (g.strategicTraining?.symmetricSides?\n      (g.strategicTraining.predatorArmorPierce||0):.10):0;",
  "const predatorPierce=roleOf(a)==='predator'?"+pierce+":0;",
  'symmetrical Predator penetration');
 if(m.includes('fusionDrain20')){
  // Passive drain: two base 10-point drains -> 12 each; each level
  // applies a 5-point drain -> 6 each. Exact 20% per removed component.
  code=patch(code,
    "const n=Math.min(target.card[stat],10);",
    "const n=Math.min(target.card[stat],target.fusion===true?12:10);",
    'passive base ACTUAL drain');
  code=patch(code,
    "const n=Math.min(target.card[stat],5);target.card[stat]-=n;lost[stat]+=n;",
    "const n=Math.min(target.card[stat],target.fusion===true?6:5);target.card[stat]-=n;lost[stat]+=n;",
    'passive level ACTUAL drain');
  // Active Seelenraub budget: +20% only for real fused target; no extra
  // stored essence, normal 3-turn cooldown and same ATK/DEF preference.
  code=patch(code,
    "const level=dataOf(creature).level,normal=20+5*level,budget=Math.floor(normal*2.5);",
    "const level=dataOf(creature).level,normal=20+5*level,budget=Math.floor(normal*2.5*(target.fusion===true?1.20:1));",
    'real player ACTUAL raid drain');
  code=patch(code,
    "const level=dataOf(creature).level,budget=Math.floor((20+5*level)*2.5);",
    "const level=dataOf(creature).level,budget=Math.floor((20+5*level)*2.5*(target.fusion===true?1.20:1));",
    'two-seat research ACTUAL raid drain');
 }
 return code;
}
module.exports={MODES,mode,transform};
