/* Essence Combat deterministic safety regression.
 * Node 20+: node tests/essence-combat.test.cjs
 * Uses the shipped gameplay scripts in a sandbox, without browser storage.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const files=['game.js','expansion.js','evolution.js','learning.js','essence-combat.js'];
function start(){
 const nodes=new Map();
 const el=()=>({style:{},dataset:{},innerHTML:'',textContent:'',value:'',disabled:false,hidden:false,
  classList:{add(){},remove(){},toggle(){},contains(){return false}},onclick:null,
  querySelector(){return null},querySelectorAll(){return []},insertAdjacentHTML(){},
  addEventListener(){},append(){},appendChild(){},setAttribute(){}});
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},
  createElement:el,querySelector(){return null},querySelectorAll(){return []},addEventListener(){},body:el()};
 const storage={getItem(){return null},setItem(){},removeItem(){}};
 const window={localStorage:storage,location:{hostname:'isolated.test'},matchMedia(){return {matches:true}},addEventListener(){}};
 const context=vm.createContext({window,document,navigator:{},localStorage:storage,
  setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},
  console,Date,Math,JSON,Set,Map,Array,Number,Object,String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN});
 const source=files.map(x=>fs.readFileSync(path.join(__dirname,'../assets',x),'utf8')).join('\n;\n');
 vm.runInContext(source+'\n;globalThis.__essenceTest={createGame,simulateGame,profile,CARDS,RPG_DEFAULT_DECK,RPG_START_FUSIONS,ESSENCE_MONSTER_IDS,advanceTurn,attack,damagePlayer,randomInt};',context,{timeout:10000});
 return {g:context.__essenceTest,w:window};
}
test('Old save defaults do not grant an exclusive monster or perk',()=>{
 const {g}=start();
 assert.equal(g.profile.essence.chosen,null);
 assert.equal(g.profile.essence.school,null);
 assert.equal(g.profile.essence.intro,0);
});
test('Card IDs for all three mutually exclusive Essence Monsters remain stable',()=>{
 const {g}=start();
 const ids=Object.values(g.ESSENCE_MONSTER_IDS);
 assert.equal(new Set(ids).size,3);
 ids.forEach(id=>assert.equal(g.CARDS[id].essenceMonster,true));
});
test('Complete real-rules duels retain finite LP, DEF and no throws',()=>{
 const {g}=start();
 for(let n=0;n<80;n++){
  const duel=g.createGame({id:'essence-regression-'+n,seed:910001+n*199,
   mode:'pve',context:'free',opponentId:1+n%10,
   deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
  assert.equal(duel.essenceRules,true);
  assert.doesNotThrow(()=>g.simulateGame(duel));
  assert.ok(duel.winner===0||duel.winner===1);
  for(const p of duel.players){
   assert.ok(p.lp>=0&&p.lp<=duel.maxLP);
   for(const card of [...p.field.filter(Boolean),...p.hand]){
    assert.ok(!card.card||card.card.atk>=0&&card.card.def>=0);
   }
  }
 }
});
test('Only DEF-preferred Seelenzehrer has healing trigger',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../assets/essence-combat.js'),'utf8');
 assert.match(code,/rank>=3&&store\.drainPreference===2&&drainedDef/);
 assert.doesNotMatch(code,/if\(tier>=3&&rank>=3&&drainedDef\)/);
});
test('Last Bastion attack immunity cannot repeatedly counterstrike',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../assets/essence-combat.js'),'utf8');
 assert.match(code,/const immuneBefore=s\.guardLeft>0/);
 assert.match(code,/if\(isDefender\(d\)&&!immuneBefore\)/);
});

test('Essence companion never drains currency banked before the duel',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../assets/essence-progression.js'),'utf8');
 assert.match(code,/Math\.min\(Math\.max\(0,result\.coins\),profile\.coins,Math\.max\(0,feed\)\)/);
 assert.match(code,/result\.essenceFood=actual;result\.coins-=actual/);
});
