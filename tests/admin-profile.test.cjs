'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const sources=['assets/art-engine.js','assets/game.js','assets/expansion.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
const normalKey='arcane-duel-rpg-profile-v3',adminKey='arcane-duel-admin-profile-v3';
function boot(admin,store=new Map()){
 const nodes=new Map();
 const el=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,value:'',style:{},dataset:{},
 classList:{add(){},remove(){},toggle(){},contains(){return true}},append(){},appendChild(){},remove(){},setAttribute(){},addEventListener(){},insertAdjacentHTML(){},click(){},
 getBoundingClientRect(){return {left:0,top:0,width:120,height:100}}});
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},
 querySelector(){return el()},querySelectorAll(){return []},createElement:el,addEventListener(){}};
 const window={ArcaneAdminMode:admin,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},
 crypto:{getRandomValues(a){a[0]=2468;return a}},innerWidth:1024,innerHeight:768};
 const ctx=vm.createContext({window,document,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},
 setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},console});
 for(const script of sources)vm.runInContext(script,ctx,{timeout:12000});
 return {run:code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',ctx,{timeout:12000})),store};
}
test('Normal and admin use separate localStorage keys, even on the same origin',()=>{
 const store=new Map();
 const normal=boot(false,store);
 assert.ok(store.has(normalKey));
 assert.equal(store.has(adminKey),false);
 const admin=boot(true,store);
 assert.ok(store.has(adminKey));
 assert.equal(JSON.parse(store.get(normalKey)).coins,0);
 assert.equal(JSON.parse(store.get(adminKey)).coins,999999999);
 assert.equal(normal.run('profile.coins'),0);
 assert.equal(admin.run('profile.coins'),999999999);
});
test('New admin profile contains every collectible card and full test resources',()=>{
 const b=boot(true),x=b.run('(()=>{const ids=[...new Set([...RPG_BASE_CARDS,...RPG_FUSIONS].map(c=>c.id))];return {profileVersion:profile.version,count:ids.length,all:ids.every(id=>profile.inventory[id]===999999),coins:profile.coins,shards:profile.shards,level:playerLevel(profile),packs:profile.packs,upgrades:Object.keys(UPGRADES).every(k=>profile.upgrades[k]===UPGRADES[k].max),allAce:profile.acePurchased.length,allTournaments:profile.cleared.length,charges:profile.dropCharges,guide:profile.guideSeen,saved:validateProfile(JSON.parse(window.localStorage.getItem(SAVE_KEY))).coins};})()');
 assert.ok(x.count>=250); // Maximum number of collectible (profile-valid) cards, not all catalog definitions
 assert.equal(x.all,true);
 assert.equal(x.coins,999999999);
 assert.equal(x.shards.length,11);
 assert.ok(x.shards.every(n=>n===999999999));
 assert.equal(x.level,100);
 assert.equal(x.packs.length,22);
 assert.ok(x.packs.every(n=>n===999999));
 assert.equal(x.upgrades,true);
 assert.equal(x.allAce,10);
 assert.equal(x.allTournaments,10);
 assert.equal(x.charges,8);
 assert.equal(x.guide,true);
 assert.equal(x.saved,999999999);
 assert.equal(x.profileVersion,3);
});
test('Admin progress persists after reload without restoring max values each time',()=>{
 const store=new Map();
 const a=boot(true,store);
 a.run('(()=>{profile.coins=12345;profile.inventory[1]=18;saveProfile();return true})()');
 const b=boot(true,store);
 assert.equal(b.run('profile.coins'),12345);
 assert.equal(b.run('profile.inventory[1]'),18);
});
test('Admin ignores normal legacy profile instead of importing or overwriting it',()=>{
 const store=new Map();
 const a=boot(false,store);
 a.run('(()=>{profile.coins=87654;saveProfile();return true})()');
 const before=store.get(normalKey);
 const admin=boot(true,store);
 assert.equal(admin.run('profile.coins'),999999999);
 assert.equal(store.get(normalKey),before);
});
test('Admin HTML loads an explicit flag before game.js, normal HTML does not',()=>{
 const admin=fs.readFileSync(path.join(root,'admin.html'),'utf8');
 const normal=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(admin.includes('window.ArcaneAdminMode=true'));
 assert.ok(!normal.includes('window.ArcaneAdminMode=true'));
 assert.ok(admin.indexOf('window.ArcaneAdminMode=true')<admin.indexOf('assets/game.js'));
 assert.match(admin,/SEPARATER SPIELSTAND/);
});
