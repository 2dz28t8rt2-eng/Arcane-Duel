/* Read-only strategic diagnostics, new Fusion 3.1. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const names=['art-engine.js','game.js','expansion.js','evolution.js','learning.js',
 'essence-combat.js','arcane-role-fusions.js','arcane-monster-forge.js'];
const sources=names.map(name=>fs.readFileSync(path.join(__dirname,'../assets',name),'utf8')).join('\n;\n');
function boot(){
 const nodes=new Map(),store=new Map();
 const el=()=>({style:{},dataset:{},value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,
  classList:{add(){},remove(){},toggle(){},contains(){return false}},
  append(){},appendChild(){},remove(){},addEventListener(){},removeEventListener(){},
  insertAdjacentHTML(){},querySelector(){return null},querySelectorAll(){return []},setAttribute(){}});
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},
  createElement:el,querySelector(){return null},querySelectorAll(){return []},addEventListener(){}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const window={localStorage,location:{hostname:'audit.test',protocol:'https:'},matchMedia(){return {matches:false}},addEventListener(){}};
 const ctx=vm.createContext({window,document,localStorage,navigator:{},console,Date,Math,JSON,
  setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},Map,Set,Array,Number,Object,
  String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN});
 vm.runInContext(sources+'\n;('+makeScenarioForVm.toString()+')()',ctx,{timeout:30000});
 return ctx;
}
function makeScenarioForVm(){
 let auditPolicy='default';
 const originalOptions=fusionOptions;
 fusionOptions=function(g,levels){
  return auditPolicy==='normal-only'&&g.active===0?[]:originalOptions(g,levels);
 };
 const originalAi=chooseAiAction;
 chooseAiAction=function(g,policy='balanced'){
  if(auditPolicy==='fusion-seeking'&&g.active===0&&g.mode==='pve'&&!g.pending&&
    g.aiPhase==='summon'&&!g.summoned&&g.players[0].field.some(c=>!c)){
   const cards=g.players[0].hand.filter(c=>!isFateCard(c));
   let best=null;
   for(let n=Math.min(5,cards.length);n>=2;n--){
    function choose(start,stack){
     if(stack.length===n){
      const levels=stack.map(c=>dataOf(c).level);
      if(!fusionOptions(g,levels).some(c=>canCompleteHandFusion(g,levels,c.id)))return;
      const q=window.ArcaneEvolution.fusionQuality(levels,stack.map(c=>dataOf(c).element));
      const score=q.factor*120+q.rollBonus*5+(q.hasCombo?30:0)+n*2;
      if(!best||score>best.score)best={cards:[...stack],score};
      return;
     }
     for(let i=start;i<=cards.length-(n-stack.length);i++)choose(i+1,[...stack,cards[i]]);
    }
    choose(0,[]);
   }
   if(best){g.aiPhase='positions';return {type:'fusion',uids:best.cards.map(c=>c.uid)};}
  }
  return originalAi(g,policy);
 };
 const originalFusion=fusedInstance;
 fusedInstance=function(g,materials,levels){
  const result=originalFusion(g,materials,levels);
  if(result&&g.active===0&&g.mode==='pve'){
   const ref=window.ArcaneEvolution.fusionReferenceStats(result.card.level);
   const total=Math.max(1,ref.atk+ref.def);
   g.auditFusions??=[];
   g.auditFusions.push({
    level:result.card.level,n:materials.length,pattern:result.pattern||'Freie Fusion',
    ratio:+((result.card.atk+result.card.def)/total).toFixed(3),
    strongest:Math.max(...materials.map(m=>dataOf(m).atk+dataOf(m).def)),
    rolls:result.qualityRolls||1,role:result.roleOverride||CARDS[result.id].role||'combatant'
   });
  }
  return result;
 };
 function scenarioDeck(maxLv){
  const normals=[...ARCANE_STAGE_IDS.values()].map(id=>CARDS[id]).filter(c=>c&&c.level<=maxLv);
  const pick=lv=>normals.filter(c=>c.level===lv).sort((a,b)=>b.atk+b.def-a.atk-a.def);
  const cards=[...new Map([...pick(maxLv).slice(0,7),...pick(Math.max(1,maxLv-1)).slice(0,5),
   ...pick(Math.max(1,maxLv-2)).slice(0,3)].map(c=>[c.id,c])).values()].slice(0,14);
  if(cards.length!==14)throw Error('No 14-card normal pool');
  const main=cards.flatMap(c=>[c.id,c.id,c.id]).slice(0,40);
  const stock=RPG_FUSIONS.filter(c=>c.fusionOnly&&!c.retired&&c.level<=maxLv&&!c.enemyOnly);
  const bridge=[2,4,5,6,7,8,9,10].map(lv=>stock.find(c=>c.level===lv)).filter(Boolean).map(c=>c.id);
  const fusions=[...new Set([...bridge,...stock.map(c=>c.id)])].slice(0,15);
  if(mainDeckError(main)||fusionDeckError(fusions))throw Error('Invalid comparison deck');
  return {main,fusions};
 }
 function runAuditDuels(){
  const records=[];
  for(const tier of [3,6,9]){
   const cap=tier<=3?4:tier<=7?8:10,deck=scenarioDeck(cap);
   for(let i=0;i<18;i++){
    const seed=23001+i*331+tier*431;
    for(const strategy of ['normal-only','default','fusion-seeking']){
     auditPolicy=strategy;
     profile.cleared=Array.from({length:tier-1},(_,i)=>i+1);
     const g=createGame({mode:'pve',context:'tournament',opponentId:tier,seed,starter:seed%2,
      deck:deck.main,fusionDeck:deck.fusions});
     simulateGame(g,'balanced');
     if(g.winner!==0&&g.winner!==1)throw Error('Duel did not finish');
     const played=g.auditFusions||[];
     records.push({tier,cap,seed,strategy,win:g.winner===0,halfTurns:g.turn,
      ownLP:g.players[0].lp,npcFused:g.totalFusions[1],fused:g.totalFusions[0],
      damage:g.damageDealt[0],multi4:played.filter(f=>f.n>=4).length,
      avgFusionRatio:played.length?+(played.reduce((a,b)=>a+b.ratio,0)/played.length).toFixed(3):null});
    }
   }
  }
  auditPolicy='default';
  return records;
 }
 function runAuditFusions(){
  auditPolicy='default';
  const recipes=[
   {name:'2 Material (3+3)',levels:[3,3]},
   {name:'Drilling (3+3+3)',levels:[3,3,3]},
   {name:'Kleine Straße (1+2+3)',levels:[1,2,3]},
   {name:'Große Straße (1+2+3+4)',levels:[1,2,3,4]},
   {name:'Große Straße (1+2+3+4+5)',levels:[1,2,3,4,5]},
   {name:'Vierling (3+3+3+3)',levels:[3,3,3,3]},
   {name:'Freie Fusion (4+2)',levels:[4,2]}
  ];
  const rows=[];
  const stock=RPG_FUSIONS.filter(c=>c.fusionOnly&&!c.retired&&!c.enemyOnly).slice(0,15).map(c=>c.id);
  for(const recipe of recipes)for(let repeat=0;repeat<40;repeat++){
   const g=createGame({mode:'pve',context:'free',opponentId:6,starter:0,
    seed:94117+repeat*419+recipe.levels.length*1301,
    deck:RPG_DEFAULT_DECK,fusionDeck:stock});
   g.active=0;
   const materials=recipe.levels.map((level,i)=>{
    const id=ARCANE_STAGE_IDS.get((i+1)+':'+level);
    if(!Number.isInteger(id))throw Error('Missing stage '+level);
    return newInstance(g,id,0);
   });
   const levels=materials.map(c=>dataOf(c).level);
   if(!fusionOptions(g,levels).length)throw Error('Recipe unavailable '+recipe.name);
   const result=fusedInstance(g,materials,levels);
   if(!result)throw Error('Fusion failed '+recipe.name);
   const ref=window.ArcaneEvolution.fusionReferenceStats(result.card.level);
   rows.push({recipe:recipe.name,pattern:result.pattern||'Freie Fusion',
    level:result.card.level,materials:materials.length,
    ratio:+((result.card.atk+result.card.def)/(ref.atk+ref.def)).toFixed(3),
    materialRatio:+((result.card.atk+result.card.def)/
      Math.max(...materials.map(c=>dataOf(c).atk+dataOf(c).def))).toFixed(3),
    rolls:result.qualityRolls||1,role:result.roleOverride||CARDS[result.id].role||'combatant'});
  }
  return rows;
 }
 globalThis.runAuditDuels=runAuditDuels;globalThis.runAuditFusions=runAuditFusions;
}
test('Fusion 3.1 paired individual duels: normal-only, default, fusion-seeking',()=>{
 const values=vm.runInContext('runAuditDuels()',boot(),{timeout:120000}),result=[];
 for(const tier of [3,6,9])for(const strategy of ['normal-only','default','fusion-seeking']){
  const rows=values.filter(v=>v.tier===tier&&v.strategy===strategy);
  result.push({tier,strategy,duels:rows.length,wins:rows.filter(v=>v.win).length,
   avgHalfTurns:+(rows.reduce((n,v)=>n+v.halfTurns,0)/rows.length).toFixed(1),
   avgFusions:+(rows.reduce((n,v)=>n+v.fused,0)/rows.length).toFixed(2),
   avgEnemyFusions:+(rows.reduce((n,v)=>n+v.npcFused,0)/rows.length).toFixed(2),
   avgDamage:+(rows.reduce((n,v)=>n+v.damage,0)/rows.length).toFixed(0),
   avgOwnLP:+(rows.reduce((n,v)=>n+v.ownLP,0)/rows.length).toFixed(0),
   fourOrMore:rows.reduce((n,v)=>n+v.multi4,0)});
 }
 console.log('FUSION31_INDIVIDUAL_DUELS '+JSON.stringify(result));
 assert.equal(values.length,162);
 assert.ok(values.every(v=>v.halfTurns>0&&v.halfTurns<250));
 assert.ok(values.filter(v=>v.strategy==='normal-only').every(v=>v.fused===0),
  'normal-only must actually avoid all fusions');
});
test('Fusion 3.1 280 rolled actual fusion outcomes: normal, poker and risk',()=>{
 const rows=vm.runInContext('runAuditFusions()',boot(),{timeout:120000}),report=[];
 for(const recipe of [...new Set(rows.map(r=>r.recipe))]){
  const subset=rows.filter(r=>r.recipe===recipe);
  const sorted=subset.map(r=>r.ratio).sort((a,b)=>a-b);
  report.push({recipe,pattern:subset[0].pattern,samples:subset.length,
   avgRatio:+(sorted.reduce((a,b)=>a+b,0)/sorted.length).toFixed(3),
   medianRatio:sorted[Math.floor(sorted.length/2)],min:sorted[0],max:sorted[sorted.length-1],
   belowReference:subset.filter(r=>r.ratio<1).length,
   aboveReference:subset.filter(r=>r.ratio>1).length,
   avgRelativeToBestMaterial:+(subset.reduce((a,b)=>a+b.materialRatio,0)/subset.length).toFixed(2),
   avgRolls:+(subset.reduce((a,b)=>a+b.rolls,0)/subset.length).toFixed(2)});
 }
 console.log('FUSION31_STATS_BY_RECIPE '+JSON.stringify(report));
 assert.equal(rows.length,280);
 assert.ok(rows.some(r=>r.ratio<1)&&rows.some(r=>r.ratio>1));
});
