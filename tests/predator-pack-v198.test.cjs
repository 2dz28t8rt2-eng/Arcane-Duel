'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const preface="profile=freshProfile();profile.guideSeen=true;"+
 "const g=createGame({mode:'pve',context:'free',seed:198701,opponentId:1,starter:0});"+
 "g.turn=12;g.active=0;g.fateUsed=[true,true];"+
 "for(const p of g.players){p.field=[null,null,null,null,null];p.shield=0;p.power=1;p.enhancements={};p.flatBonus=0;p.lp=10000;}"+
 "const pred=CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);"+
 "const guard=CARDS.find(c=>c.role==='guardian'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);";
function run(body){return boot({seed:198701}).run('(()=>{'+preface+body+'})()');}
test('assets loaded, skill reveal attached and chapter 22 updated',()=>{
 const runtime=boot();
 const pack=runtime.scripts.indexOf('assets/predator-pack-v198.js');
 const showdown=runtime.scripts.indexOf('assets/predator-showdown-solo-v199.js');
 assert.ok(pack>=0,'Predator pack script must be included');
 if(showdown>=0)assert.ok(showdown>pack,'The optional newer showdown overlay must load after the Predator pack');
 assert.match(fs.readFileSync('assets/fusion-cinema-ritual.js','utf8'),/ArcanePredatorPack\.cinemaReveal/);
 assert.match(fs.readFileSync('assets/handbook-human-v180.js','utf8'),/22 · Predatoren: Rudelführer/);
});
test('alpha leader updates 2% to 3%, perk to 3.5%, only latest alpha counts',()=>{
 const r=run(
 'const a=newInstance(g,pred.id,0);a.mode="atk";a.card.atk=1000;g.players[0].field[0]=a;'+
 'for(let i=1;i<3;i++){const c=newInstance(g,pred.id,0);c.mode="def";g.players[0].field[i]=c;}'+
 'const base=effectiveAttack(g,a,null);a.fusion=true;a.roleOverride="predator";'+
 'a.predatorLeader={materials:2,powers:[],bornUid:a.uid,createdTurn:g.turn};'+
 'const normal=effectiveAttack(g,a,null);a.predatorLeader.powers=["swarm"];'+
 'const upgraded=effectiveAttack(g,a,null);'+
 'const b=newInstance(g,pred.id,0);b.fusion=true;b.roleOverride="predator";'+
 'b.predatorLeader={materials:5,powers:["mark"],bornUid:b.uid,createdTurn:g.turn};'+
 'g.players[0].field[1]=b;const active=window.ArcanePredatorPack.leader(g,0);'+
 'const retired=!a.predatorLeader;g.players[0].field[1]=null;'+
 'return {base,normal,upgraded,latest:active?.uid,b:b.uid,retired,'+
 'reappears:!!window.ArcanePredatorPack.leader(g,0)};');
 assert.equal(r.base,1060);assert.equal(r.normal,1090);assert.equal(r.upgraded,1105);
 assert.equal(r.latest,r.b);assert.equal(r.retired,true);assert.equal(r.reappears,false);
});
test('mark distinct follow-up attacks +5%, +10%, capped, clear when turn changes',()=>{
 const r=run(
 'const t=newInstance(g,guard.id,1);t.mode="def";t.card.def=6000;t.card.atk=0;g.players[1].field[0]=t;'+
 'for(let i=0;i<4;i++){const c=newInstance(g,pred.id,0);c.mode="atk";c.card.atk=500;g.players[0].field[i]=c;}'+
 'const damages=[];for(let i=0;i<4;i++){damages.push(effectiveAttack(g,g.players[0].field[i],t));'+
 'if(!attack(g,i,0))throw Error("Illegal attack");}'+
 'const marked=g.predatorPursuit?.attackers.length||0;advanceTurn(g);'+
 'return {damages,marked,cleared:!g.predatorPursuit};');
 assert.deepEqual(r.damages,[540,567,594,594]);assert.equal(r.marked,4);assert.equal(r.cleared,true);
});
test('3-own-turn weak token: level match, attacks, no fusion or inventory',()=>{
 const r=run(
 'const a=newInstance(g,pred.id,0);a.fusion=true;a.roleOverride="predator";a.card.level=5;'+
 'a.predatorLeader={materials:4,powers:["mark","token"],bornUid:a.uid,createdTurn:g.turn,ownTurns:0};'+
 'g.players[0].field[0]=a;for(let i=0;i<6;i++)advanceTurn(g);'+
 'const t=g.players[0].field.find(x=>x?.predatorToken);if(!t)throw Error("No token");'+
 'return {lv:t.card.level,atk:t.card.atk,baseline:CARDS[t.id].atk,role:window.ArcaneEssenceCombat.roleOf(t),'+
 'canAttack:canAttack(g,t),choices:fusionOptions(g,[5,5],[t,a]).length,'+
 'fusion:fusedInstance(g,[t,a],[5,5])===null,summoned:g.summoned};');
 assert.equal(r.lv,5);assert.ok(r.atk<r.baseline);assert.equal(r.role,'predator');
 assert.equal(r.choices,0);assert.equal(r.fusion,true);assert.equal(r.summoned,false);
});
test('real 2-5-material Predator fusion has the requested number of unique perks',()=>{
 for(const count of [2,3,4,5]){
  const r=run('const mats=Array.from({length:'+count+'},()=>newInstance(g,pred.id,0));'+
   'const levels=mats.map(c=>dataOf(c).level),choices=fusionOptions(g,levels,mats);'+
   'if(!choices.length)throw Error("No valid fusion");g.fusionChoice=choices[0].id;'+
   'const made=fusedInstance(g,mats,levels);'+
   'return {role:made?.roleOverride,pack:made?.predatorLeader};');
  assert.equal(r.role,'predator');assert.equal(r.pack?.materials,count);
  assert.equal(r.pack.powers.length,count===2?0:count-2);
  assert.equal(new Set(r.pack.powers).size,r.pack.powers.length);
 }
});
test('PvP and symmetric AI research never instantiate the leader feature',()=>{
 const b=boot({seed:198701});const r=b.run('(()=>{'+
  'return ["pvp","research"].map(mode=>{'+
  'profile=freshProfile();const options={mode:mode==="pvp"?"pvp":"pve",seed:9917};'+
  'if(mode==="research")options.strategicTraining={enabled:true,symmetricSides:true,noAttackTurns:0,disableArenaLPDecay:true};'+
  'const g=createGame(options);g.active=0;const id=CARDS.find(c=>c.role==="predator"&&!c.fusionOnly&&!c.essenceMonster).id;'+
  'const c=newInstance(g,id,0);c.fusion=true;c.roleOverride="predator";'+
  'c.predatorLeader={materials:5,powers:["swarm","mark","token"],bornUid:c.uid};'+
  'g.players[0].field=[c,null,null,null,null];const atk=effectiveAttack(g,c,null);'+
  'return {mode,atk,base:c.card?.atk||CARDS[c.id].atk};});})()');
 for(const x of r)assert.ok(x.atk<1.2*x.base);
});


test('saved duel restores alpha powers, weakened Token level and active hunt mark',()=>{
 const r=run(
 'const a=newInstance(g,pred.id,0);a.fusion=true;a.roleOverride="predator";'+
 'a.predatorLeader={materials:5,powers:["swarm","mark","token"],bornUid:a.uid,createdTurn:12,ownTurns:2};'+
 'g.players[0].field[0]=a;'+
 'const token=newInstance(g,pred.id,0);const lv=Math.min(10,CARDS[pred.id].level+1);'+
 'token.card={level:lv,atk:Math.round(CARDS[pred.id].atk*.5/10)*10,'+
 'def:Math.round(CARDS[pred.id].def*.5/10)*10,name:"Rudelgeist · Lv "+lv};'+
 'token.predatorToken={leaderUid:a.uid,level:lv};token.roleOverride="predator";'+
 'g.players[0].field[1]=token;'+
 'const target=newInstance(g,guard.id,1);target.mode="def";g.players[1].field[0]=target;'+
 'g.predatorPursuit={turn:12,owner:0,targetUid:target.uid,attackers:[a.uid]};'+
 'g.players.forEach(p=>p.lp=g.maxLP);const saved=JSON.parse(JSON.stringify(g));'+
 'const loaded=validateDuelSnapshot(saved);'+
 'const alpha=loaded.players[0].field[0],t=loaded.players[0].field[1];'+
 'return {powers:alpha.predatorLeader?.powers,round:alpha.predatorLeader?.ownTurns,'+
 'role:alpha.roleOverride,token:t.predatorToken,tokenName:dataOf(t).name,'+
 'level:dataOf(t).level,hunt:loaded.predatorPursuit?.attackers,'+
 'sameUid:t.predatorToken.leaderUid===alpha.uid};');
 assert.deepEqual(r.powers,['swarm','mark','token']);assert.equal(r.round,2);
 assert.equal(r.role,'predator');assert.ok(r.tokenName.startsWith('Rudelgeist'));
 assert.ok(r.token.level>=3);assert.ok(r.sameUid);assert.equal(r.hunt?.length,1);
});
