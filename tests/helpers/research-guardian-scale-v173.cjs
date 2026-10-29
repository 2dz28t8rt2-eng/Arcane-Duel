'use strict';
/* v17.3 offline-only Guardian healing stack ablation:
 * Count ONLY active DEF Guardians, and apply their shared rate to each
 * distinct, eligible DEF Defender recipient. Never heal the source itself.
 * Control 100% and requested 100/55/40/33/28% scale have identical other rules.
 */
const assert=require('node:assert/strict');
const MODES=Object.freeze(['control100','guardianScale']);
const PERCENT=Object.freeze([0,100,55,40,33,28]);
function mode(){
 const name=process.env.ARCANE_RESEARCH_GUARDIAN_SCALE_V173||'';
 if(!MODES.includes(name))throw Error('v17.3 explicit guardian scale cohort required');
 return name;
}
function fraction(guardians,variant){
 if(!MODES.includes(variant))throw Error('Invalid guardian scale variant');
 if(!Number.isInteger(guardians)||guardians<0||guardians>5)throw Error('Guardian count must be 0..5');
 return variant==='control100'?(guardians?1:0):PERCENT[guardians]/100;
}
function swapOnce(src,oldText,newText,name){
 assert.equal(src.split(oldText).length,2,'v17.3 fail closed, healing anchor changed: '+name);
 return src.replace(oldText,newText);
}
function transform(src,variant){
 if(!MODES.includes(variant))throw Error('Invalid guardian scale variant');
 const anchor="for(const guardian of team.filter(c=>roleOf(c)==='guardian'&&c.mode==='def')){";
 const heal="const layer=statLayer(ally),amount=Math.min(150,25+dataOf(guardian).level*12);";
 assert.equal(src.split(anchor).length,2,'v17.3 original guardian loop changed');
 assert.equal(src.split(heal).length,2,'v17.3 original healing formula changed');
 assert.ok(src.includes("const allies=team.filter(c=>isDefender(c)&&c.mode==='def');"));
 assert.ok(src.includes('if(ally===guardian||!ally.card)continue;'));
 if(variant==='control100')return src;
 src=swapOnce(src,anchor,
  "const healingGuardians=team.filter(c=>roleOf(c)==='guardian'&&c.mode==='def');\n"+
  "   const guardianHealScale=[0,1,.55,.40,.33,.28][Math.min(5,healingGuardians.length)];\n"+
  "   for(const guardian of healingGuardians){",
  'count only healing DEF guardians');
 src=swapOnce(src,heal,
  "const layer=statLayer(ally),baseHeal=Math.min(150,25+dataOf(guardian).level*12),amount=Math.floor(baseHeal*guardianHealScale);",
  'scale actual amount, preserve cap and max DEF');
 return src;
}
module.exports={MODES,PERCENT,mode,fraction,transform};
