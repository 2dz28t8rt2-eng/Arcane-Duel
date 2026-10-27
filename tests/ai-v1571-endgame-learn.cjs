'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const prev=process.env.ARCANE_PREVIOUS_ARTIFACT_DIR,root='artifacts/v1571';
assert.ok(prev&&fs.existsSync(prev));fs.mkdirSync(root,{recursive:true});
const groups=new Map();let games=0,failures=0,actions=0;const sources=[4,7,8];
for(const stage of sources){
 const t=JSON.parse(fs.readFileSync(path.join(prev,'stage-'+stage+'-train-actions.json'),'utf8'));
 const s=JSON.parse(fs.readFileSync(path.join(prev,'stage-'+stage+'.json'),'utf8'));
 assert.equal(t.examples.length,s.allCases.filter(x=>x.split==='train').length);
 for(const duel of t.examples){
  if(!['defender-v1569-mixed-control','defender-v1569-endgame-control'].includes(duel.arm))continue;
  games++;if(duel.win!==1)failures++;
  const seen=new Set();
  for(const a of duel.actions||[]){
   if(a.turn<duel.turn-8||a.phase!=='attacks'||
    !['attack','soul-raid','soul-discharge'].includes(a.type)||
    !['soul','guardian'].includes(duel.roleA)||
    !(a.ownLP<=2300||a.enemyLP<=1800)||!Array.isArray(a.enemyRoles))continue;
   const key=[duel.roleA,a.enemyRoles.includes('soul')?'soul':'other',
    a.ownLP<=1000?'desperate':'critical',a.type].join('|');
   if(seen.has(key))continue;seen.add(key);actions++;
   const rec=groups.get(key)||{wins:0,losses:0};
   if(duel.win===1)rec.wins++;else rec.losses++;
   groups.set(key,rec);
  }
 }
}
const aggregate=new Map();
for(const [key,r] of groups){
 const g=key.split('|').slice(0,3).join('|'),v=aggregate.get(g)||{wins:0,losses:0};
 v.wins+=r.wins;v.losses+=r.losses;aggregate.set(g,v);
}
const learned={};
for(const [key,r] of groups){
 const v=aggregate.get(key.split('|').slice(0,3).join('|'));
 const n=r.wins+r.losses,m=v.wins+v.losses-n;
 const p=(r.wins+4)/(n+8),q=(v.wins-r.wins+4)/(m+8);
 learned[key]={n,wins:r.wins,losses:r.losses,delta:n>=8&&m>=8?
  Math.round(Math.max(-100,Math.min(100,(p-q)*230*n/(n+30)))):0};
}
const data={schema:'arcane-v1571-endgame-trained-context',sourceRun:40477542888,
 sources,split:'train',outcomeAssociationNotCausality:true,holdoutUsed:false,
 validationUsed:false,games,failures,actions,learned,
 nonzero:Object.values(learned).filter(v=>v.delta!==0).length};
console.log('ARCANE_V1571_ENDGAME_IMPORT '+JSON.stringify({games,failures,actions,nonzero:data.nonzero}));
assert.ok(games>=500&&failures>100&&actions>200&&data.nonzero>=3);
fs.writeFileSync(root+'/endgame-learner.json',JSON.stringify(data,null,2)+'\n');
console.log('ENDGAME_TRAIN_V1569 '+JSON.stringify({games,failures,actions,nonzero:data.nonzero}));
