'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {makeStageOwnedDeck,availableInventory,STYLES,VARIANTS,legalCard}=require('./helpers/stage-owned-decks-v60.cjs');
const vm=boot({seed:6010});
const catalogue=vm.run(`(()=>{const initial=freshProfile();return {
 cards:CARDS.map(c=>({id:c.id,level:c.level,atk:c.atk,def:c.def,role:c.role,
  source:c.source,hard:c.hard,ace:c.ace,retired:c.retired,rpg:c.rpg,
  enemyOnly:c.enemyOnly,essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,
  workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly,
  milestoneOnly:c.milestoneOnly,manifestOf:c.manifestOf,eventOnly:c.eventOnly,
  questOnly:c.questOnly,legendaryOnly:c.legendaryOnly})),
 defaultDeck:[...DEFAULT_DECK],startFusions:[...RPG_START_FUSIONS],
 opponents:RPG_OPPONENTS.map(o=>({id:o.id,level:o.level,loot:o.loot})),
 initialInventory:initial.inventory};})()`);
test('source-level inventory pools never grant current or future stage, ACE or milestone cards',()=>{
 for(let tier=1;tier<=10;tier++)for(const v of VARIANTS){
  const inventory=availableInventory(catalogue,tier,v);
  for(const [id,quantity] of inventory){
   const c=catalogue.cards[id];
   assert.ok(legalCard(c,tier,catalogue),tier+': illegal '+id);
   assert.ok(!c.ace&&!c.milestoneOnly&&!c.hard&&!c.retired,'hidden reward '+id);
   assert.ok(quantity>=1&&quantity<=3);
   if(c.source>=0)assert.ok(c.source<tier,'future '+id+' at tier '+tier);
  }
 }
});
test('exact inventory ownership holds for every main and fusion card in 100 mirrored loadouts',()=>{
 for(let tier=1;tier<=10;tier++)for(const style of STYLES)for(const variant of VARIANTS){
  const d=makeStageOwnedDeck(catalogue,tier,style,variant);
  assert.equal(d.deck.length,40);assert.ok(d.fusionDeck.length>=2&&d.fusionDeck.length<=15);
  assert.equal(vm.run('mainDeckError('+JSON.stringify(d.deck)+')'),'');
  assert.equal(vm.run('fusionDeckError('+JSON.stringify(d.fusionDeck)+')'),'');
  const played={};
  for(const id of [...d.deck,...d.fusionDeck])played[id]=(played[id]||0)+1;
  for(const [id,n] of Object.entries(played)){
   assert.ok(n<=d.ownership[id],tier+' '+style+' '+variant+': unowned copy '+id);
   assert.ok(catalogue.cards[id].level<=d.meta.levelCap);
  }
  const replay=makeStageOwnedDeck(catalogue,tier,style,variant);
  assert.deepEqual(replay.deck,d.deck);
  assert.deepEqual(replay.fusionDeck,d.fusionDeck);
 }
});
test('starter tournament deck uses actual freshProfile ownership and no future rewards',()=>{
 for(const style of STYLES){
  const d=makeStageOwnedDeck(catalogue,1,style,'normal');
  for(const id of d.deck)assert.ok(catalogue.defaultDeck.includes(id)||
   catalogue.opponents[0].loot.includes(id),'not available at tournament I: '+id);
  for(const id of d.fusionDeck)assert.ok(catalogue.startFusions.includes(id)||
   catalogue.opponents[0].loot.includes(id),'fusion unavailable tier I: '+id);
 }
});
test('mirror duel loadout API really creates the same cards on both sides',()=>{
 const deck=makeStageOwnedDeck(catalogue,5,'soul','invested');
 const r=vm.run(`(()=>{const d=${JSON.stringify(deck)};
  const enemy={deck:[...d.deck],fusionDeck:[...d.fusionDeck],enhancements:{},power:1,flatBonus:0};
  const g=createGame({mode:'pve',context:'tournament',opponentId:5,seed:123991,
   starter:0,deck:d.deck,fusionDeck:d.fusionDeck,enemy});
  const sorted=p=>[...p.originalDeck].sort((a,b)=>a-b).join(':');
  return {mainMatch:sorted(g.players[0])===sorted(g.players[1]),
   fusionMatch:[...g.players[0].fusionDeck].sort((a,b)=>a-b).join(':')===
    [...g.players[1].fusionDeck].sort((a,b)=>a-b).join(':'),
   power:[g.players[0].power,g.players[1].power],
   lp:[g.players[0].lp,g.players[1].lp],
   bonuses:[g.players[0].flatBonus,g.players[1].flatBonus]};})()`);
 assert.equal(r.mainMatch,true);assert.equal(r.fusionMatch,true);
 assert.deepEqual(r.bonuses,[0,0]);
 assert.equal(r.lp[0],r.lp[1]);
});
