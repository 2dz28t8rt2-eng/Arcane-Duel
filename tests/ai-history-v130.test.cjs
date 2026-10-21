'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
const memory=JSON.parse(fs.readFileSync(path.join(__dirname,'../models/ai-policy-history-v130.json'),'utf8'));
test('historical evidence contains separated comparable experiments and never guesses move labels',()=>{
 assert.equal(memory.schema,'arcane-ai-policy-history-v130');
 assert.equal(memory.comparableOnlyWithinSameSchema,true);
 assert.equal(memory.holdoutNeverForTraining,true);
 assert.equal(memory.actionTransitionsAvailable,false);
 assert.equal(memory.modelFit,false);
 assert.ok(memory.history.length>=12);
 assert.equal(new Set(memory.history.map(x=>x.schema)).size,memory.history.length);
 for(const exp of memory.history){
  assert.deepEqual(exp.tiers,[7,8,9,10]);
  assert.equal(exp.actionTransitionsAvailable,false);
  for(const row of Object.values(exp.arms)){
   assert.equal(row.train.length,4);assert.equal(row.holdout.length,4);
   for(const [split,n] of [['train',row.trainCareers],['holdout',row.holdoutCareers]]){
    assert.equal(n,16);
    assert.ok(row[split].every(x=>Number.isInteger(x)&&x>=0&&x<=n));
   }
  }
 }
});
test('IX fallback policy was chosen ONLY from archived training partition',()=>{
 const exp=memory.history.find(x=>x.schema==='arcane-strategic-board-lookahead-v129');
 assert.ok(exp);
 const baseline=exp.arms['tempo-baseline'].train[2],plan=exp.arms['strategic-lookahead'].train[2];
 assert.equal(baseline,10);assert.equal(plan,6);
 assert.equal(memory.strategyGate.tier9.winner,baseline>plan?'tempo-baseline':'strategic-lookahead');
 assert.equal(memory.strategyGate.trainedWith,'train-only-16-origins');
 // Holdout is intentionally evaluated ONLY after the policy is frozen.
 assert.equal(exp.arms['tempo-baseline'].holdout[2],11);
 assert.equal(exp.arms['strategic-lookahead'].holdout[2],7);
});
test('game remains sole authority for live rules, deck legality and X power',()=>{
 for(const difficulty of ['easy','hard']){
  const vm=boot({seed:130110});const r=vm.run(`(()=>{
   const x=rpgEnemyLoadout(10,'${difficulty}');
   const g=createGame({mode:'pve',context:'tournament',opponentId:10,
    difficulty:'${difficulty}',seed:101010});
   return {
    main:x.deck.length, fusions:x.fusionDeck.length,
    power:g.players[1].power,slots:g.players[0].field.length,
    eligibleFusion:!!fusionOptions,canAttackType:typeof canAttack,
    firstTurnCanAttack:canAttack(g,g.players[0].field.find(Boolean)),
    levels:ASCENSION_DECAY_BY_LEVEL.slice(1),
    aceCopies:[...x.deck,...x.fusionDeck].filter(id=>id===ACE_CARD_IDS[10]).length
   };
  })()`);
  assert.equal(r.main,40);assert.ok(r.fusions>=2&&r.fusions<=15);
  assert.equal(r.power,1);assert.equal(r.slots,5);
  assert.equal(r.canAttackType,'function');
  assert.equal(r.firstTurnCanAttack,false);
  assert.equal(r.aceCopies,1);
  assert.equal(r.levels.length,10);
  assert.ok(r.levels[9]>r.levels[2],'high rank must decay faster');
 }
});
