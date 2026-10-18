"""R2 mix: separate stems, a documented balance, no loudness maximising.

Inputs
  audio/r2/timing.json        tools/r2/collect_timing_r2.mjs (MUSIC, M, CUES, BEDS, PERSPECTIVE, RADIO_MIX)
  audio/r2/music/*.wav        tools/r2/build_music_r2.py (portals, llt_full, llt_radio — each full film length)
  audio/r2/sfx/*.wav          R2 effects (tools/r2/prep_sfx_r2.py) + choices.json; falls back to R1's audio/sfx/
Outputs (git-ignored)
  audio/r2/mix/stems/{music_portals,music_llt,sfx,beds}.wav   post-automation, at mix gain, before the limiter
  audio/r2/mix/mix.wav (48 kHz 24-bit), source/public/audio/r2_mix.wav, audio/r2/mix/measure.json
Rules
  - The radio is a sound IN the scene: llt_radio plays from the radio's position (mono, near-centre, darker and
    quieter as the camera rises away), then hands over to llt_full (the score) over RADIO_MIX.a → b with an equal-power
    crossfade. Both tracks stay separate stems.
  - Effects carry distance (quieter, darker, more room) and pan from screen position.
  - Perspective events: 'duck' (music dips under a story effect), 'quiet' (everything but beds dips; used for the
    death so the ring-out, wind and fire stay), 'muffle' (low-passed perspective).
  - Static gain to TARGET_LUFS, then a 4x-oversampled lookahead limiter to CEIL_DBTP (−2 dBTP leaves room for AAC).
"""
import json, os, subprocess

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
SR = 48000
T = json.load(open(os.path.join(ROOT, "audio", "r2", "timing.json")))
A = T["anchors"]
N = int(round((T["end"] + 0.2) * SR))
SFX_DIRS = [os.path.join(ROOT, "audio", "r2", "sfx"), os.path.join(ROOT, "audio", "sfx")]
CHOICES = {}
for d in reversed(SFX_DIRS):
    p = os.path.join(d, "choices.json")
    if os.path.exists(p):
        CHOICES.update({k: dict(v, _dir=d) for k, v in json.load(open(p)).items()})
TARGET_LUFS, CEIL_DBTP = -16.0, -2.0
MUSIC_DB = {"portals": -1.0, "llt": -2.0}

# default level per kind (dB re. the −3 dBFS-normalised file); per-cue gain adds to it
LEVEL = {
    # impacts / destruction (kept below the limiter's appetite; stacked hits are the loudest moments)
    "ram_strike": -5, "blast": -4, "wreck_slam": -6, "robot_fall": -8, "heavy_stomp": -8, "tower_collapse": -10, "metal_tear": -9,
    "plate_block": -8, "plate_crack": -8, "plate_shatter": -6, "shield_bash": -8, "breaker_hit": -7, "armor_hit": -9,
    "halligan_pry": -11, "debris_rain": -13, "glass_shatter": -11, "sub_boom": -10, "heavy_launcher": -8, "launcher": -9,
    # mechanisms / machines
    "tether_fire": -10, "tether_clamp": -10, "tether_reel": -12, "cable_snap": -8, "breaker_charge": -13, "breaker_empty": -12,
    "heavy_servo": -12, "servo_heavy": -14, "servo_whir": -17, "robot_swing": -12, "eyes_on": -14, "army_halt": -7, "sensor_lock": -16,
    "drone_pass": -12, "ally_drone": -18, "ally_drone_crash": -10, "projector_on": -16, "flare_ignite": -12, "smoke_canister": -12,
    "sparks": -14, "elec_arc": -15, "hydraulic": -14, "robot_step": -15, "robot_step_heavy": -13, "drone_rotor": -17,
    "cable_strain": -14, "steam_vent": -17, "lever_clunk": -19, "projector_beep": -18,
    # people
    "rubble_shift": -10, "breath_exert": -15, "breath_ragged": -18, "final_breath": -14, "cloth_move": -20, "body_fall": -11,
    "steps_gravel": -16, "run_rubble": -16, "tinnitus": -24,
    # radio
    "radio_on": -13, "static": -17,
    # beds
    "wind_ruins": -20, "battle_far": -21, "fire_bed": -22, "army_march": -16, "drone_swarm": -20, "machine_hum": -22, "city_bed": -22,
}


def load_kind(kind):
    c = CHOICES.get(kind)
    for d in SFX_DIRS:
        p = os.path.join(d, f"{kind}.wav")
        if os.path.exists(p):
            y, sr = sf.read(p, always_2d=True)
            if sr != SR:
                y = signal.resample_poly(y, SR, sr, axis=0)
            return y, (c or {}).get("lead_s", 0.0)
    return None, 0.0


def lowpass(y, fc):
    if fc >= 18000:
        return y
    b, a = signal.butter(2, fc / (SR / 2))
    return signal.lfilter(b, a, y, axis=0)


def lowpass0(y, fc):
    """zero-phase low-pass (for a copy that is blended with its own unfiltered twin: no group delay, no comb)"""
    b, a = signal.butter(2, fc / (SR / 2))
    return signal.filtfilt(b, a, y, axis=0)


rng = np.random.default_rng(11)


def make_ir(sec, decay, bright=0.6):
    t = np.arange(int(sec * SR)) / SR
    ir = rng.standard_normal((len(t), 2)) * np.exp(-t / decay)[:, None]
    b, a = signal.butter(1, (2000 + 8000 * bright) / (SR / 2))
    ir = signal.lfilter(b, a, ir, axis=0)
    ir[: int(0.008 * SR)] = 0
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR_OUT = make_ir(1.8, 0.5, 0.45)


def place(buf, y, t0, gain_db, pan=0.0, dist=0.0):
    if y.shape[1] == 1:
        l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        y = np.concatenate([y * l * 1.414, y * r * 1.414], axis=1)
    elif abs(pan) > 0.05:
        l = np.cos((pan + 1) * np.pi / 4) * 1.414; r = np.sin((pan + 1) * np.pi / 4) * 1.414
        y = y * np.array([l, r])[None, :]
    y = y * 10 ** ((gain_db - 10 * dist) / 20)
    if dist > 0.02:
        y = lowpass(y, 16000 - 13000 * dist)
        wet = signal.fftconvolve(y, IR_OUT, axes=0)[: len(y) + int(1.0 * SR)] * (0.15 + 0.5 * dist)
        y = np.concatenate([y, np.zeros((len(wet) - len(y), 2))]) * (1 - 0.3 * dist) + wet
    i0 = int(round(t0 * SR))
    if i0 < 0:
        y = y[-i0:]; i0 = 0
    i1 = min(N, i0 + len(y))
    if i1 > i0:
        buf[i0:i1] += y[: i1 - i0]


def tile(y, n, xf=0.3):
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


def env_curve(events, kind, default_amt, rise=0.12, fall=0.6):
    e = np.zeros(N)
    for p in events:
        if p["kind"] != kind:
            continue
        a, b = int(p["a"] * SR), int(p["b"] * SR)
        if b <= a:
            continue
        amt = p.get("amt") or default_amt
        ri, ro = int((p.get("rise") or rise) * SR), int((p.get("fall") or fall) * SR)
        seg = np.ones(b - a)
        k1, k2 = min(ri, len(seg)), min(ro, len(seg))
        seg[:k1] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k1))
        seg[len(seg) - k2:] = np.minimum(seg[len(seg) - k2:], 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, k2)))
        e[a:b] = np.maximum(e[a:b], seg * amt)
    return e


# ------------------------------------------------------------------ effects and beds
missing = set()
sfx = np.zeros((N, 2))
for c in T["cues"]:
    y, lead = load_kind(c["kind"])
    if y is None:
        missing.add(c["kind"]); continue
    rate = c.get("rate") or 1
    if abs(rate - 1) > 1e-3:
        y = signal.resample(y, int(len(y) / rate), axis=0); lead /= rate
    if c.get("dur"):
        n = int(c["dur"] * SR)
        y = tile(y, n) if len(y) < n else y[:n]
        f = int((c.get("fade") or 0.3) * SR)
        g = np.ones(len(y)); g[:f] = np.linspace(0, 1, f); g[-f:] = np.linspace(1, 0, f)
        y = y * g[:, None]
    place(sfx, y, c["t"] - lead, LEVEL.get(c["kind"], -14) + (c.get("gain") or 0), c.get("pan") or 0, c.get("dist") or 0)

beds = np.zeros((N, 2))
for b in T["beds"]:
    y, _ = load_kind(b["kind"])
    if y is None:
        missing.add(b["kind"]); continue
    if y.shape[1] == 1:
        y = np.concatenate([y, y], axis=1)
    n = int((b["b"] - b["a"]) * SR)
    y = tile(y, n)
    f = int((b.get("fade") or 1.5) * SR)
    g = np.ones(n); g[:f] = np.linspace(0, 1, f) ** 2; g[-f:] = np.linspace(1, 0, f) ** 2
    y = y * g[:, None] * 10 ** ((LEVEL.get(b["kind"], -22) + (b.get("gain") or 0)) / 20)
    if b.get("dist"):
        y = lowpass(y, 16000 - 13000 * b["dist"])
    i0 = int(b["a"] * SR)
    beds[i0:i0 + n] += y[: max(0, min(n, N - i0))]

# ------------------------------------------------------------------ music
MUS = os.path.join(ROOT, "audio", "r2", "music")
def track(name):
    x, sr = sf.read(os.path.join(MUS, name), always_2d=True)
    return x[:N] if len(x) >= N else np.concatenate([x, np.zeros((N - len(x), 2))])

portals = track("portals.wav") * 10 ** (MUSIC_DB["portals"] / 20)
llt_full = track("llt_full.wav") * 10 ** (MUSIC_DB["llt"] / 20)
llt_radio = track("llt_radio.wav") * 10 ** (MUSIC_DB["llt"] / 20)
R = T.get("radio") or {"a": A["L_START"] + 3.0, "b": A["VOCAL"] - 1.0, "radioDb": -6.0, "awayDb": -9.0}
tt = np.arange(N) / SR
w = np.clip((tt - R["a"]) / max(0.1, R["b"] - R["a"]), 0, 1)
w = 0.5 - 0.5 * np.cos(np.pi * w)  # 0 = radio only, 1 = score only
# the radio recedes as the camera rises: quieter and darker as w grows (it stays a physical source until it is gone)
radio_gain = 10 ** ((R.get("radioDb", -6.0) + R.get("awayDb", -9.0) * w) / 20) * np.cos(w * np.pi / 2)
radio_dark = lowpass0(llt_radio, 1800)
radio = llt_radio * (1 - w)[:, None] + radio_dark * w[:, None]
llt = radio * radio_gain[:, None] + llt_full * np.sin(w * np.pi / 2)[:, None]
music_portals, music_llt = portals, llt

# ------------------------------------------------------------------ perspective
P = T.get("perspective", [])
duck = env_curve(P, "duck", 6.0)
quiet = env_curve(P, "quiet", 8.0, rise=0.8, fall=1.5)
muf = env_curve(P, "muffle", 1.0)
music_portals = music_portals * (10 ** (-duck / 20))[:, None]
sfx = sfx * (10 ** (-quiet / 20))[:, None]
if muf.max() > 0:
    def muffle(x):
        lo = lowpass(lowpass(x, 420), 420)
        return x * (1 - muf)[:, None] + lo * muf[:, None] * 0.55
    music_portals, music_llt, sfx, beds = muffle(music_portals), muffle(music_llt), muffle(sfx), muffle(beds)

# music priority: the score stays in front of the battle. Where the effects bus's short-term level comes within
# SFX_MARGIN dB of the music's, the effects give way (ratio SFX_RATIO, at most SFX_MAX_GR dB, smoothed so single hits
# keep their attack). Not applied where a perspective duck already lowers the music for a story hit (the strike).
SFX_MARGIN, SFX_RATIO, SFX_MAX_GR = 3.0, 0.6, 5.0


def short_db(x, win=0.35):
    p = np.mean(x ** 2, axis=1)
    n = int(win * SR)
    k = np.ones(n) / n
    return 10 * np.log10(np.convolve(p, k, mode="same") + 1e-12)


def smooth_gr(gr, att=0.08, rel=0.45):
    # one-pole smoothing on 10 ms blocks (fast enough for the music-priority rule; keeps the loop cheap)
    blk = int(0.01 * SR)
    nb = len(gr) // blk + 1
    g = np.array([gr[i * blk:(i + 1) * blk].max() if i * blk < len(gr) else 0 for i in range(nb)])
    out = np.zeros(nb)
    a_att, a_rel = np.exp(-0.01 / att), np.exp(-0.01 / rel)
    v = 0.0
    for i in range(nb):
        a = a_att if g[i] > v else a_rel
        v = a * v + (1 - a) * g[i]
        out[i] = v
    return np.repeat(out, blk)[: len(gr)]


mus_db = short_db(music_portals + music_llt)
sfx_db = short_db(sfx)
over = np.clip(sfx_db - (mus_db - SFX_MARGIN), 0, None) * SFX_RATIO
over[mus_db < -45] = 0  # no music there (the title, E2): nothing to give way to
over[duck > 0.5] = 0
sfx_gr = np.minimum(smooth_gr(over), SFX_MAX_GR)
sfx = sfx * (10 ** (-sfx_gr / 20))[:, None]

mix = music_portals + music_llt + sfx + beds


def lufs(x):
    sf.write("/tmp/_r2lufs.wav", x.astype(np.float32), SR, subtype="FLOAT")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", "/tmp/_r2lufs.wav", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    s = r.stderr[r.stderr.rfind("Summary:"):]
    return float(s.split("I:")[1].split("LUFS")[0]), float(s.split("LRA:")[1].split("LU")[0]), float(s.split("Peak:")[1].split("dBFS")[0])


I0, _, _ = lufs(mix)
g = 10 ** ((TARGET_LUFS - I0) / 20)
mix *= g
stems = {"music_portals": music_portals * g, "music_llt": music_llt * g, "sfx": sfx * g, "beds": beds * g}
ceil = 10 ** (CEIL_DBTP / 20)
up = signal.resample_poly(mix, 4, 1, axis=0)
pk = np.max(np.abs(up), axis=1).reshape(-1, 4).max(axis=1)[:N]
need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
gr = minimum_filter1d(need, size=2 * int(0.005 * SR) + 1)
rel = np.exp(-1 / (0.08 * SR))
out = np.empty_like(gr); cur = 1.0
for i in range(len(gr)):
    cur = min(gr[i], cur * rel + (1 - rel) * gr[i]) if gr[i] < cur else cur * rel + (1 - rel) * gr[i]
    out[i] = cur
mix *= out[:, None]
I, LRA, TP = lufs(mix)

OUT = os.path.join(ROOT, "audio", "r2", "mix")
os.makedirs(os.path.join(OUT, "stems"), exist_ok=True)
sf.write(os.path.join(OUT, "mix.wav"), mix, SR, subtype="PCM_24")
for k, x in stems.items():
    sf.write(os.path.join(OUT, "stems", f"{k}.wav"), x.astype(np.float32), SR, subtype="FLOAT")
pub = os.path.join(ROOT, "source", "public", "audio")
os.makedirs(pub, exist_ok=True)
sf.write(os.path.join(pub, "r2_mix.wav"), mix, SR, subtype="PCM_16")
gr_db = 20 * np.log10(out)
hot = np.where(gr_db < -2)[0]
spans = []
if len(hot):
    a = prev = hot[0]
    for k in hot[1:]:
        if k - prev > SR // 4:
            spans.append((a, prev)); a = k
        prev = k
    spans.append((a, prev))
meas = {"integrated_lufs": I, "lra_lu": LRA, "true_peak_dbtp": TP, "gain_db": round(20 * np.log10(g), 2),
        "limiter_max_gr_db": round(float(gr_db.min()), 2), "limiter_spans": [{"t": round(a / SR, 2), "dur": round((b - a) / SR, 2), "max_gr_db": round(float(gr_db[a:b + 1].min()), 1)} for a, b in spans],
        "cues": len(T["cues"]), "missing_kinds": sorted(missing), "radio_mix": R,
        "sfx_music_priority": {"margin_db": SFX_MARGIN, "ratio": SFX_RATIO, "max_gr_db": round(float(sfx_gr.max()), 2),
                               "mean_gr_db_when_active": round(float(sfx_gr[sfx_gr > 0.1].mean()) if (sfx_gr > 0.1).any() else 0.0, 2),
                               "active_s": round(float((sfx_gr > 0.1).sum() / SR), 1)}}
json.dump(meas, open(os.path.join(OUT, "measure.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in meas.items() if k != "limiter_spans"}))
