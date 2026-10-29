'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {researchBaseline,selectedVariant}=require('./ai-v1700-research-baseline.cjs');
const {MODES,tuning,transform}=require('./helpers/research-role-balance-v169.cjs');
const fs=require('node:fs');

test('v17.0 uses the user-selected 15pp / 90% / 100% / 120% balance',()=>{
 assert.equal(selectedVariant,'predator15Triad90');
 assert.ok(MODES.includes(selectedVariant));
 assert.deepEqual(tuning(selectedVariant),{pierce:.15,predator:.90,fusion:1.20});
 assert.deepEqual(researchBaseline.researchEnv,{ARCANE_RESEARCH_BALANCE_V169:selectedVariant});
 const r=researchBaseline.targetRules;
 assert.equal(r.predatorArmorPiercePercentagePoints,15);
 assert.equal(r.soulDrainVsUnfusedPredatorPercent,90);
 assert.equal(r.soulDrainVsUnfusedGuardianPercent,100);
 assert.equal(r.soulDrainVsUnfusedSoulPercent,100);
 assert.equal(r.soulDrainVsTrueFusionPercent,120);
 assert.equal(r.trueFusionPrecedenceOverRole,true);
 assert.equal(r.additionalStoredEssenceMultiplier,1);
 assert.equal(r.activeSoulAbilitiesRequireDEF,true);
 assert.equal(researchBaseline.autoStartTraining,false);
 assert.equal(researchBaseline.productionChanges,false);
});
test('v17.0 patches only offline combat, preserves current DEF-only and actual extraction',()=>{
 const source=fs.readFileSync('assets/essence-combat.js','utf8');
 const patched=transform(source,selectedVariant);
 assert.notEqual(source,patched);
 assert.match(patched,/const predatorPierce=roleOf\(a\)==='predator'\?\.15:0/);
 assert.match(patched,/target\.fusion===true\?1\.2:roleOf\(target\)==='predator'\?0\.9:1/);
 assert.match(patched,/roleOf\(target\)==='predator'\?9:10/);
 assert.match(patched,/target\.fusion===true\?6:roleOf\(target\)==='predator'\?\(i%2===0\?5:4\):5/);
 assert.match(patched,/const gained=storeDrainedEnergy\(game,creature,0,actual\);/);
 assert.match(patched,/creature\.mode!=='def'/);
 assert.equal(fs.readFileSync('assets/essence-combat.js','utf8'),source);
});
