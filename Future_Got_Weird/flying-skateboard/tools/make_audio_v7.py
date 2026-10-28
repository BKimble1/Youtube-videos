#!/usr/bin/env python3
"""Score, sound design and mix for FGW "Flying Skateboard" V7: the V6 mix re-cued to the V7 picture. Narration and
score unchanged. V7 changes: one continuous opening (the cut under the board is now a camera move, and a motor whine
and the air through the duct play the cutaway); the lift's grass rustle; the jet test escalates in one move (no smoke
roll); the redesign is heard part by part (jets lifted out, plank away, the deck set down, ten units seated, the motors
spinning up, the lift-off); the coach beat is one move (no cut whooshes); the river climb and the canyon walls.
V6 notes: the V5 mix re-cued to the V6 picture. The narration is
the locked V1 narration, sample for sample (gain only), and the score is unchanged; the effects follow the V6 events
and sit under the voice. Cue times come from the V6 picture (audio/cues_v7.json, tools/export_cues_v6.ts).

V6 changes from V5: a gust and his answer replace the carve (0-3 s); no fuel drips or vapour (the fire's cause is not
reported: it lights at the centre engine); the new board's fans spin up and blow the smoke off (no unit seating); the
balance section follows its new beats (the problem, the tendency, the legs, the whole body, the two phones, the earbud
cue, the correction, a fresh gust met at once); one continuous practice-to-flight run; the canyon is cut to as its own
place. Earlier notes:
V3 sound design:
  hook       ten-motor rotor chorus, wind and the river 8 m below from frame 0; air on each camera move (alongside, down
             under the board, up to the high view, the lateral follow); the musical lift lands on "FLY"
  mechanism  the duct rims tick as they are counted; the rotors rise in pitch and the air thickens on "electric
             propellers"; a rush of air as the camera pushes into one fan ("blast air downward")
  lift       through the rotor: the same fan's whir on the riverside flat; the deck takes his weight (a soft knock) as the
             rotors bite; grit and grass blown out; wind opens up as the river is revealed; air past the low camera
  jet test   workshop room tone; the intake whirr carried from the fan; starter clicks; turbine spool-up; the hot metal
             ticks as heat builds; the recirculation rumble; a fuel-fed whoomp (contained, not an explosion) on "FIRE";
             crackle pulled down fast; the engines wind down
  redesign   the compressor's spin carries into the electric fan; the spare unit slides and seats; nine more seat
  learning   rotors bite as he lifts; the pitch wavers with each correction; cloth on the body; a whoosh as the camera
             cranes up his back; the gust in the ride; the board phone and wrist phone tick; a two-note cue in his
             earpiece (device sound only, no invented voice); the correction; clean air
  practice   a wobbling takeoff, the overhead pass, a low pass on the flat, the run over the shoreline onto the water
  payoff     wide river air; the gorge's echo on air and rotors; the biggest musical lift on "THROUGH"
  ending     wind in his own view, the camera rising out of his helmet, and the flight audio wrapping across the loop
Levels: voice -17 LUFS, score about 14 LU under it and ducked under speech, effects under the voice, the mix at -14 LUFS
integrated with a -1.5 dBFS ceiling.
Outputs: source/public/audio/mix_v7.wav, audio/mix/FGW_Flying_Skateboard_V7_mix.wav, audio/mix/stems_v7/*.wav,
         audio/mix/mix_measure_v7.json, audio/sfx_cues_v7.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v7.json')))
DUR, M = cj['duration'], cj['marks']
_KEYS = ['hook', 'lift', 'work', 'learn', 'coach', 'practice', 'crossing', 'canyon', 'ending']
BT = cj['beats']
SH = dict(zip(_KEYS, cj['shots']))
# V7: the opening is one shot; its under-the-board and air-to-the-water parts as before
SH['under'] = {'from': M['yousee'], 'to': M['blast']}
SH['air'] = {'from': M['blast'], 'to': SH['lift']['from']}
assert SH['ending']['name'].startswith('ending') and SH['work']['name'].startswith('the jet') and SH['canyon']['name'].startswith('the canyon') and SH['practice']['name'].startswith('practice to flight'), [s['name'] for s in cj['shots']]
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]  # filter as if the film loops (no edge transients)
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); na = min(n, max(1, int(a * SR))); nr = min(n, max(1, int(r * SR)))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    np.add.at(buf, idx % N, sig)
def win(a, b, fa=0.2, fb=0.2):
    """1 inside [a, b], with fades of fa / fb outside it (wraps across the loop)"""
    out = np.clip(np.minimum((t - (a - fa)) / max(fa, 1e-3), ((b + fb) - t) / max(fb, 1e-3)), 0, 1)
    return out
def P(*xs):
    """sum of signals of different lengths (zero-padded)"""
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def ramp(a, b): return np.clip((t - a) / (b - a), 0, 1)
def sm(x): return x * x * (3 - 2 * x)

# ---------------------------------------------------------------- voice (unchanged)
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Flying_Skateboard_narration_V1.wav'))
assert vsr == SR and abs(len(v) - N) <= 1, (vsr, len(v), N)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]

def isstep(y): return 0.5 - np.sin(np.arcsin(1 - 2 * y) / 3)  # inverse of smoothstep
TIN = SH['canyon']['from']  # the cut to the canyon flight (a separate place)
MATCH = M['lifting'] - 0.74     # the lift's clock
CUT2 = SH['lift']['from']        # the water under the board cuts to the riverside flat (V5: on the 'lifting' caption)
DEPX = BT['shore']  # V6: over the shoreline, out onto the water (in the one continuous practice-to-flight move)

# ---------------------------------------------------------------- where we are
river = np.clip(win(0, SH['air']['to'], 0.01, 0.06) + win(DEPX, SH['crossing']['to'], 0.2, 0.05) + win(SH['ending']['from'], DUR + 1, 0.05, 0.01), 0, 1)
flat = np.clip(win(SH['lift']['from'], SH['lift']['to'], 0.06, 0.05) + win(SH['practice']['from'], DEPX, 0.05, 0.2), 0, 1)  # riverside flat: the river is close by
field = np.clip(win(SH['learn']['from'], SH['coach']['to'], 0.05, 0.05), 0, 1)
work = np.clip(win(SH['work']['from'], SH['work']['to'], 0.05, 0.05), 0, 1)
canyon = win(TIN, SH['canyon']['to'], 0.05, 0.05)
ending_pov = win(SH['ending']['from'], M['pay'] - 0.12, 0.02, 0.4)

# ---------------------------------------------------------------- the electric rotors (ten motors)
rot = np.zeros(N)
rot += river
L0 = SH['lift']['from']
rot += win(L0, SH['lift']['to'], 0.02, 0.05) * (0.55 + 0.45 * sm(ramp(L0 + 0.3, M['lifting'] + 0.4)))
lift_p = BT['lift']
rot += win(SH['learn']['from'], SH['learn']['to'], 0.02, 0.02) * (0.12 + 0.88 * sm(ramp(lift_p - 0.1, lift_p + 0.45)))
rot += win(SH['coach']['from'], SH['coach']['to'], 0.02, 0.02) * (1 - 0.35 * win(SH['coach']['from'], BT['cue'], 0.02, 0.1))
rot += win(SH['practice']['from'], DEPX, 0.02, 0.2) * (0.3 + 0.7 * sm(ramp(SH['practice']['from'], SH['practice']['from'] + 0.4)))
rot = np.clip(rot, 0, 1)
# pitch: base 1.0; the spin-up on "electric propellers"; the climb into the high view; wavering through the corrections
pitch = 1.0 + 0.16 * sm(ramp(M['electric'], M['electric'] + 0.6)) * win(M['electric'], SH['air']['to'], 0.05, 0.3)
pitch += 0.07 * win(1.9, 2.8, 0.3, 0.5)
pitch += 0.05 * win(-0.25, 0.55, 0.0, 0.2) * np.sin(2 * np.pi * 3 * t)
pitch += 0.06 * win(CUT2, M['ground'], 0.05, 0.3) * sm(ramp(CUT2, M['lifting'] + 0.3))
pitch += 0.05 * np.sin(2 * np.pi * 0.9 * t) * field
pitch += 0.11 * win(BT['problem'] + 0.3, BT['coach'], 0.3, 0.4) * np.sin(2 * np.pi * 1.7 * t)
pitch += 0.07 * win(BT['fix'] - 0.05, BT['fix'] + 0.4, 0.1, 0.3)
pitch += 0.09 * win(SH['practice']['from'], SH['practice']['from'] + 0.6, 0.05, 0.1) * np.sin(2 * np.pi * 2.6 * t)
pitch += 0.08 * win(SH['practice']['from'] + 0.5, SH['crossing']['to'], 0.3, 0.1)
pitch = circ(lambda x: lp(x, 8), pitch)
XF = int(0.4 * SR)  # loop crossfade: oscillators run on past the end and their overrun is folded into the start
def loopfold(sig):
    out = sig[:N].copy()
    fi = np.linspace(0, 1, XF) ** 0.5
    out[:XF] = sig[:XF] * fi + sig[N:N + XF] * (1 - fi)
    return out
def rotors():
    pp = np.concatenate([pitch, pitch[:XF]])
    out = np.zeros(N + XF)
    for k in range(10):
        f0 = 182 * (1 + 0.012 * (k - 4.5))
        ph = 2 * np.pi * np.cumsum(f0 * pp) / SR + rng.random() * 6
        out += sum(a * np.sin(m * ph) for m, a in [(1, 0.55), (2, 0.22), (5, 0.16), (10, 0.05)])
    whine = np.sin(2 * np.pi * np.cumsum(1640 * pp) / SR) * 0.08
    tones = loopfold(out / 10 + whine)
    air = circ(lambda x: bp(x, 300, 4200), noise(N)) * 2.2
    return tones + 0.55 * air * (0.8 + 0.2 * np.sin(2 * np.pi * (round(9.2 * DUR) / DUR) * t))
rotor_sig = rotors() * circ(lambda x: lp(x, 10), rot)

# ---------------------------------------------------------------- wind, water, ground, room
windn = circ(lambda x: lp(bp(x, 120, 2600), 1800), noise(N))
gust = 0.65 + 0.35 * circ(lambda x: lp(x, 0.6), noise(N) * 3)
wind_lvl = 0.6 * river + 0.55 * canyon + 0.35 * win(1.9, 3.0, 0.3, 0.4) + 0.35 * flat + 0.12 * field + 0.45 * ending_pov + 0.3 * win(SH['practice']['from'] + 0.5, SH['crossing']['to'], 0.2, 0.05)
wind = windn * gust * circ(lambda x: lp(x, 4), wind_lvl)
water = circ(lambda x: bp(x, 400, 2400), noise(N)) * (0.5 + 0.5 * np.abs(circ(lambda x: lp(x, 3), noise(N) * 4)))
water *= 0.32 * np.clip(river + 0.5 * flat, 0, 1) * (1 - 0.4 * canyon)
# the downwash on the water while he is low during the explanation (about 4 m up)
spray = circ(lambda x: hp(x, 2500), noise(N)) * (0.12 + 0.3 * win(M['electric'] + 0.4, SH['air']['to'], 0.4, 0.03)) * win(0, SH['air']['to'], 0, 0.03)
spray += circ(lambda x: hp(x, 2500), noise(N)) * 0.2 * win(DEPX, DEPX + 1.0, 0.1, 0.5)
room = circ(lambda x: lp(x, 300), noise(N)) * 0.25 * work
grit = circ(lambda x: bp(x, 1800, 7000), noise(N)) * 0.18 * (win(CUT2 + 0.02, M['ground'], 0.05, 0.4) + 0.7 * win(lift_p - 0.1, BT['itself'], 0.2, 0.4) + 0.6 * win(SH['practice']['from'], DEPX, 0.05, 0.2))
birds = np.zeros(N)
for k in range(16):
    span = [(SH['lift']['from'], SH['lift']['to']), (SH['learn']['from'], SH['coach']['to'])][k % 2]
    at = span[0] + rng.random() * (span[1] - span[0])
    n = int(0.12 * SR); tt = np.arange(n) / SR
    f = 3400 + rng.random() * 1400
    chirp = np.sin(2 * np.pi * (f + 900 * np.sin(2 * np.pi * 18 * tt)) * tt) * env(n, 0.01, 0.06)
    place(birds, chirp * 0.12, at)
birds *= np.clip(field + flat, 0, 1)

# ---------------------------------------------------------------- effects (one-shots)
sfx = np.zeros(N); key = np.zeros(N); log = []
def add(name, sig, at, gain_db, hero=False):
    place(key if hero else sfx, sig * db(gain_db), at)
    log.append({'name': name, 'at': round(at % DUR, 3), 'frame': round(at * 30, 1), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1), 'hero': hero})
def whoosh(d, lo, hi, rise=True):
    n = int(d * SR); tt = np.linspace(0, 1, n); x = noise(n); out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        k = tt[i] if rise else 1 - tt[i]; fc = lo * (hi / lo) ** k
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 20000))
    return out * np.sin(np.pi * tt) ** 1.5
def thump(d=0.5, f=55):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt * (1 - 0.3 * tt / d)) * np.exp(-tt / 0.12) + 0.3 * lp(noise(n), 400) * np.exp(-tt / 0.05)
def click(f=3200, d=0.03):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004) + 0.4 * np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / 0.01)
def seat():
    # a duct unit seating into its socket: a firm plastic knock with a little rattle
    n = int(0.16 * SR); tt = np.arange(n) / SR
    return 0.8 * np.sin(2 * np.pi * 210 * tt) * np.exp(-tt / 0.02) + 0.4 * bp(noise(n), 1500, 6000) * np.exp(-tt / 0.008) + 0.25 * np.sin(2 * np.pi * 1300 * tt) * np.exp(-tt / 0.01)
def chime(f1, f2, d=0.42):
    n = int(d * SR); tt = np.arange(n) / SR; h = n // 2
    a = np.sin(2 * np.pi * f1 * tt[:h]) * np.exp(-tt[:h] / 0.09)
    b = np.sin(2 * np.pi * f2 * tt[:n - h]) * np.exp(-tt[:n - h] / 0.12)
    return np.concatenate([a, b]) * 0.6
def crackle(d, rate):
    out = np.zeros(int(d * SR)); k = 0
    while True:
        at = (k + rng.random()) / rate
        if at > d - 0.02: break
        n = int(0.006 * SR); i = int(at * SR)
        out[i:i + n] += hp(noise(n), 1500) * (0.4 + rng.random()) * np.exp(-np.arange(n) / (0.0015 * SR)); k += 1
    return out
def turbine(d):
    n = int(d * SR); tt = np.arange(n) / SR; u = tt / d
    f = 900 + 6200 * u ** 1.4
    whine = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.2 + 0.8 * u)
    roar = bp(noise(n), 80, 1800) * (0.15 + 0.85 * u ** 1.2)
    return 0.35 * whine + 0.8 * roar
def ignition():
    n = int(0.9 * SR); tt = np.arange(n) / SR
    crack = hp(noise(n), 1200) * np.exp(-tt / 0.012)
    boom = np.sin(2 * np.pi * 48 * tt) * np.exp(-tt / 0.18) + 0.8 * lp(noise(n), 500) * np.exp(-tt / 0.15)
    burst = bp(noise(n), 300, 5000) * np.exp(-tt / 0.3) * (1 - np.exp(-tt / 0.01))
    return 0.9 * crack + 1.0 * boom + 0.7 * burst

def ticks(d, rate, f0=5200):
    # hot metal: sparse, pitched pings as the casings and lines expand
    out = np.zeros(int(d * SR)); k = 0
    while True:
        at = (k + rng.random()) / rate
        if at > d - 0.05: break
        n = int(0.04 * SR); tt = np.arange(n) / SR; i = int(at * SR)
        f = f0 * (0.7 + 0.6 * rng.random())
        out[i:i + n] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006) * (0.4 + rng.random()); k += 1
    return out
def whoomp():
    # fuel catching at the fitting: a soft low rush, not a blast
    n = int(0.9 * SR); tt = np.arange(n) / SR
    body = lp(noise(n), 700) * (1 - np.exp(-tt / 0.03)) * np.exp(-tt / 0.28)
    low = np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.2) * (1 - np.exp(-tt / 0.02))
    top = bp(noise(n), 1500, 6000) * np.exp(-tt / 0.08) * 0.3
    return body * 1.1 + low * 0.9 + top


def isstep(y): return 0.5 - np.sin(np.arcsin(1 - 2 * y) / 3)  # inverse of smoothstep

# hook
add('frame 0: air already rushing past', whoosh(0.7, 300, 1400), -0.3, -31)
add('his knees take the heave (cloth)', bp(noise(int(0.3 * SR)), 900, 5000) * env(int(0.3 * SR), 0.05, 0.15), 0.45, -37)
add('a gust rocks the board (air)', whoosh(0.6, 700, 1600), BT['gust'] - 0.05, -32)
add('his knees and hips take it (cloth)', bp(noise(int(0.35 * SR)), 900, 5000) * env(int(0.35 * SR), 0.05, 0.2), BT['gust'] + 0.25, -36)
add('over the gravel bar (air, water on the stones)', P(whoosh(0.8, 400, 1500), 0.4 * bp(noise(int(0.8 * SR)), 600, 3000) * env(int(0.8 * SR), 0.2, 0.3)), 2.05, -32)
add('rising to the wide crossing (air)', whoosh(1.1, 300, 2200), 2.3, -31)
add('the camera sweeps under the board: the fans close by', whoosh(0.9, 1800, 900, False) * 0.7, 3.0, -34)
add('the skin opens: a soft mechanical slide', P(whoosh(0.4, 900, 2600) * 0.5, 0.3 * click(1800, 0.04)), BT['iris'], -36)
add('into one unit: the motor whine rises (cutaway)', bp(noise(int(1.0 * SR)), 1400, 2600) * env(int(1.0 * SR), 0.5, 0.25) * np.linspace(0.4, 1.0, int(1.0 * SR)), M['electric'] + 0.25, -35)
add('the air through the duct, down to the river (follow)', whoosh(1.1, 2200, 350, False), M['blast'] + 0.3, -30)
# mechanism
for i in range(10):
    add(f'count: duct {i + 1} rim (tiny tick)', click(4200 + 120 * i, 0.02), M['ten'] + (M['powerfulE'] - M['ten']) * (i + 0.5) / 10, -40)
add('electric propellers: the rotors spin up', whoosh(0.9, 400, 1500) * 0.8, M['electric'] - 0.05, -31)
add('blast air downward: the air rush to the water', whoosh(1.0, 2600, 400, False) * 1.1, M['blast'] - 0.08, -27)
add('the downwash hits the water (spray hiss)', bp(noise(int(0.9 * SR)), 2500, 9000) * env(int(0.9 * SR), 0.15, 0.4), M['blast'] + 0.3, -32)
# lift
add('cut to the flat: grit and grass blown out', whoosh(1.0, 600, 3200) * 0.8, CUT2 - 0.02, -31)
add('the deck takes his weight as the rotors bite (knock)', P(thump(0.3, 110) * 0.7, 0.25 * click(900, 0.05)), M['lifting'] - 0.05, -30)
add('he rises clear past the camera (air)', whoosh(1.0, 300, 1700), M['lifting'] + 0.35, -32)
add('the grass blown flat round the board (rustle)', bp(noise(int(1.1 * SR)), 1200, 6000) * env(int(1.1 * SR), 0.1, 0.6), SH['lift']['from'] + 0.02, -33)
add('he flies on, over and past (air)', whoosh(0.8, 600, 2400), M['but'] - 0.85, -31)
# jet test
add('ignition: starter clicks', P(click(2200, 0.03), np.concatenate([np.zeros(int(0.12 * SR)), click(2200, 0.03)])), M['but'] + 0.72, -31)
add('turbine spool-up whine and roar', turbine(M['fire'] - M['jet'] + 0.45), M['jet'] - 0.45, -25)
add('heat: casings and lines ticking', ticks(M['fire'] - M['engines'] + 0.3, 10), M['engines'] + 0.05, -32)
vib = np.zeros(int((M['fire'] - M['andCaught'] + 0.3) * SR)); tv = np.arange(len(vib)) / SR
vib = lp(noise(len(vib)), 200) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * tv)) * np.linspace(0.3, 1, len(vib))
add('recirculation: rough rumble and rattle', vib + 0.3 * crackle(len(vib) / SR, 18), M['andCaught'] - 0.2, -26)
add('FIRE: it lights at the centre engine (whoomp)', whoomp(), M['fire'] - 0.03, -14, True)
add('fire crackle (quickly under the narration)', crackle(1.0, 55) * np.linspace(1, 0.15, int(1.0 * SR)) + 0.4 * bp(noise(int(1.0 * SR)), 200, 2000) * np.linspace(1, 0, int(1.0 * SR)), M['fire'] + 0.12, -28)
add('engines wind down', whoosh(1.0, 2500, 300, False), M['fire'] + 0.45, -33)
# redesign, in the same cradle
add('the fire is put out (hiss)', bp(noise(int(0.6 * SR)), 2000, 8000) * env(int(0.6 * SR), 0.03, 0.4), M['so'] - 0.1, -33)
for i in range(5):
    add(f'jet {i + 1} lifted out of its mount (clunk, air)', P(0.4 * thump(0.15, 140 + 12 * i), whoosh(0.35, 500, 1400) * 0.4), BT['wsJets'] + 0.06 * i, -37)
add('the plank goes up and away (air)', whoosh(0.6, 400, 1500) * 0.7, BT['wsPlank'], -34)
add('the electric deck comes down into the cradle (air, seat)', P(whoosh(0.5, 1500, 500, False) * 0.6, np.concatenate([np.zeros(int(0.5 * SR)), 0.6 * thump(0.25, 90)])), BT['wsDeck'], -32)
for i in range(10):
    add(f'unit {i + 1} seats (click)', P(click(3000 + 150 * i, 0.03), 0.3 * thump(0.08, 200)), BT['wsUnits'] + 0.06 * i + 0.05, -38)
add('the new motors spin up (rotors)', whoosh(0.9, 300, 1500) * 0.9, BT['wsSpin'] - 0.05, -30)
add('it lifts off the stand (air)', whoosh(0.7, 400, 1300) * 0.8, BT['wsRise'], -32)

# learning
add('lift (rotors bite)', thump(0.5, 70) * 0.6, lift_p, -31)
cloth = lambda d=0.35: bp(noise(int(d * SR)), 900, 5000) * env(int(d * SR), 0.05, 0.2)
add('the problem: the board leans over by itself (air lurch)', whoosh(0.8, 400, 1300), BT['problem'] + 0.45, -32)
add('the late catch: hips back, knees down (cloth, deck creak)', P(cloth(0.4), 0.3 * thump(0.2, 160)), BT['problem'] + 1.1, -34)
add('the nose dips by itself (air)', whoosh(0.5, 500, 1400), BT['itself'] + 0.3, -33)
add('he sits back (cloth)', cloth(), BT['itself'] + 0.55, -36)
add('the nose comes up past level; he leans in (cloth)', cloth(), BT['itself'] + 1.35, -37)
add('control: ankles and knees take a roll (cloth, deck creak)', P(cloth(0.35), 0.3 * thump(0.2, 170)), BT['control'] + 0.38, -35)
add('the entire body: a bigger roll (air)', whoosh(0.6, 700, 1500), BT['body'] + 0.25, -31)
add('the whole-body save (cloth)', cloth(0.4), BT['body'] + 0.5, -35)
add('he leans and the board moves off (air)', whoosh(0.7, 500, 1500), BT['body'] + 0.95, -34)
add('board phone (the sensor): soft tick', click(5200, 0.02), BT['coach'] + 0.1, -37)
add('wrist phone (the coach app): soft tick', click(5600, 0.02), BT['wrist'] - 0.05, -37)
add('AI coach cue in the earpiece', chime(988, 1319), BT['cue'] + 0.03, -27, True)
add('the correction: knees softer, hips over the toes (cloth)', cloth(), BT['fix'] + 0.05, -36)
add('a fresh gust (air)', whoosh(0.45, 700, 1500) * 0.8, BT['learned'] + 0.3, -34)
add('met at once (cloth)', cloth(0.25), BT['learned'] + 0.42, -37)
add('settled: clean air', whoosh(0.9, 400, 1500), BT['learned'] + 0.75, -34)

# practice to flight (one continuous move)
add('a confident lift-off from the flat (air)', whoosh(0.5, 500, 1200) * 0.7, SH['practice']['from'] + 0.05, -34)
add('he accelerates across the flat (air)', whoosh(0.9, 400, 2200), SH['practice']['from'] + 0.55, -31)
add('over the shoreline: the river opens up (air swells)', whoosh(1.1, 300, 2000), DEPX - 0.2, -29)
# payoff
add('RIVER: the climb and the high view (air swells)', whoosh(1.4, 250, 1800), M['flew'] - 0.1, -30)
add('rising to the high angle (air)', whoosh(1.0, 300, 1600) * 0.7, M['river2'], -33)
add('cut into the canyon (air narrows)', whoosh(1.0, 300, 2200), TIN - 0.05, -28)
add('the walls sweep past (air)', whoosh(0.8, 500, 2000), M['through'] + 0.1, -31)
add('behind him down the canyon (air)', whoosh(0.9, 400, 1800), M['canyon'] + 0.05, -32)
add('a gust between the walls; he answers it (cloth)', bp(noise(int(0.35 * SR)), 900, 5000) * env(int(0.35 * SR), 0.05, 0.2), TIN + 0.9, -36)
# ending
add('back over the river (steady wind)', whoosh(1.2, 300, 1600) * 0.8, SH['ending']['from'] - 0.05, -31)

def echo(x, d=0.21, g=0.35, taps=3):
    out = x.copy()
    for k in range(1, taps + 1):
        out += np.roll(x, int(d * k * SR)) * g ** k
    return out
can_env = circ(lambda x: lp(x, 5), canyon)

# ---------------------------------------------------------------- the score (D minor, i-VI-III-VII, 72 beats over the film)
BEATS = 72; bt = DUR / BEATS
def note(m): return 440 * 2 ** ((m - 69) / 12)
CH = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]  # Dm, Bb, F, C
def chord_at(b): return CH[(int(b) // 4) % 4]
# arrangement envelopes
s_pad = 0.8 + 0.2 * win(SH['canyon']['from'], SH['canyon']['to'], 0.5, 0.3)
s_arp = np.clip(0.55 * win(0, M['so'], 0, 0.3) + 0.7 * win(M['so'] + 0.3, DUR + 1, 0.3, 0) - 0.5 * win(M['fire'], M['so'], 0.0, 0.3), 0, 1)
s_beat = np.clip(0.55 * win(0, M['but'], 0, 0.3) + 0.35 * win(M['jet'], M['fire'], 0.3, 0) + 0.75 * win(M['heHas'], DUR + 1, 0.3, 0) + 0.25 * win(SH['practice']['from'], SH['canyon']['to'], 0.2, 0.3), 0, 1)
s_beat *= 1 - 0.85 * win(M['fire'] + 0.05, M['fire'] + 0.55, 0.0, 0.25)  # the near-silence after FIRE
s_beat *= 1 - 0.5 * win(M['except'], BT['itself'], 0.2, 0.4)  # suspended: the problem
s_lead = np.clip(0.6 * win(DEPX, TIN, 0.4, 0.1) + 1.0 * canyon, 0, 1)
s_tense = win(M['but'], M['fire'], 0.2, 0.05)
s_end = win(SH['ending']['from'], DUR + 1, 0.4, 0)  # back to the hook's level for the loop
s_lead *= 1 - s_end
s_beat = s_beat * (1 - 0.3 * s_end)

pad = np.zeros(N); arp = np.zeros(N); bass = np.zeros(N); beat = np.zeros(N); lead = np.zeros(N); tens = np.zeros(N)
for b in range(BEATS):
    at = b * bt
    ch = chord_at(b)
    # pad: chord tones, slow attack, held for a bar (placed per beat with overlap so it wraps)
    if b % 4 == 0:
        n = int(bt * 4.3 * SR); tt = np.arange(n) / SR
        s = sum(np.sin(2 * np.pi * note(m) * tt) + 0.3 * np.sin(2 * np.pi * 2 * note(m) * tt + 0.3) for m in ch)
        s += 0.4 * np.sin(2 * np.pi * note(ch[0] + 12) * tt)
        place(pad, s * env(n, 0.35, 0.6) * 0.18, at)
        n2 = int(bt * 4 * SR); tt2 = np.arange(n2) / SR
        place(bass, (np.sin(2 * np.pi * note(ch[0] - 12) * tt2) + 0.3 * np.sin(2 * np.pi * note(ch[0] - 24) * tt2)) * env(n2, 0.02, 0.2) * 0.45, at)
    # arp: sixteenths over the chord (pluck)
    for k in range(4):
        n = int(0.22 * SR); tt = np.arange(n) / SR
        m = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24][(b * 4 + k) % 4]
        pl = (np.sin(2 * np.pi * note(m) * tt) + 0.5 * np.sin(2 * np.pi * 2 * note(m) * tt)) * np.exp(-tt / 0.06)
        place(arp, pl * 0.22, at + k * bt / 4)
    # beat: kick on 1 and 3, snare-ish clap on 2 and 4, hats on eighths
    n = int(0.3 * SR); tt = np.arange(n) / SR
    if b % 2 == 0:
        place(beat, np.sin(2 * np.pi * (50 + 60 * np.exp(-tt / 0.03)) * tt) * np.exp(-tt / 0.14), at)
    else:
        place(beat, 0.5 * bp(noise(n), 900, 5000) * np.exp(-tt / 0.05) + 0.3 * np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / 0.04), at)
    for k in range(2):
        nh = int(0.05 * SR)
        place(beat, 0.18 * hp(noise(nh), 6000) * np.exp(-np.arange(nh) / (0.012 * SR)), at + k * bt / 2)
    # lead: a soaring line for the river and the canyon (saw-ish, octave up)
    if b % 2 == 0:
        mel = [74, 77, 76, 72, 74, 81, 79, 77][(b // 2) % 8]
        n = int(bt * 2.1 * SR); tt = np.arange(n) / SR
        vib_ = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * tt)
        ph = 2 * np.pi * note(mel) * np.cumsum(vib_) / SR
        s = sum(np.sin(h * ph) / h for h in range(1, 7))
        place(lead, s * env(n, 0.06, 0.25) * 0.16, at)
    # tension: a pulsing low drone a semitone rub (jet section)
    n = int(bt * SR); tt = np.arange(n) / SR
    place(tens, (np.sin(2 * np.pi * note(38) * tt) + 0.6 * np.sin(2 * np.pi * note(39) * tt)) * np.exp(-tt / 0.25) * 0.35, at)
lead = circ(lambda x: lp(x, 4200), lead)
music = pad * circ(lambda x: lp(x, 4), s_pad) + arp * circ(lambda x: lp(x, 6), s_arp) + bass * (0.5 + 0.5 * s_beat) + beat * circ(lambda x: lp(x, 8), s_beat) + lead * circ(lambda x: lp(x, 4), s_lead) + tens * s_tense
# musical lift on the reveals: a soft swell into the flight, a bigger one on FLY; the strongest in the canyon
def swell(d, f0):
    n = int(d * SR); tt = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * note(m) * tt) for m in [f0, f0 + 7, f0 + 12]) * (tt / d) ** 2 * env(n, 0.01, 0.05)
def hit(d=1.4):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * note(38) * tt) + 0.5 * np.sin(2 * np.pi * note(50) * tt) + 0.3 * sum(np.sin(2 * np.pi * note(m) * tt) for m in [62, 65, 69])) * np.exp(-tt / 0.6) + 0.5 * lp(noise(n), 300) * np.exp(-tt / 0.08)
place(music, swell(1.0, 62) * 0.25, 1.49 - 1.0)
place(music, hit() * 0.5, 1.49)
place(music, hit(1.0) * 0.4, M['fire'] - 0.02)
place(music, swell(1.2, 57) * 0.3, M['flew'] - 1.2)
place(music, hit() * 0.55, M['flew'])
place(music, swell(0.9, 62) * 0.35, M['through'] - 0.9)
place(music, hit(1.8) * 0.7, M['through'])

# ---------------------------------------------------------------- mix
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
speech = np.clip(ve * 6, 0, 1)
duck = 1 - 0.5 * speech
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
voice_l = voice * db(-17 - lufs(voice))
amb = rotor_sig * 0.9 + wind * 0.8 + water + spray + room + birds + grit
amb = echo(amb, 0.18, 0.28) * can_env + amb * (1 - can_env)
amb_l = amb * db(-17 - 9 - lufs(amb)) * (1 - 0.35 * speech)
mus_l = music * duck * db(-17 - 14 - lufs(music * duck))
sfx_e = echo(sfx, 0.21, 0.3) * can_env + sfx * (1 - can_env)
sfx_l = sfx_e * db(3) * (1 - 0.35 * speech)
key_l = key * db(3)
mix = voice_l + mus_l + amb_l + sfx_l + key_l
lim = db(-1.5)
g = 0.0
for _ in range(3):
    g += -14 - lufs(np.stack([np.tanh(mix * db(g) / lim) * lim] * 2, 1))
mix = np.tanh(mix * db(g) / lim) * lim
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems_v7'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v7.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v7.wav'), os.path.join(EP, 'audio/mix/FGW_Flying_Skateboard_V7_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('ambience', amb_l * db(g)), ('sfx', (sfx_l + key_l) * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v7/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + amb_l + sfx_l + key_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log), 'score_beats': BEATS, 'bpm': round(BEATS / DUR * 60, 2)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v7.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v7.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
