/* Offline-only: exact proven v6.6 soul-bridge deckbuilder, extracted
 * unchanged from the independently validated v6.6 evaluator.
 * Evaluates actual inventory and uses setActiveDeck/setFusionDeck APIs.
 */
'use strict';
const soulBridgeCode=String.raw`
 const beforeMain=[...profile.activeDeck],beforeFusion=[...profile.fusionDeck];
 const legal=main=>!mainDeckError(main)&&!inventoryError(main,profile.inventory);
 if(!legal(beforeMain)||fusionDeckError(beforeFusion)||
   inventoryError(beforeFusion,profile.inventory))
  throw Error('Input career deck is not actually owned');
  const style='soul-bridge',ids=[...new Set(profile.unlocked)].filter(id=>
   !!CARDS[id]&&!CARDS[id].fusionOnly&&
   (profile.inventory[id]||0)>0);
  const fusions=[...new Set(profile.fusionOwned)].filter(id=>
   CARDS[id]?.fusionOnly&&(profile.inventory[id]||0)>0);
  const maxMaterial=Math.max(...ids.map(id=>CARDS[id].level));
  // A two-card fusion requires at least a material of level target-2.
  // Higher-level templates that cannot be reached are deprioritized.
  const target=fusions.map(id=>CARDS[id])
   .filter(t=>t.level<=Math.min(10,maxMaterial+2))
   .sort((a,b)=>(b.atk+b.def+175*b.level)-
      (a.atk+a.def+175*a.level))[0]||null;
  const rank=c=>{
   const a=c.atk||0,d=c.def||0,r=c.role||'',lv=c.level||1;
   const bonus=style==='soul-bridge'?d*1.28+a*.54+(r==='soul'?670:0)+(r==='guardian'?230:0):
    style==='predator-bridge'?a*1.65+d*.35+(r==='predator'?490:0):
    style==='signature'?a*.9+d*.85+lv*165:
    a+d*.9+lv*130;
   // This *bridge* score values material pairs usable for a legally owned,
   // reachable fusion, not only the largest normal creature on its own.
   const bridge=target?Math.max(0,Math.min(2,lv-(target.level-3)))*230:0;
   const upgraded=(profile.enhancements[c.id]||0)*45;
   return bonus+upgraded+bridge;
  };
  ids.sort((x,y)=>rank(CARDS[y])-rank(CARDS[x])||x-y);
  const chosen=[];for(const id of ids)for(let n=0;n<Math.min(3,profile.inventory[id]||0);n++){
   if(chosen.length<40)chosen.push(id);
  }
  let changed=false,mainChanged=false,fusionChanged=false;
  if(style!=='baseline'&&chosen.length===40&&legal(chosen)){
   const a=beforeMain.slice().sort((x,y)=>x-y).join(',');
   const b=chosen.slice().sort((x,y)=>x-y).join(',');
   if(a!==b){
    if(!setActiveDeck(chosen))throw Error('Legal owned main deck rejected');
    changed=mainChanged=true;
   }
   const material=profile.activeDeck.map(id=>CARDS[id].level);
   const reach=card=>{
    let ways=0;
    for(let i=0;i<material.length;i++)for(let j=i+1;j<material.length;j++){
     const max=Math.max(material[i],material[j]);
     if(Math.min(12,material[i]+material[j],max+2)>=card.level)ways++;
    }
    return ways/Math.max(1,material.length*(material.length-1)/2);
   };
   const sortedFusion=fusions.map(id=>({id,card:CARDS[id]}))
    .sort((x,y)=>{
     const fitness=p=>{
      const good=reach(p.card),risk=good>0?0:-750;
      const roleFit=style==='soul-bridge'&&p.card.role==='soul'?250:0;
      return p.card.level*135+(p.card.atk+p.card.def)*.6+
       good*1100+risk+roleFit;
     };
     return fitness(y)-fitness(x)||x.id-y.id;
    });
   const picked=[],fusedCount={};
   for(const p of sortedFusion){
    const max=Math.min(3,profile.inventory[p.id]||0);
    while(picked.length<15&&(fusedCount[p.id]||0)<max){
     picked.push(p.id);fusedCount[p.id]=(fusedCount[p.id]||0)+1;
    }
   }
   if(picked.length>=2&&!fusionDeckError(picked)&&
    !inventoryError(picked,profile.inventory)){
    const a=beforeFusion.slice().sort((x,y)=>x-y).join(',');
    const b=picked.slice().sort((x,y)=>x-y).join(',');
    if(a!==b){
     if(!setFusionDeck(picked))throw Error('Legal owned fusion deck rejected');
     changed=fusionChanged=true;
    }
   }
  }

 if(!legal(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||
  inventoryError(profile.fusionDeck,profile.inventory))
  throw Error('Soul bridge selected illegal or unowned deck');
 return {changed,mainChanged,fusionChanged};
`;
module.exports={soulBridgeCode};
