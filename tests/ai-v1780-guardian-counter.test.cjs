'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const v=require('./helpers/research-guardian-counter-v178.cjs');
function snapshot(cohort){
 const prior=process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V177;
 try{
  process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V177=cohort;
  return boot({seed:17700042}).run('('+function(){
   const id=CARDS.findIndex(c=>c.role==='guardian'&&c.rpg&&!c.essenceMonster&&!c.fusionOnly&&!c.retired&&c.level===5);
   if(id<0)throw Error('Missing real Level-5 Guardian');
   const g=createGame({mode:'pve',opponentId:1,context:'free',seed:173713,
     strategicTraining:{enabled:true,noAttackTurns:0,disableArenaLPDecay:true,symmetricSides:true}});
   g.players[0].power=1;g.players[1].power=1;
   g.players[0].hand=[newInstance(g,id,0)];
   g.players[1].hand=[newInstance(g,id,1)];
   const before=g.players.map(p=>({atk:p.hand[0].card.atk,def:p.hand[0].card.def}));
   const init=window.__guardianV178StartGame(g,0);
   const after=g.players.map(p=>({atk:p.hand[0].card.atk,def:p.hand[0].card.def}));
   // Snapshot counts BEFORE new instances: the shared init object is mutated
   // by the wrapped newInstance for every later summoned eligible card.
   const initialAdjusted=init.adjusted.slice();
   const next=g.players.map((p,owner)=>newInstance(g,id,owner).card);
   const afterSpawnAdjusted=init.adjusted.slice();
   return {before,after,next,initialAdjusted,afterSpawnAdjusted,
     id,model:{atk:CARDS[id].atk,def:CARDS[id].def}};
  }.toString()+')()');
 }finally{if(prior===undefined)delete process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V177;
 else process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V177=prior;}
}
test('Explicit causal 22/78 cohorts route by candidate seat',()=>{
 assert.deepEqual(v.MODES,['control','both22','candidate22','opponent22']);
 for(const owner of [0,1])for(const candidate of [0,1]){
  assert.equal(v.applies('control',owner,candidate),false);
  assert.equal(v.applies('both22',owner,candidate),true);
  assert.equal(v.applies('candidate22',owner,candidate),owner===candidate);
  assert.equal(v.applies('opponent22',owner,candidate),owner!==candidate);
 }
});
test('Actual initial hand and future newly summoned instances are side-isolated',()=>{
 const none=snapshot('control'),both=snapshot('both22'),own=snapshot('candidate22'),enemy=snapshot('opponent22');
 for(const testCase of [none,both,own,enemy]){
  assert.deepEqual(testCase.before,none.before,'Matched original opening before treatment');
  assert.equal(testCase.id,none.id);
 }
 assert.deepEqual(none.after,none.before);
 assert.deepEqual(own.after[1],none.after[1]);
 assert.deepEqual(enemy.after[0],none.after[0]);
 assert.deepEqual(both.after[0],own.after[0]);
 assert.deepEqual(both.after[1],enemy.after[1]);
 assert.ok(own.after[0].atk<own.before[0].atk);
 assert.ok(own.after[0].atk+own.after[0].def<own.before[0].atk+own.before[0].def);
 assert.equal(own.next[0].atk,own.after[0].atk);
 assert.equal(enemy.next[1].atk,enemy.after[1].atk);
 assert.deepEqual(none.initialAdjusted,[0,0]);
 assert.deepEqual(none.afterSpawnAdjusted,[0,0]);
 assert.deepEqual(own.initialAdjusted,[1,0]);
 assert.deepEqual(own.afterSpawnAdjusted,[2,0],'New candidate instance counted once');
 assert.deepEqual(enemy.initialAdjusted,[0,1]);
 assert.deepEqual(enemy.afterSpawnAdjusted,[0,2],'New opponent instance counted once');
 assert.deepEqual(both.initialAdjusted,[1,1]);
 assert.deepEqual(both.afterSpawnAdjusted,[2,2]);
});
test('Counter telemetry distinguishes expected 35% raw and actual LP loss per surviving Guardian',()=>{
 const baseline=fs.readFileSync('assets/essence-combat.js','utf8');
 const patched=v.transformCombat(baseline);
 assert.ok(patched.includes('const beforeCounterLP=p.lp;const actual=damagePlayer(g,p.id,counter)'));
 assert.ok(patched.includes('cm.counterRaw[typ][q.id]+=counter'));
 assert.ok(patched.includes('cm.counterWaste[typ][q.id]+=Math.max(0,counter-actual)'));
 assert.ok(patched.includes('cm.counterAtk[typ][q.id]+=dataOf(d).atk'));
 assert.ok(patched.includes('cm.counterZeroLP[typ][q.id]+=Number(actual===0)'));
 assert.ok(!baseline.includes('cm.counterRaw'));
 assert.equal(v.MODES.length,4);
 assert.deepEqual([0,1].map(seat=>v.applies('candidate22',seat,0)),[true,false]);
 assert.deepEqual([0,1].map(seat=>v.applies('opponent22',seat,0)),[false,true]);
 const runner=fs.readFileSync('tests/ai-v1780-selfplay.cjs','utf8');
 assert.ok(runner.includes('stage===8?320:stage===9?130:0'));
});
test('Counter and survival instrumentation is injected exclusively offline',()=>{
 const src=fs.readFileSync('assets/essence-combat.js','utf8');
 const dst=v.transformCombat(src);
 assert.notEqual(src,dst);
 assert.ok(dst.includes('g.__guardianV178Combat'));
 assert.ok(dst.includes('met.survived[q.id][typ]++'));
 assert.ok(dst.includes('g.__guardianV178Combat.counter[t'));
 assert.ok(src.includes('const counter= Math.floor(Math.max(0,dataOf(d).atk)*.35);'));
 const game=fs.readFileSync('assets/game.js','utf8');
 assert.ok(!game.includes('__guardianV178StartGame'));
 const runner=fs.readFileSync('tests/ai-v1780-selfplay.cjs','utf8');
 assert.ok(runner.includes('window.__guardianV178StartGame(g,learner)'));
 assert.ok(runner.includes('guardianV177Combat:m.stats.guardianV177Combat'));
 assert.ok(runner.includes('guardianV177Setup:m.stats.guardianV177Setup'));
});
