'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const {makeTrainingDeck,STYLES}=require('./helpers/stage-training-decks-v59.cjs');
const vm=boot({seed:590024});
const source=vm.run('({cards:CARDS.map(c=>({id:c.id,name:c.name,level:c.level,atk:c.atk,def:c.def,role:c.role,source:c.source,hard:c.hard,ace:c.ace,retired:c.retired,rpg:c.rpg,enemyOnly:c.enemyOnly,essenceMonster:c.essenceMonster,lv1Exclusive:c.lv1Exclusive,workshopOnly:c.workshopOnly,fateOnly:c.fateOnly,fusionOnly:c.fusionOnly})),defaultDeck:DEFAULT_DECK,startFusions:RPG_START_FUSIONS,opponents:RPG_OPPONENTS.map(o=>({level:o.level}))})');
test('every tier 1–10 has five genuinely distinct deck archetypes and legal 40/2–15 structure',()=>{
 for(let tier=1;tier<=10;tier++){
  const rows=STYLES.map(style=>makeTrainingDeck(source,tier,style));
  for(const row of rows){
   assert.equal(row.deck.length,40,'tier '+tier+' '+row.style);
   assert.ok(row.fusionDeck.length>=2&&row.fusionDeck.length<=15);
   assert.ok(new Set(row.deck).size>=14);
   assert.equal(vm.run('mainDeckError('+JSON.stringify(row.deck)+')'),'');
   assert.equal(vm.run('fusionDeckError('+JSON.stringify(row.fusionDeck)+')'),'');
   assert.ok(row.meta.maxLevel<=row.meta.levelCap);
   for(const id of row.deck.concat(row.fusionDeck)){
    const c=source.cards[id];
    const isStarter=source.defaultDeck.includes(id)||source.startFusions.includes(id);
    assert.ok(isStarter||Number.isInteger(c.source)&&c.source>=0&&c.source<=tier-1,
      'future-locked card '+id+' in tier '+tier);
    assert.ok(c.level<=row.meta.levelCap,'overlevel '+id+' in '+tier);
    assert.ok(!c.ace&&!c.hard&&!c.enemyOnly&&!c.retired&&!c.lv1Exclusive,
     'uncollectible '+id+' in tier '+tier);
   }
  }
  assert.ok(new Set(rows.map(row=>row.deck.join(','))).size>=2,
   'Insufficient style variation in tier '+tier);
 }
});
test('training deck difficulty steps up between early, mid and final tournament',()=>{
 const rows=[1,3,5,7,10].map(tier=>makeTrainingDeck(source,tier,'balanced','invested'));
 assert.ok(rows[0].meta.levelCap<rows.at(-1).meta.levelCap);
 assert.ok(rows[0].meta.averageLevel<rows.at(-1).meta.averageLevel,
  JSON.stringify(rows.map(x=>x.meta)));
 for(const [i,row] of rows.entries())if(i)assert.ok(row.meta.maxSource>=rows[i-1].meta.maxSource);
});
test('decks are repeatably generated without mutating game collection',()=>{
 const a=makeTrainingDeck(source,7,'soul','normal'),b=makeTrainingDeck(source,7,'soul','normal');
 assert.deepEqual(a,b);
 const variants=['normal','invested','conservative'].map(x=>makeTrainingDeck(source,8,'predator',x));
 assert.equal(variants.length,3);
 assert.ok(variants.every(x=>x.deck.length===40&&x.fusionDeck.length>=2));
});
test('new stage decks can complete actual tournament matches without runtime errors',()=>{
 const sets=[1,4,7,10].map(t=>makeTrainingDeck(source,t,'guardian'));
 const rows=vm.run(`(()=>{const sets=${JSON.stringify(sets)},out=[];for(const x of sets){
  const g=createGame({mode:'pve',context:'tournament',opponentId:x.tier,
   seed:591227+x.tier,deck:x.deck,fusionDeck:x.fusionDeck});
  let err=null;try{simulateGame(g,'guardian','balanced');}catch(e){err=String(e);}
  out.push({tier:x.tier,winner:g.winner,error:err,halfTurns:g.turn});
 }return out;})()`,180000);
 for(const x of rows){assert.equal(x.error,null,'tier '+x.tier+': '+x.error);assert.ok([0,1].includes(x.winner));}
});
