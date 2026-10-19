"""Objective comparison of narration takes (nobody can listen in this environment).

For each MP3: lead-in silence, tail silence, voiced duration, words/min over the speech span,
pitch (YIN-style autocorrelation) median and spread over voiced 40 ms frames, loudness spread
and spectral centroid. Writes a JSON report next to the takes.

Usage: python3 tools/voice_audition.py <dir-with-mp3s> <words-in-line> [out.json]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 24000


def load(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def frames(x: np.ndarray, win: int, hop: int) -> np.ndarray:
    n = max(0, 1 + (len(x) - win) // hop)
    idx = np.arange(win)[None, :] + hop * np.arange(n)[:, None]
    return x[idx]


def pitch(frame: np.ndarray, fmin=70.0, fmax=320.0) -> float:
    """Cumulative-mean-normalised difference (YIN) pitch; NaN if unvoiced."""
    f = frame - frame.mean()
    W = len(f) // 2
    taus = np.arange(1, W)
    d = np.array([np.sum((f[:W] - f[t:t + W]) ** 2) for t in taus])
    cmnd = d * taus / np.maximum(np.cumsum(d), 1e-12)
    lo, hi = int(SR / fmax), int(SR / fmin)
    seg = cmnd[lo:hi]
    i = int(np.argmin(seg))
    if seg[i] > 0.25:
        return float('nan')
    return SR / (lo + i + 1)


def analyse(path: Path, words: int) -> dict:
    x = load(path)
    win, hop = int(0.04 * SR), int(0.01 * SR)
    F = frames(x, win, hop)
    rms = np.sqrt((F ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-12)
    peak = db.max()
    active = db > peak - 35
    first = int(np.argmax(active))
    last = len(active) - 1 - int(np.argmax(active[::-1]))
    t0, t1 = first * hop / SR, (last * hop + win) / SR
    voiced_db = db[active]
    p = np.array([pitch(F[i]) for i in range(first, last + 1) if active[i]])
    p = p[~np.isnan(p)]
    spec = np.abs(np.fft.rfft(F[active] * np.hanning(win), axis=1))
    freqs = np.fft.rfftfreq(win, 1 / SR)
    centroid = float(np.median((spec * freqs).sum(1) / np.maximum(spec.sum(1), 1e-12)))
    span = t1 - t0
    return {
        'file': path.name,
        'duration_s': round(len(x) / SR, 3),
        'lead_in_s': round(t0, 3),
        'tail_s': round(len(x) / SR - t1, 3),
        'speech_span_s': round(span, 3),
        'wpm_over_span': round(words / span * 60, 1),
        'pitch_median_hz': round(float(np.median(p)), 1) if len(p) else None,
        'pitch_range_semitones_p10_p90': round(float(12 * np.log2(np.percentile(p, 90) / np.percentile(p, 10))), 2) if len(p) else None,
        'voiced_frames': int(len(p)),
        'level_spread_db_p10_p90': round(float(np.percentile(voiced_db, 90) - np.percentile(voiced_db, 10)), 2),
        'spectral_centroid_hz': round(centroid, 0),
        'peak_dbfs': round(float(20 * np.log10(np.abs(x).max() + 1e-12)), 2),
    }


if __name__ == '__main__':
    d = Path(sys.argv[1])
    words = int(sys.argv[2])
    out = Path(sys.argv[3]) if len(sys.argv) > 3 else d / 'AUDITION_ANALYSIS.json'
    rows = [analyse(p, words) for p in sorted(d.glob('*.mp3'))]
    json.dump({'words': words, 'method': __doc__.strip().splitlines()[0], 'takes': rows}, open(out, 'w'), indent=1)
    keys = ['file', 'duration_s', 'lead_in_s', 'speech_span_s', 'wpm_over_span', 'pitch_median_hz',
            'pitch_range_semitones_p10_p90', 'level_spread_db_p10_p90', 'spectral_centroid_hz', 'peak_dbfs']
    print('\t'.join(k[:14] for k in keys))
    for r in rows:
        print('\t'.join(str(r[k])[:24] for k in keys))
