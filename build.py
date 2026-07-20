#!/usr/bin/env python3
"""Generate exercises.json (the app's trimmed dataset) from plan.json.

Reads every dataset_id referenced in plan.json, pulls just those records from
the full exercises-dataset, and writes exercises.json with GIF/thumbnail URLs
pointing at the upstream repo on raw.githubusercontent.com (media is © Gym
Visual and stays in the upstream repo — we hotlink, we don't redistribute).

Usage: python3 build.py
Fails loudly if any dataset_id in plan.json doesn't exist in the dataset.
"""
import json
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent
DATASET = APP.parent / "exercises-dataset" / "data" / "exercises.json"
RAW_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/"


def referenced_ids(plan):
    for day in plan["days"]:
        cardio = day.get("cardio") or {}
        if cardio.get("dataset_id"):
            yield cardio["dataset_id"], f'{day["id"]} cardio {cardio["name_en"]}'
        for ex in day["exercises"]:
            if ex.get("dataset_id"):
                yield ex["dataset_id"], f'{day["id"]} #{ex["num"]} {ex["name_en"]}'
            for swap in ex.get("swaps", []):
                if swap.get("dataset_id"):
                    yield swap["dataset_id"], f'{day["id"]} #{ex["num"]} swap {swap["name_en"]}'


def main():
    plan = json.loads((APP / "plan.json").read_text())
    dataset = {e["id"]: e for e in json.loads(DATASET.read_text())}

    refs = list(referenced_ids(plan))
    missing = [(i, where) for i, where in refs if i not in dataset]
    if missing:
        for i, where in missing:
            print(f"MISSING id {i}  ({where})", file=sys.stderr)
        sys.exit(1)

    out = {}
    for i, where in refs:
        if i in out:
            continue
        e = dataset[i]
        gif_file = APP.parent / "exercises-dataset" / e["gif_url"]
        if not gif_file.exists():
            print(f"MISSING GIF file {e['gif_url']}  ({where})", file=sys.stderr)
            sys.exit(1)
        out[i] = {
            "name": e["name"],
            "gif": RAW_BASE + e["gif_url"],
            "thumb": RAW_BASE + e["image"],
            "equipment": e["equipment"],
            "target": e["target"],
            "steps": e["instruction_steps"]["en"],
            "attribution": e["attribution"],
        }

    (APP / "exercises.json").write_text(
        json.dumps(out, indent=1, ensure_ascii=False) + "\n"
    )
    print(f"exercises.json written: {len(out)} unique exercises "
          f"({len(refs)} references, all resolved)")
    for i, where in refs:
        print(f"  {i}  {dataset[i]['name']:45s} <- {where}")


if __name__ == "__main__":
    main()
