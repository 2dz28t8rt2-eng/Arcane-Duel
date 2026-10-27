'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const script=fs.readFileSync(path.resolve(__dirname,'../assets/duel-cinematics-v42.js'),'utf8');
const roleExpression=script.match(/const role=c=>([\s\S]*?);/);
assert.ok(roleExpression,'Cinematic preview must expose a resolved role');
const role=new Function('window','CARDS','c',`return ${roleExpression[1]};`);
const cards={7:{role:'guardian'},8:{role:'predator'}};

test('defender preview tolerates a missing optional EssenceCombat role helper',()=>{
 assert.equal(role({},cards,{id:7}),'guardian');
 assert.equal(role({ArcaneEssenceCombat:{}},cards,{id:7}),'guardian');
 assert.equal(role({ArcaneEssenceCombat:{roleOf:undefined}},cards,{id:7}),'guardian');
 assert.equal(role({ArcaneEssenceCombat:{}},cards,{id:8,roleOverride:'soul'}),'soul');
 assert.equal(role({ArcaneEssenceCombat:{}},cards,{id:99}),'combatant');
});

test('the official role resolver takes precedence when it is available',()=>{
 const window={ArcaneEssenceCombat:{roleOf:()=> 'resonator'}};
 assert.equal(role(window,cards,{id:7,roleOverride:'soul'}),'resonator');
});
