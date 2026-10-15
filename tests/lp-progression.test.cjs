'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function boot(){
 const store=new Map(),nodes=new Map();function el(){return {innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},insertAdjacentHTML(){},querySelector(){return null},querySelectorAll(){return []},append(){},appendChild(){},remove(){},focus(){},setAttribute(){}};}
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:el,addEventListener(){}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=123456;return a}}};
 const ctx=vm.createContext({window,document,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const f of ['assets/art-engine.js','assets/game.js','assets/expansion.js','assets/evolution.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',f),'utf8'),ctx,{timeout:20000});
 return expr=>JSON.parse(vm.runInContext('JSON.stringify('+expr+')',ctx,{timeout:20000}));
}
test('Tournament and free duels have matching LP by opponent, with no asymmetry',()=>{
 const run=boot();const r=run(`(()=>{let out=[];for(const context of ['tournament','free'])for(let id=0;id<=10;id++){const g=createGame({id:'lp-'+context+'-'+id,mode:'pve',context,opponentId:id});out.push({context,id,lp:g.maxLP,players:g.players.map(p=>p.lp)});}return out;})()`);
 for(const x of r){const expected=x.id<=3?4000:x.id<=6?6000:x.id<=8?7000:8000;assert.equal(x.lp,expected,`${x.context} vs ${x.id}`);assert.deepEqual(x.players,[expected,expected]);}
});
test('Hard, PvP and late-game visitor retain 8,000 LP',()=>{
 const run=boot();const r=run(`(()=>{const cases=[{mode:'pve',opponentId:2,difficulty:'hard',context:'free'},{mode:'pvp'},{mode:'pve',opponentId:8,context:'challenge',enemy:showcaseEnemy(),showcase:true}];return cases.map((o,i)=>{const g=createGame({...o,id:'lp-extra-'+i});return {maxLP:g.maxLP,players:g.players.map(p=>p.lp)}});})()`);
 for(const x of r){assert.equal(x.maxLP,8000);assert.deepEqual(x.players,[8000,8000]);}
});
test('Snapshot restores its original 4,000 LP, or higher LP from new matches',()=>{
 const run=boot();const r=run(`(()=>{let results=[];for(const id of [2,4,7,10]){const g=createGame({id:'snapshot-'+id,mode:'pve',context:'tournament',opponentId:id});const raw=JSON.parse(JSON.stringify(g));const restored=validateDuelSnapshot(raw);results.push({id,expected:g.maxLP,actual:restored.maxLP,players:restored.players.map(p=>p.lp)});}const old=createGame({id:'old',mode:'pve',context:'free',opponentId:9});old.maxLP=4000;old.players.forEach(p=>p.lp=4000);const oldRestored=validateDuelSnapshot(JSON.parse(JSON.stringify(old)));return {results,old:oldRestored.maxLP};})()`);
 for(const x of r.results){assert.equal(x.actual,x.expected);assert.deepEqual(x.players,[x.expected,x.expected]);}assert.equal(r.old,4000);
});
test('Rulebook and opponent cards display current LP progression',()=>{
 const run=boot();const r=run(`(()=>{showRules();const rules=document.getElementById('modal').innerHTML;const p=regularOpponentPanel(OPPONENTS[4],true);return {rules,card:p};})()`);
 assert.match(r.rules,/4\.000/);assert.match(r.rules,/6\.000/);assert.match(r.rules,/7\.000/);assert.match(r.rules,/8\.000/);assert.match(r.card,/6[\.\s\u00a0]000 LP/);
});