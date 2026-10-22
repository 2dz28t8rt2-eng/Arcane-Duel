'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=fs.readFileSync(path.join(root,'assets/collection-v3-data.js'),'utf8');
const appendix=fs.readFileSync(path.join(root,'assets/collection-v3-lategame-v71.js'),'utf8');
const appendix117=fs.readFileSync(path.join(root,'assets/collection-v3-lategame-v117.js'),'utf8');
const appendix129=fs.readFileSync(path.join(root,'assets/collection-v3-fusion-wave2-v129.js'),'utf8');
const context={window:{}};vm.runInNewContext(manifest,context);
const originalCount=context.window.ARCANE_COLLECTION_V3.length;
vm.runInNewContext(appendix,context);
vm.runInNewContext(appendix117,context);
vm.runInNewContext(appendix129,context);
const cards=context.window.ARCANE_COLLECTION_V3;
test('Monsterlexikon includes the newest 16 endgame normal monsters, with unique IDs',()=>{
 assert.equal(originalCount,360,'Legacy collection baseline unexpectedly changed');
 assert.equal(cards.length,376+(context.window.ArcaneCollectionLateGameV117?.count||0)+(context.window.ArcaneCollectionFusionWaveV129?.count||0),'All newly registered collectibles must appear in the lexicon');
 assert.equal(context.window.ArcaneCollectionLateGameV71.count,16);
 assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
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
 assert.ok(html.includes('assets/art-engine.js')&&html.includes('assets/collection-v3-data.js')&&html.includes('assets/collection-v3-lategame-v71.js'));
 assert.match(html,/(?:376|386|396) Kartenvorlagen/);
});
