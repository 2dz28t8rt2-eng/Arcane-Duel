'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot,repo}=require('./helpers/game-runtime.cjs');
test('Every illustrated normal family now covers all ten of its existing stages',()=>{
 const rows=boot().run(`(()=>{const groups=new Map();for(const [key,id]of ARCANE_STAGE_IDS){const root=Number(key.split(':')[0]);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(CARDS[id]);}return [...groups].map(([root,cards])=>({root,count:cards.length,illustrated:cards.filter(c=>c.art.startsWith('assets/')).length,paths:[...new Set(cards.filter(c=>c.art.startsWith('assets/')).map(c=>c.art))]}));})()`);
 for(const r of rows){assert.equal(r.count,10);if(r.illustrated)assert.equal(r.illustrated,10,JSON.stringify(r));for(const art of r.paths)assert.ok(fs.existsSync(path.join(repo,art)),art);}
});
test('The coverage audit reports the actual remaining gaps instead of claiming completeness',()=>{
 const r=boot().run('ArcaneArtworkCoverage.audit()');
 assert.equal(r.repairedCards,84);assert.equal(r.missingCards,70);assert.equal(r.missingMotifs,16);
 assert.deepEqual(r.motifs.map(m=>m.id).sort((a,b)=>a-b),[77,78,390,391,392,393,394,395,396,398,575,587,599,611,623,671]);
 assert.equal(r.motifs.filter(m=>m.enemyOnly).length,6);assert.equal(r.motifs.filter(m=>m.essence).length,2);
});
