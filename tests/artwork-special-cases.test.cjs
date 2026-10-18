'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot,repo}=require('./helpers/game-runtime.cjs');
test('all 10 Fate monsters have dedicated, distinct matching portraits in duel and cinematic',()=>{
 const b=boot();
 const r=b.run("(()=>{const visuals=window.ArcaneFateVisuals;return {names:FATE_NAMES,ids:FATE_CARD_IDS,portraits:FATE_NAMES.map((name,i)=>({name,art:visuals.artFor(i),inCard:dataOf({id:FATE_CARD_IDS[i],card:{...CARDS[FATE_CARD_IDS[i]],level:10,atk:800,def:800},fate:true}).art===visuals.artFor(i)})),cinema:fateAnimation.toString()};})()");
 assert.equal(r.portraits.length,10);
 assert.equal(new Set(r.portraits.map(x=>x.art)).size,10,'Fate art must never reuse unrelated templates');
 assert.ok(r.portraits.every(x=>x.inCard),'Normal card preview does not share the dedicated Fate art');
 assert.match(r.cinema,/ArcaneFateVisuals\?\.artFor/);
 assert.doesNotMatch(r.cinema,/CARDS\[FATE_ART_IDS\[fid\]\]\.art/);
 console.log('FATE_ARTWORK_CHECK',JSON.stringify(r.portraits.map(x=>({name:x.name,distinct:true,inCard:x.inCard,source:x.art.slice(0,26)}))));
});
test('Eiman Huel deck artwork mapping uses actual owned assets, no generated fallback',()=>{
 const b=boot();
 const r=b.run("(()=>{const enemy=showcaseEnemy(),ids=[...new Set([...enemy.deck,...enemy.fusionDeck])];return {main:enemy.deck.length,side:enemy.fusionDeck.length,cards:ids.map(id=>({id,name:CARDS[id].name,art:CARDS[id].art,level:CARDS[id].level}))};})()");
 const invalid=r.cards.filter(c=>!c.art.startsWith('assets/')||!fs.existsSync(path.resolve(repo,c.art.split('?')[0])));
 assert.equal(invalid.length,0,JSON.stringify(invalid));
 console.log('EIMAN_ARTWORK_CHECK',JSON.stringify({main:r.main,side:r.side,uniqueArtworkPaths:new Set(r.cards.map(x=>x.art)).size,cards:r.cards}));
});
