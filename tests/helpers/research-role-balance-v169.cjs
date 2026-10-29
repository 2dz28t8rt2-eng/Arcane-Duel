'use strict';
/* v16.9: research-only asymmetric Soul drain and 15pp Predator armor pierce.
 * Fusion flag wins over role tag: a fused Predator is still a Fusion target.
 * No card stat edits, no extra essence multiplier, no live-game changes.
 * Normal Guardian/Soul/other targets remain at 100% siphon.
 */
const assert=require('node:assert/strict');
const MODES=Object.freeze([
 'control10','predator15','predator15Fusion20',
 'predator10Triad80','predator15Triad90','predator15Triad80'
]);
function mode(){
 const m=process.env.ARCANE_RESEARCH_BALANCE_V169||'';
 if(!MODES.includes(m))throw Error('v16.9 explicit research variant required');
 return m;
}
function patch(code,before,after,label){
 assert.equal(code.split(before).length,2,'v16.9 missing or duplicated live hook: '+label);
 return code.replace(before,after);
}
function tuning(m){
 if(!MODES.includes(m))throw Error('Invalid research variant '+m);
 return Object.freeze({
  pierce:m==='control10'||m==='predator10Triad80'?.10:.15,
  fusion:m==='predator15Fusion20'||m.includes('Triad')?1.20:1,
  predator:m.endsWith('Triad80')?.80:m.endsWith('Triad90')?.90:1
 });
}
function transform(code,m){
 const t=tuning(m);
 if(t.pierce!==.10)
  code=patch(code,
   "const predatorPierce=roleOf(a)==='predator'?\n     (g.strategicTraining?.symmetricSides?\n      (g.strategicTraining.predatorArmorPierce||0):.10):0;",
   "const predatorPierce=roleOf(a)==='predator'?.15:0;",
   '15pp predator armor penetration, both seats');
 if(t.fusion!==1||t.predator!==1){
  const multiplier="target.fusion===true?"+t.fusion+":roleOf(target)==='predator'?"+t.predator+":1";
  const passiveBase="target.fusion===true?"+Math.round(10*t.fusion)+":roleOf(target)==='predator'?"+Math.round(10*t.predator)+":10";
  const passiveStep="target.fusion===true?"+Math.round(5*t.fusion)+":roleOf(target)==='predator'?"+Math.round(5*t.predator)+":5";
  // For the 90% case, per-level 5 * 0.9 is fractional. Apply rounding
  // on the SUM of per-level draws by deterministic fractional scheduling.
  // Use integer 4/5 alternation, not always round 4.5 to 5.
  const stepExpr=t.predator===.90?
   "target.fusion===true?6:roleOf(target)==='predator'?(i%2===0?5:4):5":
   passiveStep;
  code=patch(code,"const n=Math.min(target.card[stat],10);",
   "const n=Math.min(target.card[stat],"+passiveBase+");",
   'passive initial ATK and DEF extraction');
  code=patch(code,"const n=Math.min(target.card[stat],5);target.card[stat]-=n;lost[stat]+=n;",
   "const n=Math.min(target.card[stat],"+stepExpr+");target.card[stat]-=n;lost[stat]+=n;",
   'passive per level extra extraction');
  code=patch(code,
   "const level=dataOf(creature).level,normal=20+5*level,budget=Math.floor(normal*2.5);",
   "const level=dataOf(creature).level,normal=20+5*level,budget=Math.floor(normal*2.5*("+multiplier+"));",
   'player active raid actual ATK/DEF loss');
  code=patch(code,
   "const level=dataOf(creature).level,budget=Math.floor((20+5*level)*2.5);",
   "const level=dataOf(creature).level,budget=Math.floor((20+5*level)*2.5*("+multiplier+"));",
   'symmetric research raid actual ATK/DEF loss');
 }
 return code;
}
module.exports={MODES,mode,transform,tuning};
