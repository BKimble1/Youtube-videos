#!/usr/bin/env python3
"""Effects, ambience and mix for the Ankle Knee Short. Everything is synthesised here (no samples, no music). The
narration master is used sample for sample (gain, a gentle compressor and a limiter only) and stays in front.

Effects are placed from the picture's own events (audio/cues.json, exported from story.ts by tools/export_cues.ts):
  ball strike   the loop's accent: a firm leather thump at the contact frame just after frame 0
  cleats        a light grass scuff and a soft thud on every landing the rig makes; a faint pylon tick on the
                prosthetic side; the leg's swoosh into the strike (it runs over the loop seam)
  slow motion   a deep, slowed whoosh under the ramped follow-through; the field ambience dips and darkens
  illustration  a clean, quiet air bed; soft ticks for the cut lines, a soft lift for the removal, an airy turn
                that follows the half-turn's speed, a soft seat as the pieces join, the socket's click on the fit
  bench         field ambience; the bench takes his weight (a soft wooden knock)
  recovery      restrained room tone, a far-off monitor beep, a sheet rustle as he wakes, a tiny rustle on the wiggle
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio.py [mix_name]"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
from scipy.ndimage import minimum_filter1d

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, T = cj['DUR'], cj['T']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2026)
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
    i = int(round(at * SR)); idx = (np.arange(len(sig)) + i) % N  # the film loops
    buf[idx] += sig * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
def win(a, b, fade=0.03):
    """1 inside [a, b) with short fades (loop-aware for a > b)"""
    w = np.zeros(N)
    ia, ib = int(a * SR), int(b * SR)
    if ia < ib: w[ia:ib] = 1
    else: w[ia:] = 1; w[:ib] = 1
    k = int(fade * SR)
    return np.convolve(np.concatenate([w[-k:], w, w[:k]]), np.ones(k) / k, 'same')[k:-k]

# ---------------- generators
def thump(dur, f0, f1, click=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (dur * 0.3)) + click * lp(noise(n), 900) * np.exp(-tt / 0.012))
def slap(dur=0.05, lo=500, hi=3800):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), lo, hi) * np.exp(-tt / 0.009))
def tick(dur=0.03, f=3600):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 2500) * np.exp(-tt / 0.0015) + 0.5 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def scuff(dur=0.09):
    n = int(dur * SR); tt = np.arange(n) / SR
    g = (rng.random(n) < 0.05).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.5 + 2.0 * g, 1400, 7000) * np.exp(-tt / (dur * 0.35)))
def sweep(dur, lo0, lo1, hi0, hi1, shape=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = noise(n); out = np.zeros(n); seg = 2048
    for s in range(0, n, seg):
        u = (s + seg / 2) / n
        lo = lo0 * (lo1 / lo0) ** u; hi = hi0 * (hi1 / hi0) ** u
        out[s:s + seg] = bp(x[max(0, s - 512):s + seg], lo, hi)[-len(out[s:s + seg]):]
    return norm(lp(out, 9000)) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** shape
def rustle(dur=0.4, lo=1500, hi=7000):
    n = int(dur * SR)
    g = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.3 + lp(g, 9000) * 2.0, lo, hi)) * env(n, dur * 0.3, dur * 0.5)
def knock(f=180, dur=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) + 0.3 * bp(noise(n), 300, 1500) * np.exp(-tt / 0.012))
def tone(f, dur, partials=((1, 1, 0.6), (2.0, 0.25, 0.4), (3.0, 0.1, 0.25))):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / (dur * d)) for k, a, d in partials)) * env(n, 0.01, dur * 0.4)
def chirp(f0, f1, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * tt / dur) ** 2

sfx = np.zeros(N)
shots = cj['shots']
def shot_span(name):
    for k, (s0, nm) in enumerate(shots):
        if nm == name: return s0, (shots[k + 1][0] if k + 1 < len(shots) else DUR)
P1 = shot_span('pitch1'); IL = shot_span('illus'); BE = shot_span('bench'); BD = shot_span('bed'); P6 = shot_span('pitch6')

# ---------------- the strike (the loop accent) and the swing into it
C0 = cj['CONTACT']
place(sfx, thump(0.32, 150, 62, 0.35), C0, 'ball strike: leather thump', -13)
place(sfx, slap(0.05), C0, None, -17)
place(sfx, tick(0.02, 2600), C0 + 0.002, None, -27)
place(sfx, sweep(0.34, 300, 900, 1800, 5000, 0.8), DUR - 0.3, 'the leg swings into the ball (runs over the seam)', -27)
place(sfx, sweep(0.5, 900, 300, 5000, 1500, 1.2), C0 + 0.02, 'the ball flies off', -31)
# ---------------- slow motion: a deep, slowed follow-through
place(sfx, sweep(2.2, 140, 60, 900, 350, 1.6), 0.36, 'slow-motion follow-through (deep whoosh)', -26)
place(sfx, thump(0.9, 70, 40, 0.0), 0.42, None, -32)
# ---------------- cleats on turf
for L in cj['lands']:
    near_start = any(abs(L['t'] - s0) < 0.05 for s0, _ in shots)
    if near_start: continue
    pro = L['foot'] == 'prosthetic'
    place(sfx, scuff(0.1), L['t'] - 0.01, f"cleat lands ({L['foot']})", -24 if pro else -26)
    place(sfx, thump(0.12, 110, 70, 0.1), L['t'], None, -30)
    if pro: place(sfx, tick(0.02, 3400), L['t'] + 0.01, None, -38)
# the plant on the new leg that opens S6 (cut on its downward movement), and the weight settling onto it
place(sfx, scuff(0.13), T['learned'] + 0.1, 'the prosthetic cleat plants on turf', -21)
place(sfx, thump(0.16, 100, 60, 0.15), T['learned'] + 0.11, None, -27)
place(sfx, rustle(0.35, 1200, 4500), T['learned'] + 0.55, 'weight shifts onto it (cleat on grass)', -34)
place(sfx, sweep(0.28, 400, 900, 2000, 4500, 0.8), DUR - 0.62, 'backswing', -34)
# ---------------- illustration
place(sfx, tick(0.03, 4200), IL[0], 'match cut to the illustration', -34)
place(sfx, chirp(420, 640, 0.5), T['bone'] - 0.28, 'the x-ray window opens (soft rising tone)', -38)
place(sfx, thump(0.7, 62, 50, 0.0) * np.sin(np.linspace(0, 6 * np.pi, int(0.7 * SR))) ** 2, T['bone'], 'diseased bone glows (low pulse)', -33)
place(sfx, tick(0.025, 3000), T['surgeons'] + 0.08, 'cut line', -33)
place(sfx, tick(0.025, 3300), T['surgeons'] + 0.3, 'cut line', -33)
place(sfx, sweep(0.8, 250, 600, 1500, 3500, 1.0), T['remove'], 'the knee section lifts away (soft)', -32)
place(sfx, tone(880, 0.9) + 0.6 * tone(1318.5, 0.9), T['save'] - 0.05, 'the foot is saved (soft chime)', -36)
# the half-turn: an airy swish whose brightness follows the turn's speed
yaw = np.array(cj['yaw']); ty, yv = yaw[:, 0], yaw[:, 1]
spd = np.abs(np.gradient(yv, ty))
air = circ(lambda x: bp(x, 700, 5000), noise(N))
sp = np.interp(t, ty, spd / (spd.max() + 1e-9), left=0, right=0)
sfx += db(-31) * norm(air) * lp(sp, 8)
LOG.append({'t': round(float(ty[np.argmax(spd)]), 3), 'sfx': 'the half-turn (airy swish following its speed)', 'gain_db': -31})
place(sfx, knock(240, 0.2), T['thigh'] + 0.08, 'the shin meets the thigh (soft seat)', -29)
for k in range(3): place(sfx, tick(0.015, 5000), T['thigh'] + 0.3 + 0.09 * k, 'stitches' if k == 0 else None, -40)
place(sfx, tick(0.03, 2400), T['that'] - 0.08, 'the socket clicks on', -30)
place(sfx, knock(320, 0.12), T['that'] - 0.07, None, -33)
# ---------------- bench
place(sfx, knock(150, 0.3), cj['sit'] - 0.02, 'he sits: the bench takes his weight', -26)
place(sfx, rustle(0.4, 900, 3500), cj['sit'] - 0.25, None, -36)
# ---------------- recovery
place(sfx, rustle(0.6, 800, 4000), T['woke'] - 0.05, 'sheet rustle as he wakes', -35)
for w in cj['wiggle']:
    place(sfx, rustle(0.22, 2000, 6000), w - 0.1, 'the toes wiggle (tiny rustle)', -37)
b = BD[0] + 0.4
while b < BD[1] - 0.2:
    place(sfx, tone(1046.5, 0.12, ((1, 1, 0.5),)), b, 'monitor beep (far)' if b < BD[0] + 0.5 else None, -46)
    b += 1.15

# ---------------- ambience beds
wind = circ(lambda x: lp(x, 500), noise(N)) * (0.75 + 0.25 * np.sin(2 * np.pi * t / DUR * 3))
leaves = circ(lambda x: bp(x, 2500, 7000), noise(N)) * (0.5 + 0.5 * np.sin(2 * np.pi * t / DUR * 7) ** 2)
field = 0.8 * norm(wind) + 0.12 * norm(leaves)
for k in range(10):
    at = rng.random() * DUR
    place(field, chirp(3200 + 800 * rng.random(), 4200 + 900 * rng.random(), 0.07) * 0.05, at)
    place(field, chirp(3600, 3000, 0.06) * 0.04, at + 0.11)
room = circ(lambda x: lp(x, 260), noise(N)) * 0.7 + 0.18 * np.sin(2 * np.pi * 60 * t) + 0.06 * np.sin(2 * np.pi * 120 * t)
clean = circ(lambda x: bp(x, 150, 900), noise(N))
w_field = win(*P1) + win(*BE) + win(*P6)
w_slow = np.clip(np.interp(t, [0.3, 0.62, 2.25, 2.9], [0, 1, 1, 0]), 0, 1)
w_ill = win(*IL); w_bed = win(*BD)
field_dark = lp(field, 700)
amb = (1 - w_slow) * field * w_field + w_slow * 0.7 * field_dark * w_field
amb = db(-22) * norm(amb) + db(-37) * norm(clean) * w_ill + db(-28) * norm(room) * w_bed

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Ankle_Knee_narration.wav'))
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
duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
sfx = sfx * db(8.0)
sfx_d = sfx * (1 - 0.3 * np.clip(venv * 3, 0, 1))
mix = voice + sfx_d + amb * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix = limit(mix * g, -1.6)
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Ankle_Knee_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
for nm, x in [('voice', voice * g), ('sfx', sfx_d * g), ('amb', amb * duck * g)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
def lufs_of(x):
    try: return round(meter.integrated_loudness(x), 2)
    except Exception: return None
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'voice_lufs_in_mix': lufs_of(voice * g),
       'sfx_lufs_in_mix': lufs_of(sfx_d * g), 'amb_lufs_in_mix': lufs_of(amb * duck * g), 'voice_max_gain_reduction_db': round(grmin, 2),
       'duration_s': DUR, 'effects': len(LOG), 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
