/* Arcane Duel – one canonical solo game version and mandatory runtime bumps. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const html=fs.readFileSync('index.html','utf8');
const meta=s=>s.match(/<meta\s+name="arcane-duel-version"\s+content="([^"]+)"/)?.[1]||'';
const version=meta(html);
const pattern=/^\d+\.\d+\.\d+$/;
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
for(const [page,marker] of [
 ['duo-campaign-v2.html','id="arcaneSoloVersionTitle"'],
 ['collection-v3.html','data-arcane-version']
]){
 const htmlPage=fs.readFileSync(page,'utf8');
 assert.equal(meta(htmlPage),version,page+' must use exactly the same game version');
 assert.ok(htmlPage.includes(marker),page+' must show the canonical game version');
 assert.ok(htmlPage.includes('assets/solo-version.js?v='+version),
  page+' must load the canonical live version label');
}
assert.ok(html.includes('assets/solo-version.js?v='+version),
 'index.html must load matching version runtime');
assert.ok(html.includes('data-arcane-version'),
 'index.html must show current game version in the game menu');
const releaseBuilder=fs.readFileSync('scripts/package-selfhost.py','utf8');
assert.match(releaseBuilder,/version=match\.group\(1\)/,
 'Server release must derive its version from the canonical HTML');
function git(...args){return execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}
function parse(v){
 const m=/^(\d+)\.(\d+)\.(\d+)$/.exec(v||'');
 return m?[+m[1],+m[2],+m[3]]:null;
}
function greater(a,b){
 return a.some((x,i)=>a.slice(0,i).every((z,j)=>z===b[j])&&x>b[i]);
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
 // The same game version belongs to Solo and multiplayer, including the host.
 const affectsSolo=file=>['index.html','duo-campaign-v2.html','collection-v3.html',
  'scripts/package-selfhost.py'].includes(file)||
  /^(assets|models|server|supabase\/functions\/arcane-duo-v2)\//.test(file);
 const runtime=changed.filter(affectsSolo);
 let previous='';
 try{previous=meta(git('show',base+':index.html'));}
 catch{}
 if(runtime.length&&previous){
  assert.ok(pattern.test(previous)||previous==='4.1.0-dev.1','Base revision version invalid');
  const legacyReset=(previous==='4.1.0-dev.1'&&version==='1.0.0');
  assert.ok(legacyReset||greater(parse(version),parse(previous)),
   'Singleplayer runtime changed without version increase: '+previous+' -> '+version+
   '. Bump index.html, package.json and package-lock.json. Files: '+
   runtime.slice(0,12).join(', '));
  console.log('PASS official game version transition '+previous+' -> '+version+
   ' for '+runtime.length+' changed runtime files');
 }else console.log('PASS solo version (no runtime diff or initial metadata).');
}else console.log('PASS solo version metadata consistency (no comparison base).');
console.log('Arcane Duel server/game '+version);
