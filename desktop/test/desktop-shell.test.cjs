'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {GAME_ROOT,GAME_ENTRY,parseSecureUrl,isGameUrl}=require('../url-policy.cjs');
const read=rel=>fs.readFileSync(path.join(__dirname,'..',rel),'utf8');

test('desktop only uses the designated Arcane Duel HTTPS server on port 8443',()=>{
 assert.equal(GAME_ROOT,'https://v2202610436378538039.ultrasrv.de:8443/');
 assert.equal(GAME_ENTRY,GAME_ROOT+'index.html?arcane-desktop=1');
 for(const url of [GAME_ENTRY,GAME_ROOT+'duo-campaign-v2.html',
  GAME_ROOT+'collection-v3.html#cards',GAME_ROOT+'assets/game.js?v=latest',
  GAME_ROOT+'api/duo']){
  assert.equal(isGameUrl(url),true,url);assert.ok(parseSecureUrl(url));
 }
 for(const url of [
  GAME_ROOT.replace('https:','http:'),
  'https://v2202610436378538039.ultrasrv.de/',
  'https://v2202610436378538039.ultrasrv.de:443/',
  'https://v2202610436378538039.ultrasrv.de:8777/',
  'https://v2202610436378538039.ultrasrv.de.evil.test:8443/',
  'https://v2202610436378538039.ultrasrv.de@evil.test:8443/',
  'https://user:pass@v2202610436378538039.ultrasrv.de:8443/',
  'https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/',
  'https://api.github.com/repos/2dz28t8rt2-eng/Arcane-Duel',
  'javascript:alert(1)','file:///C:/Users/test/Documents/password.txt',
  'https://supabase.co','not a url'
 ])assert.equal(isGameUrl(url),false,url);
});

test('Electron sandbox, no native bridge, no GitHub runtime dependence',()=>{
 const source=read('main.cjs');
 for(const r of [/nodeIntegration:false/,/contextIsolation:true/,/sandbox:true/,
  /webSecurity:true/,/webviewTag:false/,/persist:arcane-duel-selfhost/,
  /setWindowOpenHandler/,/setPermissionRequestHandler/,/loadFreshGame/,
  /session\.clearCache\(\)/])assert.match(source,r);
 assert.match(source,/app\.commandLine\.appendSwitch\('autoplay-policy','no-user-gesture-required'\)/);
 assert.doesNotMatch(source,/revision-resolver|resolveRevision|last-good-development-revision|executeJavaScript\(|contextBridge|preload:/);
 assert.doesNotThrow(()=>new vm.Script(source));
 for(const f of ['main.cjs','url-policy.cjs','offline.html'])
  assert.doesNotMatch(read(f),/raw\.githack\.com|api\.github\.com/);
});

test('offline button retries server URL, without Node bridge',()=>{
 const html=read('offline.html');
 assert.match(html,/Verbindung ist unterbrochen/);
 assert.match(html,/Erneut verbinden/);
 assert.ok(html.includes(GAME_ENTRY));
 const js=[...html.matchAll(/<script>([\s\S]+?)<\/script>/g)];
 assert.equal(js.length,1);
 assert.doesNotThrow(()=>new vm.Script(js[0][1]));
});

test('portable Windows package is minimal and properly versioned',()=>{
 const pkg=JSON.parse(read('package.json'));
 const lock=JSON.parse(read('package-lock.json'));
 assert.equal(pkg.version,'0.1.6');
 assert.equal(lock.version,pkg.version);
 assert.equal(lock.packages[''].version,pkg.version);
 assert.deepEqual(pkg.build.win.target,['portable']);
 assert.equal(pkg.build.win.icon,'build/icon.ico');
 assert.equal(pkg.build.portable.artifactName,'ArcaneDuel-Server-${version}-portable.exe');
 assert.equal(pkg.build.asar,true);
 for(const f of ['main.cjs','url-policy.cjs','offline.html','build/icon.ico'])
  assert.ok(pkg.build.files.includes(f));
 assert.ok(!pkg.build.files.includes('revision-resolver.cjs'));
 assert.ok(!pkg.build.files.includes('**/*'));
 assert.equal(pkg.scripts['dist:portable'],'electron-builder --win portable --x64');
 const icon=fs.readFileSync(path.join(__dirname,'..','build','icon.ico'));
 assert.equal(icon.readUInt16LE(0),0);
 assert.equal(icon.readUInt16LE(2),1);
 assert.ok(icon.readUInt16LE(4)>=5);
});
