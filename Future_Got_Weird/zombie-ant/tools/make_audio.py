#!/usr/bin/env python3
"""Effects and mix for FGW "Zombie Ant" V1. Everything here is synthesised (no samples, no third-party music).
The narration master (audio/narration/FGW_Zombie_Ant_narration_V1.wav) is used sample for sample (gain only).
Under it: a quiet forest ambience (soft leaf air, distant insects), a low uneasy pad that thickens for the final
reveal, and restrained effects placed from the picture's own events (audio/cues.json, exported from story.ts):
the mandible contact, leaf creaks, the fungal growth, the spore puffs, the landing ticks, small footsteps.
No whooshes on camera moves, no impacts, no cartoon sounds.
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; sample ceiling -1.5 dBFS (true peak measured 4x).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)
Outputs: source/public/audio/<mix>.wav, audio/mix/FGW_Zombie_Ant_V1_mix.wav, audio/mix/mix_measure.json, audio/sfx_log.json"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, TM, EV = cj['DUR'], cj['TM'], cj['EV']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(1729)
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
def place(buf, sig, at, name=None, gain_db=0.0):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    m = (idx >= 0) & (idx < N)
    buf[idx[m]] += sig[m] * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)

# ---------------- effect generators ----------------
def click(dur=0.05, f=2300, bright=5200):
    """a hard chitin contact: a sharp transient and a tiny resonant body"""
    n = int(dur * SR); tt = np.arange(n) / SR
    tr = hp(noise(n), 2500) * np.exp(-tt / 0.0025)
    body = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.012) + 0.5 * np.sin(2 * np.pi * f * 1.73 * tt) * np.exp(-tt / 0.007)
    ring_ = bp(noise(n), bright * 0.8, bright * 1.25) * np.exp(-tt / 0.02)
    return norm(0.9 * tr + 0.6 * body + 0.35 * ring_)
def creak(dur=0.4, f0=180, f1=120, grain=55):
    """a soft plant-tissue creak: a pulse train through a resonance"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 + (f1 - f0) * tt / dur
    ph = np.cumsum(grain * (1 + 0.3 * np.sin(2 * np.pi * 3 * tt)) / SR)
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.5 + 0.5 * rng.random(n))
    res = np.zeros(n)
    y1 = y2 = 0.0
    for k in range(n):
        w = 2 * np.pi * f[k] / SR; r = 0.995
        y = pulses[k] + 2 * r * np.cos(w) * y1 - r * r * y2
        y2, y1 = y1, y
        res[k] = y
    return norm(bp(res, 80, 2500)) * env(n, dur * 0.25, dur * 0.4)
def rustle(dur=0.5, lo=1500, hi=7000):
    n = int(dur * SR)
    g = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n)
    x = bp(noise(n) * 0.3 + lp(g, 9000) * 2.0, lo, hi)
    return norm(x) * env(n, dur * 0.3, dur * 0.5)
def puff(dur=0.18, lo=300, hi=2400):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), lo, hi) * np.exp(-tt / (dur * 0.3)) * env(n, 0.004, dur * 0.6))
def tick(dur=0.03, f=4200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 3000) * np.exp(-tt / 0.0015) + 0.4 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def growth(dur=1.0, f0=90, f1=260):
    """fungal growth in time-lapse: a slow wet stretching creak with tiny crackles, rising"""
    n = int(dur * SR); tt = np.arange(n) / SR
    base = creak(dur, f0, f1, grain=38)
    crack = np.zeros(n)
    for _ in range(int(dur * 40)):
        i = rng.integers(0, n - 400)
        crack[i:i + 400] += tick(400 / SR, 3000 + 2500 * rng.random())[:400] * (0.3 + 0.7 * rng.random())
    wet = bp(noise(n), 400, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.3 * tt)) * 0.25
    return norm(0.8 * base + 0.25 * crack + wet) * env(n, dur * 0.3, dur * 0.25)
def shimmer(dur=1.0, f0=6000, f1=2500):
    """the microscopic world: a faint airy descending shimmer (not a whoosh)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(5):
        f = f0 * (f1 / f0) ** (tt / dur) * (1 + 0.013 * k)
        x += np.sin(2 * np.pi * np.cumsum(f) / SR + k) * (0.5 + 0.5 * np.sin(2 * np.pi * (2 + k) * tt))
    return norm(x) * env(n, dur * 0.35, dur * 0.45)
def step():
    n = int(0.018 * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), 2500, 9000) * np.exp(-tt / 0.002))

def crackle(dur=0.5, density=60, lo=2500, hi=9000):
    """tiny dry crackles (the cuticle giving way, fungal tissue pushing through)"""
    n = int(dur * SR); x = np.zeros(n)
    for _ in range(int(dur * density)):
        i = rng.integers(0, max(1, n - 300))
        x[i:i + 300] += tick(300 / SR, 2500 + 4000 * rng.random())[:300] * (0.2 + 0.8 * rng.random())
    return norm(bp(x, lo, hi) + 1e-9) * env(n, dur * 0.2, dur * 0.3)
def creep(dur=2.0):
    """the network spreading inside the body: a slow, low, wet organic texture"""
    n = int(dur * SR); tt = np.arange(n) / SR
    base = bp(noise(n), 120, 700) * (0.55 + 0.45 * np.sin(2 * np.pi * 1.7 * tt + 1) * np.sin(2 * np.pi * 0.6 * tt))
    gl = creak(dur, 70, 140, grain=22) * 0.6
    return norm(base + gl) * env(n, dur * 0.3, dur * 0.3)
def spasm():
    """a muscle jerking under the fungus's control: a short low thump and a leg scrape"""
    n = int(0.16 * SR); tt = np.arange(n) / SR
    th = np.sin(2 * np.pi * (95 - 40 * tt / 0.16) * tt) * np.exp(-tt / 0.04)
    sc = bp(noise(n), 1800, 6000) * np.exp(-tt / 0.03) * 0.4
    return norm(th + sc)
def pop(dur=0.12, f=600):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * (1 - 0.5 * tt / dur) * tt) * np.exp(-tt / 0.025) + 0.4 * bp(noise(n), 800, 3000) * np.exp(-tt / 0.01))
def steps(t0, t1, every=0.075, gain=-40, name=None):
    k = 0
    tt = t0
    while tt < t1:
        place(sfx, step(), tt + 0.012 * rng.random(), name if k == 0 else None, gain - (0 if k % 3 else 3))
        tt += every * (0.85 + 0.3 * rng.random()); k += 1

sfx = np.zeros(N)
E = EV.get
# hook: legs grip, jaws meet the vein, the leaf flexes, the body swings down
if E('grip') is not None:
    place(sfx, rustle(0.35, 2500, 8000), max(0, E('grip')), 'leg grip rustle', -30)
if E('contact1') is not None:
    place(sfx, click(0.06, 2100, 5600), E('contact1') - 0.004, 'mandible contact', -13)
    place(sfx, creak(0.32, 230, 150, 70), E('contact1') + 0.01, 'leaf flex creak', -27)
if E('swing1') is not None:
    place(sfx, creak(0.45, 150, 95, 40), E('swing1'), 'leaf sag under the hanging ant', -30)
if E('grow1a') is not None:
    d = E('grow1b') - E('grow1a') + 0.25
    place(sfx, growth(d, 90, 300), E('grow1a'), 'stalk growth (time-lapse)', -24)
if E('open1') is not None:
    for k in range(5):
        place(sfx, puff(0.12 + 0.03 * k, 500, 3000), E('open1') + 0.06 + k * 0.07, 'spore puff' if k == 0 else None, -30 - 2 * k)
if E('spore1') is not None and E('land1') is not None:
    place(sfx, shimmer(E('land1') - E('spore1') + 0.1, 7000, 2600), E('spore1'), 'spore descent shimmer', -36)
    place(sfx, tick(0.03, 3600), E('land1'), 'spore lands', -27)
if E('walk2a') is not None:
    for k in range(18):
        place(sfx, step(), E('walk2a') + 1.0 + k * 0.085 + 0.01 * rng.random(), 'ant steps' if k == 0 else None, -40 - (0 if k % 3 else 3))

# the infection: the germ tube pierces the cuticle, the network creeps through, the muscles jerk
if E('germ') is not None:
    place(sfx, crackle(0.5, 70, 2000, 7000), E('germ'), 'germ tube pierces the cuticle', -30)
if E('spread0') is not None:
    place(sfx, creep(E('spread1') - E('spread0')), E('spread0'), 'network spreading (organic creep)', -27)
for k in range(4):
    if E(f'spasm{k}') is not None:
        place(sfx, spasm(), E(f'spasm{k}') - 0.02, 'muscle spasm' if k == 0 else None, -22 if k == 2 else -27)
# the compelled walk and the climb
if E('walk2b0') is not None:
    steps(E('walk2b0') + 0.15, E('walk2b1'), 0.07, -40, 'steps (walk and climb)')
    place(sfx, rustle(0.3, 2000, 7000), E('onLeaf'), 'onto the leaf', -32)
# the death grip
if E('contact2') is not None:
    place(sfx, click(0.06, 2000, 5400), E('contact2') - 0.004, 'mandible contact (death grip)', -13)
    place(sfx, creak(0.32, 220, 140, 70), E('contact2') + 0.01, 'leaf flex creak', -26)
    place(sfx, creak(0.5, 160, 120, 45), E('hard'), 'the grip tightens (leaf creak)', -30)
    place(sfx, rustle(0.35, 1500, 6000), E('release'), 'legs let go', -30)
    place(sfx, creak(0.5, 140, 90, 38), E('release') + 0.08, 'leaf sags under the hanging ant', -27)
# after death: mycelium breaks out, the stalk pushes out and grows over days, the cushion opens, spores go
if E('teth0') is not None:
    place(sfx, crackle(1.6, 30, 1500, 6000), E('teth0'), 'mycelium breaking out of the joints', -31)
    place(sfx, pop(0.14, 420), E('bud'), 'stalk bud', -26)
if E('grow2a') is not None:
    place(sfx, growth(E('grow2b') - E('grow2a'), 70, 240), E('grow2a'), 'stalk growth (time-lapse)', -24)
if E('open2') is not None:
    place(sfx, pop(0.1, 700), E('open2'), 'the cushion opens', -27)
    place(sfx, crackle(0.4, 40, 3000, 9000), E('open2') + 0.05, None, -33)
if E('spore2') is not None:
    for k in range(7):
        place(sfx, puff(0.12 + 0.02 * k, 500, 3200), E('spore2') + k * 0.16, 'spore puffs' if k == 0 else None, -30 - 1.5 * (k % 3))
    place(sfx, shimmer(E('land3') - E('hero2') + 0.1, 6500, 2400), E('hero2'), 'spore descent shimmer', -36)
    place(sfx, tick(0.03, 3600), E('land3'), 'spore lands on an ant below', -27)
    steps(E('ants3'), E('land3') + 0.5, 0.08, -42, 'ants below')
if E('reveal') is not None:
    place(sfx, rustle(2.6, 600, 3000) * 0.6, E('reveal') - 0.3, 'leaves around the graveyard', -34)
if E('lens') is not None:
    place(sfx, rustle(0.4, 700, 5000), E('lens'), 'leaf brushes past the lens', -30)

# ---------------- beds ----------------
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
air = circ(lambda x: lp(hp(x, 120), 1800), noise(N)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t + 1))
leaves_air = circ(lambda x: bp(x, 2500, 6500), noise(N)) * (0.4 + 0.6 * np.clip(np.sin(2 * np.pi * 0.07 * t) * 1.5, 0, 1))
insects = np.zeros(N)
for k in range(9):
    t0 = 1.5 + k * 3.2 + rng.random()
    if t0 > DUR - 1: break
    d = 0.6 + 0.5 * rng.random(); n = int(d * SR); tt = np.arange(n) / SR
    f = 4800 + 900 * rng.random()
    s = np.sin(2 * np.pi * f * tt) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (28 + 8 * rng.random()) * tt))) * env(n, 0.08, 0.2)
    place(insects, s, t0)
amb = 0.5 * norm(air) + 0.18 * norm(leaves_air) + 0.06 * norm(insects + 1e-9)
# a low uneasy pad (A minor with a flat second), quiet; thicker and lower for the final reveal
def pad(freqs):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * (0.07 + 0.02 * k) * t + k)
        out += a * lfo * (np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * f * 2.005 * t))
    return circ(lambda x: lp(x, 900), out)
pad_a = pad([(55.0, 0.5), (110.0, 0.3), (130.81, 0.16), (164.81, 0.1), (116.54, 0.05)])
pad_b = pad([(41.2, 0.55), (82.41, 0.32), (87.31, 0.14), (123.47, 0.12), (61.74, 0.1)])
reveal = win(TM['beneath'] - 0.3, DUR, 0.8, 0.01)
bed = norm(pad_a) * (1 - 0.6 * reveal) + norm(pad_b) * reveal * 1.25

# ---------------- voice and mix ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Zombie_Ant_narration_V1.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=3.0, att=0.004, rel=0.09):
    """a gentle feed-forward compressor (peak envelope), to bring the voice's peaks closer to its body"""
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0
    envl = np.empty(len(x))
    ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]
        envl[i] = e
    lev = 20 * np.log10(envl + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), float(gr.min())
def limit(x, ceil_db, look=0.004, rel=0.06):
    """a look-ahead peak limiter: the gain needed to keep every sample under the ceiling, held over the look-ahead
    window and released smoothly"""
    from scipy.ndimage import minimum_filter1d
    need = np.minimum(1.0, db(ceil_db) / (np.abs(x) + 1e-12))
    g = minimum_filter1d(need, size=int(look * SR) * 2 + 1)
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g); y = 1.0
    for i in range(len(g)):
        y = g[i] if g[i] < y else a * y + (1 - a) * g[i]
        out[i] = y
    out = np.minimum(out, minimum_filter1d(need, size=3))
    return x * out
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, grmin = compress(v0)
vc = limit(vc, -9.0)
vg = -16.0 - meter.integrated_loudness(vc)
voice = vc * db(vg)
# duck the beds under the voice (smoothed envelope)
venv = lp(np.abs(voice), 6)
venv = venv / (venv.max() + 1e-9)
duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
mix = voice + sfx + db(-33) * amb * duck + db(-36) * bed * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, 'audio/mix/FGW_Zombie_Ant_V1_mix.wav'), mix2, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG)}
json.dump(res, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, 'audio/sfx_log.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
