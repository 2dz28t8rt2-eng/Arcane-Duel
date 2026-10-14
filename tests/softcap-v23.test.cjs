'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function run(expression){
 const nodes=new Map(),store=new Map(),el=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,value:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},append(){},appendChild(){},insertAdjacentHTML(){},remove(){},click(){},focus(){},querySelector(){return null},querySelectorAll(){return []}});
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:el,addEventListener(){}};
 const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=1234567;return a}},location:{reload(){}}};
 const ctx=vm.createContext({window,document,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const file of ['assets/art-engine.js','assets/game.js','assets/expansion.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),ctx);
 return JSON.parse(vm.runInContext('JSON.stringify('+expression+')',ctx));
}
test('Five player levels per cleared opponent, strong soft cap, old opponents cannot bypass it',()=>{
 const data=run(`(()=>{profile.cleared=[1];const early=[5,6,7,8,10,15].map(level=>({level,xp:farmingXpFactor(1,level),drop:farmingDropFactor(1,level)}));profile.cleared=[1,2,3,4,5,6,7,8,9,10];return {early,limits:[1,4,7,10].map(id=>farmingLevelCap(id)),old:farmingXpFactor(1,40),current:farmingXpFactor(10,40),end:farmingXpFactor(10,51)};})()`);
 assert.deepEqual(data.limits,[5,20,35,50]);assert.equal(data.early[0].xp,1);assert.equal(data.early[1].xp,.25);assert.ok(data.early[3].xp<.25);assert.equal(data.early.at(-1).xp,.10);assert.equal(data.old,.10);assert.equal(data.current,1);assert.equal(data.end,.25);
});
test('Repeated victories are XP-softcapped; first tournament victory retains full XP',()=>{
 const data=run(`(()=>{profile.cleared=[1];profile.xp=levelFloor(6);const g=createGame({id:'softcap-free',mode:'pve',opponentId:1,context:'free',seed:501});g.winner=0;const free=rewardMatch(g).xp;const f=createGame({id:'softcap-first',mode:'pve',opponentId:2,context:'tournament',seed:502});f.winner=0;const first=rewardMatch(f);return {free,firstXp:first.xp,first:first.first};})()`);
 assert.ok(data.free>0&&data.free<=12);assert.equal(data.first,true);assert.ok(data.firstXp>=32);
});
test('Vulkanrichter strength reduced slightly without altering neighboring opponents',()=>{
 const powers=run('RPG_OPPONENTS.slice(3,8).map(o=>o.power)');assert.deepEqual(powers,[.99,1.02,1.04,1.08,1.14]);
});