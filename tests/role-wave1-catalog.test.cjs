'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {boot,repo}=require('./helpers/game-runtime.cjs');
test('role-wave staging is inert until the ten actual WebP files exist',()=>{
 const b=boot();
 const result=b.run("({enabled:ArcaneRoleWave1.enabled,cards:ArcaneRoleWave1.cards.map(x=>({key:x.key,role:x.role,style:x.style,level:x.level,path:x.art,requiredTier:x.requiredTier})),before:ArcaneRoleWave1.installedIds.length,catalog:CARDS.length})");
 assert.equal(result.enabled,false);
 assert.equal(result.before,0);
 assert.equal(result.cards.length,10);
 assert.equal(new Set(result.cards.map(c=>c.key)).size,10);
 assert.equal(new Set(result.cards.map(c=>c.path)).size,10);
 assert.deepEqual(Object.fromEntries([...new Set(result.cards.map(c=>c.style))].map(k=>[k,result.cards.filter(c=>c.style===k).length])),
  {predator:2,defender:2,guardian:2,soul:2,allrounder:2});
 assert.ok(result.cards.every(c=>c.path.startsWith('assets/role-wave1/')&&c.path.endsWith('.webp')));
 assert.ok(result.cards.every(c=>c.level>=1&&c.level<=10&&c.requiredTier>=0&&c.requiredTier<=10));
});
test('role-wave activation registers stable IDs in all legal booster/catalog pools',()=>{
 const b=boot();const previous=b.run('CARDS.length');
 const source=fs.readFileSync(path.join(repo,'assets/role-wave1-catalog.js'),'utf8');
 assert.match(source,/const ASSETS_COMPLETE=false/);
 vm.runInContext(source.replace('const ASSETS_COMPLETE=false','const ASSETS_COMPLETE=true'),b.ctx,{filename:'role-wave1-test-activation.js'});
 const result=b.run("(()=>{const a=ArcaneRoleWave1.install(),second=ArcaneRoleWave1.install(),ids=a.ids;return {count:a.installed,first:ids[0],last:ids.at(-1),idempotent:second.installed===10,rows:ids.map(id=>({id,role:CARDS[id].role,style:CARDS[id].roleStyle,active:!CARDS[id].retired,inMain:UPDATE_B_MAIN_IDS.includes(id),inBase:RPG_BASE_CARDS.some(c=>c.id===id),inAll:UPDATE_B_SET.has(id),booster:boosterPools(10).normal.includes(id),image:CARDS[id].art})),profileValid:!!validateProfile(JSON.parse(JSON.stringify(profile))) };})()");
 assert.equal(result.count,10);assert.equal(result.first,previous);assert.equal(result.last,previous+9);assert.ok(result.idempotent);
 assert.ok(result.rows.every(x=>x.active&&x.inMain&&x.inBase&&x.inAll&&x.booster&&x.image.endsWith('.webp')));
 assert.ok(result.profileValid);
});
