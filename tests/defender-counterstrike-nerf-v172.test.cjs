'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const source=fs.readFileSync('assets/essence-combat.js','utf8');
function duel(role,def,hpAtk=1000,enemyAtk=100,invulnerable=false){
 const code=`(()=>{
  const g=createGame({id:'counterstrike-regression',mode:'pve',opponentId:1,context:'free',seed:10317});
  const victimId=CARDS.find(c=>c.role==='${role}'&&!c.fusionOnly&&c.level<=3).id;
  const attackerId=CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&c.level<=3).id;
  const victim=newInstance(g,victimId,0),predator=newInstance(g,attackerId,1);
  victim.mode='def';victim.card.def=${def};victim.card.atk=${hpAtk};victim.summonedTurn=0;
  predator.mode='atk';predator.card.atk=${enemyAtk};predator.summonedTurn=0;predator.attacked=false;
  g.players[0].field=[victim,null,null,null,null];
  g.players[1].field=[predator,null,null,null,null];
  g.players[1].shield=0;g.active=1;g.turn=10;g.essenceGuardSpent=true;
  if(${invulnerable})window.ArcaneEssenceCombat.statLayer(victim).guardLeft=2;
  const originalLp=g.players[1].lp;
  const result=attack(g,0,0);
  return {hit:!!result,lifeDamage:originalLp-g.players[1].lp,
   defenderSurvived:g.players[0].field[0]===victim,
   defenderDef:victim.card?.def??null,resultDestroyed:result?.destroyed?.length??0};
 })()`;
 return boot({seed:10317}).run(code);
}
test('Both Guardian and Soul counter for 35% ATK only after surviving a hit',()=>{
 for(const role of ['guardian','soul']){
  const x=duel(role,2500,1000,100);
  assert.equal(x.hit,true,role+' attack must be legal');
  assert.equal(x.defenderSurvived,true,role+' should survive');
  assert.equal(x.lifeDamage,350,role+' surviving defender counter');
 }
});
test('Destroyed Defender deals zero counterstrike: no suicide retaliation exploit',()=>{
 for(const role of ['guardian','soul']){
  const x=duel(role,20,1000,1200);
  assert.equal(x.hit,true,role+' hit must be legal');
  assert.equal(x.defenderSurvived,false,role+' should be destroyed');
  assert.equal(x.resultDestroyed,1,role+' should leave the field');
  assert.equal(x.lifeDamage,0,role+' defeated defender cannot counter');
 }
});
test('Invulnerable Last Bastion Defender does not counter',()=>{
 const x=duel('guardian',2500,1000,100,true);
 assert.equal(x.hit,true);assert.equal(x.defenderSurvived,true);
 assert.equal(x.lifeDamage,0);
});
test('AI threat estimate matches surviving 35% counter and excludes lethal hits',()=>{
 assert.match(source,/const canCounter=effectiveDef>atk \|\| shield\.guardLeft>0;/);
 assert.match(source,/const counter=isDefender\(d\.c\)&&canCounter\?Math\.floor\(Math\.max\(0,dataOf\(d\.c\)\.atk\)\*\.35\):0;/);
 assert.match(source,/if\(isDefender\(d\)&&!immuneBefore&&!endDefense&&q\.field\[di\]===d\)/);
 assert.match(source,/const counter= Math\.floor\(Math\.max\(0,dataOf\(d\)\.atk\)\*\.35\);/);
});
