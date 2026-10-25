#!/usr/bin/env python3
"""Rebuild V2 mix for FGW "This Laser Makes You Hear Voices" (same construction as Rebuild V1, re-cued to the V2 picture).
  - Narration: the approved file, unedited, at the V1-V4 gain (x1.4303098), from sample 0. No stretch, pitch or edit.
  - Music: the V1 music stem, unchanged (12 ms loop fades).
  - Ambience (synthesised, circular so it flows across the loop seam): the lab's room tone (mains hum, a quiet fan) with
    the city faintly through the window; a faint airy shimmer at molecular scale.
  - Effects, small and under the voice, each on a visible event: his footfalls (every plant's landing, from the walk
    planner), the push into her ear, the molecular events (water molecules named, light absorbed, the warming swell,
    the expansion, one low pulse per pressure front, the eardrum's muffled answer), the whip back up the beam, the
    emitter's hood latch and hinge, the dial, the prism motor spinning up and holding, the hood closing, the tape's
    foot marks, a dull touch when the beam lands on his head, a soft lift when it clears. No laser "zaps".
  - The whisper: short, breathy, nonverbal (as V4-RB1), about 15 dB under the narration, ducked a further 9 dB under
    speech; the first window wraps the loop seam. It cuts with a 3 ms ramp on the first frame his head is in the beam
    and returns with an 80 ms raised cosine on the first frame it is out (both read from the geometry: audio/cues_c2.json).
  - Master: the V1-V4 soft clip (tanh at -1.5 dBFS) on the sum.
Outputs: source/public/audio/mix_c2.wav, audio/mix/FGW_Laser_Voices_REBUILD_V2_mix.wav, audio/mix/stems_c2/*.wav,
         audio/mix/mix_measure_c2.json"""
import hashlib, json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, fftconvolve

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_c2.json')))
DUR, FPS = cj['DUR'], cj['FPS']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(4)
db = lambda x: 10 ** (x / 20)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def circ(fn, x, *a):
    y = fn(np.concatenate([x, x]), *a)
    return y[len(x):]
def circ_conv(x, ir):
    y = fftconvolve(np.concatenate([x, x]), ir)[:2 * len(x)]
    return y[len(x):]
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
def ss(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)
def window(a, b, fa=0.08, fb=0.08):
    return ss(a - fa, a, t) * (1 - ss(b, b + fb, t))

# ---------------- locked material ----------------
NARR = os.path.join(EP, 'audio/narration/FGW_Laser_Voices_narration_final.wav')
narr, nsr = sf.read(NARR)
assert nsr == SR and len(narr) == N, (nsr, len(narr), N)
G_VOICE = 1.430309752850878
voice = narr * G_VOICE
music = sf.read(os.path.join(EP, 'audio/mix/stems/music.wav'))[0]
L12 = int(0.012 * SR)
ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, L12))
music = music.copy(); music[:L12] *= ramp; music[-L12:] *= ramp[::-1]
ve = lp(np.abs(voice), 5, 1); ve = np.clip(ve / (np.percentile(ve, 95) + 1e-9), 0, 1)

C = cj['CUT']
T_BLOCK, T_CLEAR = cj['T_BLOCK'], cj['T_CLEAR']
def span(a, b, f=0.02): return window(a, b, f, f)
micro = span(C['micro'] - 0.3, C['optics'])
room = np.clip(1 - micro, 0, 1)
# the voice she hears, nonverbal (whisper motif): the loop seam window, the two-shot, the concentrated sound, the demo,
# the walk-in until the block; back at the clear
WHISPER = [[33.85, DUR + 1.15], [2.0, 2.7], [3.3, 4.0], [17.95, 19.85], [20.2, 22.0], [23.45, T_BLOCK], [T_CLEAR, 33.3]]

# ---------------- ambiences ----------------
def periodic_lfo(hz, ph=0.0):
    k = max(1, round(hz * DUR))
    return np.sin(2 * np.pi * k * t / DUR + ph)
# the city through the window: a low, slow traffic wash and a far-off tonal rumble (circular)
city = circ(lp, rng.standard_normal(N), 420, 2) * (0.7 + 0.3 * periodic_lfo(0.09, 1.0))
city /= np.sqrt(np.mean(city ** 2))
air = circ(hp, rng.standard_normal(N), 5000, 2) * (0.6 + 0.4 * periodic_lfo(0.4))
air /= np.sqrt(np.mean(air ** 2))
hum = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(60, 1), (120, 0.6), (180, 0.25), (240, 0.12)])
fan = circ(lp, circ(hp, rng.standard_normal(N), 80, 2), 900, 2); fan /= np.sqrt(np.mean(fan ** 2))
amb = (db(-51) * hum / 0.8 + db(-49) * fan + db(-50) * city) * room + db(-50) * air * micro

# ---------------- effects ----------------
sfx = np.zeros(N)
def place(sig, at, gain_db):
    i = int(round(at * SR))
    j = min(N, i + len(sig))
    if i < 0:
        sig = sig[-i:]; j = min(N, len(sig)); i = 0
    sfx[i:j] += db(gain_db) * sig[: j - i]
def mixs(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out
def tsig(dur): return np.arange(int(dur * SR)) / SR
def step(seed):
    r = np.random.default_rng(seed); x = tsig(0.12)
    heel = lp(r.standard_normal(len(x)), 2400) * np.exp(-x / 0.012)
    thump = np.sin(2 * np.pi * (95 + 20 * r.random()) * x) * np.exp(-x / 0.03)
    return 0.6 * heel + 0.5 * thump
def whoosh(dur, lo=300, hi=2600, up=True, seed=1):
    r = np.random.default_rng(seed); x = tsig(dur); n = r.standard_normal(len(x))
    u = x / dur
    env = np.sin(np.pi * u) ** 1.5
    # a sweeping band: filter in short blocks
    out = np.zeros(len(x)); blk = 1024
    for k in range(0, len(x), blk):
        f = lo + (hi - lo) * ((k / len(x)) if up else 1 - k / len(x))
        out[k:k + blk] = bp(n[max(0, k - 2048):k + blk], max(60, f * 0.6), min(16000, f * 1.6), 2)[-len(out[k:k + blk]):]
    return out * env
def tink(f=2600, dur=0.35):
    x = tsig(dur); return (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.71 * x)) * np.exp(-x / 0.06)
def thup(f=70, dur=0.25):
    x = tsig(dur); return np.sin(2 * np.pi * f * x * (1 - 0.3 * x / dur)) * np.exp(-x / 0.05) * (1 - np.exp(-x / 0.004))
def click(seed=3):
    r = np.random.default_rng(seed); x = tsig(0.05); return hp(r.standard_normal(len(x)), 1500) * np.exp(-x / 0.004)
def sweep_tone(f0, f1, dur):
    x = tsig(dur); f = f0 * (f1 / f0) ** (x / dur); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.sin(np.pi * x / dur) ** 2
def swell(dur, lo, hi, seed=5):
    r = np.random.default_rng(seed); x = tsig(dur)
    return bp(r.standard_normal(len(x)), lo, hi, 2) * np.sin(np.pi * x / dur) ** 2
def chime(f=1180, dur=1.2):
    x = tsig(dur); return sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / (0.35 / m)) for m, a in [(1, 1), (2.01, 0.4), (2.76, 0.25)])

# footsteps: every landing of his walks (the planner's plants)
for i, st in enumerate(cj['steps']):
    place(step(200 + i), st, -31)
# the hook (and the seam): a faint shimmer as she reacts, under the whisper
place(swell(0.6, 3000, 8000, 3) * 0.7, DUR - 0.12, -41)
place(swell(0.5, 3000, 8000, 4) * 0.7, 0.0, -41)
# the push into her ear and on into the air
place(whoosh(2.2, 250, 1400, True, 12), 6.6, -39)
place(swell(0.8, 4000, 9000), C['micro'] - 0.45, -37)
# molecular scale: the water molecules named (soft blips), the light arriving, an absorption tink per struck molecule,
# the warming, the expansion's push, a low pulse per pressure front, the eardrum's muffled answer
for k in range(7):
    place(tink(1900 + 140 * k, 0.12) * 0.6, 9.15 + 0.1 * k, -46)
place(swell(0.35, 2000, 6000, 8) * 0.6, 10.3, -44)
for i in range(6):
    place(tink(2300 + 160 * i, 0.3), 10.52 + 0.075 * i, -36)
place(swell(1.3, 150, 900, 9), 11.65, -34)
place(lp(thup(62, 0.4), 400), 12.35, -31)
for k in range(5):
    place(thup(78, 0.22), 13.36 + 0.4 * k, -33 + min(2, k))
for k in range(2):
    place(lp(thup(56, 0.3), 450), 14.49 + 0.4 * k, -31)
# the whip back up the beam to the emitter; the hood's latch and hinge; the dial; the prism motor; the hood closing
place(whoosh(0.4, 2400, 500, False, 13), C['optics'] - 0.08, -36)
place(click(5), 15.15, -38)
place(swell(0.45, 1200, 4000, 21), 15.2, -42)
place(click(6), 15.5, -37)
x = tsig(4.7); f = 120 + 160 * ss(0.0, 0.5, x)
ph = 2 * np.pi * np.cumsum(f) / SR
motor = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * ss(0, 0.2, x) * (1 - ss(4.3, 4.7, x)) * (1 - 0.6 * ss(2.2, 2.5, x))
place(motor, 15.5, -43)
place(lp(thup(110, 0.12), 1200), 17.62, -38)
# the sound collecting at her ear
place(chime(1180, 1.0) * 0.8, 18.45, -38)
# the 8 ft wide: the tape's foot marks lighting one by one
for i in range(9):
    place(tink(1500 + 90 * i, 0.1), 22.05 + i * 0.9 / 8, -43)
# the block: a soft dull touch of the beam landing on him; the clear: a soft lift
place(lp(thup(90, 0.18), 700), T_BLOCK, -37)
place(sweep_tone(400, 1200, 0.35) * 0.5, T_CLEAR - 0.02, -43)

# ---------------- the whisper ----------------
def whisper_dry(x, seed):
    """breathy, nonverbal: noise through moving vowel formants, with a syllabic rhythm and soft fricatives, plus a
    faint inharmonic shimmer that makes it a little unearthly; x: local time (s)"""
    r = np.random.default_rng(seed)
    n = len(x)
    src = r.standard_normal(n)
    # syllables: irregular 0.16-0.28 s units
    edges = [0.0]
    while edges[-1] < x[-1] + 0.3:
        edges.append(edges[-1] + r.uniform(0.16, 0.28))
    syl = np.zeros(n); f1 = np.zeros(n); f2 = np.zeros(n); fric = np.zeros(n)
    vowels = [(320, 900), (450, 1300), (620, 1100), (380, 2000), (700, 1500), (300, 1600)]
    for a, b in zip(edges[:-1], edges[1:]):
        m = (x >= a) & (x < b)
        if not m.any(): continue
        u = (x[m] - a) / (b - a)
        syl[m] = np.sin(np.pi * u) ** 0.8 * r.uniform(0.6, 1.0)
        v0, v1 = vowels[r.integers(len(vowels))], vowels[r.integers(len(vowels))]
        f1[m] = v0[0] + (v1[0] - v0[0]) * u; f2[m] = v0[1] + (v1[1] - v0[1]) * u
        if r.random() < 0.45:
            fric[m] = np.exp(-((u - r.choice([0.08, 0.9])) / 0.12) ** 2)
    out = np.zeros(n); blk = 480
    for k in range(0, n, blk):
        s = slice(k, k + blk); pad = slice(max(0, k - 1920), k + blk)
        a1 = bp(src[pad], f1[k] * 0.75, f1[k] * 1.3, 2)[-len(src[s]):]
        a2 = bp(src[pad], f2[k] * 0.82, f2[k] * 1.2, 2)[-len(src[s]):]
        out[s] = a1 + 0.7 * a2
    sib = bp(src, 4200, 8500, 2) * fric * 0.6
    body = (out + 0.25 * bp(src, 1800, 3500, 2)) * syl + sib
    # the unearthly part: a slow ring-mod on part of it and a faint high shimmer on inharmonic partials
    ring = body * (0.75 + 0.25 * np.sin(2 * np.pi * 31 * x))
    shimmer = sum(np.sin(2 * np.pi * f * x + p) for f, p in [(2310, 0.3), (3170, 1.1), (4430, 2.0)]) * syl * 0.035
    y = ring + shimmer
    y = y / (np.sqrt(np.mean(y[syl > 0.2] ** 2)) + 1e-9)
    # no spikes: a soft ceiling about 8 dB over its own level
    return 2.5 * np.tanh(lp(y, 7000, 2) / 2.5)

wL = np.zeros(N); wR = np.zeros(N)
def add_whisper(a, b, seed, hard_in=False, hard_out=False, pan=0.25, gain=0.0):
    """a window [a, b] in seconds; if b > DUR it wraps the loop seam (the tail lands at the start of the file)"""
    i0 = int((a - 0.12) * SR); i1 = int((b + 0.25) * SR)
    x = np.arange(i0, i1) / SR - a
    y = whisper_dry(np.maximum(x, 0), seed)
    e = np.ones_like(x)
    e *= (x >= 0) if hard_in else ss(-0.02, 0.12, x)
    e *= (x <= b - a) if hard_out else 1 - ss(b - a - 0.12, b - a + 0.08, x)
    y = y * e * db(gain)
    idx = np.arange(i0, i1) % N
    np.add.at(wL, idx, y * (1 + pan) / 2 * 2 ** 0.5)
    np.add.at(wR, idx, y * (1 - pan) / 2 * 2 ** 0.5)
for i, (a, b) in enumerate(WHISPER):
    add_whisper(a, b, 40 + i, hard_in=abs(a - T_CLEAR) < 1e-6, hard_out=abs(b - T_BLOCK) < 1e-6)
# the edges: an abrupt 3 ms cut exactly at the block, a gentle 80 ms return at the clear
k3 = int(0.003 * SR)
k80 = int(0.08 * SR)
gate = np.ones(N)
ib, ic = int(round(T_BLOCK * SR)), int(round(T_CLEAR * SR))
gate[ib:ic] = 0
gate[ib - k3:ib] = np.linspace(1, 0, k3)
gate[ic:ic + k80] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k80))
wL = circ(hp, wL, 180, 2) * gate; wR = circ(hp, wR, 180, 2) * gate
# a very small early reflection (no reverb tail), then duck slightly under speech
er = int(0.011 * SR)
wL = wL + 0.18 * np.roll(wR, er); wR = wR + 0.18 * np.roll(wL, er)
wL *= gate; wR *= gate
# level: set 15 dB under the narration (measured before ducking), then duck it a further 9 dB under speech so it
# never masks a narrated word (it comes up between the lines)
wm = 0.5 * (wL + wR)
over = (np.abs(wm) > 1e-5) & (ve > 0.15)
rms = lambda x, m: 10 * np.log10(np.mean(x[m] ** 2) + 1e-15)
TARGET = -15.0
g = db(TARGET - (rms(wm, over) - rms(voice, over)))
wL *= g; wR *= g
duck = db(-9 * np.clip(ve * 1.6, 0, 1))
wL *= duck; wR *= duck

# ---------------- mix + master ----------------
lim = db(-1.5)
bed = voice + music + amb + sfx
Lc = np.tanh((bed + wL) / lim) * lim
Rc = np.tanh((bed + wR) / lim) * lim
st = np.stack([Lc, Rc], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems_c2'), exist_ok=True)
out = os.path.join(EP, 'source/public/audio/mix_c2.wav')
sf.write(out, st, SR, subtype='PCM_24')
shutil.copy(out, os.path.join(EP, 'audio/mix/FGW_Laser_Voices_REBUILD_V2_mix.wav'))
for name, sig in [('whisper', np.stack([wL, wR], 1)), ('ambience', amb), ('sfx', sfx)]:
    sf.write(os.path.join(EP, f'audio/mix/stems_c2/{name}.wav'), sig, SR, subtype='PCM_24')

meter = pyln.Meter(SR)
wm = 0.5 * (wL + wR)
def win_db(x, a, b): i, j = int(a * SR), int(b * SR); return round(10 * np.log10(np.mean(x[i:j] ** 2) + 1e-14), 1)
meas = {
    'narration_file_sha256': sha(NARR), 'narration_gain': G_VOICE, 'narration_offset_samples': 0,
    'integrated_lufs_stereo': round(meter.integrated_loudness(st), 2),
    'rb1_integrated_lufs_stereo': round(meter.integrated_loudness(sf.read(os.path.join(EP, 'audio/mix/FGW_Laser_Voices_REBUILD_V1_mix.wav'))[0]), 2),
    'sample_peak_dbfs': round(20 * np.log10(np.abs(st).max()), 2),
    'whisper_under_voice_db_during_overlap_after_ducking': round(rms(wm, (np.abs(wm) > 1e-5) & (ve > 0.15)) - rms(voice, (np.abs(wm) > 1e-5) & (ve > 0.15)), 1),
    'whisper_peak_dbfs': round(20 * np.log10(np.abs(np.stack([wL, wR])).max() + 1e-12), 1),
    'sfx_peak_dbfs': round(20 * np.log10(np.abs(sfx).max()), 1), 'ambience_rms_dbfs': win_db(amb, 0, DUR),
    'voice_rms_dbfs_when_speaking': round(rms(voice, ve > 0.15), 1),
    'whisper_rms_db': {'before_block (-0.8..0)': win_db(wm, T_BLOCK - 0.8, T_BLOCK - 0.005), 'while_blocked': win_db(wm, T_BLOCK + 0.004, T_CLEAR - 0.001),
                       'after_clear (+0.1..+0.7)': win_db(wm, T_CLEAR + 0.1, T_CLEAR + 0.7), 'seam_last_0.3s': win_db(wm, DUR - 0.3, DUR), 'seam_first_0.3s': win_db(wm, 0, 0.3)},
    'seam': {'mix_last': st[-1].tolist(), 'mix_first': st[0].tolist(), 'whisper_last': [float(wL[-1]), float(wR[-1])]},
    'duration_s': DUR, 'samples': N,
}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_c2.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
