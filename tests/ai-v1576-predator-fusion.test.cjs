'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {run}=require('./ai-v1576-predator-fusion-selfplay.cjs');
const {summarize}=require('./ai-v1576-predator-fusion-aggregate.cjs');
test('v15.76 uses legal 3/4/5-material fusions with neutralized mirrored player perks',()=>{
 for(const size of [3,4,5]){
  const result=run([size,1,0,12]);
  assert.equal(result.rows.length,12);
  assert.ok(result.rows.every(r=>r.materials===size));
  assert.ok(result.rows.every(r=>r.openingEqual&&r.stompEqual));
  assert.ok(result.rows.every(r=>r.seats.length===2));
  const summary=summarize(result.rows);
  assert.equal(summary.mirroredStompActions,24);
  assert.ok(summary.replyAware.predatorOnLargeFusion>0,
   'A targeted research cohort must actually attack large enemy fusion');
 }
});
test('v15.76 reveals known action-order-sensitive mirrored followups, but identical Stomp engine outcomes',()=>{
 const result=run([4,3,0,36]);
 const summary=summarize(result.rows);
 assert.equal(summary.seatParity.openingMismatch,0);
 assert.equal(summary.seatParity.stompMismatch,0);
 assert.ok(summary.seatParity.fullReplyStateMismatchAware>0,
  'Do not silently hide left/right target tie-breaks in AI choice');
});
