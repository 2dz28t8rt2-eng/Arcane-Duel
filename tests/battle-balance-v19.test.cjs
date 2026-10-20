'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const game=fs.readFileSync(path.resolve(__dirname,'../assets/game.js'),'utf8');
function boot(){
 const nodes=new Map(),values=new Map();
 const el=()=>({innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},click(){},remove(){},append(){}});
 const document={body:el(),getElementById(k){if(!nodes.has(k))nodes.set(k,el());return nodes.get(k)},querySelectorAll(){return []},querySelector(){return null},createElement:el,addEventListener(){}};
 const window={localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))},crypto:{getRandomValues(a){a[0]=7863;return a}}};
 const ctx=vm.createContext({window,document,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 vm.runInContext(game,ctx,{timeout:9000});
 return code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',ctx,{timeout:12000}));
}
test('Level-4-Fusion zerfällt nach Schonfrist konstant um 40 ATK/DEF je eigenem Zug',()=>{
 const run=boot(),x=run('(()=>{const g=createGame({mode:"pve",starter:0,seed:432}),p=g.players[0],c=newInstance(g,RPG_START_FUSIONS[1],0);c.fusion=true;c.decayClass="fusion";c.summonedTurn=g.turn;p.field[0]=c;const base=dataOf(c).atk;advanceTurn(g);const first=dataOf(c).atk;advanceTurn(g);advanceTurn(g);const a=dataOf(c).atk;advanceTurn(g);advanceTurn(g);const b=dataOf(c).atk;advanceTurn(g);advanceTurn(g);const d=dataOf(c).atk;return {base,first,a,b,d,age:c.decayAge,total:c.decayTotal}})()');
 assert.equal(x.first,x.base);
 assert.equal(x.a,x.base-40);
 assert.equal(x.b,x.base-80);
 assert.equal(x.d,x.base-120);
 assert.equal(x.age,3);assert.equal(x.total,120);
});
test('Ein überlebender Angreifer verliert sofort 30 ATK und greift nur einmal an',()=>{
 const run=boot(),x=run('(()=>{const g=createGame({mode:"pve",starter:0,seed:212}),p=g.players[0],c=newInstance(g,p.originalDeck[0],0);p.field[0]=c;advanceTurn(g);advanceTurn(g);const before=dataOf(c).atk,hit=attack(g,0,null),after=dataOf(c).atk,again=attack(g,0,null);return {before,after,hit:!!hit,again,used:c.attacked,fatigue:c.attackFatigue}})()');
 assert.equal(x.hit,true);assert.equal(x.again,null);
 assert.equal(x.after,Math.max(0,x.before-30));
 assert.equal(x.used,true);assert.equal(x.fatigue,30);
});
test('Trainingsroutine kostet 100, 180, 300, 480 Essenz je Stufe',()=>{
 const run=boot(),prices=run('(()=>{const a=[];for(let i=0;i<4;i++){profile.upgrades.tempo=i;a.push(upgradeCost("tempo"));}return a})()');
 assert.deepEqual(prices,[100,180,300,480]);
});
test('Anfänger erhalten mehr XP als fortgeschrittene Spieler im selben Duell',()=>{
 const novice=boot()('(()=>{const g=createGame({mode:"pve",seed:777,starter:0,opponentId:1,context:"tournament"});g.winner=0;return rewardMatch(g).xp})()');
 const advanced=boot()('(()=>{profile.xp=80*12**2;const g=createGame({mode:"pve",seed:777,starter:0,opponentId:1,context:"tournament"});g.winner=0;return rewardMatch(g).xp})()');
 assert.ok(novice>advanced,novice+' should exceed '+advanced);
});
