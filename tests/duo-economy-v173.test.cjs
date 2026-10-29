'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const econ=require('../assets/duo-economy-v172.js');
const rules=require('../assets/duo-shared-rules-v160.js');
const data=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(data.cards.map(c=>[c.id,c]));
const starter=()=>({
 owned_main:[...data.starterMain],owned_fusions:[...data.starterFusions],
 deck:[...data.starterMain],fusions:[...data.starterFusions],enhancements:{},
 essence:2000,shards:20,cleared_chapters:[1,2]
});
const unusedMain=()=>{
 const p=starter();const id=p.deck[0];p.owned_main.push(id);return {p,id};
};
const file=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('enhancements use already supported 2v2 rank 0–5 and scale costs',()=>{
 const p=starter(),id=p.deck[0],c=catalog[id],o=econ.enhanceOffer(p,id,catalog);
 assert.equal(econ.ENHANCEMENT_MAX,5);
 assert.equal(o.rank,0);assert.equal(o.nextRank,1);
 assert.equal(o.essence,75);assert.equal(o.shards,1);
 assert.equal(o.bonusPerStat,id<20?10:30);
 p.enhancements[id]=4;
 const top=econ.enhanceOffer(p,id,catalog);
 assert.equal(top.nextRank,5);
 assert.equal(top.essence,75+55*4);
 assert.equal(top.shards,3);
 p.enhancements[id]=5;
 assert.equal(econ.enhanceOffer(p,id,catalog).maxed,true);
 // Enhancements must be accepted by the existing authoritative build validator.
 assert.equal(rules.normalizedBuild({},p.enhancements,p.deck,p.fusions,catalog).enhancements[id],5);
});
test('fusion upgrades use smaller stat boost but cost more',()=>{
 const p=starter(),id=p.fusions[0],o=econ.enhanceOffer(p,id,catalog);
 assert.equal(o.bonusPerStat,20);
 assert.equal(o.essence,110);
 assert.equal(o.shards,2);
});
test('recycling never sells a card currently used in any active deck',()=>{
 const p=starter(),id=p.deck[0];
 assert.equal(econ.recycleOffer(p,id,catalog),null);
 p.owned_main.push(id);
 const offer=econ.recycleOffer(p,id,catalog);
 assert.equal(offer.spare,1);
 assert.equal(offer.used,p.deck.filter(x=>x===id).length);
 assert.ok(offer.essence>0);
 assert.equal(offer.shards,1);
 assert.ok(offer.essence<90,'recycling must not outperform fresh pack prices');
});
test('only unused fusion copies may be recycled',()=>{
 const p=starter(),id=p.fusions[0];
 assert.equal(econ.recycleOffer(p,id,catalog),null);
 p.owned_fusions.push(id);
 const o=econ.recycleOffer(p,id,catalog);
 assert.equal(o.spare,1);assert.equal(o.fusion,true);assert.equal(o.shards,2);
});
test('protected quest cards and essence monsters never produce recycle offers',()=>{
 const p=starter();
 for(const id of [711,712,713,396,397,398]){
  if(catalog[id].fusionOnly)p.owned_fusions.push(id);
  else p.owned_main.push(id);
  assert.equal(econ.recycleOffer(p,id,catalog),null,'special item must be safe '+id);
 }
});
test('collection reports only owned counts and truly free duplicates',()=>{
 const {p,id}=unusedMain(),rows=econ.collectionRows(p,catalog);
 const item=rows.find(x=>x.id===id&&!x.fusion);
 assert.ok(item);
 assert.equal(item.quantity,item.used+item.spare);
 assert.equal(item.spare,1);
 assert.equal(item.recyclable,true);
 assert.ok(rows.every(x=>x.quantity>0&&Number.isInteger(x.level)));
 assert.ok(econ.collectionRows(p,catalog,'main').every(x=>!x.fusion));
 assert.ok(econ.collectionRows(p,catalog,'fusion').every(x=>x.fusion));
});
test('server endpoint requires CAS and stores enhanced or recycled cards in one write',()=>{
 const edge=file('supabase/functions/arcane-duo-v2/index.ts');
 assert.ok(edge.includes('economy.enhanceOffer(p,body.cardId,catalog)'));
 assert.ok(edge.includes('economy.recycleOffer(p,body.cardId,catalog)'));
 assert.ok(edge.includes('enhancements:{...p.enhancements,[body.cardId]:offer.nextRank}'));
 assert.ok(edge.includes('[column]:collection'));
 assert.ok(edge.includes('expectedRevision===p.revision'));
 assert.ok(edge.includes('game.normalizedBuild('));
});
test('repeat rewards cannot be paid more than three extra times per UTC day',()=>{
 const sql=file('supabase/migrations/202610260003_arcane_duo_v2_repeat_rewards.sql');
 assert.ok(sql.includes('if v_daily >= 3 then continue; end if;'));
 assert.ok(sql.includes('if v_first then'));
 assert.ok(sql.includes('for update'));
 assert.ok(sql.includes('on conflict do nothing'));
 assert.ok(sql.includes('not (v_chapter = any(v_clear))'));
 assert.ok(sql.includes("security invoker"));
});
