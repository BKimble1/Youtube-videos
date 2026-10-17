"""Build the film's music stem from the supplied recordings and the edit in src/film/timing.ts (audio/timing.json).

- Portals: segments placed at their film times; the splice is an equal-power crossfade that ENDS on the incoming
  segment's first sample (so the destination's downbeat hit plays at full level).
- It's Been a Long, Long Time: starts as a diegetic radio (small speaker: band-limited, slightly saturated, mono,
  a short room), then opens into the full-range stereo recording at anchors.OPEN_FULL (1.6 s crossfade).
- Both recordings were captured quietly (≈ -27 LUFS); a fixed make-up gain brings them to working level here and the
  mixer sets the final balance.
Outputs: audio/mix/stem_music.wav (48 kHz stereo float32) and audio/mix/music_edit.json (what was placed where).
Usage: python3 tools/build_music.py
"""
import json, os

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 48000
T = json.load(open(os.path.join(ROOT, "audio", "timing.json")))
A = T["anchors"]
SRC = {"portals": os.path.join(ROOT, "audio", "source", "rec_234600.wav"), "longtime": os.path.join(ROOT, "audio", "source", "rec_235008.wav")}
MAKEUP_DB = {"portals": 9.0, "longtime": 8.0}
N = int(round((T["end"] + 0.5) * SR))
out = np.zeros((N, 2))
log = []
cache = {}


def load(name):
    if name not in cache:
        x, sr = sf.read(SRC[name], always_2d=True)
        assert sr == SR, sr
        cache[name] = x * 10 ** (MAKEUP_DB[name] / 20)
    return cache[name]


def radio(x):
    """Small portable radio in a room: 300-3.4 kHz, a speaker resonance, gentle saturation, mono, short room."""
    m = x.mean(axis=1)
    b, a = signal.butter(2, [300 / (SR / 2), 3400 / (SR / 2)], btype="band")
    y = signal.lfilter(b, a, m)
    bp, ap = signal.iirpeak(1150 / (SR / 2), Q=1.6)
    y = y + 0.35 * signal.lfilter(bp, ap, y)
    y = np.tanh(y * 2.2) / 2.2
    rng = np.random.default_rng(7)
    ir_t = np.arange(int(0.32 * SR)) / SR
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.075)
    ir[0] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = signal.fftconvolve(y, ir)[: len(y)]
    y = 0.82 * y + 0.22 * wet
    y *= 0.62
    return np.stack([y * 0.98, y * 1.0], axis=1)


segs = T["music"]
for i, s in enumerate(segs):
    x = load(s["src"])
    xf = s.get("xfade", 0) or 0
    r0 = s["recIn"] - xf
    r1 = s["recOut"]
    a0, a1 = int(round(r0 * SR)), int(round(r1 * SR))
    clip = x[a0:a1].copy()
    n = len(clip)
    g = np.ones(n)
    fi = s.get("fadeIn", 0) or 0
    if xf > 0:
        k = int(xf * SR)
        g[:k] *= np.sin(np.linspace(0, np.pi / 2, k))
    elif fi > 0:
        k = int(fi * SR)
        g[:k] *= np.sin(np.linspace(0, np.pi / 2, k)) ** 2
    fo = s.get("fadeOut", 0) or 0
    # an outgoing segment followed by a crossfade: fade out over the next segment's xfade, past recOut
    nxt = segs[i + 1] if i + 1 < len(segs) else None
    if nxt and nxt["src"] == s["src"] and (nxt.get("xfade") or 0) > 0:
        k = int(nxt["xfade"] * SR)
        g[-k:] *= np.cos(np.linspace(0, np.pi / 2, k))
    elif fo > 0:
        k = int(fo * SR)
        g[-k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    clip *= g[:, None]
    if s["src"] == "longtime":
        # long-time fade under the card: from L_FADE0 to L_FADE1 (film) → silence
        f0 = A["L_FADE0"] - s["film"] + s["recIn"]
        f1 = A["L_FADE1"] - s["film"] + s["recIn"]
        tt = s["recIn"] + np.arange(n) / SR
        fade = np.clip((f1 - tt) / (f1 - f0), 0, 1) ** 1.6
        clip *= fade[:, None]
        # radio → full range at OPEN_FULL
        full = clip.copy()
        rad = radio(clip)
        topen = A["OPEN_FULL"] - s["film"] + s["recIn"]
        w = np.clip((tt - (topen - 0.3)) / 1.6, 0, 1)
        w = 0.5 - 0.5 * np.cos(np.pi * w)
        clip = rad * (1 - w)[:, None] + full * (0.92 * w)[:, None]
    start = int(round((s["film"] - xf) * SR))
    end = min(N, start + n)
    out[start:end] += clip[: end - start]
    log.append({"src": s["src"], "rec_in": round(r0, 3), "rec_out": round(r1, 3), "film_in": round(s["film"] - xf, 3), "film_out": round(s["film"] - xf + n / SR, 3)})

os.makedirs(os.path.join(ROOT, "audio", "mix"), exist_ok=True)
sf.write(os.path.join(ROOT, "audio", "mix", "stem_music.wav"), out.astype(np.float32), SR, subtype="FLOAT")
peak = float(np.max(np.abs(out)))
# click check: largest sample-to-sample jump around each placement boundary
jumps = []
for e in log:
    for tb in (e["film_in"], e["film_out"]):
        k = int(tb * SR)
        w = out[max(0, k - 480):k + 480]
        jumps.append({"t": tb, "max_step": round(float(np.max(np.abs(np.diff(w, axis=0)))) if len(w) > 2 else 0, 5)})
json.dump({"segments": log, "peak": round(peak, 4), "boundary_steps": jumps, "makeup_db": MAKEUP_DB}, open(os.path.join(ROOT, "audio", "mix", "music_edit.json"), "w"), indent=1)
print(json.dumps(log, indent=1), "peak", round(peak, 3))
