'use strict';
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync,backup}=require('node:sqlite');
(async()=>{
 const database=process.env.ARCANE_DATABASE,dir=process.env.ARCANE_BACKUPS;
 if(!database||!dir||!fs.existsSync(database))throw Error('Database and backup directory required');
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const file=path.join(dir,'arcane-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');
 const db=new DatabaseSync(database,{readOnly:true});try{await backup(db,file);}finally{db.close();}
 const verified=new DatabaseSync(file,{readOnly:true});try{if(verified.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup integrity check failed');}finally{verified.close();}
 const keep=fs.readdirSync(dir).filter(f=>/^arcane-[\dTZ-]+\.sqlite$/.test(f)).sort().reverse();
 for(const old of keep.slice(30))fs.unlinkSync(path.join(dir,old));
 console.log('Verified Arcane Duel database backup created.');
})().catch(()=>{console.error('Arcane Duel backup failed.');process.exitCode=1;});
