#!/usr/bin/env python3
"""Effects, music bed and mix for the Bone Glue Short. Everything is synthesised here (no samples, no third-party
music). The narration master is used sample for sample (gain, a gentle compressor and a limiter only).

Effects are placed from the picture's own events and signals (audio/cues.json, exported from story.ts). Restrained
throughout, never a horror treatment; the narration stays dominant:
  application: a soft, wet extrusion texture that follows the bead's laid speed, small cannula ticks at each hop,
               the plunger's faint creak, the clamp's tiny steel seat
  clinic:      operating-room tone (ventilation air, a low hum), the applicator lifting off
  dives:       soft air sweeps on the push into the incision and back out
  oyster:      subtle underwater ambience (a muffled low wash, current swish, a few bubble plips) under the
               comparison only; muffled match sweeps in and out
  wet macro:   a gentle trickle of fluid running over the bead
  withdrawal:  the cannula sliding out, the clamp's ratchet releasing and its tines lifting, a soft "set" knock
  healing:     soft material sounds: a low organic swell for the clot, a fibrous creak for the soft callus, a fine
               mineral crackle as woven bone forms, a whispering fizz as the glue islands disappear, a settling tone
  ending:      skin and cloth as the fingers curl, then the push back into the wrist, running into frame 0's texture
Music: a quiet pulse whose period divides the film length exactly, so the end flows into the start; it ducks under
the voice and thins under the oyster comparison. Levels: voice about -16 LUFS; the whole about -14 LUFS integrated;
true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, EV, T = cj['DUR'], cj['EV'], cj['T']
WORLD = cj['world']
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
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def place(buf, sig, at, name=None, gain_db=0.0, wrap=True):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    if wrap:
        idx = idx % N  # the film loops: anything that runs past the end continues at the start
        buf[idx] += sig * db(gain_db)
    else:
        m = (idx >= 0) & (idx < N)
        buf[idx[m]] += sig[m] * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def sig100(a): return np.interp(t, np.arange(len(a)) / 100, a)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]  # filter as if periodic (seamless loop)

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
def swell(dur, f=46, rise=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    fr = f * (1 + 0.25 * rise * tt / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = np.sin(ph) + 0.45 * np.sin(2 * ph + 0.6 * np.sin(2 * np.pi * 2.1 * tt)) + 0.2 * np.sin(3.01 * ph)
    wet = bp(noise(n), 180, 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 5.3 * tt)) * 0.3
    return norm(lp(x * (1 + 0.25 * bp(noise(n), 3, 9)) + wet, 900)) * env(n, min(0.05, dur * 0.2), dur * 0.35)
def thump(dur=0.5, f0=70, f1=34):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (dur * 0.35)) + 0.2 * lp(noise(n), 200) * np.exp(-tt / 0.03))
def crackle(dur, density=60, lo=2500, hi=9000):
    n = int(dur * SR); x = np.zeros(n)
    for _ in range(int(dur * density)):
        i = rng.integers(0, max(1, n - 300))
        x[i:i + 300] += tick(300 / SR, 2500 + 4000 * rng.random())[:300] * (0.2 + 0.8 * rng.random())
    return norm(bp(x, lo, hi) + 1e-9) * env(n, min(0.03, dur * 0.2), min(0.08, dur * 0.3))
def plip(f0=700):
    n = int(0.12 * SR); tt = np.arange(n) / SR
    f = f0 * (1 + 2.0 * tt / 0.12)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.025))
def rustle(dur=0.5, lo=1500, hi=7000):
    n = int(dur * SR)
    g = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.3 + lp(g, 9000) * 2.0, lo, hi)) * env(n, dur * 0.3, dur * 0.5)
def sweep(dur, lo0, lo1, hi0, hi1, shape=1.0):
    """an air sweep: band noise whose band glides (a push or pull of the camera)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = noise(n); out = np.zeros(n); seg = 2048
    for s in range(0, n, seg):
        u = (s + seg / 2) / n
        lo = lo0 * (lo1 / lo0) ** u; hi = hi0 * (hi1 / hi0) ** u
        out[s:s + seg] = bp(x[max(0, s - 512):s + seg], lo, hi)[-len(out[s:s + seg]):]
    e = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** shape
    return norm(lp(out, 9000)) * e
def steel(dur=0.12, f=3200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / (dur * d)) for k, a, d in [(1, 1, 0.25), (2.76, 0.5, 0.15), (5.4, 0.25, 0.08)]) + 0.5 * hp(noise(n), 4000) * np.exp(-tt / 0.002))
def ratchet(clicks=3, gap=0.045):
    n = int((clicks * gap + 0.08) * SR); x = np.zeros(n)
    for k in range(clicks):
        i = int(k * gap * SR); m = min(n - i, int(0.05 * SR))
        x[i:i + m] += steel(0.05, 2500 + 300 * k)[:m] * (0.7 + 0.3 * rng.random())
    return norm(x)
def slide(dur=0.4):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), 2500, 8000) * (0.4 + 0.6 * np.sin(np.pi * tt / dur)) * (0.8 + 0.2 * np.sin(2 * np.pi * 41 * tt))) * env(n, 0.04, 0.15)
def soft_knock(f=180, dur=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) + 0.3 * bp(noise(n), 300, 1500) * np.exp(-tt / 0.012))
def fizz(dur, dens=180):
    """the glue islands dissolving: a soft, high, whispering effervescence"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.zeros(n)
    for _ in range(int(dur * dens)):
        i = rng.integers(0, max(1, n - 400)); m = 400
        x[i:i + m] += np.sin(2 * np.pi * (2600 + 3000 * rng.random()) * np.arange(m) / SR) * np.exp(-np.arange(m) / SR / 0.002) * rng.random()
    return norm(bp(x, 2000, 9000) + 0.15 * bp(noise(n), 3000, 8000)) * env(n, dur * 0.3, dur * 0.4)
def tone(f, dur, partials=((1, 1, 0.6), (2.0, 0.3, 0.4), (3.0, 0.12, 0.25))):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / (dur * d)) for k, a, d in partials)) * env(n, 0.04, dur * 0.4)

sfx = np.zeros(N)
SPEED = sig100(cj['speed'])
W_O = np.array([1.0 if w in ('oyster',) else 0.6 if w in ('match', 'match2') else 0.0 for w in WORLD])
ow = lp(sig100(W_O), 5)

# ---------------- application: a soft wet extrusion that follows the bead (and its pre-roll before the loop)
gel = circ(lambda x: bp(x, 160, 1100), noise(N))
bub = np.zeros(N)
for k in range(int(DUR * 22)):
    at = rng.random() * DUR
    s = plip(260 + 300 * rng.random()) * 0.35
    place(bub, s, at)
gel_tex = norm(gel * (0.6 + 0.4 * np.sin(2 * np.pi * 7.3 * t)) + bub)
sp = np.clip(SPEED / 15.0, 0, 1)
sfx += db(-25) * gel_tex * lp(sp, 6)
place(sfx, creak(0.5, 380, 40), 0.25, 'plunger creak', -34)
place(sfx, creak(0.45, 360, 36), 2.4, 'plunger creak', -36)
# the cannula touching down after each hop
for at, nm in [(EV['laid0'] * 0 + 1.42, 'cannula touches the wedge crack'), (2.35, 'cannula touches the styloid crack')]:
    place(sfx, tick(0.03, 3600), at, nm, -30)
place(sfx, steel(0.12, 2900), EV['appLift0'] + 0.08, 'applicator lifts off', -31)

# ---------------- dives and matches
place(sfx, sweep(1.7, 300, 120, 2500, 900), EV['dive0'] + 0.15, 'push down into the incision', -28)
place(sfx, sweep(0.6, 200, 90, 1800, 500), EV['match0'] - 0.05, 'match into the water (muffled)', -27)
place(sfx, sweep(0.55, 150, 200, 900, 2400), EV['back0'] - 0.05, 'match back to the bone', -28)
place(sfx, sweep(1.6, 120, 300, 900, 2600), EV['pull0'] + 0.1, 'pull out to the cutaway', -30)
place(sfx, sweep(1.0, 260, 120, 2400, 800), EV['dive2a'], 'move back into the fracture', -31)
place(sfx, sweep(0.9, 140, 260, 900, 2200), EV['out0'] + 0.1, 'ease out to the wrist', -32)

# ---------------- underwater (the comparison only): low wash, current swish, bubble plips
wash = circ(lambda x: lp(x, 260), noise(N))
cur = circ(lambda x: bp(x, 300, 1400), noise(N)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
uw = norm(1.0 * norm(wash) + 0.35 * norm(cur))
sfx += db(-26) * uw * ow
for k in range(9):
    at = EV['match1'] + 0.1 + k * 0.19 + 0.06 * rng.random()
    if at < EV['back0']:
        place(sfx, plip(500 + 500 * rng.random()), at, 'bubble' if k == 0 else None, -33 - 3 * rng.random())

# ---------------- the wet macro: a gentle trickle over the bead
WET = lp(sig100(cj['wet']), 5)
trick = circ(lambda x: bp(x, 900, 4500), noise(N)) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3.1 * t + 2 * np.sin(2 * np.pi * 0.9 * t))))
sfx += db(-30) * norm(trick) * WET
place(sfx, soft_knock(150, 0.25), T['grips'] + 0.05, 'the bond holds (soft knock)', -30)

# ---------------- withdrawal and setting
place(sfx, slide(0.45), EV['appOut0'] + 0.1, 'cannula slides out', -30)
place(sfx, ratchet(3, 0.05), EV['clampOpen0'] - 0.02, 'clamp ratchet releases', -30)
place(sfx, steel(0.18, 2300), EV['clampOut0'] + 0.3, 'clamp lifts away', -33)
place(sfx, soft_knock(120, 0.35), EV['set1'] - 0.35, 'the gel sets (low, soft)', -29)
# closing: three suture pulls
for k in range(3):
    place(sfx, rustle(0.16, 2500, 8000), EV['sut0'] + 0.08 + k * 0.17, 'suture pull' if k == 0 else None, -34)

# ---------------- healing: soft material sounds
place(sfx, swell(0.9, 52, 0.6), EV['hem0'] - 0.05, 'hematoma: a low organic swell', -28)
place(sfx, creak(0.8, 210, 30), EV['soft0'], 'soft callus: fibrous creak', -31)
place(sfx, crackle(1.0, 70, 2500, 8500), EV['hard0'], 'hard callus: fine mineral crackle', -31)
place(sfx, fizz(2.6, 120), EV['res0'] + 0.3, 'the glue islands dissolve (whispering fizz)', -33)
place(sfx, crackle(1.8, 40, 2200, 7000), EV['res0'] + 0.6, 'new bone filling in', -35)
place(sfx, tone(220, 1.4), EV['rem1'] - 0.55, 'restored (a settling tone)', -34)

# ---------------- the ending: the fingers curl, then the push back in, into frame 0
place(sfx, rustle(0.6, 1200, 5000), EV['curl0'] + 0.05, 'skin as the fingers curl', -31)
place(sfx, rustle(0.5, 1000, 4500), EV['curlPeak'] + 0.15, 'the fingers relax', -34)
place(sfx, sweep(0.75, 600, 160, 5000, 1100), EV['loop0'], 'push back through the skin (into frame 0)', -27)

# ---------------- music: a quiet pulse whose period divides the film exactly
BEATS = int(round(DUR * 98 / 60))
bpm = 60 * BEATS / DUR
beat = 60 / bpm
mus = np.zeros(N)
def pluck(f, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, 6))
    return lp(x, 1700) * np.exp(-tt / 0.12)
bassline = [55.0, 55.0, 65.41, 55.0, 49.0, 49.0, 61.74, 49.0]
arp = [440.0, 523.25, 659.25, 523.25, 392.0, 493.88, 587.33, 493.88]
for k in range(BEATS * 2):
    at = k * beat / 2
    b = bassline[(k // 4) % 8]
    n = int(beat / 2 * SR); tt = np.arange(n) / SR
    place(mus, np.sin(2 * np.pi * b * tt) * np.exp(-tt / 0.22) * 0.9, at)
    if k % 2 == 1:
        place(mus, hp(noise(int(0.04 * SR)), 6000) * np.exp(-np.arange(int(0.04 * SR)) / SR / 0.008) * 0.1, at)
    if k % 2 == 0:
        place(mus, pluck(arp[(k // 2) % 8], beat * 0.9) * 0.16, at)
padv = np.zeros(N)
for f, a in [(110.0, 0.4), (164.8, 0.25), (220.0, 0.18), (246.9, 0.1)]:
    padv += a * np.sin(2 * np.pi * f * t + 2 * np.sin(2 * np.pi * (5 / DUR) * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * (2 / DUR) * t))
mus += lp(padv, 900) * 0.35
mus *= 1 - 0.55 * ow  # thins under the underwater comparison

# ---------------- beds: operating-room tone in the clinic, a softer inside-the-body bed elsewhere
air = circ(lambda x: bp(x, 250, 2500), noise(N))
hum = np.sin(2 * np.pi * 120 * t) * 0.25 + np.sin(2 * np.pi * 180 * t) * 0.08
logw = sig100(cj['logw'])
room = np.clip((logw - np.log(60)) / (np.log(300) - np.log(60)), 0, 1) * (1 - ow)
inner = circ(lambda x: lp(x, 180), noise(N))
amb = 0.6 * norm(air) * lp(room, 3) + 0.4 * hum * lp(room, 3) + 0.5 * norm(inner) * lp((1 - room) * (1 - ow), 3)

# ---------------- voice and mix
if os.environ.get('FGW_CODE_TEST'):
    # code test only (never a deliverable): a stand-in noise 'voice' so the effects and levels can be exercised
    v = lp(noise(N), 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * t) ** 2); vsr = SR
else:
    v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Bone_Glue_narration_V1.wav'))
if v.ndim > 1: v = v.mean(1)
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
sfx_d = sfx * (1 - 0.25 * np.clip(venv * 3, 0, 1))
mix = voice + sfx_d + db(-31) * amb * duck + db(-30) * norm(mus) * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix = limit(mix, -1.6)
nr = int(0.004 * SR)
step = (mix[0] - (mix[1] - mix[0])) - mix[-1]
mix[-nr:] += step * np.linspace(0, 1, nr) ** 2
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Bone_Glue_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
for nm, x in [('voice', voice * g), ('sfx', sfx_d * g), ('amb', db(-31) * amb * duck * g), ('music', db(-30) * norm(mus) * duck * g)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
def lufs_of(x):
    try: return round(meter.integrated_loudness(x), 2)
    except Exception: return None
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG),
       'voice_lufs_in_mix': lufs_of(voice * g), 'sfx_lufs_in_mix': lufs_of(sfx_d * g), 'music_lufs_in_mix': lufs_of(db(-30) * norm(mus) * duck * g),
       'music_bpm': round(bpm, 2), 'music_beats': BEATS, 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
