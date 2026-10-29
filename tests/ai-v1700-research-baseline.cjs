'use strict';
/**
 * Arcane Duel v17.0 research baseline (selection only).
 * Deliberately does NOT modify production combat rules or automatically
 * start the high-volume v16.9 workflow.
 *
 * The agreed target is a synergy game: single-role Guardian/Soul decks should
 * be vulnerable to Predators; linked mixed decks should remain competitive.
 * Further balancing requires outcomes on seat-swapped, seed-matched duels,
 * not automatically granting direct role boosts.
 */
const assert=require('node:assert/strict');
const existing=require('./helpers/research-role-balance-v169.cjs');
const selectedVariant='predator15Triad90';
const selected=existing.tuning(selectedVariant);
assert.deepEqual(
 {pierce:selected.pierce,predator:selected.predator,fusion:selected.fusion},
 {pierce:.15,predator:.90,fusion:1.20});
assert.ok(existing.MODES.includes(selectedVariant));
const researchBaseline=Object.freeze({
 schema:'arcane-duel-research-baseline-v17.0',
 selectedVariant,
 researchEnv:Object.freeze({ARCANE_RESEARCH_BALANCE_V169:selectedVariant}),
 targetRules:Object.freeze({
   predatorArmorPiercePercentagePoints:15,
   soulDrainVsUnfusedPredatorPercent:90,
   soulDrainVsUnfusedGuardianPercent:100,
   soulDrainVsUnfusedSoulPercent:100,
   soulDrainVsOtherOrdinaryPercent:100,
   soulDrainVsTrueFusionPercent:120,
   trueFusionPrecedenceOverRole:true,
   essenceStoredFromActuallyDrainedStats:true,
   additionalStoredEssenceMultiplier:1,
   activeSoulAbilitiesRequireDEF:true
 }),
 designGoal:'Predators pressure isolated Guardians/Soul Eaters, but do not overwhelm linked mixed Defender decks.',
 productionChanges:false,
 autoPromoteChampion:false,
 autoStartTraining:false
});
module.exports={researchBaseline,selectedVariant};
if(require.main===module)console.log('ARCANE_V1700_RESEARCH_BASELINE_SELECTED '+JSON.stringify(researchBaseline));
