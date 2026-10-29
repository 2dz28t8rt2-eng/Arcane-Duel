'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const read=p=>fs.readFileSync(path.join(repo,p),'utf8');
test('1/2/3 street survives two added Lv1 materials, poker bonus from best consecutive subset',()=>{
 const r=boot({seed:271}).run("(()=>{const f=window.ArcaneFusionMath.pattern,q=window.ArcaneFusionMath.quality;return {initial:f([1,2,3]),five:f([1,1,1,2,3]),reordered:f([3,1,2,1,1]),four:f([1,1,2,3,4]),giant:f([5,4,3,2,1]),other:f([1,1,1,2,2]),quality:q([1,1,1,2,3])}})()");
 assert.match(r.initial.name,/Kleine Straße/);
 assert.match(r.five.name,/Kleine Straße/);
 assert.deepEqual(r.five,r.reordered,'selection order must not change bonuses');
 assert.equal(r.five.rollBonus,1,'partial street receives genuine 3-card poker rolls');
 assert.equal(r.five.qualityBonus,r.reordered.qualityBonus);
 assert.match(r.four.name,/Große Straße/);
 assert.match(r.giant.name,/Gigantische Straße/);
 assert.match(r.other.name,/Full House/);
 assert.ok(Number.isFinite(r.quality.factor));
});
test('new fusion level still counts all material cards and is order independent',()=>{
 const r=boot({seed:472}).run("(()=>{const f=window.ArcaneFusionRework113;const g=createGame({mode:'pve',opponentId:7,seed:99});return {first:f.calculate([1,1,1,2,3],g).level,last:f.calculate([3,2,1,1,1],g).level};})()");
 assert.equal(r.first,r.last);assert.ok(r.first<=5,'no oversized level from Lv1 filler');
});
test('material cockpit retains stable scroll position, keeps all chip controls',()=>{
 const s=read('assets/summon-stage-v56.js'),css=read('assets/summon-stage-v56.css');
 assert.match(s,/ad117-mat-viewport/);assert.match(s,/previousScroll/);
 assert.match(s,/viewport\.scrollTop/);assert.match(s,/data-ad56-remove/);
 assert.match(css,/height:236px/);assert.match(css,/ad56-mat-list>li/);
});
test('hand entrance animates only newly drawn UIDs with accessibility fallback',()=>{
 const s=read('assets/hand-draw-v1161.js'),css=read('assets/hand-draw-v1161.css');
 assert.match(s,/!last\.ids\[viewer\]\.has\(uid\)/);assert.match(s,/data-hand/);
 assert.match(s,/ids:g\.players\.map\(/);
 assert.doesNotMatch(s,/drawToFive\(/);assert.match(css,/ad117HandArrive/);
 assert.match(css,/prefers-reduced-motion/);
});
test('attacker reaches the victim before player attack commits target destruction',()=>{
 const s=read('assets/game.js');
 const begin=s.indexOf('async function performAttack(');
 const end=s.indexOf('function onEnemySlot(',begin);
 const body=s.slice(begin,end);
 const charge=body.indexOf('ArcaneAttackFX?.play');
 const strike=body.indexOf('const result=attack(g,ai,di)');
 assert.ok(begin>=0&&charge>=0&&strike>charge,'visual charge must run before damage');
 assert.match(body,/busy=true/);
});
