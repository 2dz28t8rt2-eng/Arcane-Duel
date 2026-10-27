'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
const BASE=`profile=freshProfile();profile.guideSeen=true;
 const g=createGame({mode:'pve',context:'free',seed:220127,opponentId:1,starter:0});
 g.turn=12;g.active=0;g.fateUsed=[true,true];g.winner=null;
 for(const p of g.players){p.field=[null,null,null,null,null];p.shield=0;p.power=1;p.flatBonus=0;p.enhancements={};p.lp=10000;}
 const sample=CARDS.find(c=>c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 const ordinary=CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&!c.essenceMonster&&c.level>=3);
 const card=(id,owner,index,atk,def,m=0)=>{const c=newInstance(g,id,owner);c.mode='atk';
  c.card={level:5,atk,def};c.fusion=!!m;if(m)c.materialsUsed=m;
  g.players[owner].field[index]=c;return c;};
`;
function run(source){return boot({seed:220127}).run('(()=>{'+BASE+source+'})()');}
test('the complete handbook guide is loaded after the actual Stomp engine',()=>{
 const runtime=boot(),script=runtime.scripts;
 assert.ok(script.indexOf('assets/fusion-stomp-guide-v201.js')>
  script.indexOf('assets/fusion-stomp-v200.js'));
 const info=runtime.run('({version:window.ArcaneFusionStompGuide201.version,title:window.ArcaneFusionStompGuide201.title,body:window.ArcaneFusionStompGuide201.handbook,lessons:window.ArcaneFusionStompGuide201.lessonGoals,perk:UPGRADES.combatDiscipline.desc})');
 assert.equal(info.version,'20.1');
 assert.match(info.title,/Fusions-Stomp/);
 for(const term of ['70 %','50 % / 50 %','50 % / 50 % / 30 %',
  '+12 Prozentpunkte','3 %','35 %','40 %','2v2','Kampfdisziplin'])
  assert.ok(info.body.includes(term),'Missing handbook concept: '+term);
 assert.deepEqual(info.lessons,['stomp3','stomp5']);
 assert.match(info.perk,/nicht/);
});
test('three-material exercise credits only a REAL secondary hit, not the summoning',()=>{
 const result=run(`g.lessonId='stomp3';g.lessonPatterns=[];
  card(sample.id,0,0,1000,1200,3);
  card(ordinary.id,1,2,100,400);
  const without=attack(g,0,2),before=[...g.lessonPatterns];
  const retry=createGame({mode:'pve',context:'free',seed:220128,opponentId:1,starter:0});
  return {noSplash:without.stomp?.hits.length||0,before,
   status:!!window.ArcaneFusionStompGuide201};`);
 assert.equal(result.noSplash,0);
 assert.deepEqual(result.before,[]);
 assert.equal(result.status,true);
 const success=run(`g.lessonId='stomp3';g.lessonPatterns=[];
  card(sample.id,0,0,1000,1200,3);card(ordinary.id,1,2,100,400);
  card(ordinary.id,1,3,100,400);
  const event=attack(g,0,2);
  return {hits:event.stomp?.hits.length||0,recorded:g.lessonPatterns};`);
 assert.equal(success.hits,1);
 assert.deepEqual(success.recorded,['stomp3']);
});
test('five-material exercise demands two distinct collateral targets',()=>{
 const one=run(`g.lessonId='stomp5';g.lessonPatterns=[];
  card(sample.id,0,0,1000,1200,5);card(ordinary.id,1,2,100,400);
  card(ordinary.id,1,3,100,400);attack(g,0,2);
  return [...g.lessonPatterns];`);
 assert.deepEqual(one,['stomp3']);
 const many=run(`g.lessonId='stomp5';g.lessonPatterns=[];
  card(sample.id,0,0,1000,1200,5);
  for(const index of [1,2,3])card(ordinary.id,1,index,100,400);
  const event=attack(g,0,2);
  return {hits:event.stomp.hits.map(x=>x.index),progress:g.lessonPatterns,
   cleared:event.stomp.hits.every(x=>x.destroyed)};`);
 assert.deepEqual(many.hits,[3,1]);
 assert.deepEqual(many.progress,['stomp3','stomp5']);
 assert.equal(many.cleared,true);
});
test('2v2 now mirrors Stomp independently, with the identical authoritative Edge reducer',()=>{
 const rules=fs.readFileSync(path.resolve(__dirname,'../assets/duo-shared-rules-v160.js'),'utf8');
 const server=fs.readFileSync(path.resolve(__dirname,'../supabase/functions/arcane-duo-v2/duo-rules.js'),'utf8');
 const page=fs.readFileSync(path.resolve(__dirname,'../duo-campaign-v2.html'),'utf8');
 assert.equal(rules,server);
 assert.match(rules,/stompBonusPP|stompMaterials/);
 assert.match(rules,/stompFatigue\(stompBefore\.atk,stompBefore\.def/);
 assert.doesNotMatch(page,/fusion-stomp-v200\.js/);
 assert.match(page,/duo-stomp-cinema-v202\.js/);
});
