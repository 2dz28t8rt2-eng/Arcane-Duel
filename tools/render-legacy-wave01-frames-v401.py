#!/usr/bin/env python3
"""Re-render already published Wave 01 PNGs with the new level trims.
Keeps all filenames/IDs and the existing metadata/collection untouched.
Run from the repo checkout. Requires installed Chromium.
"""
from pathlib import Path
from html.parser import HTMLParser
import base64,json,subprocess,sys,time
ROOT=Path(__file__).resolve().parents[1]
class Data(HTMLParser):
    def __init__(self):super().__init__();self.on=False;self.text=''
    def handle_starttag(self,tag,attrs):
        if tag=='script' and ('id','pngExport') in attrs:self.on=True
    def handle_endtag(self,tag):
        if tag=='script':self.on=False
    def handle_data(self,data):
        if self.on:self.text+=data

def main():
    chrome=next((p for p in ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'] if Path(p).exists()),None)
    if not chrome:raise RuntimeError('Chrome required')
    dest=ROOT/'assets/finished-cards/wave01'
    manifest=json.loads((dest/'manifest.json').read_text(encoding='utf8'))
    server=subprocess.Popen([sys.executable,'-m','http.server','8757','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        time.sleep(2)
        p=subprocess.run([chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--virtual-time-budget=90000','--dump-dom','http://127.0.0.1:8757/tools/finished-card-renderer.html?wave=01'],capture_output=True,timeout=160)
        text=p.stdout.decode('utf8','replace')
        if 'data-card-export="pass"' not in text:raise RuntimeError('Wave01 renderer failed')
        parser=Data();parser.feed(text)
        data=json.loads(parser.text)
        assert data['wave']=='01' and len(data['cards'])==len(manifest['cards'])==10
        old={row['id']:row for row in manifest['cards']}
        new=[]
        for entry in data['cards']:
            id=entry['id'];assert id in old
            card=entry['metadata']['card'];frame=entry['metadata']['frame']
            prior=old[id]
            assert card['name']==prior['name'] and card['level']==prior['level'] and card['atk']==prior['atk'] and card['def']==prior['def']
            image=base64.b64decode(entry['base64'])
            assert image[:8]==bytes.fromhex('89504e470d0a1a0a')
            assert int.from_bytes(image[16:20],'big')==768 and int.from_bytes(image[20:24],'big')==1224
            (dest/prior['filename']).write_bytes(image)
            prior['frame']=frame
            new.append(prior)
        dest.joinpath('kontaktbogen.png').write_bytes(base64.b64decode(data['sheet']))
        dest.joinpath('kontaktbogen-preview.webp').write_bytes(base64.b64decode(data['preview']))
        manifest['cards']=new
        dest.joinpath('manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        print('Re-rendered 10 Wave 01 PNGs with per-level rims; filenames preserved.')
    finally:
        server.terminate();server.wait(timeout=10)
if __name__=='__main__':main()
