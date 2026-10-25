'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');

test('all v15.5 modules load and do not change the saved baseline deck',()=>{
  const runtime=boot({seed:15501});
  const result=runtime.run(`(()=>{
    const before=JSON.stringify({deck:profile.activeDeck,inventory:profile.inventory,coins:profile.coins});
    const apis=[window.ArcaneCompleteBackup155,window.ArcaneFusionPlanner155,
      window.ArcaneCombatTransparency155,window.ArcaneMonsterRecords155,window.ArcaneElementAura155];
    const preview=window.ArcaneFusionPlanner155.directRoutes(profile.activeDeck,profile.fusionDeck[0]);
    const backup=window.ArcaneCompleteBackup155.makeBackup();
    return {loaded:apis.every(x=>x.version==='15.5.0'),unchanged:before===JSON.stringify({deck:profile.activeDeck,
      inventory:profile.inventory,coins:profile.coins}),schema:backup.schema,profileVersion:backup.profile.version,
      previewCount:preview.length};
  })()`);
  assert.equal(result.loaded,true);
  assert.equal(result.unchanged,true);
  assert.equal(result.schema,'arcane-duel-complete-backup');
  assert.equal(result.profileVersion,3);
  assert.ok(result.previewCount>=0);
});

test('fusion planner enumerates valid two-through-five-card level multisets and respects copy counts',()=>{
  const b=boot({seed:15502});
  const out=b.run(`(()=>{
    const source=RPG_BASE_CARDS.filter(c=>[2,3,4,5,6].includes(c.level)&&!c.fusionOnly).slice(0,5);
    // Each source id is real, but the helper only needs card levels.
    const ids=[source[0].id,source[1].id,source[2].id,source[3].id,source[4].id];
    const paths=window.ArcaneFusionPlanner155.enumeratePatterns(ids);
    const allLengths=[...new Set(paths.map(x=>x.levels.length))].sort();
    return {paths:paths.length,lengths:allLengths,allLegal:paths.every(x=>x.materials.length===x.levels.length&&
      x.materials.every(id=>ids.includes(id))),mutations:JSON.stringify(ids)};
  })()`);
  assert.ok(out.paths>=4);
  assert.deepEqual(out.lengths,[2,3,4,5]);
  assert.equal(out.allLegal,true);
});

test('locked Lv1 fusion cannot appear as a conventional two-card route',()=>{
  const b=boot({seed:15503});
  const out=b.run(`(()=>{
    const a=window.ArcaneFusionPlanner155;
    const target={level:1,fusionOnly:true};
    const previous=profile.lv1Saga?.perk;
    if(!profile.lv1Saga)profile.lv1Saga={};
    profile.lv1Saga.perk=false;
    const locked=a.rankFor([1,1,1],[],target);
    profile.lv1Saga.perk=true;
    const opened=a.rankFor([1,1,1],[],target);
    const falsePair=a.rankFor([1,1],[],target);
    profile.lv1Saga.perk=previous;
    return {locked,opened,falsePair};
  })()`);
  assert.equal(out.locked.rank,0);
  assert.equal(out.opened.rank,1);
  assert.equal(out.opened.quest,true);
  assert.equal(out.falsePair.rank,0);
});

test('full backup includes old sidecar data and validates it before replacing a profile',()=>{
  const b=boot({seed:15504});
  const out=b.run(`(()=>{
    const api=window.ArcaneCompleteBackup155;
    localStorage.setItem('arcane-duel-v154-first-discoveries',JSON.stringify({'20':Date.now()-1000}));
    localStorage.setItem('arcane-duel-v122-strategy',JSON.stringify({wish:[],fusions:[],tips:[],dangers:false}));
    const bundle=api.makeBackup(),roundtrip=api.validateBackup(JSON.parse(JSON.stringify(bundle)));
    let rejected=false;
    try{api.validateExtras({'arcane-duel-v154-first-discoveries':{'20':'yesterday'}});}catch(_){rejected=true;}
    let foreignRejected=false;
    try{api.validateExtras({'some-untrusted-storage-key':{}});}catch(_){foreignRejected=true;}
    return {containsBoth:!!bundle.extras['arcane-duel-v154-first-discoveries']&&
      !!bundle.extras['arcane-duel-v122-strategy'],legacy:roundtrip.legacy,
      profileValid:roundtrip.preview.version===3,rejected,foreignRejected};
  })()`);
  assert.deepEqual(out,{containsBoth:true,legacy:false,profileValid:true,rejected:true,foreignRejected:true});
});

test('failed profile restore rolls back optional metadata rather than leaving a partial import',()=>{
  const b=boot({seed:15505});
  const result=b.run(`(()=>{
    const key='arcane-duel-v154-first-discoveries',original='{"10":1000}';
    localStorage.setItem(key,original);
    const copy=window.ArcaneCompleteBackup155.makeBackup();
    copy.extras[key]={'20':2000};
    const old=importProfileText;
    importProfileText=()=>{throw Error('Test: core write fails');};
    let refused=false;
    try{window.ArcaneCompleteBackup155.applyBackup(window.ArcaneCompleteBackup155.validateBackup(copy));}
    catch(_){refused=true;}
    importProfileText=old;
    return {refused,stillOriginal:localStorage.getItem(key)===original};
  })()`);
  assert.deepEqual(result,{refused:true,stillOriginal:true});
});

test('complete import faithfully clears sidecar fields absent from the backed-up save',()=>{
  const b=boot({seed:15510});
  const out=b.run(`(()=>{
    const api=window.ArcaneCompleteBackup155;
    const absent='arcane-duel-v122-radar',present='arcane-duel-v151-display';
    localStorage.setItem(absent,JSON.stringify([{key:'stale',foe:1,reports:[]}]));
    const bundle=api.makeBackup();
    delete bundle.extras[absent];
    bundle.extras[present]={forecast:true};
    const okay=api.applyBackup(api.validateBackup(bundle));
    return {okay,cleared:localStorage.getItem(absent)===null,
      restored:JSON.parse(localStorage.getItem(present)).forecast===true};
  })()`);
  assert.deepEqual(out,{okay:true,cleared:true,restored:true});
});

test('combat details distinguish base values from explicitly recorded effects',()=>{
  const b=boot({seed:15506});
  const out=b.run(`(()=>{
    const g=createGame({mode:'pve',opponentId:1,seed:1556});
    const c=newInstance(g,RPG_BASE_CARDS.find(x=>x.level>=2&&!x.fusionOnly).id,0);
    c.decayTotal=30;c.attackFatigue=20;c.materialBonus={atk:15,def:10};
    const before=JSON.stringify(c);
    const report=window.ArcaneCombatTransparency155.breakdown(g,c);
    return {same:before===JSON.stringify(c),decay:report.details.some(x=>x.includes('Zerfall')),
      fatigue:report.details.some(x=>x.includes('Angriffsermüdung')),
      inheritance:report.details.some(x=>x.includes('Materialbonus'))};
  })()`);
  assert.deepEqual(out,{same:true,decay:true,fatigue:true,inheritance:true});
});

test('chronicle aggregate counts seen monster instances without granting experience or stat boosts',()=>{
  const b=boot({seed:15507});
  const result=b.run(`(()=>{
    const api=window.ArcaneMonsterRecords155,at=Date.now();
    const first=api.aggregate({},[23,23,24],true,at);
    const second=api.aggregate(first,[23],false,at+100);
    return {first23:first[23],second23:second[23],first24:first[24]};
  })()`);
  assert.deepEqual(result.first23,{uses:2,wins:2,last:result.first23.last});
  assert.equal(result.second23.uses,3);assert.equal(result.second23.wins,2);
  assert.equal(result.first24.uses,1);
});

test('aura intensity is reversible, and an invalid option is ignored',()=>{
  const b=boot({seed:15508});
  const result=b.run(`(()=>{
    const aura=window.ArcaneElementAura155,old=aura.readIntensity();
    const epic=aura.setIntensity('epic');
    const now=aura.readIntensity(),bad=aura.setIntensity('ultra');
    aura.setIntensity(old);
    return {epic,now,bad,restored:aura.readIntensity()===old};
  })()`);
  assert.deepEqual(result,{epic:true,now:'epic',bad:false,restored:true});
});

test('fusion regressions: Lv6 + Lv3 chain and mixed hand/field summons remain actionable',()=>{
  const b=boot({seed:15509});
  const result=b.run(`(()=>{
    const base=RPG_BASE_CARDS.filter(c=>!c.fusionOnly&&!c.retired);
    const lv3=base.find(c=>c.level===3),lv5=base.find(c=>c.level===5);
    const fusions=RPG_FUSIONS.filter(c=>!c.retired);
    const lv6Fusion=fusions.find(c=>c.level===6),lv5Fusion=fusions.find(c=>c.level===5),
      lv4Fusion=fusions.find(c=>c.level===4);
    const g=createGame({mode:'pve',opponentId:3,seed:3555});
    g.active=0;g.turn=5;g.summoned=false;
    const p=g.players[0];
    p.hand=[newInstance(g,lv5.id,0),newInstance(g,lv5.id,0)];
    p.field=[newInstance(g,lv3.id,0),null,null,null,null];
    p.remainingFusion=[lv6Fusion.id,lv5Fusion.id];
    const handFusion=prepareHandFusion(g,p.hand.map(c=>c.uid),lv6Fusion.id);
    const legalOptions=handFusion?fusionOptions(g,[6,3],[g.pending.card,p.field[0]]):[];
    const chosen=legalOptions.find(c=>c.id===lv5Fusion.id);
    const placed=chosen?placePending(g,0,chosen.id):null;

    const g2=createGame({mode:'pve',opponentId:3,seed:3556});
    g2.active=0;g2.turn=5;g2.summoned=false;
    const p2=g2.players[0];
    p2.hand=[newInstance(g2,lv3.id,0)];
    p2.field=[newInstance(g2,lv3.id,0),null,null,null,null];
    p2.remainingFusion=[lv4Fusion.id];
    const normal=prepareNormal(g2,p2.hand[0].uid);
    const merged=normal?placePending(g2,0,lv4Fusion.id):null;
    return {handFusion,choice:!!chosen,chain:!!placed,chainCanAttack:placed?canAttack(g,placed.card):false,
      chainAvailable:placed?!placed.card.attacked:false,normal,mixed:!!merged,
      mixedCanAttack:merged?canAttack(g2,merged.card):false};
  })()`);
  assert.deepEqual(result,{handFusion:true,choice:true,chain:true,chainCanAttack:true,
    chainAvailable:true,normal:true,mixed:true,mixedCanAttack:true});
});
