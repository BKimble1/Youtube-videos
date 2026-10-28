#!/usr/bin/env python3
"""Score, sound design and mix for FGW "Flying Skateboard" V11: the V10 mix on the V11 picture (same narration file; the
field attempt shot is gone, so the practice run starts on the riverside flat).
V10 notes: the V9 mix on the V10 picture and narration.

V10 changes: the narration is the V10 file (tools/tighten_narration_v10.py; every word sample-identical to the V1
take); the fire has one sound accent (the whoomp; no crackle or extinguish hiss); two soft pops on the visible backfire
before it; the redesign is a match cut, so the part-by-part clunks and clicks are gone (the new fans' spin-up is the
electric bed coming in); the early practice attempt sits in the field ambience.
V9 notes: the V8 mix with a steadier jet.

V9 changes: the jet prototype's engine is no longer ducked under the speech (ducking let it jump up in every short
pause: start-stop bursts under the narration). It now sits at one steady, lower level with a smooth rise from ignition
and a natural fade of about a second as "So he switched" begins; the fire's whoomp is 3 dB lower.
V8 notes follow.

The voice is the approved narration, tightened at its pauses only (tools/tighten_narration_v8.py: every word sample-
identical to the V1 take). Cue times come from the V8 picture (audio/cues_v11.json, tools/export_cues_v8.ts).

V8 sound design: the narration leads, and everything else sits under it.
  electric flight  one restrained electric-propeller bed (ten detuned motors, a little air) whose oscillators run
                   unbroken through the film; its level moves slowly between places (river, lift, field, practice,
                   canyon), so it carries across camera cuts instead of restarting at each shot. Gentle pitch changes
                   only where the picture shows a change (the spin-up into the cutaway, lift-offs, the climb).
  jet prototype    the only pronounced engine: starters, the turbine spool-up and roar, the recirculation rumble, hot
                   metal ticks, the fire (a contained whoomp and crackle), then shut down and put out.
  accents          few and short, each on a visible event: the skin opening, the air down to the water, the grass, the
                   parts of the redesign, the coach's earbud cue, the gust met at once, the shoreline, the canyon.
                   No camera-move whooshes.
  ducking          everything under the voice is lowered while he speaks with a slow release (about 0.7 s), so the
                   beds do not swell into the short gaps between phrases; the depth is modest (no pumping).
Levels: voice -17 LUFS; the music about 15 LU under it; the beds about 14 LU under it; the mix at -14 LUFS integrated
with a -1.5 dBFS ceiling.

Outputs: source/public/audio/mix_v11.wav, audio/mix/FGW_Flying_Skateboard_V11_mix.wav, audio/mix/stems_v11/*.wav (also
the voice alone and the mix without effects, for comparison), audio/mix/mix_measure_v11.json, audio/sfx_cues_v11.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues_v11.json')))
DUR, M = cj['duration'], cj['marks']
_KEYS = ['hook', 'lift', 'work', 'learn', 'coach', 'practice', 'crossing', 'canyon', 'ending']
BT = cj['beats']
SH = dict(zip(_KEYS, cj['shots']))
assert SH['ending']['name'].startswith('ending') and SH['work']['name'].startswith('the jet') and SH['canyon']['name'].startswith('the canyon') and SH['practice']['name'].startswith('practice to flight'), [s['name'] for s in cj['shots']]
WORDS = cj['words']
FLY = next(w['start'] for w in WORDS if w['word'].strip('.,!?').lower() == 'fly')
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(8)

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
    """1 inside [a, b], with fades of fa / fb outside it"""
    return np.clip(np.minimum((t - (a - fa)) / max(fa, 1e-3), ((b + fb) - t) / max(fb, 1e-3)), 0, 1)
def P(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def ramp(a, b): return np.clip((t - a) / (b - a), 0, 1)
def sm(x): return x * x * (3 - 2 * x)
def smooth(x, hz): return circ(lambda y: lp(y, hz), x)

# ---------------------------------------------------------------- voice (the tightened approved take, gain only)
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Flying_Skateboard_narration_V10_tight.wav'))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and abs(len(v) - N) <= 1, (vsr, len(v), N)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]

TIN = SH['canyon']['from']
CUT2 = SH['lift']['from']
DEPX = BT['shore']
WS0, WS1 = SH['work']['from'], SH['work']['to']

# ---------------------------------------------------------------- where we are
river = np.clip(win(0, CUT2, 0.01, 0.15) + win(DEPX, SH['crossing']['to'], 0.3, 0.05) + win(SH['ending']['from'], DUR + 1, 0.05, 0.01), 0, 1)
flat = np.clip(win(CUT2, WS0, 0.15, 0.05) + win(SH['practice']['from'], DEPX, 0.05, 0.3), 0, 1)
field = win(SH['learn']['from'], SH['coach']['to'], 0.05, 0.05)
work = win(WS0, WS1, 0.05, 0.05)
canyon = win(TIN, SH['canyon']['to'], 0.05, 0.05)

# ---------------------------------------------------------------- the electric bed (one continuous signal)
# level by place, smoothed (about 0.4 s), so it carries across the cuts inside electric flight
lvl = np.zeros(N)
lvl += 1.0 * win(0, CUT2, 0.0, 0.0)
lvl += win(CUT2, WS0, 0.0, 0.0) * (0.7 + 0.3 * sm(ramp(CUT2 + 0.1, M['lifting'] + 0.8)))
lvl += win(BT['wsSpin'], WS1, 0.0, 0.0) * 0.55 * sm(ramp(BT['wsSpin'], BT['wsSpin'] + 0.6))  # the new motors on the stand
lvl += win(WS1, SH['practice']['from'], 0.0, 0.0) * 0.72  # the low practice hover
lvl += win(SH['practice']['from'], DUR + 1, 0.0, 0.0) * (0.75 + 0.25 * sm(ramp(SH['practice']['from'], SH['practice']['from'] + 0.6)))
lvl *= 1 - 0.25 * win(SH['coach']['from'] + 0.2, SH['coach']['to'] - 0.4, 0.3, 0.4)  # the close coach views: device sounds read
lvl = smooth(lvl, 1.2)
# pitch: steady; a gentle rise only where the picture shows one
pitch = np.ones(N)
pitch += 0.12 * sm(ramp(M['electric'], M['electric'] + 0.7)) * win(M['electric'], CUT2, 0.0, 0.4)  # the cutaway spin-up
pitch += 0.05 * win(1.4, 2.8, 0.4, 0.6)  # climbing as the view widens
pitch += 0.05 * win(CUT2, M['ground'], 0.1, 0.6) * sm(ramp(CUT2, M['lifting'] + 0.4))  # the lift
pitch += 0.03 * np.sin(2 * np.pi * 0.7 * t) * field  # small corrections
pitch += 0.05 * win(SH['practice']['from'] + 0.3, SH['crossing']['to'], 0.4, 0.3)  # the take-off and climb
pitch = smooth(pitch, 3)
XF = int(0.4 * SR)  # oscillators run on past the end and the overrun is folded into the start (seamless loop)
def loopfold(sig):
    out = sig[:N].copy(); fi = np.linspace(0, 1, XF) ** 0.5
    out[:XF] = sig[:XF] * fi + sig[N:N + XF] * (1 - fi)
    return out
pp = np.concatenate([pitch, pitch[:XF]])
tones = np.zeros(N + XF)
for k in range(10):
    f0 = 176 * (1 + 0.011 * (k - 4.5))
    ph = 2 * np.pi * np.cumsum(f0 * pp) / SR + rng.random() * 6
    tones += sum(a * np.sin(m * ph) for m, a in [(1, 0.5), (2, 0.2), (5, 0.08)])
tones = loopfold(tones / 10)
tones = circ(lambda x: lp(x, 2400), tones)  # soft: no buzzy upper harmonics
air = circ(lambda x: lp(bp(x, 250, 3000), 2200), noise(N))
bed = (tones + 0.9 * air) * lvl
bed = bed * (1 - 0.5 * canyon) + circ(lambda x: lp(x, 1500), bed) * 0.5 * canyon  # duller between the walls

# ---------------------------------------------------------------- the jet prototype (the only loud engine)
ign_t = WS0 + 0.75
jet = np.zeros(N)
spool_end = M['so'] + 0.05
n = int((spool_end - ign_t) * SR); tt = np.arange(n) / SR; u = np.clip(tt / max(0.6, M['jet'] + 0.4 - ign_t), 0, 1)
f = 700 + 5200 * u ** 1.3
whine = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.15 + 0.6 * u)
roar = bp(noise(n), 70, 1600) * (0.1 + 0.9 * u ** 1.2)
rough = bp(noise(n), 40, 220) * np.clip((tt - (M['engines'] - ign_t)) / 0.6, 0, 1) * 0.8  # recirculation rumble
jsig = (0.3 * whine + 0.8 * roar + rough) * env(n, 0.05, 0.05)
place(jet, jsig, ign_t)
# shut down on "So he switched": the whine falls away
n2 = int(0.7 * SR); tt2 = np.arange(n2) / SR
place(jet, 0.3 * np.sin(2 * np.pi * np.cumsum(5900 * np.exp(-tt2 / 0.25)) / SR) * np.exp(-tt2 / 0.25) + 0.5 * bp(noise(n2), 70, 1600) * np.exp(-tt2 / 0.2), spool_end - 0.02)
# V9: one smooth level envelope over the whole jet run: a rise from ignition, then a natural fade of about a second
# from just before "So he switched" (no per-phrase ducking: it made the engine jump up in each pause)
jet *= smooth(sm(ramp(ign_t - 0.1, ign_t + 0.5)) * (1 - sm(ramp(M['so'] - 0.15, M['so'] + 0.95))), 6)
room = circ(lambda x: lp(x, 300), noise(N)) * 0.2 * work

# ---------------------------------------------------------------- air, water, ground
windn = circ(lambda x: lp(bp(x, 120, 2400), 1600), noise(N))
gustm = 0.8 + 0.2 * circ(lambda x: lp(x, 0.5), noise(N) * 3)
wind = windn * gustm * smooth(0.45 * river + 0.45 * canyon + 0.25 * flat + 0.08 * field, 2)
water = circ(lambda x: bp(x, 400, 2200), noise(N)) * (0.6 + 0.4 * np.abs(smooth(noise(N) * 4, 3)))
water *= 0.28 * smooth(np.clip(river + 0.4 * flat, 0, 1) * (1 - 0.5 * canyon), 2)
# the downwash on the water: present from frame 0 (he is low), stronger as the air is followed down
spray = circ(lambda x: hp(x, 2600), noise(N)) * smooth(0.14 * win(0, 1.6, 0, 0.6) + 0.22 * win(M['blast'] + 0.3, CUT2, 0.4, 0.05), 4)
birds = np.zeros(N)
for k in range(12):
    span = [(CUT2, WS0), (SH['learn']['from'], SH['coach']['to'])][k % 2]
    at = span[0] + rng.random() * (span[1] - span[0])
    nn = int(0.12 * SR); ttb = np.arange(nn) / SR
    fb = 3400 + rng.random() * 1400
    place(birds, np.sin(2 * np.pi * (fb + 900 * np.sin(2 * np.pi * 18 * ttb)) * ttb) * env(nn, 0.01, 0.06) * 0.1, at)
birds *= np.clip(field + flat, 0, 1)

# ---------------------------------------------------------------- accents (few, short, on visible events)
sfx = np.zeros(N); key = np.zeros(N); log = []
def add(name, sig, at, gain_db, hero=False):
    place(key if hero else sfx, sig * db(gain_db), at)
    log.append({'name': name, 'at': round(at % DUR, 3), 'frame': round(at * 30, 1), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1), 'hero': hero})
def airy(d, lo, hi, rise=True):
    """a soft band of moving air (short, rounded)"""
    nn = int(d * SR); tt_ = np.linspace(0, 1, nn); x = noise(nn); out = np.zeros(nn); seg = 1024
    for i in range(0, nn, seg):
        kk = tt_[i] if rise else 1 - tt_[i]; fc = lo * (hi / lo) ** kk
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, 16000))
    return out * np.sin(np.pi * tt_) ** 2
def thump(d=0.4, f=70):
    nn = int(d * SR); tt_ = np.arange(nn) / SR
    return np.sin(2 * np.pi * f * tt_ * (1 - 0.3 * tt_ / d)) * np.exp(-tt_ / 0.1) + 0.3 * lp(noise(nn), 400) * np.exp(-tt_ / 0.04)
def click(f=3200, d=0.03):
    nn = int(d * SR); tt_ = np.arange(nn) / SR
    return np.sin(2 * np.pi * f * tt_) * np.exp(-tt_ / 0.004) + 0.4 * np.sin(2 * np.pi * 180 * tt_) * np.exp(-tt_ / 0.01)
def chime(f1, f2, d=0.42):
    nn = int(d * SR); tt_ = np.arange(nn) / SR; h = nn // 2
    a = np.sin(2 * np.pi * f1 * tt_[:h]) * np.exp(-tt_[:h] / 0.09)
    b = np.sin(2 * np.pi * f2 * tt_[:nn - h]) * np.exp(-tt_[:nn - h] / 0.12)
    return np.concatenate([a, b]) * 0.6
def crackle(d, rate):
    out = np.zeros(int(d * SR)); kk = 0
    while True:
        at = (kk + rng.random()) / rate
        if at > d - 0.02: break
        nn = int(0.006 * SR); i = int(at * SR)
        out[i:i + nn] += hp(noise(nn), 1500) * (0.4 + rng.random()) * np.exp(-np.arange(nn) / (0.0015 * SR)); kk += 1
    return out
def ticks(d, rate, f0=5200):
    out = np.zeros(int(d * SR)); kk = 0
    while True:
        at = (kk + rng.random()) / rate
        if at > d - 0.05: break
        nn = int(0.04 * SR); tt_ = np.arange(nn) / SR; i = int(at * SR)
        out[i:i + nn] += np.sin(2 * np.pi * f0 * (0.7 + 0.6 * rng.random()) * tt_) * np.exp(-tt_ / 0.006) * (0.4 + rng.random()); kk += 1
    return out
def whoomp():
    nn = int(0.8 * SR); tt_ = np.arange(nn) / SR
    body = lp(noise(nn), 700) * (1 - np.exp(-tt_ / 0.03)) * np.exp(-tt_ / 0.25)
    low = np.sin(2 * np.pi * 52 * tt_) * np.exp(-tt_ / 0.18) * (1 - np.exp(-tt_ / 0.02))
    return body * 1.1 + low * 0.9 + bp(noise(nn), 1500, 6000) * np.exp(-tt_ / 0.08) * 0.25
cloth = lambda d=0.3: bp(noise(int(d * SR)), 900, 5000) * env(int(d * SR), 0.05, 0.18)

# the mechanism
add('the skin opens (soft mechanical slide)', P(airy(0.35, 900, 2400) * 0.5, 0.3 * click(1800, 0.04)), BT['iris'], -38)
for i in range(10):
    add(f'count: duct {i + 1} rim (tiny tick)', click(4200 + 120 * i, 0.02), M['ten'] + (M['powerfulE'] - M['ten']) * (i + 0.5) / 10, -43)
add('the air down the duct to the river', airy(0.9, 2000, 400, False), M['blast'] + 0.25, -34)
add('the grass blown flat round the board (rustle)', bp(noise(int(0.9 * SR)), 1200, 6000) * env(int(0.9 * SR), 0.08, 0.5), CUT2 + 0.02, -36)
# the jet test
add('ignition: starter clicks', P(click(2200, 0.03), np.concatenate([np.zeros(int(0.12 * SR)), click(2200, 0.03)])), ign_t - 0.03, -33)
add('heat: casings ticking', ticks(M['fire'] - M['engines'] + 0.2, 9), M['engines'] + 0.05, -35)
add('FIRE: it catches round the engines (contained whoomp)', whoomp(), M['fire'] - 0.03, -22, True)
for k, dt in enumerate([0.0, 0.42]):
    add(f'backfire {k + 1}: a soft pop from the centre nozzle', P(0.5 * thump(0.18, 90), 0.4 * bp(noise(int(0.12 * SR)), 300, 3000) * env(int(0.12 * SR), 0.005, 0.1)), BT['flare'] - 0.04 + dt, -34)
# the redesign
# the coach (device sounds only)
add('wrist phone: soft tick', click(5600, 0.02), BT['wrist'] - 0.05, -38)
add('AI coach cue in the earbud', chime(988, 1319), BT['cue'] + 0.03, -29, True)
add('a fresh gust, met at once (air)', airy(0.45, 700, 1500) * 0.8, BT['learned'] + 0.3, -37)
# flight
add('over the shoreline: the river opens up (air)', airy(1.0, 300, 1700), DEPX - 0.2, -35)
add('into the canyon (air narrows)', airy(0.8, 300, 1800), TIN - 0.03, -34)
add('a gust between the walls; he answers it (cloth)', cloth(0.3), TIN + 0.9, -39)

def echo(x, d=0.21, g=0.35, taps=3):
    out = x.copy()
    for kk in range(1, taps + 1):
        out += np.roll(x, int(d * kk * SR)) * g ** kk
    return out
can_env = smooth(canyon, 5)

# ---------------------------------------------------------------- the score (D minor, i-VI-III-VII, about 120 bpm)
BEATS = int(round(DUR * 2)); bt = DUR / BEATS
def note(m): return 440 * 2 ** ((m - 69) / 12)
CH = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]
def chord_at(b): return CH[(int(b) // 4) % 4]
s_pad = 0.8 + 0.2 * canyon
s_arp = np.clip(0.55 * win(0, M['so'], 0, 0.3) + 0.7 * win(M['so'] + 0.3, DUR + 1, 0.3, 0) - 0.5 * win(M['fire'], M['so'], 0.0, 0.3), 0, 1)
s_beat = np.clip(0.55 * win(0, M['but'], 0, 0.3) + 0.35 * win(M['jet'], M['fire'], 0.3, 0) + 0.75 * win(M['heHas'], DUR + 1, 0.3, 0) + 0.25 * win(SH['practice']['from'], SH['canyon']['to'], 0.2, 0.3), 0, 1)
s_beat *= 1 - 0.85 * win(M['fire'] + 0.05, M['fire'] + 0.45, 0.0, 0.2)
s_beat *= 1 - 0.5 * win(M['except'], BT['itself'], 0.2, 0.4)
s_lead = np.clip(0.6 * win(DEPX, TIN, 0.4, 0.1) + 1.0 * canyon, 0, 1)
s_tense = win(M['but'], M['fire'], 0.2, 0.05)
s_end = win(SH['ending']['from'], DUR + 1, 0.4, 0)
s_lead *= 1 - s_end
s_beat = s_beat * (1 - 0.3 * s_end)
pad = np.zeros(N); arp = np.zeros(N); bass = np.zeros(N); beat = np.zeros(N); lead = np.zeros(N); tens = np.zeros(N)
for b in range(BEATS):
    at = b * bt; ch = chord_at(b)
    if b % 4 == 0:
        nn = int(bt * 4.3 * SR); tt_ = np.arange(nn) / SR
        s = sum(np.sin(2 * np.pi * note(m) * tt_) + 0.3 * np.sin(2 * np.pi * 2 * note(m) * tt_ + 0.3) for m in ch) + 0.4 * np.sin(2 * np.pi * note(ch[0] + 12) * tt_)
        place(pad, s * env(nn, 0.35, 0.6) * 0.18, at)
        n2 = int(bt * 4 * SR); tt2 = np.arange(n2) / SR
        place(bass, (np.sin(2 * np.pi * note(ch[0] - 12) * tt2) + 0.3 * np.sin(2 * np.pi * note(ch[0] - 24) * tt2)) * env(n2, 0.02, 0.2) * 0.45, at)
    for k in range(4):
        nn = int(0.22 * SR); tt_ = np.arange(nn) / SR
        m = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24][(b * 4 + k) % 4]
        place(arp, (np.sin(2 * np.pi * note(m) * tt_) + 0.5 * np.sin(2 * np.pi * 2 * note(m) * tt_)) * np.exp(-tt_ / 0.06) * 0.22, at + k * bt / 4)
    nn = int(0.3 * SR); tt_ = np.arange(nn) / SR
    if b % 2 == 0:
        place(beat, np.sin(2 * np.pi * (50 + 60 * np.exp(-tt_ / 0.03)) * tt_) * np.exp(-tt_ / 0.14), at)
    else:
        place(beat, 0.5 * bp(noise(nn), 900, 5000) * np.exp(-tt_ / 0.05) + 0.3 * np.sin(2 * np.pi * 190 * tt_) * np.exp(-tt_ / 0.04), at)
    for k in range(2):
        nh = int(0.05 * SR)
        place(beat, 0.18 * hp(noise(nh), 6000) * np.exp(-np.arange(nh) / (0.012 * SR)), at + k * bt / 2)
    if b % 2 == 0:
        mel = [74, 77, 76, 72, 74, 81, 79, 77][(b // 2) % 8]
        nn = int(bt * 2.1 * SR); tt_ = np.arange(nn) / SR
        ph = 2 * np.pi * note(mel) * np.cumsum(1 + 0.004 * np.sin(2 * np.pi * 5.5 * tt_)) / SR
        place(lead, sum(np.sin(h * ph) / h for h in range(1, 7)) * env(nn, 0.06, 0.25) * 0.16, at)
    nn = int(bt * SR); tt_ = np.arange(nn) / SR
    place(tens, (np.sin(2 * np.pi * note(38) * tt_) + 0.6 * np.sin(2 * np.pi * note(39) * tt_)) * np.exp(-tt_ / 0.25) * 0.35, at)
lead = circ(lambda x: lp(x, 4200), lead)
music = pad * smooth(s_pad, 4) + arp * smooth(s_arp, 6) + bass * (0.5 + 0.5 * s_beat) + beat * smooth(s_beat, 8) + lead * smooth(s_lead, 4) + tens * s_tense
def swell(d, f0):
    nn = int(d * SR); tt_ = np.arange(nn) / SR
    return sum(np.sin(2 * np.pi * note(m) * tt_) for m in [f0, f0 + 7, f0 + 12]) * (tt_ / d) ** 2 * env(nn, 0.01, 0.05)
def hit(d=1.4):
    nn = int(d * SR); tt_ = np.arange(nn) / SR
    return (np.sin(2 * np.pi * note(38) * tt_) + 0.5 * np.sin(2 * np.pi * note(50) * tt_) + 0.3 * sum(np.sin(2 * np.pi * note(m) * tt_) for m in [62, 65, 69])) * np.exp(-tt_ / 0.6) + 0.5 * lp(noise(nn), 300) * np.exp(-tt_ / 0.08)
place(music, swell(0.8, 62) * 0.22, FLY - 0.8)
place(music, hit() * 0.45, FLY)
place(music, hit(1.0) * 0.35, M['fire'] - 0.02)
place(music, swell(1.0, 57) * 0.28, M['flew'] - 1.0)
place(music, hit() * 0.5, M['flew'])
place(music, swell(0.8, 62) * 0.32, M['through'] - 0.8)
place(music, hit(1.6) * 0.62, M['through'])

# ---------------------------------------------------------------- mix
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
# speech activity: fast attack (60 ms), slow release (0.7 s), so the beds stay down through the short gaps between
# phrases instead of swelling into them
ve = np.abs(voice); ve = lp(ve, 20, 1); ve = ve / (ve.max() + 1e-9)
act = np.clip((20 * np.log10(ve + 1e-6) + 46) / 12, 0, 1)
hopn = int(0.005 * SR); a_att = np.exp(-0.005 / 0.06); a_rel = np.exp(-0.005 / 0.7)
blocks = act[::hopn]; g = np.zeros_like(blocks); y = 0.0
for _ in range(2):  # run twice so the loop's start carries the end's state
    for i, xv in enumerate(blocks):
        y = (a_att if xv > y else a_rel) * y + (1 - (a_att if xv > y else a_rel)) * xv
        g[i] = y
speech = np.interp(t, np.arange(len(g)) * hopn / SR, g)
voice_l = voice * db(-17 - lufs(voice))
amb = bed + wind * 0.7 + water + spray + birds
amb = echo(amb, 0.18, 0.25) * can_env + amb * (1 - can_env)
amb_l = amb * db(-17 - 14 - lufs(amb)) * (1 - 0.3 * speech)  # about -3 dB under speech
jet_l = (jet + room) * db(-17 - 9 - lufs(jet[work > 0.5] + room[work > 0.5]))
mus_l = music * db(-17 - 15 - lufs(music)) * (1 - 0.45 * speech)
sfx_e = echo(sfx, 0.21, 0.3) * can_env + sfx * (1 - can_env)
sfx_l = sfx_e * db(3) * (1 - 0.3 * speech)
key_l = key * db(3)
def finish(x):
    lim = db(-1.5); gg = 0.0
    for _ in range(3):
        gg += -14 - lufs(np.stack([np.tanh(x * db(gg) / lim) * lim] * 2, 1))
    return np.tanh(x * db(gg) / lim) * lim, gg
mix, G = finish(voice_l + mus_l + amb_l + jet_l + sfx_l + key_l)
stereo = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'audio/mix/stems_v11'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v11.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v11.wav'), os.path.join(EP, 'audio/mix/FGW_Flying_Skateboard_V11_mix.wav'))
for name, x in [('voice', voice_l * db(G)), ('music', mus_l * db(G)), ('ambience', amb_l * db(G)), ('jet', jet_l * db(G)), ('sfx', (sfx_l + key_l) * db(G))]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v11/{name}.wav'), x, SR, subtype='PCM_24')
# comparisons: the voice alone, and the mix with the effects and beds muted (voice + music)
sf.write(os.path.join(EP, 'audio/mix/stems_v11/compare_voice_only.wav'), np.stack([voice_l * db(G)] * 2, 1), SR, subtype='PCM_24')
sf.write(os.path.join(EP, 'audio/mix/stems_v11/compare_no_effects.wav'), np.stack([np.tanh((voice_l + mus_l) * db(G) / db(-1.5)) * db(-1.5)] * 2, 1), SR, subtype='PCM_24')

# measurements
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
rest = (mus_l + amb_l + jet_l + sfx_l + key_l) * db(G)
vb, ob = band(voice_l * db(G)), band(rest)
r = lambda x, m: 10 * np.log10(np.mean(x[m] ** 2) + 1e-12)
# pumping check: the electric bed's level in speech vs in the gaps between phrases (outside the workshop)
gap = (ve < 0.02) & (t > 0.3) & (t < WORDS[-1]['end']) & (work < 0.01)
talk = (ve > 0.08) & (work < 0.01)
bed_out = amb_l * db(G)
seg_rms = lambda m: 10 * np.log10(np.mean(bed_out[m] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_speech_band_db': round(r(vb, spk) - r(ob, spk), 1),
        'electric_bed_gap_minus_speech_db': round(seg_rms(gap) - seg_rms(talk), 2),
        'jet_over_electric_bed_db': round(10 * np.log10(np.mean((jet_l * db(G))[work > 0.5] ** 2) / np.mean(bed_out[river > 0.5] ** 2)), 1),
        'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6), 'seam_jump': round(float(abs(mix[0] - mix[-1])), 5),
        'effects': len(log), 'score_beats': BEATS, 'bpm': round(BEATS / DUR * 60, 2)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure_v11.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues_v11.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
