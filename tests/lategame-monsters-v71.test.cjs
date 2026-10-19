'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const manifest=JSON.parse(fs.readFileSync('assets/lategame-cards-v71.json','utf8'));
const query=x=>boot({seed:71017}).run(x,120000);
test('all 16 new cards are loaded with unique stable IDs, levels, existing roles and complete descriptions',()=>{
 const result=query(`(()=>({baseCount:CARDS.length,
  installed:window.ArcaneLateGameV71,
  values:CARDS.slice(716,732).map(c=>({id:c.id,level:c.level,name:c.name,
   atk:c.atk,def:c.def,role:c.role,desc:c.desc,source:c.source,
   artWave:c.artWave,retired:c.retired,fusionOnly:c.fusionOnly}))}))()`);
 assert.equal(result.baseCount,732);
 assert.equal(result.installed.count,16);
 assert.equal(result.values.length,16);
 assert.deepEqual(result.values.map(x=>x.id),Array.from({length:16},(_,i)=>i+716));
 assert.deepEqual([7,8,9,10].map(l=>result.values.filter(c=>c.level===l).length),[6,5,3,2]);
 for(const [i,card] of result.values.entries()){
  const expected=manifest.cards[i];
  assert.equal(card.id,expected.id);assert.equal(card.name,expected.name);
  assert.equal(card.atk,expected.atk);assert.equal(card.def,expected.def);
  assert.equal(card.role,expected.role);assert.equal(card.level,expected.level);
  assert.equal(card.source,expected.source);assert.equal(card.retired,false);
  assert.equal(card.fusionOnly,false);assert.equal(card.artWave,'7.1');
  assert.ok(card.desc.length>32);
  assert.ok(['predator','guardian','soul','allrounder'].includes(card.role));
 }
});
test('only prior victories unlock endgame crafting and booster cards, no free initial inventory',()=>{
 const data=query(`(()=>{
 const initial=freshProfile(),first=Object.keys(initial.inventory);
 const available=CARDS.slice(716,732).map(c=>({
  id:c.id,source:c.source,requiredTier:c.requiredTier,
  isInSourceLoot:RPG_OPPONENTS[c.source].loot.includes(c.id),
  isInEasy:UPDATE_B_LOOT[c.source].easy.includes(c.id),
  isInHard:UPDATE_B_LOOT[c.source].hard.includes(c.id),
  craftPool:UPDATE_B_SET.has(c.id),mainPool:UPDATE_B_MAIN_IDS.includes(c.id),
  globalPool:RPG_BASE_CARDS.some(x=>x.id===c.id),
  before:boosterPools(c.requiredTier-1).normal.includes(c.id),
  after:boosterPools(c.requiredTier).normal.includes(c.id),
  initial:first.includes(String(c.id))
 }));
 return available;})()`);
 for(const row of data){assert.equal(row.isInSourceLoot,true);
  assert.equal(row.isInEasy,true);assert.equal(row.isInHard,true);
  assert.equal(row.craftPool,true);assert.equal(row.mainPool,true);
  assert.equal(row.globalPool,true);assert.equal(row.before,false);
  assert.equal(row.after,true);assert.equal(row.initial,false);
 }
});
test('new cards are legal as 40-card normal main deck, never fusion card and artwork mapping remains stable',()=>{
 const r=query(`(()=>{
  const base=DEFAULT_DECK.flatMap(id=>[id,id]);
  const ids=CARDS.slice(716,732).map(c=>c.id),result=[];
  for(const id of ids){const trial=[...base];trial[0]=id;
   result.push({id,main:mainDeckError(trial),fusion:fusionDeckError([id,id]),
    art:CARDS[id].art,declared:window.ArcaneLateGameV71.roster.find(x=>x.id===id).art,
    rarity:CARDS[id].rarity});}
  return {rows:result,installed:window.ArcaneLateGameV71.artworksInstalled};
 })()`);
 for(const row of r.rows){
  assert.equal(row.main,'','New normal card rejected '+row.id);
  assert.ok(row.fusion.length>0,'Normal card must never be fusion template');
  assert.ok(row.art&&row.art.length>5);
  assert.match(row.declared,/^assets\/custom-art\/lategame-v71\/late-\d\d\.webp$/);
  assert.equal(row.rarity,'common');
  if(r.installed)assert.equal(row.art,row.declared);
 }
});
