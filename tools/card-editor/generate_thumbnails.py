"""Embed small previews of real card art into the single-file Windows editor.
Only PREVIEWS are embedded. Card source image paths remain untouched.
"""
from __future__ import annotations
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "tools" / "card-editor" / "Generated" / "Thumbnails"
DEST.mkdir(parents=True, exist_ok=True)
catalog = json.loads((ROOT / "assets" / "duo-card-catalog-v160.json").read_text(encoding="utf-8"))
art_paths = sorted({
    c.get("art", "") for c in catalog["cards"]
    if isinstance(c.get("art"), str) and c.get("art", "").startswith("assets/")
})
manifest = {}
missing = []
for art in art_paths:
    source = (ROOT / art).resolve()
    if not source.is_relative_to(ROOT) or not source.is_file():
        missing.append(art)
        continue
    digest = hashlib.sha256(art.encode("utf-8")).hexdigest()[:20]
    target = DEST / (digest + ".jpg")
    try:
        with Image.open(source) as image:
            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((300, 380), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (300, 380), (29, 25, 37))
            canvas.paste(image, ((300 - image.width)//2, (380 - image.height)//2))
            canvas.save(target, "JPEG", quality=78, optimize=True, progressive=True)
        manifest[art] = digest
    except (OSError, ValueError) as exc:
        missing.append(art + ": " + str(exc))
(DEST / "index.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("Artwork previews:", len(manifest), "| Missing or unsupported:", len(missing))
for p in missing[:10]:
    print("Warning:", p)
if len(manifest) < 100:
    raise RuntimeError("Too few original artworks available; cannot package the editor.")
