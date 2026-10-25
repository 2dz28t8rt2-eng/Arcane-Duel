'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {boot}=require('./helpers/game-runtime.cjs');
const specs=JSON.parse(fs.readFileSync('assets/fusion-wave2-v129-manifest.json','utf8')).cards;
const run=x=>boot({seed:12942}).run(x,120000);
test('registered ten distinct low- and midgame fusion blueprints and approved art paths',()=>{
 assert.equal(specs.length,10);
 assert.deepEqual(specs.map(x=>x.id),Array.from({length:10},(_,i)=>742+i));
 assert.deepEqual([3,4,5,6,7,8].map(l=>specs.filter(x=>x.level===l).length),[2,2,2,2,1,1]);
 assert.equal(new Set(specs.map(x=>x.name)).size,10);
 assert.equal(new Set(specs.map(x=>x.art)).size,10);
 for(const x of specs){assert.equal(x.role,null);assert.equal(x.fusionOnly,true);
  assert.match(x.art,/^assets\/custom-art\/fusion-wave2-v129\/[\w-]+\.webp$/);}
});
test('fusion blueprints have no permanent role, hunter never survives as a card role',()=>{
 const v=run(`(()=>({hunters:CARDS.filter(c=>c?.role==='hunter').map(c=>c.id),
 fusionTagged:CARDS.filter(c=>c?.fusionOnly&&c.role!=null).map(c=>c.id),
 total:CARDS.length,installed:window.ArcaneFusionWaveV129?.installed||0,
 newWave:window.ArcaneFusionWaveV130?.installed||0,
 weavers:CARDS.filter(c=>c?.role==='weaver'&&!c.retired).map(c=>({name:c.name,level:c.level}))
 }))()`);
 assert.deepEqual(v.hunters,[]);assert.deepEqual(v.fusionTagged,[]);
 assert.equal(v.total,742+v.installed+v.newWave);
 assert.equal(v.weavers.filter(x=>x.name==='Runenkröte des Moores').length,10);
});
test('material inheritance still stamps the summoned fusion, not its blueprint',()=>{
 const v=run(`(()=>{const p=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.role==='predator');
  const g=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.role==='guardian');
  const n=CARDS.find(c=>c.rpg&&!c.fusionOnly&&c.role==='combatant');
  const inherit=window.ArcaneRoleFusion.inheritance;
  return {predator:inherit([{id:p.id},{id:p.id}]),
    defender:inherit([{id:g.id},{id:g.id}]),
    neutral:inherit([{id:n.id},{id:n.id}])};})()`);
 assert.equal(v.predator,'predator');assert.equal(v.defender,'guardian');assert.equal(v.neutral,'resonator');
});
test('new cards are only enabled after verified WebP files are installed',()=>{
 const v=run(`(()=>({installed:window.ArcaneFusionWaveV129?.installed||0,
  ids:window.ArcaneFusionWaveV129?.ids||[],
  fusionDeck:UPDATE_B_FUSION_IDS.length,
  records:CARDS.slice(742,752).map(c=>({id:c.id,role:c.role??null,level:c.level,fusion:c.fusionOnly,
   art:c.art,inPool:UPDATE_B_SET.has(c.id),inRare:UPDATE_B_FUSION_IDS.includes(c.id)}))}))()`);
 assert.equal(v.records.length,v.installed);
 if(!v.installed){assert.equal(v.ids.length,0);return;}
 assert.equal(v.installed,10);assert.equal(v.records.length,10);
 for(let i=0;i<10;i++){const x=v.records[i],spec=specs[i];
  assert.equal(x.id,spec.id);assert.equal(x.role,null);assert.equal(x.level,spec.level);
  assert.equal(x.fusion,true);assert.equal(x.art,spec.art);assert.ok(x.inPool&&x.inRare);
  const data=fs.readFileSync(spec.art);assert.ok(data.length>70000);
  assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');
 }
});
