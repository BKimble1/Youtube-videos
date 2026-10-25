#!/usr/bin/env python3
"""V6 score, effects and mix for FGW "Real Web Fluid". The narration is the V1 take, unchanged (sample-for-sample,
gain only, the same level as V1-V5) at 0 s, so the words keep their measured times; the bed is V5's retimed to the V6
picture; the effects are retargeted to the V6 picture (audio/cues_v6.json from tools/v6/export_cues_v6.ts). Levels as
V5: voice -17 LUFS, bed ~14 LU under it, effects under the voice, the whole at -14 LUFS with a -1.5 dBFS ceiling.
V6 changes: the hook's struggle loop is replaced by one stop (the strands snapping taut, the jacket yanked, the
planted foot) and a settle; a wetter splatter at the impact; the nozzle's stages (the section opening, the silk run,
the acetone joining at the port, the bead, the extrusion, the setting); the strand's dash; an adhesive contact; a soft
low thrum as the slack line springs taut and at the tightening tug; the set-down sounds are gone (the blade hangs).
Inputs : audio/narration/FGW_Moth_Silk_narration_final.wav, audio/cues_v6.json
Outputs: source/public/audio/mix_v6.wav, audio/mix/FGW_Moth_Silk_V6_mix.wav, audio/mix/stems_v6/*.wav,
         audio/mix/mix_measure_v6.json, audio/sfx_cues_v6.json"""
import json, math, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v6.json')))
DUR, WORDS, ST, MC, LB = cj['DUR'], cj['WORDS'], cj['street'], cj['macro'], cj['lab']
PRE = lambda f: (f + cj['film']) / 30.0  # street frame f < 0 (the end pre-roll) -> seconds
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
street = np.clip(1 - win(MC['start'] + 0.4, LB['toDevice'] - 0.3, 0.4, 0.4), 0, 1)
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
inside = win(MC['start'], LB['match'] - 0.2, 0.3, 0.4)
music = (pad_dm * street * 0.95 + pulse * 0.55 * street
         + pad_f * lab * (0.8 + 0.35 * resolve) + pluck * lab * (0.07 + 0.03 * win(LB['tip0'] - 0.2, LB['harden0'], 0.4, 0.4)) * (1 - 0.6 * resolve) * (1 - 0.6 * inside))

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

def thrum(d=0.45, f0=95):
    # a taut line set ringing: a low, quickly damped tone with a little pitch drop and a soft attack of fibre noise
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * (f0 * (1 - 0.12 * tt / d)) * tt) * np.exp(-tt / 0.09) + 0.25 * bp(noise(n), 900, 4000) * np.exp(-tt / 0.02)) * env(n, 0.004, 0.1)

# ---------------- the hook ----------------
prev = -1
for k, st in enumerate(cj['steps']):
    if st['t'] - prev < 0.1: continue
    prev = st['t']
    add(f'runner footfall {k}', boot(), st['t'] - 0.004, -32 + 8 * min(1, (st['zoom'] - 1) / 2))
add('arm rises into the aim (air)', soft_air(1.6, 300, 1100), PRE(-76) + 0.05, -44)
add('wrist snap (air)', soft_air(0.22, 700, 2600), PRE(-8), -36)
add('trigger click', tick(2600, 0.04), PRE(-1), -33)
add('liquid release (eruption)', spray(0.24), ST['fire'], -26)
add('the projectile passes (fast air)', soft_air(0.26, 900, 4200), ST['fire'] + 0.03, -31)
add('adhesive impact', splat(0.32), ST['hit'], -24)
add('splatter (wet droplets)', crackle(0.25, 120) * 0.7 + bp(noise(int(0.25 * SR)), 1500, 6000) * env(int(0.25 * SR), 0.003, 0.15) * 0.4, ST['hit'] + 0.01, -32)
add('the bands wrap (sticky stretch)', stretch(0.5), ST['hit'] + 0.04, -33)
add('strands snap taut (tension)', creak(0.3, 470), ST['taut'] - 0.06, -31)
add('stopped dead (jacket yank)', thud(110, 0.22, 0.6) * 0.8, ST['taut'], -29)
add('stopped dead (cloth)', rustle(0.35), ST['taut'] + 0.02, -35)
add('planted foot (scuff)', sneaker(0.12), ST['taut'] + 0.05, -34)
add('recovery step lands', boot(), ST['taut'] + 0.3, -31)
add('settle against the web (creak)', creak(0.4, 380) * 0.6, ST['taut'] + 0.35, -40)
add('push into the band (air)', soft_air(0.9, 400, 1500), ST['push0'] - 0.1, -44)
# ---------------- the material ----------------
add('liquid chains (swirl)', flow(1.6, 200, 900), MC['start'], -42)
add('chains zip into strands (fine crackle)', crackle(1.2, 45) * 0.8, MC['front0'] + 0.1, -40)
add('strands draw tight (soft creak)', creak(0.4, 520) * 0.5, MC['tight0'] + 0.2, -42)
add('into the cocoon (soft air)', soft_air(0.6, 400, 1200), MC['curl0'], -45)
# ---------------- the lab ----------------
add('lab room tone', flow(LB['toDevice'] - LB['match'], 120, 600) * 0.4, LB['match'], -46)
add('glove comes in (cloth)', rustle(0.4) * 0.6, LB['enter0'], -42)
add('fingers meet the cocoon (soft contact)', mixs(thud(240, 0.1, 0.4) * 0.6, tick(900, 0.04, 0.005) * 0.4), LB['contact'], -38)
add('the grip closes (squeeze, silk)', mixs(crackle(0.25, 70) * 0.6, rustle(0.3) * 0.4), LB['contact'] + 0.08, -40)
add('the lift (air)', soft_air(0.35, 500, 1400), LB['lift0'], -43)
add('the thread pinched (tap)', tick(1100, 0.04, 0.005) * 0.6, LB['rContact'], -40)
add('the thread drawn out (silky stretch)', crackle(0.8, 40) * 0.6 + flow(0.8, 4000, 10000) * 0.3, LB['tPull0'], -41)
add('cocoon dropped in (splash)', mixs(wet_tap(0.18), bp(noise(int(0.3 * SR)), 800, 5000) * env(int(0.3 * SR), 0.004, 0.2) * 0.5), LB['drop'], -33)
add('bubbles after the drop', bubbles(0.6, 10.0), LB['drop'] + 0.08, -41)
add('rod taken (glass)', clink(3100, 0.18, 0.03) * 0.4, LB['rodGrip'], -40)
for k in range(5):
    add(f'stirring (glass tap {k})', clink(2900 + 150 * (k % 3), 0.12, 0.02) * 0.3, LB['stir0'] + 0.12 + k * 0.22, -43)
add('stirring (swirl)', flow(1.2, 250, 900), LB['stir0'], -40)
add('dissolving (fizz)', bubbles(1.2, 8.0), LB['stir0'] + 0.15, -43)
add('rod set aside', clink(2600, 0.15, 0.025) * 0.4, LB['rodOff'], -42)
add('pump button', tick(1800, 0.05), LB['press'], -35)
add('pump runs (hum)', hum(LB['toDevice'] - LB['press'] - 0.3, 98) * 0.3, LB['press'] + 0.05, -46)
add('drawn up the tube (gurgle)', flow(0.6, 250, 900), LB['draw0'], -39)
add('nozzle taken off its stand', mixs(clink(2200, 0.2, 0.03) * 0.5, rustle(0.3) * 0.3), LB['nozGrip'], -38)
add('silk flows to the nozzle', flow(0.7, 200, 800) * 0.8, LB['push0'], -41)
add('the section opens (machined slide)', mixs(soft_air(0.6, 700, 2600), tick(1500, 0.05, 0.01) * 0.3), LB['cut0'], -40)
add('silk along the inner tube (flow)', flow(1.2, 300, 1200) * 0.7, LB['silk0'], -40)
add('acetone at the side port (hiss)', flow(1.1, 3000, 9000) * 0.6, LB['ace0'], -40)
add('the two streams meet (bead swell)', mixs(wet_tap(0.2) * 0.5, flow(0.4, 300, 900) * 0.5), LB['bead0'], -40)
add('extrusion (narrow squeeze)', flow(0.5, 500, 1800) * env(int(0.5 * SR), 0.04, 0.3), LB['extrude0'], -39)
add('setting (fine crackle)', crackle(0.9, 55), LB['harden0'], -39)
add('fibre forming (hiss)', flow(1.6, 3500, 9000) * 0.5, LB['exit'], -43)
dash = LB['exit'] + 0.36 * (LB['fcontact'] - LB['exit'])
add('the strand dashes to the target (air)', soft_air((LB['fcontact'] - dash) + 0.05, 600, 2600), dash, -40)
add('fibre meets the metal (tick)', clink(3400, 0.12, 0.015) * 0.6, LB['fcontact'], -30)
add('fibre meets the metal (adhesive)', mixs(wet_tap(0.14) * 0.6, crackle(0.2, 90) * 0.4), LB['fcontact'], -35)
add('the pull (nozzle moves)', soft_air(0.5, 500, 1600), LB['pull0'], -40)
add('slack springs taut (thrum)', thrum(0.5, 92), LB['pull0'] + 0.03, -32)
add('resisting (strained creak)', creak(0.7, 330) * 0.45, LB['pull0'] + 0.4, -39)
add('sand cracks', grains(0.9, 60) + 0.3 * bp(noise(int(0.9 * SR)), 800, 3000) * env(int(0.9 * SR), 0.1, 0.3), LB['pull0'] + 0.4, -38)
add('blade breaks free (ring)', clink(2100, 0.6, 0.12) * 0.5, LB['breakFree'], -34)
add('blade breaks free (sand burst)', grains(0.4, 140), LB['breakFree'], -35)
add('sand falls', grains(1.0, 45), LB['breakFree'] + 0.2, -38)
add('the high lift (air)', soft_air(0.9, 300, 1200), LB['out'] - 0.3, -40)
add('the load on the fibre (faint tension)', creak(0.5, 360) * 0.4, LB['liftTop'], -42)
add('the reveal (shimmer)', shimmer(1.3), LB['reveal0'] + 0.15, -40)
add('tightening tug (thrum)', thrum(0.4, 120) * 0.7, LB['tug'], -37)
add('nozzle turns toward the aim (air)', soft_air(0.7, 300, 1000), LB['release'] + 0.1, -45)
add('seam to the street (streak)', soft_air(0.3, 800, 3200), LB['toDevice'] - 0.12, -38)
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
os.makedirs(os.path.join(EP, 'audio/mix/stems_v6'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v6.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v6.wav'), os.path.join(EP, 'audio/mix/FGW_Moth_Silk_V6_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('sfx', sfx_l * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v6/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + sfx_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v6.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v6.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
