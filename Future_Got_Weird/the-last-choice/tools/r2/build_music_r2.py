"""R2 music tracks, kept separate and editable (nothing is mixed together here).

Reads audio/r2/timing.json (tools/r2/collect_timing_r2.mjs) and the extracted recordings (tools/fetch_music.sh).
Writes 48 kHz stereo float WAVs, each the full film length, to audio/r2/music/ (git-ignored):
  portals.wav       Portals, rec 1.30 → 193.8 placed at film 0.60, nothing cut in between; natural ring-out
  llt_full.wav      It's Been a Long, Long Time (R3): ONE continuous excerpt, rec 0 → 37.66 in order, no edit;
                    fade-in 0.35 s through the radio's static, 3.0 s fade from the cadence arrival (rec 34.66)
  llt_radio.wav     the SAME placed recording through a small portable radio (band-limited, speaker resonance, light
                    saturation, mono, short room), filtered zero-phase so the two copies stay sample- and phase-aligned:
                    the mixer blends radio → full as the camera rises without a second entry, a gap or comb filtering
plus audio/r2/music/edit.json: what was placed where and the levels. (A join check runs only if a segment has an
`xfade`; R3 has none.)
"""
import json, os

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
SR = 48000
T = json.load(open(os.path.join(ROOT, "audio", "r2", "timing.json")))
SRC = {"portals": os.path.join(ROOT, "audio", "source", "rec_234600.wav"), "longtime": os.path.join(ROOT, "audio", "source", "rec_235008.wav")}
MAKEUP_DB = {"portals": 9.0, "longtime": 8.0}  # both captures are quiet (≈ −27 LUFS); the mixer sets final balance
N = int(round((T["end"] + 0.5) * SR))
OUT = os.path.join(ROOT, "audio", "r2", "music")
os.makedirs(OUT, exist_ok=True)


def load(name):
    x, sr = sf.read(SRC[name], always_2d=True)
    assert sr == SR, sr
    return x * 10 ** (MAKEUP_DB[name] / 20)


def radio(x):
    m = x.mean(axis=1)
    # zero-phase (forward-backward) filtering: no group delay against the full-range copy
    b, a = signal.butter(2, [300 / (SR / 2), 3400 / (SR / 2)], btype="band")
    y = signal.filtfilt(b, a, m)
    bp, ap = signal.iirpeak(1150 / (SR / 2), Q=1.6)
    y = y + 0.35 * signal.filtfilt(bp, ap, y)
    y = np.tanh(y * 2.2) / 2.2
    rng = np.random.default_rng(7)
    ir_t = np.arange(int(0.32 * SR)) / SR
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.075)
    ir[0] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = signal.fftconvolve(y, ir)[: len(y)]
    y = (0.82 * y + 0.22 * wet) * 0.62
    return np.stack([y * 0.98, y], axis=1)


tracks = {"portals": np.zeros((N, 2)), "longtime": np.zeros((N, 2))}
log = []
segs = T["music"]
cache = {}
for i, s in enumerate(segs):
    x = cache.setdefault(s["src"], load(s["src"]))
    xf = s.get("xfade") or 0
    r0, r1 = s["recIn"] - xf, s["recOut"]
    clip = x[int(round(r0 * SR)):int(round(r1 * SR))].copy()
    n = len(clip)
    g = np.ones(n)
    if xf > 0:
        k = int(xf * SR); g[:k] *= np.sin(np.linspace(0, np.pi / 2, k))
    elif s.get("fadeIn"):
        k = int(s["fadeIn"] * SR); g[:k] *= np.sin(np.linspace(0, np.pi / 2, k)) ** 2
    nxt = segs[i + 1] if i + 1 < len(segs) else None
    if nxt and nxt["src"] == s["src"] and (nxt.get("xfade") or 0) > 0:
        k = int(nxt["xfade"] * SR); g[-k:] *= np.cos(np.linspace(0, np.pi / 2, k))
    elif s.get("fadeOut"):
        k = int(s["fadeOut"] * SR); g[-k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    clip *= g[:, None]
    st = int(round((s["film"] - xf) * SR))
    en = min(N, st + n)
    tracks[s["src"]][st:en] += clip[: en - st]
    log.append({"src": s["src"], "rec_in": round(r0, 3), "rec_out": round(r1, 3), "film_in": round(s["film"] - xf, 3), "film_out": round(s["film"] - xf + n / SR, 3), "xfade_s": xf})

sf.write(os.path.join(OUT, "portals.wav"), tracks["portals"].astype(np.float32), SR, subtype="FLOAT")
sf.write(os.path.join(OUT, "llt_full.wav"), tracks["longtime"].astype(np.float32), SR, subtype="FLOAT")
sf.write(os.path.join(OUT, "llt_radio.wav"), radio(tracks["longtime"]).astype(np.float32), SR, subtype="FLOAT")

# join check: the largest sample step within ±10 ms of the edit vs the track's own 99.99th-percentile step
L = tracks["longtime"]
d = np.abs(np.diff(L, axis=0)).max(axis=1)
act = d[d > 0]
p9999 = float(np.percentile(act, 99.99)) if len(act) else 0
joins = []
for s in segs:
    if s.get("xfade"):
        k = int(round(s["film"] * SR))
        joins.append({"film": round(s["film"], 3), "max_step": round(float(d[k - 480:k + 480].max()), 4), "track_p99_99": round(p9999, 4)})
# level match across the join (300 ms RMS either side, dB)
for j in joins:
    k = int(round(j["film"] * SR)); w = int(0.3 * SR)
    a = 20 * np.log10(np.sqrt(np.mean(L[k - w - int(0.06 * SR):k - int(0.06 * SR)] ** 2)) + 1e-9)
    b = 20 * np.log10(np.sqrt(np.mean(L[k:k + w] ** 2)) + 1e-9)
    j["rms_before_db"], j["rms_after_db"] = round(float(a), 1), round(float(b), 1)
# preview of any join for whoever can listen: 8 s before → 10 s after (git-ignored; none in R3)
for j in joins:
    k = int(round(j["film"] * SR))
    sf.write(os.path.join(OUT, f"preview_join_{j['film']:.1f}.wav"), L[k - 8 * SR:k + 10 * SR].astype(np.float32), SR, subtype="FLOAT")
# the radio entry and the song's ending, for whoever can listen (git-ignored)
seg = [s for s in segs if s["src"] == "longtime"][0]
k0 = int(round(seg["film"] * SR)); k1 = k0 + int(round((seg["recOut"] - seg["recIn"]) * SR))
sf.write(os.path.join(OUT, "preview_llt_entry.wav"), L[max(0, k0 - 2 * SR):k0 + 12 * SR].astype(np.float32), SR, subtype="FLOAT")
sf.write(os.path.join(OUT, "preview_llt_ending.wav"), L[k1 - 10 * SR:k1 + SR].astype(np.float32), SR, subtype="FLOAT")
json.dump({"segments": log, "joins": joins, "makeup_db": MAKEUP_DB, "peaks": {k2: round(float(np.abs(v).max()), 4) for k2, v in tracks.items()}}, open(os.path.join(OUT, "edit.json"), "w"), indent=1)
print(json.dumps({"segments": log, "joins": joins}, indent=1))
