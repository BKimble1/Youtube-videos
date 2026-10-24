#!/usr/bin/env python3
"""V4 score, effects and mix for FGW "Real Web Fluid". The narration is the V1 take, unchanged (sample-for-sample,
gain only, the same level as V1 and V2) at 0 s, so the words keep their measured times; the bed is V2's retimed to the
V4 picture; the effects are retargeted to the V4 picture (audio/cues_v4.json from tools/v4/export_cues_v4.ts). Levels as
V2: voice -17 LUFS, bed ~14 LU under it, effects under the voice, the whole at -14 LUFS with a -1.5 dBFS ceiling.
Restrained: no booms, no blast at the impact.
  - the hook: the trigger click, one crisp liquid release, a short fast air pass with the jet (7 frames), an adhesive
    impact (wet slap, fine sticky spread), the strand drawing tight with a jacket tug, footfalls, the recovery step;
  - the device: fingers relax (glove/cloth), soft rising air into the cartridge window, the solution's slow flow;
  - the lab: room tone, the cocoon pinched (tap) and its fibres drawn out (fine silky stretch), set on the solution,
    the rod stirring (glass taps and swirl), the pump button and hum, the draw and the flows, the cutaway slide, the
    acetone hiss, the hardening crackle, the fibre forming, the tick on the metal, the regrip, the pull and tension,
    sand falling, the blade coming free, the carry, the touch in the tray, the lie-down; a soft air at the seam.
Inputs : audio/narration/FGW_Moth_Silk_narration_final.wav, audio/cues_v4.json
Outputs: source/public/audio/mix_v4.wav, audio/mix/FGW_Moth_Silk_V4_mix.wav, audio/mix/stems_v4/*.wav,
         audio/mix/mix_measure_v4.json, audio/sfx_cues_v4.json"""
import json, math, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v4.json')))
DUR, WORDS, ST, DV, LB = cj['DUR'], cj['WORDS'], cj['street'], cj['device'], cj['lab']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(37)
w = lambda word, n=0: [x for x in WORDS if x['word'] == word][n]['start']
F = lambda fr: fr / 30.0

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

# ---------------- bed (V1's, retimed: the chase colour until the camera is inside the strand) ----------------
street = np.clip(1 - win(DV['start'] + 0.5, DUR - 0.55, 0.5, 0.5), 0, 1)
lab = 1 - street
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
notes = [698.46, 880.0, 1046.5, 880.0, 783.99, 659.26, 698.46, 587.33]
steps8 = int(round(DUR / 0.31)); sp = DUR / steps8
pluck = np.zeros(N)
for k in range(steps8):
    f = loopf(notes[k % len(notes)]); n = int(0.45 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.09) * env(n, 0.003, 0.05)
    place(pluck, s * (0.5 + 0.5 * (k % 4 == 0)), k * sp)
resolve = win(w('made') - 0.1, DUR - 0.2, 0.5, 0.4)
inside = win(DV['fill'] - 0.3, LB['match'] - 0.2, 0.3, 0.4)
music = (pad_dm * street * 0.95 + pulse * 0.55 * street * (1 - 0.7 * win(DV['start'], DV['fill'], 0.3, 0.3))
         + pad_f * lab * (0.8 + 0.35 * resolve) + pluck * lab * (0.07 + 0.03 * win(LB['cut0'], LB['harden0'], 0.4, 0.4)) * (1 - 0.6 * resolve) * (1 - 0.6 * inside))

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


def splat(d=0.3):
    # adhesive impact: a soft wet slap with a short sticky tail (no blast)
    n = int(d * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (180 - 90 * tt / d) * tt) * np.exp(-tt / 0.035)
    wet = bp(noise(n), 700, 3500) * np.exp(-tt / 0.045)
    return (0.7 * body + 0.6 * wet) * env(n, 0.002, 0.08)
def stretch(d=0.35):
    # the web spreading: fine sticky crackle that rises and settles
    return crackle(d, 90) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 0.6

# ---------------- the hook ----------------
prev = -1
for k, s in enumerate(cj['steps']):
    if s['t'] - prev < 0.1: continue
    prev = s['t']
    add(f'runner footfall {k}', boot(), s['t'] - 0.004, -32 + 8 * min(1, (s['zoom'] - 1) / 2))
add('aim completing (air)', soft_air(0.2, 500, 1500), 0.0, -40)
add('trigger click', tick(2600, 0.04), ST['fire'] - 0.03, -33)
add('liquid release (crisp)', spray(0.2), ST['fire'], -27)
add('the jet passes (fast air)', soft_air(0.24, 900, 4200), ST['fire'] + 0.02, -31)
add('adhesive impact', splat(0.3), ST['hit'], -26)
add('the web spreads (sticky stretch)', stretch(0.4), ST['hit'] + 0.02, -34)
add('the bag swings (rustle)', rustle(0.45), 0.1, -40)
add('strand draws tight (tension)', creak(0.3, 460), ST['taut'] - 0.1, -33)
add('jacket tug (cloth)', thud(120, 0.18, 0.5) * 0.7, ST['taut'] + 0.02, -32)
add('jacket tug (rustle)', rustle(0.3), ST['taut'] + 0.02, -36)
add('recovery step', boot(), ST['taut'] + 0.22, -28)
# ---------------- the device ----------------
add('into the cartridge (rising air, short)', soft_air(0.7, 400, 2200), DV['start'], -43)
add('the pulse driven to the port (flow)', flow(0.9, 250, 1000), DV['fill'], -41)
add('the channel and barrel (silky flow)', flow(1.2, 2500, 8000) * 0.5, DV['port'] - 0.2, -42)
add('the strand forming (fine stretch)', crackle(0.8, 50) * 0.5, DV['strand0'], -42)
add('into the syringe (soft swirl)', flow(0.7, 250, 900), LB['match'] - 0.2, -43)
# ---------------- the lab ----------------
add('lab room tone', flow(DUR - LB['match'], 120, 600) * 0.4, LB['match'], -46)
add('cocoon pinched (tap)', tick(900, 0.05, 0.006) * 0.8, LB['pinch'] - 0.02, -40)
add('fibres drawn out (silky stretch)', crackle(0.6, 40) * 0.6 + flow(0.6, 4000, 10000) * 0.3, LB['pinch'] + 0.1, -42)
add('fibres separating (fine crackle)', crackle(0.9, 30) * 0.5, LB['lift1'] + 0.2, -44)
add('cocoon set on the solution', wet_tap(0.16) * 0.6, LB['touchLiquid'], -38)
add('rod lifted (glass)', clink(3100, 0.18, 0.03) * 0.4, LB['rod0'], -40)
for k in range(4):
    add(f'stirring (glass tap {k})', clink(2900 + 150 * k, 0.12, 0.02) * 0.3, LB['stir0'] + 0.1 + k * 0.2, -43)
add('stirring (swirl)', flow(0.9, 250, 900), LB['stir0'], -41)
add('dissolving (fizz)', bubbles(1.1, 8.0), LB['stir0'] + 0.1, -43)
add('pump button', tick(1800, 0.05), LB['press'], -35)
add('pump runs (hum)', hum(DUR - LB['press'] - 0.5, 98) * 0.3, LB['press'] + 0.05, -46)
add('drawn up the tube (gurgle)', flow(0.6, 250, 900), LB['draw0'], -39)
add('silk flows to the nozzle', flow(0.7, 200, 800) * 0.8, LB['push0'], -41)
add('the cutaway opens (slide)', soft_air(0.5, 600, 2400), LB['cut0'], -41)
add('silk in the core (flow)', flow(0.9, 300, 1200) * 0.7, LB['silk0'], -41)
add('acetone flowing (hiss)', flow(1.3, 3000, 9000) * 0.6, LB['ace0'], -41)
add('hardening (fine crackle)', crackle(0.8, 55), LB['harden0'], -39)
add('vapour leaves (soft hiss)', flow(1.0, 4000, 11000) * 0.4, LB['harden0'] + 0.3, -44)
add('fibre forming (hiss)', flow(3.0, 3500, 9000) * 0.5, LB['exit'], -43)
add('fibre meets the metal (tick)', clink(3400, 0.12, 0.015) * 0.6, LB['fcontact'], -32)
add('fibre meets the metal (sticky)', wet_tap(0.12) * 0.5, LB['fcontact'], -38)
add('regrip (glove)', rustle(0.32) * 0.5, LB['regrip0'], -42)
add('the pull (nozzle moves)', soft_air(0.5, 500, 1600), LB['pull0'], -40)
add('fibre goes taut (tension)', creak(0.3, 600) * 0.7, LB['taut'] - 0.05, -35)
add('sand shifts', grains(1.0, 70) + 0.3 * bp(noise(int(1.0 * SR)), 800, 3000) * env(int(1.0 * SR), 0.1, 0.3), LB['lift0'], -38)
add('sand falls', grains(0.9, 45), LB['lift0'] + 0.4, -38)
add('blade comes free (ring)', clink(2100, 0.6, 0.12) * 0.45, LB['out'], -36)
add('the load on the fibre (faint tension)', creak(0.5, 360) * 0.4, LB['out'] + 0.8, -42)
add('carried to the tray (air)', soft_air(0.9, 300, 900), LB['carry0'], -44)
add('blade touches the tray', clink(2700, 0.3, 0.05), cj['bladeTouch'], -31)
add('blade lies down', mixs(clink(2300, 0.25, 0.035) * 0.7, thud(300, 0.1, 0.1) * 0.3), LB['flat'] - 0.05, -33)
add('fibre released (slack)', soft_air(0.3, 600, 1500) * 0.6, LB['release2'], -46)
add('nozzle raised (air)', soft_air(0.6, 300, 900), LB['back0'] + 0.2, -45)
add('air at the seam (into the aim)', soft_air(0.3, 500, 1500), DUR - 0.25, -40)

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
os.makedirs(os.path.join(EP, 'audio/mix/stems_v4'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v4.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v4.wav'), os.path.join(EP, 'audio/mix/FGW_Moth_Silk_V4_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v4/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v4.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v4.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
