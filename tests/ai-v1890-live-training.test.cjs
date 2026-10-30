'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const v=require('./helpers/research-ai-v189.cjs');
test('Two explicit current-live-rules AI cohorts, no stacked Guardian research stat changes',{skip:!process.env.ARCANE_V1890_COHORT},()=>{
 assert.deepEqual(v.MODES,['baseline','optimized']);
 assert.equal(process.env.ARCANE_RESEARCH_GUARDIAN_STATS_V178,'control');
 assert.equal(process.env.ARCANE_RESEARCH_BALANCE_V169,'control10');
 assert.ok(v.MODES.includes(v.mode()));
 const src=fs.readFileSync('tests/ai-v1890-selfplay.cjs','utf8');
 assert.match(src,/const balance=require\('\.\/helpers\/research-ai-v188\.cjs'\)\.mode\(\);/);
 assert.match(src,/balance==='optimized'\?require/);
 assert.match(src,/defenderCriticalReplyPlanner:\.82/);
 assert.match(src,/defenderBondPlanner:\.96/);
 assert.match(src,/tacticalCorrection\+=correction\*\.87/);
 assert.match(src,/guardianV178Setup/);
 assert.match(src,/defenderTacticalOverride:true/);
 assert.match(src,/v1890TacticalOverrides/);
 assert.match(src,/v1890LegalTrials/);
 assert.match(src,/v1890FinisherOverrides/);
 assert.match(src,/v1890DecisionTraces/);
 assert.match(src,/priorImmediateWin/);
 assert.match(src,/SafeFinisherKept/);
 assert.match(src,/checked2\+\+>=6/);
 const k=require('./helpers/ai-v1890-mechanics.cjs');
 assert.ok(k.verifySources().verified>=35);
 assert.match(k.plannerSource,/baseApply\(z,move\)/);
 assert.match(k.plannerSource,/const direct=attackMoves.filter/);
 assert.match(k.plannerSource,/v1890EndTurnChecks/);
 assert.match(k.plannerSource,/v1890ThirdActionTrials/);
 assert.match(src,/v1890ThirdActionTrials:m\.stats\.v1890ThirdActionTrials/);
 assert.match(k.plannerSource,/\.\.\.soulMoves/);
 assert.match(k.plannerSource,/urgent\?16:10/);
 assert.match(k.plannerSource,/tries\+\+>=24/);
 assert.match(k.plannerSource,/\["guardian","soul"\]\.includes\(scene\.candidateRole\)/);
 assert.match(k.plannerSource,/research.*action executor/);
 assert.doesNotMatch(k.plannerSource,/follow\.active=opp/);

 assert.match(src,/v1890SequenceFinishers/);
 assert.match(src,/v1890SequenceTrials/);
 assert.match(src,/expectedVisibleReply/);
 assert.match(src,/const secondTo=/);
 const part=src.slice(src.indexOf('const tacticalLines=['),src.indexOf('const tacticalAnchor='));
 assert.doesNotMatch(part,/response\.active=op/);
 assert.match(src,/z\.winner===me/);
 assert.match(src,/attackerUid:own\.field\[best\.ai\]/);
 assert.match(src,/visible-finisher/);
 assert.match(src,/safe-threat-removal/);
 assert.match(src,/if\(!attack\(z,move\.ai,move\.di\)\)return null/);
 assert.match(src,/stage===8\?760:stage===9\?320:0/);
 assert.match(src,/ai-v1890-mechanics-control/);
 assert.match(src,/ai-v1890-mechanics\.cjs/);
});
test('Production catalogue has 762 cards and 84 Guardian reweights at 95%-22/78',()=>{
 const b=boot({seed:18800042}).run(`({
  cards:CARDS.length,guardians:window.ArcaneGuardianBalanceV212,
  soloGuardian:CARDS.filter(c=>c.rpg&&c.role==='guardian'&&!c.fusionOnly&&!c.ace&&!c.essenceMonster&&!c.retired&&c.level>=1&&c.level<=10)
   .map(c=>({atk:c.atk,def:c.def,level:c.level}))
 })`);
 assert.equal(b.cards,762);
 assert.ok(b.guardians.changed>=84);
 assert.equal(b.guardians.pool,.95);assert.equal(b.guardians.atkShare,.22);
 assert.ok(b.soloGuardian.length>=84);
 assert.ok(b.soloGuardian.every(c=>c.atk>0&&c.def>0));
});
test('Control10 research helper is genuinely no-op and matches live unchanged essence rules',()=>{
 const combat=fs.readFileSync('assets/essence-combat.js','utf8');
 const before=require('./helpers/research-role-balance-v169.cjs').transform(combat,'control10');
 assert.equal(before,combat);
 assert.match(combat,/const counter= Math.floor\(Math.max\(0,dataOf\(d\).atk\)\*\.35\);/);
});
test('No leaked VALIDATION/HOLDOUT training and frozen Champion promotion remains gated',()=>{
 const a=fs.readFileSync('tests/ai-v1890-aggregate.cjs','utf8');
 const e=fs.readFileSync('tests/ai-v1890-endgame-posttrain.cjs','utf8');
 const c=fs.readFileSync('tests/ai-v1890-compare.cjs','utf8');
 assert.match(a,/ai-v1600-aggregate/);
 assert.match(e,/validationUsed/);assert.match(e,/holdoutUsed/);
 assert.match(c,/promotedAutomatically=false/);
 assert.match(c,/winnerChanged/);
});
