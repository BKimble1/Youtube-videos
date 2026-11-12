#!/usr/bin/env python3
"""V5 effects and mix for the Mushroom Robot Short (V1 recipe; the box knock and rattle are gone with the box,
the chain is one controller blip and the valve). Everything is synthesised here (no samples, no music bed); every
effect is placed from the picture's own events (audio/cues.json, exported from timing.ts / robot.ts / SignalWorld.tsx).

  room      a quiet lab air wash, loop-seamless (filtered as if periodic)
  fungal    a restrained organic texture: slow breathing band of noise and sparse soft wet ticks (louder in the macro)
  spike     each detected spike: a short electrical crackle (sparse impulses through a bright band) + a tiny zip
  valve     each leg actuation: a precise mechanical tick (the valve) and a short air hiss
  landing   each foot landing: a soft silicone pat
  chain     the followed spike: a blip at each stage (amp, filter, detect), the solenoid clack and the air rush
  match     a soft airy push as we dive into the dome; the wipe: the air line passing the lens
  UV        the lamp swinging in, a click on, a faint mains hum and fizz while lit, a click off
  comedy    the splat (squish), the bonk (hollow plastic knock + tip rattle), the paws on the box
The narration master is used sample for sample; effects sit under it and duck while it speaks.
Levels: about -14 LUFS integrated (stereo file), true peak below -1.5 dBTP.
usage: python3 tools/make_audio.py [mix_name]"""
import json, os, sys, hashlib
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(EP)
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v5'
cj = json.load(open('audio/cues_v5.json'))
DUR = cj['DUR']; N = int(round(DUR * SR)); t = np.arange(N) / SR
rng = np.random.default_rng(424242)

def db(x): return 10 ** (x / 20)
def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('lowpass', f, o), x)
def hp(x, f, o=2): return sosfilt(sos('highpass', f, o), x)
def bp(x, lo, hi, o=2): return sosfilt(sos('bandpass', [lo, hi], o), x)
def circ(x, H):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X * H(f), len(x))
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    tt = np.arange(n) / SR; return e * np.exp(-np.maximum(0, tt - a) / r)

fx = np.zeros(N)
def add(sig, at, gain_db=0.0):
    """add a sound at time `at`; anything past the end wraps to the start (the film loops)"""
    i = int(round(at * SR)) % N
    s = sig * db(gain_db)
    n1 = min(len(s), N - i); fx[i:i + n1] += s[:n1]
    if n1 < len(s): fx[:len(s) - n1] += s[n1:]

# ---------------------------------------------------------------- beds (periodic, so the loop is seamless)
w = rng.standard_normal(N)
room = circ(w, lambda f: (f > 40) / np.sqrt(np.maximum(f, 40) / 40) * (f < 2500))
room = room / np.std(room) * db(-50)
# fungal texture: a slow breathing band, louder in the macro shots
band = circ(rng.standard_normal(N), lambda f: np.exp(-((np.log(np.maximum(f, 1) / 700)) ** 2) / 0.3))
band /= np.std(band)
breath = 0.55 + 0.45 * np.sin(2 * np.pi * 9 * t / DUR) * np.sin(2 * np.pi * 4 * t / DUR + 1)
macro = np.clip((t - cj['SEG']['matchA0']) / 0.4, 0, 1) * np.clip((cj['SEG']['wipe0'] - t) / 0.3, 0, 1)
fungal = band * breath * (db(-52) + db(-40) * macro)
ticks = np.zeros(N)
for k in rng.choice(N, 220, replace=False):
    ticks[k] = rng.uniform(0.3, 1) * (1 if rng.random() < 0.5 else -1)
ticks = circ(ticks, lambda f: np.exp(-((np.log(np.maximum(f, 1) / 2600)) ** 2) / 0.15))
ticks = ticks / (np.max(np.abs(ticks)) + 1e-9) * (db(-46) + db(-34) * macro)
fx += room + fungal + ticks

# ---------------------------------------------------------------- event sounds
def crackle(amp=1.0, dur=0.11):
    n = int(dur * SR); s = np.zeros(n)
    for _ in range(int(14 * amp) + 6):
        k = int(rng.uniform(0, 0.7) ** 1.6 * n); s[min(k, n - 1)] += rng.uniform(-1, 1)
    s = bp(s, 2500, 9000) * np.exp(-np.arange(n) / SR / (dur * 0.45))
    zip_ = np.sin(2 * np.pi * np.cumsum(np.linspace(2200, 5200, n)) / SR) * env(n, 0.002, 0.018) * 0.25
    return (s / (np.max(np.abs(s)) + 1e-9) + zip_) * min(1.4, amp)
def tick():
    n = int(0.03 * SR); s = rng.standard_normal(n) * env(n, 0.0003, 0.0025)
    return bp(s, 2200, 7000) * 1.4 + np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * env(n, 0.0005, 0.004) * 0.5
def hiss(dur=0.16, lo=1800, hi=7000):
    n = int(dur * SR); s = bp(rng.standard_normal(n), lo, hi)
    e = np.minimum(1, np.arange(n) / (0.012 * SR)) * np.exp(-np.arange(n) / SR / (dur * 0.35))
    return s / np.std(s) * e * 0.35
def pat(f0=140):
    n = int(0.09 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f0 * tt * (1 - 0.3 * tt / 0.09)) * env(n, 0.002, 0.022)
    return lp(s + 0.15 * rng.standard_normal(n) * env(n, 0.0005, 0.006), 1400)
def blip(f, dur=0.07):
    n = int(dur * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * env(n, 0.003, dur * 0.3) * 0.6
def clack():
    n = int(0.12 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 420 * tt) * env(n, 0.0008, 0.025) + 0.6 * np.sin(2 * np.pi * 1130 * tt) * env(n, 0.0005, 0.012)
    return body + 0.6 * bp(rng.standard_normal(n), 2000, 8000) * env(n, 0.0002, 0.004)
def whoosh(dur, f0, f1, gain=1.0):
    n = int(dur * SR); s = rng.standard_normal(n); out = np.zeros(n)
    fc = np.geomspace(f0, f1, n); blk = 512
    for i in range(0, n, blk):
        c = fc[i]; out[i:i + blk] = bp(s[i:i + blk + 0], max(80, c * 0.6), min(16000, c * 1.6))[:len(out[i:i + blk])]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return lp(out, 9000) / (np.std(out) + 1e-9) * e * 0.3 * gain
def knock(f=880):
    n = int(0.25 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * f * 2.13 * tt) + 0.35 * np.sin(2 * np.pi * f * 0.52 * tt)) * env(n, 0.0005, 0.045)
    return s + 0.5 * bp(rng.standard_normal(n), 1500, 6000) * env(n, 0.0002, 0.006)
def rattle(dur=0.35, count=40):
    n = int(dur * SR); s = np.zeros(n)
    for _ in range(count):
        k = int(rng.uniform(0, 1) ** 2 * n * 0.9); seg = bp(rng.standard_normal(200), 3000, 9000) * np.exp(-np.arange(200) / 30)
        s[k:k + 200] += seg[:len(s[k:k + 200])] * rng.uniform(0.2, 1)
    return s * np.exp(-np.arange(n) / SR / (dur * 0.4)) * 0.5
def squish(dur=0.42):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = 220 * np.exp(-tt * 5) + 70
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, 0.12)
    sq = np.sin(2 * np.pi * np.cumsum(900 + 500 * np.sin(2 * np.pi * 7 * tt)) / SR) * env(n, 0.04, 0.06) * 0.12
    return lp(s + 0.4 * bp(rng.standard_normal(n), 300, 1500) * env(n, 0.005, 0.08), 2500) + sq

spikes, swings, lands = cj['spikes'], cj['swings'], cj['landings']
SEG, UVc, T = cj['SEG'], cj['UV'], cj['T']
inB = lambda x: any(s_['kind'] == 'B' and s_['t0'] <= x < s_['t1'] for s_ in cj['shots'])
for s in spikes:
    if s['kind'] == 'featured':
        continue
    add(crackle(s['amp']), s['t'] - 0.01, -17 + (3 if s['amp'] > 1.2 else 0) - (4 if inB(s['t']) else 0))
    if s['kind'] == 'uv':  # under UV the spikes come as bursts along several branches: two quick extra crackles
        add(crackle(0.9, 0.07), s['t'] - 0.05, -21); add(crackle(0.8, 0.06), s['t'] - 0.09, -23)
for s in swings:
    if inB(s['t']):
        continue
    add(tick(), s['t'], -21)
    add(hiss(0.14 if s['kind'] != 'uv' else 0.1), s['t'] + 0.005, -27)
for l in lands:
    if inB(l['t']):
        continue
    add(pat(130 + 25 * (l['i'] % 3)), l['t'], -18 + (1.5 if l['kind'] == 'uv' else 0))
# the featured spike, followed down the chain (slowed)
ch = cj['chain']
add(crackle(1.6, 0.18), ch['electrode'] - 0.02, -12)  # the followed spike reaches its electrode
add(blip(880, 0.09), ch['controller'], -20)
add(clack(), ch['valve'] - 0.03, -13)
add(whoosh(0.5, 900, 3500, 1.2), ch['valve'], -16)  # air into the line
add(whoosh(0.35, 500, 2600, 1.2), ch['valve'] + 0.25, -17)  # air reaching the leg
# UV
add(whoosh(1.1, 150, 700, 0.8), UVc['swingIn0'], -24)
add(clack() * 0.6, UVc['on'], -16); add(tick(), UVc['on'], -16)
hum_env = np.clip((t - UVc['on']) / 0.05, 0, 1) * np.clip((UVc['off'] - t) / 0.08, 0, 1)
hum = (np.sin(2 * np.pi * 120 * t) + 0.3 * np.sin(2 * np.pi * 240 * t)) * db(-40) + bp(rng.standard_normal(N), 5000, 11000) * db(-50)
fx += hum * hum_env
add(tick(), UVc['off'], -18)
add(whoosh(0.7, 600, 180, 0.7), UVc['off'] + 0.05, -26)
# comedy beats: the soft legs giving way; the in-place shuffle is carried by its own steps
add(squish(), cj['sag'] + 0.1, -13)

# ---------------------------------------------------------------- mix
voice, vsr = sf.read('audio/narration/FGW_Mushroom_Robot_narration_V1.wav')
assert vsr == SR
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
# duck the effects under the words (envelope of the voice, 30 ms attack, 250 ms release)
a = np.abs(voice); e = np.zeros(N); g_a, g_r = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.25 * SR)); v = 0.0
blk = 48
ab = a[: N // blk * blk].reshape(-1, blk).max(1)
eb = np.zeros_like(ab)
for i, x in enumerate(ab):
    v = x if x > v else v * g_r ** blk; eb[i] = v
e[: len(eb) * blk] = np.repeat(eb, blk)
duck = db(-5.5 * np.clip(e / 0.05, 0, 1))
mix = voice * db(0) + fx * duck
stereo = np.stack([mix, mix], 1)
meter = pyln.Meter(SR)
L = meter.integrated_loudness(stereo)
stereo *= db(-14.0 - L)
# true-peak limiter (4x oversampled peak, smooth gain)
def tp(x): return np.max(np.abs(resample_poly(x, 4, 1)))
ceil = db(-1.6)
up = np.abs(resample_poly(stereo[:, 0], 4, 1)).reshape(-1, 4).max(1)[:N]
need = np.minimum(1, ceil / np.maximum(up, 1e-9))
win = int(0.004 * SR)
from scipy.ndimage import minimum_filter1d, uniform_filter1d
g = uniform_filter1d(minimum_filter1d(need, win * 2 + 1), win * 2 + 1)
g = np.minimum(g, need)
stereo *= g[:, None]
os.makedirs('audio/mix', exist_ok=True); os.makedirs('source/public/audio', exist_ok=True)
out = f'audio/mix/FGW_Mushroom_Robot_{NAME.upper()}.wav'
sf.write(out, stereo, SR, subtype='PCM_24')
sf.write(f'source/public/audio/{NAME}.wav', stereo, SR, subtype='PCM_24')
fxonly = np.stack([fx * duck, fx * duck], 1) * db(-14.0 - L)
res = {'mix': out, 'sha256': hashlib.sha256(open(out, 'rb').read()).hexdigest(), 'lufs_integrated_stereo': round(meter.integrated_loudness(stereo), 2),
       'true_peak_dbtp': round(20 * np.log10(tp(stereo[:, 0])), 2), 'limiter_max_reduction_db': round(float(-20 * np.log10(g.min())), 2),
       'voice_vs_effects_rms_db': round(float(20 * np.log10(np.std(voice[voice != 0]) / np.std(fx * duck))), 1),
       'loop_seam_jump': round(float(abs(stereo[-1, 0] - stereo[0, 0])), 5), 'duration_s': round(N / SR, 3)}
json.dump(res, open(f'audio/mix/mix_measure_{NAME}.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
