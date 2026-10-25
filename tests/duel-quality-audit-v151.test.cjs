'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const helper=path.join(__dirname,'helpers/game-runtime.cjs');
if(!fs.existsSync(helper)){
  test('repository-wide resource audit needs a complete checkout', {skip:true},()=>{});
}else{
  const {boot,repo}=require(helper);
  const index=fs.readFileSync(path.join(repo,'index.html'),'utf8');
  const scripts=[...index.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(x=>x[1].split('?')[0]);
  const styles=[...index.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)]
    .map(x=>x[1].split('?')[0]);

  test('all explicitly loaded local scripts and styles exist (no silent 404s)',()=>{
    for(const file of [...scripts,...styles].filter(x=>x.startsWith('assets/')))
      assert.ok(fs.existsSync(path.join(repo,file)),`missing resource: ${file}`);
    console.log(`[Resource audit v15.1] ${scripts.length} JS references, ${styles.length} stylesheets; initial main bundle list is unbundled.`);
  });

  test('collect reproducible card distribution without altering cards or profiles',()=>{
    const data=boot({seed:151100}).run("(()=>{const cards=CARDS.filter(c=>c.rpg&&!c.retired&&!c.enemyOnly&&!c.fateOnly);const normal=cards.filter(c=>!c.fusionOnly),fusion=cards.filter(c=>c.fusionOnly),groups=(collection)=>Array.from({length:10},(_,i)=>collection.filter(c=>c.level===i+1).length);return {normal:normal.length,fusion:fusion.length,ace:cards.filter(c=>c.ace).length,normalByLevel:groups(normal),fusionByLevel:groups(fusion),normalByRole:normal.reduce((a,c)=>{const role=c.role||'neutral';a[role]=(a[role]||0)+1;return a;},{}),fusionWithRole:fusion.filter(c=>c.role).length};})()");
    assert.equal(data.normalByLevel.length,10);
    assert.equal(data.fusionByLevel.length,10);
    assert.equal(data.normalByLevel.reduce((a,b)=>a+b,0),data.normal);
    assert.equal(data.fusionByLevel.reduce((a,b)=>a+b,0),data.fusion);
    console.log('[Card audit v15.1]',JSON.stringify(data));
  });
}
