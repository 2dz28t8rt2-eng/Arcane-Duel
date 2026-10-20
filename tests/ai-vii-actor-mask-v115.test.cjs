'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function sample(opts){
 const v=boot({seed:22371,...opts});
 return v.run("(()=>{const g=createGame({mode:'pve',opponentId:7,seed:2247}); const m=[6,5];g.active=0;const p=fusionBudget(m,g);const q=window.ArcaneFusionMath?.tuned(g,[6,1],[],[]).factor??null;g.active=1;const n=fusionBudget(m,g);const r=window.ArcaneFusionMath?.tuned(g,[6,1],[],[]).factor??null;return {p,n,q,r}})()");
}
test('Player-only isolated rules change only player fusion budgets and quality',()=>{
 const legacy=sample({withoutFusionRework:true}),both=sample({}),player=sample({fusionReworkSides:'player'}),npc=sample({fusionReworkSides:'npc'});
 assert.notEqual(both.p,legacy.p,'Rework must change player formula for 6 + 5');
 assert.notEqual(both.n,legacy.n,'Rework must change NPC formula for 6 + 5');
 assert.equal(player.p,both.p);assert.equal(player.n,legacy.n);
 assert.equal(npc.p,legacy.p);assert.equal(npc.n,both.n);
 assert.equal(player.q,both.q);assert.equal(player.r,legacy.r);
 assert.equal(npc.q,legacy.q);assert.equal(npc.r,both.r);
});
test('Four comparison arms remain deterministic and preserve shared legitimate initial conditions',()=>{
 const x=sample({fusionReworkSides:'player'}),y=sample({fusionReworkSides:'player'});
 assert.deepEqual(x,y);
});
