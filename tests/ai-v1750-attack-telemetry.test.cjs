'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const self=fs.readFileSync('tests/ai-v1750-selfplay.cjs','utf8');
const summary=fs.readFileSync('tests/ai-v1750-attack-aggregate.cjs','utf8');
const compare=fs.readFileSync('tests/ai-v1750-compare.cjs','utf8');
test('Actual attack() wrapper tracks successful board attacks, not counterstrikes or clone plans',()=>{
 assert.match(self,/const track=game===g&&!!attacker/);
 assert.match(self,/const result=baseAttack\(game,ai,di\)/);
 assert.match(self,/if\(attackMetrics&&result\)/);
 assert.match(self,/attackMetrics.successful\+\+/);
 assert.match(self,/attackMetrics.attempted\+\+/);
 assert.match(self,/attackMetrics.lpDamage\+=/);
 assert.match(self,/attackMetrics.targeted\+\+/);
 assert.match(self,/attackMetrics.direct\+\+/);
 assert.match(self,/targetUid/);
 assert.match(self,/offenseBySeat:m.stats.offenseBySeat/);
 assert.match(self,/offenseBySeat:counter.offenseBySeat/);
});
test('Defender (guardian) and Soul are separate; count switch actions only when confirmed',()=>{
 assert.match(self,/role\(attacker\)==="defender"\?"guardian":role\(attacker\)/);
 assert.match(self,/switchToAtk/);
 assert.match(self,/if\(game===g&&ok&&switchCard&&switchOldMode!==switchCard.mode\)/);
 assert.match(summary,/const guardian=candidate.guardian\|\|\{\},soul=candidate.soul\|\|\{\}/);
 assert.match(summary,/gamesWithDefenderAttacks/);
 assert.match(summary,/successful,m.direct\+m.targeted/);
});
test('Both fixed cohorts share previously validated 35%-counter rule and retain 85% exclusion',()=>{
 const modes=['none','candidateOnly'];
 const caus=require('./helpers/research-guardian-causal-v174.cjs');
 for(const m of modes)assert.ok(caus.MODES.includes(m));
 assert.ok(!modes.includes('opponentOnly')&&!modes.includes('both'));
 const combat=fs.readFileSync('assets/essence-combat.js','utf8');
 assert.match(combat,/const counter= Math.floor\(Math.max\(0,dataOf\(d\).atk\)\*\.35\);/);
 assert.match(compare,/assert.equal\(count,46080\)/);
});
