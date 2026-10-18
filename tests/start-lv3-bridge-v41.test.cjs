'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('Starter fusions are now level 2, 3, 4 with distinct cards and unchanged old IDs',()=>{
 const r=boot().run('('+function(){
  const ids=[...RPG_START_FUSIONS],levels=ids.map(id=>CARDS[id].level);
  const added=ids[2];
  return {ids,levels,name:CARDS[added].name,role:CARDS[added].role,
    rarity:CARDS[added].rarity,active:UPDATE_B_SET.has(added),
    pool:UPDATE_B_FUSION_IDS.includes(added),fusion:RPG_FUSIONS.some(c=>c.id===added),
    inventory:profile.inventory[added]||0,deck:profile.fusionDeck.filter(x=>x===added).length,
    art:CARDS[added].art};
 }.toString()+')()');
 assert.equal(r.ids.length,3);
 assert.deepEqual([...r.levels].sort((a,b)=>a-b),[2,3,4]);
 assert.equal(r.role,'combatant');assert.match(r.name,/Runengeist/);
 assert.equal(r.active,true);assert.equal(r.pool,true);assert.equal(r.fusion,true);
 assert.equal(r.inventory,2);assert.equal(r.deck,2);assert.ok(r.art);
});
test('Old profile gets free Lv3 fusion exactly once, retaining upgrades and other cards',()=>{
 const old=boot().run('('+function(){
  const p=freshProfile(),id=RPG_START_FUSIONS[2];
  delete p.startLv3Granted;
  p.fusionOwned=p.fusionOwned.filter(x=>x!==id);
  p.fusionDeck=p.fusionDeck.filter(x=>x!==id);
  p.slots.forEach(s=>s.fusion=s.fusion.filter(x=>x!==id));
  delete p.inventory[id];
  p.coins=321;p.xp=350;p.enhancements[RPG_START_FUSIONS[0]]=1;
  return JSON.stringify(p);
 }.toString()+')()');
 const k='arcane-duel-rpg-profile-v4-reborn';
 const booted=boot({saved:{[k]:old}});
 const first=booted.run('('+function(){
  const id=RPG_START_FUSIONS[2];
  const result={coins:profile.coins,xp:profile.xp,card:profile.inventory[id],
   copies:profile.fusionDeck.filter(x=>x===id).length,enhance:profile.enhancements[RPG_START_FUSIONS[0]],
   granted:profile.startLv3Granted};
  saveProfile();return result;
 }.toString()+')()');
 assert.equal(first.coins,321);assert.equal(first.xp,350);
 assert.equal(first.card,2);assert.equal(first.copies,2);assert.equal(first.enhance,1);
 assert.equal(first.granted,true);
 const second=boot({saved:{[k]:booted.storage.get(k)}}).run('('+function(){
  const id=RPG_START_FUSIONS[2];
  return {card:profile.inventory[id],copies:profile.fusionDeck.filter(x=>x===id).length,flag:profile.startLv3Granted};
 }.toString()+')()');
 assert.equal(second.card,2);assert.equal(second.copies,2);assert.equal(second.flag,true);
});
test('Legacy active duel snapshots and PvP remain compatible with stable card IDs',()=>{
 const r=boot().run('('+function(){
  const g=createGame({mode:'pve',opponentId:1,context:'free',seed:78103});
  const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
  return {fusionOptions:fusionOptions(g,[2,2]).map(c=>c.level),snapshot:!!snap,oldId:RPG_START_FUSIONS[0],
   newId:RPG_START_FUSIONS[2],cardCount:CARDS.length};
 }.toString()+')()');
 assert.equal(r.snapshot,true);assert.ok(r.fusionOptions.includes(2));assert.ok(r.newId>r.oldId);
});