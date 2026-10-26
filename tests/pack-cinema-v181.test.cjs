'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/pack-cinema-v181.js'),'utf8');
const api=require('../assets/pack-cinema-v181.js');

test('cinema distinguishes the existing card types without inventing rewards',()=>{
 const values=api.normalize([
  {name:'A',level:2,art:'assets/a.webp'},
  {name:'B',level:5,art:'javascript:alert(1)',fusion:true},
  {name:'C',level:10,ace:true}
 ]);
 assert.equal(values.length,3);
 assert.equal(values[1].art,'');
 assert.deepEqual(values.map(api.glowFor),['normal','fusion','ace']);
 assert.equal(api.glowFor({fusion:true,level:7}),'grand');
 assert.equal(api.glowFor({level:9}),'high');
 assert.equal(api.staggerFor(3),260);
 assert.ok(api.staggerFor(20)<100);
});

function fakeBrowser({fast=false,reduced=false}={}){
 let clock=0,next=0;
 const tasks=new Map(),storage=new Map();
 if(fast)storage.set('arcane-pack-cinema-fast-v181','true');
 const doc={activeElement:null,events:new Map()};
 class Node{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes=new Map();this.hidden=false;
   this.disabled=false;this.isConnected=true;this.events=new Map();this.className='';
   this.style={setProperty:()=>{}};
   this.classList={add:(...names)=>{this.className+=' '+names.join(' ');},contains:()=>false};}
  append(...nodes){for(const node of nodes){this.children.push(node);node.parent=this;}}
  setAttribute(key,value){this.attributes.set(key,value);}
  removeAttribute(key){this.attributes.delete(key);}
  addEventListener(type,fn){this.events.set(type,fn);}
  remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
  focus(){doc.activeElement=this;}
  querySelectorAll(){return [];}
  querySelector(){return null;}
 }
 doc.createElement=tag=>new Node(tag);
 doc.createTextNode=text=>({textContent:text});
 doc.addEventListener=(name,cb)=>doc.events.set(name,cb);
 doc.removeEventListener=name=>doc.events.delete(name);
 doc.body=new Node('body');doc.querySelector=()=>null;
 const root={document:doc,matchMedia:()=>({matches:reduced}),
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
  setTimeout:(cb,ms)=>{const id=++next;tasks.set(id,{when:clock+ms,cb});return id;},
  clearTimeout:id=>tasks.delete(id)};
 const ctx={window:root,module:{exports:{}},Promise};
 vm.runInNewContext(source,ctx);
 function findClass(prefix,parent=doc.body){
  if(String(parent.className).split(/\s+/).includes(prefix))return parent;
  for(const child of parent.children||[]){const match=findClass(prefix,child);if(match)return match;}
  return null;
 }
 function findAll(prefix,parent=doc.body){
  return [...(String(parent.className).split(/\s+/).includes(prefix)?[parent]:[]),
   ...(parent.children||[]).flatMap(child=>findAll(prefix,child))];
 }
 function runAll(){
  let guard=200;
  while(tasks.size&&guard-->0){const [id,item]=[...tasks.entries()].sort((a,b)=>a[1].when-b[1].when)[0];
   tasks.delete(id);clock=item.when;item.cb();}
  if(guard<=0)throw Error('Timer loop');
 }
 return {api:ctx.module.exports,doc,storage,findClass,findAll,runAll,tasks};
}

const three=[{name:'Wächter',level:2},{name:'Fusion',level:7,fusion:true},{name:'ACE',level:10,ace:true}];

test('the pack opens by click and the three card faces are revealed in sequence',async()=>{
 const b=fakeBrowser();const finished=b.api.open(three);
 assert.ok(b.findClass('ad178-pack-cinema'));
 assert.equal(b.findAll('ad178-is-revealed').length,0);
 b.findClass('ad178-pack').onclick();b.runAll();
 assert.equal(b.findAll('ad178-is-revealed').length,3);
 assert.ok(b.findClass('ad178-pack-opened'));
 b.findClass('ad178-pack-controls').children[2].onclick();
 assert.equal(await finished,true);
 assert.equal(b.findClass('ad178-pack-cinema'),null);
 assert.equal(b.tasks.size,0);
});

test('skip reveals immediately, and the character pack returns to its existing choice',async()=>{
 const b=fakeBrowser();const finished=b.api.open(three,{selection:true});
 const controls=b.findClass('ad178-pack-controls');
 controls.children[1].onclick();
 assert.equal(b.findAll('ad178-is-revealed').length,3);
 assert.match(controls.children[2].textContent,/Kartenauswahl/);
 controls.children[2].onclick();await finished;
});

test('remembered fast opening and reduced motion bypass all timers',async()=>{
 for(const settings of [{fast:true},{reduced:true}]){
  const b=fakeBrowser(settings),finished=b.api.open(three);
  assert.ok(b.findClass('ad178-pack-opened'));
  assert.equal(b.tasks.size,0);
  b.findClass('ad178-pack-controls').children[2].onclick();await finished;
 }
});

test('solo and duo both load the newer cinema without changing pack calculations',()=>{
 const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
 assert.match(read('index.html'),/pack-cinema-v181\.js/);
 assert.match(read('duo-campaign-v2.html'),/pack-cinema-v181\.js/);
 assert.match(read('assets/character-pack-cinema-v181.js'),/selection:true/);
 assert.match(read('assets/player-feedback-v112.js'),/if\(fusion&&window\.ArcanePackCinema178\?\.open\)/);
 assert.doesNotMatch(source,/takePackCard|buyBooster|rollBooster|profile\.coins|duoProfile\.essence/);
});
