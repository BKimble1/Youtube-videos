#!/usr/bin/env python3
"""JIZAI ARMS V1 mix: the narration master (sample for sample, no stretch or pitch change), a synthesized music bed
that loops seamlessly over the 31.0 s film (16 bars, a whole number of cycles), and restrained effects on the
animation's own events (servo whirs on arm moves, clicks on the connector collars, soft pips for the six terminal
lights, a paper-cup tap, hair pats). Narration stays dominant: the bed is ducked under speech.
Writes audio/mix/FGW_JIZAI_V1_mix.wav (48 kHz, 24-bit, stereo), source/public/audio/mix_v1.wav, a cue log and
measurements (audio/mix/mix_measure_v1.json)."""
import os, sys, json, wave, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_lib as A
from audio_lib import SR, db, lp, hp, bp, norm, rmsn

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUR = 31.0
A.init(DUR, seed=11)
N = A.N
t = A.t
rng = A.rng

def read_wav(p):
    y = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(y, np.float32).astype(np.float64)

# ------------------------------------------------------------------ narration
nar = read_wav(os.path.join(ROOT, 'audio/narration/FGW_JIZAI_narration_V1.wav'))
voice = np.zeros(N); voice[:min(N, len(nar))] = nar[:N]
words = json.load(open(os.path.join(ROOT, 'audio/narration/FGW_JIZAI_words_V1.json')))['words']
speech = np.zeros(N)
for w in words:
    a, b = int(max(0, w['start'] - 0.05) * SR), int(min(DUR, w['end'] + (0.45 if w is words[-1] else 0.12)) * SR)
    speech[a:b] = 1
speech = A.smooth(speech, 3.0)
speech = np.clip(speech / max(1e-9, speech.max()), 0, 1)

# ------------------------------------------------------------------ music bed (16 bars over 31.0 s)
BARS = 16
bar = DUR / BARS
beat = bar / 4
def note(m): return 440.0 * 2 ** ((m - 69) / 12)
# Am - F - C - G, two bars each, twice
CH = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]]
music = np.zeros(N)
pad = np.zeros(N)
for b in range(BARS):
    ch = CH[(b // 2) % 4]
    a0, a1 = b * bar, (b + 1) * bar
    i0, i1 = int(a0 * SR), int(a1 * SR)
    tt = np.arange(i1 - i0) / SR
    env = np.minimum(1, tt / 0.25) * np.minimum(1, (a1 - a0 - tt) / 0.25 + 0.0001)
    seg = np.zeros(i1 - i0)
    for m in ch:
        for det in (-0.08, 0.08):
            f = note(m) * 2 ** (det / 12)
            ph = 2 * np.pi * f * (tt + a0)
            seg += (np.sin(ph) + 0.33 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph))
    pad[i0:i1] += seg * env
pad = lp(pad, 1800) * 0.06
# pluck arpeggio (eighths) and a sub pulse on beats 1 and 3
arp = np.zeros(N)
sub = np.zeros(N)
for b in range(BARS):
    ch = CH[(b // 2) % 4]
    seq = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[2] + 12]
    for k in range(8):
        s0 = b * bar + k * beat / 2
        i0 = int(s0 * SR); n = int(0.32 * SR)
        tt = np.arange(n) / SR
        y = np.sin(2 * np.pi * note(seq[k]) * tt) * np.exp(-tt / 0.09) * (1 - np.exp(-tt / 0.002))
        e = min(N, i0 + n); arp[i0:e] += y[:e - i0]
    for k in (0, 2):
        s0 = b * bar + k * beat
        i0 = int(s0 * SR); n = int(0.5 * SR)
        tt = np.arange(n) / SR
        y = np.sin(2 * np.pi * note(ch[0] - 24) * tt) * np.exp(-tt / 0.18) * (1 - np.exp(-tt / 0.004))
        e = min(N, i0 + n); sub[i0:e] += y[:e - i0]
hat = np.zeros(N)
for k in range(BARS * 8):
    i0 = int((k * beat / 2 + beat / 4) * SR); n = int(0.05 * SR)
    y = hp(rng.standard_normal(n), 7000) * np.exp(-np.arange(n) / SR / 0.012)
    e = min(N, i0 + n); hat[i0:e] += y[:e - i0]
music = pad + 0.05 * lp(arp, 4200) + 0.12 * sub + 0.012 * hat
# duck under speech (about 7 dB) and lift a little in the gaps
music *= db(-7.5 * speech)
# the last words ('figure of speech') are the softest of the read: a further dip in the bed under them
lastdip = A.window(28.95, 30.05, 0.25)
music *= db(-8.0 * lastdip)

# ------------------------------------------------------------------ effects
fx = np.zeros(N)
LOG = []
def put(y, at, gain_db, name):
    i0 = int(at * SR); e = min(N, i0 + len(y))
    if i0 < 0 or i0 >= N: return
    fx[i0:e] += y[:e - i0] * db(gain_db)
    LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})

def whir(dur, f0=210, f1=260, bright=1.0):
    """servo: a geared hum (harmonics of a rising/falling tone) plus a little band-limited motor noise"""
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = f0 + (f1 - f0) * np.sin(np.pi * u)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3.02 * ph) + 0.12 * np.sin(5.01 * ph)
    nz = bp(rng.standard_normal(n), 900, 3200 * bright) * 0.35
    env = np.sin(np.pi * np.clip(u, 0, 1)) ** 0.7
    return norm((tone * 0.6 + nz) * env)

def click(f=3200, dur=0.05, body=900):
    n = int(dur * SR); tt = np.arange(n) / SR
    tr = hp(rng.standard_normal(n), 2500) * np.exp(-tt / 0.0025)
    ring = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.012) * 0.5 + np.sin(2 * np.pi * body * tt) * np.exp(-tt / 0.02) * 0.6
    return norm(tr + ring)

def ratchet(dur=0.3, teeth=7):
    y = np.zeros(int(dur * SR))
    for k in range(teeth):
        c = click(2600 + 200 * k % 3, 0.03, 1100) * (0.5 + 0.5 * k / teeth)
        i = int(k / teeth * dur * SR); e = min(len(y), i + len(c)); y[i:e] += c[:e - i]
    return norm(y)

def thunk(dur=0.18):
    n = int(dur * SR); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * 140 * tt * (1 - 0.3 * tt / dur)) * np.exp(-tt / 0.04) + lp(rng.standard_normal(n), 900) * np.exp(-tt / 0.015) * 0.6
    return norm(y)

def pip(f=1760, dur=0.12):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.035) * (1 - np.exp(-tt / 0.002)))

def slide(dur=0.35):
    n = int(dur * SR); u = np.arange(n) / n
    return norm(bp(rng.standard_normal(n), 1500, 6000) * np.sin(np.pi * u) ** 1.5)

def tap(dur=0.08, f=600):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(rng.standard_normal(n), 400, 2500) * np.exp(-tt / 0.01) + 0.4 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.015))

def pat(dur=0.1):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(lp(rng.standard_normal(n), 1200) * np.exp(-tt / 0.02))

W = -30  # base level of a servo whir (quiet, under the voice)
# S1 hook
put(whir(0.5, 230, 300), 0.0, W, 'LL reach whir')
put(tap(), 0.44, -30, 'cup taken (grip on paper)')
put(whir(0.45, 250, 330), 0.78, W - 1, 'UL crosses behind the shoulder')
for k, at in enumerate([1.3, 1.45, 1.58]):
    put(whir(0.12, 520, 600, 1.4), at, W - 4, f'LR fingers {k}')
put(whir(0.55, 200, 240), 1.62, W - 2, 'four arms arc (low)')
put(whir(0.5, 280, 360), 1.70, W - 5, 'four arms arc (high)')
put(whir(0.5, 240, 300), 2.95, W - 2, 'LR sweeps across the lens')
put(whir(0.85, 210, 260), 3.5, W, 'UR follows the model (reach up)')
put(whir(0.75, 300, 340, 1.2), 4.45, W - 1, 'UR wrist roll')
put(whir(0.9, 200, 250), 5.35, W, 'UR elbow folds')
# S2
put(whir(0.8, 220, 260), 6.5, W - 2, 'LL puts the cup down')
put(tap(0.07, 520), 7.27, -32, 'cup set on the cart')
for k, at in enumerate([9.62, 9.66, 9.7, 9.74]):
    put(ratchet(0.28, 5), at, -34, f'collar release {k}')
put(slide(0.45), 9.6, -36, 'arms slide out on their axes')
for i in range(6):
    put(pip(1568 + 196 * i), 10.05 + 0.11 * i, -31, f'terminal light {i + 1}')
put(slide(0.4), 10.9, -37, 'arms slide home')
put(click(), 11.3, -33, 'three arms seat')
put(ratchet(0.2, 4), 11.2, -35, 'three collars lock')
put(thunk(), 11.76, -30, 'UL plug seats')
put(click(3400, 0.06, 1000), 11.93, -27, 'UL collar locks')
# S3 controller demos
put(whir(0.65, 200, 240), 13.0, W, 'shoulder rotation')
put(whir(0.75, 230, 290), 13.75, W, 'elbow')
put(whir(0.9, 300, 360, 1.2), 14.55, W - 1, 'wrist and hand')
# S4
put(whir(1.0, 210, 270), 16.5, W - 1, 'extra hand to the front')
put(whir(0.7, 300, 350, 1.2), 18.2, W - 2, 'wrist turn through the match cut')
put(whir(0.6, 220, 260), 18.9, W - 1, 'hand over the head')
put(pat(), 19.85, -32, 'pat'); put(pat(), 20.45, -33, 'pat')
# S5 swap
put(ratchet(0.3, 6), 22.85, -29, 'collar unlock (twist)')
put(click(2800, 0.05, 800), 23.15, -30, 'collar released')
put(slide(0.4), 23.15, -33, 'plug drawn out')
put(thunk(0.14), 23.6, -35, 'arm folds (unpowered)')
put(tap(0.06, 400), 24.05, -34, 'hand-off grip')
put(slide(0.3), 24.85, -33, 'plug in')
put(thunk(), 25.1, -29, 'plug seats')
put(click(3400, 0.06, 1000), 25.24, -26, 'collar locks')
put(pip(2093, 0.16), 25.32, -30, 'arm light on')
put(whir(0.9, 220, 280), 25.45, W, 'arm wakes')
# S6
put(whir(1.1, 210, 250), 26.4, W - 2, 'borrowed arm moves')
put(whir(0.9, 230, 280), 27.6, W - 3, 'borrowed arm moves 2')
put(whir(1.0, 220, 290), 29.98, W - 1, 'reach toward the viewer (after the last word)')
fx = A.lp(fx, 9000) * db(-8.0 * A.window(28.95, 29.98, 0.2))

# ------------------------------------------------------------------ mix and master
v = voice * db(0) * (0 if os.environ.get('NOVOICE') else 1)
mix = v + music * db(-2) + fx * db(3)
# a gentle compressor on the sum, then normalise to -14 LUFS and limit true peak at -1.5 dBTP
mix, _ = A.compress(mix, thr_db=-18, ratio=1.8)
print('pre-norm lufs', A.lufs(mix))
L = (float(os.environ['LREF']) if os.environ.get('LREF') else A.lufs(mix)) + 3.01  # stereo (two identical channels) meters 3 dB above the mono sum
mix *= db(-14.0 - L)
mix, gr = A.tp_limit(mix, -1.5)
st = np.stack([mix, mix], 1)
# stereo: the bed slightly wide (a short Haas offset on the pad only), voice centred
wide = np.zeros(N); d = int(0.011 * SR); wide[d:] = (music * db(-2) * db(-14.0 - L))[:-d]
st[:, 0] += 0.0
st[:, 1] = st[:, 1] - (music * db(-2) * db(-14.0 - L)) * 0.15 + wide * 0.15
st = np.clip(st, -1, 1)
def write24(p, x):
    pcm = (np.clip(x, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
    b = pcm.astype('<i4').tobytes()
    b24 = b''.join(b[i:i + 3] for i in range(0, len(b), 4))
    with wave.open(p, 'wb') as f:
        f.setnchannels(x.shape[1] if x.ndim > 1 else 1); f.setsampwidth(3); f.setframerate(SR); f.writeframes(b24)
os.makedirs(os.path.join(ROOT, 'audio/mix'), exist_ok=True)
os.makedirs(os.path.join(ROOT, 'source/public/audio'), exist_ok=True)
out = os.path.join(ROOT, 'audio/mix/FGW_JIZAI_V1_mix.wav' if not os.environ.get('NOVOICE') else '/tmp/claude-0/-home-user-Youtube-videos/8ee7068f-8a4f-5a41-9a7a-a0a4c70ac0d3/scratchpad/novoice.wav')
write24(out, st)
if not os.environ.get('NOVOICE'): write24(os.path.join(ROOT, 'source/public/audio/mix_v1.wav'), st)
meas = {
    'integrated_lufs_stereo': round(float(A.pyln.Meter(SR).integrated_loudness(st)), 2),
    'max_short_term_lufs': A.lmax(st.mean(1), 3.0),
    'sample_peak_dbfs': round(float(20 * np.log10(np.abs(st).max() + 1e-12)), 2),
    'limiter_max_gain_reduction_db': round(float(20 * np.log10(gr.min() + 1e-12)), 2),
    'voice_vs_music_lufs': {'voice': A.lufs(v), 'music_in_mix': A.lufs(music * db(-2)), 'fx': A.lufs(fx)},
    'duration_s': DUR,
}
if not os.environ.get('NOVOICE'): json.dump(meas, open(os.path.join(ROOT, 'audio/mix/mix_measure_v1.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(ROOT, 'audio/sfx_cues_v1.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
