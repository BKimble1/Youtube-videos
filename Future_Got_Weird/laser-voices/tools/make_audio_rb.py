#!/usr/bin/env python3
"""Rebuild V1 mix for FGW "This Laser Makes You Hear Voices" (same construction as V4, re-timed to the rebuilt picture).
  - Narration: the approved file, unedited, at the V1-V4 gain (x1.4303098), from sample 0. No stretch, pitch or edit.
  - Music: the V1 music stem, unchanged (12 ms loop fades).
  - Ambiences (synthesised): the atrium's crowd murmur (built circularly, so it flows across the seam) on every
    atrium shot; the hall muffled in the ear cutaway; a faint airy shimmer at molecular scale; a quiet room tone with
    the device's hum inside the transmitter and the plan view; the lab's hum, fan and racks.
  - Effects, small and under the voice: the three camera moves (M1, M2, M3) get soft air; clean cuts get nothing.
    The beam drawing in, the molecular absorptions (one tink per molecule), the warming swell, a soft low pulse per
    pressure band, the cover sliding off, the laser and galvo switching on and the mirror's buzz, the sweep and its
    convergence, the key and the LASER IN USE light, the tape's foot marks, the visitor's footsteps and his map.
  - The whisper: short, breathy, nonverbal, "almost alien" (as V4), about 15 dB under the narration; windows in
    audio/cues_rb.json. The first window wraps the loop seam, so it continues from the last frame into frame 0. It cuts
    with a 3 ms ramp at the block (frame 815) and returns with a 3 ms ramp at the clear (frame 958).
  - Master: the V1-V4 soft clip (tanh at -1.5 dBFS) on the sum.
Outputs: source/public/audio/mix_rb.wav, audio/mix/FGW_Laser_Voices_REBUILD_V1_mix.wav, audio/mix/stems_rb/*.wav,
         audio/mix/mix_measure_rb.json"""
import hashlib, json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, fftconvolve

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_rb.json')))
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

C = cj['CUTS']
T_BLOCK, T_CLEAR = cj['T_BLOCK'], cj['T_CLEAR']
def span(a, b, f=0.02): return window(a, b, f, f)
# the rebuild's places: the room (most shots), the air at his ear (micro), close to the device
room = np.clip(span(0, C['micro']) + span(C['aim'], DUR + 1), 0, 1)
micro = span(C['micro'], C['device'])
inside = span(C['device'], C['aim'])
# the voice he hears, nonverbal (whisper motif), at his ear: the loop seam window, the two-shot, the targeted sound,
# the 8 ft demo, the walk-in until the block; back at the clear
WHISPER = [[33.85, DUR + 1.15], [2.08, 2.7], [3.4, 4.0], [17.95, 19.85], [20.2, 22.0], [23.45, T_BLOCK], [T_CLEAR, 33.3]]

# ---------------- ambiences ----------------
def periodic_lfo(hz, ph=0.0):
    k = max(1, round(hz * DUR))
    return np.sin(2 * np.pi * k * t / DUR + ph)
# atrium crowd: babble bands, each with syllable-rate motion (whole cycles over the film so it loops)
crowd = np.zeros(N)
for i in range(9):
    lo, hi = 250 + 90 * i, 700 + 260 * i
    n = circ(bp, rng.standard_normal(N), lo, hi, 2)
    am = 0.55 + 0.45 * np.clip(periodic_lfo(2.2 + 0.37 * i, i) * periodic_lfo(0.31 + 0.07 * i, 2 * i), -1, 1)
    crowd += n * am * (0.9 ** i)
crowd /= np.sqrt(np.mean(crowd ** 2))
ir_n = int(1.4 * SR); ti = np.arange(ir_n) / SR
hall = lp(rng.standard_normal(ir_n), 3000) * np.exp(-ti / 0.32) * (ti > 0.02)
hall /= np.sqrt(np.sum(hall ** 2))
crowd = 0.55 * crowd + 0.8 * circ_conv(crowd, hall)
crowd = circ(lp, crowd, 3800, 2)
crowd /= np.sqrt(np.mean(crowd ** 2))
crowd_muffled = circ(lp, crowd, 380, 2); crowd_muffled /= np.sqrt(np.mean(crowd_muffled ** 2))
air = circ(hp, rng.standard_normal(N), 5000, 2) * (0.6 + 0.4 * periodic_lfo(0.4))
air /= np.sqrt(np.mean(air ** 2))
hum = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(60, 1), (120, 0.6), (180, 0.25), (240, 0.12)])
fan = circ(lp, circ(hp, rng.standard_normal(N), 80, 2), 900, 2); fan /= np.sqrt(np.mean(fan ** 2))
amb = (db(-50) * hum / 0.8 + db(-48) * fan) * room + db(-50) * air * micro + (db(-54) * hum / 0.8 + db(-52) * fan) * inside

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

# footsteps: the passerby wandering off in the 8 ft shot, walking into the path, walking out (his landings)
for i, st in enumerate(cj['steps']):
    place(step(200 + i), st, -30)
for i, s0 in enumerate(cj['w_out']):
    if C['leave'] <= s0['t1'] < C['back']:
        place(step(260 + i), s0['t1'], -30)
# the hook: a brief eerie shimmer as he reacts (under the whisper)
place(swell(0.6, 3000, 8000, 3) * 0.7, DUR - 0.12, -40)
place(swell(0.5, 3000, 8000, 4) * 0.7, 0.0, -40)
# the trace back to the emitter: an airy rush along the path, the dial's click
place(whoosh(0.9, 500, 2400, True, 11), C['trace'] - 0.05, -37)
place(click(5), 1.62, -36)
# the push into the ear and on into the air
place(whoosh(1.0, 300, 1600, True, 12), 4.95, -37)
place(swell(0.7, 4000, 9000), C['micro'] - 0.2, -36)
# molecular scale: the light pulses (soft ticks), an absorption tink per water molecule on the path, the warming,
# a low pressure pulse per front, a muffled thump each time a front reaches the eardrum
for p in [10.05, 10.4, 10.75, 11.1, 11.45, 11.8]:
    place(tink(3600, 0.08) * 0.5, p, -44)
for i, x in enumerate([1020, 860, 700, 560, 420, 260]):
    place(tink(2300 + 160 * i, 0.32), 10.05 + (1900 - x) / 1400, -32 if i == 3 else -35)
place(swell(1.4, 150, 900, 9), 11.55, -33)
fronts = [p for p in [10.05 + 0.35 * k for k in range(13)] if p >= 12.15]
for k, p in enumerate(fronts):
    place(thup(78, 0.22), p + 0.12, -32 + min(3, k))
    td = p + 0.12 + 1910 / 1100
    if td < C['device'] - 0.05:
        place(lp(thup(58, 0.3), 500), td, -31)
# the whip back up the path, into the emitter
place(whoosh(0.45, 2400, 500, False, 13), 14.75, -35)
# the emitter: the panel turning see-through, the prism motor spinning up (twice) and holding
place(swell(0.5, 1500, 5000, 21), 15.7, -40)
x = tsig(2.2); f = 140 + 120 * ss(0.15, 0.6, x) + 140 * ss(1.15, 1.8, x)
ph = 2 * np.pi * np.cumsum(f) / SR
motor = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * ss(0, 0.2, x) * (1 - ss(2.0, 2.2, x))
place(motor, 15.55, -42)
place(click(6), 16.6, -38)
# back down the path to him; the sound collecting at his ear
place(whoosh(1.1, 1800, 500, False, 14), C['aim'], -38)
place(chime(1180, 1.0), 18.45, -36)
# the 8 ft shot: the operator's dial, the tape marks lighting one by one
place(click(31), 20.35, -34)
for i in range(9):
    place(tink(1500 + 90 * i, 0.1), 21.2 + i * 1.3 / 9, -42)
place(chime(660, 0.8) * 0.6, 22.5, -38)
# the block: a soft dull 'thud' of the path stopping on him, nothing else; the clear: a soft lift
place(lp(thup(90, 0.18), 700), T_BLOCK, -36)
place(sweep_tone(400, 1200, 0.35) * 0.5, T_CLEAR - 0.02, -42)

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
os.makedirs(os.path.join(EP, 'audio/mix/stems_rb'), exist_ok=True)
out = os.path.join(EP, 'source/public/audio/mix_rb.wav')
sf.write(out, st, SR, subtype='PCM_24')
shutil.copy(out, os.path.join(EP, 'audio/mix/FGW_Laser_Voices_REBUILD_V1_mix.wav'))
for name, sig in [('whisper', np.stack([wL, wR], 1)), ('ambience', amb), ('sfx', sfx)]:
    sf.write(os.path.join(EP, f'audio/mix/stems_rb/{name}.wav'), sig, SR, subtype='PCM_24')

meter = pyln.Meter(SR)
wm = 0.5 * (wL + wR)
def win_db(x, a, b): i, j = int(a * SR), int(b * SR); return round(10 * np.log10(np.mean(x[i:j] ** 2) + 1e-14), 1)
meas = {
    'narration_file_sha256': sha(NARR), 'narration_gain': G_VOICE, 'narration_offset_samples': 0,
    'integrated_lufs_stereo': round(meter.integrated_loudness(st), 2),
    'v6_integrated_lufs_stereo': round(meter.integrated_loudness(sf.read(os.path.join(EP, 'audio/mix/FGW_Laser_Voices_V6_mix.wav'))[0]), 2),
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
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_rb.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
