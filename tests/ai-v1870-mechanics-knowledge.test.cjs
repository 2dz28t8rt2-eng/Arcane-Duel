'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {RULES,STRATEGY_NOT_RULES,verifySources,plannerSource}=require('./helpers/ai-v1870-mechanics.cjs');
const {boot}=require('./helpers/game-runtime.cjs');
test('every rule fact has a real code anchor (no assumed rule)',()=>{
 const v=verifySources();assert.ok(v.verified>=35);assert.equal(v.scopes.length,4);
 const ids=new Set(RULES.map(x=>x.id));assert.equal(ids.size,RULES.length);
});
test('v18.7 strategic weights are hypotheses, not numeric combat formulas',()=>{
 assert.ok(Object.keys(STRATEGY_NOT_RULES).length>=10);
 assert.match(plannerSource,/strategyValuesAreRules:false/);
 assert.match(plannerSource,/baseApply\(z,move\)/);
 assert.match(plannerSource,/baseApply\(f,next\)/);
 assert.doesNotMatch(plannerSource,/follow\.active=opp|response\.active=op/);
});
test('real live engine provides attack, fusion and soul research APIs',()=>{
 const b=boot({seed:18700042}).run(`({cards:CARDS.length,guardian:window.ArcaneGuardianBalanceV212,
 functions:[canAttack,attack,applyAiAction,fusionOptions,switchPosition,advanceTurn].every(f=>typeof f==='function'),
 soul:typeof window.ArcaneEssenceCombat?.soulBonds,
 soulAction:typeof window.ArcaneEssenceCombat?.researchSoulAction,
 live:createGame({mode:'pve',opponentId:1}).essenceRules})`);
 assert.equal(b.cards,762);assert.equal(b.functions,true);assert.equal(b.soul,'function');assert.equal(b.soulAction,'function');
 assert.equal(b.guardian.changed,84);assert.equal(b.guardian.pool,.95);assert.equal(b.guardian.atkShare,.22);assert.equal(b.live,true);
});

test('v18.7 planner must not touch non-defender strategy, reward or actions',()=>{
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
  assert.equal(counter.v1870TacticalChecks,undefined,role+' must not change stats');
 }
 for(const role of ['guardian','soul']){
  const {calls,actions,counter}=sample(role);
  assert.equal(calls,1,role+' should still enter');
  assert.equal(actions,0);
  assert.equal(counter.v1870TacticalChecks,1);
 }
});

test('v18.7: control is frozen v18.6 optimized and v18.7 tracks safe end and third action',()=>{
 const control=require('./helpers/ai-v1870-mechanics-control.cjs').plannerSource;
 const variant=require('./helpers/ai-v1870-mechanics.cjs').plannerSource;
 assert.match(control,/const a=st.players\[me\],e=st.players\[op\],attackMoves=\[\],soulMoves=\[\]/);
 assert.match(control,/urgent\?16:10/);
 assert.match(control,/tries\+\+>=24/);
 assert.match(variant,/const direct=attackMoves.filter/);
 assert.match(variant,/\.\.\.soulMoves,\.\.\.targeted/);
 assert.match(variant,/urgent\?16:10/);
 assert.match(variant,/checks\+\+>=budget/);
 assert.match(variant,/tries\+\+>=24/);
 assert.match(variant,/\["guardian","soul"\]\.includes\(scene.candidateRole\)/);
 assert.match(variant,/baseApply\(z,move\)/);
 assert.match(variant,/baseApply\(f,next\)/);
 assert.match(variant,/v1870EndTurnChecks/);
 assert.match(variant,/v1870ThirdActionTrials/);
 assert.match(variant,/three-action-finisher/);
 assert.doesNotMatch(variant,/follow\.active=opp|response\.active=op/);
});

test('end-rescue requires actual legal win, no future turn or original-state mutation',()=>{
 const fn=new Function('game','g','learner','scene','counter','baseChoose','baseApply',
  'policy','canAttack','window','dataOf','role',plannerSource);
 const g={active:0,winner:null,pending:null,aiPhase:'attacks',players:[
  {lp:1000,shield:0,field:[{uid:1,role:'guardian',mode:'atk',atk:900,def:100,attacked:false}]},
  {lp:500,shield:0,field:[]}]},old=JSON.stringify(g),c={};
 const act=fn(g,g,0,{studyStage:8,candidateRole:'guardian',rolePolicy:{defenderTacticalOverride:true}},
  c,()=>({type:'end'}),(z,a)=>{
    assert.equal(a.type,'attack');const card=z.players[0].field[a.ai];
    if(!card||card.attacked)return false;card.attacked=true;
    z.players[1].lp=Math.max(0,z.players[1].lp-card.atk);
    if(!z.players[1].lp)z.winner=0;return true;
  },'balanced',(z,card)=>!card.attacked,{ArcaneEssenceCombat:{soulBonds:()=>[]}},
  card=>({atk:card.atk,def:card.def}),card=>card.role);
 assert.deepEqual(act,{type:'attack',ai:0,di:null});
 assert.equal(JSON.stringify(g),old);
 assert.equal(c.v1870EndTurnRescues,1);
});
test('bounded third legal action detects three-attacker finisher',()=>{
 const fn=new Function('game','g','learner','scene','counter','baseChoose','baseApply',
  'policy','canAttack','window','dataOf','role',plannerSource);
 const g={active:0,winner:null,pending:null,aiPhase:'attacks',players:[
  {lp:1000,shield:0,field:[0,1,2].map(i=>({uid:i+1,role:'guardian',mode:'atk',atk:100,def:100,attacked:false}))},
  {lp:250,shield:0,field:[]}]},old=JSON.stringify(g),c={};
 fn(g,g,0,{studyStage:8,candidateRole:'guardian',rolePolicy:{defenderTacticalOverride:true}},
  c,()=>({type:'attack',ai:0,di:null}),(z,a)=>{
    if(a.type!=='attack')return false;const card=z.players[0].field[a.ai];
    if(!card||card.attacked)return false;card.attacked=true;
    z.players[1].lp=Math.max(0,z.players[1].lp-100);
    if(!z.players[1].lp)z.winner=0;return true;
  },'balanced',(z,card)=>!card.attacked,{ArcaneEssenceCombat:{soulBonds:()=>[]}},
  card=>({atk:card.atk,def:card.def}),card=>card.role);
 assert.ok(c.v1870ThirdActionTrials>0);
 assert.ok(c.v1870ThreeActionFinders>0);
 assert.equal(JSON.stringify(g),old);
});
