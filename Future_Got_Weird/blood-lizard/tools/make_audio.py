#!/usr/bin/env python3
"""Effects, music bed and mix for the Blood Lizard Short.

Sources:
  - narration: the ElevenLabs master (audio/narration/FGW_Blood_Lizard_narration_V1.wav), used sample for sample
    (gain, a gentle compressor and a limiter only);
  - animal sounds and foley generated with ElevenLabs sound effects (audio/sfx_el/, provenance in audio/sfx_el/README.md):
    the coyote's snarling breath, its disgusted snort, its gag/spit/head shake, the blood squirt, the lizard's claws;
  - everything else is synthesised here: desert air, the heartbeat and the vessels stretching inside the head, the
    muscle squeeze, the rupture, the impact, the jaw snap, paws on sand, the landing, and the music.
Every effect is placed from the picture's own events (audio/cues.json, exported from story.ts by tools/export_cues.ts).
Music: restrained and tense. A low drone, a muted pulse on a tempo whose period divides the film exactly, a two-note
minor-second ostinato, and a tremolo that rises with the pressure inside the head. It drops out at the rupture, holds
only a low boom through the slow-motion impact, and wraps into frame 0 for the loop. No whooshes.
Effects sit under the voice (ducked); voice about -16 LUFS; the whole about -14 LUFS; true peak below -1.5 dBTP.
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, EV, T = cj['DUR'], cj['EV'], cj['T']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2611)
LOG = []

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def place(buf, sig, at, name=None, gain_db=0.0, wrap=False):
    """add sig at time `at`; with wrap the parts before 0 / after the end come round the loop"""
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    if wrap: idx = idx % N
    m = (idx >= 0) & (idx < N)
    np.add.at(buf, idx[m], sig[m] * db(gain_db))
    if name: LOG.append({'t': round(at % DUR if wrap else at, 3), 'sfx': name, 'gain_db': gain_db})
def sig100(a): return np.interp(t, np.arange(len(a)) / 100, a)
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):2 * len(x) + len(x)]
def load(name):
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, 'audio/sfx_el', name), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                     capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    return norm(hp(y, 40))
def trim(x, a, b, fa=0.01, fb=0.05):
    y = x[int(a * SR):int(b * SR)].copy()
    return y * env(len(y), fa, fb)

# ---------------- generators
def thump(dur=0.5, f0=70, f1=34):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (dur * 0.35)) + 0.2 * lp(noise(n), 200) * np.exp(-tt / 0.03))
def resonate(x, f, r=0.995):
    out = np.zeros(len(x)); y1 = y2 = 0.0; w = 2 * np.pi * f / SR; c = 2 * r * np.cos(w)
    for k in range(len(x)):
        y = x[k] + c * y1 - r * r * y2; y2, y1 = y1, y; out[k] = y
    return out
def creak(dur=0.4, f=150, grain=50):
    n = int(dur * SR); tt = np.arange(n) / SR
    ph = np.cumsum(grain * (1 + 0.3 * np.sin(2 * np.pi * 3 * tt)) / SR)
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.5 + 0.5 * rng.random(n))
    return norm(bp(resonate(pulses, f), 70, 2500)) * env(n, dur * 0.25, dur * 0.4)
def squelch(dur=0.4, lo=200, hi=1600, dens=30):
    n = int(dur * SR); g = np.zeros(n)
    for _ in range(int(dur * dens)):
        i = rng.integers(0, max(1, n - 1200)); m = 1200
        g[i:i + m] += np.sin(2 * np.pi * (250 + 500 * rng.random()) * np.arange(m) / SR) * np.exp(-np.arange(m) / SR / 0.006) * rng.random()
    return norm(bp(noise(n), lo, hi) * 0.4 + g) * env(n, dur * 0.3, dur * 0.4)
def heartbeat(gain=1.0):
    """lub-dub, muffled, as heard inside the body"""
    n = int(0.42 * SR); out = np.zeros(n)
    for at, f0, a in [(0.0, 62, 1.0), (0.17, 74, 0.7)]:
        s = thump(0.22, f0, f0 * 0.6) * a
        i = int(at * SR); out[i:i + len(s)] += s[:n - i]
    return lp(out, 260) * gain
def stretch(dur, f0, f1):
    """an elastic vessel wall stretching: a rising rubbery squeak with a grainy creak inside it"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.5 * np.sin(2 * ph + 0.3) + 0.25 * np.sin(3 * ph)
    grain = creak(dur, f0 * 1.5, 70)
    return norm(lp(tone * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * tt)), 2400) * 0.6 + 0.5 * grain) * env(n, dur * 0.3, 0.06)
def pop(dur=0.35):
    """the rupture: a tight wet pop with a low body"""
    n = int(dur * SR); tt = np.arange(n) / SR
    crack = hp(noise(n), 1500) * np.exp(-tt / 0.004)
    body = np.sin(2 * np.pi * (180 * np.exp(-tt / 0.05) + 60) * tt) * np.exp(-tt / 0.07)
    return norm(crack * 0.9 + body + 0.4 * squelch(dur, 300, 2500, 60))
def hiss(dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), 1400, 6000) * (0.75 + 0.25 * np.sin(2 * np.pi * 23 * tt)) + 0.3 * bp(noise(n), 300, 900))
def crunch(dur=0.12, bright=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    g = np.zeros(n)
    for _ in range(int(40 * dur * 10)):
        i = rng.integers(0, max(1, n - 200)); g[i:i + 200] += hp(noise(200), 2000) * np.exp(-np.arange(200) / SR / 0.0015) * rng.random()
    return norm(g * bright + 0.5 * lp(noise(n), 400) * np.exp(-tt / 0.02)) * env(n, 0.003, dur * 0.6)
def snap():
    """jaws closing: two teeth clacks and a soft wet knock"""
    n = int(0.25 * SR); tt = np.arange(n) / SR
    c = np.zeros(n)
    for at in (0.0, 0.018):
        i = int(at * SR); m = int(0.03 * SR)
        c[i:i + m] += resonate(np.r_[1.0, np.zeros(m - 1)], 2600, 0.985)[:m] * np.exp(-np.arange(m) / SR / 0.006)
    return norm(norm(c) + 0.6 * np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.03) + 0.3 * squelch(0.25, 300, 1800, 40))
def flaps(dur, hz):
    """ears and jowls flapping in a head shake"""
    n = int(dur * SR); out = np.zeros(n)
    for k in range(int(dur * hz)):
        i = int(k / hz * SR); m = int(0.05 * SR)
        if i + m < n: out[i:i + m] += bp(noise(m), 200, 2500) * np.exp(-np.arange(m) / SR / 0.012) * (0.6 + 0.4 * rng.random())
    return norm(out) * env(n, 0.05, 0.15)

sfx = np.zeros(N)
snarlA, snarlB = load('snarl_a_hPDv.mp3'), load('snarl_b_X0mB.mp3')
snortA, snortB = load('snort_a_lOM5.mp3'), load('snort_b_Nq05.mp3')
gag = load('gag_a_ucTH.mp3')
squirtA, squirtB = load('squirt_a_NIZT.mp3'), load('squirt_b_l35W.mp3')
scramble = load('scramble_a_iRJF.mp3')

# --- A: the hook (the snarl that opens the film is the next coyote's approach at the end: it wraps across the loop)
place(sfx, trim(snarlA, 0.0, 2.2, 0.3, 0.4), DUR - 1.05, 'coyote snarling breath, over the loop seam (generated)', -9, wrap=True)
place(sfx, creak(0.25, 260, 90), 0.12, 'the lids swell (tiny creak)', -30)
place(sfx, trim(squirtB, 0.0, 0.7, 0.002, 0.2), EV['jetA0'] - 0.01, 'blood squirt from the eye (generated)', -5)
place(sfx, squelch(0.18, 400, 2600, 70), EV['jetAHit'], 'blood hits the mouth (wet splat)', -18)
place(sfx, trim(snortA, 0.0, 1.6, 0.005, 0.3), EV['recoil0'] - 0.05, 'coyote recoils: snort and lip licking (generated)', -6)
place(sfx, crunch(0.15), EV['recoil0'] + 0.1, 'paws skid on sand', -24)
# --- B: inside the head
reveal = sig100(np.array(cj['reveal']))
inside = lp(reveal, 4)
place(sfx, squelch(0.6, 160, 1200, 22), EV['reveal0'] + 0.2, 'the skin thins away (soft wet tissue)', -16)
for b in cj['beats']:
    if b < EV['burst'] + 0.6:
        p = float(np.interp(b, np.arange(len(cj['p'])) / 100, cj['p']))
        place(sfx, heartbeat(), b, 'heartbeat' if b == cj['beats'][0] else None, -21 + 7 * p)
place(sfx, lp(trim(snarlB, 0.2, 2.4, 0.3, 0.6), 900), EV['shadow0'] - 0.1, 'the predator looms (snarl heard through the body, generated)', -11)
place(sfx, thump(0.3, 90, 50), EV['flinch'], 'flinch', -20)
place(sfx, creak(0.6, 110, 55), EV['sq0'], 'the muscle squeezes the vein', -17)
place(sfx, squelch(0.4, 120, 700, 25), EV['sq0'] + 0.25, 'the vein pinched shut', -21)
# pressure: a stretching vessel sound that rises in pitch and level with p, plus a creak on every beat
P = sig100(np.array(cj['p']))
dur_p = EV['burst'] - EV['p0']
st = stretch(dur_p, 90, 420)
place(sfx, st * np.interp(np.arange(len(st)) / SR + EV['p0'], t, 0.25 + 0.75 * P), EV['p0'], 'vessel walls stretching (rises with the pressure)', -17)
for b in cj['beats']:
    if EV['p0'] < b < EV['burst']:
        p = float(np.interp(b, np.arange(len(cj['p'])) / 100, cj['p']))
        place(sfx, creak(0.18, 180 + 300 * p, 80), b + 0.05, None, -27 + 8 * p)
tn = int((EV['burst'] - EV['tremble0']) * SR); tt = np.arange(tn) / SR
place(sfx, norm(np.sin(2 * np.pi * np.cumsum(900 + 900 * tt / tt[-1]) / SR) * (tt / tt[-1]) ** 2), EV['tremble0'], 'tension whine before the burst', -27)
# --- C: the burst and the stream
place(sfx, pop(), EV['burst'], 'the vessel bursts (wet pop)', -8)
place(sfx, trim(squirtA, 0.0, 2.0, 0.002, 0.3), EV['burst'] + 0.01, 'blood squirts out through the pore (generated)', -9)
jet = sig100(np.array(cj['jet']))
hs = hiss(DUR)
place(sfx, hs * lp((jet > 0.01).astype(float), 8) * (t > EV['burst'] + 1.2), 0, 'the stream (steady hiss while it flows)', -27)
place(sfx, trim(snarlB, 0.0, 2.8, 0.2, 0.5), EV['lunge0'], 'the coyote lunges in (generated snarl)', -9)
place(sfx, thump(1.0, 52, 26), EV['imp'] - 0.02, 'impact boom (slow motion)', -14)
place(sfx, lp(squelch(0.7, 200, 2000, 30), 2400), EV['imp'], 'blood hits the mouth (slowed splat)', -15)
place(sfx, snap(), EV['bite'] - 0.04, 'the jaws snap shut', -12)
# --- D: disgust
place(sfx, trim(snortB, 0.0, 1.0, 0.005, 0.2), EV['grim0'] - 0.15, 'disgusted snort (generated)', -8)
walk = np.array(cj['walk'])
wv = np.interp(t, np.arange(len(walk)) / 100, walk)
for k in range(1, 4):
    for half in (0, 0.5):
        target = -(k - 1) - half - 0.3
        hits = np.where((wv[:-1] > target) & (wv[1:] <= target))[0]
        if len(hits): place(sfx, crunch(0.16, 0.8), hits[0] / SR, 'paws on sand (steps back)' if k == 1 and half == 0 else None, -22)
place(sfx, flaps(EV['shake1'] - EV['shake0'], 6.4), EV['shake0'], 'head shake: ears and jowls flapping', -4)
place(sfx, gag, EV['spit'] - 0.12, 'gag, spit, head shake (generated)', -8)
place(sfx, thump(0.25, 110, 60), EV['land'], 'the lizard lands on the sand', -16)
place(sfx, crunch(0.2, 1.0), EV['land'] + 0.01, 'sand scatter', -20)
# --- E: the escape
run = sig100(np.array(cj['run']))
sc = scramble[: int(min(len(scramble) / SR, EV['run1'] - EV['run0'] + 0.3) * SR)]
place(sfx, sc * np.interp(np.arange(len(sc)) / SR + EV['run0'], t, np.clip(run * 1.4, 0, 1)), EV['run0'], 'lizard claws scrambling on sand (generated)', 0)
# claws: a tick for every foot plant (four feet, diagonal pairs) at the gait rate while it runs
rph = np.cumsum(9.0 * np.clip(run * 1.3, 0, 1)) / SR
plants = np.where(np.diff(np.floor(rph)) > 0)[0]
for k, i in enumerate(plants):
    place(sfx, crunch(0.05, 1.3) * (0.6 + 0.4 * rng.random()), i / SR, 'claw ticks on gravel (one per foot plant)' if k == 0 else None, -13)
for k, at in enumerate((EV['c2'] + 0.15, EV['c2'] + 0.5, EV['c2'] + 0.85)):
    place(sfx, crunch(0.14, 0.7), at, 'the next coyote: paws on sand' if k == 0 else None, -25 + 2 * k)
place(sfx, creak(0.3, 240, 80), DUR - 0.35, 'the lids swell again (tiny creak)', -30)

# ---------------- music: restrained, tense; the tempo's period divides the film exactly, wrapped round the loop
BEATS = 36
beat = DUR / BEATS
bpm = 60 / beat
mus = np.zeros(N)
def tom(f=58):
    n = int(0.5 * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * (1 + 0.5 * np.exp(-tt / 0.03)) * tt) * np.exp(-tt / 0.16))
def pizz(f, dur=0.3):
    n = int(dur * SR); tt = np.arange(n) / SR
    return lp(sum(np.sin(2 * np.pi * f * k * tt) / k ** 1.3 for k in range(1, 7)), 2200) * np.exp(-tt / 0.07)
D2, Eb2 = 73.42, 77.78
for k in range(BEATS):
    at = k * beat
    place(mus, tom(55) * (1.0 if k % 2 == 0 else 0.6), at, wrap=True)
    place(mus, hp(noise(int(0.03 * SR)), 5000) * np.exp(-np.arange(int(0.03 * SR)) / SR / 0.006) * 0.25, at + beat / 2, wrap=True)
    place(mus, pizz([D2 * 2, Eb2 * 2, D2 * 2, D2 * 2][k % 4]) * 0.5, at + beat * 0.25, wrap=True)
drone = sum(a * np.sin(2 * np.pi * f * t + 1.5 * np.sin(2 * np.pi * 0.11 * t + f)) for f, a in [(D2 / 2, 0.6), (D2, 0.35), (D2 * 1.5, 0.15)])
# keep the drone periodic over the film so the loop has no seam
drone = drone * 0 + sum(a * np.sin(2 * np.pi * (round(f * DUR) / DUR) * t + 1.5 * np.sin(2 * np.pi * (2 / DUR) * t)) for f, a in [(D2 / 2, 0.6), (D2, 0.35), (D2 * 1.5, 0.15)])
mus += 0.5 * lp(drone, 500)
# tremolo strings that rise with the pressure inside the head
fr = 220 * 2 ** (np.clip(P, 0, 1) * 7 / 12)
ph = 2 * np.pi * np.cumsum(fr) / SR
saw = sum(np.sin(k * ph) / k for k in range(1, 8))
trem = (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * lp(saw, 1800)
mus += 0.45 * trem * np.clip(lp(P * 1.2 + 0.1 * (P > 0), 3), 0, 1) * (t < EV['burst'])
# shape: drop out at the burst, only the boom through the slow motion, back for D/E
shape = np.ones(N)
shape *= 1 - 0.95 * np.clip((t - EV['burst']) / 0.02, 0, 1) * (1 - np.clip((t - (EV['burst'] + 0.5)) / 0.6, 0, 1))
shape *= 1 - 0.8 * np.clip((t - (EV['imp'] - 0.2)) / 0.1, 0, 1) * (1 - np.clip((t - (EV['bite'] + 0.2)) / 0.4, 0, 1))
shape *= 0.75 + 0.25 * np.clip((t - 1.0) / 2, 0, 1) * (1 - np.clip((t - 10) / 1, 0, 1)) + 0.25 * np.clip((t - 17.5) / 2.5, 0, 1)
mus *= shape

# ---------------- beds: desert air outside, muffled while inside the head
air = circ(lambda x: bp(x, 250, 2600), noise(N))
air *= 0.8 + 0.2 * np.sin(2 * np.pi * (3 / DUR) * t)
low = circ(lambda x: lp(x, 180), noise(N))
amb = norm(air) * (1 - 0.85 * inside) + 0.5 * norm(low) * inside

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Blood_Lizard_narration_V1.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=3.0, att=0.004, rel=0.09):
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0; envl = np.empty(len(x)); ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]; envl[i] = e
    lev = 20 * np.log10(envl + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), float(gr.min())
def limit(x, ceil_db, look=0.004, rel=0.06):
    from scipy.ndimage import minimum_filter1d
    need = np.minimum(1.0, db(ceil_db) / (np.abs(x) + 1e-12))
    g = minimum_filter1d(need, size=int(look * SR) * 2 + 1)
    a = np.exp(-1 / (rel * SR)); out = np.empty_like(g); y = 1.0
    for i in range(len(g)):
        y = g[i] if g[i] < y else a * y + (1 - a) * g[i]; out[i] = y
    return x * np.minimum(out, minimum_filter1d(need, size=3))
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, grmin = compress(v0)
vc = limit(vc, -9.0)
vg = -16.0 - meter.integrated_loudness(vc)
voice = vc * db(vg)
venv = lp(np.abs(voice), 6); venv = venv / (venv.max() + 1e-9)
vk = np.clip(venv * 3, 0, 1)
sfx_n = sfx / (np.max(np.abs(sfx)) + 1e-9)
mix = voice + db(-3) * sfx_n * (1 - 0.35 * vk) + db(-31) * amb * (1 - 0.4 * vk) + db(-27) * norm(mus) * (1 - 0.5 * vk)
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix = limit(mix, -1.7)
nr = int(0.004 * SR)
step = (mix[0] - (mix[1] - mix[0])) - mix[-1]
mix[-nr:] += step * np.linspace(0, 1, nr) ** 2
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Blood_Lizard_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, 'audio/mix/stems/voice.wav'), voice * g, SR, subtype='FLOAT')
sf.write(os.path.join(EP, 'audio/mix/stems/bed.wav'), mix - voice * g, SR, subtype='FLOAT')
# how loud the effects/music bed is under the voice, while the voice speaks
speech = np.abs(voice) > 0
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects_logged': len(LOG),
       'voice_lufs_in_mix': round(meter.integrated_loudness(voice * g), 2), 'bed_lufs_in_mix': round(meter.integrated_loudness(mix - voice * g), 2),
       'music_bpm': round(bpm, 3), 'music_beats': BEATS, 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
