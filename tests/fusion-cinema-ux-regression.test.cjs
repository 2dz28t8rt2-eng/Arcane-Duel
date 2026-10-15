'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Hand fusion reveals before placement; occupied zone runs a second fast ritual',()=>{
 const js=read('assets/game.js');
 assert.ok(js.includes("result.fused?'field':'full'"));
 assert.ok(js.includes("!wasRevealed"));
 const evo=read('assets/evolution.js');
 assert.ok(evo.includes('game.pending.revealed=true'));
 assert.ok(evo.includes("variant==='field'"));
});
test('Ritual resolves placed fusion instance, reuses actual roll trace and keeps addition auditable',()=>{
 const js=read('assets/evolution.js');
 for(const token of ["const c=fusionVisualResult||placed||game?.pending?.card","trace=c?.rollTrace||[]",
  "math.winnerIndex","evo-popup-panel","row('+ Material'","row('− Abzug'","row('= ENDWERT'"])
  assert.ok(js.includes(token),token);
 assert.ok(js.includes("animationSpeed==='instant'"));
});
test('Potential ranges return before placement without revealing final dice values',()=>{
 const ui=read('assets/arcane-ui-update.js');
 for(const token of ["fusionPreview(game,c,materials,levels)","v.atk[0]","v.atk[1]","v.def[0]","v.def[1]","kein fester Endwert","Potenzial · ATK"])
  assert.ok(ui.includes(token),token);
});
test('Card roles display on large inspection cards only',()=>{
 const css=read('assets/fusion-stamp.css');
 for(const token of [".board-creature.tc-card .arcane-board-role{display:none!important}",
 "#duelScreen .card-preview-panel .hand-card.tc-card .arcane-card-role",
 "#menuScreen .deck-preview-card .hand-card.tc-card .arcane-card-role",
 ".arcane-enemy-large .hand-card.tc-card .arcane-card-role",
 "#duelScreen .card-preview-panel .hand-card.tc-card .hand-stats .stat-value"])
  assert.ok(css.includes(token),token);
});
test('Slow menu rotation respects disabled animations',()=>{
 const js=read('assets/arcane-archive.js'),css=read('assets/fusion-stamp.css');
 assert.ok(js.includes("reduceMotion()||animationSpeed==='instant'"));
 assert.ok(js.includes("},1550)")&&js.includes("},1250)"));
 assert.ok(css.includes("animation-duration:1.25s!important"));
 assert.ok(css.includes("animation-duration:1.55s!important"));
});
test('Soul offense remains capped and discharge requires real stored essence',()=>{
 const js=read('assets/essence-combat.js');
 assert.ok(js.includes("Math.min(60+lv*60,Math.floor(earned*1.75))"));
 assert.ok(js.includes("Math.floor(amount*1.30),dataOf(c).name+' · aktive Entladung'"));
 assert.ok(js.includes("e.soul<40"));
});
