'use strict';
const {createHash,randomUUID}=require('node:crypto');
const {defaults}=require('./sqlite-store.cjs');
const legacy='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
// Explicit, one-time import only. Ordinary gameplay never calls the old server.
async function importProfile(store,token,{fetcher=fetch}={}){
 if(!/^[a-f0-9]{64}$/.test(token))throw Error('Ungültiger privater Profil-Link.');
 const digest=createHash('sha256').update(token).digest('hex');
 const existing=await store.from('arcane_duo_v2_profiles').select('*').eq('token_hash',digest).maybeSingle();
 if(existing.error)throw existing.error;if(existing.data)return {imported:false};
 const response=await fetcher(legacy,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://raw.githack.com'},body:JSON.stringify({type:'profile',profileToken:token}),signal:AbortSignal.timeout(12000)});
 const text=await response.text();if(text.length>200000||!response.ok)throw Error('Das bisherige Online-Profil konnte nicht bestätigt werden.');
 const p=JSON.parse(text).profile;if(!p)throw Error('Das bisherige Online-Profil fehlt.');
 const row={...defaults('profiles'),id:p.id,token_hash:digest,nickname:p.nickname,avatar_id:p.avatarId||'hero-01',revision:p.revision,
  xp:p.xp,essence:p.essence,shards:p.shards,wins:p.wins,cleared_chapters:p.clearedChapters,
  owned_main:p.ownedMain,owned_fusions:p.ownedFusions,deck:p.deck,fusions:p.fusions,upgrades:p.upgrades,
  enhancements:p.enhancements,essence_binding:p.essenceBinding,lv1_research:p.lv1Research,chapter_card_credits:p.chapterCardCredits||0,
  deck_slots:p.deckSlots||[],active_deck_slot:p.activeDeckSlot||0};
 if(!/^[a-f0-9-]{36}$/.test(row.id)||typeof row.nickname!=='string'||row.nickname.length>32)throw Error('Ungültiges bisheriges Profil.');
 for(const k of ['revision','xp','essence','shards','wins','chapter_card_credits'])if(!Number.isSafeInteger(row[k])||row[k]<0)throw Error('Ungültiger bisheriger Fortschritt.');
 for(const k of ['owned_main','owned_fusions','deck','fusions','cleared_chapters'])if(!Array.isArray(row[k])||row[k].length>100000||!row[k].every(Number.isInteger))throw Error('Ungültige bisherige Sammlung.');
 if(!row.cleared_chapters.every(c=>c>=1&&c<=15)||![0,1,2].includes(row.active_deck_slot)||![0,3].includes(row.deck_slots.length))throw Error('Ungültiges bisheriges Profil.');
 for(const k of ['upgrades','enhancements','essence_binding','lv1_research'])if(!row[k]||typeof row[k]!=='object'||Array.isArray(row[k]))throw Error('Ungültige bisherige Verbesserungen.');
 store.transaction(()=>{
  // A concurrent import may already have committed. Never replace a newer save.
  if(store.db.prepare("SELECT id FROM profiles WHERE json_extract(document,'$.token_hash')=?").get(digest))return;
  store.db.prepare('INSERT INTO profiles(id,document) VALUES(?,?)').run(row.id,JSON.stringify(row));
  // Old reward receipts are private. Conservatively consume today's repeat limit
  // on already cleared chapters so moving servers cannot reset that daily limit.
  const now=new Date().toISOString();
  for(const chapter of row.cleared_chapters){const tier=chapter>=11?chapter-8:chapter;
   for(let n=1;n<=3;n++)store.db.prepare('INSERT INTO rewards VALUES(?,?,?,?,?,?,?,?)').run(row.id,'migration-'+randomUUID(),chapter,n,(40+20*tier)/2,0,0,now);
  }
 });
 return {imported:true};
}
module.exports={importProfile};
