'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const renderer=read('tools/finished-card-renderer.html');
const gallery=read('docs/fertige-monsterkarten.html');
const workflow=read('.github/workflows/render-finished-cards.yml');
const catalog=JSON.parse(read('assets/collection-v3-data.js').split('=').slice(1).join('=').trim().replace(/;\s*$/,''));
test('Wave 02 picks 20 different existing original artworks with level cap 10',()=>{
 const ids=JSON.parse(renderer.match(/const wave02Ids=(\[[^\]]+\])/)[1]);
 assert.equal(ids.length,20);assert.equal(new Set(ids).size,20);
 const rows=ids.map(id=>catalog.find(c=>c.id===id));
 assert.ok(rows.every(Boolean));
 assert.ok(rows.every(c=>c.level>=1&&c.level<=10),'Do not export reserved levels 11/12');
 assert.equal(new Set(rows.map(c=>c.art)).size,20,'Each new card gets its own picture');
 for(const c of rows){assert.ok(c.art.startsWith('assets/custom-art/'));assert.ok(fs.existsSync(path.join(root,c.art)),c.art);}
 assert.ok(rows.some(c=>c.fusion),'Show multiple template families');
});
test('Export uses live cards, not hardcoded art values or mock ATK/DEF',()=>{
 assert.match(renderer,/ArcaneCardTemplates\.choose\(c\)/);
 assert.match(renderer,/atk:c\.atk,def:c\.def/);
 assert.match(renderer,/wave==='02'\?20:10/);
 assert.match(renderer,/sheet.height=114\+Math\.ceil\(cards.length\/5\)\*507\+12/);
 assert.match(renderer,/Kartenname passt nicht in drei Zeilen/);
 assert.match(renderer,/Level 11\/12 dürfen nicht exportiert werden/);
});
test('Wave 02 workflow creates 20 PNG images and remains in development',()=>{
 assert.match(workflow,/branches: \[development\]/);
 assert.match(workflow,/finished-card-renderer.html\?wave=02/);
 assert.match(workflow,/assert len\(payload\['cards'\]\)==20/);
 assert.match(workflow,/assets\/finished-cards\/wave02/);
 assert.match(workflow,/\(768,1224\)/);
 assert.match(workflow,/\(1300,2154\)/);
 assert.ok(!workflow.includes('HEAD:main'));
});
test('Gallery displays both series and full PNG downloads',()=>{
 assert.match(gallery,/const waves=\['01','02'\]/);
 assert.match(gallery,/cards.length!==30/);
 assert.match(gallery,/c.wave/);
 assert.match(gallery,/download=c.filename/);
});
