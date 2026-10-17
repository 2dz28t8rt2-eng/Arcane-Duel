'use strict';
/* Paired scripted PvE matches with production runtime and intentionally disadvantaged decks.
 * No live saves touched. Controlled starts equal within each seed/policy group.
 * Keeps the source-aware tier filter and PvE damage/turn rules.
 */
const {boot}=require('./helpers/game-runtime.cjs');
const game=boot({seed:811763});
const result=game.run('('+function(){
 const groups=['passive','adaptive','discharge'],tiers=[3,5,7,9],samples=16,pressures=[1.5,2.0];
 const rows=[],errors=[],examples=[];
 profile=freshProfile();profile.trainingWins=3;profile.guideSeen=true;
 function deckFor(tier){
  const normal=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.retired&&
   (c.source===undefined||c.source<0||c.source<=tier-1));
  const soul=normal.filter(c=>c.role==='soul');
  const ranked=[...normal].sort((a,b)=>b.def*.7+b.atk*.3+(b.role==='soul'?190:0)-
    (a.def*.7+a.atk*.3+(a.role==='soul'?190:0)));
  const chosen=ranked.slice(0,20).flatMap(c=>[c.id,c.id]);
  const fusion=RPG_FUSIONS.filter(c=>c.rpg&&c.fusionOnly&&!c.ace&&!c.retired&&
   (c.source===undefined||c.source<0||c.source<=tier-1))
   .sort((a,b)=>(b.def+b.atk)-(a.def+a.atk)).slice(0,15).map(c=>c.id);
  return {chosen,fusion,guardian:soul.sort((a,b)=>b.def-a.def)[0]?.id,sources:soul.length};
 }
 function playerActions(g,policy,counts){
  const C=window.ArcaneEssenceCombat,p=g.players[0],e=g.players[1];
  // Controlled defender plan (same for every policy): keep every Soul Eater in DEF.
  for(let idx=0;idx<p.field.length;idx++){
   const c=p.field[idx];if(!c||(c.roleOverride||CARDS[c.id].role)!=='soul')continue;
   if(c.mode!=='def')c.mode='def';
   c.switched=true;
   if(policy==='passive')continue;
   const layer=C.statLayer(c);
   const enemy=e.field.map((enemy,j)=>({enemy,j})).filter(x=>x.enemy?.card&&x.enemy.card.atk+x.enemy.card.def>0)
    .sort((a,b)=>b.enemy.card.atk-a.enemy.card.atk);
   if(policy==='adaptive'){
    const danger=enemy.reduce((n,x)=>n+x.enemy.card.atk,0);
    if(layer.soul>=40&&e.lp<=Math.floor(layer.soul*1.3)&&C.discharge(idx)){counts.discharge++;continue;}
    if(layer.soul>=110&&danger>Math.max(c.card.def,layer.soul)*1.3&&C.condense(idx)){counts.condense++;continue;}
   }
   if(policy==='discharge'&&layer.soul>=80&&C.discharge(idx)){counts.discharge++;continue;}
   if(enemy.length){
    const before=enemy[0].enemy.card.atk+enemy[0].enemy.card.def;
    if(C.soulRaid(idx,enemy[0].j)){counts.raid++;counts.drained+=before-(enemy[0].enemy.card.atk+enemy[0].enemy.card.def);}
   }
  }
 }
 for(const pressure of pressures)for(const tier of tiers){
  const spec=deckFor(tier);
  for(const policy of groups){
   const s={tier,pressure,policy,n:0,wins:0,losses:0,turns:0,endLP:0,raid:0,drained:0,condense:0,discharge:0,soulObserved:0,fusions:0};
   for(let seed=0;seed<samples;seed++){
    try{
     if(spec.chosen.length!==40||spec.fusion.length<2||!spec.guardian)throw Error('No playable tier deck/soul card');
     const g=createGame({id:'qa-tight-'+tier+'-'+pressure+'-'+policy+'-'+seed,seed:811763+tier*971+seed*103,
      mode:'pve',context:'tournament',opponentId:tier,starter:seed%2,
      enemy:{...rpgEnemyLoadout(tier,'easy'),power:rpgEnemyLoadout(tier,'easy').power*pressure},
      deck:spec.chosen,fusionDeck:spec.fusion});
     game=g;uiMode='duel';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
     // Controlled identical material: one affordable Soul Eater is on DEF field.
     const eater=newInstance(g,spec.guardian,0);
     eater.mode='def';C=null;
     g.players[0].field[0]=eater;
     const count={raid:0,drained:0,condense:0,discharge:0};
     for(let t=0;t<34&&g.winner===null;t++){
      if(g.active===0)playerActions(g,policy,count);
      aiTurn(g,g.active===0?'guardian':OPPONENTS[tier]?.policy||'balanced');
     }
     if(g.winner===null)throw Error('Did not terminate in 34 half-turns');
     s.n++;s[g.winner===0?'wins':'losses']++;s.turns+=g.turn;s.endLP+=g.players[0].lp;
     s.raid+=count.raid;s.drained+=count.drained;s.condense+=count.condense;s.discharge+=count.discharge;
     s.fusions+=g.totalFusions[0]||0;
     s.soulObserved+=g.log.some(x=>x.includes('Seelenbrand'))?1:0;
     if(seed===0)examples.push({tier,policy,won:g.winner===0,turn:g.turn,raid:count.raid,absorbed:count.drained});
    }catch(err){errors.push({tier,policy,seed,message:String(err)});}
   }
   rows.push({...s,avgTurns:s.n?Math.round(s.turns/s.n*100)/100:null,
    avgLP:s.n?Math.round(s.endLP/s.n):null,foundSouls:spec.sources});
  }
 }
 return {kind:'matched defender stress vs scaled tournament NPC power (test-only)',games:tiers.length*groups.length*samples*pressures.length,
  rows,errors,examples,disclaimer:'Scripted one soul-defender on initial board for both treatments; no actual card acquisition and still uses simplified AI.'};
}.toString().replace("eater.mode='def';C=null;","eater.mode='def';")+')()');
console.log('QA_SOUL_PRESSURE '+JSON.stringify(result));
if(result.errors.length)process.exitCode=1;
