'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'assets/evolution.css'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/evolution.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const base=fs.readFileSync(path.join(root,'assets/game.js'),'utf8');
test('The three card families have explicitly distinct frame rules after level theming',()=>{
 assert.match(css,/\.hand-card\.tc-card\.tc-fusion:not\(\.tc-ace\),\s*\.board-creature\.tc-card\.tc-fusion:not\(\.tc-ace\)/);
 assert.match(css,/border:3px solid #beabff!important/);
 assert.match(css,/\.hand-card\.tc-card\.tc-fusion .hand-type::before\{content:'✧ FUSION/);
 assert.match(css,/\.hand-card\.tc-card\.tc-ace,\.board-creature\.tc-card\.tc-ace/);
 assert.match(css,/\.tc-card\.tc-ace\.tc-fusion .hand-type::before\{content:'✦ ACE-FUSION/);
 assert.match(css,/\.board-creature\.tc-card\.tc-fusion \.board-level::after/);
 assert.match(base,/class="hand-card tc-card \$\{frameClassForCard\(c\)\}/);
 assert.match(base,/class="board-creature tc-card \$\{frameClassForCard\(c\)\}/);
});
test('New frames leave the special ACE engraving visible and support motion-sensitive users',()=>{
 assert.match(css,/\.board-creature\.tc-card\.tc-ace::before/);
 assert.match(css,/\.hand-card\.tc-card\.tc-fusion:not\(\.tc-ace\)::before/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(js,/window\.matchMedia\?\.\('\(prefers-reduced-motion: reduce\)'\)\?\.matches/);
 assert.match(js,/animationSpeed==='instant'/);
});
test('Normal card travels visually, independently of the duel action',()=>{
 assert.match(js,/function animateCardPlacement\(card,from,to\)/);
 assert.match(js,/const baseOnOwnSlot=onOwnSlot/);
 assert.match(js,/await baseOnOwnSlot\(idx,choice\)/);
 assert.match(js,/if\(normal\)animateCardPlacement\(normal,from,to\)/);
 assert.match(css,/\.evo-card-flight img\{/);
});
test('Mode cards and ready-to-claim quests get their own visible styling',()=>{
 for(const mode of ['defense','burst','fusion']){
  assert.ok(css.includes('.evo-mode-'+mode));
  assert.ok(js.includes('evo-mode-${mode}'));
 }
 assert.match(css,/\.evo-quest\.evo-quest-ready/);
 assert.match(js,/evo-quest \$\{a\.progress>=q\.target/);
});
test('Versioned entrypoint loads Fusion Evolution with fresh CSS and JS assets',()=>{
 assert.ok(html.includes('<title>ARCANE DUEL · '+require('../package.json').version+'</title>'));
 assert.match(html,/assets\/evolution\.css\?v=[A-Za-z0-9-]+/);
 assert.match(html,/assets\/evolution\.js\?v=[A-Za-z0-9-]+/);
 assert.match(js,/version:'3\.1\.0'/);
});
