#!/usr/bin/env python3
"""Score, effects and room tone for "He Moved Another Man's Finger With His Mind", ducked under the narration.

All sound is synthesised here: no samples and no third-party music. Every effect cue comes from audio/cues.json,
which tools/export_cues.ts exports from the picture's own sequences (CUES_S1..CUES_S7), so effects follow the same
measured anchors as the animation.

    python3 tools/make_audio.py      (run from the episode folder; numpy, scipy, soundfile, pyloudnorm)

Outputs:
- audio/mix/FGW_Finger_V1_mix.wav (48 kHz, 24-bit, stereo), with a copy at source/public/audio/mix.wav;
- audio/mix/stems/*.wav (not committed);
- audio/mix/mix_measure.json.

Targets (as the other long-form FGW episodes): integrated -14 LUFS, true peak <= -1.0 dBTP, music well under the voice.

Two moments are designed around silence:
- the missing click (the flipped coil): the score drops out from "With the coil flipped?" to "Across all three
  pairs", leaving room tone and the coil's own click at its normal level;
- "Bad connection.": the bed thins to a held note.
"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 48000
rng = np.random.default_rng(23)
VER = os.environ.get('VER', 'V1')          # V2: VER=V2 python3 tools/make_audio.py (reads audio/cues_v2.json)
C = json.load(open('audio/cues.json' if VER == 'V1' else f'audio/cues_{VER.lower()}.json'))
KK = C['K']
SC = {s['id'].split(' ')[0]: s['start'] for s in C['scenes']}
if 'A' in SC:  # V2 sequence ids A..G map onto the V1 section names used by the score
    SC = {'S1': SC['A'], 'S2': SC['B'], 'S3': SC['C'], 'S4': SC['D'], 'S5': SC['E'], 'S6': SC['F'], 'S7': SC['G']}
narr, sr0 = sf.read('audio/narration/FGW_Finger_narration_V1.wav')
assert sr0 == SR
N = len(narr)
t_all = np.arange(N) / SR


def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def tt(d): n = int(d * SR); return n, np.arange(n) / SR
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)


# ------------------------------------------------------------------------------------------------ effects
def fx(kind, dur=None):
    if kind == 'key_click':      # a plastic key: a bright tick and a soft low "thock"
        n, t = tt(0.12)
        return bp(noise(n), 2500, 9000) * np.exp(-t / 0.004) * 0.9 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.025) * 0.5
    if kind == 'pad_click':      # a touchpad click: duller and shorter
        n, t = tt(0.1)
        return bp(noise(n), 1200, 5000) * np.exp(-t / 0.003) * 0.8 + np.sin(2 * np.pi * 240 * t) * np.exp(-t / 0.015) * 0.4
    if kind == 'cannon':         # the little game cannon: a punchy low pop with a burst
        n, t = tt(0.45)
        return np.sin(2 * np.pi * (70 + 120 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.12) * 0.9 + lp(noise(n), 2200) * np.exp(-t / 0.05) * 0.6
    if kind == 'boom':           # a game explosion: crackly noise, quick decay
        n, t = tt(0.8)
        x = lp(noise(n), 1800) * np.exp(-t / 0.18) * 0.8
        x += bp(noise(n), 3000, 8000) * (rng.random(n) < 0.004) * np.exp(-t / 0.3) * 3
        return x + np.sin(2 * np.pi * 55 * t) * np.exp(-t / 0.2) * 0.5
    if kind == 'city_hit':       # muffled, lower, longer
        n, t = tt(1.1)
        return lp(noise(n), 900) * np.exp(-t / 0.3) * 0.9 + np.sin(2 * np.pi * 45 * t) * np.exp(-t / 0.35) * 0.6
    if kind == 'plane_pass':     # a small propeller plane crossing (pitch falls as it passes)
        d = dur or 3.0; n, t = tt(d)
        f = 140 * (1.06 - 0.12 * t / d)
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = (np.sin(ph) + 0.5 * np.sign(np.sin(ph * 2))) * 0.25 + bp(noise(n), 300, 1400) * 0.2
        return lp(x, 1600) * np.sin(np.pi * t / d) ** 1.5 * 0.6
    if kind == 'rocket_launch':  # a rising hiss
        n, t = tt(1.0)
        f = 600 + 2200 * t
        return bp(noise(n), 500, 4000) * np.minimum(1, t / 0.05) * np.exp(-t / 0.5) * 0.6 + np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3) * 0.08
    if kind == 'coil_pulse':     # the TMS click: a sharp broadband snap with a short metallic ring
        n, t = tt(0.25)
        x = bp(noise(n), 1500, 11000) * np.exp(-t / 0.0025) * 1.4
        x += np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.03) * 0.25 + np.sin(2 * np.pi * 3400 * t) * np.exp(-t / 0.02) * 0.15
        return x
    if kind == 'packet_send':    # a rising two-note blip
        n, t = tt(0.35)
        f = np.where(t < 0.12, 660, 990)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-np.maximum(0, t - 0.12) / 0.08) * 0.45
    if kind == 'packet_arrive':  # a soft landing chime
        n, t = tt(0.6)
        return (np.sin(2 * np.pi * 1175 * t) + 0.5 * np.sin(2 * np.pi * 1760 * t)) * np.exp(-t / 0.15) * 0.35
    if kind == 'whoosh':
        d = dur or 0.7; n, t = tt(d)
        return bp(noise(n), 300, 2600) * np.sin(np.pi * t / d) ** 2 * 0.3
    if kind == 'pop':
        n, t = tt(0.12)
        return np.sin(2 * np.pi * (500 + 900 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.035) * 0.4
    if kind == 'tick':
        n, t = tt(0.06)
        return bp(noise(n), 3000, 9000) * np.exp(-t / 0.003) * 0.5
    if kind == 'flash':          # the phosphene: a soft high shimmer
        n, t = tt(0.7)
        x = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((2093, 2637, 3136)))
        return x * np.sin(np.pi * np.minimum(1, t / 0.7)) ** 2 * 0.12
    if kind == 'vote':
        n, t = tt(0.2)
        return np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.06) * 0.35
    if kind == 'flip':           # the vote flips inside the computer: a glitchy down-up blip
        n, t = tt(0.4)
        f = 900 - 500 * np.sin(np.pi * t / 0.4)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.2
        return lp(x, 3000) * np.exp(-t / 0.25)
    if kind == 'line_clear':     # a bright rising arpeggio
        n, t = tt(0.9); x = np.zeros(n)
        for k, m in enumerate((72, 76, 79, 84)):
            o = int(k * 0.08 * SR); tk = t[:n - o]
            x[o:] += np.sin(2 * np.pi * NOTE(m) * tk) * np.exp(-tk / 0.25) * 0.25
        return x
    if kind == 'spinner':        # a waiting loop: soft ticks
        d = dur or 1.2; n, t = tt(d); x = np.zeros(n)
        for k in range(int(d / 0.12)):
            o = int(k * 0.12 * SR); m = min(n - o, int(0.03 * SR))
            x[o:o + m] += bp(noise(m), 2000, 6000) * np.exp(-np.arange(m) / SR / 0.004) * 0.3
        return x
    if kind == 'error':          # a low "bonk"
        n, t = tt(0.35)
        return (np.sin(2 * np.pi * 150 * t) + 0.5 * np.sin(2 * np.pi * 113 * t)) * np.exp(-t / 0.12) * 0.5
    if kind == 'rotate':
        n, t = tt(0.25)
        return bp(noise(n), 800, 3000) * np.sin(np.pi * t / 0.25) ** 2 * 0.35 + np.sin(2 * np.pi * 700 * t) * np.exp(-t / 0.04) * 0.1
    raise ValueError(kind)


sfxL = np.zeros(N); sfxR = np.zeros(N)
used = {}
for c in C['cues']:
    kind = c['kind']
    try:
        x = fx(kind, c.get('dur'))
    except ValueError:
        print('unknown cue kind, skipped:', kind); continue
    x = x * 10 ** (c.get('gain', 0.0) / 20)
    i = int(c['t'] * SR)
    if i < 0 or i >= N: continue
    x = x[:N - i]
    pan = {'S1': 0.0}.get(c['scene'], 0.0)
    sfxL[i:i + len(x)] += x * np.sqrt(0.5 * (1 - pan)); sfxR[i:i + len(x)] += x * np.sqrt(0.5 * (1 + pan))
    used[kind] = used.get(kind, 0) + 1

# room tone: quiet lab air
room = hp(lp(noise(N), 600) * 0.6 + np.sin(2 * np.pi * 120 * t_all) * 0.04, 60)

# ------------------------------------------------------------------------------------------------ score
CH = {'Am': [45, 57, 60, 64, 67], 'F': [41, 53, 57, 60, 64], 'C': [36, 48, 55, 60, 64], 'G': [43, 55, 59, 62, 67],
      'Dm': [38, 50, 57, 62, 65], 'Fmaj7': [41, 53, 57, 64, 69], 'Cmaj7': [36, 48, 55, 59, 64], 'Em': [40, 52, 55, 59, 64],
      'D': [38, 50, 54, 57, 62], 'Bm': [35, 47, 54, 59, 62]}
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

BPM = 92.0; beat = 60 / BPM; bar = 4 * beat
PROG = {'hook': ['Am', 'F', 'C', 'G'], 'curious': ['Fmaj7', 'C', 'Am', 'G'], 'route': ['Am', 'F', 'C', 'G'],
        'aside': ['Dm', 'Am'], 'study': ['C', 'G', 'Am', 'F'], 'tense': ['Am', 'Em'], 'bright': ['D', 'Bm', 'G', 'D'],
        'trust': ['Fmaj7', 'C', 'G', 'Am'], 'end': ['Am', 'F', 'C', 'Cmaj7']}
END = N / SR
SECT = [
    (0.0, SC['S2'], 'hook', 0.8, 'pulse'),
    (SC['S2'], SC['S3'], 'curious', 0.7, 'pluck'),
    (SC['S3'], SC['S4'], 'route', 0.75, 'pulse'),
    (SC['S4'], SC['S5'], 'aside', 0.55, 'pluck'),
    (SC['S5'], KK['flipped'], 'study', 0.7, 'pluck'),
    (KK['across3'], SC['S6'], 'tense', 0.55, 'none'),
    (SC['S6'], SC['S7'], 'bright', 0.7, 'pluck'),
    (SC['S7'], KK['goBack'], 'trust', 0.7, 'pluck'),
    (KK['goBack'], END, 'end', 0.75, 'pluck'),
]
score = np.zeros(N)
for (a, b, mood, lvl, layer) in SECT:
    ka, kb = int(a * SR), min(N, int(b * SR)); n = kb - ka
    if n <= 0: continue
    seg = np.zeros(n); prog = PROG[mood]
    for bi in range(int(np.ceil((b - a) / bar))):
        s0 = int(bi * bar * SR); s1 = min(n, int((bi + 1) * bar * SR) + int(0.4 * SR))
        if s0 >= n: break
        ch = prog[bi % len(prog)]
        p = pad(ch, s1 - s0, bright=0.3 if mood in ('aside', 'tense') else 0.5, seed=bi)
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
                m = int(0.4 * SR); seg[o:o + m] += soft_kick(m)[:max(0, min(m, n - o))] * (0.16 if k8 % 4 == 0 else 0.09)
    tl = np.arange(n) / SR + a
    if mood == 'aside':      # "Bad connection.": the bed thins to almost nothing for the deadpan
        seg *= 1 - 0.8 * ((tl > KK['bad'] - 0.3) & (tl < SC['S5']))
    if mood == 'end':
        seg *= np.clip((END - tl) / 3.0, 0, 1)
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
sfx_duck = 1 - 0.3 * out
meter = pyln.Meter(SR)
narr_n = pyln.normalize.loudness(narr, meter.integrated_loudness(narr), -16.0)
score_n = pyln.normalize.loudness(score, meter.integrated_loudness(score), -29.0) * duck
room_n = room / (np.max(np.abs(room)) + 1e-9) * 0.010
g_sfx = 10 ** ((-26.0 - meter.integrated_loudness((sfxL + sfxR) / 2 + 1e-9)) / 20)
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
MIX = f'audio/mix/FGW_Finger_{VER}_mix.wav'
sf.write(MIX, mix, SR, subtype='PCM_24')
sf.write('audio/mix/stems/score.wav', score_n, SR, subtype='PCM_24')
sf.write('audio/mix/stems/sfx.wav', np.stack([sfxL, sfxR], 1) * g_sfx, SR, subtype='PCM_24')
os.makedirs('source/public/audio', exist_ok=True)
shutil.copy(MIX, 'source/public/audio/mix.wav')
mask = out > 0.5
gap = (t_all > KK['flippedEnd'] + 0.1) & (t_all < KK['across3'] - 0.1)
res = {
    'integrated_lufs': round(meter.integrated_loudness(mix), 2),
    'true_peak_dbtp': round(true_peak(mix), 2),
    'duration_s': round(N / SR, 4),
    'music_to_voice_rms_db_during_speech': round(20 * np.log10(np.sqrt(np.mean(score_n[mask] ** 2)) / np.sqrt(np.mean(narr_n[mask] ** 2))), 1),
    'score_rms_dbfs_in_missing_click_gap': round(20 * np.log10(np.sqrt(np.mean(score_n[gap] ** 2)) + 1e-12), 1),
    'sfx_cues_by_kind': used,
    'limiter_min_gain_db': round(20 * np.log10(g.min()), 2),
}
json.dump(res, open('audio/mix/mix_measure.json' if VER == 'V1' else f'audio/mix/mix_measure_{VER.lower()}.json', 'w'), indent=1)
print(json.dumps(res))
