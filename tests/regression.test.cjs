'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../assets/game.js'), 'utf8');

function boot() {
  const store = new Map(), nodes = new Map();
  function el(id='') {
    return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},
      classList:{add(){},remove(){},toggle(){},contains(x){return x==='hidden'}},
      append(){},appendChild(){},remove(){},addEventListener(){},setAttribute(){},click(){},
      getBoundingClientRect(){return {left:0,top:0,width:100,height:50}}};
  }
  const document = {body:el('body'),getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id)},
    querySelectorAll(){return []},querySelector(){return null},createElement:el,addEventListener(){}};
  const localStorage = {getItem(k){return store.has(k)?store.get(k):null},setItem(k,v){store.set(k,String(v))}};
  const window = {localStorage,crypto:{getRandomValues(a){a[0]=1337;return a}},AudioContext:null};
  const context = vm.createContext({window,document,console,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},
    Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},navigator:{},performance:{now(){return 1}}});
  vm.runInContext(source,context,{filename:'game.js',timeout:8000});
  return {run:code=>vm.runInContext(code,context,{timeout:12000}),store};
}
const plain = x=>JSON.parse(JSON.stringify(x));

test('Ungültige Fusion verbraucht keine Ressourcen',()=>{
  const x=boot().run("(()=>{const g=createGame({mode:'pve',starter:0,seed:42}),p=g.players[0],uids=p.hand.slice(0,2).map(c=>c.uid);const before=[p.hand.length,p.remainingFusion.length,p.graveyard.length];const ok=prepareHandFusion(g,uids,99999);return {ok,before,after:[p.hand.length,p.remainingFusion.length,p.graveyard.length],pending:g.pending};})()");
  assert.equal(x.ok,false);assert.deepEqual(plain(x.before),plain(x.after));assert.equal(x.pending,null);
});

test('Drei ausgewählte Materialien: eine Fusion und drei Friedhofskarten',()=>{
  const x=boot().run("(()=>{const g=createGame({mode:'pve',starter:0,seed:7}),p=g.players[0],uids=p.hand.slice(0,3).map(c=>c.uid);const ok=prepareHandFusion(g,uids,RPG_START_FUSIONS[0]);return {ok,hand:p.hand.length,grave:p.graveyard.length,fusions:p.remainingFusion.length,pending:g.pending?.kind};})()");
  assert.deepEqual(plain(x),{ok:true,hand:2,grave:3,fusions:2,pending:'fusion'});
});

test('Feldfusion verbraucht eine Kopie und behält Position und Angriffsstatus',()=>{
  const x=boot().run("(()=>{const g=createGame({mode:'pve',starter:0,seed:99}),p=g.players[0],low=RPG_START_FUSIONS[0],high=RPG_START_FUSIONS[1],id=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.level===2).id;p.field[2]=newInstance(g,low,0);p.field[2].fusion=true;p.field[2].attacked=true;p.hand[0]=newInstance(g,id,0);const uid=p.hand[0].uid,before=p.remainingFusion.length;const prepared=prepareNormal(g,uid),out=placePending(g,2,high);return {prepared,placed:!!out,fused:out?.fused,level:dataOf(p.field[2]).level,attacked:p.field[2].attacked,zone0:p.field[0],hand:p.hand.some(c=>c.uid===uid),used:before-p.remainingFusion.length,grave:p.graveyard.length};})()");
  assert.deepEqual(plain(x),{prepared:true,placed:true,fused:true,level:4,attacked:true,zone0:null,hand:false,used:1,grave:2});
});

test('Unmögliche Feldfusion lässt Karte und Feld unverändert',()=>{
  const x=boot().run("(()=>{const g=createGame({mode:'pve',starter:0}),p=g.players[0],id=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.level===2).id;p.field[0]=newInstance(g,RPG_START_FUSIONS[0],0);p.remainingFusion=[];p.hand[0]=newInstance(g,id,0);const uid=p.hand[0].uid;prepareNormal(g,uid);const old=p.field[0].uid,out=placePending(g,0);return {ok:!!out,same:p.field[0].uid===old,pending:g.pending?.kind,hand:p.hand.some(c=>c.uid===uid)};})()");
  assert.deepEqual(plain(x),{ok:false,same:true,pending:'normal',hand:true});
});

test('Erster Zug verhindert Angriffe; Schutzschild reduziert Schaden',()=>{
  const x=boot().run("(()=>{const g=createGame({mode:'pve',starter:0,seed:10}),p=g.players[0],e=g.players[1];p.field[0]=newInstance(g,p.originalDeck[0],0);const denied=attack(g,0,null),before=e.lp,shield=e.shield;advanceTurn(g);advanceTurn(g);const result=attack(g,0,null);return {denied,hit:!!result,delta:before-e.lp,shield,atk:dataOf(p.field[0]).atk,used:p.field[0].attacked};})()");
  assert.equal(x.denied,null);assert.equal(x.hit,true);assert.equal(x.delta,Math.max(0,x.atk+30-x.shield)); // Werte nach dem Angriff enthalten die neue −30-ATK-Ermüdungassert.equal(x.used,true);
});

test('Kreaturenzerfall überspringt Beschwörungszug',()=>{
  const x=boot().run("(()=>{const g=createGame({mode:'pve',starter:0,seed:11}),p=g.players[0],c=newInstance(g,RPG_DEFAULT_DECK[0],0);c.summonedTurn=g.turn;c.decayClass='starter';c.decayTotal=0;p.field[0]=c;const base=dataOf(c).atk;advanceTurn(g);const first=dataOf(c).atk;advanceTurn(g);advanceTurn(g);return {base,first,next:dataOf(c).atk,decay:c.decayTotal};})()");
  assert.equal(x.first,x.base);assert.equal(x.next,Math.max(0,x.base-20));assert.equal(x.decay,20);
});

test('Arena-Zerfall beginnt erst mit Runde 10',()=>{
  assert.deepEqual(plain(boot().run('[arenaDamage(9),arenaDamage(10),arenaDamage(11),arenaDamage(15)]')),[0,200,400,6400]);
});

test('Veralteter Duell-Snapshot wird abgelehnt',()=>{
  assert.throws(()=>boot().run("(()=>{const g=createGame({mode:'pve',starter:0});g.rulesVersion=99;return validateDuelSnapshot(JSON.parse(JSON.stringify(g)));})()"),/ältere Fusionsregeln/);
});

test('Profil-Roundtrip erhält aktuelle Versionsnummer und Deck',()=>{
  const x=boot().run("(()=>{const p=validateProfile(JSON.parse(JSON.stringify(profile)));return [p.progressionVersion,p.activeDeck.length,JSON.stringify(p.activeDeck)===JSON.stringify(profile.activeDeck)];})()");
  assert.deepEqual(plain(x),[3,40,true]);
});

test('100 deterministische Duelle werden ohne Hänger abgeschlossen',()=>{
  const result=boot().run("(()=>{let out=[];for(let seed=1;seed<=100;seed++){const g=createGame({mode:'pve',seed,starter:seed%2});simulateGame(g);out.push([g.winner,g.turn,g.players[0].lp,g.players[1].lp]);}return out;})()");
  assert.equal(result.length,100);
  for(const [w,t,a,b] of result){assert.ok(w===0||w===1);assert.ok(t>0&&t<=32);assert.ok(a>=0&&b>=0);}
});

test('Volles Feld verhindert Fusion ohne gültige zweite Fusionskopie',()=>{
 const x=boot().run("(()=>{const g=createGame({mode:'pve',starter:0,seed:88}),p=g.players[0],id=RPG_DEFAULT_DECK[0];p.field=Array.from({length:5},()=>newInstance(g,id,0));p.remainingFusion=RPG_START_FUSIONS.slice(0,2);p.hand[0]=newInstance(g,id,0);p.hand[1]=newInstance(g,id,0);const ids=p.hand.slice(0,2).map(c=>c.uid),before=[p.hand.length,p.graveyard.length,p.remainingFusion.length],ok=prepareHandFusion(g,ids,RPG_START_FUSIONS[0]);return {ok,before,after:[p.hand.length,p.graveyard.length,p.remainingFusion.length],pending:g.pending};})()");
 assert.equal(x.ok,false);assert.deepEqual(plain(x.before),plain(x.after));assert.equal(x.pending,null);
});

test('Externer Speicherkonflikt überschreibt keine neueren Daten',()=>{
 const app=boot(),updated='{"profile":"external-update"}',key='arcane-duel-rpg-profile-v4-reborn';
 app.store.set(key,updated);
 assert.equal(app.run('saveProfile()'),false);
 assert.equal(app.store.get(key),updated);
 assert.equal(app.run('storageConflict'),true);
});

test('Boostergrößen und Preisstaffel sind konsistent',()=>{
 const r=boot().run("(()=>{const sizes=[1,3,5,10],data=sizes.map(n=>({n,price:boosterPrice(2,n),cards:rollBooster(2,{seed:173},n).length}));return data;})()");
 assert.deepEqual(plain(r.map(x=>x.cards)),[1,3,5,10]);for(let i=0;i<r.length-1;i++)assert.ok(r[i].price/r[i].n>r[i+1].price/r[i+1].n);
});

test('Charakterpacks haben eine niedrigere relative Seltenheit als normale Drops',()=>{
 const r=boot().run("(()=>{const rare=x=>x.filter(y=>CARDS[y.id].fusionOnly||CARDS[y.id].manifestOf).reduce((a,y)=>a+y.weight,0);return [rare(lootWeights(2,'easy',true)),rare(lootWeights(2,'easy',false))];})()");
 assert.ok(r[0]<r[1],JSON.stringify(r));
});

test('Kleine Booster werden im Spielstand akzeptiert',()=>{
 const b=boot();
 for(const count of [1,3,5,10]){
  const r=b.run("(()=>{profile.coins=999999;const n="+count+";if(!buyBooster(n))throw Error('Kauf abgelehnt');const p=validateProfile(JSON.parse(JSON.stringify(profile)));return [p.lastBooster.cards.length,p.coins]})()");
  assert.equal(r[0],count);
  assert.ok(r[1]>=0);
 }
});

test('Kartenspürsinn übernimmt alte Skillränge und verbessert Booster statt Kampfbasiswerte',()=>{
 const b=boot(),r=b.run("(()=>{const p=validateProfile(JSON.parse(JSON.stringify(profile))),old=JSON.parse(JSON.stringify(p));delete old.upgrades.starter;const migrated=validateProfile(old);profile.coins=999999;const stats=[baseStat(CARDS[0],'atk',{id:0,enhancements:{},power:1}),baseStat(CARDS[RPG_DEFAULT_DECK.find(id=>id>=20)]||CARDS[20],'atk',{id:0,enhancements:{},power:1})];const before=cardSenseStarterCut(85);if(!buyUpgrade('starter'))throw Error('upgrade failed');const after=cardSenseStarterCut(85);return {migrated:migrated.upgrades.starter,delta:baseStat(CARDS[0],'atk',{id:0,enhancements:{},power:1})-stats[0],normal:baseStat(CARDS[RPG_DEFAULT_DECK.find(id=>id>=20)]||CARDS[20],'atk',{id:0,enhancements:{},power:1})-stats[1],rank:profile.upgrades.starter,starterChanceBefore:before,starterChanceAfter:after};})()");
 assert.equal(r.migrated,0);assert.equal(r.rank,1);
 assert.equal(r.delta,0);assert.equal(r.normal,0);
 assert.equal(r.starterChanceBefore-r.starterChanceAfter,5);
});

test('Fusionsregel: höchstens eine Handfusion/Beschwörung pro Zug',()=>{
 const b=boot(),r=b.run("(()=>{const g=createGame({mode:'pve',starter:0,seed:15}),p=g.players[0],uids=p.hand.slice(0,2).map(x=>x.uid);const first=prepareHandFusion(g,uids,RPG_START_FUSIONS[0]),placed=placePending(g,0),remaining=p.hand.slice(0,2).map(x=>x.uid);const second=prepareHandFusion(g,remaining,RPG_START_FUSIONS[0]);return [first,!!placed,second,g.summoned];})()");
 assert.deepEqual(plain(r),[true,true,false,true]);
});
