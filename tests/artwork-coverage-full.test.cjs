'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const catalog=()=>{
 const b=boot({seed:911});
 return b.run('CARDS.map(c=>({id:c.id,name:c.name,art:String(c.art||""),customArt:String(c.customArt||""),level:c.level,kind:c.kind,element:c.element,role:c.role||"",rpg:!!c.rpg,retired:!!c.retired,enemyOnly:!!c.enemyOnly,fusionOnly:!!c.fusionOnly,ace:!!c.ace,essence:!!c.essenceMonster,manifestOf:c.manifestOf??null,lineRoot:c.lineRoot??null,variantOf:c.variantOf??null,artWave:c.artWave||""}))');
};
test('full runtime artwork inventory and asset coverage report (not all missing artworks approved)',()=>{
 const rows=catalog().filter(c=>!c.retired);
 const generated=rows.filter(c=>c.art.startsWith('data:image/svg+xml')||!c.art);
 const assigned=rows.filter(c=>c.art.startsWith('assets/'));
 const refs=new Map(),missing=[];
 for(const c of assigned){
  const p=c.art.split('?')[0];
  const asset=path.resolve(repo,p);
  if(!asset.startsWith(path.resolve(repo)+path.sep)||!fs.existsSync(asset)||fs.statSync(asset).size<500)missing.push({id:c.id,name:c.name,art:c.art});
  if(!refs.has(p))refs.set(p,[]);
  refs.get(p).push(c);
 }
 const duplicates=[...refs].filter(([p,rs])=>rs.length>1)
  .map(([p,rs])=>({file:p,count:rs.length,names:[...new Set(rs.map(c=>c.name))].slice(0,8),ids:rs.slice(0,14).map(c=>c.id),families:[...new Set(rs.map(c=>c.lineRoot??c.variantOf??c.manifestOf??c.id))].length}))
  .sort((a,b)=>b.families-a.families||b.count-a.count);
 const byRole={};for(const c of generated){const key=c.ace?'ACE':c.essence?'Essenz':c.fusionOnly?'Fusion':c.enemyOnly?'Nur Gegner':'Normal';(byRole[key]??=[]).push(c);}
 const report={active:rows.length,individualPathCards:assigned.length,generatedSVG:generated.length,distinctPaths:refs.size,missingReferencedAssets:missing.length,
  missing,byRole:Object.fromEntries(Object.entries(byRole).map(([k,v])=>[k,{count:v.length,examples:v.slice(0,26).map(c=>({id:c.id,name:c.name,level:c.level}))}])),
  repeatedArtworkPaths:duplicates.length,reusedAcrossDifferentFamilies:duplicates.filter(x=>x.families>1).slice(0,45),
  biggestSharedArt:duplicates.slice(0,16),
  affectedExamples:generated.slice(0,35).map(c=>({id:c.id,name:c.name,level:c.level}))};
 console.log('ARTWORK_FULL_AUDIT_START',JSON.stringify(report),'ARTWORK_FULL_AUDIT_END');
 assert.equal(generated.length,0,
  'Active cards must not display procedural SVG placeholders: '+JSON.stringify(generated.slice(0,15).map(c=>({id:c.id,name:c.name}))));
 assert.equal(duplicates.filter(x=>x.families>1).length,0,
  'Artwork must not be reused across unrelated creature families');
 assert.equal(missing.length,0,'Some mapped artwork files are absent/empty');
 assert.equal(rows.length,new Set(rows.map(c=>c.id)).size,'Duplicate card IDs');
});
