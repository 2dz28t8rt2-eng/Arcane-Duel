'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Duel hand role rendering works without optional combat roleOf',()=>{
 const clarity=read('assets/duel-card-clarity-v41.js'),progress=read('assets/essence-progression.js');
 assert.doesNotMatch(clarity,/window\.ArcaneEssenceCombat\.roleOf/);
 assert.doesNotMatch(progress,/C\.roleOf/);
 assert.match(clarity,/const roleOf=c=>c\?\.roleOverride/);
 assert.match(clarity,/CARDS\[c\?\.id\]\?\.role\|\|'combatant'/);
 assert.doesNotMatch(clarity,/\.roleStyle/); // Defender remains a family label, not a separate combat role.
 assert.match(progress,/const CARB=roleOf/);
});
test('Invalidate combat and both role renderer caches on the deployed page',()=>{
 const page=read('index.html');
 for(const file of ['essence-combat.js','essence-progression.js','duel-card-clarity-v41.js']){
  const reference=page.match(new RegExp('assets/'+file.replaceAll('.','\\.')+'\\?v=([^"\\s]+)'));
  assert.ok(reference&&reference[1].length>4,file+' must have a cache-busting version');
 }
});
