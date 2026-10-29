'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function setup(){
  const CARDS=[
    {id:0,name:'Predator',level:3,role:'predator',atk:1000,def:200},
    {id:1,name:'Wächter',level:4,role:'guardian',atk:200,def:500},
    {id:2,name:'Seelenzehrer',level:4,role:'soul',atk:300,def:600},
    {id:3,name:'Allrounder',level:2,role:'combatant',atk:500,def:300}
  ];
  const state={CARDS,document:{getElementById:()=>null},window:{localStorage:{getItem:()=>null,setItem:()=>{}}},
    render:()=>null,uiMode:'menu',game:null,escapeHtml:s=>String(s),
    canAttack:(g,c)=>c?.mode==='atk'&&!c.attacked&&g.turn>1,
    dataOf:c=>({...CARDS[c.id],...c.card}),effectiveAttack:(g,a)=>a.card?.atk||CARDS[a.id].atk,
    fusionBudget:l=>Math.max(...l)+1,
    ArcaneFusionRework113:null
  };
  const street=l=>{const unique=[...new Set(l)].sort((a,b)=>a-b);let n=1,best=1;for(let i=1;i<unique.length;i++){n=unique[i]===unique[i-1]+1?n+1:1;best=Math.max(best,n);}return best;};
  state.window.ArcaneFusionMath={pattern:levels=>({name:street(levels)>=3?'Kleine Straße':'Drilling',rollBonus:1})};
  state.window.ArcaneFusionRework113={calculate:levels=>({core:Math.max(...levels),bonus:0,street:street(levels)===levels.length,penalty:0})};
  const repoPath=path.join(__dirname,'../assets/duel-quality-v151.js');
  const localPath=path.join(__dirname,'duel-quality-v151.js');
  vm.runInNewContext(fs.readFileSync(fs.existsSync(repoPath)?repoPath:localPath,'utf8'),state);
  const creature=(id,mode='atk',card={})=>({id,mode,card:{atk:CARDS[id].atk,def:CARDS[id].def,...card}});
  const game=(attacker,defender,extra={})=>({mode:'pve',active:0,turn:3,winner:null,pending:null,essenceRules:false,
    players:[{lp:4000,shield:0,field:[attacker,null,null,null,null]},
      {lp:4000,shield:0,field:[defender,null,null,null,null]}],...extra});
  return {api:state.window.ArcaneDuelQuality151,creature,game};
}

test('forecast never mutates live game state, card or LP',()=>{
  const {api,creature,game}=setup();
  const g=game(creature(0),creature(1,'def'),{essenceRules:true});
  const before=JSON.stringify(g);
  const forecast=api.combatForecast(g,0,0);
  assert.equal(forecast.allowed,true);
  assert.equal(JSON.stringify(g),before);
});

test('real essence defense accounts for armor piercing, condensed reserve, souls and counter',()=>{
  const {api,creature,game}=setup();
  const a=creature(0),d=creature(1,'def');
  d.essenceCombat={condensed:60,soul:100,guardLeft:0};
  const g=game(a,d,{essenceRules:true});g.players[0].shield=40;
  const result=api.combatForecast(g,0,0);
  assert.equal(result.attack,1000);
  assert.equal(result.prevented,100); // Unbound Guardian: 20 % armor - 10 percentage points Predator pierce.
  assert.equal(result.defenseDamage,500);
  assert.equal(result.destroyDefender,true);
  assert.equal(result.counter,100);
  assert.equal(result.burn,50);
  assert.equal(result.ownLoss,110); // Attacker's shield absorbs 40 LP.
});

test('guardian immunity prevents both DEF damage and counter',()=>{
  const {api,creature,game}=setup();
  const d=creature(1,'def');d.essenceCombat={guardLeft:2,soul:0,condensed:0};
  const result=api.combatForecast(game(creature(0),d,{essenceRules:true}),0,0);
  assert.equal(result.defenseDamage,0);assert.equal(result.destroyDefender,false);assert.equal(result.counter,0);
});

test('equal ATK eliminates both cards but does not award LP damage',()=>{
  const {api,creature,game}=setup();
  const result=api.combatForecast(game(creature(3),creature(3)),0,0);
  assert.equal(result.destroyAttacker,true);assert.equal(result.destroyDefender,true);
  assert.equal(result.ownLoss,0);assert.equal(result.enemyLoss,0);
});

test('shield is deducted from direct attack, and blocked attacks do not produce fake forecasts',()=>{
  const {api,creature,game}=setup();
  const g=game(creature(0),null);g.players[1].shield=250;
  assert.equal(api.combatForecast(g,0,null).enemyLoss,750);
  g.players[1].field[1]=creature(1);
  assert.equal(api.combatForecast(g,0,null).allowed,false);
  g.players[0].field[0].attacked=true;
  assert.equal(api.combatForecast(g,0,1).allowed,false);
});

test('fusion explanation distinguishes a poker subset street from a closed street',()=>{
  const {api,creature}=setup();
  const mats=[1,2,3,1,1].map(level=>({id:3,card:{level}}));
  const g={mode:'pve'};
  const out=api.fusionExplanation(g,mats);
  assert.equal(out.partialStreet,true);
  assert.equal(out.closedStreet,false);
  assert.deepEqual(Array.from(out.levels),[1,2,3,1,1]);
  assert.ok(out.prior);
  assert.equal(api.fusionExplanation(g,mats.slice(0,1)),null);
});
