'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {boot,repo}=require('./helpers/game-runtime.cjs');
function specs(b){return b.run("({enabled:ArcaneRoleWave1.enabled,cards:ArcaneRoleWave1.cards.map(x=>({key:x.key,role:x.role,style:x.style,level:x.level,path:x.art,requiredTier:x.requiredTier})),installed:ArcaneRoleWave1.installedIds.length})")}
test('fifteen distinct artwork specs, exactly three per role style',()=>{
 const b=boot(),r=specs(b);
 assert.equal(r.cards.length,15);
 assert.equal(new Set(r.cards.map(c=>c.key)).size,15);
 assert.equal(new Set(r.cards.map(c=>c.path)).size,15);
 assert.deepEqual(Object.fromEntries([...new Set(r.cards.map(c=>c.style))].map(k=>[k,r.cards.filter(c=>c.style===k).length])),
  {predator:3,defender:3,guardian:3,soul:3,allrounder:3});
 assert.ok(r.cards.every(c=>c.path.startsWith('assets/role-wave1/')&&c.path.endsWith('.webp')));
 assert.ok(r.cards.every(c=>c.level>=1&&c.level<=10&&c.requiredTier>=0&&c.requiredTier<=10));
 if(r.enabled){
  assert.equal(r.installed,15);
  for(const c of r.cards)assert.ok(fs.existsSync(path.join(repo,c.path)),'Missing activated artwork '+c.path);
 }else assert.equal(r.installed,0,'Staging must not register artworkless cards');
});
test('activated or simulated wave registers 15 valid IDs into booster and savegame pools',()=>{
 const b=boot();
 const enabled=specs(b).enabled;
 const previous=b.run('CARDS.length');
 if(!enabled){
  const source=fs.readFileSync(path.join(repo,'assets/role-wave1-catalog.js'),'utf8');
  assert.match(source,/const ASSETS_COMPLETE=false/);
  vm.runInContext(source.replace('const ASSETS_COMPLETE=false','const ASSETS_COMPLETE=true'),b.ctx,{filename:'role-wave1-test-activation.js'});
 }
 const result=b.run("(()=>{const a=ArcaneRoleWave1.install(),second=ArcaneRoleWave1.install(),ids=a.ids;return {count:a.installed,first:ids[0],last:ids.at(-1),idempotent:second.installed===15,rows:ids.map(id=>({id,role:CARDS[id].role,style:CARDS[id].roleStyle,active:!CARDS[id].retired,inMain:UPDATE_B_MAIN_IDS.includes(id),inBase:RPG_BASE_CARDS.some(c=>c.id===id),inAll:UPDATE_B_SET.has(id),booster:boosterPools(10).normal.includes(id),image:CARDS[id].art})),profileValid:!!validateProfile(JSON.parse(JSON.stringify(profile))) };})()");
 assert.equal(result.count,15);if(!enabled)assert.equal(result.first,previous);
 assert.equal(result.last,result.first+14);assert.ok(result.idempotent);
 assert.ok(result.rows.every(x=>x.active&&x.inMain&&x.inBase&&x.inAll&&x.booster&&x.image.endsWith('.webp')));
 assert.ok(result.profileValid);
});
