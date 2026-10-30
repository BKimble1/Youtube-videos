#!/usr/bin/env python3
"""Sound design and mix, placed from the picture's own events (audio/cues.json, written by tools/export_cues.ts).
Sources: the narration master; one-shot effects generated with ElevenLabs sound effects (audio/sfx/el_*.mp3, see
audio/sfx/SFX_PROVENANCE.json); everything continuous (chainsaw sustain, forest/wind bed, catenary hum, servo, pad)
is built here: the chainsaw sustain is a granular loop of the generated chainsaw clip, its level driven frame by frame
by the picture's chain-run and cutting envelopes.
Writes audio/mix/FGW_Chainsaw_Robot_V1_mix.wav (48 kHz, 24-bit, stereo), stems, audio/mix/mix_measure.json,
audio/sfx_log.json, and source/public/audio/mix.wav."""
import json, os, subprocess, sys, hashlib
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, sosfiltfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SR = 48000
cues = json.load(open('audio/cues.json'))
tt = cues['tt']
FPS = cues['fps']
NF = cues['frames']
N = int(round(NF / FPS * SR))
rng = np.random.default_rng(7)
log = []

def dec(p):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).copy()

def lp(x, f, o=4):
    return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2):
    return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2):
    return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def norm_peak(x, p=0.9):
    return x / (np.abs(x).max() + 1e-9) * p
def env_from_frames(arr, smooth=0.03):
    """per-frame values -> per-sample envelope (linear interpolation, then smoothed)"""
    a = np.asarray(arr, np.float32)
    t = np.arange(len(a)) / FPS
    e = np.interp(np.arange(N) / SR, t, a).astype(np.float32)
    if smooth > 0:
        e = sosfiltfilt(butter(1, 1 / smooth / (2 * np.pi), 'low', fs=SR, output='sos'), e)
    return e
def place(bus, x, t, g=1.0, name=''):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0: return
    a, b = max(0, i), min(N, i + len(x))
    bus[a:b] += x[a - i:b - i] * g
    log.append({'t': round(t, 3), 'sfx': name, 'gain': round(g, 3)})

SFX = {k: dec(f'audio/sfx/el_{k}.mp3') for k in ['chainsaw_cut', 'chainsaw_stop', 'servo', 'clamp', 'crack', 'cabin', 'steel_hit']}

def granular(src, n, grain=0.35, hop=0.12, seed=1):
    """continuous texture from a short clip: Hann-windowed grains from random positions, overlap-added"""
    r = np.random.default_rng(seed)
    g = int(grain * SR); h = int(hop * SR)
    w = np.hanning(g).astype(np.float32)
    out = np.zeros(n + g, np.float32)
    for i in range(0, n, h):
        s = r.integers(int(0.1 * SR), len(src) - g - int(0.1 * SR))
        out[i:i + g] += src[s:s + g] * w
    return out[:n] / (g / h / 2)

act = cues['act']
act_s = np.array(act)
def act_env(names, fade=0.25):
    a = np.isin(act_s, names).astype(np.float32)
    return env_from_frames(a, smooth=fade / 3)

worksite = act_env(['worksite'])
cab = act_env(['cab'])
in_bilat = env_from_frames([(1.0 if (tt['another'] <= f / FPS < tt['imagine']) else 0.0) for f in range(NF)], 0.1)
cab_only = np.clip(cab - in_bilat, 0, 1)
safety = act_env(['safety'])
rollout = act_env(['rollout'])
hand = act_env(['hand'])

# ---------------------------------------------------------------- chainsaw ----
run = env_from_frames(cues['run'], 0.04)
cutting = env_from_frames(cues['cutting'], 0.06)
saw_tex = granular(SFX['chainsaw_cut'], N, 0.3, 0.1, seed=3)
# engine body under load: a low two-stroke pulse train (adds weight to the generated texture)
t = np.arange(N) / SR
f0 = 95 + 25 * (1 - cutting) * run
ph = np.cumsum(2 * np.pi * f0 / SR)
engine = (np.sign(np.sin(ph)) * 0.5 + np.sin(2 * ph) * 0.3).astype(np.float32)
engine = lp(engine, 900) * 0.25
chips = bp(rng.standard_normal(N).astype(np.float32), 1800, 6000) * 0.25 * cutting
saw = (saw_tex * (0.75 + 0.25 * cutting) + engine + chips) * run
# heard fully outside, muffled from inside the cabin, not at all in the other sets
saw_vis = worksite + 0.3 * cab_only
saw_bus = saw * worksite + lp(saw, 700) * 0.3 * cab_only
# the ending: the saw is switched off (stop clip at the run fall)
place_bus = np.zeros(N, np.float32)
place(place_bus, SFX['chainsaw_stop'], tt['still'] + 0.45, 0.8, 'chainsaw_stop')

# ---------------------------------------------------------------- wood -------
fx = np.zeros(N, np.float32)
for i, tc in enumerate(cues['through']):
    place(fx, SFX['crack'], tc - 0.05, 0.9, f'crack{i + 1}')
# grip closures: where the claw closes from wide open
op = np.array(cues['open'])
for f in range(1, NF):
    if op[f - 1] > 0.6 >= op[f] and act[f] == 'worksite':
        place(fx, SFX['clamp'], f / FPS + 0.15, 0.7, 'clamp')
place(fx, SFX['clamp'], tt['grabs'] + 0.25, 0.35, 'grip squeeze')
place(fx, SFX['clamp'], tt['weight'] + 0.2, 0.45, 'takes weight')

# ---------------------------------------------------------------- servos / boom
cv = env_from_frames(cues['clawV'], 0.08)
servo_tex = granular(hp(SFX['servo'], 200), N, 0.25, 0.08, seed=5)
servo = servo_tex * np.clip(cv / 6.0, 0, 1) * 0.55 * (worksite + 0.25 * cab_only)
bv = env_from_frames(cues['boomV'], 0.15)
hum_f = 70 + 30 * np.clip(bv, 0, 1)
boom = (np.sin(np.cumsum(2 * np.pi * hum_f / SR)) * 0.5 + np.sin(np.cumsum(2 * np.pi * hum_f * 2.02 / SR)) * 0.25).astype(np.float32)
boom = boom * np.clip(bv / 0.8, 0, 1) * 0.12 * worksite

# ---------------------------------------------------------------- controllers / haptics
tl = np.array(cues['tiltL'])
moving = np.abs(np.diff(tl, prepend=tl[0])) > 0.05
for f in range(1, NF):
    if moving[f] and not moving[f - 1] and act[f] == 'cab':
        click = bp(rng.standard_normal(int(0.03 * SR)).astype(np.float32), 2000, 7000) * np.exp(-np.linspace(0, 8, int(0.03 * SR)))
        place(fx, click, f / FPS, 0.25, 'controller click')
felt = env_from_frames(cues['felt'], 0.05)
haptic = (np.sin(2 * np.pi * 52 * t) * 0.6 + np.sin(2 * np.pi * 104 * t) * 0.2).astype(np.float32) * felt * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t) ** 2)
haptic *= 0.22
# the force-feedback moment: a soft, low push (sonic contrast)
thump = (np.sin(2 * np.pi * 48 * np.arange(int(0.6 * SR)) / SR) * np.exp(-np.linspace(0, 5, int(0.6 * SR)))).astype(np.float32)
place(fx, thump, tt['back'] - 0.05, 0.5, 'feedback thump')
# signal shimmer while the pulses travel (very quiet)
def shimmer(a, b, f1, g):
    m = env_from_frames([(1.0 if a <= k / FPS < b else 0.0) for k in range(NF)], 0.15)
    return (np.sin(2 * np.pi * f1 * t) * 0.5 + np.sin(2 * np.pi * f1 * 1.5 * t) * 0.3).astype(np.float32) * m * g
sig = shimmer(tt['tiny'], tt['resistance'], 880, 0.025) + shimmer(tt['resistance'] + 0.1, tt['pushingEnd'] + 0.3, 660, 0.03)

# ---------------------------------------------------------------- touch / steel arms
rustle = bp(rng.standard_normal(int(0.5 * SR)).astype(np.float32), 2500, 9000) * np.hanning(int(0.5 * SR)) * 0.35
place(fx, rustle, tt['fingertips'] - 0.15, 0.6, 'twig rustle')
place(fx, SFX['steel_hit'], tt['steel'] + 0.1, 0.95, 'STEEL hit')
place(fx, SFX['clamp'], tt['steel'] + 0.12, 0.4, 'claw touch')

# ---------------------------------------------------------------- safety ------
cat_hum = (np.sin(2 * np.pi * 100 * t) * 0.4 + np.sin(2 * np.pi * 200 * t) * 0.15 + np.sin(2 * np.pi * 300 * t) * 0.08).astype(np.float32) * 0.035 * safety
fall_land = tt['fall'] + 1.0
place(fx, lp(SFX['clamp'], 3000), fall_land, 0.35, 'fitting lands (illustration)')
arrive = act_env(['safety']) * env_from_frames([(1.0 if tt['moving'] - 0.4 <= k / FPS < tt['moving'] + 1.6 else 0.0) for k in range(NF)], 0.3)
rail_roll = lp(rng.standard_normal(N).astype(np.float32), 400) * 0.25 * arrive

# ---------------------------------------------------------------- rollout -----
for k, key in enumerate(['jrEast', 'jrWest', 'rolling', 'single']):
    tick = (np.sin(2 * np.pi * 1320 * np.arange(int(0.12 * SR)) / SR) * np.exp(-np.linspace(0, 9, int(0.12 * SR)))).astype(np.float32)
    place(fx, tick, tt[key] + (0.2 if key != 'jrEast' else 0), 0.12, f'card {key}')
clack = np.zeros(N, np.float32)
c0 = int(tt['reason'] * SR); c1 = int(tt['goal'] * SR)
for i in range(c0, c1, int(0.42 * SR)):
    for d in (0, int(0.09 * SR)):
        click = lp(rng.standard_normal(int(0.04 * SR)).astype(np.float32), 1500) * np.exp(-np.linspace(0, 7, int(0.04 * SR)))
        if i + d + len(click) < N: clack[i + d:i + d + len(click)] += click * 0.18
clack *= rollout

# ---------------------------------------------------------------- beds --------
# forest/wind: pink-ish noise with slow gusts; a few distant bird chirps
pink = lp(rng.standard_normal(N).astype(np.float32), 900, 2) + 0.3 * bp(rng.standard_normal(N).astype(np.float32), 2000, 5000)
gust = 0.6 + 0.4 * np.sin(2 * np.pi * t / 7.3) * np.sin(2 * np.pi * t / 3.1 + 1)
wind = pink * gust * 0.05
birds = np.zeros(N, np.float32)
for k in range(int(N / SR / 3.7)):
    tb = 1.5 + k * 3.7 + rng.random() * 1.5
    L = int(0.18 * SR)
    fr = 3200 + 900 * rng.random()
    ch = np.sin(2 * np.pi * np.cumsum(np.linspace(fr, fr * 1.25, L)) / SR) * np.hanning(L)
    i = int(tb * SR)
    if i + L < N: birds[i:i + L] += ch.astype(np.float32) * 0.012
outdoor = worksite + safety + 0.6 * hand
forest = (wind + birds) * outdoor
cabin_loop = granular(SFX['cabin'], N, 1.2, 0.4, seed=9)
cabin_bed = norm_peak(cabin_loop, 0.04) * cab
blue_room = lp(rng.standard_normal(N).astype(np.float32), 300) * 0.012 * (in_bilat + rollout)
# a quiet pad under everything (continuity across cuts): slow chords, sine + soft octave
chords = [(110.0, 138.6, 164.8), (98.0, 123.5, 146.8), (87.3, 110.0, 130.8), (98.0, 123.5, 155.6)]
pad = np.zeros(N, np.float32)
seg = 8.0
for k in range(int(N / SR / seg) + 1):
    a, b = int(k * seg * SR), min(N, int((k + 1) * seg * SR + 2 * SR))
    if a >= N: break
    tt_ = np.arange(b - a) / SR
    w = np.minimum(1, np.minimum(tt_ / 2, (tt_[-1] - tt_) / 2 + 1e-9)).astype(np.float32)
    ch = chords[k % len(chords)]
    s = sum(np.sin(2 * np.pi * fq * tt_) + 0.3 * np.sin(2 * np.pi * fq * 2 * tt_ + 0.5) for fq in ch)
    pad[a:b] += (s * w).astype(np.float32) * 0.012
pad = lp(pad, 1500)
# a lift for the steel-arms reveal and the ending (still quiet)
lift = env_from_frames([(1.0 if (tt['steel'] <= k / FPS < tt['stunt']) or k / FPS >= tt['gave'] else 0.0) for k in range(NF)], 0.4)
pad *= (1 + 0.8 * lift)

# ---------------------------------------------------------------- voice + duck -
voice = sf.read('audio/narration/FGW_Chainsaw_Robot_narration_V1.wav', dtype='float32')[0]
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
vl = np.sqrt(sosfiltfilt(butter(1, 4, 'low', fs=SR, output='sos'), voice ** 2) + 1e-12)
speaking = np.clip(vl / (np.percentile(vl[vl > 1e-4], 50) + 1e-9), 0, 1)
duck = 1 - 0.55 * sosfiltfilt(butter(1, 3, 'low', fs=SR, output='sos'), speaking)

sfx_bus = (saw_bus * 0.42 + place_bus * (1.0) * 0.5 + fx * 0.55 + servo + boom + haptic + sig + cat_hum + rail_roll + clack) * duck
bed_bus = (forest + cabin_bed + blue_room) * (0.55 + 0.45 * duck) + pad * (0.6 + 0.4 * duck)
# voice: gentle compression (slow) and presence
v = hp(voice, 70)
mix_m = v * 1.0 + sfx_bus + bed_bus
# stereo: beds wide (decorrelated), voice and effects centred
bed_r = np.roll(bed_bus, int(0.013 * SR))
L = v + sfx_bus + bed_bus
R = v + sfx_bus + bed_r
st = np.stack([L, R], 1)
# loudness to -14 LUFS, then a look-ahead-free soft limiter below -1.5 dBFS sample peak
meter = pyln.Meter(SR)
lufs0 = meter.integrated_loudness(st)
st *= 10 ** ((-14.0 - lufs0) / 20)
ceil = 10 ** (-1.5 / 20)
st = np.where(np.abs(st) > ceil * 0.8, np.sign(st) * (ceil * 0.8 + (ceil * 0.2) * np.tanh((np.abs(st) - ceil * 0.8) / (ceil * 0.2))), st)
lufs = meter.integrated_loudness(st)
os.makedirs('audio/mix/stems', exist_ok=True)
out = 'audio/mix/FGW_Chainsaw_Robot_V1_mix.wav'
sf.write(out, st.astype(np.float32), SR, subtype='PCM_24')
os.makedirs('source/public/audio', exist_ok=True)
sf.write('source/public/audio/mix.wav', st.astype(np.float32), SR, subtype='PCM_24')
for name, x in [('voice', v), ('sfx', sfx_bus), ('beds', bed_bus)]:
    sf.write(f'audio/mix/stems/{name}.wav', x.astype(np.float32), SR, subtype='PCM_24')
# true peak (4x oversampled)
from scipy.signal import resample_poly
tp = 20 * np.log10(np.abs(resample_poly(st, 4, 1, axis=0)).max() + 1e-12)
vl_db = meter.integrated_loudness(np.stack([v, v], 1) * 10 ** ((-14.0 - lufs0) / 20))
bl = meter.integrated_loudness(np.stack([sfx_bus + bed_bus] * 2, 1) * 10 ** ((-14.0 - lufs0) / 20))
measure = {'file': out, 'sha256': hashlib.sha256(open(out, 'rb').read()).hexdigest(), 'duration_s': round(N / SR, 4),
           'integrated_lufs': round(lufs, 2), 'true_peak_dbtp': round(float(tp), 2), 'sample_peak_dbfs': round(float(20 * np.log10(np.abs(st).max())), 2),
           'voice_only_lufs': round(vl_db, 2), 'effects_and_beds_lufs': round(bl, 2), 'voice_minus_rest_lu': round(vl_db - bl, 2)}
json.dump(measure, open('audio/mix/mix_measure.json', 'w'), indent=1)
json.dump(log, open('audio/sfx_log.json', 'w'), indent=0)
print(json.dumps(measure, indent=1))
