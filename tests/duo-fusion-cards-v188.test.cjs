'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');

class Element{
 constructor(tag='div'){
  this.tagName=tag;this.children=[];this.parentNode=null;this.className='';this.dataset={};
  this.attributes={};this.listeners={};this.textContent='';this.hidden=false;this.disabled=false;
  this.open=false;this.selected=false;this.clickCount=0;this.tabIndex=-1;
  this.classList={
   contains:key=>this.className.split(' ').includes(key),
   add:(...names)=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),...names])].join(' ');},
   remove:(...names)=>{this.className=this.className.split(' ').filter(x=>x&&!names.includes(x)).join(' ');},
   toggle:(name,state)=>{const set=new Set(this.className.split(' ').filter(Boolean));
    if(state===undefined?!set.has(name):state)set.add(name);else set.delete(name);
    this.className=[...set].join(' ');}
  };
 }
 append(...nodes){for(const node of nodes){if(node.parentNode)node.remove();node.parentNode=this;this.children.push(node);}}
 remove(){if(!this.parentNode)return;this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}
 insertBefore(node,ref){if(node.parentNode)node.remove();const index=this.children.indexOf(ref);
  node.parentNode=this;this.children.splice(index<0?this.children.length:index,0,node);}
 replaceChildren(...children){for(const c of this.children)c.parentNode=null;this.children=[];this.append(...children);}
 get options(){return this.tagName==='select'?this.children:[];}
 get selectedOptions(){return this.options.filter(x=>x.selected);}
 get value(){return this.tagName==='option'?this._value||'':this.selectedOptions[0]?.value||'';}
 set value(value){if(this.tagName==='option'){this._value=String(value);return;}
  for(const o of this.options)o.selected=o.value===String(value);}
 getAttribute(name){if(name==='tabindex')return this.tabIndex<0?null:String(this.tabIndex);return this.attributes[name]??null;}
 setAttribute(name,value){if(name==='tabindex')this.tabIndex=Number(value);else this.attributes[name]=String(value);}
 removeAttribute(name){if(name==='tabindex')this.tabIndex=-1;else delete this.attributes[name];}
 addEventListener(name,fn,capture=false){(this.listeners[name]??=[]).push({fn,capture});}
 dispatchEvent(event){
  const e={...event,type:event.type,preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};
  const handlers=this.listeners[event.type]||[];
  for(const listener of handlers.filter(x=>x.capture)){
   listener.fn(e);if(e.stopped)return true;
  }
  if(typeof this['on'+event.type]==='function')this['on'+event.type](e);
  for(const listener of handlers.filter(x=>!x.capture)){
   listener.fn(e);if(e.stopped)break;
  }
  return true;
 }
 click(){this.clickCount++;this.dispatchEvent({type:'click'});}
 querySelectorAll(selector){
  const found=[];
  const collect=node=>{for(const c of node.children){
   if(selector==='button'&&c.tagName==='button')found.push(c);
   collect(c);
  }};collect(this);return found;
 }
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 scrollIntoView() {this.scrolled=true;}
 closest(){return this.nativeParent||null;}
}

function fixture(existing){
 const sandbox=existing?.sandbox||{window:{},document:null,Event:class{constructor(type,props){this.type=type;Object.assign(this,props);}}};
 if(!existing)vm.runInNewContext(read('assets/duo-fusion-cards-v188.js'),sandbox);
 const api=sandbox.window.ArcaneDuoFusion188;
 const panel=new Element(),helper=new Element(),attackGuide=new Element();
 const native=new Element(),select=new Element('select');select.className='duo-fusion-list';
 native.append(select);select.nativeParent=native;
 const optionList=['hand:0','hand:1','field:0','field:1','ghost:0','charge:0','charge:1'];
 for(const key of optionList){const opt=new Element('option');opt.value=key;opt.textContent=key;
  select.append(opt);}
 const hint=new Element(),template=new Element('select'),slot=new Element('select');
 const addOption=(s,value,name)=>{const opt=new Element('option');opt.value=value;opt.textContent=name;
  opt.selected=true;s.append(opt);};
 addOption(template,'501','Sturmwächter');addOption(slot,'0','Feld 1');
 const commit=new Element('button');commit.disabled=true;
 const fusionPanel=new Element('details');fusionPanel.open=true;
 const handCards=[new Element(),new Element()],fieldCards=[new Element(),new Element()],ghost=new Element();
 const values={'hand:0':handCards[0],'hand:1':handCards[1],
  'field:0':fieldCards[0],'field:1':fieldCards[1],'ghost:0':ghost};
 panel.querySelector=selector=>{
  const hand=selector.match(/duo178-hand-card\[data-index="(\d+)"\]/);
  if(hand)return values['hand:'+hand[1]];
  const field=selector.match(/\.field-cell\[data-slot="(\d+)"\]/);
  if(field)return values['field:'+field[1]];
  const zone=selector.match(/duo-ghost-cell\[data-slot="(\d+)"\]/);
  if(zone)return values['ghost:'+zone[1]];
  return null;
 };
 native.querySelector=selector=>({'.duo-action-status':hint,
  '[data-ad188-template]':template,'[data-ad188-slot]':slot})[selector]||null;
 const dock={querySelector:selector=>({'.duo-fusion-list':select,
  '#ad186-fusion':fusionPanel,'[data-ad188-commit]':commit})[selector]||null};
 const own={seat:0,ownTurns:2,hand:[12,14],field:[{id:11},{id:13}],
  lv1:{ghostSlots:[{id:15}],charges:2}};
 const game={roomId:'v188-fixture',status:'active',activeSeat:0,round:3,players:[own]};
 select.onchange=()=>{
  const count=api.selectedKeys(select).length;
  commit.disabled=count<2;
  hint.textContent=count>=2?'Fusion möglich · Level 4':'Noch ein Material nötig';
 };
 sandbox.document={
  getElementById:id=>id==='ad188-fusion-guide'?helper:id==='ad187-attack-guide'?attackGuide:null,
  querySelector:selector=>selector.includes('data-seat="0"')?panel:null,
  createElement:tag=>new Element(tag)
 };
 api.enhance({game,seat:0,roomId:game.roomId,dock});
 const floatingConfirm=helper.children.find(x=>x.className==='ad188-floating-actions').children[0];
 return {api,sandbox,game,dock,panel,helper,attackGuide,select,native,hint,template,slot,commit,
  fusionPanel,handCards,fieldCards,ghost,floatingConfirm,values};
}

test('material selection helpers preserve unique keys and enforce the five-card cap',()=>{
 const {api}=fixture();
 assert.equal(api.version,'18.8.0');
 assert.deepEqual([...api.toggleMaterial(['hand:0'],'field:1').keys],['hand:0','field:1']);
 assert.deepEqual([...api.toggleMaterial(['hand:0','field:1'],'hand:0').keys],['field:1']);
 assert.equal(api.toggleMaterial(['hand:0','hand:1','field:0','field:1','ghost:0'],'charge:0').error,'limit');
 assert.equal(api.toggleMaterial(['hand:0'],'illegal:7').error,'invalid');
});

test('clicking cards changes the original fusion multi-select, preview and confirmation only',()=>{
 const ui=fixture();
 assert.equal(ui.select.parentNode.className,'ad188-list-fold');
 assert.equal(ui.fieldCards[0].classList.contains('ad188-material-eligible'),true);
 assert.equal(ui.commit.clickCount,0);
 ui.handCards[0].click();
 assert.deepEqual([...ui.api.selectedKeys(ui.select)],['hand:0']);
 assert.equal(ui.floatingConfirm.disabled,true);
 ui.fieldCards[1].click();
 assert.deepEqual([...ui.api.selectedKeys(ui.select)],['hand:0','field:1']);
 assert.equal(ui.fieldCards[1].classList.contains('ad188-material-selected'),true);
 assert.match(ui.helper.children[1].textContent,/Fusion möglich/);
 assert.equal(ui.floatingConfirm.disabled,false);
 assert.equal(ui.commit.clickCount,0,'Material clicks cannot submit a fusion');
 ui.floatingConfirm.click();
 assert.equal(ui.commit.clickCount,1,'The existing confirmation button remains authoritative');
 ui.fieldCards[1].click();
 assert.deepEqual([...ui.api.selectedKeys(ui.select)],['hand:0']);
});

test('fusion mode takes precedence over v18.7 attack clicks; leaving it restores existing roles',()=>{
 const ui=fixture();
 let attackClicks=0;
 ui.fieldCards[0].addEventListener('click',()=>attackClicks++);
 ui.fieldCards[0].click();
 assert.equal(attackClicks,0,'Fusion captures the click before the attacker handler');
 assert.equal(ui.fieldCards[0].getAttribute('role'),'button');
 ui.fusionPanel.open=false;
 ui.fusionPanel.dispatchEvent({type:'toggle'});
 assert.equal(ui.helper.hidden,true);
 assert.equal(ui.attackGuide.hidden,false);
 assert.equal(ui.fieldCards[0].getAttribute('role'),null);
 ui.fieldCards[0].click();
 assert.equal(attackClicks,1,'The attack click remains available outside fusion mode');
});

test('Geisterzone and spark buttons can be selected and removed; six materials are blocked',()=>{
 const ui=fixture();
 ui.ghost.click();
 const sparkBox=ui.native.children.find(x=>x.className==='ad188-spark-options');
 const buttons=sparkBox.querySelectorAll('button');
 buttons[0].click();
 assert.deepEqual([...ui.api.selectedKeys(ui.select)],['ghost:0','charge:0']);
 ui.handCards[0].click();ui.handCards[1].click();ui.fieldCards[0].click();
 assert.equal(ui.api.selectedKeys(ui.select).length,5);
 ui.fieldCards[1].click();
 assert.equal(ui.api.selectedKeys(ui.select).length,5);
 assert.match(ui.helper.children[2].textContent,/Höchstens fünf/);
 const chips=ui.helper.children.find(x=>x.className==='ad188-selected-materials');
 chips.children[0].click();
 assert.equal(ui.api.selectedKeys(ui.select).length,4);
});

test('re-render within the same own turn restores selected card identities',()=>{
 const first=fixture();
 first.handCards[0].click();first.fieldCards[1].click();
 const second=fixture(first);
 assert.deepEqual([...second.api.selectedKeys(second.select)],['hand:0','field:1']);
 assert.equal(second.commit.disabled,false);
});

test('v18.8 is linked after v18.7 and never handles the actual server action',()=>{
 const html=read('duo-campaign-v2.html'),parity=read('assets/duo-parity-v160.js');
 const implementation=read('assets/duo-fusion-cards-v188.js');
 assert.ok(html.includes('id="ad188-fusion-guide"'));
 assert.ok(html.includes('duo-fusion-cards-v188.css'));
 assert.ok(html.indexOf('duo-direct-cards-v187.js')<html.indexOf('duo-fusion-cards-v188.js'));
 assert.ok(html.indexOf('duo-fusion-cards-v188.js')<html.indexOf('duo-parity-v160.js'));
 assert.ok(parity.indexOf('ArcaneDuoDirectCards187?.enhance')<
  parity.indexOf('ArcaneDuoFusion188?.enhance'));
 assert.ok(parity.includes('commit.dataset.ad188Commit'));
 assert.match(implementation,/select\.dispatchEvent\(new Event\('change'/);
 assert.match(implementation,/commit\.click\(\)/);
 assert.doesNotMatch(implementation,/\b(fetch|localStorage|saveRoom|createClient)\s*\(/);
 assert.match(implementation,/discardIndices:/);
 const preview=read('tests/browser-duo-fusion-cards-v188.html');
 const scripts=[...preview.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(Boolean);
 assert.equal(scripts.length,1);assert.doesNotThrow(()=>new vm.Script(scripts[0]));
});
