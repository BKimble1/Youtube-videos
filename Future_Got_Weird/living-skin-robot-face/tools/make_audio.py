#!/usr/bin/env python3
"""Score, effects and mix for FGW "This Robot Is Wearing Living Human Skin". Everything is synthesised here (no
samples, no paid generation). Voice-led: a restrained uneasy bed that loops sample-continuously (every partial and LFO
completes a whole number of cycles in the film's 27.2 s, noise is cross-faded across the seam), a changed texture for
the second hook, and sparse effects on the motor tug, the "alive" impact, the dives, the pull, the cut, the patch
contact and the DAY 0 -> 7 time jump. The motor whine that starts the smile spans the loop seam.
Inputs : audio/narration/FGW_Living_Skin_narration_final.wav, audio/cues.json (tools/export_cues.ts)
Outputs: source/public/audio/mix.wav, audio/mix/stems/*.wav, audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, os
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cues = json.load(open(os.path.join(EP, 'audio/cues.json')))
C, SH, DUR = cues['CUE'], cues['SH'], cues['DUR']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(11)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR  # frequency with a whole number of cycles in the film
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at, wrap=False):
    i = int(round(at * SR))
    idx = np.arange(len(sig)) + i
    if wrap:
        idx = idx % N
        np.add.at(buf, idx, sig)
    else:
        m = (idx >= 0) & (idx < N)
        buf[idx[m]] += sig[m]
def win(a, b, fa=0.15, fb=0.15):
    return np.clip(np.minimum((t - a) / fa + 1, (b - t) / fb + 1), 0, 1) if False else np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def db(x): return 10 ** (x / 20)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]  # steady-state filtering of a periodic signal

# ---------------- voice ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Living_Skin_narration_final.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- music bed (loop-continuous) ----------------
hook2 = win(SH['finger'] + 0.02, SH['top'] - 0.25, 0.08, 0.5)  # second-hook texture window
bed_main = 1 - 0.85 * hook2
drone = np.zeros(N)
for f, a in [(55.0, 0.5), (58.27, 0.22), (82.4, 0.28), (110.0, 0.12)]:  # low A with a rubbing minor second
    ff = loopf(f)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * loopf(0.11) * t + f)
    drone += a * lfo * np.sin(2 * np.pi * ff * t)
drone = circ(lambda x: lp(x, 400), drone)
# breath of filtered noise, cross-faded across the loop seam
X = int(1.0 * SR)
nz = rng.standard_normal(N + X)
nz = bp(nz, 180, 900)
nz[:X] = nz[:X] * np.linspace(0, 1, X) + nz[N:N + X] * np.linspace(1, 0, X)
nz = nz[:N] * (0.5 + 0.5 * np.sin(2 * np.pi * loopf(0.22) * t)) * 0.18
# glassy high tone, slow tremolo
glass = 0.05 * np.sin(2 * np.pi * loopf(1318.5) * t) * (0.6 + 0.4 * np.sin(2 * np.pi * loopf(0.37) * t)) + 0.03 * np.sin(2 * np.pi * loopf(1975.5) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * loopf(0.29) * t + 1))
# second-hook texture: drone pitch drop + soft ticking pulse (time / strangeness)
tick_bed = np.zeros(N)
for k in range(int((SH['top'] - SH['finger']) / 0.25) + 1):
    at = SH['finger'] + 0.12 + k * 0.25
    n = int(0.03 * SR)
    place(tick_bed, hp(rng.standard_normal(n), 2500) * np.exp(-np.arange(n) / (0.006 * SR)) * (0.9 if k % 2 == 0 else 0.5), at)
low2 = 0.45 * np.sin(2 * np.pi * loopf(41.2) * t) + 0.2 * np.sin(2 * np.pi * loopf(43.65) * t)
music = (drone * 0.9 + nz + glass) * bed_main + (circ(lambda x: lp(x, 300), low2) * 0.8 + 0.22 * bp(tick_bed, 2000, 6000)) * hook2
# repair section: a soft rising shimmer under DAY 0 -> 7
rep = win(C['seven'] - 0.1, C['close'] + 0.6, 0.4, 0.6)
shim = sum(0.04 * np.sin(2 * np.pi * loopf(f) * t) for f in (659.3, 987.8, 1318.5)) * (0.5 + 0.5 * np.sin(2 * np.pi * loopf(3.0) * t))
music += shim * rep * np.clip((t - C['seven']) / 3.5, 0, 1)

# ---------------- effects ----------------
sfx = np.zeros(N); cue_log = []
def add(name, sig, at, gain_db, wrap=False):
    place(sfx, sig * db(gain_db), at, wrap); cue_log.append({'name': name, 'at': round(at, 3), 'dur': round(len(sig) / SR, 3), 'gain_db': gain_db})
def servo(dur, f0, f1, grit=0.3):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1 + 0.01 * np.sin(2 * np.pi * 31 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sign(np.sin(ph)) * 0.4 + np.sin(ph) * 0.6 + np.sin(2 * ph) * 0.3
    s = bp(s, 300, 4000) + grit * bp(rng.standard_normal(n), 2000, 5000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 90 * tt)))
    return s * env(n, 0.04, 0.08) * 0.5
def click(f=3000, d=0.025):
    n = int(d * SR); return bp(rng.standard_normal(n), f * 0.6, min(f * 1.6, 20000)) * np.exp(-np.arange(n) / (0.004 * SR))
def thump(f=48, d=0.7):
    n = int(d * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * (f + 30 * np.exp(-tt / 0.05)) * tt) * np.exp(-tt / 0.22)
    return s + 0.25 * lp(rng.standard_normal(n), 300) * np.exp(-tt / 0.05)
def whoosh(d, lo, hi, rise=True):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    x = rng.standard_normal(n); out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]
        fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return lp(out, hi * 1.2) * np.sin(np.pi * tt) ** 1.5
def wet_tap(d=0.25):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.05) + 0.5 * bp(rng.standard_normal(n), 400, 1800) * np.exp(-tt / 0.03))
def slice_(d=0.3):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    return hp(rng.standard_normal(n), 3500) * np.sin(np.pi * tt) ** 0.7 * (0.4 + 0.6 * tt)
def mixs(*xs):
    n = max(len(x) for x in xs); out = np.zeros(n)
    for x in xs: out[:len(x)] += x
    return out
def tick(f, d=0.12):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.03)

# motor tug: one whine that spans the loop seam (starts with the end's smile, continues through frame 0)
tug = servo(1.0, 820, 1180)
add('motor tug (spans loop seam)', tug, DUR - 0.55, -16, wrap=True)
add('alive impact (low)', thump(46, 0.8), C['alive1'] - 0.02, -9)
add('section slice open', click(5200, 0.04), C['alive1'] - 0.04, -22)
add('dive into cell', whoosh(0.45, 300, 4500), SH['dive'] - 0.15, -21)
add('cell arrival (soft)', thump(90, 0.35) * 0.5, SH['micro'] - 0.02, -20)
add('pull back', whoosh(0.5, 3500, 250, rise=False), SH['pull'] - 0.05, -24)
add('smile motor', servo(0.75, 760, 1040), C['made'] - 0.02, -17)
for k, dt in enumerate([0.0, 0.14, 0.28]):
    add(f'anchor tick {k}', tick(2350 + 180 * k), C['anchors'] + 0.05 + dt, -27)
add('motor pull (underneath)', servo(0.85, 520, 760, 0.45), C['motors'] + 0.03, -14)
add('pull latch', mixs(click(2400, 0.05), 0.3 * thump(160, 0.12)), C['underneath'] + 0.2, -19)
add('second hook drop', thump(38, 0.9), SH['finger'], -14)
add('finger flex servo', servo(0.55, 640, 900), C['experiment'] + 0.15, -21)
add('scalpel glint', tick(4200, 0.25) * 0.6, C['stranger'] - 0.1, -28)
add('incision', slice_(0.32), C['cut'], -19)
add('tweezers set', click(3600, 0.03), SH['graft'] + 0.1, -26)
add('patch contact', wet_tap(), C['patch1'] - 0.01, -15)
add('dive into repair', whoosh(0.4, 300, 4500), SH['micro2'] - 0.3, -22)
add('time jump', mixs(whoosh(0.7, 200, 2500), 0.4 * thump(70, 0.4)), C['seven'] - 0.15, -20)
dayT = [C['seven'] + 0.05 + (C['close'] + 0.1 - C['seven'] - 0.05) * k / 7 for k in range(1, 8)]
for k, at in enumerate(dayT):
    add(f'day tick {k + 1}', tick(1000 * 2 ** (k / 12 * 2)), at, -26 + k * 0.4)
add('pull back to finger', whoosh(0.45, 3000, 300, rise=False), SH['back'] - 0.05, -24)
add('finger flex servo 2', servo(0.5, 640, 880), SH['back'] + 0.45, -22)
add('cutaway clack', mixs(click(1800, 0.06), 0.4 * thump(120, 0.15)), C['machine'] - 0.04, -18)
add('matched boundary', whoosh(0.4, 2500, 400, rise=False), SH['faceSec'] - 0.1, -25)
add('window close', tick(1600, 0.1), C['is2'] + 0.25, -26)

# ---------------- mix ----------------
# duck music under speech (smoothed voice envelope)
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.45 * np.clip(ve * 6, 0, 1)
music_m = music * duck
def lufs(x): return pyln.Meter(SR).integrated_loudness(x)
vg = -17 - lufs(voice)
voice_l = voice * db(vg)
mus_l = music_m * db(-17 - 15 - lufs(music_m))   # bed ~15 LU under the voice
sfx_l = sfx * db(vg * 0.0 + 0)                    # effects are already set relative to full scale
mix = voice_l + mus_l + sfx_l * 0.9
g = -14 - lufs(np.stack([mix, mix], 1))  # measured as the delivered dual-mono stereo (both channels count)
mix *= db(g)
peak = np.abs(mix).max()
lim = db(-1.5)
if peak > lim:  # soft-knee limiter on the rare peaks
    mix = np.tanh(mix / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix.wav'), stereo, SR, subtype='PCM_24')
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * 0.9 * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), x, SR, subtype='PCM_24')
# small-speaker check: voice vs music+sfx in 400 Hz - 5 kHz during speech
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l * 0.9) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR,
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(cue_log, open(os.path.join(EP, 'audio/sfx_cues.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
