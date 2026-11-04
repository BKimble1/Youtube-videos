#!/usr/bin/env python3
"""V4 effects, ambience and mix for "This Eel Escapes Through the Fish That Ate It" (the new shot sequence).

Everything is synthesised (no samples, no music). The narration master is used sample for sample (gain, the gentle V3
compressor, the circular true-peak limiter). Effects are placed from the picture's own timing (audio/cues_v4.json,
exported from the V4 shots by tools/v4/export_cues.ts). Restrained: the narration dominates; the three accents the brief
asks for are the GULP (S2, the mouth shutting), the change INTO THE X-RAY view (S3, the fish crossing the field edge)
and the RELEASE (S10, the head clearing the gill).

  space      each setting has its own air, cut with the picture: open water (a muffled wash, a soft current, faint
             bubbles) for the exterior shots; the research tank (a pump's soft bubbling, a faint mains hum) for S3;
             inside the fish (a dark close wash and a faint slow pulse) for S4–S6. The flashback (S2) is the open water,
             darker and narrower.
  gill       soft wet flutters following the predator's gill cover (exterior shots)
  flick      the opening tail flick (a small wet swish), and its reprise as the loop returns to it
  gulp       the suction gulp: an inrush, a low pop as the mouth shuts, the throat's swallow after
  X-ray      the field change: a soft electrical rise and a faint hum while the radiograph lasts
  carry      the tail carrying us in: a close, muffled whoosh into the stomach
  probe      the tail tip searching along the wall: soft wet rubs; the opening yields: a soft plup; through: a squelch
  slide      a muffled squeeze while the body slides up the throat and out of the gill
  pass       the body filling the foreground: a close, dark whoosh
  slip/poke  the slip between the gill arches; the tip breaking into open water (the hard cut outside)
  curl       a rubbery stretch as the curl tightens into the pull
  release    the water rush, a soft low pop and a bubble burst (the one clear accent)
  swim       soft strokes on the tail beats, reeds brushing past, the reed's close swish across the loop point

usage: python3 tools/v4/make_audio_v4.py [mix_name]   (default mix_v4)"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio_lib as A
from audio_lib import db, noise, lp, hp, bp, circ, smooth, rmsn, norm, per, fades, svf, impulses, kms, lmax, lufs, \
    bubble, reversed_whoosh, squelch, plup, poke_sound, stretch, rush_body, soft_pop, bubble_burst, stroke, compress, tp_limit

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v4'
NARRATION = 'audio/narration/FGW_Eel_Escape_narration_V1.wav'
cj = json.load(open(os.path.join(EP, 'audio/cues_v4.json')))
DUR = cj['DUR']
A.init(DUR, 2078)
SR, N, t = A.SR, A.N, A.t
rng = A.rng
T = cj['T']; BE = cj['beats']; T_REL = cj['T_REL']; XC = cj['XRAY_CHANGE_T']
WORDS = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))['words']
sig_rate = cj['signals']['rate']
def sig(name):
    x = np.asarray(cj['signals'][name], float)
    return np.interp(t, np.arange(len(x)) / sig_rate, x)
shot_ids = cj['signals']['shot']
def shot_mask(ids, ramp=0.012):
    """1 where one of the shots is on screen (cut with the picture, a few ms of ramp against clicks)"""
    m = np.array([1.0 if s in ids else 0.0 for s in shot_ids])
    x = np.interp(t, np.arange(len(m)) / sig_rate, m)
    x = (x > 0.5).astype(float)
    k = max(1, int(ramp * SR))
    return np.convolve(np.concatenate([x[-k:], x, x[:k]]), np.ones(k) / k, 'same')[k:-k]

VREF = -16.0
BUS = {k: np.zeros(N) for k in ('amb', 'tex', 'dot', 'accent')}
LOG = []
def place(x, at, name, lvl, bus='dot'):
    """add x at `at` s at `lvl` dB re the voice (its loudest 400 ms); a tail past the end wraps to the start"""
    g = VREF + lvl - lmax(x)
    i0 = int(round(at * SR)) % N
    idx = (np.arange(len(x)) + i0) % N
    BUS[bus][idx] += x * db(g)
    LOG.append({'t': round(at % DUR, 3), 'dur': round(len(x) / SR, 3), 'sfx': name, 'level_re_voice_db': lvl, 'bus': bus})
def layer(x, name, lvl, bus, how='mom', spans=None):
    lv = lufs(x) if how == 'int' else lmax(x)
    BUS[bus] += x * db(VREF + lvl - lv)
    LOG.append({'t': 0, 'dur': DUR, 'sfx': name, 'level_re_voice_db': lvl, 'bus': bus, 'spans': spans})
def env(a, b, ra=0.04, rb=0.08):
    return np.clip((t - a) / ra, 0, 1) * np.clip((b - t) / rb, 0, 1)

# ---------------------------------------------------------------- spaces (cut with the picture)
OUT = shot_mask(['open', 'poke', 'follows', 'head', 'release', 'swim', 'loop'])
FLASH = shot_mask(['gulp'])
TANK = shot_mask(['xray'])
IN = shot_mask(['stomach', 'throat'])
wash = rmsn(circ(lambda x: lp(hp(x, 28), 230, 4), noise(N)))
wash_dark = rmsn(circ(lambda x: lp(hp(x, 28), 120, 4), noise(N)))
cur = rmsn(circ(lambda x: bp(x, 240, 900), noise(N)))
m_wash = 0.82 + 0.18 * per(3, 0.7)
m_cur = (0.55 + 0.45 * (0.5 + 0.5 * per(8, 1.9))) * (0.78 + 0.22 * per(13, 0.4))
bub = np.zeros(N)
for k in range(int(round(DUR * 0.55))):
    at = rng.random() * DUR
    b = bubble(rng.uniform(230, 640), rng.uniform(0.014, 0.03), rng.uniform(0.3, 0.8)) * db(rng.uniform(-9, 0))
    idx = (np.arange(len(b)) + int(at * SR)) % N
    bub[idx] += b
bub = circ(lambda x: lp(x, 1700), bub)
open_water = wash * m_wash + db(-7) * cur * m_cur + 0.55 * bub
flash_water = rmsn(lp(open_water, 900)) * 0.8
# the tank: a pump's soft bubbling (a dense, brighter stream of tiny bubbles) and a faint mains hum
pump = np.zeros(N)
for k in range(int(DUR * 22)):
    at = rng.random() * DUR
    b = bubble(rng.uniform(600, 1600), rng.uniform(0.006, 0.014), 0.8) * db(rng.uniform(-14, -2))
    idx = (np.arange(len(b)) + int(at * SR)) % N
    pump[idx] += b
pump = circ(lambda x: lp(hp(x, 300), 3200), pump)
hum = rmsn(np.sin(2 * np.pi * round(60 * DUR) / DUR * t) + 0.35 * np.sin(2 * np.pi * round(180 * DUR) / DUR * t))
tank = 0.7 * wash * m_wash + 0.6 * rmsn(pump) + 0.08 * hum
# inside the fish: a dark close wash and a faint slow pulse (~1.15 Hz, a whole number of beats over the film)
nb = round(1.15 * DUR)
ph = (t * nb / DUR) % 1.0
pulse = np.exp(-ph / 0.05) * (1 - np.exp(-ph / 0.004)) + 0.6 * np.exp(-((ph - 0.16) % 1.0) / 0.05) * (1 - np.exp(-((ph - 0.16) % 1.0) / 0.004))
pulse_s = rmsn(circ(lambda x: lp(x, 70, 2), noise(N) * 0.2 + 1.0) * circ(lambda x: lp(x, 90, 2), pulse))
inside = 0.9 * wash_dark * m_wash + 0.35 * pulse_s
amb = open_water * OUT + flash_water * FLASH + tank * TANK + inside * IN
layer(amb, 'spaces: open water / flashback / tank / inside the fish', -18.0, 'amb', 'int')

# ---------------------------------------------------------------- gill cover flutters (exterior)
Gs = sig('gill')
vel = np.gradient(smooth(Gs, 12.0)) * SR
A_open = np.clip(vel / 2.5, 0, 1.5) ** 1.1
A_close = np.clip(-vel / 2.5, 0, 1.5) ** 1.1
g_open = rmsn(circ(lambda x: bp(x, 260, 1500), noise(N)))
g_close = rmsn(circ(lambda x: bp(x, 130, 700), noise(N)))
flap = (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(24 + 12 * np.clip(np.abs(vel) / 3, 0, 1)) / SR)) ** 2.2
gtex = (A_open * g_open + 0.8 * A_close * g_close) * (0.35 + 0.65 * flap)
layer(circ(lambda x: lp(x, 1600), gtex), 'gill cover flutter', -12.0, 'tex')

# ---------------------------------------------------------------- S1: the tail flick (and its reprise into the loop)
def swish(dur=0.26, f0=500, f1=1300, wet=0.5):
    n = int(dur * SR); u = np.arange(n) / n
    fc = f0 * (f1 / f0) ** np.sin(np.pi * u * 0.9)
    y = svf(noise(n), fc, 1.6) * np.sin(np.pi * u) ** 1.5
    b = np.zeros(n); bb = bubble(rng.uniform(380, 520), 0.02, 0.6); m = min(n - int(0.55 * n), len(bb)); b[int(0.55 * n):int(0.55 * n) + m] = bb[:m]
    return norm(lp(rmsn(y) + wet * 3 * b, 2400))
place(swish(), T['flick'] - 0.08, 'S1: the tail flicks across the cover', -15.0)
# ---------------------------------------------------------------- S2: the gulp (an inrush, the mouth shutting, the swallow)
def gulp_sound():
    dur = 0.95; n = int(dur * SR); tt = np.arange(n) / SR
    rush = svf(noise(n), 220 * (900 / 220) ** np.clip(tt / 0.42, 0, 1), 1.2) * np.clip(tt / 0.4, 0, 1) ** 2 * (tt < 0.44)
    shut = np.zeros(n); sp = soft_pop(0.3, 110, 42); i = int(0.44 * SR); shut[i:i + len(sp)] += sp[:n - i]
    swallow = np.zeros(n); sq = squelch(0.22, 420, 160, 3.0, 900); j = int(0.62 * SR); swallow[j:j + len(sq)] += sq[:n - j]
    return norm(lp(0.55 * rmsn(rush) * 0.3 + 1.0 * shut + 0.45 * swallow, 2600) * fades(n, 0.005, 0.08))
place(gulp_sound(), T['mouthShut'] - 0.44, 'S2: the GULP (inrush, the mouth shuts, the swallow)', -8.0, 'accent')
# ---------------------------------------------------------------- S3: the change into the X-ray view
def xray_change():
    dur = 1.1; n = int(dur * SR); tt = np.arange(n) / SR
    rise = np.clip(tt / 0.18, 0, 1) * np.exp(-np.clip(tt - 0.18, 0, None) / 0.35)
    air = rmsn(lp(bp(noise(n), 500, 9000), 3000, 1))
    whine = np.sin(2 * np.pi * np.cumsum(140 + 260 * np.clip(tt / 0.2, 0, 1)) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(420 + 600 * np.clip(tt / 0.2, 0, 1)) / SR)
    thunk = np.zeros(n); sp = soft_pop(0.25, 160, 70); thunk[:len(sp)] = sp
    return norm((0.7 * air + 0.35 * whine) * rise + 0.6 * thunk)
place(xray_change(), XC - 0.02, 'S3: into the X-ray view (the field edge)', -11.0, 'accent')
xb = env(XC + 0.3, T['stomach'] - 0.05, 0.3, 0.15)
layer(xb * rmsn(0.6 * hum + 0.4 * rmsn(circ(lambda x: bp(x, 2000, 7000), noise(N)))), 'S3: faint X-ray hum', -28.0, 'tex')
# ---------------------------------------------------------------- the carry into the stomach
def whoosh(dur=0.6, lo=180, hi=900, dark=1200):
    n = int(dur * SR); u = np.arange(n) / n
    fc = lo * (hi / lo) ** np.sin(np.pi * u)
    return norm(lp(svf(noise(n), fc, 1.0) * np.sin(np.pi * u) ** 1.4, dark))
place(whoosh(0.55, 150, 700, 1000), BE.get('carry', T['stomach'] - 0.3), 'S3>S4: the tail carries us in (muffled whoosh)', -14.0)
# ---------------------------------------------------------------- S4: probing, finding, through
for k, at in enumerate(BE.get('probeTouches', [7.6, 7.85, 8.05])):
    place(squelch(0.16, rng.uniform(700, 900), 300, 3.0, 1300), at, f'S4: the tip rubs the wall ({k + 1})', -19.0)
place(plup(230, 0.2, 1200), BE.get('found', T['found']), 'S4: the opening yields', -15.0)
place(squelch(0.32, 600, 180, 2.6, 1100), BE.get('through', 8.5), 'S4: through the opening', -15.0)
# ---------------------------------------------------------------- slides (inside: up the throat; outside: out of the gill)
def squeeze_tex(A_):
    sq = rmsn(circ(lambda x: bp(x, 150, 700), noise(N))) * (0.6 + 0.4 * (0.5 + 0.5 * per(37, 0.3)))
    return circ(lambda x: lp(x, 1100), sq * A_)
slide_in = env(T['slides'] - 0.2, T['bodyWipe'] - 0.05, 0.3, 0.2)
outV = sig('outV')
slide_out = np.clip(outV / 25, 0, 1) ** 0.8
layer(squeeze_tex(slide_in * 0.8 + slide_out), 'slides: up the throat, out of the gill', -20.0, 'tex')
place(whoosh(0.5, 120, 520, 800), BE.get('pass', T['bodyWipe']) - 0.2, 'S5>S6: the body fills the foreground', -13.0)
place(squelch(0.2, 900, 260, 3.4, 1600), BE.get('slip', 11.5), 'S6: the slip between the arches', -16.0)
place(poke_sound(), T['poke'] + 0.01, 'S7: the tip breaks into open water', -13.0)
# ---------------------------------------------------------------- S9/S10: the struggle, the curl tightening
for k, at in enumerate(np.arange(16.3, 20.2, 0.62) + rng.uniform(-0.08, 0.08, len(np.arange(16.3, 20.2, 0.62)))):
    place(stroke(0.2, rng.uniform(420, 600), 1.0), at, f'thrash {k + 1}', -24.0)
st = stretch(T_REL - T['tighten'], 14, 90)
place(st * np.linspace(0.5, 1, len(st)), T['tighten'], 'S10: the curl tightens (stretch)', -17.0)
# ---------------------------------------------------------------- S10: the RELEASE
place(rush_body(0.9), T_REL - 0.01, 'S10: RELEASE water rush', -6.0, 'accent')
place(soft_pop(), T_REL, 'S10: release low pop', -12.0, 'accent')
place(bubble_burst(0.7, 18), T_REL + 0.03, 'S10: release bubbles', -14.0, 'accent')
# ---------------------------------------------------------------- S11: strokes, reeds, the reed across the lens
for k, at in enumerate(np.arange(T_REL + 0.35, T['reed'], 1 / 4.2)):
    place(stroke(0.19, 560 + 80 * (k % 2), 1 if k % 2 else -1), at, f'swim stroke {k + 1}', -22.0 - 0.3 * k)
for k, at in enumerate(BE.get('reedPasses', [21.9, 22.7, 23.4, 24.0])):
    place(whoosh(0.32, 300, 1500, 2600), at - 0.14, f'reed brushes past {k + 1}', -21.0)
place(whoosh(0.7, 260, 1900, 3000), T['reed'] - 0.05, 'S12: the reed across the lens (into the loop)', -14.0)

# ---------------------------------------------------------------- voice and master (as V3)
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
DUCK = {'amb': (0.3, 0.55), 'tex': (0.45, 0.8), 'dot': (0.3, 0.8), 'accent': (0.2, 0.7)}
def ducked(x, bus):
    d_b, d_h = DUCK[bus]
    lo = circ(lambda y: lp(y, 2400, 4), x)
    return (lo + (x - lo) * (1 - d_h * k_h)) * (1 - d_b * k_b)
DC = lambda x: circ(lambda y: hp(y, 25, 2), x)
fx = {b: DC(ducked(BUS[b], b)) for b in BUS}
lufs_st = lambda x: meter.integrated_loudness(np.stack([x, x], 1))
CEIL = -1.6
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
sf.write(os.path.join(EP, f'audio/mix/FGW_Eel_Escape_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
voice_out = voice * g * glim
fx_ev = sum(fx[b] for b in ('tex', 'dot', 'accent')) * g * glim
amb_out = fx['amb'] * g * glim
for nm, x in [('voice', voice_out), ('sfx', fx_ev), ('amb', amb_out)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(np.concatenate([mix[-256:], mix, mix[:256]]), 4, 1))) + 1e-12)
def xlag(a, b):
    c = np.fft.irfft(np.fft.rfft(a) * np.conj(np.fft.rfft(b)), len(a)); k = int(np.argmax(c)); return k if k <= len(a) // 2 else k - len(a)
vl = lufs(voice_out)
res = {'name': NAME, 'duration_s': DUR, 'integrated_lufs_stereo': round(float(meter.integrated_loudness(mix2)), 2),
       'true_peak_dbtp_4x': round(float(tp), 2), 'limiter_max_gr_db': round(float(20 * np.log10(glim.min())), 2),
       'voice_lufs_mono': vl, 'effects_lufs_mono': lufs(fx_ev), 'ambience_lufs_mono': lufs(amb_out),
       'effects_under_voice_db': round(vl - lufs(fx_ev), 2), 'lag_mix_vs_master_samples': xlag(mix, v),
       'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 6), 'events': len(LOG)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(sorted(LOG, key=lambda e: e['t']), open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
for e in sorted(LOG, key=lambda e: e['t']):
    if e['dur'] < DUR: print(f"{e['t']:7.2f}  {e['sfx']:55s} {e['level_re_voice_db']:6.1f} dB re voice  [{e['bus']}]")
print(json.dumps(res, indent=1))
