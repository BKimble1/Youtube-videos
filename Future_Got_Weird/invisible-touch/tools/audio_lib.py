"""Shared synthesis helpers, copied unchanged from eel-escape/tools/v4/audio_lib.py (Eel Escape V4): filters, loop-seamless
loop-seamless processing, bubbles, wet slips, the poke, stretches, the water rush, pops, strokes, and the gentle voice
compressor and circular true-peak limiter. The caller sets SR, N, DUR and rng (init()) before using them."""
import numpy as np
from scipy.signal import butter, sosfilt, sosfiltfilt, lfilter, resample_poly
from scipy.ndimage import minimum_filter1d, uniform_filter1d
import pyloudnorm as pyln

SR = 48000
N = 0
DUR = 0.0
t = None
rng = None
meter = pyln.Meter(SR)

def init(dur, seed=7):
    global N, DUR, t, rng
    DUR = dur
    N = int(round(dur * SR))
    t = np.arange(N) / SR
    rng = np.random.default_rng(seed)

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

