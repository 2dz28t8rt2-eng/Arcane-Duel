'use strict';
// Private, transactional storage for the existing authoritative duel handler.
// This deliberately exposes only the query operations used by that handler.
const {DatabaseSync}=require('node:sqlite');
const tables={arcane_duo_v2_profiles:'profiles',arcane_duo_v2_rooms:'rooms'};
const fields=new Set(('id created_at updated_at expires_at revision token_hash creator_fingerprint nickname avatar_id xp essence shards wins cleared_chapters owned_main owned_fusions deck fusions upgrades enhancements essence_binding lv1_research chapter_card_credits deck_slots active_deck_slot status state host_token_hash invitation_hash guest_token_hash host_profile_id guest_profile_id host_seen_at guest_seen_at').split(' '));
const copy=x=>JSON.parse(JSON.stringify(x));
const column=k=>{if(!fields.has(k))throw Error('Unsupported storage column');return `json_extract(document,'$.${k}')`;};
function defaults(table){
 const now=new Date().toISOString();
 return table==='profiles'?{created_at:now,updated_at:now,revision:0,nickname:'Duellant',avatar_id:'hero-01',xp:0,essence:0,shards:0,wins:0,cleared_chapters:[],owned_main:[],owned_fusions:[],deck:[],fusions:[],upgrades:{},enhancements:{},essence_binding:{},lv1_research:{},chapter_card_credits:0,deck_slots:[],active_deck_slot:0}:
 {created_at:now,updated_at:now,expires_at:new Date(Date.now()+48*3600000).toISOString(),status:'waiting',revision:0,guest_token_hash:null,guest_profile_id:null,host_seen_at:null,guest_seen_at:null};
}
class Store{
 constructor(filename){
  this.db=new DatabaseSync(filename);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY, document TEXT NOT NULL CHECK(json_valid(document)));
   CREATE UNIQUE INDEX IF NOT EXISTS profile_token ON profiles(json_extract(document,'$.token_hash'));
   CREATE INDEX IF NOT EXISTS profile_rate ON profiles(json_extract(document,'$.creator_fingerprint'),json_extract(document,'$.created_at'));
   CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY, document TEXT NOT NULL CHECK(json_valid(document)));
   CREATE INDEX IF NOT EXISTS room_host ON rooms(json_extract(document,'$.host_profile_id'),json_extract(document,'$.updated_at'));
   CREATE INDEX IF NOT EXISTS room_guest ON rooms(json_extract(document,'$.guest_profile_id'),json_extract(document,'$.updated_at'));
   CREATE INDEX IF NOT EXISTS room_rate ON rooms(json_extract(document,'$.creator_fingerprint'),json_extract(document,'$.created_at'));
   CREATE TABLE IF NOT EXISTS rewards(profile_id TEXT NOT NULL,room_id TEXT NOT NULL,chapter INTEGER NOT NULL,duel_no INTEGER NOT NULL,xp INTEGER NOT NULL,essence INTEGER NOT NULL,shards INTEGER NOT NULL,awarded_at TEXT NOT NULL,PRIMARY KEY(profile_id,room_id,chapter,duel_no));
   CREATE INDEX IF NOT EXISTS reward_daily ON rewards(profile_id,chapter,awarded_at);
   PRAGMA user_version=1;`);
 }
 from(name){if(!tables[name])throw Error('Unsupported private table');return new Query(this,tables[name]);}
 close(){this.db.close();}
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 read(table,id){const row=this.db.prepare(`SELECT document FROM ${table} WHERE id=?`).get(id);return row?JSON.parse(row.document):null;}
 save(table,p){this.db.prepare(`UPDATE ${table} SET document=? WHERE id=?`).run(JSON.stringify(p),p.id);}
 award(old,next){
  const s=next.state;
  if(next.status!=='finished'||s?.winner!==0||old.state?.status!=='active'||!next.host_profile_id||!next.guest_profile_id)return;
  const chapter=s.chapter,duel=Math.max(1,s.duelNo||1);
  if(!Number.isInteger(chapter)||chapter<1||chapter>15||chapter>=11&&(s.entry!=='quest'||s.questPassed!==true))return;
  const tier=chapter>=11?chapter-8:chapter,now=new Date().toISOString(),day=now.slice(0,10)+'T00:00:00.000Z';
  for(const id of [...new Set([next.host_profile_id,next.guest_profile_id])].sort()){
   const p=this.read('profiles',id);if(!p)throw Error('Reward profile missing');
   const first=!p.cleared_chapters.includes(chapter),fullXp=40+20*tier;
   if(!first&&this.db.prepare('SELECT count(*) AS n FROM rewards WHERE profile_id=? AND chapter=? AND awarded_at>=? AND xp=?').get(id,chapter,day,fullXp/2).n>=3)continue;
   const xp=first?fullXp:fullXp/2,essence=first?70+35*tier:Math.max(1,Math.floor((70+35*tier)*.4)),shards=first?1+tier:1;
   const result=this.db.prepare('INSERT OR IGNORE INTO rewards VALUES(?,?,?,?,?,?,?,?)').run(id,next.id,chapter,duel,xp,essence,shards,now);
   if(!result.changes)continue;
   p.xp+=xp;p.essence+=essence;p.shards+=shards;p.wins++;p.chapter_card_credits+=first?3:0;
   p.cleared_chapters=[...new Set([...p.cleared_chapters,chapter])].sort((a,b)=>a-b);
   if(chapter>=11)p.lv1_research={...p.lv1_research,perk:true,rank:Math.max(chapter-10,p.lv1_research.rank||0)};
   if(chapter===11&&first){for(const id of [711,712,713]){if(!p.owned_fusions.includes(id))p.owned_fusions.push(id);if(p.fusions.length<15&&!p.fusions.includes(id))p.fusions.push(id);}}
   p.revision++;p.updated_at=now;this.save('profiles',p);
  }
 }
}
class Query{
 constructor(store,table){this.store=store;this.table=table;this.filters=[];this.params=[];this.columns='*';this.op='select';}
 select(cols='*',options={}){this.columns=cols;this.options=options;return this;}
 insert(data){this.op='insert';this.patch=copy(data);return this;}
 update(data){this.op='update';this.patch=copy(data);return this;}
 eq(k,v){this.filters.push(column(k)+' = ?');this.params.push(v);return this;}
 gte(k,v){this.filters.push(column(k)+' >= ?');this.params.push(v);return this;}
 is(k,v){if(v!==null)throw Error('Only null IS is supported');this.filters.push(column(k)+' IS NULL');return this;}
 in(k,values){this.filters.push(values.length?column(k)+` IN (${values.map(()=>'?').join(',')})`:'0');this.params.push(...values);return this;}
 or(expression){const parts=expression.split(',').map(v=>{const m=/^(\w+)\.eq\.([a-f0-9-]+)$/.exec(v);if(!m)throw Error('Unsupported storage OR');this.params.push(m[2]);return column(m[1])+' = ?';});this.filters.push('('+parts.join(' OR ')+')');return this;}
 order(k,{ascending=true}={}){this.sort=column(k)+(ascending?' ASC':' DESC');return this;}
 limit(n){if(!Number.isInteger(n)||n<1||n>1000)throw Error('Invalid storage limit');this.max=n;return this;}
 maybeSingle(){this.one='maybe';return this;}
 single(){this.one='required';return this;}
 then(resolve,reject){try{return Promise.resolve(this.execute()).then(resolve,reject);}catch(e){return Promise.resolve({data:null,error:e}).then(resolve,reject);}}
 execute(){
  const perform=()=>{
   let rows;
   if(this.op==='insert'){
    const p={...defaults(this.table),...this.patch};this.validate(p);
    this.store.db.prepare(`INSERT INTO ${this.table}(id,document) VALUES(?,?)`).run(p.id,JSON.stringify(p));rows=[p];
   }else{
    const where=this.filters.length?' WHERE '+this.filters.join(' AND '):'';
    let sql=`SELECT document FROM ${this.table}`+where;
    if(this.sort)sql+=' ORDER BY '+this.sort;if(this.max)sql+=' LIMIT '+this.max;
    rows=this.store.db.prepare(sql).all(...this.params).map(r=>JSON.parse(r.document));
    if(this.op==='update')rows=rows.map(old=>{const p={...old,...this.patch};if(p.id!==old.id)throw Error('Immutable id');this.validate(p);this.store.save(this.table,p);if(this.table==='rooms')this.store.award(old,p);return p;});
   }
   const count=rows.length;
   if(this.columns!=='*'){const cols=this.columns.split(',');cols.forEach(column);rows=rows.map(p=>Object.fromEntries(cols.map(k=>[k,p[k]??null])));}
   if(this.one&&(rows.length>1||this.one==='required'&&!rows.length))throw Error('Unexpected storage row count');
   return {data:this.options?.head?null:this.one?rows[0]??null:rows,count,error:null};
  };
  return this.op==='select'?perform():this.store.transaction(perform);
 }
 validate(p){
  if(!/^[a-f0-9-]{36}$/.test(p.id)||!Number.isSafeInteger(p.revision)||p.revision<0)throw Error('Invalid stored identity');
  for(const k of Object.keys(p))if(!fields.has(k))throw Error('Unsupported stored field');
  if(this.table==='profiles'){
   if(!/^[a-f0-9]{64}$/.test(p.token_hash))throw Error('Invalid private profile hash');
   for(const k of ['xp','essence','shards','wins','chapter_card_credits'])if(!Number.isSafeInteger(p[k])||p[k]<0)throw Error('Invalid stored balance');
  }else if(!['waiting','active','finished'].includes(p.status)||!p.state||typeof p.state!=='object')throw Error('Invalid stored room');
 }
}
module.exports={Store,defaults};
