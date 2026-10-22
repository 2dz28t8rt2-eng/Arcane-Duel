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
 assert.equal(energy.soul,136);
 assert.equal(lpBefore-duel.players[1].lp,22,'Unstable energy loses 32%, but only 35% of that causes opponent LP burn');
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

test('Snapshot serializes all three DEF layers and active defensive cooldowns',()=>{
 const {g}=start();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:1,seed:10011,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 const c=g.newInstance(duel,g.CARDS.find(x=>x.role==='soul'&&!x.fusionOnly).id,0);
 c.mode='def';duel.players[0].field[0]=c;
 Object.assign(g.statLayer(c),{soul:200,condensed:90,cooldown:3,condenseLeft:3,
  condenseSlice:30,guardLeft:2,guardGrantedTurn:0});
 const before=JSON.stringify(g.statLayer(c));
 const resumed=g.validateDuelSnapshot(JSON.parse(JSON.stringify(duel)));
 assert.equal(JSON.stringify(resumed.players[0].field[0].essenceCombat),before);
 assert.equal(resumed.essenceRules,true);
});
test('PvP still creates legacy-rules matches without Essence powers',()=>{
 const {g}=start();
 const duel=g.createGame({mode:'pvp',seed:10013});
 assert.ok(duel.essenceRules!==true);
});

test('Reject any saved profile with two different exclusive Essence cards',()=>{
 const {g}=start();
 const id=g.ESSENCE_MONSTER_IDS.defense;
 const raw=JSON.parse(JSON.stringify(g.profile));
 raw.unlocked.push(id);raw.inventory[id]=1;
 raw.essence={intro:3,chosen:id,school:'defense',loreRead:true,
  switchTarget:null,switchStep:0,nourished:150,spent:0,rank:0};
 assert.equal(g.validateProfile(raw).essence.chosen,id);
 const other=g.ESSENCE_MONSTER_IDS.fusion;
 raw.unlocked.push(other);raw.inventory[other]=1;
 assert.throws(()=>g.validateProfile(raw),/Es darf nur ein Essenzmonster geben/);
});

test('Seelenbrand applies bounded direct LP pressure with five unopposed soul eaters',()=>{
 const {g}=start();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:7,seed:944411,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 duel.players[0].field.fill(null);duel.players[1].field.fill(null);
 const soul=g.CARDS.find(c=>c.role==='soul'&&!c.fusionOnly&&c.level===6);
 const prey=g.CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&c.level===6);
 assert.ok(soul&&prey);
 for(let i=0;i<5;i++){
  const eater=g.newInstance(duel,soul.id,0);eater.mode='def';eater.summonedTurn=0;
  duel.players[0].field[i]=eater;
  duel.players[1].field[i]=g.newInstance(duel,prey.id,1);
 }
 duel.players[1].shield=0;duel.turn=2;duel.active=1;
 const before=duel.players[1].lp,ownBefore=duel.players[0].lp;
 g.advanceTurn(duel);
 const damage=before-duel.players[1].lp;
 assert.ok(damage>0,'Soul Eaters can burn LP even without enemy attacks');
 assert.ok(damage<=5*(60+6*60),'LP burn remains bounded per soul and its level');
 assert.equal(duel.players[0].lp,ownBefore,'passive soul harvest must not drain own LP');
 assert.ok(duel.players[0].field.every(c=>c?.essenceCombat?.soul>=0));
});

test('Low-rank Soul Eater can deliberately discharge stored energy once per turn',()=>{
 const {g,ctx}=start();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:4,seed:930277,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 duel.players[0].field.fill(null);duel.players[1].field.fill(null);
 const c=g.CARDS.find(x=>x.role==='soul'&&!x.fusionOnly&&x.level<=3);
 const eater=g.newInstance(duel,c.id,0);eater.mode='def';duel.players[0].field[0]=eater;
 g.statLayer(eater).soul=200;duel.active=0;duel.turn=4;duel.players[1].shield=0;
 const before=duel.players[1].lp;
 ctx.__testSoulDuel=duel;
 // This UI-action test needs an open duel overlay state; the generic VM
 // element stub defaults all classList.contains calls to false.
 ctx.document.getElementById('overlay').classList.contains=key=>key==='hidden';
 const first=vm.runInContext('game=__testSoulDuel;uiMode="duel";window.ArcaneEssenceCombat.discharge(0)',ctx);
 assert.equal(first,true);
 assert.equal(before-duel.players[1].lp,260);
 assert.equal(g.statLayer(eater).soul,0);
 assert.equal(vm.runInContext('window.ArcaneEssenceCombat.discharge(0)',ctx),false,'one per turn');
});


test('Guardians absorb 35 percent of PvE DEF-HP damage but do not become invulnerable',()=>{
 const {g}=start();
 const duel=g.createGame({id:'guardian-mitigation',mode:'pve',context:'free',opponentId:1,
  seed:98013,deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 duel.players[0].field.fill(null);duel.players[1].field.fill(null);
 const id=g.CARDS.find(c=>c.role==='guardian'&&!c.fusionOnly).id;
 const attackerId=g.CARDS.find(c=>c.role==='predator'&&!c.fusionOnly).id;
 const guard=g.newInstance(duel,id,0),pred=g.newInstance(duel,attackerId,1);
 guard.mode='def';guard.card.def=1000;guard.card.atk=120;
 pred.mode='atk';pred.card.atk=800;
 duel.players[0].field[0]=guard;duel.players[1].field[0]=pred;duel.active=1;duel.turn=4;
 const out=g.attack(duel,0,0);
 assert.ok(out);
 assert.equal(guard.card.def,1000-Math.floor(Math.floor(800*1.02)*.75),
  'Single Predator gets +2% swarm damage and pierces 10 percentage points of Guardian armor (25% remains)');
 assert.equal(duel.players[0].field[0],guard,'Guardian survives first predator attack');
 assert.ok(duel.players[1].shield<200||duel.players[1].lp<duel.maxLP,'Counterattack still deals 60 damage to shield or LP');
});
test('Rune Fusion trial loans diverse fusion levels without unlocking inventory',()=>{
 const {g}=start();
 const before=JSON.stringify(g.profile.inventory);
 const duel=g.runTrial('switch-fusion-0','fusion',0,145291);
 const deck=duel.players[0].fusionDeck;
 assert.equal(deck.length,15);
 assert.ok(new Set(deck.map(id=>g.CARDS[id].level)).size>=5,'Distinct fusion rungs available');
 assert.ok(deck.some(id=>g.CARDS[id].level>=6),'Advanced fusion at hand');
 assert.equal(JSON.stringify(g.profile.inventory),before,'Loan cards do not become owned');
});
test('First essence school trials explicitly award a character pack, not on repeat',()=>{
 const text=fs.readFileSync(path.join(__dirname,'../assets/essence-progression.js'),'utf8');
 assert.match(text,/g\.essenceTrial\.startsWith\('intro-'\)/);
 assert.match(text,/result\.essenceTrialPack=true/);
 assert.match(text,/completedStage>=0/);
});
