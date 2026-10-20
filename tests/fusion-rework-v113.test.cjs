'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const inspect=(code,seed=11320)=>boot({seed}).run(code);

test('strict Lv2 early-game ceiling, Lv6 pair and all five cards matter',()=>{
 const a=inspect("(()=>{const f=window.ArcaneFusionRework113;const g=createGame({mode:'pve',opponentId:2,seed:123});return {tiny:f.calculate([2,2],g).level,balanced:f.calculate([6,5],g).level,quality:f.calculate([6,6,5],g).level,filler:f.calculate([6,5,1,1,1],g).level};})()");
 assert.deepEqual(a,{tiny:2,balanced:8,quality:9,filler:8});
});
test('street definition, level and quality independent of input order, giant street has distinct name',()=>{
 const r=inspect("(()=>{const g=createGame({mode:'pve',opponentId:2}),f=window.ArcaneFusionRework113;const a=[2,3,4,5,6],b=[6,5,4,3,2];return {a:f.calculate(a,g),b:f.calculate(b,g),comboA:fusionPattern(a).name,comboB:fusionPattern(b).name,fa:fusionQuality(a).factor,fb:fusionQuality(b).factor,small:fusionPattern([2,3,4]).name,large:fusionPattern([2,3,4,5]).name};})()");
 assert.equal(r.a.level,9);assert.equal(r.b.level,9);
 assert.equal(r.comboA,'Gigantische Straße');assert.equal(r.comboB,'Gigantische Straße');
 assert.equal(r.small,'Kleine Straße');assert.equal(r.large,'Große Straße');
 assert.equal(r.fa,r.fb);
 assert.ok(r.fa>=1.30);
});
test('reordering supplementary material cannot boost the fusion level',()=>{
 const r=inspect("(()=>{const f=window.ArcaneFusionRework113,g=createGame({mode:'pve',opponentId:2});return [[6,5,4,3,2],[2,6,3,4,5],[5,4,3,2,6],[6,2,3,5,4]].map(a=>f.calculate(a,g).level);})()");
 assert.deepEqual(r,[9,9,9,9]);
});
test('real chain Lv6 hand fusion + Lv5 field material can advance to Lv8 and spend both genuine templates',()=>{
 const r=inspect("(()=>{profile=freshProfile();profile.trainingWins=3;const g=createGame({mode:'pve',opponentId:3,seed:1833});game=g;g.active=0;g.turn=3;g.summoned=false;g.pending=null;const p=g.players[0],m=RPG_BASE_CARDS.find(c=>c.level===5&&!c.retired&&!c.enemyOnly&&!c.fusionOnly),f6=RPG_FUSIONS.find(c=>c.level===6&&!c.retired&&!c.enemyOnly),f8=RPG_FUSIONS.find(c=>c.level===8&&!c.retired&&!c.enemyOnly);if(!m||!f6||!f8)throw Error('missing catalog');p.hand=[newInstance(g,m.id,0),newInstance(g,m.id,0)];p.field=[newInstance(g,m.id,0),null,null,null,null];p.fusionDeck=[f6.id,f8.id];p.remainingFusion=[f6.id,f8.id];const preparation=prepareHandFusion(g,p.hand.map(c=>c.uid),f6.id);const lvl=preparation?dataOf(g.pending.card).level:0;const options=preparation?fusionOptions(g,[...g.pending.levels,5],[g.pending.card,p.field[0]]).map(c=>c.level):[];const placed=preparation?placePending(g,0,f8.id):null;return {preparation,lvl,options,placed:!!placed?.fused,nextLevel:placed?dataOf(placed.card).level:null,deck:p.remainingFusion.length,hand:p.hand.length,role:placed?.card.roleOverride||null,validSnapshot:!!validateDuelSnapshot(JSON.parse(JSON.stringify(g)))};})()");
 assert.equal(r.preparation,true,JSON.stringify(r));assert.equal(r.lvl,6);assert.ok(r.options.includes(8),JSON.stringify(r));
 assert.equal(r.placed,true,JSON.stringify(r));assert.equal(r.nextLevel,8);assert.equal(r.deck,0);
 assert.equal(r.hand,0);assert.equal(r.validSnapshot,true);
});
test('chain fusion inherits earned quality with strict cap and no recycled inherited component',()=>{
 const r=inspect("(()=>{const g=createGame({mode:'pve',opponentId:3,seed:1813});const k=RPG_BASE_CARDS.find(c=>c.level===6&&!c.retired&&!c.fusionOnly),v=RPG_FUSIONS.find(c=>c.level===6&&!c.retired);const a=newInstance(g,v.id,0);a.fusion=true;a.fusionHeritage={earnedPct:30,carriedPct:15};const b=newInstance(g,k.id,0);const f=tunedFusionQuality(g,[6,6],[dataOf(a).element,dataOf(b).element],[a,b]);const c={...a,fusionHeritage:{earnedPct:0,carriedPct:15}};const next=tunedFusionQuality(g,[6,6],[dataOf(c).element,dataOf(b).element],[c,b]);return {first:f.heritagePct,second:next.heritagePct,factor:f.factor};})()");
 assert.equal(r.first,10.5);assert.equal(r.second,0);assert.ok(r.factor>1);
});
test('original PvP fusion budgeting remains unchanged',()=>{
 const r=inspect("(()=>{const p=createGame({mode:'pvp',seed:131});return {result:fusionBudget([2,2],p),existing:Math.min(8,4,3)};})()");
 assert.equal(r.result,r.existing);
});
