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
