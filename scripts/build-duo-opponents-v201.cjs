'use strict';
/* Export the actual singleplayer PvE loadouts instead of inventing 2v2 decks.
 * Solo runtime boot executes the same scripts (and override order) as index.html.
 */
const fs=require('node:fs');
const path=require('node:path');
const {boot,repo,scripts}=require('../tests/helpers/game-runtime.cjs');
const runtime=boot({seed:160026});
const roster=runtime.run(`Array.from({length:10},(_,i)=>{
 const id=i+1,x=rpgEnemyLoadout(id,'easy'),o=OPPONENTS[id];
 return {id,name:o.name,level:o.level,policy:o.policy,power:x.power,
  style:x.style||o.policy,deck:[...x.deck],fusions:[...x.fusionDeck]};
})`);
const showcase=runtime.run(`(()=>{const x=showcaseEnemy();return {
 name:SHOWCASE_NAME,power:x.power,deck:[...x.deck],fusions:[...x.fusionDeck]};})()`);
const saga=runtime.run(`Array.from({length:5},(_,i)=>{
 const stage=i+1,profile=window.ArcaneLv1Saga.deckProfiles[stage];
 const normal=RPG_FUSIONS.filter(c=>c.rpg&&!c.ace&&!c.lv1Exclusive&&!c.retired&&!c.enemyOnly);
 const min=[0,1,1,3,4,5][stage],max=[0,2,3,5,6,8][stage];
 const preferred=normal.filter(c=>c.level>=min&&c.level<=max);
 const byRole=(a,b)=>{
  const ah=a.role==='predator'||a.essenceSchool==='predator'?1:0;
  const bh=b.role==='predator'||b.essenceSchool==='predator'?1:0;
  return stage>=3?bh-ah||b.atk-a.atk||b.level-a.level:
   a.level-b.level||a.atk+a.def-b.atk-b.def;
 };
 const ids=[...preferred.sort(byRole),...normal.filter(c=>!preferred.includes(c)).sort(byRole)]
  .slice(0,stage===5?14:15).map(c=>c.id);
 if(stage===5)ids.push(window.ArcaneLv1Saga.corruptedId);
 return {id:10+stage,name:profile.name,power:profile.power,lp:profile.lp,
  deck:window.ArcaneLv1Saga.fanaticDeck(stage),fusions:ids};
})`);
for(const p of [...roster,showcase,...saga]){
 if(p.deck.length!==40||p.fusions.length<1||p.fusions.length>15||
  !Number.isFinite(p.power))throw Error('Invalid solo NPC loadout: '+p.name);
}
const output=JSON.stringify({schema:1,source:'Singleplayer RPG enemy loadouts',
 scriptCount:scripts.length,roster,showcase,saga})+'\n';
for(const target of ['assets/duo-opponent-catalog-v201.json',
 'supabase/functions/arcane-duo-v2/opponents.json']){
 const file=path.join(repo,target);
 if(process.argv.includes('--check')){
  if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==output)
   throw Error(target+' differs from current solo opponents. Regenerate it.');
 }else fs.writeFileSync(file,output);
}
console.log('[Duo roster] '+roster.length+' real solo opponents, '+
 showcase.name+', '+saga.length+' Level-1 quest loadouts, '+scripts.length+' scripts '+
 (process.argv.includes('--check')?'verified':'generated'));
