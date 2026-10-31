/* Arcane Duel – one canonical solo game version and mandatory runtime bumps. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const html=fs.readFileSync('index.html','utf8');
const meta=s=>s.match(/<meta\s+name="arcane-duel-version"\s+content="([^"]+)"/)?.[1]||'';
const version=meta(html);
const pattern=/^\d+\.\d+\.\d+(?:-(?:dev|rc)\.\d+)?$/;
assert.match(version,pattern,'index.html needs an explicit SemVer game version');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
for(const [name,value] of [
 ['package.json',pkg.version],['package-lock.json',lock.version],
 ['package-lock.json root package',lock.packages?.['']?.version]
])assert.equal(value,version,name+' must match index.html game version');
for(const marker of ['id="arcaneSoloVersionTitle"','id="arcaneSoloVersionSettings"',
 'id="arcaneSoloVersionHeader"','src="assets/solo-version.js?','href="assets/solo-version.css?']){
 assert.ok(html.includes(marker),'Missing explicit version UI marker: '+marker);
}
function git(...args){return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}
function parse(v){
 const m=/^(\d+)\.(\d+)\.(\d+)(?:-(dev|rc)\.(\d+))?$/.exec(v||'');
 return m?{maj:+m[1],min:+m[2],patch:+m[3],stage:m[4]||'stable',num:+(m[5]||0)}:null;
}
function greater(a,b){
 const rank={dev:0,rc:1,stable:2};
 for(const [left,right] of [[a.maj,b.maj],[a.min,b.min],[a.patch,b.patch],
  [rank[a.stage],rank[b.stage]],[a.num,b.num]]){
  if(left!==right)return left>right;
 }
 return false;
}
const env=process.env;
let base=env.ARCANE_VERSION_BASE||'';
if(base&&!/^[a-zA-Z0-9_./-]+$/.test(base))throw Error('Invalid comparison base');
if(base){
 try{git('cat-file','-e',base+'^{commit}');}
 catch{console.log('Skipped history comparison: unknown base '+base);base='';}
}
if(base){
 let changed=git('diff','--name-only',base,'HEAD').split('\n').filter(Boolean);
 const affectsSolo=file=>file==='index.html'||file.startsWith('assets/')&&
  !/^assets\/(duo-|arcane-duo-)/.test(file);
 const runtime=changed.filter(affectsSolo);
 let previous='';
 try{previous=meta(git('show',base+':index.html'));}
 catch{}
 if(runtime.length&&previous){
  assert.match(previous,pattern,'Base revision version invalid');
  assert.ok(greater(parse(version),parse(previous)),
   'Singleplayer runtime changed without version increase: '+previous+' -> '+version+
   '. Bump index.html, package.json and package-lock.json. Files: '+
   runtime.slice(0,12).join(', '));
  console.log('PASS solo version advanced '+previous+' -> '+version+
   ' for '+runtime.length+' changed runtime files');
 }else console.log('PASS solo version (no runtime diff or initial metadata).');
}else console.log('PASS solo version metadata consistency (no comparison base).');
console.log('Arcane Duel singleplayer '+version);
