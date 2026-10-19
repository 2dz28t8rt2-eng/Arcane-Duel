'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=s=>boot({seed:9925}).run(s,120000);
test('all 10 opponents have explicit bounded candidate and material budgets',()=>{
 const r=run('({budgets:Object.values(ArcaneAiLearning56.limits),active:ArcaneAiLearning56.active(),names:FATE_NAMES})');
 assert.equal(r.active,false,'training must not silently change player games');
 assert.equal(r.budgets.length,10);
 assert.ok(r.budgets.every(x=>x.alternatives>=2&&x.alternatives<=15&&x.materials<=3));
 assert.equal(r.names[1],'Himmlischer Löwenwächter');
});
test('only fully legal hand options from actual own cards and fusion templates are evaluated',()=>{
 const r=run(`(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:9,seed:20412});g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;const opts=ArcaneAiLearning56.legalCandidates(g),p=g.players[1];return {count:opts.length,normal:opts.filter(o=>o.action.type==='normal').length,illegal:opts.filter(o=>o.action.type==='fusion'&&!p.remainingFusion.includes(o.action.choice)).length,bogus:opts.filter(o=>o.action.type==='normal'&&!p.hand.some(c=>c.uid===o.action.uid)).length,typed:opts.every(o=>o.template&&Number.isFinite(o.template.level))};})()`);
 assert.ok(r.count>0);
 assert.ok(r.normal>0);
 assert.equal(r.illegal,0);
 assert.equal(r.bogus,0);
 assert.equal(r.typed,true);
});
test('score is genuinely sensitive to attack/defense learned weights',()=>{
 const r=run(`(()=>{const g={players:[{field:Array(5).fill(null)},{field:Array(5).fill(null)}]},a={template:{id:1,atk:2000,def:200,level:3},role:'predator',action:{type:'normal'},quality:0,isAce:false,materialCount:1},b={template:{id:2,atk:200,def:2000,level:3},role:'guardian',action:{type:'normal'},quality:0,isAce:false,materialCount:1};const fast={attack:5,defense:0,tempo:1,quality:0,ace:9,cost:0,counter:0},wall={attack:0,defense:5,tempo:1,quality:0,ace:9,cost:0,counter:0};return {attack:ArcaneAiLearning56.score(g,a,fast)>ArcaneAiLearning56.score(g,b,fast),wall:ArcaneAiLearning56.score(g,b,wall)>ArcaneAiLearning56.score(g,a,wall)};})()`);
 assert.equal(r.attack,true);assert.equal(r.wall,true);
});
test('public-field feature calculation never accesses hidden player hand or deck',()=>{
 const r=run(`(()=>{const g={players:[{field:Array(5).fill(null)},{field:Array(5).fill(null)}]};Object.defineProperty(g.players[0],'hand',{get(){throw Error('Hidden human hand read');}});Object.defineProperty(g.players[0],'deck',{get(){throw Error('Hidden human deck read');}});const candidate={template:{id:1,atk:650,def:450,level:2},role:'predator',action:{type:'normal'},quality:0,isAce:false,materialCount:1};return ArcaneAiLearning56.featureVector(g,candidate);})()`);
 assert.ok(r.attack>0&&r.defense>0);
});
test('training weights are checked and sandbox cannot be enabled by an ordinary game session',()=>{
 const r=run(`(()=>{let refused=false;try{ArcaneAiLearning56.setSandbox({attack:-1});}catch(e){refused=true;}const initial=ArcaneAiLearning56.active();ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.predator,true);const during=ArcaneAiLearning56.active();ArcaneAiLearning56.setSandbox(null);return {refused,initial,during,final:ArcaneAiLearning56.active()};})()`);
 assert.deepEqual(r,{refused:true,initial:false,during:true,final:false});
});
test('sandboxed scoring completes legal full AI turns across all 10 opponents',()=>{
 const r=run(`(()=>{const outcomes=[];ArcaneAiLearning56.setSandbox(ArcaneAiLearning56.PRESETS.alchemist,true);for(let tier=1;tier<=10;tier++){const g=createGame({mode:'pve',context:'tournament',opponentId:tier,seed:1093+tier});let failure=null,actions=0;try{for(let i=0;i<8&&g.winner===null;i++){aiTurn(g,'balanced');actions++;}}catch(e){failure=String(e)}outcomes.push({tier,actions,failure});}ArcaneAiLearning56.setSandbox(null);return outcomes;})()`,180000);
 assert.equal(r.length,10);for(const x of r){assert.equal(x.failure,null,'tier '+x.tier+': '+x.failure);assert.ok(x.actions>0);}
});
