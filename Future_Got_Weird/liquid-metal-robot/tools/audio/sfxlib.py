#!/usr/bin/env python3
"""Sound library and mixer for Liquid Metal Robot V1 (carried over from the 10-hook preview round, where it made the
winning hook 04 mix). Everything is synthesised here (no samples, no
third-party music), in the manner of the Zombie Ant / Cyborg Cockroach mixes (tools/make_audio.py there).

A hook's script (tools/audio/hNN.py) builds two buffers with these generators and `place()`, then calls `mix()`:
  fx  = effects tied to on-screen events (times from the hook's own animation timeline)
  amb = a quiet bed (ambience / low tone) that runs under the whole clip
`mix()` applies the round's single standard, identical for all ten hooks:
  - the narration master (audio/narration/hNN_narration.wav, voice at -16 LUFS, starting 0.06 s) sample for sample;
  - fx and amb summed into an effects bus normalised to FX_LUFS (default -27 LUFS, about 11 dB under the voice;
    a hook may pass fx_lufs between -30 and -24) and ducked 5 dB under speech with 60 ms / 250 ms smoothing;
  - 10 ms fade-in from the first sample is NOT applied to the voice (it starts at 0.06 s on its own);
  - a 40 ms fade-out at the film's end; a look-ahead limiter at -1.0 dBFS sample peak.
Outputs source/public/audio/<name>.wav (48 kHz, 24-bit, mono, the film's exact duration) and audio/mix/<name>_measure.json."""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 48000
DUR = json.load(open(os.path.join(ROOT, 'source/src/data/words.json')))['duration']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2610)

def buf(): return np.zeros(N)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, min(hi, SR / 2 - 100)], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def env(n, a, r):
    """attack a seconds, release r seconds, sustain 1 between"""
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def tt(n): return np.arange(n) / SR
LOG = []
def place(b, sig, at, gain_db=0.0, name=None):
    """add sig into buffer b starting at time `at` (s) with gain"""
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    m = (idx >= 0) & (idx < N)
    b[idx[m]] += sig[m] * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def win(a, b, fa=0.3, fb=0.3):
    """a 0..1 window over the whole clip: rises over fa before a, falls over fb after b"""
    return np.clip(np.minimum((t - (a - fa)) / max(fa, 1e-3), ((b + fb) - t) / max(fb, 1e-3)), 0, 1)

# ---------------- generators (each returns a peak-normalised mono signal) ----------------
def click(dur=0.06, f=2300, bright=5200):
    """a hard chitin / plastic tick with a little body"""
    n = int(dur * SR); x = tt(n)
    tr = hp(noise(n), 2500) * np.exp(-x / 0.0022)
    body = np.sin(2 * np.pi * f * x) * np.exp(-x / 0.011)
    ring_ = bp(noise(n), bright * 0.8, bright * 1.25) * np.exp(-x / 0.018)
    return norm(0.85 * tr + 0.5 * body + 0.3 * ring_)
def metal_click(dur=0.18, f=3100, partials=(1.0, 2.76, 5.4), decay=0.05):
    """a small metallic latch click: a transient and inharmonic ringing partials"""
    n = int(dur * SR); x = tt(n)
    tr = hp(noise(n), 3000) * np.exp(-x / 0.0015)
    r = sum(np.sin(2 * np.pi * f * p * x + p) * np.exp(-x / (decay / p ** 0.5)) / (1 + i) for i, p in enumerate(partials))
    return norm(tr + 0.6 * r)
def servo(dur=0.4, f0=520, f1=760, buzz=0.3):
    """a tiny motor / pump whine (pitch glides f0->f1)"""
    n = int(dur * SR); x = tt(n); f = np.linspace(f0, f1, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.4 * np.sin(2 * ph) + buzz * np.sign(np.sin(3 * ph)) * 0.3
    return norm(bp(s, 200, 6000) * env(n, 0.03, 0.08))
def bubble(f=900, dur=0.08, rise=0.6):
    """one Minnaert bubble: a decaying sine that glides upward"""
    n = int(dur * SR); x = tt(n)
    ff = f * (1 + rise * x / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-x / (dur * 0.28)))
def bubbles(dur=1.0, rate=14, f_lo=500, f_hi=1800, seed=0):
    """a stream of small bubbles"""
    r = np.random.default_rng(seed); n = int(dur * SR); out = np.zeros(n)
    k = int(dur * rate)
    for i in range(k):
        s = bubble(r.uniform(f_lo, f_hi), r.uniform(0.04, 0.12), r.uniform(0.3, 1.0)) * r.uniform(0.3, 1.0)
        j = int(r.uniform(0, max(1e-3, dur - 0.12)) * SR); m = min(len(s), n - j); out[j:j + m] += s[:m]
    return norm(out) if k else out
def underwater(dur=DUR, depth=1.0):
    """a muffled underwater bed: low rumble and slow pressure swells"""
    n = int(dur * SR); x = tt(n)
    r = lp(noise(n), 220, 4) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.23 * x))
    s = lp(noise(n), 900, 2) * 0.12 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * x + 1))
    return norm(r + s) * depth
def splash(dur=0.6, bright=4000):
    """an entry splash: broadband burst, then a lower bubbly tail"""
    n = int(dur * SR); x = tt(n)
    burst = bp(noise(n), 400, bright) * np.exp(-x / 0.06)
    tail = lp(noise(n), 1200) * np.exp(-x / 0.25) * 0.5
    return norm(burst + tail + 0.5 * bubbles(dur, 24, 400, 1600, 7)[:n])
def squelch(dur=0.35, f0=300, f1=900, q=0.6):
    """wet organic movement: noise through a sweeping resonance"""
    n = int(dur * SR); x = tt(n)
    out = np.zeros(n); seg = 480
    for i in range(0, n, seg):
        u = i / n; fc = f0 + (f1 - f0) * (0.5 - 0.5 * np.cos(np.pi * u))
        out[i:i + seg] = bp(noise(min(seg, n - i) + 2000), fc * (1 - q / 2), fc * (1 + q / 2))[2000:2000 + min(seg, n - i)]
    return norm(out * env(n, dur * 0.2, dur * 0.4))
def creak(dur=0.4, f0=180, f1=120, grain=55):
    """a soft tissue/plant creak: a pulse train through a resonance"""
    n = int(dur * SR); x = tt(n)
    f = f0 + (f1 - f0) * x / dur
    ph = np.cumsum(grain * (1 + 0.3 * np.sin(2 * np.pi * 3 * x)) / SR)
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.5 + 0.5 * rng.random(n))
    res = np.zeros(n); y1 = y2 = 0.0
    for k in range(n):
        w = 2 * np.pi * f[k] / SR; r = 0.995
        y = pulses[k] + 2 * r * np.cos(w) * y1 - r * r * y2; y2, y1 = y1, y; res[k] = y
    return norm(bp(res, 80, 2500)) * env(n, dur * 0.25, dur * 0.4)
def rustle(dur=0.5, lo=1500, hi=7000):
    n = int(dur * SR)
    g = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n)
    return norm(bp(noise(n) * 0.3 + lp(g, 9000) * 2.0, lo, hi)) * env(n, dur * 0.3, dur * 0.5)
def puff(dur=0.18, lo=300, hi=2400):
    n = int(dur * SR); x = tt(n)
    return norm(bp(noise(n), lo, hi) * np.exp(-x / (dur * 0.3)) * env(n, 0.004, dur * 0.6))
def tick(dur=0.03, f=4200):
    n = int(dur * SR); x = tt(n)
    return norm(np.sin(2 * np.pi * f * x) * np.exp(-x / 0.004) + 0.4 * hp(noise(n), 3000) * np.exp(-x / 0.002))
def spray(dur=0.5, pulse_hz=0, lo=1200, hi=9000):
    """a pressurised spray hiss; pulse_hz > 0 chops it into rapid pulses (a buzzing, popping jet)"""
    n = int(dur * SR); x = tt(n)
    s = bp(noise(n), lo, hi)
    if pulse_hz: s *= (0.25 + 0.75 * (np.sin(2 * np.pi * pulse_hz * x) > 0.2))
    return norm(s * env(n, 0.006, dur * 0.5))
def pop(dur=0.08, f=700):
    """a small pressure pop (bubble burst, valve)"""
    n = int(dur * SR); x = tt(n)
    return norm(np.sin(2 * np.pi * f * x * (1 - 0.4 * x / dur)) * np.exp(-x / 0.012) + 0.5 * bp(noise(n), 800, 5000) * np.exp(-x / 0.004))
def thump(dur=0.25, f0=90, f1=45):
    """a low soft body thump"""
    n = int(dur * SR); x = tt(n); f = np.linspace(f0, f1, n)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.07) + 0.15 * lp(noise(n), 400) * np.exp(-x / 0.02))
def heartbeat(gap=0.16, f=55):
    """lub-dub: two thumps, the second shorter and slightly higher"""
    a = thump(0.22, f * 1.6, f); b = thump(0.18, f * 1.9, f * 1.15) * 0.7
    out = np.zeros(int((gap + 0.2) * SR)); out[:len(a)] += a; j = int(gap * SR); out[j:j + len(b)] += b[:len(out) - j]
    return norm(lp(out, 900))
def pump(dur=0.5, f=180):
    """a soft peristaltic/roller pump cycle: a filtered push of air/fluid and a low hum"""
    n = int(dur * SR); x = tt(n)
    push = lp(noise(n), 700) * np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 2
    hum = np.sin(2 * np.pi * f * x) * 0.2
    return norm(push + hum)
def snap(dur=0.35):
    """a very sharp crack with a low pressure thud (for the pistol shrimp's claw)"""
    n = int(dur * SR); x = tt(n)
    crack = hp(noise(n), 1500) * np.exp(-x / 0.0012)
    thud = np.sin(2 * np.pi * np.cumsum(np.linspace(160, 40, n)) / SR) * np.exp(-x / 0.05)
    return norm(1.0 * crack + 0.7 * thud + 0.2 * lp(noise(n), 2000) * np.exp(-x / 0.03))
def collapse(dur=0.3):
    """a cavitation collapse: a short inward rush then a hard tick"""
    n = int(dur * SR); x = tt(n)
    rush = bp(noise(n), 300, 3000) * np.clip(x / (dur * 0.6), 0, 1) ** 3 * (x < dur * 0.6)
    k = int(dur * 0.6 * SR); hit = np.zeros(n); m = n - k
    hit[k:] = (hp(noise(m), 2000) * np.exp(-tt(m) / 0.0015) + np.sin(2 * np.pi * 120 * tt(m)) * np.exp(-tt(m) / 0.04) * 0.6)
    return norm(0.4 * rush + hit)
def sizzle(dur=1.0, density=120, lo=2500, hi=9000):
    """crackling (heated liquid, fizzing reaction): random micro-pops in a band"""
    n = int(dur * SR); out = np.zeros(n)
    k = int(dur * density)
    for i in range(k):
        j = int(rng.uniform(0, dur - 0.01) * SR); m = 240
        out[j:j + m] += bp(noise(m), lo, hi) * np.exp(-np.arange(m) / SR / 0.0012) * rng.uniform(0.2, 1.0)
    return norm(out) * env(n, dur * 0.2, dur * 0.3)
def flow(dur=1.0, lo=200, hi=1400, glug=6):
    """a thick liquid pour / flow with slow gurgles"""
    n = int(dur * SR); x = tt(n)
    base = bp(noise(n), lo, hi) * (0.6 + 0.4 * np.sin(2 * np.pi * glug * x + np.sin(2 * np.pi * 1.3 * x)))
    return norm(base * env(n, dur * 0.2, dur * 0.3))
def hum(dur=1.0, f=120, harm=(1, 2, 3), wobble=0.0):
    """an electrical / machine hum"""
    n = int(dur * SR); x = tt(n)
    s = sum(np.sin(2 * np.pi * f * h * x * (1 + wobble * np.sin(2 * np.pi * 0.5 * x))) / h for h in harm)
    return norm(s * env(n, 0.05, 0.1))
def beep(dur=0.12, f=1000):
    """a soft monitor tone"""
    n = int(dur * SR); x = tt(n)
    return norm(np.sin(2 * np.pi * f * x) * env(n, 0.005, 0.04))
def zap(dur=0.12, f=2000):
    """a tiny electrical stimulation tick-buzz"""
    n = int(dur * SR); x = tt(n)
    return norm((np.sign(np.sin(2 * np.pi * 60 * x)) * 0.3 + hp(noise(n), 2000) * 0.5) * np.exp(-x / 0.03) + 0.4 * np.sin(2 * np.pi * f * x) * np.exp(-x / 0.02))
def step(dur=0.16):
    """a soft footstep / shoe on floor"""
    n = int(dur * SR); x = tt(n)
    return norm(lp(noise(n), 1400) * np.exp(-x / 0.02) + 0.6 * np.sin(2 * np.pi * 80 * x) * np.exp(-x / 0.04))
def chirp_bird(f0=3200, f1=4800, dur=0.12):
    n = int(dur * SR); x = tt(n); f = np.linspace(f0, f1, n)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / dur) ** 2)
def shimmer(dur=1.0, f0=6000, f1=2500):
    """a faint glassy shimmer (light, conversion) without whoosh"""
    n = int(dur * SR); x = tt(n)
    s = sum(np.sin(2 * np.pi * (f0 + (f1 - f0) * x / dur) * k * x + k) for k in (1, 1.5, 2.01)) / 3
    return norm(s * env(n, dur * 0.3, dur * 0.5) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * x)))
def swell(dur=2.0, f=58):
    """a low tonal swell (tension), no whoosh"""
    n = int(dur * SR); x = tt(n)
    s = np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 1.5 * x) + 0.25 * lp(noise(n), 200)
    return norm(s * env(n, dur * 0.6, dur * 0.3))
def pad(freqs=(55, 82.4, 110, 164.8), dur=DUR, detune=0.004, bright=600):
    """a quiet low pad (eerie bed). Slow beating between detuned pairs."""
    n = int(dur * SR); x = tt(n); s = np.zeros(n)
    for i, f in enumerate(freqs):
        for d in (-detune, detune):
            s += np.sin(2 * np.pi * f * (1 + d) * x + i) / (1 + i * 0.6)
    return norm(lp(s, bright))
def room(dur=DUR, lo=150, hi=3000):
    """a quiet room tone (lab, clinic)"""
    n = int(dur * SR)
    return norm(bp(noise(n), lo, hi) * 0.5 + lp(noise(n), 120))
def forest(dur=DUR):
    """soft outdoor air with distant insects"""
    n = int(dur * SR); x = tt(n)
    air = bp(noise(n), 300, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * x))
    ins = bp(noise(n), 5500, 7500) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * x)) * 0.15
    return norm(air + ins)

# ---------------- mix ----------------
def _smooth(e, att, rel):
    out = np.zeros_like(e); y = 0.0
    a = np.exp(-1 / (att * SR)); r = np.exp(-1 / (rel * SR))
    for i in range(len(e)):
        c = a if e[i] > y else r
        y = c * y + (1 - c) * e[i]; out[i] = y
    return out
def limit(x, ceil_db=-1.0, look=0.004, rel=0.06):
    c = db(ceil_db); la = int(look * SR)
    pk = np.abs(x)
    from scipy.ndimage import maximum_filter1d
    pk = maximum_filter1d(pk, size=2 * la + 1)
    g = np.minimum(1.0, c / (pk + 1e-12))
    g = -_smooth(-g, 0.0005, rel)  # instant down, smooth release
    y = x * g
    return np.clip(y, -c, c)

def mix(h, fx, amb, fx_lufs=-27.0, amb_share=0.35, notes=''):
    """the round's standard mix (see module docstring). amb_share: amb level relative to fx in the bus (0..1)."""
    assert -30.0 <= fx_lufs <= -24.0, 'fx_lufs must stay between -30 and -24 LUFS'
    v, sr = sf.read(os.path.join(ROOT, 'audio/narration/FGW_Liquid_Metal_Robot_V1_narration.wav')); assert sr == SR and len(v) == N
    meter = pyln.Meter(SR)
    fx = np.asarray(fx, float); amb = np.asarray(amb, float)
    def lufs(x):
        try: return meter.integrated_loudness(x)
        except Exception: return -70.0
    if np.abs(amb).max() > 0:
        la, lf = lufs(amb), lufs(fx) if np.abs(fx).max() > 0 else -70
        amb = amb * db((lf if lf > -60 else -30) + 20 * np.log10(max(amb_share, 1e-3)) - la) if la > -60 else amb
    bus = fx + amb
    lb = lufs(bus)
    bus = bus * db(fx_lufs - lb)
    # duck under speech
    ve = _smooth((np.abs(v) > db(-38)).astype(float), 0.06, 0.25)
    bus = bus * db(-5.0 * ve)
    out = v + bus
    fo = int(0.04 * SR); out[-fo:] *= np.linspace(1, 0, fo)
    out = limit(out, -1.0)
    os.makedirs(os.path.join(ROOT, 'source/public/audio'), exist_ok=True)
    p = os.path.join(ROOT, f'source/public/audio/{h}.wav')
    sf.write(p, out, SR, subtype='PCM_24')
    meas = {'hook': h, 'file': os.path.relpath(p, ROOT), 'duration_s': len(out) / SR, 'voice_lufs': round(lufs(v), 2),
            'fx_bus_lufs': round(lufs(bus), 2), 'mix_lufs': round(lufs(out), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(out).max() + 1e-12), 2),
            'voice_onset_s': round(float(np.argmax(np.abs(v) > db(-40)) / SR), 3), 'effects': LOG, 'notes': notes}
    os.makedirs(os.path.join(ROOT, 'audio/mix'), exist_ok=True)
    json.dump(meas, open(os.path.join(ROOT, f'audio/mix/{h}_measure.json'), 'w'), indent=1)
    print(json.dumps({k: meas[k] for k in ('hook', 'voice_lufs', 'fx_bus_lufs', 'mix_lufs', 'sample_peak_dbfs', 'voice_onset_s')}))
    return out
