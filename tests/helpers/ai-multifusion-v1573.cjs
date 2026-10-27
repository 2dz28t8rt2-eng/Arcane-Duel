'use strict';
/* Research-only multi-material fusion search. All outcomes come from a cloned,
 * legal game action; no free materials, bonus stats or production-AI changes.
 * Keep bounded tactical previews so the large paired curriculum is affordable.
 */
const assert=require('node:assert/strict');

function combinations(cards,size){
 const result=[];
 function walk(start,current){
  if(current.length===size){result.push([...current]);return;}
  for(let i=start;i<=cards.length-(size-current.length);i++){
   current.push(cards[i]);walk(i+1,current);current.pop();
  }
 }
 walk(0,[]);return result;
}

function enumerateLargeFusions({game,own,profile,cardValue,dataOf,isFateCard,
 fusionOptions,canCompleteHandFusion,applyAiAction,role,guardianCount=0,soulCount=0,
 maxPerSize=3}){
 const bySize={3:{legal:0,previewed:0,accepted:0},
  4:{legal:0,previewed:0,accepted:0},5:{legal:0,previewed:0,accepted:0}};
 const hand=own.hand.filter(c=>!isFateCard(c));
 if(hand.length<3)return {choices:[],bySize};
 const actor=game.active,choices=[];
 for(let size=3;size<=Math.min(5,hand.length);size++){
  const preliminary=[];
  for(const materials of combinations(hand,size)){
   const levels=materials.map(c=>dataOf(c).level);
   const templates=fusionOptions(game,levels,materials)
    .filter(c=>canCompleteHandFusion(game,levels,c.id))
    .sort((a,b)=>b.level-a.level||b.atk-a.atk).slice(0,3);
   for(const template of templates){
    bySize[size].legal++;
    const raw=cardValue({id:template.id,card:{...template}});
    const spent=materials.reduce((n,c)=>n+cardValue(c),0);
    preliminary.push({materials,template,
     score:raw-spent*profile.materialCost,
     pattern:[...levels].sort((a,b)=>a-b).join(',')});
   }
  }
  // Sample high-value opportunities with different material-level patterns;
  // the final decision still competes honestly against ordinary summons/pairs.
  preliminary.sort((a,b)=>b.score-a.score||a.template.id-b.template.id);
  const selected=[],patterns=new Set();
  for(const candidate of preliminary){
   if(selected.length>=maxPerSize)break;
   if(patterns.has(candidate.pattern)&&preliminary.some(c=>!patterns.has(c.pattern)))continue;
   selected.push(candidate);patterns.add(candidate.pattern);
  }
  for(const candidate of selected){
   bySize[size].previewed++;
   const action={type:'fusion',uids:candidate.materials.map(c=>c.uid),choice:candidate.template.id};
   const trial=JSON.parse(JSON.stringify(game));
   let legal=false;
   try{
    legal=!!applyAiAction(trial,action);
    if(legal&&trial.pending){
     const target=trial.players[actor].field.findIndex(c=>!c);
     legal=target>=0&&!!applyAiAction(trial,{type:'place',idx:target});
    }
   }catch(_){legal=false;}
   if(!legal)continue;
   const produced=trial.players[actor].field.find(c=>c&&c.id===candidate.template.id&&
    !own.field.some(original=>original?.uid===c.uid));
   if(!produced)continue;
   const spent=candidate.materials.reduce((n,c)=>n+cardValue(c),0);
   const resultValue=cardValue(produced);
   const kind=role(produced);
   const synergy=kind==='soul'?guardianCount*profile.synergy*260:
    kind==='guardian'?soulCount*profile.synergy*260:0;
   // The actual rolled and role-inherited fusion replaces static template
   // estimates. Additional material cards are still fully charged at the
   // same rate as the untouched 2-material baseline.
   choices.push({a:action,score:resultValue+synergy-spent*profile.materialCost});
   bySize[size].accepted++;
  }
 }
 assert.ok(choices.every(c=>c.a.uids.length>=3&&c.a.uids.length<=5));
 return {choices,bySize};
}
module.exports={combinations,enumerateLargeFusions};
