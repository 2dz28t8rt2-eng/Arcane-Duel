'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {RULES,STRATEGY_NOT_RULES,verifySources,plannerSource}=require('./helpers/ai-v1860-mechanics.cjs');
const {boot}=require('./helpers/game-runtime.cjs');
test('every rule fact has a real code anchor (no assumed rule)',()=>{
 const v=verifySources();assert.ok(v.verified>=35);assert.equal(v.scopes.length,4);
 const ids=new Set(RULES.map(x=>x.id));assert.equal(ids.size,RULES.length);
});
test('v18.6 strategic weights are hypotheses, not numeric combat formulas',()=>{
 assert.ok(Object.keys(STRATEGY_NOT_RULES).length>=10);
 assert.match(plannerSource,/strategyValuesAreRules:false/);
 assert.match(plannerSource,/baseApply\(z,move\)/);
 assert.match(plannerSource,/baseApply\(f,next\)/);
 assert.doesNotMatch(plannerSource,/follow\.active=opp|response\.active=op/);
});
test('real live engine provides attack, fusion and soul research APIs',()=>{
 const b=boot({seed:18600042}).run(`({cards:CARDS.length,guardian:window.ArcaneGuardianBalanceV212,
 functions:[canAttack,attack,applyAiAction,fusionOptions,switchPosition,advanceTurn].every(f=>typeof f==='function'),
 soul:typeof window.ArcaneEssenceCombat?.soulBonds,
 soulAction:typeof window.ArcaneEssenceCombat?.researchSoulAction,
 live:createGame({mode:'pve',opponentId:1}).essenceRules})`);
 assert.equal(b.cards,762);assert.equal(b.functions,true);assert.equal(b.soul,'function');assert.equal(b.soulAction,'function');
 assert.equal(b.guardian.changed,84);assert.equal(b.guardian.pool,.95);assert.equal(b.guardian.atkShare,.22);assert.equal(b.live,true);
});

test('v18.6 planner must not touch non-defender strategy, reward or actions',()=>{
 const fn=new Function('game','g','learner','scene','counter','baseChoose','baseApply',
   'policy','canAttack','window','dataOf','role',plannerSource);
 const sample=role=>{
  const g={active:0,winner:null,pending:null,aiPhase:'attacks',
   players:[{field:[]},{field:[]}]};
  const counter={};let calls=0,actions=0;
  fn(g,g,0,{studyStage:8,candidateRole:role,rolePolicy:{defenderTacticalOverride:true}},
   counter,()=>{calls++;return null;},()=>{actions++;return null;},
   'balanced',()=>false,{},()=>({}),()=>role);
  return {calls,actions,counter};
 };
 for(const role of ['predator','fusion','allrounder','resonator','combatant']){
  const {calls,actions,counter}=sample(role);
  assert.equal(calls,0,role+' must not run planner');
  assert.equal(actions,0,role+' must not preview any action');
  assert.equal(counter.v1860TacticalChecks,undefined,role+' must not change stats');
 }
 for(const role of ['guardian','soul']){
  const {calls,actions,counter}=sample(role);
  assert.equal(calls,1,role+' should still enter');
  assert.equal(actions,0);
  assert.equal(counter.v1860TacticalChecks,1);
 }
});

test('v18.6: control is v18.5 identical and optimized priorities are bounded & legal',()=>{
 const control=require('./helpers/ai-v1860-mechanics-control.cjs').plannerSource;
 const variant=require('./helpers/ai-v1860-mechanics.cjs').plannerSource;
 assert.match(control,/const a=st.players\[me\],e=st.players\[op\],moves=\[\]/);
 assert.match(control,/checks\+\+>=8/);
 assert.match(control,/tries\+\+>=18/);
 assert.match(variant,/const direct=attackMoves.filter/);
 assert.match(variant,/\.\.\.soulMoves,\.\.\.targeted/);
 assert.match(variant,/urgent\?16:10/);
 assert.match(variant,/checks\+\+>=budget/);
 assert.match(variant,/tries\+\+>=24/);
 assert.match(variant,/\["guardian","soul"\]\.includes\(scene.candidateRole\)/);
 assert.match(variant,/baseApply\(z,move\)/);
 assert.match(variant,/baseApply\(f,next\)/);
 assert.doesNotMatch(variant,/follow\.active=opp|response\.active=op/);
});
