'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=script=>boot({seed:153025}).run(script);

test('every two-to-five-material poker family stays stable under hand selection order',()=>{
  const output=run(`(()=>{
    const cases=[[1,1],[1,1,1],[4,4,4,4],[4,4,4,4,4],
      [1,1,2,2,2],[1,2,3],[1,2,3,4],[1,2,3,4,5],[1,1,1,2,3]];
    const g=createGame({mode:'pve',opponentId:3,seed:1531});
    return cases.map(levels=>{
      const names=[],caps=[],quality=[];
      const orders=[levels,[...levels].reverse(),[levels.at(-1),...levels.slice(0,-1)]];
      for(const order of orders){
        names.push(window.ArcaneFusionMath.pattern(order).name);
        caps.push(fusionBudget(order,g));
        quality.push(window.ArcaneFusionRework113.calculate(order,g,[]).penalty);
      }
      return {levels,names,caps,quality,street:window.ArcaneFusionRework113.calculate(levels,g,[]).street};
    });
  })()`);
  for(const result of output){
    assert.equal(new Set(result.names).size,1,`pattern for ${result.levels}`);
    assert.equal(new Set(result.caps).size,1,`level budget for ${result.levels}`);
    assert.equal(new Set(result.quality).size,1,`quality for ${result.levels}`);
    assert.ok(result.caps[0]>=1&&result.caps[0]<=10);
  }
  assert.match(output[4].names[0],/Full House/);
  assert.match(output[7].names[0],/Gigantische Straße/);
  assert.match(output[8].names[0],/Straße/);
  assert.equal(output[8].street,false,'extra duplicate is not a closed street for rank bonus');
});

test('fusion preview is deterministic and never consumes real templates or materials',()=>{
  const result=run(`(()=>{
    const g=createGame({mode:'pve',opponentId:3,seed:1532});
    const p=g.players[0],base=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace);
    const mats=[1,2,3,1,1].map(level=>{
      const card=newInstance(g,base.id,0);card.card.level=level;return card;
    });
    p.hand=[...mats];
    const levels=mats.map(m=>dataOf(m).level);
    const candidate=fusionOptions(g,levels,mats)[0];
    if(!candidate)throw Error('missing fusion candidate');
    const before={hand:p.hand.map(c=>c.uid),templates:[...p.remainingFusion],seed:g.seed};
    const a=fusionPreview(g,candidate,mats,levels),b=fusionPreview(g,candidate,mats,levels);
    return {same:JSON.stringify(a)===JSON.stringify(b),unchanged:JSON.stringify(before)===
      JSON.stringify({hand:p.hand.map(c=>c.uid),templates:[...p.remainingFusion],seed:g.seed}),
      floor:a.atk[0]<=a.atk[1]&&a.def[0]<=a.def[1]};
  })()`);
  assert.deepEqual(result,{same:true,unchanged:true,floor:true});
});

test('unselected sixth card survives a genuine five-material hand fusion',()=>{
  const result=run(`(()=>{
    const g=createGame({mode:'pve',opponentId:2,seed:1533});
    g.active=0;g.turn=3;g.summoned=false;g.pending=null;
    const base=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace);
    const p=g.players[0],m=[1,2,3,1,1].map(level=>{const c=newInstance(g,base.id,0);c.card.level=level;return c;});
    const extra=newInstance(g,base.id,0);p.hand=[...m,extra];p.field=[null,null,null,null,null];
    const choice=fusionOptions(g,m.map(c=>dataOf(c).level),m)
      .find(c=>canCompleteHandFusion(g,m.map(x=>dataOf(x).level),c.id));
    if(!choice)throw Error('missing fusion template');
    const success=prepareHandFusion(g,m.map(c=>c.uid),choice.id);
    const kept=p.hand.some(c=>c.uid===extra.uid),used=p.graveyard.filter(c=>m.some(x=>x.uid===c.uid)).length;
    const placed=success&&!!placePending(g,0);
    return {success,kept,used,placed,hand:p.hand.length};
  })()`);
  assert.deepEqual(result,{success:true,kept:true,used:5,placed:true,hand:1});
});
