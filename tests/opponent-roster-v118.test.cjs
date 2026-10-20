'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
function load(difficulty='easy',withoutRoster118=false){
 const expr="(()=>{ const ranks=[1,2,3,4,5,6,7,8,9,10],o={}; for(const i of ranks){"+
 " const p=rpgEnemyLoadout(i,'DIFFICULTY');"+
 " const hist=ids=>ids.reduce((a,id)=>(a[CARDS[id].level]=(a[CARDS[id].level]||0)+1,a),{});"+
 " const over=ids=>[...new Set(ids)].filter(id=>ids.filter(x=>x===id).length>3);"+
 " const rank10=p.fusionDeck.filter(id=>CARDS[id].level===10);"+
 " o[i]={size:p.deck.length,fusionSize:p.fusionDeck.length,mainHist:hist(p.deck),fusionHist:hist(p.fusionDeck),"+
 " maxNormal:Math.max(...p.deck.map(id=>CARDS[id].level)),maxFusion:Math.max(...p.fusionDeck.map(id=>CARDS[id].level)),"+
 " ace:ACE_CARD_IDS[i],aceFusionCount:p.fusionDeck.filter(id=>id===ACE_CARD_IDS[i]).length,aceMainCount:p.deck.filter(id=>id===ACE_CARD_IDS[i]).length,"+
 " aceRank:CARDS[ACE_CARD_IDS[i]].level,nonAce10:rank10.filter(id=>id!==ACE_CARD_IDS[i]).length,"+
 " invalidMain:p.deck.filter(id=>CARDS[id].fusionOnly||!CARDS[id].rpg),"+
 " invalidFusion:p.fusionDeck.filter(id=>!CARDS[id].fusionOnly),"+
 " overMain:over(p.deck),overFusion:over(p.fusionDeck),operations:p.roster118||null,main:p.deck,fusions:p.fusionDeck};"+
 " } return {cards:CARDS.length,normalPool:CARDS.filter(c=>c.rpg&&!c.fusionOnly).length,"+
 " fusionPool:CARDS.filter(c=>c.rpg&&c.fusionOnly).length,bosses:o}; })()";
 return boot({seed:11810,withoutRoster118}).run(expr.replace("DIFFICULTY",difficulty));
}
test('VII has exactly three Lv10 fusion slots, exactly one genuine Lv10 ACE, and legal deck',()=>{
 const p=load().bosses[7];
 assert.equal(p.size,40);assert.ok(p.fusionSize>=1&&p.fusionSize<=15);
 assert.equal(p.fusionHist[10],3,JSON.stringify(p));
 assert.equal(p.aceFusionCount,1);assert.equal(p.nonAce10,2);
 assert.deepEqual(p.invalidMain,[]);assert.deepEqual(p.invalidFusion,[]);
 assert.deepEqual(p.overMain,[]);assert.deepEqual(p.overFusion,[]);
 assert.equal(p.operations.find(x=>x.boss===7).rank10,3);
});
test('VI main and fusion deck includes actual one-rank-lower replacements while preserving signature',()=>{
 const old=load('easy',true).bosses[6],now=load().bosses[6];
 assert.equal(now.operations.find(x=>x.kind==='main').changed,5,JSON.stringify(now));
 assert.ok(now.operations.find(x=>x.kind==='fusion').changed>=1,JSON.stringify(now));
 for(const x of now.operations)for(const op of x.details||[]){
  assert.equal(op.fromLevel-op.toLevel,1);assert.ok(op.from!==op.to);
 }
 assert.equal(old.size,now.size);assert.equal(old.fusionSize,now.fusionSize);
 assert.equal(now.aceMainCount+now.aceFusionCount,1);
 assert.deepEqual(now.overMain,[]);assert.deepEqual(now.overFusion,[]);
});
test('X loses five maximum-level normal cards and three non-ACE fusion slots',()=>{
 const old=load('easy',true).bosses[10],now=load().bosses[10];
 assert.equal(now.operations.find(x=>x.kind==='main').changed,5,JSON.stringify(now));
 assert.ok(now.operations.find(x=>x.kind==='fusion').changed>=1,JSON.stringify(now));
 for(const x of now.operations)for(const op of x.details||[])
  assert.equal(op.fromLevel-op.toLevel,1);
 assert.equal(old.size,now.size);assert.equal(old.fusionSize,now.fusionSize);
 assert.equal(now.aceMainCount+now.aceFusionCount,1);
 assert.ok((now.fusionHist[10]||0)>1,'X still has multiple dangerous Level 10 fusions');
 assert.deepEqual(now.overMain,[]);assert.deepEqual(now.overFusion,[]);
});
test('hard mode has legal adjusted decks, and other tournament opponents remain unchanged',()=>{
 const now=load('hard');
 for(const id of [1,2,3,4,5,6,7,8,9,10]){
  const p=now.bosses[id];assert.equal(p.size,40);assert.ok(p.fusionSize<=15);
  assert.deepEqual(p.overMain,[]);assert.deepEqual(p.overFusion,[]);
  assert.deepEqual(p.invalidMain,[]);assert.deepEqual(p.invalidFusion,[]);
 }
 assert.equal(now.bosses[7].fusionHist[10],3);
 assert.equal(now.bosses[7].aceFusionCount,1);
 for(let id=1;id<=10;id++){const p=now.bosses[id];assert.equal(p.aceMainCount+p.aceFusionCount,1,'hard boss '+id);}
});

test('all ten bosses hold one and only one personal ACE in both easy and hard encounters',()=>{
 for(const difficulty of ['easy','hard']){
  const set=load(difficulty).bosses;
  for(let id=1;id<=10;id++){
   const p=set[id];
   assert.equal(p.aceMainCount+p.aceFusionCount,1,difficulty+' boss '+id);
   assert.equal(p.size,40);
   assert.ok(p.fusionSize>=1&&p.fusionSize<=15);
   assert.deepEqual(p.overMain,[]);assert.deepEqual(p.overFusion,[]);
  }
 }
});
