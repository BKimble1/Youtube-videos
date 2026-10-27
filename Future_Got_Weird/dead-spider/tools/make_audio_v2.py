#!/usr/bin/env python3
"""Score, effects and mix for FGW "Dead Spider" V2 (built from the V1 tool: same synthesised bed and effect voices). Everything here is synthesised (no samples, no third-party music).
The narration is the selected take, sample for sample (gain only), starting at 0 s. The bed is a quiet, curious pad
with a sparse pluck figure, ducked under the voice. Effects are restrained and placed from the picture's own events
(audio/cues.json from tools/export_cues.ts): the needle tick, plunger slides, soft air, the joint's fluid, the pressure
falling, small leg contacts, the support's motion, the release. No whooshes on cuts, no impacts, no resurrection cues.
Levels: voice -17 LUFS; bed ~13 LU under it; the whole at about -14.5 LUFS with a -1.5 dBFS sample ceiling (true peak
measured on the 4x-oversampled mix).
Inputs : audio/narration/FGW_Dead_Spider_narration_V2.wav, audio/cues_v2.json
Outputs: source/public/audio/mix_v2.wav, audio/mix/FGW_Dead_Spider_V2_mix.wav, audio/mix/stems_v2/*.wav,
         audio/mix/mix_measure_v2.json, audio/sfx_cues_v2.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v2.json')))
DUR, TM, CUT, H, L = cj['DUR'], cj['TM'], cj['CUT'], cj['hook'], cj['lab']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(92)

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
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Dead_Spider_narration_V2.wav'))
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
sect = np.clip(win(CUT['lab'], DUR, 0.6, 0.01), 0, 1)
pads = pad_a * (1 - 0.5 * sect) + pad_b * 0.5 * sect + pad_a * 0.5 * sect
step = DUR / round(DUR / 0.36)
notes = [587.33, 698.46, 880.0, 698.46, 659.26, 523.25, 587.33, 440.0]
pluck = np.zeros(N)
for k in range(int(round(DUR / step))):
    f = loopf(notes[k % len(notes)]); n = int(0.5 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.22 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.1) * env(n, 0.003, 0.06)
    place(pluck, s * (0.55 + 0.45 * (k % 4 == 0)), k * step)
unease = 0.07 * np.sin(2 * np.pi * loopf(1174.66) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * loopf(0.23) * t))
cutaway = win(CUT['leg'], CUT['lab'], 0.25, 0.3)
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

def snap(d=0.16, f0=900, f1=2600):
    # crisp leg extension: a quick rising flick of dry noise and a short tonal sweep
    n = int(d * SR); tt = np.linspace(0, 1, n)
    ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / SR
    return (0.7 * bp(noise(n), 1800, 7000) * (1 - tt) ** 2 + 0.35 * np.sin(ph) * np.exp(-tt * 4)) * env(n, 0.004, 0.06)
def clink(f=2900, d=0.35):
    # a small foam block landing on a glass dish
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * 2.76 * f * tt) + 0.25 * np.sin(2 * np.pi * 5.4 * f * tt)) * np.exp(-tt / 0.07) + 0.6 * bp(noise(n), 800, 3000) * np.exp(-tt / 0.006)

# HOOK: needle in, press, the legs spring open; air let out, legs sag; pressed again on "MOVE"
add('needle touches the carapace (tick)', tick(3600, 0.05, 0.006), H['contact'], -29)
add('needle in (faint crunch)', bp(noise(int(0.06 * SR)), 1500, 6000) * np.exp(-np.arange(int(0.06 * SR)) / SR / 0.012), H['contact'] + 0.06, -37)
add('stopper pushed (squeak)', slide(H['press1'] - H['press0'] + 0.08, 560, 420), H['press0'], -38)
add('air down the needle', air(0.45, 2500, 7500), H['press0'] + 0.05, -40)
add('legs spring open (crisp)', snap(0.18), H['open'] - 0.1, -31)
add('air let out (short hiss)', air(0.35, 3000, 9000), H['release0'], -40)
add('stopper back (squeak)', slide(0.25, 420, 560) * 0.6, H['release0'], -42)
add('legs sag (soft creak)', creak(0.35, 320) * 0.5, H['sag'], -44)
add('stopper pushed again', slide(H['press2_1'] - H['press2_0'] + 0.08, 580, 430), H['press2_0'], -38)
add('legs snap open on MOVE (crisp)', snap(0.2, 1000, 3000), H['open2'] - 0.12, -30)
# BEAT A: death and the curl
add('life drains (low falling tone)', fall(0.9, 220, 120) * 0.6, TM['dies'] + 0.05, -42)
add('legs curl inward (dry creak)', creak(1.0, 300) * 0.6, TM['curl'] - 0.15, -40)
# BEAT B: the cutaway
add('the leg bends (soft creak)', creak(0.45, 360) * 0.4, 8.3, -46)
add('the body squeezes (low swell)', fall(0.7, 90, 140) * 0.8, TM['fluid'] - 0.1, -39)
add('fluid runs down the leg', flow(1.4, 220, 900), TM['pressure1'] - 0.05, -41)
add('the joint straightens (soft push)', mixs(fall(0.45, 180, 240) * 0.6, air(0.35, 400, 1600) * 0.4), TM['straighten'] - 0.05, -38)
add('the flow stops', fall(0.6, 260, 190) * 0.4, TM['die'] + 0.05, -44)
add('pressure disappears (falling tone)', fall(0.9, 380, 120), TM['pressure2'] - 0.05, -38)
add('legs curl (soft creak)', creak(0.9, 300) * 0.5, TM['disappears'] + 0.05, -42)
# LAB C: syringe attached, needle in, the air pumped, the legs spread
add('arm comes down the rod (servo)', servo(L['descend1'] - L['descend0'], 130), L['descend0'], -44)
add('needle touches the carapace (tick)', tick(3400, 0.05, 0.006), L['contact'], -30)
add('needle in (faint crunch)', bp(noise(int(0.06 * SR)), 1500, 6000) * np.exp(-np.arange(int(0.06 * SR)) / SR / 0.012), L['contact'] + 0.08, -37)
add('arm lifts the spider off the pad (servo)', servo(L['padLift1'] - L['padLift0'], 150), L['padLift0'], -43)
add('plunger pushed (stopper squeak)', slide(L['push1'] - L['push0'] + 0.08, 560, 420), L['push0'], -37)
add('air travels down the needle', air(L['pulse1'] - L['pulse0'] + 0.2, 2200, 6500, 1.2), L['pulse0'], -41)
add('legs stir (faint rustle)', air(0.3, 1500, 5000, 0.8) * 0.7, L['stir'], -45)
add('second push (squeak)', slide(L['push2_1'] - L['push2_0'] + 0.08, 600, 440), L['push2_0'], -37)
add('legs spread OPEN (crisp)', snap(0.22, 900, 2800), L['open'] - 0.14, -29)
add('arm swings to the block (servo)', servo(L['lower1'] - L['swing0'], 140), L['swing0'], -44)
# LAB D: release, clamp
add('finger off the plunger (tap)', pop(0.08) * 0.5, L['finger_off'], -40)
add('plunger rises, air out (hiss)', mixs(slide(L['plunger_up1'] - L['plunger_up0'], 420, 600) * 0.5, air(L['plunger_up1'] - L['plunger_up0'], 3000, 9000) * 0.8), L['plunger_up0'], -40)
for i, c in enumerate(L['clampContacts']):
    if c is not None: add(f'foot clamps the block (leg {i})', click(0.03), c, -35 + (i % 3))
add('block lifted (servo)', servo(L['lift1'] - L['lift0'], 150), L['lift0'], -41)
add('block leaves the bench (tick)', tick(1900, 0.05, 0.01) * 0.6, L['blockClear'], -40)
# WORKING CLAW: carry, drop into the dish
add('arm swings over the dish (servo)', servo(L['carry1'] - L['carry0'], 145), L['carry0'], -43)
add('plunger pushed (squeak)', slide(L['press1'] - L['press0'] + 0.08, 580, 430), L['press0'], -38)
add('legs open, letting go (crisp)', snap(0.16, 1100, 2600) * 0.8, L['dropOpen'], -33)
for k, b in enumerate(L['drop']['bounces']):
    add(f'block lands in the dish ({k})', clink(2900 - 200 * k, 0.3) * (0.8 if k == 0 else 0.35), b, -33)
add('arm swings on (servo)', servo(L['swing2_1'] - L['swing2_0'], 140), L['swing2_0'], -44)
# FINAL: reach down, clamp on ANOTHER dead spider, lift
add('arm comes down over the second spider (servo)', servo(L['descend2_1'] - L['descend2_0'], 125), L['descend2_0'], -43)
add('air let out (hiss)', air(0.4, 3000, 9000), L['release0'], -39)
for i, c in enumerate(L['s2Contacts']):
    if c is not None: add(f'foot clamps the second spider (leg {i})', click(0.025) * 0.8, c, -36 + (i % 3))
add('both lifted (servo)', servo(L['lift2_1'] - L['lift2_0'], 155), L['lift2_0'], -39)
add('second spider leaves the pad (soft tick)', tick(1700, 0.05, 0.01) * 0.6, L['s2Clear'], -39)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.5 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 13 - lufs(music * duck))
# the bed runs to the last frame (the picture cuts on action; no fade tail)
mus_l *= np.clip(t / 0.05, 0, 1) * np.clip((DUR - t) / 0.08, 0, 1)
sfx_l = sfx * db(4) * (1 - 0.3 * np.clip(ve * 6, 0, 1))
mix = voice_l + mus_l + sfx_l
g = -14.5 - lufs(np.stack([mix, mix], 1))
mix *= db(g)
lim = db(-1.5)
if np.abs(mix).max() > lim:
    mix = np.tanh(mix / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems_v2'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v2.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v2.wav'), os.path.join(EP, 'audio/mix/FGW_Dead_Spider_V2_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v2/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
tp = 20 * np.log10(np.abs(resample_poly(mix, 4, 1)).max())
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2), 'true_peak_dbtp_4x': round(tp, 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v2.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v2.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
