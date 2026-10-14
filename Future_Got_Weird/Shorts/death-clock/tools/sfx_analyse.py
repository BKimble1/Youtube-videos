"""Measure generated one-shots (nobody can listen here): onset, peak time, levels, spectral balance and
how tonal they are (YIN voiced-frame ratio). Usage: python3 tools/sfx_analyse.py <dir> [out.json]"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
SR = 48000
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)
def voiced(fr):
    f = fr - fr.mean(); W = len(f) // 2
    d = np.array([np.sum((f[:W] - f[t:t + W]) ** 2) for t in range(1, W)])
    c = d * np.arange(1, W) / np.maximum(np.cumsum(d), 1e-12)
    lo, hi = SR // 1500, SR // 70
    return c[lo:hi].min() < 0.2
rows = []
for p in sorted(Path(sys.argv[1]).glob('*.mp3')):
    x = load(p); hop = 480; n = len(x) // hop
    e = np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2) + 1e-12) for i in range(n)]); db = 20*np.log10(e + 1e-12)
    act = db > db.max() - 30
    on = int(np.argmax(act)) * hop / SR; off = (len(act) - int(np.argmax(act[::-1]))) * hop / SR
    pk = int(np.argmax(e)) * hop / SR
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)))); fq = np.fft.rfftfreq(len(x), 1/SR)
    cen = float((X*fq).sum()/X.sum()); low = float(X[fq < 200].sum()/X.sum())
    frs = [x[i:i+2048] for i in range(0, len(x)-2048, 1024) if np.sqrt(np.mean(x[i:i+2048]**2)) > 10**((db.max()-25)/20)]
    vr = float(np.mean([voiced(f) for f in frs[:60]])) if frs else 0
    rows.append({'file': p.name, 'dur': round(len(x)/SR, 2), 'onset_s': round(on, 2), 'end_s': round(off, 2), 'peak_at_s': round(pk, 2),
                 'peak_dbfs': round(float(20*np.log10(np.abs(x).max()+1e-12)), 1), 'rms_active_db': round(float(db[act].mean()), 1),
                 'centroid_hz': int(cen), 'low_ratio_<200hz': round(low, 2), 'tonal_ratio': round(vr, 2)})
for r in rows: print(r)
if len(sys.argv) > 2: json.dump(rows, open(sys.argv[2], 'w'), indent=1)
