'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');

test('v15.6 computes legal hand routes without using or creating any resources',()=>{
  const b=boot({seed:15601});
  const out=b.run(`(()=>{
    const g=createGame({mode:'pve',opponentId:1,seed:15601});g.active=0;g.turn=5;
    const base=RPG_BASE_CARDS.find(c=>c.level===2&&!c.fusionOnly&&!c.retired);
    const fusion=RPG_FUSIONS.find(c=>c.level===2&&!c.retired);
    g.players[0].hand=[newInstance(g,base.id,0),newInstance(g,base.id,0),newInstance(g,base.id,0)];
    g.players[0].remainingFusion=[fusion.id,fusion.id];
    const before=JSON.stringify({players:g.players,materials:g.materials,profile:profile.inventory});
    const api=window.ArcaneFusionCoach156,paths=api.handRoutes(g),suggestions=api.guidedRoutes(paths);
    const markup=api.guideMarkup(g);
    const after=JSON.stringify({players:g.players,materials:g.materials,profile:profile.inventory});
    return {version:api.version,safe:before===after,count:paths.length,
      allLegal:paths.every(p=>p.uids.length>=2&&p.uids.length<=5&&p.templateIds.includes(fusion.id)),
      unique:paths.every(p=>new Set(p.uids).size===p.uids.length),
      recommendations:suggestions.length,copyHint:markup.includes('Noch wurde nichts')||markup.includes('markiert nur Karten'),
      hiddenStats:!markup.includes('ATK 123456')};
  })()`);
  assert.equal(out.version,'15.6.0');
  assert.equal(out.safe,true);
  assert.ok(out.count>=3);
  assert.equal(out.allLegal,true);
  assert.equal(out.unique,true);
  assert.ok(out.recommendations>0&&out.recommendations<=3);
  assert.equal(out.copyHint,true);
  assert.equal(out.hiddenStats,true);
});

test('v15.6 rejects impossible full-field hand fusion without an additional template',()=>{
  const b=boot({seed:15602});
  const out=b.run(`(()=>{
    const api=window.ArcaneFusionCoach156,g=createGame({mode:'pve',opponentId:1,seed:15602});
    g.active=0;g.turn=5;
    const normal=RPG_BASE_CARDS.find(c=>c.level===2&&!c.fusionOnly&&!c.retired),
      fusion=RPG_FUSIONS.find(c=>c.level===2&&!c.retired),p=g.players[0];
    p.hand=[newInstance(g,normal.id,0),newInstance(g,normal.id,0)];
    p.field=Array.from({length:5},()=>newInstance(g,normal.id,0));
    p.remainingFusion=[fusion.id];
    const blocked=api.handRoutes(g).length;
    p.remainingFusion.push(fusion.id);
    const enabled=api.handRoutes(g).length;
    return {blocked,enabled};
  })()`);
  assert.equal(out.blocked,0);
  assert.ok(out.enabled>=1);
});

test('v15.6 distinguishes free zones, legal chains, and spent attacks',()=>{
  const b=boot({seed:15603});
  const out=b.run(`(()=>{
    const api=window.ArcaneFusionCoach156,g=createGame({mode:'pve',opponentId:1,seed:15603});
    g.active=0;g.turn=5;
    const normal=RPG_BASE_CARDS.find(c=>c.level===2&&!c.fusionOnly&&!c.retired),
      fusion=RPG_FUSIONS.find(c=>c.level===2&&!c.retired),p=g.players[0];
    const old=newInstance(g,normal.id,0);old.attacked=true;
    p.field=[old,null,null,null,null];p.remainingFusion=[fusion.id];
    const card=newInstance(g,normal.id,0);
    g.pending={kind:'normal',card,levels:[2]};
    const result=api.zoneRoutes(g),before=JSON.stringify(p);
    const help=api.guideMarkup(g),after=JSON.stringify(p);
    return {first:result[0].kind,attackSpent:result[0].attackSpent,second:result[1].kind,
      preserved:before===after,explainsExtra:help.includes('weitere Fusionsvorlage')};
  })()`);
  assert.deepEqual(out,{first:'fusion',attackSpent:true,second:'open',preserved:true,explainsExtra:true});
});

test('v15.6 offers clear feedback for an incomplete selection without claiming a guaranteed fusion',()=>{
  const b=boot({seed:15604});
  const out=b.run(`(()=>{
    const g=createGame({mode:'pve',opponentId:1,seed:15604});g.active=0;g.turn=5;
    g.materials=[g.players[0].hand[0].uid];
    const html=window.ArcaneFusionCoach156.guideMarkup(g);
    return {one:html.includes('eine weitere Handkarte'),
      noConsume:html.includes('markiert nur Karten')||html.includes('nicht verbraucht'),
      statsUnknown:html.includes('erst bei der Beschwörung')};
  })()`);
  assert.deepEqual(out,{one:true,noConsume:true,statsUnknown:true});
});
