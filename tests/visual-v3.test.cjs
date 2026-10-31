'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'assets/visual-v3.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const game=fs.readFileSync(path.join(root,'assets/game.js'),'utf8');
test('Visual v3 styling is loaded after existing card rules without changing gameplay code',()=>{
 const base=html.indexOf('assets/styles.css'),old=html.indexOf('assets/evolution.css'),new3=html.indexOf('assets/visual-v3.css');
 assert.ok(base>=0&&old>base&&new3>old);
 assert.match(html,/<title>ARCANE DUEL · 1\\.0\\.0<\\/title>/);
 assert.match(html,/<small data-arcane-version>1\\.0\\.0<\\/small>/);
 assert.match(css,/presentation only, never saved cards or combat/);
 assert.match(game,/function fullCardHtml\(c,/);
});
test('Base, fusion, ACE and the arena use visually different frame families',()=>{
 for(const selector of ['.hand-card.tc-card{','.hand-card.tc-card.tc-fusion:not(.tc-ace){','.hand-card.tc-card.tc-ace{','.board-creature.tc-card{','.board-creature.tc-card.tc-fusion:not(.tc-ace){','.board-creature.tc-card.tc-ace{'])assert.ok(css.includes(selector),selector);
 assert.match(css,/--v3-bright:#e5c7ff/);
 assert.match(css,/--v3-bright:var\(--evo-luster\)/);
 assert.match(css,/\.hand-card\.tc-card \.hand-art img\{object-fit:cover/);
 assert.match(css,/flex:0 0 auto/);
});
test('Important details remain readable with narrow layouts and reduced motion',()=>{
 assert.match(css,/\.hand-card\.tc-card \.hand-stats/);
 assert.match(css,/\.hand-card\.tc-card \.hand-description/);
 assert.match(css,/@media\(max-width:400px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
