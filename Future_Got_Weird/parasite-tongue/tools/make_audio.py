#!/usr/bin/env python3
"""Effects and mix for FGW Short 1 "The parasite that replaces a tongue" (V2 picture). Everything under the voice is synthesised
here (no samples, no third-party music). The narration master is used sample for sample (gain and gentle dynamics).
Under it: underwater ambience (low water body, slow swells, sparse bubbles), a restrained unsettling bass texture that
thickens for the reveal, and wet organic effects placed from the picture's own events (audio/cues.json, exported from
story.ts): the wriggle, the legs gripping, the water through the gills, the crawl, the latch, the feeding pulses, the
withering, the gape, the snap on the shrimp, chewing, the swallow. One soft water-flow swell for the dive through the
gills; no whooshes on camera moves. Ambience and drone are periodic over the film so the loop has no seam.
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak (4x) below -1.5 dBTP.
usage: python3 tools/make_audio.py"""
import json, os
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
from scipy.ndimage import minimum_filter1d

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, C, W = cj['DUR'], cj['CUES'], cj['W']
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
def circ(f, x): return f(np.concatenate([x, x, x]))[len(x):2 * len(x)]
sfx = np.zeros(N)
def place(sig, at, name=None, gain_db=0.0, wrap=False):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    if wrap: idx %= N
    m = (idx >= 0) & (idx < N)
    sfx[idx[m]] += sig[m] * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})

# ---------------- generators
def squelch(dur=0.22, f0=900, f1=350, wet=1.0):
    """a wet tissue movement: a resonant sweep over filtered noise with a few tiny bubbles"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    x = noise(n)
    out = np.zeros(n); y1 = y2 = 0.0
    for k in range(n):
        w = 2 * np.pi * f[k] / SR; r = 0.985
        y = x[k] + 2 * r * np.cos(w) * y1 - r * r * y2
        y2, y1 = y1, y; out[k] = y
    out = bp(out, 150, 4000)
    pops = np.zeros(n)
    for _ in range(int(3 * wet)):
        i = rng.integers(0, max(1, n - 900)); m = 900; tm = np.arange(m) / SR
        fr = 700 + 1200 * rng.random()
        pops[i:i + m] += np.sin(2 * np.pi * fr * (1 + 2.5 * tm / (m / SR)) * tm) * np.exp(-tm / 0.006)
    return norm(norm(out) + 0.35 * pops * wet) * env(n, dur * 0.25, dur * 0.45)
def click(dur=0.03, f=3200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 1800) * np.exp(-tt / 0.0018) + 0.5 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def grip(dur=0.12):
    """claws hooking into tissue: a dull click with a short wet tail"""
    n = int(dur * SR); tt = np.arange(n) / SR
    c = np.zeros(n); c[:int(0.03 * SR)] = click(0.03, 2400)
    tail = bp(noise(n), 300, 1800) * np.exp(-tt / 0.03) * 0.5
    return norm(c + tail)
def bubble(f=None):
    f = f or (500 + 900 * rng.random())
    n = int(0.06 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * (1 + 3 * tt / 0.06) * tt) * np.exp(-tt / 0.012)
def flow(dur=1.0, lo=120, hi=1400):
    """water pushed through the gills: a soft filtered rush that rises and settles (not a whoosh)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = bp(noise(n), lo, hi) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * tt) ** 2)
    b = np.zeros(n)
    for _ in range(int(dur * 25)):
        i = rng.integers(0, n - 3000); s = bubble(); b[i:i + len(s)] += s * (0.2 + 0.6 * rng.random())
    return norm(lp(x, 2200) + 0.25 * b) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5
def thump(dur=0.18, f0=110, f1=55):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.05) + 0.3 * bp(noise(n), 200, 900) * np.exp(-tt / 0.02))
def gulp(dur=0.45):
    """the swallow: a low wet gulp with a pitch drop and a throat squeeze"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = 160 * (70 / 160) ** (tt / dur)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / dur) ** 0.8
    wet = squelch(dur, 600, 180, 0.6)
    return norm(0.8 * body + 0.6 * wet)
def suck(dur=0.3):
    """the feeding pulse: a small wet draw"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = bp(noise(n), 400, 2600) * np.sin(np.pi * tt / dur) ** 2
    return norm(x * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * tt)))
def creak(dur=1.0, f0=150, f1=60, grain=30):
    """tissue stretching and shrivelling: a slow descending creak"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    ph = np.cumsum(grain * (1 + 0.3 * np.sin(2 * np.pi * 2.3 * tt)) / SR)
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.5 + 0.5 * rng.random(n))
    res = np.zeros(n); y1 = y2 = 0.0
    for k in range(n):
        w = 2 * np.pi * f[k] / SR; r = 0.993
        y = pulses[k] + 2 * r * np.cos(w) * y1 - r * r * y2
        y2, y1 = y1, y; res[k] = y
    return norm(bp(res, 50, 1800)) * env(n, dur * 0.2, dur * 0.3)
def flick(dur=0.05):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), 2500, 8000) * np.exp(-tt / 0.006))

# ---------------- the picture's events (V2 timeline; times from audio/cues.json)
def rev(x): return x[::-1].copy()
def claws(t0, t1, every=0.11, gain=-37, name=None, f0=2400, wrap=False):
    tt = t0; first = True
    while tt < t1:
        place(click(0.02, f0 + 1600 * rng.random()), tt + 0.015 * rng.random(), name if first else None, gain - 3 * rng.random(), wrap=wrap); first = False
        tt += every * (0.8 + 0.4 * rng.random())
# 0-2 s: the mouth snaps open on the living parasite; it lifts its head (every 1.5 s) and re-grips in a wave
place(squelch(0.4, 520, 200, 0.9), C['open'], 'mouth snaps open (wet unstick)', -22)
place(thump(0.16, 140, 70), C['open'] + 0.03, None, -27)
for k in range(2):
    place(squelch(0.3, 1100, 420), 0.3 + 1.5 * k, 'head lifts (wet)' if k == 0 else None, -27)
claws(0.1, 2.0, 0.12, -36, 'claws re-grip in a wave')
place(flow(1.4, 120, 900), C['push'], 'water as the camera pushes into the mouth (one soft swell)', -32)
# 2-4 s: rewind: wet sounds played backwards under a soft rising reversed swell
place(rev(flow(2.0, 150, 1200)), C['rewind'], 'rewind: reversed water swell', -30)
for k in range(5):
    place(rev(squelch(0.35, 900 - 80 * k, 320)), C['rewind'] + 0.12 + 0.25 * k, 'tongue grows back (reversed squelches)' if k == 0 else None, -28)
claws(C['backOut'], C['rwEnd'], 0.05, -37, 'juvenile backs into the gills (fast claws)')
# 4-6.5 s: out between the gill arches, down the wall, across the floor, onto the tongue
place(squelch(0.35, 700, 300, 0.6), C['emerge'], 'squeezes out between the gill arches', -26)
claws(C['emerge'] + 0.2, C['latch'] - 0.05, 0.06, -36, 'claws on the gill wall, the floor, the tongue')
place(squelch(0.2, 800, 380, 0.4), C['floor'], 'drops onto the floor', -31)
place(squelch(0.25, 900, 400, 0.5), C['climb'], 'climbs onto the tongue', -29)
place(grip(0.16), C['latch'], 'latches onto the tongue', -21)
place(squelch(0.28, 900, 400), C['latch'] + 0.03, None, -27)
# 7-9.4 s: the bite, then wet draws on the blood pulse (0.75 s)
place(squelch(0.18, 1600, 700, 0.8), C['bite'], 'mouthparts pierce the tongue', -24)
tt0 = C['bite'] + 0.2; first = True
while tt0 < C['lapse'] + 0.35:
    place(suck(0.3), tt0, 'feeding pulses (with the blood pulse)' if first else None, -27); first = False
    tt0 += 0.75
# 9-11.5 s: time-lapse: the tongue shrivels; legs let go and re-grip as the body widens; three dim 'days'
place(creak(C['lapseEnd'] - C['lapse'], 150, 55, 26), C['lapse'], 'tongue withers (slow descending tissue creak)', -27)
claws(C['lapse'], C['lapseEnd'], 0.16, -36, 'legs re-grip as it grows')
for k in range(5):
    place(squelch(0.18, 600, 300, 0.4), C['lapse'] + 0.48 * k + 0.2, 'parasite grows (wet shifts)' if k == 0 else None, -33)
# 12-13.4 s: along the anchored legs
for k in range(5):
    place(grip(0.1), C['low'] + 0.3 * k, 'claws tighten in the stub' if k == 0 else None, -31)
place(creak(1.2, 110, 80, 22), C['low'], 'tissue strains under the claws', -33)
# 13.9-15.9 s: head-on inside: the mouth pumps (0.75 s), the parasite presses like a tongue
tt0 = C['out0'] + 0.1; first = True
while tt0 < C['exit']:
    place(squelch(0.4, 420, 180, 0.6), tt0, 'mouth pumps (wet)' if first else None, -30); first = False
    tt0 += 0.75
for at in (14.65, 15.6):
    place(squelch(0.3, 1000, 420, 0.7), at, 'parasite presses (segments flex)', -28)
place(flow(1.2, 120, 900), C['exit'], 'water past the lips as the camera backs out', -33)
# the meal
tt0 = C['foodIn']; first = True
while tt0 < C['snap'] - 0.1:
    place(flick(0.035), tt0, 'shrimp flicks' if first else None, -38); first = False
    tt0 += 0.16 + 0.05 * rng.random()
place(thump(0.2, 120, 60), C['snap'], 'jaws snap shut', -17)
place(squelch(0.25, 1000, 350), C['snap'] + 0.02, None, -25)
place(squelch(0.3, 700, 260), C['chew1'], 'chewing', -27)
place(squelch(0.3, 650, 240), C['chew2'], None, -27)
place(squelch(0.4, 900, 300, 0.8), 19.2, 'the parasite pushes the food back', -29)
place(gulp(0.5), C['swallow'], 'swallow', -19)
place(squelch(0.45, 450, 200, 0.6), C['reopen'], 'jaws unstick and reopen', -28)
# 20.9-22.4 s: the parasite rears up at the camera
place(squelch(0.9, 300, 140, 0.8), C['rear'] + 0.1, 'parasite rears up (slow wet stretch)', -24)
claws(C['rear'], 22.4, 0.08, -34, 'legs flex as it rears')
# 22.6-24 s: the mouth eases half shut; the re-grip wave carries round into frame 0
place(squelch(0.8, 380, 170, 0.5), C['close'], 'mouth eases half shut', -29)
claws(22.6, DUR + 0.1, 0.12, -36, 'claws re-grip (into the loop)', wrap=True)
place(flow(1.6, 100, 900), 21.45, 'the fish breathes (water over the gills)', -32)

# ---------------- beds (periodic over DUR: no seam at the loop)
water = circ(lambda x: lp(hp(x, 30), 380), noise(N))
water = water * (0.7 + 0.3 * np.sin(2 * np.pi * t / (DUR / 4)))
hiss = circ(lambda x: bp(x, 900, 3500), noise(N)) * (0.5 + 0.5 * np.sin(2 * np.pi * t / (DUR / 6) + 1) ** 2)
bub = np.zeros(N)
for k in range(28):
    at = rng.random() * DUR; s = bubble(); idx = (np.arange(len(s)) + int(at * SR)) % N; bub[idx] += s * (0.3 + 0.7 * rng.random())
amb = 0.75 * norm(water) + 0.12 * norm(hiss) + 0.1 * norm(bub)
def drone(freqs):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        # frequencies rounded to whole cycles over DUR so the bed loops without a click
        f = round(f * DUR) / DUR
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * (k + 1) * t / DUR + k)
        out += a * lfo * (np.sin(2 * np.pi * f * t) + 0.1 * np.sin(2 * np.pi * 2 * f * t))
    return circ(lambda x: lp(x, 500), out)
bass_a = drone([(43.0, 0.55), (46.0, 0.25), (86.1, 0.18), (129.0, 0.06), (91.6, 0.05)])
bass_b = drone([(38.8, 0.6), (41.2, 0.3), (77.6, 0.16), (82.4, 0.12), (116.5, 0.06)])
def win(a, b, fa=0.4, fb=0.4): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
reveal = win(W['but'], 18.2, 0.8, 1.2)
# a slow swell under the loop push, wrapping round into the hook
swell = np.clip(np.maximum(win(22.6, DUR + 1, 1.0, 0.01), win(-1, 0.4, 0.01, 0.6)), 0, 1)
bed = (norm(bass_a) * (1 - 0.6 * reveal) + norm(bass_b) * reveal * 1.3) * (1 + 0.8 * swell)

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Parasite_Tongue_narration.wav'))
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
# keep effects and beds beneath the narration: duck them under the voice's envelope
venv = lp(np.abs(voice), 6); venv = venv / (venv.max() + 1e-9)
duck = 1 - 0.5 * np.clip(venv * 3, 0, 1)
mix = voice + sfx * (0.55 + 0.45 * duck) + db(-27) * amb * duck + db(-27) * bed * (0.6 + 0.4 * duck)
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix2 = np.stack([mix, mix], 1)
out_pub = os.path.join(EP, 'source/public/audio/mix.wav')
os.makedirs(os.path.dirname(out_pub), exist_ok=True)
sf.write(out_pub, mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, 'audio/mix/FGW_Parasite_Tongue_mix.wav'), mix2, SR, subtype='PCM_24')
# levels: effects vs voice where the voice speaks (they must stay beneath it)
sp = venv > 0.15
fx_part = (sfx * (0.55 + 0.45 * duck) + db(-27) * amb * duck + db(-27) * bed * (0.6 + 0.4 * duck)) * g
vo_part = voice * g
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2),
       'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2), 'voice_gain_db': round(vg + 20 * np.log10(g), 2),
       'voice_max_gain_reduction_db': round(grmin, 2), 'under_voice_rms_db': {'voice': round(rms_db(vo_part[sp]), 2), 'effects_and_beds': round(rms_db(fx_part[sp]), 2)},
       'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'duration_s': DUR, 'effects': len(LOG)}
json.dump(res, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, 'audio/sfx_log.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
