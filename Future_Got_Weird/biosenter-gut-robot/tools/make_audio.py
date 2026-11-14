#!/usr/bin/env python3
"""BIOSENTER sound: synthesised effects placed from the picture's own event times (audio/cues.json, exported from the
crawl schedule and the scene code by tools/export_cues.ts), an original music bed, and the channel master chain
(gentle voice compressor, voice-keyed ducking, circular true-peak limiter, -14 LUFS).

Everything is circular: effects that cross the end wrap to the start, filters run as if the film were periodic, and the
music is exactly 11 bars of 4/4 over the film length, so the end -> start loop has no seam.

usage: python3 tools/make_audio.py <mix_name>        (writes source/public/audio/<mix_name>.wav and audio/mix/...)
"""
import json, os, sys, hashlib
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_lib as A
from audio_lib import SR, db, lp, hp, bp, circ, smooth, norm, rmsn, svf, reson, impulses, compress, tp_limit, lufs
from scipy.signal import resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
CJ = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR = CJ['DUR']
A.init(DUR, seed=11)
N = A.N
t = A.t
rng = A.rng
noise = A.noise
SC = CJ['SCENES']
NARRATION = 'audio/narration/FGW_BIOSENTER_narration_V1.wav'

BUS = {k: np.zeros(N) for k in ('amb', 'tex', 'dot', 'accent', 'music')}
LOG = []

def place(x, at, name, lvl, bus='dot'):
    """add x at time `at` (s) with peak level lvl (dB re full scale before the master), wrapping round the loop"""
    x = norm(x) * db(lvl)
    i0 = int(round(at * SR)) % N
    n = len(x)
    end = i0 + n
    if end <= N:
        BUS[bus][i0:end] += x
    else:
        BUS[bus][i0:] += x[:N - i0]
        BUS[bus][:end - N] += x[N - i0:]
    LOG.append({'t': round(at, 3), 'sfx': name, 'level_db': lvl, 'bus': bus, 'dur': round(n / SR, 3)})

def env_lin(n, a, r):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] *= np.linspace(0, 1, na) ** 1.5
    e[n - nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e

def tt(dur):
    return np.arange(int(dur * SR)) / SR

# ---------------------------------------------------------------- the robot
def inflate(dur, big=False):
    """pneumatic inflation: rising air flow through the line, the balloon skin stretching (a soft rubbery creak)"""
    n = int(dur * SR); u = np.linspace(0, 1, n)
    air = svf(noise(n), 420 + 1000 * u ** 0.7, 1.4) * np.sin(np.pi * np.clip(u * 1.05, 0, 1)) ** 0.7
    rate = 26 + 70 * u ** 1.3
    creak = svf(impulses(rate, 0.0015), 240 + 140 * u, 9.0) + 0.5 * svf(impulses(rate * 1.01, 0.0015), 520 + 200 * u, 7.0)
    creak = lp(creak, 1600) * np.sin(np.pi * u) ** 0.5
    body = np.sin(2 * np.pi * np.cumsum(70 + 40 * u) / SR) * u ** 2 * (1 - u) * 4
    y = 0.55 * rmsn(air) + (0.45 if big else 0.3) * rmsn(creak) + 0.35 * rmsn(body)
    return y * env_lin(n, 0.03, 0.08)

def deflate(dur):
    n = int(dur * SR); u = np.linspace(0, 1, n)
    hiss = lp(hp(noise(n), 1500), 7000) * np.exp(-u * 3.2) * (1 - np.exp(-u * 60))
    low = lp(noise(n), 260) * np.exp(-u * 4)
    return rmsn(hiss) * 0.7 + rmsn(low) * 0.35

def pop_cluster(count=14, spread=0.075, bright=1.0, thump=0.45):
    """the kirigami scales buckling out: a quick ripple of tiny crisp clicks and a soft thump"""
    out = np.zeros(int(0.32 * SR))
    for k in range(count):
        t0 = spread * (k / count) ** 0.85 + 0.004 * rng.random()
        f = (2300 + 3800 * rng.random()) * bright
        x = tt(0.012)
        c = np.sin(2 * np.pi * f * x) * np.exp(-x / 0.0022) * (1 - np.exp(-x / 0.00025))
        c += 0.5 * np.sin(2 * np.pi * f * 1.51 * x) * np.exp(-x / 0.0014)
        i = int(t0 * SR)
        out[i:i + len(c)] += c * (0.55 + 0.45 * rng.random())
    x = tt(0.22)
    th = np.sin(2 * np.pi * np.cumsum(150 * np.exp(-x / 0.05) + 55) / SR) * np.exp(-x / 0.06) * (1 - np.exp(-x / 0.002))
    out[:len(th)] += th * thump * np.max(np.abs(out)) / (np.max(np.abs(th)) + 1e-9) * 1.2
    return out

def extend(dur):
    """the four chambers pressurising: a soft pneumatic push with a faint rising servo tone"""
    n = int(dur * SR); u = np.linspace(0, 1, n)
    flow = lp(svf(noise(n), 300 + 500 * u, 0.9), 2200)
    f = 150 + 70 * u
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    y = 0.7 * rmsn(flow) + 0.18 * rmsn(tone)
    return y * np.sin(np.pi * u) ** 0.6 * env_lin(n, 0.05, 0.1)

def slide(dur):
    """the tail drawn forward over wet mucosa: a damp sweep and a few friction grains"""
    n = int(dur * SR); u = np.linspace(0, 1, n)
    wet = svf(noise(n), 1100 - 700 * u, 3.0) * np.sin(np.pi * u) ** 1.2
    grains = bp(impulses(30 + 40 * np.sin(np.pi * u), 0.001), 700, 2600) * np.sin(np.pi * u)
    return 0.8 * rmsn(wet) + 0.3 * rmsn(grains)

# levels by shot: the macro is close, so its sounds are closer and brighter
SCN_LVL = {'S1': 0.0, 'S2': 4.0, 'S3': -1.5, 'S7': 0.0}
for p in CJ['phases']:
    d = p['t1'] - p['t0']
    L = SCN_LVL[p['scene']]
    if p['scene'] == 'S3' and p['t0'] > 11.5:
        L -= 10  # the zoom-out: far away now
    if p['ph'] in ('TA', 'HA'):
        place(inflate(max(0.3, d), big=p['scene'] == 'S2'), p['t0'], f"inflate {'tail' if p['ph'] == 'TA' else 'head'} ({p['scene']})", -21 + L, 'dot')
    elif p['ph'] in ('TR', 'HR'):
        place(deflate(max(0.3, d) + 0.15), p['t0'], f"release {'tail' if p['ph'] == 'TR' else 'head'} ({p['scene']})", -27 + L, 'dot')
    elif p['ph'] == 'EX':
        place(extend(d), p['t0'], f"extend ({p['scene']})", -25 + L, 'tex')
    elif p['ph'] == 'CO':
        place(slide(d), p['t0'], f"contract slide ({p['scene']})", -25 + L, 'tex')
for p in CJ['pops']:
    L = SCN_LVL[p['scene']]
    if p['scene'] == 'S3' and p['t'] > 11.5:
        L -= 10
    macro = p['scene'] == 'S2'
    place(pop_cluster(count=22 if macro else 14, spread=0.09 if macro else 0.07, bright=1.15 if macro else 1.0, thump=0.6 if macro else 0.45),
          p['t'] - 0.01, f"kirigami scales pop ({p['which']}, {p['scene']})", (-12 if macro else -18) + (0 if macro else L), 'accent' if macro else 'dot')

# ---------------------------------------------------------------- transitions and the pig diagram
def whoosh(dur, f0, f1, q=1.2):
    n = int(dur * SR); u = np.linspace(0, 1, n)
    y = svf(noise(n), f0 * (f1 / f0) ** u, q)
    return y * np.sin(np.pi * u) ** 1.4

PG = CJ['pig']
place(whoosh(PG['zoom1'] - PG['zoom0'] + 0.3, 2600, 260), PG['zoom0'] - 0.05, 'zoom-out whoosh (out of the body)', -24, 'tex')
def ui_tick(f=1900):
    x = tt(0.06)
    return (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * 2 * f * x)) * np.exp(-x / 0.012) * (1 - np.exp(-x / 0.0008))
for k, tk in enumerate(PG['ticks']):
    place(ui_tick(1700 + 90 * k), tk, f'foot tick {k + 1}', -24 + 0.6 * k, 'dot')
# the travel: a soft rising progress tone
d = PG['travel1'] - PG['travel0']
x = tt(d); u = x / d
prog = (np.sin(2 * np.pi * np.cumsum(330 + 220 * u ** 1.2) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(330 + 220 * u ** 1.2) / SR)) * np.sin(np.pi * np.clip(u * 1.1, 0, 1)) ** 0.8
place(prog, PG['travel0'], 'travel progress tone', -31, 'tex')
# "6+ FEET": a low soft impact and a shimmer
x = tt(1.2)
imp = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-x / 0.08) + 42) / SR) * np.exp(-x / 0.22) * (1 - np.exp(-x / 0.003))
shim = sum(np.sin(2 * np.pi * f * x) * np.exp(-x / 0.45) / (k + 1) for k, f in enumerate([1174.7, 1760.0, 2349.3, 2637.0]))
place(rmsn(imp) + 0.35 * rmsn(shim) * (1 - np.exp(-x / 0.01)), PG['feet'] - 0.01, '6+ FEET impact and shimmer', -15, 'accent')
# the tag
place(ui_tick(2400) * 0.7, PG['pig'] - 0.1, 'study tag appears', -30, 'dot')

# ---------------------------------------------------------------- tools
TL = CJ['tools']
def metal_tick(scale=1.0):
    x = tt(0.08)
    y = sum(np.sin(2 * np.pi * f * scale * x) * np.exp(-x / dcy) for f, dcy in [(3150, 0.02), (4710, 0.012), (6920, 0.008), (9300, 0.005)])
    return y * (1 - np.exp(-x / 0.0004))
def cable(dur, rev=False):
    n = int(dur * SR); u = np.linspace(0, 1, n)
    y = bp(noise(n), 1400, 5200) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * u))) * np.sin(np.pi * u) ** 0.8
    y += 0.5 * bp(impulses(np.full(n, 55.0), 0.0008), 1500, 5000) * np.sin(np.pi * u)
    return y[::-1] if rev else y
place(cable(TL['tissue'] - TL['in']), TL['in'] + 0.02, 'forceps out of the channel', -27, 'tex')
place(metal_tick(), TL['it'] + 0.15, 'forceps jaws open', -24, 'dot')
bite = np.concatenate([metal_tick(1.15), np.zeros(int(0.035 * SR)), metal_tick(0.9)])
bite[:int(0.2 * SR)] += 0.0 if len(bite) < int(0.2 * SR) else 0.0
place(bite, TL['tissue'] + 0.02, 'forceps bite (snip)', -19, 'accent')
x = tt(0.18); u = x / 0.18
place(svf(noise(len(x)), 900 - 500 * u, 3.0) * np.sin(np.pi * u), TL['tissue'] + 0.06, 'tiny wet tug of the sample', -29, 'dot')
place(cable(0.55, rev=True), TL['samples'] - 0.25, 'forceps retract with the sample', -28, 'tex')
place(cable(0.4), TL['samples'] + 0.32, 'needle out of the channel', -29, 'tex')
x = tt(0.9)
ting = sum(np.sin(2 * np.pi * f * x) * np.exp(-x / 0.25) / (k + 1) for k, f in enumerate([5200, 7900, 10400]))
place(ting * (1 - np.exp(-x / 0.001)), TL['deliver'] + 0.1, 'needle tip ting', -31, 'dot')
x = tt(0.9); u = x / 0.9
blob = A.plup(240, 0.22, 1300) if hasattr(A, 'plup') else np.zeros(1)
fluid = lp(svf(noise(len(x)), 500 + 300 * u, 1.5), 1800) * np.sin(np.pi * u) ** 0.7
place(fluid, TL['liquid'] - 0.04, 'dye released (soft fluid)', -25, 'tex')
place(blob, TL['liquid'] - 0.02, 'dye bloop', -22, 'dot')

# ---------------------------------------------------------------- the lab
LB = CJ['lab']
x = tt(0.3)
beep = (np.sin(2 * np.pi * 1320 * x) * (x < 0.08) + np.sin(2 * np.pi * 1760 * x) * (x > 0.12) * (x < 0.2)) * (1 - np.exp(-x / 0.003))
place(beep * env_lin(len(x), 0.002, 0.02), SC['s6'] + 0.08, 'controller beep', -30, 'dot')
place(extend(LB['extend1'] - LB['extend0']), LB['extend0'], 'extend (lab)', -26, 'tex')
place(inflate(0.5), LB['inflate0'], 'inflate head (lab)', -24, 'dot')
place(pop_cluster(12, 0.06, 1.05, 0.35), LB['pop'], 'kirigami scales pop (lab)', -21, 'dot')

# ---------------------------------------------------------------- ambience by place (cut with the picture)
def mask(spans, ramp=0.015):
    m = np.zeros(N)
    for a, b in spans:
        m = np.maximum(m, A.window(a, b, ramp))
    return m
gut_spans = [(0, SC['s4'] + 0.9), (SC['s5'], SC['s6']), (SC['s7'], DUR)]
gutm = mask(gut_spans) ; gutm[:int(0.02 * SR)] = 1; gutm[-int(0.02 * SR):] = 1
# the zoom-out fades the gut ambience as we leave the body
gutm *= 1 - A.ssn(t, SC['s4'] + 0.1, SC['s4'] + 1.2) * (t < SC['s5'])
rumble = circ(lambda y: lp(y, 140, 3), noise(N)) * (1 + 0.35 * A.per(5) + 0.2 * A.per(13, 1.0))
wet = circ(lambda y: bp(y, 300, 1100, 2), noise(N)) * (0.5 + 0.5 * smooth(np.abs(noise(N)), 0.7))
gut = rmsn(rumble) + 0.25 * rmsn(wet)
for tg in (2.9, 9.8, 18.0, 24.2):
    g = np.zeros(int(0.5 * SR))
    for k in range(5):
        b = A.bubble(180 + 160 * rng.random(), 0.03, 0.3)
        i = int((0.06 * k + 0.03 * rng.random()) * SR)
        g[i:i + len(b)] += b * (0.5 + 0.5 * rng.random())
    i0 = int(tg * SR)
    gut[i0:i0 + len(g)] += lp(g, 900) * 3.0
BUS['amb'] += gut * gutm * db(-33)
pigm = mask([(SC['s4'] + 0.6, SC['s5'])])
air = circ(lambda y: hp(lp(y, 6000), 2500), noise(N))
BUS['amb'] += rmsn(air) * pigm * db(-46)
labm = mask([(SC['s6'], SC['s7'])])
room = circ(lambda y: lp(y, 2600, 2), noise(N)) + 0.4 * np.sin(2 * np.pi * 120 * t) * 0.05
BUS['amb'] += rmsn(room) * labm * db(-41)

# ---------------------------------------------------------------- music: 11 bars of 4/4 over the film (a seamless loop)
BEATS = 44
BEAT = DUR / BEATS
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
# D minor: Dm9 Dm9 Bbmaj7 Bbmaj7 Gm9 Gm9 Asus4 A Dm9 Bbmaj7 Asus4 -> (loop) Dm9
CH = {'Dm9': [50, 53, 57, 60, 64], 'Bbmaj7': [46, 50, 53, 57], 'Gm9': [43, 46, 50, 53, 57], 'Asus4': [45, 50, 52, 57], 'A': [45, 49, 52, 57]}
ROOT = {'Dm9': 38, 'Bbmaj7': 34, 'Gm9': 31, 'Asus4': 33, 'A': 33}
BARS = ['Dm9', 'Dm9', 'Bbmaj7', 'Bbmaj7', 'Gm9', 'Gm9', 'Asus4', 'A', 'Dm9', 'Bbmaj7', 'Asus4']
mus_pad = np.zeros(N); mus_bass = np.zeros(N); mus_arp = np.zeros(N)
def add_wrap(buf, x, i0):
    i0 %= N
    e = i0 + len(x)
    if e <= N: buf[i0:e] += x
    else:
        buf[i0:] += x[:N - i0]; buf[:e - N] += x[N - i0:]
bar_len = 4 * BEAT
for b, ch in enumerate(BARS):
    # pad: detuned soft saws (additive, band-limited), overlapping bars by a short crossfade
    d = bar_len + 0.6
    x = tt(d)
    e = env_lin(len(x), 0.35, 0.6)
    y = np.zeros(len(x))
    for m in CH[ch]:
        for det in (-0.07, 0.0, 0.07):
            f = hz(m + det)
            for k in range(1, 9):
                y += np.sin(2 * np.pi * f * k * x + rng.random() * 6.28) / k ** 1.25
    add_wrap(mus_pad, y * e, int((b * bar_len - 0.3) * SR))
    # bass: a pulse on every eighth, accented on the beat
    for q in range(8):
        x = tt(BEAT * 0.5)
        f = hz(ROOT[ch])
        acc = 1.0 if q % 2 == 0 else 0.55
        pulse = (np.sin(2 * np.pi * f * x) + 0.45 * np.sin(4 * np.pi * f * x) + 0.2 * np.sin(6 * np.pi * f * x)) * np.exp(-x / 0.12) * (1 - np.exp(-x / 0.004))
        add_wrap(mus_bass, pulse * acc, int((b * bar_len + q * BEAT * 0.5) * SR))
    # arp: sparse soft plucks on chord tones, two octaves up
    pat = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0]
    tones = CH[ch]
    for q, on in enumerate(pat):
        if not on: continue
        m = tones[(q * 3 + b) % len(tones)] + 24
        x = tt(0.5)
        f = hz(m)
        pl = (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * 2 * f * x) + 0.1 * np.sin(2 * np.pi * 3.01 * f * x)) * np.exp(-x / 0.16) * (1 - np.exp(-x / 0.002))
        add_wrap(mus_arp, pl, int((b * bar_len + q * BEAT / 4) * SR))
mus_pad = circ(lambda y: lp(y, 1100, 2), mus_pad)
mus_arp = circ(lambda y: lp(y, 3800, 2), mus_arp)
# a slow filter swell on the pad toward the pig reveal and the closing line (periodic, so it loops)
swell = 0.8 + 0.2 * A.per(1, -1.2)
music = rmsn(mus_pad) * 0.55 * swell + rmsn(mus_bass) * 0.75 + rmsn(mus_arp) * 0.32
BUS['music'] += music * db(-27)

# ---------------------------------------------------------------- voice and master
v, vsr = sf.read(os.path.join(EP, NARRATION))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = A.meter
VREF = -16.0
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, comp_curve = compress(v0)
voice = vc * db(VREF - meter.integrated_loudness(vc))
env_b = smooth(np.abs(voice), 8.0)
env_h = smooth(np.abs(hp(voice, 3200, 4)), 16.0)
k_b = np.clip(env_b / np.percentile(env_b, 90) * 1.4, 0, 1)
k_h = np.clip(env_h / np.percentile(env_h, 97) * 1.3, 0, 1)
DUCK = {'amb': (0.3, 0.55), 'tex': (0.4, 0.75), 'dot': (0.25, 0.7), 'accent': (0.15, 0.6), 'music': (0.45, 0.7)}
def ducked(x, bus):
    d_b, d_h = DUCK[bus]
    lo = circ(lambda y: lp(y, 2400, 4), x)
    return (lo + (x - lo) * (1 - d_h * k_h)) * (1 - d_b * k_b)
DC = lambda x: circ(lambda y: hp(y, 25, 2), x)
FXG = {'amb': 0.0, 'tex': 3.0, 'dot': 3.0, 'accent': 3.0, 'music': 0.0}
fx = {b: DC(ducked(BUS[b], b)) * db(FXG[b]) for b in BUS}
lufs_st = lambda x: meter.integrated_loudness(np.stack([x, x], 1))
CEIL = -1.6
pre = voice + sum(fx.values())
g = db(-14.0 - lufs_st(pre))
for _ in range(5):
    mix, glim = tp_limit(pre * g, CEIL)
    err = -14.0 - lufs_st(mix)
    if abs(err) < 0.02: break
    g *= db(err)
mix, glim = tp_limit(pre * g, CEIL)
glim_at = [round(float(i / SR), 2) for i in np.argsort(glim)[:1]] + [round(float(x), 2) for x in [20 * np.log10(np.percentile(glim, 1))]]
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_BIOSENTER_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
voice_out = voice * g * glim
stems = {'voice': voice_out, 'sfx': sum(fx[b] for b in ('tex', 'dot', 'accent')) * g * glim, 'amb': fx['amb'] * g * glim, 'music': fx['music'] * g * glim}
for nm, x in stems.items():
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(np.concatenate([mix[-256:], mix, mix[:256]]), 4, 1))) + 1e-12)
vl = lufs(voice_out)
res = {'name': NAME, 'duration_s': DUR, 'integrated_lufs_stereo': round(float(meter.integrated_loudness(mix2)), 2),
       'true_peak_dbtp_4x': round(float(tp), 2), 'limiter_max_gr_db': round(float(20 * np.log10(glim.min())), 2),
       'voice_lufs_mono': vl, 'effects_lufs_mono': lufs(stems['sfx']), 'ambience_lufs_mono': lufs(stems['amb']), 'music_lufs_mono': lufs(stems['music']),
       'music_under_voice_db': round(vl - lufs(stems['music']), 2), 'effects_under_voice_db': round(vl - lufs(stems['sfx']), 2),
       'limiter_min_at_s_and_p1_db': glim_at, 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 6), 'events': len(LOG),
       'sha256': hashlib.sha256(open(os.path.join(EP, f'source/public/audio/{NAME}.wav'), 'rb').read()).hexdigest()}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(sorted(LOG, key=lambda e: e['t']), open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
for e in sorted(LOG, key=lambda e: e['t']):
    print(f"{e['t']:7.2f}  {e['sfx']:45s} {e['level_db']:6.1f} dB  [{e['bus']}]")
print(json.dumps(res, indent=1))
