'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {GAME_ROOT,GAME_ENTRY,entryForRevision,gameRootFor,isGameUrl,isRepositoryUrl}=require('../url-policy.cjs');
const {REVISION_API,extractRevision,resolveRevision}=require('../revision-resolver.cjs');

const read=rel=>fs.readFileSync(path.join(__dirname,'..',rel),'utf8');

test('development is the only allowed in-app site, with normal query strings',()=>{
 assert.equal(GAME_ENTRY,GAME_ROOT+'index.html?arcane-desktop=1');
 for(const url of [GAME_ENTRY,GAME_ROOT+'duo-campaign-v2.html',
  GAME_ROOT+'collection-v3.html#cards',GAME_ROOT+'assets/game.js?v=latest']){
  assert.equal(isGameUrl(url),true,url);
 }
 for(const url of ['http://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/index.html',
  'https://raw.githack.com.evil.test/2dz28t8rt2-eng/Arcane-Duel/development/index.html',
  'https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/main/index.html',
  'https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development-other/index.html',
  'https://user:pass@raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/index.html',
  'javascript:alert(1)','file:///C:/Users/test/Documents/password.txt',
  'https://supabase.co', 'not a url'])assert.equal(isGameUrl(url),false,url);
});

test('external destinations are restricted to the project repository',()=>{
 assert.equal(isRepositoryUrl('https://github.com/2dz28t8rt2-eng/Arcane-Duel'),true);
 assert.equal(isRepositoryUrl('https://github.com/2dz28t8rt2-eng/Arcane-Duel/issues/1'),true);
 assert.equal(isRepositoryUrl('https://github.com/2dz28t8rt2-eng/Arcane-Duel-malicious'),false);
 assert.equal(isRepositoryUrl('https://github.com/other/repo'),false);
 assert.equal(isRepositoryUrl('https://github.com.evil.test/2dz28t8rt2-eng/Arcane-Duel'),false);
});

test('immutable development revisions allow fresh content without changing saved-game origin',()=>{
 const sha='19fc37fa6bdce78e317475d3ef018c46c97ad64c';
 const url=entryForRevision(sha);
 assert.equal(new URL(url).origin,new URL(GAME_ENTRY).origin);
 assert.equal(url,gameRootFor(sha)+'index.html?arcane-desktop=1');
 assert.equal(isGameUrl(url,sha),true);
 assert.equal(isGameUrl(gameRootFor(sha)+'duo-campaign-v2.html',sha),true);
 assert.equal(isGameUrl(GAME_ENTRY,sha),false);
 assert.equal(isGameUrl(url),false);
 for(const invalid of ['main','../../other','c'.repeat(39),'g'.repeat(40)]){
  assert.throws(()=>entryForRevision(invalid));
  assert.equal(isGameUrl(url,invalid),false);
 }
});

test('GitHub ref resolver validates the exact branch SHA and safely handles failures',async()=>{
 const sha='19fc37fa6bdce78e317475d3ef018c46c97ad64c';
 const requested=[];
 const result=await resolveRevision(async(url,options)=>{
  requested.push({url,options});
  return {ok:true,json:async()=>({object:{sha}})};
 });
 assert.deepEqual(result,{revision:sha,source:'github'});
 assert.equal(requested[0].url,REVISION_API);
 assert.equal(requested[0].options.cache,'no-store');
 assert.equal(extractRevision({object:{sha:'../../malicious'}}),null);
 assert.deepEqual(await resolveRevision(async()=>{throw new Error('offline');}),
  {revision:null,source:'unavailable'});
 assert.deepEqual(await resolveRevision(async()=>({ok:true,json:async()=>({object:{sha:'bad'}})})),
  {revision:null,source:'invalid-response'});
});

test('the desktop browser cannot expose native APIs to the remote page',()=>{
 const source=read('main.cjs');
 assert.match(source,/nodeIntegration:false/);
 assert.match(source,/contextIsolation:true/);
 assert.match(source,/sandbox:true/);
 assert.match(source,/webSecurity:true/);
 assert.match(source,/app\.commandLine\.appendSwitch\('autoplay-policy','no-user-gesture-required'\)/);
 assert.match(source,/webviewTag:false/);
 assert.match(source,/persist:arcane-duel-development/);
 assert.match(source,/setWindowOpenHandler/);
 assert.match(source,/setPermissionRequestHandler/);
 assert.match(source,/loadFreshGame/);
 assert.match(source,/last-good-development-revision/);
 assert.doesNotMatch(source,/executeJavaScript\(|contextBridge|preload:/);
 assert.doesNotThrow(()=>new vm.Script(source));
});

test('offline retry loads the same approved game and includes no native bridge',()=>{
 const html=read('offline.html');
 assert.match(html,/Verbindung ist unterbrochen/);
 assert.match(html,/Erneut verbinden/);
 assert.ok(html.includes(GAME_ENTRY));
 const js=[...html.matchAll(/<script>([\s\S]+?)<\/script>/g)];
 assert.equal(js.length,1);
 assert.doesNotThrow(()=>new vm.Script(js[0][1]));
});

test('the executable target is portable and the bundled contents are minimal',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'0.1.5');
 const lock=JSON.parse(read('package-lock.json'));
 assert.equal(lock.version,pkg.version);
 assert.equal(lock.packages[''].version,pkg.version);
 assert.deepEqual(pkg.build.win.target,['portable']);
 assert.equal(pkg.build.win.icon,'build/icon.ico');
 assert.ok(pkg.build.files.includes('build/icon.ico'));
 const icon=fs.readFileSync(path.join(__dirname,'..','build','icon.ico'));
 assert.equal(icon.readUInt16LE(0),0);
 assert.equal(icon.readUInt16LE(2),1);
 assert.ok(icon.readUInt16LE(4)>=5);
 assert.match(read('main.cjs'),/icon:path\.join\(__dirname,'build','icon\.ico'\)/);
 assert.equal(pkg.build.portable.artifactName,'ArcaneDuel-${version}-portable.exe');
 assert.equal(pkg.build.asar,true);
 assert.ok(pkg.build.files.includes('main.cjs'));
 assert.ok(pkg.build.files.includes('offline.html'));
 assert.ok(pkg.build.files.includes('revision-resolver.cjs'));
 assert.ok(!pkg.build.files.includes('**/*'));
 assert.equal(pkg.scripts['dist:portable'],'electron-builder --win portable --x64');
 assert.ok(pkg.devDependencies.electron);
});
