#!/usr/bin/env python3
"""Effects, ambience, music bed and mix for "The Fish Made From Human Heart Cells" (V1).

Everything but the voice is synthesised here (no samples). The narration master is used sample for sample (gain,
the gentle compressor and the circular true-peak limiter of the Eel Escape mix). Effects are placed from the picture's
own timing (audio/cues.json, exported from the shots by tools/export_cues.ts).

  ambience   cut with the picture: the tank (a muffled underwater wash, a slow current), the lab (room tone, a faint
             mains hum), the microscope (a faint electrical hum), the living heart (a low, close rumble)
  fish       soft wet swishes on the tail strokes; the demonstration's contraction thumps, the rubbery stretch of the
             opposite side, a small bioelectric tick as the trigger wave runs, the swim's lighter thumps
  bench      the tweezers' click as the tail docks; whooshes on the pull-back and the rush in
  cells      a soft muffled pulse on each contraction under the microscope
  time-lapse a quick clock-ish flutter at each night, the pipette's plup each morning
  heart      a lub-dub on each systole of the living heart
  music      restrained: a soft pad (Dm, Bb, F, C) and a sparse plucked arpeggio, 12 bars fitted to the film so it
             loops; it thins under the demonstration and lifts a little into the final line

usage: python3 tools/make_audio.py [mix_name]    (default mix)"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_lib as A
from audio_lib import db, noise, lp, hp, bp, circ, smooth, rmsn, norm, fades, lmax, lufs, plup, stretch, soft_pop, squelch, compress, tp_limit

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix'
NARRATION = 'audio/narration/FGW_HeartFish_narration_V1.wav'
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR = cj['DUR']
A.init(DUR, 4413)
SR, N, t = A.SR, A.N, A.t
T = cj['T']
VREF = -16.0
BUS = {k: np.zeros(N) for k in ('amb', 'tex', 'dot', 'accent', 'music')}
LOG = []


def place(x, at, name, lvl, bus='dot'):
    """add x at `at` s at `lvl` dB re the voice's loudest 400 ms; a tail past the end wraps to the start (loop)"""
    x = rmsn(x) * db(VREF + lvl - lmax(rmsn(x))) if bus != 'music' else x
    i = int(round(at * SR)) % N
    n = len(x)
    j = min(N - i, n)
    BUS[bus][i:i + j] += x[:j]
    if n > j: BUS[bus][:n - j] += x[j:]
    LOG.append({'t': round(at % DUR, 3), 'dur': round(n / SR, 3), 'sfx': name, 'level_re_voice_db': lvl, 'bus': bus})


def env(n, a, r): return fades(n, a, r)
def tt(d): return np.arange(int(d * SR)) / SR


# ---------------------------------------------------------------- effects
def S(*xs):
    """sum sounds of different lengths (aligned at their starts)"""
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out
def swish(d=0.2, lo=280, hi=1300):
    x = bp(noise(int(d * SR)), lo, hi, 2)
    return x * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.6
def thump(f0=95, f1=48, d=0.32, wet=0.5):
    u = tt(d)
    ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-u / 0.05)) / SR
    body = np.sin(ph) * np.exp(-u / 0.09)
    sq = lp(noise(len(u)), 900, 2) * np.exp(-u / 0.05) * wet
    return body + 0.35 * sq
def tick(f0=2400, f1=900, d=0.12):
    u = tt(d)
    ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-u / 0.02)) / SR
    return np.sin(ph) * np.exp(-u / 0.03) + 0.15 * hp(noise(len(u)), 3000) * np.exp(-u / 0.01)
def whoosh(d=0.6, lo=180, hi=1600, rev=False):
    u = np.linspace(0, 1, int(d * SR))
    x = noise(len(u))
    out = np.zeros_like(x)
    seg = 512
    for k in range(0, len(x), seg):
        c = lo + (hi - lo) * (u[k] if not rev else 1 - u[k])
        out[k:k + seg] = bp(x[max(0, k - 2048):k + seg], c * 0.6, min(SR / 2 - 100, c * 1.6), 2)[-len(x[k:k + seg]):]
    e = np.sin(np.pi * u) ** 1.3 if not rev else (u ** 2.2) * np.exp(-((u - 0.85) / 0.25) ** 2 * 0.0) * (1 - u ** 12)
    return out * e
def click(d=0.05):
    u = tt(d)
    return (np.sin(2 * np.pi * 3600 * u) + 0.6 * np.sin(2 * np.pi * 5200 * u)) * np.exp(-u / 0.006)
def shimmer(d=0.7):
    u = tt(d)
    x = hp(noise(len(u)), 4000) * 0.4 + np.sin(2 * np.pi * 2400 * u) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * u))
    return x * np.sin(np.pi * np.minimum(1, u / d)) ** 2
def lubdub():
    a = thump(70, 42, 0.22, 0.25)
    b = thump(85, 50, 0.18, 0.2) * 0.75
    out = np.zeros(int(0.6 * SR))
    out[:len(a)] += a
    k = int(0.27 * SR)
    out[k:k + len(b)] += b
    return lp(out, 400, 2)
def flutter(d=0.22):
    u = tt(d)
    clk = np.zeros(len(u))
    for k in range(9):
        i = int(k * d / 9 * SR)
        c = click(0.03) * (0.6 + 0.4 * (k % 2))
        clk[i:i + len(c)] += c[:len(clk) - i]
    return S(clk * 0.6, whoosh(d, 400, 2200) * 0.8)


GEN = {
    'stroke': (lambda e: swish(0.2), 'tail stroke', -27.0, 'tex'),
    'stroke_tank': (lambda e: swish(0.16, 400, 1600), 'tail stroke (tank, through glass)', -31.0, 'tex'),
    'contract': (lambda e: thump(100, 50, 0.4, 0.7), 'muscle contraction (demonstration)', -13.0, 'accent'),
    'contract_swim': (lambda e: S(thump(110, 60, 0.22, 0.5), 0.6 * swish(0.18)), 'contraction on each stroke', -24.0, 'dot'),
    'stretch': (lambda e: stretch(0.9, 14.0, 45.0), 'side B stretched (rubbery creak)', -19.0, 'dot'),
    'trigger': (lambda e: tick(), 'trigger wave (bioelectric tick)', -18.0, 'dot'),
    'cellbeat': (lambda e: lp(thump(80, 45, 0.25, 0.4), 500), 'cells contract (microscope)', -17.0, 'dot'),
    'heartbeat': (lambda e: lubdub(), 'heartbeat lub-dub', -8.0, 'accent'),
    'whoosh_in': (lambda e: whoosh(0.55, 200, 1900), 'whoosh in', -19.0, 'tex'),
    'whoosh_out': (lambda e: whoosh(0.6, 1700, 220), 'whoosh out', -20.0, 'tex'),
    'whoosh_soft': (lambda e: whoosh(0.7, 250, 1100), 'soft camera move', -25.0, 'tex'),
    'xray': (lambda e: shimmer(0.7), 'body turns to glass', -24.0, 'dot'),
    'cut_lab': (lambda e: swish(0.14, 800, 3000), 'match cut (air)', -24.0, 'tex'),
    'cut_soft': (lambda e: swish(0.14, 500, 2000), 'cut (air)', -27.0, 'tex'),
    'click': (lambda e: click(), 'tweezers: the tail docks', -17.0, 'dot'),
    'night': (lambda e: flutter(), 'time-lapse: a night passes', -21.0, 'dot'),
    'pipette': (lambda e: plup(300, 0.14), 'pipette, morning medium change', -23.0, 'dot'),
    'cut_heart': (lambda e: S(lp(whoosh(0.5, 120, 600), 700), thump(55, 35, 0.6, 0.2)), 'cut to the living heart', -14.0, 'accent'),
    'match': (lambda e: S(swish(0.2, 300, 1500), 0.6 * thump(90, 50, 0.25, 0.4)), 'heart wall to fish muscle', -18.0, 'tex'),
}
for e in cj['events']:
    f, nm, lvl, bus = GEN[e['kind']]
    v = e.get('v', 1) or 1
    lead = 0.12 if e['kind'] in ('stroke', 'stroke_tank', 'whoosh_soft') else 0.0
    if e['kind'] in ('whoosh_in',):
        lead = 0.3
    place(f(e), e['t'] - lead, f"{nm} ({e.get('note') or e['kind']})", lvl + 20 * np.log10(v), bus)

# ---------------------------------------------------------------- ambience, cut with the picture
sets = cj['settings'] + [[DUR, 'end']]
def mask(name, ramp=0.03):
    m = np.zeros(N)
    for (a, s), (b, _) in zip(sets[:-1], sets[1:]):
        if s == name:
            m[int(a * SR):int(b * SR)] = 1
    k = max(1, int(ramp * SR))
    return np.convolve(np.concatenate([m[-k:], m, m[:k]]), np.ones(k) / k, 'same')[k:-k]
water = circ(lambda y: lp(y, 380, 3), noise(N)) * (0.7 + 0.3 * A.per(9)) + 0.4 * circ(lambda y: bp(y, 900, 2400, 2), noise(N)) * (0.5 + 0.5 * A.per(23)) ** 4
lab = circ(lambda y: lp(y, 2200, 2), noise(N)) * 0.5 + 0.25 * np.sin(2 * np.pi * 120 * t) + 0.12 * np.sin(2 * np.pi * 240 * t)
micro = 0.4 * np.sin(2 * np.pi * 98 * t) * (0.7 + 0.3 * A.per(31)) + 0.3 * circ(lambda y: bp(y, 2000, 6000, 2), noise(N))
heart = circ(lambda y: lp(y, 120, 3), noise(N)) * 2.0
for x, nm, lvl in [(water, 'water', -27.0), (lab, 'lab', -33.0), (micro, 'micro', -31.0), (heart, 'heart', -24.0)]:
    m = mask(nm)
    BUS['amb'] += rmsn(x) * db(VREF + lvl - 0.0) * m * 1.7
    LOG.append({'t': 0, 'dur': DUR, 'sfx': f'ambience: {nm}', 'level_re_voice_db': lvl, 'bus': 'amb'})

# ---------------------------------------------------------------- music: 12 bars fitted to the film, loop-seamless
BAR = DUR / 12
E8 = BAR / 8
CH = [('Dm', [50, 57, 62, 65]), ('Bb', [46, 53, 58, 62]), ('F', [41, 53, 57, 60]), ('C', [48, 55, 60, 64])]
ARP = {'Dm': [74, 77, 81, 76], 'Bb': [70, 74, 77, 74], 'F': [72, 77, 81, 79], 'C': [72, 76, 79, 76]}
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
music = np.zeros(N)
def add_wrap(x, at):
    i = int(round(at * SR)) % N
    j = min(N - i, len(x))
    music[i:i + j] += x[:j]
    if len(x) > j: music[:len(x) - j] += x[j:]
for b in range(12):
    name, notes = CH[(b // 2) % 4]
    # pad: each chord over 2 bars, slow attack and release, overlapping into the next
    if b % 2 == 0:
        d = 2 * BAR + 0.6
        u = tt(d)
        pad = sum(np.sin(2 * np.pi * hz(m) * u + k) + 0.3 * np.sin(4 * np.pi * hz(m) * u) for k, m in enumerate(notes))
        pad = lp(pad, 1400, 2) * fades(len(u), 0.6, 0.9)
        add_wrap(pad * 0.11, b * BAR)
    # sparse pluck: 8ths with gaps, marimba-ish (a sine and its 4th partial, quick decay)
    for k in range(8):
        if k in (3, 7) or (b % 4 == 3 and k > 4):
            continue
        m = ARP[name][k % 4] + (12 if k == 6 else 0)
        u = tt(0.5)
        pl = (np.sin(2 * np.pi * hz(m) * u) + 0.25 * np.sin(2 * np.pi * 4 * hz(m) * u) * np.exp(-u / 0.03)) * np.exp(-u / 0.16)
        add_wrap(pl * (0.16 if k % 2 == 0 else 0.11), b * BAR + k * E8)
# dynamics: thin under the demonstration (the effects carry it), a small lift into the final line, back for the loop
dyn = 1 - 0.45 * A.window(T['s6'], T['s8'], 0.4) + 0.35 * A.window(T['s13'], T['s14'], 0.6) - 0.2 * A.window(T['s11'], T['s12'], 0.3)
music *= dyn
BUS['music'] = rmsn(music) * db(VREF - 18.0)
LOG.append({'t': 0, 'dur': DUR, 'sfx': 'music bed (pad + pluck, 12 bars, loop-seamless)', 'level_re_voice_db': -18.0, 'bus': 'music'})

# ---------------------------------------------------------------- voice and master (the Eel Escape chain)
v, vsr = sf.read(os.path.join(EP, NARRATION))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = A.meter
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, comp_curve = compress(v0)
voice = vc * db(VREF - meter.integrated_loudness(vc))
env_b = smooth(np.abs(voice), 8.0)
env_h = smooth(np.abs(hp(voice, 3200, 4)), 16.0)
k_b = np.clip(env_b / np.percentile(env_b, 90) * 1.4, 0, 1)
k_h = np.clip(env_h / np.percentile(env_h, 97) * 1.3, 0, 1)
DUCK = {'amb': (0.3, 0.55), 'tex': (0.45, 0.8), 'dot': (0.3, 0.8), 'accent': (0.2, 0.6), 'music': (0.35, 0.7)}
def ducked(x, bus):
    d_b, d_h = DUCK[bus]
    lo = circ(lambda y: lp(y, 2400, 4), x)
    return (lo + (x - lo) * (1 - d_h * k_h)) * (1 - d_b * k_b)
DC = lambda x: circ(lambda y: hp(y, 25, 2), x)
fx = {b: DC(ducked(BUS[b], b)) for b in BUS}
lufs_st = lambda x: meter.integrated_loudness(np.stack([x, x], 1))
CEIL = -1.5
pre = voice + sum(fx.values())
g = db(-14.0 - lufs_st(pre))
for _ in range(4):
    mix, glim = tp_limit(pre * g, CEIL)
    err = -14.0 - lufs_st(mix)
    if abs(err) < 0.02: break
    g *= db(err)
mix, glim = tp_limit(pre * g, CEIL)
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_HeartFish_V1_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
outs = {'voice': voice * g * glim, 'sfx': sum(fx[b] for b in ('tex', 'dot', 'accent')) * g * glim, 'amb': fx['amb'] * g * glim, 'music': fx['music'] * g * glim}
for nm, x in outs.items():
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(np.concatenate([mix[-256:], mix, mix[:256]]), 4, 1))) + 1e-12)
def xlag(a, b):
    c = np.fft.irfft(np.fft.rfft(a) * np.conj(np.fft.rfft(b)), len(a)); k = int(np.argmax(c)); return k if k <= len(a) // 2 else k - len(a)
vl = lufs(outs['voice'])
res = {'name': NAME, 'duration_s': DUR, 'integrated_lufs_stereo': round(float(meter.integrated_loudness(mix2)), 2),
       'true_peak_dbtp_4x': round(float(tp), 2), 'limiter_max_gr_db': round(float(20 * np.log10(glim.min())), 2),
       'voice_lufs_mono': vl, 'effects_lufs_mono': lufs(outs['sfx']), 'ambience_lufs_mono': lufs(outs['amb']), 'music_lufs_mono': lufs(outs['music']),
       'effects_under_voice_db': round(vl - lufs(outs['sfx']), 2), 'music_under_voice_db': round(vl - lufs(outs['music']), 2),
       'lag_mix_vs_master_samples': xlag(mix, v), 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 6), 'events': len(LOG)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(sorted(LOG, key=lambda e: e['t']), open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
