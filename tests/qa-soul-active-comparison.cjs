'use strict';
const {boot}=require('./helpers/game-runtime.cjs');
const b=boot({seed:167017});
const report=b.run('('+function(){
 profile=freshProfile();profile.guideSeen=true;profile.trainingWins=3;
 const tiers=[3,5,7,9],results=[],errors=[];
 for(const tier of tiers){
  const base=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.retired&&(c.source===undefined||c.source<0||c.source<tier));
  const score=c=>c.def*.85+c.atk*.25+(c.role==='soul'?360:0)+(c.role==='guardian'?70:0);
  const deck=[...base].sort((a,b)=>score(b)-score(a)).slice(0,20).flatMap(c=>[c.id,c.id]);
  const fs=RPG_FUSIONS.filter(c=>c.rpg&&c.fusionOnly&&!c.ace&&!c.retired&&(c.source===undefined||c.source<0||c.source<tier));
  const fusionDeck=[...fs].sort((a,b)=>b.def+(b.role==='soul'?1400:0)-a.def-(a.role==='soul'?1400:0)).slice(0,15).map(c=>c.id);
  for(const active of [false,true]){
   const stat={tier,active,games:0,wins:0,turns:0,uses:0,drained:0,playerLP:0,losses:0};
   for(let i=0;i<16;i++){
    try{
     const g=createGame({id:'soul-active-'+tier+'-'+active+'-'+i,mode:'pve',
       opponentId:tier,context:'tournament',seed:877001+tier*1457+i*17,starter:i%2,
       deck,fusionDeck});
     game=g;uiMode='duel';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
     for(let half=0;half<32&&g.winner===null;half++){
      if(g.active===0){
       // Both groups use identical manual DEF placement; only one uses Seelenraub.
       for(let j=0;j<5;j++){
        const c=g.players[0].field[j];
        if(c&&(c.roleOverride||CARDS[c.id]?.role)==='soul'&&c.mode==='atk'&&!c.switched&&!g.pending)
          switchPosition(g,j);
       }
       if(active){
        for(let j=0;j<5;j++){
         const c=g.players[0].field[j];
         if(!c||(c.roleOverride||CARDS[c.id]?.role)!=='soul'||c.mode!=='def')continue;
         const targets=g.players[1].field.map((c,i)=>({c,i})).filter(x=>x.c?.card&&(x.c.card.atk+x.c.card.def)>0);
         if(!targets.length)continue;
         targets.sort((a,b)=>b.c.card.atk-a.c.card.atk);
         const before=targets[0].c.card.atk+targets[0].c.card.def;
         if(window.ArcaneEssenceCombat.soulRaid(j,targets[0].i)){
          stat.uses++;stat.drained+=before-(targets[0].c.card.atk+targets[0].c.card.def);
         }
        }
       }
      }
      aiTurn(g,g.active===0?'guardian':OPPONENTS[tier].policy);
     }
     if(g.winner===null)throw Error('Unfinished duel');
     stat.games++;stat.wins+=g.winner===0?1:0;stat.losses+=g.winner===1?1:0;
     stat.turns+=g.turn;stat.playerLP+=g.players[0].lp;
    }catch(e){errors.push({tier,active,i,error:String(e)});}
   }
   results.push({...stat,avgTurns:Number((stat.turns/Math.max(1,stat.games)).toFixed(2)),
     avgEndLP:Math.round(stat.playerLP/Math.max(1,stat.games))});
  }
 }
 return {type:'paired human-style role-control experiment',seedsPerTier:16,tiers,
  totalPlanned:128,errors,results,limits:['Not the built-in simulation AI','Both groups manually put soul cards into DEF position','Decks use card pool from the preceding tiers']};
}.toString()+')()');
console.log('QA_20261017_SOUL_ACTIVE '+JSON.stringify(report));
if(report.errors.length)process.exitCode=1;
