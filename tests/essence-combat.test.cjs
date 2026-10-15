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
 vm.runInContext(source+'\n;globalThis.__essenceTest={createGame,simulateGame,profile,CARDS,RPG_DEFAULT_DECK,RPG_START_FUSIONS,ESSENCE_MONSTER_IDS,advanceTurn,attack,newInstance,damagePlayer,randomInt,statLayer:window.ArcaneEssenceCombat.statLayer,runTrial:(key,school,stage,seed)=>{let created=null;const old=startDuel;startDuel=function(mode,id,context,difficulty){created=createGame({mode,opponentId:id,context,difficulty,seed});};try{if(!window.ArcaneEssenceCombat.beginTrial(key,school,stage)||!created)throw Error(\"Could not start Essence trial\");return simulateGame(created,school===\"defense\"?\"guardian\":\"balanced\",\"balanced\");}finally{startDuel=old;}}};',context,{timeout:10000});
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

test('Seelenzehrer absorbs real enemy values and records separate soul DEF',()=>{
 const {g}=start();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:1,seed:4310,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 duel.players[0].field.fill(null);duel.players[1].field.fill(null);
 const soulId=g.CARDS.find(c=>c.role==='soul'&&!c.fusionOnly).id;
 const soul=g.newInstance(duel,soulId,0);
 soul.mode='def';soul.summonedTurn=0;duel.players[0].field[0]=soul;
 const opponent=g.newInstance(duel,g.CARDS.find(c=>c.role==='predator'&&!c.fusionOnly).id,1);
 opponent.summonedTurn=0;duel.players[1].field[0]=opponent;
 duel.turn=2;duel.active=1;
 const enemyBefore=[opponent.card.atk,opponent.card.def],defBefore=soul.card.def;
 g.advanceTurn(duel);
 const soulPower=g.statLayer(soul).soul;
 assert.ok(soulPower>0,'Energy should grow if enemy had nonzero stats');
 assert.ok(opponent.card.atk<enemyBefore[0]);
 assert.ok(opponent.card.def<enemyBefore[1]);
 assert.equal(soul.card.def,defBefore,'Absorbed DEF must stay separate from base DEF');
});

test('Seelenenergie must not permanently inflate base DEF during end-turn decay',()=>{
 const {g}=start();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:1,seed:4310,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 duel.players[0].field.fill(null);duel.players[1].field.fill(null);
 const soul=g.newInstance(duel,g.CARDS.find(c=>c.role==='soul'&&!c.fusionOnly).id,0);
 soul.mode='def';soul.summonedTurn=0;duel.players[0].field[0]=soul;
 const energy=g.statLayer(soul);
 energy.soul=200;energy.condensed=90;energy.condenseLeft=3;
 energy.condenseSlice=30;energy.cooldown=3;
 duel.turn=3;duel.active=0;duel.players[1].shield=0;
 const baseBefore=soul.card.def,lpBefore=duel.players[1].lp;
 g.advanceTurn(duel);
 assert.ok(soul.card.def<baseBefore,'Base DEF must decay, never increase from stored bonus DEF');
 assert.equal(energy.condensed,60);
 assert.equal(energy.soul,110);
 assert.equal(lpBefore-duel.players[1].lp,90,'Only unstable soul decay creates burn');
});

test('All specialization lessons and five-stage retraining paths run on loan decks',()=>{
 const {g}=start();
 for(const school of ['predator','fusion','defense']){
  for(let stage=0;stage<5;stage++){
   for(let seed=0;seed<4;seed++){
    const duel=g.runTrial('switch-'+school+'-'+stage,school,stage,
     240000+stage*101+seed*17);
    assert.ok(duel.winner===0||duel.winner===1);
    assert.equal(duel.essenceTrial,'switch-'+school+'-'+stage);
    assert.ok(duel.turn>0);
   }
  }
 }
});
