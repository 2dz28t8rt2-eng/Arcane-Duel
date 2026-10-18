'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot,repo}=require('./helpers/game-runtime.cjs');
test('all 10 purchasable ACEs use their named monster signatures, no generic ACE SVG icons',()=>{
 const r=boot().run("({improvements:ArcaneAceArt54.improvements,unresolved:ArcaneAceArt54.unresolved,ace:RPG_OPPONENTS.slice(1).map(o=>({id:ACE_CARD_IDS[o.id],name:CARDS[ACE_CARD_IDS[o.id]].name,art:CARDS[ACE_CARD_IDS[o.id]].art,baseArt:CARDS[o.originalSignature].customArt||CARDS[o.originalSignature].art,tier:o.id}))})");
 console.log('ACE_ART_AUDIT',JSON.stringify({fixed:r.improvements.length,unresolved:r.unresolved,ace:r.ace}));
 assert.equal(r.unresolved.length,0,'All ACE monsters must have their original curated creature portrait');
 assert.equal(r.improvements.length,10);
 for(const c of r.ace){
  assert.equal(c.art,c.baseArt,c.name+' no longer matches original signature');
  assert.ok(c.art.startsWith('assets/')&&['.webp','.png','.jpg'].some(ext=>c.art.endsWith(ext)),c.art);
  assert.ok(fs.existsSync(path.join(repo,c.art)),c.art);
 }
 assert.equal(new Set(r.ace.map(x=>x.art)).size,10,'Each ACE signature requires independent imagery');
});
