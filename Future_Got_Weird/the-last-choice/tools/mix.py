"""Final mix for THE LAST CHOICE review edit.

Inputs  audio/timing.json (tools/collect_timing.mjs: music edit, anchors, cues, beds, perspective)
        audio/mix/stem_music.wav (tools/build_music.py), audio/sfx/*.wav + choices.json (tools/prep_sfx.py)
Outputs audio/mix/stem_{music,sfx,beds}.wav, audio/mix/mix.wav (48 kHz stereo 24-bit), source/public/audio/mix.wav
        audio/mix/mix_measure.json (integrated loudness, true peak, LRA, per-section loudness)
Rules   music leads where the score carries the scene; effects sit where they tell the story; beds stay low and steady.
        Distance = quieter + darker + more room. Perspective events: 'muffle' (after the decisive blast: everything
        low-passed and ducked, a ring on top), 'duck' (music dips under a key effect). No loudness maximising: static
        gain to TARGET_LUFS, then a 4x-oversampled lookahead limiter holds the true peak at <= CEIL_DBTP.
Usage   python3 tools/mix.py
"""
import json, os, subprocess

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 48000
T = json.load(open(os.path.join(ROOT, "audio", "timing.json")))
A = T["anchors"]
N = int(round((T["end"] + 0.2) * SR))
SFX = os.path.join(ROOT, "audio", "sfx")
CH = json.load(open(os.path.join(SFX, "choices.json")))
TARGET_LUFS, CEIL_DBTP = -16.0, -2.0  # -2.0 leaves headroom for AAC encoder overshoot (delivered file <= -1.5 dBTP)

# default levels (dB re. the -3 dBFS-normalised file) — set by role, then per-cue gain
LEVEL = {
    "taxi_drop": -4, "wreck_slam": -6, "blast": -3, "gantry_collapse": -6, "metal_tear": -9, "glass_shatter": -10, "debris_rain": -13,
    "launcher": -8, "body_fall": -10, "robot_step_heavy": -12, "robot_step": -14, "servo_heavy": -15, "servo_whir": -17, "sensor_lock": -18,
    "sparks": -13, "elec_arc": -14, "hydraulic": -13, "cable_strain": -13, "crane_trolley": -15, "crane_chain": -15, "lever_clunk": -10,
    "gate_roll": -10, "shutter_slam": -10, "shutter_close": -13, "glass_door": -16, "padlock": -14, "radio_on": -14, "static": -16,
    "hand_glass": -12, "breath_exert": -14, "breath_ragged": -18, "steps_gravel": -15, "step_grate": -15, "step_grate_b": -15,
    "sub_boom": -9, "tinnitus": -22, "projector_beep": -20, "drone_rotor": -22, "steam_vent": -16,
    "fire_bed": -22, "city_bed": -20, "refuge_bed": -24,
}
MUSIC_DB = -1.0


def load_kind(kind):
    y, sr = sf.read(os.path.join(SFX, f"{kind}.wav"), always_2d=True)
    return y


def resample_rate(y, rate):
    if abs(rate - 1) < 1e-3:
        return y
    n = int(len(y) / rate)
    return signal.resample(y, n, axis=0)


def lowpass(y, fc):
    if fc >= 18000:
        return y
    b, a = signal.butter(2, fc / (SR / 2))
    return signal.lfilter(b, a, y, axis=0)


rng = np.random.default_rng(11)


def make_ir(sec, decay, bright=0.6):
    t = np.arange(int(sec * SR)) / SR
    ir = rng.standard_normal((len(t), 2)) * np.exp(-t / decay)[:, None]
    b, a = signal.butter(1, (2000 + 8000 * bright) / (SR / 2))
    ir = signal.lfilter(b, a, ir, axis=0)
    ir[: int(0.008 * SR)] = 0
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR_OUT, IR_IN = make_ir(1.6, 0.42, 0.45), make_ir(0.8, 0.18, 0.7)


def place(buf, y, t0, gain_db, pan=0.0, dist=0.0, interior=False):
    if y.shape[1] == 1:
        l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        y = np.concatenate([y * l * 1.414, y * r * 1.414], axis=1)
    y = y * 10 ** ((gain_db - 10 * dist) / 20)
    if dist > 0.02:
        y = lowpass(y, 16000 - 13000 * dist)
        wet = signal.fftconvolve(y, IR_IN if interior else IR_OUT, axes=0)[: len(y) + int(0.8 * SR)] * (0.15 + 0.45 * dist)
        y = np.concatenate([y, np.zeros((len(wet) - len(y), 2))]) * (1 - 0.3 * dist) + wet
    i0 = int(round(t0 * SR))
    if i0 < 0:
        y = y[-i0:]; i0 = 0
    i1 = min(N, i0 + len(y))
    if i1 > i0:
        buf[i0:i1] += y[: i1 - i0]


def tile(y, n, xf=0.25):
    """Loop y to n samples: overlap-add copies at a stride of len - k with equal-power crossfades at the seams."""
    k = min(int(xf * SR), len(y) // 3)
    if len(y) >= n:
        return y[:n].copy()
    out = np.zeros((n + len(y), y.shape[1]))
    fin = np.sin(np.linspace(0, np.pi / 2, k))[:, None]
    fout = np.cos(np.linspace(0, np.pi / 2, k))[:, None]
    pos, first = 0, True
    while pos < n:
        seg = y.copy()
        if not first:
            seg[:k] *= fin
        seg[-k:] *= fout
        out[pos:pos + len(seg)] += seg
        pos += len(seg) - k
        first = False
    return out[:n]


def interior_at(t):
    return t >= A["FINAL_HIT"] - 0.2


sfx = np.zeros((N, 2))
beds = np.zeros((N, 2))
ring = np.zeros((N, 2))  # the ear ring after the blast sits on top of the muffle, so it is not filtered
for c in T["cues"]:
    kind = c["kind"]
    if kind not in CH:
        print("missing kind", kind)
        continue
    y = load_kind(kind)
    y = resample_rate(y, c.get("rate", 1) or 1)
    lead = CH[kind].get("lead_s", 0) / (c.get("rate", 1) or 1)
    if c.get("dur"):
        n = int(c["dur"] * SR)
        y = tile(y, n) if len(y) < n else y[:n]
        f = int((c.get("fade") or 0.3) * SR)
        g = np.ones(len(y)); g[:f] = np.linspace(0, 1, f); g[-f:] = np.linspace(1, 0, f)
        y = y * g[:, None]
    place(ring if kind == "tinnitus" else sfx, y, c["t"] - lead, LEVEL.get(kind, -14) + (c.get("gain") or 0), c.get("pan") or 0, c.get("dist") or 0, interior_at(c["t"]))

for b in T["beds"]:
    y = load_kind(b["kind"])
    n = int((b["b"] - b["a"]) * SR)
    y = tile(y, n)
    f = int((b.get("fade") or 1.0) * SR)
    g = np.ones(n); g[:f] = np.linspace(0, 1, f) ** 2; g[-f:] = np.linspace(1, 0, f) ** 2
    y = y * g[:, None] * 10 ** ((LEVEL.get(b["kind"], -22) + (b.get("gain") or 0)) / 20)
    i0 = int(b["a"] * SR)
    beds[i0:i0 + n] += y[: max(0, min(n, N - i0))]

music, sr = sf.read(os.path.join(ROOT, "audio", "mix", "stem_music.wav"), always_2d=True)
music = music[:N] if len(music) >= N else np.concatenate([music, np.zeros((N - len(music), 2))])
music = music * 10 ** (MUSIC_DB / 20)


def envelope(events, kind, default_amt):
    """Smooth 0..1 envelope for perspective events of a kind (raised-cosine edges 0.12 s in / 0.6 s out)."""
    e = np.zeros(N)
    for p in events:
        if p["kind"] != kind:
            continue
        a, b = int(p["a"] * SR), int(p["b"] * SR)
        amt = p.get("amt") or default_amt
        ri, ro = int(0.12 * SR), int(0.6 * SR)
        seg = np.ones(b - a)
        seg[:ri] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, min(ri, len(seg))))
        seg[-ro:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, min(ro, len(seg))))
        e[a:b] = np.maximum(e[a:b], seg * amt)
    return e


persp = T.get("perspective", [])
muf = envelope(persp, "muffle", 1.0)
duck = envelope(persp, "duck", 6.0)
if muf.max() > 0:
    # time-varying low-pass: blend a heavily low-passed copy, and duck
    def muffle(x):
        lo = lowpass(lowpass(x, 420), 420)
        return x * (1 - muf)[:, None] + lo * muf[:, None] * 0.55

    music, sfx, beds = muffle(music), muffle(sfx), muffle(beds)
music *= (10 ** (-duck / 20))[:, None]

sfx = sfx + ring
mix = music + sfx + beds
os.makedirs(os.path.join(ROOT, "audio", "mix"), exist_ok=True)


def lufs(x):
    sf.write("/tmp/_lufs.wav", x.astype(np.float32), SR, subtype="FLOAT")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", "/tmp/_lufs.wav", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    s = r.stderr[r.stderr.rfind("Summary:"):]
    I = float(s.split("I:")[1].split("LUFS")[0]); LRA = float(s.split("LRA:")[1].split("LU")[0])
    TP = float(s.split("Peak:")[1].split("dBFS")[0]) if "Peak:" in s else None
    return I, LRA, TP


I0, _, _ = lufs(mix)
g = 10 ** ((TARGET_LUFS - I0) / 20)
mix *= g
music *= g; sfx *= g; beds *= g

# lookahead true-peak limiter (4x oversampled detection)
ceil = 10 ** (CEIL_DBTP / 20)
up = signal.resample_poly(mix, 4, 1, axis=0)
pk = np.max(np.abs(up), axis=1).reshape(-1, 4).max(axis=1)[:N] if len(up) >= 4 * N else np.max(np.abs(mix), axis=1)
need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
la = int(0.005 * SR)
# min-filter over the lookahead window, then smooth release
from scipy.ndimage import minimum_filter1d
gr = minimum_filter1d(need, size=2 * la + 1)
rel = np.exp(-1 / (0.08 * SR))
out = np.empty_like(gr)
cur = 1.0
for i in range(len(gr)):
    cur = min(gr[i], cur * rel + (1 - rel) * gr[i]) if gr[i] < cur else cur * rel + (1 - rel) * gr[i]
    out[i] = cur
mix *= out[:, None]

I, LRA, TP = lufs(mix)
sf.write(os.path.join(ROOT, "audio", "mix", "mix.wav"), mix, SR, subtype="PCM_24")
# final stems (post muffle/duck, at the mix gain; limiter not applied) — separate from build_music's input stem
os.makedirs(os.path.join(ROOT, "audio", "mix", "stems"), exist_ok=True)
for name, x in (("music", music), ("sfx", sfx), ("beds", beds)):
    sf.write(os.path.join(ROOT, "audio", "mix", "stems", f"{name}.wav"), x.astype(np.float32), SR, subtype="FLOAT")
pub = os.path.join(ROOT, "source", "public", "audio")
os.makedirs(pub, exist_ok=True)
sf.write(os.path.join(pub, "mix.wav"), mix, SR, subtype="PCM_16")
# per-section loudness (short-term, rough)
sec = {}
for s in T["shots"]:
    a, b = int(s["start"] * SR), int(s["end"] * SR)
    x = mix[a:b]
    sec[s["id"]] = round(float(10 * np.log10(np.mean(x ** 2) + 1e-12)), 1)
# where the limiter works hardest (> 2 dB), merged into spans, with the loudest cue nearby
gr_db = 20 * np.log10(out)
spans, i = [], 0
hot = np.where(gr_db < -2)[0]
if len(hot):
    a = hot[0]; prev = hot[0]
    for k in hot[1:]:
        if k - prev > SR // 4:
            spans.append((a, prev)); a = k
        prev = k
    spans.append((a, prev))
lim = []
for a, b in spans:
    t0, t1 = a / SR, b / SR
    near = [c["kind"] for c in T["cues"] if t0 - 0.6 <= c["t"] <= t1 + 0.1]
    lim.append({"t": round(t0, 2), "dur": round(t1 - t0, 2), "max_gr_db": round(float(gr_db[a:b + 1].min()), 1), "cues": near})
meas = {"limiter_spans": lim, "integrated_lufs": I, "lra_lu": LRA, "true_peak_dbtp": TP, "gain_db": round(20 * np.log10(g), 2), "limiter_max_gr_db": round(float(20 * np.log10(out.min())), 2), "shot_rms_dbfs": sec, "cues": len(T["cues"])}
json.dump(meas, open(os.path.join(ROOT, "audio", "mix", "mix_measure.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in meas.items() if k != "shot_rms_dbfs"}))
