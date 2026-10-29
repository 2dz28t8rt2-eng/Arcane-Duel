'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');

test('v15.92: no automatic 200-point opening shield for either starter in PvP or PvE',()=>{
 const b=boot({seed:1592});
 for(const starter of [0,1]){
  const pvp=b.run(`(()=>{const g=createGame({mode:'pvp',starter:${starter},seed:1592});return {shield:g.players.map(p=>p.shield),starter:g.starter,log:g.log[0]};})()`);
  assert.equal(pvp.starter,starter);
  assert.deepEqual(pvp.shield,[0,0]);
  assert.match(pvp.log,/Kein automatischer Eröffnungsschild/);
  const pve=b.run(`(()=>{const g=createGame({mode:'pve',opponentId:1,starter:${starter},seed:1592});return {shield:g.players.map(p=>p.shield),starter:g.starter};})()`);
  assert.equal(pve.starter,starter);
  assert.deepEqual(pve.shield,[0,0]);
 }
});
