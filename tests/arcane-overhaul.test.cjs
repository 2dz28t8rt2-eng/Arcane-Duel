/* Arcane Duel 3.1 – regression tests of staged normal cards, workshop and material-role fusion.
 * Run with Node 20+: node --test tests/arcane-overhaul.test.cjs
 * Production code is evaluated in an isolated empty virtual DOM; no real saves touched.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const scripts=['game.js','expansion.js','evolution.js','learning.js','essence-combat.js',
 'arcane-ui-update.js','arcane-role-fusions.js','arcane-monster-forge.js'];
function start(){
 const nodes=new Map();
 const el=()=>({style:{},dataset:{},innerHTML:'',textContent:'',value:'',disabled:false,hidden:false,
  classList:{add(){},remove(){},toggle(){},contains(){return false}},
  append(){},appendChild(){},remove(){},addEventListener(){},insertAdjacentHTML(){},
  setAttribute(){},querySelector(){return null},querySelectorAll(){return []}});
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},
  createElement:el,querySelector(){return null},querySelectorAll(){return []},
  addEventListener(){},body:el()};
 const saved=new Map();
 const storage={getItem(k){return saved.get(k)??null},setItem(k,v){saved.set(k,v)},removeItem(k){saved.delete(k)}};
 const window={localStorage:storage,location:{hostname:'isolated.test',protocol:'https:'},
  matchMedia(){return {matches:true}},addEventListener(){},innerWidth:1400};
 const context=vm.createContext({window,document,navigator:{},localStorage:storage,
  setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},
  console,Date,Math,JSON,Set,Map,Array,Number,Object,String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN});
 const source=scripts.map((p,i)=>(i===5?"uiMode='duel';\n":'')+
  fs.readFileSync(path.join(__dirname,'../assets',p),'utf8')).join('\n;\n');
 vm.runInContext(source+'\n;globalThis.__qa={createGame,simulateGame,CARDS,RPG_BASE_CARDS,RPG_START_FUSIONS,'
 +'RPG_DEFAULT_DECK,ARCANE_STAGE_IDS,ARCANE_WORKSHOP_IDS,UPDATE_B_SET,profile,'
 +'fusedInstance,newInstance,fusionOptions,validateProfile,advanceTurn,'
 +'forge:window.ArcaneMonsterForge,roles:window.ArcaneRoleFusion};',context,{timeout:12000});
 return context.__qa;
}
const tournament=(p,tier)=>{p.cleared=Array.from({length:tier},(_,i)=>i+1);};
test('32 ordinary families have one stable accessible stage at levels 1–10',()=>{
 const g=start();
 const roots=[...new Set(g.ARCANE_WORKSHOP_IDS.map(id=>g.CARDS[id].lineRoot))];
 assert.equal(roots.length,32);
 for(const root of roots)for(let lv=1;lv<=10;lv++){
  const id=g.ARCANE_STAGE_IDS.get(root+':'+lv);
  assert.ok(Number.isInteger(id),'missing stage '+root+'/'+lv);
  assert.equal(g.CARDS[id].level,lv);
  assert.ok(!g.CARDS[id].fusionOnly&&!g.CARDS[id].essenceMonster);
  assert.ok(g.UPDATE_B_SET.has(id));
 }
});
test('level 11–12 remain unavailable until future post-tournament content',()=>{
 const g=start();tournament(g.profile,10);
 assert.equal(g.forge.levelCap(),10);
 const root=0;
 assert.equal(g.forge.stage(root,11),undefined);
 assert.equal(g.forge.stage(root,12),undefined);
 assert.ok(g.CARDS.filter(c=>[11,12].includes(c.level)).every(c=>c.retired&&!g.UPDATE_B_SET.has(c.id)));
});
test('forge combines and decomposes exactly, preserving level points and profile validation',()=>{
 const g=start();tournament(g.profile,7);
 const a=g.forge.stage(0,1),b=g.forge.stage(0,7),c=g.forge.stage(0,3);
 g.profile.inventory[a]=(g.profile.inventory[a]||0)+7;
 const initial=(g.profile.inventory[a]||0)+7*(g.profile.inventory[b]||0)+3*(g.profile.inventory[c]||0);
 const combined=g.forge.transact('combine',0,7,'1+1+1+1+1+1+1');
 assert.equal(combined.ok,true,combined.message);
 const split=g.forge.transact('split',0,7,'3+3+1');
 assert.equal(split.ok,true,split.message);
 const actual=(g.profile.inventory[a]||0)+7*(g.profile.inventory[b]||0)+3*(g.profile.inventory[c]||0);
 assert.equal(actual,initial);
 assert.ok(g.validateProfile(JSON.parse(JSON.stringify(g.profile))));
});
test('forge refuses illegal recipes, locked levels and assigned deck copies',()=>{
 const g=start();
 const malformed=g.forge.transact('split',0,7,'3+3+3');assert.equal(malformed.ok,false);
 const locked=g.forge.transact('combine',0,12,'1+1+1+1+1+1+1+1+1+1+1+1');assert.equal(locked.ok,false);
 const root=0,l1=g.forge.stage(root,1),before=g.profile.inventory[l1];
 const reserved=g.forge.transact('combine',root,2,'1+1');
 assert.equal(reserved.ok,false);
 assert.equal(g.profile.inventory[l1],before);
});
test('role inheritance preserves the majority even with two same-role materials',()=>{
 const g=start();
 const mock=role=>({id:g.CARDS.find(c=>!c.retired&&c.role===role).id});
 const D=()=>mock('guardian'),P=()=>mock('predator'),N=()=>mock('combatant');
 assert.equal(g.roles.inheritance([D(),D(),D()]),'guardian');
 assert.equal(g.roles.inheritance([D(),D(),D(),P()]),'guardian');
 assert.equal(g.roles.inheritance([D(),D(),D(),D(),P()]),'guardian');
 assert.equal(g.roles.inheritance([P(),P(),P(),N(),N()]),'predator');
 assert.equal(g.roles.inheritance([D(),D(),P(),P()]),null);
});
test('real seeded PvE fusion creates inherited stats and bounded soul awakening',()=>{
 const g=start();
 for(const role of ['guardian','predator']){
  const input=g.RPG_BASE_CARDS.find(c=>!c.retired&&!c.essenceMonster&&c.level===2&&c.role===role);
  assert.ok(input);
  const duel=g.createGame({mode:'pve',opponentId:1,context:'free',seed:55721,
   deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
  const materials=Array.from({length:3},()=>g.newInstance(duel,input.id,0));
  const levels=materials.map(c=>c.card.level);
  assert.ok(g.fusionOptions(duel,levels).length);
  const fusion=g.fusedInstance(duel,materials,levels);
  assert.ok(fusion?.fusion);
  if(role==='predator'){assert.equal(fusion.roleOverride,'predator');assert.ok(fusion.card.atk>fusion.card.def);}
  else{assert.ok(['guardian','soul'].includes(fusion.roleOverride));assert.ok(fusion.card.def>fusion.card.atk);
   assert.ok(fusion.soulOdds>=.20&&fusion.soulOdds<=.75);}
 }
});
test('a PvE battle still completes with the larger 32-family roster',()=>{
 const g=start();
 for(let i=0;i<20;i++){
  const duel=g.createGame({mode:'pve',opponentId:1+i%10,context:'free',
   seed:70441+i*811,deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
  g.simulateGame(duel);
  assert.ok(duel.winner===0||duel.winner===1);
  for(const p of duel.players)assert.ok(p.lp>=0&&p.lp<=duel.maxLP);
 }
});
