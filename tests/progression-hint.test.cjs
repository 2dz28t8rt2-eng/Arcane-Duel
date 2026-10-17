'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=['assets/art-engine.js','assets/game.js','assets/expansion.js','assets/evolution.js'].map(x=>fs.readFileSync(path.resolve(__dirname,'..',x),'utf8')).join('\n;\n');
function boot(){
 const nodes=new Map(),store=new Map();
 const el=()=>({innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},
   classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},
   addEventListener(){},removeEventListener(){},querySelector(){return null},querySelectorAll(){return []},
   insertAdjacentHTML(){},setAttribute(){},getAttribute(){return null}});
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},
   createElement:el,querySelector(){return null},querySelectorAll(){return []},addEventListener(){}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const window={localStorage,location:{protocol:'https:',hostname:'isolated.test'},innerWidth:1200,
   crypto:{getRandomValues(a){a[0]=12345;return a}},matchMedia(){return {matches:true}},addEventListener(){}};
 const ctx=vm.createContext({window,document,localStorage,console,Date,Math,JSON,Number,Array,Set,Map,
   Object,String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN,
   setTimeout(){},setInterval(){},clearInterval(){},clearTimeout(){}});
 vm.runInContext(src,ctx,{timeout:30000});
 return expr=>JSON.parse(vm.runInContext('JSON.stringify('+expr+')',ctx,{timeout:30000}));
}
test('progression hint only triggers after two consecutive losses to the same tournament opponent',()=>{
 const run=boot();
 const out=run(`(()=>{
  profile.guideSeen=true;let i=0;
  const fight=(tier,context,win=1,surrendered=false)=>{
    const g=createGame({id:'progression-hint-'+(++i),seed:300+i,mode:'pve',opponentId:tier,context});
    g.winner=win;g.surrendered=surrendered;rewardMatch(g);
    return progressionHintReady(g);
  };
  const first=fight(1,'tournament');
  const unrelated=fight(0,'free');
  const restarted=fight(1,'tournament');
  const second=fight(1,'tournament');
  profile.progressionHintSeen.push(1);saveProfile();
  const third=fight(1,'tournament');
  const saved=validateProfile(JSON.parse(JSON.stringify(profile))).progressionHintSeen;
  return {first,unrelated,restarted,second,third,saved};
 })()`);
 assert.equal(out.first,false);
 assert.equal(out.unrelated,false);
 assert.equal(out.restarted,false);
 assert.equal(out.second,true);
 assert.equal(out.third,false);
 assert.deepEqual(out.saved,[1]);
});
test('progression hint excludes PvP, showcase, surrender and already cleared opponents',()=>{
 const r=boot()(`(()=>{
   const g={mode:'pve',context:'tournament',opponentId:2,winner:1,surrendered:false,showcase:false};
   const p={cleared:[],progressionHintSeen:[],history:[{context:'tournament',opponent:2,win:false},{context:'tournament',opponent:2,win:false}]};
   const eligible=progressionHintReady(g,p);
   const special=progressionHintReady({...g,showcase:true},p);
   const surrendered=progressionHintReady({...g,surrendered:true},p);
   const cleared=progressionHintReady(g,{...p,cleared:[2]});
   const pvp=progressionHintReady({...g,mode:'pvp'},p);
   const once=progressionHintReady(g,{...p,progressionHintSeen:[2]});
   return {eligible,special,surrendered,cleared,pvp,once};
 })()`);
 assert.deepEqual(r,{eligible:true,special:false,surrendered:false,cleared:false,pvp:false,once:false});
});
test('progression hint provides direct navigation to free fights, workshop, upgrades and shop',()=>{
 const game=fs.readFileSync(path.resolve(__dirname,'../assets/game.js'),'utf8');
 for(const target of ['progressionHintFree','progressionHintWorkshop','progressionHintUpgrades','progressionHintShop']){
  assert.ok(game.includes(target));
 }
 assert.ok(game.includes('returnToMenu();'));
});

test('lost tournament battle grants small capped essence exactly once, without altering victory flags',()=>{
 const run=boot();
 const r=run(`(()=>{
  const g=createGame({id:'tournament-loss-essence',seed:987,mode:'pve',context:'tournament',opponentId:4});
  g.winner=1;
  const first=rewardMatch(g),again=rewardMatch(g);
  return {coins:first.coins,balance:profile.coins,losses:profile.losses,
   repeated:again===null,cleared:profile.cleared.includes(4),
   lastHistory:profile.history[0]};
 })()`);
 assert.equal(r.coins,9);
 assert.equal(r.balance,9);
 assert.equal(r.losses,1);
 assert.equal(r.repeated,true);
 assert.equal(r.cleared,false);
 assert.equal(r.lastHistory.coins,9);
});
test('tournament loss reward is capped at 25 essence in the final rounds',()=>{
 const run=boot();
 const r=run(`(()=>{
  const g=createGame({id:'final-loss-essence',seed:983,mode:'pve',context:'tournament',opponentId:10});
  g.winner=1;
  return {coins:rewardMatch(g).coins,cleared:profile.cleared.length};
 })()`);
 assert.deepEqual(r,{coins:25,cleared:0});
});
