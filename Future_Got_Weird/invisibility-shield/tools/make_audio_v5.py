#!/usr/bin/env python3
"""V5 score, effects and mix for FGW "This Shield Can Make You Disappear." The narration is the approved V1 recording,
unchanged (sample-for-sample, gain only) at 0 s, so picture sync is the original word timeline. Everything else is
synthesised here (no samples, no paid generation, no third-party music) and sits well under the voice:
  - the V2 suspense bed (low minor pad, a pulse that tightens while the guard is close, a quiet plucked figure in the
    lens passage), loop-continuous across the seam;
  - effects placed from the V4 picture timeline (tools/export_cues_v4.ts -> audio/cues_v5.json): every foot landing of
    both characters (her trainers, his boots, levelled by the camera's distance), torch sweeps, the panel swung up and
    set down, the glassy texture of the lens push and macro, cloth for the crouches, reach and recoil, his lean, a held
    silence while she freezes, her exhale, the lowering, the reveal accent, the cuffs (drawn and the ratchet click),
    the bolt, his belly-flop and scramble. Nothing cartoonish, no boings, no voices.
Inputs : audio/narration/FGW_Invisibility_Shield_narration_final.wav, audio/cues_v5.json
Outputs: source/public/audio/mix_v5.wav, audio/mix/FGW_Invisibility_Shield_V5_mix.wav, audio/mix/stems_v5/*.wav,
         audio/mix/mix_measure_v5.json, audio/sfx_cues_v5.json"""
import json, math, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v5.json')))
DUR, WORDS, F, STEPS = cj['DUR'], cj['WORDS'], cj['frames'], cj['steps']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(55)
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
section = win(5.9, 13.3, 0.4, 0.5)
close = win(13.8, 24.0, 0.8, 0.3)  # the guard closing in, right at the panel
freeze = win(17.42, 17.92, 0.1, 0.2)  # she freezes: the bed drops to a held breath
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
music = low * (0.9 + 0.2 * hand) * (1 - 0.6 * freeze) + pulse * 0.5 * (1 + 0.35 * close - 0.45 * hand) * (1 - 0.95 * freeze) + pluck * (0.06 + 0.10 * section + 0.05 * hand) * (1 - freeze) + air * section
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

# foot landings (both characters), levelled by the camera's distance to the foot
for k, st in enumerate(STEPS):
    if st['who'] == 'her':
        add(f"her step {k}", sneaker(), st['t'] - 0.004, -29 + lvl(st['dist']))
    else:
        add(f"guard step {k}", boot(), st['t'] - 0.004, -27 + lvl(st['dist']) + (5 if st['t'] < 2.6 or st['t'] > 28.2 else 0))
# torch sweeps: one soft swish per fast sweep
tv = np.array([f['torch'] for f in F]); pk = []
for i in range(1, len(F) - 1):
    if tv[i] >= tv[i - 1] and tv[i] > tv[i + 1] and tv[i] > 3.0 and (not pk or ft[i] - pk[-1][0] > 0.45):
        pk.append((ft[i], tv[i]))
for k, (ts, sp_) in enumerate(pk):
    add(f'torch sweep {k + 1}', soft_air(0.45, 500, 2600), ts - 0.2, -38 + min(5, 2 * math.log2(sp_ / 2)))
def squeak(d=0.14):
    n = int(d * SR); tt = np.arange(n) / SR
    f = 1900 + 500 * np.sin(2 * np.pi * 21 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, 0.07) * 0.6 + 0.2 * bp(rng.standard_normal(n), 2000, 6000) * env(n, 0.01, 0.06)
def rustle(d=0.4):
    n = int(d * SR)
    return bp(rng.standard_normal(n), 1200, 6500) * env(n, 0.05, 0.25) * (0.6 + 0.4 * np.sin(np.linspace(0, 9, n)))
def clink(f=2400, d=0.12):
    n = int(d * SR); tt = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2.76, 0.5), (5.4, 0.25)]) * np.exp(-tt / 0.03)
def cuff_click():
    # a ratchet: three quick pawl clicks and the jaw's ring
    out = np.zeros(int(0.42 * SR))
    for k, o in enumerate([0.0, 0.028, 0.052]):
        c = clink(3100 + 300 * k, 0.08) + 0.5 * bp(rng.standard_normal(int(0.08 * SR)), 3000, 9000) * np.exp(-np.arange(int(0.08 * SR)) / SR / 0.004)
        i = int(o * SR); out[i:i + len(c)] += c * (1.0 - 0.2 * k)
    ring = clink(1850, 0.3) * 0.35
    out[int(0.06 * SR):int(0.06 * SR) + len(ring)] += ring
    return out
def glassy(d=1.2):
    n = int(d * SR); tt = np.arange(n) / SR
    g = bp(rng.standard_normal(n), 5000, 11000) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * tt) ** 2)
    return (g * 0.5 + shimmer(d, 2349.32)[:n] * 0.4) * env(n, 0.2, 0.4)
def breath(d=0.7):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), 400, 2600) * np.sin(np.pi * tt) ** 1.2 * (1 - 0.5 * tt)
def scrape(d=0.25):
    n = int(d * SR)
    return bp(rng.standard_normal(n), 600, 3200) * env(n, 0.02, 0.12) * (0.7 + 0.3 * np.sin(np.linspace(0, 30, n)))
# 0-2.6: the chase (his boots right behind her), the brake, the swing, the slide, the disappearance
add('approach: his breath-whoosh as he reaches', soft_air(0.5, 300, 1800), 0.0, -31)
add('flashlight swings at her', soft_air(0.4, 700, 3000), 0.12, -35)
add('her brake squeak', squeak(), 0.5, -34)
add('panel swing: air', soft_air(0.65, 260, 1600), 0.5, -29)
add('panel swing: flex', flex(0.4), 0.8, -33)
add('panel set down (thunk)', thud(95, 0.3, 0.45), 1.25, -26)
add('panel set down (glass ring)', clink(1320, 0.4) * 0.35, 1.26, -34)
add('the lens catches the light', shimmer(0.9, 2093.0) * 0.6, 1.33, -34)
add('panel slid across the floor', scrape(0.7), 1.6, -33)
add('the smear passes over her (soft shimmer)', shimmer(1.2), 1.75, -34)
add('she sinks out of sight (rustle)', rustle(0.5), 2.35, -36)
add('his dead stop (boot scuff)', scrape(0.2) * 0.9, 2.44, -30)
add('his dead stop (small accent)', clink(988, 0.2) * 0.4 + 0.3 * thud(70, 0.2, 0.2), 2.47, -33)
# 3-6: his look down the corridor, the glide round the edge, his step in, the push
add('his head-check (cloth)', soft_air(0.3, 700, 2400), 3.3, -35)
add('glide round the panel', soft_air(1.2, 250, 800), 3.7, -38)
add('push onto the panel', soft_air(1.3, 180, 1100), 5.7, -35)
# 6.95-13.75: the optical cutaway
add('the ridges turn (glass)', glassy(0.9), 6.95, -35)
add('her light spreads (warm sweep)', sweep(330, 520, 1.6), 8.3, -35)
add('the corridor smears across (cool sweep)', sweep(660, 440, 1.8), 10.7, -36)
add('the ridges rise back up (glass)', glassy(0.8) * 0.8, 12.0, -36)
add('back out to his view', soft_air(0.7, 1100, 260, rise=False), 13.1, -36)
add('beam across the panel', soft_air(0.4, 800, 2600), 13.4, -38)
# 13.75-18.55: the search
add('the torch comes at her (swish)', soft_air(0.4, 900, 2600), 14.75, -37)
add('she leans back (rustle)', rustle(0.3) * 0.6, 14.85, -38)
add('quick re-grip', thud(150, 0.1, 0.3) * 0.6, 15.6, -36)
add('panel edged away (scrape)', scrape(0.3), 16.6, -36)
add('his lean (boot creak)', creak(0.22) * 0.6, 17.1, -35)
add('her exhale', breath(0.8), 18.1, -33)
# 18.55-23.9: the reach and the floating hand
add('the reach: sleeve', rustle(1.0) * 0.8, 18.6, -37)
add('the hand clears the edge (accent)', pop(), 19.72, -29)
add('his puzzled look (small accent)', clink(988, 0.25) * 0.4 + 0.3 * thud(70, 0.25, 0.2), 20.72, -33)
for k in range(5):
    add(f'finger wiggle {k + 1}', tick(1700 + 150 * k, 0.05) * 0.8, 21.57 + 0.08 * k, -38)
add('the hand snatched away', soft_air(0.28, 1500, 500, rise=False), 22.27, -33)
add('his recoil (whoosh)', soft_air(0.35, 800, 3000), 22.48, -32)
add('flashlight swings (swish)', soft_air(0.45, 600, 3200), 22.56, -34)
add('her giggle shake (cloth)', rustle(0.8) * 0.5, 22.95, -39)
# 23.9-28.0: the reveal and the cuffs
add('lowering: air', soft_air(0.85, 900, 220, rise=False), 23.95, -32)
add('lowering: panel flex', flex(0.35), 24.4, -34)
add('panel set on its edge', thud(120, 0.18, 0.3), 24.78, -33)
add('his startle (whoosh)', soft_air(0.3, 600, 2400), 24.85, -34)
add('the reveal (low accent)', hit(), WORDS[81]['start'] - 0.04, -28)
add('cuffs drawn (rattle)', creak(0.22) * 0.6, 26.2, -33)
add('cuffs drawn (clink)', clink(2200, 0.1) * 0.4, 26.6, -33)
add('handcuff click', cuff_click(), 27.08, -24)
add('her uh-oh (tiny accent)', tick(1200, 0.08) * 0.7, 27.7, -36)
# the bolt (steps come from the landings) and his lunge
add('her turn squeak', squeak(0.12), 27.98, -35)
add('bolt: whoosh', soft_air(0.6, 400, 2400), 28.0, -31)
add('his lunge (whoosh)', soft_air(0.45, 700, 2600), 28.05, -32)

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
os.makedirs(os.path.join(EP, 'audio/mix/stems_v5'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v5.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v5.wav'), os.path.join(EP, 'audio/mix/FGW_Invisibility_Shield_V5_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v5/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
# the voice is only gain-scaled: its correlation with the source narration must be ~1
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v5.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v5.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
