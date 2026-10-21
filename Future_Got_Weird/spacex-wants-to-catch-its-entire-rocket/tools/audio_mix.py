"""Original score + sound effects (synthesised here, no third-party audio) and the final mix.

Inputs : audio/narration/narration_review.wav, narration_lines.json, narration_words.json
Outputs: audio/mix/music.wav, audio/mix/sfx.wav, source/public/audio/mix.wav (48 kHz stereo),
         source/public/audio/narration_review.wav, audio/mix/mix_measure.json, audio/sfx_cues.json
All cue times come from the measured narration timing, i.e. the same values the picture uses.
"""
import json, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
import pyloudnorm as pyln

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
L = json.load(open(f'{ROOT}/audio/narration/narration_lines.json'))
W = json.load(open(f'{ROOT}/audio/narration/narration_words.json'))
lines = {l['id']: l for l in L['lines']}
DUR = L['duration'] + 1.6
N = int(DUR * SR)
rng = np.random.default_rng(7)

def ls(i): return lines[i]['s']
def le(i): return lines[i]['e']
def norm(w): return ''.join(c for c in w.lower() if c.isalnum())
def wt(i, word, nth=0):
    ws = [w for w in W if w['line'] == i and norm(w['w']) == word.lower()]
    return ws[min(nth, len(ws) - 1)]['s']

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
def env(n, a, r, sustain=True):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e

# ---------------- effects ----------------
def rumble(d, k=1.0):
    n = int(d * SR)
    b = np.cumsum(rng.standard_normal(n)); b -= np.convolve(b, np.ones(4800) / 4800, 'same')
    b = lp(b, 160) * 0.004
    cr = rng.standard_normal(n) * (rng.random(n) < 0.02)
    cr = bp(cr, 300, 2400) * 0.9
    roar = bp(rng.standard_normal(n), 80, 900) * 0.35
    flutter = 1 + 0.25 * np.sin(2 * np.pi * 7.3 * np.arange(n) / SR + rng.random() * 6)
    x = (b * 1.2 + roar * flutter + cr * 0.25) * k
    return x * env(n, 0.25, 0.4)
def whoosh(d=0.6, lo=300, hi=3500):
    n = int(d * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n); seg = n // 12
    for i in range(12):
        f = lo + (hi - lo) * np.sin(np.pi * (i + 0.5) / 12)
        s = bp(x, max(60, f * 0.6), min(20000, f * 1.4))
        out[i * seg:(i + 1) * seg] = s[i * seg:(i + 1) * seg]
    return out * np.hanning(n) * 0.6
def boom(d=1.6, f0=48):
    n = int(d * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f0 * tt * (1 - 0.15 * tt)) * np.exp(-tt * 3.2)
    x += lp(rng.standard_normal(n), 300) * np.exp(-tt * 9) * 0.25
    return x * 0.9
def clunk(d=1.2):
    n = int(d * SR); tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * dcy) for f, a, dcy in [(172, 0.5, 6), (247, 0.35, 9), (391, 0.3, 12), (613, 0.2, 16), (977, 0.12, 22)])
    x += np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 8) * 0.8
    x += lp(rng.standard_normal(n), 900) * np.exp(-tt * 30) * 0.3
    return x * 0.8
def servo(d=1.5, f0=95, f1=140):
    n = int(d * SR); tt = np.arange(n) / SR
    f = f0 + (f1 - f0) * (tt / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    x = bp(saw, 150, 1800) * (1 + 0.3 * np.sin(2 * np.pi * 11 * tt))
    x += bp(rng.standard_normal(n), 2000, 5000) * 0.05
    return x * env(n, 0.12, 0.25) * 0.35
def wind(d=4.0):
    n = int(d * SR); tt = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 350, 1600) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.37 * tt) ** 2)
    return x * env(n, 0.8, 0.8) * 0.5
def plasma(d=6.0):
    n = int(d * SR); tt = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 120, 1400) * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * tt))
    x += lp(rng.standard_normal(n), 90) * 0.8
    return x * env(n, 1.2, 1.0) * 0.6
def splash(d=1.6):
    n = int(d * SR); tt = np.arange(n) / SR
    return (bp(rng.standard_normal(n), 200, 5000) * np.exp(-tt * 3) + lp(rng.standard_normal(n), 200) * np.exp(-tt * 6)) * 0.55
def pop(d=0.12, f=880):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 40) * 0.25
def beep2(d=1.2):
    n = int(d * SR); tt = np.arange(n) / SR
    f = np.where((tt % 0.4) < 0.2, 660, 520)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * ((tt % 0.2) < 0.15) * 0.12
def crackle(d=4.0):
    n = int(d * SR)
    x = rng.standard_normal(n) * (rng.random(n) < 0.004)
    return bp(x, 1500, 7000) * env(n, 0.3, 1.5) * 2.0

FX = dict(rumble=rumble, whoosh=whoosh, boom=boom, clunk=clunk, servo=servo, wind=wind, plasma=plasma, splash=splash, pop=pop, beep2=beep2, crackle=crackle)

TF = wt('h2', 'yet') + 0.25
cues = [
    # hook
    (0.0, 'rumble', TF, 0.6), (TF - 0.02, 'boom', 1.4, 0.35),
    (ls('h3') - 0.15, 'whoosh', 0.35, 0.6), (ls('h3') - 0.15, 'rumble', 1.6, 0.6), (ls('h3') + 1.35, 'clunk', 1.4, 0.9),
    (ls('h4') - 0.1, 'whoosh', 0.5, 0.6), (ls('h4') + 0.4, 'plasma', le('h4') - ls('h4') + 0.2, 0.35),
    (ls('h5'), 'whoosh', 0.45, 0.5), (wt('h5', 'different') - 0.15, 'boom', 2.2, 0.7),
    # stack
    (ls('a1') - 0.3, 'wind', le('a2') - ls('a1'), 0.25),
    (wt('a2', 'Thirty') - 0.1, 'pop', 0.12, 0.6),
    (wt('a2', 'throw') + 0.2, 'boom', 2.0, 0.8), (wt('a2', 'throw') + 0.2, 'rumble', ls('a3') - wt('a2', 'throw') + 0.4, 0.75),
    (ls('a4'), 'whoosh', 0.35, 0.5), (ls('a4') + 1.2, 'splash', 1.6, 0.7), (ls('a4') + 3.0, 'splash', 1.6, 0.8),
    (ls('a5'), 'whoosh', 0.35, 0.5), (ls('a5') + 0.6, 'whoosh', 1.4, 0.25), (ls('a5') + 1.4, 'whoosh', 1.6, 0.25),
    # booster
    (ls('b1') - 0.2, 'rumble', wt('b1', 'separate') - ls('b1') + 0.4, 0.8), (wt('b1', 'separate') - 0.2, 'boom', 2.0, 0.5),
    (wt('b1', 'separate') - 0.1, 'rumble', 1.8, 0.5),
    (ls('b2') + 0.2, 'servo', 2.0, 0.2), (ls('b2') + 2.4, 'rumble', wt('b2', 'It') - ls('b2') - 2.5, 0.38),
    (ls('b3') - 0.1, 'whoosh', 0.4, 0.5), (ls('b3'), 'wind', le('b3') - ls('b3') + 0.3, 0.4), (wt('b3', 'grid') - 0.2, 'servo', 1.4, 0.3),
    (wt('b4', 'light') - 0.2, 'rumble', ls('b5') - wt('b4', 'light') + 0.2, 0.85),
    (wt('b5', 'doesnt') - 0.1, 'boom', 0.9, 0.35),
    (ls('b6') - 0.1, 'rumble', wt('b6', 'settles') + 1.6 - ls('b6'), 0.6), (wt('b6', 'arms', 1) - 0.1, 'servo', 1.7, 0.6),
    (wt('b6', 'settles') + 1.6, 'clunk', 1.4, 1.0),
    (wt('b7', 'weight') - 0.1, 'clunk', 1.2, 0.35),
    (ls('b8') + 0.3, 'pop', 0.12, 0.5), (ls('b8') + 1.0, 'pop', 0.12, 0.5), (ls('b8') + 1.7, 'pop', 0.12, 0.5),
    (ls('b8'), 'whoosh', 0.35, 0.45), (ls('b9'), 'whoosh', 0.35, 0.45),
    (ls('b10') + 2.2, 'servo', 1.3, 0.5), (ls('b10') + 3.5, 'servo', 1.3, 0.5), (ls('b10') + 4.8, 'servo', 1.0, 0.4),
    # orbit
    (ls('c1') - 0.2, 'pop', 0.12, 0.5),
    (ls('c3') + 4.3, 'whoosh', 1.6, 0.25), (ls('c6'), 'plasma', le('c6') - ls('c6') + 0.6, 0.3),
    # reentry
    (ls('d1'), 'plasma', ls('d3') - ls('d1') + 0.5, 0.33), (ls('d3') - 0.1, 'whoosh', 0.45, 0.5), (ls('d3'), 'wind', ls('d5') - ls('d3'), 0.32),
    (wt('d6', 'light') - 0.15, 'boom', 1.8, 0.45), (wt('d6', 'light') - 0.15, 'rumble', ls('d7') - wt('d6', 'light') + 0.3, 0.85),
    (ls('d7'), 'whoosh', 0.35, 0.5), (ls('d7') + 2.6, 'splash', 1.6, 0.6),
    # tower
    (ls('e1') - 0.2, 'boom', 2.4, 0.4), (ls('e3') + 1.2, 'servo', 2.0, 0.55), (ls('e3') + 4.6, 'servo', 1.6, 0.5),
    (wt('e3', 'swing') - 0.2, 'servo', 1.2, 0.5), (wt('e3', 'closed'), 'servo', 1.0, 0.4),
    (ls('e4') + 0.2, 'servo', 3.0, 0.3), (ls('e5') - 0.05, 'whoosh', 0.35, 0.5), (ls('e5') + 1.0, 'servo', 4.5, 0.3),
    (wt('e6', 'loads') - 0.2, 'pop', 0.12, 0.6), (wt('e6', 'alignment') - 0.2, 'pop', 0.12, 0.6), (wt('e6', 'flying') - 0.2, 'pop', 0.14, 0.6),
    (ls('e7'), 'rumble', le('e8') - ls('e7') + 0.3, 0.35), (wt('e7', 'arms') - 0.2, 'servo', 1.4, 0.5),
    # wrong
    (ls('f1') - 0.2, 'boom', 2.0, 0.55), (ls('f2'), 'rumble', le('f2') - ls('f2'), 0.45), (ls('f2'), 'wind', le('f2') - ls('f2') + 0.5, 0.35),
    (wt('f3', 'miss') - 0.2, 'boom', 1.2, 0.3),
    (ls('f4') - 0.05, 'whoosh', 0.35, 0.5), (wt('f4', 'called') - 0.2, 'beep2', 1.2, 0.3),
    (le('f5') - 1.0, 'splash', 1.6, 0.6), (ls('f6'), 'crackle', 5.0, 0.4),
    # payoff
    (wt('g2', 'Launch') - 0.2, 'boom', 1.8, 0.6), (wt('g2', 'Launch') - 0.2, 'rumble', wt('g2', 'Separation') - wt('g2', 'Launch'), 0.75),
    (wt('g2', 'Separation') - 0.1, 'boom', 1.5, 0.5), (wt('g2', 'turns'), 'rumble', 2.3, 0.5), (wt('g2', 'turns') + 2.2, 'clunk', 1.4, 0.8),
    (ls('g3'), 'rumble', le('g4') - ls('g3'), 0.45), (wt('g4', 'Two') - 0.2, 'boom', 2.4, 0.7),
    (wt('g6', 'once') - 0.2, 'pop', 0.12, 0.4), (ls('g7') + 2.4, 'splash', 1.6, 0.3), (ls('g7') + 3.4, 'splash', 1.6, 0.3),
]

def place(buf, t0, x, g):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x * g

sfx = np.zeros((N, 2))
for (t0, kind, d, g) in cues:
    x = FX[kind](d) if kind not in ('pop',) else FX[kind]()
    x = x / (np.abs(x).max() + 1e-9)
    pan = 0.5 + 0.18 * np.sin(t0)
    place(sfx[:, 0], t0, x * (1 - pan) * 2 * 0.5, g)
    place(sfx[:, 1], t0, x * pan * 2 * 0.5, g)
json.dump([{'t': round(c[0], 3), 'fx': c[1], 'dur': round(c[2], 3), 'gain': c[3]} for c in cues], open(f'{ROOT}/audio/sfx_cues.json', 'w'), indent=0)

# ---------------- score ----------------
NOTE = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
def hz(name, octv): return 440 * 2 ** ((NOTE[name] + 12 * (octv + 1) - 69) / 12)
CH = {
    'Dm': ['D', 'F', 'A'], 'Bb': ['Bb', 'D', 'F'], 'F': ['F', 'A', 'C'], 'C': ['C', 'E', 'G'], 'Gm': ['G', 'Bb', 'D'],
    'Eb': ['Eb', 'G', 'Bb'], 'Fmaj7': ['F', 'A', 'C', 'E'], 'Cadd9': ['C', 'E', 'G', 'D'], 'Dsus': ['D', 'G', 'A'], 'Am': ['A', 'C', 'E'],
}
BAR = 2.4  # 100 bpm, 4/4
def section(t0, t1, prog, pulse, arp, level):
    out = np.zeros((N, 2))
    nb = int(np.ceil((t1 - t0) / BAR))
    for b in range(nb):
        cs = prog[b % len(prog)]
        bt = t0 + b * BAR
        d = min(BAR + 0.8, DUR - bt)
        if d <= 0: break
        n = int(d * SR); tt = np.arange(n) / SR
        pad = np.zeros(n)
        for k, nm in enumerate(CH[cs]):
            f = hz(nm, 3 + (k > 1))
            for det in (-0.12, 0.0, 0.11):
                pad += np.sin(2 * np.pi * f * (1 + det / 100) * tt + k) * 0.12
        pad = lp(pad, 1800) * env(n, 0.6, 0.8)
        bass = np.zeros(n)
        if pulse:
            for q in range(8):
                st = int(q * BAR / 8 * SR)
                if st >= n: break
                m = min(n - st, int(0.28 * SR)); ts = np.arange(m) / SR
                bass[st:st + m] += np.sin(2 * np.pi * hz(CH[cs][0], 1) * ts) * np.exp(-ts * 9) * 0.5 * (1.0 if q % 2 == 0 else 0.6)
        ar = np.zeros(n)
        if arp:
            seq = CH[cs] + CH[cs][1:2]
            for q in range(8):
                st = int(q * BAR / 8 * SR)
                if st >= n: break
                m = min(n - st, int(0.25 * SR)); ts = np.arange(m) / SR
                ar[st:st + m] += np.sin(2 * np.pi * hz(seq[q % len(seq)], 5) * ts) * np.exp(-ts * 14) * 0.13
        i0 = int(bt * SR)
        seg = (pad + bass + ar) * level
        m = min(n, N - i0)
        out[i0:i0 + m, 0] += seg[:m] * 0.95 + np.roll(ar, 300)[:m] * level * 0.3
        out[i0:i0 + m, 1] += seg[:m] * 0.95 - np.roll(ar, 300)[:m] * level * 0.1
    # section fades
    a, b = int(t0 * SR), min(N, int(t1 * SR))
    fade = np.zeros(N); fade[a:b] = 1
    k = int(0.8 * SR)
    fade[a:a + k] = np.linspace(0, 1, min(k, b - a))[: len(fade[a:a + k])]
    fade[max(a, b - k):b] *= np.linspace(1, 0, b - max(a, b - k))
    return out * fade[:, None]

hook_a = section(0.0, TF, ['Dm', 'Dm', 'Bb', 'C'], True, False, 0.9)
hook_b = section(ls('h3') - 0.2, ls('a1') + 0.3, ['Bb', 'F', 'C', 'Dm'], False, True, 0.8)
music = hook_a + hook_b
music += section(ls('a1') - 0.3, ls('b1'), ['Dm', 'Bb', 'F', 'C'], True, True, 0.75)
music += section(ls('b1') - 0.2, ls('c1'), ['Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'F', 'C'], True, True, 0.75)
music += section(ls('c1') - 0.2, ls('d1'), ['Fmaj7', 'Cadd9', 'Am', 'Cadd9'], False, True, 0.7)
music += section(ls('d1') - 0.2, ls('e1'), ['Dm', 'Eb', 'Dm', 'Bb'], True, False, 0.85)
music += section(ls('e1') - 0.2, ls('f1'), ['Gm', 'Dm', 'Bb', 'C'], True, True, 0.7)
music += section(ls('f1') - 0.2, ls('g1'), ['Dm', 'Eb', 'Dm', 'Dsus'], True, False, 0.75)
music += section(ls('g1') - 0.2, DUR, ['Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'F'], True, True, 0.8)
# silence in the freeze: nothing between TF and the H3 cut except the boom tail
voice, vsr = sf.read(f'{ROOT}/audio/narration/narration_review.wav')
assert vsr == SR
v = np.zeros(N); v[: len(voice)] = voice[:N]
# duck music under the voice
e = np.sqrt(np.convolve(v ** 2, np.ones(2400) / 2400, 'same'))
active = (e > 0.02).astype(float)
from scipy.ndimage import maximum_filter1d
active = maximum_filter1d(active, int(0.5 * SR))
active = np.convolve(active, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')
duck = 1 - 0.6 * np.clip(active, 0, 1)
music *= duck[:, None]
# speech-band ducking for effects: the low rumble stays, the 250 Hz+ part steps aside for the voice
sfx_lo = np.stack([lp(sfx[:, c], 250, 4) for c in range(2)], 1)
sfx_hi = sfx - sfx_lo
sfx = sfx_lo * (1 - 0.35 * np.clip(active, 0, 1))[:, None] + sfx_hi * (1 - 0.8 * np.clip(active, 0, 1))[:, None]

meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x if x.ndim == 2 else np.stack([x, x], 1))
vl = lufs(v)
v *= 10 ** ((-17.0 - vl) / 20)
ml = lufs(music); music *= 10 ** ((-32.0 - ml) / 20)
sl = lufs(sfx); sfx *= 10 ** ((-28.0 - sl) / 20)
mix = np.stack([v, v], 1) + music + sfx
ml2 = lufs(mix)
mix *= 10 ** ((-15.0 - ml2) / 20)
peak = np.abs(mix).max()
lim = 10 ** (-1.5 / 20)
if peak > lim:
    # soft knee limiter
    over = np.abs(mix) > lim * 0.8
    mix = np.where(over, np.sign(mix) * (lim * 0.8 + (lim * 0.2) * np.tanh((np.abs(mix) - lim * 0.8) / (lim * 0.2))), mix)
os.makedirs(f'{ROOT}/audio/mix', exist_ok=True)
sf.write(f'{ROOT}/audio/mix/music.wav', music.astype(np.float32), SR)
sf.write(f'{ROOT}/audio/mix/sfx.wav', sfx.astype(np.float32), SR)
os.makedirs(f'{ROOT}/source/public/audio', exist_ok=True)
sf.write(f'{ROOT}/source/public/audio/mix.wav', mix.astype(np.float32), SR, subtype='PCM_16')
sf.write(f'{ROOT}/source/public/audio/narration_review.wav', v.astype(np.float32), SR, subtype='PCM_16')
# speech-vs-bed check: in voiced 1 s windows, how far below the voice do music+sfx sit?
win = SR
rows = []
for i in range(0, N - win, win):
    vv = bp(v[i:i + win], 300, 4000); bb = bp((music + sfx)[i:i + win].mean(1), 300, 4000)
    if np.sqrt((v[i:i + win] ** 2).mean()) > 0.02:
        rows.append(20 * np.log10(np.sqrt((vv ** 2).mean()) / (np.sqrt((bb ** 2).mean()) + 1e-9)))
meas = {
    'integrated_lufs': round(lufs(mix), 2), 'peak_dbfs': round(20 * np.log10(np.abs(mix).max()), 2), 'duration_s': round(N / SR, 3),
    'speechband_voice_over_bed_db_min': round(min(rows), 1), 'speechband_voice_over_bed_db_median': round(float(np.median(rows)), 1), 'cues': len(cues),
}
json.dump(meas, open(f'{ROOT}/audio/mix/mix_measure.json', 'w'), indent=1)
print(meas)
