#!/usr/bin/env python3
"""Build a versioned historical AI experiment index from genuine Github Actions ZIPs.
Only same-run policy arms are directly comparable; never train on 'holdout'.
Does NOT hallucinate state/action labels from aggregate match reports.
Usage: python scripts/build-ai-history-v130.py --output models/ai-history-v130.json path/to/arcane-*.zip
"""
import argparse
import hashlib
import json
import pathlib
import zipfile

TIERS = (4, 6, 7, 8, 9, 10)
def digest(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()

def parse_zip(path):
    with zipfile.ZipFile(path) as z:
        names = [n for n in z.namelist() if n.endswith(".json") and not n.startswith("__MACOSX")]
        if len(names) != 1:
            raise ValueError(f"{path}: expected exactly one JSON report, got {names!r}")
        result = json.loads(z.read(names[0]))
    if "raw" not in result or "arms" not in result or "schema" not in result:
        raise ValueError(f"{path}: not a versioned career dataset")
    raw = result["raw"]
    if any(not isinstance(x.get("highestReallyCleared"), (int, float)) or
           "treatment" not in x or "split" not in x for x in raw):
        raise ValueError(f"{path}: missing auditable career outcomes")
    arms = result["arms"]
    if set(x["treatment"] for x in raw) != set(arms):
        raise ValueError(f"{path}: incomplete comparison arms")
    splits = {}
    for split in ("train", "holdout"):
        splits[split] = {}
        for arm in arms:
            items = [r for r in raw if r["split"] == split and r["treatment"] == arm]
            if not items:
                raise ValueError(f"{path}: empty {split}/{arm}")
            splits[split][arm] = {
                "careers": len(items),
                "clearedByTier": {str(t): sum(r["highestReallyCleared"] >= t for r in items) for t in TIERS},
                "totalMatches": sum(r.get("totalMatches", 0) for r in items),
            }
    return {
        "artifact": path.name, "sha256": digest(path), "schema": result["schema"],
        "experiment": result.get("experiment", "")[:300], "arms": arms,
        "totalCareers": len(raw), "splits": splits,
        "actionTransitionsAvailable": False,
        "rulesComparableOnlyWithinExperiment": True,
    }

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", required=True)
    ap.add_argument("files", nargs="+", type=pathlib.Path)
    args = ap.parse_args()
    rows = [parse_zip(p) for p in args.files]
    schemas = [r["schema"] for r in rows]
    if len(schemas) != len(set(schemas)):
        raise ValueError("duplicate schema, use one canonical artifact per experiment")
    data = {
        "schema": "arcane-ai-experiment-memory-v130",
        "purpose": "Training-only versioned prior experiment evidence",
        "noHiddenInformation": True,
        "modelTrained": False,
        "noActionLevelSupervision": True,
        "holdoutMustNotBeFit": True,
        "experiments": rows
    }
    target = pathlib.Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True)+"\n", encoding="utf8")
    print(json.dumps({"experiments": len(rows),
                      "careerRecords": sum(r["totalCareers"] for r in rows),
                      "output": str(target)}, ensure_ascii=False))

if __name__ == "__main__":
    main()
