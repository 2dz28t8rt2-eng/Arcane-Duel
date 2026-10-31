'use strict';

const path=require('node:path');
const {app,BrowserWindow,Menu,session}=require('electron');
const {GAME_ENTRY,isGameUrl}=require('./url-policy.cjs');

app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');

const DESKTOP_PARTITION='persist:arcane-duel-selfhost';
let window=null;
let refreshing=false;

async function loadFreshGame(){
 if(refreshing||!window||window.isDestroyed())return;
 refreshing=true;
 try{
  // Fresh server releases, without deleting local storage, cookies or profiles.
  await window.webContents.session.clearCache();
  if(window&&!window.isDestroyed())await window.loadURL(GAME_ENTRY);
 }catch(error){
  console.warn('Arcane Duel server connection:',String(error.message||error));
  if(window&&!window.isDestroyed())void window.loadFile(path.join(__dirname,'offline.html'));
 }finally{refreshing=false;}
}

function createWindow(){
 const gameSession=session.fromPartition(DESKTOP_PARTITION);
 gameSession.setPermissionRequestHandler((sender,permission,callback,details)=>{
  const origin=details?.requestingUrl||sender.getURL();
  callback((permission==='clipboard-sanitized-write'||permission==='clipboard-write')&&isGameUrl(origin));
 });
 window=new BrowserWindow({
  title:'Arcane Duel',width:1440,height:900,minWidth:940,minHeight:620,
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
 contents.setWindowOpenHandler(()=>({action:'deny'}));
 contents.on('will-attach-webview',event=>event.preventDefault());
 contents.on('will-navigate',(event,url)=>{
  if(url===GAME_ENTRY&&contents.getURL().startsWith('file:')){
   event.preventDefault();void loadFreshGame();return;
  }
  if(isGameUrl(url))return;
  event.preventDefault();
 });
 contents.on('did-fail-load',(_event,code,_description,url,mainFrame)=>{
  if(mainFrame&&code!==-3&&isGameUrl(url)&&window&&!window.isDestroyed()){
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
