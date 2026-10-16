#!/usr/bin/env python3
"""Bring official Tesla footage into the Short.

Two ways in:
  A) the full replay plus a cut list:
       ingest_footage.py --replay /path/replay.mp4 --cuts footage/cuts.json
     cuts.json = {"F1_AIRBORNE": "0:14:32.5", "F2_RAMP_CLIMB": "0:11:05", ...}  (replay time of each slot's `in` frame)
  B) per-slot clips the owner already trimmed:
       ingest_footage.py --clips /path/dir     (files named F1_AIRBORNE.mp4, F2_RAMP_CLIMB.mp4, ...)
     `in` is set to the clip's handle (PRE seconds, default 3.6 for F1 and 0.5 otherwise) unless --in-json overrides it.

Each slot is cut or re-encoded with handles into source/public/footage/<SLOT>.mp4 (H.264 CRF 16, 30 fps, AAC). `file`
and `in` are updated in source/src/data/footage.json, and a frame sheet is written to qa/footage/<SLOT>.png so every
clip can be inspected. Each ingest is logged in footage/CLIP_LEDGER.md (source, replay timecodes, license note).
"""
import argparse, datetime, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, 'source/src/data/footage.json')
OUTDIR = os.path.join(ROOT, 'source/public/footage')
QADIR = os.path.join(ROOT, 'qa/footage')
LEDGER = os.path.join(ROOT, 'footage/CLIP_LEDGER.md')
# seconds needed before / after the slot's `in` frame (Short shot lengths + offsets + a margin)
NEED = {
    # Short needs: F1 3.4 before / 2.4 after, F2 2.0, F3 2.1, F4 2.9, F5 2.0, F6 4.2; the paused companion needs more after
    'F1_AIRBORNE': (3.6, 5.0), 'F2_RAMP_CLIMB': (0.5, 5.8), 'F3_INVERTED': (0.5, 5.0), 'F4_LAUNCH_ROLL': (0.6, 7.3),
    'F5_LANDING': (0.5, 2.4), 'F6_FIVE_VEHICLES': (0.5, 4.6), 'F7_ACCEL_RUN': (0.5, 4.0), 'F8_OPTIMUS_SEAT': (0.5, 8.5),
}
SOURCE_URL = 'https://x.com/Tesla/status/2110788059008819215'

def secs(tc):
    if isinstance(tc, (int, float)):
        return float(tc)
    parts = [float(p) for p in str(tc).split(':')]
    return sum(p * 60 ** i for i, p in enumerate(reversed(parts)))

def tc(s):
    return str(datetime.timedelta(seconds=round(s, 2)))

def encode(src, start, dur, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0, start):.3f}', '-i', src, '-t', f'{dur:.3f}', '-r', '30',
                    '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k',
                    '-ar', '48000', '-movflags', '+faststart', out], check=True)

def sheet(clip, slot, in_s):
    os.makedirs(QADIR, exist_ok=True)
    out = os.path.join(QADIR, slot + '.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', clip, '-vf',
                    "fps=4,scale=480:-2,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x5",
                    '-frames:v', '1', out], check=True)
    return out

def probe(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_type', '-of', 'json', p],
                       capture_output=True, text=True, check=True)
    return json.loads(r.stdout)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--replay'); ap.add_argument('--cuts'); ap.add_argument('--clips'); ap.add_argument('--in-json')
    ap.add_argument('--source-url', default=SOURCE_URL)
    ap.add_argument('--license', default='Official Tesla replay; short excerpts used for commentary/analysis. Owner to confirm rights.')
    a = ap.parse_args()
    man = json.load(open(MANIFEST))
    os.makedirs(OUTDIR, exist_ok=True)
    rows = []
    if a.cuts:
        # cuts.json: {SLOT: "0:14:32.5"} with --replay, or {SLOT: {"file": path, "in": s, "post": s, "cx": .., "cy": .., "zoom": ..}}
        cuts = json.load(open(a.cuts))
        base = os.path.dirname(os.path.abspath(a.cuts))
        for slot, spec in cuts.items():
            if slot.startswith('_'):
                continue
            spec = spec if isinstance(spec, dict) else {'in': spec}
            src = spec.get('file') and os.path.join(base, spec['file']) or a.replay
            pre, post = NEED[slot]
            post = max(post, spec.get('post', 0))
            t_in = secs(spec['in'])
            dur = float(probe(src)['format']['duration'])
            start, end = max(0, t_in - pre), min(dur, t_in + post)
            out = os.path.join(OUTDIR, slot + '.mp4')
            encode(src, start, end - start, out)
            man['slots'][slot].update(file=slot + '.mp4', **{'in': round(t_in - start, 3)},
                                      **{k: spec[k] for k in ('cx', 'cy', 'zoom', 'audio', 'label', 'want', 'cxKeys') if k in spec})
            rows.append((slot, os.path.basename(src), tc(start), tc(t_in), tc(end), sheet(out, slot, t_in - start)))
    elif a.clips:
        ins = json.load(open(a.in_json)) if a.in_json else {}
        for slot in NEED:
            for ext in ('.mp4', '.mov', '.mkv', '.webm', '.m4v'):
                src = os.path.join(a.clips, slot + ext)
                if os.path.exists(src):
                    break
            else:
                continue
            pre, post = NEED[slot]
            dur = float(probe(src)['format']['duration'])
            t_in = secs(ins.get(slot, min(pre, dur)))
            out = os.path.join(OUTDIR, slot + '.mp4')
            encode(src, 0, dur, out)
            man['slots'][slot].update(file=slot + '.mp4', **{'in': round(t_in, 3)})
            ok = t_in >= pre - 0.01 and dur - t_in >= post - 0.01
            rows.append((slot, os.path.basename(src), '0:00:00', tc(t_in), tc(dur), sheet(out, slot, t_in) + ('' if ok else '  ⚠ too short for its shot')))
    else:
        ap.error('give --cuts (with --replay for plain timecodes), or --clips')
    json.dump(man, open(MANIFEST, 'w'), indent=2)
    with open(LEDGER, 'a') as L:
        for slot, src, a0, ain, a1, sh in rows:
            L.write(f'| {slot} | {src} | {a.source_url} | {a0} | {ain} | {a1} | {a.license} | {sh.replace(ROOT + "/", "")} |\n')
    for r in rows:
        print(*r)
    print('Now inspect the qa/footage/*.png sheets, adjust cx/cy/zoom in footage.json if needed, then run tools/render_short.sh')

if __name__ == '__main__':
    sys.exit(main())
