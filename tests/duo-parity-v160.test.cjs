'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const deck=[...snapshot.starterMain],fusions=[...snapshot.starterFusions];
const setup=()=>{
 const base=rules.create({roomId:'test-123456',hostName:'Hannes',hostDeck:deck,hostFusions:fusions,
  enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,enemyFusionsB:fusions,
  chapter:1,entry:'new',catalog});
 return rules.apply(base,2,{type:'join',name:'Partner',deck,fusions},{catalog});
};
const move=(state,seat,action)=>rules.apply(state,seat,action,{catalog});
const live=(id,changes={})=>({id,uid:1000+id,level:catalog[id].level,
 atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,
 fusion:false,mode:'atk',used:false,switched:false,placedRound:0,
 soul:0,condensed:0,soulCooldown:0,raidCooldown:0,condenseLeft:0,
 condenseSlice:0,drainPreference:0,lastSoulAction:-1,lastDrainSwitch:-1,
 decaySkipOwnTurn:-1,decayGrace:0,maxDef:catalog[id].def,resonance:0,...changes});
test('current singleplayer catalog and server catalog never diverge',()=>{
 assert.equal(snapshot.cards.length,762);
 assert.ok(snapshot.cards.filter(c=>c.playable).length>420);
 assert.deepEqual(snapshot.cards.map(c=>c.id),Array.from({length:762},(_,i)=>i));
 assert.equal(fs.readFileSync(path.resolve(__dirname,'../supabase/functions/arcane-duo-v2/catalog.json'),'utf8'),
  fs.readFileSync(path.resolve(__dirname,'../assets/duo-card-catalog-v160.json'),'utf8'));
 assert.equal(fs.readFileSync(path.resolve(__dirname,'../supabase/functions/arcane-duo-v2/duo-rules.js'),'utf8'),
  fs.readFileSync(path.resolve(__dirname,'../assets/duo-shared-rules-v160.js'),'utf8'));
});
test('all four players start with 40 real cards, five in own hand, seven slots and 16k team LP',()=>{
 const state=setup();
 assert.equal(state.schema,2);assert.equal(state.players.length,4);
 assert.deepEqual(state.players.map(p=>p.hand.length),[5,5,5,5]);
 assert.deepEqual(state.players.map(p=>p.deck.length),[35,35,35,35]);
 assert.deepEqual(state.players.map(p=>p.field.length),[7,7,7,7]);
 assert.deepEqual(state.teams.map(t=>t.lp),[16000,16000]);
 assert.deepEqual(state.players.map(p=>p.team),[0,1,0,1]);
 assert.equal(state.activeSeat,0);
});
test('deck validation rejects unknown IDs, fusion cards in main, invalid counts and duplication',()=>{
 assert.ok(rules.validDeck(deck,catalog));
 assert.ok(rules.validDeck(fusions,catalog,true));
 assert.equal(rules.validDeck(Array(40).fill(deck[0]),catalog),false);
 assert.equal(rules.validDeck([...deck.slice(1),999999],catalog),false);
 assert.equal(rules.validDeck([fusions[0],...deck.slice(1)],catalog),false);
 assert.equal(rules.validDeck([...fusions,deck[0]],catalog,true),false);
});
test('room views never disclose other players hands, deck contents, or fusion templates',()=>{
 const state=setup(),host=rules.view(state,0),guest=rules.view(state,2);
 assert.deepEqual(host.players[1].hand,[null,null,null,null,null]);
 assert.deepEqual(host.players[2].fusionDeck,guest.players[2].fusionDeck.map(()=>null));
 assert.equal(guest.players[0].hand[0],null);
 assert.equal(host.players[0].hand.length,5);
 assert.equal(host.players[0].baseDeck,undefined);
 assert.equal(guest.players[2].baseFusions,undefined);
 assert.equal(host.uid,undefined);
});
test('turn ownership, summon limits, position restrictions, draw to five and correct seat cycle',()=>{
 let state=setup();
 assert.throws(()=>move(state,2,{type:'summon',handIndex:0,slot:0}),/anderer Spieler/);
 const id=state.players[0].hand[0];
 state=move(state,0,{type:'summon',handIndex:0,slot:0});
 assert.equal(state.players[0].field[0].id,id);
 assert.equal(state.players[0].hand.length,4);
 assert.throws(()=>move(state,0,{type:'summon',handIndex:0,slot:1}),/bereits/);
 assert.throws(()=>move(state,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null}),/nicht bereit/);
 state=move(state,0,{type:'switch',slot:0});
 assert.equal(state.players[0].field[0].mode,'def');
 assert.throws(()=>move(state,0,{type:'switch',slot:0}),/nicht möglich/);
 state=move(state,0,{type:'end'});
 assert.equal(state.activeSeat,1);
 state=move(state,1,{type:'end'});assert.equal(state.activeSeat,2);
 state=move(state,2,{type:'end'});assert.equal(state.activeSeat,3);
 state=move(state,3,{type:'end'});
 assert.equal(state.activeSeat,0);assert.equal(state.round,2);
 assert.equal(state.players[0].hand.length,5);
 assert.equal(state.players[0].field[0].switched,false);
});
test('fusion uses only own cards, consumes template and materials, and never consumes ally field',()=>{
 let state=setup();
 // The inventory includes at least one Lv2/3 early fusion.
 const levelOneHand=state.players[0].hand
  .map((id,i)=>({id,i})).filter(x=>catalog[x.id].level===1);
 assert.ok(levelOneHand.length>=2);
 const materials=levelOneHand.slice(0,2).map(x=>({from:'hand',index:x.i}));
 const options=rules.fusionOptions(state,0,materials,catalog);
 assert.ok(options.rule.level>=2);
 assert.ok(options.templates.length>0);
 const templateId=options.templates[0],count=state.players[0].remainingFusion.length;
 state=move(state,0,{type:'fusion',materials,slot:0,templateId});
 assert.equal(state.players[0].field[0].id,templateId);
 assert.equal(state.players[0].field[0].fusion,true);
 assert.equal(state.players[0].hand.length,3);
 assert.equal(state.players[0].remainingFusion.length,count-1);
 assert.equal(state.players[2].field.filter(Boolean).length,0);
 assert.equal(state.players[0].graveyard.length,2);
 assert.throws(()=>move(state,0,{type:'fusion',materials,slot:1,templateId}),/bereits/);
});
test('partner can attack either opponent, never attack the ally, and defender counter hurts',()=>{
 let state=setup();
 state=move(state,0,{type:'summon',handIndex:0,slot:0});
 state=move(state,0,{type:'end'});
 state=move(state,1,{type:'summon',handIndex:0,slot:0});
 state=move(state,1,{type:'end'});
 state=move(state,2,{type:'summon',handIndex:0,slot:0});
 state=move(state,2,{type:'end'});
 state=move(state,3,{type:'end'});
 assert.throws(()=>move(state,0,{type:'attack',slot:0,targetSeat:2,targetSlot:0}),/Gegnerischer Feldplatz/);
 state=move(state,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 assert.ok(state.log.at(-1).includes('greift'));
});
test('chapter progression only after victory and deck exhaustion is a team loss',()=>{
 let state=setup();
 assert.throws(()=>move(state,0,{type:'nextChapter'}),/freigeschaltete/);
 state.players[1].deck=[];
 state=move(state,0,{type:'end'});
 assert.equal(state.status,'finished');
 assert.equal(state.winner,0);
 state=move(state,0,{type:'nextChapter'});
 assert.equal(state.chapter,2);
 assert.equal(state.status,'active');
 assert.equal(state.activeSeat,0);
 assert.equal(state.players[0].hand.length,5);
});
test('fusion majority ignores neutral quality materials and never inherits a random field role',()=>{
 const c=role=>({role});
 assert.equal(rules.fusionRole([c('soul'),c('soul')]),'soul');
 assert.equal(rules.fusionRole([c('guardian'),c('guardian')]),'guardian');
 assert.equal(rules.fusionRole([c('predator'),c('predator'),c('combatant')]),'predator');
 assert.equal(rules.fusionRole([c('guardian'),c('soul'),c('combatant')]),'guardian');
 assert.equal(rules.fusionRole([c('guardian'),c('predator')]),'resonator');
 assert.equal(rules.fusionRole([c('combatant'),c('combatant')]),'resonator');
 let state=setup();
 state.players[0].hand=[4,5];
 const materials=[{from:'hand',index:0},{from:'hand',index:1}];
 const templateId=rules.fusionOptions(state,0,materials,catalog).templates[0];
 assert.ok(templateId);
 state=move(state,0,{type:'fusion',materials,slot:0,templateId});
 const monster=state.players[0].field[0];
 assert.equal(monster.role,'predator');
 assert.equal(monster.atk,Math.round(catalog[templateId].atk*1.2));
 assert.equal(monster.def,Math.round(catalog[templateId].def*.75));
});
test('DEF attacks are persistent, armoured, layered and counterattack with both defender roles',()=>{
 let state=setup();state.round=2;
 state.players[0].field[0]=live(4,{atk:1000});
 for(let i=1;i<6;i++)state.players[0].field[i]=live(5);
 state.players[2].field[0]=live(4); // partner never increases the owner's swarm bonus
 state.players[1].field[0]=live(0,{atk:400,def:1000,maxDef:1000,
  mode:'def',soul:100,condensed:50});
 const after=move(state,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 const defender=after.players[1].field[0];
 // 1000 ATK * 110% swarm * 75% (25% effective armor) => 825.
 assert.equal(defender.condensed,0);
 assert.equal(defender.soul,0);
 assert.equal(defender.def,325);
 assert.equal(after.teams[0].lp,16000-50-200); // lost soul + defender's 50% ATK
 assert.equal(after.players[0].field[0].atk,970); // attack fatigue
 assert.equal(after.players[0].field[0].used,true);
 assert.equal(state.players[1].field[0].def,1000,'Reducer must not mutate input');
});
test('Soul defender counters in DEF; Predator in DEF has no armor',()=>{
 let state=setup();state.round=2;
 state.players[0].field[0]=live(4,{atk:200});
 state.players[1].field[0]=live(7,{atk:300,def:300,mode:'def'});
 state=move(state,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 assert.equal(state.players[1].field[0].def,147); // 200 * 1.02 swarm * 0.75 armor = 153
 assert.equal(state.teams[0].lp,15850);
 let predator=setup();predator.round=2;
 predator.players[0].field[0]=live(0,{atk:200});
 predator.players[1].field[0]=live(4,{def:250,mode:'def'});
 predator=move(predator,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 assert.equal(predator.players[1].field[0].def,50);
 assert.equal(predator.teams[0].lp,16000);
});
test('Soul passive drains both enemy fields, applies brand, and Guardian heals own team',()=>{
 let state=setup();state.activeSeat=3;
 state.players[0].field[0]=live(7,{mode:'def'});
 state.players[0].field[1]=live(0,{mode:'def'});
 state.players[2].field[1]=live(7,{mode:'def',def:100,maxDef:260});
 state.players[1].field[0]=live(4,{atk:300,def:300});
 state.players[3].field[0]=live(5,{atk:300,def:300});
 const next=move(state,3,{type:'end'});
 assert.equal(next.activeSeat,0);
 assert.ok(next.players[1].field[0].atk<300);
 assert.ok(next.players[3].field[0].atk<300);
 assert.ok(next.players[0].field[0].soul>0);
 assert.ok(next.teams[1].lp<16000,'Soul brand should damage the enemy team');
 assert.ok(next.players[2].field[1].def>100,'Guardian restores partner base DEF');
 assert.ok(next.players[2].field[1].def<=260);
});
test('Soul actions validate authorization, require DEF, and enforce once-per-turn gate',()=>{
 let state=setup();
 state.players[0].field[0]=live(7,{mode:'def',soul:200});
 assert.throws(()=>move(state,2,{type:'soulDischarge',slot:0}),/anderer Spieler/);
 const next=move(state,0,{type:'soulDischarge',slot:0});
 assert.equal(next.players[0].field[0].soul,0);
 assert.equal(next.teams[1].lp,15740);
 assert.throws(()=>move(next,0,{type:'soulCondense',slot:0}),/Bereits eine aktive/);
 assert.throws(()=>move(state,0,{type:'soulFocus',slot:0,stat:'atk'}),/Rang 3/);
 const focused=setup();focused.players[0].field[0]=live(387,{mode:'def'});
 const chose=move(focused,0,{type:'soulFocus',slot:0,stat:'def'});
 assert.equal(chose.players[0].field[0].drainPreference,2);
 assert.throws(()=>move(chose,0,{type:'soulFocus',slot:0,stat:'atk'}),/schon gewechselt/);
});
test('Soul condense and raid use cooldowns on own turns; raid pauses same-turn decay',()=>{
 let state=setup();
 state.players[0].field[0]=live(7,{mode:'def',soul:200});
 const condensed=move(state,0,{type:'soulCondense',slot:0});
 assert.equal(condensed.players[0].field[0].soul,50);
 assert.equal(condensed.players[0].field[0].condensed,150);
 assert.equal(condensed.players[0].field[0].soulCooldown,3);
 const ended=move(condensed,0,{type:'end'});
 assert.equal(ended.players[0].field[0].soulCooldown,2);
 assert.equal(ended.players[0].field[0].condenseLeft,2);
 assert.equal(ended.players[0].field[0].condensed,100);
 let raid=setup();
 raid.players[0].field[0]=live(7,{mode:'def',soul:80,atk:200,decayGrace:0});
 raid.players[1].field[0]=live(4,{atk:300,def:300});
 assert.throws(()=>move(raid,0,{type:'soulRaid',slot:0,targetSeat:2,targetSlot:0}),/nur gegen Gegner/);
 raid=move(raid,0,{type:'soulRaid',slot:0,targetSeat:1,targetSlot:0});
 assert.equal(raid.players[0].field[0].raidCooldown,3);
 assert.ok(raid.players[0].field[0].soul>80);
 const noDecay=move(raid,0,{type:'end'});
 assert.equal(noDecay.players[0].field[0].atk,200);
 assert.equal(noDecay.players[0].field[0].raidCooldown,2);
});
test('old v16.0 room snapshots continue to run without new Soul fields',()=>{
 let state=setup();state.ruleset='duo-v160';
 state.players[0].field[0]=live(7,{mode:'def',soul:100});
 for(const field of ['raidCooldown','condenseLeft','condenseSlice','drainPreference',
  'lastSoulAction','lastDrainSwitch','decaySkipOwnTurn','maxDef'])
  delete state.players[0].field[0][field];
 const after=move(state,0,{type:'soulDischarge',slot:0});
 assert.equal(after.players[0].field[0].lastSoulAction,0);
 assert.equal(after.teams[1].lp,15870);
});
