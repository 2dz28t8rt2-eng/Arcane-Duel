'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const level=read('assets/card-level-frames-v401.css');
const runtime=read('assets/card-level-runtime-v402.css');
const page=read('index.html');
test('Card backgrounds paint exactly one base SVG; level asset is NOT repeated',()=>{
 const rootRule=level.slice(level.indexOf('.hand-card.tc-card.ad-template.ad-level-frame,'),level.indexOf('/* Strong, legible elemental typography'));
 assert.match(rootRule,/background-image:var\(--ad-tpl-frame\)/);
 assert.doesNotMatch(rootRule,/background-image:var\(--ad-level-trim\)/);
 assert.match(rootRule,/background-size:100% 100%,cover,cover/);
 const overlayRule=runtime.slice(runtime.indexOf('::before,'),runtime.indexOf('/* Old embossed number-glyph'));
 assert.match(overlayRule,/background:var\(--ad-level-trim\)/);
 assert.match(overlayRule,/border:0!important/);
 assert.match(overlayRule,/animation:none!important/);
});
test('Legacy frame pseudo glyphs and ornate double borders disabled ONLY on templated cards',()=>{
 assert.match(runtime,/::after/);
 assert.match(runtime,/content:none!important/);
 assert.match(runtime,/display:none!important/);
 assert.match(runtime,/border-style:solid!important/);
 assert.match(runtime,/outline:none!important/);
 assert.match(runtime,/\.hand-art\{/);
 assert.match(runtime,/:not\(\.tc-fate\)/);
 assert.match(runtime,/selected\{/);
 assert.match(runtime,/:focus-visible\{/);
 assert.match(runtime,/\.fusion-mark\{/);
});
test('One-frame rules loaded in the existing v401 and v402 assets without new CSS layers',()=>{
 assert.match(page,/card-level-frames-v401\.css\?v=4\.0\.3-frame-cleanup/);
 assert.match(page,/card-level-runtime-v402\.css\?v=4\.0\.3-frame-cleanup/);
 assert.equal((page.match(/card-level-runtime-v402\.css/g)||[]).length,1);
 assert.ok(page.indexOf('card-level-runtime-v402.css')>page.indexOf('card-level-frames-v401.css'));
 assert.match(read('tests/browser-card-templates.html'),/Legacy ACE embossed glyph\/sheen is completely disabled/);
});
