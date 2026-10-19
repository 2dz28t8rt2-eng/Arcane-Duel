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
