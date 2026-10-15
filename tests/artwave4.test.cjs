'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function cards(){
 const nodes=new Map(),node=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},click(){},remove(){},append(){}});
 const document={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:node,addEventListener(){}};
 const window={localStorage:{getItem(){return null},setItem(){}},crypto:{getRandomValues(a){a[0]=15432;return a}}};
 const ctx=vm.createContext({window,document,setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 for(const p of ['assets/art-engine.js','assets/game.js'])vm.runInContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{timeout:12000});
 return JSON.parse(vm.runInContext('JSON.stringify(CARDS.map(c=>({id:c.id,name:c.name,customArt:c.customArt,art:c.art,manifestOf:c.manifestOf,source:c.source,level:c.level,atk:c.atk,def:c.def})))',ctx));
}
test('Artwork pack 4 maps to 10 distinct mid- and late-game cards without changing card IDs',()=>{
 const all=cards(),ids=[280,90,103,246,260,278,101,286,274,262],unique=new Set();
 assert.ok(all.length>=390,'Neue Werkstattfamilien dürfen bestehende Karten-IDs nicht ersetzen');
 for(let i=0;i<ids.length;i++){
  const c=all[ids[i]],asset=`assets/custom-art/wave4-${String(i+1).padStart(2,'0')}.webp`;
  assert.equal(c.id,ids[i]);assert.equal(c.customArt,asset);assert.equal(c.art,asset);
  assert.ok(fs.statSync(path.join(root,asset)).size>10000,asset);
  assert.ok(c.atk>0&&c.def>0,'Gameplay values must remain present');
  assert.ok(c.name.length>8);
  unique.add(asset);
 }
 assert.equal(unique.size,10);
 assert.equal(all.slice(0,324).filter(c=>c.customArt&&c.manifestOf==null).length,60);
});
test('Fusion manifestations use their original creature illustration',()=>{
 const all=cards();
 for(const c of all.filter(c=>c.manifestOf!=null&&c.customArt))assert.equal(c.customArt,all[c.manifestOf].customArt);
});
