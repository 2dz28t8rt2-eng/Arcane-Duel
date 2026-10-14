'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function boot(){
 const storage=new Map(),nodes=new Map(),el=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,value:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},append(){},appendChild(){},insertAdjacentHTML(){},remove(){},click(){},focus(){},querySelector(){return null},querySelectorAll(){return []}});
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:el,addEventListener(){}};
 const window={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},crypto:{getRandomValues(a){a[0]=1234567;return a}},location:{reload(){}}};
 const ctx=vm.createContext({window,document,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const file of ['assets/art-engine.js','assets/game.js','assets/expansion.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),ctx);
 return code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',ctx));
}
test('First victories grant substantial XP but no free cards; ace requires one-time shop purchase',()=>{
 const result=boot()(`(()=>{profile.trainingWins=3;const rows=[];for(let tier=1;tier<=10;tier++){const before=profile.unlocked.length+profile.fusionOwned.length;const g=createGame({id:'v24-first-'+tier,mode:'pve',context:'tournament',opponentId:tier,seed:100+tier});g.winner=0;const reward=rewardMatch(g);rows.push({tier,level:playerLevel(profile),xp:reward.xp,card:reward.loot?.card,freeCards:profile.unlocked.length+profile.fusionOwned.length-before});}const ace=window.ArcaneExpansion.aceIds[1];profile.coins=100000;const bought=window.ArcaneExpansion.buyAce(1),again=window.ArcaneExpansion.buyAce(1);return {rows,bought,again,aceOwned:profile.inventory[ace]};})()`);
 assert.equal(result.rows.length,10);
 assert.ok(result.rows.every(r=>r.level>=r.tier*5-2));
 assert.ok(result.rows.every(r=>r.card==null));
 assert.equal(result.bought,true);assert.equal(result.again,false);assert.equal(result.aceOwned,1);
 console.log('TOURNAMENT_REWARDS '+JSON.stringify(result.rows));
});
test('Booster ACE chance remains 0.35 percent per slot and only after purchase',()=>{
 const x=fs.readFileSync(path.resolve(__dirname,'../assets/expansion.js'),'utf8');assert.match(x,/randomInt\(g,10000\)<35/);assert.match(x,/profile\.acePurchased\.filter\(t=>t<=tier\)/);
});
