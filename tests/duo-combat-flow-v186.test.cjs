'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=file=>fs.readFileSync(path.join(root,file),'utf8');

class FakeNode{
 constructor(tag){
  this.tagName=tag;this.className='';this.children=[];this.parentNode=null;
  this.textContent='';this.attributes={};this.listeners={};this.dataset={};this.hidden=false;
  this.open=false;this.disabled=false;
  this.classList={
   contains:name=>this.className.split(/\s+/).includes(name),
   add:(...names)=>{const words=new Set(this.className.split(/\s+/).filter(Boolean));names.forEach(x=>words.add(x));this.className=[...words].join(' ');},
   toggle:(name,value)=>{const words=new Set(this.className.split(/\s+/).filter(Boolean));
    if(value===undefined?!words.has(name):value)words.add(name);else words.delete(name);
    this.className=[...words].join(' ');}
  };
 }
 append(...nodes){for(const node of nodes){
  if(node.parentNode)node.parentNode.children=node.parentNode.children.filter(child=>child!==node);
  node.parentNode=this;this.children.push(node);
 }}
 prepend(...nodes){this.append(...nodes);const moved=nodes.filter(x=>this.children.includes(x));
  this.children=this.children.filter(x=>!moved.includes(x));this.children.unshift(...moved);}
 setAttribute(name,value){this.attributes[name]=String(value);}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 querySelectorAll(selector){
  if(selector.startsWith(':scope > .')){
   const cls=selector.slice(10);return this.children.filter(x=>x.classList.contains(cls));
  }
  const target=selector.startsWith('.')?selector.slice(1):null;
  const found=[];const walk=n=>{for(const c of n.children){
   if(target?c.classList.contains(target):c.tagName===selector)found.push(c);
   walk(c);
  }};walk(this);return found;
 }
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 scrollIntoView(){}
}
const scope={window:{matchMedia:()=>({matches:true})},document:{createElement:tag=>new FakeNode(tag)}};
vm.runInNewContext(source('assets/duo-combat-flow-v186.js'),scope);
const flow=scope.window.ArcaneDuoCombatFlow186;

test('Every existing 2v2 action is assigned to the correct beginner-friendly category',()=>{
 const titles=['✦ Monster beschwören','✦ Fusion','⚔ Angriff','🛡 Position wechseln',
  '✦ Seelenzehrer','✦ Reißzahn · Angriffswahl','✧ Verbotene Forschung · Level-1-Schwarm'];
 const plan=flow.plan(titles);
 assert.equal(plan.selected,'summon');
 assert.deepEqual([...plan.groups.map(x=>x.key)],['summon','fusion','attack','skills']);
 assert.equal(plan.groups.find(x=>x.key==='skills').titles.length,4);
 assert.equal(flow.classify('✦ Reißzahn · Angriffswahl'),'skills');
 assert.equal(flow.classify('⚔ Angriff'),'attack');
});

test('Panel choice persists, falls back when unavailable and supports collapsing everything',()=>{
 const titles=['✦ Fusion','⚔ Angriff','✦ Seelenzehrer'];
 assert.equal(flow.plan(titles).selected,'attack');
 assert.equal(flow.plan(titles,'fusion').selected,'fusion');
 assert.equal(flow.plan(titles,'summon').selected,'attack');
 assert.equal(flow.plan(titles,null).selected,null);
 assert.equal(flow.plan([]).selected,null);
});

test('DOM enhancement moves existing buttons and selects without replacing their handlers or values',()=>{
 const dock=new FakeNode('div');
 const note=new FakeNode('p');note.className='duo-turn-note';dock.append(note);
 const first=new FakeNode('section');first.className='duo-action-group';
 const heading=new FakeNode('h3');heading.textContent='✦ Monster beschwören';first.append(heading);
 const select=new FakeNode('select');select.value='field:3';first.append(select);
 const originalAction=()=>{};
 const summonButton=new FakeNode('button');summonButton.onclick=originalAction;first.append(summonButton);
 const second=new FakeNode('section');second.className='duo-action-group';
 const headingTwo=new FakeNode('h3');headingTwo.textContent='⚔ Angriff';second.append(headingTwo);
 const end=new FakeNode('div');end.className='duo-actions-footer';
 const endButton=new FakeNode('button');endButton.onclick=originalAction;end.append(endButton);
 dock.append(first,second,end);
 flow.enhance({dock,game:{status:'active',activeSeat:0,roomId:'test-flow'},roomId:'test-flow',seat:0});
 assert.equal(dock.classList.contains('ad186-enhanced'),true);
 assert.equal(dock.querySelectorAll('.ad186-action-card').length,2);
 assert.equal(select.value,'field:3');
 assert.equal(summonButton.onclick,originalAction);
 assert.equal(endButton.onclick,originalAction);
 assert.equal(dock.querySelector('.ad186-toolbar-footer').querySelector('button'),endButton);
 assert.equal(note.hidden,true);
 const cards=dock.querySelectorAll('.ad186-action-card');
 assert.equal(cards.find(x=>x.dataset.kind==='summon').open,true);
 const attack=dock.querySelectorAll('.ad186-shortcut')[1];
 attack.listeners.click[0]();
 assert.equal(cards.find(x=>x.dataset.kind==='attack').open,true);
 assert.equal(cards.find(x=>x.dataset.kind==='summon').open,false);
 flow.enhance({dock,game:{status:'active',activeSeat:0,roomId:'test-flow'},roomId:'test-flow',seat:0});
 assert.equal(dock.querySelectorAll('.ad186-action-toolbar').length,1,'Do not add twice');
});

test('v18.6 runs only in the 2v2 user interface and changes no game or backend rules',()=>{
 const html=source('duo-campaign-v2.html'),parity=source('assets/duo-parity-v160.js'),mod=source('assets/duo-combat-flow-v186.js');
 assert.ok(html.includes('assets/duo-combat-flow-v186.css'));
 assert.ok(html.indexOf('duo-combat-flow-v186.js')<html.indexOf('duo-parity-v160.js'));
 assert.ok(parity.includes('ArcaneDuoCombatFlow186?.enhance'));
 assert.doesNotMatch(mod,/localStorage\.setItem|\b(send|apply|saveProfile|saveRoom)\s*\(/);
});
