/* New monster families, one-time specialized fusions and workshop regression.
 * Run: node --test tests/monster-roles-forge.test.cjs
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const filenames=['game.js','expansion.js','evolution.js','learning.js','essence-combat.js','arcane-role-fusions.js','arcane-monster-forge.js'];
function setup(){
 const el=()=>({style:{},dataset:{},innerHTML:'',value:'',disabled:false,hidden:false,
  classList:{contains(){return true},add(){},remove(){},toggle(){}},
  append(){},appendChild(){},addEventListener(){},removeEventListener(){},
  querySelector(){return null},querySelectorAll(){return []},insertAdjacentHTML(){},
  setAttribute(){},getAttribute(){return null}});
 const nodes=new Map(),document={
  getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},
  createElement:el,querySelector(){return null},querySelectorAll(){return []},
  addEventListener(){},body:el()
 };
 const memory=new Map(),localStorage={
  getItem(id){return memory.get(id)??null},
  setItem(id,val){memory.set(id,String(val))},removeItem(id){memory.delete(id)}
 };
 const window={localStorage,location:{protocol:'https:',hostname:'isolated.test'},
  matchMedia(){return {matches:true}},addEventListener(){}};
 const scripts=filenames.map(f=>fs.readFileSync(path.join(__dirname,'../assets',f),'utf8')).join('\n;\n');
 const vmContext=vm.createContext({window,document,localStorage,navigator:{},
  setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},
  console,Date,Math,JSON,Map,Set,Array,Number,Object,RegExp,String,Error,TypeError,
  Uint32Array,Boolean,Infinity,NaN});
 vm.runInContext(scripts+'\n;globalThis.testGame={profile,CARDS,ARCANE_STAGE_IDS,RPG_BASE_CARDS,RPG_DEFAULT_DECK,RPG_START_FUSIONS,createGame,simulateGame,fusedInstance,newInstance,fusionOptions};',vmContext,{timeout:10000});
 return {g:vmContext.testGame,forge:window.ArcaneMonsterForge,role:window.ArcaneRoleFusion};
}
test('Every workshop family has unique level IDs including level 12',()=>{
 const {g}=setup();
 const families=[...new Set([...g.ARCANE_STAGE_IDS.keys()].map(k=>k.split(':')[0]))];
 assert.ok(families.length>=22);
 const ids=[...g.ARCANE_STAGE_IDS.values()];
 assert.equal(new Set(ids).size,ids.length);
 for(const root of families)for(let lv=1;lv<=12;lv++)
  assert.ok(Number.isInteger(g.ARCANE_STAGE_IDS.get(root+':'+lv)),root+' level '+lv);
});
test('Tournament limits prevent early Lv7 crafting, then allow reversible conversion',()=>{
 const {g,forge}=setup(),root=0,id1=forge.stage(root,1),id7=forge.stage(root,7);
 assert.equal(forge.levelCap(),4);
 assert.equal(forge.transact('combine',root,7,'1+1+1+1+1+1+1').ok,false);
 g.profile.cleared=[1,2,3,4,5];g.profile.inventory[id1]=12;
 assert.equal(forge.levelCap(),8);
 const before=g.profile.inventory[id1];
 assert.equal(forge.transact('combine',root,7,'1+1+1+1+1+1+1').ok,true);
 assert.equal(g.profile.inventory[id1],before-7);
 assert.equal(g.profile.inventory[id7],1);
 assert.equal(forge.transact('split',root,7,'3+3+1').ok,true);
 assert.equal(g.profile.inventory[id7],0);
 assert.equal(g.profile.inventory[forge.stage(root,3)],2);
 assert.equal(g.profile.inventory[id1],before-6);
});
test('Workshop refuses to consume cards required by active decks',()=>{
 const {g,forge}=setup(),root=0,one=forge.stage(root,1);
 g.profile.cleared=[1,2,3,4,5];
 g.profile.inventory[one]=g.profile.activeDeck.filter(id=>id===one).length;
 assert.equal(forge.transact('combine',root,2,'1+1').ok,false);
});
test('Fusion specialization needs a three-material majority gap',()=>{
 const {role}=setup();
 assert.equal(role.inheritance([{id:1,roleOverride:'guardian'},{id:2,roleOverride:'guardian'},{id:3,roleOverride:'guardian'}]),'guardian');
 assert.equal(role.inheritance([{id:1,roleOverride:'guardian'},{id:2,roleOverride:'guardian'},{id:3,roleOverride:'predator'}]),null);
 assert.equal(role.inheritance([{id:1,roleOverride:'predator'},{id:2,roleOverride:'predator'},{id:3,roleOverride:'predator'}]),'predator');
});
test('Soul awakening probability is below 75 percent or capped',()=>{
 const {role,g}=setup();
 const cards=g.RPG_BASE_CARDS.filter(c=>c.level>=1&&!c.fusionOnly).slice(0,5).map(c=>({id:c.id,card:{level:12}}));
 assert.ok(role.soulOdds(cards)<=.75);
 assert.ok(role.soulOdds(cards)>=.20);
});
test('Real game applies defender fusion to INSTANCE, not to card template',()=>{
 const {g}=setup();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:1,seed:40991,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 const cards=[0,1,13].map(id=>g.newInstance(duel,id,0));
 assert.ok(g.fusionOptions(duel,cards.map(c=>c.card.level)).length);
 const result=g.fusedInstance(duel,cards,cards.map(c=>c.card.level));
 assert.ok(result);
 assert.ok(['guardian','soul'].includes(result.roleOverride));
 assert.equal(g.CARDS[result.id].roleOverride,undefined);
 assert.ok(result.card.def>0&&result.card.atk>0);
});
test('Actual game runs 40 seeded duels with new role rules and no deadlocks',()=>{
 const {g}=setup();
 for(let i=0;i<40;i++){
  const duel=g.createGame({mode:'pve',context:'free',opponentId:1+(i%10),
   seed:81913+i*31,deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
  assert.doesNotThrow(()=>g.simulateGame(duel));
  assert.ok(duel.winner===0||duel.winner===1);
  for(const p of duel.players)assert.ok(p.lp>=0&&p.lp<=duel.maxLP);
 }
});
