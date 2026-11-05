#!/usr/bin/env python3
"""Sound design and mix for "Brain Cells Playing DOOM" (Future Got Weird). Everything is synthesised here (no samples)
and placed from the picture's own events (audio/cues.json, exported from the source by tools/export_cues.ts).

  game        retro shots (a bit-crushed noise crack over a low thump), enemy pain and death growls, wall ricochets,
              the claw swipe and the hurt thud. Their level and brightness follow how much of the frame the game
              fills: full and bright on screen, small and muffled when we are inside the chip.
  culture     what an electrophysiology audio monitor makes of neurons: soft dry pops (spikes) in the response
              volleys and bursts, sparse spontaneous pops at cell scale; stimulation as tiny electrical ticks
              (biphasic pulse trains). No crashes or zaps.
  software    soft UI blips when the decoder lights a command (pitch per command)
  moves       airy whooshes on the signal rides (rising out of the chip, falling into it) and the big camera moves
  room        lab ambience (air handling, a faint mains hum), the CL1's pump while we are inside it
  music       a low, quiet pad and a soft plucked pulse at 120 bpm, 58 beats = exactly the film, so it loops;
              it opens up as the living hardware is revealed and thins on the final push into the game

The narration master is used sample for sample (gain only). Effects and music duck under the words. Levels: about
-14 LUFS integrated, true peak <= -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, sosfiltfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(EP)
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
C = json.load(open('audio/cues.json'))
DUR = C['duration']
N = int(round(DUR * SR))
PF = C['perFrame']
rng = np.random.default_rng(7)


def db(x): return 10 ** (x / 20)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def env(n, a, d, shape=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
    return e ** shape
def crush(x, bits=6, hold=4):
    q = 2 ** (bits - 1)
    y = np.round(x * q) / q
    return np.repeat(y[::hold], hold)[:len(x)]
def frame_curve(key):
    v = np.array([f[key] for f in PF], float)
    t = np.arange(len(v)) / 30
    return np.interp(np.arange(N) / SR, t, v)
def add(buf, x, t, g=1.0, wrap=True):
    i0 = int(round(t * SR))
    idx = (np.arange(len(x)) + i0)
    if wrap:
        idx %= N
        np.add.at(buf, idx, x * g)
    else:
        m = (idx >= 0) & (idx < N)
        np.add.at(buf, idx[m], x[m] * g)

gameArea = frame_curve('gameArea')
micro = frame_curve('micro')
lens = frame_curve('lens')
# how present the game is: full when the game fills the frame, still audible (distant) from the lab, faint in the cells
gpres = np.clip(0.28 + 1.6 * np.sqrt(gameArea), 0, 1) * (1 - 0.72 * micro)
cellpres = np.clip(micro + 0.55 * lens, 0, 1)

# ------------------------------------------------------------------ game sounds
def shot():
    n = int(0.42 * SR)
    noise = rng.standard_normal(n)
    crack = bp(noise, 900, 6000) * env(n, 0.001, 0.045)
    body = bp(noise, 120, 1400) * env(n, 0.002, 0.11) * 0.8
    f = 95 * np.exp(-np.arange(n) / SR / 0.08) + 42
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.14) * 0.9
    x = crush(crack * 0.9 + body + thump, 7, 3)
    return lp(x, 7000) * 0.9
def growl(n_s, f0, f1, rough=0.6, seed=0):
    n = int(n_s * SR)
    r = np.random.default_rng(seed)
    t = np.arange(n) / SR
    f = np.geomspace(f0, f1, n) * (1 + 0.06 * np.sin(2 * np.pi * 23 * t))
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    x = saw + rough * bp(r.standard_normal(n), 200, 1800)
    x = bp(x, 110, 2400) * env(n, 0.012, n_s * 0.45)
    return crush(x, 6, 5) * 0.55
def ricochet():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    ping = np.sin(2 * np.pi * (3100 - 1600 * t / 0.3) * t) * env(n, 0.001, 0.05) * 0.35
    clk = hp(rng.standard_normal(n), 2500) * env(n, 0.0005, 0.012) * 0.6
    return crush(ping + clk, 7, 2)
def swipe():
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 500, 3500) * np.sin(np.pi * t / 0.28) ** 2
    return x * 0.5
def thud():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (70 - 30 * t) * t) * env(n, 0.002, 0.12) + lp(rng.standard_normal(n), 400) * env(n, 0.002, 0.05)) * 0.9

game = np.zeros(N)
SH, GR, DE, RI = shot(), [growl(0.26, 150, 95, seed=k) for k in range(4)], growl(0.75, 120, 48, 0.8, seed=9), ricochet()
for k, s in enumerate(C['shots']):
    add(game, SH, s['t'], 1.0)
    if s['target'] is None:
        add(game, RI, s['t'] + 0.03, 0.8)
    elif s['kill']:
        add(game, DE, s['t'] + 0.04, 0.8)
    else:
        add(game, GR[k % 4], s['t'] + 0.04, 0.7)
add(game, swipe(), C['attack'], 0.9)
add(game, thud(), C['hurt'], 1.0)
add(game, growl(0.3, 170, 120, seed=21), C['attack'] - 0.05, 0.6)
# a game room tone: the low hum of a retro level, only while the game is on screen
room_g = lp(rng.standard_normal(N), 180) * 0.25 + 0.05 * np.sin(2 * np.pi * 55 * np.arange(N) / SR)
game = game + room_g * 0.35
# muffle and lower with distance
g_bright = lp(game, 7000)
g_dull = lp(game, 900)
gm = np.clip((gpres - 0.2) / 0.8, 0, 1)
game = (g_bright * gm + g_dull * (1 - gm)) * (0.25 + 0.75 * gpres)

# ------------------------------------------------------------------ culture: spikes and stimulation
cult = np.zeros(N)
def pop(seed, bright=1.0):
    n = int(0.006 * SR)
    r = np.random.default_rng(seed)
    x = r.standard_normal(n) * env(n, 0.0002, 0.0012)
    return bp(x, 700, 5200) * bright
def tick():
    n = int(0.004 * SR)
    x = np.zeros(n); x[:24] = 1; x[24:48] = -1  # biphasic
    return hp(x, 1200) * 0.5
POPS = [pop(k, 0.6 + 0.4 * ((k * 7) % 5) / 4) for k in range(40)]
TK = tick()
for si, s in enumerate(C['stims']):
    for p in range(s.get('pulses', 1)):
        t0 = s['t'] + p * 0.09
        for k in range(6):  # each pulse heard as a short train
            add(cult, TK, t0 + k * 0.011, 0.6)
for ri, r in enumerate(C['resps']):
    m = int(14 * r.get('p', 0.9))
    for k in range(m):
        tt = r['t'] + rng.random() * (r.get('spread', 0.16) + 0.12)
        add(cult, POPS[(ri * 13 + k) % 40], tt, 0.7 + rng.random() * 0.5)
for bi, b in enumerate(C['bursts']):
    for k in range(int(36 * b.get('p', 0.75))):
        tt = b['t'] + rng.gamma(2.0, 0.12)
        add(cult, POPS[(bi * 7 + k) % 40], tt, 0.6 + rng.random() * 0.5)
# spontaneous pops (sparse)
t = 0.0
while t < DUR:
    t += rng.exponential(0.11)
    add(cult, POPS[int(rng.random() * 40)], t, 0.35 + rng.random() * 0.35)
cult = cult * (0.12 + 0.88 * cellpres)

# ------------------------------------------------------------------ decoder blips
ui = np.zeros(N)
FQ = {'move': 784.0, 'turn': 988.0, 'fire': 1318.5}
for c in C['cmds']:
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * FQ[c['k']] * tt) + 0.3 * np.sin(4 * np.pi * FQ[c['k']] * tt)) * env(n, 0.004, 0.03)
    add(ui, x * 0.35, c['t'])

# ------------------------------------------------------------------ whooshes (rides and big moves)
mv = np.zeros(N)
def whoosh(dur, f0, f1, g=1.0, seed=0):
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    x = r.standard_normal(n)
    out = np.zeros(n)
    seg = 512
    for i in range(0, n, seg):
        u = i / n
        fc = f0 * (f1 / f0) ** u
        out[i:i + seg] = bp(x[max(0, i - 2048):i + seg], fc * 0.7, min(fc * 1.4, SR / 2.2))[-len(out[i:i + seg]):]
    shape = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return out * shape * g
for k, r in enumerate(C['rides']):
    up = r['w1'] > r['w0']
    add(mv, whoosh(r['t1'] - r['t0'] + 0.15, 500 if up else 2600, 2600 if up else 500, 0.6, k), r['t0'] - 0.05)
for k, (a, b, g, f0, f1) in enumerate([(0.25, 0.78, 0.5, 2200, 700), (0.78, 1.18, 0.55, 700, 2400), (5.0, 6.7, 0.45, 2400, 600), (7.62, 8.7, 0.35, 600, 1500),
                                        (9.35, 9.95, 0.3, 800, 2000), (11.16, 11.85, 0.3, 900, 1600), (19.29, 19.75, 0.3, 700, 1700), (21.0, 22.0, 0.35, 1800, 700),
                                        (23.45, 24.4, 0.45, 700, 2600), (25.87, 27.15, 0.35, 2400, 700), (28.05, 28.9, 0.55, 600, 2600)]):
    add(mv, whoosh(b - a + 0.1, f0, f1, g, 40 + k), a - 0.05)

# ------------------------------------------------------------------ room: air handling, hum, the pump inside the CL1
tt = np.arange(N) / SR
def cyc_noise(f):
    # a loop-seamless filtered noise: filtered circularly (FFT), so the end meets the start
    X = np.fft.rfft(rng.standard_normal(N))
    fr = np.fft.rfftfreq(N, 1 / SR)
    return np.fft.irfft(X * f(fr), N)
air = cyc_noise(lambda fr: 1 / (1 + (fr / 260) ** 2) * (fr > 30))
air /= np.abs(air).max()
hum = 0.06 * np.sin(2 * np.pi * 60 * tt) + 0.03 * np.sin(2 * np.pi * 120 * tt)
pump_on = np.interp(tt, [0, 7.6, 7.9, 9.3, 9.6, DUR], [0, 0, 1, 1, 0, 0])
pump = bp(rng.standard_normal(N), 300, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.15 * tt)) ** 4 * pump_on * 0.22
room = air * 0.35 * (1 - 0.6 * micro) + hum * (1 - micro) + pump

# ------------------------------------------------------------------ music: 120 bpm, 58 beats = the film (loops)
BEAT = DUR / 58
CH = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 64], [43, 50, 55, 59, 62], [40, 47, 52, 56, 59]]  # Am, F(add9), G, E
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
pad = np.zeros(N)
seglen = N // 4
for i, ch in enumerate(CH):
    a, b = i * seglen, (i + 1) * seglen if i < 3 else N
    tt_ = np.arange(b - a) / SR
    x = np.zeros(b - a)
    for m in ch:
        for det in (-0.07, 0.07):
            f = mtof(m) * 2 ** (det / 12)
            ph = 2 * np.pi * f * tt_ + i
            x += (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph))
    fade = np.minimum(1, np.minimum(tt_ / 0.35, (tt_[-1] - tt_) / 0.35))
    pad[a:b] += x * fade / 10
pad = lp(pad, 1400)
arp = np.zeros(N)
for k in range(58 * 2):
    ch = CH[min(3, int(k * BEAT / 2 / (DUR / 4)))]
    m = ch[[0, 2, 3, 4, 3, 2][k % 6]] + 12
    n = int(0.3 * SR)
    tt_ = np.arange(n) / SR
    x = np.sin(2 * np.pi * mtof(m) * tt_) * env(n, 0.003, 0.09) + 0.3 * np.sin(4 * np.pi * mtof(m) * tt_) * env(n, 0.002, 0.04)
    add(arp, x * (0.55 if k % 2 else 0.8), k * BEAT / 2)
arp = lp(arp, 4200)
sub = np.zeros(N)
for k in range(58):
    if k % 2 == 0:
        n = int(0.42 * SR)
        tt_ = np.arange(n) / SR
        ch = CH[min(3, int(k * BEAT / (DUR / 4)))]
        add(sub, np.sin(2 * np.pi * mtof(ch[0] - 12) * tt_) * env(n, 0.01, 0.22), k * BEAT)
# arrangement: quiet under the opening game, opening up as the hardware appears, a little brighter at the end,
# thinning on the final push into the game so the loop lands on the opening's level
lvl = np.interp(tt, [0, 0.7, 1.4, 5, 19, 23.4, 24.5, 27.3, 28.0, 28.9, DUR], [0.45, 0.45, 0.85, 0.9, 0.95, 0.8, 1.0, 1.05, 0.8, 0.5, 0.45])
arp_l = np.interp(tt, [0, 1.0, 1.6, 23.3, 23.6, 25.8, 26.3, 28.6, DUR], [0.0, 0.0, 0.8, 0.8, 0.35, 0.35, 0.9, 0.3, 0.0])
music = (pad * 0.9 + sub * 0.55) * lvl + arp * arp_l * 0.45

# ------------------------------------------------------------------ narration and mix
voice, vsr = sf.read('audio/narration/FGW_Brain_Cells_DOOM_narration_V1.wav')
assert vsr == SR
voice = voice[:N] if len(voice) >= N else np.pad(voice, (0, N - len(voice)))
meter = pyln.Meter(SR)
def L(x): return meter.integrated_loudness(np.stack([x, x], 1))
# a smooth voice envelope for ducking (leads the words slightly, loop-wrapped)
ve = np.abs(voice)
k = int(0.03 * SR)
ve = np.convolve(ve, np.ones(k) / k, 'same')
ve = np.roll(ve, -int(0.04 * SR))
vn = np.clip(ve / (np.percentile(ve[ve > 1e-4], 90) + 1e-9), 0, 1)
vn = sosfiltfilt(butter(1, 6, 'lowpass', fs=SR, output='sos'), vn)
duck = 1 - 0.5 * np.clip(vn, 0, 1)
duck_hi = 1 - 0.7 * np.clip(vn, 0, 1)
def ducked(x, hi_split=2400):
    lo, hi = lp(x, hi_split), hp(x, hi_split)
    return lo * duck + hi * duck_hi
# bus gains relative to the voice (dB under it, before ducking)
vl = L(voice)
def at(x, rel):
    l = L(x) if np.abs(x).max() > 0 else -70
    return x * db(vl + rel - l)
buses = {
    'game': at(game, -11.0),
    'culture': at(cult, -17.0),
    'ui': at(ui, -19.0),
    'moves': at(mv, -18.5),
    'room': at(room, -27.0),
    'music': at(music, -19.5),
}
fx = sum(ducked(b) for b in buses.values())
mix_pre = voice + fx
def tp_limit(x, ceil_db):
    up = resample_poly(x, 4, 1)
    pk = np.abs(up).reshape(-1, 4).max(1)[:len(x)]
    c = db(ceil_db)
    g = np.minimum(1, c / np.maximum(pk, 1e-9))
    # smooth the gain (fast attack, 80 ms release), circular
    w = int(0.004 * SR)
    g = np.minimum.reduce([np.roll(g, s) for s in range(-w, w + 1, max(1, w // 8))])
    rel = np.exp(-1 / (0.08 * SR))
    out = g.copy()
    for _ in range(2):
        for i in range(1, len(out)):
            out[i] = min(g[i], out[i - 1] * rel + (1 - rel) * 1.0) if out[i - 1] < g[i] else g[i]
    return x * out, out
g = db(-14.0 - L(mix_pre))
for _ in range(3):
    mix, glim = tp_limit(mix_pre * g, -1.6)
    g *= db(-14.0 - L(mix))
mix, glim = tp_limit(mix_pre * g, -1.6)
os.makedirs('audio/mix', exist_ok=True)
out = f'audio/mix/FGW_Brain_Cells_DOOM_{NAME.upper()}.wav'
st = np.stack([mix, mix], 1).astype(np.float32)
sf.write(out, st, SR, subtype='PCM_24')
os.makedirs('source/public/audio', exist_ok=True)
sf.write(f'source/public/audio/{NAME}.wav', st, SR, subtype='PCM_24')
tp = 20 * np.log10(np.abs(resample_poly(mix, 4, 1)).max())
rep = {'mix': out, 'integrated_lufs_stereo': round(L(mix), 2), 'true_peak_dbtp': round(tp, 2), 'limiter_max_reduction_db': round(-20 * np.log10(glim.min()), 2),
       'voice_vs_effects_db': {k: round(L(ducked(v) * g) - L(voice * g), 1) for k, v in buses.items()},
       'loop_seam_abs': round(float(abs(mix[-1] - mix[0])), 4), 'duration_s': round(N / SR, 3)}
json.dump(rep, open(f'audio/mix/mix_measure_{NAME}.json', 'w'), indent=1)
print(json.dumps(rep, indent=1))
