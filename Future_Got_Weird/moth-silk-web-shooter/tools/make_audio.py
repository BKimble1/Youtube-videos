#!/usr/bin/env python3
"""Score, effects and mix for FGW "Real Web Fluid". The narration is the single ElevenLabs take, unchanged
(sample-for-sample, gain only) at 0 s, so picture sync is its measured word timeline. Everything else is synthesised
here (no samples, no paid generation, no third-party music) and sits well under the voice. Method and levels follow the
invisibility-shield mixes (tools/make_audio_v5.py there): voice at -17 LUFS, bed ~14 LU under it and ducked under
speech, effects under the voice, the whole at -14 LUFS with a -1.5 dBFS ceiling, and a loop-continuous bed.
  - bed: the imagined chase gets a low D-minor pad and a tight pulse; the lab and the process get a light plucked
    figure over a warmer pad; a soft resolve under "made from moth silk"; the slow-motion drops the pulse out;
  - effects from the picture (audio/cues.json, from tools/export_cues.ts): every footfall in the street (his heavier
    shoes, her trainers, levelled by distance), the imagined device's charge and spray, the slowed flight, the strand
    sticking, the tension and the jacket tug, the recovery step; the lab's room tone, cocoon taps; fibers lifting,
    dissolving, the draw into the reservoir, the pump, the cutaway, the two flows, the hardening; the fiber's flight,
    the tick on the metal, tension, sand shifting and falling, the blade coming free, the landing in the tray, the wand
    set down. Nothing cartoonish, no booms, no voices.
Inputs : audio/narration/FGW_Moth_Silk_narration_final.wav, audio/cues.json
Outputs: source/public/audio/mix.wav, audio/mix/FGW_Moth_Silk_mix.wav, audio/mix/stems/*.wav,
         audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, math, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, WORDS, STEPS, ST, LB, MA = cj['DUR'], cj['WORDS'], cj['steps'], cj['street'], cj['lab'], cj['macro']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(31)
w = lambda word, n=0: [x for x in WORDS if x['word'] == word][n]['start']

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

# ---------------- voice (unchanged) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Moth_Silk_narration_final.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- bed (loop-continuous: every partial completes whole cycles over the film) ----------------
street = np.clip(1 - win(ST['end'] + 0.15, DUR - 0.55, 0.45, 0.5), 0, 1)  # the chase colour, back again at the seam
lab = 1 - street
slow = win(ST['slow']['a1'], ST['slow']['b0'], 0.3, 0.45)
def pad(freqs, rate=0.11):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.72 + 0.28 * np.sin(2 * np.pi * loopf(rate + 0.035 * k) * t + k)
        out += a * lfo * np.sin(2 * np.pi * loopf(f) * t)
    return out
pad_dm = circ(lambda x: lp(x, 520), pad([(73.42, 0.5), (110.0, 0.3), (146.83, 0.16), (174.61, 0.1)]))
pad_f = circ(lambda x: lp(x, 900), pad([(87.31, 0.45), (130.81, 0.28), (174.61, 0.16), (220.0, 0.12), (261.63, 0.06)], 0.09))
beats = int(round(DUR / 0.31)); bpd = DUR / beats
pulse = np.zeros(N)
for k in range(beats):
    n = int(0.22 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.06) + 0.25 * bp(rng.standard_normal(n), 1800, 6000) * np.exp(-tt / 0.008)
    place(pulse, s * (0.8 if k % 2 == 0 else 0.4), k * bpd)
notes = [698.46, 880.0, 1046.5, 880.0, 783.99, 659.26, 698.46, 587.33]  # F5 A5 C6 A5 G5 E5 F5 D5
steps8 = int(round(DUR / 0.31)); sp = DUR / steps8
pluck = np.zeros(N)
for k in range(steps8):
    f = loopf(notes[k % len(notes)]); n = int(0.45 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.09) * env(n, 0.003, 0.05)
    place(pluck, s * (0.5 + 0.5 * (k % 4 == 0)), k * sp)
resolve = win(w('made') - 0.1, DUR - 0.2, 0.5, 0.4)
music = (pad_dm * street * 0.95 + pulse * 0.55 * street * (1 - 0.92 * slow)
         + pad_f * lab * (0.8 + 0.35 * resolve) + pluck * lab * (0.07 + 0.03 * win(MA['t0'], MA['t1'], 0.4, 0.4)) * (1 - 0.6 * resolve))

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db):
    place(sfx, sig * db(gain_db), at); log.append({'name': name, 'at': round(at % DUR, 3), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1)})
def noise(n): return rng.standard_normal(n)
def mixs(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out
def soft_air(d, lo, hi, rise=True):
    n = int(d * SR); tt = np.linspace(0, 1, n); x = noise(n); out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]; fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return lp(out, hi * 1.2) * np.sin(np.pi * tt) ** 1.6
def thud(f=90, d=0.25, nzk=0.3):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.05) + nzk * lp(noise(n), 500) * np.exp(-tt / 0.02)
def tick(f=3200, d=0.05, tau=0.008):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau)
def clink(f=2400, d=0.25, tau=0.04):
    n = int(d * SR); tt = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2.76, 0.5), (5.4, 0.25)]) * np.exp(-tt / tau)
def boot(d=0.2):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (110 + 25 * rng.random()) * tt) * np.exp(-tt / 0.022) + 0.3 * lp(noise(n), 900) * np.exp(-tt / 0.012) + 0.2 * bp(noise(n), 700, 3800) * np.exp(-tt / 0.03)
def sneaker(d=0.12):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.6 * np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / 0.012) + 0.4 * bp(noise(n), 1500, 6000) * np.exp(-tt / 0.02)
def rustle(d=0.4):
    n = int(d * SR)
    return bp(noise(n), 1200, 6500) * env(n, 0.05, 0.25) * (0.6 + 0.4 * np.sin(np.linspace(0, 9, n)))
def creak(d=0.3, f0=420):
    n = int(d * SR); tt = np.arange(n) / SR
    f = f0 + 120 * np.sin(2 * np.pi * 3 * tt)
    return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + 0.3 * noise(n), 400, 2200) * env(n, 0.03, 0.12)
def sweep(f0, f1, d):
    n = int(d * SR); ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / SR
    return (np.sin(ph) + 0.2 * np.sin(2 * ph)) * env(n, 0.1, 0.2)
def spray(d=0.35):
    # a short pressurised squirt: bright noise with a fast attack and a wet low body
    n = int(d * SR); tt = np.arange(n) / SR
    body = bp(noise(n), 300, 1400) * np.exp(-tt / 0.08)
    hiss = bp(noise(n), 2500, 9000) * np.exp(-tt / 0.12)
    return (0.6 * body + hiss) * env(n, 0.004, 0.08)
def wet_tap(d=0.18):
    n = int(d * SR); tt = np.arange(n) / SR
    return 0.7 * np.sin(2 * np.pi * (260 - 120 * tt / d) * tt) * np.exp(-tt / 0.03) + 0.4 * bp(noise(n), 1500, 5000) * np.exp(-tt / 0.012)
def bubbles(d, rate=9.0):
    out = np.zeros(int(d * SR))
    k = 0
    while True:
        at = (k + rng.random()) / rate
        if at > d - 0.06: break
        n = int(0.05 * SR); tt = np.arange(n) / SR; f = 700 + 900 * rng.random()
        b = np.sin(2 * np.pi * (f + 900 * tt / 0.05) * tt) * np.exp(-tt / 0.012)
        i = int(at * SR); out[i:i + n] += b * (0.4 + 0.6 * rng.random())
        k += 1
    return out * env(len(out), 0.1, 0.2)
def flow(d, lo, hi):
    n = int(d * SR); tt = np.arange(n) / SR
    return bp(noise(n), lo, hi) * (0.75 + 0.25 * np.sin(2 * np.pi * 3.3 * tt)) * env(n, 0.25, 0.3)
def shimmer(d=1.1, f=1567.98):
    n = int(d * SR); tt = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * tt + 0.3 * np.sin(2 * np.pi * 5 * tt)) for m, a in [(1, 1), (1.5, 0.4), (2.0, 0.25)])
    return s * np.exp(-tt / 0.45) * env(n, 0.06, 0.3)
def crackle(d, rate=60.0):
    out = np.zeros(int(d * SR)); k = 0
    while True:
        at = (k + rng.random()) / rate
        if at > d - 0.01: break
        c = tick(3500 + 3000 * rng.random(), 0.01, 0.0015)
        i = int(at * SR); out[i:i + len(c)] += c * rng.random()
        k += 1
    return out * env(len(out), 0.05, 0.2)
def grains(d, rate):
    out = np.zeros(int(d * SR)); k = 0
    while True:
        at = (k + rng.random()) / rate
        if at > d - 0.02: break
        c = bp(noise(int(0.012 * SR)), 2500, 9000) * np.exp(-np.arange(int(0.012 * SR)) / SR / 0.002)
        i = int(at * SR); out[i:i + len(c)] += c * (0.3 + 0.7 * rng.random())
        k += 1
    return out
def hum(d, f=110):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) * 0.6 + 0.3 * np.sin(2 * np.pi * 2 * f * tt) + 0.2 * bp(noise(n), 200, 900)) * env(n, 0.06, 0.12)
def lvl(dist, ref=2.5, lo=-10.0, hi=4.0): return float(np.clip(-20 * math.log10(max(0.2, dist) / ref), lo, hi))

# street
for k, s in enumerate(STEPS):
    if s['who'] == 'runner': add(f'runner step {k}', boot(), s['t'] - 0.004, -28 + lvl(s['dist']))
    else: add(f'her step {k}', sneaker(), s['t'] - 0.004, -30 + lvl(s['dist']))
add('the bag swings (rustle)', rustle(0.5), 0.05, -38)
add('device charges (rising whine)', sweep(900, 2600, 0.38), ST['eject'] - 0.38, -38)
add('device click', tick(2600, 0.04), ST['eject'] - 0.02, -33)
add('liquid spray', spray(0.4), ST['eject'], -27)
add('time slows (air drops)', soft_air(0.9, 1600, 180, rise=False), ST['slow']['a0'], -32)
add('the jet in flight (soft hiss)', flow(1.7, 2500, 7000) * 0.6, 1.55, -40)
add('the strand thins (shimmer)', shimmer(1.2, 1975.5) * 0.5, 2.3, -40)
add('the strand sticks', wet_tap(), ST['hit'], -27)
add('time returns (air rises)', soft_air(0.6, 200, 1400), ST['slow']['b0'] + 0.1, -36)
add('slack straightens (creak)', creak(0.3, 520) * 0.5, ST['taut'] - 0.28, -40)
add('thread tension', creak(0.35, 380), ST['taut'] - 0.02, -33)
add('jacket tug (cloth)', thud(120, 0.18, 0.5) * 0.7 + 0.0, ST['taut'] + 0.03, -31)
add('jacket tug (rustle)', rustle(0.3), ST['taut'] + 0.03, -35)
add('the bag swings forward', rustle(0.35) * 0.7, ST['taut'] + 0.12, -38)
add('into the lab (soft swish)', soft_air(0.5, 1800, 500, rise=False), ST['end'] - 0.3, -40)
# lab: room tone through the bench shots
room = flow(LB['macro'] - ST['end'], 120, 600) * 0.4
add('lab room tone (1)', room, ST['end'], -46)
add('lab room tone (2)', flow(DUR - LB['back'], 120, 600) * 0.4, LB['back'], -46)
add('cocoon picked up (tap)', tick(900, 0.05, 0.006) * 0.8, LB['grasp'][1] - 0.05, -40)
add('cocoon set down (tap)', thud(240, 0.08, 0.2) * 0.6, LB['set'][1] - 0.02, -38)
# process
add('fibers lift away (silky)', flow(1.5, 4000, 11000) * 0.5 + 0.0, 8.9, -41)
add('fibers lift away (shimmer)', shimmer(1.4, 2349.3) * 0.35, 9.0, -41)
add('dissolving (bubbles)', bubbles(1.2, 7.0), LB['macro'] + 1.3, -40)
add('drawn into the reservoir (gurgle)', flow(0.8, 250, 900), 10.85, -39)
add('pump starts (click)', tick(1800, 0.05), 11.88, -38)
add('pump runs (hum)', hum(4.2, 98) * 0.35, 11.9, -44)
add('the cutaway opens (slide)', soft_air(0.5, 600, 2400), 12.5, -40)
add('silk solution flowing', flow(2.9, 200, 800) * 0.8, 12.0, -42)
add('acetone flowing (hiss)', flow(1.6, 3000, 9000) * 0.6, 13.3, -42)
add('hardening (fine crackle)', crackle(0.75, 55), 14.85, -40)
add('the fiber pulls away', soft_air(1.0, 900, 2400), 15.5, -41)
# lab: the experiment
add('fiber in flight (hiss)', flow(2.5, 3500, 9000) * 0.5, LB['flight']['t0'] + 0.1, -42)
add('fiber meets the metal (tick)', clink(3400, 0.12, 0.015) * 0.6, LB['contact'], -32)
add('fiber meets the metal (sticky)', wet_tap(0.12) * 0.5, LB['contact'], -38)
add('the pull (wand moves)', soft_air(0.5, 500, 1600), LB['pull0'], -40)
add('fiber goes taut (tension)', creak(0.3, 600) * 0.7, LB['taut'] - 0.04, -36)
add('sand shifts', grains(0.9, 70) + 0.3 * bp(noise(int(0.9 * SR)), 800, 3000) * env(int(0.9 * SR), 0.1, 0.3), LB['slide']['t0'], -38)
add('sand falls', grains(0.9, 45), LB['slide']['t1'] - 0.15, -38)
add('blade comes free (ring)', clink(2100, 0.6, 0.12) * 0.45, LB['slide']['t1'], -36)
for k, at in enumerate([24.6, 25.75, 26.9]):
    add(f'late grain {k + 1}', tick(5200, 0.02, 0.002), at + 0.12, -42)
add('carried to the tray (air)', soft_air(0.9, 300, 900), LB['carry0'], -44)
add('blade touches the tray', clink(2700, 0.3, 0.05), LB['touch'], -31)
add('blade lies down', mixs(clink(2300, 0.25, 0.035) * 0.7, thud(300, 0.1, 0.1) * 0.3), LB['flat'], -33)
add('wand set down', mixs(thud(260, 0.12, 0.3) * 0.7, tick(1500, 0.03) * 0.4), LB['rest1'] - 0.02, -37)

# ---------------- mix ----------------
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.45 * np.clip(ve * 6, 0, 1)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 14 - lufs(music * duck))
sfx_l = sfx * (1 - 0.35 * np.clip(ve * 6, 0, 1))
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
shutil.copy(os.path.join(EP, 'source/public/audio/mix.wav'), os.path.join(EP, 'audio/mix/FGW_Moth_Silk_mix.wav'))
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
