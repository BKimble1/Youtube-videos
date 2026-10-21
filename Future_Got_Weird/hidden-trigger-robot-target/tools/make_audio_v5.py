#!/usr/bin/env python3
"""Score, effects and final mix for FGW Hidden Trigger V5 (final dramatic animation pass). Same approved narration
file and offset as V3/V4; effects re-cued to the V5 picture: light plastic contact, one restrained theatrical-fluid
cue (softer in the opening excerpt), a short tension accent on the scientist reactions, servo, one mechanical stop and
the target-switch accent. No wet gore sounds, no scream.
V4 header follows. The approved V3 Test Voice narration is
used byte-for-byte as in V3 (same file, same 0 s offset, no processing beyond the shared mix gain); only effect cues
move to the V4 actions.
V3 header follows.
 Voice-led: the ElevenLabs Test Voice narration, a low
tension bed (same synthesiser as V1/V2), speed-driven servo, one grip sound, restrained mechanical stops and one
purposeful sound for the target change. No samples, no paid generation for the effects or music.

Inputs : audio/narration/narration_v3_testvoice.wav (approved V3 take), audio/cues_v5.json, qa/motion_v5.json (tools/export_motion_v5.ts)
Outputs: source/public/audio/mix_v5.wav, source/public/audio/narration_v3_testvoice.wav, audio/mix/stems_v5/*.wav,
         audio/mix/mix_v5_measure.json, audio/sfx_cues_v5.json
"""
import json, os, subprocess, re
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cues = json.load(open(os.path.join(EP, 'audio/cues_v5.json')))
SH, W = cues['SH'], cues['W3']
DUR = cues['DURATION'] / cues['FPS']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(7)  # fixed seed: deterministic noise


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'lowpass', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'highpass', fs=SR, output='sos'), x)


def place(buf, sig, at):
    i = int(round(at * SR))
    j = min(len(buf), i + len(sig))
    if j > i >= 0:
        buf[i:j] += sig[:j - i]


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


# ---------------- voice ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/narration_v3_testvoice.wav'))
assert vsr == SR
voice = np.zeros(N)
voice[:min(N, len(v))] = v[:N]

# ---------------- score (loop-continuous) ----------------
def score_period():
    n2 = 2 * N
    tt = np.arange(n2) / SR
    out = np.zeros(n2)
    # drone: A minor colour with a slow filter breath (period = DUR / 2 keeps the loop seamless)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * tt / (DUR / 2))
    for f, a in [(55.0, 0.5), (82.41, 0.28), (110.0, 0.16), (130.81, 0.07)]:
        out += a * np.sin(2 * np.pi * f * tt + 0.3 * np.sin(2 * np.pi * 0.11 * tt))
    out = lp(out, 900) * (0.75 + 0.25 * lfo)
    # upper pad so the bed survives small phone speakers (A3/E4/C5, slow tremolo), still well under the voice
    hi = sum(a * np.sin(2 * np.pi * f * tt + 1.3 * k) for k, (f, a) in enumerate([(220.0, 0.40), (329.63, 0.28), (523.25, 0.14)]))
    out += lp(hi, 2500) * (0.55 + 0.45 * np.sin(2 * np.pi * tt / (DUR / 8)) ** 2)
    air = bp(rng.standard_normal(n2), 300, 1400) * 0.02 * (0.6 + 0.4 * lfo)
    out += air
    # soft low pulse every 1.6 s (16 per loop), muted body
    beat = DUR / 16
    pulse = np.sin(2 * np.pi * 49 * np.arange(int(0.5 * SR)) / SR) * env_exp(int(0.5 * SR), 0.11)
    pulse = lp(pulse, 300) * 0.55
    for k in range(32):
        place(out, pulse, k * beat)
    # unresolved upper pulse into the loop point (minor second against the drone, last bar of each period)
    tone = (np.sin(2 * np.pi * 233.08 * np.arange(int(1.2 * SR)) / SR) * env_exp(int(1.2 * SR), 0.35))
    tone = lp(tone, 1200) * 0.12
    for k in range(2):
        place(out, tone, k * DUR + DUR - 0.8)
        place(out, tone * 0.7, k * DUR + DUR - 0.0001 - 0.0)  # lands on the loop point: heard at frame 0 of the replay
    return out[N:2 * N]

music = score_period()
music /= np.abs(music).max()

# ---------------- effects ----------------
fx = np.zeros(N)
fx_log = []

# servo: driven by the gripper speed from the shared kinematics (per frame), skipping the intentional cut frames
mo = json.load(open(os.path.join(EP, 'qa/motion_v5.json')))
spd = np.array([0.0 if r['cut'] else r['speed'] for r in mo])
spd[0] = mo[1]['speed']  # loop: frame 0 continues the motion of the last frame
# rendered over two loop periods and the second kept, so the servo's phase and filters run on across the loop point
fr_t = np.arange(2 * len(spd)) / cues['FPS']
t2 = np.arange(2 * N) / SR
sp = np.interp(t2, fr_t, np.tile(spd, 2))
sp = lp(sp, 6, 1)
sp = np.clip(sp, 0, None)
spn = np.clip(sp / 600.0, 0, 1)
ph = 2 * np.pi * np.cumsum(140 + 160 * spn) / SR
servo = (np.sin(ph) * 0.5 + 0.25 * np.sin(2 * ph) + 0.12 * np.sin(3.01 * ph))
servo = bp(servo + 0.25 * bp(rng.standard_normal(2 * N), 500, 1800), 120, 1800) * (spn ** 0.7) * 0.12
servo = servo[N:]
fx_log.append({'name': 'servo (speed-driven)', 'source': 'qa/motion_v5.json'})


def click(dur=0.05, f=2600, gain=0.6):
    n = int(dur * SR)
    s = bp(rng.standard_normal(n), f * 0.6, f * 1.6) * env_exp(n, 0.006)
    s += np.sin(2 * np.pi * 1100 * np.arange(n) / SR) * env_exp(n, 0.004) * 0.6
    return s * gain


def tap(gain=0.5):
    n = int(0.18 * SR)
    k = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 420 * k) + 0.6 * np.sin(2 * np.pi * 980 * k)) * env_exp(n, 0.03)
    s += bp(rng.standard_normal(n), 800, 3000) * env_exp(n, 0.004) * 0.5
    return lp(s, 4000) * gain


def latch(gain=0.5):
    a = click(0.04, 1800, 1.0)
    b = click(0.05, 1300, 0.8)
    s = np.zeros(int(0.12 * SR))
    place(s, a, 0); place(s, b, 0.055)
    return lp(s, 3500) * gain


def digi(gain=0.32, f=2200):
    n = int(0.06 * SR)
    k = np.arange(n) / SR
    return np.sin(2 * np.pi * f * k) * env_exp(n, 0.012) * gain


def swish(dur=0.42, gain=0.12):
    n = int(dur * SR)
    e = np.sin(np.pi * np.arange(n) / n) ** 2
    return bp(rng.standard_normal(n), 500, 3500) * e * gain


def stop(gain=0.5):
    """restrained mechanical stop: low damped knock plus a short metallic tick"""
    n = int(0.28 * SR)
    k = np.arange(n) / SR
    s = np.sin(2 * np.pi * 95 * k) * env_exp(n, 0.045) + 0.5 * np.sin(2 * np.pi * 190 * k) * env_exp(n, 0.03)
    place(s, click(0.03, 2200, 0.35), 0)
    return lp(s, 2500) * gain


def grip(gain=0.4):
    """gripper fingers closing: a short servo whirr into a soft latch"""
    n = int(0.22 * SR)
    k = np.arange(n) / SR
    f = 600 + 900 * k / k[-1]
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * k / k[-1]) ** 2 * 0.4
    out = np.zeros(int(0.32 * SR))
    place(out, bp(s + 0.3 * bp(rng.standard_normal(n), 900, 2600), 300, 3000), 0)
    place(out, latch(0.9), 0.2)
    return out * gain


def target_change(gain=0.5):
    """the one sound for the switched target: a low tone that bends down a semitone under a single soft tick"""
    n = int(0.9 * SR)
    k = np.arange(n) / SR
    f = 110 * 2 ** (-(np.clip(k / 0.35, 0, 1)) / 12)
    tone = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR)) * env_exp(n, 0.35)
    tone *= np.clip(k / 0.02, 0, 1)
    out = lp(tone, 1400) * 0.9
    place(out, digi(0.5, 2400), 0)
    return out * gain


def contact_tap(gain=0.3):
    """light hollow plastic contact"""
    n = int(0.12 * SR)
    k = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 780 * k) + 0.6 * np.sin(2 * np.pi * 1530 * k)) * env_exp(n, 0.018)
    s += bp(rng.standard_normal(n), 1200, 4000) * env_exp(n, 0.006) * 0.4
    return lp(s, 5000) * gain


def squirt(gain=0.3):
    """restrained theatrical squirt: a short filtered hiss with a small falling pitch, then a few soft ticks as drops land"""
    n = int(0.3 * SR)
    k = np.arange(n) / SR
    env = np.clip(k / 0.01, 0, 1) * np.exp(-k / 0.09)
    hiss = bp(rng.standard_normal(n), 900, 3200) * env
    tone = np.sin(2 * np.pi * np.cumsum(520 - 260 * k / k[-1]) / SR) * env * 0.25
    return lp(hiss + tone, 4200) * gain


def drip_ticks(gain=0.12):
    out = np.zeros(int(0.25 * SR))
    for i, d in enumerate([0.0, 0.05, 0.09, 0.16]):
        place(out, click(0.02, 2400 - 200 * i, 0.6), d)
    return lp(out, 3500) * gain


def tension(gain=0.22):
    """short low swell for a reaction: two close low tones rising in level, cut off cleanly"""
    n = int(0.45 * SR)
    k = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 98 * k) + np.sin(2 * np.pi * 103.8 * k) + 0.4 * np.sin(2 * np.pi * 196 * k)) * np.clip(k / 0.3, 0, 1) * np.clip((0.45 - k) / 0.06, 0, 1)
    return lp(s, 900) * gain


C = cues['CONTACT']
land0 = min(L['t'] for L in cues['LANDINGS'])
events = [
    ('plastic contact (opening excerpt)', C['preview'], contact_tap(0.24)),
    ('theatrical-fluid cue, softer (opening excerpt)', C['preview'] + 0.01, squirt(0.18)),
    ('tension accent (reaction A)', SH['sciA'] - 0.02, tension(0.2)),
    ('mechanical stop (blade arrives over the intact hand)', 4.5, stop(0.32)),
    ('grip (gripper tightens on the toy knife)', W['toy'] - 0.36, grip(0.28)),
    ('target change (apple -> hand, "switched")', W['switched'] - 0.04, target_change(0.5)),
    ('plastic contact (payoff)', C['main'], contact_tap(0.3)),
    ('theatrical-fluid cue (payoff)', C['main'] + 0.01, squirt(0.3)),
    ('drops land on the bench (payoff)', C['main'] + land0, drip_ticks(0.12)),
    ('tension accent (reaction C)', SH['sciC'] - 0.02, tension(0.24)),
]
for name, at, sig in events:
    place(fx, sig, at)
    fx_log.append({'name': name, 'time': round(at, 3)})
fx = fx + servo

# ---------------- mix ----------------
def envelope(x, att=0.03, rel=0.25):
    a = np.abs(x)
    out = np.zeros_like(a)
    ca, cr = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    y = 0.0
    for i in range(len(a)):  # simple follower (fine for 25 s)
        c = ca if a[i] > y else cr
        y = c * y + (1 - c) * a[i]
        out[i] = y
    return out

venv = envelope(lp(voice, 3000))
vact = np.clip(venv / (venv.max() * 0.08), 0, 1)
duck_db = -7.0 * vact
# the bed dips a little more while the target changes, so the one change sound reads clearly
s0, s1 = W['switched'] - 0.1, W['switched'] + 0.9
duck_db -= 3.0 * np.clip(np.minimum((t - s0) / 0.1, (s1 - t) / 0.3), 0, 1)
duck = 10 ** (lp(duck_db, 12, 1) / 20)
music_bus = music * duck * 10 ** (-21 / 20)

voice_bus = voice
fx_bus = fx * 10 ** (-6 / 20)
mono = voice_bus + music_bus + fx_bus

# small stereo width on music/fx only (voice centred)
mL = music_bus * 1.0 + fx_bus
mR = np.roll(music_bus, int(0.011 * SR)) * 1.0 + fx_bus
L, R = voice_bus + mL, voice_bus + mR
st = np.stack([L, R], 1)

meter = pyln.Meter(SR)
gain_db = -15.0 - meter.integrated_loudness(st)
st *= 10 ** (gain_db / 20)


def limit(x, ceiling_db=-1.5):
    c = 10 ** (ceiling_db / 20)
    up = np.max(np.abs(resample_poly(x, 4, 1, axis=0)), axis=1).reshape(-1, 4).max(1)[:len(x)]
    g = np.minimum(1, c / np.maximum(up, 1e-9))
    w = int(0.004 * SR)
    g = -np.convolve(-g, np.ones(1), 'same')
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(g, size=2 * w + 1)
    gs = np.copy(g)
    rel = np.exp(-1 / (0.08 * SR))
    for i in range(1, len(gs)):
        gs[i] = min(g[i], rel * gs[i - 1] + (1 - rel) * g[i])
    return x * gs[:, None]

st = limit(st)
st *= 10 ** ((-15.0 - meter.integrated_loudness(st)) / 20)
st = limit(st)

os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems_v5'), exist_ok=True)
mix_path = os.path.join(EP, 'source/public/audio/mix_v5.wav')
sf.write(mix_path, st.astype(np.float32), SR, subtype='PCM_24')
sf.write(os.path.join(EP, 'source/public/audio/narration_v3_testvoice.wav'), voice.astype(np.float32), SR, subtype='PCM_24')
for name, sig in [('voice', voice_bus), ('music_ducked', music_bus), ('fx', fx_bus)]:
    sf.write(os.path.join(EP, f'audio/mix/stems_v5/{name}.wav'), sig.astype(np.float32), SR, subtype='PCM_24')

r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', mix_path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
summ = r[r.rfind('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
LRA = float(re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1))
# speech-to-bed ratio while the voice is active
act = vact > 0.5
def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
meas = {'integrated_LUFS': I, 'true_peak_dBTP': TP, 'LRA_LU': LRA, 'duration_s': round(N / SR, 3),
        'voice_minus_music_dB_during_speech': round(rms_db(voice_bus[act]) - rms_db(music_bus[act]), 1),
        'voice_minus_fx_dB_during_speech': round(rms_db(voice_bus[act]) - rms_db(fx_bus[act]), 1),
        'loop_seam_sample_jump': float(np.abs(st[0] - st[-1]).max())}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_v5_measure.json'), 'w'), indent=1)
json.dump(fx_log, open(os.path.join(EP, 'audio/sfx_cues_v5.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
