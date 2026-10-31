'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {Store}=require('./sqlite-store.cjs'),{createHandler}=require('./duo-handler.cjs'),{importProfile}=require('./import-profile.cjs');
const {createRuntime}=require('./singleplayer-runtime.cjs'),{PlayerSaves}=require('./player-save.cjs');
function createServer({root=path.resolve(__dirname,'..'),database,origin,trustProxy=false,legacyImport=false}={}){
 if(!database||!origin||new URL(origin).origin!==origin)throw Error('Database and exact public origin required');
 const store=new Store(database),handler=createHandler(store,{root,origins:[origin]});
 let personal;
 const personalSaves=()=>personal||(personal=new PlayerSaves(store,createRuntime(root)));
 // Existing unified profiles must also receive their canonical rewards after a restart.
 if(store.db.prepare("SELECT 1 FROM profiles WHERE json_type(document,'$.solo_save')='object' LIMIT 1").get())personalSaves();
 const release=fs.existsSync(path.join(root,'release.json'))?JSON.parse(fs.readFileSync(path.join(root,'release.json'),'utf8')):{};
 const buckets=new Map();
 const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.woff2':'font/woff2','.ico':'image/x-icon'};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  try{
   const url=new URL(req.url,origin);
   if(url.pathname==='/api/health'&&req.method==='GET')return reply(res,200,{ok:true,service:'arcane-duel',storage:'sqlite',version:release.version||((fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<meta\s+name="arcane-duel-version"\s+content="([^"]+)"/)||[])[1]||'unknown'),revision:release.revision||'local',release:release.id||'local'});
   // Browsers retain the original fragment (invite/recovery secret) across this redirect.
   if(['/duo-campaign.html','/duo-online.html','/duo-campaign-v2.html'].includes(url.pathname)){res.writeHead(302,{Location:'/index.html'+url.search});return res.end();}
   if(url.pathname==='/arcane-host-config.js'&&req.method==='GET'){
    res.writeHead(200,{'Content-Type':mime['.js'],'Cache-Control':'no-store'});return res.end('window.ArcaneDuoSelfHost229=true;window.ArcaneDuoEndpoint="/api/duo";');
   }
   if(['/api/duo','/api/player-save'].includes(url.pathname)){
    if(!['POST','OPTIONS'].includes(req.method))return reply(res,405,{error:'Methode nicht erlaubt.'});
    if(req.headers.origin!==origin)return reply(res,403,{error:'Nicht erlaubte Herkunft.'});
    const ip=trustProxy?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim():req.socket.remoteAddress;
    const now=Date.now();let bucket=buckets.get(ip);
    if(!bucket||now-bucket.start>=60000){bucket={start:now,n:0};buckets.set(ip,bucket);}
    if(++bucket.n>600)return reply(res,429,{error:'Zu viele Anfragen. Bitte kurz warten.'});
    if(buckets.size>10000)for(const [key,b]of buckets)if(now-b.start>60000)buckets.delete(key);
    let size=0;const chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>(url.pathname==='/api/player-save'?2000000:12000)){reply(res,413,{error:'Anfrage zu groß.'});req.resume();return;}chunks.push(chunk);}
    const body=Buffer.concat(chunks);
    if(req.method==='POST'){
     let parsed;try{parsed=JSON.parse(body);}catch{return reply(res,400,{error:'Ungültiges Anfrageformat.'});}
     if(url.pathname==='/api/player-save'){
      try{return reply(res,200,personalSaves().save(parsed));}
      catch(e){return reply(res,409,{error:String(e.message).slice(0,240)});}
     }
     if(parsed?.type==='legacyImport'){
      if(!legacyImport)return reply(res,403,{error:'Profilübernahme ist auf diesem Server deaktiviert.'});
      // Bound expensive legacy lookups independently from normal polling.
      if((bucket.imports=(bucket.imports||0)+1)>5)return reply(res,429,{error:'Bitte vor der nächsten Übernahme kurz warten.'});
      try{return reply(res,200,await importProfile(store,parsed.profileToken));}
      catch{return reply(res,400,{error:'Das bisherige Profil konnte nicht übernommen werden. Bitte den privaten Profil-Link prüfen.'});}
     }
    }
    const result=await handler(new Request(origin+'/api/duo',{method:req.method,headers:{origin,'content-type':'application/json','x-forwarded-for':ip},...(req.method==='POST'?{body}:{})}));
    res.writeHead(result.status,Object.fromEntries(result.headers));return res.end(Buffer.from(await result.arrayBuffer()));
   }
   if(!['GET','HEAD'].includes(req.method))return reply(res,405,{error:'Methode nicht erlaubt.'});
   const relative=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
   // Serve only public game files. Backend source, data, keys and tests are private.
   if(!(relative.startsWith('assets/')||relative.startsWith('models/')||['desktop/build/icon.png','desktop/build/icon.ico'].includes(relative)||/^(?:index|duo-campaign-v2|art-gallery|collection-v3)\.html$/.test(relative))||relative.split('/').some(p=>p==='..'||p.startsWith('.'))||relative.includes('\\')||relative.includes('\0'))return reply(res,404,{error:'Nicht gefunden.'});
   const file=path.resolve(root,relative);
   if(!file.startsWith(root+path.sep))return reply(res,404,{error:'Nicht gefunden.'});
   const stat=await fs.promises.stat(file).catch(()=>null);if(!stat?.isFile())return reply(res,404,{error:'Nicht gefunden.'});
   if(!(await fs.promises.realpath(file)).startsWith(fs.realpathSync(root)+path.sep))return reply(res,404,{error:'Nicht gefunden.'});
   const type=mime[path.extname(file)]||'application/octet-stream';
   res.writeHead(200,{'Content-Type':type,'Content-Length':stat.size,'Cache-Control':/\.(html|js|css|json)$/.test(file)?'no-cache':'public, max-age=86400'});
   if(req.method==='HEAD')return res.end();fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
  }catch{if(!res.headersSent)reply(res,500,{error:'Serveraktion fehlgeschlagen.'});else res.destroy();}
 });
 return {server,store};
}
if(require.main===module){
 const database=process.env.ARCANE_DATABASE;
 if(!database)throw Error('ARCANE_DATABASE required');
 fs.mkdirSync(path.dirname(database),{recursive:true,mode:0o700});
 const {server,store}=createServer({database,origin:process.env.ARCANE_ORIGIN,trustProxy:process.env.ARCANE_TRUST_PROXY==='1',legacyImport:process.env.ARCANE_LEGACY_IMPORT==='1'});
 server.requestTimeout=20000;server.headersTimeout=15000;
 server.listen(Number(process.env.ARCANE_PORT||8777),'127.0.0.1',()=>console.log('Arcane Duel server ready'));
 const stop=()=>server.close(()=>{store.close();process.exit(0);});process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
module.exports={createServer};
