'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
const rules=require('../assets/duo-shared-rules-v160.js');
const adversaries=require('../assets/duo-adversaries-v200.js');
const solo=require('../assets/duo-opponent-catalog-v201.json');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const sort=ids=>[...ids].sort((a,b)=>a-b);
const create=chapter=>{
 const quest=chapter>=11;
 return rules.create({roomId:'parity-201-'+chapter,hostName:'Hannes',
  hostDeck:snapshot.starterMain,hostFusions:snapshot.starterFusions,
  enemyDeckA:adversaries.enemyDeck(chapter,1,snapshot.cards,snapshot.starterMain,solo),
  enemyDeckB:adversaries.enemyDeck(chapter,3,snapshot.cards,snapshot.starterMain,solo),
  enemyFusionsA:adversaries.enemyFusions(chapter,snapshot.cards,solo),
  enemyFusionsB:adversaries.enemyFusions(chapter,snapshot.cards,solo),
  enemyPowerA:adversaries.enemyPower(chapter,solo),
  enemyPowerB:adversaries.enemyPower(chapter,solo),
  enemyNameA:adversaries.enemyNames(chapter,solo)[0],
  enemyNameB:adversaries.enemyNames(chapter,solo)[1],
  chapter,entry:quest?'quest':chapter===1?'new':'chapter',catalog});
};
test('all ten opponent manifests stay generated from the actual 111-script solo runtime',()=>{
 const repo=path.resolve(__dirname,'..');
 assert.equal(fs.readFileSync(path.join(repo,'assets/duo-opponent-catalog-v201.json'),'utf8'),
  fs.readFileSync(path.join(repo,'supabase/functions/arcane-duo-v2/opponents.json'),'utf8'));
 assert.equal(fs.readFileSync(path.join(repo,'assets/duo-adversaries-v200.js'),'utf8'),
  fs.readFileSync(path.join(repo,'supabase/functions/arcane-duo-v2/duo-adversaries-v200.js'),'utf8'));
 const runtime=boot({seed:160026});
 const expected=runtime.run(`Array.from({length:10},(_,i)=>{
  const x=rpgEnemyLoadout(i+1,'easy');return {deck:x.deck,fusions:x.fusionDeck,power:x.power};
 })`);
 for(let i=0;i<10;i++){
  assert.deepEqual(solo.roster[i].deck,expected[i].deck);
  assert.deepEqual(solo.roster[i].fusions,expected[i].fusions);
  assert.equal(solo.roster[i].power,expected[i].power);
 }
});
test('all campaign chapters start with exactly double the actual solo tournament LP',()=>{
 const runtime=boot();
 for(let stage=1;stage<=10;stage++){
  const actualSolo=runtime.run(`duelStartingLP('pve',${stage},'easy','tournament')`);
  const g=create(stage);
  assert.equal(rules.soloStartingLp(stage),actualSolo,'Solo tier '+stage);
  assert.deepEqual(g.teams.map(t=>t.maxLp),[actualSolo*2,actualSolo*2]);
  assert.deepEqual(g.teams.map(t=>t.lp),[actualSolo*2,actualSolo*2]);
  assert.equal(g.lpParityVersion,2);
 }
});
test('both AI duellants draw exclusively from the exact same solo NPC deck and fusion templates',()=>{
 for(let stage=1;stage<=15;stage++){
  const reference=stage===10?solo.showcase:stage<=9?solo.roster[stage-1]:solo.saga[stage-11];
  const g=create(stage);
  for(const seat of [1,3]){
   assert.deepEqual(sort(g.players[seat].baseDeck),sort(reference.deck),
    'Chapter '+stage+' enemy '+seat+' main multiset');
   assert.deepEqual(g.players[seat].baseFusions,reference.fusions,
    'Chapter '+stage+' enemy '+seat+' fusion templates');
   assert.equal(g.players[seat].opponentPower,reference.power);
   assert.ok(rules.validNpcFusionDeck(g.players[seat].baseFusions,catalog));
  }
 }
 assert.equal(create(10).players[1].name,'Eiman Huel Stalker');
 assert.equal(create(10).players[3].name,'Hans Ess Kirk');
});
test('five Level-1 stages use solo stage LP and combat strength, doubled only in duo',()=>{
 for(let stage=11;stage<=15;stage++){
  const ref=solo.saga[stage-11],g=create(stage);
  assert.equal(rules.soloStartingLp(stage),ref.lp);
  assert.equal(g.teams[0].maxLp,ref.lp*2);
  assert.equal(g.teams[1].maxLp,ref.lp*2);
  assert.equal(g.players[1].opponentPower,ref.power);
 }
});
test('Fanatic starts with sealed Lumira outside the exact 40-card solo deck',()=>{
 for(let stage=11;stage<=14;stage++){
  let g=create(stage);
  g=rules.apply(g,2,{type:'join',name:'Duo',deck:snapshot.starterMain,
   fusions:snapshot.starterFusions},{catalog});
  assert.equal(g.players[1].hand[0],714);
  assert.deepEqual(sort(g.players[1].deck.concat(g.players[1].hand.slice(1))),
   sort(solo.saga[stage-11].deck));
  g=rules.apply(g,0,{type:'end'},{catalog});
  g=rules.aiTurn(g,{catalog});
  assert.ok(g.players[1].field.some(c=>c?.id===714),
   'Fanatic must summon the sealed solo ACE in stage '+stage);
 }
});
test('chapter transitions reset LP to the NEW tier and cannot secretly modify enemy deck contents',()=>{
 let g=create(3);
 g=rules.apply(g,2,{type:'join',name:'Duo',deck:snapshot.starterMain,
  fusions:snapshot.starterFusions},{catalog});
 g.status='finished';g.winner=0;
 const fourth=4,foe=adversaries.enemyDeck(fourth,1,snapshot.cards,snapshot.starterMain,solo);
 const ally=adversaries.enemyDeck(fourth,3,snapshot.cards,snapshot.starterMain,solo);
 g=rules.apply(g,0,{type:'nextChapter'},{catalog});
 assert.equal(g.status,'inviting_next');
 g=rules.apply(g,2,{type:'acceptNextChapter'},{catalog,
  enemyDeckA:foe,enemyDeckB:ally,
  enemyFusionsA:adversaries.enemyFusions(fourth,snapshot.cards,solo),
  enemyFusionsB:adversaries.enemyFusions(fourth,snapshot.cards,solo),
  enemyPowerA:adversaries.enemyPower(fourth,solo),
  enemyPowerB:adversaries.enemyPower(fourth,solo),
  enemyNameA:adversaries.enemyNames(fourth,solo)[0],
  enemyNameB:adversaries.enemyNames(fourth,solo)[1]});
 assert.equal(g.chapter,4);
 assert.deepEqual(g.teams.map(t=>[t.lp,t.maxLp]),[[8000,8000],[8000,8000]]);
 assert.deepEqual(g.players[1].hand.concat(g.players[1].deck).sort((a,b)=>a-b),[...foe].sort((a,b)=>a-b));
 assert.deepEqual(g.players[3].hand.concat(g.players[3].deck).sort((a,b)=>a-b),[...ally].sort((a,b)=>a-b));
});
test('older existing rooms keep saved LP during their current fight',()=>{
 const old=create(2);old.teams.forEach(t=>{t.maxLp=16000;t.lp=16000;});
 delete old.lpParityVersion;
 const joined=rules.apply(old,2,{type:'join',name:'Legacy Partner',
  deck:snapshot.starterMain,fusions:snapshot.starterFusions},{catalog});
 assert.equal(joined.teams[0].lp,16000);
 assert.equal(joined.teams[1].lp,16000);
 assert.equal(rules.arenaDamage(joined,10),320);
});
