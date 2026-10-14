'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'assets/card-look-v3.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const game=fs.readFileSync(path.join(root,'assets/game.js'),'utf8');

test('Card Foundry is the last CSS layer and changes no old CSS or combat rules',()=>{
 const base=html.indexOf('assets/styles.css'),visual=html.indexOf('assets/visual-v3.css'),foundry=html.indexOf('assets/card-look-v3.css');
 assert.ok(base>=0&&visual>base&&foundry>visual);
 assert.match(css,/Presentation only/);
});
test('Cards keep original identifiers and combat stats but expose element metadata',()=>{
 assert.match(game,/function fullCardHtml\(c,/);
 assert.match(game,/data-element="\$\{escapeHtml\(t\.element\)\}"/);
 assert.match(game,/data-level="\$\{t\.level\}"/);
 assert.match(game,/class=\"hand-type\">\$\{t\.element\}/);
 assert.doesNotMatch(game,/class=\"hand-description\">/);
 assert.match(game,/class=\"card-level-badge\"/);
 assert.match(game,/class="hand-stats" aria-label="Angriff \$\{t\.atk\}, Verteidigung \$\{t\.def\}"/);
});
test('Original fantasy gem frames distinguish normal, fusion and ACE cards',()=>{
 for(const select of [
  '.hand-card.tc-card{','.hand-card.tc-card.tc-fusion:not(.tc-ace){',
  '.hand-card.tc-card.tc-ace{','.hand-card.tc-card.tc-fusion.tc-ace .hand-art{',
  '.board-creature.tc-card{','.board-creature.tc-card.tc-fusion:not(.tc-ace){',
  '.board-creature.tc-card.tc-ace{'
 ]) assert.ok(css.includes(select),`Missing ${select}`);
 for(const element of ['FEUER','WASSER','WIND','ERDE','DUNKEL','LICHT'])assert.ok(css.includes(`[data-element="${element}"]`),element);
});
test('Readable portrait and stable ATK/DEF layout on mobile and reduced motion',()=>{
 for(const phrase of [
  '.hand-card.tc-card .hand-art img{','.hand-card.tc-card .hand-stats{',
  '.hand-card.tc-card .hand-stats .stat-value{','#hand .hand-card.tc-card{',
  '.card-preview-panel .hand-card.tc-card{','@media(max-width:420px)',
  '@media(prefers-reduced-motion:reduce)'
 ])assert.ok(css.includes(phrase),phrase);
 assert.doesNotMatch(css,/\.hand-card\.tc-card \.hand-stats\{[^}]*position:absolute/s);
});
