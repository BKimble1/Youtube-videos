#!/usr/bin/env python3
"""Effects, ambience, music bed and mix for the Dead Bird Drones Short. Everything is synthesised here (no samples, no
third-party music). The narration master is used sample for sample (gain, a gentle compressor and a limiter only).

Every effect is placed from the picture's own events and signals (audio/cues.json, exported from story.ts by
tools/export_cues.ts), and the whole is restrained so the narration stays dominant:
  wingbeats:  one soft feathered stroke per visible downstroke of the drone, louder in closer framings and slower and
              lower in the lab's slow-motion bench test; faint distant flutters for the living birds
  the drive:  ONE low motor texture, only while the drive is visible (the cutaways): a low hum at the motor's
              commutation rate, faint brush hiss, and the gear mesh at the pinion's tooth rate; a soft spin-down at the
              match into the lab, a click and spin-up when the bench test starts
  the lab:    room tone, the shell's soft slide as it lifts, a small seat click as it goes back on
  the duck:   a subtle water cue: gentle paddle swishes and lapping, muffled under the waterline view
  places:     a light breeze outdoors, a faint wetland bed with two distant calls in the meadow
  transitions: soft air on the wing wipes, a water swish on the waterline wipe, a crest swash on the water wipe
Nothing for horror (no stings, heartbeats, or "resurrection" sounds); no constant whooshes.
Music: a quiet pulse whose period divides the film length exactly, so the end flows into the start; it ducks under the
voice. Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
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
def place(buf, sig, at, name=None, gain_db=0.0, wrap=True):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    if wrap:
        idx = idx % N  # the film loops: anything that runs past the end continues at the start
        np.add.at(buf, idx, sig * db(gain_db))
    else:
        m = (idx >= 0) & (idx < N)
        buf[idx[m]] += sig[m] * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': round(gain_db, 1)})
def sig100(a): return np.interp(t, np.arange(len(a)) / 100, a)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]  # filter as if periodic (seamless loop)
def world_mask(*names):
    m = np.array([1.0 if w in names else 0.0 for w in WORLD])
    return np.clip(lp(np.interp(t, np.arange(len(m)) / 100, m), 8), 0, 1)

# ---------------- generators
def wingbeat(dur=0.34, lo=110, hi=850, feather=0.35):
    """a soft feathered stroke: a low air push with a light feather rustle on top"""
    n = int(dur * SR); tt = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.6
    push = bp(noise(n), lo, hi) * e
    rust = hp(bp(noise(n), 2200, 7000) * (0.4 + 0.6 * (rng.random(n) < 0.03)), 1800) * e ** 2
    return norm(push + feather * rust)
def tick(dur=0.03, f=4200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 3000) * np.exp(-tt / 0.0015) + 0.4 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def click(f=2400, dur=0.06):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / (dur * d)) for k, a, d in [(1, 1, 0.2), (2.4, 0.5, 0.12)]) + 0.6 * hp(noise(n), 3500) * np.exp(-tt / 0.002))
def soft_knock(f=170, dur=0.22):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / (dur * 0.25)) + 0.3 * lp(noise(n), 900) * np.exp(-tt / 0.01))
def swish(dur, lo0, lo1, hi0, hi1, shape=1.2):
    """band noise whose band glides (air past a near wing, or water moving)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = noise(n); out = np.zeros(n); seg = 2048
    for s in range(0, n, seg):
        u = (s + seg / 2) / n
        lo = lo0 * (lo1 / lo0) ** u; hi = hi0 * (hi1 / hi0) ** u
        out[s:s + seg] = bp(x[max(0, s - 512):s + seg], lo, hi)[-len(out[s:s + seg]):]
    return norm(lp(out, 9000)) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** shape
def lap(dur=0.4, f=380):
    """a small water lap: a bubbly band with a soft drop"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = bp(noise(n), f * 0.6, f * 3.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt + 3 * np.sin(2 * np.pi * 2 * tt)))
    return norm(x) * env(n, dur * 0.25, dur * 0.6)
def plip(f0=650):
    n = int(0.1 * SR); tt = np.arange(n) / SR
    f = f0 * (1 + 1.8 * tt / 0.1)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.022))
def call(f0=2900, dur=0.22):
    """a distant two-note bird call (very faint, wildlife ambience only)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = np.where(tt < dur * 0.45, f0, f0 * 0.82) * (1 + 0.04 * np.sin(2 * np.pi * 38 * tt))
    e = np.sin(np.pi * np.clip((tt % (dur * 0.5)) / (dur * 0.5), 0, 1)) ** 2
    return norm(lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * e, 5000))

sfx = np.zeros(N)

# ---------------- wingbeats of the visible drone: one per downstroke (phase crosses 0 = the top of the upstroke)
U = np.array(cj['u']); SC = np.array(cj['scale']); MH = np.array(cj['motorHz'])
n_beats = 0
for i in range(1, len(U)):
    w = WORLD[i]
    if w not in ('open', 'lab', 'meadow', 'sky') or SC[i] <= 0: continue
    if np.floor(U[i]) > np.floor(U[i - 1]) and U[i] - U[i - 1] < 0.5:
        at = i / 100
        speed = (U[min(len(U) - 1, i + 2)] - U[max(0, i - 2)]) / 0.04 * cj['EV']['tFlap']  # 1 = flight speed
        if speed < 0.15: continue
        dur = min(0.75, 0.5 * cj['EV']['tFlap'] / max(0.25, speed))
        lo = 90 + 40 * min(1, speed); hi = 500 + 450 * min(1, speed)
        size = np.clip(np.log2(max(SC[i], 6) / 16) * 4.5, -9, 6)
        g = -31 + size - (3 if w == 'lab' else 0)
        place(sfx, wingbeat(dur, lo, hi), at, 'drone wingbeat (downstroke)' if n_beats == 0 or w != WORLD[i - 30 if i >= 30 else 0] else None, g)
        n_beats += 1
LOG.append({'t': 0, 'sfx': f'{n_beats} drone wingbeats in all', 'gain_db': None})
# living birds: faint distant flutters
for w0, w1 in [(EV['meadowT0'] + 0.4, EV['meadowToPond'][0]), (EV['skyT0'] + 0.4, EV['loop'][0])]:
    k = 0; at = w0
    while at < w1:
        place(sfx, wingbeat(0.16, 300, 1600, 0.6), at, 'living birds: distant flutter' if k == 0 else None, -44 - 3 * rng.random())
        at += 0.21 + 0.18 * rng.random(); k += 1

# ---------------- the drive: one low motor texture while the drive is visible
drive = lp(sig100(cj['drive']), 4)
mhz = sig100(MH)
ph = 2 * np.pi * np.cumsum(mhz) / SR  # motor shaft angle
hum = np.sin(6 * ph) + 0.5 * np.sin(12 * ph + 0.4) + 0.25 * np.sin(18 * ph + 1.1)  # commutation (3-slot, 2 brushes)
brush = bp(noise(N), 2500, 6500) * (0.6 + 0.4 * np.sin(6 * ph) ** 2)
mesh = np.zeros(N)
tooth = np.floor(10 * ph / (2 * np.pi))  # the pinion's teeth passing the mesh
edges = np.flatnonzero(np.diff(tooth) > 0)
tk = tick(0.012, 3600)
for e in edges:
    if drive[e] > 0.05:
        seg = tk[:min(len(tk), N - e)]
        mesh[e:e + len(seg)] += seg * (0.5 + 0.5 * rng.random())
motor = (0.9 * lp(hum, 700) + 0.12 * norm(brush) + 0.35 * bp(mesh, 1500, 7000)) * drive
sfx += db(-27) * norm(motor + 1e-9) * (0.4 + 0.6 * np.clip(mhz / 8.6, 0, 1))
LOG.append({'t': 0, 'sfx': 'motor texture (hum, brush, gear mesh) while the drive is visible', 'gain_db': -27})
# spin-down at the match into the lab (heard faintly, the drive itself hidden)
n = int((EV['spinEnd'] - EV['match'] + 0.1) * SR); tt = np.arange(n) / SR
fsd = 8.6 * 6 * np.clip(1 - tt / (EV['spinEnd'] - EV['match']), 0, 1) ** 1.3
spin = np.sin(2 * np.pi * np.cumsum(fsd) / SR) * np.clip(1 - tt / (EV['spinEnd'] - EV['match'] + 0.1), 0, 1)
place(sfx, norm(lp(spin, 400)), EV['match'], 'the drive spins down on the cradle', -36)
# bench test: a switch click and the spin-up
place(sfx, click(2600, 0.05), EV['motorOn'] - 0.02, 'bench test: switch click', -33)

# ---------------- the lab: the shell lifts (a soft slide) and seats (a small click)
place(sfx, swish(EV['liftB'] - EV['liftA'], 600, 900, 2500, 4500, 1.5), EV['liftA'], 'shell lifts (soft slide)', -35)
place(sfx, swish(EV['seatB'] - EV['seatA'], 900, 600, 4500, 2500, 1.5), EV['seatA'], 'shell lowers', -36)
place(sfx, soft_knock(210, 0.18), EV['seatB'] - 0.03, 'shell seats', -31)
place(sfx, click(3300, 0.04), EV['seatB'], None, -36)

# ---------------- transitions
lm = EV['labToMeadow']
place(sfx, swish(lm[1] - lm[0] + 0.15, 150, 300, 900, 2400, 1.0), lm[0] - 0.05, 'wing wipe (near wing past the lens)', -29)
mp = EV['meadowToPond']
place(sfx, swish(mp[1] - mp[0] + 0.2, 250, 400, 1400, 3200, 1.0), mp[0] - 0.05, 'waterline wipe (water swish)', -31)
place(sfx, lap(0.35, 420), mp[1] - 0.05, None, -33)
ps = EV['pondToSky']
place(sfx, swish(ps[1] - ps[0] + 0.2, 300, 200, 2500, 1200, 1.0), ps[0] - 0.05, 'water crosses the lens (crest swash)', -31)
lo = EV['loop']
place(sfx, swish(lo[1] - lo[0] - 0.1, 140, 260, 800, 2000, 1.3), lo[0] + 0.02, 'loop: wing wipe into frame 0', -31)

# ---------------- the duck: a subtle water cue (paddle swishes, lapping), muffled in the below-water view
pond = world_mask('pond')
dk = lp(sig100(cj['duckCut']), 6)
for k, at in enumerate(cj['duckStrokes']):  # each foot's power stroke (the duck module's crank)
    place(sfx, lap(0.26, 300 + 80 * (k % 2)), at + 0.04, 'duck paddle stroke (water)' if k == 0 else None, -36 - 2 * (k % 2))
wake = circ(lambda x: bp(x, 250, 1800), noise(N)) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.7 * t) ** 2)
sfx += db(-38) * norm(wake) * pond * (1 - 0.6 * dk)
under = circ(lambda x: lp(x, 260), noise(N))
sfx += db(-33) * norm(under) * dk
for j in range(5):
    place(sfx, plip(450 + 300 * rng.random()), cj['T']['using2'] + 0.1 + 0.18 * j, 'bubbles under the waterline' if j == 0 else None, -38 - 3 * rng.random())

# ---------------- ambience beds (circular, so the loop is seamless)
outdoor = world_mask('open', 'meadow', 'sky')
lab = world_mask('lab')
breeze = circ(lambda x: lp(bp(x, 80, 1400), 900), noise(N)) * (0.75 + 0.25 * np.sin(2 * np.pi * (3 / DUR) * t))
room = circ(lambda x: bp(x, 120, 900), noise(N)) + 0.3 * np.sin(2 * np.pi * 60 * t)
amb = 0.8 * norm(breeze) * outdoor + 0.5 * norm(room) * lab
for at, f in [(EV['meadowT0'] + 0.8, 3100), (EV['meadowT0'] + 2.1, 2600)]:
    place(sfx, call(f, 0.24), at, 'meadow: a distant bird call' if f == 3100 else None, -41)

# ---------------- music: a quiet pulse whose period divides the film exactly
BEATS = int(round(DUR * 96 / 60))
bpm = 60 * BEATS / DUR
beat = 60 / bpm
mus = np.zeros(N)
def pluck(f, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, 6))
    return lp(x, 1800) * np.exp(-tt / 0.11)
bassline = [55.0, 55.0, 61.74, 55.0, 49.0, 49.0, 58.27, 49.0]
arp = [440.0, 554.37, 659.25, 554.37, 392.0, 493.88, 587.33, 493.88]
for k in range(BEATS * 2):
    at = k * beat / 2
    b = bassline[(k // 4) % 8]
    n = int(beat / 2 * SR); tt = np.arange(n) / SR
    place(mus, np.sin(2 * np.pi * b * tt) * np.exp(-tt / 0.2) * 0.9, at)
    if k % 2 == 1:
        place(mus, hp(noise(int(0.04 * SR)), 6000) * np.exp(-np.arange(int(0.04 * SR)) / SR / 0.008) * 0.1, at)
    if k % 2 == 0:
        place(mus, pluck(arp[(k // 2) % 8], beat * 0.9) * 0.15, at)
padv = np.zeros(N)
for f, a in [(110.0, 0.4), (138.6, 0.22), (164.8, 0.2), (220.0, 0.12)]:
    padv += a * np.sin(2 * np.pi * f * t + 2 * np.sin(2 * np.pi * (5 / DUR) * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * (2 / DUR) * t))
mus += lp(padv, 900) * 0.35

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, os.environ.get('FGW_NARRATION', 'audio/narration/FGW_Dead_Bird_Drones_narration_V1.wav')))
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
sfx = sfx * db(10.0)  # the effects sit well under the voice
sfx_d = sfx * (1 - 0.25 * np.clip(venv * 3, 0, 1))
amb_d = db(-27) * norm(amb) * duck
mus_d = db(-25) * norm(mus) * duck
mix = voice + sfx_d + amb_d + mus_d
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix = limit(mix, -1.6)
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Dead_Bird_Drones_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
for nm, x in [('voice', voice * g), ('sfx', sfx_d * g), ('ambience', amb_d * g), ('music', mus_d * g)]:
    sf.write(os.path.join(EP, f'audio/stems/FGW_Dead_Bird_Drones_{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
def lufs_of(x):
    try: return round(meter.integrated_loudness(x), 2)
    except Exception: return None
mono = mix  # the mix is dual mono: phone mono playback is identical
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'placed_effects': len([l for l in LOG if l['gain_db'] is not None]),
       'voice_lufs_in_mix': lufs_of(voice * g), 'sfx_lufs_in_mix': lufs_of(sfx_d * g), 'ambience_lufs_in_mix': lufs_of(amb_d * g), 'music_lufs_in_mix': lufs_of(mus_d * g),
       'mono_lufs': lufs_of(mono), 'music_bpm': round(bpm, 2), 'music_beats': BEATS, 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4),
       'speech_end_s': T['deadEnd'], 'gap_after_last_word_s': round(DUR - T['deadEnd'], 3)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
