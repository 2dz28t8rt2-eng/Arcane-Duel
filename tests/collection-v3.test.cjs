'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=fs.readFileSync(path.join(root,'assets/collection-v3-data.js'),'utf8');
const context={window:{}};vm.runInNewContext(manifest,context);
const cards=context.window.ARCANE_COLLECTION_V3;
test('Collection 3.0 contains all 128 curated card templates, with unique IDs',()=>{
 assert.equal(cards.length,128);assert.equal(new Set(cards.map(c=>c.id)).size,128);
 assert.ok(cards.every(c=>Number.isInteger(c.level)&&c.level>=1&&c.level<=12));
});
test('All twelve levels represented; level 11 and 12 stay visually special',()=>{
 for(let l=1;l<=12;l++)assert.ok(cards.some(c=>c.level===l),'Missing level '+l);
 const css=fs.readFileSync(path.join(root,'assets/visual-progression-v3.css'),'utf8');
 for(const level of [11,12])assert.ok(css.includes('tc-lv-'+level));
});
test('All custom art references exist, and manifested forms share their art',()=>{
 const byId=new Map(cards.map(c=>[c.id,c]));for(const c of cards){if(c.art)assert.ok(fs.existsSync(path.join(root,c.art)),'Missing '+c.art);if(c.manifestOf!=null&&c.art)assert.equal(c.art,byId.get(c.manifestOf)?.art);}
 assert.equal(new Set(cards.filter(c=>c.art).map(c=>c.art)).size,30);
 for(const c of cards.filter(c=>c.variantOf!=null))assert.equal(c.art,byId.get(c.variantOf)?.art);
});
test('Collection view has working filter hooks and never changes saved profile',()=>{
 const html=fs.readFileSync(path.join(root,'collection-v3.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'assets/collection-v3.js'),'utf8');
 for(const hook of ['tierList','artFilter','search','sort','cards'])assert.ok(html.includes('id="'+hook+'"'));
 assert.ok(!js.includes('localStorage'));
 assert.ok(html.includes('assets/art-engine.js')&&html.includes('assets/collection-v3-data.js'));
});
