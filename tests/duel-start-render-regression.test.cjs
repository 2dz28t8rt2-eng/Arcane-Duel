'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Duel hand role rendering works without optional combat roleOf',()=>{
 const clarity=read('assets/duel-card-clarity-v41.js'),progress=read('assets/essence-progression.js');
 assert.doesNotMatch(clarity,/window\.ArcaneEssenceCombat\.roleOf/);
 assert.doesNotMatch(progress,/C\.roleOf/);
 assert.match(clarity,/const roleOf=c=>c\?\.roleOverride\|\|CARDS\[c\?\.id\]\?\.role\|\|'combatant'/);
 assert.match(progress,/const CARB=roleOf/);
});
test('Invalidate combat and both role renderer caches on the deployed page',()=>{
 const page=read('index.html');
 for(const file of ['essence-combat.js','essence-progression.js','duel-card-clarity-v41.js']){
  const version=file==='essence-combat.js'?'qa-stage2-20261018':'duel-start-fix-20261017-1';
  assert.ok(page.includes('assets/'+file+'?v='+version),file);
 }
});