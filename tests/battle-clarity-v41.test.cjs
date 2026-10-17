'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('Large previews remove upper level ornament, keep lower medallion',()=>{
 const css=read('assets/battle-clarity-v41.css');
 assert.match(css,/#duelScreen #largeCardPreview/);
 assert.match(css,/clip-path:polygon\(0 0,37% 0,37% 11%,63% 11%/);
 assert.doesNotMatch(css,/\.ad-level-medallion.*display:none/);
});
test('Roles remain below hand without dot and stronger type',()=>{
 const css=read('assets/battle-clarity-v41.css');
 assert.match(css,/#duelScreen #hand \.ad-hand-role::before/);
 assert.match(css,/font:800 13px\/1\.35/);
 assert.match(css,/content:none!important;display:none!important/);
});
test('Desktop field and cards grow together, no mobile zoom',()=>{
 const css=read('assets/battle-clarity-v41.css');
 assert.match(css,/@media\(min-width:1100px\)/);
 assert.match(css,/max-width:880px!important/);
 assert.match(css,/width:68cqw!important;height:97cqw!important/);
 assert.doesNotMatch(css,/zoom:/);
});
test('Soul energy, cooldown chips and floats present no new gameplay mutations',()=>{
 const js=read('assets/battle-clarity-v41.js'),fx=read('assets/duel-cinematics-v42.js'),actions=read('assets/essence-progression.js');
 assert.match(js,/ad-soul-field-indicator/);
 assert.match(js,/raidCooldown/);
 assert.match(actions,/e\.raidCooldown\?' · ⌛ '/);
 assert.match(fx,/Wächter \+'/);assert.match(fx,/\+' Seele · Entzug'/);
 assert.doesNotMatch(js,/\.card\.(?:atk|def)\s*=|randomInt|Math\.random/);
 const index=read('index.html');
 assert.match(index,/assets\/battle-clarity-v41\.css\?v=roles-scale-status-20261017-1/);
 assert.match(index,/assets\/battle-clarity-v41\.js\?v=roles-scale-status-20261017-1/);
});