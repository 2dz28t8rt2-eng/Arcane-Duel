'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=fs.readFileSync(path.join(root,'assets/collection-v3-data.js'),'utf8');
const context={window:{}};vm.runInNewContext(manifest,context);
const cards=context.window.ARCANE_COLLECTION_V3;
test('Collection 3.0 contains all 360 current collectible cards, with unique IDs',()=>{
 assert.equal(cards.length,360);assert.equal(new Set(cards.map(c=>c.id)).size,360);
 assert.ok(cards.every(c=>Number.isInteger(c.level)&&c.level>=1&&c.level<=10));
});
test('All ten regular levels are represented; levels 11 and 12 remain reserved',()=>{
 for(let l=1;l<=10;l++)assert.ok(cards.some(c=>c.level===l),'Missing level '+l);
 const css=fs.readFileSync(path.join(root,'assets/visual-progression-v3.css'),'utf8');
 for(const level of [11,12])assert.ok(css.includes('tc-lv-'+level));
});
test('All custom art references exist, and manifested forms share their art',()=>{
 const byId=new Map(cards.map(c=>[c.id,c]));for(const c of cards){if(c.art)assert.ok(fs.existsSync(path.join(root,c.art)),'Missing '+c.art);if(c.manifestOf!=null&&c.art)assert.equal(c.art,byId.get(c.manifestOf)?.art);}
 assert.ok(cards.every(c=>c.art),'Every current collectible card has an illustration');
 const live=require('./helpers/game-runtime.cjs').boot().run('UPDATE_B_ACTIVE_IDS.map(id=>({id,name:CARDS[id].name,art:CARDS[id].art}))');
 for(const c of cards){const real=live.find(x=>x.id===c.id);assert.equal(c.art,real.art);assert.equal(c.name,real.name);}
 for(const c of cards)assert.ok(c.art.startsWith('assets/'));
});
test('Collection view has working filter hooks and never changes saved profile',()=>{
 const html=fs.readFileSync(path.join(root,'collection-v3.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'assets/collection-v3.js'),'utf8');
 for(const hook of ['tierList','artFilter','search','sort','cards'])assert.ok(html.includes('id="'+hook+'"'));
 assert.ok(!js.includes('localStorage'));
 assert.ok(html.includes('assets/art-engine.js')&&html.includes('assets/collection-v3-data.js'));
});
