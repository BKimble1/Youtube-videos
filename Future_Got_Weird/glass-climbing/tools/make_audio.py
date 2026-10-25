#!/usr/bin/env python3
"""Bed, effects and mix for FGW "Glass Climbing". Everything is synthesised here (no samples, no third-party music).
The narration is the final narration file, sample for sample (gain only), at 0 s, so the words keep their measured
times. The effects follow the picture's own event frames (audio/cues.json from tools/export_cues.ts).
Sound brief: dry adhesion (no wet or slimy sounds): a plate seating on glass, webbing taking tension, shoes leaving the
floor, a stirrup bar taking a foot, a pad peeling off dry, springs stretching, a carriage sliding, a small dry slip on
brick and a test mass landing on the bench. A subtle pulse/tension bed sits well under the voice; whooshes only on the
two big scale changes (into the tile, back out to the climber). No sting at "But there's a catch".
Levels (as the channel's recent Shorts): voice -17 LUFS, bed about 15 LU under it and ducked under speech, effects
under the voice, the whole at -14 LUFS with a -1.5 dBFS ceiling.
Inputs : audio/narration/FGW_Glass_Climbing_narration_final.wav, audio/cues.json
Outputs: source/public/audio/mix.wav, audio/mix/FGW_Glass_Climbing_V1_mix.wav, audio/mix/stems/*.wav,
         audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, WORDS, CL, BK = cj['duration'], cj['words'], cj['climb'], cj['bench']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(41)
F = lambda fr: fr / 30.0
w = lambda word, n=0: [x for x in WORDS if x['word'] == word][n]['start']

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR  # whole cycles over the film: the bed loops seamlessly
def db(x): return 10 ** (x / 20)
def env(n, a, r):
    e = np.ones(n); na = min(n, max(1, int(a * SR))); nr = min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    np.add.at(buf, idx % N, sig)
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
def noise(n): return rng.standard_normal(n)

# ---------------- voice (unchanged) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Glass_Climbing_narration_final.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- bed: a low, slightly tense pad and a soft pulse (about 100 bpm), quieter in the micro views ----------
def pad(freqs, rate=0.1):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * loopf(rate + 0.03 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * loopf(f) * t)
    return out
pad_main = circ(lambda x: lp(x, 600), pad([(73.42, 0.5), (110.0, 0.32), (146.83, 0.16), (155.56, 0.07), (220.0, 0.08)]))
pad_air = circ(lambda x: lp(hp(x, 300), 2400), pad([(440.0, 0.12), (587.33, 0.08), (659.26, 0.06)], 0.07))
beats = int(round(DUR / 0.6)); bpd = DUR / beats
pulse = np.zeros(N)
for k in range(beats):
    n = int(0.3 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt / 0.07) + 0.12 * bp(noise(n), 1500, 5000) * np.exp(-tt / 0.006)
    place(pulse, s * (0.8 if k % 2 == 0 else 0.45), k * bpd)
micro = np.clip(win(F(232), F(477), 0.4, 0.4) + win(F(768), F(788), 0.2, 0.3) + win(F(905), F(1064), 0.3, 0.3), 0, 1)
catch_ = win(w('but', 1) - 0.05, DUR, 0.2, 0.6)  # the bench section: the pulse thins, the pad drops a little
music = pad_main * (0.9 - 0.25 * micro) + pad_air * (0.25 + 0.6 * micro) + pulse * (0.5 - 0.35 * micro) * (1 - 0.4 * catch_)

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db):
    place(sfx, sig * db(gain_db), at); log.append({'name': name, 'at': round(at % DUR, 3), 'frame': round(at * 30, 1), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1)})
def tock(f=1900, d=0.12):
    # a plate seating on glass: a short, dry, slightly glassy knock
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.7 * np.sin(2 * np.pi * 150 * tt) * np.exp(-tt / 0.018) + 0.5 * sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2.3, 0.4)]) * np.exp(-tt / 0.012) + 0.2 * bp(noise(n), 2000, 7000) * np.exp(-tt / 0.004)
def taut(d=0.22, f0=95):
    # webbing taking a load: a quick fibrous creak and a low thrum
    n = int(d * SR); tt = np.arange(n) / SR
    creak = bp(noise(n), 900, 3200) * np.exp(-tt / 0.03) * (0.6 + 0.4 * np.sin(2 * np.pi * 45 * tt))
    return 0.55 * creak + 0.6 * np.sin(2 * np.pi * f0 * tt) * np.exp(-tt / 0.06) * env(n, 0.004, 0.05)
def scuff(d=0.16):
    n = int(d * SR); tt = np.arange(n) / SR
    return bp(noise(n), 700, 4500) * env(n, 0.01, 0.1) * 0.8 + 0.3 * np.sin(2 * np.pi * 210 * tt) * np.exp(-tt / 0.02)
def squeak(d=0.09, f=1450):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 300 * tt / d) * tt) * env(n, 0.01, 0.04) * 0.5
def barstep(d=0.18):
    # a shoe settling onto the stirrup's bar: muffled knock with a webbing rustle
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.7 * np.sin(2 * np.pi * 120 * tt) * np.exp(-tt / 0.03) + 0.35 * bp(noise(n), 1200, 5000) * env(n, 0.005, 0.12)
def peel(d=0.28):
    # dry unpeeling: a fine, fast crackle that thins out (no wet or sticky character)
    n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros(n); k = 0
    while True:
        at = 0.003 + k * 0.004 * (1 + 2.5 * k / 60)
        if at > d - 0.02: break
        i = int(at * SR); m = int(0.002 * SR); x[i:i + m] += noise(m) * (1 - at / d)
        k += 1
    return hp(x, 2500) * 0.9 + 0.2 * bp(noise(n), 3000, 9000) * env(n, 0.01, 0.2) * (1 - tt / d)
def rustle(d=0.6):
    n = int(d * SR)
    return bp(noise(n), 900, 5500) * env(n, 0.08, 0.3) * (0.6 + 0.4 * np.sin(np.linspace(0, 11, n)))
def air(d, lo, hi, rise=True):
    n = int(d * SR); tt = np.linspace(0, 1, n); x = noise(n); out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]; fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return lp(out, hi * 1.2) * np.sin(np.pi * tt) ** 1.6
def ticks(d, rate, f=5200):
    # many tiny contacts closing: soft, dry, close together
    out = np.zeros(int(d * SR)); k = 0
    while True:
        at = (k + rng.random() * 0.8) / rate
        if at > d - 0.02: break
        n = int(0.01 * SR); tt = np.arange(n) / SR
        b = np.sin(2 * np.pi * (f * (0.8 + 0.4 * rng.random())) * tt) * np.exp(-tt / 0.0015)
        i = int(at * SR); out[i:i + n] += b * (0.3 + 0.7 * rng.random()); k += 1
    return out * env(len(out), 0.05, 0.1)
def shimmer(d=1.0, f=2349.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * 1.5 * tt) * 0.25) * env(n, 0.25, 0.5) * (0.7 + 0.3 * np.sin(2 * np.pi * 6 * tt))
def spring(d=0.5, f0=520, f1=380):
    # a small spring stretching: a soft metallic boing with a creak
    n = int(d * SR); tt = np.arange(n) / SR; f = np.geomspace(f0, f1, n)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.18)
    return 0.4 * tone * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * tt)) + 0.25 * bp(noise(n), 1500, 4500) * env(n, 0.02, 0.3)
def slide(d=0.6):
    # a carriage on its rail: a small bearing rumble with a light rattle
    n = int(d * SR); tt = np.arange(n) / SR
    return (0.6 * lp(noise(n), 300) + 0.25 * bp(noise(n), 1800, 5000) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * tt))) * env(n, 0.08, 0.15)
def scrape(d=0.6):
    # dry slip down brick: gritty, uneven, no wet tone
    n = int(d * SR); tt = np.arange(n) / SR
    grit = bp(noise(n), 900, 6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 17 * tt + 3 * np.sin(2 * np.pi * 3 * tt))))
    return grit * env(n, 0.01, 0.2)
def thunk(d=0.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.9 * np.sin(2 * np.pi * 85 * tt) * np.exp(-tt / 0.05) + 0.3 * lp(noise(n), 700) * np.exp(-tt / 0.02) + 0.2 * np.sin(2 * np.pi * 640 * tt) * np.exp(-tt / 0.03)

C = CL
# the opening: the left pad seats, the foot leaves the floor into the stirrup, the strap snaps taut
add('left pad seats on the glass', tock(), F(C['contact']) - 0.02, -24)
add('left shoe leaves the floor', scuff(), F(C['lFoot0']), -33)
add('left foot onto the stirrup bar', barstep(), F(C['lFoot1']) - 0.08, -30)
add('left strap takes the load', taut(), F(C['lFoot1']) - 0.02, -27)
add('right shoe leaves the floor (squeak)', squeak(), F(C['rOff0']), -38)
add('right foot into its stirrup', barstep(), F(C['rIn1']) - 0.06, -31)
add('stand-up on the right (effort, cloth)', rustle(0.9), F(C['standR0a']), -38)
add('right strap takes the load', taut(0.24, 100), F(C['standR0b']) - 0.25, -29)
add('left pad peels off (dry)', peel(), F(C['lRel']), -31)
add('left pad carried up (air)', air(0.5, 400, 1400), F(C['lMove0']), -44)
add('left pad seats higher (through the glass, muffled)', lp(tock(1700), 2200), F(C['lPlace']) - 0.03, -26)
add('left foot steps up', barstep(), F(C['standL1a']) + 0.25, -32)
add('left strap taking load', taut(0.2, 92), F(C['standL1b']) - 0.3, -31)
# the dive and the mechanism
add('into the tile (scale whoosh, soft)', air(0.75, 300, 3000), F(204), -40)
add('the strip turns (air)', air(0.6, 1200, 400, False), F(228), -46)
add('glass meets the tips', tock(2600, 0.08) * 0.6, F(259), -36)
add('wedges begin to bend (fine ticks)', ticks(1.1, 30), F(272), -40)
add('wedges lie flat (dense ticks)', ticks(1.2, 55, 4400), F(306), -40)
add('close contact (restrained shimmer at the edge)', shimmer(1.3), F(429), -44)
add('back out to the climber (whoosh)', air(0.9, 3000, 300, False), F(476), -40)
add('stand-up on the left', rustle(0.8), F(C['standL1c']), -38)
add('left strap holding his whole weight', taut(0.26, 88), F(C['standL1d']) - 0.3, -28)
add('right pad peels off', peel(), F(C['rRel']), -32)
add('right pad seats higher', tock(1850), F(C['rPlace']) - 0.03, -26)
add('right foot into its stirrup', barstep(), F(C['rIn2b']) - 0.15, -33)
# springs
add('cover opens (cutaway, air)', air(0.5, 500, 1800), F(543), -46)
add('the springs stretch together', spring(0.7, 560, 420), F(568), -36)
add('one spring alone stretches far', spring(0.6, 420, 260), F(596), -34)
add('the array shares again', spring(0.5, 470, 520), F(626), -38)
# the weight shift, release and next reach
add('stand-up on the right', rustle(1.0), F(C['standR1a']), -37)
add('right strap takes the load', taut(0.24, 100), F(C['standR1b']) - 0.6, -28)
add('left strap goes slack (soft flap)', bp(noise(int(0.15 * SR)), 300, 1600) * env(int(0.15 * SR), 0.01, 0.1), F(745), -40)
add('wedges let go (fine release ticks)', ticks(0.5, 40, 6000), F(770), -40)
add('left pad peels off', peel(0.32), F(C['lRel2']) + 0.2, -30)
add('left pad carried up (air)', air(0.5, 400, 1400), F(C['lMove2a']), -44)
add('left pad seats higher', tock(), F(C['lPlace2']) - 0.03, -25)
add('left foot steps up onto the bar', barstep(), F(C['lIn2b']) - 0.1, -32)
# the catch: the bench
add('pad lifted off the bench glass', peel(0.2), F(BK['lift']), -34)
add('carriage slides (glass out, brick in)', slide(0.7), F(BK['slide0']), -34)
add('glass meets the tips (micro)', tock(2600, 0.08) * 0.6, F(913), -38)
add('contact closes across the glass (ticks)', ticks(0.8, 60, 4600), F(914), -40)
add('callback: stand-up on the left', rustle(0.8), F(C['standL2c']), -38)
add('callback: right pad peels off', peel(), F(C['rRel3']), -32)
add('callback: left strap takes his weight', taut(0.24, 90), F(C['standL2d']) - 0.3, -29)
add('callback: right pad seats higher', tock(1850), F(C['rPlace3']) - 0.03, -26)
add('the tips meet the brick (sparse grit)', ticks(0.5, 9, 2600), F(1022), -36)
add('wedges skid on the brick', scrape(0.6) * 0.6, F(1044), -38)
add('pad pressed onto the brick (gritty contact)', lp(scrape(0.12), 3000), F(BK['place']), -34)
add('the pad slips down the brick (dry)', scrape(0.75), F(BK['slip0']), -30)
add('the test mass lands on the bench', thunk(), F(BK['thud']) - 0.02, -27)
add('he takes the pad back', scuff(0.12), F(BK['grab']), -38)
add('carriage slides back (glass in)', slide(0.6), F(BK['back0']), -35)
add('pad seats on the glass (into the loop)', tock(), F(BK['seat']) - 0.02, -24)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.45 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 15 - lufs(music * duck))
sfx_l = sfx * db(3) * (1 - 0.35 * np.clip(ve * 6, 0, 1))
mix = voice_l + mus_l + sfx_l
g = -14 - lufs(np.stack([mix, mix], 1))
mix *= db(g)
lim = db(-1.5)
if np.abs(mix).max() > lim:
    mix = np.tanh(mix / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix.wav'), os.path.join(EP, 'audio/mix/FGW_Glass_Climbing_V1_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
