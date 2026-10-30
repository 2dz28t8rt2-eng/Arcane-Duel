'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const selfplay=fs.readFileSync('tests/ai-v1900-selfplay.cjs','utf8');
function expression(which){
 const regex=new RegExp('source=source\\.replace\\(seed'+which+',"const seed'+which+'=([^"]+);"\\);');
 const found=regex.exec(selfplay);
 assert.ok(found,'Exact injected deck seed expression must exist: '+which);
 return found[1];
}
const seedAExpr=expression('A'),seedBExpr=expression('B');
const seedA=new Function('stage','sameOpponentPair','scenario','pairedStage','return ('+seedAExpr+');');
const seedB=new Function('stage','sameOpponentPair','scenario','pairedStage','return ('+seedBExpr+');');
function cases(){
 const scenarios=stage=>stage===4||stage===7?24:[8,9,10].includes(stage)?12:6;
 const paired=stage=>stage===6?5:stage;
 const groups=[0,0,0,1,1,1,0,0];
 const out=[];
 for(let stage=0;stage<=10;stage++)for(let pair=0;pair<8;pair++)
  for(let scenario=0;scenario<scenarios(stage);scenario++){
   const sameOpponentPair=stage===8?groups[pair]:stage===9?Math.floor(pair/4):pair;
   const seed1=seedA(stage,sameOpponentPair,scenario,paired(stage));
   const seed2=seedB(stage,sameOpponentPair,scenario,paired(stage));
   out.push({stage,pair,scenario,seedA:seed1,seedB:seed2});
  }
 return out;
}
test('Every v18.8 stage, pairing and scenario satisfies original 0..9999 deck-builder contract',()=>{
 const rows=cases();
 assert.equal(rows.length,8*(6*6+2*24+3*12));
 for(const c of rows)for(const side of ['seedA','seedB'])
  assert.ok(Number.isSafeInteger(c[side])&&c[side]>=0&&c[side]<=9999,
   'Illegal '+side+' stage='+c.stage+' pair='+c.pair+' scenario='+c.scenario+' value='+c[side]);
});
test('Stage 8 and 9 use fresh, paired, non-wrapped deck seeds',()=>{
 const rows=cases();
 for(const stage of [8,9]){
  const cells=rows.filter(c=>c.stage===stage);
  assert.equal(cells.length,8*12);
  assert.ok(cells.some(c=>c.seedA!==c.seedB));
  const maximum=Math.max(...cells.flatMap(c=>[c.seedA,c.seedB]));
  assert.ok(maximum<=9999,'Stage '+stage+' max '+maximum);
 }
 assert.match(seedAExpr,/stage===8\?760:stage===9\?320:0/);
 assert.match(seedBExpr,/stage===8\?760:stage===9\?320:0/);
});
