'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const names=['art-engine.js','game.js','expansion.js','evolution.js','learning.js','essence-combat.js','arcane-role-fusions.js','arcane-monster-forge.js'];
const source=names.map(n=>fs.readFileSync(path.join(__dirname,'../assets',n),'utf8')).join('\n;\n');
const sim=String.raw;
function boot(){
 const nodes=new Map(),storage=new Map();
 const el=()=>({innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},
  classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},remove(){},
  addEventListener(){},removeEventListener(){},insertAdjacentHTML(){},setAttribute(){},
  querySelector(){return null},querySelectorAll(){return []}});
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},
  createElement:el,querySelector(){return null},querySelectorAll(){return []},addEventListener(){}};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 const window={localStorage,location:{hostname:'isolated.test',protocol:'https:'},innerWidth:1200,
  matchMedia(){return {matches:true}},addEventListener(){},crypto:{getRandomValues(a){a[0]=12345;return a}}};
 const ctx=vm.createContext({window,document,localStorage,navigator:{},console,Date,Math,JSON,
  setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},Map,Set,Array,Number,Object,
  String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN});
 vm.runInContext(source+'\n;'+analysis+'\n;globalThis.audit=inventoryProgression;',ctx,{timeout:30000});
 return ctx;
}
const analysis=String.raw