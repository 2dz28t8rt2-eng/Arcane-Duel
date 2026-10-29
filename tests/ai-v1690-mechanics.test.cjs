'use strict';
/* v16.9 research rule verification: evaluate expressions taken from the
 * actual VM patch output, not separate formulas typed into the test.
 * Fusion takes priority over Predator; other defenders remain neutral.
 */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {MODES,transform,mode,tuning}=require('./helpers/research-role-balance-v169.cjs');
const src=fs.readFileSync('assets/essence-combat.js','utf8');
assert.equal(MODES.length,6);
const roleOf=t=>t.roleOverride||t.role||'combatant';
function once(text,regex,desc){
 const all=[...text.matchAll(regex)];assert.equal(all.length,1,desc+' match '+all.length);
 return all[0][1];
}
function simulatePassive(code,target,level=5){
 const a=once(code,/const n=Math\.min\(target\.card\[stat\],([^;\n]+)\);\s*target\.card\[stat\]-=n;lost\[stat\]\+=n;\s*}\s*for\(let i=0;i<lv;i\+\+\)/g,'base passive expression');
 const b=once(code,/const n=Math\.min\(target\.card\[stat\],([^;\n]+)\);target\.card\[stat\]-=n;lost\[stat\]\+=n;/g,'level passive expression');
 const take=Function('target','stat','i','roleOf','return Math.min(target.card[stat],'+a+');');
 const extra=Function('target','stat','i','roleOf','return Math.min(target.card[stat],'+b+');');
 let t={...target,card:{atk:10000,def:10000}},removed=0;
 for(const stat of ['atk','def']){let n=take(t,stat,0,roleOf);t.card[stat]-=n;removed+=n;}
 for(let i=0;i<level;i++){
  let n=extra(t,'atk',i,roleOf);t.card.atk-=n;removed+=n;
 }
 return removed;
}
function simulateRaid(code,kind,target){
 const expr=kind==='player'?
  once(code,/const level=dataOf\(creature\)\.level,normal=20\+5\*level,budget=([^;\n]+);/g,'player raid'):
  once(code,/const level=dataOf\(creature\)\.level,budget=([^;\n]+);/g,'research raid');
 return Function('target','roleOf','level','normal','return '+expr)(target,roleOf,5,45);
}
const fusedPredator={fusion:true,role:'predator'},predator={fusion:false,role:'predator'},
 guardian={fusion:false,role:'guardian'},soul={fusion:false,role:'soul'},weaver={fusion:false,role:'weaver'};
for(const m of MODES){
 const c=transform(src,m),t=tuning(m),expected={
  fusion:t.fusion===1?45:54,
  predator:t.predator===.8?36:t.predator===.9?41:45,
  regular:45,
  fusionRaid:t.fusion===1?112:135,
  predatorRaid:t.predator===.8?90:t.predator===.9?101:112
 };
 for(const [label,target,want] of [
  ['fusion',fusedPredator,expected.fusion],
  ['predator',predator,expected.predator],
  ['guardian',guardian,expected.regular],
  ['soul',soul,expected.regular],
  ['weaver',weaver,expected.regular]]){
  assert.equal(simulatePassive(c,target),want,m+' passive '+label);
 }
 for(const kind of ['player','research']){
  for(const [label,target,want] of [
   ['fusion',fusedPredator,expected.fusionRaid],
   ['predator',predator,expected.predatorRaid],
   ['guardian',guardian,112],['soul',soul,112],['weaver',weaver,112]])
    assert.equal(simulateRaid(c,kind,target),want,m+' '+kind+' '+label);
 }
 // Stored essence is exactly what was actually drained, subject only to cap.
 assert.ok(c.includes('const gain=storeDrainedEnergy(g,creature,owner,earned);'));
 assert.ok(c.includes('const gained=storeDrainedEnergy(game,creature,0,actual);'));
 assert.ok(c.includes('layer.raidCooldown=3;'));
 assert.ok(c.includes("if(!creature||!isSoul(creature)||creature.mode!=='def')return false;"),'must preserve current research DEF-only legality');
 assert.ok(c.includes("if(!creature||!isSoul(creature)||creature.mode!=='def')return false;"),'DEF-only check');
 const has15=c.includes("const predatorPierce=roleOf(a)==='predator'?.15:0;");
 assert.equal(has15,t.pierce===.15);
 console.log('ARCANE_V1690_FORMULAS_VERIFIED '+JSON.stringify({mode:m,pierce:t.pierce,passive:expected,actualActiveRaidPredator:expected.predatorRaid,neutral:112}));
}
// Distinguish no-flag ordinary from true fusion and prevent unintended mode calls.
if(process.env.ARCANE_RESEARCH_BALANCE_V169)
 assert.equal(mode(),process.env.ARCANE_RESEARCH_BALANCE_V169);
else assert.throws(()=>mode(),/explicit research variant/);
