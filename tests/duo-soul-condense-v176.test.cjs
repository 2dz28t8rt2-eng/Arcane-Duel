'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const rules=require('../assets/duo-shared-rules-v160.js');
const data=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(data.cards.map(c=>[c.id,c]));
const base=[...data.starterMain],fusion=[...data.starterFusions];
function setup(){
 const g=rules.create({roomId:'condense-176',hostName:'A',hostDeck:base,
  hostFusions:fusion,enemyDeckA:base,enemyDeckB:base,
  enemyFusionsA:fusion,enemyFusionsB:fusion,chapter:1,entry:'new',catalog});
 const next=rules.apply(g,2,{type:'join',name:'B',deck:base,fusions:fusion},{catalog});
 next.round=2;return next;
}
const move=(g,seat,action)=>rules.apply(g,seat,action,{catalog});
const live=(id,changes={})=>({id,uid:1000+id,level:catalog[id].level,
 atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,
 fusion:false,mode:'atk',used:false,switched:false,placedRound:0,
 soul:0,condensed:0,soulCooldown:0,raidCooldown:0,condenseLeft:0,
 condenseSlice:0,drainPreference:0,lastSoulAction:-1,lastDrainSwitch:-1,
 decaySkipOwnTurn:-1,decayGrace:1,maxDef:catalog[id].def,resonance:0,...changes});

test('2v2 shares solo half-condensation ATK without modifying base stats',()=>{
 const soul=live(7,{atk:300,condensed:151});
 assert.equal(rules.attackValue(soul),375);
 assert.equal(soul.atk,300);
 assert.equal(rules.attackValue({...soul,condensed:100}),350);
 assert.equal(rules.attackValue({...soul,condensed:0}),300);
 assert.equal(rules.attackValue({...soul,atk:9999,condensed:500}),10000);
 assert.equal(rules.attackValue({...soul,role:'guardian'}),300);
});
test('condense lets a Soul Eater switch and attack in the same turn',()=>{
 let g=setup();g.players[0].field[0]=live(7,{atk:300,mode:'def',soul:200});
 g=move(g,0,{type:'soulCondense',slot:0});
 assert.equal(g.players[0].field[0].soul,50);
 assert.equal(g.players[0].field[0].condensed,150);
 assert.equal(g.players[0].field[0].atk,300);
 assert.equal(rules.attackValue(g.players[0].field[0]),375);
 assert.equal(g.players[0].field[0].used,false);
 g=move(g,0,{type:'switch',slot:0});
 g=move(g,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 assert.equal(g.teams[1].lp,16000-375);
 assert.equal(g.players[0].field[0].used,true);
});
test('condensation shield loss immediately reduces the defender counterstrike',()=>{
 let g=setup();g.players[0].field[0]=live(2,{atk:200});
 g.players[1].field[0]=live(7,{atk:400,def:1000,mode:'def',condensed:200});
 g=move(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 const remaining=g.players[1].field[0].condensed;
 assert.ok(remaining>0&&remaining<200);
 assert.equal(g.teams[0].lp,16000-Math.floor((400+Math.floor(remaining*.5))*.5));
 assert.equal(g.players[1].field[0].atk,400);
});
test('ATK-position enemy Soul Eater resists with its current temporary ATK',()=>{
 let g=setup();g.players[0].field[0]=live(2,{atk:220});
 g.players[1].field[0]=live(7,{atk:200,mode:'atk',condensed:100});
 g=move(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 assert.equal(g.teams[0].lp,15970);
 assert.equal(g.players[1].field[0].atk,200);
});
test('three-own-turn decay/cooldown are unchanged and UI/server show same bonus',()=>{
 let g=setup();g.players[0].field[0]=live(7,{atk:300,mode:'def',soul:200});
 g=move(g,0,{type:'soulCondense',slot:0});
 g=move(g,0,{type:'end'});
 assert.equal(g.players[0].field[0].condensed,100);
 assert.equal(g.players[0].field[0].condenseLeft,2);
 assert.equal(g.players[0].field[0].soulCooldown,2);
 assert.equal(rules.attackValue(g.players[0].field[0]),350);
 const read=file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');
 assert.equal(read('assets/duo-shared-rules-v160.js'),
  read('supabase/functions/arcane-duo-v2/duo-rules.js'));
 const ui=read('assets/duo-parity-v160.js');
 assert.match(ui,/shownAtk\(c\)/);
 assert.match(ui,/shownAtk\(c\)\+' ATK/);
 assert.match(ui,/Math\.floor\(\(c\.condensed\|\|0\)\*\.5\)/);
 assert.match(ui,/Verdichten · DEF und ATK stärken/);
});
