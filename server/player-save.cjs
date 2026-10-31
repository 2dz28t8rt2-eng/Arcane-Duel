'use strict';
// The personal save is the original singleplayer format. The legacy columns are
// a derived loadout for the authoritative 2v2 engine, never another editable save.
const crypto=require('node:crypto');
const copy=x=>JSON.parse(JSON.stringify(x));
const digest=token=>crypto.createHash('sha256').update(token).digest('hex');
class PlayerSaves{
 constructor(store,runtime){this.store=store;this.runtime=runtime;store.personalRuntime=runtime;
  store.db.exec('CREATE TABLE IF NOT EXISTS player_save_backups(id INTEGER PRIMARY KEY,profile_id TEXT NOT NULL,created_at TEXT NOT NULL,reason TEXT NOT NULL,document TEXT NOT NULL CHECK(json_valid(document)))');
 }
 player(token){
  if(!/^[a-f0-9]{64}$/.test(token||''))throw Error('Privaten Profilzugang wiederherstellen.');
  const row=this.store.db.prepare("SELECT document FROM profiles WHERE json_extract(document,'$.token_hash')=?").get(digest(token));
  if(!row)throw Error('Privaten Profilzugang wiederherstellen.');return JSON.parse(row.document);
 }
 inDuel(id){return !!this.store.db.prepare("SELECT 1 FROM rooms WHERE json_extract(document,'$.state.status')='active' AND (json_extract(document,'$.host_profile_id')=? OR json_extract(document,'$.guest_profile_id')=?) LIMIT 1").get(id,id);}
 result(p){
  const row=this.store.db.prepare("SELECT document FROM rooms WHERE json_extract(document,'$.expires_at')>? AND (json_extract(document,'$.host_profile_id')=? OR json_extract(document,'$.guest_profile_id')=?) ORDER BY (json_extract(document,'$.state.status')='active') DESC,json_extract(document,'$.updated_at') DESC LIMIT 1").get(new Date().toISOString(),p.id,p.id);
  const r=row?JSON.parse(row.document):null;
  return {id:p.id,revision:p.revision,save:p.solo_save?copy(p.solo_save):null,legacy:p.solo_save?null:this.runtime.fromLegacy(p),outcome:p.solo_result||null,
   lastRoom:r?{id:r.id,seat:r.host_profile_id===p.id?0:2,status:r.state.status}:null};
 }
 backup(p,reason,local){this.store.db.prepare('INSERT INTO player_save_backups(profile_id,created_at,reason,document) VALUES(?,?,?,?)').run(p.id,new Date().toISOString(),reason,JSON.stringify({profile:p,...(local?{local}:{} )}));}
 save({profileToken,expectedRevision,save,choice,type}){
  if(type==='load')return this.result(this.player(profileToken));
  if(!['adopt','save'].includes(type))throw Error('Unbekannte Spielstandaktion.');
  const normalized=this.runtime.normalize(save);
  return this.store.transaction(()=>{
   const p=this.player(profileToken);
   if(p.revision!==expectedRevision)throw Error('Dein Spielstand wurde inzwischen geändert. Bitte zuerst neu laden.');
   if(type==='save'&&this.inDuel(p.id))throw Error('Während eines gemeinsamen Duells wird der Spielstand vom Server verwaltet.');
   if(type==='adopt'){
    if(p.solo_save)throw Error('Dieses Profil verwendet bereits den gemeinsamen Spielstand.');
    if(!['solo','online'].includes(choice))throw Error('Bitte den gewünschten bisherigen Spielstand auswählen.');
    this.backup(p,'unified-profile-adoption',normalized);
    p.solo_save=choice==='solo'?normalized:this.runtime.fromLegacy(p);
   }else{
    if(!p.solo_save)throw Error('Bitte zuerst einen bisherigen Spielstand übernehmen.');
    p.solo_save=normalized;
   }
   Object.assign(p,this.runtime.loadout(p.solo_save));p.revision++;p.updated_at=new Date().toISOString();
   this.store.save('profiles',p);return this.result(p);
  });
 }
}
module.exports={PlayerSaves};
