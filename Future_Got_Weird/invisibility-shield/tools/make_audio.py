#!/usr/bin/env python3
"""Score, effects and mix for FGW "This Shield Can Make You Disappear." Everything is synthesised here (no samples,
no paid generation, no third-party music). Voice-led, restrained:
  - a suspense pulse: a low minor pad and a soft heartbeat-like pulse, with a quiet plucked figure that brightens
    inside the mechanism section; every partial, LFO and beat completes a whole number of cycles in the film, and
    noise is cross-faded across the seam, so the bed loops sample-continuously;
  - purposeful effects on physical events only: the panel lift (air + polycarbonate flex + grip settle), one subtle
    glassy optical shimmer as his body goes behind the panel, a soft lens tick, the section's fold open/close, warm and
    cool tonal sweeps under the two light paths, the alignment settle, a tactile accent as the hand clears the edge
    and a tiny flutter for the finger ripple, the lowering and the carry aside, and the next lift's anticipation.
    No electrical hum, no repeated transition whooshes.
Inputs : audio/narration/FGW_Invisibility_Shield_narration_final.wav, audio/cues.json (tools/export_cues.ts)
Outputs: source/public/audio/mix.wav, audio/mix/FGW_Invisibility_Shield_V1_mix.wav, audio/mix/stems/*.wav,
         audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
C, DUR, WORDS = cj['CUE'], cj['DUR'], cj['WORDS']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(31)
w = lambda i: WORDS[i]['start']

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR
def db(x): return 10 ** (x / 20)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at, wrap=True):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    np.add.at(buf, idx % N, sig) if wrap else None
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]

# ---------------- voice ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Invisibility_Shield_narration_final.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- music bed (loop-continuous) ----------------
section = win(C['cut0'], C['close1'], 0.4, 0.5)
def pad(freqs):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.72 + 0.28 * np.sin(2 * np.pi * loopf(0.11 + 0.035 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * loopf(f) * t)
    return out
low = circ(lambda x: lp(x, 520), pad([(73.42, 0.5), (110.0, 0.3), (146.83, 0.16), (174.61, 0.1)]))  # D minor, low
beats = int(round(DUR / 0.62)); bpd = DUR / beats
pulse = np.zeros(N)
for k in range(beats):
    n = int(0.28 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 50 * tt) * np.exp(-tt / 0.075)
    place(pulse, s * (0.75 if k % 2 == 0 else 0.42), k * bpd)
notes = [587.33, 698.46, 880.0, 698.46, 783.99, 659.26]  # D5 F5 A5 F5 G5 E5
steps = int(round(DUR / 0.31)); sp = DUR / steps
pluck = np.zeros(N)
for k in range(steps):
    f = loopf(notes[k % len(notes)]); n = int(0.5 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.1) * env(n, 0.004, 0.05)
    place(pluck, s * (0.55 + 0.45 * (k % 4 == 0)), k * sp)
X = int(1.0 * SR)
nz = bp(rng.standard_normal(N + X), 2500, 8000)
nz[:X] = nz[:X] * np.linspace(0, 1, X) + nz[N:N + X] * np.linspace(1, 0, X)
air = nz[:N] * 0.04
# the floating hand and the reveal: the pulse thins and the pad opens; the knowing ending lifts a little
hand = win(C['out1'], C['back0'], 0.3, 0.4)
music = low * (0.9 + 0.2 * hand) + pulse * 0.5 * (1 - 0.45 * hand) + pluck * (0.08 + 0.10 * section + 0.05 * hand) + air * section
music *= 1 + 0.2 * win(C['smirk0'], DUR, 0.4, 0.01)

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db):
    place(sfx, sig * db(gain_db), at); log.append({'name': name, 'at': round(at % DUR, 3), 'dur': round(len(sig) / SR, 3), 'gain_db': gain_db})
def tone(f, d, a=0.01, r=0.25, harm=0.25):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + harm * np.sin(4 * np.pi * f * tt)) * env(n, a, r)
def soft_air(d, lo, hi, rise=True):
    n = int(d * SR); tt = np.linspace(0, 1, n); x = rng.standard_normal(n); out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]; fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return lp(out, hi * 1.2) * np.sin(np.pi * tt) ** 1.6
def thud(f=90, d=0.25, nz=0.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) + nz * lp(rng.standard_normal(n), 500) * np.exp(-tt / 0.02)
def flex(d=0.35):
    # polycarbonate sheet flex: a low wobbling bandpassed noise with a faint pitched warble
    n = int(d * SR); tt = np.arange(n) / SR
    wob = np.sin(2 * np.pi * 9 * tt)
    return (bp(rng.standard_normal(n), 300, 1400) * (0.6 + 0.4 * wob) + 0.25 * np.sin(2 * np.pi * (180 + 40 * wob) * tt)) * env(n, 0.04, 0.2)
def shimmer(d=1.1, f=1567.98):
    n = int(d * SR); tt = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * tt + 0.3 * np.sin(2 * np.pi * 5 * tt)) for m, a in [(1, 1), (1.5, 0.4), (2.0, 0.25)])
    return s * np.exp(-tt / 0.45) * env(n, 0.06, 0.3)
def tick(f=3200, d=0.05):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.008)
def fold(d=0.3):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), 900, 5000) * np.exp(-tt * 9) + 0.5 * thud(140, d, 0.1)[:n]
def sweep(f0, f1, d):
    n = int(d * SR); tt = np.arange(n) / SR; ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / SR
    return (np.sin(ph) + 0.2 * np.sin(2 * ph)) * env(n, 0.15, 0.35)
def pop(d=0.18):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (520 - 260 * tt / d) * tt) * np.exp(-tt / 0.035) + 0.3 * bp(rng.standard_normal(n), 1500, 6000) * np.exp(-tt / 0.01)

# A: the lift (its start sits in the loop's tail and wraps into frame 0), the optical shimmer as he goes behind it
add('lift: air', soft_air(1.3, 260, 1300), C['liftStart'] - 0.05, -30)
add('lift: panel flex', flex(0.4), C['liftStart'] + 0.15, -31)
add('optical shimmer (body behind the panel)', shimmer(1.2), 0.32, -31)
add('grips settle', thud(110, 0.2, 0.4), C['liftEnd'] - 0.05, -27)
# B
add('push onto the panel', soft_air(2.2, 180, 900), C['pushB0'], -36)
for k in range(5):
    add(f'lens tick {k + 1}', tick(2800 + 260 * k), w(23) + 0.04 + 0.055 * k, -36 + 2 * (k == 0))
# C
add('section opens (fold)', fold(), C['cut0'] + 0.05, -29)
add('body light spreads (warm sweep)', sweep(330, 520, 1.9), C['spread0'] + 0.7, -35)
add('background light crosses (cool sweep)', sweep(660, 440, 2.3), C['smear0'] + 0.15, -36)
add('section closes (fold)', fold(0.26)[::-1] * 0.7, C['close0'], -31)
# D
add('pull back', soft_air(1.4, 900, 200, rise=False), C['close1'] - 0.1, -36)
add('outline melts (settle shimmer)', shimmer(1.0, 1174.66) * 0.8, C['align1'] - 0.5, -33)
# E
add('weight shift behind the panel', flex(0.25), C['reach0'], -36)
add('hand clears the edge (tactile accent)', pop(), C['out1'] - 0.12, -25)
for k in range(4):
    add(f'finger flutter {k + 1}', tick(1700 + 150 * k, 0.05) * 0.8, C['wave0'] + 0.18 + 0.16 * k, -38)
add('hand withdraws', soft_air(0.4, 1200, 400, rise=False), C['back0'], -37)
# F
add('lowering: air', soft_air(1.0, 900, 220, rise=False), C['lower0'], -33)
add('lowering: panel flex', flex(0.35), C['lower1'] - 0.15, -32)
add('carried aside', soft_air(1.1, 500, 1400), C['aside0'], -35)
add('set at his side', thud(95, 0.22, 0.35), C['aside1'] - 0.05, -30)
add('the knowing beat (soft chime)', shimmer(1.2, 880.0) * 0.7, w(91) - 0.02, -34)
add('anticipation (grip)', thud(130, 0.15, 0.5) * 0.7, C['antic0'] + 0.1, -33)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.45 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 14 - lufs(music * duck))  # bed ~14 LU under the voice
sfx_l = sfx * (1 - 0.35 * np.clip(ve * 6, 0, 1))
mix = voice_l + mus_l + sfx_l
g = -14 - lufs(np.stack([mix, mix], 1))
mix *= db(g)
lim = db(-1.5)
if np.abs(mix).max() > lim:
    mix = np.tanh(mix / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix.wav'), os.path.join(EP, 'audio/mix/FGW_Invisibility_Shield_V1_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR,
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
