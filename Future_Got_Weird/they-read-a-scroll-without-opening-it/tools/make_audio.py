#!/usr/bin/env python3
"""Score, effects and room tone for "They Read a 2,000-Year-Old Scroll Without Opening It", ducked under the narration.

All sound is synthesised here (no samples, no third-party music). Cue times come from the measured narration words
(audio/narration/FGW_Scroll_V1_words.json) with the same phrase anchors and offsets the picture uses
(source/src/lib/time.ts and the scene files), so effects land with the animation.

    python3 tools/make_audio.py      (run from anywhere; numpy, scipy, soundfile, pyloudnorm)

Outputs: audio/mix/FGW_Scroll_V1_mix.wav (48 kHz, 24-bit, stereo), audio/mix/mix_measure.json.
Targets (as the other long-form FGW episodes): integrated -14 LUFS, true peak <= -1.0 dBTP, music well under the voice.
The score stays light and spare under the explanation, thins to one held note for the translation, and resolves on the
still-rolled scroll.
"""
import json, os, re
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 48000
rng = np.random.default_rng(79)
W = json.load(open('audio/narration/FGW_Scroll_V1_words.json'))
narr, sr0 = sf.read('audio/narration/FGW_Scroll_narration_V1.wav')
assert sr0 == SR
N = len(narr)

nrm = lambda s: re.sub(r"[^a-z0-9' -]", '', s.lower().replace('’', "'"))
def wi(phrase, start=0):
    ps = [nrm(x) for x in phrase.replace('’', "'").split()]
    for i in range(start, len(W) - len(ps) + 1):
        if all(nrm(W[i + k]['word']) == p for k, p in enumerate(ps)):
            return i
    raise KeyError(phrase)
T = lambda p: W[wi(p)]['start']
TE = lambda p: W[wi(p) + len(p.split()) - 1]['end']

def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def tt(d): n = int(d * SR); return n, np.arange(n) / SR
NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)

# ------------------------------------------------------------------------------------------------ effects
def fx(kind, dur=1.0):
    n, t = tt(dur)
    if kind == 'shimmer':       # digital uncoiling: rising filtered sparkle
        f = 900 + 2600 * (t / dur) ** 1.4
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12 + bp(noise(n), 2500, 9000) * 0.18
        return x * np.sin(np.pi * np.minimum(1, t / dur)) ** 1.2
    if kind == 'chime':         # small bright confirmation
        x = sum(np.sin(2 * np.pi * NOTE(m) * t) * a for m, a in [(86, 0.5), (93, 0.3), (98, 0.15)])
        return x * np.exp(-t / 0.35) * np.minimum(1, t / 0.004)
    if kind == 'ping':
        return np.sin(2 * np.pi * NOTE(81) * t) * np.exp(-t / 0.45) * 0.6 * np.minimum(1, t / 0.003)
    if kind == 'tick':
        return bp(noise(n), 2500, 8000) * np.exp(-t / 0.006) * 0.6 + np.sin(2 * np.pi * 1500 * t) * np.exp(-t / 0.01) * 0.2
    if kind == 'crumbs':        # a few tiny particles landing
        x = np.zeros(n)
        for k in range(9):
            i = int((0.05 + k * 0.09 + rng.random() * 0.05) * SR)
            m, tk = tt(0.03)
            x[i:i + m] += (bp(noise(m), 1800, 7000) * np.exp(-tk / 0.004))[: max(0, n - i)] * (0.4 + rng.random() * 0.4)
        return x
    if kind == 'whoosh':
        env = np.sin(np.pi * t / dur) ** 2
        f = 300 + 1800 * np.sin(np.pi * t / dur)
        x = bp(noise(n), 200, 3000) * env * 0.5
        return x + lp(noise(n), 900) * env * 0.3 + 0 * f
    if kind == 'rumble':        # distant eruption
        env = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.8)
        return lp(noise(n), 120, 3) * env * 2.2 + np.sin(2 * np.pi * 38 * t) * env * 0.25
    if kind == 'scrape':        # spatula against a brittle roll
        env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.2)
        g = (rng.random(n) < 0.02) * rng.standard_normal(n) * 3
        return (bp(noise(n), 1500, 6000) * 0.25 + bp(g, 800, 5000)) * env * 0.6
    if kind == 'flake':
        return bp(noise(n), 900, 5000) * np.exp(-t / 0.02) * 0.6
    if kind == 'button':
        return bp(noise(n), 1500, 6000) * np.exp(-t / 0.004) * 0.8 + np.sin(2 * np.pi * 700 * t) * np.exp(-t / 0.02) * 0.3
    if kind == 'hum':           # beam on
        env = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.4)
        return (np.sin(2 * np.pi * 110 * t) * 0.3 + np.sin(2 * np.pi * 220 * t) * 0.12 + bp(noise(n), 3000, 8000) * 0.04) * env
    if kind == 'snap':          # a projection captured
        return bp(noise(n), 1200, 6000) * np.exp(-t / 0.012) * 0.6 + np.sin(2 * np.pi * NOTE(84) * t) * np.exp(-t / 0.08) * 0.15
    if kind == 'swell':
        env = (t / dur) ** 2 * np.minimum(1, (dur - t) / 0.15)
        return sum(np.sin(2 * np.pi * NOTE(m) * t) for m in (62, 69, 74)) * env * 0.12 + bp(noise(n), 400, 4000) * env * 0.1
    if kind == 'tension':       # the wrong turn: a soft low cluster
        env = np.minimum(1, t / 0.05) * np.exp(-t / 1.0)
        return (np.sin(2 * np.pi * NOTE(50) * t) + np.sin(2 * np.pi * NOTE(51) * t) * 0.8 + np.sin(2 * np.pi * NOTE(57) * t) * 0.4) * env * 0.25
    if kind == 'buzz':
        env = np.minimum(1, t / 0.01) * np.exp(-t / 0.25)
        return np.sign(np.sin(2 * np.pi * 140 * t)) * env * 0.12
    if kind == 'rewind':
        f = 1800 * np.exp(-t / dur * 2.5) + 200
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 * np.sin(np.pi * t / dur)
    if kind == 'unroll':        # the long flattening
        env = np.sin(np.pi * t / dur) ** 1.5
        f = 180 + 500 * (t / dur)
        return (bp(noise(n), 300, 2500) * 0.35 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.08) * env
    if kind == 'settle':        # the page opens and lies flat
        return lp(noise(n), 1500) * np.exp(-t / 0.12) * 0.5 + np.sin(2 * np.pi * 90 * t) * np.exp(-t / 0.15) * 0.3
    if kind == 'pop':
        return np.sin(2 * np.pi * (500 + 400 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.06) * 0.35
    if kind == 'grain':         # tiles revealing, as a rising granular bed
        x = np.zeros(n)
        k = 0
        while True:
            pos = (k / 70) ** 0.8 * dur
            if pos >= dur - 0.05: break
            i = int(pos * SR)
            m, tk = tt(0.02)
            x[i:i + m] += np.sin(2 * np.pi * (1200 + 1600 * pos / dur + rng.random() * 300) * tk) * np.exp(-tk / 0.006) * 0.25
            k += 1
        return x
    if kind == 'hit':           # a clean cut to a new object
        return lp(noise(n), 2000) * np.exp(-t / 0.05) * 0.4 + np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.25) * 0.45
    if kind == 'lock':          # the proof overlay lands
        x = sum(np.sin(2 * np.pi * NOTE(m) * t) * a for m, a in [(62, 0.35), (66, 0.25), (69, 0.25), (74, 0.2)])
        return x * np.exp(-t / 1.2) * np.minimum(1, t / 0.01) + bp(noise(n), 2000, 6000) * np.exp(-t / 0.01) * 0.2
    if kind == 'scratch':       # a reed pen
        env = np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.2)
        return bp(noise(n), 2500, 7000) * env * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)) * 0.12
    raise ValueError(kind)

fxbus = np.zeros(N)
def put(kind, at, gain_db=0.0, dur=1.0):
    x = fx(kind, dur)
    i = int(at * SR)
    if i >= N: return
    m = min(len(x), N - i)
    fxbus[i:i + m] += x[:m] * 10 ** (gain_db / 20)

# picture anchors (mirror source/src/lib/time.ts and the scene offsets)
book = T('That black lump'); look = T('Look at what'); press = look + 0.55
researchers = T('The researchers took'); map3d = T('three-dimensional map.'); slice_ = T('Slice through'); spiral = T('a spiral.')
see = T('See where'); jump = T('If you jump'); skipped = T('skipped an entire'); keep = T('Keep going'); eachOther = TE('next to each other.')
traced = T('So they traced'); messy = TE('got messy.'); gave = T('That gave them'); flatten = T('could flatten.'); nowPage = T('Now they had')
inkWas = T('The ink was'); inScan = T('In the scan,'); trained = T('So the team trained'); each = T('Each patch'); imagine = T('Imagine trying')
onePatch = T('One patch could'); put_ = T('Put the patches'); stroke = TE('form a stroke.')
checked = T('And here’s how'); second = T('On a second scroll'); sharper = T('A sharper scan'); lined = T('They lined'); same = T('The same strokes')
back = T('Back on the first'); feet = TE('half feet.'); scholars = T('Scholars could read'); columns = TE('partial columns.'); gaps = T('There are gaps')
oneOf = T('One of the surviving'); quote = T('“Possessing'); quoteEnd = TE('as they do.”'); somebody = T('Somebody put'); ago = TE('years ago.')
youJust = T('You just read'); still = T('And the page is still'); stillEnd = TE('still rolled up.')

# A
put('shimmer', 0.0, -12, 1.7); put('settle', 1.25, -14, 0.6); put('chime', 2.05, -20, 1.2)
put('crumbs', T('crumble') + 0.05, -16, 1.4)
put('whoosh', book - 0.8, -20, 1.0)
# B
put('rumble', T('It was buried') - 0.1, -10, TE('year seventy-nine.') - T('It was buried') + 0.9)
put('hit', T('Centuries later') - 0.02, -18, 0.6)
for a, b in [(T('Centuries later') + 0.5, TE('tried to open it.') + 0.2), (T('By the time') - 0.05, T('less than half') - 0.05), (T('less than half'), TE('it had been.') - 0.1)]:
    put('scrape', a, -16, b - a)
    for k in range(5): put('flake', a + 0.3 + k * (b - a) / 6 + 0.4, -20, 0.1)
put('swell', T('And the writing') - 0.1, -22, 1.6)
# C
put('hit', look - 0.87, -20, 0.5)
put('button', press, -12, 0.15); put('hum', press, -22, map3d + 0.3 - press)
for k in range(6): put('snap', researchers + 0.2 + k * ((map3d - 0.6 - researchers) / 6) + 0.05, -18, 0.25)
put('swell', map3d - 0.4, -18, 1.2)
put('whoosh', slice_ + 0.8, -16, spiral - slice_ + 0.2)
put('shimmer', T('That’s the sheet'), -22, TE('over and over.') - T('That’s the sheet') + 0.3)
# D
put('ping', see + 0.3, -18, 1.0)
put('tension', jump + 0.2, -10, 2.5)
put('buzz', keep + 0.3, -22, 0.4)
put('rewind', eachOther + 0.3, -18, 0.6)
# E
for i in range(3): put('chime', traced + 0.3 + i * 0.6, -22, 1.0)
put('unroll', gave + 0.15, -12, flatten + 1.0 - gave - 0.15)
put('settle', nowPage - 0.1, -14, 0.7)
# F
put('pop', inkWas + 0.5, -20, 0.2); put('whoosh', inScan, -26, 0.7)
for k in range(4): put('tick', trained + 0.7 + k * 0.6, -18, 0.05)
put('pop', imagine, -22, 0.2)
put('grain', put_ + 0.25, -16, stroke - put_ - 0.2); put('chime', stroke + 0.1, -18, 1.4)
# G
put('hit', checked - 0.15, -16, 0.6)
put('pop', second + 0.4, -22, 0.2); put('pop', sharper, -22, 0.2); put('whoosh', sharper + 1.6, -24, 0.9)
put('whoosh', lined, -22, 1.0); put('lock', lined + 1.0, -14, 2.5)
for k in range(4): put('chime', same + 0.15 + k * 0.15, -24, 0.8)
# H
put('hit', back - 0.1, -18, 0.6); put('whoosh', back + 0.3, -20, feet - back)
for k in range(22): put('tick', scholars + 0.1 + (k / 22) * (columns - scholars), -26, 0.05)
put('whoosh', oneOf - 0.15, -22, T('through study.') - oneOf + 0.5)
put('scratch', somebody + 0.1, -10, ago - somebody - 0.2)
put('whoosh', youJust + 1.0, -22, 1.1)
put('rewind', still + 0.45, -20, stillEnd + 0.5 - still - 0.45)

# ------------------------------------------------------------------------------------------------ score
# Light, spare pads in D major / B minor; sections follow the picture. The translation gets one held note.
score = np.zeros(N)
def pad(at, dur, notes, gain_db):
    n, t = tt(dur)
    env = np.minimum(1, t / 1.2) * np.minimum(1, np.maximum(0, (dur - t)) / 1.5)
    x = np.zeros(n)
    for m in notes:
        f = NOTE(m)
        x += (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t + 0.3) + 0.08 * np.sin(2 * np.pi * 3 * f * t)) * (1 + 0.004 * np.sin(2 * np.pi * 0.2 * t))
    x = lp(x / len(notes), 2200) * env
    i = int(at * SR); m = min(n, N - i)
    if m > 0: score[i:i + m] += x[:m] * 10 ** (gain_db / 20)
def pluck(at, m, gain_db=-6):
    n, t = tt(1.6)
    f = NOTE(m)
    x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t / 0.5) * np.minimum(1, t / 0.005)
    i = int(at * SR); k = min(n, N - i)
    if k > 0: score[i:i + k] += x[:k] * 10 ** (gain_db / 20)

CH = {'D': [50, 57, 62, 66], 'Bm': [47, 54, 59, 62], 'G': [43, 50, 55, 59], 'A': [45, 52, 57, 61], 'Em': [40, 47, 52, 55], 'F#m': [42, 49, 54, 57]}
def prog(a, b, chords, gain_db=-4):
    if b <= a: return
    seg = (b - a) / len(chords)
    for k, c in enumerate(chords):
        pad(a + k * seg, seg + 1.5, CH[c], gain_db)
prog(0.0, book, ['D', 'Bm'])
prog(book, T('Centuries later'), ['G', 'D'], -6)
prog(T('Centuries later'), look - 0.85, ['Em', 'Bm', 'G'], -7)
prog(look - 0.85, see, ['D', 'A', 'Bm', 'G'], -5)
prog(see, traced, ['Em', 'F#m', 'Em'], -6)
prog(traced, inkWas, ['G', 'D', 'A'], -5)
prog(inkWas, checked - 0.15, ['Bm', 'G', 'D', 'A', 'Bm', 'G'], -6)
prog(checked - 0.15, back - 0.1, ['Em', 'A', 'D'], -5)
prog(back - 0.1, quote - 0.6, ['G', 'D', 'Bm'], -5)
pad(quote - 0.6, quoteEnd - quote + 3.0, [62], -8)            # one held note for the translation
prog(quoteEnd + 1.6, stillEnd + 0.4, ['G', 'A'], -6)
pad(stillEnd + 0.2, N / SR - stillEnd, CH['D'] + [69], -4)   # resolve on the still-rolled scroll
# sparse plucks marking the turns of the explanation
for at, m in [(1.2, 74), (2.0, 78), (gave + 0.2, 69), (flatten + 0.6, 74), (nowPage, 78), (stroke + 0.1, 81), (lined + 1.0, 74), (stillEnd + 0.3, 74)]:
    pluck(at, m, -10)

# ------------------------------------------------------------------------------------------------ mix
env_n = np.sqrt(np.convolve(narr ** 2, np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'))
duck = 1 - 0.55 * np.clip(env_n / (np.percentile(env_n[env_n > 1e-4], 70) + 1e-9), 0, 1)
duck = np.convolve(duck, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same')
room = lp(noise(N), 600) * 10 ** (-58 / 20)
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(np.stack([x, x], 1))
nl = lufs(narr)
score_s = score * 10 ** ((nl - 20 - lufs(score)) / 20) * duck          # music ~20 LU under the voice (before ducking)
fx_s = fxbus * 10 ** ((nl - 12 - lufs(fxbus)) / 20)                    # effects ~12 LU under the voice
mono = narr + score_s + fx_s + room
# gentle stereo: score and effects slightly wide, voice centred
side = lp(np.roll(score_s + fx_s * 0.5, int(0.011 * SR)) - (score_s + fx_s * 0.5), 6000) * 0.25
L, R = mono + side, mono - side
st = np.stack([L, R], 1)
def tp(x): return 20 * np.log10(np.max(np.abs(resample_poly(x, 4, 1, axis=0))) + 1e-12)
# normalise to -14 LUFS, soft-limit the few voice peaks above -2 dBFS, repeat until both targets hold
thr = 10 ** (-2.0 / 20)
for _ in range(6):
    st *= 10 ** ((-14.0 - meter.integrated_loudness(st)) / 20)
    a = np.abs(st)
    st = np.where(a > thr, np.sign(st) * (thr + (1 - thr) * np.tanh((a - thr) / (1 - thr))), st)
if tp(st) > -1.0: st *= 10 ** ((-1.05 - tp(st)) / 20)
os.makedirs('audio/mix', exist_ok=True)
sf.write('audio/mix/FGW_Scroll_V1_mix.wav', st, SR, subtype='PCM_24')
os.makedirs('source/public/audio', exist_ok=True)
sf.write('source/public/audio/mix.wav', st, SR, subtype='PCM_24')
m = {'integrated_lufs': round(meter.integrated_loudness(st), 2), 'true_peak_dbtp': round(tp(st), 2), 'duration_s': round(len(st) / SR, 4),
     'music_vs_voice_lu': -20, 'fx_vs_voice_lu': -12}
json.dump(m, open('audio/mix/mix_measure.json', 'w'), indent=1)
print(m)
