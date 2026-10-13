'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const scripts=['assets/art-engine.js','assets/game.js','assets/expansion.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
const normalKey='arcane-duel-rpg-profile-v3',adminKey='arcane-duel-admin-profile-v3';
function boot(admin,storage=new Map(),options={}){
 const nodes=new Map();
 const el=(id='')=>({id,innerHTML:'',textContent:'',hidden:false,disabled:false,value:'',style:{},dataset:{},
  classList:{add(){},remove(){},toggle(){},contains(x){return x==='hidden'}},append(){},appendChild(){},remove(){},
  setAttribute(){},addEventListener(){},insertAdjacentHTML(pos,html){if(pos==='beforeend')this.innerHTML+=html},querySelector(){return null},querySelectorAll(){return []},click(){if(!this.disabled&&typeof this.onclick==='function')this.onclick()},
  focus(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}});
 const doc={body:el('body'),getElementById(k){if(!nodes.has(k))nodes.set(k,el(k));return nodes.get(k)},
  querySelectorAll(){return []},querySelector(){return null},createElement:el,addEventListener(){}};
 let reloads=0;
 const win={ArcaneAdminMode:admin,location:{reload(){reloads++}},innerWidth:1280,innerHeight:820,
  localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(options.rejectWrites)throw Error('quota exceeded');storage.set(k,String(v));}},
  crypto:{getRandomValues(a){a[0]=1522;return a}}};
 const ctx=vm.createContext({window:win,document:doc,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},
 setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const js of scripts)vm.runInContext(js,ctx,{timeout:12000});
 return {storage,nodes,get reloads(){return reloads},run:code=>{const v=vm.runInContext(code,ctx,{timeout:12000});return v===undefined?undefined:JSON.parse(JSON.stringify(v))},
  click:id=>{const n=doc.getElementById(id);n.click();return n;},get:id=>doc.getElementById(id)};
}
test('Normal and admin Alpha 2.0 pages retain their own localStorage keys',()=>{
 const a=fs.readFileSync(path.join(root,'admin.html'),'utf8'),n=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(a,/Alpha 2\.0 DEV/);assert.match(n,/Alpha 2\.0 DEV/);
 assert.match(a,/window\.ArcaneAdminMode=true/);assert.doesNotMatch(n,/window\.ArcaneAdminMode=true/);
 assert.match(a,/assets\/expansion\.js\?v=alpha20-dev1/);assert.match(n,/assets\/expansion\.js\?v=alpha20-dev1/);
});
test('Reset confirmation has two separate dialogs; cancel in either keeps profile unchanged',()=>{
 const b=boot(false),initial=b.storage.get(normalKey);
 assert.equal(b.run('window.ArcaneExpansion.version'),'2.0.0-dev');
 b.run('menuTab="settings";renderMenu()');
 assert.match(b.get('menuContent').innerHTML,/reset-profile/);
 b.run('window.ArcaneExpansion.showResetConfirmation()');
 assert.match(b.get('modal').innerHTML,/SICHERHEITSABFRAGE 1\/2/);
 assert.doesNotMatch(b.get('modal').innerHTML,/ENDGÜLTIG ZURÜCKSETZEN/);
 b.click('resetCancel1');
 assert.equal(b.storage.get(normalKey),initial);
 assert.equal(b.reloads,0);
 b.run('window.ArcaneExpansion.showResetConfirmation()');b.click('resetNext1');
 assert.match(b.get('modal').innerHTML,/SICHERHEITSABFRAGE 2\/2/);
 assert.match(b.get('modal').innerHTML,/ZURÜCKSETZEN/);
 b.click('resetCancel2');
 assert.equal(b.storage.get(normalKey),initial);
 assert.equal(b.reloads,0);
});
test('Cannot reset in second dialog without exact typed confirmation',()=>{
 const b=boot(false),initial=b.storage.get(normalKey);
 b.run('window.ArcaneExpansion.showResetConfirmation()');b.click('resetNext1');
 const field=b.get('resetVerifyInput'),confirm=b.get('resetConfirm2');
 assert.match(b.get('modal').innerHTML,/id="resetConfirm2" disabled/);
 confirm.disabled=true; // the mocked DOM does not parse the disabled attribute
 assert.equal(confirm.disabled,true);
 confirm.click();assert.equal(b.storage.get(normalKey),initial);
 field.value='reset';field.oninput();assert.equal(confirm.disabled,true);
 field.value='ZURÜCKSETZEN';field.oninput();assert.equal(confirm.disabled,false);
 confirm.click();assert.equal(b.reloads,1);
 const p=JSON.parse(b.storage.get(normalKey));assert.equal(p.coins,0);assert.equal(p.guideSeen,false);
});
test('Normal reset clears inventory progress and running duel, but never touches admin save',()=>{
 const storage=new Map();
 const normal=boot(false,storage);
 const admin=boot(true,storage);
 normal.run('(()=>{profile.coins=14555;profile.xp=5000;profile.inventory[3]=72;profile.trainingWins=2;profile.guideSeen=true;profile.activeDuel={test:true};saveProfile();return true})()');
 const adminOriginal=storage.get(adminKey);
 assert.equal(normal.run('window.ArcaneExpansion.resetCurrentProfile()'),true);
 assert.equal(normal.reloads,1);
 assert.equal(storage.get(adminKey),adminOriginal);
 const reloaded=boot(false,storage),p=reloaded.run('({coins:profile.coins,xp:profile.xp,copies:profile.inventory[3],wins:profile.trainingWins,duel:profile.activeDuel,guide:profile.guideSeen})');
 assert.deepEqual(p,{coins:0,xp:0,copies:2,wins:0,duel:null,guide:false});
});
test('Admin reset returns to fully equipped test baseline and never changes normal save',()=>{
 const storage=new Map();const normal=boot(false,storage),admin=boot(true,storage);
 const originalNormal=storage.get(normalKey);
 admin.run('(()=>{profile.coins=10;profile.inventory[2]=1;profile.guideSeen=false;profile.acePurchased=[];saveProfile();return true})()');
 assert.equal(admin.run('window.ArcaneExpansion.resetCurrentProfile()'),true);
 assert.equal(admin.reloads,1);
 assert.equal(storage.get(normalKey),originalNormal);
 const fresh=boot(true,storage),p=fresh.run('({coins:profile.coins,cards:profile.inventory[2],guide:profile.guideSeen,ace:profile.acePurchased.length,level:playerLevel(profile)})');
 assert.deepEqual(p,{coins:999999999,cards:999999,guide:true,ace:10,level:100});
});
test('Concurrent edit of the same profile prevents reset instead of overwriting tab B',()=>{
 const storage=new Map();const a=boot(false,storage),b=boot(false,storage);
 b.run('(()=>{profile.coins=12345;saveProfile();return true})()');
 const second=storage.get(normalKey);
 assert.equal(a.run('window.ArcaneExpansion.resetCurrentProfile()'),false);
 assert.equal(a.reloads,0);
 assert.equal(storage.get(normalKey),second);
});
test('Failed browser storage write does not report success or delete save',()=>{
 const storage=new Map();const b=boot(false,storage);
 b.run('(()=>{profile.coins=3456;saveProfile();return true})()');
 const before=storage.get(normalKey);
 // Host storage failures should be isolated to the replacement write.
 const v=b.run('(()=>{const set=window.localStorage.setItem;window.localStorage.setItem=()=>{throw Error("quota")};const ok=window.ArcaneExpansion.resetCurrentProfile();window.localStorage.setItem=set;return ok})()');
 assert.equal(v,false);
 assert.equal(storage.get(normalKey),before);
 assert.equal(b.reloads,0);
});
