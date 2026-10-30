'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {RULES,STRATEGY_NOT_RULES,verifySources,plannerSource}=require('./helpers/ai-v1850-mechanics.cjs');
const {boot}=require('./helpers/game-runtime.cjs');
test('every rule fact has a real code anchor (no assumed rule)',()=>{
 const v=verifySources();assert.ok(v.verified>=35);assert.equal(v.scopes.length,4);
 const ids=new Set(RULES.map(x=>x.id));assert.equal(ids.size,RULES.length);
});
test('v18.5 strategic weights are hypotheses, not numeric combat formulas',()=>{
 assert.ok(Object.keys(STRATEGY_NOT_RULES).length>=10);
 assert.match(plannerSource,/strategyValuesAreRules:false/);
 assert.match(plannerSource,/baseApply\(z,move\)/);
 assert.match(plannerSource,/baseApply\(f,next\)/);
 assert.doesNotMatch(plannerSource,/follow\.active=opp|response\.active=op/);
});
test('real live engine provides attack, fusion and soul research APIs',()=>{
 const b=boot({seed:18500042}).run(`({cards:CARDS.length,guardian:window.ArcaneGuardianBalanceV212,
 functions:[canAttack,attack,applyAiAction,fusionOptions,switchPosition,advanceTurn].every(f=>typeof f==='function'),
 soul:typeof window.ArcaneEssenceCombat?.soulBonds,
 soulAction:typeof window.ArcaneEssenceCombat?.researchSoulAction,
 live:createGame({mode:'pve',opponentId:1}).essenceRules})`);
 assert.equal(b.cards,762);assert.equal(b.functions,true);assert.equal(b.soul,'function');assert.equal(b.soulAction,'function');
 assert.equal(b.guardian.changed,84);assert.equal(b.guardian.pool,.95);assert.equal(b.guardian.atkShare,.22);assert.equal(b.live,true);
});
