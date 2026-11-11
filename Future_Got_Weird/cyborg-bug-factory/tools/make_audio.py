#!/usr/bin/env python3
"""Effects, music bed and mix for the Cyborg Bug Factory Short. Everything is synthesised here (no samples, no
third-party music), as in the other FGW episodes. The narration master is used sample for sample (gain, a gentle
compressor and a limiter only).

Effects are placed on the picture's own events (the schedule in source/src/story.ts, the scene boundaries in
source/src/scenes/*.tsx; the times are copied into CUES below). Restrained throughout; the narration stays dominant:
  arm:        a small servo whine on every arm move (pitch follows the move), the gripper's closing tick
  snap:       the backpack's hooks clipping on: a crisp two-part click with a tiny body thunk (the hook's is the biggest)
  activation: a soft rising two-note blip as the status LED comes on; the clamps' release ticks
  vision:     a quiet scanning tone and a lock blip (the 68-second time-lapse)
  timer:      fast soft ticks while the timer counts, a small chime on 68
  crawling:   tiny tarsal ticks in tripod rhythm whenever an insect walks close to the lens
  pulses:     three short electrical buzzes on the electrode, each with a tiny crackle
  robot:      a toy-motor whine, wheel spin and two soft bumps on the ledge
  disaster:   wind over rubble, a low distant rumble, debris trickles, the camera feed's scan beeps
  moves:      soft air sweeps on the cuts and the crane at the end (which runs into frame 0's descent)
Music: a quiet pulse whose period divides the film length exactly, so the end flows into the start; it ducks under the
voice. Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
TL = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
DUR = TL['duration']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(6801)
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
    i = int(round(at * SR)); idx = (np.arange(len(sig)) + i) % N  # the film loops: wrap past the end
    buf[idx] += sig * db(gain_db)
    if name: LOG.append({'t': round(at % DUR, 3), 'sfx': name, 'gain_db': gain_db})
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
def win(a, b, fade=0.08):
    """a 0..1 window over [a, b] (wrapping), with soft edges"""
    tt = (t - a) % DUR
    L = (b - a) % DUR
    return np.clip(np.minimum(tt / fade, (L - tt) / fade), 0, 1) * (tt <= L)

# ---------------- generators
def tick(dur=0.03, f=4200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 3000) * np.exp(-tt / 0.0015) + 0.4 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def servo(dur, f0=420, f1=560, grit=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 + (f1 - f0) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 0.7
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    gear = bp(noise(n), 1500, 4500) * (0.5 + 0.5 * np.sin(2 * np.pi * 63 * tt))
    return norm(lp(saw, 2200) * 0.7 + 0.35 * np.sin(2 * ph) + grit * gear) * env(n, min(0.06, dur * 0.25), min(0.12, dur * 0.35))
def snap(big=1.0):
    n = int(0.22 * SR); tt = np.arange(n) / SR
    c1 = hp(noise(n), 2500) * np.exp(-tt / 0.0012)
    d = int(0.018 * SR)
    c2 = np.zeros(n); c2[d:] = (hp(noise(n - d), 1800) * np.exp(-np.arange(n - d) / SR / 0.002))
    ring_ = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / k) for f, a, k in [(2900, 0.5, 0.03), (4700, 0.3, 0.02), (6100, 0.2, 0.012)])
    body = big * np.sin(2 * np.pi * (140 * np.exp(-tt / 0.05) + 60) * tt) * np.exp(-tt / 0.045)
    return norm(c1 + 0.8 * c2 + 0.35 * ring_ + 0.6 * body)
def blip(f0=880, f1=1320, dur=0.16):
    n = int(dur * SR); tt = np.arange(n) / SR
    half = n // 2
    f = np.where(np.arange(n) < half, f0, f1)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * f / f0 * tt)) * np.exp(-((tt % (dur / 2)) / (dur / 2)) * 2.2)) * env(n, 0.004, 0.03)
def chime(f=1568, dur=0.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / d) for k, a, d in [(1, 1, 0.25), (2.01, 0.35, 0.12), (3.0, 0.15, 0.06)])) * env(n, 0.003, 0.2)
def buzz(dur=0.16, f=118):
    n = int(dur * SR); tt = np.arange(n) / SR
    sq = np.sign(np.sin(2 * np.pi * f * tt)) * 0.6 + np.sign(np.sin(2 * np.pi * f * 3.02 * tt)) * 0.25
    cr = (rng.random(n) < 0.004) * rng.standard_normal(n) * 3
    return norm(bp(sq + cr, 300, 5000)) * env(n, 0.004, 0.05)
def sweep(dur, lo0, lo1, hi0, hi1, shape=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = noise(n); out = np.zeros(n); seg = 2048
    for s in range(0, n, seg):
        u = (s + seg / 2) / n
        lo = lo0 * (lo1 / lo0) ** u; hi = hi0 * (hi1 / hi0) ** u
        out[s:s + seg] = bp(x[max(0, s - 512):s + seg], lo, hi)[-len(out[s:s + seg]):]
    e = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** shape
    return norm(lp(out, 9000)) * e
def thud(f=90, dur=0.3):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt * (1 - 0.3 * tt / dur)) * np.exp(-tt / 0.06) + 0.4 * bp(noise(n), 200, 1200) * np.exp(-tt / 0.01))
def trickle(dur, dens=40):
    n = int(dur * SR); x = np.zeros(n)
    for _ in range(int(dur * dens)):
        i = rng.integers(0, max(1, n - 900)); m = 900
        x[i:i + m] += tick(m / SR, 1500 + 3500 * rng.random())[:m] * rng.random() ** 2
    return norm(bp(x, 900, 7000) + 1e-9) * env(n, dur * 0.2, dur * 0.3)

sfx = np.zeros(N)
# ---------------- the arm (story.ts ARMK / HOOK); the hook descent is placed at the end so it wraps into frame 0
ARM_MOVES = [  # (start, end, pitch scale, gain)
    (DUR - 0.7, DUR + 0.42, 1.25, -25), (0.64, 1.2, 1.0, -25), (1.2, 2.6, 0.85, -29),
    (4.36, 4.72, 1.6, -27), (4.8, 5.45, 1.6, -26), (5.58, 6.35, 1.3, -27), (6.35, 7.12, 1.0, -25), (7.3, 8.6, 0.95, -24),
    (8.6, 9.75, 0.8, -26), (10.36, 11.0, 1.0, -26), (11.0, 12.2, 0.85, -31),
    (20.3, 20.58, 1.5, -31), (20.74, 21.12, 1.5, -31), (21.2, 21.5, 1.4, -32),
    (26.9, 27.62, 1.0, -31), (27.8, 29.7, 0.9, -34), (29.7, DUR - 0.7, 0.85, -36),
]
for a, b, p, g in ARM_MOVES:
    place(sfx, servo(b - a, 380 * p, 540 * p), a, f'arm servo {a:.2f}-{b:.2f}', g)
for at, g in [(4.76, -24), (7.18, -21), (20.57, -30), (27.6, -27)]:
    place(sfx, tick(0.05, 3300), at, 'gripper closes on a backpack', g)
for at, g in [(0.52, -26), (5.5, -29), (10.2, -26), (21.15, -33)]:
    place(sfx, tick(0.04, 2600), at, 'gripper opens', g)
# ---------------- snaps (hooks clip on), the LED waking, the clamps
for at, big, g in [(0.46, 1.0, -9), (5.46, 0.5, -17), (10.15, 0.8, -12), (21.1, 0.3, -24)]:
    place(sfx, snap(big), at, 'backpack snaps on', g)
for at, g in [(0.82, -17), (5.56, -24), (10.62, -18), (21.16, -30)]:
    place(sfx, blip(), at, 'status LED on', g)
for at, g in [(1.12, -25), (5.6, -30), (10.98, -25), (21.2, -34)]:
    place(sfx, tick(0.03, 2100) * 0.7, at, 'clamps release', g)
    place(sfx, tick(0.03, 2300) * 0.7, at + 0.05, None, g - 2)
# ---------------- the 68-second time-lapse: vision scan, timer ticks, chime
place(sfx, sweep(0.42, 1200, 2400, 2600, 5200, 1.2), 4.44, 'vision scan', -31)
place(sfx, blip(1320, 1760, 0.12), 4.86, 'attach site found', -25)
k = 0
for at in np.arange(4.42, 5.5, 0.066):
    place(sfx, tick(0.02, 5200), at, 'timer tick' if k == 0 else None, -33); k += 1
place(sfx, chime(), 5.5, 'timer reaches 68', -24)
# ---------------- labels
for at in [9.02, 10.57, 10.75, 10.93]:
    place(sfx, tick(0.03, 3800), at, 'label', -32)
# ---------------- electrical pulses
for at in [12.38, 12.9, 13.35]:
    place(sfx, buzz(), at, 'electrical pulse', -19)
    place(sfx, tick(0.02, 6000), at + 0.36, None, -27)
# ---------------- crawling: tarsal ticks in tripod rhythm while an insect walks close to the lens
def steps(a, b, rate, g, name):
    first = True
    for at in np.arange(a, b, 1 / rate):
        for j in range(3):
            place(sfx, tick(0.012, 2500 + 2500 * rng.random()) * (0.5 + 0.5 * rng.random()), at + j * 0.012 + 0.006 * rng.random(), name if first else None, g)
            first = False
STEPS = [(1.38, 2.6, 4.9, -27), (2.6, 3.8, 4.9, -34), (11.3, 14.6, 4.7, -31), (15.5, 20.5, 3.9, -31), (22.4, 26.6, 5.4, -30), (26.74, 29.0, 4.0, -29), (29.0, 30.3, 4.0, -37)]
for a, b, r, g in STEPS:
    steps(a, b, r, g, f'crawl {a:.1f}-{b:.1f}')
# ---------------- the robot in the comparison
D0 = 14.89
place(sfx, servo(1.45, 900, 1100, 0.6) * 0.8, D0 + 0.05, 'toy robot drives', -30)
place(sfx, thud(110), D0 + 1.45, 'robot bumps the ledge', -24)
place(sfx, thud(100), D0 + 2.35, 'bumps again', -27)
place(sfx, servo(2.4, 1300, 1500, 0.9), D0 + 1.6, 'wheels spin', -33)
place(sfx, tick(0.05, 2000), 17.1, 'badge', -30)
place(sfx, blip(988, 1319, 0.14), 19.36, 'badge', -28)
# ---------------- cuts and moves (soft air)
for at, dur, g, nm in [(14.6, 0.55, -28, 'cut to the comparison'), (20.3, 0.55, -29, 'cut to the factory'), (21.96, 0.6, -26, 'cut to the disaster zone'),
                       (26.45, 0.55, -28, 'cut back to the lab'), (2.3, 1.6, -33, 'crane up: the cell'), (29.0, 1.4, -35, 'crane up over the backpack')]:
    place(sfx, sweep(dur, 300, 900, 2000, 6000, 0.8), at, nm, g)
# conveyor indexing
for a, b in [(4.3, 4.58), (6.02, 6.36), (20.62, 20.86), (21.62, 21.9)]:
    place(sfx, servo(b - a, 160, 210, 0.5), a, 'conveyor indexes', -31)
# ---------------- the disaster zone
F0, F1 = 22.27, 26.74
place(sfx, thud(48, 1.4) * 0.8, F0 + 0.05, 'distant rumble', -24)
place(sfx, trickle(1.2, 30), F0 + 0.6, 'debris trickles', -30)
place(sfx, trickle(0.9, 25), F0 + 2.6, 'debris trickles', -32)
for k2, at in enumerate(np.arange(24.6, 26.6, 0.5)):
    place(sfx, blip(1760, 1760, 0.06), at, 'camera feed scan' if k2 == 0 else None, -33)

# ---------------- music: a quiet pulse whose period divides the film exactly
BEATS = int(round(DUR * 100 / 60))
bpm = 60 * BEATS / DUR
beat = 60 / bpm
mus = np.zeros(N)
def pluck(f, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, 6))
    return lp(x, 2200) * np.exp(-tt / 0.1)
bassline = [55.0, 55.0, 58.27, 55.0, 49.0, 49.0, 51.91, 49.0]
arp = [440.0, 523.25, 622.25, 523.25, 392.0, 466.16, 587.33, 466.16]
for k in range(BEATS * 2):
    at = k * beat / 2
    b = bassline[(k // 4) % 8]
    n = int(beat / 2 * SR); tt = np.arange(n) / SR
    place(mus, np.sin(2 * np.pi * b * tt) * np.exp(-tt / 0.18) * 0.9, at)
    if k % 2 == 1:
        place(mus, hp(noise(int(0.04 * SR)), 6000) * np.exp(-np.arange(int(0.04 * SR)) / SR / 0.008) * 0.12, at)
    if k % 2 == 0:
        place(mus, pluck(arp[(k // 2) % 8], beat * 0.9) * 0.15, at)
padv = np.zeros(N)
for f, a in [(110.0, 0.4), (164.8, 0.22), (207.65, 0.16), (246.9, 0.1)]:
    padv += a * np.sin(2 * np.pi * f * t + 2 * np.sin(2 * np.pi * (5 / DUR) * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * (2 / DUR) * t))
mus += lp(padv, 900) * 0.35
mus *= 1 - 0.35 * win(F0, F1, 0.3)  # thinner under the disaster zone (the ambience carries it)

# ---------------- beds: lab room tone; outdoor air for the comparison; wind over rubble
lab = win(0, 14.89, 0.15) + win(20.6, 22.27, 0.1) + win(26.74, DUR + 0.0001, 0.1)
labtone = 0.6 * norm(circ(lambda x: bp(x, 200, 1800), noise(N))) + 0.35 * (np.sin(2 * np.pi * 100 * t) * 0.3 + np.sin(2 * np.pi * 150 * t) * 0.1)
outd = norm(circ(lambda x: bp(x, 300, 3000), noise(N))) * 0.5
wind = norm(circ(lambda x: lp(x, 500), noise(N))) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t)) + 0.3 * norm(circ(lambda x: bp(x, 1500, 5000), noise(N)))
amb = labtone * np.clip(lab, 0, 1) + outd * win(14.89, 20.6, 0.1) + 1.3 * wind * win(F0, F1, 0.12)

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Cyborg_Bug_Factory_narration_V1.wav'))
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
sfx = sfx * db(8.0)
sfx_d = limit(sfx * (1 - 0.25 * np.clip(venv * 3, 0, 1)), -8.0)  # effects bus soft-limited: no transient pokes over the voice
mix = voice + sfx_d + db(-27) * amb * duck + db(-24) * norm(mus) * duck
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
sf.write(os.path.join(EP, f'audio/mix/FGW_Cyborg_Bug_Factory_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
for nm, x in [('voice', voice * g), ('sfx', sfx_d * g), ('amb', db(-27) * amb * duck * g), ('music', db(-24) * norm(mus) * duck * g)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
def lufs_of(x):
    try: return round(meter.integrated_loudness(x), 2)
    except Exception: return None
# speech masking check: effects + music + ambience level against the voice, in 0.5 s windows where the voice speaks
bed = (sfx_d + db(-27) * amb * duck + db(-24) * norm(mus) * duck) * g
vv = voice * g
w = int(0.5 * SR)
worst = []
for i in range(0, N - w, w):
    rv = np.sqrt(np.mean(vv[i:i + w] ** 2)) + 1e-9
    if 20 * np.log10(rv) < -40: continue
    rb = np.sqrt(np.mean(bed[i:i + w] ** 2)) + 1e-9
    worst.append((round(i / SR, 2), round(20 * np.log10(rb / rv), 1)))
worst.sort(key=lambda x: -x[1])
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG),
       'voice_lufs_in_mix': lufs_of(vv), 'sfx_lufs_in_mix': lufs_of(sfx_d * g), 'music_lufs_in_mix': lufs_of(db(-24) * norm(mus) * duck * g),
       'music_bpm': round(bpm, 2), 'music_beats': BEATS, 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4),
       'bed_vs_voice_db_worst_windows': worst[:5]}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(sorted(LOG, key=lambda e: e['t']), open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
