#!/usr/bin/env python3
"""Score, effects and mix for FGW "This Laser Makes You Hear Voices". The narration (take 3, unedited) is the primary
audio and is only gain-scaled. Everything else is synthesised here (no samples, no third-party music):
  - room tone: a faint, low air-conditioning hush;
  - a restrained tense bed: a low pad, a soft pulse that firms up as the bystander approaches, a brief dip when the
    message is cut, and a warm lift when it comes back;
  - the transmitted MESSAGE (what she hears): a quiet, nonlexical, voice-like murmur (a glottal source through moving
    vowel formants, syllable rhythm, no consonants, so no intelligible words). It is one deterministic function of
    time, so the texture is identical before and after the obstruction. It is gated ONLY by the picture's own
    `received` state (tools/export_cues.ts -> audio/cues.json), on the exact frames the path is cut and restored;
    narration, music and room tone continue. A slight lean toward the left channel (her exposed left ear), mono-safe;
  - sparse physical accents placed from the picture's timeline: the bystander's heel strikes (levelled by the camera's
    distance), the section opening and closing, the magnifier opening and closing, a tiny warm tick at absorption, the
    8 FT line landing.
Inputs : audio/narration/FGW_Laser_Voices_narration_final.wav, audio/cues.json
Outputs: source/public/audio/mix.wav, audio/mix/FGW_Laser_Voices_V1_mix.wav, audio/mix/stems/*.wav,
         audio/mix/mix_measure.json, audio/sfx_cues.json"""
import json, math, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, WORDS, F, MAG, OV, WALK = cj['DUR'], cj['WORDS'], cj['frames'], cj['MAG'], cj['OV'], cj['WALK']
FPS = cj['FPS']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(31)
w = lambda i: WORDS[i]['start']
we = lambda i: WORDS[i]['end']

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at):
    i = int(round(at * SR)); j = min(N, i + len(sig))
    if i < N and j > max(0, i): buf[max(0, i):j] += sig[max(0, -i):j - i]
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def per_frame(key):
    """a per-frame 0/1 state held exactly over each frame's duration (the picture's own frames)"""
    v = np.array([f[key] for f in F], float)
    idx = np.minimum((t * FPS).astype(int), len(v) - 1)
    return v[idx]
def smooth_gate(g, ms=8):
    k = max(1, int(ms / 1000 * SR)); ker = np.ones(k) / k
    return np.convolve(g, ker, mode='same')

# ---------------- voice (unchanged recording) ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Laser_Voices_narration_final.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
voice = v.copy()

# ---------------- the message: a nonlexical voice-like murmur ----------------
VOW = {'a': (750, 1250, 2600), 'o': (500, 900, 2500), 'e': (480, 1900, 2600), 'i': (330, 2250, 3000), 'u': (360, 800, 2400), 'ae': (650, 1700, 2500)}
seq = ['a', 'e', 'o', 'i', 'ae', 'u', 'e', 'a', 'o', 'i', 'e', 'u', 'a', 'ae', 'o', 'e']
SYL = 0.19  # one syllable
def message(tt):
    """deterministic function of global time: syllable index, vowel formants, envelope, pitch"""
    n = len(tt); out = np.zeros(n)
    k = np.floor(tt / SYL).astype(int); u = tt / SYL - k
    # words of 3-4 syllables separated by short gaps
    wordpos = k % 7
    gap = (wordpos == 3) | (wordpos == 6)
    a_env = np.where(gap, 0.0, np.sin(np.pi * np.clip(u * 1.15, 0, 1)) ** 0.7)
    # pitch: phrase declination (4.2 s phrases) + a lilt per word + slight vibrato
    phr = (tt % 4.2) / 4.2
    f0 = 212 * (1.08 - 0.16 * phr) * (1 + 0.06 * np.sin(2 * np.pi * (k % 7) / 7 + 0.7)) * (1 + 0.008 * np.sin(2 * np.pi * 5.3 * tt))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    # formants: interpolate between this syllable's vowel and the next
    F1 = np.zeros(n); F2 = np.zeros(n); F3 = np.zeros(n)
    va = np.array([VOW[seq[i % len(seq)]] for i in range(k.max() + 2)], float)
    cur, nxt = va[k], va[k + 1]
    blend = np.clip((u - 0.65) / 0.35, 0, 1)[:, None]
    fm = cur * (1 - blend) + nxt * blend
    F1, F2, F3 = fm[:, 0], fm[:, 1], fm[:, 2]
    for h in range(1, 22):
        fh = h * f0
        amp = (1 / h ** 0.9) * sum(g / (1 + ((fh - Fk) / bw) ** 2) for Fk, bw, g in [(F1, 90, 1.0), (F2, 120, 0.55), (F3, 170, 0.25)])
        amp = amp * (fh < 4200)
        out += amp * np.sin(h * ph)
    breath = bp(rng.standard_normal(n), 500, 3500) * 0.05
    return (out + breath) * a_env
msg_src = message(t)
msg_src = bp(msg_src, 220, 3800)
msg_src /= np.abs(msg_src).max() + 1e-9
received = per_frame('received')
gate = smooth_gate(received, 8)
msg = msg_src * gate

# ---------------- room tone ----------------
room = lp(rng.standard_normal(N), 380) * 0.5 + lp(rng.standard_normal(N), 1600) * 0.08

# ---------------- music bed ----------------
def pad(freqs):
    out = np.zeros(N)
    for kk, (f, a) in enumerate(freqs):
        lfo = 0.75 + 0.25 * np.sin(2 * np.pi * (0.09 + 0.03 * kk) * t + kk)
        out += a * lfo * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t + 0.3))
    return out
lowpad = lp(pad([(73.42, 0.5), (110.0, 0.32), (146.83, 0.16), (174.61, 0.11)]), 600)  # D minor, low
warm = lp(pad([(73.42, 0.4), (110.0, 0.3), (146.83, 0.18), (185.0, 0.14), (220.0, 0.08)]), 900)  # D major colour
bpm = 92; beat = 60 / bpm
pulse = np.zeros(N)
for kk in range(int(DUR / beat) + 1):
    n = int(0.3 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.07) + 0.15 * lp(rng.standard_normal(n), 300) * np.exp(-tt / 0.02)
    place(pulse, s * (0.8 if kk % 2 == 0 else 0.5), kk * beat)
# a soft high figure under the mechanism (magnifier and sweep): two notes per beat, very quiet
notes = [587.33, 698.46, 880.0, 783.99]
fig = np.zeros(N)
for kk in range(int(DUR / (beat / 2)) + 1):
    f = notes[kk % len(notes)]; n = int(0.45 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / 0.12) * env(n, 0.005, 0.06)
    place(fig, s, kk * beat / 2)
mech = win(MAG['open0'], OV['sweep'][3], 0.5, 0.6)
approach = win(WALK['turn0'], WALK['go1'], 1.2, 0.4)
cut = per_frame('blocked')
dip = 1 - 0.55 * smooth_gate(cut, 250) * win(w(83) - 0.05, WALK['go1'], 0.05, 0.4)
lift = win(WALK['go1'] + 0.6, DUR, 0.5, 0.01)
music = (lowpad * (1 - 0.6 * lift) + warm * 0.9 * lift) + pulse * (0.35 + 0.35 * approach) + fig * 0.07 * mech
music *= dip

# ---------------- effects ----------------
sfx = np.zeros(N); log = []
def add(name, sig, at, gain_db):
    place(sfx, sig * db(gain_db), at); log.append({'name': name, 'at': round(at, 3), 'dur': round(len(sig) / SR, 3), 'gain_db': round(gain_db, 1)})
def step(d=0.16):
    n = int(d * SR); tt = np.arange(n) / SR
    knock = np.sin(2 * np.pi * (95 + 25 * rng.random()) * tt) * np.exp(-tt / 0.02)
    sc = bp(rng.standard_normal(n), 900, 4200) * np.exp(-np.maximum(0, tt - 0.015) / 0.03) * (tt > 0.01)
    return knock * 0.9 + 0.3 * lp(rng.standard_normal(n), 800) * np.exp(-tt / 0.01) + 0.18 * sc
def click(f=2400, d=0.05):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006) + 0.3 * bp(rng.standard_normal(n), 2000, 7000) * np.exp(-tt / 0.004)
def slide(d=0.35, lo=600, hi=2200):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * tt) ** 2
def glass(f=1318.5, d=0.9):
    n = int(d * SR); tt = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in [(1, 1), (2.01, 0.35), (3.0, 0.15)])
    return s * np.exp(-tt / 0.3) * env(n, 0.03, 0.3)
def tick(f=1800, d=0.06):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.012)
def lvl(dist, ref=2.5, lo=-8.0, hi=4.0): return float(np.clip(-20 * math.log10(max(0.3, dist) / ref), lo, hi))
ft = np.array([f['t'] for f in F]); byD = np.array([f['byD'] for f in F])
for kk, s in enumerate(cj['strikes']):
    d = float(np.interp(s['t'], ft, byD))
    add(f"bystander step {kk + 1} ({s['foot']})", step(), s['t'], -31 + lvl(d))
add('magnifier opens (glass)', glass(1318.5), MAG['open0'] + 0.05, -36)
add('absorption (warm tick)', tick(1046.5, 0.12) * env(int(0.12 * SR), 0.004, 0.08), MAG['hit'], -34)
add('expansion (soft puff)', lp(rng.standard_normal(int(0.3 * SR)), 900) * env(int(0.3 * SR), 0.02, 0.22), MAG['expand'], -36)
add('magnifier closes (glass)', glass(987.8, 0.7), MAG['close0'], -38)
add('section opens: latch', click(2600), OV['section'][0] + 0.05, -32)
add('section opens: cover slide', slide(0.4), OV['section'][0] + 0.1, -36)
for kk in range(4):
    add(f'scanning mirror tick {kk + 1}', click(3400, 0.03) * 0.6, OV['sweep0'] + kk / cj['SWEEP_HZ'], -38)
add('section closes: cover slide', slide(0.35, 500, 1800), OV['section'][2], -37)
add('section closes: latch', click(2200), OV['section'][3] - 0.05, -33)
add('8 FT line lands (tick)', tick(1567.98, 0.08), OV['dimDraw'][1], -35)

# ---------------- mix ----------------
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
ve = np.abs(voice); ve = lp(ve, 6, 1); ve = ve / (ve.max() + 1e-9)
duck = 1 - 0.4 * np.clip(ve * 6, 0, 1)
voice_l = voice * db(-17 - lufs(voice))
mus_l = music * duck * db(-17 - 15 - lufs(music * duck))  # bed ~15 LU under the voice
room_l = room * db(-17 - 30 - lufs(room))
msg_ref = msg_src * win(0, DUR, 0.01, 0.01)
msg_l = msg * db(-17 - 15 - lufs(msg_ref))  # the message about 15 LU under the narration
sfx_l = sfx * (1 - 0.3 * np.clip(ve * 6, 0, 1))
pan = 0.18  # a slight lean to the left (her exposed ear); both channels always carry it
L = voice_l + mus_l + room_l + sfx_l + msg_l * (1 + pan)
R = voice_l + mus_l + room_l + sfx_l + msg_l * (1 - pan)
st = np.stack([L, R], 1)
g = -14 - lufs(st)
st *= db(g)
lim = db(-1.5)
if np.abs(st).max() > lim:
    st = np.tanh(st / lim) * lim
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix.wav'), st, SR, subtype='PCM_24')
shutil.copy(os.path.join(EP, 'source/public/audio/mix.wav'), os.path.join(EP, 'audio/mix/FGW_Laser_Voices_V1_mix.wav'))
for name, x in [('voice', voice_l), ('music', mus_l), ('room', room_l), ('sfx', sfx_l), ('message', msg_l)]:
    sf.write(os.path.join(EP, f'audio/mix/stems/{name}.wav'), x * db(g), SR, subtype='PCM_24')
band = lambda x: bp(x, 400, 5000)
spk = ve > 0.08
rest = (mus_l + room_l + sfx_l + msg_l) * db(g)
r = lambda x: 10 * np.log10(np.mean(x[spk] ** 2) + 1e-12)
corr = float(np.corrcoef(voice, voice_l)[0, 1])
# the message gate measured on the stem: RMS inside each received / blocked window
def rms_db(x, a, b): i, j = int(a * SR), int(b * SR); return round(10 * np.log10(np.mean(x[i:j] ** 2) + 1e-14), 1)
ms = msg_l * db(g)
gate_check = {'message_rms_db_before_block': rms_db(ms, w(83) - 1.0, w(83) - 0.1), 'message_rms_db_while_blocked': rms_db(ms, w(83) + 0.1, WALK['go1']),
              'message_rms_db_after_restore': rms_db(ms, 32.1, DUR - 0.1),
              'received_windows_s': [[round(F[i]['t'], 3), None] for i in range(len(F)) if F[i]['received'] and (i == 0 or not F[i - 1]['received'])]}
mono = st.mean(1)
meas = {'integrated_lufs_stereo': round(lufs(st), 2), 'integrated_lufs_mono_fold': round(lufs(mono), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(st).max()), 2),
        'voice_over_rest_phone_band_db': round(r(band(voice_l * db(g))) - r(band(rest)), 1), 'duration_s': DUR, 'voice_stem_vs_source_corr': round(corr, 6),
        'effects': len(log), 'gate': gate_check}
json.dump(meas, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
json.dump(log, open(os.path.join(EP, 'audio/sfx_cues.json'), 'w'), indent=1)
print(json.dumps(meas, indent=1))
