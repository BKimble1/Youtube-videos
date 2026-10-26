#!/usr/bin/env python3
"""Score, effects and mix for FGW "Dead Spider" V1. Everything here is synthesised (no samples, no third-party music).
The narration is the selected take, sample for sample (gain only), starting at 0 s. The bed is a quiet, curious pad
with a sparse pluck figure, ducked under the voice. Effects are restrained and placed from the picture's own events
(audio/cues.json from tools/export_cues.ts): the needle tick, plunger slides, soft air, the joint's fluid, the pressure
falling, small leg contacts, the support's motion, the release. No whooshes on cuts, no impacts, no resurrection cues.
Levels: voice -17 LUFS; bed ~13 LU under it; the whole at about -14.5 LUFS with a -1.5 dBFS sample ceiling (true peak
measured on the 4x-oversampled mix).
Inputs : audio/narration/FGW_Dead_Spider_narration_V1.wav, audio/cues.json
Outputs: source/public/audio/mix.wav, audio/mix/FGW_Dead_Spider_V1_mix.wav, audio/mix/stems/*.wav,
         audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, TM, CUT, A, D, E, F = cj['DUR'], cj['TM'], cj['CUT'], cj['A'], cj['D'], cj['E'], cj['F']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(91)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def loopf(f): return round(f * DUR) / DUR
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    m = (idx >= 0) & (idx < N)
    buf[idx[m]] += sig[m]
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def noise(n): return rng.standard_normal(n)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]

# ---------------- voice ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Dead_Spider_narration_V1.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- bed: a soft pad in D minor, a sparse pluck, a faint high tone for unease ----------------
def pad(freqs, rate=0.1):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * loopf(rate + 0.03 * k) * t + k)
        out += a * lfo * (np.sin(2 * np.pi * loopf(f) * t) + 0.15 * np.sin(2 * np.pi * loopf(f * 2.003) * t))
    return out
pad_a = circ(lambda x: lp(x, 700), pad([(73.42, 0.5), (110.0, 0.32), (146.83, 0.18), (174.61, 0.12), (220.0, 0.06)]))
pad_b = circ(lambda x: lp(x, 800), pad([(65.41, 0.5), (98.0, 0.3), (130.81, 0.18), (155.56, 0.12), (196.0, 0.06)], 0.08))
sect = np.clip(win(CUT['specimenD'], DUR, 0.6, 0.01), 0, 1)
pads = pad_a * (1 - 0.5 * sect) + pad_b * 0.5 * sect + pad_a * 0.5 * sect
step = DUR / round(DUR / 0.36)
notes = [587.33, 698.46, 880.0, 698.46, 659.26, 523.25, 587.33, 440.0]
pluck = np.zeros(N)
for k in range(int(round(DUR / step))):
    f = loopf(notes[k % len(notes)]); n = int(0.5 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.22 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.1) * env(n, 0.003, 0.06)
    place(pluck, s * (0.55 + 0.45 * (k % 4 == 0)), k * step)
unease = 0.07 * np.sin(2 * np.pi * loopf(1174.66) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * loopf(0.23) * t))
cutaway = win(CUT['cutaway'], CUT['specimenD'], 0.25, 0.3)
music = pads + pluck * (0.09 - 0.04 * cutaway) + unease * (0.6 + 0.6 * cutaway)

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db):
    place(sfx, sig * db(gain_db), at); log.append({'name': name, 'at': round(at, 3), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1)})
def mixs(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out
def tick(f=3200, d=0.05, tau=0.008):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau)
def click(d=0.03):
    n = int(d * SR); tt = np.arange(n) / SR
    return bp(noise(n), 2500, 9000) * np.exp(-tt / 0.004) + 0.4 * np.sin(2 * np.pi * 2100 * tt) * np.exp(-tt / 0.006)
def air(d, lo, hi, shape=1.6):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    return bp(noise(n), lo, hi) * np.sin(np.pi * tt) ** shape
def slide(d, f0=520, f1=380):
    # rubber stopper sliding in the barrel: a soft squeak over filtered friction
    n = int(d * SR); ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / SR
    return (0.35 * bp(np.sign(np.sin(ph)), 500, 2500) + 0.6 * bp(noise(n), 900, 3500)) * env(n, 0.05, 0.12) * (0.7 + 0.3 * np.sin(np.linspace(0, 23, n)))
def servo(d, f=150):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * 2 * f * tt) + 0.2 * bp(noise(n), 300, 1200)) * env(n, 0.12, 0.18) * 0.5
def flow(d, lo=200, hi=900):
    n = int(d * SR); x = bp(noise(n), lo, hi)
    bub = np.zeros(n)
    for k in range(int(d * 14)):
        i = rng.integers(0, max(1, n - 4000)); m = 1800; tt = np.arange(m) / SR
        bub[i:i + m] += np.sin(2 * np.pi * (300 + 500 * rng.random()) * tt * (1 + 2 * tt)) * np.exp(-tt / 0.012) * 0.6
    return (0.6 * x + bub) * env(n, 0.1, 0.25)
def fall(d, f0=420, f1=140):
    n = int(d * SR); ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / SR
    return (np.sin(ph) + 0.15 * np.sin(2 * ph)) * env(n, 0.08, 0.35)
def creak(d=0.4, f0=380):
    n = int(d * SR); tt = np.arange(n) / SR
    f = f0 + 90 * np.sin(2 * np.pi * 3 * tt)
    return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + 0.3 * noise(n), 400, 2400) * env(n, 0.04, 0.15)
def pop(d=0.12):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * 160 * tt) * np.exp(-tt / 0.02) + 0.5 * bp(noise(n), 1000, 5000) * np.exp(-tt / 0.01)
def beep(d=0.12, f=2400):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * env(n, 0.005, 0.04) * 0.5

# A: the hook
add('needle touches the carapace (tick)', tick(3600, 0.05, 0.006), A['contact'], -30)
add('needle in (faint crunch)', bp(noise(int(0.06 * SR)), 1500, 6000) * np.exp(-np.arange(int(0.06 * SR)) / SR / 0.012), A['contact'] + 0.04, -38)
add('support raises the specimen (servo)', servo(A['lift1'] - A['lift0'], 140), A['lift0'], -44)
add('plunger slides (stopper squeak)', slide(A['plunger1'] - A['plunger0'] + 0.1), A['plunger0'], -40)
add('air through the needle (soft)', air(A['open1'] - A['open0'] + 0.4, 2500, 7500), A['open0'] - 0.25, -42)
add('legs unfold (dry rustle)', air(A['open1'] - A['open0'], 1500, 5500, 0.8) * 0.8, A['open0'], -41)
# C: the cutaway (illustration)
add('the body squeezes (low swell)', fall(0.8, 90, 140) * 0.8, TM['pressure1'] - 0.1, -38)
add('fluid runs out along the legs', flow(1.9, 220, 900), TM['pressure1'] + 0.1, -41)
add('the joint straightens (soft push)', mixs(fall(0.5, 180, 240) * 0.6, air(0.4, 400, 1600) * 0.4), TM['extend'] - 0.05, -39)
add('the flow stops', fall(0.6, 260, 190) * 0.4, TM['die'] + 0.1, -44)
add('pressure drops (falling tone)', fall(0.9, 380, 120), TM['drops'] - 0.1, -38)
add('legs curl (soft creak)', creak(1.2, 300) * 0.5, TM['curl'] - 0.3, -42)
# D: the operator and the block
add('plunger pushed (stopper squeak)', slide(D['push1'] - D['push0'] + 0.1, 560, 420), D['push0'], -38)
add('air into the specimen', air(D['open1'] - D['open0'] + 0.4, 2500, 7500), D['open0'] - 0.2, -42)
add('legs spread (dry rustle)', air(D['open1'] - D['open0'], 1500, 5500, 0.8) * 0.8, D['open0'], -41)
add('support lowers (servo)', servo(D['lower1'] - D['lower0'], 130), D['lower0'], -42)
add('finger off, plunger springs back', mixs(slide(0.3, 420, 600) * 0.7, pop(0.1) * 0.4), D['release0'], -36)
add('air out (short hiss)', air(0.45, 3000, 9000), D['release0'] + 0.03, -38)
for i, c in enumerate(D['contacts']):
    if c is not None: add(f'foot meets the block (leg {i})', click(0.03), c, -36 + (i % 3))
add('support lifts (servo)', servo(D['lift1'] - D['lift0'], 150), D['lift0'], -40)
add('block leaves the bench (tick)', tick(1900, 0.05, 0.01) * 0.6, D['clear'], -40)
# E: the load test
add('support lifts the load (servo)', servo(E['lift1'] - E['lift0'], 160), E['lift0'], -40)
add('weight leaves the pan (tick)', tick(2200, 0.05, 0.008), E['clear'], -36)
add('balance settles (beep)', beep(0.1, 2600), E['clear'] + 0.25, -46)
# F: reach down and pick up another spider
add('support lowers into the tray (servo)', servo(F['down1'] - F['down0'], 130), F['down0'], -41)
add('air in, legs open', air(F['open1'] - F['open0'] + 0.3, 2500, 7500), F['open0'] - 0.1, -42)
add('air out', air(0.45, 3000, 9000), F['close0'] - 0.05, -39)
for i, c in enumerate(F['contacts']):
    if c is not None: add(f'foot meets the second spider (leg {i})', click(0.025) * 0.8, c, -37 + (i % 3))
add('support lifts both (servo)', servo(F['lift1'] - F['lift0'], 150), F['lift0'], -39)
add('second spider leaves the tray (soft tick)', tick(1700, 0.05, 0.01) * 0.6, F['lift0'] + 0.25, -40)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.5 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 13 - lufs(music * duck))
mus_l *= np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.4, 0, 1) ** 0.5
sfx_l = sfx * db(4) * (1 - 0.3 * np.clip(ve * 6, 0, 1))
mix = voice_l + mus_l + sfx_l
g = -14.5 - lufs(np.stack([mix, mix], 1))
mix *= db(g)
lim = db(-1.5)
if np.abs(mix).max() > lim:
    mix = np.tanh(mix / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix.wav'), os.path.join(EP, 'audio/mix/FGW_Dead_Spider_V1_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
tp = 20 * np.log10(np.abs(resample_poly(mix, 4, 1)).max())
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2), 'true_peak_dbtp_4x': round(tp, 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
