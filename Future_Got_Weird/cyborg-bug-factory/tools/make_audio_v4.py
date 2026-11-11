#!/usr/bin/env python3
"""
V4: V3's mix minus the cues for removed graphics (HUD, labels, step bar, console); build clicks retimed.
V3: effects, music bed and mix for the Cyborg Bug Factory Short (V3 cues; same generators, levels and mix chain as V1). Everything is synthesised here (no samples, no
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
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v3'
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
# ---------------- V3 cues (times from source/src/v3/story3.ts, labShots3.tsx, build3.tsx, rubble3.tsx)
def steps(a, b, rate, g, name):
    first = True
    for at in np.arange(a, b, 1 / rate):
        for j in range(3):
            place(sfx, tick(0.012, 2500 + 2500 * rng.random()) * (0.5 + 0.5 * rng.random()), at + j * 0.012 + 0.006 * rng.random(), name if first else None, g)
            first = False
# the frame-0 cycle (these wrap: the end of the film runs into them)
place(sfx, servo(3.25, 360, 520), DUR - 2.5, 'arm brings the module down (into frame 0)', -35)
place(sfx, servo(0.4, 900, 1150, 0.4), 0.35, 'fine alignment', -31)
place(sfx, sweep(0.18, 2500, 4000, 6000, 9000, 1.0), 0.76, 'electrodes slide in', -30)
place(sfx, snap(1.0), 0.99, 'backpack latches (hooks)', -10)
place(sfx, tick(0.04, 2600), 1.07, 'gripper lets go', -25)
place(sfx, blip(), 1.15, 'status LED on', -18)
place(sfx, sweep(0.7, 300, 800, 2000, 5200, 0.8), 1.05, 'pull back to the workstation', -30)
place(sfx, servo(1.3, 380, 520), 1.2, 'arm returns to its initial position', -30)
place(sfx, tick(0.03, 2400), 2.9, 'battery plugged in', -25)
for at_, g in [(3.25, -25), (5.58, -31), (11.8, -25), (26.4, -33)]:
    place(sfx, sweep(0.12, 1500, 2500, 4000, 7000, 0.6) * 0.8 + 0.5 * tick(0.12, 1800), at_, 'rods lift (release)', g)
steps(3.4, 4.3, 4.6, -29, 'crawl 3.4-4.3')
# the 68-second cycle, sped up
for a_, b_ in [(4.28, 4.58), (5.98, 6.34), (15.9, 16.4), (27.86, 28.3)]:
    place(sfx, servo(b_ - a_, 170, 230, 0.5), a_, 'slider out and back', -29)
for a_, b_, g in [(4.3, 4.62, -30), (4.72, 4.86, -29), (4.9, 5.44, -28), (5.56, 6.35, -30)]:
    place(sfx, servo(b_ - a_, 620, 780), a_, 'arm (sped up)', g)
place(sfx, tick(0.05, 3300), 4.86, 'gripper closes', -25)
place(sfx, snap(0.5), 5.45, 'latch (sped up)', -17)
place(sfx, chime(), 5.6, 'the 68 s ring closes (fix -> release)', -23)
# real-time placement
for a_, b_, p, g in [(6.35, 7.12, 1.0, -26), (7.3, 8.6, 0.95, -25), (8.6, 9.75, 0.8, -27), (10.36, 11.0, 1.0, -28), (11.0, 12.0, 0.85, -33)]:
    place(sfx, servo(b_ - a_, 380 * p, 540 * p), a_, f'arm servo {a_:.2f}', g)
place(sfx, tick(0.05, 3300), 7.18, 'gripper grabs the module', -20)
place(sfx, sweep(0.4, 2500, 4000, 6000, 9000, 1.0), 9.35, 'electrodes slide in', -30)
place(sfx, snap(0.8), 10.13, 'module latches', -12)
place(sfx, blip(), 10.55, 'status LED on', -19)
place(sfx, tick(0.03, 2400), 10.9, 'battery plugged in', -25)
place(sfx, buzz(), 12.62, 'test pulse', -21)
steps(12.0, 14.85, 4.6, -31, 'crawl 12.0-14.9')
# the build: each part seats with a click; the wheel spins up; match cut to the legs
for k2, at_ in enumerate([15.08, 15.5, 15.62, 15.94, 16.06, 16.3, 16.5, 16.8, 17.08]):
    place(sfx, sweep(0.28, 800, 1500, 3000, 6000, 1.0), at_ - 0.3, None, -34)
    place(sfx, snap(0.25) * 0.8, at_, 'part seats' if k2 == 0 else None, -21)
place(sfx, servo(0.75, 1100, 1500, 0.5), 17.2, 'wheel motor spins', -28)
place(sfx, tick(0.04, 2600), 17.93, 'match cut', -29)
steps(17.93, 20.6, 4.0, -27, 'crawl 17.9-20.6 (macro)')
place(sfx, sweep(1.2, 300, 800, 1800, 4800, 0.8), 18.55, 'pull back to the whole insect', -32)
# the disaster zone
F0, F1 = 20.6, 26.74
place(sfx, thud(48, 1.6) * 0.8, F0 + 0.02, 'distant rumble', -24)
place(sfx, trickle(1.0, 30), 21.6, 'debris trickles', -31)
place(sfx, trickle(0.8, 25), 23.9, 'debris trickles', -33)
steps(22.1, 26.7, 5.0, -32, 'crawl 22.1-26.7')
place(sfx, sweep(0.7, 300, 700, 2000, 4500, 0.8), 24.7, 'rise for the route', -33)
place(sfx, tick(0.04, 3000), 26.74, 'cut back to the factory', -30)
# the ending: a finished cyborg walks off; the machine resets; the next module comes down (into frame 0)
steps(26.74, 27.9, 4.6, -30, 'crawl 26.7-27.9')
for a_, b_, p, g in [(25.9, 27.0, 1.0, -32), (27.3, 27.95, 1.0, -33), (28.05, DUR - 2.5, 0.9, -36)]:
    place(sfx, servo(b_ - a_, 380 * p, 540 * p), a_, 'arm resets / fetches the next module', g)
place(sfx, tick(0.05, 3300), 27.98, 'gripper takes the next module', -24)
place(sfx, sweep(1.1, 300, 800, 1800, 4800, 0.8), 27.3, 'pull back over the workstation', -33)

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
mus *= 1 - 0.35 * win(20.6, 26.74, 0.3)  # thinner under the disaster zone (the ambience carries it)

# ---------------- beds: lab room tone; outdoor air for the comparison; wind over rubble
lab = win(0, 20.6, 0.06) + win(26.74, DUR + 0.0001, 0.06)  # V3: hard cuts lab <-> rubble
labtone = 0.6 * norm(circ(lambda x: bp(x, 200, 1800), noise(N))) + 0.35 * (np.sin(2 * np.pi * 100 * t) * 0.3 + np.sin(2 * np.pi * 150 * t) * 0.1)
outd = norm(circ(lambda x: bp(x, 300, 3000), noise(N))) * 0.5
wind = norm(circ(lambda x: lp(x, 500), noise(N))) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t)) + 0.3 * norm(circ(lambda x: bp(x, 1500, 5000), noise(N)))
amb = labtone * np.clip(lab, 0, 1) + 1.3 * wind * win(20.6, 26.74, 0.06)

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
