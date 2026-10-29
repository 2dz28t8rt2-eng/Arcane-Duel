'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const v181=read('assets/pack-cinema-v181.js');
const v195=read('assets/pack-cinema-v195.js');
const api=require('../assets/pack-cinema-v195.js');

const cards=[
 {name:'Goldener Drache',level:10,ace:true},
 {name:'Kleine Flamme',level:2},
 {name:'Zwillinge der Nacht',level:4,fusion:true},
 {name:'Sonnenzeichen',level:9},
 {name:'Uralt-Fusion',level:8,fusion:true}
];

function harness({fast=false,reduced=false,sound=true}={}){
 let now=0,next=0,enabled=false,volume=35;
 const timers=new Map(),storage=new Map(),played=[];
 if(fast)storage.set('arcane-pack-cinema-fast-v181','true');
 const document={activeElement:null,events:new Map()};
 class Node{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes=new Map();
   this.className='';this.hidden=false;this.disabled=false;this.isConnected=true;
   this.style={setProperty:()=>{}};this.events=new Map();this.textContent='';}
  get classList(){return {
   add:(...names)=>{const all=new Set(this.className.split(/\s+/).filter(Boolean));
    names.forEach(name=>all.add(name));this.className=[...all].join(' ');},
   remove:(...names)=>{const all=new Set(this.className.split(/\s+/).filter(Boolean));
    names.forEach(name=>all.delete(name));this.className=[...all].join(' ');},
   contains:name=>this.className.split(/\s+/).includes(name)
  };}
  append(...children){for(const child of children){this.children.push(child);child.parent=this;}}
  setAttribute(name,value){this.attributes.set(name,value);}
  removeAttribute(name){this.attributes.delete(name);}
  addEventListener(name,handler){this.events.set(name,handler);}
  remove(){this.isConnected=false;this.parent?.children.splice(this.parent.children.indexOf(this),1);}
  focus(){document.activeElement=this;}
  querySelectorAll(){return [];}
  querySelector(){return null;}
 }
 document.createElement=name=>new Node(name);
 document.createTextNode=text=>({textContent:text});
 document.addEventListener=(name,handler)=>document.events.set(name,handler);
 document.removeEventListener=name=>document.events.delete(name);
 document.body=new Node('body');document.querySelector=()=>null;
 const audio=sound?{
  isEnabled:()=>enabled,setEnabled:value=>(enabled=!!value),
  setVolume:value=>(volume=Number(value)),getVolume:()=>volume,
  playPreview:kind=>{if(enabled)played.push(kind);}
 }:undefined;
 const root={document,ArcaneDuoSound194:audio,
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
  matchMedia:()=>({matches:reduced}),
  setTimeout:(fn,delay)=>{const id=++next;timers.set(id,{at:now+delay,fn});return id;},
  clearTimeout:id=>timers.delete(id)};
 const context={window:root,Promise};
 vm.runInNewContext(v181,context);vm.runInNewContext(v195,context);
 function byClass(cls,parent=document.body){
  return [parent,...(parent.children||[]).flatMap(child=>byClassNodes(child))]
   .find(node=>node.classList?.contains(cls))||null;
 }
 function byClassNodes(parent){return [parent,...(parent.children||[]).flatMap(byClassNodes)];}
 function all(cls){return byClassNodes(document.body).filter(node=>node.classList?.contains(cls));}
 function advance(time){
  let guard=200;
  while(guard--&&[...timers.values()].some(item=>item.at<=time)){
   const [id,item]=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0];
   timers.delete(id);now=item.at;item.fn();
  }
  if(guard<=0)throw Error('Timer loop');now=time;
 }
 return {document,root,context,api:root.ArcanePackCinema181,byClass,all,
  timers,played,advance,finish:()=>{advance(7000);byClass('ad178-pack-controls').children[2].onclick();}};
}

test('rarity tiers reserve the final reveal for the ACE',()=>{
 assert.deepEqual(cards.map(api.tier),[4,0,1,2,3]);
 assert.match(api.label(cards[0]),/ACE/);
 assert.match(api.label(cards[4]),/FUSION/);
});

test('the visual reveal order does not reorder cards or alter the reward list',async()=>{
 const h=harness(),original=JSON.stringify(cards);
 const finished=h.api.open(cards,{selection:true});
 const nodes=h.all('ad178-reward-card');
 assert.equal(nodes.length,5);
 assert.equal(h.byClass('ad195-sigil-seal').textContent,'✦');
 assert.equal(h.byClass('ad195-audio-panel').attributes.get('aria-label'),'Booster-Klänge');
 h.byClass('ad178-pack').onclick();
 assert.equal(h.byClass('ad195-seal-breaking')!==null,true);
 h.advance(570);
 assert.ok(h.byClass('ad195-pack-rifted'));
 h.advance(1210);
 assert.equal(nodes[1].classList.contains('ad178-is-revealed'),true);
 assert.equal(nodes[0].classList.contains('ad178-is-revealed'),false);
 h.advance(1622);assert.equal(nodes[2].classList.contains('ad178-is-revealed'),true);
 h.advance(2034);assert.equal(nodes[3].classList.contains('ad178-is-revealed'),true);
 h.advance(2446);assert.equal(nodes[4].classList.contains('ad178-is-revealed'),true);
 h.advance(2858);assert.equal(nodes[0].classList.contains('ad178-is-revealed'),true);
 assert.ok(nodes[0].classList.contains('ad195-tier-4'));
 assert.match(h.byClass('ad195-special-notice').textContent,/ACE/);
 assert.deepEqual(nodes.map(n=>n.children[1].children[1].textContent),cards.map(c=>c.name));
 assert.equal(JSON.stringify(cards),original);
 h.advance(3858);
 assert.ok(h.byClass('ad195-pack-finished'));
 assert.ok(h.byClass('ad195-special-reveal'),
  'the ACE spotlight stays visible even after another rare card');
 h.byClass('ad178-pack-controls').children[2].onclick();
 assert.equal(await finished,true);
 assert.equal(h.timers.size,0);
});

test('sound starts muted, is opt-in, and accentuates the rare cards',async()=>{
 const h=harness(),finished=h.api.open(cards);
 const toggle=h.byClass('ad195-audio-toggle');
 const slider=h.byClass('ad195-volume-slider');
 assert.equal(toggle.attributes.get('aria-pressed'),'false');
 assert.equal(h.byClass('ad195-volume-label').hidden,true);
 toggle.events.get('click')();
 assert.equal(toggle.attributes.get('aria-pressed'),'true');
 assert.equal(h.byClass('ad195-volume-label').hidden,false);
 slider.value='60';slider.events.get('input')();
 assert.equal(h.byClass('ad195-volume-value').textContent,'60 %');
 h.byClass('ad178-pack').onclick();h.advance(3600);
 assert.deepEqual(h.played,['packBreak','packOpen','packFlip','packFlip',
  'packRare','packRare','packAce']);
 h.byClass('ad178-pack-controls').children[2].onclick();await finished;
});

test('skip and motion reduction reveal cards without suspense timers or sounds',async()=>{
 for(const options of [{fast:true},{reduced:true},{}]){
  const h=harness(options),finished=h.api.open(cards,{selection:true});
  if(!options.fast&&!options.reduced)h.byClass('ad178-pack-controls').children[1].onclick();
  assert.equal(h.all('ad178-is-revealed').length,cards.length);
  assert.ok(h.byClass('ad195-skipped'));
  assert.equal(h.timers.size,0);
  assert.deepEqual(h.played,[]);
  h.byClass('ad178-pack-controls').children[2].onclick();await finished;
 }
});

test('the cinematic is optional: a failed effect cannot block existing loot or focus',async()=>{
 const h=harness({sound:false});
 h.root.ArcanePackExperience195={onPhase(){throw Error('effect failure');}};
 const finished=h.api.open(cards);
 h.byClass('ad178-pack').onclick();h.advance(4200);
 assert.equal(h.all('ad178-is-revealed').length,cards.length);
 h.byClass('ad178-pack-controls').children[2].onclick();
 assert.equal(await finished,true);
});

test('both games load the same v19.5 effect without touching pack odds',()=>{
 for(const page of ['index.html','duo-campaign-v2.html']){
  const html=read(page);
  assert.match(html,/pack-cinema-v195\.css/);
  assert.match(html,/pack-cinema-v195\.js/);
  assert.match(html,/duo-sound-v194\.js/);
  assert.ok(html.indexOf('pack-cinema-v181.js')<html.indexOf('pack-cinema-v195.js'));
  assert.ok(html.indexOf('duo-sound-v194.js')<html.indexOf('pack-cinema-v195.js'));
 }
 assert.doesNotMatch(v195,/takePackCard|buyBooster|rollBooster|profile\.coins|duoProfile\.essence/);
 assert.doesNotMatch(v181,/takePackCard|buyBooster|rollBooster|profile\.coins|duoProfile\.essence/);
});

test('the standalone browser preview has valid JavaScript and three playable scenarios',()=>{
 const demo=read('tests/browser-pack-cinema-v195.html');
 const scripts=[...demo.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]);
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new vm.Script(scripts[0]));
 for(const id of ['three','five','ten','reset'])assert.match(demo,new RegExp(`id="${id}"`));
 assert.match(demo,/keine Karten vergeben/);
});
