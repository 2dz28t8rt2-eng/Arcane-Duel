'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const v=require('./helpers/research-ai-v179.cjs');
test('Two explicit current-live-rules AI cohorts, no stacked Guardian research stat changes',{skip:!process.env.ARCANE_V1790_COHORT},()=>{
 assert.deepEqual(v.MODES,['baseline','optimized']);
 assert.equal(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V178,'control');
 assert.equal(process.env.ARCANE_RESEARCH_BALANCE_V169,'control10');
 assert.ok(v.MODES.includes(v.mode()));
 const src=fs.readFileSync('tests/ai-v1790-selfplay.cjs','utf8');
 assert.match(src,/const balance=require\('\.\/helpers\/research-ai-v179\.cjs'\)\.mode\(\);/);
 assert.match(src,/if\(balance==='optimized'\)/);
 assert.match(src,/defenderCriticalReplyPlanner:\.82/);
 assert.match(src,/defenderBondPlanner:\.96/);
 assert.match(src,/tacticalCorrection\+=correction\*\.87/);
 assert.match(src,/guardianV178Setup/);
});
test('Production has 762 cards: 84 preexisting plus seven transferred Guardians at 95%-22/78',()=>{
 const b=boot({seed:17900042}).run(`({
  cards:CARDS.length,guardians:window.ArcaneGuardianBalanceV212,
  soloGuardian:CARDS.filter(c=>c.rpg&&c.role==='guardian'&&!c.fusionOnly&&!c.ace&&!c.essenceMonster&&!c.retired&&c.level>=1&&c.level<=10)
   .map(c=>({atk:c.atk,def:c.def,level:c.level}))
 })`);
 assert.equal(b.cards,762);
 assert.equal(b.guardians.changed,84);
 assert.equal(b.guardians.pool,.95);assert.equal(b.guardians.atkShare,.22);
 assert.equal(b.soloGuardian.length,91);
 assert.ok(b.soloGuardian.every(c=>c.atk>0&&c.def>0));
});
test('Control10 research helper is genuinely no-op and matches live unchanged essence rules',()=>{
 const combat=fs.readFileSync('assets/essence-combat.js','utf8');
 const before=require('./helpers/research-role-balance-v169.cjs').transform(combat,'control10');
 assert.equal(before,combat);
 assert.match(combat,/const counter= Math.floor\(Math.max\(0,dataOf\(d\).atk\)\*\.35\);/);
});
test('No leaked VALIDATION/HOLDOUT training and frozen Champion promotion remains gated',()=>{
 const a=fs.readFileSync('tests/ai-v1790-aggregate.cjs','utf8');
 const e=fs.readFileSync('tests/ai-v1790-endgame-posttrain.cjs','utf8');
 const c=fs.readFileSync('tests/ai-v1790-compare.cjs','utf8');
 assert.match(a,/ai-v1600-aggregate/);
 assert.match(e,/validationUsed/);assert.match(e,/holdoutUsed/);
 assert.match(c,/promotedAutomatically=false/);
 assert.match(c,/winnerChanged/);
});
