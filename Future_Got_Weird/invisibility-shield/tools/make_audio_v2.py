#!/usr/bin/env python3
"""V2 score, effects and mix for FGW "This Shield Can Make You Disappear." The narration is the approved V1 recording,
read unchanged (sample-for-sample) and laid at 0 s, so picture sync is the V1 word timeline. Everything else is
synthesised here (no samples, no paid generation, no third-party music) and sits under the voice:
  - a restrained suspense bed (low minor pad, soft pulse that tightens as the guard closes in, a quiet plucked figure
    in the lens/section passage), loop-continuous like V1;
  - effects placed from the picture's own timeline (tools/export_cues_v2.ts -> audio/cues_v2.json): the guard's boot
    steps on his heel strikes and her quick steps on hers, levelled by the camera's distance to each; torch sweeps;
    the shield swing, grip settle, grip adjust, lowering and set-aside; one optical shimmer as she vanishes in his view
    and a softer one as her outline melts; the push onto the lenses, the section's fold and the two light-path sweeps;
    the floating hand's accent and finger flutter; his freeze and flinch; the reveal's reaction accent; the dash.
Inputs : audio/narration/FGW_Invisibility_Shield_narration_final.wav, audio/cues_v2.json
Outputs: source/public/audio/mix_v2.wav, audio/mix/FGW_Invisibility_Shield_V2_mix.wav, audio/mix/stems_v2/*.wav,
         audio/mix/mix_measure_v2.json, audio/sfx_cues_v2.json"""
import json, math, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v2.json')))
DUR, SHOT, WORDS, F = cj['DUR'], cj['SHOT'], cj['WORDS'], cj['frames']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(47)
w = lambda i: WORDS[i]['start']
we = lambda i: WORDS[i]['end']
ft = np.array([f['t'] for f in F])

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR
def db(x): return 10 ** (x / 20)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    np.add.at(buf, idx % N, sig)
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
def at_frame(key, tt): return float(np.interp(tt % DUR, ft, [f[key] for f in F]))

# ---------------- voice (unchanged) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Invisibility_Shield_narration_final.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- music bed (loop-continuous) ----------------
section = win(SHOT['s6'], SHOT['s7'], 0.4, 0.5)
close = win(SHOT['s9'], SHOT['s14'], 0.8, 0.3)  # the guard right at the panel
def pad(freqs):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.72 + 0.28 * np.sin(2 * np.pi * loopf(0.11 + 0.035 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * loopf(f) * t)
    return out
low = circ(lambda x: lp(x, 520), pad([(73.42, 0.5), (110.0, 0.3), (146.83, 0.16), (174.61, 0.1)]))  # D minor, low
beats = int(round(DUR / 0.62)); bpd = DUR / beats
pulse = np.zeros(N)
for k in range(beats):
    n = int(0.28 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 50 * tt) * np.exp(-tt / 0.075)
    place(pulse, s * (0.75 if k % 2 == 0 else 0.42), k * bpd)
notes = [587.33, 698.46, 880.0, 698.46, 783.99, 659.26]  # D5 F5 A5 F5 G5 E5
steps = int(round(DUR / 0.31)); sp = DUR / steps
pluck = np.zeros(N)
for k in range(steps):
    f = loopf(notes[k % len(notes)]); n = int(0.5 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.1) * env(n, 0.004, 0.05)
    place(pluck, s * (0.55 + 0.45 * (k % 4 == 0)), k * sp)
X = int(1.0 * SR)
nz = bp(rng.standard_normal(N + X), 2500, 8000)
nz[:X] = nz[:X] * np.linspace(0, 1, X) + nz[N:N + X] * np.linspace(1, 0, X)
air = nz[:N] * 0.04
hand = win(we(64) - 0.05, we(75) + 0.05, 0.3, 0.4)
music = low * (0.9 + 0.2 * hand) + pulse * 0.5 * (1 + 0.35 * close - 0.45 * hand) + pluck * (0.06 + 0.10 * section + 0.05 * hand) + air * section
music *= 1 + 0.2 * win(w(81), DUR, 0.3, 0.01)

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db):
    place(sfx, sig * db(gain_db), at); log.append({'name': name, 'at': round(at % DUR, 3), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1)})
def soft_air(d, lo, hi, rise=True):
    n = int(d * SR); tt = np.linspace(0, 1, n); x = rng.standard_normal(n); out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]; fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return lp(out, hi * 1.2) * np.sin(np.pi * tt) ** 1.6
def thud(f=90, d=0.25, nzk=0.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) + nzk * lp(rng.standard_normal(n), 500) * np.exp(-tt / 0.02)
def flex(d=0.35):
    n = int(d * SR); tt = np.arange(n) / SR
    wob = np.sin(2 * np.pi * 9 * tt)
    return (bp(rng.standard_normal(n), 300, 1400) * (0.6 + 0.4 * wob) + 0.25 * np.sin(2 * np.pi * (180 + 40 * wob) * tt)) * env(n, 0.04, 0.2)
def shimmer(d=1.1, f=1567.98):
    n = int(d * SR); tt = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * tt + 0.3 * np.sin(2 * np.pi * 5 * tt)) for m, a in [(1, 1), (1.5, 0.4), (2.0, 0.25)])
    return s * np.exp(-tt / 0.45) * env(n, 0.06, 0.3)
def tick(f=3200, d=0.05):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.008)
def fold(d=0.3):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), 900, 5000) * np.exp(-tt * 9) + 0.5 * thud(140, d, 0.1)[:n]
def sweep(f0, f1, d):
    n = int(d * SR); ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / SR
    return (np.sin(ph) + 0.2 * np.sin(2 * ph)) * env(n, 0.15, 0.35)
def pop(d=0.18):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (520 - 260 * tt / d) * tt) * np.exp(-tt / 0.035) + 0.3 * bp(rng.standard_normal(n), 1500, 6000) * np.exp(-tt / 0.01)
def boot(d=0.22):
    # a rubber-soled work boot on a hard lab floor: heel knock, then a short sole scuff
    n = int(d * SR); tt = np.arange(n) / SR
    knock = np.sin(2 * np.pi * (115 + 30 * rng.random()) * tt) * np.exp(-tt / 0.022)
    sc = bp(rng.standard_normal(n), 700, 3800) * np.exp(-np.maximum(0, tt - 0.03) / 0.035) * (tt > 0.02)
    return knock + 0.35 * lp(rng.standard_normal(n), 900) * np.exp(-tt / 0.012) + 0.22 * sc
def sneaker(d=0.12):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.6 * np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / 0.012) + 0.4 * bp(rng.standard_normal(n), 1500, 6000) * np.exp(-tt / 0.02)
def creak(d=0.3):
    n = int(d * SR); tt = np.arange(n) / SR
    f = 420 + 120 * np.sin(2 * np.pi * 3 * tt)
    return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + 0.3 * rng.standard_normal(n), 400, 2200) * env(n, 0.03, 0.12)
def hit(d=1.2):
    # the reaction accent: a soft low impact with a short bright edge, no big trailer boom
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 55 * tt) * np.exp(-tt / 0.28) + 0.5 * np.sin(2 * np.pi * 82.4 * tt) * np.exp(-tt / 0.18)
            + 0.25 * bp(rng.standard_normal(n), 2000, 7000) * np.exp(-tt / 0.03))
def lvl(dist, ref=1.5, lo=-10.0, hi=4.0): return float(np.clip(-20 * math.log10(max(0.2, dist) / ref), lo, hi))

# heel strikes from the gait phase (foot plants at phase pi/2 + k*pi; see Person.tsx)
def strikes(walk, amt, thr=0.2):
    out = []
    for a, b in zip(F, F[1:]):
        k = math.ceil((a[walk] - math.pi / 2) / math.pi)
        x = math.pi / 2 + math.pi * k
        if a[walk] < x <= b[walk] and b[amt] > thr:
            out.append((a['t'] + (b['t'] - a['t']) * (x - a[walk]) / (b[walk] - a[walk]), b[amt]))
    return out
for k, (ts, amt) in enumerate(strikes('gWalk', 'gAmt')):
    add(f'guard step {k + 1}', boot() * (0.5 + 0.5 * amt), ts, -27 + lvl(at_frame('gD', ts)))
for k, (ts, amt) in enumerate(strikes('wWalk', 'wAmt', 0.3)):
    add(f'her step {k + 1}', sneaker(), ts, -29 + lvl(at_frame('wD', ts)))
# torch sweeps: one soft swish per fast sweep (peaks of the aim's speed, merged within 0.4 s)
tv = np.array([f['torch'] for f in F]); pk = []
for i in range(1, len(F) - 1):
    if tv[i] >= tv[i - 1] and tv[i] > tv[i + 1] and tv[i] > 2.0 and (not pk or ft[i] - pk[-1][0] > 0.4):
        pk.append((ft[i], tv[i]))
for k, (ts, sp_) in enumerate(pk):
    add(f'torch sweep {k + 1}', soft_air(0.45, 500, 2600), ts - 0.2, -37 + min(6, 2 * math.log2(sp_ / 2)))
# 0-3 s: the corner, the swing, the shield squared to him, the vanish in his view
add('shield swing: air', soft_air(0.9, 260, 1400), 0.5, -31)
add('shield swing: panel flex', flex(0.4), 0.9, -32)
add('grips settle', thud(110, 0.2, 0.4), 1.27, -27)
add('crouch: jacket rustle', bp(rng.standard_normal(int(0.3 * SR)), 1200, 6000) * env(int(0.3 * SR), 0.03, 0.2), 1.0, -36)
add('optical shimmer (she vanishes in his view)', shimmer(1.3), SHOT['s2'] + 0.12, -31)
add('panel squared: flex', flex(0.3), 2.0, -36)
# s5-s7: the push onto the lenses, the section, the plan, the crane back down
add('push onto the panel', soft_air(2.4, 180, 1000), w(15) - 0.1, -35)
for k in range(5):
    add(f'lens tick {k + 1}', tick(2800 + 260 * k), we(23) - 0.3 + 0.055 * k, -36 + 2 * (k == 0))
add('section opens (fold)', fold(), SHOT['s6'] + 0.05, -30)
add('body light spreads (warm sweep)', sweep(330, 520, 1.9), SHOT['s6'] + 0.6, -35)
add('background light crosses (cool sweep)', sweep(660, 440, 2.3), w(34), -36)
add('crane down', soft_air(1.4, 900, 220, rise=False), SHOT['s7'] - 0.05, -35)
# s8-s9: grip adjust, the outline melting
add('grip adjust (creak)', creak(0.32), 15.55, -36)
add('outline melts (settle shimmer)', shimmer(1.0, 1174.66) * 0.8, w(49) + 0.1, -34)
add('second melt (his view)', shimmer(0.9, 1318.51) * 0.6, w(53), -37)
# s10-s13: the reach, the floating hand, his freeze, the ripple, the flinch
add('weight shift behind the panel', flex(0.25), w(59), -36)
add('hand clears the edge (accent)', pop(), we(64) - 0.17, -25)
add('his freeze (low swell)', sweep(98, 92, 1.0) * 0.8, SHOT['s12'] - 0.05, -31)
for k in range(6):
    add(f'finger flutter {k + 1}', tick(1700 + 150 * k, 0.05) * 0.8, SHOT['s13'] + 0.15 + 0.14 * k, -38)
add('his flinch (sleeve swish)', soft_air(0.3, 800, 3000), SHOT['s13'] + 0.5, -33)
add('hand withdraws', soft_air(0.4, 1200, 400, rise=False), we(75) + 0.02, -37)
# s14-s17: the lowering, the reveal, the grin, the dash
add('lowering: air', soft_air(1.0, 900, 220, rise=False), w(76) + 0.05, -32)
add('lowering: panel flex', flex(0.35), we(79) - 0.3, -32)
add('set aside', thud(95, 0.22, 0.35), we(79) + 0.05, -30)
add('reaction accent (his jolt)', hit(), w(81) - 0.04, -24)
add('torch rattle (his jolt)', creak(0.18) * 0.7, w(81) + 0.02, -33)
add('the knowing beat (soft chime)', shimmer(1.2, 880.0) * 0.7, w(91) - 0.02, -34)
add('dash: whoosh', soft_air(0.6, 400, 2400), DUR - 0.62, -31)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.45 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 14 - lufs(music * duck))  # bed ~14 LU under the voice
sfx_l = sfx * (1 - 0.35 * np.clip(ve * 6, 0, 1))
mix = voice_l + mus_l + sfx_l
g = -14 - lufs(np.stack([mix, mix], 1))
mix *= db(g)
lim = db(-1.5)
if np.abs(mix).max() > lim:
    mix = np.tanh(mix / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems_v2'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v2.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v2.wav'), os.path.join(EP, 'audio/mix/FGW_Invisibility_Shield_V2_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v2/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
# the voice is only gain-scaled: its correlation with the source narration must be ~1
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v2.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v2.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
