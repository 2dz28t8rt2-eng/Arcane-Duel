#!/usr/bin/env python3
"""Install exactly 15 user-approved original WebP artworks into Arcane Duel.
Runs from GitHub Actions after the approved ZIP has been placed in the repository.
Never accepts arbitrary archive paths, changes stats or renumbers cards.
"""
import io
import json
import pathlib
import re
import sys
import zipfile
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
ZIP = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else
                   "artwork-import/arcane-approved-15.zip")
if not ZIP.is_absolute():
    ZIP = ROOT / ZIP

FATE = (
    "sternenrichter", "himmlischer-loewenwaechter",
    "schicksalsdrache", "ewigkeitswaechter", "sonnenseraph",
    "astralgreif", "nebelkaiser", "kometenbestie",
    "himmelsarchon", "kosmischer-titan",
)
FUSIONS = {
    46: ("Eibenwächter", "eibenwaechter"),
    49: ("Eisenzahn", "eisenzahn"),
    50: ("Bastion Ferrus", "bastion-ferrus"),
    54: ("Rubin-Seraph", "rubin-seraph"),
    58: ("Waldgeist Veyra", "waldgeist-veyra"),
}
expected = {
    *(f"assets/custom-art/fate/{slug}.webp" for slug in FATE),
    *(f"assets/custom-art/qa/{slug}.webp" for name, slug in FUSIONS.values()),
}
if not ZIP.is_file():
    raise SystemExit(f"Approved ZIP not found: {ZIP}")

with zipfile.ZipFile(ZIP) as z:
    actual = set(z.namelist())
    if actual != expected:
        raise SystemExit(f"Expected exactly {len(expected)} artworks. "
                         f"Missing={sorted(expected-actual)} "
                         f"Unexpected={sorted(actual-expected)}")
    files = {}
    for filename in sorted(expected):
        info = z.getinfo(filename)
        if info.file_size < 60_000 or info.file_size > 12_000_000:
            raise ValueError(f"Invalid image byte size: {filename}")
        contents = z.read(info)
        if contents[:4] != b"RIFF" or contents[8:12] != b"WEBP":
            raise ValueError(f"Invalid WebP signature: {filename}")
        with Image.open(io.BytesIO(contents)) as pic:
            pic.verify()
        with Image.open(io.BytesIO(contents)) as pic:
            if pic.size != (1086, 1448):
                raise ValueError(f"Image resolution not approved: {filename} {pic.size}")
        files[filename] = contents

# Validate all target identities before writing anything.
manifest_path = ROOT / "assets/collection-v3-data.js"
prefix = "window.ARCANE_COLLECTION_V3="
source = manifest_path.read_text(encoding="utf8")
if not source.startswith("/*") or prefix not in source:
    raise ValueError("Collection 3 manifest format changed")
head, sep, payload = source.partition(prefix)
cards = json.loads(payload.strip().removesuffix(";"))
for cid, (name, slug) in FUSIONS.items():
    cards_of_id = [card for card in cards if card["id"] == cid]
    if len(cards_of_id)!=1 or cards_of_id[0]["name"] != name:
        raise ValueError(f"Identity mismatch in collection manifest: {cid}")
    cards_of_id[0]["art"] = f"assets/custom-art/qa/{slug}.webp"

fatefile = ROOT / "assets/fate-illustrations.js"
fate_source = fatefile.read_text(encoding="utf8")
new_map = "const approvedRaster=Object.freeze({" + ",".join(
    f"{i}:'assets/custom-art/fate/{slug}.webp'"
    for i, slug in enumerate(FATE)
) + "});"
modified_fate, substitutions = re.subn(
    r"const approvedRaster=Object.freeze\(\{[^}]*\}\);",
    lambda m: new_map, fate_source, count=1)
if substitutions!=1:
    raise ValueError("Fate artwork map anchor missing")
if "Himmlischer Löwenwächter" not in modified_fate:
    raise ValueError("Lion name must already be defined")

# The runtime override is installed *after* all older artwork layers.
override = (
    "/* Arcane Duel v5.6 – five approved new illustrations. */\n"
    "'use strict';\n(()=>{\n"
    "const expected=[\n" +
    "".join(
        f"  [{cid},{json.dumps(name, ensure_ascii=False)},"
        f"'assets/custom-art/qa/{slug}.webp'],\n"
        for cid, (name, slug) in FUSIONS.items()) +
    "];\n"
    "for(const [id,name,art] of expected){\n"
    "  if(CARDS[id]?.name!==name||!CARDS[id].fusionOnly)\n"
    "    throw Error('Freigegebenes Artwork: Karten-ID oder Name abweichend: '+id);\n"
    "  CARDS[id].art=art;CARDS[id].customArt=art;CARDS[id].artWave='approved-5.6';\n"
    "}\n"
    "window.ArcaneApprovedArt56=Object.freeze({version:'5.6',count:expected.length});\n"
    "})();\n"
)
indexpath = ROOT / "index.html"
index_source = indexpath.read_text(encoding="utf8")
script = '<script src="assets/approved-art-v56.js?v=20261019-approved-15" defer></script>'
if script not in index_source:
    anchor = "</body></html>"
    if anchor not in index_source:
        raise ValueError("Cannot inject final artwork override")
    index_source = index_source.replace(anchor, script+anchor,1)
index_source = re.sub(r'assets/fate-illustrations\.js\?v=[^"]+',
                      'assets/fate-illustrations.js?v=20261019-approved-15',
                      index_source, count=1)

# Atomic-ish validation: no files are touched until every image and source
# mapping has been checked. Publish bytes with the exact approved filenames.
for filename, contents in files.items():
    dest=ROOT/filename
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(contents)
manifest_path.write_text(head + prefix + json.dumps(
    cards, ensure_ascii=False, separators=(",",":")) + ";\n",
    encoding="utf8")
fatefile.write_text(modified_fate,encoding="utf8")
(ROOT/"assets/approved-art-v56.js").write_text(override,encoding="utf8")
indexpath.write_text(index_source,encoding="utf8")
print(f"APPROVED_ART_IMPORTED 15 entries; fate={len(FATE)}, qa={len(FUSIONS)}")
