'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('solo and online confirmation windows use the same modal markup',()=>{
 const runtime=boot();
 const actual=runtime.run("modalHtml('AUFGEBEN','Dieses Duell aufgeben?','⚑','Das Duell zählt als Niederlage.','','<button>OK</button>')");
 assert.equal(actual,'<div class="modal-icon">⚑</div><div class="modal-kicker">AUFGEBEN</div><h2>Dieses Duell aufgeben?</h2><p>Das Duell zählt als Niederlage.</p><div class="modal-actions"><button>OK</button></div>');
 assert.equal(actual,runtime.run("ArcaneModal223.html('AUFGEBEN','Dieses Duell aufgeben?','⚑','Das Duell zählt als Niederlage.','','<button>OK</button>')"));
});
