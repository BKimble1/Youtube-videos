"""Synthesised effects for the Robot Escapes Jail Short (no samples): DSP helpers and one generator per cue kind.

Every generator is `fn(rng, dur) -> np.ndarray` (mono (n,) or stereo (n, 2)), peak-normalised to 1; the mix sets its
level by loudness (KINDS[kind]['level'] = its loudest momentary (400 ms) loudness in dB relative to the voice, before
ducking). Restrained, clean, cartoon-physical but not silly. Key-matched tones are in D (dorian), like the music bed.

The prison alarm is not a one-shot: `alarm_bed()` is one loop-periodic two-tone klaxon locked to the music's beat, which
the 'alarm' / 'alarm_tail' cues gate (see make_audio.py).

V2 (DIRECTION_V2 section 10) adds: tension, squeeze, stream, reform, snap, escape, comic (variant 0-2), lock, chain,
clunk, ac_on, field, enter (t = the surface crossing, ENTER_PRE s of rise before it), glint. The V1 kinds are unchanged."""
import numpy as np
from scipy.signal import butter, sosfilt, lfilter

SR = 48000


# ---------------------------------------------------------------- helpers
def db(x): return 10 ** (np.asarray(x, float) / 20)
def _sos(kind, f, o): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_sos('lowpass', min(f, 0.45 * SR), o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos('highpass', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(_sos('bandpass', [lo, min(hi, 0.45 * SR)], o), x, axis=0)
def norm(x): return x / (np.max(np.abs(x)) + 1e-12)
def rmsn(x): return x / (np.sqrt(np.mean(x ** 2)) + 1e-12)
def tt(n): return np.arange(n) / SR
def ns(d): return max(1, int(round(d * SR)))
def ss(x, a, b):
    u = np.clip((np.asarray(x, float) - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)
def fades(n, a, r):
    """raised-cosine fade in over a s and out over r s"""
    e = np.ones(n); na = max(1, min(n, ns(a))); nr = max(1, min(n, ns(r)))
    e[:na] *= 0.5 - 0.5 * np.cos(np.pi * np.arange(na) / na)
    e[n - nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / nr)
    return e
def hit_env(n, tau, att=0.0006):
    t = tt(n)
    return (1 - np.exp(-t / att)) * np.exp(-t / tau)
def phase(f):
    return 2 * np.pi * np.cumsum(np.broadcast_to(np.asarray(f, float), np.shape(f))) / SR
def glide(f0, f1, n, curve=1.0):
    """exponential pitch glide from f0 to f1 over n samples"""
    u = np.linspace(0, 1, n) ** curve
    return f0 * (f1 / f0) ** u
def mtof(m): return 440.0 * 2 ** ((np.asarray(m, float) - 69) / 12)
def smooth_noise(rng, n, f):
    """a slow random wander in [-1, 1] (low-passed noise)"""
    x = lp(rng.standard_normal(n + ns(0.5)), f, 2)[ns(0.5):]
    return x / (np.max(np.abs(x)) + 1e-12)
def svf(x, fc, q, out='bp'):
    """time-varying state-variable filter (TPT); 'bp' has unity gain at the centre"""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    qa = np.broadcast_to(np.asarray(q, float), x.shape)
    g = np.tan(np.pi * np.clip(fc, 20, 0.45 * SR) / SR); kq = 1.0 / qa
    a1 = 1 / (1 + g * (g + kq)); a2 = g * a1; a3 = g * a2
    xs, A1, A2, A3 = x.tolist(), a1.tolist(), a2.tolist(), a3.tolist()
    y = [0.0] * len(xs); s1 = s2 = 0.0; band = out == 'bp'
    for i in range(len(xs)):
        v3 = xs[i] - s2
        v1 = A1[i] * s1 + A2[i] * v3
        v2 = s2 + A2[i] * s1 + A3[i] * v3
        s1 = 2 * v1 - s1; s2 = 2 * v2 - s2
        y[i] = v1 if band else v2
    return np.asarray(y) * (kq if band else 1.0)
def reson(x, f, tau):
    """two-pole resonator: rings at f, amplitude decays by 1/e in tau seconds"""
    r = np.exp(-1 / (tau * SR)); w = 2 * np.pi * f / SR
    return lfilter([1 - r], [1, -2 * r * np.cos(w), r * r], x)
def modal(n, modes, rng, att=0.0006, detune=0.004):
    """a struck object: sum of decaying sines [(freq, amp, tau)], random phases, slight random detune"""
    t = tt(n); y = np.zeros(n)
    for f, a, tau in modes:
        f = f * (1 + detune * rng.standard_normal())
        y += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t / tau)
    return y * (1 - np.exp(-t / att))
def impulses(rng, rate, soft=0.0008):
    """a stick-slip pulse train at a time-varying rate (friction grains), each a soft ~1 ms bump"""
    ph = np.cumsum(rate) / SR
    hit = np.diff(np.floor(ph), prepend=0.0) > 0
    p = hit * (0.4 + 0.6 * rng.random(len(rate)))
    k = np.hanning(max(3, ns(soft)))
    return np.convolve(p, k / k.sum(), 'same')
def put(buf, x, t0):
    i = ns(t0) if t0 > 0 else 0
    m = min(len(x), len(buf) - i)
    if m > 0: buf[i:i + m] += x[:m]
def pan_gains(p):
    """balance law (centre = unity in both channels, like the dual-mono voice)"""
    p = float(np.clip(p, -1, 1))
    return (1.0 if p <= 0 else np.cos(p * np.pi / 2)), (1.0 if p >= 0 else np.cos(-p * np.pi / 2))
def to_stereo(x, p=0.0):
    if x.ndim == 2: return x
    gl, gr = pan_gains(p)
    return np.stack([x * gl, x * gr], 1)
def pan_path(x, p0, p1):
    """a mono sound moving from pan p0 to p1 (balance law per sample)"""
    p = np.linspace(p0, p1, len(x))
    gl = np.where(p <= 0, 1.0, np.cos(np.clip(p, 0, 1) * np.pi / 2))
    gr = np.where(p >= 0, 1.0, np.cos(np.clip(-p, 0, 1) * np.pi / 2))
    return np.stack([x * gl, x * gr], 1)
def drop_blip(rng, f0=None, tau=0.02):
    """a bright water-drop blip: a sine whose pitch springs up fast"""
    f0 = f0 or rng.uniform(1100, 1500)
    n = ns(0.11); t = tt(n)
    f = f0 * (1 + 1.1 * (1 - np.exp(-t / 0.012)))
    return np.sin(phase(f)) * hit_env(n, tau, 0.0012)
def bubble(rng, f0, tau=0.03, rise=0.9):
    n = ns(tau * 5); t = tt(n)
    f = f0 * (1 + rise * t / (tau * 5))
    return np.sin(phase(f)) * hit_env(n, tau, 0.002)
def bell(n, f, tau, partials=((1, 1.0, 1.0), (2.0, 0.35, 0.45), (3.01, 0.15, 0.3), (5.4, 0.05, 0.12)), rng=None):
    t = tt(n); y = np.zeros(n)
    for k, a, d in partials:
        y += a * np.sin(2 * np.pi * f * k * t + (rng.uniform(0, 6.28) if rng is not None else 0)) * np.exp(-t / (tau * d))
    return y * (1 - np.exp(-t / 0.0015))


# ---------------------------------------------------------------- the alarm (a loop-periodic bed the cues gate)
def alarm_bed(N, beat, rng):
    """two-tone prison klaxon, one tone per music beat (A5 / E5, a fourth apart, in key), each note with a short whoop
    glide up into it and a small gap after it (pulsing), odd-harmonic horn timbre, band-limited and darkened as if heard
    across the corridor. Periodic over the film (whole cycles), so a gate that spans the loop point has no seam."""
    t = np.arange(N) / SR
    c = (t / beat) % 2.0
    fr = c % 1.0
    hi, lo = 880.0, 659.26
    f = np.where(c < 1.0, hi, lo) * (0.88 + 0.12 * ss(fr, 0.0, 0.09))
    cyc = np.cumsum(f) / SR
    ph = 2 * np.pi * cyc * (round(cyc[-1]) / cyc[-1])  # a whole number of cycles over the film: seamless
    x = np.sin(ph) + 0.33 * np.sin(3 * ph) + 0.18 * np.sin(5 * ph) + 0.1 * np.sin(7 * ph)
    gate = ss(fr, 0.0, 0.025) * (1 - ss(fr, 0.80, 0.95))
    x = x * gate * (0.9 + 0.1 * np.sin(2 * np.pi * t / beat))  # the beacon's slow rotation
    def circ(fn, y): return fn(np.concatenate([y, y, y]))[2 * len(y):]
    x = circ(lambda y: lp(bp(y, 420, 3200, 2), 2300, 2), x)
    return norm(x)


# ---------------------------------------------------------------- generators
def g_door_slide(rng, dur=0.7):
    """the barred door rolling shut: a wheel rumble with bumps, a metallic friction grind through steel resonances,
    accelerating into the slam"""
    n = ns(dur); t = tt(n); u = t / dur
    rate = 12 + 16 * u ** 1.3
    bumps = 0.55 + 0.45 * np.sin(phase(rate)) ** 2
    rumble = rmsn(lp(rng.standard_normal(n), 170, 4)) * bumps
    grains = impulses(rng, 55 + 120 * u)
    grind = sum(a * rmsn(reson(grains, f * (1 + 0.01 * rng.standard_normal()), tau))
                for f, a, tau in [(410, 1.0, 0.035), (930, 0.7, 0.025), (1660, 0.45, 0.02), (2710, 0.25, 0.012)])
    scrape = rmsn(bp(rng.standard_normal(n), 1400, 5200)) * (0.5 + 0.5 * smooth_noise(rng, n, 9))
    x = 0.9 * rumble + 0.35 * grind / 2 + 0.12 * scrape
    return norm(lp(x, 6500) * (0.3 + 0.7 * u ** 1.2) * fades(n, 0.07, 0.02))

def g_door_slam(rng, dur=1.5):
    """a heavy steel cell door: a low body thump, a short crack, an inharmonic clang ring, the latch catching twice,
    a soft rattle of the bars; kept dark and short (premium, not loud)"""
    n = ns(dur); t = tt(n)
    thump = np.sin(phase(glide(78, 40, n, 0.25))) * hit_env(n, 0.12, 0.0008)
    crack = rmsn(lp(hp(rng.standard_normal(n), 700), 7000)) * hit_env(n, 0.006, 0.0002)
    ring = modal(n, [(96, 0.7, 0.5), (183, 0.8, 0.45), (262, 0.6, 0.4), (397, 0.55, 0.34), (571, 0.45, 0.27),
                     (806, 0.33, 0.22), (1093, 0.26, 0.17), (1489, 0.18, 0.12), (2213, 0.12, 0.08), (3127, 0.06, 0.05)], rng)
    latch = np.zeros(n)
    for at, a in [(0.085, 1.0), (0.155, 0.55)]:
        m = ns(0.08); put(latch, a * modal(m, [(2420, 1.0, 0.025), (3710, 0.6, 0.015), (5230, 0.3, 0.008)], rng, 0.0002), at)
    rattle = rmsn(bp(rng.standard_normal(n), 1500, 4200)) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * t) ** 2) * hit_env(n, 0.18, 0.02)
    x = 1.0 * thump + 0.45 * crack + 0.55 * norm(ring) + 0.22 * latch + 0.05 * rattle
    return norm(lp(x, 7000) * fades(n, 0.0003, 0.35))

def g_cup_drop(rng, dur=0.6):
    """the guard's paper cup slipping out of his fingers: a papery tick, then a small airy whoosh as it falls away"""
    n = ns(dur); t = tt(n)
    tick = rmsn(bp(rng.standard_normal(n), 1500, 6000)) * hit_env(n, 0.004, 0.0003) * 0.6 \
        + modal(n, [(930, 0.6, 0.012), (1720, 0.4, 0.008)], rng, 0.0003)
    m = n - ns(0.04); u = np.arange(m) / m
    wh = np.zeros(n)
    wh[ns(0.04):ns(0.04) + m] = rmsn(svf(rng.standard_normal(m), 1900 * (650 / 1900) ** u, 0.9)) * np.sin(np.pi * u) ** 1.5
    return norm(lp(0.9 * norm(tick) + 0.28 * wh, 9000))

def g_splash(rng, dur=0.8):
    """the coffee hitting the floor: a wet splat (low plop + a fast band-noise burst), a little spray, droplets"""
    n = ns(dur); t = tt(n)
    burst = rmsn(bp(rng.standard_normal(n), 250, 3800)) * hit_env(n, 0.045, 0.001)
    plop = np.sin(phase(glide(190, 70, n, 0.12))) * hit_env(n, 0.05, 0.001)
    spray = rmsn(hp(rng.standard_normal(n), 2500)) * hit_env(n, 0.11, 0.004)
    drops = np.zeros(n)
    for k in range(12):
        at = 0.03 + rng.exponential(0.12)
        if at < dur - 0.12:
            put(drops, drop_blip(rng, rng.uniform(900, 2600), 0.015) * (0.5 * np.exp(-at / 0.25) + 0.08), at)
    x = 0.55 * burst + 0.9 * plop + 0.12 * spray + 0.6 * drops
    return norm(lp(x, 9000) * fades(n, 0.0005, 0.1))

def g_bar_tap(rng, dur=0.6):
    """the robot's metal hand pressing a steel bar: a soft contact knock and a small clink (steel-bar partials)"""
    n = ns(dur); f = rng.uniform(1180, 1320)
    clink = modal(n, [(f, 1.0, 0.26), (f * 2.756, 0.45, 0.13), (f * 5.404, 0.18, 0.06), (f * 8.933, 0.08, 0.035)], rng, 0.0015)
    knock = np.sin(2 * np.pi * 230 * tt(n)) * hit_env(n, 0.018, 0.0008)
    tk = rmsn(bp(rng.standard_normal(n), 2000, 6000)) * hit_env(n, 0.002, 0.0002)
    return norm(lp(0.8 * norm(clink) + 0.35 * knock + 0.12 * tk, 9500) * fades(n, 0.0003, 0.15))

def g_mech_click(rng, dur=0.15, variant=None):
    """small servo / mechanical clicks: 1-3 tiny resonant ticks with a little body (four patterns)"""
    pats = [[(0, 1.0), (0.028, 0.6)], [(0, 0.8), (0.018, 0.5), (0.046, 0.9)], [(0, 1.0)], [(0, 0.55), (0.034, 1.0)]]
    v = int(rng.integers(0, 4)) if variant is None else int(variant) % 4
    n = ns(dur); x = np.zeros(n)
    for at, a in pats[v]:
        m = ns(0.03); f = rng.uniform(2800, 5000)
        exc = np.zeros(m); exc[:ns(0.0006)] = rng.standard_normal(ns(0.0006))
        c = norm(reson(exc, f, rng.uniform(0.003, 0.006))) + 0.4 * np.sin(2 * np.pi * rng.uniform(380, 620) * tt(m)) * hit_env(m, 0.006, 0.0003)
        put(x, a * c, at)
    return norm(hp(x, 250) * fades(n, 0.0002, 0.03))

def g_servo(rng, dur=0.3):
    """a short robot servo whirr (head / eye turn): a geared motor whine that rises and settles, a tiny stop tick"""
    n = ns(dur); t = tt(n); u = t / dur
    f0 = rng.uniform(950, 1150)
    f = f0 * (0.82 + 0.3 * np.sin(np.pi * u) ** 0.7)
    ph = phase(f)
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph + 0.4) + 0.15 * np.sin(3 * ph + 1.1)
    gear = 1 - 0.35 * (0.5 + 0.5 * np.sin(ph / 9))
    hiss = rmsn(bp(rng.standard_normal(n), 2000, 6000)) * 0.08
    stop = np.zeros(n); put(stop, 0.35 * g_mech_click(rng, 0.04, 2)[:ns(0.04)], dur - 0.045)
    x = (0.5 * tone * gear + hiss) * fades(n, 0.035, 0.06) + stop
    return norm(bp(x, 300, 6500))

def g_melt(rng, dur=1.0):
    """soft metallic liquefaction: a warm sizzle (fine crackle), a descending wobbly 'goop' tone, a low warm body"""
    n = ns(dur); t = tt(n); u = t / dur
    crackle = impulses(rng, np.full(n, 140.0), 0.0004)
    sizzle = rmsn(bp(rng.standard_normal(n), 2500, 9000)) * (0.55 + 0.45 * norm(bp(crackle, 2000, 9000)))
    f = 520 * (140 / 520) ** (u ** 0.8)
    vib = 1 + (0.035 + 0.05 * u) * np.sin(2 * np.pi * (6 + 2.5 * u) * t)
    ph = phase(f * vib)
    goop = (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)) * (0.75 + 0.25 * np.sin(2 * np.pi * 4.7 * t))
    body = rmsn(lp(rng.standard_normal(n), 350, 2))
    eg = (0.3 + 0.7 * ss(u, 0, 0.2)) * (1 - 0.35 * u)
    es = np.sin(np.pi * np.clip(u * 1.05, 0, 1)) ** 0.6
    x = 0.07 * sizzle * es + 0.8 * norm(lp(goop, 1600)) * eg + 0.12 * body * eg
    return norm(lp(x, 10000) * fades(n, 0.05, min(0.35, dur * 0.35)))

def g_flow(rng, dur=1.5):
    """satisfying liquid flow / slither: a wandering resonant liquid band, soft bubbles, a faint bright trickle"""
    n = ns(dur); t = tt(n); u = t / dur
    fc = 820 * 2 ** (0.65 * smooth_noise(rng, n, 3.5))
    sl = rmsn(svf(rng.standard_normal(n), fc, 3.2))
    bub = np.zeros(n)
    for k in range(int(dur * 9)):
        put(bub, bubble(rng, rng.uniform(230, 560), rng.uniform(0.018, 0.035), 1.2) * rng.uniform(0.3, 1.0), rng.uniform(0, dur - 0.15))
    trick = rmsn(bp(rng.standard_normal(n), 2600, 6500)) * (0.5 + 0.5 * smooth_noise(rng, n, 12))
    x = 0.55 * sl + 0.5 * bub + 0.05 * trick
    return norm(lp(x, 7000) * fades(n, min(0.18, dur * 0.25), min(0.35, dur * 0.35)))

def g_drip(rng, dur=0.12):
    """a small bright droplet blip"""
    n = ns(dur); x = np.zeros(n)
    put(x, drop_blip(rng, rng.uniform(1150, 1450), 0.02), 0.0)
    put(x, 0.12 * rmsn(hp(rng.standard_normal(ns(0.002)), 3000)), 0.0)
    return norm(x * fades(n, 0.0003, 0.02))

def g_glug(rng, dur=0.6):
    """liquid metal poured into the mould: three or four low glugs rising in pitch as it fills, a thin trickle"""
    n = ns(dur); x = np.zeros(n)
    k = 4 if dur >= 0.5 else 3
    for i in range(k):
        at = i * (dur - 0.15) / k + rng.uniform(-0.01, 0.01)
        m = ns(0.12); tm = tt(m)
        f = 170 * (1 + 0.13 * i) * (1 + 1.1 * (1 - np.exp(-tm / 0.03)))
        g = np.sin(phase(f)) * hit_env(m, 0.045, 0.003) + 0.3 * rmsn(lp(rng.standard_normal(m), 600)) * hit_env(m, 0.02, 0.002)
        put(x, g * (0.8 + 0.2 * rng.random()), max(0, at))
    trick = rmsn(bp(rng.standard_normal(n), 2200, 6000)) * 0.05
    return norm(lp(x + trick * fades(n, 0.05, 0.1), 3200) * fades(n, 0.002, 0.08))

def g_pipette(rng, dur=0.35):
    """a soft suction squelch (the gloved pipette drawing the metal up), a little suction pop at the end"""
    n = ns(dur); t = tt(n); u = t / dur
    sq = rmsn(svf(rng.standard_normal(n), 1700 * (420 / 1700) ** np.clip(u / 0.65, 0, 1), 6.0)) * ss(u, 0, 0.1) * (1 - ss(u, 0.55, 0.75))
    pop = np.zeros(n); m = ns(0.08)
    put(pop, np.sin(phase(glide(330, 160, m, 0.4))) * hit_env(m, 0.025, 0.001), dur * 0.62)
    return norm(lp(0.5 * sq + 0.8 * pop, 4200) * fades(n, 0.01, 0.06))

def g_cool(rng, dur=1.2):
    """cooling: a gentle airy hush and a few crystalline pings (high, in key), thinning out"""
    n = ns(dur); t = tt(n); u = t / dur
    air = rmsn(bp(rng.standard_normal(n), 4000, 12000)) * np.sin(np.pi * u) ** 1.2
    fs_ = [1174.66, 1318.51, 1760.0, 2349.32, 2637.02, 3520.0, 4698.64]
    pings = np.zeros(n)
    for k in range(int(dur * 13)):
        at = dur * 0.85 * rng.random() ** 1.6
        f = fs_[int(rng.integers(0, len(fs_)))]; m = ns(0.35)
        tm = tt(m); tau = rng.uniform(0.07, 0.22)
        p = (np.sin(2 * np.pi * f * tm) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tm)) * hit_env(m, tau, 0.001)
        put(pings, p * rng.uniform(0.3, 1.0) * (1 - 0.6 * at / dur), at)
    return norm(hp(0.05 * air + 0.5 * norm(pings), 600) * fades(n, 0.02, 0.25))

def g_mag_hum(rng, dur=2.0):
    """a magnetic field: a smooth low drone on D with a slow beating (detuned pairs), a faint shimmer on top"""
    n = ns(dur); t = tt(n)
    x = np.zeros(n)
    for f, a in [(73.42, 1.0), (74.31, 0.75), (146.83, 0.6), (147.71, 0.45), (220.0, 0.2), (293.66, 0.12), (440.0, 0.04)]:
        x += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28))
    sh = rmsn(bp(rng.standard_normal(n), 1800, 3200)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * t)) * 0.03
    return norm(lp(x / 3 + sh, 1500) * fades(n, min(0.35, dur * 0.3), min(0.5, dur * 0.35)))

def g_heat_coil(rng, dur=1.5):
    """the induction coil warming up: a soft rising electrical whine over a 100 Hz hum with a little buzz"""
    n = ns(dur); t = tt(n); u = t / dur
    f = 1700 * (1 + 0.45 * u ** 1.3) * (1 + 0.002 * smooth_noise(rng, n, 6))
    ph = phase(f)
    whine = (np.sin(ph) + 0.15 * np.sin(2 * ph)) * (0.8 + 0.2 * np.sin(2 * np.pi * 100 * t))
    hum = sum(np.sin(2 * np.pi * 100 * k * t) / k ** 1.6 for k in range(1, 7))
    x = (0.32 * whine + 0.6 * hum / 2) * (0.15 + 0.85 * u ** 1.5)
    return norm(bp(x, 80, 7000) * fades(n, 0.08, min(0.3, dur * 0.3)))

def g_whoosh(rng, dur=0.45):
    """a camera whip: band noise that rises and falls, moving left to right (stereo)"""
    n = ns(dur); u = np.arange(n) / n
    fc = 280 * (2600 / 280) ** (np.sin(np.pi * u) ** 1.3)
    y = rmsn(svf(rng.standard_normal(n), fc, 1.1)) * np.sin(np.pi * u) ** 1.7
    air = rmsn(lp(rng.standard_normal(n), 500)) * np.sin(np.pi * u) ** 2.2 * 0.4
    return norm(pan_path(lp(y + air, 9000), -0.55, 0.55))

def g_swish(rng, dur=0.25):
    """a small graphic move: a short, higher, lighter whoosh"""
    n = ns(dur); u = np.arange(n) / n
    fc = 1000 * (5200 / 1000) ** (np.sin(np.pi * u) ** 1.2)
    y = rmsn(svf(rng.standard_normal(n), fc, 1.3)) * np.sin(np.pi * u) ** 1.8
    return norm(pan_path(lp(y, 11000), -0.3, 0.3))

def g_pop(rng, dur=0.08):
    """a tiny label pop-in: a short soft pitch-dropping blip"""
    n = ns(dur); t = tt(n)
    f = rng.uniform(850, 1000) * (0.5 + 0.5 * np.exp(-t / 0.012))
    x = np.sin(phase(f)) * hit_env(n, 0.013, 0.0005) + 0.15 * rmsn(hp(rng.standard_normal(n), 4000)) * hit_env(n, 0.0007, 0.0001)
    return norm(x * fades(n, 0.0002, 0.02))

def g_guard_gasp(rng, dur=0.42):
    """the guard's tiny wordless 'hm?!': a voiced source (rising pitch) through a nasal murmur that opens into an 'uh'
    vowel (formants), a little breath; small and soft"""
    n = ns(dur); t = tt(n)
    f0 = np.where(t < 0.15, 118 + 40 * t, 150 * (245 / 150) ** ss(t, 0.15, 0.36))
    f0 = f0 * (1 + 0.01 * np.sin(2 * np.pi * 5.5 * t))
    ph = phase(f0)
    src = np.zeros(n)
    for k in range(1, 40):
        src += np.sin(k * ph) / k * (k * f0 < 4500)
    m = ss(t, 0.13, 0.2)
    F1 = 250 + 450 * m; F2 = 1050 + 170 * m; F3 = 2350 + 250 * m
    vow = svf(src, F1, F1 / 90) + 0.55 * svf(src, F2, F2 / 110) + 0.25 * svf(src, F3, F3 / 160)
    nas = lp(src, 380, 2) * 1.2
    breath = rmsn(bp(rng.standard_normal(n), 1000, 4000)) * 0.03 * m
    amp = (0.45 + 0.55 * m) * fades(n, 0.025, 0.09)
    x = (nas * (1 - m) + vow * m) * amp + breath * fades(n, 0.05, 0.1)
    return norm(hp(x, 90))

def g_guard_gulp(rng, dur=0.35):
    """a comedic gulp: a small wet throat click and two descending 'gloop's"""
    n = ns(dur); x = np.zeros(n)
    put(x, 0.35 * rmsn(bp(rng.standard_normal(ns(0.004)), 1500, 3500)) * np.hanning(ns(0.004)), 0.0)
    m = ns(0.12); put(x, np.sin(phase(glide(470, 170, m, 0.6))) * hit_env(m, 0.045, 0.002), 0.006)
    m = ns(0.18); put(x, 0.8 * np.sin(phase(glide(290, 105, m, 0.6))) * hit_env(m, 0.065, 0.003), 0.125)
    return norm(lp(x, 2600) * fades(n, 0.0005, 0.06))

STING_PRE = 0.22
def g_sting(rng, dur=1.6):
    """a short musical accent for the eyes opening: a soft reversed swell into a bell-pluck D minor chord with a sub
    'bwom' (key-matched to the bed). The HIT is at the cue time; the swell starts STING_PRE s earlier (stereo)"""
    pre = STING_PRE; n = ns(pre + dur); i0 = ns(pre)
    L = np.zeros(n); R = np.zeros(n)
    m = i0; u = np.arange(m) / m
    sw = rmsn(bp(rng.standard_normal(m), 1200, 7000)) * u ** 3 * 0.12
    L[:m] += sw; R[:m] += sw
    for k, (mi, p) in enumerate([(62, -0.3), (69, 0.25), (74, -0.1), (77, 0.35), (81, -0.35)]):
        mm = n - i0 - ns(0.012 * k)
        b = bell(mm, float(mtof(mi)), 0.9, rng=rng) * (0.9 - 0.08 * k)
        gl, gr = pan_gains(p)
        L[n - mm:] += b * gl; R[n - mm:] += b * gr
    mm = n - i0; tm = tt(mm)
    sub = np.sin(phase(73.42 * (1 + 0.15 * np.exp(-tm / 0.04)))) * hit_env(mm, 0.32, 0.003) * 1.4
    L[i0:] += sub; R[i0:] += sub
    x = np.stack([L, R], 1) * fades(n, 0.01, 0.4)[:, None]
    return norm(lp(x, 9000))

def g_reveal(rng, dur=1.8):
    """a satisfying soft chime for the re-formed figure: a quick glockenspiel arpeggio up D-F-A-D and a warm low bloom"""
    n = ns(dur); L = np.zeros(n); R = np.zeros(n)
    for k, (mi, p) in enumerate([(74, -0.35), (77, -0.1), (81, 0.15), (86, 0.38)]):
        at = 0.055 * k; mm = n - ns(at)
        b = bell(mm, float(mtof(mi)), 0.8, ((1, 1.0, 1.0), (2.0, 0.25, 0.4), (3.01, 0.12, 0.25), (5.43, 0.06, 0.12)), rng) * (0.75 + 0.08 * k)
        gl, gr = pan_gains(p)
        L[n - mm:] += b * gl; R[n - mm:] += b * gr
    tb = tt(n)
    bloom = np.sin(2 * np.pi * 293.66 * tb) * (1 - np.exp(-tb / 0.05)) * np.exp(-tb / 0.6) * 0.3
    sh = rmsn(hp(rng.standard_normal(n), 7000)) * hit_env(n, 0.5, 0.15) * 0.015
    L += bloom + sh; R += bloom + sh
    return norm(lp(np.stack([L, R], 1) * fades(n, 0.001, 0.4)[:, None], 11000))


# ---------------------------------------------------------------- V2 generators (DIRECTION_V2 section 10)
def g_tension(rng, dur=0.8):
    """metallic stress as the robot deforms: a slow stick-slip creak (friction pulses whose rate climbs with the strain,
    in two or three gestures) ringing a few steel modes, a low bending groan under it, two tiny stress ticks; no impact"""
    n = ns(dur); t = tt(n); u = t / dur
    gest = np.clip(0.5 + 0.5 * smooth_noise(rng, n, 4.5), 0, 1) ** 1.5  # the creak gestures ('eeerk')
    rate = (24 + 30 * u + 70 * gest) * (1 + 0.08 * smooth_noise(rng, n, 25))  # the stick-slip rate = the creak's pitch
    grains = impulses(rng, rate, 0.0004)
    creak = sum(a * rmsn(reson(grains, f * (1 + 0.006 * rng.standard_normal()), tau))  # short rings: each slip is heard
                for f, a, tau in [(612, 1.0, 0.009), (1347, 0.8, 0.007), (2210, 0.55, 0.005), (3480, 0.3, 0.004)])
    ph = phase(92 * (1 + 0.22 * u) * (1 + 0.03 * smooth_noise(rng, n, 3)))
    groan = lp(np.tanh(1.8 * (np.sin(ph) + 0.4 * np.sin(2 * ph))), 900) * (0.6 + 0.4 * gest)
    ticks = np.zeros(n)
    for at in (0.3 + 0.1 * rng.random(), 0.62 + 0.1 * rng.random()):
        m = ns(0.05)
        put(ticks, modal(m, [(rng.uniform(3900, 5200), 1.0, 0.008), (rng.uniform(6500, 7600), 0.5, 0.005)], rng, 0.0002), at * dur)
    x = 0.7 * norm(creak) * (0.3 + 0.7 * gest) + 0.2 * norm(groan) + 0.15 * ticks
    return norm(bp(x, 70, 9000) * (0.35 + 0.65 * ss(u, 0, 0.5)) * fades(n, 0.04, min(0.15, dur * 0.25)))

def g_squeeze(rng, dur=0.6):
    """wet metallic squelch of liquid forced through a narrow gap: irregular pressure pulses through a narrow resonant
    band that tightens and rises as the gap constricts, a faint steel ring riding on it (the liquid is metal), then it
    lets go (at ~72 %) with a short downward wet 'schlup'"""
    n = ns(dur); t = tt(n); u = t / dur; k = 0.72
    fc = np.where(u < k, 480 * (2000 / 480) ** (np.clip(u / k, 0, 1) ** 1.4), 2000 * (560 / 2000) ** ss(u, k, 1.0))
    pr = (30 + 46 * np.clip(u / k, 0, 1)) * (1 + 0.3 * smooth_noise(rng, n, 9))
    puls = impulses(rng, pr, 0.0025)
    src = rmsn(puls) + 0.4 * rng.standard_normal(n)
    sq = rmsn(svf(src, fc, np.where(u < k, 5 + 6 * u / k, 4.0)))
    sheen = sum(a * rmsn(reson(puls, f, 0.018)) for f, a in [(2870, 1.0), (4410, 0.6)])
    amp = (0.3 + 0.7 * ss(u, 0, k * 0.9)) * (1 - 0.8 * ss(u, k, k + 0.1))
    rel = np.zeros(n); m = ns(0.16); tm = tt(m)
    put(rel, np.sin(phase(glide(460, 150, m, 0.5))) * hit_env(m, 0.05, 0.002)
        + 0.35 * rmsn(bp(rng.standard_normal(m), 500, 2600)) * hit_env(m, 0.02, 0.001), k * dur)
    x = (0.6 * sq + 0.07 * sheen) * amp + 0.75 * rel
    return norm(lp(x, 6500, 4) * fades(n, 0.03, 0.06))

def g_stream(rng, dur=1.5):
    """soft fluid-metal movement, sustained: a heavy, smooth, viscous pour (not bubbly like 'flow'): two slowly
    wandering resonant liquid bands, a slow slosh swell, a faint fine silvery shimmer on top"""
    n = ns(dur); t = tt(n)
    f1 = 360 * 2 ** (0.5 * smooth_noise(rng, n, 1.6)); f2 = 820 * 2 ** (0.5 * smooth_noise(rng, n, 4.0))
    b1 = rmsn(svf(rng.standard_normal(n), f1, 2.4)); b2 = rmsn(svf(rng.standard_normal(n), f2, 9.0))  # b2: a slow liquid gurgle
    slosh = 0.62 + 0.38 * smooth_noise(rng, n, 1.3)
    shim = rmsn(bp(impulses(rng, np.full(n, 70.0), 0.0003), 5000, 11000)) * (0.5 + 0.5 * smooth_noise(rng, n, 6))
    x = lp((0.6 * b1 + 0.32 * b2) * slosh, 4500, 4) + 0.03 * shim
    return norm(x * fades(n, min(0.3, dur * 0.3), min(0.4, dur * 0.35)))

def g_reform(rng, dur=0.55):
    """metal flowing back into shape: a rising shimmer (bright metal partials gliding up an octave into D-A-D-A-D with
    a quickening tremolo), a rising airy band under it; it ends TIGHT at t + dur (8 ms), where a 'snap' lands (stereo)"""
    n = ns(dur); t = tt(n); u = t / dur
    L = np.zeros(n); R = np.zeros(n)
    for i, (f1, p) in enumerate([(587.33, -0.4), (880.0, 0.3), (1174.66, -0.15), (1760.0, 0.4), (2349.32, -0.3)]):
        ph = phase(glide(f1 * 0.5, f1, n, 0.7) * (1 + 0.004 * (2 * (i % 2) - 1)))
        trem = 0.7 + 0.3 * np.sin(phase(6 + 22 * u ** 1.5) + i)
        y = (np.sin(ph) + 0.25 * np.sin(2.76 * ph)) * trem / (1 + 0.4 * i)
        gl, gr = pan_gains(p); L += y * gl; R += y * gr
    env = u ** 2.2
    air = rmsn(svf(rng.standard_normal(n), 1500 * (7000 / 1500) ** u, 2.0)) * u ** 2.5 * 0.35
    x = np.stack([L * env + air, R * env + air], 1)
    return norm(hp(x, 300) * fades(n, 0.02, 0.008)[:, None])

def g_snap(rng, dur=0.22):
    """the head snapping into shape: a crisp bright click (a ~1 ms noise spike), a short high steel 'tik', a tiny tight
    body knock that drops in pitch; dry and clean"""
    n = ns(dur)
    click = rmsn(hp(rng.standard_normal(n), 3000)) * hit_env(n, 0.0012, 0.0001)
    tik = modal(n, [(3150, 1.0, 0.022), (4870, 0.6, 0.014), (7210, 0.35, 0.008), (1880, 0.4, 0.03)], rng, 0.0002)
    body = np.sin(phase(glide(240, 120, n, 0.2))) * hit_env(n, 0.018, 0.0004)
    return norm(lp(0.5 * click + 0.6 * norm(tik) + 0.55 * body, 14000) * fades(n, 0.0001, 0.06))

def g_escape(rng, dur=0.5):
    """the satisfying release as it pops free of the bars: a round suction 'thwup' (a low pop whose pitch springs up),
    a soft air puff, two small wet bloops after; comedic but restrained"""
    n = ns(dur); t = tt(n)
    pop = np.sin(phase(150 + 380 * (1 - np.exp(-t / 0.018)))) * hit_env(n, 0.045, 0.0015)
    puff = rmsn(bp(rng.standard_normal(n), 500, 2500)) * hit_env(n, 0.03, 0.002)
    bl = np.zeros(n); put(bl, bubble(rng, 420, 0.03, 1.6), 0.09); put(bl, 0.5 * bubble(rng, 640, 0.02, 1.4), 0.16)
    return norm(lp(1.0 * pop + 0.18 * puff + 0.45 * bl, 6000) * fades(n, 0.0005, 0.12))

def g_comic(rng, dur=0.35, variant=None):
    """short deadpan punctuation (cue variant): 0 a hollow little 'bonk' (a wood-block knock that drops a tone), 1 a tiny
    high 'plink' (a glassy D7 pluck lifting a hair), 2 a dry two-note 'boop-boop' falling a fourth (A5 -> E5)"""
    v = int(rng.integers(0, 3)) if variant is None else int(variant) % 3
    n = ns(dur); t = tt(n)
    if v == 0:
        f = 560 * (0.62 + 0.38 * np.exp(-t / 0.03))
        x = np.sin(phase(f)) * hit_env(n, 0.06, 0.0006) + 0.5 * np.sin(phase(f * 2.31)) * hit_env(n, 0.02, 0.0004)
        x = lp(x + 0.3 * rmsn(bp(rng.standard_normal(n), 800, 3000)) * hit_env(n, 0.003, 0.0002), 5000)
    elif v == 1:
        f = 2349.32 * (1 + 0.03 * (1 - np.exp(-t / 0.02)))
        x = (np.sin(phase(f)) + 0.2 * np.sin(phase(f * 2.0)) + 0.08 * np.sin(phase(f * 3.9))) * hit_env(n, 0.07, 0.0008)
    else:
        x = np.zeros(n)
        for at, f0 in ((0.0, 880.0), (0.13, 659.26)):
            m = ns(0.12); tm = tt(m); ph = phase(f0 * (1 - 0.02 * tm / 0.12))
            put(x, (np.sin(ph) + 0.18 * np.sin(3 * ph)) * hit_env(m, 0.05, 0.004) * np.clip((0.12 - tm) / 0.02, 0, 1), at)
        x = lp(x, 4000)
    return norm(x * fades(n, 0.0002, 0.05))

def g_lock(rng, dur=0.25):
    """a padlock / latch: a short spring-loaded slide ('ch'), then the shackle's solid clack (bright steel modes over a
    small hard body knock), a tiny second tick as it seats"""
    n = ns(dur); x = np.zeros(n)
    m = ns(0.03); put(x, 0.25 * rmsn(bp(rng.standard_normal(m), 2500, 7000)) * np.sin(np.pi * np.arange(m) / m) ** 2, 0.0)
    m = ns(0.18); tm = tt(m)
    clack = modal(m, [(1730, 1.0, 0.03), (2890, 0.8, 0.022), (4460, 0.55, 0.014), (6320, 0.3, 0.008)], rng, 0.0002)
    knock = np.sin(2 * np.pi * 310 * tm) * hit_env(m, 0.012, 0.0003)
    crack = rmsn(hp(rng.standard_normal(m), 2000)) * hit_env(m, 0.0015, 0.0001)
    put(x, 0.7 * norm(clack) + 0.5 * knock + 0.4 * crack, 0.032)
    put(x, 0.25 * modal(ns(0.05), [(3600, 1.0, 0.006), (5400, 0.5, 0.004)], rng, 0.0002), 0.085)
    return norm(lp(x, 12000) * fades(n, 0.0002, 0.05))

def g_chain(rng, dur=0.6):
    """a short chain rattle: a quick shake of small steel links (each a bright inharmonic clink), clustered at the start
    and thinning out"""
    n = ns(dur); x = np.zeros(n)
    shakes = [0.0, 0.17 + 0.03 * rng.random(), 0.36 + 0.04 * rng.random()]  # three small shakes, each a cluster of clinks
    times = [dur * (s_ + 0.12 * rng.random() ** 1.5) for s_ in shakes for _ in range(6)]
    for at in sorted(times):
        m = ns(0.08); f = rng.uniform(2300, 4200)
        c = modal(m, [(f, 1.0, rng.uniform(0.012, 0.03)), (f * 2.41, 0.5, 0.01), (f * 3.83, 0.25, 0.006)], rng, 0.0002)
        c = c + 0.3 * rmsn(hp(rng.standard_normal(m), 3000)) * hit_env(m, 0.001, 0.0001)
        put(x, c * rng.uniform(0.35, 1.0) * (1 - 0.6 * at / dur), at)
    return norm(bp(x, 900, 13000) * fades(n, 0.0003, 0.08))

def g_clunk(rng, dur=0.4):
    """a small solid metal figure knocking against thin bars (lab scale, ~1 cm): a hard little 'tok' (a high, short body:
    a small object), the thin rods' bright ring, a tiny rebound tock; nothing big or boomy"""
    n = ns(dur); x = np.zeros(n)
    for a, at in ((1.0, 0.0), (0.35, 0.055 + 0.01 * rng.random())):
        m = ns(0.3); tm = tt(m)
        tok = np.sin(2 * np.pi * rng.uniform(820, 980) * tm) * hit_env(m, 0.01, 0.0003) \
            + 0.6 * np.sin(2 * np.pi * rng.uniform(1700, 1900) * tm) * hit_env(m, 0.006, 0.0002)
        rods = modal(m, [(3020, 1.0, 0.07), (3110, 0.7, 0.06), (5170, 0.4, 0.035), (8330, 0.15, 0.015)], rng, 0.0003)
        crack = rmsn(bp(rng.standard_normal(m), 2000, 8000)) * hit_env(m, 0.0015, 0.0001)
        put(x, a * (0.9 * tok + 0.35 * norm(rods) + 0.25 * crack), at)
    return norm(hp(x, 300) * fades(n, 0.0002, 0.1))

def g_ac_on(rng, dur=1.2):
    """the induction coil energising: a soft relay tick, an electrical hum that swells in (100 Hz buzz, odd harmonics),
    a charging tone that rises and settles on A (in key), a faint fast high shimmer fading in (the ~50 kHz field,
    suggested up in the audible air band). It powers UP; it does not whine (unlike heat_coil)"""
    n = ns(dur); t = tt(n); u = t / dur
    relay = np.zeros(n); put(relay, 0.4 * modal(ns(0.03), [(2600, 1.0, 0.004), (4100, 0.6, 0.003)], rng, 0.0002), 0.0)
    hum = lp(sum(np.sin(2 * np.pi * 100 * k * t + rng.uniform(0, 6.28)) / k for k in (1, 3, 5, 7, 9)), 1200) * ss(u, 0.0, 0.5)
    ph = phase(110 * 2 ** ss(u, 0.05, 0.75))  # A2 -> A3, settles
    charge = (np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.12 * np.sin(4 * ph)) * ss(u, 0.03, 0.45) \
        * (0.85 + 0.15 * np.sin(2 * np.pi * 100 * t))
    shim = rmsn(bp(rng.standard_normal(n), 8500, 14000)) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t) ** 2) * ss(u, 0.25, 0.9)
    x = 0.35 * hum / 2 + 0.5 * charge / 1.5 + 0.06 * shim + relay
    return norm(hp(x, 60) * fades(n, 0.003, min(0.25, dur * 0.25)))

def g_field(rng, dur=1.6):
    """a magnetic field swelling on: a smooth 'vwoom' (a soft D3/A3/D4 chord whose level swells, a slow wobble) and a
    phaser-like comb sweeping through a soft airy band (the field lines), different in each ear (wide). No buzz and no
    rising pitch (unlike ac_on), a swell rather than a steady beating drone (unlike mag_hum) (stereo)"""
    n = ns(dur); t = tt(n); u = t / dur
    sw = ss(u, 0, 0.45) * (1 - 0.35 * ss(u, 0.6, 1.0))
    low = (np.sin(2 * np.pi * 146.83 * t) + 0.6 * np.sin(2 * np.pi * 220.0 * t + 1.0) + 0.25 * np.sin(2 * np.pi * 293.66 * t + 2.0)) \
        * (1 + 0.15 * np.sin(2 * np.pi * 1.3 * t))
    out = []
    for off in (0.0, 1.4):
        band = bp(rng.standard_normal(n), 400, 3000)
        idx = np.clip(np.arange(n) - (0.0012 + 0.0009 * np.sin(2 * np.pi * 0.7 * t + off)) * SR, 0, n - 1)
        i0 = np.floor(idx).astype(int); fr = idx - i0; i1 = np.minimum(i0 + 1, n - 1)
        out.append(0.5 * low / 1.5 + 0.15 * rmsn(band + band[i0] * (1 - fr) + band[i1] * fr))
    x = np.stack(out, 1) * sw[:, None]
    return norm(lp(x, 4000) * fades(n, 0.02, min(0.4, dur * 0.3))[:, None])

ENTER_PRE = 0.4
def g_enter(rng, dur=0.5):
    """'into the metal': the camera crosses the chrome surface (the cue time is the crossing). A tonal rise (noise through
    narrow resonances on D/A that glide up an octave and close in from the sides to the centre), then at the crossing a
    soft, muffled metallic bloom (a low bell on D heard from inside the metal: dark, slightly chorused) and a little
    'whum'. ENTER_PRE s of rise come before t, dur s of bloom after (stereo)"""
    pre = ENTER_PRE; n = ns(pre + dur); i0 = ns(pre); t = tt(n)
    ur = np.clip(t / pre, 0, 1)
    rise = ur ** 2.4 * np.where(t < pre, 1.0, np.exp(-(t - pre) / 0.05))
    L = np.zeros(n); R = np.zeros(n)
    for f0, a, p in ((293.66, 1.0, -0.6), (440.0, 0.7, 0.6), (587.33, 0.5, -0.35), (880.0, 0.3, 0.35)):
        y = rmsn(svf(rng.standard_normal(n), f0 * 2 ** (ur ** 1.5), 8 + 10 * ur)) * a * rise
        pp = p * (1 - ur)
        L += y * np.where(pp <= 0, 1.0, np.cos(np.clip(pp, 0, 1) * np.pi / 2))
        R += y * np.where(pp >= 0, 1.0, np.cos(np.clip(-pp, 0, 1) * np.pi / 2))
    mm = n - i0; tm = tt(mm)
    parts = ((1, 1.0, 1.0), (2.0, 0.3, 0.5), (2.76, 0.2, 0.35), (5.4, 0.06, 0.15))
    whum = np.sin(phase(146.83 * (1 + 0.3 * np.exp(-tm / 0.03)))) * hit_env(mm, 0.12, 0.004)
    L[i0:] += 0.9 * lp(bell(mm, 587.33, 0.5, parts, rng), 2200) + 0.7 * whum
    R[i0:] += 0.9 * lp(bell(mm, 587.33 * 1.004, 0.5, parts, rng), 2200) + 0.7 * whum
    return norm(hp(np.stack([L, R], 1), 90) * fades(n, 0.01, min(0.2, dur * 0.4))[:, None])

def g_glint(rng, dur=0.3):
    """a tiny metallic sparkle (a highlight sweeping over chrome): four very high, very short pings rising quickly in
    key (A6 D7 E7 A7), sweeping left to right, over a breath of bright air (stereo)"""
    n = ns(dur); L = np.zeros(n); R = np.zeros(n)
    for k, (f, p) in enumerate([(1760.0, -0.4), (2349.32, -0.13), (2637.02, 0.13), (3520.0, 0.4)]):
        m = ns(0.2); tm = tt(m)
        y = (np.sin(2 * np.pi * f * tm) + 0.2 * np.sin(2 * np.pi * f * 2.76 * tm)) * hit_env(m, rng.uniform(0.03, 0.05), 0.0006) * (1 - 0.12 * k)
        gl, gr = pan_gains(p); at = 0.024 * k + 0.004 * rng.random()
        put(L, y * gl, at); put(R, y * gr, at)
    m = ns(0.14); air = rmsn(hp(rng.standard_normal(m), 7000)) * np.sin(np.pi * np.arange(m) / m) ** 2 * 0.06
    put(L, air, 0.0); put(R, air, 0.0)
    return norm(np.stack([L, R], 1) * fades(n, 0.0005, 0.08)[:, None])


# ---------------------------------------------------------------- the registry
# level: loudest momentary loudness, dB re the voice (before ducking); bus: how it ducks under the words
# (bed = continuous textures, ducked most; dot = small one-shots; accent = the few impacts / musical accents, ducked
# least); pan: -1 left .. +1 right (balance law); verb: send to the room reverb (dB, None = dry); dur: default length;
# pre: seconds of the sound that come BEFORE the cue time (the cue time is the hit).
KINDS = {
    'alarm':      dict(fn=None, level=-19.0, bus='bed', pan=0.3, verb=-4.0, dur=3.0, pre=0.0, gated=True,
                       desc='prison alarm: two-tone klaxon (A5/E5, one tone per music beat), pulsing, filtered, heard across the corridor; gates a loop-periodic bed'),
    'alarm_tail': dict(fn=None, level=-19.0, bus='bed', pan=0.3, verb=-4.0, dur=0.9, pre=0.0, gated=True,
                       desc='the alarm fading out over dur (the room tail rings on)'),
    'door_slide': dict(fn=g_door_slide, level=-15.0, bus='dot', pan=0.0, verb=-12.0, dur=0.7, pre=0.0, desc='barred door rolling shut: wheel rumble + steel friction grind, accelerating'),
    'door_slam':  dict(fn=g_door_slam, level=-10.0, bus='accent', pan=0.0, verb=-9.0, dur=1.5, pre=0.0, desc='heavy steel door impact: low thump, crack, inharmonic clang ring, latch, bar rattle'),
    'cup_drop':   dict(fn=g_cup_drop, level=-15.0, bus='dot', pan=0.35, verb=-14.0, dur=0.6, pre=0.0, desc='paper cup slips: papery tick + small falling whoosh'),
    'splash':     dict(fn=g_splash, level=-12.0, bus='accent', pan=0.0, verb=-14.0, dur=0.8, pre=0.0, desc='coffee splat: low plop + wet burst + spray + droplets'),
    'bar_tap':    dict(fn=g_bar_tap, level=-14.0, bus='dot', pan=0.0, verb=-14.0, dur=0.6, pre=0.0, desc='metal hand on a steel bar: soft knock + small clink'),
    'mech_click': dict(fn=g_mech_click, level=-19.0, bus='dot', pan=0.0, verb=None, dur=0.15, pre=0.0, desc='tiny servo/mechanical clicks (4 patterns: cue "variant" 0-3)'),
    'servo':      dict(fn=g_servo, level=-18.0, bus='dot', pan=0.0, verb=None, dur=0.3, pre=0.0, desc='short geared servo whirr + stop tick'),
    'melt':       dict(fn=g_melt, level=-13.0, bus='bed', pan=0.0, verb=-16.0, dur=1.0, pre=0.0, desc='metallic liquefaction: warm sizzle + descending wobbly goop tone + low body'),
    'flow':       dict(fn=g_flow, level=-14.0, bus='bed', pan=0.0, verb=-16.0, dur=1.5, pre=0.0, desc='liquid flow/slither: wandering resonant band + soft bubbles + trickle'),
    'drip':       dict(fn=g_drip, level=-16.0, bus='dot', pan=0.0, verb=-12.0, dur=0.12, pre=0.0, desc='bright droplet blip'),
    'glug':       dict(fn=g_glug, level=-14.0, bus='dot', pan=0.0, verb=-16.0, dur=0.6, pre=0.0, desc='pour into the mould: 3-4 rising glugs'),
    'pipette':    dict(fn=g_pipette, level=-15.0, bus='dot', pan=0.0, verb=None, dur=0.35, pre=0.0, desc='suction squelch + small pop'),
    'cool':       dict(fn=g_cool, level=-17.0, bus='bed', pan=0.0, verb=-10.0, dur=1.2, pre=0.0, desc='cooling: airy hush + crystalline pings in key'),
    'mag_hum':    dict(fn=g_mag_hum, level=-18.0, bus='bed', pan=0.0, verb=None, dur=2.0, pre=0.0, desc='magnetic hum: low D drone with ~0.9 Hz beating + faint shimmer'),
    'heat_coil':  dict(fn=g_heat_coil, level=-18.0, bus='bed', pan=0.0, verb=None, dur=1.5, pre=0.0, desc='induction coil warm-up: rising whine over 100 Hz hum'),
    'whoosh':     dict(fn=g_whoosh, level=-13.0, bus='dot', pan=0.0, verb=None, dur=0.45, pre=0.0, desc='camera whip: rising/falling band noise, L->R'),
    'swish':      dict(fn=g_swish, level=-18.0, bus='dot', pan=0.0, verb=None, dur=0.25, pre=0.0, desc='small graphic move: short light whoosh'),
    'pop':        dict(fn=g_pop, level=-19.0, bus='dot', pan=0.0, verb=None, dur=0.08, pre=0.0, desc='tiny label pop-in'),
    'guard_gasp': dict(fn=g_guard_gasp, level=-15.0, bus='accent', pan=0.35, verb=-14.0, dur=0.42, pre=0.0, desc="wordless 'hm?!' (formant synth, rising pitch)"),
    'guard_gulp': dict(fn=g_guard_gulp, level=-14.0, bus='accent', pan=0.35, verb=-16.0, dur=0.35, pre=0.0, desc='comedic gulp: throat click + two descending gloops'),
    'sting':      dict(fn=g_sting, level=-11.0, bus='accent', pan=0.0, verb=-10.0, dur=1.6, pre=STING_PRE, desc='musical accent: reversed swell -> bell-pluck Dm chord + sub (hit at t)'),
    'reveal':     dict(fn=g_reveal, level=-12.0, bus='accent', pan=0.0, verb=-10.0, dur=1.8, pre=0.0, desc='soft glockenspiel chime D-F-A-D + warm bloom'),
    # ---- V2 (DIRECTION_V2 section 10): every one 11-14 dB under the voice before ducking
    'tension':    dict(fn=g_tension, level=-13.0, bus='bed', pan=0.0, verb=-16.0, dur=0.8, pre=0.0, desc='metallic stress as it deforms: stick-slip creak through steel modes, rising strain, low groan, two stress ticks'),
    'squeeze':    dict(fn=g_squeeze, level=-11.0, bus='accent', pan=0.0, verb=-16.0, dur=0.6, pre=0.0, desc='wet metallic squelch through a gap: pressure pulses in a tightening rising band + steel sheen, lets go at 72 % with a downward schlup'),
    'stream':     dict(fn=g_stream, level=-14.0, bus='bed', pan=0.0, verb=-16.0, dur=1.5, pre=0.0, desc='soft sustained fluid-metal movement: heavy smooth viscous pour (two wandering liquid bands, slosh), faint silver shimmer; not bubbly'),
    'reform':     dict(fn=g_reform, level=-12.0, bus='accent', pan=0.0, verb=-20.0, dur=0.55, pre=0.0, desc='metal flowing back into shape: rising shimmer of metal partials up an octave into D/A, quickening tremolo; ends tight at t+dur (put the snap there)'),
    'snap':       dict(fn=g_snap, level=-13.0, bus='accent', pan=0.0, verb=-16.0, dur=0.22, pre=0.0, desc='head snaps into shape: crisp click + short high steel tik + tiny pitch-dropping body knock'),
    'escape':     dict(fn=g_escape, level=-12.0, bus='accent', pan=0.0, verb=-14.0, dur=0.5, pre=0.0, desc="pops free: round suction 'thwup' (pitch springs up) + air puff + two small bloops"),
    'comic':      dict(fn=g_comic, level=-14.0, bus='dot', pan=0.0, verb=-14.0, dur=0.35, pre=0.0, variants=3, desc="deadpan punctuation (variant 0 hollow 'bonk', 1 tiny high 'plink', 2 dry 'boop-boop' falling a fourth)"),
    'lock':       dict(fn=g_lock, level=-14.0, bus='dot', pan=0.0, verb=-14.0, dur=0.25, pre=0.0, desc='padlock/latch: spring slide, solid shackle clack, seating tick'),
    'chain':      dict(fn=g_chain, level=-14.0, bus='dot', pan=0.0, verb=-14.0, dur=0.6, pre=0.0, desc='short chain rattle: small steel link clinks, clustered then thinning'),
    'clunk':      dict(fn=g_clunk, level=-14.0, bus='dot', pan=0.0, verb=None, dur=0.4, pre=0.0, desc='small (lab-scale) solid metal figure knocking thin bars: hard little tok + thin rod ring + rebound'),
    'ac_on':      dict(fn=g_ac_on, level=-14.0, bus='bed', pan=0.0, verb=None, dur=1.2, pre=0.0, desc='induction coil energising: relay tick, 100 Hz hum swelling in, charging tone rising A2->A3 and settling, faint high shimmer'),
    'field':      dict(fn=g_field, level=-14.0, bus='bed', pan=0.0, verb=None, dur=1.6, pre=0.0, desc="magnetic field swell: soft D3/A3/D4 'vwoom' that swells, phaser comb through an airy band, wide; no buzz, no rising pitch"),
    'enter':      dict(fn=g_enter, level=-12.0, bus='dot', pan=0.0, verb=None, dur=0.5, pre=ENTER_PRE, desc="'into the metal' (t = crossing the surface): tonal D/A resonant rise closing to the centre -> muffled metallic bloom + whum"),
    'glint':      dict(fn=g_glint, level=-14.0, bus='dot', pan=0.0, verb=-12.0, dur=0.3, pre=0.0, desc='tiny metallic sparkle: four very short high pings A6-D7-E7-A7, L->R, breath of air'),
}


def render(kind, rng, dur=None, variant=None):
    """the raw sound for one cue (mono (n,) or stereo (n, 2)), peak 1"""
    k = KINDS[kind]
    d = k['dur'] if dur is None else float(dur)
    if kind == 'mech_click':
        return g_mech_click(rng, d, variant)
    if k.get('variants'):
        return k['fn'](rng, d, variant)
    return k['fn'](rng, d)
