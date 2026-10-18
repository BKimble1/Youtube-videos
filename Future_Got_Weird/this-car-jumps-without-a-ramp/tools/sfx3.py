# Copied unchanged from Future_Got_Weird/tesla-roadster-flew/tools/sfx3.py (branch claude/rocket-car-physics-short-t27oqy):
# the channel's procedural effects library, reused so the episodes share one sound palette.
"""Companion v3 sound effects: original procedural synthesis, one sound per visible action (no library sounds).
Every function returns a mono float array at 48 kHz, peak-normalised to 1 (gain is set where it is placed)."""
import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
_rng = np.random.default_rng(31015)


def T(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return _rng.standard_normal(int(d * SR))


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], 'band')
    return lfilter(b, a, x)


def lp(x, f, order=2):
    b, a = butter(order, f / (SR / 2), 'low')
    return lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = butter(order, f / (SR / 2), 'high')
    return lfilter(b, a, x)


def env(n, a, r, shape=1.5):
    t = np.arange(n) / SR
    d = n / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.clip((d - t) / max(r, 1e-4), 0, 1) ** shape


def nrm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


def fan(d, rise=0.8, fall=0.0, lo=110.0, hi=430.0, steady=0.45):
    """Fan: blade tone and air rising together (controlled spin-up), settling to a quieter steady whine; optional
    spin-down at the end."""
    t = T(d)
    spd = np.clip(t / rise, 0, 1)
    spd = 1 - (1 - spd) ** 2
    if fall > 0:
        spd = spd * np.clip((d - t) / fall, 0, 1) ** 1.2
    f = lo + (hi - lo) * spd
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = 0.55 * np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph + 0.4)
    air = bp(noise(d), 700, 4200) * 0.9
    level = spd * (1 - (1 - steady) * np.clip((t - rise) / 0.6, 0, 1))
    y = (tone + air) * level * env(len(t), 0.03, 0.08, 1)
    return nrm(y)


def valve_click():
    """A lever valve: a sharp metallic tick and a low clack 25 ms later."""
    t = T(0.12)
    ping = np.sin(2 * np.pi * 2900 * t) * np.exp(-t * 180) + 0.5 * np.sin(2 * np.pi * 4700 * t) * np.exp(-t * 260)
    clack = np.zeros_like(t)
    i = int(0.025 * SR)
    tt = t[: len(t) - i]
    clack[i:] = (np.sin(2 * np.pi * 820 * tt) * np.exp(-tt * 90) + bp(noise(len(tt) / SR), 1200, 5000) * np.exp(-tt * 140) * 0.6)
    return nrm(ping + clack)


def burst(d=0.32):
    """Pneumatic burst: a hard 'pssht' with a short air push underneath."""
    t = T(d)
    hiss = bp(noise(d), 600, 7500) * np.exp(-t * 7) * np.minimum(1, t / 0.004)
    push = np.sin(2 * np.pi * (95 - 40 * t / d) * t) * np.exp(-t * 18) * 0.7
    return nrm(hiss + push)


def gas(d, flutter=7.0, lo=500, hi=6000):
    """A steady cold-gas jet: band-limited noise with a slight flutter, no combustion rumble."""
    t = T(d)
    x = bp(noise(d), lo, hi)
    mod = 1 + 0.12 * np.sin(2 * np.pi * flutter * t + _rng.uniform(0, 6))
    return nrm(x * mod * env(len(t), 0.02, min(0.18, d * 0.4), 1.2))


def slide(d=0.6):
    """A panel sliding on its rails: grainy friction over a low rumble."""
    t = T(d)
    grain = bp(noise(d), 300, 2200) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t)))
    rumble = lp(noise(d), 160) * 2.5
    return nrm((grain + rumble) * env(len(t), 0.06, 0.12, 1.2))


def latch():
    """Panel latch: metal click with a small body thud."""
    t = T(0.18)
    click = bp(noise(0.18), 2000, 9000) * np.exp(-t * 220)
    body = np.sin(2 * np.pi * (180 - 80 * t) * t) * np.exp(-t * 40) * 0.8
    return nrm(click + body)


def tyre(depth=1.0):
    """Touchdown: a low suspension thump, a rubber squish, a short spring creak."""
    t = T(0.6)
    thump = np.sin(2 * np.pi * (58 - 18 * t) * t) * np.exp(-t * 9) * depth
    squish = lp(noise(0.6), 420) * np.exp(-t * 26) * 2.2
    creak = np.sin(2 * np.pi * (330 + 40 * np.sin(2 * np.pi * 9 * t)) * t) * np.exp(-((t - 0.16) / 0.06) ** 2) * 0.12
    return nrm(thump + squish + creak)


def squat():
    """A soft suspension compress (car pulled down onto its springs)."""
    t = T(0.35)
    return nrm(np.sin(2 * np.pi * (75 - 25 * t) * t) * np.exp(-t * 14) + lp(noise(0.35), 300) * np.exp(-t * 30) * 0.8)


def motor(d, f0=240, f1=520, rise=0.6):
    """Electric drive whir: a clean rising tone with a little gear noise."""
    t = T(d)
    u = np.clip(t / rise, 0, 1)
    f = f0 + (f1 - f0) * (1 - (1 - u) ** 2)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = 0.6 * np.sin(ph) + 0.25 * np.sin(2.01 * ph) + bp(noise(d), 1500, 5000) * 0.15
    return nrm(y * env(len(t), 0.08, 0.25, 1.2))


def relay():
    """Banks of lights switching on: a heavy relay clunk and the start of a mains hum."""
    t = T(1.2)
    clunk = np.sin(2 * np.pi * (110 - 50 * t) * t) * np.exp(-t * 30) + bp(noise(1.2), 1500, 6000) * np.exp(-t * 120) * 0.6
    hum = (np.sin(2 * np.pi * 100 * t) + 0.4 * np.sin(2 * np.pi * 200 * t)) * np.clip(t / 0.05, 0, 1) * np.exp(-t * 2.5) * 0.25
    return nrm(clunk + hum)


def swell(d, f=380):
    """A low air swell (the sound change as the car leaves the surface and time slows)."""
    t = T(d)
    return nrm(lp(noise(d), f) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.3)


def rumble(d):
    """Hangar doors rolling apart: a low rumble with wheel ticks."""
    t = T(d)
    base = lp(noise(d), 120) * 3
    ticks = np.zeros_like(t)
    for k in np.arange(0.07, d, 0.21):
        i = int(k * SR)
        n = min(len(t) - i, int(0.03 * SR))
        ticks[i:i + n] += bp(noise(n / SR), 800, 3000) * np.exp(-np.arange(n) / SR * 120) * 0.4
    return nrm((base + ticks) * env(len(t), 0.3, 0.6, 1.2))


def wind(d):
    """Outdoor air bed (very low in the mix)."""
    t = T(d)
    return nrm(lp(noise(d), 500) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * t + 1.0)) * env(len(t), 1.0, 1.0, 1))


def room(d):
    """Workshop room tone: soft air and a faint hum."""
    t = T(d)
    return nrm((lp(noise(d), 700) + 0.08 * np.sin(2 * np.pi * 120 * t)) * env(len(t), 0.8, 0.8, 1))


def conveyor(d):
    """Belt moving: motor hum and roller rattle."""
    t = T(d)
    hum = np.sin(2 * np.pi * 90 * t) * 0.5 + np.sin(2 * np.pi * 180 * t) * 0.2
    rattle = bp(noise(d), 600, 2400) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t) ** 2) * 0.5
    return nrm((hum + rattle) * env(len(t), 0.15, 0.25, 1))


def servo(d=0.5, up=True):
    """Robot arm servo: a short rising (or falling) whine."""
    t = T(d)
    f = np.linspace(520, 860, len(t)) if up else np.linspace(860, 520, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return nrm((np.sin(ph) + 0.3 * np.sin(3 * ph)) * env(len(t), 0.05, 0.12, 1))


def clunk():
    """Part seated: a firm metal clunk."""
    t = T(0.3)
    return nrm(np.sin(2 * np.pi * (140 - 60 * t) * t) * np.exp(-t * 22) + bp(noise(0.3), 900, 5000) * np.exp(-t * 60) * 0.7)


def beep(f, d=0.22):
    t = T(d)
    return nrm(np.sin(2 * np.pi * f * t) * env(len(t), 0.005, 0.06, 1))


def buzz():
    """A lit sign switching on."""
    t = T(0.5)
    y = np.sign(np.sin(2 * np.pi * 100 * t)) * 0.3 * np.exp(-t * 6) + np.sin(2 * np.pi * (120 - 60 * t) * t) * np.exp(-t * 25)
    return nrm(lp(y, 2500))


def tick(f=2400):
    t = T(0.03)
    return nrm(np.sin(2 * np.pi * f * t) * np.exp(-t * 260))


def scratch():
    """Pencil tick on a clipboard."""
    t = T(0.22)
    return nrm(bp(noise(0.22), 2500, 8000) * (np.exp(-((t - 0.05) / 0.03) ** 2) + 0.7 * np.exp(-((t - 0.14) / 0.04) ** 2)))


def chug(d, rate=5.5):
    """Small onboard compressor: rhythmic chugs."""
    t = T(d)
    pulses = np.maximum(0, np.sin(2 * np.pi * rate * t)) ** 6
    y = (np.sin(2 * np.pi * 75 * t) + bp(noise(d), 300, 1500) * 0.6) * pulses
    return nrm(y * env(len(t), 0.2, 0.3, 1))


def shimmer(d=0.45):
    """The drawn outline tracing over the footage: a soft rising glassy tone."""
    t = T(d)
    f = np.linspace(880, 1320, len(t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return nrm((np.sin(ph) + 0.5 * np.sin(2 * ph)) * np.sin(np.pi * t / d) ** 2)
