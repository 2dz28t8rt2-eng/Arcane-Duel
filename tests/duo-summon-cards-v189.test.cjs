'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

class Cell{
 constructor(tag='div'){
  this.tagName=tag;this.className='';this.children=[];this.listeners={};this.attributes={};
  this.textContent='';this.hidden=false;this.disabled=false;this.selectedIndex=0;
  this.value='';this.tabIndex=-1;this.open=false;this.clickCount=0;
  this.classList={
   contains:name=>this.className.split(' ').includes(name),
   add:(...names)=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),...names])].join(' ');},
   remove:(...names)=>{this.className=this.className.split(' ').filter(x=>x&&!names.includes(x)).join(' ');},
   toggle:(name,value)=>{const set=new Set(this.className.split(' ').filter(Boolean));
    if(value===undefined?!set.has(name):value)set.add(name);else set.delete(name);
    this.className=[...set].join(' ');}
  };
 }
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];}
 getAttribute(name){if(name==='tabindex')return this.tabIndex<0?null:String(this.tabIndex);
  return this.attributes[name]??null;}
 setAttribute(name,value){if(name==='tabindex')this.tabIndex=Number(value);
  else this.attributes[name]=String(value);}
 removeAttribute(name){if(name==='tabindex')this.tabIndex=-1;else delete this.attributes[name];}
 addEventListener(name,fn,capture=false){(this.listeners[name]??=[]).push({fn,capture});}
 dispatchEvent(event){const data={...event,type:event.type,preventDefault(){},
  stopImmediatePropagation(){this.stopped=true;}};
  for(const listener of (this.listeners[event.type]||[]).filter(x=>x.capture)){
   listener.fn(data);if(data.stopped)return;
  }
  for(const listener of (this.listeners[event.type]||[]).filter(x=>!x.capture)){
   listener.fn(data);if(data.stopped)return;
  }
 }
 click(){this.clickCount++;this.dispatchEvent({type:'click'});}
 focus(){this.focused=true;}
}
function fixture({seat=0,active=true,freeSlots=[1,2],hands=[{index:0,id:12},{index:1,id:14}],previous=null}={}){
 const cells={
  hand:[new Cell(),new Cell()],slots:{1:new Cell(),2:new Cell()},
  battle:new Cell(),helper:new Cell(),attackGuide:new Cell(),fusionGuide:new Cell(),
  summonPanel:new Cell('details'),attackPanel:new Cell('details'),fusionPanel:new Cell('details'),
  handSelect:new Cell('select'),slotSelect:new Cell('select'),commit:new Cell('button')
 };
 cells.summonPanel.open=active;
 const rootNode={querySelector:selector=>{
  const hand=selector.match(/duo178-hand-card\[data-index="(\d+)"\]/);
  if(hand)return cells.hand[Number(hand[1])]||null;
  const slot=selector.match(/field-cell\[data-slot="(\d+)"\]/);
  if(slot)return cells.slots[Number(slot[1])]||null;
  return null;
 }};
 const dock={querySelector:selector=>({
  '#ad186-summon':cells.summonPanel,
  '#ad186-fusion':cells.fusionPanel,
  '#ad186-attack':cells.attackPanel,
  '[data-ad189-hand]':cells.handSelect,
  '[data-ad189-slot]':cells.slotSelect,
  '[data-ad189-commit]':cells.commit
 })[selector]||null};
 const document={
  getElementById:id=>({
   'ad189-summon-guide':cells.helper,'ad187-attack-guide':cells.attackGuide,
   'ad188-fusion-guide':cells.fusionGuide
  })[id]||null,
  querySelector:selector=>selector==='.duo-battle'?cells.battle:
   selector.includes('data-seat="'+seat+'"')?rootNode:null,
  createElement:tag=>new Cell(tag)
 };
 const scope=previous?.scope||{window:{},document,setTimeout:fn=>fn()};
 scope.document=document;
 if(!previous)vm.runInNewContext(read('assets/duo-summon-cards-v189.js'),scope);
 const api=scope.window.ArcaneDuoSummon189;
 const game={status:'active',activeSeat:seat,players:[{}, {}, {}]};
 const legal={hand:hands,freeSlots};
 const catalog={12:{name:'Silberfuchs'},14:{name:'Waldgeist'}};
 api.enhance({game,seat,legal,dock,catalog});
 const confirm=cells.helper.children[1]?.children[0];
 const cancel=cells.helper.children[1]?.children[1];
 return {api,scope,game,legal,cells,confirm,cancel,dock};
}

test('only legal hand-card and free-field pairs may be confirmed',()=>{
 const api=fixture().api;
 assert.equal(api.version,'18.9.0');
 assert.equal(api.selectionReady({hand:0,slot:1,hands:[{index:0}],slots:[1]}),true);
 assert.equal(api.selectionReady({hand:0,slot:null,hands:[{index:0}],slots:[1]}),false);
 assert.equal(api.selectionReady({hand:4,slot:1,hands:[{index:0}],slots:[1]}),false);
 assert.equal(api.selectionReady({hand:0,slot:4,hands:[{index:0}],slots:[1]}),false);
});

test('hand click then free slot changes original selectors but cannot summon automatically',()=>{
 const ui=fixture(),{cells}=ui;
 assert.equal(cells.hand[0].classList.contains('ad189-eligible-hand'),true);
 assert.equal(cells.slots[1].classList.contains('ad189-eligible-slot'),true);
 assert.equal(ui.confirm.disabled,true);
 cells.hand[0].click();
 assert.equal(cells.handSelect.value,'0');
 assert.equal(cells.slotSelect.selectedIndex,-1);
 assert.equal(cells.commit.disabled,true);
 assert.equal(cells.helper.hidden,false);
 assert.match(cells.helper.children[0].textContent,/Wähle einen freien oder besetzten Platz/);
 assert.equal(cells.commit.clickCount,0);
 cells.slots[2].click();
 assert.equal(cells.slotSelect.value,'2');
 assert.equal(ui.confirm.disabled,false);
 assert.equal(cells.slots[2].classList.contains('ad189-selected-slot'),true);
 assert.match(cells.helper.children[0].textContent,/Silberfuchs auf Feld 3/);
 assert.equal(cells.commit.clickCount,0);
 ui.confirm.click();
 assert.equal(cells.commit.clickCount,1,'Only the original game confirmation is called');
});

test('field first, keyboard operation, deselecting and cancel work without game actions',()=>{
 const ui=fixture(),{cells}=ui;
 cells.slots[1].dispatchEvent({type:'keydown',key:'Enter'});
 assert.equal(cells.slotSelect.value,'1');
 assert.equal(cells.handSelect.selectedIndex,-1);
 cells.hand[1].dispatchEvent({type:'keydown',key:' '});
 assert.equal(cells.handSelect.value,'1');
 assert.equal(ui.confirm.disabled,false);
 cells.hand[1].click();
 assert.equal(ui.confirm.disabled,true);
 ui.cancel.click();
 assert.equal(cells.helper.hidden,true);
 assert.equal(cells.commit.disabled,false,'Native dropdown confirmation is restored');
 assert.equal(cells.handSelect.focused,true);
 assert.equal(cells.commit.clickCount,0);
});

test('the classic dropdown path retains its already selected default field slot',()=>{
 const ui=fixture(),{cells}=ui;
 cells.handSelect.value='1';cells.slotSelect.value='2';
 cells.handSelect.dispatchEvent({type:'change'});
 assert.equal(cells.commit.disabled,false);
 assert.equal(ui.confirm.disabled,false);
 assert.equal(cells.handSelect.value,'1');
 assert.equal(cells.slotSelect.value,'2');
 assert.equal(cells.commit.clickCount,0);
});

test('clicks outside Summon mode do nothing and other action guides remain compatible',()=>{
 const ui=fixture({active:false}),{cells}=ui;
 cells.hand[0].click();cells.slots[1].click();
 assert.equal(cells.helper.hidden,true);
 assert.equal(cells.handSelect.value,'');
 cells.attackGuide.hidden=false;
 cells.summonPanel.open=true;cells.summonPanel.dispatchEvent({type:'toggle'});
 assert.equal(cells.attackGuide.hidden,true);
 cells.hand[0].click();
 assert.equal(cells.handSelect.value,'0');
 cells.summonPanel.open=false;cells.attackPanel.open=true;
 cells.summonPanel.dispatchEvent({type:'toggle'});
 assert.equal(cells.attackGuide.hidden,false,'Pending attack guide is restored');
 assert.equal(cells.battle.classList.contains('ad189-summon-mode'),false);
});

test('guest seat, empty-field restrictions and once-per-turn summon are respected',()=>{
 const guest=fixture({seat:2});
 guest.cells.hand[1].click();guest.cells.slots[2].click();
 assert.equal(guest.confirm.disabled,false);
 const finished=fixture({hands:[]});
 assert.equal(finished.cells.helper.hidden,true);
 assert.equal(finished.cells.hand[0].classList.contains('ad189-eligible-hand'),false);
 const noSpace=fixture({freeSlots:[]});
 assert.equal(noSpace.cells.helper.hidden,true);
});

test('a harmless re-render of the same turn keeps the chosen hand card and free field',()=>{
 const first=fixture();
 first.cells.hand[1].click();first.cells.slots[2].click();
 const second=fixture({previous:first});
 assert.equal(second.cells.handSelect.value,'1');
 assert.equal(second.cells.slotSelect.value,'2');
 assert.equal(second.confirm.disabled,false);
 assert.equal(second.cells.commit.clickCount,0);
});

test('v18.9 is purely visual, loads last and preserves the original summon command',()=>{
 const html=read('duo-campaign-v2.html');
 const parity=read('assets/duo-parity-v160.js');
 const mod=read('assets/duo-summon-cards-v189.js');
 assert.ok(html.includes('id="ad189-summon-guide"'));
 assert.ok(html.includes('duo-summon-cards-v189.css'));
 assert.ok(html.indexOf('duo-fusion-cards-v188.js')<html.indexOf('duo-summon-cards-v189.js'));
 assert.ok(html.indexOf('duo-summon-cards-v189.js')<html.indexOf('duo-parity-v160.js'));
 assert.ok(parity.includes('summonCommit.dataset.ad189Commit'));
 assert.match(parity,/type:occupied\?'replace':'summon'/);
 assert.ok(parity.indexOf('ArcaneDuoFusion188?.enhance')<parity.indexOf('ArcaneDuoSummon189?.enhance'));
 assert.match(mod,/commit\.click\(\)/);
 assert.doesNotMatch(mod,/\b(fetch|send|saveRoom|localStorage|createClient)\s*\(/);
 const preview=read('tests/browser-duo-summon-cards-v189.html');
 const scripts=[...preview.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(Boolean);
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new vm.Script(scripts[0]));
});
