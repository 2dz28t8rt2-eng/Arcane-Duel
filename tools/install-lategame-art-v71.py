#!/usr/bin/env python3
"""Import the 16 user-approved WebP files from the single GitHub-uploaded ZIP.

Expected: artwork-import/lategame16-v71.zip
Writes: assets/custom-art/lategame-v71/late-01.webp ... late-16.webp
Then switches the already registered cards from safe procedural previews
to the exact approved originals. No game balance changes.
"""
from __future__ import annotations
import hashlib
import json
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
ARCHIVE = ROOT / "artwork-import" / "lategame16-v71.zip"
CARDS = ROOT / "assets" / "lategame-cards-v71.json"
LOADER = ROOT / "assets" / "lategame-monsters-v71.js"


def install() -> None:
    assert ARCHIVE.is_file(), f"Missing requested artwork upload: {ARCHIVE}"
    card_manifest = json.loads(CARDS.read_text(encoding="utf-8"))
    cards = card_manifest["cards"]
    assert len(cards) == 16 and [c["id"] for c in cards] == list(range(716, 732))
    expected = [c["art"] for c in cards]
    expected_set = set(expected) | {"lategame-manifest.json"}
    with zipfile.ZipFile(ARCHIVE) as zf:
        names = [p for p in zf.namelist() if not p.endswith("/")]
        assert len(names) == 17 and set(names) == expected_set, (
            "ZIP must contain exactly the 16 approved WebP paths and manifest, "
            f"found unexpected or missing items: {set(names) ^ expected_set}")
        check = json.loads(zf.read("lategame-manifest.json"))
        assert check["schema"] == "arcane-duel-artwork-import-v71"
        listed = {row["path"]: row["sha256"] for row in check["images"]}
        assert set(listed) == set(expected)
        validated = []
        for filename in expected:
            blob = zf.read(filename)
            assert 40_000 <= len(blob) <= 2_000_000, (
                f"Unexpected artwork size for {filename}: {len(blob)}")
            assert blob[:4] == b"RIFF" and blob[8:12] == b"WEBP", (
                f"Not WebP artwork: {filename}")
            assert hashlib.sha256(blob).hexdigest() == listed[filename], (
                f"Artwork SHA256 changed: {filename}")
            validated.append((filename, blob))
    source = LOADER.read_text(encoding="utf-8")
    if "const ARTWORK_INSTALLED=false;" in source:
        updated = source.replace("const ARTWORK_INSTALLED=false;",
                                 "const ARTWORK_INSTALLED=true;", 1)
    elif "const ARTWORK_INSTALLED=true;" in source:
        updated = source
    else:
        raise AssertionError("Registration code changed, refusing unsafe import")
    for filename, blob in validated:
        target = ROOT / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(blob)
    LOADER.write_text(updated, encoding="utf-8")
    print(f"Verified and installed {len(validated)} approved original artworks.")


if __name__ == "__main__":
    install()
