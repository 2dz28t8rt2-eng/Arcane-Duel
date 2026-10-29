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
 const saved=new Map();const storage={getItem(k){return saved.get(k)??null},setItem(k,v){saved.set(k,v)},removeItem(k){saved.delete(k)}};
 const window={localStorage:storage,location:{hostname:'isolated.test'},matchMedia(){return {matches:true}},addEventListener(){}};
 const context=vm.createContext({window,document,navigator:{},localStorage:storage,
  setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},
  console,Date,Math,JSON,Set,Map,Array,Number,Object,String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN});
 const source=files.map(x=>fs.readFileSync(path.join(__dirname,'../assets',x),'utf8')).join('\n;\n');
 vm.runInContext(source+'\n;globalThis.__essenceTest={createGame,simulateGame,profile,CARDS,RPG_DEFAULT_DECK,RPG_START_FUSIONS,ESSENCE_MONSTER_IDS,advanceTurn,attack,newInstance,damagePlayer,randomInt,validateProfile,validateDuelSnapshot,statLayer:window.ArcaneEssenceCombat.statLayer,runTrial:(key,school,stage,seed)=>{let created=null;const old=startDuel;startDuel=function(mode,id,context,difficulty){created=createGame({mode,opponentId:id,context,difficulty,seed});};try{if(!window.ArcaneEssenceCombat.beginTrial(key,school,stage)||!created)throw Error(\"Could not start Essence trial\");return simulateGame(created,school===\"defense\"?\"guardian\":\"balanced\",\"balanced\");}finally{startDuel=old;}}};',context,{timeout:10000});
 return {g:context.__essenceTest,w:window,ctx:context};
}
 
const code=fs.readFileSync(path.join(__dirname,'../assets/essence-combat.js'),'utf8');
function duel(role,def,hpAtk=1000,enemyAtk=100,invulnerable=false){
 const {g}=start();
 const battle=g.createGame({id:'solo-survivor-counter',mode:'pve',context:'free',opponentId:1,seed:10317,
   deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 const defenderId=g.CARDS.find(c=>c.role===role&&!c.fusionOnly&&c.level<=3).id;
 const enemyId=g.CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&c.level<=3).id;
 const d=g.newInstance(battle,defenderId,0),a=g.newInstance(battle,enemyId,1);
 d.mode='def';d.card.def=def;d.card.atk=hpAtk;d.summonedTurn=0;
 a.mode='atk';a.card.atk=enemyAtk;a.summonedTurn=0;a.attacked=false;
 battle.players[0].field.fill(null);battle.players[1].field.fill(null);
 battle.players[0].field[0]=d;battle.players[1].field[0]=a;
 battle.players[1].shield=0;battle.active=1;battle.turn=10;battle.essenceGuardSpent=true;
 if(invulnerable)g.statLayer(d).guardLeft=2;
 const originalLp=battle.players[1].lp;
 const result=g.attack(battle,0,0);
 return {hit:!!result,lifeDamage:originalLp-battle.players[1].lp,
   defenderSurvived:battle.players[0].field[0]===d,
   defenderDef:d.card?.def??null,resultDestroyed:result?.destroyed?.length??0};
}
test('Guardian and Soul survive: counter is 35 percent of effective ATK',()=>{
 for(const role of ['guardian','soul']){
  const x=duel(role,2500,1000,100);
  assert.equal(x.hit,true,role+' attack must be legal');
  assert.equal(x.defenderSurvived,true,role+' should survive');
  assert.equal(x.lifeDamage,350,role+' surviving defender counters');
 }
});
test('Guardian and Soul destroyed: no retaliatory LP damage',()=>{
 for(const role of ['guardian','soul']){
  const x=duel(role,20,1000,1200);
  assert.equal(x.hit,true,role+' attack must be legal');
  assert.equal(x.defenderSurvived,false,role+' should be destroyed');
  assert.equal(x.resultDestroyed,1,role+' should leave the field');
  assert.equal(x.lifeDamage,0,role+' defeated defender must not counter');
 }
});
test('Last Bastion immunity still suppresses all counters',()=>{
 const x=duel('guardian',2500,1000,100,true);
 assert.equal(x.hit,true);
 assert.equal(x.defenderSurvived,true);
 assert.equal(x.lifeDamage,0);
});
test('AI planner estimates 35% survivor-only damage',()=>{
 assert.match(code,/const canCounter=effectiveDef>atk \|\| shield\.guardLeft>0;/);
 assert.match(code,/const counter=isDefender\(d\.c\)&&canCounter\?Math\.floor\(Math\.max\(0,dataOf\(d\.c\)\.atk\)\*\.35\):0;/);
 assert.match(code,/if\(isDefender\(d\)&&!immuneBefore&&!endDefense&&q\.field\[di\]===d\)/);
 assert.match(code,/const counter= Math\.floor\(Math\.max\(0,dataOf\(d\)\.atk\)\*\.35\);/);
});
