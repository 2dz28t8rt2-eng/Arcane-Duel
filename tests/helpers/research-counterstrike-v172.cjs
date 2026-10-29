'use strict';
/* Offline-only 17.2 counterstrike ablation. Never changes live Solo assets.
 * Preserve current selected 15/90/100/120 drain and pierce. Research cohorts:
 * legacy50: 50% retaliation even when DEF monster dies, old 100% Guardian heal;
 * survivor35: shipped 35% only if surviving, old 100% Guardian heal;
 * survivor35Heal85: shipped 35% only if surviving, Guardian->Guardian 85%.
 */
const assert=require('node:assert/strict');
const MODES=Object.freeze(['legacy50','survivor35','survivor35Heal85']);
function mode(){
 const s=process.env.ARCANE_RESEARCH_COUNTERSTRIKE_V172||'';
 if(!MODES.includes(s))throw Error('v17.2 explicit counterstrike research mode required');
 return s;
}
function tuning(s){
 if(!MODES.includes(s))throw Error('Unknown v17.2 counterstrike mode '+s);
 return Object.freeze({counterRate:s==='legacy50'?.50:.35,
  requireSurvivor:s!=='legacy50',
  guardianHealToGuardian:s==='survivor35Heal85'?.85:1,
  guardianHealToSoul:1});
}
function swapOnce(text,before,after,label){
 assert.equal(text.split(before).length,2,'v17.2 failed closed: '+label);
 return text.replace(before,after);
}
function transform(code,s){
 const p=tuning(s);
 if(s==='legacy50'){
  code=swapOnce(code,
   "const counter=isDefender(d.c)&&canCounter?Math.floor(Math.max(0,dataOf(d.c).atk)*.35):0;",
   "const counter=isDefender(d.c)?Math.floor(Math.max(0,dataOf(d.c).atk)*.5):0;",
   'AI counter prediction');
  code=swapOnce(code,
   "if(isDefender(d)&&!immuneBefore&&!endDefense&&q.field[di]===d){\n    const counter= Math.floor(Math.max(0,dataOf(d).atk)*.35);",
   "if(isDefender(d)&&!immuneBefore){\n    const counter= Math.floor(Math.max(0,dataOf(d).atk)*.5);",
   'old damage on destroyed defenders');
 }else{
  assert.ok(code.includes("if(isDefender(d)&&!immuneBefore&&!endDefense&&q.field[di]===d){"),
   'new 35% survivor-only code changed');
  assert.ok(code.includes("const counter= Math.floor(Math.max(0,dataOf(d).atk)*.35);"),
   'new 35% counter formula changed');
 }
 if(p.guardianHealToGuardian!==1){
  const heal=require('./research-guardian-heal-v171.cjs');
  code=heal.transform(code,'guardian85');
 }
 return code;
}
module.exports={MODES,mode,tuning,transform};
