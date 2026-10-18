'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('assets/game.js');
const css=read('assets/card-shell-v404.css');
test('The ONE actual live-card render function includes a Level medallion between ATK and DEF',()=>{
  assert.equal((source.match(/class="ad-level-medallion"/g)||[]).length,2,
    'one in fullCardHtml and one in cardHtml battlefield');
  const hand=source.slice(source.indexOf('function fullCardHtml('),source.indexOf('function ensureEditorPreviewId('));
  const board=source.slice(source.indexOf('function cardHtml(c,side)'),source.indexOf('function render(){'));
  for(const markup of [hand,board]){
    assert.ok(markup.indexOf('class="ad-level-medallion"')>markup.indexOf('stat atk')||
              markup.indexOf('class="ad-level-medallion"')>markup.indexOf('⚔'));
    assert.ok(markup.includes('t.level>=1&&t.level<=10&&!isFateCard(c)'));
    assert.ok(markup.indexOf('class="ad-level-medallion"')<markup.indexOf('class="stat def"')||
              markup.indexOf('class="ad-level-medallion"')<markup.indexOf('◆'));
  }
  assert.match(hand,/class="card-level-badge"/);
  assert.match(hand, /<strong class="stat-value">\$\{t\.atk\}<\/strong>/);
  assert.match(hand, /<strong class="stat-value">\$\{t\.def\}<\/strong>/);
});
test('Card shells are visually distinct from the old deeply rounded bronze look',()=>{
 const core=css.slice(0,css.indexOf('/* The original SVG remains'));
 assert.match(core,/border-radius:7px!important/);
 assert.match(core,/border:1px solid var\(--ad-tpl-rim\)!important/);
 assert.match(css,/\.hand-title\{/);
 assert.match(css,/border-radius:3px!important/);
 assert.match(css,/\.hand-art\{/);
 assert.match(css,/border-radius:2px!important/);
 assert.match(css,/\.hand-art::before\{/);
 assert.match(css,/content:none!important/);
 assert.match(css,/box-shadow:none!important/);
 assert.match(css,/:not\(\.tc-fate\)/);
});
test('ATK and DEF are separate 3-column grid cells, complementary enamel disc is not a floating overlay',()=>{
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) var\(--ad-seal-size\) minmax\(0,1fr\)!important/);
 assert.match(css,/position:relative!important/);
 assert.match(css,/width:var\(--ad-seal-size\)!important/);
 assert.match(css,/transform:none!important/);
 for(const family of ['normal','fusion','ace','essence']){
   assert.ok(css.includes('.ad-template-family-'+family+':not(.tc-fate)'));
 }
 assert.match(css,/--ad-seal-size:22px/);
 assert.match(css,/--ad-seal-size:35px/);
});
test('Canvas/export includes same standalone medallion without replacing Monster art or values',()=>{
 const renderer=read('tools/finished-card-renderer.html');
 assert.match(renderer,/ctx\.arc\(128,326,15\.5,0,Math\.PI\*2\)/);
 assert.match(renderer,/ctx\.fillText\(String\(c\.level\),128,326\.7\)/);
 assert.match(renderer,/ctx\.fillText\(c\.atk,72\.5,336\.8,75\)/);
 assert.match(renderer,/ctx\.fillText\(c\.def,183\.5,336\.8,75\)/);
 assert.match(renderer,/cover\(ctx,art,31,90,194,187\)/);
});
test('Entrypoint shell loaded LAST and browser visual acceptance test is in workflow',()=>{
 const html=read('index.html');
 assert.ok(html.indexOf('card-shell-v404.css')>html.indexOf('card-level-runtime-v402.css'));
 assert.match(html,/game\.js\?v=[^"\s]+/);
 assert.match(read('.github/workflows/test.yml'),/browser-card-shell-v404.html/);
 assert.match(read('tests/browser-card-shell-v404.html'),/getComputedStyle/);
});
