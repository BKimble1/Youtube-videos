#!/usr/bin/env python3
"""Robot Metabolism V1: bed, effects and mix. The narration is used sample for sample (gain only). Everything else is
synthesised here (no samples, no third-party music), in the manner of the channel's recent Shorts
(glass-climbing/tools/v8/make_audio_v8.py): a low synthesised pad and soft pulse under the voice, ducked under speech,
and restrained effects placed from the picture's own state (audio/cues.json from tools/export_cues.ts):
  * motor whir that follows the measured length changes of the working links (module, body, replacement, the
    comparison robot quieter), so every whir is a real extension or contraction on screen;
  * one small magnetic contact cue at each connection (the hook, the replacement), a softer un-click at the release;
  * stick-tip taps when the tip plants and a light scuff while it slides; keyboard clicks for the operator;
  * the failed module's motor winding down (soft, no sparks or crunch); the dropped module settling on the mat;
  * quiet lab room tone. Effects are illustrative design, not recordings of this hardware.
Levels: voice -17 LUFS, bed ~15 LU under it and ducked, effects under the voice, whole -14 LUFS, ceiling -1.5 dBFS.
Inputs : audio/narration/FGW_Robot_Metabolism_narration_V1.wav, audio/cues.json
Outputs: source/public/audio/mix.wav, audio/mix/FGW_Robot_Metabolism_V1_mix.wav, audio/mix/stems/*.wav,
         audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, WORDS, ROWS, EV = cj['duration'], cj['words'], cj['rows'], cj['events']
FPS = cj['fps']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(71)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); na = min(n, max(1, int(a * SR))); nr = min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at):
    i = int(round(at * SR))
    if i >= N: return
    j = min(N, i + len(sig))
    if i < 0: sig, i = sig[-i:], 0
    buf[i:j] += sig[:j - i]
def word(w, n=0): return [x for x in WORDS if x['word'] == w][n]['start']

# ---------------- voice (unchanged) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Robot_Metabolism_narration_V1.wav'))
assert vsr == SR and abs(len(v) - N) <= 1, (vsr, len(v), N)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]

# ---------------- bed: a low pad and a soft pulse (about 104 bpm), slightly uneasy (a flat sixth in the pad) ----------
def pad(freqs, rate=0.1):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * (rate + 0.03 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * f * t)
    return out
pad_main = lp(pad([(73.42, 0.5), (110.0, 0.3), (146.83, 0.16), (116.54, 0.06), (220.0, 0.07)]), 600)
pad_air = lp(hp(pad([(440.0, 0.1), (587.33, 0.07), (698.46, 0.05)], 0.07), 300), 2400)
bpd = 60 / 104
pulse = np.zeros(N)
for k in range(int(DUR / bpd) + 1):
    n = int(0.3 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt / 0.07) + 0.1 * bp(noise(n), 1500, 5000) * np.exp(-tt / 0.006)
    place(pulse, s * (0.8 if k % 2 == 0 else 0.45), k * bpd)
# the bed thins under the close mechanism views and gently lifts toward the ending; it decays with the last image
detail = np.clip((t > word('with') - 0.1) & (t < word('a') + 0.1), 0, 1).astype(float)
detail = lp(detail, 2, 1)
ending = np.clip((t - word('so')) / 1.5, 0, 1)
tail = np.clip((DUR - t) / 0.6, 0, 1) ** 1.5
music = (pad_main * (0.9 - 0.2 * detail + 0.1 * ending) + pad_air * (0.3 + 0.4 * detail + 0.3 * ending) + pulse * (0.5 - 0.3 * detail - 0.2 * ending)) * tail

# ---------------- effects ----------------
sfx = np.zeros(N); key = np.zeros(N); log = []
def add(name, sig, at, gain_db, hero=False):
    place(key if hero else sfx, sig * db(gain_db), at)
    log.append({'name': name, 'at': round(at, 3), 'frame': round(at * FPS, 1), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1), 'hero': hero})

def per_frame(col):
    x = np.array([r[col] for r in ROWS], float)
    fr = np.arange(len(x)) / FPS
    return np.interp(t, fr, x)

def motor(activity, f0, gain):
    """a small geared DC motor: a buzzy fundamental with a gear whine, level and pitch following the activity"""
    a = lp(np.clip(activity, 0, None), 12, 1)
    a = np.clip(a / 0.25, 0, 1.4)
    f = f0 * (0.85 + 0.25 * np.clip(a, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    buzz = np.sign(np.sin(ph)) * 0.35 + np.sin(2 * ph) * 0.3 + np.sin(3.01 * ph) * 0.2
    whine = np.sin(ph * 7.3) * 0.15
    body = bp(buzz + whine + 0.15 * noise(N), 180, 3200)
    return body * a * db(gain)

mX = per_frame('mX'); mT = per_frame('mT'); mR = per_frame('mR'); mP = per_frame('mP')
motors = motor(mX, 210, -1) + motor(mT * 0.6, 150, -4) + motor(mR, 232, -1) + motor(mP * 0.8, 170, -12)
place(sfx, motors * db(-26), 0)
log.append({'name': 'motors: whir following the measured link activity (module X, body T, replacement R, comparison P)', 'at': 0, 'gain_db': -26})

def click(f=3200, d=0.09, low=140):
    n = int(d * SR); tt = np.arange(n) / SR
    a = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004) + 0.5 * np.sin(2 * np.pi * f * 1.7 * tt) * np.exp(-tt / 0.003)
    b = 0.8 * np.sin(2 * np.pi * low * tt) * np.exp(-tt / 0.02)
    return a + b + 0.25 * hp(noise(n), 3000) * np.exp(-tt / 0.002)
def unclick(d=0.12):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.5 * np.sin(2 * np.pi * 2300 * tt) * np.exp(-tt / 0.006) + 0.35 * np.sin(2 * np.pi * 120 * tt) * np.exp(-tt / 0.03)
def tap(d=0.1, f=900):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.6 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.01) + 0.6 * np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / 0.02) + 0.2 * bp(noise(n), 1500, 6000) * np.exp(-tt / 0.004)
def scuff(d):
    n = int(d * SR)
    return bp(noise(n), 900, 5000) * env(n, 0.02, 0.06) * 0.6
def keyclick():
    n = int(0.06 * SR); tt = np.arange(n) / SR
    return 0.5 * bp(noise(n), 1800, 7000) * np.exp(-tt / 0.006) + 0.4 * np.sin(2 * np.pi * 260 * tt) * np.exp(-tt / 0.012)
def winddown(d=0.55, f0=210):
    n = int(d * SR); tt = np.arange(n) / SR
    f = f0 * (1 - 0.75 * (tt / d) ** 0.7)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return bp(np.sign(np.sin(ph)) * 0.35 + np.sin(2 * ph) * 0.3, 120, 2500) * (1 - tt / d) ** 1.5
def air(d, lo, hi):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    return bp(noise(n), lo, hi) * np.sin(np.pi * tt) ** 1.6
def settle(d=0.2):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.6 * np.sin(2 * np.pi * 110 * tt) * np.exp(-tt / 0.03) + 0.25 * bp(noise(n), 600, 3000) * np.exp(-tt / 0.02) + 0.3 * tap(d, 640)[:n]

# the two connections: one small contact cue each (on the unducked bus so it reads over the words)
add('CONNECT: the module snaps onto the robot (magnetic contact)', click(3300, 0.1, 150), EV['hookContact'] - 0.005, -16, True)
add('CONNECT: the replacement snaps on (magnetic contact)', click(3100, 0.1, 140), EV['rContact'] - 0.005, -16, True)
add('the connector cut-away opens (air, faint)', air(0.5, 600, 2400), EV['sectionOn'], -44)
add('the cut-away closes (air, faint)', air(0.4, 600, 2000), EV['sectionOff'] - 0.1, -46)
for k in EV['keys']:
    add('a key press', keyclick(), k - 0.01, -26)
add('weight settles onto the stick (creak)', settle(0.25), EV['stickSettle'] + 0.25, -32)
add('FAIL: the module\'s motor winds down', winddown(0.6, 205), EV['die'] - 0.05, -27)
add('the dead module settles flat on the mat', settle(0.2), EV['lowered'] - 0.02, -30)
add('the connector lets go (soft un-click)', unclick(), EV['release'], -24)
# stick tips: a tap when a sliding tip stops (plants), a light scuff while it slides
tip = np.array([r['tip'] for r in ROWS]); world = [r['world'] for r in ROWS]
for i in range(1, len(tip)):
    if world[i] != world[i - 1]: continue
    if tip[i - 1] > 0.05 and tip[i] < 0.01:
        add('the stick tip plants on the surface (tap)', tap(0.09, 820), i / FPS, -31)
seg = None
for i in range(len(tip)):
    if tip[i] > 0.06 and seg is None: seg = i
    if (tip[i] <= 0.06 or i == len(tip) - 1) and seg is not None:
        if i - seg >= 3: add('the stick tip slides (scuff)', scuff((i - seg) / FPS), seg / FPS, -38)
        seg = None
# room tone
room = lp(hp(noise(N), 80), 900) * 0.25 + 0.05 * np.sin(2 * np.pi * 60 * t)
place(sfx, room * db(-44), 0)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.45 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 15 - lufs(music * duck))
sfx_l = sfx * db(3) * (1 - 0.3 * np.clip(ve * 6, 0, 1))
key_l = key * db(3)
mix = voice_l + mus_l + sfx_l + key_l
g = -14 - lufs(np.stack([mix, mix], 1))
mix *= db(g)
lim = db(-1.5)
if np.abs(mix).max() > lim:
    mix = np.tanh(mix / lim) * lim
# a short fade at the very end (no click into silence)
fe = int(0.05 * SR); mix[-fe:] *= np.linspace(1, 0, fe)
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix.wav'), os.path.join(EP, 'audio/mix/FGW_Robot_Metabolism_V1_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', (sfx_l + key_l) * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l + key_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice[:N], (voice_l * db(g)))[0, 1])
tp = 20 * np.log10(np.abs(resample_poly(mix, 4, 1)).max())
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'true_peak_dbtp_4x': round(tp, 2), 'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR,
        'voice_stem_vs_source_corr': round(corr, 6), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
