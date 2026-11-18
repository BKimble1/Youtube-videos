#!/usr/bin/env python3
"""Ultimate Trifecta - Winter Break 40 s trailer: music edit, sound design and mix.

    python3 build_mix.py SHOTS_DIR OUT.wav

Music: the creator's take (screen recording, complete playback from 5.179 s),
edited to the picture:
  0:00-0:08   clean 0.000-8.000  (the quiet opening; hard stop as the light finds them)
  0:08-0:12   silence             (motor, water, wind only)
  0:12-0:21.1 clean 9.008-       (restart on the first running step; the 17.0
                                   downbeat lands on the splash at 0:20)
  0:20-0:21.9 muffled              (the camera goes under)
  0:21.0-0:30 clean 16.275-25.265 (crossfaded under the muffle; the strongest
                                   build carries the run home; stops on the latch)
  0:30-0:36   silence             (the motor fading, the squeak)
  0:36-0:40   clean 25.275-       (the accent's attack on the logo's first frame,
                                   the take's own decay under the card)
Sound effects are placed from the engine's event logs (footfalls, jumps,
splashes, the switch) and the planner's clocks; the cart's motor is the
game's own cart loop, pitched by speed and shaped by distance to each shot's
camera.
"""
import json, math, os, sys
import numpy as np
import soundfile as sf
import librosa
from scipy.signal import butter, sosfilt, sosfiltfilt
import pyloudnorm as pyln

sys.path.insert(0, "/home/user/ut/work")
import plan as PL

SR = 48000
DUR = 40.0
N = int(DUR * SR)
HERE = os.path.dirname(os.path.abspath(__file__))
TAKE = "/tmp/claude-0/-home-user-Youtube-videos/7907a580-3635-5aed-b27e-d07472534992/scratchpad/rec/take_clean.wav"
GAME = "/home/user/ut/game/game/assets/audio"
EL = "/home/user/ut/prev/Ultimate_Trifecta/season1-christmas-trailer/audio/sfx_src/el"
NEW = "/home/user/ut/work/sfx_el"
rng = np.random.default_rng(1225)


def load(path, sr=SR, mono=True):
    y, s = librosa.load(path, sr=sr, mono=mono)
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


class Bus:
    def __init__(self):
        self.L = np.zeros(N + SR, np.float32)
        self.R = np.zeros(N + SR, np.float32)

    def add(self, y, t, gain_db=0.0, pan=0.0):
        """mono y at time t (s), equal-power pan -1..1"""
        i = int(round(t * SR))
        if i < 0:
            y = y[-i:]
            i = 0
        y = y[: max(0, len(self.L) - i)]
        g = db(gain_db)
        a = (pan + 1) * math.pi / 4
        self.L[i:i + len(y)] += y * g * math.cos(a)
        self.R[i:i + len(y)] += y * g * math.sin(a)

    def add_st(self, l, r, t, gain_db=0.0):
        i = int(round(t * SR))
        n = min(len(l), len(self.L) - i)
        self.L[i:i + n] += l[:n] * db(gain_db)
        self.R[i:i + n] += r[:n] * db(gain_db)

    def arr(self):
        return np.stack([self.L[:N], self.R[:N]])


# ------------------------------------------------------------------ music
def find_attack(y, t_guess, win=0.15):
    """the accent's attack: on a 10 ms low-band envelope, find the peak near
    the guess, then the first sample where the rise into it passes 15 %"""
    m = y.mean(0) if y.ndim > 1 else y
    lo = sosfilt(butter(4, 160, "low", fs=SR, output="sos"), m)
    a, b = int((t_guess - win) * SR), int((t_guess + win) * SR)
    env = np.sqrt(np.convolve(lo[a:b] ** 2, np.ones(480) / 480, mode="same"))
    k = int(np.argmax(env))
    base = env[:k].min()
    thr = base + (env[k] - base) * 0.15
    j = k
    while j > 0 and env[j] > thr:
        j -= 1
    return (a + j) / SR


def music_track():
    y, sr = sf.read(TAKE, always_2d=True)
    y = y.T.astype(np.float32)
    if sr != SR:
        y = np.stack([librosa.resample(c, orig_sr=sr, target_sr=SR) for c in y])
    att = find_attack(y, 25.275)
    print(f"music: accent attack at clean {att:.4f} s (recording {att + 5.1792:.4f} s)")
    L = np.zeros((2, N + SR), np.float32)

    def place(t_out, c0, c1, fi=0.004, fo=0.012, gain=1.0):
        a, b = int(round(c0 * SR)), int(round(c1 * SR))
        seg = y[:, a:b].copy() * gain
        n = seg.shape[1]
        if fi > 0:
            seg[:, :int(fi * SR)] *= np.linspace(0, 1, int(fi * SR))[None, :]
        if fo > 0:
            k = int(fo * SR)
            seg[:, n - k:] *= np.linspace(1, 0, k)[None, :]
        i = int(round(t_out * SR))
        L[:, i:i + n] += seg[:, :L.shape[1] - i]
        return seg

    # A: the opening, stopped dead on 0:08 (on the beat that would have come)
    place(0.0, 0.0, 8.0, fi=0.0, fo=0.02)
    # B: the restart on the first stride (strong downbeat at clean 9.008),
    # running to 0:21.35 (crossfade out under the muffle)
    b0 = 9.008 - 0.012
    segB_end = 21.35
    B = y[:, int(b0 * SR):int((b0 + (segB_end - 11.988)) * SR)].copy()
    B[:, :int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[None, :]
    xf = int(0.35 * SR)
    B[:, -xf:] *= np.cos(np.linspace(0, math.pi / 2, xf))[None, :] ** 1
    i = int(round(11.988 * SR))
    L[:, i:i + B.shape[1]] += B
    # C: from clean 16.275 at 0:21.0, crossfading in, to the accent (stops on the latch)
    c0 = 16.275
    t0 = 21.0
    cend = att - 0.006
    C = y[:, int(c0 * SR):int(cend * SR)].copy()
    C[:, :xf] *= np.sin(np.linspace(0, math.pi / 2, xf))[None, :]
    C[:, -int(0.008 * SR):] *= np.linspace(1, 0, int(0.008 * SR))[None, :]
    i = int(round(t0 * SR))
    L[:, i:i + C.shape[1]] += C
    t_c_end = t0 + C.shape[1] / SR
    print(f"music: run-home section ends at {t_c_end:.4f} s (the latch at 30.000)")
    # D: the accent on the logo's first frame, the take's decay under the card
    D = y[:, int(att * SR):].copy()
    D = D[:, :int(4.0 * SR)]
    n = D.shape[1]
    tail = int(0.6 * SR)
    D[:, n - tail:] *= np.linspace(1, 0, tail)[None, :] ** 1.5
    i = int(round(36.0 * SR))
    L[:, i:i + n] += D[:, :L.shape[1] - i]
    L = L[:, :N]
    # muffle 0:20.0-0:21.9: a low-pass sweep (under water) and a dip
    t = np.arange(N) / SR
    cut = np.full(N, 20000.0)
    def seg(t0, t1, f0, f1):
        m = (t >= t0) & (t < t1)
        u = (t[m] - t0) / (t1 - t0)
        cut[m] = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * u)
    seg(19.98, 20.12, 20000, 380)
    seg(20.12, 21.45, 380, 330)
    seg(21.45, 21.95, 330, 20000)
    gain = np.ones(N)
    m = (t >= 20.0) & (t < 21.95)
    gain[m] = 1.0 - 0.35 * np.sin(np.clip((t[m] - 20.0) / 1.95, 0, 1) * math.pi)
    L = varlp(L, cut) * gain[None, :]
    return L.astype(np.float32), att


def varlp(x, cut, block=256):
    """time-varying one-pole x2 low-pass (cutoff per sample, block-stepped)"""
    out = np.zeros_like(x)
    z1 = np.zeros(x.shape[0]); z2 = np.zeros(x.shape[0])
    for b in range(0, x.shape[1], block):
        f = cut[b]
        if f >= 19000:
            out[:, b:b + block] = x[:, b:b + block]
            z1 = x[:, min(b + block, x.shape[1]) - 1].copy(); z2 = z1.copy()
            continue
        a = math.exp(-2 * math.pi * f / SR)
        seg = x[:, b:b + block]
        o = np.zeros_like(seg)
        for k in range(seg.shape[1]):
            z1 = (1 - a) * seg[:, k] + a * z1
            z2 = (1 - a) * z1 + a * z2
            o[:, k] = z2
        out[:, b:b + block] = o
    return out


# ------------------------------------------------------------------ helpers for shots
EDL = json.load(open("/home/user/ut/work/edl.json"))
SHOTS = json.load(open(PL.OUT_JSON))


def clip_at(T):
    for c in EDL["clips"]:
        if c[1] - 1e-6 <= T < c[1] + c[2] - 1e-6:
            return c
    return None


def tau_of(T, sid):
    sh = SHOTS[sid]
    st = [c for c in EDL["clips"] if c[0] == sid][0][1]
    return PL.tau_at(T - st, sh.get("speed"), sh["tau0"])


def rate_of(T, sid):
    sh = SHOTS[sid]
    st = [c for c in EDL["clips"] if c[0] == sid][0][1]
    sp = sh.get("speed")
    if not sp:
        return 1.0
    h = 0.01
    return (PL.tau_at(T - st + h, sp, sh["tau0"]) - PL.tau_at(T - st, sp, sh["tau0"])) / h


def cam_pos(sid):
    k = SHOTS[sid]["cam"][0]["pos"]
    if isinstance(k, list):
        return np.array(k, float)
    return None


# ------------------------------------------------------------------ the cart
def cart_state(tau):
    c = SHOTS["s03_rim_test"]["carts"][0]
    r = PL.Route(c["pts"])
    t = tau - c["t0"]
    s = c["s0"] + PL.dist(c["speed"], t)
    h = 0.02
    v = (PL.dist(c["speed"], t + h) - PL.dist(c["speed"], t)) / h
    p = r.at(s) if s >= 0 else [c["pts"][0][0] - s, c["pts"][0][1]]
    return np.array([p[0], 0.8, p[1]]), v


def cart_motor(bus):
    """the game's cart loop, pitched by speed, level and tone by distance to
    the camera of the shot on screen (fountain sequence), then the dorm-side
    retreat heard through the door"""
    loop = load(f"{GAME}/cart_loop.wav")
    start = load(f"{GAME}/cart_start.wav")
    out = np.zeros(N, np.float32)
    phase = 0.0
    block = 480
    lvl_prev = 0.0
    tone = np.zeros(N, np.float32)
    gains = np.zeros(N, np.float32)
    rates = np.zeros(N, np.float32)
    cuts = np.zeros(N, np.float32)
    for b in range(0, N, block):
        T = b / SR
        c = clip_at(T)
        g = 0.0; rate = 1.0; cut = 9000.0
        if c and T < 28.5 and c[0] not in ("s01_dorm_out",):
            sid = c[0]
            tau = tau_of(T, sid)
            p, v = cart_state(tau)
            cp = cam_pos(sid)
            if cp is None:
                # follow cameras: the lead's position stands in for the camera
                cp = np.array([1.0, 1.5, 9.6]) if sid == "s08_leap" else np.array([0.8, 2.0, 35.0])
                if sid == "s12_follow":
                    lt = tau
                    cp = np.array([0.8, 3.0, 29.5 + max(0, (lt - SHOTS[sid]["tau0"])) * 5.5 - 5.9])
            d = float(np.linalg.norm(p - cp))
            spd = abs(v) * rate_of(T, sid)
            rate = (0.62 + min(abs(v) / 9.0, 1.0) * 0.75) * max(0.35, min(1.0, rate_of(T, sid)))
            g = (2.2 / max(d, 2.2)) * (0.35 + 0.65 * min(abs(v) / 6.0, 1.0))
            # idle hum when stopped (electric: a soft whine)
            if abs(v) < 0.3:
                g = (2.2 / max(d, 2.2)) * 0.22
                rate = 0.55
            cut = 1500 + 9000 * (2.2 / max(d, 2.2))
            if sid == "s08_leap" and rate_of(T, sid) < 0.6:
                g *= 0.4
        elif T >= 28.5:
            # off screen: he pulls away after the click, heard from the porch
            # and then through the closed door, fading toward the quad
            u = (T - 28.5)
            g = 0.18 * math.exp(-u / 2.2) if u < 6.0 else 0.0
            rate = 0.75 + 0.2 * math.exp(-u)
            cut = 2600 if T < 30.0 else 520
        gains[b:b + block] = g; rates[b:b + block] = rate; cuts[b:b + block] = cut
    # smooth the controls
    k = np.ones(2400) / 2400
    gains = np.convolve(gains, k, mode="same"); rates = np.convolve(rates, k, mode="same")
    # variable-rate read of the loop
    ph = np.cumsum(rates) % len(loop)
    i0 = ph.astype(int); fr = ph - i0
    sig = loop[i0] * (1 - fr) + loop[(i0 + 1) % len(loop)] * fr
    sig = sig * gains
    # distance tone (block-stepped one-pole)
    sig = varlp(sig[None, :], np.convolve(cuts, k, mode="same"))[0]
    bus.add(sig.astype(np.float32), 0.0, gain_db=1.5, pan=-0.15)
    # restarts: the cart pulling away from the bend (tau 7.6)
    t_go = 4.10 + 7.6
    bus.add(trim(start) * 0.6, t_go - 0.05, gain_db=-14.0, pan=-0.5)


# ------------------------------------------------------------------ sound design
def steps(bus, shots_dir):
    st = trim(load(f"{GAME}/step.wav"))
    land = trim(load(f"{GAME}/land.wav"))
    for c in EDL["clips"]:
        sid, t0, dur = c
        p = os.path.join(shots_dir, sid + ".events.json")
        if not os.path.exists(p):
            continue
        ev = json.load(open(p))
        for e in ev["events"]:
            T = t0 + float(e["t"])
            if T >= t0 + dur:
                continue
            d = max(1.0, float(e["dist"]))
            pan = float(np.clip((e["screen"][0] - 0.5) * 1.6, -0.8, 0.8)) if e["screen"][0] >= 0 else 0.0
            dist_db = -20 * math.log10(d / 2.0)
            sr = rate_of(T, sid) if SHOTS[sid].get("speed") else 1.0
            if sr < 0.6:
                continue
            wet = sid not in ("s01_dorm_out",) and T > 20.6
            if e["kind"] == "step":
                y = st * rng.uniform(0.8, 1.1)
                if wet:
                    # wet slippers on stone: a little slap and squelch
                    y = y + 0.4 * bp(rng.standard_normal(int(0.07 * SR)).astype(np.float32) * np.exp(-np.linspace(0, 6, int(0.07 * SR))), 600, 3000)[: len(y)] if len(y) >= int(0.07 * SR) else y
                bus.add(lp(y, 5000 if wet else 3500), T, gain_db=-17 + dist_db, pan=pan)
            elif e["kind"] in ("jump",) and e["who"] != "officer":
                bus.add(lp(land, 3000), T, gain_db=-24 + dist_db, pan=pan)


def build_sfx(shots_dir):
    bus = Bus()
    A = EDL["info"]
    # ---- ambiences ---------------------------------------------------------
    wind = load(f"{EL}/wind_1.mp3")
    wind = np.tile(wind, 6)[:N]
    wl = lp(hp(wind, 120), 2500)
    amb = np.zeros(N, np.float32)
    t = np.arange(N) / SR
    env = np.zeros(N, np.float32)
    env[(t >= 0) & (t < 4.0)] = 0.25                 # inside: the night beyond the door
    m = (t >= 0.45) & (t < 4.0)
    env[m] = 0.25 + 0.5 * np.clip((t[m] - 0.45) / 0.8, 0, 1)
    env[(t >= 4.0) & (t < 28.5)] = 1.0
    env[(t >= 28.5) & (t < 30.0)] = 0.85
    env[(t >= 30.0) & (t < 36.0)] = 0.12              # through the closed door
    env = np.convolve(env, np.ones(1200) / 1200, mode="same")
    bus.add(wl * env, 0.0, gain_db=-27.0)
    # fountain water: a bed of filtered noise and burble, louder by the water
    n = rng.standard_normal(N).astype(np.float32)
    fw = bp(n, 300, 5000) * 0.6 + bp(n * (0.6 + 0.4 * np.sin(np.arange(N) * 2 * math.pi * 7 / SR)), 1500, 7000) * 0.4
    fenv = np.zeros(N, np.float32)
    for sid, g in [("s02_rim_foot", 1.0), ("s03_rim_test", 1.0), ("s04_freeze", 0.5), ("s05_cart", 0.4), ("s06_nod", 0.5),
                   ("s07_wide", 0.7), ("s08_leap", 0.9), ("s11_surface", 1.2), ("s12_follow", 0.55), ("s13_officer", 0.12)]:
        c = [x for x in EDL["clips"] if x[0] == sid][0]
        fenv[(t >= c[1]) & (t < c[1] + c[2])] = g
    fenv[(t >= 13.5) & (t < 20.0)] *= 0.35            # slow motion: the world recedes
    fenv = np.convolve(fenv, np.ones(1200) / 1200, mode="same")
    bus.add(fw * fenv, 0.0, gain_db=-33.0, pan=0.1)
    # room tone inside (a soft hum and the tree lights' faint buzz)
    rt = lp(rng.standard_normal(N).astype(np.float32), 400) * 0.5 + 0.02 * np.sin(2 * math.pi * 120 * np.arange(N) / SR).astype(np.float32)
    renv = np.zeros(N, np.float32)
    renv[(t < 4.0)] = 1.0
    renv[(t >= 29.65) & (t < 36.0)] = 1.0
    renv[(t >= 28.5) & (t < 29.65)] = 0.4
    renv = np.convolve(renv, np.ones(480) / 480, mode="same")
    bus.add(rt * renv, 0.0, gain_db=-40.0)

    # ---- the departure: the push plate, the hinge, the soft latch ------------
    soft = trim(load(f"{NEW}/latch_soft_2.mp3"), -45)
    firm = trim(load(f"{NEW}/latch_firm_1.mp3"), -45)
    click = trim(load(f"{EL}/click_1.mp3"), -45)
    # unlatch as the door begins to move (0.42): the soft latch's click, quieter
    bus.add(soft[: int(0.2 * SR)], 0.40, gain_db=-8.0, pan=-0.1)
    # a low creak while it eases open (0.45-1.3)
    cr = np.zeros(int(0.85 * SR), np.float32)
    ph = np.cumsum(90 + 25 * np.sin(np.linspace(0, 7, len(cr))) + rng.standard_normal(len(cr)) * 8) / SR
    cr = (np.sin(2 * math.pi * ph) * np.sin(np.linspace(0, math.pi, len(cr))) ** 2).astype(np.float32)
    cr = bp(cr * (1 + 0.5 * rng.standard_normal(len(cr)).astype(np.float32)), 150, 1800)
    bus.add(cr, 0.47, gain_db=-30.0, pan=-0.1)
    # the latch, softly, as the door drifts shut behind them (delta 4.58): a
    # sound bridge under the slipper's landing at the fountain
    k = int(np.argmax(np.abs(soft)))
    bus.add(lp(soft, 3500), 4.58 - k / SR, gain_db=-2.0, pan=0.0)

    # ---- the fountain ---------------------------------------------------------
    # the slipper lands on the stone rim (tau 0 = 4.10)
    st = trim(load(f"{GAME}/step.wav"))
    bus.add(lp(st, 4000), 4.10, gain_db=-10.0, pan=0.0)
    # the toe in the water: a tiny plip and a ripple
    plip = np.sin(2 * math.pi * np.cumsum(np.linspace(1400, 650, int(0.08 * SR))) / SR) * np.exp(-np.linspace(0, 7, int(0.08 * SR)))
    bus.add(plip.astype(np.float32), 4.10 + 1.02, gain_db=-20.0, pan=-0.2)
    pond = trim(load(f"{EL}/pond_1.mp3"))
    bus.add(lp(pond[: int(0.5 * SR)], 3000), 4.10 + 1.02, gain_db=-26.0, pan=-0.2)
    # the recoil: a quick cloth whip
    rs = trim(load(f"{EL}/rustle_1.mp3"))
    bus.add(hp(rs[: int(0.3 * SR)], 500), 4.10 + 1.12, gain_db=-20.0, pan=-0.2)
    # the light finds them (0:07.6-0:08): tyres on stone as the cart rounds the bend
    grav = bp(rng.standard_normal(int(1.6 * SR)).astype(np.float32), 300, 2500) * np.sin(np.linspace(0, math.pi, int(1.6 * SR)))
    bus.add(grav, 7.2, gain_db=-34.0, pan=-0.7)
    cart_motor(bus)
    # 0:12 the first stride (the music's restart is on it)
    bus.add(lp(st, 5000), 12.0, gain_db=-8.0, pan=0.3)
    # the takeoff: a low slowed whoosh through the slow motion
    wh = trim(load(f"{EL}/whoosh_2.mp3"))
    whs = librosa.effects.time_stretch(wh, rate=0.45)
    whs = librosa.effects.pitch_shift(whs, sr=SR, n_steps=-5)
    to = A["s8_takeoff_T"]
    bus.add(lp(whs, 3000), to - 0.05, gain_db=-24.0, pan=0.2)
    # a long held air/whoosh bed under the flight
    air = lp(hp(rng.standard_normal(int(6.2 * SR)).astype(np.float32), 200), 1200) * np.sin(np.linspace(0, math.pi, int(6.2 * SR))) ** 0.7
    bus.add(air, to + 0.1, gain_db=-34.0)
    # 0:20 the splash: the game's big splash, a generated splash, a low impact, a sub drop
    sb = trim(load(f"{GAME}/splash_big.wav"))
    s4 = trim(load(f"{EL}/splash_4.mp3"))
    im = trim(load(f"{EL}/impact_1.mp3"))
    pre = 0.012
    bus.add(sb, 20.0 - pre, gain_db=-4.0, pan=0.0)
    bus.add(s4, 20.0 - pre, gain_db=-6.0, pan=0.1)
    bus.add(lp(im, 900), 20.0 - pre, gain_db=-9.0)
    sub = (np.sin(2 * math.pi * np.cumsum(np.linspace(70, 32, int(0.9 * SR))) / SR) * np.exp(-np.linspace(0, 5, int(0.9 * SR)))).astype(np.float32)
    bus.add(sub, 20.0, gain_db=-8.0)
    # under the water (0:20.15-0:20.7): a dark rumble and bubbles
    rum = lp(rng.standard_normal(int(0.9 * SR)).astype(np.float32), 260) * np.sin(np.linspace(0, math.pi, int(0.9 * SR)))
    bus.add(rum * 3.0, 20.1, gain_db=-12.0)
    for i in range(14):
        f0 = rng.uniform(500, 1300)
        n_ = int(0.05 * SR)
        bub = np.sin(2 * math.pi * np.cumsum(np.linspace(f0, f0 * 1.7, n_)) / SR) * np.exp(-np.linspace(0, 5, n_))
        bus.add(lp(bub.astype(np.float32), 1800), 20.15 + rng.uniform(0, 0.5), gain_db=-28.0, pan=rng.uniform(-0.6, 0.6))
    # surfacing: the water breaks, drips, the friends hauling out
    sp1 = trim(load(f"{EL}/splash_1.mp3"))
    bus.add(sp1[: int(0.7 * SR)], 20.82, gain_db=-12.0, pan=0.3)
    sp2 = trim(load(f"{EL}/splash_2.mp3"))
    bus.add(lp(sp2[: int(0.6 * SR)], 4000), 20.7, gain_db=-20.0, pan=-0.2)
    bus.add(lp(sp2[: int(0.6 * SR)], 3000), 21.35, gain_db=-22.0, pan=0.0)
    # 0:24.6-0:28.5 the officer: the switch, and the quiet after
    tclick = 24.6 + (A["t_click"] - SHOTS["s13_officer"]["tau0"])
    print(f"sfx: the headlight switch at {tclick:.3f} s")
    bus.add(hp(click, 300), tclick, gain_db=-9.0, pan=-0.25)
    # the lights' relay ticking off / the beacon stopping
    tick = (np.sin(2 * math.pi * 2400 * np.arange(int(0.012 * SR)) / SR) * np.exp(-np.linspace(0, 6, int(0.012 * SR)))).astype(np.float32)
    bus.add(tick, tclick + 0.045, gain_db=-30.0, pan=-0.3)
    # 0:28.5 the door: footsteps arriving, the leaf caught, the firm latch at 0:30
    swing = lp(rng.standard_normal(int(0.4 * SR)).astype(np.float32), 700) * np.sin(np.linspace(0, math.pi, int(0.4 * SR))) ** 2
    bus.add(swing, 29.57, gain_db=-24.0, pan=0.0)
    kf = int(np.argmax(np.abs(firm)))
    bus.add(firm, 30.0 - kf / SR, gain_db=-1.0, pan=0.0)
    # 0:30-0:36 inside: drips on the floorboards, the squeak
    for td in [31.1, 31.9, 32.4, 33.6, 34.3]:
        n_ = int(0.03 * SR)
        dr = np.sin(2 * math.pi * np.cumsum(np.linspace(2200, 900, n_)) / SR) * np.exp(-np.linspace(0, 8, n_))
        bus.add(dr.astype(np.float32), td + rng.uniform(-0.05, 0.05), gain_db=-36.0, pan=rng.uniform(-0.4, 0.4))
    sq = squeak()
    t_sq = 30.0 + (27.05 - PL.LATCH)
    print(f"sfx: the squeak at {t_sq:.3f} s")
    bus.add(sq, t_sq, gain_db=-11.0, pan=0.0)
    steps(bus, shots_dir)
    return bus.arr()


def squeak():
    """the wet-slipper squeak: the strongest short tonal event of the
    generated takes, trimmed to ~0.22 s with a soft tail"""
    best = None
    for f in ["squeak_1.mp3", "squeak_3.mp3", "squeak_2.mp3"]:
        y = load(f"{NEW}/{f}")
        hop = 240
        e = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y) - hop, hop)])
        k = int(np.argmax(e))
        a = max(0, k * hop - int(0.03 * SR))
        seg = y[a:a + int(0.24 * SR)].copy()
        S = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
        fr = np.fft.rfftfreq(len(seg), 1 / SR)
        band = S[(fr > 800) & (fr < 4000)].sum() / (S.sum() + 1e-9)
        if best is None or band > best[0]:
            best = (band, seg, f)
    seg = best[1]
    n = len(seg)
    seg[:int(0.006 * SR)] *= np.linspace(0, 1, int(0.006 * SR))
    seg[n - int(0.08 * SR):] *= np.linspace(1, 0, int(0.08 * SR)) ** 2
    print(f"sfx: squeak from {best[2]} (tonal share {best[0]:.2f})")
    seg = hp(seg, 250)
    return (seg / (np.abs(seg).max() + 1e-9) * 0.7).astype(np.float32)


# ------------------------------------------------------------------ mix
def main():
    shots_dir = sys.argv[1]
    out = sys.argv[2]
    mus, att = music_track()
    sfx = build_sfx(shots_dir)
    # stems
    stem_dir = os.path.join(os.path.dirname(out), "stems")
    os.makedirs(stem_dir, exist_ok=True)
    mix = mus * db(-3.0) + sfx
    # gentle bus glue and a look-ahead limiter
    from pedalboard import Pedalboard, Compressor, Limiter, Gain
    board = Pedalboard([Compressor(threshold_db=-16, ratio=2.0, attack_ms=12, release_ms=160)])
    mix = board(mix.astype(np.float32), SR)
    meter = pyln.Meter(SR)
    pre = mix.copy()
    thr = -1.6
    for it in range(8):
        lufs = meter.integrated_loudness(pre.T)
        m1 = pre * db(-14.0 - lufs)
        lim = Pedalboard([Limiter(threshold_db=thr, release_ms=80)])(m1.astype(np.float32), SR)
        lim = lim * db(thr)          # JUCE's limiter makes its threshold 0 dBFS: undo that
        lufs2 = meter.integrated_loudness(lim.T)
        lim = lim * db(-14.0 - lufs2)
        up = librosa.resample(lim, orig_sr=SR, target_sr=SR * 4)
        tp2 = 20 * np.log10(np.abs(up).max() + 1e-9)
        if tp2 <= -1.5:
            break
        thr -= (tp2 + 1.5) + 0.2
    mix = lim
    g = 20 * np.log10(np.abs(mix).max() / (np.abs(m1).max() + 1e-9) + 1e-9) + (-14.0 - lufs)
    lufs2 = meter.integrated_loudness(mix.T)
    sf.write(out, mix.T, SR, subtype="PCM_24")
    sf.write(os.path.join(stem_dir, "music_edit.wav"), (mus * db(-3.0 + g)).T, SR, subtype="PCM_24")
    sf.write(os.path.join(stem_dir, "sfx.wav"), (sfx * db(g)).T, SR, subtype="PCM_24")
    json.dump({"lufs_integrated": round(float(lufs2), 2), "true_peak_dbtp": round(float(tp2), 2), "accent_attack_clean_s": round(float(att), 4),
               "accent_attack_recording_s": round(float(att) + 5.1792, 4), "logo_s": 36.0}, open(out.replace(".wav", ".json"), "w"), indent=1)
    print(f"mix: {lufs2:.2f} LUFS, {tp2:.2f} dBTP -> {out}")


if __name__ == "__main__":
    main()
