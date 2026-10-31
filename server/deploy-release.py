"""Administrator-only deployment. Never run commands or service definitions from uploads."""
from pathlib import Path, PurePosixPath
import os,sys,json,tarfile,hashlib,subprocess,tempfile,fcntl,time,urllib.request,re,shutil

if os.geteuid()!=0:raise SystemExit('Only the administrator may activate a release.')
if len(sys.argv)!=3:raise SystemExit('Usage: arcane-duel-release ARCHIVE SHA256')
archive=Path(sys.argv[1]).resolve();expected=sys.argv[2]
upload=Path('/srv/arcane-duel-upload/uploads')
if not archive.is_relative_to(upload) or not re.fullmatch(r'[a-f0-9]{64}',expected):raise SystemExit('Invalid upload path or SHA256')
if archive.stat().st_size>350_000_000:raise SystemExit('Archive too large')
base=Path('/opt/arcane-duel');releases=base/'releases';releases.mkdir(parents=True,exist_ok=True)
lock=(base/'deploy.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
stage=Path(tempfile.mkdtemp(prefix='.staging-',dir=releases))
# Copy upload to a root-owned file before validating: upload users cannot change it
# between the checksum check and extraction.
sealed=stage/'upload.tar.gz'
with archive.open('rb') as src,sealed.open('xb') as dst:
 import shutil
 shutil.copyfileobj(src,dst)
with sealed.open('rb') as source:
 if hashlib.file_digest(source,'sha256').hexdigest()!=expected:raise SystemExit('Archive checksum mismatch')
with tarfile.open(sealed,'r:gz') as tar:
 members=tar.getmembers()
 if len(members)>5000 or sum(m.size for m in members)>600_000_000:raise SystemExit('Archive limits exceeded')
 names=set()
 for m in members:
  p=PurePosixPath(m.name)
  if not m.isfile() or m.size>30_000_000 or p.is_absolute() or '..' in p.parts or '\\' in m.name or m.name in names:raise SystemExit('Unsafe archive member')
  if not(m.name=='release.json' or p.parts[0] in ('assets','models','server') or m.name.startswith('supabase/functions/arcane-duo-v2/') or m.name in ['index.html','duo-campaign-v2.html','duo-campaign.html','duo-online.html','art-gallery.html','collection-v3.html','arcane-host-config.js','desktop/build/icon.png','desktop/build/icon.ico']):raise SystemExit('Unexpected release path')
  names.add(m.name)
 release=json.load(tar.extractfile('release.json'))
 if not re.fullmatch(r'\\d+\\.\\d+\\.\\d+',str(release.get('version',''))) or release.get('dirty') or not re.fullmatch(r'[a-f0-9]{40}',release['revision']):
  raise SystemExit('Release must have a numbered, committed and reviewed game version')
 if release['id']!='v'+release['version']+'-'+release['revision'][:12]:
  raise SystemExit('Release ID does not match the canonical game version and commit')
 if set(release['files'])!=names-{'release.json'}:raise SystemExit('Manifest file set differs')
 for m in members:
  data=tar.extractfile(m).read()
  if m.name!='release.json' and hashlib.sha256(data).hexdigest()!=release['files'][m.name]:raise SystemExit('Release file checksum mismatch')
  target=stage/m.name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);target.chmod(0o644)
sealed.unlink()
for p in stage.rglob('*'):
 if p.is_dir():p.chmod(0o755)
stage.chmod(0o755)
# Retain at most the current fully healthy release plus its immediate predecessor.
# Both singleplayer and multiplayer ship together in each verified release folder.
# No application data, SQLite files, other services, or backup directories are touched.
def prune_committed_releases(active,previous):
 def is_managed(p):
  return p.parent==releases and bool(re.fullmatch(r'(?:v229|v\\d+\\.\\d+\\.\\d+)-[a-f0-9]{12}',p.name))
 if not is_managed(active) or (previous is not None and not is_managed(previous)):
  raise RuntimeError('Unsafe release path; retention refused')
 if active.is_symlink() or not active.is_dir():
  raise RuntimeError('Active release is not a real directory')
 if previous is not None and (previous.is_symlink() or not previous.is_dir()):
  raise RuntimeError('Previous release is missing or not a real directory')
 keep={active.name}
 if previous is not None:keep.add(previous.name)
 removed=[]
 for candidate in sorted(releases.iterdir()):
  if not re.fullmatch(r'(?:v229|v\\d+\\.\\d+\\.\\d+)-[a-f0-9]{12}',candidate.name) or candidate.name in keep:continue
  if candidate.is_symlink() or not candidate.is_dir():
   raise RuntimeError('Unsafe retired release path; retention refused')
  shutil.rmtree(candidate)
  removed.append(candidate.name)
 # A verified release contains both game modes. Remove old upload archives too.
 # Never touch unrelated uploads, symlinks, staging areas or private player data.
 for candidate in upload.iterdir():
  match=re.fullmatch(r'(v229-[a-f0-9]{12})\.tar\.gz(?:\.sha256)?',candidate.name)
  if match and match.group(1) not in keep and candidate.is_file() and not candidate.is_symlink():
   candidate.unlink()
 return {'kept':sorted(keep),'removed':removed}

target=releases/release['id']
if target.exists():raise SystemExit('Release already exists')
os.replace(stage,target)
current=base/'current';old=current.resolve() if current.is_symlink() else None
# Never activate over an unrecognized active release. This also protects rollback.
if old and (old.parent!=releases or not re.fullmatch(r'(?:v229|v\\d+\\.\\d+\\.\\d+)-[a-f0-9]{12}',old.name) or not old.is_dir()):
 raise SystemExit('Unexpected existing active release; no activation performed')
if old:subprocess.run(['systemctl','start','arcane-duel-backup.service'],check=True)
def activate(p):
 link=base/'current.next'
 if link.is_symlink():link.unlink()
 link.symlink_to(p,target_is_directory=True);os.replace(link,current)
activate(target)
try:
 subprocess.run(['systemctl','restart','arcane-duel.service'],check=True)
 for attempt in range(20):
  try:
   with urllib.request.urlopen('http://127.0.0.1:8777/api/health',timeout=3) as r:health=json.load(r)
   if health.get('revision')==release['revision']:break
  except Exception:pass
  time.sleep(1)
 else:raise RuntimeError('New release failed health check')
except Exception:
 if old:activate(old);subprocess.run(['systemctl','restart','arcane-duel.service'],check=True)
 else:subprocess.run(['systemctl','stop','arcane-duel.service'],check=False)
 # The new build was never accepted as a working version; remove only its
 # own freshly created directory after the previous symlink is restored.
 if target.is_dir() and not target.is_symlink() and (not current.is_symlink() or current.resolve()!=target):
  shutil.rmtree(target)
 raise
# Prune ONLY after successful restart and matching health revision.
# On failed health verification the previous release remains available for rollback.
retention=prune_committed_releases(target,old)
print(json.dumps({'activated':release['id'],'revision':release['revision'],
 'previous':str(old) if old else None,'retention':retention}))
