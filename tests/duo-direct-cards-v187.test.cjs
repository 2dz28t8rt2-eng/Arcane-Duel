'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

class Node{
 constructor(tag='div'){
  this.tagName=tag;this.className='';this.children=[];this.textContent='';
  this.listeners={};this.attributes={};this.dataset={};this.hidden=false;
  this.disabled=false;this.open=false;this.selectedIndex=0;this.value='';
  this.classList={
   add:(...tokens)=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),...tokens])].join(' ');},
   remove:(...tokens)=>{this.className=this.className.split(' ').filter(Boolean).filter(x=>!tokens.includes(x)).join(' ');},
   contains:token=>this.className.split(' ').includes(token)
  };
 }
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=[...items];}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(name,listener){(this.listeners[name]??=[]).push(listener);}
 trigger(name,event={}){for(const listener of this.listeners[name]||[])listener(event);}
 click(){this.clickCount=(this.clickCount||0)+1;this.trigger('click');}
 focus(){this.focused=true;}
}

function harness({ghost=false,noTargets=false}={}){
 const helper=new Node();
 const attackPanel=new Node('details');
 const sourceSelect=new Node('select'),targetSelect=new Node('select');
 const commit=new Node('button');
 let lastPanelQuery='';
 const sourceCell=new Node(),targetCell=new Node();
 const sourcePanel={querySelector:selector=>{
  lastPanelQuery=selector;return selector.includes(ghost?'duo-ghost-cell':'field-cell')?sourceCell:null;
 }};
 const targetPanel={querySelector:selector=>{
  return selector.includes(ghost?'duo-ghost-cell':'field-cell')?targetCell:null;
 }};
 const dock={querySelector:selector=>({
  '[data-ad187-source]':sourceSelect,
  '[data-ad187-target]':targetSelect,
  '[data-ad187-commit]':commit,
  '#ad186-attack':attackPanel
 })[selector]};
 const document={
  getElementById:id=>id==='ad187-attack-guide'?helper:null,
  querySelector:selector=>selector.includes('data-seat="0"')?sourcePanel:
   selector.includes('data-seat="1"')?targetPanel:null,
  createElement:tag=>new Node(tag)
 };
 const window={};
 vm.runInNewContext(read('assets/duo-direct-cards-v187.js'),{window,document});
 const module=window.ArcaneDuoDirectCards187;
 const source={slot:2,card:{id:42},...(ghost?{area:'ghost'}:{})};
 const target={seat:1,slot:3,card:{id:57},...(ghost?{area:'ghost'}:{})};
 const legal={attackers:[source],targets:noTargets?[]:[target]};
 const props={game:{status:'active',activeSeat:0},seat:0,legal,dock,
  catalog:{42:{name:'Mondwächter'},57:{name:'Aschewolf'}}};
 module.enhance(props);
 const description=helper.children[0];
 const confirm=helper.children[1].children[0];
 const cancel=helper.children[1].children[1];
 return {helper,module,sourceCell,targetCell,sourceSelect,targetSelect,commit,
  description,confirm,cancel,attackPanel,props,legal,source,target,get panelQuery(){return lastPanelQuery;}};
}

test('legal field/ghost/direct attack keys agree with the existing 2v2 selectors',()=>{
 const {module}=harness();
 assert.equal(module.version,'18.7.0');
 assert.equal(module.sourceKey({slot:2}),'field:2');
 assert.equal(module.sourceKey({area:'ghost',slot:4}),'ghost:4');
 assert.equal(module.targetKey({seat:3,slot:1}),'3:field:1');
 assert.equal(module.targetKey({seat:1,area:'ghost',slot:0}),'1:ghost:0');
 assert.equal(module.targetKey(null),'direct');
 assert.equal(module.selectionReady({source:'field:2',target:null,targets:[{seat:1}]}),false);
 assert.equal(module.selectionReady({source:'field:2',target:'1:field:3',targets:[{seat:1}]}),true);
 assert.equal(module.selectionReady({source:'field:2',target:'direct',targets:[]}),true);
 assert.equal(module.selectionReady({source:null,target:'direct',targets:[]}),false);
});

test('clicking field cards selects but never executes an attack until confirmation',()=>{
 const ui=harness();
 assert.equal(ui.commit.clickCount||0,0);
 assert.equal(ui.helper.hidden,true);
 assert.equal(ui.sourceCell.classList.contains('ad187-valid-attacker'),true);
 ui.targetCell.click();
 assert.equal(ui.helper.hidden,true,'Enemy target does nothing before an attacker was chosen');
 ui.sourceCell.click();
 assert.equal(ui.sourceSelect.value,'field:2');
 assert.equal(ui.targetSelect.selectedIndex,-1);
 assert.equal(ui.commit.disabled,true,'Existing confirm also waits for an explicit target');
 assert.equal(ui.helper.hidden,false);
 assert.equal(ui.attackPanel.open,true,'The native Attack panel opens without scrolling');
 assert.equal(ui.confirm.disabled,true);
 assert.equal(ui.description.textContent.includes('Mondwächter'),true);
 assert.equal(ui.targetCell.classList.contains('ad187-targetable'),true);
 ui.targetCell.click();
 assert.equal(ui.targetSelect.value,'1:field:3');
 assert.equal(ui.confirm.disabled,false);
 assert.equal(ui.description.textContent.includes('Aschewolf'),true);
 assert.equal(ui.commit.clickCount||0,0,'Selection itself cannot attack');
 ui.confirm.click();
 assert.equal(ui.commit.clickCount,1,'Only the original, server-confirmed action is invoked');
});

test('ghost zones, keyboard selection and cancel use the existing 2v2 action controls',()=>{
 const ui=harness({ghost:true});
 assert.match(ui.panelQuery,/duo-ghost-cell/);
 assert.equal(ui.sourceCell.attributes['role'],'button');
 ui.sourceCell.trigger('keydown',{key:'Enter',preventDefault(){}});
 assert.equal(ui.sourceSelect.value,'ghost:2');
 ui.targetCell.trigger('keydown',{key:' ',preventDefault(){}});
 assert.equal(ui.targetSelect.value,'1:ghost:3');
 ui.cancel.click();
 assert.equal(ui.helper.hidden,true);
 assert.equal(ui.commit.disabled,false);
 assert.equal(ui.sourceCell.classList.contains('ad187-selected-attacker'),false);
 assert.equal(ui.targetCell.classList.contains('ad187-targetable'),false);
 assert.equal(ui.commit.clickCount||0,0);
 assert.equal(ui.sourceSelect.focused,true);
});

test('direct attack is available only without enemy monsters, with manual confirmation',()=>{
 const ui=harness({noTargets:true});
 ui.sourceCell.click();
 assert.equal(ui.confirm.disabled,false);
 assert.match(ui.description.textContent,/direkt die gegnerischen Lebenspunkte/);
 assert.equal(ui.commit.clickCount||0,0);
 ui.confirm.click();
 assert.equal(ui.commit.clickCount,1);
});

test('no new 2v2 rule, multiplayer API or progression logic is introduced',()=>{
 const html=read('duo-campaign-v2.html');
 const parity=read('assets/duo-parity-v160.js');
 const module=read('assets/duo-direct-cards-v187.js');
 assert.ok(html.includes('duo-direct-cards-v187.css'));
 assert.ok(html.includes('id="ad187-attack-guide"'));
 assert.ok(html.indexOf('duo-direct-cards-v187.js')<html.indexOf('duo-parity-v160.js'));
 assert.ok(parity.includes('attack.dataset.ad187Source'));
 assert.ok(parity.includes('target.dataset.ad187Target'));
 assert.ok(parity.includes('attackCommit.dataset.ad187Commit'));
 assert.ok(parity.indexOf('ArcaneDuoCombatFlow186?.enhance')<parity.indexOf('ArcaneDuoDirectCards187?.enhance'));
 assert.doesNotMatch(module,/\b(send|fetch|saveRoom|localStorage|sessionStorage)\s*\(/);
 assert.match(module,/commit\.click\(\)/);
});

test('the standalone visual preview has valid inline JavaScript and field/ghost/direct choices',()=>{
 const html=read('tests/browser-duo-direct-cards-v187.html');
 const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(Boolean);
 assert.equal(inline.length,1);
 assert.doesNotThrow(()=>new vm.Script(inline[0]));
 for(const scenario of ['ad187-demo-field','ad187-demo-ghost','ad187-demo-direct'])
  assert.ok(html.includes('id="'+scenario+'"'));
});
