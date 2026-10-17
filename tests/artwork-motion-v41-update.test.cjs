'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),r=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Arcane Duel user-visible version is consistently 4.1, leaving API/asset versions alone',()=>{
 const html=r('index.html'),collection=r('collection-v3.html'),royal=r('assets/royal-menu.js'),archive=r('assets/arcane-archive.js'),evolution=r('assets/evolution.js');
 assert.match(html,/<title>ARCANE DUEL · 4\.1/);
 assert.match(html,/4\.1 · BESTIARIUM/);
 assert.match(collection,/Arcane Duel 4\.1/);
 assert.match(royal,/4\.1 · BESTIARIUM/);
 assert.match(archive,/ARCANE DUEL 4\.1/);
 assert.match(evolution,/ARCANE DUEL 4\.1/);
 assert.doesNotMatch(html,/Monsterlexikon 3\.0/);
});
test('Special combo bonus travels towards participant while growing and fading',()=>{
 const css=r('assets/fusion-bonus-cinema-v4.css'),js=r('assets/fusion-bonus-cinema-v4.js');
 assert.match(js,/myBanner/);
 assert.match(js,/--ad-bonus-dy/);
 assert.match(css,/translate\(var\(--ad-bonus-dx,0px\),var\(--ad-bonus-dy,120px\)\) scale\(1\.42\)/);
 assert.match(css,/100%\{opacity:0/);
 assert.doesNotMatch(css,/scale\(\.45\)/);
});
test('Three or more fusion materials reduce real impact time to 245ms',()=>{
 const js=r('assets/duel-cinematics-v42.js');
 assert.match(js,/massFusion=\(c\.materialsUsed\|\|0\)>=3/);
 assert.match(js,/landingMs=massFusion\?245:480/);
});
test('All ten approved 4.1 artworks exist as real GH art paths in the committed runtime',()=>{
 const js=r('assets/arcane-v4-live.js'),fix=r('assets/artwork-hotfix-v41.js');
 const ids=[53,62,70,74,181,260,315,316,318,320];
 for(const id of ids){
  assert.ok(js.includes('"id":'+id+',"art":"assets/custom-art/generated-4-1/monster-'+String(id).padStart(4,'0')+'.webp"'),String(id));
  assert.match(fix,new RegExp('\\['+id+','));
  assert.ok(fs.existsSync(path.join(root,'assets/custom-art/generated-4-1/monster-'+String(id).padStart(4,'0')+'.webp')));
 }
});
test('Two new art references are keyed to exact existing cards, with graceful missing-file handling',()=>{
 const fix=r('assets/artwork-hotfix-v41.js'),index=r('index.html'),gallery=r('assets/collection-v3.js');
 assert.match(fix,/Funkenwyrm.*funkenwyrm-new\.webp/);
 assert.match(fix,/Waldschlund.*waldschlund-new\.webp/);
 assert.match(fix,/im\.onerror=\(\)=>resolve\(false\)/);
 assert.match(index,/artwork-hotfix-v41\.js\?v=artfix-motion-20261017-2/);
 assert.match(gallery,/41,'funkenwyrm-new\.webp'/);
 assert.match(gallery,/45,'waldschlund-new\.webp'/);
});
