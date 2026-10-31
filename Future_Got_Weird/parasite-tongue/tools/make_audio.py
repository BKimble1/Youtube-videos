#!/usr/bin/env python3
"""Effects and mix for FGW Short 1 "The parasite that replaces a tongue". Everything under the voice is synthesised
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

# ---------------- the picture's events
# the hook: the "tongue" wriggles (periodic with the motion, 0.75 s), wrapped so the loop's last frames match the first
for k in range(4):
    place(squelch(0.26, 950, 380), (k * 0.75 - 0.08) % DUR, 'tongue wriggle' if k == 0 else None, -26 - 2 * k, wrap=True)
place(squelch(0.3, 1300, 420), C['reveal'], 'segments separate', -24)
for k in range(7):
    place(grip(), C['legsGrip'] + 0.025 * k + 0.01 * rng.random(), 'seven pairs of claws grip' if k == 0 else None, -30 - (k % 3))
place(squelch(0.5, 500, 220, 0.5), C['pullBack'] + 0.1, 'jaw flex as the mouth gapes', -32)
place(flow(1.05, 140, 1500), C['dive'] - 0.05, 'water drawn through the gills (one soft swell)', -25)
for k in range(6):
    place(bubble(), C['out'] + 0.08 * k + 0.05 * rng.random(), 'bubbles out of the gill opening' if k == 0 else None, -34)
# the juvenile: tiny pleopod beats while it swims, then the crawl over the gill arches
tt0 = C['juvSwim']
while tt0 < W['crawls']:
    place(flick(0.04), tt0, 'juvenile swims (pleopod beats)' if tt0 == C['juvSwim'] else None, -40)
    tt0 += 0.11 + 0.04 * rng.random()
place(squelch(0.35, 700, 300, 0.6), C['underCover'] + 0.05, 'slips under the gill cover', -29)
tt0 = C['underCover'] + 0.3; first = True
while tt0 < W['tongue2'] - 0.05:
    place(click(0.02, 2800 + 1500 * rng.random()), tt0, 'claws on the gill arches' if first else None, -38 - 3 * rng.random()); first = False
    tt0 += 0.055 + 0.03 * rng.random()
place(grip(0.16), W['tongue2'], 'latches onto the tongue', -22)
place(squelch(0.28, 900, 400), W['tongue2'] + 0.03, None, -28)
# feeding: wet draws on the blood pulse (0.75 s), from "starts" to the start of the time-lapse
tt0 = W['starts'] - 0.05; first = True
while tt0 < C['lapse'] + 0.4:
    place(suck(0.3), tt0, 'feeding pulses (with the blood pulse)' if first else None, -27); first = False
    tt0 += 0.75
# the time-lapse: the tongue shrivels (descending creak) under a faster breathing of the water
place(creak(C['lapseEnd'] - C['lapse'], 150, 55, 26), C['lapse'], 'tongue withers (slow descending tissue creak)', -27)
for k in range(5):
    place(squelch(0.18, 600, 300, 0.4), C['lapse'] + 0.45 * k + 0.2, 'parasite grows (wet shifts)' if k == 0 else None, -34)
# "the disgusting part": a slow push along its body, legs shifting
for k in range(4):
    place(grip(0.1), C['pushHead'] + 0.35 + 0.42 * k, 'legs shift on the stub' if k == 0 else None, -33)
# the new tongue: the fish gapes, the segments flex
for g in (C['gape1'], C['gape2']):
    place(squelch(0.6, 380, 160, 0.7), g + 0.05, 'wet gape', -28)
    for k in range(3):
        place(squelch(0.16, 1100, 600, 0.3), g + 0.4 + 0.18 * k, 'segments flex' if k == 0 else None, -33)
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
for k in range(4):
    place(grip(0.1), C['reopen'] + 0.35 + 0.12 * k, 'claws re-grip' if k == 0 else None, -33)

# the loop's tail: the parasite settles back into its tongue disguise as the camera pushes in (wriggle on its 0.75 s
# motion, legs folding under), carrying into the hook's own wriggle at frame 0
tt0 = 21.75; first = True
while tt0 < DUR - 0.5:
    place(squelch(0.26, 950, 380), tt0 - 0.08, 'wriggle as it settles back (loop)' if first else None, -27); first = False
    tt0 += 0.75
for k in range(7):
    place(grip(0.1), 22.85 + 0.12 * k, 'legs fold under' if k == 0 else None, -34)
place(flow(1.6, 100, 900), 21.45, 'the fish breathes (water over the gills)', -31)
place(squelch(0.5, 450, 200, 0.6), 22.2, 'jaw flex', -31)

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
