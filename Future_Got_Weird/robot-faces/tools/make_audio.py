#!/usr/bin/env python3
"""Score, effects and room tone for "Robots Are Learning to Copy Our Faces", ducked under the selected narration.
All sound is synthesised here (no samples, no third-party music); every cue comes from audio/cues.json, which is
exported from the picture's own timeline (tools/export_cues.ts).

    python3 tools/make_audio.py      (run from the episode folder; numpy, scipy, soundfile, pyloudnorm)

Outputs: audio/mix/FGW_Robot_Faces_V1_mix.wav (48 kHz 24-bit stereo), source/public/audio/mix.wav (render copy),
audio/mix/stems/*.wav (not committed), audio/mix/mix_measure.json.
Targets (as the other long-form FGW episodes): integrated -14 LUFS, true peak <= -1.0 dBTP, music kept well under the
voice. The servo sounds are illustrative, short and quiet; no effect sits on a narrated word's onset at full level.
"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

SR = 48000
rng = np.random.default_rng(11)
C = json.load(open('audio/cues.json'))
K = C['K']
narr, sr0 = sf.read('audio/narration/FGW_Robot_Faces_narration_V1.wav')
assert sr0 == SR
N = len(narr)
t_all = np.arange(N) / SR


def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------------------------------------ effects
def fx(kind, p=1.0, dur=0.3):
    if kind == 'servo':      # a small servo move: a band-limited whirr with a pitch glide and soft stop
        n = int(dur * SR); t = np.arange(n) / SR
        f = (420 + 160 * np.sin(np.pi * t / dur)) * p
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + 0.25 * np.sin(2 * np.pi * np.cumsum(2.01 * f) / SR)
        x += bp(noise(n), 900 * p, 3200 * p) * 0.35
        e = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.06)
        return x * e * 0.6
    if kind == 'shutter':    # camera record: two soft clicks
        n = int(0.12 * SR); t = np.arange(n) / SR
        x = bp(noise(n), 2500, 8000) * (np.exp(-t / 0.004) + 0.6 * np.exp(-np.maximum(0, t - 0.05) / 0.004) * (t > 0.05))
        return x * 0.8
    if kind == 'blip':       # a UI label settling
        n = int(0.16 * SR); t = np.arange(n) / SR
        return (np.sin(2 * np.pi * 1320 * p * t) + 0.4 * np.sin(2 * np.pi * 1980 * p * t)) * np.exp(-t / 0.035) * 0.35
    if kind == 'card':       # paper card in: a soft swish
        n = int(0.32 * SR); t = np.arange(n) / SR
        return bp(noise(n), 600, 4000) * np.sin(np.pi * t / 0.32) ** 2 * 0.45
    if kind == 'monitor':    # monitor wakes: click + short rising hum
        n = int(0.6 * SR); t = np.arange(n) / SR
        x = bp(noise(n), 3000, 9000) * np.exp(-t / 0.005) * 0.6
        x += np.sin(2 * np.pi * (110 + 40 * t) * t) * np.minimum(1, t / 0.2) * np.exp(-t / 0.4) * 0.25
        return x
    if kind == 'open':       # a section opens: a low soft "unseal"
        n = int(0.5 * SR); t = np.arange(n) / SR
        return (lp(noise(n), 500) * np.exp(-t / 0.12) * 0.8 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.15) * 0.3)
    if kind == 'flap':       # sock-puppet felt flap (very soft)
        n = int(0.08 * SR); t = np.arange(n) / SR
        return lp(noise(n), 1200) * np.exp(-t / 0.02) * 0.4
    if kind == 'whoosh':     # the camera's longer travel (very soft air)
        n = int(dur * SR); t = np.arange(n) / SR
        return bp(noise(n), 300, 2500) * np.sin(np.pi * t / dur) ** 2 * 0.25
    raise ValueError(kind)


cues = []  # (time, kind, gain dB, pitch, dur, pan)
def cue(t, kind, db=0.0, p=1.0, dur=0.3, pan=0.0): cues.append((t, kind, db, p, dur, pan))

# hook: the robot joins the smile; the corner push
cue(0.95, 'servo', -6, 0.9, 0.8, -0.35)
cue(K['corner'] + 1.2, 'servo', -9, 1.1, 0.5, -0.3)
cue(K['corner'] + 2.1, 'servo', -10, 0.95, 0.9, -0.3)
# mirror reveal: one long soft travel
cue(K['mirrorCut'] + 1.0, 'whoosh', -10, dur=5.5)
# mechanism: the section opens; the x-ray; combinations
cue(K['motors'] - 1.0, 'open', -6, pan=0.0)
for b in C['babble']:
    cue(b - 0.12, 'servo', -7, 0.8 + 0.1 * (b % 3), 0.32, 0.0)
cue(K['columbia'] + 0.2, 'blip', -10)
cue(K['motors'] + 0.7, 'blip', -9)
# mouths: panels in, the puppet (flaps follow loud onsets), the replay
cue(K['banana'] - 0.05, 'card', -8)
cue(K['puppet'] - 0.1, 'card', -9, pan=0.4)
cue(K['follow'], 'card', -9, pan=0.4)
# practice: commands, servo, shutter
for tr in C['trials']:
    cue(tr + 0.35, 'servo', -6, 1.0, 0.5, 0.0)
    cue(tr + 1.0, 'shutter', -6, pan=0.15)
# skin: the pull
cue(K['pull'] - 0.1, 'servo', -6, 0.75, 0.7, -0.2)
# watch: the robot turns, the monitor wakes
cue(K['once'] + 0.6, 'servo', -6, 0.7, 1.4, 0.1)
cue(K['people'] - 0.3, 'monitor', -4, pan=0.5)
cue(K['study26'] + 0.1, 'blip', -10)
cue(K['linked'] + 0.6, 'blip', -10)
# distinction cards
cue(K['distinction'] + 2.0, 'card', -7, pan=-0.3)
cue(K['distinction'] + 3.8, 'card', -7, pan=0.3)
# late smile: the switch-on
cue(K['switchOn'] + 0.5, 'servo', -5, 1.25, 0.25, -0.35)
# 2024 study: cut tag, cue to the eye, models, prediction
cue(K['study24'] + 0.1, 'blip', -10)
cue(K['oneModel'] + 0.7, 'blip', -8, 1.2)
cue(K['oneModel'] + 0.7, 'card', -10)
cue(K['another2'], 'card', -10)
cue(C['co24']['predict'], 'servo', -7, 0.95, 1.3, -0.35)
# together / use / callback
cue(K['these'] + 0.3, 'open', -10)
cue(K['picture'], 'blip', -11)
cue(K['again'] + 1.1, 'servo', -8, 0.9, 0.8, -0.35)

# render effects (stereo by pan), each softened if it lands on speech
sfxL = np.zeros(N); sfxR = np.zeros(N)
for (t, kind, db, p, dur, pan) in cues:
    x = fx(kind, p, dur) * 10 ** (db / 20)
    i = int(t * SR)
    if i >= N: continue
    x = x[:N - i]
    sfxL[i:i + len(x)] += x * np.sqrt(0.5 * (1 - pan))
    sfxR[i:i + len(x)] += x * np.sqrt(0.5 * (1 + pan))
# puppet flaps: on loud onsets during the puppet line
pa, pb = K['puppet'], K['follow'] - 0.2
env = json.load(open('source/src/data/env.json'))['db']
prev = -90
for k in range(int(pa * 100), int(pb * 100)):
    if env[k] > -22 and prev <= -26:
        x = fx('flap') * 10 ** (-10 / 20); i = int(k / 100 * SR)
        sfxL[i:i + len(x)] += x * 0.5; sfxR[i:i + len(x)] += x * 0.8
    prev = env[k]

# room tone: a quiet lab (air, a faint electrical hum), lower in the diagrams
room = lp(noise(N), 700) * 0.6 + np.sin(2 * np.pi * 120 * t_all) * 0.05
room = hp(room, 60)

# ------------------------------------------------------------------------------------------------ score
CH = {
    'Am': [45, 57, 60, 64, 67], 'F': [41, 53, 57, 60, 64], 'C': [36, 48, 55, 60, 64], 'G': [43, 55, 59, 62, 67],
    'Dm': [38, 50, 57, 62, 65], 'Fmaj7': [41, 53, 57, 64, 69], 'Cmaj7': [36, 48, 55, 59, 64], 'Em': [40, 52, 55, 59, 64],
}
def pad(ch, n, bright=0.5, seed=0):
    t = np.arange(n) / SR; x = np.zeros(n)
    for j, m in enumerate(CH[ch]):
        f = NOTE(m)
        for d in (-0.1, 0.0, 0.12):
            ph = (seed + j + d) * 2.7
            x += (np.sin(2 * np.pi * f * (1 + d / 100) * t + ph) + 0.2 * np.sin(2 * np.pi * 2 * f * t + ph)) / (1 + 0.2 * j)
    return lp(x, 400 + 2200 * bright) / (len(CH[ch]) * 3)
def pluck(m, n, decay=0.4):
    t = np.arange(n) / SR; f = NOTE(m)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.05)) * np.exp(-t / decay)
def soft_kick(n):
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * (48 + 40 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.18)

BPM = 84.0; beat = 60 / BPM; bar = 4 * beat
PROG = {
    'hook': ['Am', 'F', 'Am', 'G'], 'curious': ['Fmaj7', 'C', 'Am', 'G'], 'steady': ['C', 'G', 'Am', 'F'],
    'bright': ['F', 'C', 'G', 'Am'], 'sparse': ['Am', 'Fmaj7'], 'awk': ['Dm', 'Am'], 'pulse': ['Am', 'F', 'C', 'G'],
    'warm': ['Fmaj7', 'C', 'G', 'Am'], 'end': ['Am', 'F', 'C', 'Cmaj7'],
}
SECT = [
    (0.0, K['columbia'], 'hook', 0.85, 'pulse'),
    (K['columbia'], K['banana'], 'curious', 0.7, 'pluck'),
    (K['banana'], K['practiced'], 'sparse', 0.55, 'pluck'),
    (K['practiced'], K['once'], 'steady', 0.7, 'pluck'),
    (K['once'], K['distinction'], 'bright', 0.75, 'pluck'),
    (K['distinction'], K['another'], 'sparse', 0.55, 'none'),
    (K['another'], K['study24'], 'awk', 0.55, 'none'),
    (K['study24'], K['enough'], 'pulse', 0.75, 'pulse'),
    (K['enough'], K['again'], 'warm', 0.75, 'pluck'),
    (K['again'], N / SR, 'end', 0.8, 'pluck'),
]
score = np.zeros(N)
for (a, b, mood, lvl, layer) in SECT:
    ka, kb = int(a * SR), min(N, int(b * SR)); n = kb - ka
    if n <= 0: continue
    seg = np.zeros(n); prog = PROG[mood]
    nb = int(np.ceil((b - a) / bar))
    for bi in range(nb):
        s0 = int(bi * bar * SR); s1 = min(n, int((bi + 1) * bar * SR) + int(0.4 * SR))
        if s0 >= n: break
        ch = prog[bi % len(prog)]
        p = pad(ch, s1 - s0, bright=0.3 if mood in ('hook', 'awk', 'sparse') else 0.5, seed=bi)
        w = np.ones(s1 - s0); f = min(int(0.4 * SR), (s1 - s0) // 2); w[:f] = np.linspace(0, 1, f); w[-f:] = np.linspace(1, 0, f)
        seg[s0:s1] += p * w * 0.6
        for k8 in range(8):
            o = s0 + int(k8 * beat / 2 * SR)
            if o >= n: break
            if layer == 'pluck' and k8 % 2 == 0:
                notes = CH[ch][2:]; m = int(1.0 * SR)
                pl = pluck(notes[(k8 // 2 + bi) % len(notes)] + 12, m, 0.35)
                seg[o:o + m] += pl[:max(0, min(m, n - o))] * 0.1
            if layer == 'pulse' and k8 % 2 == 0:
                m = int(0.4 * SR); seg[o:o + m] += soft_kick(m)[:max(0, min(m, n - o))] * (0.18 if k8 % 4 == 0 else 0.1)
    if mood == 'awk':
        # the late smile: the bed thins to almost nothing between "They stare" and the switch-on
        tl = np.arange(n) / SR + a
        seg *= 1 - 0.75 * ((tl > K['stare']) & (tl < K['switchOn'] + 0.6))
    if mood == 'end':
        tl = np.arange(n) / SR + a
        seg *= np.clip((N / SR - tl) / 3.0, 0, 1)
    f = min(int(0.6 * SR), n // 2); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    score[ka:kb] += seg * lvl
score = hp(score, 45)

# ------------------------------------------------------------------------------------------------ ducking and mix
def rms_env(x, win=0.05):
    w = int(win * SR); return np.sqrt(np.convolve(x * x, np.ones(w) / w, mode='same'))
ne = rms_env(narr)
speech = np.clip(ne / (np.percentile(ne[ne > 1e-4], 60) + 1e-9), 0, 1)
out = np.zeros_like(speech); a_c, r_c = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.4 * SR)); v = 0.0
for i in range(N):
    s = speech[i]; v = a_c * v + (1 - a_c) * s if s > v else r_c * v + (1 - r_c) * s; out[i] = v
duck = 1 - 0.6 * out
sfx_duck = 1 - 0.35 * out
meter = pyln.Meter(SR)
narr_n = pyln.normalize.loudness(narr, meter.integrated_loudness(narr), -16.0)
score_n = pyln.normalize.loudness(score, meter.integrated_loudness(score), -28.0) * duck
room_n = room / (np.max(np.abs(room)) + 1e-9) * 0.012
g_sfx = 10 ** ((-27.0 - meter.integrated_loudness((sfxL + sfxR) / 2 + 1e-9)) / 20)
L = narr_n + score_n * 0.97 + room_n + sfxL * g_sfx * sfx_duck
R = narr_n + score_n * 1.0 + room_n * 0.95 + sfxR * g_sfx * sfx_duck
mix = np.stack([L, R], 1)
mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)

def true_peak(x): return 20 * np.log10(np.max(np.abs(resample_poly(x, 4, 1, axis=0))) + 1e-12)
ceil = 10 ** (-1.5 / 20)
pk = np.max(np.abs(resample_poly(mix, 4, 1, axis=0)).reshape(-1, 4, 2), axis=(1, 2))[:N]
need = np.minimum(1.0, ceil / (pk + 1e-12))
blk = int(0.005 * SR)
padded = np.concatenate([need, np.ones(blk)])
look = np.minimum.reduce([padded[k:k + N] for k in range(0, blk + 1, 12)])
g = np.ones(N); cur = 1.0; rel = np.exp(-1 / (0.08 * SR))
for i in range(N):
    tg = look[i]; cur = tg if tg < cur else rel * cur + (1 - rel) * tg; g[i] = cur
mix = mix * g[:, None]
os.makedirs('audio/mix/stems', exist_ok=True)
sf.write('audio/mix/FGW_Robot_Faces_V1_mix.wav', mix, SR, subtype='PCM_24')
sf.write('audio/mix/stems/score.wav', score_n, SR, subtype='PCM_24')
sf.write('audio/mix/stems/sfx.wav', np.stack([sfxL, sfxR], 1) * g_sfx, SR, subtype='PCM_24')
os.makedirs('source/public/audio', exist_ok=True)
shutil.copy('audio/mix/FGW_Robot_Faces_V1_mix.wav', 'source/public/audio/mix.wav')
mask = out > 0.5
res = {
    'integrated_lufs': round(meter.integrated_loudness(mix), 2),
    'true_peak_dbtp': round(true_peak(mix), 2),
    'duration_s': round(N / SR, 4),
    'narration_lufs_in_mix_before_final_norm': round(meter.integrated_loudness(narr_n), 2),
    'music_to_voice_rms_db_during_speech': round(20 * np.log10(np.sqrt(np.mean(score_n[mask] ** 2)) / np.sqrt(np.mean(narr_n[mask] ** 2))), 1),
    'sfx_cues': len(cues),
    'limiter_min_gain_db': round(20 * np.log10(g.min()), 2),
}
json.dump(res, open('audio/mix/mix_measure.json', 'w'), indent=1)
print(res)
