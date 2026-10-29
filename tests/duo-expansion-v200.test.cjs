const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const rules=require('../assets/duo-shared-rules-v160.js');
const enemies=require('../assets/duo-adversaries-v200.js');
const economy=require('../assets/duo-economy-v172.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const decks=chapter=>({
 enemyDeckA:enemies.enemyDeck(chapter,1,snapshot.cards,snapshot.starterMain),
 enemyDeckB:enemies.enemyDeck(chapter,3,snapshot.cards,snapshot.starterMain),
 enemyFusionsA:enemies.enemyFusions(chapter,snapshot.cards),
 enemyFusionsB:enemies.enemyFusions(chapter,snapshot.cards)
});
const main=()=>[...snapshot.starterMain],side=()=>[...snapshot.starterFusions];
function room(chapter,entry){
 return rules.create({roomId:'duo-test-'+chapter,chapter,entry,catalog,
  hostName:'Hannes',hostDeck:main(),hostFusions:side(),...decks(chapter)});
}
function join(g){return rules.apply(g,2,{type:'join',name:'Partner',deck:main(),
 fusions:side(),upgrades:{},enhancements:{}},{catalog});}

test('ten canonical main chapters and five separately numbered Fanatiker quests',()=>{
 assert.equal(rules.CHAPTERS.length,10);
 assert.equal(rules.QUESTS.length,5);
 assert.deepEqual(rules.QUESTS.map(x=>x.id),[11,12,13,14,15]);
 assert.equal(rules.CHAPTERS[9].name,'Die Prüfung der Hochmütigen');
 assert.throws(()=>room(11,'chapter'),/Questreihe/);
 assert.throws(()=>room(10,'quest'),/Questreihe/);
});

test('all enemy decks and fusion lists are legal, with stronger tiers and unique quest ace',()=>{
 for(let chapter=1;chapter<=15;chapter++)for(const seat of [1,3]){
  const deck=enemies.enemyDeck(chapter,seat,snapshot.cards,snapshot.starterMain);
  assert.ok(rules.validDeck(deck,catalog),`Chapter ${chapter} seat ${seat} main deck`);
  assert.ok(rules.validDeck(enemies.enemyFusions(chapter,snapshot.cards),catalog,true),
   `Chapter ${chapter} fusions`);
  if(chapter===11&&seat===1){
   assert.equal(deck.filter(x=>x===714).length,1);
   assert.equal(deck.filter(id=>catalog[id].level!==1).length,0);
  }
 }
});

test('Eiman Huel Stalker and Hans Ess Kirk have distinct equal-tier level-8–10 boss decks',()=>{
 const a=decks(10),stats=ids=>ids.reduce((sum,id)=>sum+catalog[id].atk+catalog[id].def,0);
 const group=ids=>ids.reduce((obj,id)=>(obj[catalog[id].level]=(obj[catalog[id].level]||0)+1,obj),{});
 assert.notDeepEqual(a.enemyDeckA,a.enemyDeckB);
 assert.deepEqual(group(a.enemyDeckA),group(a.enemyDeckB));
 assert.ok(Math.abs(stats(a.enemyDeckA)-stats(a.enemyDeckB))/stats(a.enemyDeckA)<0.05);
 const g=join(room(10,'chapter'));
 assert.equal(g.players[1].name,'Eiman Huel Stalker');
 assert.equal(g.players[3].name,'Hans Ess Kirk');
 assert.deepEqual(g.players[1].baseDeck,a.enemyDeckA);
 assert.deepEqual(g.players[3].baseDeck,a.enemyDeckB);
});

test('quest intro spawns Lumiras Fall authoritatively but never places unplayable card in deck',()=>{
 const g=join(room(15,'quest'));
 assert.equal(g.players[1].field[0].id,715);
 assert.equal(g.players[1].field[0].atk,920);
 assert.equal(g.players[1].field[0].def,220);
 assert.ok(g.players[1].graveyard.some(x=>x.id===714));
 assert.ok(g.log.some(x=>x.includes('zwangsfusioniert')));
 assert.ok(!g.players.some(p=>p.baseDeck.includes(715)));
});

test('quest advances only after completed objective; server-updated perks and enemies enter next chapter',()=>{
 const g=join(room(11,'quest'));
 g.status='finished';g.winner=0;g.questPassed=false;
 assert.throws(()=>rules.apply(g,0,{type:'nextChapter'},{catalog}),/freigeschaltete/);
 g.questPassed=true;
 const context={catalog,...decks(12),humanBuilds:{
  0:{deck:main(),fusions:[...side(),711,712,713],upgrades:{},enhancements:{},
   essence:{},lv1:{perk:true,rank:1}},
  2:{deck:main(),fusions:[...side(),711,712,713],upgrades:{},enhancements:{},
   essence:{},lv1:{perk:true,rank:1}}
 }};
 const next=rules.apply(g,0,{type:'nextChapter'},context);
 assert.equal(next.chapter,12);
 assert.equal(next.players[0].lv1.perk,true);
 assert.equal(next.players[2].lv1.perk,true);
 assert.deepEqual(next.players[1].baseDeck,context.enemyDeckA);
 assert.deepEqual(next.players[3].baseDeck,context.enemyDeckB);
 assert.deepEqual(next.questProgress,{floating:0,swarm:0,special:0});
});

test('side quest completion does not unlock main chapters or Level-10 cards prematurely',()=>{
 const p={cleared_chapters:[1,2,11,12,13,14,15]};
 assert.equal(economy.maxChapter(p),3);
 assert.equal(economy.maxCardLevel(p),7);
 assert.equal(economy.maxSagaStage(p),15);
 assert.equal(economy.maxSagaStage({cleared_chapters:[1]}),0);
 assert.equal(economy.rewardTable().length,15);
 assert.equal(economy.rewardTable()[10].first.xp,100);
});

test('server and browser use byte-identical expansion modules and migration guards saga rewards',()=>{
 for(const [client,server]of [
  ['assets/duo-shared-rules-v160.js','supabase/functions/arcane-duo-v2/duo-rules.js'],
  ['assets/duo-adversaries-v200.js','supabase/functions/arcane-duo-v2/duo-adversaries-v200.js'],
  ['assets/duo-economy-v172.js','supabase/functions/arcane-duo-v2/duo-economy-v172.js']
 ])assert.equal(fs.readFileSync(path.join(root,client),'utf8'),
  fs.readFileSync(path.join(root,server),'utf8'));
 const migration=fs.readFileSync(path.join(root,
  'supabase/migrations/202610270001_arcane_duo_v2_ten_chapters_fanatic_saga.sql'),'utf8');
 assert.match(migration,/chapter between 1 and 15/);
 assert.match(migration,/questPassed/);
 assert.match(migration,/for update/);
 assert.match(migration,/owned_fusions/);
 assert.match(migration,/chapter_card_credits/);
});
