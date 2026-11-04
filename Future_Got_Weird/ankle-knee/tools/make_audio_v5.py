#!/usr/bin/env python3
"""V5: effects, ambience and mix for the Ankle Knee Short. The narration is the V3 master (the approved take, sentence
gaps over 0.30 s tightened), used sample for sample (gain, a gentle compressor and a limiter only) and in front.
Everything else is synthesised here (no samples, no music), placed from the picture's own events (audio/cues_v5.json,
exported from v4/story4.ts and v4/kick4.ts by tools/export_cues_v4.ts):
  kick      a short, firm impact on frame 2 (contact), the ball rushing the lens and a low whoom as it passes (the
            wipe), the reveal's landings, the shin's swing on "working knee"
  middle    monitor tick, the diseased bone's low pulse and ring ping, cut-margin ticks; air into the illustration,
            cut lines, the separation, a chime for the kept foot; the half-turn's swish, a ping where it reconnects,
            the seat
  rehab     toes in the socket, hands on the rails, the bend, the rise, the step's swing and its footfall
  recovery  a stir as he wakes, fabric under the toe wiggle; on the field the cleat drags back as he gets up
  closing   the pass rolling on grass (shaped by its speed), each footfall of the approach, the plant, the swing into
            frame 0 (its contact lands on frame 2 when the film loops)
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio_v5.py [mix_name]"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
from scipy.ndimage import minimum_filter1d

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v5'
cj = json.load(open(os.path.join(EP, 'audio/cues_v5.json')))
DUR, T = cj['DUR'], cj['T']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2026)
LOG = []

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def place(buf, sig, at, name=None, gain_db=0.0):
    i = int(round(at * SR)); idx = (np.arange(len(sig)) + i) % N  # the film loops
    buf[idx] += sig * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
def win(a, b, fade=0.03):
    """1 inside [a, b) with short fades (loop-aware for a > b)"""
    w = np.zeros(N)
    ia, ib = int(a * SR), int(b * SR)
    if ia < ib: w[ia:ib] = 1
    else: w[ia:] = 1; w[:ib] = 1
    k = int(fade * SR)
    return np.convolve(np.concatenate([w[-k:], w, w[:k]]), np.ones(k) / k, 'same')[k:-k]

# ---------------- generators
def thump(dur, f0, f1, click=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (dur * 0.3)) + click * lp(noise(n), 900) * np.exp(-tt / 0.012))
def slap(dur=0.05, lo=500, hi=3800):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), lo, hi) * np.exp(-tt / 0.009))
def tick(dur=0.03, f=3600):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 2500) * np.exp(-tt / 0.0015) + 0.5 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def scuff(dur=0.09):
    n = int(dur * SR); tt = np.arange(n) / SR
    g = (rng.random(n) < 0.05).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.5 + 2.0 * g, 1400, 7000) * np.exp(-tt / (dur * 0.35)))
def sweep(dur, lo0, lo1, hi0, hi1, shape=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = noise(n); out = np.zeros(n); seg = 2048
    for s in range(0, n, seg):
        u = (s + seg / 2) / n
        lo = lo0 * (lo1 / lo0) ** u; hi = hi0 * (hi1 / hi0) ** u
        out[s:s + seg] = bp(x[max(0, s - 512):s + seg], lo, hi)[-len(out[s:s + seg]):]
    return norm(lp(out, 9000)) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** shape
def rustle(dur=0.4, lo=1500, hi=7000):
    n = int(dur * SR)
    g = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.3 + lp(g, 9000) * 2.0, lo, hi)) * env(n, dur * 0.3, dur * 0.5)
def knock(f=180, dur=0.25):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) + 0.3 * bp(noise(n), 300, 1500) * np.exp(-tt / 0.012))
def tone(f, dur, partials=((1, 1, 0.6), (2.0, 0.25, 0.4), (3.0, 0.1, 0.25))):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / (dur * d)) for k, a, d in partials)) * env(n, 0.01, dur * 0.4)
def chirp(f0, f1, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * tt / dur) ** 2

sfx = np.zeros(N)
CUTS = cj['CUTS']
def span(name):
    for k, (s0, nm) in enumerate(CUTS):
        if nm == name: return s0, (CUTS[k + 1][0] if k + 1 < len(CUTS) else DUR)
S = {nm: span(nm) for _, nm in CUTS}
S1 = S2 = cj['CONTACT']
def strike(at, gain=-13, name='ball strike'):
    place(sfx, thump(0.32, 150, 62, 0.35), at, name, gain)
    place(sfx, slap(0.05), at, None, gain - 4)
    place(sfx, tick(0.02, 2600), at + 0.002, None, gain - 14)
def cleat(at, name, gain=-24, pro=False):
    place(sfx, scuff(0.1), at - 0.01, name, gain)
    place(sfx, thump(0.12, 110, 70, 0.1), at, None, gain - 6)
    if pro: place(sfx, tick(0.02, 3400), at + 0.01, None, gain - 14)
# ---- the opening: contact on frame 2 (a short impact under the voice), the ball at the lens, the wipe
CT = cj['CONTACT']
strike(CT, -18, 'ball strike (contact, frame 2)')
place(sfx, sweep(0.18, 400, 900, 2500, 6000, 0.7), CT - 0.17, None, -31)  # the swing's last whip (runs over the loop seam)
place(sfx, sweep(0.42, 160, 420, 900, 3800, 0.6), CT + 0.03, 'the ball comes at the lens (rising whoosh)', -23)
place(sfx, sweep(0.26, 90, 160, 400, 1200, 1.0), cj['WIPE_T'] - 0.04, 'the ball passes the lens (low whoom, the wipe)', -27)
for L in cj['lands']:
    if L['t'] < cj['CUT_XRAY']:
        cleat(L['t'], f"reveal: {L['foot']} cleat lands", -27, L['foot'] == 'prosthetic')
place(sfx, rustle(0.3, 1800, 6000), T['ankle'] + 0.02, 'toes flex in the socket', -40)
for k, (a0, a1) in enumerate(cj['curl']):
    up = k % 2 == 0
    place(sfx, sweep(max(0.25, a1 - a0), 300, 700 if up else 600, 1500, 3500 if up else 3200, 1.0), a0, ('the prosthetic shin swings back (the knee bends)' if up else 'the shin swings back down') if k < 2 else ('a second, smaller bend' if up else None), -32 if k < 2 else -36)
place(sfx, tick(0.02, 2600), cj['curl'][0][1], 'the socket at full bend', -38)
# ---- X-ray: a hard cut in, the diseased bone, the ring, the cut margins
place(sfx, tick(0.03, 2200), cj['CUT_XRAY'] + 0.01, 'cut to the X-ray (monitor tick)', -31)
place(sfx, thump(0.8, 60, 48, 0.0) * np.sin(np.linspace(0, 5 * np.pi, int(0.8 * SR))) ** 2, T['bone'], 'diseased bone (low pulse)', -31)
place(sfx, tone(1046.5, 0.5), T['cancer'] + 0.15, 'the diseased section is ringed (soft ping)', -40)
place(sfx, tick(0.025, 3000), 4.76, 'cut margin (femur)', -35)
place(sfx, tick(0.025, 3300), 4.90, 'cut margin (tibia)', -35)
# ---- anatomy: the illustration, the middle separates, the foot is kept
place(sfx, sweep(0.35, 400, 900, 2500, 5000, 1.0), cj['CUT_ANAT'] - 0.05, 'X-ray to the surgical illustration (air)', -38)
place(sfx, tick(0.025, 3000), 5.40, 'the margins become cut faces', -34)
place(sfx, tick(0.025, 3300), 5.50, None, -34)
place(sfx, sweep(0.8, 250, 600, 1500, 3500, 1.0), 5.46, 'the middle section slides out (soft)', -32)
place(sfx, tone(880, 0.9) + 0.6 * tone(1318.5, 0.9), 6.86, 'the foot is kept (soft chime)', -37)
place(sfx, rustle(0.3, 1500, 5000), 7.38, 'the toes curl', -41)
# ---- the half-turn and the join, one shot: an airy swish shaped like the turn, a ping where it reconnects, the seat
n0, n1 = int((cj['CUT_TURN'] + 0.03) * SR), int((T['around'] + 0.12) * SR)
u = np.linspace(0, 1, n1 - n0)
air = norm(bp(noise(n1 - n0), 700, 5000)) * np.sin(np.pi * u) ** 1.2
sfx[n0:n1] += db(-30) * air
LOG.append({'t': round(cj['CUT_TURN'] + 0.03, 3), 'sfx': 'the half-turn (airy swish)', 'gain_db': -30})
place(sfx, tone(1318.5, 0.5), 9.47, 'where it reconnects (soft ping)', -41)
place(sfx, sweep(1.0, 200, 500, 1000, 2500, 1.0), 9.63, 'the segment rises into line', -36)
place(sfx, knock(240, 0.2), 10.67, 'it seats on the thigh (soft knock)', -28)
for k in range(3): place(sfx, tick(0.015, 5000), 10.72 + 0.07 * k, 'stitches' if k == 0 else None, -40)
# ---- rehab: toes flex in the socket; the bend; the rise; the step and its footfall
place(sfx, rustle(0.4, 1200, 5000), 12.0, 'his toes flick in the socket', -37)
place(sfx, knock(520, 0.12), cj['CUT_REHAB_B'] + 0.01, 'hands on the rails take his weight (the two-leg view)', -34)
place(sfx, rustle(0.6, 800, 3000), cj['BEND0'] + 0.1, 'the bend (socket and liner)', -35)
place(sfx, rustle(0.45, 900, 3500), cj['CUT_REHAB_B'], 'trainers and cloth as he lowers', -38)
place(sfx, rustle(0.4, 900, 3500), cj['RISE0'], 'he rises', -39)
place(sfx, rustle(0.25, 900, 3500), 16.18, 'the prosthetic heel lifts', -40)
place(sfx, sweep(0.45, 300, 700, 1200, 3000, 1.0), cj['STEP0'], 'the prosthetic leg swings through (the step)', -36)
place(sfx, thump(0.14, 120, 70, 0.15), cj['FOOTFALL'], 'the prosthetic trainer lands (footfall)', -27)
place(sfx, scuff(0.08), cj['FOOTFALL'] + 0.005, None, -33)
# ---- recovery: he wakes; the wiggle against the sheet; he notices
place(sfx, rustle(0.35, 900, 4500), T['woke'] + 0.05, 'he stirs as he wakes', -39)
place(sfx, rustle(0.5, 600, 3500), cj['WIGGLE0'], 'the toes wiggle against the sheet (fabric)', -29)
place(sfx, rustle(0.3, 500, 2500), cj['CUT_NOTICE'] + 0.1, 'he shifts on the pillow', -42)
# ---- the socket on the field; he gets up; the closing approach and plant; the swing (contact is frame 2 on replay)
place(sfx, rustle(0.3, 1800, 6000), 19.6, 'toes flex in the socket (field)', -39)
place(sfx, scuff(0.3), 19.87, 'the cleat drags back on the turf', -32)
# the closing payoff: the step and plant, the wind-up (the turned ankle bends in the socket), the swing, the strike, the
# ball rushing the lens, a low whoom as it fills it (the cut back to frame 0, whose own strike follows on frame 2)
TE = cj['TC_END']
for L in cj['lands']:
    if L['t'] >= cj['CUT_FIELD']:
        cleat(L['t'], f"cleat lands ({L['foot']})", -23, L['foot'] == 'prosthetic')
place(sfx, rustle(0.4, 800, 3000), cj['windup'][0], 'the wind-up: socket and liner as the turned ankle bends', -35)
place(sfx, sweep(cj['windup'][1] - cj['windup'][0], 250, 500, 1200, 2600, 1.0), cj['windup'][0], 'the prosthetic shin swings back and up', -33)
place(sfx, sweep(0.3, 300, 900, 1800, 5000, 0.8), cj['swing'], 'the leg swings into the ball', -28)
strike(TE, -24, 'ball strike (closing, on "kick")')
f0, f1 = cj['flight']
place(sfx, sweep(f1 - f0 + 0.1, 140, 420, 800, 4200, 0.4), f0 - 0.05, 'the ball comes at the lens (rising whoosh)', -28)
place(sfx, sweep(0.3, 80, 150, 350, 1100, 1.0), f1 - 0.12, 'the ball fills the lens (low whoom, into frame 0)', -29)

# ---- ambience beds: the pitch, the X-ray room, the plate, the rehab room, the recovery room
wind = circ(lambda x: lp(x, 500), noise(N)) * (0.75 + 0.25 * np.sin(2 * np.pi * t / DUR * 3))
leaves = circ(lambda x: bp(x, 2500, 7000), noise(N)) * (0.5 + 0.5 * np.sin(2 * np.pi * t / DUR * 7) ** 2)
field = 0.8 * norm(wind) + 0.12 * norm(leaves)
for k in range(10):
    at = rng.random() * DUR
    place(field, chirp(3200 + 800 * rng.random(), 4200 + 900 * rng.random(), 0.07) * 0.05, at)
room = circ(lambda x: lp(x, 260), noise(N)) * 0.7 + 0.18 * np.sin(2 * np.pi * 60 * t) + 0.06 * np.sin(2 * np.pi * 120 * t)
clean = circ(lambda x: bp(x, 150, 900), noise(N))
gym = circ(lambda x: bp(x, 200, 1500), noise(N))
w_field = win(0, cj['CUT_XRAY']) + win(cj['CUT_SOCK'], DUR - 1e-3)
amb = db(-22) * norm(field) * w_field + db(-31) * norm(room) * win(cj['CUT_XRAY'], cj['CUT_ANAT']) + db(-28) * norm(clean) * win(cj['CUT_ANAT'], cj['CUT_REHAB_A'])
amb += db(-31) * norm(gym) * win(cj['CUT_REHAB_A'], cj['CUT_WAKE']) + db(-29) * norm(room) * win(cj['CUT_WAKE'], cj['CUT_SOCK'])

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Ankle_Knee_narration_V3.wav'))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=3.0, att=0.004, rel=0.09):
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0; envl = np.empty(len(x)); ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]; envl[i] = e
    lev = 20 * np.log10(envl + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), float(gr.min())
def limit(x, ceil_db, look=0.004, rel=0.06):
    need = np.minimum(1.0, db(ceil_db) / (np.abs(x) + 1e-12))
    g = minimum_filter1d(need, size=int(look * SR) * 2 + 1)
    a = np.exp(-1 / (rel * SR)); out = np.empty_like(g); y = 1.0
    for i in range(len(g)):
        y = g[i] if g[i] < y else a * y + (1 - a) * g[i]; out[i] = y
    return x * np.minimum(out, minimum_filter1d(need, size=3))
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, grmin = compress(v0)
vc = limit(vc, -9.0)
vg = -16.0 - meter.integrated_loudness(vc)
voice = vc * db(vg)
venv = lp(np.abs(voice), 6); venv = venv / (venv.max() + 1e-9)
duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
sfx = sfx * db(8.0)
sfx_d = sfx * (1 - 0.3 * np.clip(venv * 3, 0, 1))
mix = voice + sfx_d + amb * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix = limit(mix * g, -1.6)
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Ankle_Knee_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
for nm, x in [('voice', voice * g), ('sfx', sfx_d * g), ('amb', amb * duck * g)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
def lufs_of(x):
    try: return round(meter.integrated_loudness(x), 2)
    except Exception: return None
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'voice_lufs_in_mix': lufs_of(voice * g),
       'sfx_lufs_in_mix': lufs_of(sfx_d * g), 'amb_lufs_in_mix': lufs_of(amb * duck * g), 'voice_max_gain_reduction_db': round(grmin, 2),
       'duration_s': DUR, 'effects': len(LOG), 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
