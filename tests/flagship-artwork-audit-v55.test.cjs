'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('audit unresolved flagship artwork sources without confusing valid files with final art quality',()=>{
 const r=boot().run("(()=>{const names=['Leerenorakel','Runengeist der Schwelle'];const special=names.map(name=>CARDS.filter(c=>c.name===name).map(c=>({id:c.id,name:c.name,ace:!!c.ace,fusion:!!c.fusionOnly,source:c.art,custom:c.customArt})));const fates=FATE_NAMES.map((name,i)=>({name,source:ArcaneFateVisuals.artFor(i).slice(0,84)}));return {special,fates,aceCorrections:ArcaneAceArt54.improvements.length,unresolvedAce:ArcaneAceArt54.unresolved};})()");
 console.log('FLAGSHIP_ARTWORK_AUDIT',JSON.stringify(r));
 assert.equal(r.fates.length,10);
 assert.ok(r.fates.every(f=>f.source.length>0));
 assert.ok(r.special.every(v=>v.length>0));
 assert.ok(r.aceCorrections>=8,'At least eight ACE signature artworks should be curated');
});

test('three replacement illustrations resolve as local WebP, with unchanged IDs and actual fate artwork shared',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const r=boot().run("(()=>{const neb=ArcaneFateVisuals.artFor(6);const fate={id:FATE_CARD_IDS[6],fate:true,card:{level:10,atk:111,def:111}};const names=['Leerenorakel','Runengeist der Schwelle'];return {neb,fate:dataOf(fate).art,cards:names.map(name=>CARDS.filter(c=>c.name===name).map(c=>({id:c.id,path:c.art,custom:c.customArt,level:c.level,fusion:c.fusionOnly}))) };})()");
 assert.equal(r.neb,'assets/custom-art/fate/nebelkaiser.webp');
 assert.equal(r.fate,r.neb);
 assert.deepEqual(r.cards.map(rows=>rows.map(c=>c.id)),[[322],[695]]);
 const sources=[r.neb,...r.cards.flatMap(rows=>rows.map(c=>c.path))];
 assert.equal(new Set(sources).size,3);
 for(const src of sources){
  const buffer=fs.readFileSync(path.join(__dirname,'..',src));
  assert.equal(buffer.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(buffer.subarray(8,12).toString('ascii'),'WEBP');
  assert.ok(buffer.length>120000,src+' should be a substantial original image');
 }
 assert.ok(r.cards.every(rows=>rows.every(c=>c.fusion&&c.path===c.custom)));
});
