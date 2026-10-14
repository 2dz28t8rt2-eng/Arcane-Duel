'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const scripts=['assets/art-engine.js','assets/game.js','assets/expansion.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
const normalKey='arcane-duel-rpg-profile-v4-reborn';
function boot(admin=false,storage=new Map(),options={}){
 const nodes=new Map();
 const el=(id='')=>({id,innerHTML:'',textContent:'',hidden:false,disabled:false,value:'',style:{},dataset:{},
  classList:{add(){},remove(){},toggle(){},contains(x){return x==='hidden'}},append(){},appendChild(){},remove(){},
  setAttribute(){},addEventListener(){},insertAdjacentHTML(pos,html){if(pos==='beforeend')this.innerHTML+=html},querySelector(){return null},querySelectorAll(){return []},click(){if(!this.disabled&&typeof this.onclick==='function')this.onclick()},
  focus(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}});
 const doc={body:el('body'),getElementById(k){if(!nodes.has(k))nodes.set(k,el(k));return nodes.get(k)},
  querySelectorAll(){return []},querySelector(){return null},createElement:el,addEventListener(){}};
 let reloads=0;
 const win={location:{reload(){reloads++}},innerWidth:1280,innerHeight:820,
  localStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(options.rejectWrites)throw Error('quota exceeded');storage.set(k,String(v));}},
  crypto:{getRandomValues(a){a[0]=1522;return a}}};
 const ctx=vm.createContext({window:win,document:doc,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},
 setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const js of scripts)vm.runInContext(js,ctx,{timeout:12000});
 return {storage,nodes,get reloads(){return reloads},run:code=>{const v=vm.runInContext(code,ctx,{timeout:12000});return v===undefined?undefined:JSON.parse(JSON.stringify(v))},
  click:id=>{const n=doc.getElementById(id);n.click();return n;},get:id=>doc.getElementById(id)};
}
test('Reset confirmation has two separate dialogs; cancel in either keeps profile unchanged',()=>{
 const b=boot(false);
 b.run('profile.guideSeen=true;profile.coins=123456;profile.xp=5678;saveProfile()'); // Finished tutorial, non-empty save.
 const snapshot=()=>{
  const p=JSON.parse(b.storage.get(normalKey));
  return JSON.stringify({coins:p.coins,xp:p.xp,wins:p.wins,inventory:p.inventory,cleared:p.cleared,guideSeen:p.guideSeen});
 };
 const initial=snapshot();
 assert.equal(b.run('window.ArcaneExpansion.version'),'2.2.0-dev');
 b.run('menuTab="settings";renderMenu()');
 assert.match(b.get('menuContent').innerHTML,/reset-profile/);
 b.run('window.ArcaneExpansion.showResetConfirmation()');
 assert.match(b.get('modal').innerHTML,/SICHERHEITSABFRAGE 1\/2/);
 assert.doesNotMatch(b.get('modal').innerHTML,/ENDGÜLTIG ZURÜCKSETZEN/);
 b.click('resetCancel1');
 assert.equal(snapshot(),initial);
 assert.equal(b.reloads,0);
 b.run('window.ArcaneExpansion.showResetConfirmation()');b.click('resetNext1');
 assert.match(b.get('modal').innerHTML,/SICHERHEITSABFRAGE 2\/2/);
 assert.match(b.get('modal').innerHTML,/ZURÜCKSETZEN/);
 b.click('resetCancel2');
 assert.equal(snapshot(),initial);
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

test('Reset only the normal player profile, preserving unrelated browser storage',()=>{
 const storage=new Map([['unrelated-key','keep']]);const b=boot(false,storage);
 b.run('(()=>{profile.coins=14555;profile.xp=5000;profile.inventory[3]=72;profile.guideSeen=true;saveProfile();return true})()');
 assert.equal(b.run('window.ArcaneExpansion.resetCurrentProfile()'),true);
 assert.equal(storage.get('unrelated-key'),'keep');
 const reloaded=boot(false,storage),p=reloaded.run('({coins:profile.coins,xp:profile.xp,cards:profile.inventory[3],guide:profile.guideSeen})');
 assert.deepEqual(p,{coins:0,xp:0,cards:2,guide:false});
});
