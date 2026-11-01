#!/usr/bin/env python3
"""Effects, beds, a quiet pad and the mix for the Frozen Frog Short. Everything is synthesised here (no samples, no
third-party music). The narration master is used sample for sample (gain, a gentle compressor and a limiter only).

Every effect is placed from the picture's own events and signals (audio/cues.json, exported from story.ts):
  the heartbeat: one thump per beat of the picture's schedule (BEATS): audible in the opening, the final beat with a
        longer tail, then nothing; two small twitches and an emphasised first beat at the revival; steady to the end,
        and on into frame 0's beat (the schedule is anchored to the loop point);
  ice: a sharp crackle as frost races over the skin (0.3-1.4 s), finer crackles as ice grows round the heart and
        sweeps through the body; quiet crystalline tinkles and fluid movement inside the tissue; a strained creak that
        stops dead when the needles reach the protected cell's membrane;
  sugar: a soft warm bloom from the liver and a fine flowing fizz along the vein; tiny soft ticks as rings pass the
        transporters;
  winter: wind, the hiss of falling snow, a low eerie drone; spring: lighter air, drips, the frost melting (a wet
        crackle and trickle), a single bird far off; the blink; the hop (leaves, a soft push, a light landing);
  the end: the air lightens, then the cold wind and a faint crackle creep back in, the same bed that opens the film.
Beds are circular (filtered as a loop) so the last sample runs into the first.
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, EV, T = cj['DUR'], cj['EV'], cj['T']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2611)
LOG = []

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def place(buf, sig, at, name=None, gain_db=0.0):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    m = (idx >= 0) & (idx < N)
    buf[idx[m]] += sig[m] * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def sig100(a):  # 100 Hz control signal -> audio rate
    return np.interp(t, np.arange(len(a)) / 100, a)
def winT(a, b, fa=0.05, fb=0.05): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)

# ---------------- generators
def tick(dur=0.03, f=4200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 3000) * np.exp(-tt / 0.0015) + 0.4 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def resonate(x, f, r=0.995):
    out = np.zeros(len(x)); y1 = y2 = 0.0; w = 2 * np.pi * f / SR; c = 2 * r * np.cos(w)
    for k in range(len(x)):
        y = x[k] + c * y1 - r * r * y2; y2, y1 = y1, y; out[k] = y
    return out
def creak(dur=0.4, f=150, grain=50):
    n = int(dur * SR); tt = np.arange(n) / SR
    ph = np.cumsum(grain * (1 + 0.3 * np.sin(2 * np.pi * 3 * tt)) / SR)
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.5 + 0.5 * rng.random(n))
    return norm(bp(resonate(pulses, f), 70, 2500)) * env(n, dur * 0.25, dur * 0.4)
def squelch(dur=0.4, lo=200, hi=1600, dens=30):
    n = int(dur * SR); g = np.zeros(n)
    for _ in range(int(dur * dens)):
        i = rng.integers(0, max(1, n - 1200)); m = 1200
        g[i:i + m] += np.sin(2 * np.pi * (250 + 500 * rng.random()) * np.arange(m) / SR) * np.exp(-np.arange(m) / SR / 0.006) * rng.random()
    return norm(bp(noise(n), lo, hi) * 0.4 + g) * env(n, dur * 0.3, dur * 0.4)
def swell(dur, f=46, rise=1.0):
    """deep organic swelling: a low, slowly bending tone with a wet inner texture"""
    n = int(dur * SR); tt = np.arange(n) / SR
    fr = f * (1 + 0.25 * rise * tt / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = np.sin(ph) + 0.45 * np.sin(2 * ph + 0.6 * np.sin(2 * np.pi * 2.1 * tt)) + 0.2 * np.sin(3.01 * ph)
    wet = bp(noise(n), 180, 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 5.3 * tt)) * 0.3
    return norm(lp(x * (1 + 0.25 * bp(noise(n), 3, 9)) + wet, 900)) * env(n, min(0.05, dur * 0.2), dur * 0.35)
def fabric_strain(dur=0.5):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = bp(noise(n), 1800, 6500) * (0.3 + 0.7 * (tt / dur) ** 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt))
    return norm(x + 0.3 * creak(dur, 900, 120)) * env(n, dur * 0.6, 0.04)
def rip(dur=0.4, bright=1.0):
    """tearing fabric: a dense crackling burst of fibre snaps over band noise"""
    n = int(dur * SR); tt = np.arange(n) / SR
    snaps = np.zeros(n)
    for _ in range(int(dur * 900)):
        i = rng.integers(0, n - 200)
        snaps[i:i + 200] += hp(noise(200), 2500) * np.exp(-np.arange(200) / SR / 0.0008) * rng.random()
    body = bp(noise(n), 700, 5000) * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * tt))
    return norm(0.9 * snaps * bright + 0.6 * body) * env(n, 0.004, dur * 0.5)
def thump(dur=0.5, f0=70, f1=34):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (dur * 0.35)) + 0.2 * lp(noise(n), 200) * np.exp(-tt / 0.03))
def shimmer(dur=1.0, f0=5200, f1=1800):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(5):
        f = f0 * (f1 / f0) ** (tt / dur) * (1 + 0.013 * k)
        x += np.sin(2 * np.pi * np.cumsum(f) / SR + k) * (0.5 + 0.5 * np.sin(2 * np.pi * (2 + k) * tt))
    return norm(x) * env(n, dur * 0.35, dur * 0.45)
def blip(f0=2400, f1=700, dur=0.11):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (dur * 0.4)) + 0.25 * hp(noise(n), 5000) * np.exp(-tt / 0.004))
def lock(dur=0.12):
    """a soft molecular click: a damped knock with a glassy top"""
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * 520 * tt) * np.exp(-tt / 0.012) + 0.5 * np.sin(2 * np.pi * 1730 * tt) * np.exp(-tt / 0.006) + 0.3 * hp(noise(n), 3000) * np.exp(-tt / 0.002))
def power(dur=0.6, f0=420, f1=90):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return norm(lp(np.sin(ph) + 0.35 * np.sign(np.sin(ph)) * 0.3, 1500)) * env(n, 0.02, dur * 0.6)
def crackle(dur, density=60, lo=2500, hi=9000):
    n = int(dur * SR); x = np.zeros(n)
    for _ in range(int(dur * density)):
        i = rng.integers(0, max(1, n - 300))
        x[i:i + 300] += tick(300 / SR, 2500 + 4000 * rng.random())[:300] * (0.2 + 0.8 * rng.random())
    return norm(bp(x, lo, hi) + 1e-9) * env(n, min(0.03, dur * 0.2), min(0.08, dur * 0.3))
def hoof():
    n = int(0.55 * SR); tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (58 - 26 * tt / 0.55) * tt) * np.exp(-tt / 0.12)
    knock = bp(noise(n), 300, 1600) * np.exp(-tt / 0.02)
    dirt = crackle(0.35, 220, 1500, 7000)
    out = 1.0 * sub + 0.5 * knock
    out[:len(dirt)] += 0.25 * dirt
    return norm(out)
def snort(dur=0.45):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), 300, 2600) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 0.7 * (1 + 0.5 * np.sin(2 * np.pi * 31 * tt))) * env(n, 0.05, 0.2)
def chime(f, dur=0.9):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / (dur * d)) for k, a, d in [(1, 1, 0.5), (2.01, 0.35, 0.3), (3.02, 0.12, 0.2)])) * env(n, 0.03, dur * 0.4)
def plip():
    n = int(0.14 * SR); tt = np.arange(n) / SR
    f = 900 * (1 + 2.2 * tt / 0.14)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.03))
def iron_creak(dur=0.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = creak(dur, 420, 70) + 0.4 * bp(noise(n), 2000, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * tt))
    return norm(x) * env(n, 0.05, 0.15)
def rattle(dur=0.6, hz=13):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(int(dur * hz)):
        i = int((k / hz + 0.01 * rng.random()) * SR)
        m = min(n - i, 900)
        if m > 0: x[i:i + m] += resonate(np.r_[1.0, np.zeros(m - 1)], 1900 + 300 * rng.random(), 0.993)[:m] * (0.4 + 0.6 * rng.random())
    return norm(x + 0.1 * bp(noise(n), 2000, 5000)) * env(n, 0.04, 0.12)
def clunk():
    n = int(0.7 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (72 - 20 * tt) * tt) * np.exp(-tt / 0.1)
    ring_ = resonate(np.r_[1.0, np.zeros(n - 1)], 640, 0.9995) * np.exp(-tt / 0.25)
    return norm(body + 0.08 * norm(ring_) + 0.5 * bp(noise(n), 200, 1800) * np.exp(-tt / 0.015))
def eerie(dur=0.9):
    """the twist cue: a glassy, slightly detuned high cluster that bends down, over a soft sub dip"""
    n = int(dur * SR); tt = np.arange(n) / SR
    bend = 1 - 0.06 * (tt / dur) ** 2
    x = sum(np.sin(2 * np.pi * np.cumsum(f * bend) / SR) for f in (1318.5, 1396.9, 1975.5 * 1.004)) / 3
    sub = np.sin(2 * np.pi * np.cumsum(55 * (1 - 0.2 * tt / dur)) / SR) * 0.6
    return norm(x * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * tt)) + sub) * env(n, dur * 0.25, dur * 0.5)
def rustle(dur=0.5, lo=1500, hi=7000):
    n = int(dur * SR)
    g = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.3 + lp(g, 9000) * 2.0, lo, hi)) * env(n, dur * 0.3, dur * 0.5)


def addm(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out
def S(name):  # a 100 Hz cue signal at audio rate
    return sig100(np.array(cj[name], dtype=float))
def circ(f, x): return f(np.concatenate([x, x, x]))[len(x):2 * len(x)]
def heart_thump(strength=1.0, tail=0.18):
    """lub-dub: a low, rounded thump and a softer second sound"""
    n = int(0.5 * SR); tt = np.arange(n) / SR
    lub = np.sin(2 * np.pi * (62 - 18 * tt / 0.12) * tt) * np.exp(-tt / 0.055) * (tt < 0.25)
    t2 = np.clip(tt - 0.15, 0, None)
    dub = 0.55 * np.sin(2 * np.pi * (78 - 20 * t2 / 0.1) * t2) * np.exp(-t2 / (0.04 + tail * 0.2)) * (tt >= 0.15)
    body = lp(noise(n), 160) * np.exp(-tt / 0.03) * 0.25
    return norm(lub + dub + body) * strength
def tinkle(f=3200, dur=0.5):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / (dur * 0.25 / k)) for k in (1, 2.76, 5.4)))
def fizz(dur, dens=400):
    return crackle(dur, dens, 4000, 11000)
def bird(f0=3800):
    n = int(0.32 * SR); tt = np.arange(n) / SR
    f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 9 * tt)) * (1 - 0.15 * tt / 0.32)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.32) ** 2)

sfx = np.zeros(N)
EXT = S('ext'); FROST = S('frost'); MIC = lp(S('micro'), 6); COLD = S('cold'); SNOW = S('snow'); FALL = S('falling'); WET = S('wet')
PER = cj['PERIOD']

# ---- the heartbeat (from the picture's schedule)
for b, s_ in cj['BEATS']:
    if b < 0 or b >= DUR: continue
    if b < 2:
        final = abs(b - EV['finalBeat']) < 1e-3
        place(sfx, heart_thump(1.0, 0.7 if final else 0.18), b, 'heartbeat' if b == 0 else ('the final, strained heartbeat (then everything cuts out)' if final else None), -9 if final else -12)
        if final: place(sfx, thump(0.6, 48, 30), b + 0.02, None, -17)
    elif abs(b - EV['twitch']) < 1e-3:
        place(sfx, heart_thump(1.0, 0.05) * 0.7, b, 'revival twitch', -15)
    elif abs(b - EV['beat0']) < 1e-3:
        place(sfx, heart_thump(1.0, 0.5), b, 'the heart restarts: the powerful first pulse', -6)
        place(sfx, thump(0.9, 46, 26), b, None, -10)
        surge = lp(noise(int(0.9 * SR)), 900) * np.linspace(1, 0, int(0.9 * SR)) ** 1.5
        place(sfx, norm(surge), b + 0.03, 'circulation surges back (low rush)', -24)
    else:
        inside = b < 20.8 or b > 22.6
        place(sfx, heart_thump(1.0), b, 'heartbeat resumes' if abs(b - EV['beat0'] - PER) < 1e-3 else None, -13 if inside else -16)
        if b < 20.8:
            place(sfx, squelch(0.3, 150, 700, 18), b + 0.05, 'blood flowing again (soft pulse of fluid)' if abs(b - EV['beat0'] - PER) < 1e-3 else None, -30)

# ---- the opening: alive, then the ice wave
place(sfx, bird(4100), 0.02, 'a bird (the living forest)', -34)
wave = crackle(0.75, 520, 2200, 11000) * np.linspace(0.35, 1, int(0.75 * SR)) ** 1.5
place(sfx, wave, EV['wave0'], 'the ice wave sweeps over the frog (aggressive crystalline crackle)', -14)
place(sfx, rip(0.6, 0.5) * 0.6, EV['wave0'] + 0.1, None, -24)
place(sfx, shimmer(0.7, 7000, 2500), EV['wave0'] + 0.05, None, -26)
place(sfx, crackle(0.5, 200, 1500, 6000), EV['wave1'] - 0.15, 'the limbs lock (a crunch of ice)', -20)
# (1.43-1.9 s: silence under the voice; see the gate below)
for k, at in enumerate([1.92, 2.08, 2.3, 2.55]):
    place(sfx, tinkle(2400 + 300 * k, 0.6), at, 'ice crystals burst into the pericardium (glassy)' if k == 0 else None, -27)
place(sfx, crackle(1.6, 140, 2000, 8000), EV['wide0'], 'ice spreads through the body (a sweeping crackle)', -23)
place(sfx, swell(1.3, 40, 0.3), EV['wide0'], 'the window opens over the trunk (low swell)', -27)
place(sfx, power(0.9, 160, 60), EV['lungs0'], 'the lungs sag (a low exhale tone)', -28)
place(sfx, swell(0.9, 44, 0.5), EV['dive0'], 'dive into the tissue (low swell)', -24)
place(sfx, shimmer(0.7, 4600, 1500), EV['dive1'] - 0.4, 'into the cells (soft shimmer)', -31)
# the danger
for k in range(8):
    at = 5.3 + k * 0.2 + 0.05 * np.sin(k * 3.1)
    place(sfx, tinkle(2800 + 500 * ((k * 7) % 5), 0.5), at, 'ice plates grow between the cells (crystalline)' if k == 0 else None, -31 - (k % 3))
place(sfx, squelch(1.6, 180, 1100, 14), EV['water0'], 'water drawn out of the cells (quiet fluid movement)', -29)
spear = creak(1.1, 700, 45) * np.linspace(0.3, 1, int(1.1 * SR)) ** 1.5
place(sfx, spear, EV['spear0'], 'an ice spear drives into a cell (rising strained creak)', -24)
place(sfx, crackle(0.4, 260, 2500, 9000), EV['dent0'] + 0.5, 'the membrane dents (a sharp crunch)', -24)
place(sfx, creak(0.8, 230, 25), EV['crumple0'] + 0.4, 'the cell buckles (a soft strain)', -28)
# the sugar
place(sfx, swell(0.9, 46, -0.3), EV['out1a'], 'pull out to the trunk (low swell)', -26)
place(sfx, addm(swell(1.3, 55, 0.8) * 0.8, 0.3 * shimmer(1.3, 2600, 1200)), EV['sugar0'], 'the liver releases sugar (warm bloom)', -21)
flow = addm(fizz(2.4, 300) * 0.6, norm(lp(noise(int(2.4 * SR)), 400)) * 0.6) * np.linspace(0.4, 1, int(2.4 * SR)) ** 0.5
place(sfx, flow, 9.6, 'glucose flowing through the bloodstream (fluid rush with a fine fizz)', -28)
place(sfx, swell(0.8, 46, 0.5), EV['entry2a'], 'follow the sugar into the vessel', -25)
for k in range(12):
    at = EV['track1'] + k * 0.09 + 0.03 * np.sin(k * 2.3)
    place(sfx, plip() * 0.6, at, 'glucose passes the membrane (tiny soft ticks)' if k == 0 else None, -32 - (k % 3))
place(sfx, addm(chime(523.25, 1.3) * 0.6, chime(659.25, 1.3) * 0.4), EV['hold0'] + 0.35, 'the cell rounds out and holds (warm tones)', -27)
press = creak(1.2, 900, 60) * np.linspace(0.4, 1, int(1.2 * SR))
place(sfx, press, EV['spikes0'], 'ice needles press on the membrane (crystalline creak)', -28)
place(sfx, lock(0.14), EV['spikes1'] - 0.2, 'they stop dead at the membrane (a glassy halt)', -22)
# winter, days, spring
place(sfx, swell(1.3, 38, -0.4), EV['out2a'], 'out through the body to the winter scene', -22)
place(sfx, eerie(1.6), 14.7, 'winter (eerie cold cue)', -27)
place(sfx, addm(chime(392.0, 1.6) * 0.5, chime(587.33, 1.6) * 0.35), EV['spring0'], 'spring light (warm rising tones)', -28)
for k in range(10):
    place(sfx, plip(), 16.75 + k * 0.17 + 0.05 * np.sin(k * 1.7), 'meltwater drips' if k == 0 else None, -31 - (k % 3))
place(sfx, addm(crackle(0.9, 70, 1500, 6000), 0.5 * squelch(0.9, 300, 2000, 12)), EV['thaw0'], 'the frost on the frog melts (wet crackle, trickle)', -27)
place(sfx, bird(3900), 17.35, 'a bird, far off', -35)
place(sfx, swell(0.6, 44, 0.5), EV['heartIn0'], 'into the chest', -27)
place(sfx, addm(crackle(0.7, 60, 1500, 5000), 0.4 * squelch(0.7, 300, 1500, 10)), 18.5, 'the ice round the heart melts', -28)
# eyes, legs, the leap
place(sfx, addm(tick(0.02, 2600) * 0.5, 0.3 * squelch(0.12, 400, 2000, 40)), EV['eyes0'], 'the eyes open (a tiny wet click)', -29)
place(sfx, rustle(0.4, 900, 5000), 20.5, 'the legs stretch (leaves)', -29)
place(sfx, rustle(0.4, 900, 5000), EV['crouch0'], 'the crouch (leaves)', -28)
place(sfx, addm(rustle(0.4, 1200, 6000), 0.6 * thump(0.25, 90, 60)), EV['launch'], 'the leap: push-off (leaves, a soft push)', -20)
air = bp(noise(int(0.7 * SR)), 300, 2500) * np.sin(np.pi * np.linspace(0, 1, int(0.7 * SR))) ** 2
place(sfx, norm(air), EV['launch'] + 0.05, 'through the air toward us (one soft air movement)', -31)
place(sfx, rustle(0.6, 900, 4000), EV['land'], 'the landing (leaves)', -22)
place(sfx, thump(0.3, 80, 50), EV['land'], 'the landing (a light thud)', -21)
place(sfx, bird(4300), 22.2, 'a bird (the air lightens)', -33)
place(sfx, bird(3600), 22.7, None, -35)
cc = crackle(1.4, 70, 3000, 9500) * np.linspace(0, 1, int(1.4 * SR)) ** 2
place(sfx, cc, DUR - 1.4, 'the cold creeps back in (faint crackle, into frame 0)', -27)

# ---------------- beds (circular, so the end runs into the start)
wind = circ(lambda x: bp(x, 150, 1600), noise(N)) * (0.6 + 0.4 * circ(lambda x: lp(x, 0.6), noise(N)) / 0.05)
wind = norm(wind)
air = norm(circ(lambda x: bp(x, 500, 4000), noise(N)))
hiss = norm(circ(lambda x: hp(x, 3500), noise(N)))
drone_f = 55.0
drone = np.sin(2 * np.pi * drone_f * t) + 0.5 * np.sin(2 * np.pi * drone_f * 1.5 * t + 0.4) + 0.3 * np.sin(2 * np.pi * drone_f * 2.02 * t)
drone = norm(lp(drone, 400))
warm = np.sin(2 * np.pi * 220 * t) + 0.6 * np.sin(2 * np.pi * 277.18 * t) + 0.5 * np.sin(2 * np.pi * 329.63 * t)
warm = norm(lp(warm * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * t)), 1200))
inside_tone = norm(circ(lambda x: lp(x, 120), noise(N)))
spring = np.clip(1 - COLD, 0, 1) * (t > 12)
amb = (0.55 * wind * lp(EXT * (0.4 + 0.6 * COLD), 3) + 0.35 * air * lp(EXT * spring, 3) + 0.4 * hiss * lp(FALL, 3)
       + 0.5 * inside_tone * lp(1 - EXT, 3))
mus = 0.6 * drone * lp(np.clip(COLD, 0, 1) * (1 - 0.6 * np.clip(MIC, 0, 1)), 2) + 0.45 * warm * lp(spring * (t < 23.2), 2) + 0.35 * warm * lp(S('sugar') * (t < 14), 2)

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Frozen_Frog_narration_V1.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=3.0, att=0.004, rel=0.09):
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0; envl = np.empty(len(x)); ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]; envl[i] = e
    lev = 20 * np.log10(envl + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), float(gr.min())
def limit(x, ceil_db, look=0.004, rel=0.06):
    from scipy.ndimage import minimum_filter1d
    need = np.minimum(1.0, db(ceil_db) / (np.abs(x) + 1e-12))
    g = minimum_filter1d(need, size=int(look * SR) * 2 + 1)
    a = np.exp(-1 / (rel * SR)); out = np.empty_like(g); y = 1.0
    for i in range(len(g)):
        y = g[i] if g[i] < y else a * y + (1 - a) * g[i]; out[i] = y
    return x * np.minimum(out, minimum_filter1d(need, size=3))
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, grmin = compress(v0)
vc = limit(vc, -9.0)
vg = -16.0 - meter.integrated_loudness(vc)
voice = vc * db(vg)
venv = lp(np.abs(voice), 6); venv = venv / (venv.max() + 1e-9)
duck = 1 - 0.5 * np.clip(venv * 3, 0, 1)
cut0 = EV['cut']
gate = np.ones(N)
gate[(t >= cut0) & (t < 1.9)] = 0.0
ramp_in = (t >= 1.9) & (t < 2.3)
gate[ramp_in] = ((t[ramp_in] - 1.9) / 0.4) ** 2
i0 = int(cut0 * SR); gate[i0:i0 + int(0.006 * SR)] = np.linspace(1, 0, int(0.006 * SR))  # a 6 ms cut, no click
LOG.append({'t': round(cut0, 3), 'sfx': 'HARD CUT: forest, music and effects fall silent under the voice until 1.9 s', 'gain_db': 0})
sfx = sfx * gate; amb = amb * gate; mus = mus * gate
mix = voice + sfx * (1 - 0.22 * np.clip(venv * 3, 0, 1)) + db(-28) * amb * duck + db(-33) * norm(mus) * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix = limit(mix, -1.6)
# loop seam: a 4 ms ramp at the very end so the last sample continues into the first (no step at the wrap)
nr = int(0.004 * SR)
step = (mix[0] - (mix[1] - mix[0])) - mix[-1]
mix[-nr:] += step * np.linspace(0, 1, nr) ** 2
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Frozen_Frog_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG),
       'voice_lufs_in_mix': round(meter.integrated_loudness(voice * g), 2), 
       'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
