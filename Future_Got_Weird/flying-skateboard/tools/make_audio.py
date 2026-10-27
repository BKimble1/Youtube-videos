#!/usr/bin/env python3
"""Score, sound design and mix for FGW "Flying Skateboard" V1. Everything here is synthesised (no samples, no
third-party music). Cue times come from the picture (audio/cues.json, tools/export_cues.ts); the narration is the V1
narration, sample for sample (gain only).

Sound design (the brief, section 7):
  hook       electric rotor chorus (ten motors, slightly detuned, so they beat), wind over the river, a soft musical lift
             as the flight is revealed and a bigger one on "FLY"
  mechanism  the rotors rise in pitch and level on "electric propellers"; air rushing down; the downwash on the water;
             a low "fwump" as the water ring matches the dust ring; dust and leaves at the ground lift
  jet        a turbine whine that builds with the engines, a rumble with vibration as the exhaust recirculates, a sharp
             ignition crack and a short fire burst on "FIRE", then crackle pulled down quickly under the narration
  redesign   ten seating clicks as the ducts drop in; the loose motor's freewheel
  balance    rotor hum with small pitch changes that follow the corrections; the controller click; the coach's brief
             two-note cue in the earpiece; cloth and wind on the stabilisation
  payoff     wider air and stronger wind over the river; the score rises; the strongest lift in the canyon, with its
             echo; whooshes on the two foreground wipes
  ending     continuous flight audio and score that wrap across the loop point (no outro sting)
Score: an original synthesised cue in D minor, 72 beats over the film (120.3 bpm, so the beat grid wraps exactly at the
loop), i-VI-III-VII, sections following the story: hook / light mechanism / tension (jet) / the hit and near-silence
after FIRE / restart / suspended (the problem) / groove (control) / build (training) / full (river) / biggest (canyon) /
back to the hook's level for the loop.
Levels as the channel's recent Shorts: voice -17 LUFS, the score about 14 LU under it and ducked under speech, effects
under the voice, the mix at -14 LUFS integrated with a -1.5 dBFS ceiling.
Outputs: source/public/audio/mix_v1.wav, audio/mix/FGW_Flying_Skateboard_V1_mix.wav, audio/mix/stems/*.wav,
         audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, M = cj['duration'], cj['marks']
SH = {s['name'].split(' ')[0]: s for s in cj['shots']}
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

# ---------------------------------------------------------------- where we are
river = np.clip(win(0, SH['hook']['to'], 0.01, 0.12) + win(SH['across']['from'], SH['across']['to'], 0.05, 0.05) + win(SH['ending']['from'], DUR + 1, 0.15, 0.01), 0, 1)
field = np.clip(win(SH['ground']['from'], SH['ground']['to'], 0.08, 0.08) + win(SH['the']['from'], SH['ten']['to'], 0.05, 0.05), 0, 1)
work = np.clip(win(SH['jet']['from'], SH['redesign']['to'], 0.06, 0.08), 0, 1)
canyon = win(SH['through']['from'], SH['through']['to'], 0.05, 0.25)

# ---------------------------------------------------------------- the electric rotors (ten motors)
# level: flying = 1; on the ground the field scenes spin up from idle; silent in the workshop
rot = np.zeros(N)
rot += river + canyon
lift0 = SH['ground']['from']
rot += win(lift0, SH['ground']['to'], 0.02, 0.05) * (0.35 + 0.65 * sm(ramp(lift0 - 0.05, lift0 + 0.5)))
tilt_lift = M['huge'] - 0.05
rot += win(SH['the']['from'], SH['the']['to'], 0.02, 0.02) * (0.12 + 0.88 * sm(ramp(tilt_lift - 0.6, tilt_lift + 0.1)))
rot += win(SH['body']['from'], SH['ten']['to'], 0.02, 0.05)
rot = np.clip(rot, 0, 1)
# pitch: base 1.0; the spin-up on "electric propellers"; corrections in the balance scenes; climb in the hook
pitch = 1.0 + 0.18 * sm(ramp(M['electric'], M['electric'] + 0.8)) * win(M['electric'], SH['hook']['to'], 0.05, 0.4)
pitch += 0.1 * win(1.35, 2.6, 0.2, 0.4)
pitch += 0.06 * np.sin(2 * np.pi * 0.9 * t) * (field + 0.4)
pitch += 0.12 * win(M['huge'] + 0.4, M['itself'], 0.3, 0.4) * np.sin(2 * np.pi * 2.1 * t)
pitch += 0.09 * win(M['while'], M['while'] + 0.6, 0.1, 0.3)
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

# ---------------------------------------------------------------- wind, water, field, room
windn = circ(lambda x: lp(bp(x, 120, 2600), 1800), noise(N))
gust = 0.65 + 0.35 * circ(lambda x: lp(x, 0.6), noise(N) * 3)
wind_lvl = 0.55 * river + 0.9 * canyon + 0.5 * win(SH['across']['from'], SH['across']['to'], 0.1, 0.05) + 0.35 * win(1.4, 2.9, 0.3, 0.4) + 0.12 * field
wind = windn * gust * circ(lambda x: lp(x, 4), wind_lvl)
water = circ(lambda x: bp(x, 400, 2400), noise(N)) * (0.5 + 0.5 * np.abs(circ(lambda x: lp(x, 3), noise(N) * 4)))
water *= 0.35 * river
spray = circ(lambda x: hp(x, 2500), noise(N)) * 0.25 * river * win(0, 1.4, 0.0, 0.4)  # low over the water at the hook
spray += circ(lambda x: hp(x, 2500), noise(N)) * 0.3 * win(M['blast'], SH['hook']['to'], 0.2, 0.05)
room = circ(lambda x: lp(x, 300), noise(N)) * 0.25 * work
birds = np.zeros(N)
for k in range(14):
    at = SH['ground']['from'] + rng.random() * (SH['ten']['to'] - SH['ground']['from'])
    n = int(0.12 * SR); tt = np.arange(n) / SR
    f = 3400 + rng.random() * 1400
    chirp = np.sin(2 * np.pi * (f + 900 * np.sin(2 * np.pi * 18 * tt)) * tt) * env(n, 0.01, 0.06)
    place(birds, chirp * 0.12, at)
birds *= field

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

# hook
add('flight reveal: rotor air swells in', whoosh(0.6, 300, 1600), -0.2, -30)
add('the camera sweeps low past the board (air)', whoosh(0.9, 400, 2400), 0.95, -31)
add('FLY: the climb (air rising)', whoosh(1.1, 300, 3000), 1.35, -29)
add('under the board (air passes over)', whoosh(0.8, 2400, 500, False), 3.0, -33)
# mechanism
for i in range(10):
    add(f'count: duct {i + 1} rim lights (tiny tick)', click(4200 + 120 * i, 0.02), M['ten'] + (M['powerfulE'] - M['ten']) * (i + 0.5) / 10, -40)
add('blast air downward (air rush)', whoosh(1.0, 1500, 300, False) * 1.2, M['blast'] - 0.1, -27)
add('water ring -> dust ring (fwump)', P(thump(0.6, 60), 0.5 * whoosh(0.5, 800, 200, False)), SH['ground']['from'] - 0.06, -24, True)
add('dust and leaves blow out', whoosh(1.2, 600, 3000) * 0.8, SH['ground']['from'] + 0.15, -31)
add('lift-off (deeper rotor note)', thump(0.4, 90) * 0.6, M['lifting'] - 0.25, -34)
add('swoop under the board to the fan', whoosh(0.5, 500, 2600), M['but'] - 0.45, -30)
# jet test
add('fan -> intake: the turn carries over (whirr)', whoosh(0.4, 1800, 1200, False), M['but'] - 0.12, -32)
add('turbine spool-up whine and roar', turbine(M['fire'] - M['jet'] + 0.25), M['jet'] - 0.25, -24)
vib = np.zeros(int((M['fire'] - M['andCaught'] + 0.3) * SR)); tv = np.arange(len(vib)) / SR
vib = lp(noise(len(vib)), 200) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * tv)) * np.linspace(0.3, 1, len(vib))
add('recirculation: rough rumble and rattle', vib + 0.3 * crackle(len(vib) / SR, 18), M['andCaught'] - 0.2, -25)
add('FIRE: ignition crack and burst', ignition(), M['fire'] - 0.015, -12, True)
add('fire crackle (quickly under the narration)', crackle(1.3, 60) * np.linspace(1, 0.2, int(1.3 * SR)) + 0.4 * bp(noise(int(1.3 * SR)), 200, 2000) * np.linspace(1, 0, int(1.3 * SR)), M['fire'] + 0.15, -27)
add('turbines wind down', whoosh(1.0, 2500, 300, False), M['fire'] + 0.5, -32)
# redesign
add('pull back across the workshop (air)', whoosh(0.7, 500, 1500), M['so'] - 0.05, -36)
add('the loose motor slides onto the bench (freewheel)', whoosh(0.5, 900, 1600) * 0.7 + 0.3 * crackle(0.5, 30), M['so'] + 0.15, -33)
b0, b1 = M['electric2'] - 0.35, M['except'] - 0.25
for i in range(10):
    add(f'duct {i + 1} seats', seat(), b0 + (b1 - b0) * (i + 0.8) / 10, -26)
# the problem
add('step onto the deck (shoe on the board)', P(thump(0.18, 140) * 0.7, 0.2 * click(900, 0.05)), M['except'] + 0.55, -30)
add('lift (rotors bite)', thump(0.5, 70) * 0.6, M['huge'] - 0.05, -30)
add('the tilt: a lurch of air', whoosh(0.6, 400, 1400), M['huge'] + 0.1, -31)
add('cloth: the body answers', bp(noise(int(0.4 * SR)), 900, 5000) * env(int(0.4 * SR), 0.05, 0.2), M['huge'] + 0.45, -36)
add('drift sideways (air)', whoosh(0.8, 900, 400, False), M['theBoard'] - 0.1, -33)
# control
add('lean forward: the board moves off (air)', whoosh(0.7, 500, 1600), M['heHas'] + 0.05, -33)
add('lean back: brake (air)', whoosh(0.6, 1500, 500, False), M['body'] - 0.45, -34)
add('overcorrection: sideways drift', whoosh(0.5, 700, 1300), M['body'] + 0.15, -34)
add('controller: throttle click', click(2600, 0.03), M['while'] + 0.02, -27)
add('wrist phone: tilt readout (soft tick)', click(5200, 0.02), M['voice'] - 0.02, -36)
add('AI coach cue in the earpiece', chime(988, 1319), M['coach'] + 0.05, -26, True)
add('the correction (cloth)', bp(noise(int(0.35 * SR)), 900, 5000) * env(int(0.35 * SR), 0.05, 0.2), M['learn'], -36)
add('the clean turn (air)', whoosh(0.9, 400, 1500), M['balance2'] + 0.1, -32)
# training to the payoff
add('a new day (soft air)', whoosh(0.6, 600, 1800) * 0.6, M['tenDays'] - 0.1, -38)
add('out over the shoreline (big air)', whoosh(1.2, 300, 2400), M['practice'] + 0.05, -28)
add('RIVER: the wide (air swells)', whoosh(1.4, 250, 1800), M['flew'] - 0.1, -30)
add('rock spur wipe (close whoosh)', P(whoosh(0.45, 200, 2500) * 1.3, 0.4 * thump(0.3, 70)), M['andThrough'] - 0.2, -22, True)
add('THROUGH: into the gorge (echoing air)', whoosh(1.0, 300, 2200), M['through'] - 0.05, -27)
add('mist wipe (soft whoosh)', whoosh(0.7, 2000, 400, False), SH['ending']['from'] - 0.35, -29)
add('PAY YOU: down into his view (air)', whoosh(0.6, 1500, 500, False), M['pay'] - 0.35, -33)
add('the bank (air)', whoosh(0.8, 500, 1300), M['thing'] - 0.2, -34)

# the canyon's echo on the effects and the rotors while we are in it
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
s_pad = 0.8 + 0.2 * win(SH['across']['from'], SH['through']['to'], 0.5, 0.3)
s_arp = np.clip(0.55 * win(0, M['so'], 0, 0.3) + 0.7 * win(M['so'] + 0.3, DUR + 1, 0.3, 0) - 0.5 * win(M['fire'], M['so'], 0.0, 0.3), 0, 1)
s_beat = np.clip(0.55 * win(0, M['but'], 0, 0.3) + 0.35 * win(M['jet'], M['fire'], 0.3, 0) + 0.75 * win(M['heHas'], DUR + 1, 0.3, 0) + 0.25 * win(M['practice'], SH['through']['to'], 0.2, 0.3), 0, 1)
s_beat *= 1 - 0.85 * win(M['fire'] + 0.05, M['fire'] + 0.55, 0.0, 0.25)  # the near-silence after FIRE
s_beat *= 1 - 0.5 * win(M['except'], M['itself'], 0.2, 0.4)  # suspended: the problem
s_lead = np.clip(0.6 * win(SH['across']['from'], SH['across']['to'], 0.4, 0.1) + 1.0 * canyon, 0, 1)
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
place(music, hit(1.0) * 0.45, M['fire'] - 0.01)
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
amb = rotor_sig * 0.9 + wind * 0.8 + water + spray + room + birds
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
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix_v1.wav'), stereo, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix_v1.wav'), os.path.join(EP, 'audio/mix/FGW_Flying_Skateboard_V1_mix.wav'))
for name, x in [('voice', voice_l * db(g)), ('music', mus_l * db(g)), ('ambience', amb_l * db(g)), ('sfx', (sfx_l + key_l) * db(g))]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), x, SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
vb, ob = band(voice_l * db(g)), band((mus_l + amb_l + sfx_l + key_l) * db(g))
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
meas = {'integrated_lufs_stereo': round(lufs(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2),
        'voice_over_rest_phone_band_db': round(r(vb) - r(ob), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'seam_jump': round(float(abs(mix[0] - mix[-1])), 5), 'effects': len(log), 'score_beats': BEATS, 'bpm': round(BEATS / DUR * 60, 2)}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
