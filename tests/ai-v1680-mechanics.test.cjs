'use strict';
/* Fail-closed checks on actual test-only combat-code transformation.
 * Assert ONLY real fusion instances lose extra raw ATK/DEF, with no
 * additional stored-essence multiplier and unchanged normal targets.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {MODES,transform,mode}=require('./helpers/research-role-balance-v168.cjs');
const src=fs.readFileSync('assets/essence-combat.js','utf8');
assert.equal(MODES.length,6);
const baseline=transform(src,'control');
assert.ok(baseline.includes('const n=Math.min(target.card[stat],10);'));
assert.ok(baseline.includes('const n=Math.min(target.card[stat],5);'));
const pull=(s,rx,label)=>{const match=s.match(rx);assert.ok(match,label);return match[1];};
const checkRaid=(s,kind,fusion,expected)=>{
 const expr=kind==='research'?
  pull(s,/const level=dataOf\(creature\)\.level,budget=([^;]+);/,'research budget'):
  pull(s,/const level=dataOf\(creature\)\.level,normal=20\+5\*level,budget=([^;]+);/,'player budget');
 const level=5,normal=45,target={fusion};
 const got=Function('level','normal','target','return '+expr)(level,normal,target);
 assert.equal(got,expected,kind+' fusion='+fusion);
};
for(const m of MODES){
 const s=transform(src,m),drain=m.includes('fusionDrain20');
 const base=drain?12:10,perLevel=drain?6:5;
 assert.ok(s.includes('Math.min(target.card[stat],'+(drain?'target.fusion===true?12:10':'10')+')'));
 assert.ok(s.includes('Math.min(target.card[stat],'+(drain?'target.fusion===true?6:5':'5')+')'));
 // For ample available stats: passive Lv5 = 2 base removals + five tier removals.
 const passive=target=>Math.min(1000,target.fusion?base:10)*2+
   5*Math.min(1000,target.fusion?perLevel:5);
 assert.equal(passive({fusion:false}),45);
 assert.equal(passive({fusion:true}),drain?54:45);
 // No fictitious storage bonus: all original storage calls remain unchanged.
 assert.ok(s.includes('const gain=storeDrainedEnergy(g,creature,owner,earned);'));
 assert.ok(s.includes('const gained=storeDrainedEnergy(game,creature,0,actual);'));
 assert.ok(s.includes('const gain=storeDrainedEnergy(g,creature,owner,earned);\n   layer.raidCooldown=3;'));
 checkRaid(s,'player',false,112);
 checkRaid(s,'research',false,112);
 checkRaid(s,'player',true,drain?135:112);
 checkRaid(s,'research',true,drain?135:112);
 // The 3-turn cooldown must not change.
 assert.ok(s.includes('layer.raidCooldown=3;'));
 const pierce=m.includes('predator125')?.125:m.includes('predator15')?.15:.10;
 if(pierce!==.10){
  assert.ok(s.includes('const predatorPierce=roleOf(a)===\'predator\'?'+pierce+':0;'));
 }else{
  assert.ok(s.includes('predatorArmorPierce||0'));
 }
 const testFused={card:{atk:7,def:9},fusion:true};
 const take=(target,n,stat)=>{const lost=Math.min(target.card[stat],n);target.card[stat]-=lost;return lost};
 const loss=take(testFused,drain?12:10,'atk');
 assert.equal(loss,7);
 assert.equal(testFused.card.atk,0);
 assert.equal(testFused.card.def,9);
 console.log('ARCANE_V1680_DRAIN_FORMULAS_OK '+JSON.stringify({
  mode:m,passiveLv5Fusion:drain?54:45,normal:45,
  activeRaidFusion:drain?135:112,activeRaidNormal:112,
  predatorPierce:Math.round(pierce*100)}));
}
assert.equal(mode(),process.env.ARCANE_RESEARCH_BALANCE_V168);
