'use strict';
/* Arcane Duel -- equal-inventory tactical defender bot.
 * Runs REAL createGame/chooseAiAction/applyAiAction/skills/fusion logic from index.html.
 * Same forty-card deck, NPC, player upgrades and RNG seeds in every paired policy.
 * The controlled opening Soul Eater is applied to every policy, including offense.
 * Test-only AI never modifies production gameplay or player saves.
 */
const {boot}=require('./helpers/game-runtime.cjs');
const b=boot({seed:721027});
const report=b.run('('+function(){
 profile=freshProfile();profile.guideSeen=true;profile.trainingWins=3;
 const kinds=['offense','passive','tactical','soul-fusion'];
 const tiers=[3,5,7,9],seeds=12,rows=[],errors=[],examples=[];
 const soulAPI=window.ArcaneEssenceCombat;
 function roster(tier){
  const cards=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.retired&&
    (c.source===undefined||c.source<0||c.source<tier));
  const soul=cards.filter(c=>c.role==='soul').sort((a,b)=>b.level-a.level||b.def-a.def)[0];
  const ranked=[...cards].sort((a,b)=>(b.atk+b.def+(b.role==='soul'?70:0))-(a.atk+a.def+(a.role==='soul'?70:0)));
  const deck=ranked.slice(0,20).flatMap(c=>[c.id,c.id]);
  const fusionDeck=RPG_FUSIONS.filter(c=>c.rpg&&c.fusionOnly&&!c.ace&&!c.retired&&
     (c.source===undefined||c.source<0||c.source<tier)).sort((a,b)=>
      b.level-a.level||(b.def+b.atk)-(a.def+a.atk)).slice(0,15).map(c=>c.id);
  return {deck,fusionDeck,soul};
 }
 function skillPhase(g,k,stat){
  const p=g.players[0],enemy=g.players[1];
  for(let idx=0;idx<5;idx++){
   const creature=p.field[idx];if(!creature||soulAPI.roleOf(creature)!=='soul'||creature.mode!=='def')continue;
   const e=soulAPI.statLayer(creature);
   if(e.lastSoulAction===g.turn)continue;
   const threat=Math.max(0,...enemy.field.filter(Boolean).map(c=>c.card?.atk||0));
   // A finisher: prevent defender from exhausting all stored energy just to steal more.
   if(e.soul>=40&&Math.floor(e.soul*1.3)>=enemy.lp+enemy.shield&&soulAPI.discharge(idx)){stat.finisher++;stat.discharge++;continue;}
   if(e.soul>=65&&threat>creature.card.def+e.soul*.6&&soulAPI.condense(idx)){stat.condense++;continue;}
   if(k==='soul-fusion'&&e.soul>=230)continue; // Reserve stored energy for a later field fusion.
   const targets=enemy.field.map((c,i)=>({c,i})).filter(x=>x.c?.card&&x.c.card.atk+x.c.card.def>0)
     .sort((a,b)=>b.c.card.atk-a.c.card.atk);
   if(targets.length){
    const t=targets[0],before=t.c.card.atk+t.c.card.def;
    if(soulAPI.soulRaid(idx,t.i)){stat.raid++;stat.drained+=before-(t.c.card.atk+t.c.card.def);continue;}
   }
   if(e.soul>=Math.max(100,(250+dataOf(creature).level*125)*.48)&&
      soulAPI.discharge(idx)){stat.discharge++;}
  }
 }
 function fusionPhase(g,stat){
  const p=g.players[0];
  if(g.summoned||g.pending||g.aiPhase!=='summon')return false;
  const slots=p.field.map((c,i)=>({c,i})).filter(x=>x.c&&soulAPI.roleOf(x.c)==='soul'&&
    (x.c.essenceCombat?.soul||0)>=170&&!isFateCard(x.c));
  if(!slots.length)return false;
  slots.sort((a,b)=>b.c.essenceCombat.soul-a.c.essenceCombat.soul);
  const old=slots[0];
  const hand=p.hand.filter(c=>!isFateCard(c)).sort((a,b)=>b.card?.level-a.card?.level||dataOf(b).level-dataOf(a).level);
  for(const h of hand){
   const opts=fusionOptions(g,[dataOf(h).level,dataOf(old.c).level]).filter(c=>p.remainingFusion.includes(c.id));
   if(!opts.length)continue;
   const goal=opts.sort((a,b)=>b.level-a.level||b.def-a.def)[0];
   const before=old.c.essenceCombat.soul;
   if(!prepareNormal(g,h.uid))continue;
   const res=placePending(g,old.i,goal.id);
   if(!res?.fused)throw Error('Committed charged material did not field-fuse');
   if(res.card.soulInheritance?.energy!==before)throw Error('Charged material was not inherited');
   stat.fieldFusions++;stat.inheritedDEF+=res.card.soulInheritance.defBonus;
   g.aiPhase='positions';
   return true;
  }
  return false;
 }
 function defenderTurn(g,k,stat){
  const turn=g.turn;
  for(let action=0;action<54&&g.winner===null&&g.turn===turn;action++){
   if(k==='soul-fusion')fusionPhase(g,stat);
   if(g.aiPhase==='positions'||g.aiPhase==='attacks'){
    // Legal mode changes only -- the simulation does not grant free position changes.
    const p=g.players[0];
    for(let i=0;i<5;i++){
     const c=p.field[i];if(c&&soulAPI.roleOf(c)==='soul'&&c.mode!=='def'&&!c.switched&&!g.pending){
      if(switchPosition(g,i))stat.defSwitches++;
     }
    }
   }
   if(g.aiPhase==='attacks'&&!g.pending&&k!=='passive'&&g.active===0)skillPhase(g,k,stat);
   if(g.winner!==null)break; // A successful soul discharge can end the match mid-turn.
   const act=chooseAiAction(g,'guardian'),before=g.turn;
   const applied=applyAiAction(g,act);
   if(!applied&&!(act.type==='end'&&(g.turn!==before||g.winner!==null)))throw Error('Turn strategy action invalid: '+act.type);
  }
  if(g.turn===turn&&g.winner===null)throw Error('Defender action budget exhausted');
 }
 for(const tier of tiers){
  const spec=roster(tier);
  for(const kind of kinds){
   const row={tier,kind,duels:0,wins:0,losses:0,turns:0,remainingLP:0,raid:0,drained:0,
    discharge:0,condense:0,finisher:0,fieldFusions:0,inheritedDEF:0,defSwitches:0,
    ordinaryFusions:0,errors:0};
   for(let i=0;i<seeds;i++){
    try{
     if(spec.deck.length!==40||spec.fusionDeck.length<3||!spec.soul)throw Error('No matched inventory');
     const npc=rpgEnemyLoadout(tier,'easy');
     const g=createGame({id:'tactical-equal-'+tier+'-'+kind+'-'+i,mode:'pve',context:'tournament',
      opponentId:tier,starter:i%2,seed:20261017+tier*1091+i*37,
      deck:spec.deck,fusionDeck:spec.fusionDeck,
      enemy:{...npc,power:Math.min(2,npc.power*1.85)}});
     // First-trial tournament modifiers can push 1.85x synthetic NPC power above
     // the validated save range: restrict ONLY this test, never production stats.
     g.players[1].power=Math.min(2,g.players[1].power);
     game=g;uiMode='duel';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
     const card=newInstance(g,spec.soul.id,0);card.mode=kind==='offense'?'atk':'def';
     g.players[0].field[0]=card;
     const initial=JSON.stringify(g.players[0].originalDeck);
     for(let half=0;half<38&&g.winner===null;half++){
      if(g.active===0&&kind!=='offense')defenderTurn(g,kind,row);
      else aiTurn(g,g.active===0?'offensive':OPPONENTS[tier].policy||'balanced');
     }
     if(g.winner===null)throw Error('Duel not over in 38 half turns');
     if(JSON.stringify(g.players[0].originalDeck)!==initial)throw Error('Deck changed');
     const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
     if(!snap?.players?.length)throw Error('Save invalid');
     row.duels++;row[g.winner===0?'wins':'losses']++;row.turns+=g.turn;
     row.remainingLP+=g.players[0].lp;row.ordinaryFusions+=g.totalFusions[0]||0;
     if(i===0)examples.push({tier,kind,win:g.winner===0,turns:g.turn,raid:row.raid,
        discharge:row.discharge,fusion:row.fieldFusions});
    }catch(e){row.errors++;errors.push({tier,kind,seed:i,error:String(e)});}
   }
   row.avgTurns=row.duels?Math.round(row.turns/row.duels*100)/100:0;
   row.avgLP=row.duels?Math.round(row.remainingLP/row.duels):0;
   rows.push(row);
  }
 }
 return {test:'Paired identical inventory tactics vs scaled NPCs (not real player progression)',
  expected:tiers.length*kinds.length*seeds,errors,rows,examples,
  caveat:'All variants receive an identical, synthetic starter Soul Eater; smart tester does not replace shipped NPC AI.'};
}.toString()+')()');
console.log('QA_TACTICAL_PARITY '+JSON.stringify(report));
if(report.errors.length)process.exitCode=1;
