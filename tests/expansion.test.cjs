'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=['assets/art-engine.js','assets/game.js','assets/expansion.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8'));
function boot(savedProfile=null){
 const nodes=new Map(),store=new Map(savedProfile?[['arcane-duel-rpg-profile-v3',savedProfile]]:[]);
 function node(id=''){
  return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},
    classList:{add(){},remove(){},toggle(){},contains(k){return k==='hidden'}},
    append(){},appendChild(){},remove(){},setAttribute(){},addEventListener(){},insertAdjacentHTML(){},click(){if(typeof this.onclick==='function')this.onclick()},
    querySelector(){return node()},querySelectorAll(){return []},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};
 }
 const document={body:node('body'),getElementById(id){if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id)},
    querySelector(){return node()},querySelectorAll(){return []},createElement:node,addEventListener(){},elementFromPoint(){return null}};
 const window={localStorage:{getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,String(v))}},
   crypto:{getRandomValues(a){a[0]=12345;return a}},innerWidth:1200,innerHeight:800};
 const ctx=vm.createContext({window,document,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},
   Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 for(const f of files)vm.runInContext(f,ctx,{timeout:12000});
 return {run:code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',ctx,{timeout:12000})),store,nodes};
}
test('Alpha 1.9 UI extension initializes without breaking menu or profile',()=>{
 const b=boot(),x=b.run('({version:window.ArcaneExpansion.version,guide:window.ArcaneExpansion.featureCount,cards:CARDS.length,ace:profile.acePurchased.length,training:upgradeCost("tempo")})');
 assert.equal(x.version,'2.2.0-dev');assert.equal(x.guide,8);assert.equal(x.cards,324);assert.equal(x.ace,0);assert.equal(x.training,100);
});
test('Legacy saves without ACE metadata remain valid',()=>{
 const b=boot(),x=b.run('(()=>{const p=JSON.parse(JSON.stringify(profile));delete p.acePurchased;delete p.aceHints;delete p.tournamentLosses;delete p.guideSeen;const v=validateProfile(p);return {cards:v.activeDeck.length,ace:v.acePurchased.length,guide:v.guideSeen,losses:v.tournamentLosses.length};})()');
 assert.deepEqual(x,{cards:40,ace:0,guide:false,losses:11});
});
test('First tournament victory fills charges and novice XP is greater than normal XP',()=>{
 const b=boot(),x=b.run('(()=>{profile.dropCharges=0;profile.guideSeen=true;const g=createGame({mode:"pve",starter:0,opponentId:1,context:"tournament",seed:32});g.winner=0;const reward=rewardMatch(g);return {first:reward.first,refilled:reward.refilled,charges:profile.dropCharges,cap:dropChargeCap(),xp:reward.xp};})()');
 assert.equal(x.first,true);assert.equal(x.refilled,true);assert.equal(x.charges,x.cap);assert.ok(x.xp>=24);
});
test('ACE cards can be bought once after tournament victory, cheaper with higher level',()=>{
 const b=boot(),x=b.run('(()=>{profile.cleared=[1];profile.coins=999999;const id=window.ArcaneExpansion.aceIds[1],before=window.ArcaneExpansion.aceCost(1),ok=window.ArcaneExpansion.buyAce(1),again=window.ArcaneExpansion.buyAce(1);profile.xp=80*40*40;return {id,ok,again,owned:profile.inventory[id],after:window.ArcaneExpansion.aceCost(1),before,cards:CARDS.length};})()');
 assert.equal(x.id,314);assert.equal(x.ok,true);assert.equal(x.again,false);assert.equal(x.owned,1);assert.ok(x.after<x.before);
});
test('Purchased ACE becomes extremely rare booster possibility only after purchase',()=>{
 const b=boot(),x=b.run('(()=>{profile.cleared=[1];profile.coins=999999;const id=window.ArcaneExpansion.aceIds[1],poolBefore=boosterPools(1).rare.includes(id),before=Array.from({length:150},(_,i)=>rollBooster(1,{seed:i+1},10)).flat().includes(id);window.ArcaneExpansion.buyAce(1);const poolAfter=boosterPools(1).rare.includes(id),after=Array.from({length:150},(_,i)=>rollBooster(1,{seed:i+1},10)).flat().filter(c=>c===id).length;return {poolBefore,poolAfter,before,after};})()');
 assert.equal(x.poolBefore,false);assert.equal(x.before,false);assert.equal(x.poolAfter,true);assert.ok(x.after>=0&&x.after<40);
});
test('Win-loss intelligence and drop packs survive JSON validation',()=>{
 const b=boot(),x=b.run('(()=>{profile.tournamentLosses[2]=3;profile.aceHints=[2];profile.packs[2]=5;profile.guideSeen=true;const raw=JSON.parse(JSON.stringify(profile));const p=validateProfile(raw);return {loss:p.tournamentLosses[2],hint:p.aceHints[0],packs:p.packs[2],seen:p.guideSeen};})()');
 assert.deepEqual(x,{loss:3,hint:2,packs:5,seen:true});
});
test('Eight beginner-friendly guide pages and new menu wording',()=>{
 const b=boot(),x=b.run('({nav:navMarkup(),guide:window.ArcaneExpansion.featureCount})');
 assert.match(x.nav,/Freie Duelle/);assert.match(x.nav,/Skills & Perks/);assert.equal(x.guide,8);
});

test('Real reload validates a purchased ACE, hints and tutorial state without losing progress',()=>{
 const b=boot();
 const before=b.run('(()=>{profile.cleared=[1];profile.coins=999999;profile.guideSeen=true;profile.aceHints=[2];profile.tournamentLosses[2]=1;if(!window.ArcaneExpansion.buyAce(1))throw Error("cannot purchase");saveProfile();return {save:JSON.stringify(profile),coin:profile.coins,ace:profile.acePurchased[0],id:window.ArcaneExpansion.aceIds[1]};})()');
 const reloaded=boot(before.save);
 const after=reloaded.run('({coin:profile.coins,ace:profile.acePurchased[0],owned:profile.inventory[window.ArcaneExpansion.aceIds[1]],guide:profile.guideSeen,hint:profile.aceHints[0],loss:profile.tournamentLosses[2],level:CARDS.length})');
 assert.equal(after.coin,before.coin);
 assert.equal(after.ace,1);
 assert.equal(after.owned,1);
 assert.equal(after.guide,true);
 assert.equal(after.hint,2);
 assert.equal(after.loss,1);
 assert.equal(after.level,324);
});
