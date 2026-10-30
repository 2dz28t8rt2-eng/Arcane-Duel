'use strict';
/* Audit that the 16 imported original images are usable in the actual game
 * card templates AND the separate public collection page.
 * Source of truth: v7.1 manifest; NEVER change combat balance here.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const {roleFor,statsFor}=require('./helpers/live-role-expectations-v216.cjs');
const rows=JSON.parse(fs.readFileSync(path.join(repo,'assets/lategame-cards-v71.json'),'utf8')).cards;
test('all 16 ORIGINAL WebP assets are distinct, decodable headers and correctly mapped',()=>{
 assert.equal(rows.length,16);
 const hashes=new Set();
 for(let i=0;i<16;i++){
  const row=rows[i];
  assert.equal(row.id,716+i);
  assert.equal(row.art,'assets/custom-art/lategame-v71/late-'+String(i+1).padStart(2,'0')+'.webp');
  const filename=path.join(repo,row.art);
  const data=fs.readFileSync(filename);
  assert.ok(data.length>40_000,'Empty or thumbnail artwork for '+row.name);
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP');
  assert.ok(['VP8 ','VP8L','VP8X'].includes(data.toString('ascii',12,16)),
    'Invalid WebP payload '+row.name);
  const digest=crypto.createHash('sha256').update(data).digest('hex');
  assert.ok(!hashes.has(digest),'Accidentally repeated painting '+row.name);
  hashes.add(digest);
 }
});
test('real game catalogue resolves exactly each new card portrait and matching level 7–10 template',()=>{
 const runtime=boot({seed:71031});
 const state=runtime.run(`(()=>({
  cards:CARDS.slice(716,732).map(c=>{
   const view=fullCardHtml({id:c.id});
   const layout=ArcaneCardTemplates.choose(c);
   const frame=ArcaneLevelFrames.resolve(c);
   return {id:c.id,name:c.name,level:c.level,art:c.art,customArt:c.customArt,
    role:c.role,atk:c.atk,def:c.def,
    rarity:c.rarity,source:c.source,normal:!c.fusionOnly,
    frameTemplate:layout?.id,frameLevel:frame?.level,
    frameBase:frame?.base,frameOverlay:frame?.overlay,
    hasLiveArtwork:view.includes('src="'+c.art+'"'),
    hasName:view.includes(c.name.replaceAll('&','&amp;')),
    hasLevelClass:view.includes('ad-level-normal-'+String(c.level).padStart(2,'0')),
    hasTemplateClass:view.includes('ad-template-normal-0'+(c.level<=8?4:5)),
    hasFateClass:view.includes('fate-sparkle')
   };
  }),installed:ArcaneLateGameV71.artworksInstalled,
  newLate:window.ArcaneLateGameV117?.count||0,newFusions:window.ArcaneFusionWaveV129?.installed||0,v130Fusions:window.ArcaneFusionWaveV130?.installed||0,total:CARDS.length
 }))()`);
 assert.equal(state.installed,true);
 assert.equal(state.total,732+state.newLate+state.newFusions+state.v130Fusions);
 for(let i=0;i<16;i++){
  const c=state.cards[i],expected=rows[i];
  for(const k of ['id','name','level','source','art'])assert.equal(c[k],expected[k]);
  assert.equal(c.role,roleFor(expected));
  const expectedStats=statsFor(expected);
  assert.equal(c.atk,expectedStats.atk);assert.equal(c.def,expectedStats.def);
  assert.equal(c.customArt,c.art,'Original portrait must supersede procedural art');
  assert.ok(c.normal,'Normal monster must remain non-fusion');
  assert.ok(c.hasLiveArtwork&&c.hasName&&c.hasLevelClass&&c.hasTemplateClass,
   'Broken in-game card frame/image '+c.name);
  assert.equal(c.frameTemplate,c.level<=8?'normal-04':'normal-05');
  assert.equal(c.frameLevel,c.level);
  assert.equal(c.frameBase,'assets/card-templates/'+c.frameTemplate+'.svg');
  assert.equal(c.frameOverlay,
   'assets/card-templates/levels/normal-lv'+String(c.level).padStart(2,'0')+'.svg');
  assert.ok(fs.existsSync(path.join(repo,c.frameBase)));
  assert.ok(fs.existsSync(path.join(repo,c.frameOverlay)));
  assert.equal(c.hasFateClass,false);
 }
});
test('public monsterlexikon includes the same 16 images, names and levels without duplicates',()=>{
 const html=fs.readFileSync(path.join(repo,'collection-v3.html'),'utf8');
 const gameHtml=fs.readFileSync(path.join(repo,'index.html'),'utf8');
 const legacyScript='assets/collection-v3-data.js';
 const patchScript='assets/collection-v3-lategame-v71.js';
 const renderer='assets/collection-v3.js';
 assert.ok(html.indexOf(legacyScript)<html.indexOf(patchScript));
 assert.ok(html.indexOf(patchScript)<html.indexOf(renderer));
 assert.match(gameHtml,/lategame-monsters-v71\.js\?v=7\.1-art16-live-/);
 const sandbox={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(repo,legacyScript),'utf8'),sandbox,
  {filename:legacyScript});
 const before=sandbox.window.ARCANE_COLLECTION_V3.length;
 vm.runInNewContext(fs.readFileSync(path.join(repo,patchScript),'utf8'),sandbox,
  {filename:patchScript});
 const collection=sandbox.window.ARCANE_COLLECTION_V3;
 assert.equal(before,360);
 assert.equal(collection.length,before+16);
 assert.equal(new Set(collection.map(x=>x.id)).size,collection.length);
 for(const expected of rows){
  const matches=collection.filter(x=>x.id===expected.id);
  assert.equal(matches.length,1);
  const x=matches[0];
  for(const k of ['name','level','kind','art','desc'])assert.equal(x[k],expected[k]);
  assert.equal(x.fusion,false);
 }
});
