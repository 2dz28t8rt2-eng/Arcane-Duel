'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function cards(){
 const nodes=new Map(),node=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},click(){},remove(){},append(){}});
 const document={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:node,addEventListener(){}};
 const window={localStorage:{getItem(){return null},setItem(){}},crypto:{getRandomValues(a){a[0]=15432;return a}}};
 const ctx=vm.createContext({window,document,setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 for(const file of ['assets/art-engine.js','assets/game.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{timeout:12000});
 return JSON.parse(vm.runInContext('JSON.stringify(CARDS.map(c=>({id:c.id,name:c.name,customArt:c.customArt,art:c.art,manifestOf:c.manifestOf,atk:c.atk,def:c.def,level:c.level})))',ctx));
}
test('60 distinct curated illustrations exist and original 324 card IDs remain unchanged',()=>{
 const all=cards();assert.equal(all.length,324);
 const unique=new Set(all.filter(c=>c.customArt).map(c=>c.customArt));assert.equal(unique.size,60);
 for(const src of unique){const file=path.join(root,src);assert.ok(fs.existsSync(file),src);assert.ok(fs.statSync(file).size>6000,src);}
});
test('Wave 6 maps ten new original illustrations while preserving valid game values',()=>{
 const all=cards(),ids=[86,89,317,210,33,121,69,304,106,81];
 for(let i=0;i<ids.length;i++){const c=all[ids[i]];assert.equal(c.customArt,`assets/custom-art/wave6-${String(i+1).padStart(2,'0')}.webp`);assert.equal(c.art,c.customArt);assert.ok(c.atk>0&&c.def>0);}
 for(const c of all.filter(c=>c.manifestOf!=null&&c.customArt))assert.equal(c.customArt,all[c.manifestOf].customArt);
});
