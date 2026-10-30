'use strict';
/* Ten effect-free late-game normal monsters; real artwork and canonical values. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const rows=JSON.parse(fs.readFileSync(path.join(repo,'assets/lategame-v117-manifest.json'),'utf8')).cards;
const {roleFor,statsFor}=require('./helpers/live-role-expectations-v216.cjs');
const shares={predator:.76,guardian:.25,soul:.22,combatant:.50};
const snap=()=>boot({seed:11707}).run(`(()=>({count:window.ArcaneLateGameV117?.count||0,newFusions:window.ArcaneFusionWaveV129?.installed||0,v130Fusions:window.ArcaneFusionWaveV130?.installed||0,total:CARDS.length,
 cards:CARDS.slice(732,742).map(c=>({id:c.id,name:c.name,level:c.level,
 role:c.role,atk:c.atk,def:c.def,art:c.art,customArt:c.customArt,
 source:c.source,requiredTier:c.requiredTier,retired:c.retired,
 fusionOnly:c.fusionOnly,ace:c.ace,rpg:c.rpg,rarity:c.rarity,
 ability:c.ability??null,effectText:c.effectText??null,
 validLoot:RPG_OPPONENTS[c.source].loot.includes(c.id),
 validEasy:UPDATE_B_LOOT[c.source].easy.includes(c.id),
 validHard:UPDATE_B_LOOT[c.source].hard.includes(c.id),
 registered:RPG_BASE_CARDS.some(x=>x.id===c.id)&&UPDATE_B_SET.has(c.id)&&UPDATE_B_MAIN_IDS.includes(c.id),
 rendered:fullCardHtml({id:c.id}).includes('src="'+c.art+'"')
 }))}))()`);
test('exactly ten distinct, level 7–10, role-correct, effect-free specs',()=>{
 assert.equal(rows.length,10);assert.deepEqual(rows.map(x=>x.id),Array.from({length:10},(_,i)=>732+i));
 assert.equal(new Set(rows.map(x=>x.art)).size,10);
 assert.deepEqual([7,8,9,10].map(l=>rows.filter(x=>x.level===l).length),[1,3,3,3]);
 for(const r of rows){
  assert.ok(shares[r.role]!=null);assert.equal(r.art,`assets/custom-art/lategame-v117/${r.slug}.webp`);
  assert.ok(r.source>=5&&r.source<=9);
 }
});
test('all ten illustrations valid and unique, when artwork install is active',()=>{
 const x=snap();
 if(!x.count){assert.equal(x.total,732);return;}
 assert.equal(x.count,10);assert.equal(x.total,742+x.newFusions+x.v130Fusions);
 const hashes=new Set();
 for(const c of rows){
  const buf=fs.readFileSync(path.join(repo,c.art));
  assert.ok(buf.length>70_000);assert.equal(buf.toString('ascii',0,4),'RIFF');
  assert.equal(buf.toString('ascii',8,12),'WEBP');
  const digest=crypto.createHash('sha256').update(buf).digest('hex');
  assert.ok(!hashes.has(digest));hashes.add(digest);
 }
});
test('live normal monsters follow level budget, reach loot/decks and render without custom abilities',()=>{
 const x=snap();
 if(!x.count){assert.equal(x.cards.length,0);return;}
 assert.equal(x.cards.length,10);
 for(let i=0;i<10;i++){
  const a=x.cards[i],r=rows[i];
  assert.equal(a.id,r.id);assert.equal(a.name,r.name);assert.equal(a.level,r.level);
  assert.equal(a.role,roleFor(r));
  const stats=statsFor(r);
  assert.equal(a.atk,stats.atk);assert.equal(a.def,stats.def);
  assert.equal(a.art,r.art);assert.equal(a.customArt,r.art);assert.equal(a.source,r.source);
  assert.equal(a.ability,null);assert.equal(a.effectText,null===a.effectText?null:'');
  assert.equal(a.fusionOnly,false);assert.equal(a.ace,false);assert.equal(a.retired,false);
  assert.equal(a.rpg,true);assert.equal(a.rarity,'common');assert.ok(a.validLoot&&a.validEasy&&a.validHard&&a.registered&&a.rendered);
 }
});
test('monster lexicon includes all ten entries with no duplicates when installed',()=>{
 const sandbox={window:{}};
 for(const file of ['assets/collection-v3-data.js','assets/collection-v3-lategame-v71.js','assets/collection-v3-lategame-v117.js','assets/collection-v3-fusion-wave2-v129.js','assets/collection-v3-fusion-wave3-v130.js'])
  vm.runInNewContext(fs.readFileSync(path.join(repo,file),'utf8'),sandbox,{filename:file});
 const items=sandbox.window.ARCANE_COLLECTION_V3,installed=sandbox.window.ArcaneCollectionLateGameV117.count;
 assert.equal(items.length,376+installed+(sandbox.window.ArcaneCollectionFusionWaveV129?.count||0)+(sandbox.window.ArcaneCollectionFusionWaveV130?.count||0));
 assert.equal(new Set(items.map(x=>x.id)).size,items.length);
 if(!installed)return;
 for(const x of rows){
  const found=items.find(i=>i.id===x.id);
  assert.ok(found);assert.equal(found.name,x.name);assert.equal(found.level,x.level);
  assert.equal(found.art,x.art);assert.equal(found.fusion,false);
 }
});
