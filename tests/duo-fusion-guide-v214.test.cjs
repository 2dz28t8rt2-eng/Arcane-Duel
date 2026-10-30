'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const moduleSource=fs.readFileSync(path.join(root,'assets/duo-fusion-guide-v214.js'),'utf8');
const duoHtml=fs.readFileSync(path.join(root,'duo-campaign-v2.html'),'utf8');
const parity=fs.readFileSync(path.join(root,'assets/duo-parity-v160.js'),'utf8');
const rules=require('../assets/duo-shared-rules-v160.js');
function harness(){
 const nodes=[],document={
  querySelector(){return null;},
  getElementById(){return null;},
  createElement(tag){
   const node={tag,className:'',type:'',innerHTML:'',textContent:'',
    children:[],listeners:{},
    addEventListener(type,cb){this.listeners[type]=cb;},
    append(...items){this.children.push(...items);},
    querySelector(key){if(key==='summary')return {textContent:''};return null;},
    closest(){return null;},
    scrollIntoView(){throw Error('Unexpected navigation without user click');}};
   nodes.push(node);return node;
  }
 };
 const window={matchMedia(){return {matches:true};}};
 vm.runInNewContext(moduleSource,{window,document},{filename:'duo-fusion-guide-v214.js'});
 return {guide:window.ArcaneDuoFusionGuide214,document,nodes};
}
test('Duo loads the guide before the fusion live-control render',()=>{
 assert.ok(duoHtml.includes('assets/duo-fusion-guide-v214.css'));
 assert.ok(duoHtml.indexOf('assets/duo-fusion-guide-v214.js')<
  duoHtml.indexOf('assets/duo-parity-v160.js'));
 assert.ok(parity.includes('ArcaneDuoFusionGuide214?.render({details,availability,result,materials,catalog})'));
 assert.ok(parity.includes('ArcaneDuoFusionGuide214?.clear(details)'));
});
test('Duo handbook has eight meaningful subchapters and does not import Solo rules',()=>{
 const {guide}=harness();
 const book=guide.bookHtml();
 assert.equal((book.match(/class="ad214-sub"/g)||[]).length,8);
 for(const phrase of ['Levelbeispiele','Pokerkombinationen','ATK und DEF',
  'Resonanz','Fusions-Stomp','Kernkarte','Duo-Spielstand'])assert.ok(book.includes(phrase),phrase);
 assert.match(book,/zwei Level-1-Karten|zwei Lv-1-Karten/);
});
test('Duo engine and guide agree on examples; preview is read-only',()=>{
 const normal=(level,role='combatant')=>({level,role,fusion:false});
 assert.equal(rules.fusionLevel([normal(6),normal(5)]).level,8);
 assert.equal(rules.fusionLevel([normal(2),normal(2)]).level,2);
 assert.equal(rules.fusionLevel([normal(6),normal(5),normal(5)]).level,9);
 const {guide,nodes}=harness();
 const details={children:[],querySelector(){return null;},append(x){this.children.push(x);}};
 const cards=[normal(6,'predator'),normal(5,'predator')];
 const rule=rules.fusionLevel(cards);
 const analysis={quality:1.24,role:'predator',rolls:4,pattern:'Paar',materialBlocks:2,
  pureRolePct:5,resonancePct:0,precisionPct:0,heritagePct:0,elemental:false};
 const availability={rule,cards,analysis,templates:[14]};
 const preview={templateId:14,analysis,atk:[1200,1400],def:[740,900],soulDef:0};
 const before=JSON.stringify({availability,preview});
 const output=guide.render({details,availability,result:preview,catalog:{14:{level:8,name:'Runenwesen'}}});
 assert.equal(output.level,8);
 assert.equal(output.role,'Predator');
 assert.match(details.children[0].innerHTML,/bis Lv 8/);
 assert.match(details.children[0].innerHTML,/ATK-Spanne/);
 assert.match(details.children[0].innerHTML,/1200|1.200|1 200/);
 assert.equal(JSON.stringify({availability,preview}),before);
 assert.ok(nodes.find(n=>n.className==='ad214-live'));
});
test('Duo special Level-1 example matches its own rule kernel',()=>{
 const card={level:1,role:'predator',fusion:false};
 assert.equal(rules.fusionLevel([card,card]).level,2);
 assert.equal(rules.fusionLevel([card,card,card]).level,1);
});