#!/usr/bin/env python3
"""Sound design, music bed and mix for "This Time Machine Actually Works". Everything is synthesised here (no
samples, no third-party music). The narration master is used sample for sample (gain, a gentle compressor and a
limiter only). Event times mirror source/src/story.ts (shot boundaries and staged actions); narration anchors come
from the measured word timeline.

  hook + loop: one continuous time-warp (a slow reversed swell, a detuned glide, a high shimmer) that starts in the
        loop tail and runs through frame 0 into the ageing, so the wrap is seamless;
  space: a low black-hole rumble (sub tones with slow beating), a soft pass of the ship's engine as it approaches;
  cabin: restrained mechanical watch ticking at the real rate (4 beats a second, accented each second);
  Earth: a rising whirr of years passing; a soft air pass through the cloud;
  neighbourhood: birds and air while the decades run (a gentle whirr), the capsule's descent roar, a landing thud and
        dust, the hatch, footsteps, a run, the door;
  family reveal: the sound design drops away to room tone and one soft pad note: a brief emotional moment;
  explanation: the rumble returns under fine glassy tones for the bending light; his watch ticks normally while a
        fast, distant clatter stands for the racing Earth clock;
  ending: the visor swell rises into the same time-warp that opens the film.
Music: a quiet minor pad (no beat, no drops), each tone tuned so it completes whole cycles over the film length (the
end continues into the start), ducked under the voice and thinned for the family reveal.
Levels: voice about -16 LUFS; whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
from scipy.ndimage import minimum_filter1d

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
TL = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
DUR = TL['duration']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2026)
LOG = []
def W(w, n=0):
    k = lambda s: s.lower().strip('.,')
    return [x for x in TL['words'] if k(x['word']) == k(w)][n]['start']

# story.ts shot boundaries and staged events
S = dict(A1=1.75, B1=4.95, C1=7.0, D1=8.75, E1=15.25, F1=18.85, G1=20.95, H1=22.75)
T_LAND = 12.55

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at, name=None, gain_db=0.0, wrap=False):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    if wrap: idx = idx % N
    m = (idx >= 0) & (idx < N)
    np.add.at(buf, idx[m], sig[m] * db(gain_db))
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def win(a, b, fa=0.1, fb=0.1): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def loopf(f): return round(f * DUR) / DUR  # a tone that completes whole cycles over the film

# ---------------- generators
def warp(dur=2.4):
    """time-warp: a reversed, rising noise swell with a detuned glide that bends down, a shimmer on top"""
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    sw = bp(noise(n), 300, 2400) * (u ** 2.2) * (1 - np.clip((u - 0.9) / 0.1, 0, 1))
    f = 220 * (1 - 0.45 * u)
    ph = 2 * np.pi * np.cumsum(f) / SR
    glide = (np.sin(ph) + np.sin(ph * 1.0071) + 0.6 * np.sin(ph * 1.5 + 0.3) + 0.4 * np.sin(ph * 2.003)) * np.sin(np.pi * u) ** 1.5
    fs = 3400 * (1 + 0.3 * u)
    sh = sum(np.sin(2 * np.pi * np.cumsum(fs * (1 + 0.004 * k)) / SR + k) for k in range(4)) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt)) * np.sin(np.pi * u) ** 2
    sub = np.sin(2 * np.pi * np.cumsum(55 * (1 - 0.2 * u)) / SR) * np.sin(np.pi * u) ** 2
    return norm(0.55 * norm(sw) + 0.5 * norm(glide) + 0.12 * norm(sh) + 0.5 * sub)
def rumble(dur, f=31.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) + 0.7 * np.sin(2 * np.pi * (f * 1.5 + 0.4) * tt) + 0.5 * np.sin(2 * np.pi * (f * 2.01) * tt)
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.35 * tt)
    grit = lp(noise(n), 160) * 0.6
    return norm(lp(x + grit, 220)) * env(n, 0.5, 0.6)
def tick(dur=0.025, f=3800, bright=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 2500) * np.exp(-tt / 0.0012) * bright + 0.35 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.003))
def whoosh(dur, lo=200, hi=1800, up=True):
    n = int(dur * SR); u = np.arange(n) / n
    x = noise(n); out = np.zeros(n); seg = 2400
    for k in range(0, n, seg):
        c = lo + (hi - lo) * (u[k] if up else 1 - u[k])
        out[k:k + seg] = bp(x[k:k + seg + 1200], c * 0.6, c * 1.4)[:len(out[k:k + seg])]
    return norm(out) * np.sin(np.pi * u) ** 1.6
def engine(dur):
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = 70 + 40 * u
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) + 0.6 * bp(noise(n), 300, 1500)
    return norm(lp(x, 2500)) * u ** 2 * env(n, 0.05, 0.15)
def roar(dur):
    n = int(dur * SR); u = np.arange(n) / n
    x = lp(noise(n), 900) + 0.5 * bp(noise(n), 900, 3000) * u
    return norm(x) * (0.2 + 0.8 * u) * env(n, 0.3, 0.12)
def thud(f0=80, f1=38, dur=0.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, n)) / SR) * np.exp(-tt / 0.16) + 0.3 * lp(noise(n), 500) * np.exp(-tt / 0.05))
def hiss(dur):
    n = int(dur * SR); return norm(bp(noise(n), 2500, 9000)) * env(n, 0.02, dur * 0.7)
def step(bright=0.6, wood=False):
    n = int(0.12 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (140 if wood else 90) * tt) * np.exp(-tt / 0.03)
    return norm(body * 0.7 + bp(noise(n), 300, 3000 if wood else 2000) * np.exp(-tt / 0.012) * bright)
def creak(dur=0.45, f=210):
    n = int(dur * SR); tt = np.arange(n) / SR
    ph = np.cumsum(55 * (1 + 0.4 * np.sin(2 * np.pi * 2 * tt)) / SR)
    p = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    return norm(bp(np.convolve(p, np.sin(2 * np.pi * f * np.arange(900) / SR) * np.exp(-np.arange(900) / SR / 0.004), 'same'), 120, 2500)) * env(n, 0.1, 0.2)
def chirp():
    n = int(0.14 * SR); tt = np.arange(n) / SR
    f = 3200 + 1600 * np.sin(np.pi * tt / 0.14) + 300 * np.sin(2 * np.pi * 30 * tt)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * tt / 0.14) ** 2
def glass(f, dur=1.4):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.3)) * np.exp(-tt / (dur * 0.4)) * env(n, 0.01, 0.2)

sfx = np.zeros(N)
# ---- the time-warp: begins in the loop tail and wraps through frame 0 into the ageing (one sound across the seam)
wv = warp(2.45)
place(sfx, wv, S['H1'] - 0.3, 'time-warp (loop tail -> frame 0 -> ageing)', -4.0, wrap=True)
place(sfx, whoosh(0.7, 300, 1400), 1.35, 'into the visor reflection', -15.0)
# ---- space
place(sfx, rumble(3.6), 1.5, 'black hole rumble', -6.0)
place(sfx, engine(1.25), 3.75, 'ship engine approaching', -14.0)
place(sfx, whoosh(0.5, 400, 2000), 4.7, 'through the porthole', -18.0)
# ---- cabin: a mechanical watch at the REAL rate (4 beats per second, accented once per second)
cabin_t0 = S['B1'] + 0.05
k = 0
while cabin_t0 + k * 0.25 < S['C1'] + 0.15:
    tt0 = cabin_t0 + k * 0.25
    place(sfx, tick(bright=1.0 if k % 4 == 0 else 0.55), tt0, 'watch tick' if k % 4 == 0 else None, -17.0 if k % 4 == 0 else -23.0)
    k += 1
cabin = lp(hp(noise(N), 50), 300) * win(S['B1'], S['C1'], 0.2, 0.2)
# ---- Earth: years racing by
yrs = np.zeros(N)
u = np.clip((t - S['C1']) / (S['D1'] - S['C1']), 0, 1)
rate = 4 + 26 * u ** 1.5
yrs += bp(noise(N), 500, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(rate) / SR)) * win(S['C1'] - 0.1, S['D1'] - 0.2, 0.3, 0.3)
place(sfx, whoosh(0.9, 250, 900, up=False), 8.35, 'cloud pass', -12.0)
# ---- neighbourhood: the decades (birds and a gentle whirr), the return
for k2 in range(14):
    at = 9.15 + k2 * 0.13 + rng.random() * 0.05
    if at < 10.95: place(sfx, chirp(), at, None, -30.0 + 4 * rng.random())
dec = bp(noise(N), 700, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(9 + 6 * np.sin(np.pi * np.clip((t - 9.1) / 1.85, 0, 1))) / SR)) * win(9.1, 10.95, 0.3, 0.3)
place(sfx, roar(1.55), 11.0, 'capsule descent roar', -10.0)
place(sfx, thud(), T_LAND, 'capsule landing thud', -6.0)
place(sfx, hiss(0.7), T_LAND + 0.02, 'landing dust', -18.0)
place(sfx, hiss(0.35), 12.7, 'hatch release', -20.0)
place(sfx, thud(260, 140, 0.15), 12.92, 'hatch clunk', -18.0)
for k2, at in enumerate([13.0, 13.18, 13.36]): place(sfx, step(), at, 'step' if k2 == 0 else None, -20.0)
for k2 in range(6): place(sfx, step(0.8), 14.4 + k2 * 0.11, 'run' if k2 == 0 else None, -18.0)
place(sfx, creak(), 14.85, 'door creak', -20.0)
nb = bp(noise(N), 300, 4000) * win(8.9, S['E1'], 0.4, 0.2)
# ---- hallway: running on wood, then stillness for the family reveal
for k2 in range(7): place(sfx, step(0.7, wood=True), 15.35 + k2 * 0.2, 'footsteps (wood)' if k2 == 0 else None, -21.0 - k2 * 0.6)
room = lp(hp(noise(N), 80), 600) * win(S['E1'], S['F1'], 0.2, 0.3)
place(sfx, rumble(1.0, 34.0), 18.2, 'swell into the eye', -14.0)
# ---- explanation: rumble, bending light, two clocks
place(sfx, rumble(2.4), S['F1'] - 0.1, 'black hole rumble (explanation)', -8.0)
for k2, f in enumerate([1568.0, 2093.0, 1760.0, 2637.0]): place(sfx, glass(f), 19.2 + k2 * 0.28, 'bending light' if k2 == 0 else None, -27.0)
k = 0
while 19.3 + k * 0.25 < S['G1'] + 0.6:
    place(sfx, tick(bright=1.0 if k % 4 == 0 else 0.55), 19.3 + k * 0.25, 'his watch: normal ticking' if k == 0 else None, -19.0 if k % 4 == 0 else -25.0)
    k += 1
fast = np.zeros(N)
for k2 in range(int(1.4 * 38)):
    place(fast, tick(0.012, 5200, 0.5), 19.45 + k2 / 38.0)
place(sfx, fast * win(19.4, 20.85, 0.2, 0.2), 0, 'Earth clock racing (fast distant clatter)', -26.0)
# ---- ending: the visor swell rises into the warp (placed above, wrapping through frame 0)
place(sfx, whoosh(0.9, 200, 1200), 21.85, 'toward the visor', -16.0)

# ---------------- music: a quiet minor pad, tones tuned to whole cycles over the film
def pad(freqs, amp):
    x = np.zeros(N)
    for f in freqs:
        fl = loopf(f)
        x += np.sin(2 * np.pi * fl * t) + 0.25 * np.sin(2 * np.pi * loopf(f * 2.0) * t + 0.4)
    return x * amp
dm = pad([73.42, 110.0, 174.61, 220.0], 1.0)       # D minor
bb = pad([58.27, 116.54, 174.61, 233.08], 1.0)     # B-flat
gm = pad([98.0, 146.83, 233.08], 1.0)              # G minor (thin)
def seg(a, b, fa=0.6, fb=0.6): return win(a, b, fa, fb)
mus = dm * np.clip(seg(-1, 8.9) + seg(17.8, DUR + 1), 0, 1) + bb * seg(8.9, 15.3) + gm * seg(15.3, 17.8) * 0.55
lfo = 0.75 + 0.25 * np.sin(2 * np.pi * loopf(0.21) * t)
mus = lp(mus * lfo, 1800)
# the family reveal: the bed thins to almost nothing for a moment
mus *= 1 - 0.7 * win(15.6, 17.6, 0.5, 0.5)

# ---------------- beds and mix
amb = db(-32) * norm(cabin) + db(-30) * norm(yrs) + db(-36) * norm(nb) + db(-31) * norm(dec) + db(-38) * norm(room)
sfx_total = sfx + amb
# reduce all effects during the family reveal (the brief emotional moment)
sfx_total *= 1 - 0.65 * win(15.9, 17.75, 0.4, 0.4)

v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_TimeMachine_narration_V1.wav'))
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
duck = 1 - 0.55 * np.clip(venv * 3, 0, 1)
mix = voice + db(-3) * sfx_total * (1 - 0.3 * np.clip(venv * 3, 0, 1)) + db(-31) * norm(mus) * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix = limit(mix, -1.6)
nr = int(0.004 * SR)
stepv = (mix[0] - (mix[1] - mix[0])) - mix[-1]
mix[-nr:] += stepv * np.linspace(0, 1, nr) ** 2
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_TimeMachine_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG),
       'voice_lufs_in_mix': round(meter.integrated_loudness(voice * g), 2),
       'family_reveal_effects_lufs': round(meter.integrated_loudness((sfx_total * db(-3) * g)[int(16.0 * SR):int(17.7 * SR)]), 2),
       'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
