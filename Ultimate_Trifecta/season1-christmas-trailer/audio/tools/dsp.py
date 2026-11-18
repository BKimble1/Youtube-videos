"""Sound synthesis and processing helpers for the Season 1 trailer.

Everything here is generated from scratch with numpy (no samples): trailer
drums and hits, sleigh bells, bass, risers, whooshes, sirens, wind, water and
the reverb impulse responses.  48 kHz, float32, stereo arrays shaped (n, 2).
"""
import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
RNG = np.random.default_rng(1225)


def secs(n):
    return int(round(n * SR))


def silence(dur):
    return np.zeros((secs(dur), 2), np.float32)


def mono(x):
    return x.mean(axis=1) if x.ndim == 2 else x


def st(x, pan=0.0, width=0.0, seed=None):
    """Mono -> stereo with constant-power pan; width adds a short decorrelated copy."""
    x = np.asarray(x, np.float32)
    a = (pan + 1.0) * np.pi / 4.0
    l, r = np.cos(a) * x, np.sin(a) * x
    out = np.stack([l, r], axis=1) * np.sqrt(2.0)
    if width > 0:
        d = secs(0.011)
        y = np.concatenate([np.zeros(d, np.float32), x[:-d]]) if len(x) > d else x
        out[:, 0] += width * 0.5 * y
        out[:, 1] -= width * 0.5 * y
    return out.astype(np.float32)


def env_exp(n, tau, attack=0.002):
    t = np.arange(n) / SR
    e = np.exp(-t / tau)
    a = secs(attack)
    if a > 0:
        e[:a] *= np.linspace(0, 1, a)
    return e.astype(np.float32)


def noise(n, seed=None):
    g = np.random.default_rng(seed) if seed is not None else RNG
    return g.standard_normal(n).astype(np.float32)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def lp(x, f, order=2):
    sos = signal.butter(order, f, btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def hp(x, f, order=2):
    sos = signal.butter(order, f, btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0).astype(np.float32)


def sweep_filter(x, f0, f1, kind="low", q=0.9, steps=64):
    """Time-varying filter (block-wise SOS with a log frequency glide)."""
    n = len(x)
    out = np.zeros_like(x)
    edges = np.linspace(0, n, steps + 1).astype(int)
    zi = None
    for i in range(steps):
        u = i / max(steps - 1, 1)
        f = f0 * (f1 / f0) ** u
        f = min(max(f, 20.0), SR * 0.45)
        if kind == "band":
            lo, hi = f / (1 + q), f * (1 + q)
            sos = signal.butter(2, [lo, min(hi, SR * 0.45)], btype="band", fs=SR, output="sos")
        else:
            sos = signal.butter(2, f, btype=kind, fs=SR, output="sos")
        seg = x[edges[i]:edges[i + 1]]
        if zi is None:
            zi = np.zeros((sos.shape[0], 2) + seg.shape[1:], np.float32)
        y, zi = signal.sosfilt(sos, seg, axis=0, zi=zi)
        out[edges[i]:edges[i + 1]] = y
    return out.astype(np.float32)


def place(buf, clip, t, gain=1.0):
    """Mix a clip into buf at time t (seconds); clips past the end are cut."""
    i = secs(t)
    if i >= len(buf):
        return buf
    if clip.ndim == 1:
        clip = st(clip)
    j = min(len(buf), i + len(clip))
    if i < 0:
        clip = clip[-i:]
        j = min(len(buf), len(clip))
        i = 0
    buf[i:j] += clip[: j - i] * gain
    return buf


def fade(x, fin=0.0, fout=0.0):
    x = x.copy()
    a, b = secs(fin), secs(fout)
    if a > 0:
        x[:a] *= np.linspace(0, 1, a)[:, None] if x.ndim == 2 else np.linspace(0, 1, a)
    if b > 0:
        x[-b:] *= np.linspace(1, 0, b)[:, None] if x.ndim == 2 else np.linspace(1, 0, b)
    return x


def db(v):
    return 10 ** (v / 20.0)


def soft_clip(x, drive=1.0):
    return (np.tanh(x * drive) / np.tanh(drive)).astype(np.float32)


# ---------------------------------------------------------------- reverb IRs
def make_ir(dur=2.8, pre=0.018, damp=5500.0, seed=7, bright=0.0):
    """Stereo hall impulse response: decorrelated noise with an exponential
    decay whose high end dies faster (two-band), plus a few early reflections."""
    n = secs(dur)
    t = np.arange(n) / SR
    rt = dur * 0.42
    out = np.zeros((n, 2), np.float32)
    for c in range(2):
        g = np.random.default_rng(seed + c)
        w = g.standard_normal(n).astype(np.float32)
        lo = lp(w, damp) * np.exp(-t / rt)
        hi = hp(w, damp) * np.exp(-t / (rt * (0.35 + bright)))
        x = lo + 0.5 * hi
        p = secs(pre)
        x = np.concatenate([np.zeros(p, np.float32), x[:-p]])
        for k, (dt, a) in enumerate([(0.007, 0.5), (0.013, 0.35), (0.021, 0.3), (0.029, 0.22)]):
            j = secs(dt + 0.002 * c * (k % 2))
            if j < n:
                x[j] += a * (1 if (k + c) % 2 == 0 else -1)
        out[:, c] = x
    out /= np.max(np.abs(out)) + 1e-9
    return out


def write(path, x, sr=SR):
    sf.write(path, np.asarray(x, np.float32), sr, subtype="FLOAT")


def read(path):
    x, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr, axis=0).astype(np.float32)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    return x


# ---------------------------------------------------------------- drums
def kick(dur=0.5, f0=150.0, f1=46.0, punch=1.0, seed=1):
    n = secs(dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_exp(n, 0.22 * dur / 0.5, 0.001)
    click = hp(noise(n, seed), 2500) * env_exp(n, 0.004) * 0.35 * punch
    x = soft_clip(body * 1.2 + click, 1.6)
    return st(x * 0.9)


def boom(dur=3.0, f0=66.0, f1=40.0, seed=2, dist=1.8):
    """Trailer impact: a sub drop, a noise thump and a long low tail."""
    n = secs(dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.33))
    thump = lp(noise(n, seed), 180) * env_exp(n, 0.09, 0.001) * 3.0
    crack = bp(noise(n, seed + 1), 900, 5000) * env_exp(n, 0.03, 0.0005) * 0.6
    x = soft_clip(sub * 1.1 + thump + crack, dist)
    return st(x, width=0.25)


def taiko(dur=1.4, f=78.0, seed=3, vel=1.0):
    n = secs(dur)
    t = np.arange(n) / SR
    ff = f * (1 + 0.6 * np.exp(-t / 0.03))
    mem = np.sin(2 * np.pi * np.cumsum(ff) / SR) * env_exp(n, 0.28, 0.0015)
    skin = lp(noise(n, seed), 1400) * env_exp(n, 0.05, 0.0008) * 1.4
    slap = bp(noise(n, seed + 3), 1500, 6000) * env_exp(n, 0.008) * 0.4
    x = soft_clip((mem + skin + slap) * vel, 1.3)
    return st(x, width=0.3)


def tom(f=110.0, dur=0.7, seed=4, vel=1.0):
    n = secs(dur)
    t = np.arange(n) / SR
    ff = f * (1 + 0.35 * np.exp(-t / 0.04))
    x = np.sin(2 * np.pi * np.cumsum(ff) / SR) * env_exp(n, 0.2, 0.001)
    x += lp(noise(n, seed), 2500) * env_exp(n, 0.04) * 0.5
    return st(soft_clip(x * vel, 1.2))


def snare(dur=0.45, seed=5, tone=190.0, vel=1.0, bright=1.0):
    n = secs(dur)
    t = np.arange(n) / SR
    body = (np.sin(2 * np.pi * tone * t) + 0.5 * np.sin(2 * np.pi * tone * 1.78 * t)) * env_exp(n, 0.06, 0.0008)
    wires = bp(noise(n, seed), 1800, 11000) * env_exp(n, 0.13 * bright, 0.0008) * 1.1
    crack = hp(noise(n, seed + 9), 4000) * env_exp(n, 0.012) * 0.6
    x = soft_clip((body * 0.7 + wires + crack) * vel, 1.4)
    return st(x, width=0.2)


def clap(seed=6, vel=1.0):
    n = secs(0.35)
    x = np.zeros(n, np.float32)
    w = bp(noise(n, seed), 900, 6000)
    for k, d in enumerate([0.0, 0.009, 0.018, 0.027]):
        j = secs(d)
        e = env_exp(n - j, 0.008 if k < 3 else 0.11, 0.0005)
        x[j:] += w[: n - j] * e * (0.8 if k < 3 else 1.0)
    return st(x * vel * 0.8, width=0.5)


def hat(open_=False, seed=8, vel=1.0):
    n = secs(0.5 if open_ else 0.09)
    x = hp(noise(n, seed), 7000) * env_exp(n, 0.12 if open_ else 0.022, 0.0005)
    metal = np.zeros(n, np.float32)
    t = np.arange(n) / SR
    for f in (3150, 4370, 5730, 7410, 8890):
        metal += np.sign(np.sin(2 * np.pi * f * t))
    x += hp(metal, 6000) * env_exp(n, 0.1 if open_ else 0.015) * 0.06
    return st(x * vel * 0.5)


def crash(dur=3.5, seed=9, vel=1.0):
    n = secs(dur)
    t = np.arange(n) / SR
    w = hp(noise(n, seed), 3500) * (0.65 * np.exp(-t / (dur * 0.3)) + 0.35 * np.exp(-t / 0.08))
    metal = np.zeros(n, np.float32)
    g = np.random.default_rng(seed)
    for f in g.uniform(2500, 11000, 40):
        metal += np.sin(2 * np.pi * f * t + g.uniform(0, 6.28)) * np.exp(-t / g.uniform(0.3, dur * 0.4))
    x = w + hp(metal, 3000) * 0.025
    x[: secs(0.002)] *= np.linspace(0, 1, secs(0.002))
    return st(x * vel * 0.55, width=0.6)


def reverse_crash(dur=1.6, seed=10):
    c = crash(dur * 1.5, seed)[: secs(dur)]
    return fade(c[::-1].copy(), 0.05, 0.0)


# ---------------------------------------------------------------- bells
def sleigh_shake(dur=0.12, seed=11, vel=1.0, bright=1.0):
    """One shake of a strap of jingle bells: many tiny inharmonic rattles."""
    g = np.random.default_rng(seed)
    n = secs(dur + 0.25)
    t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for k in range(int(26 * vel) + 6):
        t0 = g.uniform(0.0, dur) ** 1.4 * dur ** -0.4
        j = secs(t0)
        f = g.uniform(2900, 7800) * bright
        d = g.uniform(0.025, 0.09)
        m = n - j
        tt = t[:m]
        part = (np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * f * 1.51 * tt + 1.0) + 0.35 * np.sin(2 * np.pi * f * 2.27 * tt)) * np.exp(-tt / d)
        x[j:] += part * g.uniform(0.3, 1.0)
    x += hp(noise(n, seed + 1), 6000) * env_exp(n, dur * 0.6, 0.002) * 0.6
    return st(x * 0.05 * vel, pan=g.uniform(-0.15, 0.15), width=0.4)


def bell_tone(f, dur=2.5, vel=1.0, bright=1.0):
    """A struck bell (tubular / handbell-ish): inharmonic partials."""
    n = secs(dur)
    t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for ratio, amp, dec in ((0.5, 0.35, 1.0), (1.0, 1.0, 0.8), (1.19, 0.4, 0.5), (1.5, 0.35, 0.45), (2.0, 0.45, 0.35), (2.74, 0.25 * bright, 0.2), (3.76, 0.15 * bright, 0.12)):
        x += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (dur * dec * 0.5))
    x[: secs(0.001)] *= np.linspace(0, 1, secs(0.001))
    return st(x * vel * 0.18)


def clock_tick(seed=12, vel=1.0):
    n = secs(0.12)
    x = bp(noise(n, seed), 1800, 6500) * env_exp(n, 0.006, 0.0003)
    t = np.arange(n) / SR
    x += np.sin(2 * np.pi * 2400 * t) * env_exp(n, 0.01) * 0.3
    return st(x * vel * 0.6)


# ---------------------------------------------------------------- bass
def bass_note(f, dur, vel=1.0, drive=1.6, cutoff=900.0):
    n = secs(dur)
    t = np.arange(n) / SR
    saw = signal.sawtooth(2 * np.pi * f * t) + 0.6 * signal.sawtooth(2 * np.pi * f * 1.004 * t + 1.0)
    sub = np.sin(2 * np.pi * f * t) * 0.9
    e = np.minimum(1.0, t / 0.004) * np.exp(-t / max(dur * 0.9, 0.08))
    rel = secs(0.02)
    e[-rel:] *= np.linspace(1, 0, rel)
    x = lp(saw * 0.45, cutoff) + sub
    x = soft_clip(x * e * vel, drive)
    return st(x * 0.5)


# ---------------------------------------------------------------- risers / whooshes
def riser(dur=2.0, f0=200.0, f1=4000.0, seed=13, tonal=True):
    n = secs(dur)
    t = np.arange(n) / SR
    w = noise(n, seed)
    x = sweep_filter(w[:, None].repeat(2, 1) * 0.6, f0, f1, "band", q=0.6, steps=96)
    if tonal:
        ff = 110 * (8.0 ** (t / dur) - 1) / 7.0 + 110
        tone = np.zeros(n, np.float32)
        for k in (1, 1.5, 2, 3):
            tone += np.sin(2 * np.pi * np.cumsum(ff * k) / SR) / k
        x += st(tone * 0.18)
    e = (t / dur) ** 2.2
    return (x * e[:, None]).astype(np.float32)


def whoosh(dur=0.6, f0=300.0, f1=3000.0, seed=14, peak=0.55, pan0=-0.6, pan1=0.6):
    n = secs(dur)
    t = np.arange(n) / SR
    w = noise(n, seed)
    u = t / dur
    e = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)
    x = sweep_filter((w * e)[:, None].repeat(2, 1), f0, f1, "band", q=0.8, steps=48)
    pan = pan0 + (pan1 - pan0) * u
    a = (pan + 1) * np.pi / 4
    x[:, 0] *= np.cos(a) * 1.4
    x[:, 1] *= np.sin(a) * 1.4
    return x.astype(np.float32)


def sub_drop(dur=1.5, f0=72.0, f1=38.0):
    n = secs(dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / (dur * 0.3))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.45))
    x[: secs(0.003)] *= np.linspace(0, 1, secs(0.003))
    return st(x * 0.9)


# ---------------------------------------------------------------- foley / ambience
def wind(dur, seed=15, level=1.0):
    n = secs(dur)
    t = np.arange(n) / SR
    w = np.stack([noise(n, seed), noise(n, seed + 1)], 1)
    x = lp(w, 700, 2) * 0.6 + bp(w, 250, 1200) * 0.4
    gust = 0.55 + 0.25 * np.sin(2 * np.pi * 0.17 * t + 1.0) + 0.2 * np.sin(2 * np.pi * 0.41 * t)
    return (x * gust[:, None] * 0.25 * level).astype(np.float32)


def siren(dur, f_lo=640.0, f_hi=960.0, rate=0.55, seed=16, distance=1.0):
    """A distant wailing siren (two-tone glide), lowpassed and with slapback for distance."""
    n = secs(dur)
    t = np.arange(n) / SR
    m = 0.5 + 0.5 * np.sin(2 * np.pi * rate * t - np.pi / 2)
    f = f_lo + (f_hi - f_lo) * m
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = signal.sawtooth(ph, 0.5) * 0.6 + np.sin(ph) * 0.4 + 0.25 * np.sin(2 * ph)
    x = lp(hp(x, 300), 2200 / max(distance, 0.5))
    d = secs(0.09)
    y = x.copy()
    y[d:] += 0.35 * x[:-d]
    return st(y * 0.25, width=0.5)


def step(seed=17, surface="stone", vel=1.0):
    n = secs(0.16)
    w = noise(n, seed)
    if surface == "stone":
        x = bp(w, 300, 3500) * env_exp(n, 0.018, 0.001) * 1.2 + lp(w, 220) * env_exp(n, 0.03, 0.001) * 2.5
        x += hp(noise(n, seed + 5), 3500) * env_exp(n, 0.035, 0.004) * 0.25  # grit / snow crunch
    elif surface == "snow":
        x = bp(w, 500, 5000) * env_exp(n, 0.05, 0.004) * 1.1 + lp(w, 250) * env_exp(n, 0.03) * 1.5
    else:  # wood / indoor
        t = np.arange(n) / SR
        x = lp(w, 900) * env_exp(n, 0.02, 0.0008) * 2.0 + np.sin(2 * np.pi * 140 * t) * env_exp(n, 0.03) * 0.6
    return st(x * vel * 0.55)


def splash(dur=1.6, seed=18, size=1.0):
    """A body landing in water: impact thump, a spray burst and bubbling tail."""
    n = secs(dur)
    t = np.arange(n) / SR
    g = np.random.default_rng(seed)
    thump = lp(noise(n, seed), 250) * env_exp(n, 0.07, 0.002) * 3.0
    spray = bp(noise(n, seed + 1), 900, 9000) * (np.exp(-t / (0.35 * size)) * np.minimum(1, t / 0.01)) * 1.4
    bubbles = np.zeros(n, np.float32)
    for k in range(int(40 * size)):
        t0 = g.uniform(0.02, 0.9 * dur)
        j = secs(t0)
        f = g.uniform(350, 1500)
        d = g.uniform(0.015, 0.05)
        m = min(n - j, secs(d * 6))
        tt = t[:m]
        bubbles[j:j + m] += np.sin(2 * np.pi * f * tt * (1 + 2.5 * tt)) * np.exp(-tt / d) * g.uniform(0.1, 0.4) * np.exp(-t0 / (0.5 * dur))
    x = soft_clip(thump + spray + bubbles * 0.6, 1.2)
    return st(x * 0.55 * size, width=0.5)


def drips(dur=1.2, seed=19):
    n = secs(dur)
    t = np.arange(n) / SR
    g = np.random.default_rng(seed)
    x = np.zeros(n, np.float32)
    for k in range(18):
        j = secs(g.uniform(0, dur * 0.9))
        f = g.uniform(900, 2400)
        m = min(n - j, secs(0.06))
        tt = t[:m]
        x[j:j + m] += np.sin(2 * np.pi * f * tt * (1 + 6 * tt)) * np.exp(-tt / 0.012) * g.uniform(0.1, 0.35)
    return st(x * 0.5, width=0.6)


def radio_squelch(seed=20, dur=0.18):
    n = secs(dur)
    x = bp(noise(n, seed), 1200, 4500) * env_exp(n, dur * 0.4, 0.001)
    t = np.arange(n) / SR
    x += np.sign(np.sin(2 * np.pi * 1000 * t)) * env_exp(n, 0.015) * 0.15
    return st(x * 0.35)


def radio_voice(x):
    """Walkie-talkie colour for a voice clip (mono or stereo in)."""
    m = mono(x)
    m = hp(lp(m, 3200, 4), 420, 4)
    m = soft_clip(m * 4.0, 2.5) * 0.4
    m += bp(noise(len(m), 21), 2000, 6000) * 0.012
    return st(m)


def flashlight_click(seed=22):
    n = secs(0.08)
    x = bp(noise(n, seed), 2000, 9000) * env_exp(n, 0.004, 0.0002)
    t = np.arange(n) / SR
    x += np.sin(2 * np.pi * 3200 * t) * env_exp(n, 0.006) * 0.4
    return st(x * 0.5)


def engine_loop(dur, f=38.0, seed=23, rev=1.0):
    """Electric cart whine + motor hum."""
    n = secs(dur)
    t = np.arange(n) / SR
    ff = f * rev
    hum = signal.sawtooth(2 * np.pi * ff * t) * 0.3 + np.sin(2 * np.pi * ff * 2 * t) * 0.3
    whine = np.sin(2 * np.pi * ff * 22 * t) * 0.05
    x = lp(hum, 600) + whine + lp(noise(n, seed), 400) * 0.1
    return st(x * 0.35)


def skid(dur=0.7, seed=24):
    n = secs(dur)
    t = np.arange(n) / SR
    x = bp(noise(n, seed), 600, 3000) * np.minimum(1, t / 0.03) * np.exp(-t / (dur * 0.5))
    x += np.sin(2 * np.pi * (900 + 200 * np.sin(2 * np.pi * 13 * t)) * t) * np.exp(-t / (dur * 0.4)) * 0.15
    return st(x * 0.6, width=0.4)


def door_thud(seed=25):
    n = secs(0.6)
    x = lp(noise(n, seed), 300) * env_exp(n, 0.08, 0.002) * 2.2
    t = np.arange(n) / SR
    x += np.sin(2 * np.pi * 85 * t) * env_exp(n, 0.12) * 0.9
    return st(soft_clip(x, 1.3) * 0.6)


def heartbeat(seed=26):
    a = kick(0.35, f0=90, f1=40, punch=0.2, seed=seed) * 0.8
    b = kick(0.35, f0=80, f1=38, punch=0.1, seed=seed + 1) * 0.55
    out = silence(0.7)
    place(out, a, 0.0)
    place(out, b, 0.22)
    return lp(out, 220)


def limiter(x, ceiling_db=-1.3, lookahead=0.006, release=0.09, oversample=4):
    """Look-ahead brickwall limiter on the (oversampled) peak, so true peaks stay
    under the ceiling.  x: (n, 2)."""
    from scipy.ndimage import minimum_filter1d, maximum_filter1d
    up = signal.resample_poly(x, oversample, 1, axis=0) if oversample > 1 else x
    pk = np.max(np.abs(up), axis=1)
    pk = pk.reshape(-1, oversample).max(axis=1) if oversample > 1 else pk
    pk = pk[: len(x)]
    ceil = db(ceiling_db)
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    la = max(1, secs(lookahead))
    g = minimum_filter1d(g, size=2 * la + 1, origin=0)
    # release: one-pole rise back toward 1
    a = np.exp(-1.0 / (release * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    # smooth the attack across the look-ahead window
    k = np.ones(la) / la
    out = np.minimum(out, np.convolve(out, k, mode="same"))
    return (x * out[:, None]).astype(np.float32)
