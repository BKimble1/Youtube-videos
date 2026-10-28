#!/usr/bin/env python3
"""Bed, effects and mix for FGW "Transparent Mouse Skin" V2 (hook and retention rebuild). The same accepted narrator
take as V1 (sample for sample, gain only) and the same synthesised bed (pad, air, soft forward pulse, dipped under
"Without making a single cut"); the effects follow the V2 picture: the swab brushing in the hook, the wipe back in time,
the drop of food colouring landing in the dish, the swab dipping and rubbing, the dive into the tissue, light bending
and scattering, the dye flowing in, the rays settling, the pull-out, the rinse (squirt, trickle, drips), and the next
sweep beginning under the last half second so the loop runs into the opening brush. Effects are ducked under speech
and sit well below the voice. No animal sounds, no breathing effects, no heartbeat, no sting, no subscribe cue.
Everything is synthesised here (no samples, no third-party music).
Levels as V1: voice at -17 LUFS (mono) before the final gain, bed 18 LU under it and ducked under speech, the whole at
-14 LUFS with a -1.5 dBFS sample ceiling (true peak checked separately with ffmpeg).
Inputs : audio/narration/FGW_Transparent_Mouse_Skin_narration_V1.wav, audio/beats_v2.json (tools/export_beats_v2.ts)
Outputs: source/public/audio/mix_v2.wav, audio/mix_v2/FGW_Transparent_Mouse_Skin_V2_mix.wav, audio/mix_v2/stems/*.wav,
         audio/mix_v2/mix_measure.json, audio/sfx_cues_v2.json"""

import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
bj = json.load(open(os.path.join(EP, 'audio/beats_v2.json')))
DUR, Bt, WORDS = bj['duration'], bj['beats'], bj['words']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(29)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def loopf(f): return round(f * DUR) / DUR  # whole cycles over the film: the bed loops seamlessly
def db(x): return 10 ** (x / 20)
def env(n, a, r):
    e = np.ones(n); na = min(n, max(1, int(a * SR))); nr = min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
def noise(n): return rng.standard_normal(n)

# ---------------- voice (unchanged samples) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Transparent_Mouse_Skin_narration_V1.wav'))
assert vsr == SR and abs(len(v) - N) <= 1, (vsr, len(v), N)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]

# ---------------- bed: low uneasy pad (A with a flat second above), air, a soft forward pulse ----------------
def pad(freqs, rate=0.1):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * loopf(rate + 0.03 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * loopf(f) * t)
    return out
pad_main = circ(lambda x: lp(x, 520), pad([(55.0, 0.5), (82.41, 0.3), (110.0, 0.2), (116.54, 0.07), (164.81, 0.08)]))
pad_air = circ(lambda x: lp(hp(x, 400), 2600), pad([(659.26, 0.07), (698.46, 0.04), (987.77, 0.03)], 0.06))
beats = int(round(DUR / 0.62)); bpd = DUR / beats
pulse = np.zeros(N)
for k in range(beats):
    i = int(round(k * bpd * SR)); n = int(0.32 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 14) * (0.6 if k % 2 else 1.0)
    idx = (np.arange(n) + i) % N
    np.add.at(pulse, idx, s)
pulse = circ(lambda x: lp(x, 180), pulse)
bed = pad_main + 0.6 * pad_air + 0.35 * pulse
# inside the tissue: the air brightens a touch
bed += 0.25 * pad_air * win(Bt['zoom1'], Bt['out0'], 0.6, 0.6)
# duck under speech (gentle), and a deeper dip under "Without making a single cut" so the line lands
speech = np.zeros(N)
for w in WORDS: speech[int(w['start'] * SR):int(w['end'] * SR)] = 1
sm = lp(speech, 4.0, 1)
duck = 1 - 0.35 * np.clip(sm, 0, 1)
w_without = [w for w in WORDS if w['word'] == 'without'][0]['start']
w_cut = [w for w in WORDS if w['word'] == 'cut'][0]['end']
duck *= 1 - 0.55 * win(w_without, w_cut, 0.25, 0.5)
bed *= duck

# ---------------- effects ----------------
fx = np.zeros(N); cues = []
def add(name, sig, at, gain_db):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    ok = idx < N
    np.add.at(fx, idx[ok], sig[ok] * db(gain_db))
    cues.append({'name': name, 'at': round(at, 3), 'dur': round(len(sig) / SR, 3), 'gain_db': gain_db})
def rub(d, rate):  # cotton on skin: soft band-limited friction modulated by the stroke
    n = int(d * SR); tt = np.arange(n) / SR
    m = 0.55 + 0.45 * np.abs(np.sin(np.pi * rate * tt))
    return bp(noise(n), 900, 4200) * m * env(n, 0.06, 0.12)
def tap(d=0.08):
    n = int(d * SR); tt = np.arange(n) / SR
    return lp(noise(n), 1600) * np.exp(-tt * 60)
def whoosh(d, lo, hi, rise=True):
    n = int(d * SR); x = np.linspace(0, 1, n)
    sig = bp(noise(n), lo, hi) * (np.sin(np.pi * x) ** 1.5)
    return sig * (x if rise else (1 - x) + 0.2)
def shimmer(d, f=1760.0):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.5 * tt)) * np.exp(-tt * 1.5) * env(n, 0.3, 0.6)
def squirt(d):
    n = int(d * SR); tt = np.arange(n) / SR
    return bp(noise(n), 1800, 7000) * env(n, 0.02, 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt) ** 2)
def trickle(d):
    n = int(d * SR)
    base = bp(noise(n), 500, 3000) * 0.6
    for k in range(int(d * 14)):  # little bubble plinks
        i = rng.integers(0, n - 2000); m = 1200
        tt = np.arange(m) / SR; f = rng.uniform(900, 2200)
        base[i:i + m] += 0.6 * np.sin(2 * np.pi * f * (1 + 2.5 * tt) * tt) * np.exp(-tt * 70)
    return base * env(n, 0.15, 0.6)
def drip():
    m = 2600; tt = np.arange(m) / SR; f = rng.uniform(1100, 1700)
    return np.sin(2 * np.pi * f * (1 + 3 * tt) * tt) * np.exp(-tt * 55)
def flow(d):  # dye flowing into the water spaces: a low, soft liquid swell
    n = int(d * SR); x = np.linspace(0, 1, n)
    return lp(bp(noise(n), 180, 1400), 900) * np.sin(np.pi * x) ** 1.2

E = Bt['end']
# hook: the swab already brushing at frame 0 (no attack: the loop's last brush runs straight into it)
h = rub(Bt['swabDone'] + 0.15, 2.6); h[:int(0.12 * SR)] *= np.linspace(0.85, 1, int(0.12 * SR))
add('hook brushing', h, 0.0, -27)
add('reveal shimmer', shimmer(1.6, 1318.5), 0.25, -41)
add('tilt drift', whoosh(0.9, 250, 1400), Bt['tilt0'] - 0.1, -36)
add('wipe back in time', whoosh(Bt['wipe1'] - Bt['wipe0'] + 0.25, 400, 3200), Bt['wipe0'] - 0.1, -29)
add('drop lands in dish', drip(), Bt['dropLand'], -27)
add('dye blooms', flow(0.6), Bt['dropLand'] + 0.05, -36)
add('swab dips', trickle(0.35), Bt['dip0'] + 0.05, -33)
add('swab contact', tap(), Bt['contact'] - 0.02, -25)
add('swab rubbing', rub(Bt['rubEnd'] - Bt['contact'], 2.6), Bt['contact'], -28)
add('dive into the tissue', whoosh(Bt['zoom1'] - Bt['zoom0'] + 0.3, 300, 2600), Bt['zoom0'] - 0.1, -27)
add('light bends', shimmer(1.4, 1318.5), Bt['bend'] - 0.05, -38)
add('light scatters', shimmer(1.3, 1244.5), Bt['scatter'] - 0.05, -41)
add('dye flows in', flow(1.6), Bt['dyeIn'] - 0.05, -31)
add('dye enters', shimmer(1.8, 1760.0), Bt['dyeIn'] + 0.1, -38)
add('rays settle', shimmer(1.6, 2093.0), Bt['rebend'] + 0.2, -38)
add('pull out', whoosh(Bt['out1'] - Bt['out0'] + 0.5, 250, 1800, rise=False), Bt['out0'] - 0.05, -29)
add('rinse squirt', squirt(0.45), Bt['rinse0'] - 0.03, -26)
add('rinse trickle', trickle(Bt['rinse1'] - Bt['rinse0'] + 0.8), Bt['rinse0'] + 0.1, -29)
for k, at in enumerate([Bt['rinse1'] + 0.3, Bt['rinse1'] + 0.75, Bt['rinse1'] + 1.35]):
    add(f'drip {k + 1}', drip(), at, -31)
add('skin closes over', shimmer(1.6, 987.8), Bt['hide0'], -43)
# loop: the next sweep starts under the last half second and is still going at the cut back to frame 0
l0 = Bt['loop0'] + 0.35
lb = rub(E - l0 + 0.01, 2.6); lb[-int(0.01 * SR):] = lb[-int(0.01 * SR) - 1]
lb[:int(0.15 * SR)] *= np.linspace(0, 1, int(0.15 * SR)) ** 2
add('loop brushing', lb[:int(round((E - l0) * SR))], l0, -27)
# effects step back under speech (about 4 dB), so they never sit on the narration
fx *= 1 - 0.37 * np.clip(sm, 0, 1)

# ---------------- mix ----------------
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_g = voice * db(-17 - lufs(voice))
bed_g = bed * db(-35 - lufs(bed))
mix = voice_g + bed_g + fx
st = lambda x: lufs(np.stack([x, x], 1))  # the delivered file is two identical channels: measure it as such
mix *= db(-14 - st(mix))
peak = np.abs(mix).max(); ceil = db(-1.5)
if peak > ceil:  # soft limit only the overs
    over = np.abs(mix) > ceil * 0.85
    mix = np.where(over, np.sign(mix) * (ceil * 0.85 + (ceil * 0.15) * np.tanh((np.abs(mix) - ceil * 0.85) / (ceil * 0.15))), mix)
out_dir = os.path.join(EP, 'audio/mix_v2'); os.makedirs(os.path.join(out_dir, 'stems'), exist_ok=True)
for name, x in [('voice', voice_g), ('bed', bed_g), ('fx', fx)]:
    sf.write(os.path.join(out_dir, 'stems', f'{name}.wav'), x, SR, subtype='PCM_24')
final = os.path.join(out_dir, 'FGW_Transparent_Mouse_Skin_V2_mix.wav')
sf.write(final, np.stack([mix, mix], 1), SR, subtype='PCM_24')
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
shutil.copy(final, os.path.join(EP, 'source/public/audio/mix_v2.wav'))
m = {'integrated_lufs_stereo': round(st(mix), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
     'voice_lufs_in_mix_stereo': round(st(voice_g * db(-14 - st(voice_g + bed_g + fx))), 2), 'bed_to_voice_lu': round(lufs(bed_g) - lufs(voice_g), 1),
     'fx_peak_dbfs': round(20 * np.log10(np.abs(fx).max() + 1e-12), 2), 'duration_s': DUR, 'samples': N}
json.dump(m, open(os.path.join(out_dir, 'mix_measure.json'), 'w'), indent=1)
json.dump(cues, open(os.path.join(EP, 'audio/sfx_cues_v2.json'), 'w'), indent=1)
print(m)
