'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const baseline=require('./fixtures/guardian-balance-v212-baseline.json');
const browser=require('../assets/duo-card-catalog-v160.json');
const server=require('../supabase/functions/arcane-duo-v2/catalog.json');
const round10=n=>Math.round(n/10)*10;
const ids=new Set(baseline.guardianIds);
function snapshot(seed=21200042){return boot({seed}).run(`({cards:CARDS.map(c=>({
 id:c.id,role:c.role,level:c.level,rpg:c.rpg,retired:c.retired,
 fusionOnly:c.fusionOnly,ace:c.ace,essenceMonster:c.essenceMonster,
 atk:c.atk,def:c.def})),
 version:GUARDIAN_BASE_BALANCE.version,
 loadedDecks:profile?.activeDeck?.length,
 savedProfileVersion:profile?.version})`);}
test('Exactly 84 eligible Guardian cards receive v17.8 95% 22/78 rebalance; no other monster changed',()=>{
 const current=snapshot(),cards=current.cards;
 assert.equal(current.version,'21.2');
 assert.equal(cards.length,baseline.cards.length);
 assert.equal(cards.length,762);
 const affected=[];
 for(let i=0;i<cards.length;i++){
  const c=cards[i],old=baseline.cards[i],isGuardian=
   c.role==='guardian'&&c.rpg===true&&!c.retired&&!c.fusionOnly&&!c.ace&&!c.essenceMonster&&
   Number.isInteger(c.level)&&c.level>=1&&c.level<=10;
  assert.equal(c.id,i,'Card IDs are unchanged');
  assert.equal(ids.has(i),isGuardian,'Eligibility must match the fixed pre-balance roster');
  const expected=old.slice();
  if(isGuardian){
   const pool=round10((old[0]+old[1])*.95);
   const floor=Math.min(80,old[0],Math.floor(pool/20)*10);
   const target=Math.max(floor,Math.min(pool-floor,round10(pool*.22)));
   expected[0]=Math.min(old[0],target);
   expected[1]=pool-expected[0];
   assert.ok(expected[0]<=old[0],'Guardian ATK cannot be buffed');
   assert.ok(expected[0]>=floor&&expected[1]>=floor,'Guardian template floors are safe');
   affected.push({id:i,level:c.level,oldAtk:old[0],atk:c.atk});
  }
  assert.deepEqual([c.atk,c.def],expected,'Unintended base stat change for ID '+i);
 }
 assert.equal(affected.length,84);
 assert.ok(affected.some(c=>c.level===1)&&affected.some(c=>c.level===5)&&
  affected.some(c=>c.level===10),'All levels include tested Guardians');
 assert.ok(affected.filter(c=>c.atk<c.oldAtk).length>20,'ATK actually reduced');
});
test('Repeated game loading, player/NPC summons and PvE progress do not reapply the stat nerf',()=>{
 const a=snapshot(8),b=snapshot(8888);
 assert.deepEqual(a.cards,b.cards);
 assert.equal(a.savedProfileVersion,b.savedProfileVersion);
 const runtime=boot({seed:212});
 const result=runtime.run(`(()=>{
  const id=CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.essenceMonster&&c.role==='guardian'&&c.level===5).id;
  const g=createGame({mode:'pve',opponentId:1,context:'free',seed:212,strategicTraining:{enabled:true,noAttackTurns:0,disableArenaLPDecay:true,symmetricSides:true}});
  const instances=[newInstance(g,id,0),newInstance(g,id,1),newInstance(g,id,0)];
  const expected=instances.map((c,i)=>round10(baseStat(CARDS[id],'atk',g.players[i===1?1:0])));
  const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
  return {id,atk:instances.map(c=>c.card.atk),expected,validSave:!!snap,
   cardsInOriginalDeck:g.players[0].originalDeck.length,
   display:{atk:CARDS[id].atk,def:CARDS[id].def},profileVersion:profile.version};
 })()`);
 assert.deepEqual(result.atk,result.expected);
 assert.ok(result.validSave);
 assert.equal(result.cardsInOriginalDeck,40);
 assert.ok(result.display.atk>0&&result.display.def>0);
});
test('2v2 browser and server catalog match updated Solo source with stable IDs and independent persistence',()=>{
 const cards=snapshot().cards;
 assert.equal(browser.cards.length,cards.length);
 assert.equal(server.cards.length,cards.length);
 for(const c of cards){
  assert.equal(browser.cards[c.id].atk,c.atk,'Duo ATK mismatch '+c.id);
  assert.equal(browser.cards[c.id].def,c.def,'Duo DEF mismatch '+c.id);
  assert.equal(server.cards[c.id].atk,c.atk,'Server ATK mismatch '+c.id);
  assert.equal(server.cards[c.id].def,c.def,'Server DEF mismatch '+c.id);
 }
 assert.deepEqual(browser.starterMain,server.starterMain);
 assert.deepEqual(browser.starterFusions,server.starterFusions);
 const duoJs=fs.readFileSync('assets/duo-parity-v160.js','utf8');
 assert.ok(duoJs.includes('arcane-duel-duo-v171-profile-key'));
 assert.ok(!duoJs.includes("localStorage.getItem('arcane-duel-rpg"));
});
test('35% survivor-only counterstrike and healing are not changed by Guardian stat patch',()=>{
 const src=fs.readFileSync('assets/essence-combat.js','utf8');
 assert.ok(src.includes('const counter= Math.floor(Math.max(0,dataOf(d).atk)*.35);'));
 assert.ok(src.includes('if(isDefender(d)&&!immuneBefore&&!endDefense&&q.field[di]===d)'));
 const solo=fs.readFileSync('assets/game.js','utf8');
 assert.ok(solo.includes('GUARDIAN_BASE_BALANCE=Object.freeze'));
 assert.ok(!solo.includes('ARCANE_RESEARCH_GUARDIAN_STATS_V178'));
});
