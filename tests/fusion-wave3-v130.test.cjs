'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const cards=JSON.parse(fs.readFileSync(path.join(repo,'assets/fusion-wave3-v130-manifest.json'),'utf8')).cards;
const run=src=>boot({seed:13022}).run(src,120000);
test('v130 has 3 LV2, 3 LV3, 2 LV5 and 2 LV7 independent fusion blueprints',()=>{
 assert.equal(cards.length,10);
 assert.deepEqual(cards.map(c=>c.id),Array.from({length:10},(_,i)=>752+i));
 assert.deepEqual([2,3,5,7].map(l=>cards.filter(c=>c.level===l).length),[3,3,2,2]);
 assert.equal(new Set(cards.map(c=>c.name)).size,10);
 assert.equal(new Set(cards.map(c=>c.art)).size,10);
 for(const c of cards){
  assert.equal(c.fusionOnly,true);
  assert.equal(c.role,null);
  assert.match(c.art,/^assets\/custom-art\/fusion-wave3-v130\/[\w-]+\.webp$/);
 }
});
test('staging preserves all live cards; after art import every new card has a valid pool and neutral role',()=>{
 const state=run(`(()=>({status:window.ArcaneFusionWaveV130?.status,
 count:window.ArcaneFusionWaveV130?.installed||0,length:CARDS.length,
 rows:CARDS.slice(752).map(c=>({id:c.id,name:c.name,level:c.level,role:c.role??null,
 atk:c.atk,def:c.def,art:c.art,ability:c.ability??null,effectText:c.effectText||'',
 fusion:c.fusionOnly,retired:c.retired,booster:UPDATE_B_FUSION_IDS.includes(c.id),
 active:UPDATE_B_ACTIVE_IDS.includes(c.id),inFusion:RPG_FUSIONS.some(f=>f.id===c.id),
 loot:RPG_OPPONENTS[c.source].loot.includes(c.id)}))}))()`);
 assert.equal(state.length,752+state.count);
 assert.equal(state.rows.length,state.count);
 if(!state.count){assert.equal(state.status,'awaiting-artwork-upload');return;}
 assert.equal(state.status,'active');
 assert.equal(state.count,10);
 const budget={2:440,3:670,5:1110,7:1610};
 for(let i=0;i<cards.length;i++){
  const c=cards[i],r=state.rows[i];
  assert.equal(r.id,c.id);assert.equal(r.name,c.name);assert.equal(r.level,c.level);
  assert.equal(r.role,null);assert.equal(r.fusion,true);assert.equal(r.retired,false);
  assert.equal(r.ability,null);assert.equal(r.effectText,'');
  assert.equal(r.art,c.art);
  assert.ok(r.atk>0&&r.def>0&&r.atk+r.def>budget[c.level]*1.6&&r.atk+r.def<budget[c.level]*2);
  assert.ok(r.booster&&r.active&&r.inFusion&&r.loot);
  const data=fs.readFileSync(path.join(repo,c.art));
  assert.ok(data.length>80000);
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP');
 }
});
test('role of a summoned fusion still depends solely on materials',()=>{
 const roles=run(`(()=>{const p=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.role==='predator');
 const g=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.role==='guardian');
 const n=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.role==='combatant');
 const f=window.ArcaneRoleFusion.inheritance;
 return {p:f([{id:p.id},{id:p.id}]),g:f([{id:g.id},{id:g.id}]),
  n:f([{id:n.id},{id:n.id}])}})()`);
 assert.deepEqual(roles,{p:'predator',g:'guardian',n:'resonator'});
});
test('lexicon has the matching names, artwork and card IDs only after art installation',()=>{
 const sandbox={window:{}};
 for(const file of ['assets/collection-v3-data.js','assets/collection-v3-lategame-v71.js',
 'assets/collection-v3-lategame-v117.js','assets/collection-v3-fusion-wave2-v129.js',
 'assets/collection-v3-fusion-wave3-v130.js']){
  vm.runInNewContext(fs.readFileSync(path.join(repo,file),'utf8'),sandbox,{filename:file});
 }
 const rows=sandbox.window.ARCANE_COLLECTION_V3;
 const enabled=sandbox.window.ArcaneCollectionFusionWaveV130.count;
 assert.equal(rows.length,396+enabled);
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
 if(!enabled)return;
 assert.equal(enabled,10);
 for(const c of cards){
  const actual=rows.find(x=>x.id===c.id);
  assert.ok(actual);assert.equal(actual.name,c.name);
  assert.equal(actual.level,c.level);assert.equal(actual.fusion,true);
  assert.equal(actual.art,c.art);
 }
});
