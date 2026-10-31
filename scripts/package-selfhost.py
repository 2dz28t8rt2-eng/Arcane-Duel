"""Create a reproducible, checksummed Arcane Duel upload from a reviewed checkout."""
from pathlib import Path
import argparse, subprocess, json, hashlib, tarfile, io, re

root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--output',required=True)
parser.add_argument('--allow-dirty',action='store_true',help='Local QA packages only')
args=parser.parse_args()
revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
changed=subprocess.check_output(['git','status','--porcelain','--untracked-files=all'],cwd=root,text=True).splitlines()
changed=[line for line in changed if not line[3:].startswith('artifacts/')]
if changed and not args.allow_dirty:raise SystemExit('Commit/review changes before creating a release.')
html=(root/'index.html').read_text(encoding='utf-8')
match=re.search(r'<meta\s+name="arcane-duel-version"\s+content="(\d+\.\d+\.\d+)"',html)
if not match:raise SystemExit('Canonical Arcane Duel version missing or invalid')
version=match.group(1)
duo=(root/'duo-campaign-v2.html').read_text(encoding='utf-8')
if not re.search(r'<meta\s+name="arcane-duel-version"\s+content="'+re.escape(version)+'"',duo):
 raise SystemExit('Solo and multiplayer versions do not agree')
release_id='v'+version+'-'+revision[:12]+('-qa' if changed else '')
files=[]
for directory in ['assets','models','server','supabase/functions/arcane-duo-v2']:
 for p in sorted((root/directory).rglob('*')):
  if p.is_symlink():raise SystemExit('Symlinks cannot be released')
  if p.is_file() and '__pycache__' not in p.parts:files.append(p)
files += [root/n for n in ['index.html','duo-campaign-v2.html','duo-campaign.html','duo-online.html','art-gallery.html','collection-v3.html','arcane-host-config.js','desktop/build/icon.png','desktop/build/icon.ico']]
manifest={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
release={'id':release_id,'revision':revision,'files':manifest,'dirty':bool(changed),'version':version}
dest=Path(args.output).resolve();dest.mkdir(parents=True,exist_ok=True)
archive=dest/(release_id+'.tar.gz')
with tarfile.open(archive,'w:gz') as tar:
 for p in files:
  name=p.relative_to(root).as_posix();data=p.read_bytes();info=tarfile.TarInfo(name);info.size=len(data);info.mode=0o644;tar.addfile(info,io.BytesIO(data))
 data=json.dumps(release,ensure_ascii=False,indent=2).encode();info=tarfile.TarInfo('release.json');info.size=len(data);info.mode=0o644;tar.addfile(info,io.BytesIO(data))
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix(archive.suffix+'.sha256').write_text(digest+'  '+archive.name+'\n',encoding='ascii')
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':digest,'files':len(files),'id':release_id},indent=2))
