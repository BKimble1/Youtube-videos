#!/usr/bin/env python3
"""V2 ambience, effects, bed and mix for FGW "Lightning Laser". Same synthesis and levels as tools/make_audio.py (V1);
the narration is the same final file, sample for sample (gain only), at 0 s. Only the effect times change: they follow
the V2 picture (source/src/v2/timeline2.ts and the V2 scene files), listed in V2 below.
Inputs : audio/narration/FGW_Lightning_Laser_narration.wav, audio/cues.json (duration and words only)
Outputs: source/public/audio/mix_v2.wav, audio/mix/FGW_Lightning_Laser_V2_mix.wav, audio/mix/stems_v2/*.wav,
         audio/mix/mix_v2_measure.json, audio/sfx_cues_v2.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, WORDS = cj['duration'], cj['words']
# V2 event times (s), from source/src/v2/timeline2.ts, Console2.tsx, Vignette2.tsx, Firing2.tsx, Molecular2.tsx, Rod2.tsx
S = dict(H1=0, H2=0.95, H3=1.75, C1=2.52, C2=3.4, V1=4.31, M1=5.3, F1=7.81, F2=8.95, F3=9.67, F4=10.39, M2=11.42, M3=12.33,
         M4=13.33, M5=15.83, M6=18.79, T1=19.1, T2=20.31, T3=21.63, T4=23.2, R1=25.61, R2=26.6, R3=28.94, E1=30.74, E2=31.88)
VG2 = dict(strike=4.52, x1=4.55, x2=4.73, settle=5.05, rise=5.0, micro=5.45)
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR  # whole cycles over the film, so the bed loops seamlessly
def db(x): return 10 ** (x / 20)
def env(n, a, r):
    e = np.ones(n); na = min(n, max(1, int(a * SR))); nr = min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    np.add.at(buf, idx % N, sig)  # wraps round the seam
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]  # filter as if the signal loops forever
def noise(n): return rng.standard_normal(n)
def seg(a, b, fa=0.08, fb=0.08):
    """0..1 window over [a, b] with short fades (wraps across the seam if a > b)"""
    if a > b: return np.clip(seg(a, DUR + 1, fa, 0) + seg(-1, b, 0, fb), 0, 1)
    fa, fb = max(fa, 1e-3), max(fb, 1e-3)
    return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)

# ---------------- voice (unchanged) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Lightning_Laser_narration.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- where the picture is ----------------
site = np.clip(seg(0, S['C1'], 0, 0.03) + seg(S['F3'], S['M2'], 0.03, 0.05) + seg(S['M6'], S['R1'], 0.2, 0.03) + seg(S['R3'], DUR, 0.03, 0), 0, 1)
inside = np.clip(seg(S['C1'], S['V1'], 0.02, 0.03) + seg(S['F1'], S['F2'], 0.03, 0.03), 0, 1)
encl = seg(S['F2'], S['F3'], 0.03, 0.03)
vign = seg(S['V1'], VG2['micro'], 0.02, 0.3)
micro = np.clip(seg(VG2['micro'] - 0.15, S['F1'], 0.3, 0.05) + seg(S['M2'], S['M6'], 0.05, 0.3), 0, 1)
rod = seg(S['R1'], S['R3'], 0.03, 0.03)

# ---------------- storm ambience (loopable): rain hiss, wind, distant rain on rock ----------------
rain = circ(lambda x: bp(x, 1200, 9000), noise(N)) * (0.75 + 0.25 * np.sin(2 * np.pi * loopf(0.13) * t))
wind = circ(lambda x: lp(x, 380), noise(N)) * (0.6 + 0.4 * np.sin(2 * np.pi * loopf(0.07) * t + 1.3)) * 3.0
drops = np.zeros(N)
for k in range(int(DUR * 22)):
    at = rng.uniform(0, DUR); n = int(0.012 * SR); tt = np.arange(n) / SR
    place(drops, bp(noise(n), 2500, 7000) * np.exp(-tt / 0.002) * rng.uniform(0.2, 1), at)
muffle = circ(lambda x: lp(x, 700), rain + wind)
amb = (rain + wind + 0.5 * drops) * (site + rod) + 0.55 * muffle * inside + 0.35 * muffle * encl + 0.12 * (rain * 0.5 + wind) * micro + 0.25 * wind * vign

# ---------------- a quiet tension bed (loopable, whole cycles), thinner in the molecular views ----------------
def pad(freqs, rate=0.09):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * loopf(rate + 0.03 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * loopf(f) * t)
    return out
bed = circ(lambda x: lp(x, 700), pad([(55.0, 0.5), (82.41, 0.3), (110.0, 0.18), (116.54, 0.05), (164.81, 0.07)]))
air = circ(lambda x: lp(hp(x, 400), 3000), pad([(659.26, 0.08), (880.0, 0.05), (987.77, 0.04)], 0.06))
music = bed * (0.9 - 0.3 * micro) + air * (0.2 + 0.7 * micro)

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db):
    place(sfx, sig * db(gain_db), at); log.append({'name': name, 'at': round(at % DUR, 3), 'frame': round((at % DUR) * 30, 1), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1)})

def crackle(d, dens0, dens1, bright=1.0, seed=0):
    """an electrical crackle: sparse sharp clicks whose density rises from dens0 to dens1 per second"""
    r = np.random.default_rng(100 + seed)
    n = int(d * SR); out = np.zeros(n); x = 0.0
    while x < d:
        dens = dens0 + (dens1 - dens0) * (x / d)
        x += r.exponential(1 / max(dens, 1))
        i = int(x * SR)
        if i >= n - 200: break
        m = int(r.uniform(0.0008, 0.004) * SR); tt = np.arange(m) / SR
        c = r.standard_normal(m) * np.exp(-tt / r.uniform(0.0004, 0.0015)) * r.uniform(0.3, 1)
        out[i:i + m] += c
    return hp(out, 1800) * bright + 0.25 * bp(out, 400, 1800)
def crack(d=0.5):
    """the connection: a sharp broadband crack, its tearing tail and a body thump"""
    n = int(d * SR); tt = np.arange(n) / SR
    tear = bp(noise(n), 900, 9000) * np.exp(-tt / 0.06) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 37 * tt)))
    return 1.0 * noise(n) * np.exp(-tt / 0.004) + 0.8 * tear + 0.9 * lp(noise(n), 160) * np.exp(-tt / 0.09) * 4
def thunder(d=3.2, k=1.0):
    """thunder after the flash: a low roll with a few swells"""
    n = int(d * SR); tt = np.arange(n) / SR
    roll = lp(noise(n), 140, 4) * 6 + 0.4 * bp(noise(n), 140, 600)
    sw = np.exp(-tt / (1.1 * k)) * (0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 1.3 * tt + 0.4))) * env(n, 0.12, 0.6)
    return roll * sw
def click(f=2200, d=0.05):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.6 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006) + 0.5 * bp(noise(n), 3000, 9000) * np.exp(-tt / 0.002)
def zap(d=0.13, f0=118):
    """a dry, buzzy electrical zap (square-ish buzz + crackle), short"""
    n = int(d * SR); tt = np.arange(n) / SR
    buzz = np.tanh(3 * np.sin(2 * np.pi * f0 * tt)) * 0.5 + 0.3 * np.tanh(3 * np.sin(2 * np.pi * f0 * 2.01 * tt))
    return (bp(buzz, 150, 5000) + 0.6 * crackle(d, 400, 400, seed=int(f0))[:n]) * env(n, 0.003, 0.03)
def fizz(d, seed=3): return crackle(d, 30, 120, 0.7, seed) * env(int(d * SR), 0.2, 0.1)
def whoomp(d=0.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return lp(noise(n), 500) * np.exp(-tt / 0.08) * env(n, 0.02, 0.1) * 2
def tick(d=0.09):
    """a laser packet leaving the telescope: a soft, slightly glassy tick and a tiny breath"""
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.5 * np.sin(2 * np.pi * 1650 * tt) * np.exp(-tt / 0.01) + 0.25 * np.sin(2 * np.pi * 3300 * tt) * np.exp(-tt / 0.006) + 0.15 * bp(noise(n), 4000, 9000) * np.exp(-tt / 0.02)
def swell(d, lo, hi):
    n = int(d * SR)
    return bp(noise(n), lo, hi) * env(n, d * 0.55, d * 0.4)
def ping(f=2600, d=0.12):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.03) * env(n, 0.002, 0.04)

L0, LC = 32.9, 1.75  # loop leader incepts (tau -0.6) and connects (timeline2 LOOP0, LOOPC)
D0, DC = 19.55, 21.85  # the demonstration leader (timeline2 DEMO0, DEMOC)
dur_leader = (DUR - L0) + LC
add('field builds at the tip (end of film)', crackle(L0 - S['E2'], 8, 40, 0.6, 5) * env(int((L0 - S['E2']) * SR), 0.6, 0.02), S['E2'], -36)
add('loop leader crackle (across the seam)', crackle(dur_leader, 40, 260, seed=1) * env(int(dur_leader * SR), 0.25, 0.02), L0, -28)
add('connection crack (opening)', crack(), LC, -18)
add('thunder after the opening flash', thunder(3.0), LC + 0.35, -18)
# the shelter: ARM press, the restrike seen through the window, the FIRE press
add('ARM button press', click(1800), S['C1'] + 0.2, -30)
add('ARM relay', click(2600, 0.04), S['C1'] + 0.27, -38)
for k, a0 in enumerate([3.52, 3.64, 3.83]):
    add(f'restrike crack outside (muffled) {k}', lp(crack(0.3), 1400), a0, -30 - 3 * k)
add('FIRE button press', click(1500), S['F1'] + 0.2, -28)
add('FIRE relay', click(2400, 0.04), S['F1'] + 0.26, -36)
# the vignette (an imagined example)
add('cartoon cloud rumble', thunder(1.0, 0.5), S['V1'] + 0.02, -30)
add('static fizz at his hair', fizz(VG2['strike'] - S['V1'] - 0.05), S['V1'] + 0.05, -34)
add('strike snap', crack(0.22), VG2['strike'], -22)
add('zap 1 (exposure)', zap(), VG2['x1'], -24)
add('jolt whoomp', whoomp(), VG2['strike'] + 0.03, -30)
add('zap 2 (exposure)', zap(0.08, 132), VG2['x2'], -26)
add('singed hair sizzle', fizz(0.6, 9), VG2['settle'] - 0.2, -36)
add('rise into the air (texture swell)', swell(0.5, 2500, 9000), VG2['rise'], -36)
for k, a0 in enumerate([5.6, 6.35, 7.05]):
    add(f'streamer attempt stalls {k}', crackle(0.6, 60, 20, 0.7, 11 + k) * env(int(0.6 * SR), 0.05, 0.25), a0, -36)
# the machine: hum while it is in view, a soft tick per packet
hum_n = int((S['F4'] - S['F1'] + 0.3) * SR); tt = np.arange(hum_n) / SR
hum = (0.6 * np.sin(2 * np.pi * 100 * tt) + 0.25 * np.sin(2 * np.pi * 200 * tt) + 0.1 * bp(noise(hum_n), 300, 1200)) * env(hum_n, 0.2, 0.4)
add('laser hum', hum, S['F1'], -38)
for k in range(7):
    add(f'packet through the optics {k}', tick(), S['F2'] - 0.05 + k / 9, -37)
for k in range(7):
    add(f'packet leaves the window {k}', tick(), S['F3'] - 0.06 + k / 9, -34)
add('push into the pulse', swell(0.45, 1500, 7000), 10.98, -34)
# the molecular views
add('pulse races through the air', swell(0.9, 1500, 6000), S['M2'], -34)
for k in range(8):
    add(f'electron freed {k}', ping(2400 + 300 * (k % 4)), S['M2'] + 0.08 + k * 0.1, -42)
for k, a0 in enumerate([12.62, 12.92]):
    add(f'electron torn away (close-up) {k}', ping(2900 - 300 * k, 0.18), a0, -35)
    add(f'ionization spark {k}', crackle(0.12, 200, 50, 1.0, 40 + k), a0, -38)
add('heated channel shimmer', swell(2.3, 600, 3000), S['M4'] + 0.1, -38)
add('leader runs up the channel', crackle(2.6, 120, 420, 0.8, 21), S['M5'] + 0.15, -32)
# the demonstration
add('demo leader crackle', crackle(DC - D0, 60, 300, seed=31) * env(int((DC - D0) * SR), 0.15, 0.02), D0, -27)
add('demo connection (controlled discharge)', crack(0.6), DC, -16)
add('thunder after the demo flash', thunder(3.4, 1.2), DC + 0.4, -17)
# the rod comparison: a distant strike and its late thunder
add('distant strike', lp(crack(0.3), 2500), 25.74, -30)
add('distant thunder', thunder(2.4, 0.7), 26.2, -26)
add('faint far flicker', lp(crack(0.2), 1800), 28.25, -38)
# the payoff
add('channel extends (shimmer)', swell(1.7, 1200, 6000), S['R3'] + 0.25, -36)
for k in range(4):
    add(f'pulse tick (payoff) {k}', tick() * 0.7, S['E1'] + 0.1 + k * 0.3, -38)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.5 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
amb_l = amb * duck * db(-17 - 17 - lufs(amb * duck))
mus_l = music * duck * db(-17 - 19 - lufs(music * duck))
sfx_l = sfx * db(4) * (1 - 0.4 * np.clip(ve * 6, 0, 1))
mix = voice_l + amb_l + mus_l + sfx_l
from scipy.ndimage import maximum_filter1d
def limit(x, ceil):
    """a peak limiter: gain falls only where the 3 ms peak envelope exceeds the ceiling (fast attack, 60 ms release)"""
    pk = maximum_filter1d(np.abs(x), int(0.003 * SR))
    gr = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    rel = np.exp(-1 / (0.06 * SR)); out = gr.copy()
    for i in range(1, len(out)): out[i] = min(gr[i], rel * out[i - 1] + (1 - rel) * gr[i])
    return x * out, float(gr.min())
g, lim = 0.0, db(-1.5)
for _ in range(4):  # gain to -14 LUFS, then limit the peaks; repeat so the limited mix lands on -14
    y, grmin = limit(mix * db(g), lim * 0.98)
    g += -14 - lufs(np.stack([y, y], 1))
mix, grmin = limit(mix * db(g), lim * 0.98)
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems_v2'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v2.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v2.wav'), os.path.join(EP, 'audio/mix/FGW_Lightning_Laser_V2_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('ambience', amb_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v2/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((amb_l + mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
seam = mix[-480:].tolist() + mix[:480].tolist()
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_sample_jump': round(float(abs(mix[0] - mix[-1])), 5), 'seam_rms_last_10ms_vs_first_10ms_db': round(20 * np.log10((np.sqrt(np.mean(mix[-480:] ** 2)) + 1e-9) / (np.sqrt(np.mean(mix[:480] ** 2)) + 1e-9)), 2), 'effects': len(log), 'limiter_max_gain_reduction_db': round(20 * np.log10(grmin), 2)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_v2_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v2.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
