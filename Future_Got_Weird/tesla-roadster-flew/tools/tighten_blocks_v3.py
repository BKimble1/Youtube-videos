#!/usr/bin/env python3
"""Companion v3, step 1: tighten the pauses in each chosen Test Voice take and carry the Scribe word timings across.
Per-block pause targets via PAUSES. Optionally apply a modest pitch-preserving tempo change to selected blocks first (ffmpeg rubberband, TEMPO env, e.g.
"V7=1.08"); every other block is untouched. Pauses are found with silencedetect (-38 dB, >=120 ms): sentence-length
pauses (>=0.33 s) become SENT s, shorter ones at most COMMA s; each cut sits mid-silence with a 12 ms crossfade.
Inputs: audio/companion_v3/picks.txt, takes/<pick>.mp3, scribe/<block>.json (an independent Scribe pass on each pick).
Outputs: tight/<block>.wav (48 kHz mono) and tight/<block>.json (words with times in the tightened file)."""
import json, os, re, subprocess, tempfile
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..', 'audio', 'companion_v3')
SR = 48000
SENT = float(os.environ.get('SENT', 0.32)); COMMA = float(os.environ.get('COMMA', 0.17))
TEMPO = {k: float(v) for k, v in (p.split('=') for p in os.environ.get('TEMPO', '').split(',') if p)}
# per-block pause targets "V2=0.38/0.20,..." (the physics blocks keep a little more air)
PAUSES = {k: tuple(map(float, v.split('/'))) for k, v in (p.split('=') for p in os.environ.get('PAUSES', '').split(',') if p)}
XF = 0.012

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

for p in open(os.path.join(ROOT, 'picks.txt')).read().split():
    block = p.split('_')[0]
    src = os.path.join(ROOT, 'takes', p + '.mp3')
    k = TEMPO.get(block, 1.0)
    words = json.load(open(os.path.join(ROOT, 'scribe', block + '.json')))['words']
    if k != 1.0:
        tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False).name
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', f'rubberband=tempo={k}:pitch=1:transients=crisp:detector=compound:phase=laminar:window=standard:smoothing=off:formant=preserved:pitchq=quality:channels=together',
                        '-ar', str(SR), '-ac', '1', tmp], check=True)
        src = tmp
        words = [{**w, 'start': w['start'] / k, 'end': w['end'] / k} for w in words]
    x = decode(src)
    dur = len(x) / SR
    sil = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', 'silencedetect=n=-38dB:d=0.12', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', sil)]
    en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', sil)]
    env = np.convolve(np.abs(x), np.ones(480) / 480, 'same')
    thr = 10 ** (-38 / 20)
    on = max(0.0, np.argmax(env > thr) / SR - 0.02)
    off = min(dur, (len(env) - np.argmax(env[::-1] > thr)) / SR + 0.06)
    keep, anchors, cur, tn = [], [(on, 0.0)], on, 0.0
    for s, e in zip(st, en):
        if s <= on + 0.02 or e >= off - 0.02:
            continue
        L = e - s
        sent, comma = PAUSES.get(block, (SENT, COMMA))
        target = sent if L >= 0.33 else min(L, comma)
        cut = L - target
        if cut <= 0.005:
            continue
        mid = (s + e) / 2
        a, b = mid - cut / 2, mid + cut / 2
        keep.append((cur, a)); tn += a - cur
        anchors.append((b, tn)); cur = b
    keep.append((cur, off)); tn += off - cur
    n = int(XF * SR)
    rmp = np.linspace(0, 1, n, dtype=np.float32)
    pieces = []
    for i, (a, b) in enumerate(keep):
        seg = x[int(a * SR):int(b * SR)].copy()
        if i > 0: seg[:n] *= rmp
        if i < len(keep) - 1: seg[-n:] *= rmp[::-1]
        pieces.append(seg)
    y = np.concatenate(pieces)
    def remap(tt):
        k2 = max(i for i, (o, _) in enumerate(anchors) if o <= tt + 1e-6) if tt >= anchors[0][0] else 0
        return anchors[k2][1] + (tt - anchors[k2][0])
    bw = [{'w': w['text'], 's': round(max(0, remap(w['start'])), 3), 'e': round(remap(w['end']), 3)} for w in words]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le',
                    os.path.join(ROOT, 'tight', block + '.wav')], input=y.tobytes(), check=True)
    json.dump({'take': p, 'tempo': k, 'dur': round(len(y) / SR, 3), 'words': bw}, open(os.path.join(ROOT, 'tight', block + '.json'), 'w'), indent=0)
    span = bw[-1]['e'] - bw[0]['s']
    print(f'{block}: {dur:.2f}s -> {len(y)/SR:.2f}s (tempo {k}), {len(keep)-1} pauses tightened, {len(bw)} words, {60*len(bw)/span:.0f} wpm over {span:.2f}s')
