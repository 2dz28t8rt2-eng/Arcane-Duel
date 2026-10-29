'use strict';
const assert=require('node:assert/strict');
const {MODES,mode}=require('./helpers/research-role-balance-v169.cjs');
const {boot}=require('./helpers/game-runtime.cjs');
const cohort=process.env.ARCANE_V1700_COHORT;
if(!['cold','learned'].includes(cohort))throw Error('v17.0 requires cold or learned cohort');
if(require('./ai-v1700-research-baseline.cjs').selectedVariant!=='predator15Triad90')throw Error('Unexpected v17.0 research rules');
if(process.env.ARCANE_RESEARCH_BALANCE_V169!=='predator15Triad90')throw Error('v17.0 rule mismatch');

const m=mode(),t=boot({seed:17000042});
assert.equal(MODES.length,6);
const rules=t.run('({n:CARDS.length,bond:typeof window.ArcaneEssenceCombat?.soulBonds,raid:typeof window.ArcaneEssenceCombat?.researchSoulAction,liveRpg:!!createGame({mode:"pve",opponentId:1}).essenceRules})');
assert.ok(rules.n>50&&rules.liveRpg);assert.equal(rules.bond,'function');
assert.equal(rules.raid,'function');
console.log('ARCANE_V1700_V207_RESEARCH_RUNTIME_OK '+JSON.stringify({balance:m,...rules}));
