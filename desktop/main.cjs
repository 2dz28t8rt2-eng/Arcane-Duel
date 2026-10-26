'use strict';

const path=require('node:path');
const fs=require('node:fs/promises');
const {app,BrowserWindow,Menu,shell,session}=require('electron');
const {GAME_ENTRY,REVISION_PATTERN,entryForRevision,isGameUrl,isRepositoryUrl}=require('./url-policy.cjs');
const {resolveRevision}=require('./revision-resolver.cjs');

const DESKTOP_PARTITION='persist:arcane-duel-development';
let window=null;
let currentRevision='development';
let refreshing=false;

async function latestRevision(){
 const cacheFile=path.join(app.getPath('userData'),'last-good-development-revision');
 const result=await resolveRevision();
 if(result.revision){
  try{await fs.writeFile(cacheFile,result.revision,'utf8');}catch{}
  return result.revision;
 }
 try{
  const cached=(await fs.readFile(cacheFile,'utf8')).trim();
  if(REVISION_PATTERN.test(cached))return cached.toLowerCase();
 }catch{}
 return 'development';
}

async function loadFreshGame(){
 if(refreshing||!window||window.isDestroyed())return;
 refreshing=true;
 try{
  currentRevision=await latestRevision();
  if(window&&!window.isDestroyed())await window.loadURL(entryForRevision(currentRevision));
 }catch(error){
  console.warn('Arcane Duel desktop navigation:',error.message);
  if(window&&!window.isDestroyed())void window.loadFile(path.join(__dirname,'offline.html'));
 }finally{refreshing=false;}
}

function createWindow(){
 const gameSession=session.fromPartition(DESKTOP_PARTITION);
 gameSession.setPermissionRequestHandler((sender,permission,callback,details)=>{
  // Copying 2v2 invitation links may require this safe browser permission.
  const origin=details?.requestingUrl||sender.getURL();
  callback((permission==='clipboard-sanitized-write'||permission==='clipboard-write')&&
   isGameUrl(origin,currentRevision));
 });
 window=new BrowserWindow({
  title:'Arcane Duel · Desktop-Testversion',width:1440,height:900,minWidth:940,minHeight:620,
  icon:path.join(__dirname,'build','icon.ico'),
  backgroundColor:'#0b101c',show:false,autoHideMenuBar:true,
  webPreferences:{
   partition:DESKTOP_PARTITION,
   nodeIntegration:false,
   contextIsolation:true,
   sandbox:true,
   webSecurity:true,
   webviewTag:false,
   allowRunningInsecureContent:false
  }
 });
 Menu.setApplicationMenu(null);
 const contents=window.webContents;
 const offlineFile=path.join(__dirname,'offline.html');

 contents.setWindowOpenHandler(({url})=>{
  if(isRepositoryUrl(url))void shell.openExternal(url).catch(()=>{});
  return {action:'deny'};
 });
 contents.on('will-attach-webview',event=>event.preventDefault());
 contents.on('will-navigate',(event,url)=>{
  if(isGameUrl(url,currentRevision))return;
  event.preventDefault();
  // The offline retry button uses the historical URL so old builds and
  // bookmark links remain compatible, but it refreshes the commit first.
  if(url===GAME_ENTRY&&contents.getURL().startsWith('file:')){
   void loadFreshGame();return;
  }
  if(isRepositoryUrl(url))void shell.openExternal(url).catch(()=>{});
 });
 contents.on('did-fail-load',(_event,code,_description,url,mainFrame)=>{
  if(mainFrame&&code!==-3&&isGameUrl(url,currentRevision)&&window&&!window.isDestroyed()){
   void window.loadFile(offlineFile);
  }
 });
 contents.on('before-input-event',(event,input)=>{
  if(input.type==='keyDown'&&input.key==='F11'){
   event.preventDefault();window.setFullScreen(!window.isFullScreen());
  }
 });
 window.once('ready-to-show',()=>window?.show());
 window.on('closed',()=>{window=null;});
 void loadFreshGame();
}

if(!app.requestSingleInstanceLock())app.quit();
else{
 app.on('second-instance',()=>{
  if(window){if(window.isMinimized())window.restore();window.focus();}
 });
 app.whenReady().then(()=>{
  if(process.platform==='win32')app.setAppUserModelId('at.arcane.duel.desktop');
  createWindow();
 });
 app.on('window-all-closed',()=>app.quit());
}
