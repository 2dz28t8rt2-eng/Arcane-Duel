'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('v11.9 handbook loads after v11.8 mechanics with a read-only current monster catalog',()=>{
 const vm=boot({seed:119});
 const x=vm.run("(()=>{const m=window.ArcaneHandbook119;return {version:m.version,count:m.catalog().length,owned:m.catalog().filter(m.seen).length,types:[...new Set(m.catalog().map(m.typeOf))],decay:m.decay,pveTitle:UPGRADES.resilience.desc}})()");
 assert.equal(x.version,'11.9.0');assert.ok(x.count>80,'Catalog should span late game, not only early active IDs');
 assert.ok(x.owned>0);assert.ok(x.types.includes('fusion')&&x.types.includes('normal'));
 assert.deepEqual(x.decay,[20,25,30,40,55,65,80,105,135,170]);
 assert.match(x.pveTitle,/10 % pro Rang/);assert.match(x.pveTitle,/maximal 20 %/);
});
test('reading rulebook and checking current card catalog does not change saved progress',()=>{
 const vm=boot({seed:121});
 const before=vm.run("JSON.stringify({coins:profile.coins,inventory:profile.inventory,upgrades:profile.upgrades,cleared:profile.cleared})");
 const report=vm.run("(()=>{showRules();const b=window.ArcaneHandbook119;return {cardCount:b.catalog().length,discovered:b.catalog().filter(b.seen).length};})()");
 assert.ok(report.cardCount>report.discovered);
 assert.equal(vm.run("JSON.stringify({coins:profile.coins,inventory:profile.inventory,upgrades:profile.upgrades,cleared:profile.cleared})"),before);
});
test('hidden quest cards never appear unearned and the lexicon includes owned late game and ACE cards',()=>{
 const vm=boot({seed:129});
 const facts=vm.run("(()=>{const m=window.ArcaneHandbook119;const catalog=m.catalog();return {questLeaks:catalog.filter(c=>c.questOnly&&!m.seen(c)).length,lateCount:catalog.filter(c=>c.level>=8&&!c.fusionOnly).length,lateFusion:catalog.filter(c=>c.level>=8&&c.fusionOnly).length,aceCount:catalog.filter(c=>c.ace).length};})()");
 assert.equal(facts.questLeaks,0);assert.ok(facts.lateCount>0);assert.ok(facts.lateFusion>0);assert.ok(facts.aceCount>0);
});
