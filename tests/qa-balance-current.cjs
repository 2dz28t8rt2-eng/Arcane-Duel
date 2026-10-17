'use strict';
// Manual QA harness, executed by GitHub Actions with the full production script stack.
// Deterministic isolated profiles; no mutations to gameplay assets or real player saves.
const {boot}=require('./helpers/game-runtime.cjs');
const types=['attack','balanced','defender','soul'];
function singles(){
 const output={};
 const b=boot({seed:517017});
 return b.run('('+function(){
   profile=freshProfile();profile.trainingWins=3;profile.guideSeen=true;
   const kinds=['attack','balanced','defender','soul'],rows=[],errors=[];
   for(let tier=1;tier<=10;tier++){
    const pool=RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&!c.retired&&
      (c.source===undefined||c.source<0||c.source<=tier));
    const fusions=RPG_FUSIONS.filter(c=>c.rpg&&c.fusionOnly&&!c.ace&&!c.retired&&
      (c.source===undefined||c.source<0||c.source<=tier));
    for(let i=0;i<kinds.length;i++){
      const kind=kinds[i];
      const score=c=>kind==='attack'?c.atk:
        kind==='balanced'?.52*c.atk+.48*c.def:
        kind==='defender'?c.def+(c.role==='guardian'?140:0)+(c.role==='soul'?100:0):
        c.def*.85+c.atk*.25+(c.role==='soul'?360:0)+(c.role==='guardian'?70:0);
      const deck=[...pool].sort((a,b)=>score(b)-score(a)).slice(0,20).flatMap(c=>[c.id,c.id]);
      const fusionScore=c=>kind==='attack'?c.atk:
         kind==='balanced'?c.atk+c.def:
         kind==='defender'?c.def+(c.role==='guardian'?1000:0):
         c.def+(c.role==='soul'?1400:0)+(c.role==='guardian'?300:0);
      const fusionDeck=[...fusions].sort((a,b)=>fusionScore(b)-fusionScore(a)).slice(0,15).map(c=>c.id);
      const stats={tier,kind,wins:0,losses:0,turns:0,fusions:0,errors:0,soulUses:0};
      for(let it=0;it<12;it++){
       try{
        const g=createGame({id:'oct17-full-'+kind+'-'+tier+'-'+it,mode:'pve',context:'tournament',
           difficulty:'easy',seed:711031+tier*1723+it*31+i*100003,starter:it%2,
           deck,fusionDeck});
        game=g;simulateGame(g,kind==='attack'?'offensive':kind==='balanced'?'balanced':'guardian');
        stats[g.winner===0?'wins':'losses']++;
        stats.turns+=g.turn;
        stats.fusions+=g.totalFusions[0]||0;
        stats.soulUses+=g.log.filter(s=>s.includes(' · Seelenraub auf ')).length;
        for(const p of g.players){
          if(!Number.isFinite(p.lp)||p.lp<0||p.lp>g.maxLP)throw Error('LP out of bounds');
          for(const c of p.field.filter(Boolean)){
           if(c.card?.atk>10000||c.card?.def>10000||c.card?.atk<0||c.card?.def<0)throw Error('Stat out of range');
          }
        }
       }catch(e){stats.errors++;errors.push({tier,kind,it,message:String(e)});}
      }
      rows.push({...stats,n:12,winPct:Math.round(stats.wins/12*100),
        avgTurns:Math.round(stats.turns/12*10)/10,avgFusions:Math.round(stats.fusions/12*10)/10});
    }
   }
   return {runtime:'all-index-scripts',battles:480,errors,rows,
    notes:['Synthetic card pools, not acquired through progression','Baseline AI does not use active soulRaid','Only the attack policy and basic AI turn selection are automated']};
 }.toString()+')()');
}
function career(seed,policy,plan){
 const b=boot({seed:seed+17});
 return b.run('('+function(seed,policy,plan){
   profile=freshProfile();profile.trainingWins=3;profile.guideSeen=true;
   let series=0,duels=0,wins=0,losses=0,shop=0,upgrades=0,crafts=0,fusions=0;
   const stages=[],errors=[];
   function equip(){
     const avail=Object.keys(profile.inventory).filter(id=>profile.inventory[id]>0).map(Number);
     const main=strongestMainDeck(avail,profile.enhancements,profile.inventory);
     const fusion=bestFusionDeck(avail,profile.enhancements,profile.inventory);
     if(main.length===40)profile.activeDeck=main;
     if(fusion.length>=2)profile.fusionDeck=fusion;
   }
   function spend(){
     if(plan==='minimal')return;
     let tier=Math.max(0,...profile.cleared);
     // Real purchase functions enforce coins, tier caps, and ownership.
     if(profile.coins>=boosterPrice(tier,5)+25 && duels%3===0){
      if(buyBooster(5))shop++;
     }
     if(duels%5===0){
      for(const k of (policy==='guardian'?['schildwall','power','starter']:['jagdinstinkt','power','starter'])){
       if(profile.coins>=upgradeCost(k)+25 && buyUpgrade(k)){upgrades++;break;}
      }
     }
     if(duels%7===0){
      const pool=CARDS.filter(c=>c.rpg&&!c.retired&&!c.fusionOnly&&!c.essenceMonster&&!c.ace&&
         c.source>=0&&c.source<=tier&&cardAvailable(c.id)&&
         profile.coins>=cardCost(c.id)+30&&sharedShards()>=SHARD_CRAFT_COST)
         .sort((a,b)=>(b.atk+b.def)-(a.atk+a.def));
      if(pool.length&&craftCard(pool[0].id))crafts++;
     }
     equip();
   }
   for(let tier=1;tier<=10;tier++){
    let victory=false,tries=0;
    for(let it=0;it<22;it++){
      try{
        const g=createGame({id:'qa-real-'+seed+'-'+policy+'-'+plan+'-'+tier+'-'+it,
         mode:'pve',context:'tournament',opponentId:tier,difficulty:'easy',
         seed:seed*10007+tier*719+it*29,starter:it%2,
         deck:profile.activeDeck,fusionDeck:profile.fusionDeck,enhancements:profile.enhancements});
        game=g;
        simulateGame(g,policy);
        duels++;tries++;fusions+=g.totalFusions[0]||0;
        const success=g.winner===0;wins+=success?1:0;losses+=success?0:1;
        const rew=rewardMatch(g);
        if(!rew)throw Error('Reward not granted');
        if(success){victory=true;series++;break;}
        if(it%2===1)spend();
      }catch(e){errors.push({tier,it,message:String(e)});break;}
    }
    stages.push({tier,tries,win:victory,coins:profile.coins,level:playerLevel(profile)});
    if(!victory||errors.length)break;
    spend();
   }
   let validSave=true,validError=null;
   try{validateProfile(JSON.parse(JSON.stringify(profile)));}
   catch(e){validSave=false;validError=String(e);}
   return {seed,policy,plan,cleared:series,full:series===10,duels,wins,losses,
    fusions,shop,upgrades,crafts,coins:profile.coins,level:playerLevel(profile),
    stages,errors,validSave,validError};
 }.toString()+')('+JSON.stringify(seed)+','+JSON.stringify(policy)+','+JSON.stringify(plan)+')');
}
const singlesOutput=singles();
console.log('QA_20261017_FULL_SINGLES '+JSON.stringify(singlesOutput));
const careers=[];
for(const plan of ['minimal','invest'])for(const policy of ['balanced','guardian','offensive'])
 for(const seed of [31,47,89])careers.push(career(seed,policy,plan));
const compact={careers:careers.length,full:careers.filter(x=>x.full).length,
 errors:careers.flatMap(x=>x.errors),invalid:careers.filter(x=>!x.validSave),
 rows:careers.map(x=>({seed:x.seed,policy:x.policy,plan:x.plan,cleared:x.cleared,
 full:x.full,duels:x.duels,losses:x.losses,fusions:x.fusions,shop:x.shop,
 upgrades:x.upgrades,crafts:x.crafts,level:x.level,stages:x.stages.map(y=>({t:y.tier,n:y.tries,w:y.win}))}))};
console.log('QA_20261017_FULL_CAREERS '+JSON.stringify(compact));
if(singlesOutput.errors.length||compact.errors.length||compact.invalid.length)process.exitCode=1;
