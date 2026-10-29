/* Arcane Duel v12.5 – NPC roster changes only, preserving every card ID/level.
 * VII: replace one sub-10 fusion with an existing Lv10 fusion (4 incl. ACE);
 *      replace two non-ACE main cards below Lv9 with existing +1-level cards.
 * X:   exchange four non-ACE fusions and two non-ACE main cards for
 *      corresponding existing -1-level cards. Nothing is globally re-leveled.
 */
'use strict';
(()=>{
 const original=rpgEnemyLoadout, A=ACE_CARD_IDS;
 const config=Object.freeze({7:{fusionUp10:1,mainUp:2},10:{fusionDown:4,mainDown:2}});
 const copies=(cards,id)=>cards.reduce((n,x)=>n+Number(x===id),0);
 const permitted=(c,id,difficulty)=>!!c&&c.rpg&&!c.retired&&
  !c.ace&&!c.enemyOnly&&!c.hard&&!c.hardOnly&&!c.questOnly&&!c.lv1Exclusive&&
  !c.fateOnly&&!c.essenceMonster&&!c.trainingReward&&!c.milestoneOnly&&
  !c.workshopOnly&&(c.source==null||c.source<0||c.source<=id)&&
  (c.requiredTier==null||c.requiredTier<=id+2)&&
  (difficulty==='hard'||!c.hard);
 const score=(x,from,id)=>10000*Number(x.role===from.role)+
  2000*Number(x.element===from.element)+
  250*Number(x.source===id)+Math.round((x.atk+x.def)/100);
 function exchange(deck,id,difficulty,kind,number,mode,ace){
  const desired=mode==='raise10'?10:mode==='raise1'?1:-1;
  const slots=deck.map((cid,index)=>({index,cid,card:CARDS[cid]}))
   .filter(({cid,card})=>!!card&&cid!==ace&&card.level>=2&&
     (mode==='raise10'?card.level<10:mode==='raise1'?card.level<9:card.level>2))
   .sort((a,b)=>mode==='raise10'?b.card.level-a.card.level||a.index-b.index:
     mode==='raise1'?b.card.level-a.card.level||a.index-b.index:
     b.card.level-a.card.level||a.index-b.index);
  const changes=[];
  for(const {index,cid,card} of slots){
   if(changes.length>=number)break;
   const targetLevel=mode==='raise10'?10:card.level+desired;
   if(targetLevel===card.level)continue;
   const candidates=CARDS.filter(x=>permitted(x,id,difficulty)&&
    x.level===targetLevel&&!!x.fusionOnly===!!card.fusionOnly&&
    (kind==='fusion'?x.level>=2:true)&&copies(deck,x.id)<3&&x.id!==ace&&x.id!==cid)
    .sort((a,b)=>score(b,card,id)-score(a,card,id)||a.id-b.id);
   if(!candidates.length)continue;
   const next=candidates[0];
   deck[index]=next.id;
   changes.push({kind,from:cid,to:next.id,fromLevel:card.level,
    toLevel:next.level,delta:next.level-card.level,
    sameRole:next.role===card.role});
  }
  if(changes.length!==number)throw Error('Roster 12.5 '+id+' '+kind+
    ' '+mode+' substituted '+changes.length+'/'+number+' cards');
  return changes;
 }
 rpgEnemyLoadout=function(id,difficulty='easy',stage){
  const base=original(id,difficulty,stage);
  if(id!==7&&id!==10)return base;
  const deck=[...base.deck],fusionDeck=[...base.fusionDeck],
    ace=A[id],before=base.deck.length+base.fusionDeck.length;
  const priorAce=copies(deck,ace)+copies(fusionDeck,ace);
  const changes=id===7?[
    ...exchange(fusionDeck,id,difficulty,'fusion',config[7].fusionUp10,'raise10',ace),
    ...exchange(deck,id,difficulty,'main',config[7].mainUp,'raise1',ace)
   ]:[
    ...exchange(fusionDeck,id,difficulty,'fusion',config[10].fusionDown,'lower1',ace),
    ...exchange(deck,id,difficulty,'main',config[10].mainDown,'lower1',ace)
   ];
  const count10=fusionDeck.filter(cid=>CARDS[cid].level===10).length;
  if((id===7&&count10!==4)||priorAce!==1||
   copies(deck,ace)+copies(fusionDeck,ace)!==1||
   deck.length!==40||fusionDeck.length!==base.fusionDeck.length||
   deck.length+fusionDeck.length!==before||
   deck.some(cid=>!CARDS[cid]||CARDS[cid].fusionOnly)||
   fusionDeck.some(cid=>!CARDS[cid]?.fusionOnly)||
   [...new Set(deck)].some(cid=>copies(deck,cid)>3)||
   [...new Set(fusionDeck)].some(cid=>copies(fusionDeck,cid)>3))
   throw Error('Roster 12.5 invalid deck for '+id);
  return {...base,deck,fusionDeck,roster125:changes};
 };
 window.ArcaneBossRoster125=Object.freeze({version:'12.5.0',
  seven:config[7],ten:config[10]});
})();
