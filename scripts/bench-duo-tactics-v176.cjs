'use strict';
/* v17.6: offline, reproducible earned-card career test for human heuristics.
 * Two scripted humans against the unchanged two live NPC policies. This is
 * not AI training, not a multiplayer acceptance test, and not a win-rate
 * estimate for humans. Includes legal fusion, positioning and Soul actions.
 */
const rules=require('../assets/duo-shared-rules-v160.js');
const economy=require('../assets/duo-economy-v172.js');
const data=require('../assets/duo-card-catalog-v160.json');
const earned=require('./bench-duo-earned-v175.cjs');
const catalog=Object.fromEntries(data.cards.map(c=>[c.id,c]));
const attack=c=>rules.attackValue(c);
const monster=id=>catalog[id];

function pickFusion(g,seat){
 const p=g.players[seat],free=p.field.findIndex(x=>!x);
 if(p.summoned||free<0||p.hand.length<2||!p.remainingFusion.length)return null;
 const hand=p.hand.map((x,index)=>({id:Number.isInteger(x)?x:x?.id,index}))
  .filter(x=>Number.isInteger(x.id)&&monster(x.id)?.playable);
 const strongest=Math.max(0,...hand.map(x=>monster(x.id).atk));
 let best=null;
 for(let i=0;i<hand.length;i++)for(let j=i+1;j<hand.length;j++){
  const materials=[{from:'hand',index:hand[i].index},{from:'hand',index:hand[j].index}];
  let options;
  try{options=rules.fusionOptions(g,seat,materials,catalog);}catch{continue;}
  for(const templateId of options.templates){
   let preview;
   try{preview=rules.fusionPreview(g,seat,materials,catalog,{templateId});}
   catch{continue;}
   const meanAtk=(preview.atk[0]+preview.atk[1])/2;
   const meanDef=(preview.def[0]+preview.def[1])/2;
   const score=meanAtk+.23*meanDef+preview.resultingLevel*10;
   if(!best||score>best.score)best={materials,templateId,slot:free,score,meanAtk};
  }
 }
 // A fusion sacrifices two physical cards and consumes a limited template.
 // Demand a significant combat upgrade over simply summoning the best card.
 return best&&best.meanAtk>=strongest*.75&&best.score>=strongest*.95?
  {type:'fusion',materials:best.materials,templateId:best.templateId,slot:best.slot}:null;
}
function enemies(g,seat){
 const team=g.players[seat].team;
 return g.players.filter(p=>p.team!==team).flatMap(p=>p.field
  .map((c,slot)=>c?{seat:p.seat,slot,c}:null).filter(Boolean));
}
function bestAttack(g,seat,src){
 const foes=enemies(g,seat);
 if(!foes.length)return {targetSeat:null,targetSlot:null};
 const raw=attack(src),pred=src.role==='predator';
 const options=foes.map(x=>{
  if(x.c.mode==='atk')return {...x,damage:raw-attack(x.c),cost:attack(x.c)};
  const shield=x.c.def+(x.c.soul||0)+(x.c.condensed||0);
  const net=Math.floor(raw*(pred?.75:.65));
  const counter=['guardian','soul'].includes(x.c.role)?Math.floor(attack(x.c)*.5):0;
  return {...x,damage:net-counter*.65-shield*.14,cost:shield};
 }).sort((a,b)=>b.damage-a.damage||a.cost-b.cost);
 return options[0]?.damage>0?{targetSeat:options[0].seat,targetSlot:options[0].slot}:null;
}
function tactician(style){
 if(style==='simple')return earned.humanTurn;
 return function human(g,seat){
  const p=g.players[seat];
  // Use stored Soul energy while the creature is still in DEF. This does
  // not consume its attack; switching/attacking afterward is still legal.
  if(style==='defense'||style==='hybrid'){
   for(let slot=0;slot<7;slot++){
    const c=g.players[seat].field[slot];
    if(c?.role==='soul'&&c.mode==='def'&&c.soul>=40&&c.soulCooldown===0&&
       c.lastSoulAction!==g.players[seat].ownTurns){
     g=rules.apply(g,seat,{type:'soulCondense',slot},{catalog});
    }
   }
  }
  if(!g.players[seat].summoned){
   let chosen=null;
   if(style==='fusion'||style==='hybrid')chosen=pickFusion(g,seat);
   if(chosen){try{g=rules.apply(g,seat,chosen,{catalog});}catch{chosen=null;}}
   if(!chosen){
    const now=g.players[seat],free=now.field.findIndex(x=>!x);
    const cards=now.hand.map((id,i)=>({id:Number.isInteger(id)?id:id?.id,i}))
     .filter(x=>monster(x.id)?.playable);
    const defensive=style==='defense';
    cards.sort((a,b)=>{
     const score=x=>{const c=monster(x.id);return defensive?
      c.def+(c.role==='soul'?260:c.role==='guardian'?180:0)+c.atk*.12:
      c.atk+c.def*.12;};
     return score(b)-score(a)||a.id-b.id;
    });
    if(free>=0&&cards[0])g=rules.apply(g,seat,
     {type:'summon',handIndex:cards[0].i,slot:free},{catalog});
   }
  }
  if(style==='defense'||style==='hybrid'){
   // Keep Souls/Guardians in DEF for absorption and counterstrikes; switch a
   // condensed Soul to ATK only if a direct or favorable attack is available.
   for(let slot=0;slot<7;slot++){
    const c=g.players[seat].field[slot];if(!c||c.used||c.switched)continue;
    if(c.mode==='atk'&&(c.role==='soul'||style==='defense'&&c.role==='guardian')){
     g=rules.apply(g,seat,{type:'switch',slot},{catalog});
    }else if(c.mode==='def'&&c.role==='soul'&&c.condensed>0&&
     c.placedRound<g.round&&style==='hybrid'&&bestAttack(g,seat,c)){
     g=rules.apply(g,seat,{type:'switch',slot},{catalog});
    }
   }
  }
  for(let slot=0;slot<7&&g.status==='active';slot++){
   const c=g.players[seat].field[slot];
   if(!c||c.used||c.mode!=='atk'||c.placedRound>=g.round)continue;
   const target=bestAttack(g,seat,c);
   if(!target)continue;
   try{g=rules.apply(g,seat,{type:'attack',slot,...target},{catalog});}
   catch{} // No impossible move is forced into the state.
  }
  if(g.status==='active')g=rules.apply(g,seat,{type:'end'},{catalog});
  return rules.aiTurn(g,{catalog});
 };
}
function rebuildStyle(p,style){
 if(style==='simple'||style==='fusion'){earned.rebuild(p);return;}
 const score=id=>{const c=monster(id);return style==='defense'?
  c.def+(c.role==='soul'?300:c.role==='guardian'?200:0)+c.atk*.15:
  c.atk+.35*c.def+(c.role==='soul'?100:0);};
 p.deck=[...p.owned_main].sort((a,b)=>score(b)-score(a)||a-b).slice(0,40);
 if(!rules.validDeck(p.deck,catalog,false))throw Error('Illegal strategic owned deck');
}
function career(seed,style,plan){
 const policy=tactician(style),a=earned.profile(),b=earned.profile();
 const rands=[earned.rng(seed*17+1),earned.rng(seed*17+2)];
 let games=0,repeatFailures=0,lastRound=0,fusions=0,condenses=0;
 const fight=(chapter,serial)=>{
  games++;
  const r=earned.duel(a,b,chapter,seed*37+serial,policy);
  lastRound=r.round;fusions+=r.fusions||0;condenses+=r.condenses||0;
  return r.win;
 };
 if(!fight(1,1))return {stage:0,games,repeatFailures,lastRound,fusions,condenses};
 for(const [i,p] of [a,b].entries()){
  earned.award(p,1);earned.spendCredits(p,rands[i]);
  if(plan==='normal')earned.purchases(p,'normal',rands[i]);
  rebuildStyle(p,style);
 }
 if(plan==='farm-material'){
  for(let n=0;n<3;n++){
   if(!fight(1,2+n))return {stage:1,games,repeatFailures:++repeatFailures,lastRound,fusions,condenses};
   earned.award(a,1,true);earned.award(b,1,true);
  }
  for(const [i,p] of [a,b].entries()){
   earned.purchases(p,'material3',rands[i]);rebuildStyle(p,style);
  }
 }
 let stage=1;
 for(let chapter=2;chapter<=4;chapter++){
  if(!fight(chapter,5+chapter))break;
  stage=chapter;
  for(const [i,p] of [a,b].entries()){
   earned.award(p,chapter);earned.spendCredits(p,rands[i]);
   // Spend only genuinely held currencies; every new chapter is a new room.
   earned.purchases(p,'normal',rands[i]);rebuildStyle(p,style);
  }
 }
 return {stage,games,repeatFailures,lastRound,fusions,condenses};
}
function run(games=30){
 const out=[];
 for(const style of ['simple','fusion','defense','hybrid']){
  for(const plan of ['claims','normal','farm-material']){
   let completedI=0,completedII=0,completedIII=0,completedIV=0,
    matches=0,repeatFailures=0,fusions=0,condenses=0;
   for(let i=0;i<games;i++){
    const r=career(3000+i*29,style,plan);
    completedI+=r.stage>=1;completedII+=r.stage>=2;
    completedIII+=r.stage>=3;completedIV+=r.stage>=4;
    matches+=r.games;repeatFailures+=r.repeatFailures;
    fusions+=r.fusions;condenses+=r.condenses;
   }
   out.push({style,plan,careers:games,completedI,completedII,
    completedIII,completedIV,matches,repeatFailures,fusions,condenses});
  }
 }
 return out;
}
if(require.main===module){
 const games=Math.max(1,Math.min(300,Number(process.argv[2])||30));
 console.log('v17.6 earned-only 2v2 tactics; 2 scripted humans, unchanged 2 NPCs:');
 console.log(JSON.stringify(run(games),null,2));
}
module.exports={pickFusion,bestAttack,tactician,rebuildStyle,career,run};
