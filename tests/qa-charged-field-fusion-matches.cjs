'use strict';
// Controlled actual on-field fusion via prepareNormal/placePending.
// Same seeds and material templates, only stored soul energy differs.
const {boot}=require('./helpers/game-runtime.cjs');
const b=boot({seed:109117});
const r=b.run('('+function(){
 const tiers=[4,6,8],pressures=[1.5,2],charges=[0,200,400],n=12,rows=[],errors=[],examples=[];
 profile=freshProfile();profile.trainingWins=3;profile.guideSeen=true;
 for(const tier of tiers){
  const pool=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.retired&&
    (c.source===undefined||c.source<0||c.source<=tier-1));
  const soul=pool.filter(c=>c.role==='soul').sort((a,b)=>b.level-a.level||b.def-a.def)[0];
  const deck=[...pool].sort((a,b)=>(b.def*.65+b.atk*.35)-(a.def*.65+a.atk*.35)).slice(0,20).flatMap(c=>[c.id,c.id]);
  const fusionDeck=RPG_FUSIONS.filter(c=>c.rpg&&c.fusionOnly&&!c.ace&&!c.retired&&
    (c.source===undefined||c.source<0||c.source<=tier-1))
    .sort((a,b)=>b.def+b.atk-a.def-a.atk).slice(0,15).map(c=>c.id);
  for(const pressure of pressures)for(const charge of charges){
   const stat={tier,pressure,charge,attempted:n,duels:0,wins:0,losses:0,turns:0,lp:0,
    defBonus:0,soulCarry:0,fieldFusion:0,rollErrors:0};
   for(let seed=0;seed<n;seed++){
    try{
     if(!soul||deck.length!==40||fusionDeck.length<2)throw Error('Deck sources insufficient');
     const npc=rpgEnemyLoadout(tier,'easy');
     const g=createGame({id:'fusion-lab-'+tier+'-'+pressure+'-'+charge+'-'+seed,
       mode:'pve',context:'tournament',opponentId:tier,starter:0,
       seed:221001+tier*1109+seed*43,deck,fusionDeck,
       enemy:{...npc,power:Math.min(2,npc.power*pressure)}});
     game=g;uiMode='duel';busy=false;aiRunning=false;$('overlay').classList.add('hidden');
     const p=g.players[0],source=newInstance(g,soul.id,0),hand=newInstance(g,soul.id,0);
     source.mode='def';
     p.field[0]=source;p.hand[0]=hand;
     const layer=window.ArcaneEssenceCombat.statLayer(source);
     layer.soul=Math.min(charge,250+dataOf(source).level*125);
     if(!prepareNormal(g,hand.uid))throw Error('Could not prepare real hand summon');
     const options=fusionOptions(g,[dataOf(source).level,dataOf(hand).level]);
     const choice=options.sort((a,b)=>b.def+(b.role==='soul'?500:0)-a.def-(a.role==='soul'?500:0))[0];
     if(!choice)throw Error('No legal field fusion');
     const fused=placePending(g,0,choice.id);
     if(!fused?.fused||!fused.card?.fusion)throw Error('Field fusion did not complete');
     const out=fused.card,im=out.soulInheritance;
     const expected=Math.floor(layer.soul*.3/10)*10; // consumed source charge is now zero; true expected below.
     const cap=Math.min(charge,250+dataOf(source).level*125);
     const expectedBonus=Math.min(250,Math.floor(cap*.30/10)*10);
     if((im?.defBonus||0)!==expectedBonus)throw Error('Wrong inherited DEF');
     if(im&&im.carried>cap)throw Error('Energy created from nothing');
     const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
     if((snap.players[0].field[0].soulInheritance?.defBonus||0)!==expectedBonus)throw Error('Inherited metadata lost on save');
     if(source.essenceCombat?.soul!==0)throw Error('Spent material retained soul');
     stat.fieldFusion++;stat.defBonus+=im?.defBonus||0;stat.soulCarry+=im?.carried||0;
     for(let half=0;half<36&&g.winner===null;half++){
      if(g.active===0)for(const c of p.field.filter(Boolean))if((c.roleOverride||CARDS[c.id].role)==='soul'){
       c.mode='def';c.switched=true;
      }
      aiTurn(g,g.active===0?'guardian':OPPONENTS[tier]?.policy||'balanced');
     }
     if(g.winner===null)throw Error('Duel not finished');
     stat.duels++;stat[g.winner===0?'wins':'losses']++;stat.turns+=g.turn;stat.lp+=p.lp;
     if(seed===0)examples.push({tier,pressure,charge,level:dataOf(out).level,role:out.roleOverride||CARDS[out.id].role,
       bonus:im?.defBonus||0,carried:im?.carried||0,win:g.winner===0,turns:g.turn});
    }catch(e){errors.push({tier,pressure,charge,seed,error:String(e)});}
   }
   rows.push({...stat,avgTurns:stat.duels?Math.round(stat.turns/stat.duels*100)/100:null,
      avgLP:stat.duels?Math.round(stat.lp/stat.duels):null});
  }
 }
 return {kind:'identical real placePending field fusion, charge inheritance test only',battles:tiers.length*pressures.length*charges.length*n,rows,errors,examples,
  limitations:['Soul is pre-charged to fixed amounts as a controlled experiment; no free energy in a real duel','Tier-limited but synthetic card selection','NPC power scaled in test only, capped at save-valid power 2.0']};
}.toString()+')()');
console.log('QA_CHARGED_FUSION '+JSON.stringify(r));
if(r.errors.length)process.exitCode=1;
