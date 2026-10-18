'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=['art-engine.js','game.js','expansion.js','evolution.js'].map(x=>fs.readFileSync(path.join(root,'assets',x),'utf8'));
function boot(){
 const nodes=new Map(),store=new Map();
 function el(id=''){return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},remove(){},setAttribute(){},addEventListener(){},insertAdjacentHTML(){},click(){this.onclick?.()},querySelector(){return el()},querySelectorAll(){return []},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};}
 const doc={body:el('body'),getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id)},querySelector(){return el()},querySelectorAll(){return []},createElement:el,addEventListener(){},elementFromPoint(){return null}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=12345;return a}},innerWidth:1200,innerHeight:800};
 const ctx=vm.createContext({window,document:doc,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 for(const source of src)vm.runInContext(source,ctx,{timeout:20000});
 return expr=>JSON.parse(vm.runInContext(`JSON.stringify(${expr})`,ctx,{timeout:20000}));
}
test('Low-level synergy is capped, poker-only, and never boosts ordinary two-card fusions',()=>{
 const run=boot();const result=run(`(()=>{const f=window.ArcaneEvolution.fusionPattern;return {free:f([1,2]).lowLevelBonus,one:f([3,3,1,1]).lowLevelBonus,straight:f([1,2,3]).lowLevelBonus,five:f([1,1,1,1,1]).lowLevelBonus,none:f([3,3,3]).lowLevelBonus}})()`);
 assert.deepEqual(result,{free:0,one:.04,straight:.03,five:.08,none:0});
});
test('Low-level pairs in a two-pair combination beat the two-card level-three pair in quality',()=>{
 const run=boot(),r=run(`({single:window.ArcaneEvolution.fusionQuality([3,3]).factor,twopair:window.ArcaneEvolution.fusionQuality([3,3,1,1]).factor})`);
 assert.ok(r.twopair>r.single,JSON.stringify(r));
});
test('Rulebook includes current game title, complete poker table, start fusion clarification, and quests',()=>{
 const run=boot(),r=run(`(()=>{showRules();return document.getElementById('modal').innerHTML})()`);
 for(const phrase of ['ARCANE DUEL 4.1','Monsterlexikon','Funkenwyrm','Runengreif','Zwei Paare','Große Straße','zusammen höchstens 8','15 abgeschlossene','Fusionsdeck','ATK','DEF','Verteidigung','Burst'])assert.ok(r.includes(phrase),phrase);
});
test('Fusion cinema uses real material artwork, with reduced-motion and instant guards',()=>{
 const js=fs.readFileSync(path.join(root,'assets/evolution.js'),'utf8');const css=fs.readFileSync(path.join(root,'assets/evolution.css'),'utf8');
 assert.match(js,/fusionVisualSnapshot\(materials\)/);
 assert.match(js,/fusionVisualSnapshot\(\[pending\.card,game\.players\[game\.active\]\.field\[idx\]\]\)/);
 assert.match(js,/item\.append\(img\)/);
 assert.match(js,/querySelector\('\.evo-fusion-result img'\)\.src=dataOf\(c\)\.art/);
 assert.match(js,/prefers-reduced-motion: reduce/);
 assert.match(css,/evo-cinema-orbit/);
 assert.match(css,/evo-cinema-merge/);
 assert.match(css,/evo-cinema-reveal/);
});

test('Large straight quality compensates for its wider level spread',()=>{
 const run=boot();const r=run(`({small:window.ArcaneEvolution.fusionQuality([1,2,3]).factor,large:window.ArcaneEvolution.fusionQuality([1,2,3,4,5]).factor,largeRolls:window.ArcaneEvolution.fusionPattern([1,2,3,4,5]).rollBonus})`);
 assert.ok(r.large>=r.small-1e-9,JSON.stringify(r));assert.equal(r.largeRolls,4);
});
