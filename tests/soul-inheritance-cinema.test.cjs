'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Soul cinema script and CSS loaded after fusion cinema and before field handlers',()=>{
 const index=read('index.html');
 assert.match(index,/soul-inheritance-cinema\.css\?v=soul-heir-20261017/);
 const main=index.indexOf('fusion-cinema-ritual.js'),soul=index.indexOf('soul-inheritance-cinema.js'),role=index.indexOf('arcane-role-fusions.js');
 assert.ok(main>=0&&soul>main&&role>soul);
});
test('Field snapshots retain consumed soul; inheritance row does not double-count DEF',()=>{
 const role=read('assets/arcane-role-fusions.js'),scene=read('assets/fusion-cinema-ritual.js');
 assert.match(role,/soul:Math\.max\(0,c\.essenceCombat\?\.soul\|\|0\)/);
 assert.match(role,/arcane-synth-charged/);
 assert.match(scene,/const soul=c\.soulInheritance&&c\.soulInheritance\.energy>0/);
 assert.match(scene,/Math\.max\(0,\(math\.bonus\?\.def\|\|0\)-\(soul\?\.defBonus\|\|0\)\)/);
 assert.match(scene,/SEELEN-ERBE/);
});
test('Soul animation is independently skippable and only visual, with CSS concave particles',()=>{
 const s=read('assets/soul-inheritance-cinema.js'),css=read('assets/soul-inheritance-cinema.css'),scene=read('assets/fusion-cinema-ritual.js');
 assert.match(scene,/phases\.run\('Seelen-Erbe'/);assert.match(s,/soul-phase-shatter/);
 assert.match(s,/soul-arc-projectile/);assert.match(css,/\.soul-hidden-orb/);
 assert.match(css,/clip-path:polygon/);assert.match(css,/\.ritual-soul-inherit-line/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotMatch(s,/randomInt|Math\.random|\.card\.atk\s*=|\.card\.def\s*=/);
});
