'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const resolve=()=>{const f=path.join(__dirname,'../assets/quality-diagnostics-v152.js');
  return fs.existsSync(f)?f:path.join(__dirname,'quality-diagnostics-v152.js');};
test('resource diagnostics are read-only and work without browser performance API',()=>{
  const context={document:{getElementById:()=>null,querySelectorAll:()=>[]},uiMode:'duel',
    renderMenu:()=>{},window:{},escapeHtml:x=>String(x)};
  vm.runInNewContext(fs.readFileSync(resolve(),'utf8'),context);
  const result=context.window.ArcaneQualityDiagnostics152.report();
  assert.equal(result.resourceCount,0);
  assert.equal(result.scripts,0);
});
test('resource diagnostics summarize only measured entries',()=>{
  const context={document:{getElementById:()=>null,querySelectorAll:()=>[]},uiMode:'duel',
    renderMenu:()=>{},window:{},escapeHtml:x=>String(x),
    performance:{getEntriesByType:type=>type==='navigation'?[{duration:100,domContentLoadedEventEnd:70,responseStart:20}]:
      [{name:'https://host.test/assets/main.js?v=20261025',duration:50,initiatorType:'script'},
        {name:'https://host.test/assets/bg.webp',duration:120,initiatorType:'img'}]}};
  vm.runInNewContext(fs.readFileSync(resolve(),'utf8'),context);
  const result=context.window.ArcaneQualityDiagnostics152.report();
  assert.equal(result.resourceCount,2);
  assert.equal(result.images,1);
  assert.equal(result.slow[0].duration,120);
  assert.equal(result.slow[1].name,'main.js');
});
