#!/usr/bin/env python3
"""Bed, effects and mix for FGW "This Cockroach Can Fire a Needle" V1.

The narration is the selected take, unchanged (gain only, sample for sample). Everything else is synthesised here: no
samples, no third-party music. The cue times come from the picture (audio/cues.json, written by tools/export_cues.ts
from the shot code), so the sound follows the frames the picture uses.

Sound priorities (the brief):
  1. narration clear at all times;
  2. three main accents: the opening release (click + spring + restrained impact into silicone), the mechanism launch in
     the cutaway, and the final close approach;
  3. quiet insect foot contacts, lab room tone, rubble atmosphere;
  4. a restrained tonal bed that changes subtly at the rescue turn ("But the plan...") and warms at the recognition.
No gunshot, no whoosh on every cut (one soft air pass on the occlusion bridge only), no opening sting, no outro.

Loop: the film is a loop; effects and the bed are placed modulo the film length; both ambiences are shaped so the end
(rubble, settling) meets the start (lab) without a gap or click; the loop-safe AAC mux (tools/mux_loop_audio.py) fills
the AAC padding with the start of the mix.

Levels: voice -17 LUFS (gain only); bed about 16 LU under the voice and ducked further under speech; effects under the
voice (the three accents on an unducked bus); the whole at -14 LUFS (BS.1770, stereo) with a 4x-oversampled true-peak
lookahead limiter at -1.5 dBTP.

Inputs : audio/narration/FGW_Cyborg_Cockroach_narration_V1.wav, audio/cues.json
Outputs: source/public/audio/mix.wav, audio/mix/FGW_Cyborg_Cockroach_V1_mix.wav, audio/mix/stems/*.wav,
         audio/mix/mix_measure.json, audio/sfx_log.json
"""
import json
import os
import shutil

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
FPS = cj['fps']
DUR = cj['frames'] / FPS
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(1793)
WORDS = cj['words']
F = lambda fr: fr / FPS


def w(word, n=0):
    return [x for x in WORDS if x['word'] == word][n]['start']


def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def loopf(f): return round(f * DUR) / DUR  # whole cycles over the film, so the bed loops seamlessly
def noise(n): return rng.standard_normal(n)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]  # circular filtering (no start-up at the seam)


def env(n, a, r):
    e = np.ones(n)
    na, nr = min(n, max(1, int(a * SR))), min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na) ** 2
    e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def place(buf, sig, at):
    i = int(round(at * SR))
    idx = (np.arange(len(sig)) + i) % N
    np.add.at(buf, idx, sig)


def win(a, b, fa=0.3, fb=0.3):
    """1 inside [a, b], raised-cosine ramps of fa before a and fb after b (wraps across the loop if b > DUR)."""
    def one(tt):
        up = np.clip((tt - (a - fa)) / max(fa, 1e-6), 0, 1)
        dn = np.clip(((b + fb) - tt) / max(fb, 1e-6), 0, 1)
        x = np.minimum(up, dn)
        return 0.5 - 0.5 * np.cos(np.pi * x)
    return np.clip(one(t) + one(t + DUR) + one(t - DUR), 0, 1)


# ---------------------------------------------------------------- voice
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Cyborg_Cockroach_narration_V1.wav'))
assert vsr == SR, vsr
voice = np.zeros(N)
voice[:min(N, len(v))] = v[:N]
assert len(v) <= N or np.abs(v[N:]).max() < 1e-4

# ---------------------------------------------------------------- sections
S = cj['sections']  # seconds: lab_end (the occlusion bridge), rubble_start, recog (recognition beat)
lab = win(-1.0, S['bridge'], 0.0, 0.35)  # lab room tone until the bridge (wraps into the start)
rub = win(S['rubble'] - 0.1, DUR - 0.25, 0.3, 0.25)  # rubble atmosphere from the bridge to just before the loop
recog = win(S['recog'], DUR - 0.3, 0.8, 0.3)


# ---------------------------------------------------------------- bed
def pad(freqs, rate=0.08):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.72 + 0.28 * np.sin(2 * np.pi * loopf(rate + 0.027 * k) * t + 1.3 * k)
        for det in (-0.6, 0.0, 0.6):  # three slightly detuned voices
            out += a / 3 * lfo * np.sin(2 * np.pi * loopf(f + det) * t + k)
    return out


# lab: curious, light (E minor add9-ish, airy), a soft woody pulse at 96 bpm
pad_lab = circ(lambda x: lp(x, 1400), pad([(82.41, 0.42), (123.47, 0.26), (164.81, 0.15), (185.0, 0.07), (246.94, 0.06)]))
pad_lab_air = circ(lambda x: lp(hp(x, 500), 3200), pad([(659.26, 0.05), (739.99, 0.035), (987.77, 0.025)], 0.05))
# rubble: lower, darker, with air (C minor-ish), then a warm lift at the recognition (Ab major colour)
pad_rub = circ(lambda x: lp(x, 700), pad([(65.41, 0.5), (98.0, 0.3), (130.81, 0.14), (155.56, 0.08)], 0.06))
pad_warm = circ(lambda x: lp(x, 1600), pad([(103.83, 0.3), (130.81, 0.24), (155.56, 0.2), (207.65, 0.1), (261.63, 0.06)], 0.07))
beat = 60 / 96
beats = int(round(DUR / beat))
bpd = DUR / beats
pulse = np.zeros(N)
for k in range(beats):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    s = 0.8 * np.sin(2 * np.pi * 62 * tt) * np.exp(-tt / 0.06) + 0.10 * bp(noise(n), 1800, 6000) * np.exp(-tt / 0.004)
    if k % 4 == 2:
        s += 0.25 * np.sin(2 * np.pi * 330 * tt) * np.exp(-tt / 0.05)  # a tiny woody tick on the off-beat
    place(pulse, s * (0.75 if k % 2 == 0 else 0.4), k * bpd)
music = (pad_lab * 0.8 + pad_lab_air * 0.9 + pulse * 0.42) * lab + pad_rub * 0.9 * rub * (1 - 0.6 * recog) + pad_warm * 0.85 * recog

# ---------------------------------------------------------------- ambience
room = circ(lambda x: hp(lp(x, 900), 60), noise(N)) * 0.5 + 0.05 * np.sin(2 * np.pi * loopf(120) * t) + 0.03 * np.sin(2 * np.pi * loopf(60) * t)
room /= np.abs(room).max()
wind = circ(lambda x: lp(hp(x, 90), 650), noise(N))
wind *= 0.6 + 0.4 * np.sin(2 * np.pi * loopf(0.23) * t) * np.sin(2 * np.pi * loopf(0.071) * t + 1)
wind /= np.abs(wind).max()
amb = room * 0.35 * lab + wind * 0.55 * rub

# ---------------------------------------------------------------- effects
sfx = np.zeros(N)
key = np.zeros(N)
log = []


def add(name, sig, at, gain_db, hero=False):
    place(key if hero else sfx, sig * db(gain_db), at)
    log.append({'name': name, 'at': round(at % DUR, 3), 'frame': round((at % DUR) * FPS, 1), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1), 'hero': hero})


def tick(f=6200, d=0.025, body=0.0):
    """an insect foot contact: a tiny dry chitin tick (and, on hard ground, a hint of body)"""
    n = int(d * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * (1 + 0.15 * rng.random()) * tt) * np.exp(-tt / 0.0018) + 0.5 * bp(noise(n), 3000, 11000) * np.exp(-tt / 0.0012)
    if body:
        s += body * np.sin(2 * np.pi * 900 * tt) * np.exp(-tt / 0.004)
    return s


def click(f=2400, d=0.07, bright=1.0):
    """a decisive small mechanical click (latch / release)"""
    n = int(d * SR)
    tt = np.arange(n) / SR
    s = 0.9 * bp(noise(n), 2500, 12000) * np.exp(-tt / 0.0016) * bright
    s += 0.6 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006) + 0.35 * np.sin(2 * np.pi * f * 2.71 * tt) * np.exp(-tt / 0.004)
    s += 0.35 * np.sin(2 * np.pi * 420 * tt) * np.exp(-tt / 0.012)
    return s


def spring(d=0.22, f0=1650, f1=1150):
    """a small coil spring letting go: a quick metallic zing that falls"""
    n = int(d * SR)
    tt = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / SR
    s = (np.sin(ph) + 0.4 * np.sin(2.76 * ph)) * np.exp(-tt / 0.045) * (0.7 + 0.3 * np.sin(2 * np.pi * 38 * tt))
    return s * env(n, 0.001, 0.05)


def thock(d=0.22):
    """the needle and barrel meeting soft silicone: a restrained, muted knock (no bang)"""
    n = int(d * SR)
    tt = np.arange(n) / SR
    s = 0.9 * np.sin(2 * np.pi * 175 * tt) * np.exp(-tt / 0.03) + 0.35 * lp(noise(n), 1200) * np.exp(-tt / 0.012)
    s += 0.25 * np.sin(2 * np.pi * 760 * tt) * np.exp(-tt / 0.02) + 0.15 * bp(noise(n), 3000, 7000) * np.exp(-tt / 0.002)
    return s


def zing(d=0.08):
    """the injector's brief passage through air (a few cm): a tiny high hiss"""
    n = int(d * SR)
    tt = np.linspace(0, 1, n)
    return bp(noise(n), 3500, 9000) * np.sin(np.pi * tt) ** 2


def sizzle(d=0.14):
    """the nichrome coil heating against the line: a faint dry crackle"""
    n = int(d * SR)
    out = np.zeros(n)
    k = 0
    while True:
        at = (k + rng.random()) * 0.006
        if at > d - 0.004:
            break
        m = int(0.003 * SR)
        tt = np.arange(m) / SR
        i = int(at * SR)
        out[i:i + m] += bp(noise(m), 4000, 12000) * np.exp(-tt / 0.0006) * (0.3 + 0.7 * rng.random()) * (at / d)
        k += 1
    return out


def pulse_tick(d=0.03):
    """a stimulation pulse leaving the board: a very small soft tick"""
    n = int(d * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt / 0.003) * 0.6


def fizz(d=1.0):
    """gas forming behind the plunger: tiny bubbles"""
    n = int(d * SR)
    out = np.zeros(n)
    k = 0
    while True:
        at = (k + rng.random() * 0.7) / 70
        if at > d - 0.01:
            break
        m = int(0.008 * SR)
        tt = np.arange(m) / SR
        f = 2500 + 3500 * rng.random()
        i = int(at * SR)
        out[i:i + m] += np.sin(2 * np.pi * f * (1 + 2 * tt / 0.008) * tt) * np.exp(-tt / 0.0015) * (0.2 + 0.8 * rng.random())
        k += 1
    return out * env(n, 0.15, 0.3)


def button(f=1700, d=0.06):
    """a plastic button (press or spring back)"""
    n = int(d * SR)
    tt = np.arange(n) / SR
    return 0.7 * bp(noise(n), 1500, 7000) * np.exp(-tt / 0.0025) + 0.5 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.005) + 0.3 * np.sin(2 * np.pi * 260 * tt) * np.exp(-tt / 0.01)


def air(d, lo, hi, rise=True):
    """one soft air pass (used once: the occlusion bridge)"""
    n = int(d * SR)
    tt = np.linspace(0, 1, n)
    x = noise(n)
    out = np.zeros(n)
    seg = 2048
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]
        fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return lp(out, hi * 1.2) * np.sin(np.pi * tt) ** 1.6


def grit(d=0.5, rate=40):
    """a trickle of grit in the rubble"""
    n = int(d * SR)
    out = np.zeros(n)
    k = 0
    while True:
        at = (k + rng.random() * 0.8) / rate
        if at > d - 0.01:
            break
        m = int(0.006 * SR)
        tt = np.arange(m) / SR
        i = int(at * SR)
        out[i:i + m] += bp(noise(m), 1500, 7000) * np.exp(-tt / 0.0012) * (0.2 + 0.8 * rng.random())
        k += 1
    return out * env(n, 0.05, 0.2)


def creak(d=0.9):
    """a distant settling creak (concrete and rebar), low and soft"""
    n = int(d * SR)
    tt = np.arange(n) / SR
    f = 140 + 40 * np.sin(2 * np.pi * 0.8 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return lp(np.sign(np.sin(ph)) * 0.3 + bp(noise(n), 200, 900) * 0.4, 1200) * env(n, 0.25, 0.4) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * tt))


GEN = {'tick': tick, 'click': click, 'spring': spring, 'thock': thock, 'zing': zing, 'sizzle': sizzle, 'pulse': pulse_tick,
       'fizz': fizz, 'button': button, 'grit': grit, 'creak': creak}

for e in cj['events']:
    kind = e['kind']
    at = e['t']
    g = e.get('gain', -30)
    args = e.get('args', {})
    if kind == 'air':
        sig = air(**args)
    else:
        sig = GEN[kind](**args)
    add(e.get('name', kind), sig, at + e.get('lead', 0.0), g, e.get('hero', False))

# ---------------------------------------------------------------- mix
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(np.stack([x, x], 1)) if x.ndim == 1 else meter.integrated_loudness(x)

ve = lp(np.abs(voice), 8, 1)
ve /= ve.max() + 1e-9
speech = np.clip(ve * 5, 0, 1)
duck = 1 - 0.5 * speech
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 16 - lufs(music * duck))
amb_l = amb * (1 - 0.35 * speech) * db(-17 - 22 - lufs(amb))
sfx_l = sfx * db(2) * (1 - 0.3 * speech)
key_l = key * db(2)
mix = voice_l + mus_l + amb_l + sfx_l + key_l
mix *= db(-14 - lufs(mix))

# true-peak lookahead limiter (4x oversampled peak, 5 ms lookahead, 80 ms release)
ceil = db(-1.5)
pk = np.max(np.abs(resample_poly(mix, 4, 1)).reshape(-1, 4), axis=1)[:N]
need = np.minimum(1.0, ceil / (pk + 1e-12))
blk = int(0.005 * SR)
padded = np.concatenate([need, np.ones(blk)])
look = np.minimum.reduce([padded[k:k + N] for k in range(0, blk + 1, 12)])
g = np.empty(N)
cur = 1.0
rel = np.exp(-1 / (0.08 * SR))
for i in range(N):
    cur = look[i] if look[i] < cur else look[i] + (cur - look[i]) * rel
    g[i] = cur
mix *= g
stereo = np.stack([mix, mix], 1)

os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
for name, x in [('voice', voice_l), ('music', mus_l), ('ambience', amb_l), ('sfx', sfx_l), ('accents', key_l)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), np.stack([x, x], 1).astype(np.float32), SR, subtype='PCM_24')
out = os.path.join(EP, 'source/public/audio/mix.wav')
sf.write(out, stereo.astype(np.float32), SR, subtype='PCM_24')
shutil.copy(out, os.path.join(EP, 'audio/mix/FGW_Cyborg_Cockroach_V1_mix.wav'))

band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
rest = mus_l + amb_l + sfx_l + key_l
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
meas = {
    'integrated_lufs_stereo': round(lufs(stereo), 2),
    'true_peak_dbtp_4x': round(tp, 2),
    'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
    'limiter_min_gain_db': round(20 * np.log10(g.min()), 2),
    'voice_over_rest_phone_band_db': round(10 * np.log10(np.mean(band(voice_l)[spk] ** 2) / (np.mean(band(rest)[spk] ** 2) + 1e-12)), 1),
    'duration_s': DUR,
    'voice_stem_vs_source_corr': round(float(np.corrcoef(voice_l[:len(v)], v[:N])[0, 1]), 6),
    'seam_jump': round(float(abs(mix[0] - mix[-1])), 5),
    'typical_step': round(float(np.median(np.abs(np.diff(mix)))), 5),
    'effects': len(log),
}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_log.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
