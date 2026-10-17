'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function boot(){
 const nodes=new Map(),store=new Map();
 const node=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},click(){},remove(){},append(){}});
 const document={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:node,addEventListener(){}};
 const window={localStorage:{getItem(k){return store.get(k)||null},setItem(k,v){store.set(k,String(v))}},crypto:{getRandomValues(a){a[0]=15432;return a}}};
 const ctx=vm.createContext({window,document,setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 for(const filename of ['art-engine.js','game.js'])vm.runInContext(fs.readFileSync(path.join(root,'assets',filename),'utf8'),ctx,{timeout:14000});
 return code=>JSON.parse(vm.runInContext(`JSON.stringify(${code})`,ctx,{timeout:15000}));
}
test('22 curated normal monster families have 3 independent higher stages with a shared illustration',()=>{
 const run=boot(),res=run(`({ originalCount:NORMAL_LINE_ORIGINAL_COUNT,originalRoots:NORMAL_LINE_ROOT_IDS.length,added:NORMAL_LINE_VARIANT_IDS.length,all:CARDS.length,invalid:NORMAL_LINE_VARIANT_IDS.filter(id=>{const c=CARDS[id],root=CARDS[c.variantOf];return !root||root.fusionOnly||root.ace||root.manifestOf!=null||c.fusionOnly||c.ace||c.manifestOf!=null||c.lineRoot!==root.id||c.lineStep<1||c.lineStep>3||c.level!==root.level+c.lineStep||c.art!==root.art||c.name!==root.name||c.kind!==root.kind||c.element!==root.element||c.atk<=root.atk||c.def<=root.def||c.requiredTier<1||c.requiredTier>10}).length,invalidIds:NORMAL_LINE_VARIANT_IDS.filter(id=>{const c=CARDS[id],root=CARDS[c.variantOf];return c.art!==root.art||c.name!==root.name||c.kind!==root.kind||c.element!==root.element||c.atk<=root.atk||c.def<=root.def||c.requiredTier<1||c.requiredTier>10}).map(id=>({id,base:CARDS[id].variantOf,name:CARDS[id].name,baseName:CARDS[CARDS[id].variantOf].name,art:CARDS[id].art===CARDS[CARDS[id].variantOf].art,atk:CARDS[id].atk,baseAtk:CARDS[CARDS[id].variantOf].atk,def:CARDS[id].def,baseDef:CARDS[CARDS[id].variantOf].def})),rootStages:NORMAL_LINE_ROOT_IDS.map(id=>NORMAL_LINE_VARIANT_IDS.filter(v=>CARDS[v].variantOf===id).length),starterDeckValid:mainDeckError(RPG_DEFAULT_DECK),aceIds:Object.values(ACE_CARD_IDS)})`);
 assert.deepEqual({original:res.originalCount,roots:res.originalRoots,added:res.added,total:res.all,invalid:res.invalid},{original:324,roots:22,added:66,total:696,invalid:0});
 assert.ok(res.rootStages.every(n=>n===3));assert.equal(res.starterDeckValid,'');assert.deepEqual(res.aceIds,Array.from({length:10},(_,i)=>314+i));
});
test('Untoter Goblin is a collectible Lv 1–4 series without replacing any original template',()=>{
 const run=boot(),res=run(`({names:[CARDS[0],...NORMAL_LINE_VARIANT_IDS.map(id=>CARDS[id]).filter(c=>c.variantOf===0)].map(c=>c.name),levels:[CARDS[0],...NORMAL_LINE_VARIANT_IDS.map(id=>CARDS[id]).filter(c=>c.variantOf===0)].map(c=>c.level),art:[CARDS[0],...NORMAL_LINE_VARIANT_IDS.map(id=>CARDS[id]).filter(c=>c.variantOf===0)].map(c=>c.art),ids:[CARDS[0],...NORMAL_LINE_VARIANT_IDS.map(id=>CARDS[id]).filter(c=>c.variantOf===0)].map(c=>c.id)})`);
 assert.deepEqual(res.levels,[1,2,3,4]);assert.equal(new Set(res.names).size,1);assert.equal(new Set(res.art).size,1);assert.equal(new Set(res.ids).size,4);assert.equal(res.ids[0],0);
});
test('Variant unlocks respect tournament tiers and do not pollute opponent drops or fusion pool',()=>{
 const run=boot(),res=run(`(()=>{const gob=NORMAL_LINE_VARIANT_IDS.filter(id=>CARDS[id].variantOf===0);const start={tier:highestCleared(),normal:boosterPools(0).normal.filter(id=>gob.includes(id)),available:gob.map(cardAvailable),fusion:RPG_FUSIONS.some(c=>gob.includes(c.id))};profile.cleared=[1,2];const mid={normal:boosterPools(2).normal.filter(id=>gob.includes(id)),available:gob.map(cardAvailable)};profile.cleared=[1,2,3];const end={normal:boosterPools(3).normal.filter(id=>gob.includes(id)),available:gob.map(cardAvailable)};return {start,mid,end,drops:RPG_OPPONENTS.flatMap(o=>[...o.loot,...o.hardLoot]).some(id=>gob.includes(id))};})()`);
 assert.equal(res.start.tier,0);assert.deepEqual(res.start.normal,[]);assert.deepEqual(res.start.available,[false,false,false]);assert.equal(res.start.fusion,false);
 assert.equal(res.mid.normal.length,2);assert.deepEqual(res.mid.available,[true,true,false]);
 assert.equal(res.end.normal.length,3);assert.deepEqual(res.end.available,[true,true,true]);assert.equal(res.drops,false);
});
test('A higher-stage card can be crafted, equipped, saved and validated without changing old inventory',()=>{
 const run=boot(),res=run(`(()=>{const id=NORMAL_LINE_VARIANT_IDS.find(id=>CARDS[id].variantOf===0&&CARDS[id].level===2);profile.cleared=[1];profile.coins=99999;profile.shards[0]=100;const old=profile.inventory[0];const cost=cardCost(id);const crafted=craftCard(id);const raw=JSON.parse(JSON.stringify(profile));const valid=validateProfile(raw);const draft=[...profile.activeDeck];draft[0]=id;const equipValid=mainDeckError(draft,valid.unlocked);return {id,cost,crafted,owned:valid.inventory[id],old:valid.inventory[0],previous:old,equipValid,rank:valid.enhancements[id]??0,asset:CARDS[id].art===CARDS[0].art};})()`);
 assert.equal(res.crafted,true);assert.ok(res.cost>60);assert.equal(res.owned,1);assert.equal(res.old,res.previous);assert.equal(res.equipValid,'');assert.equal(res.rank,0);assert.equal(res.asset,true);
});
test('Numeric ATK/DEF fields are small, centered and preserve legibility of the enlarged preview',()=>{
 const css=fs.readFileSync(path.join(root,'assets/card-look-v3.css'),'utf8');
 assert.match(css,/\.hand-card\.tc-card \.hand-stats \.stat-value\{[\s\S]*?font-size:9px!important/);
 assert.match(css,/\.deck-preview-card \.hand-card\.tc-card \.hand-stats \.stat-value,/);
 assert.match(css,/\.deck-family-levels/);
});
