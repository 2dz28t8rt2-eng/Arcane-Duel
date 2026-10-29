'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');

test('v15.7 event classifier recognizes real resonance and soul mechanics without treating ordinary text as combat',()=>{
  const b=boot();
  const out=b.run(`(()=>{
    const a=window.ArcaneEventFX157;
    return {version:a.version,resonance:a.classify('Materialresonanz: +8 % Fusionsqualität').kind,
      ascension:a.classify('Resonator-Aufstieg: zwei Resonatoren').kind,
      soul:a.classify('Wurzelwolf entzieht 120 ATK / 60 DEF').kind,
      inheritance:a.classify('Seelen-Erbe der Feldfusion: +200 DEF').kind,
      other:a.classify('Kreaturenzerfall: -30 ATK/DEF'),levels:[1,3,4,6,7,8,9,10].map(a.tier)};
  })()`);
  assert.deepEqual(out,{version:'15.7.0',resonance:'resonance',ascension:'resonance',soul:'soul',
    inheritance:'soul',other:null,levels:[1,1,2,2,3,3,4,4]});
});

test('v15.7 respects disabled animation and reduced-motion preferences',()=>{
  const b=boot();
  const out=b.run(`(()=>{
    const g=createGame({mode:'pve',opponentId:1,seed:15703});game=g;uiMode='duel';
    const a=window.ArcaneEventFX157;const before=JSON.stringify(g.players);
    const shown=a.burst(g,{kind:'soul',label:'Seelenentzug',element:'DUNKEL',level:7});
    return {shown,reduced:a.reduced(),same:JSON.stringify(g.players)===before,
      count:a.metrics().shown,suppressed:a.metrics().suppressed};
  })()`);
  assert.deepEqual(out,{shown:false,reduced:true,same:true,count:0,suppressed:1});
});

test('v15.7 has a strict particle ceiling and makes no changes to gameplay or random state',()=>{
  const b=boot({seed:15705});
  b.exec(`window.matchMedia=()=>({matches:false});
    game=createGame({mode:'pve',opponentId:1,seed:15705});uiMode='duel';
    animationSpeed='fast';window.ArcaneElementAura155.setIntensity('epic');`);
  const out=b.run(`(()=>{
    const a=window.ArcaneEventFX157;const before=JSON.stringify({players:game.players,seed:game.seed,turn:game.turn});
    const first=a.burst(game,{kind:'ace',label:'ACE beschworen',element:'LICHT',level:10});
    const same=before===JSON.stringify({players:game.players,seed:game.seed,turn:game.turn});
    return {first,same,shown:a.metrics().shown,peak:a.metrics().peakSparks,
      cpuBudgetMs:a.metrics().peakDurationMs,children:document.body.children.length};
  })()`);
  assert.equal(out.first,true);
  assert.equal(out.same,true);
  assert.equal(out.shown,1);
  assert.ok(out.peak<=18);
  assert.ok(out.children<=5);
});

test('v15.7 ignores logs from simulation-only games and preserves combat records',()=>{
  const b=boot();
  const out=b.run(`(()=>{
    const main=createGame({mode:'pve',opponentId:1}),other=createGame({mode:'pve',opponentId:1});
    game=main;uiMode='duel';const count=other.log.length;
    logEvent(other,'Materialresonanz: +4 % Fusionsqualität');
    return {recorded:other.log.length===count+1,mainUnchanged:!main.log.includes('Materialresonanz: +4 % Fusionsqualität'),
      shown:window.ArcaneEventFX157.metrics().shown};
  })()`);
  assert.deepEqual(out,{recorded:true,mainUnchanged:true,shown:0});
});
