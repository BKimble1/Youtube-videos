#!/usr/bin/env python3
"""Sound design and mix for FGW Sea Slug Regeneration V1 (and V2: run with the argument V2).

The narration (ElevenLabs Test Voice, take 1) is used sample for sample (gain only). Everything else is synthesised
here (no samples, no third-party music), placed on the picture's event frames (audio/cues.json, exported from
source/src/shots.ts by tools/export_cues.ts), and kept under the voice:
  * a faint, slightly eerie lab bed (opening and ending; it loops seamlessly across the end → start),
  * a soft organic stretch and muted pop at each separation (the hook's stretch begins in the ending and wraps),
  * the brush touch and the body's two small flinches,
  * a reversed swell for the rewind, a dark-teal bed for the anatomy, a soft tone on the weak spot,
  * a hush for the zoom into tissue and back out,
  * a shallow-water bed on the seabed, small soft sips while the head feeds, quiet day ticks for the week,
  * one restrained heartbeat cue (three beats, fading) when the new heart starts beating,
  * a slow, warm swell under the regrowth,
  * one controlled accent on TWICE.
Levels: voice about -17 LUFS, beds 16-20 LU under it and ducked under speech, the whole at -14 LUFS, -1.5 dBFS peak.
Outputs: source/public/audio/mix.wav, audio/mix/FGW_SeaSlug_V1_mix.wav, audio/mix/stems/*.wav, audio/mix/mix_measure.json,
         audio/sfx_cues.json"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
# V2 (`make_audio.py V2`): the same voice, beds and synthesis, retimed to the V2 picture (audio/cues_v2.json)
VER = sys.argv[1] if len(sys.argv) > 1 else 'V1'
V3 = VER in ('V3', 'V4')  # V4 uses the V3 event set on its own frames
V2 = VER in ('V2', 'V3', 'V4')  # V3 shares the V2 cue layout and choices, plus its own events below
cj = json.load(open(os.path.join(EP, {'V1': 'audio/cues.json', 'V2': 'audio/cues_v2.json', 'V3': 'audio/cues_v3.json', 'V4': 'audio/cues_v4.json'}[VER])))
FR = cj['frames']
DUR = FR / 30
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2021)
F = lambda fr: fr / 30.0
Sx = cj['S']


def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR  # whole cycles over the film: periodic beds loop seamlessly
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def circ(fn, x): return fn(np.concatenate([x, x, x]))[2 * len(x):]  # filter as if periodic (no edge at the loop)
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)


def place(buf, sig, at):
    i = int(round(at * SR))
    idx = (np.arange(len(sig)) + i) % N
    np.add.at(buf, idx, sig)


# ---------------- voice (unchanged) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_SeaSlug_narration_V1.wav'))
assert vsr == SR and abs(len(v) - N) <= 1, (vsr, len(v), N)
voice = np.zeros(N)
voice[:min(N, len(v))] = v[:N]

# ---------------- beds ----------------
def pad(freqs, rate=0.08):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * loopf(rate + 0.027 * k) * t + 1.7 * k)
        out += a * lfo * np.sin(2 * np.pi * loopf(f) * t + 0.9 * k)
    return out

lab_w = np.clip(win(0, F(Sx['weak'] + 12), 0.01, 0.6) + win(F(Sx['twice']), DUR, 0.15, 0.01), 0, 1)
teal_w = win(F(Sx['weak'] + 6), F(Sx['feed']), 0.6, 0.12)
sea_w = win(F(Sx['feed']), F(Sx['twice']), 0.08, 0.12)
grow_w = np.clip((t - F(Sx['grow'])) / (F(Sx['twice']) - F(Sx['grow'])), 0, 1) * win(F(Sx['grow']), F(Sx['twice']), 0.5, 0.1)
micro_w = win(F(cj['in0'] + 12), F(cj['out0'] + 10), 0.4, 0.4)

air = circ(lambda x: lp(hp(x, 700), 3200), noise(N)) * 0.05
eerie = circ(lambda x: lp(x, 900), pad([(65.41, 0.5), (98.0, 0.3), (138.59, 0.12), (146.83, 0.1), (261.6, 0.05), (277.2, 0.035)]))
lab_bed = (eerie * 0.55 + air) * lab_w
teal_bed = circ(lambda x: lp(x, 700), pad([(55.0, 0.5), (82.41, 0.3), (110.0, 0.16), (164.81, 0.08), (207.65, 0.04)], 0.06)) * 0.6 * teal_w
hush = circ(lambda x: lp(hp(x, 1800), 7000), noise(N)) * 0.05 + circ(lambda x: lp(x, 400), pad([(73.42, 0.4), (220.0, 0.1)])) * 0.3
micro_bed = hush * micro_w
brown = np.cumsum(noise(N)); brown -= np.convolve(brown, np.ones(4801) / 4801, 'same'); brown /= np.abs(brown).max() + 1e-9
water = circ(lambda x: lp(x, 520), brown) * (0.6 + 0.4 * np.sin(2 * np.pi * loopf(0.13) * t)) * 0.9
sea_bed = (water + circ(lambda x: lp(x, 600), pad([(87.31, 0.3), (130.81, 0.16)])) * 0.25) * sea_w
# bubbles: a few soft rising blips on the seabed
bub = np.zeros(N)
for k in range(9):
    at = F(Sx['feed']) + 0.4 + k * 0.53 * (1 + 0.4 * rng.random()) * 1.6
    if at > F(Sx['twice']) - 0.3: break
    n = int(0.07 * SR); tt = np.arange(n) / SR
    f0 = 500 + 400 * rng.random()
    place(bub, np.sin(2 * np.pi * (f0 * tt + 2500 * tt * tt)) * np.exp(-tt / 0.02) * 0.12, at)
# regrowth swell: warm major chord opening up
swell = circ(lambda x: lp(x, 1800), pad([(130.81, 0.32), (164.81, 0.24), (196.0, 0.22), (246.94, 0.14), (329.63, 0.1), (392.0, 0.06)], 0.11))
grow_bed = swell * grow_w * 0.8

music = lab_bed + teal_bed + micro_bed + sea_bed + bub + grow_bed

# ---------------- effects ----------------
sfx = np.zeros(N); key = np.zeros(N); log = []

def add(name, sig, at, gain_db, hero=False):
    place(key if hero else sfx, sig * db(gain_db), at)
    log.append({'name': name, 'at': round(at % DUR, 3), 'frame': round((at % DUR) * 30, 1), 'dur': round(len(sig) / SR, 3), 'gain_db': gain_db, 'hero': hero})

def stretch(d):
    """soft wet stretching: band noise whose formant slides down and narrows, rising in level"""
    n = int(d * SR); tt = np.arange(n) / SR; u = tt / d
    x = noise(n)
    a = bp(x, 380, 1400) * (0.3 + 0.7 * u ** 1.5)
    b = bp(x, 900, 2600) * (1 - u) * 0.4
    wob = 1 + 0.35 * np.sin(2 * np.pi * 7 * tt)
    e = np.minimum(1, tt / 0.08) * np.minimum(1, (d - tt) / 0.04)
    return (a + b) * wob * e * 0.5

def pop():
    """a muted, organic parting: a soft low 'plip', no snap"""
    n = int(0.22 * SR); tt = np.arange(n) / SR
    f = 210 * np.exp(-tt / 0.05) + 85
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.045)
    wet = lp(noise(n), 1600) * np.exp(-tt / 0.012) * 0.25
    return body * 0.9 + wet

def squish(d=0.18):
    n = int(d * SR); tt = np.arange(n) / SR
    x = bp(noise(n), 250, 1200) * np.exp(-tt / (d / 3))
    f = 160 * np.exp(-tt / 0.06) + 70
    return x * 0.6 + 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.05)

def bristle(d=0.16):
    n = int(d * SR); tt = np.arange(n) / SR
    return hp(noise(n), 3500) * np.sin(np.pi * tt / d) ** 2 * 0.35

def swish(d, up=True):
    n = int(d * SR); tt = np.arange(n) / SR; u = tt / d
    e = (u ** 2 if up else (1 - u) ** 2) * np.sin(np.pi * np.clip(u, 0, 1)) ** 0.5
    lo, hi = (600, 4200) if up else (300, 2400)
    return bp(noise(n), lo, hi) * e * 0.5

def chime(f0=1318.5):
    n = int(1.6 * SR); tt = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f0 * m * tt) for m, a in [(1, 1), (1.5, 0.35), (2, 0.2)]) * np.exp(-tt / 0.45) * np.minimum(1, tt / 0.01) * 0.25

def shimmer(d=0.9):
    n = int(d * SR); tt = np.arange(n) / SR; u = tt / d
    return sum(np.sin(2 * np.pi * f * tt + k) for k, f in enumerate([1760, 2217, 2637, 3520])) * np.sin(np.pi * u) ** 2 * 0.06

def sip():
    n = int(0.09 * SR); tt = np.arange(n) / SR
    f = 700 + 900 * tt / 0.09
    return lp(noise(n), 2500) * np.exp(-tt / 0.02) * 0.25 + np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.018) * 0.3

def tick():
    n = int(0.05 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt / 0.006) * 0.4 + hp(noise(n), 4000) * np.exp(-tt / 0.002) * 0.2

def lubdub():
    """one heartbeat: two soft, low, rounded thumps"""
    out = np.zeros(int(0.7 * SR))
    for off, amp, f0 in [(0.0, 1.0, 62), (0.2, 0.62, 74)]:
        n = int(0.22 * SR); tt = np.arange(n) / SR
        f = f0 * (1 + 0.6 * np.exp(-tt / 0.02))
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.055) * np.minimum(1, tt / 0.004)
        s += lp(noise(n), 300) * np.exp(-tt / 0.03) * 0.15
        i = int(off * SR); out[i:i + n] += s * amp
    return out

def boom():
    n = int(1.6 * SR); tt = np.arange(n) / SR
    f = 48 + 30 * np.exp(-tt / 0.08)
    low = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.45) * np.minimum(1, tt / 0.006)
    return low * 0.9 + bp(noise(n), 2000, 7000) * np.exp(-tt / 0.08) * 0.05

# the hook's separation: the stretch starts in the ending (the neck begins to pull on TWICE) and wraps into the first frames
add('neck stretch (wraps the loop)', stretch(F(FR - cj['loopGap0'] + cj['brk'])), F(cj['loopGap0']), -24)
add('neck parts (hook)', pop(), F(cj['brk']), -19, hero=True)
if V2:
    add('probe tap', tick(), F(cj['touch']), -30)
else:
    add('brush bristles', bristle(), F(cj['touch'] - 2), -24)
add('body flinch', squish(0.2), F(cj['touch'] + 1), -19, hero=True)
add('body flinch 2', squish(0.16), F(cj['move'] - 2), -22)
if V3:
    add('contraction ripple', squish(0.28), F(cj['ripple']), -27)
add('rewind swell', swish(F(cj['rew1'] - cj['rew0']) + 0.1, up=True)[::-1], F(cj['rew0']), -24)
add('weak spot tone', chime(), F(cj['weak']), -27)
add('cutaway reveal' if V2 else 'x-ray reveal', shimmer(0.9), F(cj['join'] if V2 else cj['xray']), -22 if V2 else -20)
add('neck stretch (anatomy)', stretch(F(cj['brk2'] - cj['brk2start'])), F(cj['brk2start']), -25)
add('neck parts (anatomy)', pop(), F(cj['brk2']), -21, hero=True)
add('zoom in hush', swish(F(cj['in1'] - cj['in0']), up=True), F(cj['in0']), -25)
add('zoom out', swish(F(cj['out1'] - cj['out0']), up=False), F(cj['out0']), -25)
add('seabed arrival (water swell)', lp(noise(int(0.8 * SR)), 900) * np.sin(np.pi * np.arange(int(0.8 * SR)) / int(0.8 * SR)) * 0.4, F(Sx['feed']) - 0.2, -22)
if V2:
    k = 0
    while cj['suck'] + 3 + k * cj['pumpPer'] < Sx['heart'] - 2:
        add(f'sip {k + 1}', sip(), F(cj['suck'] + 3 + k * cj['pumpPer']), -24 - k)
        k += 1
else:
    for k in range(5):
        add(f'sip {k + 1}', sip(), F(cj['arrive'] + 6 + k * 7), -24 - k)
for k, fr in enumerate(cj['days']):
    if fr < Sx['grow']:
        add(f'day tick {k + 1}', tick(), F(fr), -33 if V3 else -31)
    elif V3 and k % 3 == 0:
        add(f'day tick {k + 1}', tick(), F(fr), -35)
# the new heart: V2 holds the beat (five beats, on the picture's own beat frames, easing away into the regrowth)
for k, g in enumerate([-20, -21, -29, -34] if V3 else [-21, -23, -26, -29, -33] if V2 else [-21, -25, -30]):
    add(f'heartbeat {k + 1}', lubdub(), F(cj['beat'] + k * cj['beatPer']) - 0.01, g, hero=True)
add('lab air on the cut', swish(0.4, up=False), F(Sx['twice']) - 0.05, -30)
add('TWICE accent', boom(), F(cj['twice']) - 0.02, -22, hero=True)
add('TWICE shimmer', shimmer(1.1), F(cj['twice']), -24)

# ---------------- mix ----------------
meter = pyln.Meter(SR)
venv = np.sqrt(np.convolve(voice ** 2, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same'))
duck = 1 - 0.45 * np.clip(venv / (np.percentile(venv[venv > 1e-4], 60) + 1e-9), 0, 1)
duck = np.convolve(duck, np.ones(int(0.08 * SR)) / int(0.08 * SR), 'same')

def to_lufs(x, target):
    l = meter.integrated_loudness(x)
    return x * db(target - l), l

voice_n, voice_l = to_lufs(voice, -17)
music_n, _ = to_lufs(music, -35)
mix = voice_n + music_n * duck + sfx * duck * 2.2 + key * 2.2
mix_l = meter.integrated_loudness(mix)
mix *= db(-14 - mix_l)
peak = np.abs(mix).max()
if peak > db(-1.5):
    # gentle soft-knee limit on the rare peaks (the voice stays unclipped and unaltered in shape)
    thr = db(-3)
    over = np.abs(mix) > thr
    mix[over] = np.sign(mix[over]) * (thr + (db(-1.5) - thr) * np.tanh((np.abs(mix[over]) - thr) / (db(-1.5) - thr)))
final_l = meter.integrated_loudness(mix)

MD = {'V1': 'audio/mix', 'V2': 'audio/mix_v2', 'V3': 'audio/mix_v3', 'V4': 'audio/mix_v4'}[VER]
os.makedirs(os.path.join(EP, MD, 'stems'), exist_ok=True)
sf.write(os.path.join(EP, {'V1': 'source/public/audio/mix.wav', 'V2': 'source/public/audio/mix_v2.wav', 'V3': 'source/public/audio/mix_v3.wav', 'V4': 'source/public/audio/mix_v4.wav'}[VER]), mix, SR, subtype='PCM_24')
sf.write(os.path.join(EP, MD, f'FGW_SeaSlug_{VER}_mix.wav'), mix, SR, subtype='PCM_24')
g = db(-14 - mix_l)
for name, x in [('voice', voice_n * g), ('beds', music_n * duck * g), ('effects', (sfx * duck * 2.2 + key * 2.2) * g)]:
    sf.write(os.path.join(EP, MD, f'stems/{name}.wav'), x, SR, subtype='PCM_24')
# speech clarity: voice vs everything else in the 300-4000 Hz band, while speech is present
others = (music_n * duck + sfx * duck * 2.2 + key * 2.2) * g
vb, ob = bp(voice_n * g, 300, 4000), bp(others, 300, 4000)
speech = venv > np.percentile(venv, 40)
snr = 10 * np.log10(np.mean(vb[speech] ** 2) / (np.mean(ob[speech] ** 2) + 1e-12))
seam = float(np.abs(mix[0] - mix[-1]))
meas = {'duration_s': DUR, 'frames': FR, 'integrated_lufs': round(final_l, 2), 'peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_lufs_in_mix': round(meter.integrated_loudness(voice_n * g), 2), 'voice_to_rest_db_300_4000hz_during_speech': round(snr, 1),
        'loop_seam_sample_jump': round(seam, 5),
        'voice_correlation_with_source': round(float(np.corrcoef(voice_n, voice)[0, 1]), 6)}
json.dump(meas, open(os.path.join(EP, MD, 'mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, {'V1': 'audio/sfx_cues.json', 'V2': 'audio/sfx_cues_v2.json', 'V3': 'audio/sfx_cues_v3.json', 'V4': 'audio/sfx_cues_v4.json'}[VER]), 'w'), indent=1)
print(json.dumps(meas, indent=1))
print(len(log), 'effect cues')
