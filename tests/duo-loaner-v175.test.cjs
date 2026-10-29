'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const rules=require('../assets/duo-shared-rules-v160.js');
const data=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(data.cards.map(c=>[c.id,c]));
const value=id=>Math.max(catalog[id].atk,catalog[id].def)+catalog[id].level*10;
const copies=(list,id)=>list.filter(x=>x===id).length;
test('chapter loaners never overwrite a stronger owned card merely due to slot order',()=>{
 const deck=[...data.starterMain],strong=data.cards
  .filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&c.level===10)
  .slice(0,3).map(c=>c.id);
 deck.splice(0,3,...strong);
 assert.ok(rules.validDeck(deck,catalog));
 const next=rules.chapterDeck(deck,catalog,2);
 assert.ok(rules.validDeck(next,catalog));
 for(const id of strong)assert.equal(copies(next,id),copies(deck,id));
 assert.ok(next.reduce((s,id)=>s+value(id),0)>=
  deck.reduce((s,id)=>s+value(id),0));
 assert.equal(next.length,40);
});
test('loaners are capped at three and cannot weaken an already powerful deck',()=>{
 const loans=rules.chapterDeck(data.starterMain,catalog,3)
  .filter(id=>!data.starterMain.includes(id));
 assert.ok(loans.length>0);
 const deck=[...data.starterMain];deck.splice(0,3,loans[0],loans[0],loans[0]);
 assert.ok(rules.validDeck(deck,catalog));
 const next=rules.chapterDeck(deck,catalog,3);
 assert.ok(rules.validDeck(next,catalog));
 assert.equal(copies(next,loans[0]),3);
 const elites=data.cards.filter(c=>c.playable&&!c.fusionOnly&&!c.ace&&c.level===10);
 const strong=Array.from({length:40},(_,i)=>elites[Math.floor(i/2)].id);
 assert.ok(rules.validDeck(strong,catalog));
 assert.deepEqual(rules.chapterDeck(strong,catalog,2),strong);
});
test('client and server share identical authoritative 2v2 loan rule',()=>{
 const local=fs.readFileSync(path.resolve(__dirname,'../assets/duo-shared-rules-v160.js'),'utf8');
 const deployedSource=fs.readFileSync(path.resolve(__dirname,'../supabase/functions/arcane-duo-v2/duo-rules.js'),'utf8');
 assert.equal(deployedSource,local);
 const ui=fs.readFileSync(path.resolve(__dirname,'../assets/duo-parity-v160.js'),'utf8');
 assert.match(ui,/Stärkere eigene Karten bleiben erhalten/);
});
