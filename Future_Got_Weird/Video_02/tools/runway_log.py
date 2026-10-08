#!/usr/bin/env python3
"""Runway generation log: one JSON record per paid attempt, plus the measured facts of each downloaded clip.

  python3 tools/runway_log.py add  --shot R1 --attempt 1 --task <task id> --model kling-3-pro --prompt-file p.txt \
        --start runway/R1/start.png --end runway/R1/end.png --ratio 16:9 --duration 5 --use "S1.1 s01 ..." \
        --balance-before 2250 --balance-after 2190 [--settings '{"resolution": "1080p"}']
  python3 tools/runway_log.py probe --shot R1 --attempt 1 --file runway/R1/R1_a1_raw.mp4
  python3 tools/runway_log.py decide --shot R1 --attempt 1 --status accepted|rejected --reason "..." [--range 12-96]
  python3 tools/runway_log.py report   -> runway/RUNWAY_LOG.md

Records live in runway/runway_log.json. The log holds no credentials; task IDs and Runway asset URLs are private and
are kept out of the public package (the description and credits never cite them).
"""
import argparse
import hashlib
import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(ROOT, "runway/runway_log.json")


def load():
    return json.load(open(LOG)) if os.path.exists(LOG) else {"cap_credits": 500, "attempts": []}


def save(d):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    json.dump(d, open(LOG, "w"), indent=1)
    open(LOG, "a").write("\n")


def find(d, shot, attempt):
    for a in d["attempts"]:
        if a["shot"] == shot and a["attempt"] == attempt:
            return a
    raise SystemExit(f"no record {shot} attempt {attempt}")


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def rel(p):
    return os.path.relpath(os.path.abspath(p), ROOT) if p else None


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
                          "stream=width,height,r_frame_rate,avg_frame_rate,nb_read_frames,codec_name,pix_fmt:format=duration",
                          "-of", "json", path], capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    s = j["streams"][0]
    num, den = (int(x) for x in s["r_frame_rate"].split("/"))
    return {"width": s["width"], "height": s["height"], "fps": round(num / den, 3), "frames": int(s["nb_read_frames"]),
            "duration_s": round(float(j["format"]["duration"]), 3), "codec": s["codec_name"], "pix_fmt": s["pix_fmt"]}


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("add")
    for k in ("shot", "task", "model", "prompt-file", "start", "end", "ratio", "use", "settings", "resolution"):
        a.add_argument("--" + k)
    a.add_argument("--attempt", type=int, required=True)
    a.add_argument("--duration", type=float)
    a.add_argument("--balance-before", type=float)
    a.add_argument("--balance-after", type=float)
    p = sub.add_parser("probe")
    p.add_argument("--shot", required=True)
    p.add_argument("--attempt", type=int, required=True)
    p.add_argument("--file", required=True)
    c = sub.add_parser("decide")
    c.add_argument("--shot", required=True)
    c.add_argument("--attempt", type=int, required=True)
    c.add_argument("--status", choices=["accepted", "rejected", "pending"], required=True)
    c.add_argument("--reason", default="")
    c.add_argument("--range", default=None, help="selected source frames, e.g. 12-96")
    sub.add_parser("report")
    args = ap.parse_args()
    d = load()

    if args.cmd == "add":
        rec = {"shot": args.shot, "attempt": args.attempt, "task_id": args.task, "model": args.model,
               "prompt": open(args.prompt_file).read().strip() if args.prompt_file else None,
               "start_frame": rel(args.start), "start_sha256": sha(args.start) if args.start else None,
               "end_frame": rel(args.end), "end_sha256": sha(args.end) if args.end else None,
               "ratio": args.ratio, "duration_requested_s": args.duration, "resolution_requested": args.resolution,
               "settings": json.loads(args.settings) if args.settings else {}, "seed": None,
               "expected_use": args.use, "balance_before": args.balance_before, "balance_after": args.balance_after,
               "cost_credits": (args.balance_before - args.balance_after)
               if args.balance_before is not None and args.balance_after is not None else None,
               "raw_output": None, "measured": None, "status": "pending", "reason": "", "selected_range": None}
        d["attempts"] = [x for x in d["attempts"] if not (x["shot"] == args.shot and x["attempt"] == args.attempt)]
        d["attempts"].append(rec)
    elif args.cmd == "probe":
        r = find(d, args.shot, args.attempt)
        r["raw_output"] = rel(args.file)
        r["raw_sha256"] = sha(args.file)
        r["measured"] = probe(args.file)
    elif args.cmd == "decide":
        r = find(d, args.shot, args.attempt)
        r["status"], r["reason"], r["selected_range"] = args.status, args.reason, args.range
    elif args.cmd == "report":
        pass
    spent = sum(x["cost_credits"] or 0 for x in d["attempts"])
    d["spent_credits"] = spent
    save(d)

    lines = ["# Runway generation log (Video 02)", "",
             f"Cap for this packet: {d['cap_credits']} credits, at most two paid attempts per shot. "
             f"Spent so far: **{spent:g} credits** (measured from the balance before and after each job).", "",
             "| shot | try | model | requested | measured | cost | status | reason |", "|---|---|---|---|---|---|---|---|"]
    for x in sorted(d["attempts"], key=lambda x: (x["shot"], x["attempt"])):
        m = x.get("measured") or {}
        meas = f"{m['width']}×{m['height']} {m['fps']:g} fps {m['duration_s']:g} s" if m else "–"
        req = f"{x.get('ratio') or ''} {x.get('resolution_requested') or ''} {x.get('duration_requested_s') or ''} s".strip()
        cost = "–" if x["cost_credits"] is None else f"{x['cost_credits']:g}"
        lines.append(f"| {x['shot']} | {x['attempt']} | {x['model']} | {req} | {meas} | {cost} | {x['status']} | {x['reason']} |")
    lines += ["", "Prompts, input frames (with SHA-256), task IDs and raw outputs for every attempt are in "
              "`runway/runway_log.json`. Generated clips are source quality as measured above; any upscale in the "
              "4K master is an upscale, not native 4K generation."]
    open(os.path.join(ROOT, "runway/RUNWAY_LOG.md"), "w").write("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
