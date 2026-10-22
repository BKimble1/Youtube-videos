#!/usr/bin/env python3
"""Score, effects and mix for FGW "These Contacts Let You See With Your Eyes Closed". Everything is synthesised here
(no samples, no paid generation). Voice-led:
  - a curious, slightly tense bed (low pulse + soft plucked ostinato) that loops sample-continuously: every partial and
    LFO completes a whole number of cycles in the film, noise is cross-faded across the seam;
  - quiet night-train ambience (rumble + paired rail clacks) under the compartment scenes, thinned under the diagram;
  - restrained effects on physical events: lens placement, lid closures, light pulses (one shared "pulse" tone for
    every perceived green flash, so the transmitter's code and the flashes match), absorption steps and the emission
    accent, a page turn. Camera moves get at most a soft air movement.
Inputs : audio/narration/FGW_Infrared_Contacts_narration_final.wav, audio/cues.json (tools/export_cues.ts)
Outputs: source/public/audio/mix.wav, audio/mix/stems/*.wav, audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, os
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
C, DUR = cj['CUE'], cj['DUR']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(23)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR
def db(x): return 10 ** (x / 20)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at, wrap=False):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    if wrap:
        np.add.at(buf, idx % N, sig)
    else:
        m = (idx >= 0) & (idx < N); buf[idx[m]] += sig[m]
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]

# ---------------- voice ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Infrared_Contacts_narration_final.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- scene windows ----------------
diagram = win(C['reveal0'], C['revealClose1'], 0.4, 0.6)       # inside the eye section
train = 1 - 0.8 * diagram                                        # compartment ambience present at both ends (loops)

# ---------------- music bed (loop-continuous) ----------------
def pad(freqs, amp):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        ff = loopf(f)
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * loopf(0.13 + 0.03 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * ff * t)
    return out * amp
low = circ(lambda x: lp(x, 500), pad([(55.0, 0.5), (82.41, 0.28), (110.0, 0.18), (130.81, 0.12)], 1.0))  # A minor, low
# a gentle heartbeat pulse in the low end (loop-continuous: whole number of beats)
beats = int(round(DUR / 0.6)); bp_ = DUR / beats
pulse_bed = np.zeros(N)
for k in range(beats):
    n = int(0.25 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.07)
    place(pulse_bed, s * (0.7 if k % 2 == 0 else 0.45), k * bp_, wrap=True)
# soft plucked ostinato (E5 G5 A5 C6 ...), quiet; brighter inside the diagram
notes = [659.26, 783.99, 880.0, 1046.5, 880.0, 783.99]
steps = int(round(DUR / 0.3)); sp = DUR / steps
pluck = np.zeros(N)
for k in range(steps):
    f = loopf(notes[k % len(notes)]); n = int(0.5 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.11) * env(n, 0.004, 0.05)
    place(pluck, s * (0.55 + 0.45 * (k % 4 == 0)), k * sp, wrap=True)
X = int(1.0 * SR)
nz = bp(rng.standard_normal(N + X), 2000, 7000)
nz[:X] = nz[:X] * np.linspace(0, 1, X) + nz[N:N + X] * np.linspace(1, 0, X)
air = nz[:N] * 0.05 * (0.5 + 0.5 * np.sin(2 * np.pi * loopf(0.2) * t))
music = low * 0.85 + pulse_bed * 0.5 + pluck * (0.10 + 0.10 * diagram) + air * diagram
# the final line gets a little more tension (pluck up, low pad up)
music *= 1 + 0.25 * win(C['reveal2_0'], DUR, 0.6, 0.01)

# ---------------- train ambience (loop-continuous) ----------------
rum = rng.standard_normal(N + X)
rum = lp(hp(rum, 28), 180, 3)
rum[:X] = rum[:X] * np.linspace(0, 1, X) + rum[N:N + X] * np.linspace(1, 0, X)
rum = rum[:N] * (0.8 + 0.2 * np.sin(2 * np.pi * loopf(0.31) * t))
clack = np.zeros(N)
pairs = int(round(DUR / 1.35)); pp = DUR / pairs
def clk(f=900, d=0.07):
    n = int(d * SR); tt = np.arange(n) / SR
    return (bp(rng.standard_normal(n), f * 0.5, f * 1.8) * np.exp(-tt / 0.012) + 0.6 * np.sin(2 * np.pi * 70 * tt) * np.exp(-tt / 0.04))
for k in range(pairs):
    place(clack, clk(), k * pp, wrap=True)
    place(clack, clk(780) * 0.8, k * pp + 0.16, wrap=True)
ambience = (rum * 0.6 + clack * 0.35) * train

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db, wrap=False):
    place(sfx, sig * db(gain_db), at, wrap); log.append({'name': name, 'at': round(at, 3), 'dur': round(len(sig) / SR, 3), 'gain_db': gain_db})
def tone(f, d, a=0.01, r=0.25, harm=0.25):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + harm * np.sin(4 * np.pi * f * tt)) * env(n, a, r)
def wet_tap(d=0.2):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (260 - 120 * tt / d) * tt) * np.exp(-tt / 0.03) + 0.4 * bp(rng.standard_normal(n), 600, 2400) * np.exp(-tt / 0.015)
def soft_air(d, lo, hi, rise=True):
    n = int(d * SR); tt = np.linspace(0, 1, n); x = rng.standard_normal(n); out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]; fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return lp(out, hi * 1.2) * np.sin(np.pi * tt) ** 1.6
def thud(f=90, d=0.25):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) + 0.3 * lp(rng.standard_normal(n), 400) * np.exp(-tt / 0.02)
def chime(f, d=0.9):
    n = int(d * SR); tt = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt / (0.35 / m)) for m, a in [(1, 1), (2.01, 0.35), (3.02, 0.15)]) * env(n, 0.004, 0.1)
def rustle(d=0.45):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), 1500, 7000) * (np.abs(np.sin(np.pi * tt * 5)) ** 2) * np.sin(np.pi * tt)
PULSE_F = 987.77  # the one "perceived flash" tone (B5)
def flash_tone(d): return tone(PULSE_F, d + 0.25, a=0.03, r=0.25, harm=0.15) + 0.4 * tone(PULSE_F * 1.5, d + 0.25, a=0.03, r=0.25, harm=0)

# A
add('lens arrives (soft whoosh)', soft_air(0.4, 400, 1600), -0.05, -34)
add('lens placement', wet_tap(), C['contact'] - 0.01, -20)
add('finger withdraw', soft_air(0.5, 1200, 300, rise=False), C['release'], -33)
add('lid closes (skin brush)', bp(rng.standard_normal(int(0.6 * SR)), 300, 2000) * env(int(0.6 * SR), 0.2, 0.3), C['lidClose0'], -36)
add('closed-eye view opens', soft_air(0.35, 200, 900), C['insetOpen0'], -32)
for i, at in enumerate(C['pulseA']):
    add(f'perceived flash A{i + 1}', flash_tone(0.3), at, -24)
add('cutaway opens', soft_air(0.5, 300, 2500), C['reveal0'] - 0.05, -30)
add('lids slide apart', soft_air(0.5, 800, 300, rise=False), C['lidOpen0'], -34)
# B
vis_ret = C['visLaunch'] + 0.955
add('visible light registers (warm chime)', chime(1318.5, 0.7), vis_ret, -27)
add('infrared reaches retina (nothing)', thud(70, 0.2), C['irLaunch'] + 0.955, -36)
# C
add('lens slides back (glassy settle)', tone(2637, 0.18, 0.002, 0.15, 0.1), C['lensBack1'] - 0.05, -32)
add('push into the lens', soft_air(1.2, 250, 3000), C['push0'], -33)
add('absorption 1', tone(330, 0.35, 0.03, 0.25) + 0.5 * tone(165, 0.35, 0.03, 0.25), C['absorb1'] - 0.02, -24)
add('absorption 2', tone(440, 0.35, 0.03, 0.25) + 0.5 * tone(220, 0.35, 0.03, 0.25), C['absorb2'] - 0.02, -24)
add('emission accent', chime(1760, 1.1) + 0.6 * chime(2637, 1.1), C['emit0'], -21)
add('pull back', soft_air(1.3, 2800, 250, rise=False), C['pull0'], -33)
# D
add('lids close', soft_air(0.5, 300, 900), C['lidClose2_0'], -33)
for i, at in enumerate(C['visBlock']):
    add(f'visible light stopped {i + 1}', thud(150, 0.18), at + 0.55, -33)
add('infrared enters lid', tone(180, 1.1, 0.25, 0.5, 0.1), 17.45, -32)
# E
add('reaches the lens', tone(1975.5, 0.12, 0.002, 0.1, 0), C['heroAtLens'], -32)
add('conversion accent', chime(1760, 1.0) + 0.6 * chime(2637, 1.0), C['convert'] - 0.02, -21)
add('retina bloom', soft_air(0.8, 300, 1800) + 0.4 * tone(PULSE_F / 2, 0.8, 0.2, 0.4)[:int(0.8 * SR)], C['greenAtRetina'] - 0.1, -30)
add('perceived flash E', flash_tone(0.5), C['flashE'], -23)
add('pull out to the train', soft_air(1.8, 2400, 200, rise=False), C['revealClose0'], -32)
# F
add('transmitter raised (cloth)', rustle(0.35), C['aim0'], -36)
TRAVEL = 0.28
for i, (at, ln) in enumerate(C['code']):
    add(f'button {i + 1}', tone(3000, 0.04, 0.001, 0.03, 0) * 0.6, at, -34)
    add(f'perceived flash F{i + 1}', flash_tone(ln), at + TRAVEL, -25)
add('page turn', rustle(0.5), C['page0'], -30)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.45 * np.clip(ve * 6, 0, 1)
def lufs(x): return pyln.Meter(SR).integrated_loudness(x)
vg = -17 - lufs(voice)
voice_l = voice * db(vg)
mus_l = music * duck * db(-17 - 16 - lufs(music * duck))       # bed ~16 LU under the voice
amb_l = ambience * duck * db(-17 - 21 - lufs(ambience * duck))  # ambience ~21 LU under
sfx_l = sfx
mix = voice_l + mus_l + amb_l + sfx_l
g = -14 - lufs(np.stack([mix, mix], 1))
mix *= db(g)
lim = db(-1.5)
if np.abs(mix).max() > lim:
    mix = np.tanh(mix / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix.wav'), stereo, SR, subtype='PCM_24')
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('ambience', amb_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + amb_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR,
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
