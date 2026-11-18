#!/usr/bin/env python3
"""Ultimate Trifecta - Winter Break V4 (33 s): score placement, sound design, mix.

    python3 build_mix2.py SHOTS_DIR OUT.wav

Score: the creator's "Three-Note Winter Motif" (32.7 s; the musical tail
ends ~32.5 s).  Edited to the picture (film time T, cue time c):
  T 0.035-8.267   c 0.000-8.232   the opening; the accent's attack (c 3.065)
                                  lands on the lobby->courtyard cut (T 3.100);
                                  snapped out just before the motif's third
                                  hit - the relay click takes its place
  T 8.267-8.933   silence         the click, the glare
  T 8.933-        c 8.898-        the chase phrase in hard on the elf's first
                                  step (the downbeat attack, c 8.8975)
  T 17.3-         ducked -26 dB under a closing low-pass, gone by ~T 19.6
                                  (the reindeer dives; the cart passes)
  T 23.333-27.7   c 18.866-23.233 the swell back on the bush shaking (attack
                                  c 18.8665); cut dead on the latch
  T 27.7-29.0     silence         the snow off the antler
  T 29.0-         c 30.187-32.7   the final accent's attack on the title's
                                  first frame; its own ring-out, extended by
                                  a reverb tail
Sound effects are placed from the engine's event logs and the planner's
clocks; the cart's motor is the game's cart loop pitched by speed and shaped
by its distance to each shot's camera.  Music and effects are written as
separate stems.
"""
import json, math, os, sys
import numpy as np
import soundfile as sf
import librosa
from scipy.signal import butter, sosfilt
import pyloudnorm as pyln
from pedalboard import Pedalboard, Reverb, Compressor, Limiter

sys.path.insert(0, "/home/user/ut/work")
import plan5 as P
from plan import Route, dist

SR = 48000
DUR = 33.0
N = int(DUR * SR)
CUE = "/home/user/ut/work/mus/polished.wav"
GAME = "/home/user/ut/game/game/assets/audio"
EL = "/home/user/ut/prev/Ultimate_Trifecta/season1-christmas-trailer/audio/sfx_src/el"
NEW = "/home/user/ut/work/sfx_el"
rng = np.random.default_rng(2512)
EDL = json.load(open("/home/user/ut/work/edl5.json"))
SHOTS = json.load(open(P.OUT_JSON))
INFO = EDL["info"]


def load(path, sr=SR):
    y, _ = librosa.load(path, sr=sr, mono=True)
    return y.astype(np.float32)


def db(x):
    return 10 ** (x / 20.0)


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR * 0.45), "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def trim(y, thr_db=-50):
    a = np.abs(y)
    idx = np.where(a > a.max() * db(thr_db))[0]
    return y[idx[0]:idx[-1] + 1] if len(idx) else y


def env_ad(n, a, d):
    t = np.arange(n) / SR
    return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)


class Bus:
    def __init__(self):
        self.L = np.zeros(N + 2 * SR, np.float32)
        self.R = np.zeros(N + 2 * SR, np.float32)

    def add(self, y, t, gain_db=0.0, pan=0.0):
        i = int(round(t * SR))
        if i < 0:
            y = y[-i:]
            i = 0
        y = y[: max(0, len(self.L) - i)]
        g = db(gain_db)
        a = (pan + 1) * math.pi / 4
        self.L[i:i + len(y)] += y * g * math.cos(a)
        self.R[i:i + len(y)] += y * g * math.sin(a)

    def arr(self):
        return np.stack([self.L[:N], self.R[:N]])


# ------------------------------------------------------------------ music
def find_attack(m, t_guess, win=0.12):
    lo = sosfilt(butter(4, 200, "low", fs=SR, output="sos"), m)
    full = np.abs(m)
    a, b = int((t_guess - win) * SR), int((t_guess + win) * SR)
    env = np.convolve(full[a:b], np.ones(240) / 240, mode="same")
    k = int(np.argmax(env))
    base = np.percentile(env[:max(k, 1)], 20)
    thr = base + (env[k] - base) * 0.25
    j = k
    while j > 0 and env[j] > thr:
        j -= 1
    return (a + j) / SR


def music_track():
    """the creator's finished score, placed at 0:00 and played straight through
    at its own speed and level (no edits, no fades)"""
    y, sr = sf.read(CUE, always_2d=True)
    y = y.T.astype(np.float32)
    if sr != SR:
        y = np.stack([librosa.resample(c, orig_sr=sr, target_sr=SR) for c in y])
    out = np.zeros((2, N), np.float32)
    n = min(N, y.shape[1])
    out[:, :n] = y[:, :n]
    return out, {"score": os.path.basename(CUE), "placed_at_s": 0.0, "score_dur_s": round(y.shape[1] / SR, 4)}


# ------------------------------------------------------------------ scene geometry
def clip_at(T):
    hit = None
    for c in sorted(EDL["clips"], key=lambda c: c[1]):
        if c[1] - 2e-3 <= T:
            hit = c
    return hit if hit is not None and T < 33.0 else None


def tau_of(T, sid):
    c = [c for c in EDL["clips"] if c[0] == sid][0]
    return SHOTS[sid]["tau0"] + (T - c[1])


def actor_pos(ad, tau):
    seg = None
    for s in ad["segs"]:
        if s["t0"] <= tau:
            seg = s
    if seg is None:
        seg = ad["segs"][0]
    if seg["mode"] == "route":
        r = Route(seg["pts"])
        p = r.at(seg.get("s0", 0.0) + dist(seg["speed"], tau - seg["t0"]))
        return np.array([p[0], 1.0, p[1]])
    if seg["mode"] == "hold":
        hp_ = seg["pos"]
        return np.array([hp_[0], 1.0, hp_[2] if len(hp_) > 2 else hp_[1]])
    return None


_cart_cache = {}


def cart_state(tau):
    c = SHOTS["v4_c1_round"]["carts"][0]
    if "r" not in _cart_cache:
        _cart_cache["r"] = Route(c["pts"])
    r = _cart_cache["r"]
    t = tau - c["t0"]
    s = c["s0"] + dist(c["speed"], t)
    v = (dist(c["speed"], t + 0.02) - dist(c["speed"], t - 0.02)) / 0.04
    p = r.at(s)
    return np.array([p[0], 0.7, p[1]]), v


def cam_pos(sid, T):
    sh = SHOTS[sid]
    c = [c for c in EDL["clips"] if c[0] == sid][0]
    lt = T - c[1]
    ks = sh["cam"]
    def res(p, tau):
        if isinstance(p, list):
            return np.array(p, float)
        if p.get("rel") == "lead":
            lead = [a for a in sh["actors"] if a["id"] == "lead"][0]
            return actor_pos(lead, tau) + np.array([0.0, 0.0, 0.0])
        if p.get("rel") == "cart":
            return cart_state(p.get("tau", tau))[0]
        return np.array([0.0, 1.0, 0.0])
    tau = tau_of(T, sid)
    if lt <= ks[0]["t"]:
        return res(ks[0]["pos"], tau)
    for a, b in zip(ks, ks[1:]):
        if lt <= b["t"]:
            u = (lt - a["t"]) / max(b["t"] - a["t"], 1e-4)
            return res(a["pos"], tau) * (1 - u) + res(b["pos"], tau) * u
    return res(ks[-1]["pos"], tau)


INDOOR = ("v4_a1_lobby", "v4_e1a_door", "v4_e5_inside")


# ------------------------------------------------------------------ the cart motor
def cart_motor(bus):
    loop = load(f"{GAME}/cart_loop.wav")
    block = 480
    gains = np.zeros(N, np.float32); rates = np.zeros(N, np.float32); cuts = np.full(N, 9000.0, np.float32)
    pans = np.zeros(N, np.float32)
    T_LATCH = INFO["T_LATCH"]
    for b in range(0, N, block):
        T = b / SR
        c = clip_at(T)
        g, rate, cut, pan = 0.0, 0.6, 9000.0, 0.0
        if c and c[0] != "v4_a1_lobby" and T < INFO["T_TITLE"]:
            sid = c[0]
            tau = tau_of(T, sid)
            if tau >= INFO["T_LIGHT"] - INFO["FT"] - 0.3:
                p, v = cart_state(tau)
                cp = cam_pos(sid, T)
                d = float(np.linalg.norm(p - cp))
                sp = abs(v)
                rate = 0.55 + min(sp / 10.0, 1.0) * 0.85
                g = (4.0 / max(d, 4.0)) ** 0.7 * (0.3 + 0.7 * min(sp / 7.0, 1.0))
                cut = 1800 + 8000 * (4.0 / max(d, 4.0)) ** 0.7
                pan = float(np.clip((p[0] - cp[0]) / 12.0, -0.6, 0.6)) * (1 if sid not in INDOOR else -1)
                if sid in INDOOR:
                    # through the doorway; muffled once the door is shut
                    g *= 0.8 if T < T_LATCH else 0.32
                    cut = min(cut, 4200 if T < T_LATCH else 650)
        gains[b:b + block] = g; rates[b:b + block] = rate; cuts[b:b + block] = cut; pans[b:b + block] = pan
    k = np.ones(19200) / 19200         # 0.4 s: the motor carries across the cuts
    gains = np.convolve(gains, k, mode="same"); rates = np.convolve(rates, np.ones(4800) / 4800, mode="same")
    cuts = np.convolve(cuts, k, mode="same"); pans = np.convolve(pans, k, mode="same")
    ph = np.cumsum(rates) % len(loop)
    i0 = ph.astype(int); fr = ph - i0
    sig = (loop[i0] * (1 - fr) + loop[(i0 + 1) % len(loop)] * fr) * gains
    # block one-pole low-pass by distance
    y = np.zeros_like(sig); z = 0.0
    for b in range(0, N, 256):
        a = 1 - math.exp(-2 * math.pi * cuts[b] / SR)
        seg = sig[b:b + 256]
        o = np.empty_like(seg)
        for i, x in enumerate(seg):
            z += a * (x - z); o[i] = z
        y[b:b + 256] = o
    a = (pans + 1) * math.pi / 4
    bus.L[:N] += (y * np.cos(a)) * db(-8.0)
    bus.R[:N] += (y * np.sin(a)) * db(-8.0)


# ------------------------------------------------------------------ foley
def snow_crunch(n_ms=110, bright=1.0):
    n = int(n_ms * SR / 1000)
    x = rng.standard_normal(n).astype(np.float32)
    # granular crackle: sparse impulses through a band-pass, over a soft body
    grains = (rng.random(n) < 0.012).astype(np.float32) * rng.uniform(0.4, 1.0, n).astype(np.float32)
    cr = bp(grains * 3.0 + x * 0.25, 1400, 6500 * bright, 2)
    body = lp(x, 500, 2) * 0.6
    return ((cr + body) * env_ad(n, 0.003, n_ms / 1000 * 0.35)).astype(np.float32)


def snow_plop():
    """a small clump of packed snow landing on a wooden floor: a soft low
    thud, a short crumbly crush and a tiny scatter"""
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * (180 - 90 * t) * t) * np.exp(-t / 0.022) * 0.9
    x = rng.standard_normal(n).astype(np.float32)
    crush = bp(x, 700, 3800, 2) * np.exp(-t / 0.045) * 0.55
    grains = (rng.random(n) < 0.006).astype(np.float32) * rng.uniform(0.2, 0.7, n).astype(np.float32)
    scatter = bp(grains, 2000, 7000, 2) * np.exp(-np.maximum(t - 0.02, 0) / 0.06) * 2.0
    return (thud + crush + scatter).astype(np.float32)


def flump(size=1.0):
    """snow sliding off branches and landing: a soft whump"""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n).astype(np.float32)
    return (lp(x, 900, 2) * env_ad(n, 0.02, 0.18) * size + bp(x, 1500, 5000, 2) * env_ad(n, 0.005, 0.08) * 0.25 * size).astype(np.float32)


def room_tone(n, level_db):
    x = rng.standard_normal(n).astype(np.float32)
    return lp(hp(x, 60), 900, 2) * db(level_db)


def wind(n):
    w1 = load(f"{EL}/wind_1.mp3")
    w = np.tile(w1, int(np.ceil(n / len(w1))) + 1)[:n]
    return hp(w, 90)


def build_sfx(shots_dir):
    bus = Bus()
    T_LIGHT, T_STEP, T_LATCH, T_LAND = INFO["T_LIGHT"], INFO["T_STEP"], INFO["T_LATCH"], INFO["T_LAND"]
    T_DIVE, FT = INFO["T_DIVE"], INFO["FT"]
    t = np.arange(N) / SR
    # ---- beds: the warm room / the cold night
    indoor = np.zeros(N, np.float32)
    for c in EDL["clips"]:
        if c[0] in INDOOR:
            indoor[int(c[1] * SR):int((c[1] + c[2]) * SR)] = 1.0
    indoor = np.convolve(indoor, np.ones(960) / 960, mode="same")
    rt = room_tone(N, -44.0)
    bus.add(rt * indoor, 0.0)
    wd = wind(N)
    door_open = np.zeros(N, np.float32)
    door_open[int(INFO["T_E1A"] * SR):int(T_LATCH * SR)] = 1.0
    door_open = np.convolve(door_open, np.ones(480) / 480, mode="same")
    outdoor = 1.0 - indoor
    wgain = outdoor * db(-27.0) + indoor * door_open * db(-31.0) + indoor * (1 - door_open) * db(-50.0)
    w = lp(wd, 2600, 2) * wgain
    bus.L[:N] += w * 0.95; bus.R[:N] += np.roll(w, 900) * 0.95
    # the fountain running behind the meetup (A2-B1)
    pond = load(f"{EL}/pond_1.mp3")
    fw = np.tile(pond, 6)[:int(6.4 * SR)]
    fw = lp(hp(fw, 200), 5000) * np.clip(np.linspace(0, 6, len(fw)), 0, 1) * np.clip(np.linspace(6, 0, len(fw)), 0, 1)
    bus.add(fw, 3.1, gain_db=-30.0, pan=0.25)
    # ---- A1: the push bar, the door easing open; a soft latch as it settles behind (under the cut)
    lat_s = trim(load(f"{NEW}/latch_soft_2.mp3"))
    bus.add(lat_s * 0.7, 0.28, gain_db=-14.0, pan=0.1)
    # ---- A2: the slipper onto the stone rim
    land = trim(load(f"{GAME}/land.wav"))
    bus.add(lp(land, 2500), FT - 0.01, gain_db=-24.0)
    # ---- A3: the toe in the water, the recoil
    plip = trim(load(f"{EL}/pond_2.mp3"))[: int(0.5 * SR)]
    bus.add(hp(plip, 400) * np.exp(-np.arange(min(len(plip), int(0.5 * SR))) / SR / 0.15)[:len(plip)], FT + 1.02, gain_db=-20.0, pan=0.1)
    rus = trim(load(f"{EL}/rustle_1.mp3"))
    bus.add(hp(rus[:int(0.35 * SR)], 900) * np.linspace(1, 0, int(0.35 * SR))[:len(rus)], FT + 1.12, gain_db=-30.0)
    # ---- the relay click: a sharp contact, a low body knock, and the lamps' faint buzz
    clk = trim(load(f"{EL}/click_1.mp3"))[: int(0.12 * SR)]
    knock = np.sin(2 * np.pi * 95 * np.arange(int(0.08 * SR)) / SR) * np.exp(-np.arange(int(0.08 * SR)) / SR / 0.018)
    bus.add(hp(clk, 800), T_LIGHT, gain_db=-8.0, pan=-0.35)
    bus.add(knock.astype(np.float32), T_LIGHT + 0.004, gain_db=-16.0, pan=-0.35)
    nb = int(1.2 * SR)
    buzz = (np.sin(2 * np.pi * 120 * np.arange(nb) / SR) * 0.5 + bp(rng.standard_normal(nb), 2000, 6000) * 0.2) * np.exp(-np.arange(nb) / SR / 0.5)
    bus.add(buzz.astype(np.float32), T_LIGHT + 0.01, gain_db=-40.0, pan=-0.35)
    # ---- the cart: tyres biting as it cuts (B2), the motor (below)
    skid = trim(load(f"{EL}/skid_1.mp3"))
    b2 = [c for c in EDL["clips"] if c[0] == "v4_b2_wheels"][0]
    bus.add(lp(skid[:int(0.6 * SR)], 3000) * np.linspace(1, 0, int(0.6 * SR))[:len(skid)], b2[1] + 0.12, gain_db=-24.0, pan=0.2)
    cart_motor(bus)
    # ---- footfalls from the event logs: pavement, snow, the lobby floor
    st = trim(load(f"{GAME}/step.wav"))
    for c in EDL["clips"]:
        sid, t0, dur = c[0], c[1], c[2]
        p = os.path.join(shots_dir, sid + ".events.json")
        if not os.path.exists(p):
            continue
        ev = json.load(open(p))
        fps = ev["fps"]
        for e in ev["events"]:
            T = t0 + e["f"] / fps
            if T >= t0 + dur or T < t0:
                continue
            d = max(e["dist"], 1.2)
            pan = float(np.clip((e["screen"][0] - 0.5) * 1.4, -0.7, 0.7)) if e["screen"][0] >= 0 else 0.0
            k = e["kind"]
            if k == "step":
                g = -20.0 - 20 * math.log10(d / 1.2)
                y = st * rng.uniform(0.8, 1.1)
                y = librosa.effects.pitch_shift(y, sr=SR, n_steps=float(rng.uniform(-1.5, 1.0))) if False else y
                if sid in INDOOR:
                    y = lp(y, 2400) * 1.2
                if e["who"] == "lead":
                    y = lp(y, 1800) * 0.9           # bunny slippers: softer
                bus.add(y, T, gain_db=g + rng.uniform(-1.5, 1.5), pan=pan)
            elif k == "print":
                g = -14.0 - 20 * math.log10(d / 1.2)
                bus.add(snow_crunch(int(rng.uniform(90, 140))), T, gain_db=g, pan=pan)
            elif k == "rustle":
                g = -10.0 - 20 * math.log10(d / 1.5)
                r2 = trim(load(f"{EL}/rustle_2.mp3"))
                bus.add(r2[:int(0.9 * SR)] * np.linspace(1, 0.0, int(0.9 * SR))[:len(r2)], T - 0.03, gain_db=g, pan=pan)
                bus.add(flump(1.0), T + 0.05, gain_db=g - 4, pan=pan)
            elif k == "snowpuff":
                g = -16.0 - 20 * math.log10(d / 1.5)
                bus.add(flump(0.7), T, gain_db=g, pan=pan)
            elif k == "dive":
                g = -18.0 - 20 * math.log10(d / 1.5)
                dv = trim(load(f"{GAME}/dive.wav"))
                bus.add(lp(dv, 4000), T, gain_db=g, pan=pan)
            elif k == "jump" and sid == "v4_d3_out" and e["who"] == "deer":
                # the spring off the planted foot: a hard push through the snow
                g = -12.0 - 20 * math.log10(d / 1.5)
                bus.add(snow_crunch(150, 1.1), T, gain_db=g, pan=pan)
            elif k == "branch_snow":
                g = -12.0 - 20 * math.log10(max(d, 1.5) / 1.5)
                bus.add(flump(0.9), T, gain_db=g, pan=pan)
            elif k == "chunk_land":
                g = -16.0 - 20 * math.log10(max(d, 1.5) / 1.5)
                bus.add(snow_plop() * 0.7, T, gain_db=g, pan=pan)
    # ---- the tyre tearing through the drift (C3): from the planner's clock
    c3 = [c for c in EDL["clips"] if c[0] == "v4_c3_prints"][0]
    zp = 59.95 - 0.85
    for T in np.arange(c3[1], c3[1] + c3[2], 0.01):
        p, v = cart_state(tau_of(T, "v4_c3_prints"))
        if (p[2] + 0.8) >= zp:
            n = int(0.55 * SR)
            x = rng.standard_normal(n).astype(np.float32)
            crunch = (bp(x, 600, 4500) * env_ad(n, 0.01, 0.2) + lp(x, 300) * env_ad(n, 0.01, 0.15) * 0.8)
            bus.add(crunch, T, gain_db=-12.0, pan=0.1)
            break
    # ---- inside the bush: branches brushing fabric as he settles and ducks
    r1 = trim(load(f"{EL}/rustle_1.mp3"))
    d2 = [c for c in EDL["clips"] if c[0] == "v4_d2_eye"][0]
    for dt, g in [(0.05, -22.0), (0.3, -26.0)]:
        seg = r1[int(rng.uniform(0, 0.5) * SR):][:int(0.45 * SR)]
        seg = hp(seg, 700) * np.hanning(len(seg)).astype(np.float32)
        bus.add(seg.astype(np.float32), d2[1] + dt, gain_db=g, pan=rng.uniform(-0.3, 0.3))
    # D3: the branch pushed aside (leaves dragging on the sleeve), then let go: it whips back
    T_PUSH, T_SPRING = INFO["T_PUSH"], INFO["T_SPRING"]
    seg = hp(r1[:int(0.5 * SR)], 600) * np.hanning(int(0.5 * SR))[:len(r1[:int(0.5 * SR)])]
    bus.add(seg.astype(np.float32), T_PUSH - 0.08, gain_db=-17.0, pan=0.25)
    n = int(0.32 * SR); tt = np.arange(n) / SR
    whip = bp(rng.standard_normal(n).astype(np.float32), 900, 5000) * np.exp(-tt / 0.06) * np.clip(tt / 0.015, 0, 1)
    bus.add(whip.astype(np.float32), T_SPRING + 0.2, gain_db=-17.0, pan=0.3)                 # the release
    r3 = trim(load(f"{EL}/rustle_2.mp3"))[:int(0.6 * SR)]
    bus.add(hp(r3, 500) * np.linspace(1, 0, len(r3)).astype(np.float32), T_SPRING + 0.24, gain_db=-21.0, pan=0.3)
    # E1a: the elf yanks the L leaf open and catches it - a swing of air and a palm on the wood
    ta_T = INFO["elf_arrive"] - P.KE
    nsw = int(0.35 * SR)
    sw = lp(rng.standard_normal(nsw).astype(np.float32), 600) * np.hanning(nsw)
    bus.add(sw.astype(np.float32), ta_T - 0.04, gain_db=-24.0, pan=-0.3)
    n = int(0.12 * SR); tt = np.arange(n) / SR
    slap = (np.sin(2 * np.pi * 210 * tt) * np.exp(-tt / 0.02) * 0.7 + bp(rng.standard_normal(n), 800, 4000) * np.exp(-tt / 0.012) * 0.6)
    bus.add(slap.astype(np.float32), ta_T + 0.27, gain_db=-20.0, pan=-0.3)
    # E4: the grab on the forearm (cloth), the leaf swinging shut
    T_CATCH = INFO["T_CATCH"]
    n = int(0.18 * SR); tt = np.arange(n) / SR
    grab = bp(rng.standard_normal(n).astype(np.float32), 400, 3000) * np.exp(-tt / 0.05) * np.clip(tt / 0.008, 0, 1)
    bus.add(grab.astype(np.float32), T_CATCH, gain_db=-21.0, pan=0.0)
    # ---- the doors: a swing, then the firm latch on T_LATCH
    lat_f = trim(load(f"{NEW}/latch_firm_1.mp3"))
    pk = int(np.argmax(np.abs(lat_f)))
    bus.add(lat_f, T_LATCH - pk / SR, gain_db=-4.0, pan=0.0)
    nsw = int(1.0 * SR)
    swing = lp(rng.standard_normal(nsw).astype(np.float32), 420) * np.hanning(nsw) * np.linspace(0.5, 1.0, nsw)
    bus.add(swing.astype(np.float32), T_LATCH - 1.0, gain_db=-24.0, pan=0.2)
    # the leaf set swinging as the elf steps in behind the reindeer
    nsw2 = int(0.6 * SR)
    sw2 = lp(rng.standard_normal(nsw2).astype(np.float32), 500) * np.hanning(nsw2)
    bus.add(sw2.astype(np.float32), INFO["T_CLEAR"] + 0.02, gain_db=-26.0, pan=0.3)
    # ---- the clump of snow on the lobby floor, the cut on the landing
    plop = snow_plop()
    bus.add(plop, T_LAND - 0.004, gain_db=-12.0, pan=0.05)
    bus.add(snow_crunch(60, 0.8), T_LAND - 0.45, gain_db=-34.0)     # it breaks off the antler
    return bus


# ------------------------------------------------------------------ main
def limit(x, ceiling_db=-2.0, release=0.08, look=0.003):
    """a plain look-ahead peak limiter: instant (look-ahead) attack, exponential release"""
    from scipy.ndimage import minimum_filter1d
    c = db(ceiling_db)
    pk = np.abs(x).max(axis=0)
    g = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    w = int(look * SR) * 2 + 1
    g = minimum_filter1d(g, w, mode="nearest")
    a = math.exp(-1.0 / (release * SR))
    out = np.empty_like(g); z = 1.0
    for i in range(len(g)):
        z = g[i] if g[i] < z else g[i] + (z - g[i]) * a
        out[i] = z
    out = np.convolve(out, np.ones(w) / w, mode="same")
    return x * np.minimum(out, g)[None, :]


def master(mix):
    meter = pyln.Meter(SR)
    x = mix.astype(np.float64)
    for _ in range(6):
        L = meter.integrated_loudness(x.T)
        x = limit(x * db(-14.0 - L))
    L = meter.integrated_loudness(x.T)
    up = librosa.resample(x.astype(np.float32), orig_sr=SR, target_sr=SR * 4)
    tp = 20 * np.log10(np.abs(up).max())
    return x.astype(np.float32), L, tp


def main():
    shots_dir, out = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(os.path.dirname(out), "stems"), exist_ok=True)
    mus, info = music_track()
    bus = build_sfx(shots_dir)
    sfx = bus.arr()
    mix = mus + sfx
    x, L, tp = master(mix)
    gain = x.std() / max(mix.std(), 1e-9)
    sf.write(out, x.T, SR, subtype="PCM_24")
    sd = os.path.join(os.path.dirname(out), "stems")
    sf.write(os.path.join(sd, "music_score.wav"), mus.T, SR, subtype="PCM_24")
    sf.write(os.path.join(sd, "sfx.wav"), sfx.T, SR, subtype="PCM_24")
    info.update({"lufs": round(float(L), 2), "true_peak_dbtp": round(float(tp), 2)})
    json.dump({k: (round(v, 4) if isinstance(v, float) else v) for k, v in info.items()}, open(out.replace(".wav", ".json"), "w"), indent=1, default=float)
    print(f"mix: {L:.2f} LUFS, {tp:.2f} dBTP -> {out}")


if __name__ == "__main__":
    main()
