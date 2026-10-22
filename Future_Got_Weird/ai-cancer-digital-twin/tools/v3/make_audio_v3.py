#!/usr/bin/env python3
"""V2: synthesise the effects, ambience beds and score from v3/audio/sfx_cues_v3.json (tools/v3/cues_v3.py), duck them under the locked narration and
write the final mix (all sound is generated here: no third-party samples).

    python3 tools/v3/make_audio_v3.py      (run from the episode folder; needs numpy, scipy, soundfile, pyloudnorm)

Outputs: v3/audio/mix/mix_v3.wav (48 kHz 24-bit stereo), source/public/audio/mix_v3.wav, v3/audio/mix/stems/*.wav,
v3/audio/mix/mix_measure_v3.json.
Targets: integrated loudness -14 LUFS, true peak <= -1.0 dBTP, music held well under the voice (ducked by the
narration envelope); the score moves dark → rising → discovery → rhythmic → immune momentum → uncertainty → hopeful.
"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

SR = 48000
rng = np.random.default_rng(7)
cfg = json.load(open('v3/audio/sfx_cues_v3.json'))
narr, sr0 = sf.read('v2/audio/narration/narration_v2.wav')
assert sr0 == SR
if narr.ndim > 1:
    narr = narr.mean(1)
N = len(narr)
DUR = N / SR
tt = np.arange(N) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def env_adsr(n, a=0.005, d=0.1, s=0.0, r=0.05):
    e = np.zeros(n)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = max(1, min(na, n)); e[:na] = np.linspace(0, 1, na)
    k = min(n, na + nd)
    if k > na:
        e[na:k] = np.linspace(1, s, k - na)
    e[k:] = s
    if nr > 0 and s > 0:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def noise(n):
    return rng.standard_normal(n)


# ------------------------------------------------------------------------------------------------ effects
def fx(kind, dur=None, pitch=1.0):
    p = pitch or 1.0
    if kind == 'click':          # a small molecular latch: two filtered ticks
        n = int(0.06 * SR); x = noise(n) * np.exp(-np.arange(n) / (0.004 * SR))
        x = bp(x, 1800 * p, 7000) * 0.9
        t = np.arange(n) / SR
        x += 0.5 * np.sin(2 * np.pi * 900 * p * t) * np.exp(-t / 0.012)
        return x
    if kind == 'bind':           # soft "snug" contact: low thump + short bright tick
        n = int(0.35 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * (140 * p) * t * (1 - 0.3 * t)) * np.exp(-t / 0.07) * 0.9
        x += bp(noise(n), 2500, 6000) * np.exp(-t / 0.01) * 0.3
        return x
    if kind == 'pop':            # membrane pinch: wet bubble pop
        n = int(0.25 * SR); t = np.arange(n) / SR
        f = 260 * p * (1 + 2.5 * np.exp(-t / 0.02))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) * 0.9
    if kind == 'snip':           # enzyme cut: a quick bright tick with a tiny crackle (not scissors)
        n = int(0.12 * SR); t = np.arange(n) / SR
        x = bp(noise(n), 3000 * p, 9000) * np.exp(-t / 0.006)
        x += 0.35 * np.sin(2 * np.pi * 1800 * p * t) * np.exp(-t / 0.02)
        return x
    if kind == 'blip':           # digital model UI plink
        n = int(0.4 * SR); t = np.arange(n) / SR
        f = 880 * p
        return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t / 0.09) * 0.45
    if kind == 'thud':           # soft low cut accent
        n = int(0.6 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * 55 * p * t * (1 - 0.4 * t)) * np.exp(-t / 0.18)
        x += lp(noise(n), 300) * np.exp(-t / 0.05) * 0.4
        return x * 0.9
    if kind == 'whoosh':         # filtered noise swell for camera moves / scale changes
        d = dur or 0.8; n = int(d * SR); t = np.arange(n) / SR
        e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
        x = noise(n)
        lo = lp(x, 900 * p); hi = bp(x, 1200 * p, 4000 * p)
        mix = lo * (1 - t / d) + hi * (t / d)
        return mix * e * 0.7
    if kind == 'sweep':          # a smooth airy sweep (scan / digital transitions)
        d = dur or 1.2; n = int(d * SR); t = np.arange(n) / SR
        e = np.sin(np.pi * np.clip(t / d, 0, 1))
        f = 400 + 2600 * (t / d)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 + bp(noise(n), 1500, 6000) * 0.25
        return x * e * 0.8
    if kind == 'press':          # pressure-like low swell (environment change, membrane deformation)
        d = dur or 1.5; n = int(d * SR); t = np.arange(n) / SR
        e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
        x = lp(noise(n), 160 * p, 4) * 3.0 + np.sin(2 * np.pi * 48 * p * t) * 0.35
        return x * e * 0.8
    if kind == 'shimmer':        # glassy reveal (cutaway, model forming)
        d = dur or 1.0; n = int(d * SR); t = np.arange(n) / SR
        e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
        x = sum(np.sin(2 * np.pi * f * t + i) / (i + 1) for i, f in enumerate([1318.5, 1760, 2349.3, 2637]))
        return x * e * 0.22
    if kind == 'crackle':        # apoptosis fragmentation: soft granular crackle, contained
        d = dur or 1.5; n = int(d * SR)
        x = np.zeros(n)
        for _ in range(int(40 * d)):
            k = rng.integers(0, n - 800); m = int(rng.uniform(0.002, 0.01) * SR)
            x[k:k + m] += noise(m) * np.exp(-np.arange(m) / (0.002 * SR)) * rng.uniform(0.3, 1)
        x = bp(x, 600, 5000)
        return x * np.sin(np.pi * np.linspace(0, 1, n)) * 0.6
    if kind == 'drop':           # a measurement arriving: soft descending tone + tick
        n = int(0.5 * SR); t = np.arange(n) / SR
        f = 1200 * np.exp(-t / 0.15) + 300
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * 0.5
        return x + bp(noise(n), 2000, 7000) * np.exp(-t / 0.008) * 0.3
    if kind == 'riser':          # tension riser (short; never a cartoon laser)
        d = dur or 0.8; n = int(d * SR); t = np.arange(n) / SR
        e = (t / d) ** 2
        f = 120 + 500 * (t / d) ** 2
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + bp(noise(n), 800, 3000) * 0.3
        return x * e * 0.7
    if kind == 'heart':          # muffled heartbeat (lub-dub) heard from inside the body
        n = int(0.7 * SR); t = np.arange(n) / SR
        def beat(t0, f, a):
            u = np.clip(t - t0, 0, None)
            return np.sin(2 * np.pi * f * u) * np.exp(-u / 0.05) * (t >= t0) * a
        return lp(beat(0, 52 * p, 1.0) + beat(0.22, 46 * p, 0.7), 180) * 1.4
    if kind == 'divide':         # wet membrane stretch and a soft separation
        d = dur or 1.4; n = int(d * SR); t = np.arange(n) / SR
        f = 90 * p + 60 * (t / d)
        x = lp(noise(n), 400 * p, 3) * 2.0 * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
        x += np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 * np.sin(np.pi * np.clip(t / d, 0, 1))
        k = int(0.8 * n); m = n - k; tm = np.arange(m) / SR
        x[k:] += np.sin(2 * np.pi * np.cumsum(220 * p * (1 + 2 * np.exp(-tm / 0.02))) / SR) * np.exp(-tm / 0.05) * 0.6
        return x * 0.8
    if kind == 'squelch':        # soft organic contact
        d = dur or 0.8; n = int(d * SR); t = np.arange(n) / SR
        x = bp(noise(n), 200 * p, 1400 * p) * np.exp(-t / (0.12 * d)) * 1.2
        x += np.sin(2 * np.pi * 120 * p * t) * np.exp(-t / 0.08) * 0.4
        return x
    if kind == 'swarm':          # many small cells: a dense granular texture that swells
        d = dur or 3.0; n = int(d * SR)
        x = np.zeros(n)
        for _ in range(int(70 * d)):
            k = rng.integers(0, n - 3000); m = int(rng.uniform(0.02, 0.06) * SR); tm = np.arange(m) / SR
            x[k:k + m] += np.sin(2 * np.pi * rng.uniform(160, 420) * p * tm) * np.exp(-tm / 0.015) * rng.uniform(0.2, 0.6)
        x = lp(x, 1500)
        return x * np.sin(np.pi * np.linspace(0, 1, n)) * 0.7
    if kind == 'bubble':         # fluid, small bubbles drifting
        d = dur or 1.4; n = int(d * SR); x = np.zeros(n)
        for _ in range(int(14 * d)):
            k = rng.integers(0, n - 4000); m = 3600; tm = np.arange(m) / SR
            f0 = rng.uniform(400, 900) * p
            x[k:k + m] += np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.6 * tm / 0.075)) / SR) * np.exp(-tm / 0.02) * 0.5
        return x * np.sin(np.pi * np.linspace(0, 1, n))
    if kind == 'stretch':        # tissue pulling: slow low groan
        d = dur or 1.6; n = int(d * SR); t = np.arange(n) / SR
        f = 70 * p * (1 + 0.3 * t / d)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + lp(noise(n), 260, 3) * 1.4
        return x * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5 * 0.7
    if kind == 'clash':          # a molecule that does not fit: dull knock
        n = int(0.3 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * 180 * p * t) * np.exp(-t / 0.03) + bp(noise(n), 500, 2000) * np.exp(-t / 0.015) * 0.5
        return x * 0.8
    raise ValueError(kind)


sfxL = np.zeros(N); sfxR = np.zeros(N)
for i, c in enumerate(cfg['cues']):
    x = fx(c['kind'], c.get('dur'), c.get('pitch') or 1.0) * (c.get('gain') or 1.0)
    k = int(max(0.0, c['t']) * SR)
    m = min(len(x), N - k)
    if m <= 0:
        continue
    pan = 0.5 + 0.25 * np.sin(i * 1.7)  # gentle spread
    sfxL[k:k + m] += x[:m] * np.sqrt(1 - pan) * 1.2
    sfxR[k:k + m] += x[:m] * np.sqrt(pan) * 1.2

# ------------------------------------------------------------------------------------------------ ambience beds
def bed(kind, n, seedoff):
    r = np.random.default_rng(100 + seedoff)
    t = np.arange(n) / SR
    if kind == 'micro':      # viscous low rumble with slow wobble and faint bubbles
        x = lp(r.standard_normal(n), 140, 4) * 4 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.21 * t))
        for _ in range(int(n / SR * 1.5)):
            k = r.integers(0, max(1, n - 4000)); m = 2400; tm = np.arange(m) / SR
            x[k:k + m] += np.sin(2 * np.pi * r.uniform(300, 700) * tm) * np.exp(-tm / 0.02) * 0.05
        return x * 0.35
    if kind == 'digital':    # quiet hum + air
        return (np.sin(2 * np.pi * 110 * t) * 0.05 + np.sin(2 * np.pi * 165 * t) * 0.03 + bp(r.standard_normal(n), 3000, 8000) * 0.02) * 0.8
    if kind == 'blood':      # flowing blood: band-limited rush pulsing with the heartbeat
        pulse = 0.6 + 0.4 * np.clip(np.sin(2 * np.pi * 1.2 * t), 0, 1) ** 2
        return (lp(r.standard_normal(n), 500, 3) * 2.5 + bp(r.standard_normal(n), 600, 1800) * 0.3) * pulse * 0.4
    if kind == 'room':       # room tone
        return lp(r.standard_normal(n), 900) * 0.06
    if kind == 'tissue':     # warm low wash
        return lp(r.standard_normal(n), 220, 3) * 1.6 * 0.3
    return np.zeros(n)


bedL = np.zeros(N); bedR = np.zeros(N)
XF = int(0.4 * SR)
for i, (a, b, kind) in enumerate(cfg['beds']):
    ka, kb = int(max(0, a) * SR), min(N, int(b * SR))
    ka0, kb0 = max(0, ka - XF // 2), min(N, kb + XF // 2)
    n = kb0 - ka0
    if n <= 0:
        continue
    e = np.ones(n); f = min(XF, n // 2)
    e[:f] = np.linspace(0, 1, f); e[-f:] = np.linspace(1, 0, f)
    bedL[ka0:kb0] += bed(kind, n, i) * e
    bedR[ka0:kb0] += bed(kind, n, i + 50) * e

# ------------------------------------------------------------------------------------------------ score
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = {  # chords as MIDI notes (D minor world)
    'Dm': [38, 50, 57, 62, 65], 'Bb': [34, 46, 53, 58, 62], 'F': [41, 53, 57, 60, 65], 'C': [36, 48, 55, 60, 64],
    'Gm': [43, 55, 58, 62, 67], 'Am': [45, 57, 60, 64, 69], 'Dm9': [38, 50, 57, 64, 65, 69], 'Bbmaj7': [34, 46, 53, 57, 62],
}


def pad(chord, n, bright=0.5, seed=0):
    t = np.arange(n) / SR
    x = np.zeros(n)
    for j, m in enumerate(CH[chord]):
        f = NOTE(m)
        for d in (-0.12, 0.0, 0.11):
            ph = (seed + j + d) * 3.1
            x += (np.sin(2 * np.pi * f * (1 + d / 100) * t + ph) + 0.25 * np.sin(2 * np.pi * 2 * f * t + ph)) / (1 + 0.15 * j)
    x = lp(x, 500 + 2500 * bright)
    return x / (len(CH[chord]) * 3)


def pluck(m, n, decay=0.35):
    t = np.arange(n) / SR
    f = NOTE(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.05)) * np.exp(-t / decay)


def tick(n):
    t = np.arange(n) / SR
    return bp(noise(n), 2000, 7000) * np.exp(-t / 0.006) * 0.5


def kick(n):
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * (50 + 60 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.15)


score = np.zeros(N)
BPM = 96.0
beat = 60 / BPM
PROG = {'tense': ['Dm', 'Dm', 'Bb', 'Dm'], 'reveal': ['Bbmaj7', 'F', 'Bbmaj7', 'C'], 'build': ['Dm', 'Bb', 'F', 'C'], 'drive': ['Dm', 'Bb', 'Gm', 'Am'],
        'calm': ['F', 'Bbmaj7', 'F', 'C'], 'survivor': ['Dm'], 'reflect': ['Dm9', 'Bbmaj7', 'F', 'C'], 'warm': ['F', 'Bbmaj7', 'F', 'C'], 'end': ['Dm', 'Bb', 'Dm', 'Dm'],
        'hope': ['F', 'C', 'Bbmaj7', 'F']}
LEVEL = {'tense': 0.9, 'reveal': 0.8, 'build': 0.85, 'drive': 0.95, 'calm': 0.6, 'survivor': 1.0, 'reflect': 0.75, 'warm': 0.8, 'end': 0.9, 'hope': 0.85}
for si, sec in enumerate(cfg['score']):
    a, b, mood = sec[:3]
    surv_t = sec[3] if len(sec) > 3 else b
    ka, kb = int(a * SR), min(N, int(b * SR))
    n = kb - ka
    if n <= 0:
        continue
    seg = np.zeros(n)
    bar = 4 * beat
    prog = PROG[mood]
    nb = int(np.ceil((b - a) / bar))
    for bi in range(nb):
        s0 = int(bi * bar * SR); s1 = min(n, int((bi + 1) * bar * SR) + int(0.3 * SR))
        if s0 >= n:
            break
        ch = prog[bi % len(prog)]
        p = pad(ch, s1 - s0, bright=0.35 if mood in ('tense', 'survivor', 'end') else 0.7 if mood == 'hope' else 0.55, seed=bi)
        w = np.ones(s1 - s0); f = int(0.3 * SR); w[:f] = np.linspace(0, 1, f); w[-f:] = np.linspace(1, 0, f)
        seg[s0:s1] += p * w * 0.55
        # rhythmic layer
        if mood in ('tense', 'drive', 'build', 'reveal', 'reflect', 'warm', 'calm', 'hope'):
            for k8 in range(8):
                o = s0 + int(k8 * beat / 2 * SR)
                if o >= n:
                    break
                if mood in ('tense', 'drive') and k8 % 1 == 0:
                    m = int(0.05 * SR); seg[o:o + m] += tick(m)[:max(0, min(m, n - o))] * (0.18 if k8 % 2 else 0.28)
                if mood in ('reveal', 'build', 'reflect', 'warm', 'calm', 'drive', 'hope'):
                    notes = CH[ch][2:]
                    m = int(0.9 * SR); pl = pluck(notes[(k8 + bi) % len(notes)] + 12, m, 0.3)
                    seg[o:o + m] += pl[:max(0, min(m, n - o))] * (0.12 if mood != 'calm' else 0.07)
            if mood in ('drive', 'build'):
                for k4 in range(4):
                    o = s0 + int(k4 * beat * SR); m = int(0.3 * SR)
                    if o < n:
                        seg[o:o + m] += kick(m)[:max(0, min(m, n - o))] * (0.35 if mood == 'drive' else 0.22)
    if mood == 'survivor':
        # tension: a low drone and a slowly tightening high cluster, then near-silence after "It survives"
        tl = np.arange(n) / SR
        u = np.clip(tl / max(0.1, surv_t - a), 0, 1)
        cl = sum(np.sin(2 * np.pi * NOTE(m) * tl + m) for m in (74, 75, 77)) / 3
        seg += cl * 0.12 * u ** 2 * (tl < surv_t - a)
        seg += np.sin(2 * np.pi * NOTE(26) * tl) * 0.25
        hb = np.zeros(n)
        for kk in np.arange(surv_t - a + 0.25, b - a, 0.85):
            o = int(kk * SR); m = int(0.25 * SR)
            if o + m < n:
                hb[o:o + m] += kick(m) * 0.5
        seg += hb
        seg *= np.where(tl < surv_t - a, 1.0, 0.55)
    if mood in ('end', 'hope'):
        tl = np.arange(n) / SR
        seg *= np.clip((b - a - tl) / (2.5 if mood == 'end' else 3.2), 0, 1)  # fade with the picture
    # section crossfades
    f = int(0.5 * SR)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    score[ka:kb] += seg * LEVEL[mood]

# ------------------------------------------------------------------------------------------------ ducking + mix
def rms_env(x, win=0.05):
    w = int(win * SR)
    e = np.sqrt(np.convolve(x * x, np.ones(w) / w, mode='same'))
    return e


ne = rms_env(narr)
speech = np.clip(ne / (np.percentile(ne[ne > 1e-4], 60) + 1e-9), 0, 1)
# attack 30 ms / release 350 ms smoothing
out = np.zeros_like(speech); a_c, r_c = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR)); v = 0.0
for i in range(N):
    s = speech[i]
    v = a_c * v + (1 - a_c) * s if s > v else r_c * v + (1 - r_c) * s
    out[i] = v
duck = 1 - 0.62 * out     # ≈ -8.4 dB under speech
sfx_duck = 1 - 0.3 * out

meter = pyln.Meter(SR)
narr_n = pyln.normalize.loudness(narr, meter.integrated_loudness(narr), -16.0)
score_n = pyln.normalize.loudness(score, meter.integrated_loudness(score), -27.0) * duck
bedL_n = bedL / (np.max(np.abs(bedL)) + 1e-9) * 0.05 * duck
bedR_n = bedR / (np.max(np.abs(bedR)) + 1e-9) * 0.05 * duck
g_sfx = 10 ** ((-24.0 - meter.integrated_loudness((sfxL + sfxR) / 2)) / 20)
L = narr_n + score_n * 0.97 + bedL_n + sfxL * g_sfx * sfx_duck
R = narr_n + score_n * 1.0 + bedR_n + sfxR * g_sfx * sfx_duck
mix = np.stack([L, R], 1)
mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)


def true_peak(x):
    return 20 * np.log10(np.max(np.abs(resample_poly(x, 4, 1, axis=0))) + 1e-12)


# look-ahead peak limiter to -1.2 dBFS on 4x-oversampled peaks
ceil = 10 ** (-1.2 / 20)
pk = np.max(np.abs(resample_poly(mix, 4, 1, axis=0)).reshape(-1, 4, 2), axis=(1, 2))[:N]
need = np.minimum(1.0, ceil / (pk + 1e-12))
la = int(0.005 * SR)
g = np.ones(N); cur = 1.0; rel = np.exp(-1 / (0.08 * SR))
# windowed minimum (look-ahead) via strided min over blocks
blk = la
padded = np.concatenate([need, np.ones(blk)])
look = np.minimum.reduce([padded[k:k + N] for k in range(0, blk + 1, 12)])
for i in range(N):
    tgt = look[i]
    cur = tgt if tgt < cur else rel * cur + (1 - rel) * tgt
    g[i] = cur
mix = mix * g[:, None]
os.makedirs('v3/audio/mix/stems', exist_ok=True)
sf.write('v3/audio/mix/mix_v3.wav', mix, SR, subtype='PCM_24')
sf.write('v3/audio/mix/stems/score.wav', score_n, SR, subtype='PCM_24')
sf.write('v3/audio/mix/stems/sfx.wav', np.stack([sfxL, sfxR], 1) * g_sfx, SR, subtype='PCM_24')
sf.write('v3/audio/mix/stems/beds.wav', np.stack([bedL_n, bedR_n], 1), SR, subtype='PCM_24')
shutil.copy('v3/audio/mix/mix_v3.wav', 'source/public/audio/mix_v3.wav')
# measurements
speech_mask = out > 0.5
res = {
    'integrated_lufs': round(meter.integrated_loudness(mix), 2),
    'true_peak_dbtp': round(true_peak(mix), 2),
    'duration_s': round(N / SR, 3),
    'narration_lufs_in_mix': round(meter.integrated_loudness(narr_n), 2),
    'score_lufs_ducked': round(meter.integrated_loudness(score_n + 1e-9), 2),
    'music_to_voice_rms_db_during_speech': round(20 * np.log10(np.sqrt(np.mean(score_n[speech_mask] ** 2)) / np.sqrt(np.mean(narr_n[speech_mask] ** 2))), 1),
    'sfx_cues': len(cfg['cues']),
    'limiter_min_gain_db': round(20 * np.log10(g.min()), 2),
}
json.dump(res, open('v3/audio/mix/mix_measure_v3.json', 'w'), indent=1)
print(res)
