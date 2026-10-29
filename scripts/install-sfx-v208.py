#!/usr/bin/env python3
"""One-shot, strictly hash-verified import of files from the artist URLs
provided in Game Sound 2(1).zip. Never silently substitute different audio.
"""
from __future__ import annotations
import hashlib
import html
import io
import pathlib
import re
import subprocess
import tempfile
import urllib.parse
import urllib.request
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET = ROOT / "assets" / "sfx-v208"
FILES = {
"d4767b64c8c6f662369acc9ecb0dd70a7c6c429efb342aa865f369a4d4a561fa": "fusion-orbit",
"a8f6a2829aaaf20ce3f8712daf77db9f30979f023d70a6e27752d73130a20145": "summon",
"b6802e6ef22189058a4406ae5c7bda9a54c47e908fad3fd6212650c1aa0170af": "draw",
"f5855b55f21e292a96a253d9ac16c21bc8a6af454176a983865a6542906ae90d": "destroy",
"e4eac77003a715e48574020e066011a42163f33db7ec03ee87b6910bc356bff2": "lose",
"a256fed637c0615229c5dbad52f36df623bfa8a491aa15211a8b8dc9f65769ba": "damage",
"b14c72462998b80185feee76d0d440509de37544c5419e11491da3d7db73bb3f": "decay",
"21408ad6855085f74395c2257d4abfffe89bb1e6f3c020bcdcd13648380e182f": "powerup",
"67d1e35bca545c9c17618333265deb90ed506d14e5b45ea730ef012695bd682a": "leader-idle",
"7dc09cc3c3e424b66ac564ac83ac89ee91885c964780694d13f2c4957ac813c7": "leader-roar",
"905777ca4583d55734a655c7f26dac23e5998e4e22ee393971cfa4dc76c6662d": "menu",
"fad84611ce3e64b8aa13b9f9e155d5b709045f42ccde8ab5bb94351e17693eac": "win",
"74c1243abe26f4577d88ac9a9c740f238c9736941e5ddf6a8050e62503d6b024": "fusion-calc",
}
found: dict[str, bytes] = {}
UA = {"User-Agent": "Mozilla/5.0 (compatible; ArcaneDuelAssets/1.0)"}

def retrieve(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as response:
        blob = response.read(70 * 1024 * 1024 + 1)
    if len(blob) > 70 * 1024 * 1024:
        raise ValueError("Unreasonably large source archive")
    return blob

def inspect(name: str, data: bytes):
    digest = hashlib.sha256(data).hexdigest()
    if digest in FILES:
        key = FILES[digest]
        if key not in found:
            found[key] = data
            print("MATCH:", key, name, len(data))

def download(url: str):
    print("Source:", url, flush=True)
    try:
        content = retrieve(url)
        if zipfile.is_zipfile(io.BytesIO(content)):
            with zipfile.ZipFile(io.BytesIO(content)) as z:
                for item in z.infolist():
                    if item.is_dir() or item.file_size > 30 * 1024 * 1024:
                        continue
                    if item.filename.lower().endswith((".wav",".flac",".mp3",".ogg")):
                        inspect(item.filename, z.read(item))
        else:
            inspect(url, content)
    except Exception as exc:
        print("WARN:", type(exc).__name__, str(exc)[:180], flush=True)

download("https://opengameart.org/sites/default/files/Sci-Fi%20Sound%20Library.zip")
download("https://opengameart.org/sites/default/files/shimmer_1.flac")
download("https://opengameart.org/sites/default/files/troll-roars_0.ogg")
download("https://opengameart.org/sites/default/files/troll-idle-noises.ogg")
# This upload page may provide a zipped collection or individual WAV links.
page = "https://opengameart.org/content/ignisforge-free-sfx-sampler-43-synthesized-retro-sound-effects"
try:
    markup = retrieve(page).decode("utf-8", errors="replace")
    addresses = []
    for token in re.findall(r'href=["\\\']([^"\\\']+)["\\\']', markup, flags=re.I):
        url = urllib.parse.urljoin(page, html.unescape(token))
        if (url.startswith("https://opengameart.org/sites/default/files/") and
            urllib.parse.urlparse(url).path.lower().endswith((".zip",".wav",".ogg",".mp3",".flac"))):
            addresses.append(url)
    for address in dict.fromkeys(addresses[:12]):
        download(address)
except Exception as exc:
    print("WARN IgnisForge source:", type(exc).__name__, str(exc)[:180])

TARGET.mkdir(parents=True, exist_ok=True)
for key, data in found.items():
    output = TARGET / (key + ".ogg")
    if output.exists():
        continue
    with tempfile.TemporaryDirectory() as td:
        inp = pathlib.Path(td) / "input.wav"
        inp.write_bytes(data)
        cmd = ["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(inp)]
        if key == "leader-roar":
            cmd += ["-t","1.15","-af","afade=t=out:st=0.96:d=0.19"]
        cmd += ["-vn","-c:a","libvorbis","-q:a","5",str(output)]
        subprocess.run(cmd,check=True)
        print("ENCODED:",output,len(data),flush=True)
not_found = sorted(set(FILES.values()) - set(found))
print("Verified:",len(found),"/",len(FILES),"; missing:",", ".join(not_found))
if not found:
    raise SystemExit("No audio matched the uploaded archive's SHA-256 checksums; manual archive import required.")
