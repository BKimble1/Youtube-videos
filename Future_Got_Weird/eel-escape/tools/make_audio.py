#!/usr/bin/env python3
"""Effects, underwater ambience and mix for the Eel Escape Short ("This Eel Escapes Through the Fish That Ate It").

Everything is synthesised here (no samples, no music bed). The narration master is used sample for sample (gain, a
gentle compressor and a true-peak limiter only). Every effect is placed from the picture's own events and signals
(audio/cues.json, exported from story.ts; it is re-exported at the start of every run so sound and picture share one
timeline). A curious, tactile "tiny jailbreak", never horror: the narration always dominates, the effects sit about
10-14 dB under it and duck under the words (deeper above 2.4 kHz, keyed by the voice's own sibilance, so the hiss of the
effects stays out of the consonants). The one clear accent is the water rush when the head clears (EV.release).

  ambience   a muffled low wash, a soft current and a few faint bubbles, continuous and loop-seamless (filtered as if
             periodic, modulated with whole cycles over the film); under the X-ray it recedes to a darker inner tone
  gill       soft wet flutters that follow the gill cover's motion ('gill'): the opening beat, the breathing, the
             struggle while the head is caught, the startled flutter after the release
  X-ray      a faint airy hush as the radiograph comes in (EV.xray0..xray1), a faint electrical bed while it lasts
  rewind     a quick reversed whoosh (EV.rew0..rew1)
  slide      a muffled squeeze that follows the tail's route speed ('slide'), darker while we look inside
  slit/poke  small wet accents: the slip through the gill slit (EV.slit), into the opercular chamber (EV.chamber),
             the tip poking out into open water (EV.poke)
  curl       a soft rubbery stretch as the curl tightens (EV.curl0..curl1), a faint tension creak into the pull
  release    a short water rush, a soft low pop and a bubble burst (EV.release)
  swim       soft muffled strokes on each tail beat of 'swim' after the release, a faint wake
  lens       the departing tail's close whoosh past the lens (from EV.lens0, peaking on the sweep), decaying across the
             loop point into the opening

Levels: the stereo file about -14 LUFS integrated (the channel's convention: the dual-mono file is measured as stereo,
so the voice stem reads about 3 dB lower measured mono); true peak below -1.5 dBTP (4x oversampled).

usage:  python3 tools/make_audio.py [mix_name] [--spectrogram out.png]       (default mix_v1)
        FGW_NO_VOICE=1 python3 tools/make_audio.py [mix_name]                (default mix_v1_novoice: effects and
                                                    ambience only, unducked, at the gain they have in the voiced mix)
env:    FGW_NO_REGEN=1  use audio/cues.json as it is (otherwise re-exported from story.ts first)"""
import json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, sosfiltfilt, lfilter, resample_poly, spectrogram
from scipy.ndimage import minimum_filter1d, uniform_filter1d

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NARRATION = 'audio/narration/FGW_Eel_Escape_narration_V1.wav'
argv = sys.argv[1:]
SPECTRO = None
if '--spectrogram' in argv:
    k_ = argv.index('--spectrogram'); SPECTRO = argv[k_ + 1]; del argv[k_:k_ + 2]
NO_VOICE = os.environ.get('FGW_NO_VOICE') == '1'
NAME = argv[0] if argv else ('mix_v1_novoice' if NO_VOICE else 'mix_v1')


# ---------------------------------------------------------------- cues (re-exported from story.ts every run)
def export_cues():
    if os.environ.get('FGW_NO_REGEN') == '1':
        return 'kept as it is (FGW_NO_REGEN=1)'
    esb = os.path.join(EP, 'source/node_modules/.bin/esbuild')
    if not os.path.exists(esb):
        return 'kept as it is (esbuild not installed)'
    with tempfile.TemporaryDirectory(prefix='eel_cues_') as td:
        out = os.path.join(td, 'ec.cjs')
        try:
            subprocess.run([esb, 'tools/export_cues.ts', '--bundle', '--platform=node', '--format=cjs', '--loader:.tsx=tsx',
                            '--outfile=' + out, '--log-level=error'], cwd=EP, check=True, capture_output=True, text=True)
            subprocess.run(['node', out, 'audio/cues.json'], cwd=EP, check=True, capture_output=True, text=True,
                           env={**os.environ, 'NODE_PATH': os.path.join(EP, 'source/node_modules')})
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print('WARNING: could not re-export the cues; using audio/cues.json as it is:', getattr(e, 'stderr', e))
            return 'kept as it is (export failed)'
    return 'regenerated from story.ts'


CUES_STATUS = export_cues()
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, EV, T = float(cj['DUR']), cj['EV'], cj['T']
N = int(round(DUR * SR))
t = np.arange(N) / SR
WORDS = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))['words']
rng = np.random.default_rng(2078)


# ---------------------------------------------------------------- helpers
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def _sos(kind, f, o): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_sos('lowpass', f, o), x)
def hp(x, f, o=2): return sosfilt(_sos('highpass', f, o), x)
def bp(x, lo, hi, o=2): return sosfilt(_sos('bandpass', [lo, hi], o), x)
def circ(f, x):
    """filter as if the signal were periodic (the film loops end to start): no seam, no start-up transient"""
    return f(np.concatenate([x, x, x]))[2 * len(x):]
def smooth(x, f, o=2):
    """zero-phase circular smoothing of a full-length control signal"""
    n = len(x)
    return sosfiltfilt(_sos('lowpass', f, o), np.concatenate([x, x, x]))[n:2 * n]
def rmsn(x): return x / (np.sqrt(np.mean(x ** 2)) + 1e-12)
def norm(x): return x / (np.max(np.abs(x)) + 1e-12)
def per(k, ph=0.0): return np.sin(2 * np.pi * k * t / DUR + ph)  # k whole cycles over the film: loop-seamless
def ssn(x, a, b):
    u = np.clip((np.asarray(x, float) - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)
def sig(name):
    a = np.asarray(cj[name], float)
    return np.interp(t, np.arange(len(a)) / 100, a)
def fades(n, a, r):
    e = np.ones(n); na = max(1, min(n, int(a * SR))); nr = max(1, min(n, int(r * SR)))
    e[:na] *= 0.5 - 0.5 * np.cos(np.pi * np.arange(na) / na)
    e[n - nr:] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(nr) / nr)
    return e
def window(a, b, ramp):
    """1 inside [a, b] with raised-cosine ramps of `ramp` seconds outside it"""
    return ssn(t, a - ramp, a) * (1 - ssn(t, b, b + ramp))
def periodic_phase(rate):
    """2*pi*cumsum(rate)/SR, nudged to a whole number of cycles over the film so a modulator loops seamlessly"""
    cyc = np.cumsum(rate) / SR
    k = max(1, round(cyc[-1]))
    return 2 * np.pi * cyc * (k / cyc[-1])
def svf(x, fc, q, out='bp'):
    """time-varying state-variable filter (TPT); 'bp' is unity-gain at the centre"""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    g = np.tan(np.pi * np.clip(fc, 20, 0.45 * SR) / SR); kq = 1.0 / q
    a1 = 1 / (1 + g * (g + kq)); a2 = g * a1; a3 = g * a2
    xs, A1, A2, A3 = x.tolist(), a1.tolist(), a2.tolist(), a3.tolist()
    y = [0.0] * len(xs); s1 = s2 = 0.0; band = out == 'bp'
    for n in range(len(xs)):
        v3 = xs[n] - s2
        v1 = A1[n] * s1 + A2[n] * v3
        v2 = s2 + A2[n] * s1 + A3[n] * v3
        s1 = 2 * v1 - s1; s2 = 2 * v2 - s2
        y[n] = v1 if band else v2
    return np.asarray(y) * (kq if band else 1.0)
def reson(x, f, r=0.98):
    w = 2 * np.pi * np.asarray(f) / SR
    return lfilter([1 - r], [1, -2 * r * np.cos(w), r * r], x)
def impulses(rate, soft=0.001):
    """a stick-slip pulse train (friction grains) at a time-varying rate; each grain a soft 1 ms bump, not a click"""
    ph = np.cumsum(rate) / SR
    hit = np.diff(np.floor(ph), prepend=0.0) > 0
    p = hit * (0.4 + 0.6 * rng.random(len(rate)))
    k = np.hanning(max(3, int(soft * SR)))
    return np.convolve(p, k / k.sum(), 'same')
def local_max(a, lo, hi, rel=0.0, gap=0.12):
    """local maxima (at 100 Hz) of a cue signal between lo and hi seconds, at least rel*max, at least gap apart"""
    i0, i1 = max(1, int(np.ceil(lo * 100))), min(len(a) - 2, int(hi * 100))
    if i1 <= i0: return []
    thr = rel * np.max(a[i0:i1 + 1])
    pk = [i for i in range(i0, i1 + 1) if a[i] > a[i - 1] and a[i] >= a[i + 1] and a[i] >= thr]
    out = []
    for i in pk:
        if out and (i - out[-1]) / 100 < gap:
            if a[i] > a[out[-1]]: out[-1] = i
            continue
        out.append(i)
    return out


# ---------------------------------------------------------------- loudness (BS.1770 K-weighting, mono)
KB1, KA1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
KB2, KA2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
def kms(x, win):
    y = lfilter(KB2, KA2, lfilter(KB1, KA1, x))
    return np.maximum(uniform_filter1d(y * y, max(1, int(win * SR)), mode='constant'), 0.0)
def lmax(x, win=0.4):
    """the loudest momentary (400 ms) or short-term (3 s) loudness of x, LUFS (mono)"""
    pad = np.zeros(int(win * SR) // 2 + 1)
    return round(float(-0.691 + 10 * np.log10(kms(np.concatenate([pad, x, pad]), win).max() + 1e-20)), 1)
meter = pyln.Meter(SR)
def lufs(x):
    try: return round(float(meter.integrated_loudness(x)), 2)
    except Exception: return None


# ---------------------------------------------------------------- buses and the log
# Each effect is set by its own loudness: `lvl` is its loudest momentary (400 ms) loudness in dB relative to the voice
# (VREF, the narration's integrated loudness before the final gain), before it ducks under the words. Buses differ
# only in how they duck: 'tex' the continuous textures, 'dot' the small accents, 'accent' the release, 'lens' the end.
VREF = -16.0
BUS = {k: np.zeros(N) for k in ('amb', 'tex', 'dot', 'accent', 'lens')}
TRIM = {'tex': 1.0, 'dot': 1.0}  # bus trims (dB) on top of each effect's own level
LOG, SNIPS, LAYERS = [], [], []

def place(x, at, name, lvl, cue, bus='dot', tag=None):
    """add x at `at` seconds at `lvl` dB re the voice; anything that runs past the end continues at the start"""
    gain_db = VREF + lvl - lmax(x) + TRIM.get(bus, 0.0)
    i0 = int(round(at * SR)) % N
    y = x * db(gain_db)
    idx = (np.arange(len(y)) + i0) % N
    BUS[bus][idx] += y
    LOG.append({'t': round(at % DUR, 3), 'end': round((at + len(y) / SR) % DUR, 3), 'sfx': name, 'tag': tag or name[:6],
                'level_re_voice_db': round(lvl, 1), 'gain_db': round(gain_db, 1), 'cue': cue, 'bus': bus, 'kind': 'event'})
    SNIPS.append((len(LOG) - 1, bus, i0, y))

def layer(x, name, lvl, bus, spans, cue, tag=None, how='mom'):
    """a continuous, signal-driven texture at `lvl` dB re the voice (its loudest moment, or its integrated loudness
    with how='int'); each active span is logged"""
    lv = lufs(x) if how == 'int' else lmax(x)
    gain_db = VREF + lvl - lv + TRIM.get(bus, 0.0)
    y = x * db(gain_db)
    BUS[bus] += y
    LAYERS.append((name, bus, y))
    for a, b, extra in spans:
        LOG.append({'t': round(a, 3), 'end': round(b, 3), 'sfx': name, 'tag': tag or name[:6], 'level_re_voice_db': round(lvl, 1),
                    'level_measure': 'integrated' if how == 'int' else 'momentary max', 'gain_db': round(gain_db, 1),
                    'cue': cue, 'bus': bus, 'kind': 'texture', **extra})

def spans_of(A, thr, min_len=0.08):
    on = A > thr
    d = np.diff(on.astype(int), prepend=0, append=0)
    s, e = np.where(d == 1)[0], np.where(d == -1)[0]
    return [(a / SR, b / SR, {'peak_env': round(float(A[a:b].max()), 2)}) for a, b in zip(s, e) if (b - a) / SR >= min_len]


# ---------------------------------------------------------------- generators
def bubble(f0, tau=0.022, rise=0.5):
    n = int(tau * 7 * SR); tt = np.arange(n) / SR
    f = f0 * (1 + rise * tt / (tau * 7))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / tau) * (1 - np.exp(-tt / 0.0012))

def reversed_whoosh(dur):
    """a whoosh played backwards: it swells, its band glides up, it is sucked shut at the end"""
    n = int(dur * SR); u = np.arange(n) / n
    e = np.exp((u - 1) / 0.2) * (1 - np.exp(-u / 0.1)) * fades(n, 0.01, 0.012)
    fc = 280 * (2600 / 280) ** (u ** 1.7)
    body = svf(noise(n), fc, 1.4)
    low = lp(noise(n), 380) * 0.35 * (u ** 2)
    chatter = 1 + 0.22 * np.sin(2 * np.pi * np.cumsum(7 + 34 * u ** 2) / SR)  # the rewind's quickening flutter
    rb = np.zeros(n)
    for k in range(8):  # bubbles drawn back in: reversed (their tails swell into a sudden stop)
        b = bubble(rng.uniform(420, 1100), rng.uniform(0.012, 0.022), 0.6)[::-1]
        i = int((0.42 + 0.53 * (k + rng.random()) / 8) * n) - len(b)
        if 0 <= i < n - len(b): rb[i:i + len(b)] += b * (0.25 + 0.75 * (k / 7) ** 1.5)
    return norm(lp(rmsn(body + low) * chatter * e + 0.35 * rb * np.exp((u - 1) / 0.35), 4200))

def squelch(dur=0.17, f0=950, f1=320, q=3.2, lpf=1700):
    """a small wet slip: a resonant band of noise sliding down, with a faint mucous tick at the front"""
    n = int(dur * SR); tt = np.arange(n) / SR
    fc = f0 * (f1 / f0) ** (tt / dur)
    body = svf(noise(n), fc, q) * (1 - np.exp(-tt / 0.012)) * np.exp(-tt / (dur * 0.38))
    tk = bp(noise(n), 1400, 3200) * np.exp(-tt / 0.0016) * 0.5
    return norm(lp(rmsn(body) * fades(n, 0.002, 0.03) + 3 * tk, lpf))

def plup(f0=260, dur=0.16, lpf=1400):
    """a soft low 'plup' as the tail enters an open space"""
    n = int(dur * SR); tt = np.arange(n) / SR
    b = np.zeros(n); bb = bubble(f0, 0.03, 0.45)[:n]; b[:len(bb)] = bb
    puff = lp(noise(n), 500) * np.exp(-tt / 0.025) * 0.4
    return norm(lp(b + puff, lpf) * fades(n, 0.001, 0.04))

def poke_sound(dur=0.34):
    """the tip breaking out into open water: a soft wet 'pff', a bloop and two little bubbles"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.zeros(n)
    pf = bp(noise(n), 220, 1300) * (1 - np.exp(-tt / 0.006)) * np.exp(-tt / 0.035)
    x += 0.7 * rmsn(pf) * 0.25
    for at, f0, a in [(0.012, 430, 1.0), (0.085, 720, 0.38), (0.19, 940, 0.24)]:
        b = bubble(f0, 0.026 if a == 1.0 else 0.016, 0.7); i = int(at * SR)
        m = min(n - i, len(b)); x[i:i + m] += a * b[:m]
    return norm(lp(x, 2600) * fades(n, 0.001, 0.05))

def stretch(dur, g0, g1, res=(190, 470), q=5.0, lpf=1500, fric=0.45):
    """a soft rubbery stretch: slow friction grains through body resonances, rising as it tightens"""
    n = int(dur * SR); u = np.arange(n) / n
    jit = 1 + 0.5 * np.clip(rmsn(lp(noise(n), 40)), -1.6, 1.6)  # irregular grain intervals: a rub, not a buzz
    rate = g0 * (g1 / g0) ** u * jit * (1 + 0.12 * rmsn(lp(noise(n), 5)))
    p = impulses(np.clip(rate, 4, 200))
    y = rmsn(svf(p, res[0] * (1 + 0.1 * u), q) + 0.6 * svf(p, res[1] * (1 + 0.12 * u), q * 0.8))
    f = rmsn(bp(noise(n), 180, 900)) * (0.6 + 0.4 * np.abs(rmsn(lp(noise(n), 10))))
    return lp(y + fric * f, lpf, 4)

def rush_body(dur=0.8):
    """the water rush: turbulent noise sweeping bright to dull, with a swirling grain"""
    n = int(dur * SR); tt = np.arange(n) / SR
    fc = 2100 * (380 / 2100) ** ((tt / dur) ** 0.55)
    body = svf(noise(n), fc, 0.85)
    swirl = 0.55 + 0.45 * norm(np.abs(lp(noise(n), 18)))
    wash = rmsn(lp(noise(n), 420)) * 0.5
    e = (1 - np.exp(-tt / 0.009)) * (0.7 * np.exp(-tt / 0.15) + 0.3 * np.exp(-tt / 0.42)) * fades(n, 0.0, 0.08)
    return norm(lp((rmsn(body) * swirl + wash) * e, 5200))

def soft_pop(dur=0.3, f0=125, f1=46):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** np.clip(tt / 0.2, 0, 1)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-tt / 0.002)) * np.exp(-tt / 0.065)
    return norm(x + 0.25 * lp(noise(n), 300) * np.exp(-tt / 0.02))

def bubble_burst(dur=0.6, count=16):
    n = int(dur * SR); x = np.zeros(n)
    times = np.sort(0.008 + (dur - 0.12) * rng.random(count) ** 1.8)
    for k, at in enumerate(times):
        b = bubble(rng.uniform(380, 1500), rng.uniform(0.010, 0.024), rng.uniform(0.4, 0.9))
        i = int(at * SR); m = min(n - i, len(b))
        x[i:i + m] += b[:m] * (0.35 + 0.65 * rng.random()) * (1 - 0.6 * k / count)
    return norm(lp(x, 4200))

def stroke(dur=0.21, fmid=650, side=1.0):
    """one tail beat pushing water: a soft muffled swish whose band rises and falls"""
    n = int(dur * SR); u = np.arange(n) / n
    fc = (300 + (fmid - 300) * np.sin(np.pi * u)) * (1 + 0.1 * side)
    y = svf(noise(n), fc, 1.1) * np.sin(np.pi * u) ** 1.6
    return norm(lp(y, 1700))


# ---------------------------------------------------------------- picture signals
XR, CUT, TR = sig('xray'), sig('cut'), sig('translucent')
inside = smooth(XR, 2.0)                                            # the radiograph: the water world recedes
look_in = smooth(np.maximum(np.maximum(TR, XR), CUT), 3.0)          # looking inside the fish (reveal, X-ray, cutaway)

# ---------------------------------------------------------------- ambience: muffled wash, soft current, faint bubbles
wash = rmsn(circ(lambda x: lp(hp(x, 28), 230, 4), noise(N)))
wash_in = rmsn(circ(lambda x: lp(hp(x, 28), 120, 4), noise(N)))
cur = rmsn(circ(lambda x: bp(x, 240, 900), noise(N)))
m_wash = 0.82 + 0.18 * per(3, 0.7)
m_cur = (0.55 + 0.45 * (0.5 + 0.5 * per(8, 1.9))) * (0.78 + 0.22 * per(13, 0.4))
bub = np.zeros(N)
bub_t = []
for k in range(int(round(DUR * 0.55))):
    at = rng.random() * DUR
    bub_t.append(round(at, 2))
    for j in range(1 + int(rng.random() < 0.3)):
        b = bubble(rng.uniform(230, 640), rng.uniform(0.014, 0.03), rng.uniform(0.3, 0.8)) * db(rng.uniform(-9, 0))
        idx = (np.arange(len(b)) + int((at + 0.06 * j) * SR)) % N
        bub[idx] += b
bub = circ(lambda x: lp(x, 1700), bub)
amb_out = wash * m_wash + db(-7) * cur * m_cur + 0.55 * bub
amb_in = 0.85 * wash_in * m_wash + db(-20) * cur * m_cur + 0.1 * bub
layer(amb_out * (1 - inside) + amb_in * inside, 'underwater ambience (wash, current, faint bubbles)', -18.0, 'amb',
      [(0.0, DUR, {'note': 'darker inner tone under the X-ray (EV.xray0..cut1)', 'bubbles_at': sorted(bub_t)})],
      'continuous, loop-seamless', 'amb', 'int')

# ---------------------------------------------------------------- gill cover: soft wet flutters following 'gill'
G = np.asarray(cj['gill'], float)
P = int(round(DUR * 100))
Gp = G[:P].copy()
# the opening beat flares before frame 0 (the picture jumps at the loop under the lens wipe): bridge the jump over the
# last quarter second so the flare is heard rising out of the end into the opening
nb = 25
Gp[-nb:] += (G[0] - Gp[-1]) * ssn(np.arange(1, nb + 1) / (nb + 1), 0, 1)
vel = (np.roll(Gp, -1) - np.roll(Gp, 1)) * 50.0
vel = np.convolve(np.concatenate([vel[-2:], vel, vel[:2]]), np.ones(5) / 5, 'valid')
velS = np.interp(t, np.arange(P + 1) / 100, np.concatenate([vel, vel[:1]]))
A_open = np.clip(velS / 3.0, 0, 1.5) ** 1.1
A_close = np.clip(-velS / 3.0, 0, 1.5) ** 1.1
flap = (0.5 + 0.5 * np.sin(periodic_phase(24 + 12 * np.clip(np.abs(velS) / 3.0, 0, 1)))) ** 2.2
g_open = rmsn(circ(lambda x: bp(x, 260, 1500), noise(N)))
g_close = rmsn(circ(lambda x: bp(x, 130, 700), noise(N)))
gtex = (A_open * g_open + 0.8 * A_close * g_close) * (0.35 + 0.65 * flap) * (1 - 0.45 * inside)
gtex = circ(lambda x: lp(x, 1600), gtex)
gspans = []
for nm, A in (('open', A_open), ('close', A_close)):
    a100 = np.interp(np.arange(P) / 100, t, A)
    for i in local_max(np.concatenate([a100, a100[:2]]), 0.0, DUR - 0.01, 0.0, 0.25):
        if a100[i % P] > 0.12:
            gspans.append(((i % P) / 100, (i % P) / 100, {'phase': nm, 'peak_env': round(float(a100[i % P]), 2)}))
gspans.sort(key=lambda s: s[0])
layer(gtex, 'gill cover flutter', -11.0, 'tex', gspans, "signal 'gill' (cover velocity)", 'gill')
# a drop of wet: a tiny low bubble where the cover opens hardest (the opening beat, the struggle, the startle)
ao100 = np.interp(np.arange(P) / 100, t, A_open)
for i in local_max(np.concatenate([ao100, ao100[:2]]), 0.0, DUR - 0.01, 0.0, 0.25):
    if ao100[i % P] > 0.45:
        place(bubble(rng.uniform(260, 420), 0.02, 0.5), (i % P) / 100 + 0.02, 'gill: a wet blip as the cover opens',
              -18 + 3 * min(1.0, float(ao100[i % P])), "signal 'gill' (opening peak)", 'dot', 'blip')

# ---------------------------------------------------------------- the X-ray: a faint airy hush, a faint electrical bed
Xs = smooth(XR, 6.0)
dX = np.gradient(Xs) * SR
rise = np.clip(dX, 0, None); rise /= rise.max() + 1e-12
fall = np.clip(-dX, 0, None); fall /= fall.max() + 1e-12
A_x = 0.9 * rise ** 0.8 + 0.3 * fall ** 0.8
air = rmsn(circ(lambda x: lp(bp(x, 350, 9000), 2000, 1), noise(N)))
shimmer = 1 + 0.15 * np.sin(2 * np.pi * round(50 * DUR) / DUR * t)
hum = rmsn(np.sin(2 * np.pi * round(100 * DUR) / DUR * t) + 0.4 * np.sin(2 * np.pi * round(150 * DUR) / DUR * t))
bed = smooth(XR, 2.0)
layer(A_x * air * shimmer, 'X-ray: a faint airy hush', -10.0, 'tex',
      [(EV['xray0'], EV['xray1'], {'phase': 'in'}), (EV['cut0'], EV['cut1'], {'phase': 'out (fainter)'})],
      'EV.xray0..xray1 (and EV.cut0..cut1)', 'hush')
layer(bed * (0.7 * air * shimmer + 0.5 * hum), 'X-ray: faint electrical bed', -26.0, 'tex', [(EV['xray1'], EV['cut1'], {})],
      "signal 'xray'", 'xbed')

# ---------------------------------------------------------------- the rewind: a quick reversed whoosh
rw_end = EV['rew1'] - 0.02
place(reversed_whoosh(rw_end - EV['rew0']), EV['rew0'], 'rewind: a quick reversed whoosh', -12.0, 'EV.rew0..rew1', 'dot', 'rewind')

# ---------------------------------------------------------------- the slide: a muffled squeeze following 'slide'
V = sig('slide')
a_ = np.maximum(0, V - 1.5)
A_s = (a_ / (a_ + 8.0)) ** 0.8 * (1 - window(EV['rew0'], EV['rew1'], 0.04))  # the rewind is the reversed whoosh's
A_s = np.clip(smooth(A_s, 8.0), 0, None)
stick = circ(lambda x: reson(x, 230, 0.975) + 0.6 * reson(x, 560, 0.97), impulses(np.clip(12 + 2.0 * V, 12, 75)))
fric = rmsn(circ(lambda x: bp(x, 110, 650), noise(N))) * (0.7 + 0.3 * np.clip(rmsn(smooth(noise(N), 3.0)), -2, 2))
sq = (0.55 * fric + 0.45 * rmsn(stick)) * (0.78 + 0.22 * per(round(1.6 * DUR)))
sq = circ(lambda x: lp(x, 650), sq) * look_in + circ(lambda x: lp(x, 1250), sq) * (1 - look_in)
layer(A_s * sq, 'the eel sliding: a muffled squeeze', -9.0, 'tex', spans_of(A_s, 0.08), "signal 'slide'", 'squeeze')

# ---------------------------------------------------------------- the slip through the gill slit, the poke out
place(squelch(0.17, 950, 320), EV['slit'] - 0.04, 'slips through the gill slit (small wet slip)', -10.0, 'EV.slit', 'dot', 'slit')
place(plup(250), EV['chamber'], 'into the opercular chamber (soft plup)', -12.0, 'EV.chamber', 'dot', 'chamber')
place(poke_sound(), EV['poke'] - 0.01, 'the tip pokes out into the water (wet bloop)', -13.5, 'EV.poke', 'dot', 'poke')

# ---------------------------------------------------------------- the curl tightening: a soft stretch; the tug
c0, c1 = EV['curl0'], EV['curl1']
n_ = int((c1 - c0) * SR); u_ = np.arange(n_) / n_
place(stretch(c1 - c0, 14, 42, fric=0.65) * np.sin(np.pi * u_) ** 1.2 * (0.55 + 0.45 * u_) * fades(n_, 0.08, 0.15), c0,
      'the curl tightens (soft rubbery stretch)', -10.5, 'EV.curl0..curl1', 'dot', 'curl')
tg0, tg1 = EV['tug0'], EV['release'] - 0.015
n_ = int((tg1 - tg0) * SR); u_ = np.arange(n_) / n_
place(stretch(tg1 - tg0, 28, 70, (260, 640), 4.0, 1800, 0.35) * u_ ** 1.6 * fades(n_, 0.06, 0.012), tg0,
      'the final pull: tension creak into the release', -13.0, 'EV.tug0..release', 'dot', 'tug')

# ---------------------------------------------------------------- the release: the one clear accent
rel = EV['release']
place(rush_body(0.8), rel - 0.005, 'the head clears: water rush', -6.5, 'EV.release', 'accent', 'RUSH')
place(soft_pop(), rel - 0.01, 'the head pops free (soft low pop)', -11.0, 'EV.release', 'accent', 'pop')
place(bubble_burst(0.6), rel + 0.01, 'bubble burst around the gill', -12.5, 'EV.release', 'accent', 'bubbles')

# ---------------------------------------------------------------- the swim strokes following 'swim'
SW100 = np.convolve(np.asarray(cj['swim'], float), np.ones(3) / 3, 'same')
lens0, end = EV['lens0'], EV['end']
pks = local_max(SW100, EV['clear'], lens0 - 0.2, 0.35, 0.12)
med = float(np.median(SW100[pks])) if pks else 1.0
for k, i in enumerate(pks):
    tp_ = i / 100
    dist = -4.0 * float(ssn(tp_, EV['swim0'], lens0 - 0.6)) + 4.0 * float(ssn(tp_, lens0 - 0.6, lens0))  # away, then back toward the lens
    lvl = -12.0 + 14.0 * np.log10(SW100[i] / med) + dist - 1.5 * (k % 2)
    st = stroke(0.21, 600 + 120 * rng.random(), 1.0 if k % 2 else -1.0)
    place(st, tp_ - 0.4 * 0.21, 'swim stroke' if k else 'first stroke: it straightens and swims', round(float(lvl), 1),
          "signal 'swim' (tail-beat peak)", 'dot', 's')
SWs = np.clip(smooth(sig('swim'), 4.0), 0, None)
wake_env = np.clip(SWs / (med + 1e-9), 0, 1.5) * (1 - window(lens0, end, 0.15)) * ssn(t, EV['release'], EV['release'] + 0.3)
wake = rmsn(circ(lambda x: bp(x, 70, 420), noise(N)))
layer(wake_env * wake, 'swim wake (faint)', -20.0, 'tex', spans_of(wake_env, 0.2), "signal 'swim'", 'wake')

# ---------------------------------------------------------------- the departing tail's close whoosh past the lens
if 'sweep0' in EV:
    # the picture's own events: the tail swings out past the right edge (peak just before EV.sweep0), then sweeps
    # back across the lens, crossing the frame centre about 0.32 s after it
    t_pk, t_sw = EV['sweep0'] + 0.32, EV['sweep0'] - 0.12
else:
    lpk = local_max(SW100, lens0, end - 0.05, 0.3, 0.12)
    t_pk = lpk[-1] / 100 if lpk else end - 0.25          # the sweep past the lens: the last surge of 'swim'
    t_sw = lpk[0] / 100 if len(lpk) > 1 else None        # the swing out past the right edge before it
w_start, w_tail = lens0 - 0.15, 0.45
nw = int((end - w_start + w_tail) * SR)
tw = w_start + np.arange(nw) / SR                    # runs past the end: it decays across the loop into the opening
sw_in = np.interp(np.minimum(tw, end - 1e-3), np.arange(len(SW100)) / 100, SW100)
sw_in = np.clip(sosfiltfilt(_sos('lowpass', 6.0, 2), sw_in), 0, None)
sw_in /= np.interp(t_pk, tw, sw_in) + 1e-9
# the approach (a crescendo from EV.lens0 to the sweep) and the pass (a decay that runs on across the loop), shaded by
# the tail's own speed so the swing-out before the sweep is heard as a first, smaller surge
u_a = np.clip((tw - lens0) / (t_pk - lens0), 0, 1)
bell = np.where(tw < t_pk, u_a ** 2.2, np.exp(-(tw - t_pk) / 0.2))
ew = bell * (0.7 + 0.3 * np.clip(sw_in, 0, 1.6)) * ssn(tw, w_start, lens0 + 0.05) * fades(nw, 0.0, 0.05)
ew /= np.interp(t_pk, tw, ew) + 1e-9
ew = np.clip(ew, 0, 1.2)
fc = np.where(tw < t_pk, 220 + 1100 * ew, 170 + 750 * ew)  # brighter on the approach, duller as it passes
xw = svf(noise(nw), fc, 0.8)
whoom = lp(noise(nw), 120) * ew ** 1.5
close_air = bp(noise(nw), 1100, 3400) * ew ** 3       # only right at the lens: the tail's edge cutting past
flutter = 1 + 0.2 * np.sin(2 * np.pi * 14 * (tw - w_start)) * ew
lens_wh = norm(lp((rmsn(xw) * ew + 0.6 * rmsn(whoom) * ew + 0.35 * rmsn(close_air)) * flutter, 3600))
place(lens_wh, w_start, 'the tail sweeps past the lens: close whoosh into the opening', -10.5,
      f'EV.lens0..end (peak on the sweep at {t_pk:.2f} s' + (f', swing-out {t_sw:.2f} s' if t_sw else '') + ')', 'lens', 'LENS')
LOG[-1]['peak_t'] = round(t_pk, 3)

# ---------------------------------------------------------------- voice: sample for sample, gentle compression only
v, vsr = sf.read(os.path.join(EP, NARRATION))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and len(v) == N, ('the narration must be 48 kHz and exactly the film length', vsr, len(v), N)

def compress(x, thr_db=-20.0, ratio=2.0, att=0.006, rel=0.12):
    """a gentle feed-forward compressor (no look-ahead, no delay: the voice stays sample-aligned)"""
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0; envl = [0.0] * len(x); ax = np.abs(x).tolist()
    for i in range(len(ax)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]; envl[i] = e
    lev = 20 * np.log10(np.asarray(envl) + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), gr

def tp_limit(x, ceil_db, look=0.003, rel=0.08):
    """a true-peak limiter (4x oversampled detector), zero latency (symmetric look-ahead), circular so the loop has no
    seam; returns the limited signal and the gain curve"""
    c = db(ceil_db); pad = 2048
    x4 = resample_poly(np.concatenate([x[-pad:], x, x[:pad]]), 4, 1)[4 * pad:4 * (pad + len(x))]
    need = np.minimum(1.0, c / (np.abs(x4).reshape(-1, 4).max(1) + 1e-12))
    L = int(look * SR)
    g = uniform_filter1d(minimum_filter1d(need, 2 * L + 1, mode='wrap'), L + 1, mode='wrap')
    if g.min() >= 1.0: return x.copy(), np.ones(len(x))
    a = np.exp(-1 / (rel * SR)); gl = g.tolist(); out = [1.0] * len(gl); y = 1.0
    for _ in range(2):  # twice round the loop so the release state carries across the seam
        for i in range(len(gl)):
            y = gl[i] if gl[i] < y else a * y + (1 - a) * gl[i]; out[i] = y
    gg = np.minimum(np.asarray(out), g)
    return x * gg, gg

v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, comp_curve = compress(v0)
vg = VREF - meter.integrated_loudness(vc)
voice = vc * db(vg)
speech = kms(voice, 0.4) > 10 ** ((VREF - 20 + 0.691) / 10)  # where the narration is speaking (momentary within 20 dB of its level)
comp_stats = {'max': round(float(comp_curve.min()), 2), 'p95_while_speaking': round(float(np.percentile(comp_curve[speech], 5)), 2),
              'median_while_speaking': round(float(np.median(comp_curve[speech])), 2)}

# ---------------------------------------------------------------- ducking: under the words, deeper above 2.4 kHz
# keyed by the voice's broadband envelope and, for the top band, by its sibilance (3.2 kHz up); zero-phase and circular,
# so the duck leads each word slightly and wraps round the loop
env_b = smooth(np.abs(voice), 8.0)
env_h = smooth(np.abs(hp(voice, 3200, 4)), 16.0)
k_b = np.clip(env_b / np.percentile(env_b, 90) * 1.4, 0, 1)
k_h = np.clip(env_h / np.percentile(env_h, 97) * 1.3, 0, 1)
# the release lands in the stop gap between "final" and "pull": its top band clears the /p/ burst with a faster duck
env_hf = smooth(np.abs(hp(voice, 2400, 4)), 40.0)
k_hf = np.clip(env_hf / np.percentile(env_hf, 97) * 1.3, 0, 1)
DUCK = {'amb': (0.3, 0.55), 'tex': (0.45, 0.8), 'dot': (0.3, 0.8), 'accent': (0.2, 0.7), 'lens': (0.3, 0.8)}
def ducked(x, bus, idx=None, on=True):
    if not on: return x
    d_b, d_h = DUCK[bus]
    kh_ = k_hf if bus == 'accent' else k_h
    kb = k_b if idx is None else k_b[idx]; kh = kh_ if idx is None else kh_[idx]
    lo = circ(lambda y: lp(y, 2400, 4), x) if idx is None else lp(x, 2400, 4)
    return (lo + (x - lo) * (1 - d_h * kh)) * (1 - d_b * kb)

DC = lambda x: circ(lambda y: hp(y, 25, 2), x)
fx_d = {b: DC(ducked(BUS[b], b)) for b in BUS}
fx_u = {b: DC(BUS[b]) for b in BUS}

def lufs_st(x):  # the dual-mono stereo file, as delivered
    return meter.integrated_loudness(np.stack([x, x], 1))

# ---------------------------------------------------------------- mix: -14 LUFS (the stereo file), true peak <= -1.6 dBTP
CEIL = -1.6
mix_pre = voice + sum(fx_d.values())
g = db(-14.0 - lufs_st(mix_pre))
for _ in range(3):  # converge the gain with the limiter in the loop
    mix, glim = tp_limit(mix_pre * g, CEIL)
    err = -14.0 - lufs_st(mix)
    if abs(err) < 0.02: break
    g *= db(err)
mix, glim = tp_limit(mix_pre * g, CEIL)
if NO_VOICE:  # effects and ambience only, unducked, at the gain they have in the voiced mix
    mix, glim = tp_limit(sum(fx_u.values()) * g, CEIL)
mix2 = np.stack([mix, mix], 1)

# ---------------------------------------------------------------- write
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Eel_Escape_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
voice_out = np.zeros(N) if NO_VOICE else voice * g * glim
fx_out = {b: (fx_u[b] if NO_VOICE else fx_d[b]) * g * glim for b in BUS}
fx_events = sum(fx_out[b] for b in ('tex', 'dot', 'accent', 'lens'))
for nm, x in [('voice', voice_out), ('sfx', fx_events), ('amb', fx_out['amb'])]:
    if NO_VOICE and nm == 'voice': continue
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')

# ---------------------------------------------------------------- measure
tp = 20 * np.log10(np.max(np.abs(resample_poly(np.concatenate([mix[-256:], mix, mix[:256]]), 4, 1))) + 1e-12)
voice_l = None if NO_VOICE else lufs(voice_out)
vmom = None if NO_VOICE else -0.691 + 10 * np.log10(kms(voice_out, 0.4) + 1e-20)
for li, bus, i0, y in SNIPS:  # each event alone, ducked as in the mix, at the final gain
    idx = (np.arange(len(y)) + i0) % N
    ys = ducked(y, bus, idx, not NO_VOICE) * g * glim[idx]
    e = LOG[li]
    e['momentary_max_lufs'] = lmax(ys)
    if voice_l is not None:
        e['under_voice_db'] = round(voice_l - e['momentary_max_lufs'], 1)
        vm = float(np.max(vmom[idx]))
        e['voice_momentary_max_here'] = round(vm, 1) if vm > -50 else None
    w = min(WORDS, key=lambda w_: abs(w_['start'] - e['t']))
    e['nearest_word_onset'] = {'word': w['word'], 't': w['start'], 'dt': round(e['t'] - w['start'], 3)}
for name, bus, y in LAYERS:  # each texture's loudest moment (3 s short-term and 400 ms momentary)
    ys = (y if NO_VOICE else ducked(y, bus)) * g * glim
    for e in LOG:
        if e['sfx'] == name and e['kind'] == 'texture':
            e['layer_short_term_max_lufs'] = lmax(ys, 3.0)
            e['layer_momentary_max_lufs'] = lmax(ys, 0.4)
            e['layer_integrated_lufs'] = lufs(ys)
            if voice_l is not None: e['layer_under_voice_db'] = round(voice_l - e['layer_momentary_max_lufs'], 1)

# the narration placement: the voice stem against the master, sample for sample, overall and word by word
def xlag(a, b, maxlag=None):
    c = np.fft.irfft(np.fft.rfft(a) * np.conj(np.fft.rfft(b)), len(a))
    if maxlag is not None:
        c = np.concatenate([c[:maxlag + 1], np.full(len(c) - 2 * maxlag - 1, -np.inf), c[-maxlag:]])
    k = int(np.argmax(c)); return k if k <= len(a) // 2 else k - len(a)
narr = {'file': NARRATION, 'sr': vsr, 'samples': len(v), 'film_samples': N, 'duration_s': round(len(v) / vsr, 4)}
if not NO_VOICE:
    narr.update({'lag_voice_stem_vs_master_samples': xlag(voice_out, v), 'lag_mix_vs_master_samples': xlag(mix, v),
                 'corr_voice_stem_vs_master': round(float(np.corrcoef(voice_out, v)[0, 1]), 5)})
    wl = {}
    for w in WORDS[::8]:  # every eighth word onset: a 120 ms window, lag searched over +-5 ms
        i0 = int(w['start'] * SR); i1 = min(N, i0 + int(0.12 * SR))
        wl[f"{w['word']}@{w['start']}"] = xlag(np.pad(mix[i0:i1], 512), np.pad(v[i0:i1], 512), 240)
    narr['word_onset_lags_mix_vs_master_samples'] = wl
    narr['sample_exact'] = (narr['lag_voice_stem_vs_master_samples'] == 0 and narr['lag_mix_vs_master_samples'] == 0
                            and len(v) == N and all(x == 0 for x in wl.values()))
    # the narration dominates: the loudest the effects and ambience get relative to the voice while it speaks
    fmom = -0.691 + 10 * np.log10(kms(fx_events + fx_out['amb'], 0.4) + 1e-20)
    clear = vmom > voice_l - 10  # clear speech (momentary within 10 dB of the voice's level); pause edges excluded
    dd = (fmom - vmom)[clear]
    narr['fx_minus_voice_momentary_during_clear_speech_db'] = {'max': round(float(dd.max()), 1), 'median': round(float(np.median(dd)), 1),
                                                               'at_s': round(float(np.where(clear)[0][np.argmax(dd)] / SR), 2)}
    # stricter: inside the words only (200 ms windows), and the consonants' top band (3 kHz up) against the effects'
    inw = np.zeros(N, bool)
    for w in WORDS:
        inw[int((w['start'] + 0.03) * SR):int((w['end'] - 0.03) * SR)] = True
    l200 = lambda x: -0.691 + 10 * np.log10(kms(x, 0.2) + 1e-20)
    dw = (l200(fx_events + fx_out['amb']) - l200(voice_out))[inw]
    iw = np.where(inw)[0][np.argmax(dw)] / SR
    ww = min(WORDS, key=lambda w_: 0 if w_['start'] <= iw <= w_['end'] else min(abs(w_['start'] - iw), abs(w_['end'] - iw)))
    narr['fx_minus_voice_200ms_inside_words_db'] = {'max': round(float(dw.max()), 1), 'median': round(float(np.median(dw)), 1),
                                                    'at_s': round(float(iw), 2), 'word': ww['word']}
    hf = lambda x: uniform_filter1d(hp(x, 3000, 4) ** 2, int(0.02 * SR))
    vh_, fh_ = hf(voice_out), hf(fx_events + fx_out['amb'])
    cons = vh_ > np.percentile(vh_, 90)  # the consonants (sibilants, plosive bursts): the voice's loudest top-band moments
    narr['voice_over_fx_above_3khz_at_consonants_db'] = {'median': round(float(np.median(10 * np.log10((vh_[cons] + 1e-20) / (fh_[cons] + 1e-20)))), 1),
                                                         'p5': round(float(np.percentile(10 * np.log10((vh_[cons] + 1e-20) / (fh_[cons] + 1e-20)), 5)), 1)}

dmix = np.abs(np.diff(mix))
rms_db = lambda x: round(float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)), 2)
fxa = fx_events + fx_out['amb']
seam = {'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 6),
        'median_sample_step_last_0p5s': round(float(np.median(dmix[-SR // 2:])), 6),
        'p99_sample_step_whole': round(float(np.percentile(dmix, 99)), 6),
        'mix_rms_db_last_50ms_first_50ms': [rms_db(mix[-SR // 20:]), rms_db(mix[:SR // 20])],
        'fx_and_amb_rms_db_last_50ms_first_50ms': [rms_db(fxa[-SR // 20:]), rms_db(fxa[:SR // 20])],
        'mix_seam_step_percentile_of_steps_near_seam': round(float(np.mean(np.concatenate([dmix[-SR // 2:], dmix[:SR // 2]]) < abs(mix[0] - mix[-1])) * 100), 1),
        'ambience_seam_jump': round(float(abs(fx_out['amb'][0] - fx_out['amb'][-1])), 6),
        'ambience_seam_step_percentile': round(float(np.mean(np.abs(np.diff(fx_out['amb'])) < abs(fx_out['amb'][0] - fx_out['amb'][-1])) * 100), 1),
        'ambience_median_step': round(float(np.median(np.abs(np.diff(fx_out['amb'])))), 6),
        'note': f'the narration begins at frame 0 ("That", first sample above 1 percent at {np.argmax(np.abs(v) > 0.01) / SR:.3f} s), '
                'so the mix level rises there by design; the beds and effects are continuous across the seam'}

ev_lufs = lufs(fx_events)
res = {'name': NAME, 'no_voice': NO_VOICE, 'cues': CUES_STATUS, 'duration_s': DUR, 'sr': SR, 'samples': N,
       'integrated_lufs': round(float(meter.integrated_loudness(mix2)), 2),
       'integrated_lufs_mono_measure': lufs(mix),
       'true_peak_dbtp_4x': round(float(tp), 2), 'sample_peak_dbfs': round(float(20 * np.log10(np.max(np.abs(mix)))), 2),
       'limiter_max_gain_reduction_db': round(float(20 * np.log10(glim.min())), 2),
       'voice_lufs_in_mix': voice_l, 'voice_lufs_in_mix_stereo_equiv': None if voice_l is None else round(voice_l + 3.01, 2),
       'voice_compressor_gain_reduction_db': None if NO_VOICE else comp_stats,
       'effects_lufs_in_mix': ev_lufs, 'ambience_lufs_in_mix': lufs(fx_out['amb']),
       'effects_under_voice_db': None if voice_l is None or ev_lufs is None else round(voice_l - ev_lufs, 2),
       'effects_and_ambience_short_term_max_lufs': lmax(fxa, 3.0),
       'voice_short_term_max_lufs': None if NO_VOICE else lmax(voice_out, 3.0),
       'events_logged': len(LOG), 'narration': narr, 'loop': seam,
       'EV_used': {k: round(v_, 3) for k, v_ in EV.items()}, 'lens_sweep_peak_s': round(t_pk, 3)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
LOG.sort(key=lambda e: (e['t'], e['sfx']))
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
for e in LOG:
    if e['sfx'] != 'gill cover flutter':
        lv = e.get('momentary_max_lufs', e.get('layer_momentary_max_lufs'))
        uv = e.get('under_voice_db', e.get('layer_under_voice_db'))
        print(f"{e['t']:7.3f}-{e['end']:7.3f}  {e['sfx'][:60]:60s} set {e['level_re_voice_db']:6.1f}  in mix {lv} LUFS ({uv} under voice)  [{e['cue']}]")
print(f"gill cover flutter: {sum(1 for e in LOG if e['sfx'] == 'gill cover flutter')} flutters")
print(json.dumps({k: v_ for k, v_ in res.items() if k not in ('EV_used',)}, indent=1))

# ---------------------------------------------------------------- QA: a spectrogram with the words and effects marked
def spectro_png(path):
    from PIL import Image, ImageDraw, ImageFont
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
    except OSError:
        font = ImageFont.load_default()
    anchors = np.array([[0, 0, 4], [28, 16, 68], [80, 18, 123], [150, 40, 120], [214, 70, 90], [246, 130, 60],
                        [252, 200, 110], [252, 253, 191]], float)
    lut = np.stack([np.interp(np.linspace(0, 1, 256), np.linspace(0, 1, len(anchors)), anchors[:, c]) for c in range(3)], 1).astype(np.uint8)
    ROWS = 220; fr = np.geomspace(40, 16000, ROWS)[::-1]
    def spec(x, hop):
        f, tt, S = spectrogram(x, fs=SR, window='hann', nperseg=2048, noverlap=2048 - hop, mode='magnitude')
        i = np.clip(np.searchsorted(f, fr) - 1, 0, len(f) - 2); w = ((fr - f[i]) / (f[i + 1] - f[i]))[:, None]
        return 20 * np.log10(S[i] * (1 - w) + S[i + 1] * w + 1e-10)
    mono_mix = mix; mono_fx = fx_events + fx_out['amb']
    ref = np.percentile(spec(mono_mix, 480), 99.7)
    def img(Sdb):
        z = np.clip((Sdb - (ref - 80)) / 80, 0, 1)
        return Image.fromarray(lut[(z * 255).astype(int)])
    ev = [e for e in LOG if e['kind'] == 'event']
    def strip(x0, x1, pps, offset=0.0):
        """one time row: word lane, mix panel, effects panel, effect lane"""
        LM, WL, EL = 46, 52, 72
        width = LM + int((x1 - x0) * pps) + 10
        H = WL + ROWS + 6 + ROWS + EL
        im = Image.new('RGB', (width, H), (14, 16, 22)); d = ImageDraw.Draw(im)
        hop = int(SR / pps)
        def cut_(x):
            if x0 >= 0: return x[int(x0 * SR):int(x1 * SR)]
            return np.concatenate([x[int((DUR + x0) * SR):], x[:int(x1 * SR)]])
        for k, src in enumerate((mono_mix, mono_fx)):
            Sx = spec(np.concatenate([np.zeros(1024), cut_(src), np.zeros(1024)]), hop)
            pi = img(Sx).resize((int((x1 - x0) * pps), ROWS))
            y0 = WL + k * (ROWS + 6); im.paste(pi, (LM, y0))
            d.text((2, y0 + 2), 'mix' if k == 0 else 'fx+amb', fill=(230, 230, 230), font=font)
            for fq in (100, 1000, 10000):
                yy = y0 + int(np.interp(np.log(fq), np.log(fr[::-1]), np.arange(ROWS)[::-1]))
                d.line([(LM - 4, yy), (LM, yy)], fill=(200, 200, 200)); d.text((4, yy - 6), f'{fq // 1000}k' if fq >= 1000 else str(fq), fill=(170, 170, 170), font=font)
        X = lambda tt: LM + int((tt - x0) * pps)
        def tmap(tt):  # map film time into this row's axis (the seam row wraps)
            if x0 < 0 and tt > DUR + x0: return tt - DUR
            return tt
        for s in np.arange(np.ceil(x0), x1 + 1e-6, 1.0 if pps < 200 else 0.25):
            d.line([(X(s), WL + 2 * ROWS + 6), (X(s), WL + 2 * ROWS + 12)], fill=(150, 150, 150))
            d.text((X(s) + 2, WL + 2 * ROWS + 8), f'{s % DUR:.2f}'.rstrip('0').rstrip('.'), fill=(140, 140, 140), font=font)
        lanes = [-1e9] * 3
        for w in WORDS:
            ws = tmap(w['start'])
            if not (x0 <= ws <= x1): continue
            d.line([(X(ws), WL - 6), (X(ws), WL + 2 * ROWS + 6)], fill=(110, 200, 255))
            lane = next((j for j in range(3) if lanes[j] < X(ws)), 2)
            d.text((X(ws) + 2, 2 + 16 * lane), w['word'], fill=(160, 220, 255), font=font)
            lanes[lane] = X(ws) + d.textlength(w['word'], font=font) + 4
        yb = WL + ROWS + 6
        tex = [e for e in LOG if e['kind'] == 'texture' and e['tag'] not in ('amb',)]
        for e in tex:  # texture spans: bars along the top of the effects panel (gill flutters as ticks)
            a, b = tmap(e['t']), tmap(e['end'])
            row = {'gill': 0, 'squeeze': 1, 'hush': 2, 'xbed': 2, 'wake': 1}.get(e['tag'], 3)
            yy = yb + 3 + 7 * row
            if e['tag'] == 'gill':
                if x0 <= a <= x1: d.line([(X(a), yy - 2), (X(a), yy + 3)], fill=(140, 255, 160), width=2)
                continue
            a, b = max(a, x0), min(b if b >= a else x1, x1)
            if b > a:
                d.line([(X(a), yy), (X(b), yy)], fill=(140, 255, 160), width=3)
                d.text((X(a) + 2, yy - 1), e['tag'], fill=(190, 255, 200), font=font)
        el = [-1e9] * 4
        for e in ev:
            es = tmap(e['t'])
            if not (x0 <= es <= x1): continue
            d.line([(X(es), yb + 30), (X(es), yb + ROWS)], fill=(255, 150, 60))
            lab = e['tag']
            lane = next((j for j in range(4) if el[j] < X(es)), 3)
            d.text((X(es) + 2, WL + 2 * ROWS + 20 + 13 * lane), lab, fill=(255, 190, 120), font=font)
            el[lane] = X(es) + d.textlength(lab, font=font) + 4
        if x0 < 0:
            d.line([(X(0), WL), (X(0), WL + 2 * ROWS + 6)], fill=(255, 255, 255), width=2)
            d.text((X(0) + 3, WL + 2 * ROWS - 10), 'LOOP SEAM', fill=(255, 255, 255), font=font)
        return im
    half = DUR / 2
    parts = [strip(0, half, 100), strip(half, DUR, 100), strip(-1.2, 0.8, 400)]
    W_ = max(p.width for p in parts); H_ = sum(p.height for p in parts) + 8 * len(parts)
    out = Image.new('RGB', (W_, H_), (14, 16, 22)); y = 0
    for p in parts:
        out.paste(p, (0, y)); y += p.height + 8
    out.save(path)
    print('spectrogram ->', path)


if SPECTRO:
    spectro_png(SPECTRO)
