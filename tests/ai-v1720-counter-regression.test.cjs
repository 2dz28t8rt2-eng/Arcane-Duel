'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const counter=require('./helpers/research-counterstrike-v172.cjs');
const role=require('./helpers/research-role-balance-v169.cjs');
const source=fs.readFileSync(path.join(__dirname,'../assets/essence-combat.js'),'utf8');
const h=fs.readFileSync(path.join(__dirname,'essence-combat.test.cjs'),'utf8');
const boundary=h.indexOf("\ntest('Old save defaults");
const anchor="const source=files.map(x=>fs.readFileSync(path.join(__dirname,'../assets',x),'utf8')).join('\\n;\\n');";
assert.ok(boundary>0&&h.includes(anchor),'isolated Solo harness changed');
function start(variant){
 const replace=[
 "const source=files.map(x=>{",
 " let code=fs.readFileSync(path.join(__dirname,'../assets',x),'utf8');",
 " if(x==='essence-combat.js'){",
 "  code=require('./helpers/research-role-balance-v169.cjs').transform(code,'predator15Triad90');",
 "  code=require('./helpers/research-counterstrike-v172.cjs').transform(code,"+JSON.stringify(variant)+");",
 " }",
 " return code;",
 "}).join('\\n;\\n');"
 ].join('\n');
 const code=h.slice(0,boundary).replace(anchor,replace)+"\nreturn start();";
 return new Function('require','__dirname','console',code)(require,__dirname,console).g;
}
function battle(mode,roleName,def,immune){
 const g=start(mode),duel=g.createGame({id:'counter-v172',mode:'pve',context:'free',opponentId:1,seed:8821,deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 const did=g.CARDS.find(x=>x.role===roleName&&!x.fusionOnly&&x.level<=3)?.id;
 const pid=g.CARDS.find(x=>x.role==='predator'&&!x.fusionOnly&&x.level<=3)?.id;
 assert.ok(did!==undefined&&pid!==undefined,'roles must be available');
 const target=g.newInstance(duel,did,0),attacker=g.newInstance(duel,pid,1);
 target.mode='def';target.card.atk=1000;target.card.def=def;
 attacker.mode='atk';attacker.card.atk=1200;attacker.summonedTurn=0;
 duel.players[0].field.fill(null);duel.players[1].field.fill(null);
 duel.players[0].field[0]=target;duel.players[1].field[0]=attacker;
 duel.players[1].shield=0;duel.active=1;duel.turn=10;duel.essenceGuardSpent=true;
 if(immune)g.statLayer(target).guardLeft=2;
 const before=duel.players[1].lp,out=g.attack(duel,0,0);
 assert.ok(out,'attack legal');
 return {lifeDamage:before-duel.players[1].lp,alive:duel.players[0].field.includes(target),destroyed:out.destroyed?.length??0};
}
test('variant rules preserve the live 35% and test-only restore old 50%',()=>{
 assert.deepEqual(counter.MODES,['legacy50','survivor35','survivor35Heal85']);
 assert.deepEqual(role.tuning('predator15Triad90'),{pierce:.15,predator:.9,fusion:1.2});
 const legacy=counter.transform(source,'legacy50');
 const new35=counter.transform(source,'survivor35');
 const healed=counter.transform(source,'survivor35Heal85');
 assert.ok(legacy.includes("const counter= Math.floor(Math.max(0,dataOf(d).atk)*.5);"));
 assert.ok(legacy.includes('if(isDefender(d)&&!immuneBefore){'));
 assert.equal(new35,source);
 assert.ok(healed.includes('Math.floor(baseHeal*0.85)'));
 assert.ok(healed.includes("roleOf(ally)==='guardian'"));
 assert.ok(healed.includes(':baseHeal'));
});
test('survivors retaliate 500 old and 350 new for both Defender roles',()=>{
 for(const roleName of ['guardian','soul']){
  for(const [mode,want] of [['legacy50',500],['survivor35',350],['survivor35Heal85',350]]){
   const x=battle(mode,roleName,3000,false);assert.equal(x.alive,true);assert.equal(x.lifeDamage,want,mode+'/'+roleName);
  }
 }
});
test('destroyed Defenders retaliate 500 old but zero new for both roles',()=>{
 for(const roleName of ['guardian','soul']){
  for(const [mode,want] of [['legacy50',500],['survivor35',0],['survivor35Heal85',0]]){
   const x=battle(mode,roleName,1,false);assert.equal(x.alive,false);assert.equal(x.destroyed,1);assert.equal(x.lifeDamage,want,mode+'/'+roleName);
  }
 }
});
test('Last Bastion immunity blocks every mode',()=>{
 for(const mode of counter.MODES){
  const x=battle(mode,'guardian',2000,true);
  assert.equal(x.alive,true);assert.equal(x.lifeDamage,0,mode);
 }
});
