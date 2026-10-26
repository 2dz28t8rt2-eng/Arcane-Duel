'use strict';
/* Reproduce the FULL singleplayer card registry in its actual browser load
 * order. Never maintain a second, hand-written 2v2 monster database.
 * This script writes generated copies consumed by browser and Edge function.
 */
const fs=require('node:fs');
const path=require('node:path');
const {boot,repo,scripts}=require('../tests/helpers/game-runtime.cjs');
const runtime=boot({seed:160026});
// Fusion templates have artwork/identity but DO NOT supply the PvE stat baseline.
// Mirror Evolution 3.0's normal-monster midpoint by target level instead.
const fusionReferences=runtime.run(`Array.from({length:10},(_,i)=>{
 const level=i+1;
 const pool=ARCANE_WORKSHOP_IDS.map(id=>CARDS[id]).filter(c=>c&&c.level===level&&
  !c.retired&&!c.fusionOnly&&!c.essenceMonster&&
  Number.isFinite(c.atk)&&Number.isFinite(c.def));
 const round10=n=>Math.round(n/10)*10;
 const fallback=round10(workshopBudget(level)/2);
 return {level,...Object.fromEntries(['atk','def'].map(stat=>[stat,pool.length?
  round10((Math.min(...pool.map(c=>c[stat]))+Math.max(...pool.map(c=>c[stat])))/2):
  fallback]))};
})`);
const cards=runtime.run(`CARDS.map(c=>({
 id:c.id,name:c.name,level:c.level,atk:c.atk,def:c.def,
 role:c.role||'combatant',element:c.element||'',
 ability:typeof c.ability==='string'?c.ability:'',
 pveBaseBonus:!c.fusionOnly&&!c.essenceMonster?{
  atk:normalRoleBonus(c,'atk',1,{}),
  def:normalRoleBonus(c,'def',1,{})
 }:{atk:0,def:0},
 art:typeof c.art==='string'&&c.art.startsWith('assets/')?c.art:'',
 fusionOnly:!!c.fusionOnly,ace:!!c.ace,
 playable:!!c.rpg&&!c.retired&&!c.enemyOnly&&!c.fateOnly,
 essenceMonster:!!c.essenceMonster,source:c.source??null
}))`).map(c=>c.fusionOnly?{...c,fusionReference:fusionReferences[c.level-1]}:c);
for(const [i,c] of cards.entries()){
 if(c.id!==i||!Number.isInteger(c.level)||!Number.isFinite(c.atk)||!Number.isFinite(c.def))
  throw Error('The singleplayer catalog is not canonical at '+i);
}
const loadouts=runtime.run('({starterMain:[...RPG_DEFAULT_DECK],starterFusions:[...RPG_START_FUSIONS]})');
const output=JSON.stringify({schema:1,source:'Arcane-Duel/development/index.html',scriptCount:scripts.length,
 ...loadouts,cards},null,0)+'\n';
const targets=['assets/duo-card-catalog-v160.json',
 'supabase/functions/arcane-duo-v2/catalog.json'];
const ruleSource=fs.readFileSync(path.join(repo,'assets/duo-shared-rules-v160.js'),'utf8');
const check=process.argv.includes('--check');
for(const target of targets){
 const file=path.join(repo,target);
 if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==output)
  throw Error(target+' differs from the current singleplayer card registry. Run npm run duo:catalog');
 }else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,output);}
}
const serverRules=path.join(repo,'supabase/functions/arcane-duo-v2/duo-rules.js');
if(check){if(!fs.existsSync(serverRules)||fs.readFileSync(serverRules,'utf8')!==ruleSource)
 throw Error('Server and browser 2v2 rules diverged. Run npm run duo:catalog');
}else fs.writeFileSync(serverRules,ruleSource);
console.log(`[Duo catalog] ${cards.length} cards (${cards.filter(c=>c.playable).length} playable), ${scripts.length} source scripts, ${check?'verified':'generated'}.`);
