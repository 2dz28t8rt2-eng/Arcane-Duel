'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const e=require('../assets/duo-economy-v172.js');
const d=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(d.cards.map(c=>[c.id,c]));
const profile=(n=0)=>({cleared_chapters:Array.from({length:n},(_,i)=>i+1),
 owned_main:[...d.starterMain],owned_fusions:[...d.starterFusions],
 deck:[...d.starterMain],fusions:[...d.starterFusions],essence:0,shards:0});
const get=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('v17.4 first-clear credits always select allowed cards in highest two unlocked ranks',()=>{
 assert.equal(e.version,'20.0');
 assert.deepEqual(e.chapterCardPool(profile(0),catalog),[]);
 for(let n=1;n<=4;n++){
  const p=profile(n),pool=e.chapterCardPool(p,catalog);
  assert.ok(pool.length>10,'must have meaningful alternatives');
  assert.ok(pool.every(c=>c.playable&&!c.fusionOnly&&!c.essenceMonster));
  assert.ok(pool.every(c=>c.level>=e.maxCardLevel(p)-1&&
   c.level<=e.maxCardLevel(p)));
 }
});
test('after chapter one, every mixed multi-pack offers a stage-relevant monster',()=>{
 for(let n=1;n<=4;n++){
  const p=profile(n);
  for(const kind of ['material3','fusion3','fusion5','fusion10']){
   for(let seed=0;seed<25;seed++){
    let step=seed+1;const rng=bound=>(Math.imul(step++,2654435761)>>>0)%bound;
    const result=e.packDraw(p,kind,catalog,rng);
    assert.ok(result.cards.some(c=>c.level>=e.maxCardLevel(p)-1),
     'at least one catch-up card per multi-pack at stage '+n);
    assert.equal(result.cards.length,e.PACKS[kind].count);
   }
  }
 }
});
test('randomized packs retain access to low-level monsters and legal copies',()=>{
 const p=profile(3),low=[];
 for(let seed=0;seed<70;seed++){
  let step=seed+100;const rng=bound=>(Math.imul(step++,2246822519)>>>0)%bound;
  const result=e.packDraw(p,'normal',catalog,rng);
  low.push(result.cards[0].level);
  assert.equal(result.cards.length,1);
  assert.ok(result.cards[0].level<=9);
 }
 assert.ok(low.some(level=>level<=6),'Lv1/low-level strategies remain available in principle');
});
test('affordability estimates must consider BOTH essence and shards',()=>{
 const p={essence:105,shards:2};
 const normal=e.afford(p,e.PACKS.normal,1);
 assert.equal(normal.canBuy,true);assert.equal(normal.repeatsNeeded,0);
 const fusion=e.afford(p,e.PACKS.fusion,1);
 assert.equal(fusion.repeatsNeeded,2);
 const three=e.afford(p,e.PACKS.material3,1);
 assert.equal(three.repeatsNeeded,3);
 const expensive=e.afford({essence:1500,shards:2},e.PACKS.fusion10,1);
 assert.equal(expensive.repeatsNeeded,8);
});
test('milestone rewards match locked DB rates and never grant credit on repeat',()=>{
 const rewards=e.rewardTable();
 assert.equal(rewards.length,15);
 assert.deepEqual(rewards[0],{chapter:1,
  first:{xp:60,essence:105,shards:2,chapterCards:3},
  repeat:{xp:30,essence:42,shards:1,chapterCards:0}});
 const migration=get('supabase/migrations/202610260004_arcane_duo_v2_chapter_card_credits.sql');
 assert.match(migration,/when v_first then 3 else 0/);
 assert.match(migration,/on conflict do nothing/);
 assert.match(migration,/for update/);
 assert.match(migration,/security invoker/);
});
test('chapter-card claim has revision CAS and writes voucher and owned card in one update',()=>{
 const code=get('supabase/functions/arcane-duo-v2/index.ts');
 assert.match(code,/kind==="chapterCard"/);
 assert.match(code,/expectedRevision===p.revision/);
 assert.match(code,/economy.chapterCardPool\(p,catalog\)/);
 assert.match(code,/chapter_card_credits:p.chapter_card_credits-1/);
 assert.match(code,/owned_main:\[\.\.\.p.owned_main,id\]/);
 assert.ok(!code.includes('hostDeck:body.deck'),'never import solo cards');
});
