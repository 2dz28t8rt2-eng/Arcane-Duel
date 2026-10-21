/* Arcane Duel v12.6 – only NPC deck slot replacements, no new cards/edits.
 * After v12.5 VII, decrease 2 non-ACE normal cards 1 level.
 * VIII gets 2 non-ACE normal cards 1 level higher (existing catalog IDs).
 * Every other opponent including X remains unchanged.
 */
'use strict';
(()=>{
 const original=rpgEnemyLoadout, A=ACE_CARD_IDS;
 const config=Object.freeze({7:{mainDown:2},8:{mainUp:2}});
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
     (mode==='raise10'?card.level<10:mode==='raise1'?card.level<10:card.level>2))
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
  const load=original(id,difficulty,stage);
  if(id!==7&&id!==8)return load;
  const deck=[...load.deck],fusionDeck=[...load.fusionDeck],ace=A[id];
  const changes=exchange(deck,id,difficulty,'main',2,id===7?'lower1':'raise1',ace);
  if(deck.length!==40||fusionDeck.length!==load.fusionDeck.length||
     copies(deck,ace)+copies(fusionDeck,ace)!==1||
     deck.some(cid=>!CARDS[cid]||CARDS[cid].fusionOnly)||
     [...new Set(deck)].some(cid=>copies(deck,cid)>3))
    throw Error('v12.6 invalid adjusted boss '+id);
  if(id===7&&fusionDeck.filter(cid=>CARDS[cid].level===10).length!==4)
    throw Error('VII Lv10 fusion roster unexpectedly changed');
  return {...load,deck,fusionDeck,roster126:changes};
 };
 window.ArcaneRoster126=Object.freeze({version:'12.6',targets:config});
})();
