'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const scripts=['assets/art-engine.js','assets/game.js','assets/expansion.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8'));
function boot(){
 const nodes=new Map(),store=new Map();
 const el=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,value:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},append(){},appendChild(){},insertAdjacentHTML(){},remove(){},click(){},focus(){},querySelector(){return null},querySelectorAll(){return []}});
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelectorAll(){return []},querySelector(){return null},createElement:el,addEventListener(){}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=1234567;return a}},location:{reload(){}}};
 const ctx=vm.createContext({window,document,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const s of scripts)vm.runInContext(s,ctx,{timeout:15000});
 return code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',ctx,{timeout:15000}));
}
test('Training has decreasing cumulative bonus and existing save can migrate perks',()=>{
 const run=boot(),x=run('({bonuses:Array.from({length:11},(_,i)=>monsterTrainingBonus(i)),saveValid:validateProfile(JSON.parse(window.localStorage.getItem(SAVE_KEY))).upgrades.fusionLore})');
 assert.deepEqual(x.bonuses,[0,50,90,120,140,155,165,170,175,180,185]);
 assert.equal(x.saveValid,0);
});
test('Fusion choices sorted by descending level and distinct manifest frame',()=>{
 const run=boot(),x=run('({levels:sourceCards(true).map(c=>c.level),manifest:frameClassForCard({id:CARDS.find(c=>c.manifestOf!=null).id})})');
 assert.deepEqual(x.levels,[...x.levels].sort((a,b)=>b-a));
 assert.match(x.manifest,/tc-manifest/);
 assert.doesNotMatch(x.manifest,/tc-fusion/);
});
test('Character pack rare chance never exceeds 10 percent',()=>{
 const run=boot(),x=run('OPPONENTS.map(o=>characterPackRareChance(o.id))');
 assert.ok(x.every(n=>n>=0&&n<=.10));
});
test('Fusion booster spends coins and stores exactly one fusion reward',()=>{
 const run=boot(),x=run('(()=>{profile.cleared=[1];profile.coins=100000;const before=profile.coins,price=fusionPackPrice(),ok=buyFusionPack(),id=profile.lastBooster?.cards[0];return {ok,id,price,spent:before-profile.coins,fusion:CARDS[id]?.fusionOnly,valid:validateProfile(JSON.parse(window.localStorage.getItem(SAVE_KEY))).coins===profile.coins};})()');
 assert.equal(x.ok,true);assert.equal(x.spent,x.price);assert.equal(x.fusion,true);assert.equal(x.valid,true);
});
