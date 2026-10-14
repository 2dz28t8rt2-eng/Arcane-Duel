'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/artwave3-manifest.json'),'utf8'));
test('Artwave 3 uses ten real image files, not simulated images or duplicated cards',()=>{
 assert.equal(manifest.wave,3);assert.equal(manifest.images.length,10);
 assert.equal(new Set(manifest.images.map(x=>x.id)).size,10);
 assert.equal(new Set(manifest.images.map(x=>x.art)).size,10);
 for(const a of manifest.images){
  const file=path.join(root,'assets/custom-art',a.art);
  assert.ok(fs.existsSync(file),`Artwork missing: ${file}`);
  const data=fs.readFileSync(file);
  assert.ok(data.length>20000,`Artwork truncated: ${a.art}`);
  assert.equal(data.subarray(0,4).toString('latin1'),'RIFF',`WebP header missing: ${a.art}`);
  assert.equal(data.subarray(8,12).toString('latin1'),'WEBP',`WebP tag missing: ${a.art}`);
 }
});
test('Artwave 3 does not change card stats or the late white-dragon slot',()=>{
 const s=fs.readFileSync(path.join(root,'assets/game.js'),'utf8');
 assert.ok(s.includes('const CUSTOM_CARD_ART_WAVE_3='));
 assert.ok(s.includes('for(const art of CUSTOM_CARD_ART_WAVE_3)'));
 assert.ok(s.includes('CARDS.forEach(c=>{c.art=c.variantOf==null?')); // New forms share their baseline artwork
 // The new art assets never inject ATK, DEF, cost, level or element overrides.
 for(const a of manifest.images){
  const term=`id:${a.id},name:`;
  assert.ok(s.includes(term),`Missing art mapping ${a.id}`);
  assert.ok(!Object.keys(a).some(k=>['atk','def','level','element','cost','fusionOnly'].includes(k)),`Combat field in artwork override ${a.id}`);
 }
 assert.ok(manifest.images.every(a=>!a.name.toLowerCase().includes('weiß')&&!a.name.toLowerCase().includes('white')));
});
