'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const specs=JSON.parse(fs.readFileSync('assets/lategame-cards-v71.json','utf8')).cards;
const query=x=>boot({seed:71017}).run(x,120000);
test('exact approved 16 complete records with distinct stable IDs and correct tier budgets',()=>{
 assert.equal(specs.length,16);
 assert.deepEqual(specs.map(c=>c.id),Array.from({length:16},(_,i)=>716+i));
 assert.deepEqual([7,8,9,10].map(l=>specs.filter(c=>c.level===l).length),[6,5,3,2]);
 assert.equal(new Set(specs.map(c=>c.name)).size,16);
 assert.equal(new Set(specs.map(c=>c.art)).size,16);
 const budgets={7:1270,8:1530,9:1830,10:2150};
 for(const c of specs){
  assert.ok(['predator','guardian','soul','allrounder'].includes(c.role));
  assert.equal(c.atk+c.def,budgets[c.level]);
  assert.ok(c.desc.length>=36&&c.effectText.length>12);
  assert.equal(c.requiredTier,Math.max(c.source,c.level<=8?5:7));
  assert.ok(c.source>=5&&c.source<=9);
  assert.match(c.art,/^assets\/custom-art\/lategame-v71\/late-\d\d\.webp$/);
 }
});
test('no unillustrated cards become active before approved art ZIP is installed',()=>{
 const state=query(`(()=>({length:CARDS.length,status:window.ArcaneLateGameV71,
  newLate:window.ArcaneLateGameV117?.count||0,newFusions:window.ArcaneFusionWaveV129?.installed||0,v130Fusions:window.ArcaneFusionWaveV130?.installed||0,cards:CARDS.slice(716,732).map(c=>({id:c.id,art:c.art,retired:c.retired}))}))()`);
 if(!state.status.artworksInstalled){
  assert.equal(state.length,716,'No unillustrated live cards may be added');
  assert.equal(state.status.count,0);
  assert.equal(state.status.plannedCount,16);
  assert.equal(state.status.status,'artwork-import-pending');
  assert.deepEqual(state.cards,[]);
 }else{
  assert.equal(state.length,732+state.newLate+state.newFusions+state.v130Fusions);
  assert.equal(state.status.count,16);
  assert.ok(state.cards.every(c=>c.art.startsWith('assets/custom-art/lategame-v71/')));
  assert.ok(state.cards.every(c=>!c.retired));
 }
});
test('after artwork import all 16 cards are RPG normals, legally gated drops and available in booster pool',()=>{
 const rows=query(`(()=>{
 const installed=window.ArcaneLateGameV71.artworksInstalled;
 const start=freshProfile();
 const rows=installed?CARDS.slice(716,732).map(c=>({
  id:c.id,level:c.level,name:c.name,atk:c.atk,def:c.def,role:c.role,
  source:c.source,art:c.art,retired:c.retired,fusionOnly:c.fusionOnly,
  initial:Object.hasOwn(start.inventory,c.id),
  inLoot:RPG_OPPONENTS[c.source].loot.includes(c.id),
  inEasy:UPDATE_B_LOOT[c.source].easy.includes(c.id),
  inHard:UPDATE_B_LOOT[c.source].hard.includes(c.id),
  inPool:RPG_BASE_CARDS.some(m=>m.id===c.id)&&UPDATE_B_SET.has(c.id)&&
    UPDATE_B_MAIN_IDS.includes(c.id),
  earlier:boosterPools(c.requiredTier-1).normal.includes(c.id),
  later:boosterPools(c.requiredTier).normal.includes(c.id),
  deckErr:mainDeckError([c.id,...DEFAULT_DECK.flatMap(id=>[id,id]).slice(1)])
 })):[];return {installed,rows};})()`);
 if(!rows.installed){assert.equal(rows.rows.length,0);return;}
 assert.equal(rows.rows.length,16);
 for(const [i,c] of rows.rows.entries()){
  const original=specs[i];
  for(const key of ['id','level','name','role','source'])assert.equal(c[key],original[key]);
   const pool=original.role==='guardian'?Math.round((original.atk+original.def)*.95/10)*10:
    original.atk+original.def;
   const floor=Math.min(80,original.atk,Math.floor(pool/20)*10);
   const atk=original.role==='guardian'?Math.min(original.atk,
    Math.max(floor,Math.min(pool-floor,Math.round(pool*.22/10)*10))):original.atk;
   assert.equal(c.atk,atk);assert.equal(c.def,pool-atk);
  assert.equal(c.art,original.art);
  assert.ok(fs.existsSync(path.join(repo,c.art)),'Missing original WebP '+c.art);
  assert.equal(c.retired,false);assert.equal(c.fusionOnly,false);
  assert.equal(c.initial,false);
  assert.equal(c.inLoot,true);assert.equal(c.inEasy,true);assert.equal(c.inHard,true);
  assert.equal(c.inPool,true);assert.equal(c.earlier,false);assert.equal(c.later,true);
  assert.equal(c.deckErr,'');
 }
});
