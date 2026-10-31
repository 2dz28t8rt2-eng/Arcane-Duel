'use strict';
// Execute the same save and reward code in the same script order as index.html.
// The DOM facade does not dispatch input or run UI timers. No test/research
// transforms are permitted here; only fixed expressions access the VM.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
function createRuntime(root=path.resolve(__dirname,'..')){
 const repo=root,index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const scripts=[...index.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m=>m[1].split('?')[0]);
 const nodes=new Map(),storage=new Map([]);
 function el(id=''){
  const attributes=new Map(),classes=new Set();
  return {id,tagName:'DIV',innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,dataset:{},children:[],get lastChild(){return this.children[this.children.length-1]||null;},style:{setProperty(){},removeProperty(){}},
   classList:{add(...s){s.forEach(x=>classes.add(x));},remove(...s){s.forEach(x=>classes.delete(x));},toggle(s,on){if(on===undefined)on=!classes.has(s);on?classes.add(s):classes.delete(s);return on;},contains(s){return classes.has(s);}},
   append(...c){this.children.push(...c);},prepend(...c){this.children.unshift(...c);},appendChild(c){this.children.push(c);return c;},insertBefore(c){this.children.unshift(c);return c;},replaceChildren(...c){this.children=[...c];},replaceWith(){},remove(){},setAttribute(k,v){attributes.set(k,String(v));},getAttribute(k){return attributes.get(k)||null;},removeAttribute(k){attributes.delete(k);},addEventListener(){},removeEventListener(){},insertAdjacentHTML(){},querySelector(){return null;},querySelectorAll(){return [];},closest(){return null;},contains(){return false;},focus(){},click(){this.onclick?.();},getBoundingClientRect(){return {left:0,top:0,width:100,height:100,right:100,bottom:100};}};
 }
 const document={body:el('body'),documentElement:el('html'),hidden:false,visibilityState:'visible',readyState:'complete',
   getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id);},createElement:el,createElementNS:(ns,t)=>el(t),createTextNode(value){const text=String(value);return {nodeType:3,nodeName:'#text',textContent:text,data:text};},querySelector(){return null;},querySelectorAll(){return [];},createTreeWalker(){return {nextNode(){return null;}};},addEventListener(){},removeEventListener(){},elementFromPoint(){return null;}};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 const clock=Date.now();
 const random=()=>crypto.randomInt(0,0x100000000)/0x100000000;
 const auditMath=Object.create(Math);auditMath.random=random;
 const AuditDate=Date;
 class Observer{observe(){}disconnect(){}unobserve(){}}
 const ctx={document,localStorage,console,Date:AuditDate,Math:auditMath,JSON,Map,Set,Array,Number,Object,String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN,Blob,URL,URLSearchParams,
  navigator:{language:'de-AT',onLine:true},location:{protocol:'https:',hostname:'audit.arcane.test',href:'https://audit.arcane.test/index.html',search:''},
  crypto:{getRandomValues(a){for(let i=0;i<a.length;i++)a[i]=Math.floor(random()*4294967296);return a;}},
  innerWidth:1200,innerHeight:980,devicePixelRatio:1,matchMedia(){return {matches:true,addEventListener(){},removeEventListener(){}};},
  setTimeout(){return 0;},clearTimeout(){},setInterval(){return 0;},clearInterval(){},requestAnimationFrame(){return 0;},cancelAnimationFrame(){},
  addEventListener(){},removeEventListener(){},MutationObserver:Observer,ResizeObserver:Observer,performance:{now(){return clock;}},
  getComputedStyle(){return {getPropertyValue(){return '';}};},alert(){},confirm(){return false;},scrollTo(){},
  atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),
  fetch:async url=>{const file=path.join(repo,String(url).split('?')[0]);return {ok:fs.existsSync(file),json:async()=>JSON.parse(fs.readFileSync(file,'utf8')),text:async()=>fs.readFileSync(file,'utf8')};}
 };
 ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;

 vm.createContext(ctx);
 for(const file of scripts){
  if(['assets/arcane-title-v196.js','arcane-host-config.js','assets/online-client-v230.js'].includes(file))continue;
  const target=path.resolve(root,file);
  if(!target.startsWith(root+path.sep))throw Error('Unexpected singleplayer script path');
  vm.runInContext(fs.readFileSync(target,'utf8'),ctx,{filename:file,timeout:30000});
 }
 const execute=(expression,input)=>{
  ctx.__personalInput=JSON.parse(JSON.stringify(input??null));
  try{return JSON.parse(vm.runInContext('JSON.stringify('+expression+')',ctx,{timeout:10000}));}
  finally{delete ctx.__personalInput;}
 };
 const normalize=save=>execute('validateProfile(__personalInput)',save);
 const fresh=()=>execute('freshProfile()');
 return {normalize,fresh,
  fromLegacy:p=>execute('window.ArcanePersonalSave230.fromLegacy(__personalInput)',p),
  loadout:save=>execute('window.ArcanePersonalSave230.loadout(__personalInput)',save),
  award:(save,state,seat,room)=>execute('window.ArcanePersonalSave230.award(__personalInput)',{save,state,seat,room}),
  claimLegacyCard:(save,id)=>execute('window.ArcanePersonalSave230.claimLegacyCard(__personalInput)',{save,id})
 };
}
module.exports={createRuntime};
