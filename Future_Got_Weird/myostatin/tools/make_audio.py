#!/usr/bin/env python3
"""Effects, music bed and mix for the Myostatin Short. Everything is synthesised here (no samples, no third-party
music). The narration master is used sample for sample (gain, a gentle compressor and a limiter only).

Effects are placed from the picture's own events and signals (audio/cues.json, exported from story.ts):
  hook: a deep organic swelling that follows the arm's mass m(t), fabric straining, the seam's stitches popping, the
        tearing fabric, a sub impact as the split opens, the flex, the wet slice of the cutaway;
  micro: low cellular pulses, the granular crackle of each myofibril zipping in (from q(t)), a soft lock as each
        myostatin docks, a tiny electrical blip for each signal running to the nucleus, a low power-down on "brake";
  bull: pasture air, a snort, soft rising tones as the extra muscle lights up, a deep hoof plant with dirt;
  lab: room tone, a pipette click and the drop; antibodies clicking shut on myostatin; assembly powering back up;
  twist: a short eerie cue before "weird", dumbbell iron creak and tremble, the strain, the clunk as it settles;
  payoff: cloth as the arm comes up, the flex, and a swell that runs into frame 0's swell for the loop.
Music: a quiet rhythmic pulse (sub bass, filtered pluck, soft ticks, a pad) whose period divides the film length
exactly, so the end flows into the start. No drops. It ducks under the voice and thins out for the twist.
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
M = np.array(cj['m']); Q = np.array(cj['q']); WORLD = cj['world']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(1207)
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

sfx = np.zeros(N)
E = EV.get
# ---- hook: swelling that follows the mass, the sleeve strains, stitches pop, the fabric tears, a sub hit
mrate = np.clip(np.gradient(sig100(M)) * SR, 0, None)
sw = swell(1.25, 44, 1.2)
place(sfx, sw * (0.45 + 0.55 * np.clip(mrate[:len(sw)] / (mrate[:len(sw)].max() + 1e-9), 0, 1)), 0.0, 'organic muscle swelling (follows the mass)', -15)
place(sfx, squelch(1.0, 160, 900, 22), 0.0, 'wet tissue stretch', -27)
place(sfx, fabric_strain(0.55), E('tear0') - 0.5, 'fabric straining', -25)
for i, dt_ in enumerate([0.0, 0.05, 0.11, 0.16, 0.24, 0.3]):
    place(sfx, tick(0.02, 2600 + 700 * (i % 3)), E('tear0') + dt_, 'seam stitches popping' if i == 0 else None, -17 - (i % 2) * 3)
place(sfx, rip(0.42, 1.0), E('tear0') + 0.02, 'fabric tears along the seam', -15)
place(sfx, rip(0.32, 1.3), E('tear1') - 0.02, 'the split runs further', -16)
place(sfx, thump(0.6, 66, 32), E('tear1') - 0.01, 'subtle bass impact', -14)
place(sfx, creak(0.35, 130, 40), E('flex') - 0.05, 'the flex (muscle creak)', -25)
place(sfx, squelch(0.28, 300, 2200, 40), E('cut0'), 'the cutaway opens (wet slice)', -23)
place(sfx, shimmer(0.75, 5200, 1500), E('dive0'), 'into the muscle (microscopic shimmer)', -29)
place(sfx, swell(0.7, 38, -0.4), E('dive0') + 0.1, 'into the muscle (low)', -24)
# ---- micro: cellular pulse bed in every micro view, assembly crackle, docking, signals, the brake
micro = np.array([1.0 if w == 'micro' else 0.0 for w in WORLD])
mic = lp(sig100(micro), 6)
pulse = np.zeros(N)
for k in range(int(DUR * 1.3)):
    place(pulse, thump(0.35, 62, 40), k / 1.3 + 0.05)
qa = sig100(Q)
dq = np.clip(np.gradient(qa) * SR, 0, None)
zip_ = crackle(DUR, 80, 1800, 7000) * np.clip(dq / 4.0, 0, 1) * mic
place(sfx, zip_, 0.0, 'myofibrils zipping in (crackle follows the growth)', -22)
# row completions: a soft click each time a new myofibril finishes
rows = np.floor(Q)
for i in range(1, len(rows)):
    if rows[i] > rows[i - 1] and micro[i] > 0.5:
        place(sfx, lock(0.08), i / 100, 'myofibril completes' if not any(l['sfx'] == 'myofibril completes' for l in LOG) else None, -27)
docks = [T['myoEnd'] - 0.02, T['myoEnd'] + 0.22, T['acts'] + 0.05, T['brake'] - 0.12]
for i, td in enumerate(docks):
    place(sfx, lock(), td, 'myostatin docks in its receptor' if i == 0 else None, -19)
    for k in range(3):
        place(sfx, blip(2600 - 300 * k, 800, 0.09), td + 0.06 + 0.1 * k, 'signal runs to the nucleus (electrical blip)' if i == 0 and k == 0 else None, -27)
place(sfx, power(0.7, 360, 70), T['brake'] - 0.02, 'the brake: assembly powers down', -19)
place(sfx, squelch(0.44, 250, 1400, 26), E('wipe1'), 'collagen sheet passes the lens', -27)
place(sfx, squelch(0.3, 250, 1400, 26), E('wipe2'), 'collagen sheet passes the lens (2)', -28)
place(sfx, shimmer(1.0, 1500, 5200), E('bullOut0'), 'out of the muscle (rising shimmer)', -29)
# ---- bull
place(sfx, snort(0.45), E('bullOut1') + 0.25, 'the bull snorts', -27)
for i, (k, f) in enumerate([('s', 392.0), ('b', 440.0), ('h', 523.3)]):
    tk = {'s': 10.22, 'b': 10.6, 'h': T['freak'] + 0.1}[k]
    place(sfx, chime(f, 0.9), tk, 'extra muscle lights up (soft tone)' if i == 0 else None, -30)
place(sfx, rustle(0.35, 600, 3000), E('step0'), 'the hoof lifts', -30)
place(sfx, hoof(), E('plant') - 0.01, 'deep bovine footstep', -12)
place(sfx, creak(0.4, 95, 30), E('plant') + 0.02, 'shoulder muscles load', -24)
place(sfx, squelch(0.4, 200, 1200, 30), E('bullIn0') + 0.15, 'into the shoulder', -26)
place(sfx, shimmer(0.48, 5200, 1500), E('bullIn0'), 'into the shoulder (shimmer)', -30)
# ---- lab
place(sfx, shimmer(0.6, 1500, 4800), E('labOut0'), 'out to the lab', -31)
place(sfx, tick(0.03, 3100), E('press'), 'pipette plunger click', -20)
place(sfx, plip(), E('dropLand') - 0.01, 'the drop lands', -21)
place(sfx, shimmer(0.5, 5200, 1500), E('labIn0') + 0.05, 'into the sample', -30)
for i, tc in enumerate([E('catch1'), E('catch2'), E('catch3')]):
    place(sfx, lock(0.1), tc, 'antibody clamps a myostatin' if i == 0 else None, -18 if i == 1 else -21)
place(sfx, power(0.5, 90, 380), E('release'), 'assembly powers back up', -22)
# ---- the speculative arm, the twist, the curl
place(sfx, chime(659.3, 1.2) * 0.6 + chime(987.8, 1.2) * 0.4, E('cutX'), 'speculative view (glassy tone)', -29)
place(sfx, creak(0.9, 110, 28), E('cutX') + 0.1, 'fibres thickening', -27)
place(sfx, eerie(1.0), T['weird'] - 0.32, 'eerie cue before the twist', -18)
place(sfx, iron_creak(0.6), E('curl0'), 'dumbbell tension', -22)
place(sfx, rattle(0.7, 14), E('curl0') + 0.2, 'the weight trembles just off the floor', -26)
place(sfx, creak(0.7, 120, 46), E('curl0'), 'the biceps strains', -24)
place(sfx, squelch(0.3, 280, 1800, 30), E('elbowIn0') + 0.22, 'the elbow cutaway opens', -26)
for k in range(3):
    place(sfx, thump(0.3, 80, 45), E('elbowIn1') + k / 1.4, 'contraction pulse' if k == 0 else None, -22)
    place(sfx, creak(0.25, 300, 60), E('elbowIn1') + k / 1.4 + 0.02, None, -28)
place(sfx, clunk(), E('setDown1') - 0.04, 'the dumbbell settles back on the floor', -15)
place(sfx, rustle(0.55, 900, 5000), E('raise0') + 0.05, 'the arm comes up (cloth)', -27)
place(sfx, creak(0.4, 125, 40), E('flexPulse') - 0.15, 'the flex', -24)
# the swell into the loop: the same swell that opens the film, so the seam is one movement
tail = swell(0.8, 44, 0.6)
place(sfx, tail * np.linspace(0, 1, len(tail)) ** 1.5, DUR - 0.8, 'swell into the loop', -17)

# ---------------- music: a quiet rhythmic pulse, period dividing the film exactly
BEATS = 40
bpm = 60 * BEATS / DUR
beat = 60 / bpm
mus = np.zeros(N)
def pluck(f, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, 6))
    return lp(x, 1800) * np.exp(-tt / 0.12)
bassline = [55.0, 55.0, 65.41, 55.0, 49.0, 49.0, 58.27, 49.0]
arp = [440.0, 523.25, 659.25, 523.25, 392.0, 466.16, 587.33, 466.16]
for k in range(BEATS * 2):
    at = k * beat / 2
    b = bassline[(k // 4) % 8]
    n = int(beat / 2 * SR); tt = np.arange(n) / SR
    place(mus, np.sin(2 * np.pi * b * tt) * np.exp(-tt / 0.22) * 0.9, at)
    if k % 2 == 1:
        place(mus, hp(noise(int(0.04 * SR)), 6000) * np.exp(-np.arange(int(0.04 * SR)) / SR / 0.008) * 0.12, at)
    if k % 2 == 0:
        place(mus, pluck(arp[(k // 2) % 8], beat * 0.9) * 0.18, at)
padv = np.zeros(N)
for f, a in [(110.0, 0.4), (164.8, 0.25), (220.0, 0.18), (261.6, 0.12)]:
    padv += a * np.sin(2 * np.pi * f * t + 2 * np.sin(2 * np.pi * 0.13 * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * (DUR and 1 / DUR) * 2 * t))
mus += lp(padv, 900) * 0.35
# wrap the tail of the music into the start so the loop is continuous
tailN = int(0.6 * SR)
mus_ext = np.zeros(N + tailN)
mus_ext[:N] = mus
mus[:tailN] += 0  # (the pattern is already periodic; place() truncated at N, so add the overhang of notes back at 0)
over = np.zeros(tailN)
for k in range(BEATS * 2 - 2, BEATS * 2):
    at = k * beat / 2
    n = int(beat / 2 * SR); tt = np.arange(n) / SR
    s0 = int(round(at * SR))
    sig = np.sin(2 * np.pi * bassline[(k // 4) % 8] * tt) * np.exp(-tt / 0.22) * 0.9
    end = s0 + n
    if end > N: over[:end - N] += sig[N - s0:]
mus[:tailN] += over
# the twist thins the music: it drops out under the eerie cue and comes back softer
mshape = 1 - 0.85 * np.clip((t - (T['weird'] - 0.35)) / 0.2, 0, 1) * (1 - np.clip((t - (T['bigger2'] + 0.1)) / 0.6, 0, 1))
mshape *= 1 - 0.25 * np.clip((t - T['bigger2']) / 0.5, 0, 1) * (1 - np.clip((t - T['so']) / 0.5, 0, 1))
mus *= mshape

# ---------------- beds
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
roomA = circ(lambda x: lp(hp(x, 60), 500), noise(N))
air = circ(lambda x: bp(x, 400, 3000), noise(N))
gym = (np.array([1.0 if w == 'arm' else 0.0 for w in WORLD]))
past = (np.array([1.0 if w == 'bull' else 0.0 for w in WORLD]))
labw = (np.array([1.0 if w == 'lab' else 0.0 for w in WORLD]))
hum = np.sin(2 * np.pi * 120 * t) * 0.3 + np.sin(2 * np.pi * 240 * t) * 0.1
amb = (0.5 * norm(roomA) * lp(sig100(gym), 4) + 0.55 * norm(air) * lp(sig100(past), 4) + (0.4 * norm(roomA) + 0.2 * hum) * lp(sig100(labw), 4)
       + 0.6 * norm(lp(pulse, 300)) * mic)

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Myostatin_narration_V1.wav'))
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
mix = voice + sfx * (1 - 0.22 * np.clip(venv * 3, 0, 1)) + db(-30) * amb * duck + db(-29) * norm(mus) * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix = limit(mix, -1.6)
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Myostatin_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG),
       'voice_lufs_in_mix': round(meter.integrated_loudness(voice * g), 2), 'music_bpm': round(bpm, 2), 'music_beats': BEATS,
       'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
