'use strict';
/* v15.76: controlled tactical curriculum, not ordinary complete duels.
 * A 3/4/5 material fusion is genuinely created via prepareHandFusion, attacks,
 * and then faces the real engine's Predator response. Each situation is mirrored.
 * No player meta perks, artificial stat edits, or changes to production AI.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');

function study(config){
 profile=freshProfile();profile.guideSeen=true;
 for(const key of Object.keys(profile.upgrades||{}))profile.upgrades[key]=0;
 const n=config.samples,materials=config.materials,scenario=config.scenario;
 const rows=[],problems=[];
 const allowed=RPG_BASE_CARDS.filter(c=>!c.ace&&!c.essenceMonster&&c.level>=3&&c.level<=10);
 const fusionPool=RPG_FUSIONS.filter(c=>!c.ace&&!c.essenceMonster&&c.level>=4&&c.level<=10);
 const roleOf=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const pick=(list,seed)=>list[((seed%list.length)+list.length)%list.length];
 if(!fusionPool.length||!allowed.length)throw Error('No legal RPG catalog');
 const wantedRoles=['predator','resonator','combatant','guardian','soul'];
 function pool(role,level){const same=allowed.filter(c=>c.role===role&&c.level===level);
  if(same.length)return same;
  const nearby=allowed.filter(c=>c.role===role&&Math.abs(c.level-level)<=2);
  if(nearby.length)return nearby;
  return allowed.filter(c=>c.role===role);
 }
 function choose(role,level,seed){const a=pool(role,level);return pick(a.length?a:allowed,seed);}
 function completeDeck(head,seed){
  const result=[...head],counts=new Map();for(const id of result)counts.set(id,(counts.get(id)||0)+1);
  const candidates=allowed.filter(c=>c.level>=4&&c.level<=10);
  for(let i=0;result.length<40&&i<5000;i++){
   const c=pick(candidates,seed+i*113+Math.floor(i/7)*19);
   if((counts.get(c.id)||0)>=3)continue;
   result.push(c.id);counts.set(c.id,(counts.get(c.id)||0)+1);
  }
  if(result.length!==40)throw Error('Cannot build complete legal deck');
  return result;
 }
 function setup(seed){
  const tier=6+(seed%4),pressure=[-1,0,1,2][scenario];
  const materialIds=[];
  for(let i=0;i<5;i++){
   const role=wantedRoles[(seed+i*3)%wantedRoles.length];
   materialIds.push(choose(role,Math.max(3,tier-(i%2)),seed*17+i*31).id);
  }
  const predatorIds=[];
  for(let i=0;i<5;i++){
   const role=scenario===1&&[1,3].includes(i)?'guardian':
    scenario===2&&i===2?'soul':'predator';
   // Center is a comparatively fragile front-line target; reserve the
   // dangerous Predator behind it to test the actual post-Stomp reply window.
   const level=i===2?Math.max(3,tier-2):Math.min(10,Math.max(4,tier+pressure+(i%2)));
   predatorIds.push(choose(role,level,seed*23+i*43).id);
  }
  const fusionDeck=fusionPool.slice().sort((a,b)=>b.level-a.level||a.id-b.id)
   .filter((c,i)=>i%Math.max(1,Math.floor(fusionPool.length/15))===0)
   .slice(0,15).map(c=>c.id);
  const a=completeDeck(materialIds,seed*101+3);
  const b=completeDeck(predatorIds,seed*101+79);
  const g=createGame({mode:'pve',context:'free',opponentId:0,difficulty:'hard',seed:seed+157600,
   starter:seed%2,deck:a,fusionDeck,
   enemy:{deck:b,fusionDeck,enhancements:{},power:1,flatBonus:0},
   strategicTraining:{enabled:true,noAttackTurns:0,disableArenaLPDecay:true,
    symmetricSides:true,predatorSwarmPercent:.02,predatorArmorPierce:.10}});
  if(!g.strategicTraining?.symmetricSides)throw Error('Parity protection absent');
  g.turn=12;g.active=0;g.winner=null;g.pending=null;g.fateUsed=[true,true];g.aiPhase='actions';
  for(const p of g.players){p.field=[null,null,null,null,null];p.shield=0;
   p.power=1;p.flatBonus=0;p.enhancements={};p.lp=10000;p.researchSymmetric=true;}
  g.players[0].hand=materialIds.map(id=>newInstance(g,id,0));
  g.players[0].deck=a.slice(5);g.players[0].originalDeck=[...a];
  g.players[0].fusionDeck=[...fusionDeck];g.players[0].remainingFusion=[...fusionDeck];
  g.players[1].hand=[];g.players[1].deck=b.slice(5);g.players[1].originalDeck=[...b];
  const p=g.players[0],selected=p.hand.slice(0,materials);
  const levels=selected.map(c=>dataOf(c).level);
  let options=fusionOptions(g,levels,selected).filter(c=>canCompleteHandFusion(g,levels,c.id));
  // Some generated high-level templates may be too expensive for low rolls;
  // choose a legal existing form, never invent or raise any stats.
  if(!options.length){
   const more=fusionPool.filter(c=>c.level<=fusionBudget(levels,g,selected)).sort((x,y)=>y.level-x.level);
   if(!more.length)throw Error('No legal fusion for materials');
   // Replace an owned deck slot before the setup, keeping the exact legal
   // 2..15 card stock rather than granting an extra copy mid-duel.
   p.fusionDeck[0]=more[0].id;p.remainingFusion[0]=more[0].id;
   options=fusionOptions(g,levels,selected).filter(c=>canCompleteHandFusion(g,levels,c.id));
  }
  if(!options.length)throw Error('No selectable legal fusion');
  if(fusionDeckError(p.fusionDeck)||mainDeckError(a)||mainDeckError(b))
   throw Error('Generated a deck violating the real deck rules');
  const target=options.sort((x,y)=>y.level-x.level||y.atk-x.atk)[0];
  if(!prepareHandFusion(g,selected.map(c=>c.uid),target.id))throw Error('Real fusion failed');
  if(!g.pending?.card)throw Error('Fusion never entered pending state');
  if(!placePending(g,2))throw Error('Real fusion could not be placed');
  const fused=g.players[0].field[2];
  if(!fused?.fusion||fused.materialsUsed!==materials)throw Error('Material count not carried');
  for(let i=0;i<5;i++){
   // The seeded setup represents existing creatures after warmup. Every
   // instance is a real deck card, with unmodified live catalog stats.
   const c=newInstance(g,predatorIds[i],1);c.mode=scenario===1&&[1,3].includes(i)?'def':'atk';
   c.attacked=false;c.summonedTurn=6;g.players[1].field[i]=c;
  }
  return {g,seed,tier,pressure,attackIndex:2,materials,sourceMaterialIds:materialIds.slice(0,materials),
   fusionId:target.id,fusionLevel:fused.card.level};
 }
 function flip(source){
  const g=JSON.parse(JSON.stringify(source));g.players.reverse();
  for(let i=0;i<2;i++){g.players[i].id=i;g.players[i].field.reverse();}
  for(const k of ['totalFusions','fateUsed','damageDealt','soulConsumed'])
   if(Array.isArray(g[k])&&g[k].length===2)g[k].reverse();
  g.active=1-g.active;g.starter=1-g.starter;
  if(g.tiePriority===0||g.tiePriority===1)g.tiePriority=1-g.tiePriority;
  return g;
 }
 function signature(g,fusionSeat){
  const original=g.players[fusionSeat],foe=g.players[1-fusionSeat];
  const norm=(field,reverse)=>{
   const cards=field.map(c=>c?{id:c.id,mode:c.mode,atk:c.card?.atk,def:c.card?.def,
    materials:c.materialsUsed||0,attacked:!!c.attacked}:null);
   return reverse?cards.reverse():cards;
  };
  return {lpFusion:original.lp,lpPredator:foe.lp,
   fusionField:norm(original.field,fusionSeat===1),
   predatorField:norm(foe.field,fusionSeat===1),winner:g.winner===null?null:g.winner===fusionSeat?'fusion':'predator'};
 }
 function predatorReply(g,policy,seed){
  const predatorSeat=g.active,enemySeat=1-predatorSeat,stats={attempts:0,vsFusion:0,kills:0,
   damageFusionAtk:0,damageFusionDef:0,ownLpLost:0,predatorSurvivors:0};
  const max=3,beforeLP=g.players[predatorSeat].lp;
  for(let turn=0;turn<max&&g.winner===null;turn++){
   const own=g.players[predatorSeat],foe=g.players[enemySeat];let action=null;
   if(policy==='native'){
    const candidate=attackPlan(g);
    if(candidate&&Number.isInteger(candidate.ai))action={ai:candidate.ai,di:candidate.di};
   }else{
    let best=-Infinity;
    for(let ai=0;ai<own.field.length;ai++){
     const actor=own.field[ai];if(!actor||roleOf(actor)!=='predator'||!canAttack(g,actor))continue;
     for(let di=0;di<foe.field.length;di++){
      const victim=foe.field[di];if(!victim)continue;
      const trial=JSON.parse(JSON.stringify(g));let result=null;
      try{result=attack(trial,ai,di);}catch(_){continue;}
      if(!result)continue;
      const targetAfter=trial.players[enemySeat].field[di];
      const removed=!targetAfter||targetAfter.uid!==victim.uid;
      const isLarge=victim.fusion&&(victim.materialsUsed||0)>=3;
      const lossAtk=removed?victim.card.atk:Math.max(0,victim.card.atk-targetAfter.card.atk);
      const lossDef=removed?victim.card.def:Math.max(0,victim.card.def-targetAfter.card.def);
      const lossLp=Math.max(0,g.players[enemySeat].lp-trial.players[enemySeat].lp);
      const myLossLp=Math.max(0,g.players[predatorSeat].lp-trial.players[predatorSeat].lp);
      const self=trial.players[predatorSeat].field[ai];
      const selfLost=!self||self.uid!==actor.uid;
      const score=(removed?350:0)+(isLarge&&removed?1000:0)+lossAtk*.45+
       lossDef*.30+lossLp*.65-myLossLp*.65-(selfLost?actor.card.atk*.65:0);
      if(score>best){best=score;action={ai,di};}
     }
    }
    // The experimental tactic never pretends an illegal attack is possible.
    if(!action){const candidate=attackPlan(g);
     if(candidate&&Number.isInteger(candidate.ai))action={ai:candidate.ai,di:candidate.di};}
   }
   if(!action)break;
   const attacker=own.field[action.ai];
   const t=Number.isInteger(action.di)?foe.field[action.di]:null;
   const before=t?{uid:t.uid,atk:t.card.atk,def:t.card.def}:null;
   const wasLarge=roleOf(attacker)==='predator'&&t?.fusion&&(t.materialsUsed||0)>=3;
   const result=attack(g,action.ai,action.di);
   if(!result)break;
   stats.attempts++;
   if(wasLarge){stats.vsFusion++;const after=foe.field[action.di],killed=!after||after.uid!==before.uid;
    if(killed)stats.kills++;
    stats.damageFusionAtk+=killed?before.atk:Math.max(0,before.atk-after.card.atk);
    stats.damageFusionDef+=killed?before.def:Math.max(0,before.def-after.card.def);
   }
  }
  stats.ownLpLost=Math.max(0,beforeLP-g.players[predatorSeat].lp);
  stats.predatorSurvivors=g.players[predatorSeat].field.filter(c=>c&&roleOf(c)==='predator').length;
  return stats;
 }
 for(let idx=0;idx<n;idx++){
  const seed=config.start+idx;
  const state=setup(seed);
  const perSeat=[];
  for(const seat of [0,1]){
   const g=seat===0?JSON.parse(JSON.stringify(state.g)):flip(state.g);
   g.active=seat;g.aiPhase='attacks';g.summoned=false;
   const enemySeat=1-seat;
   const before=g.players[seat].field[seat===0?2:2];
   const beforeAtk=before.card.atk,beforeDef=before.card.def;
   const result=attack(g,2,2);
   if(!result)throw Error('Stomp opener not legal for '+seed+'/'+seat);
   const hits=result.stomp?.hits||[],fallen=hits.filter(h=>h.destroyed).length;
   const after=g.players[seat].field[2];
   const op={hits:hits.length,kills:fallen,defDamage:hits.reduce((s,h)=>s+(h.defLost||0),0),
    counterLp:hits.reduce((s,h)=>s+(h.counter||0),0),
    fusionDiedInAttack:!after,
    atkFatigue:after?beforeAtk-after.card.atk:null,
    defFatigue:after?beforeDef-after.card.def:null};
   const sig=signature(g,seat);
   g.active=enemySeat;g.turn++;g.aiPhase='attacks';
   for(const c of g.players[enemySeat].field)if(c)c.attacked=false;
   const variants={};
   for(const policy of ['native','reply-aware']){
    const trial=JSON.parse(JSON.stringify(g));
    const events=predatorReply(trial,policy,seed);
    const boss=trial.players[seat].field[2];
    variants[policy]={...events,bossAlive:!!boss,final:signature(trial,seat)};
   }
   perSeat.push({seat,op,signature:sig,variants});
  }
  const openingEqual=JSON.stringify(perSeat[0].signature)===JSON.stringify(perSeat[1].signature);
  const stompEqual=JSON.stringify(perSeat[0].op)===JSON.stringify(perSeat[1].op);
  const responseEqual=Object.fromEntries(['native','reply-aware'].map(policy=>
   [policy,JSON.stringify(perSeat[0].variants[policy].final)===JSON.stringify(perSeat[1].variants[policy].final)]));
  const responseImpactEqual=Object.fromEntries(['native','reply-aware'].map(policy=>{
   const keys=['attempts','vsFusion','kills','damageFusionAtk','damageFusionDef','ownLpLost','bossAlive'];
   const mapped=x=>keys.map(k=>x[k]);
   return [policy,JSON.stringify(mapped(perSeat[0].variants[policy]))===
    JSON.stringify(mapped(perSeat[1].variants[policy]))];
  }));
  if(!openingEqual||!stompEqual||Object.values(responseEqual).includes(false)){
   if(problems.length<25)problems.push({seed,materials,scenario,openingEqual,stompEqual,responseEqual,responseImpactEqual,
    left:perSeat[0],right:perSeat[1]});
  }
  rows.push({seed,materials,scenario,tier:state.tier,pressure:state.pressure,
   fusionLevel:state.fusionLevel,fusionId:state.fusionId,
   openingEqual,stompEqual,responseEqual,responseImpactEqual,
   seats:perSeat.map(x=>({seat:x.seat,op:x.op,
    native:{attempts:x.variants.native.attempts,vsFusion:x.variants.native.vsFusion,
     kills:x.variants.native.kills,bossAlive:x.variants.native.bossAlive,
     damageFusionAtk:x.variants.native.damageFusionAtk,
     damageFusionDef:x.variants.native.damageFusionDef,
     predatorSurvivors:x.variants.native.predatorSurvivors},
    replyAware:{attempts:x.variants['reply-aware'].attempts,vsFusion:x.variants['reply-aware'].vsFusion,
     kills:x.variants['reply-aware'].kills,bossAlive:x.variants['reply-aware'].bossAlive,
     damageFusionAtk:x.variants['reply-aware'].damageFusionAtk,
     damageFusionDef:x.variants['reply-aware'].damageFusionDef,
     predatorSurvivors:x.variants['reply-aware'].predatorSurvivors}}))});
 }
 return {version:'15.76',samples:n,materials,scenario,rows,problems,
  note:'Controlled legal-fusion tactical positions, not complete natural 40-card matches'};
}

function run(args){
 const config={materials:Number(args[0]),scenario:Number(args[1]),start:Number(args[2]),samples:Number(args[3]||256)};
 assert.ok([3,4,5].includes(config.materials));assert.ok([0,1,2,3].includes(config.scenario));
 assert.ok(Number.isInteger(config.start)&&config.start>=0);
 assert.ok(Number.isInteger(config.samples)&&config.samples>=1&&config.samples<=512);
 const runtime=boot({seed:157600+config.start});
 const data=runtime.run('('+study.toString()+')('+JSON.stringify(config)+')',300000);
 assert.equal(data.samples,config.samples);
 const directory=path.join(__dirname,'..','artifacts','v1576');fs.mkdirSync(directory,{recursive:true});
 const out=path.join(directory,`size-${config.materials}-scenario-${config.scenario}-start-${config.start}.json`);
 fs.writeFileSync(out,JSON.stringify(data));
 const mismatches=data.rows.filter(r=>!r.openingEqual||!r.stompEqual||!r.responseEqual.native||!r.responseEqual['reply-aware']).length;
 const targetAttacks=data.rows.reduce((sum,r)=>sum+r.seats.reduce((n,x)=>n+x.replyAware.vsFusion,0),0);
 console.log(JSON.stringify({out,scenarios:data.rows.length,mismatches,targetAttacks}));
 return data;
}
if(require.main===module)run(process.argv.slice(2));
module.exports={run,study};
