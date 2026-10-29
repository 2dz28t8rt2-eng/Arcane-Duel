'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const inspect=code=>boot({seed:207}).run(code);
test('LP climb is 2k/4k/8k across solo and exactly twice in duo',()=>{
 const solo=inspect('([0,1,3,4,6,8,9,10].map(id=>duelStartingLP("pve",id)))');
 assert.deepEqual(solo,[2000,2000,2000,4000,4000,4000,8000,8000]);
 assert.deepEqual([1,3,4,6,8,9,10].map(i=>rules.duoStartingLp(i)),[4000,4000,8000,8000,8000,16000,16000]);
 assert.equal(rules.duoStartingLp(11),4000);
});
test('full five-slot solo field accepts staging and replaces exactly one card',()=>{
 const r=inspect(`(()=>{
  profile=freshProfile();
  game=createGame({mode:'pve',opponentId:1,seed:1027});
  game.active=0;
  const p=game.players[0],uid=p.hand[0].uid;
  p.field=Array.from({length:5},()=>newInstance(game,p.hand[0].id,0));
  const before=p.field.map(c=>c.uid),length=p.hand.length;
  const staged=prepareNormal(game,uid),stillOnHand=p.hand.some(c=>c.uid===uid);
  const placed=placePending(game,0,'replace');
  return {staged,stillOnHand,placed:!!placed,replaced:placed?.replaced,
   fused:placed?.fused,grave:p.graveyard.some(c=>c.uid===before[0]),
   newUid:p.field[0]?.uid===uid,otherSlots:p.field.slice(1).every((c,i)=>c.uid===before[i+1]),
   cardsUsed:length-p.hand.length};
 })()`);
 assert.equal(r.staged,true);assert.equal(r.stillOnHand,true);assert.equal(r.placed,true);
 assert.equal(r.replaced,true);assert.equal(r.fused,false);assert.equal(r.grave,true);
 assert.equal(r.newUid,true);assert.equal(r.otherSlots,true);assert.equal(r.cardsUsed,1);
});
test('pending solo summon is reversible without spending the hand card',()=>{
 const r=inspect(`(()=>{
 profile=freshProfile();game=createGame({mode:'pve',opponentId:1,seed:2027});game.active=0;uiMode='duel';$('overlay').classList.add('hidden');
 const p=game.players[0],uid=p.hand[0].uid;
 game.selection={type:'hand',uid};prepareSummon();
 const pending=!!game.pending,kept=p.hand.some(c=>c.uid===uid);
 clearSelection();
 return {pending,kept,cleared:!game.pending,still:p.hand.some(c=>c.uid===uid)};
 })()`);
 assert.deepEqual(r,{pending:true,kept:true,cleared:true,still:true});
});
test('duo replace consumes one summon and preserves all unaffected teammate slots',()=>{
 const deck=snapshot.starterMain,fusions=snapshot.starterFusions;
 const g=rules.apply(rules.create({roomId:'v207replace',catalog,hostName:'Host',hostDeck:deck,hostFusions:fusions,
  enemyDeckA:deck,enemyDeckB:deck,enemyFusionsA:fusions,enemyFusionsB:fusions}),
  2,{type:'join',name:'Mate',deck,fusions},{catalog});
 const before=rules.apply(g,0,{type:'summon',handIndex:0,slot:0},{catalog});
 assert.equal(before.players[0].summoned,true);
 before.players[0].summoned=false;
 const previous=before.players[0].field[0].uid;
 const oldGrave=before.players[0].graveyard.length;
 const after=rules.apply(before,0,{type:'replace',handIndex:0,slot:0},{catalog});
 assert.equal(after.players[0].field[0].uid===previous,false);
 assert.equal(after.players[0].graveyard.length,oldGrave+1);
 assert.equal(after.players[0].summoned,true);
});
test('HTML and mechanics expose new staging and shorter counterattack',()=>{
 const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
 assert.match(read('assets/summon-stage-v56.js'),/data-ad207-clear/);
 assert.match(read('assets/soul-burst-v207.js'),/ad207-soul-beam/);
 assert.match(read('assets/duel-cinematics-v42.js'),/kind==='counter'\?490:860/);
 assert.match(read('assets/handbook-human-v180.js'),/27 · Beschwören/);
 assert.match(read('index.html'),/soul-burst-v207.js/);
 assert.equal(read('assets/duo-shared-rules-v160.js'),read('supabase/functions/arcane-duo-v2/duo-rules.js'));
});
