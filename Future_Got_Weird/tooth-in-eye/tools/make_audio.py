#!/usr/bin/env python3
"""Effects and mix for FGW "Tooth in Eye" V4 (the version follows the mix name: mix_v4 -> V4; V1 at commit 73ce4c9d). Everything is synthesised (no samples, no third-party music).
The narration master (audio/narration/FGW_Tooth_Eye_narration_<V>.wav) is used sample for sample (gain only).
Under it: an uninterrupted room/body ambience and a quiet low pad that opens into a warm chord when his sight returns,
plus restrained effects placed from the picture's own events (audio/cues.json, exported from story.ts):
a distinctive unsettling tone on the opening reveal, the piezo saw, the bone giving way, a subdued dental drill on the
hole, a small mechanical click as the optical cylinder seats, soft tissue sounds, a faint shimmer for light.
No whooshes on camera moves, no stingers, no cartoon sounds.
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak about -1.5 dBTP (measured 4x).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v4)
Outputs: source/public/audio/<mix>.wav, audio/mix/FGW_Tooth_Eye_<V>_mix.wav, audio/mix/mix_measure_<v>.json, audio/sfx_log_<v>.json"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v4'
VER = NAME.split('_')[-1].upper()
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, TM, EV = cj['DUR'], cj['TM'], cj['EV']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2207)
LOG = []

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2; e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def place(buf, sig, at, name=None, gain_db=0.0):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    m = (idx >= 0) & (idx < N)
    buf[idx[m]] += sig[m] * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def win(a, b, fa=0.3, fb=0.3): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)

# ---------------- effect generators ----------------
def click(dur=0.09, f=2300, bright=5200):
    """V2: the jaws biting into the vein: a hard chitin snap, a short fibrous crunch as the teeth sink in, and a
    small low body thump (felt more than heard), so the contact lands without being loud"""
    n = int(dur * SR); tt = np.arange(n) / SR
    tr = hp(noise(n), 2500) * np.exp(-tt / 0.0022)
    body = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.011) + 0.5 * np.sin(2 * np.pi * f * 1.73 * tt) * np.exp(-tt / 0.006)
    ring_ = bp(noise(n), bright * 0.8, bright * 1.25) * np.exp(-tt / 0.018)
    # the crunch: a few dense micro-cracks in the first 40 ms
    cr = np.zeros(n)
    for k in range(9):
        i = int((0.004 + 0.035 * rng.random()) * SR)
        m = min(n - i, 220)
        cr[i:i + m] += bp(noise(m), 1800, 6500) * np.exp(-np.arange(m) / SR / 0.0015) * (0.4 + 0.6 * rng.random())
    thump = np.sin(2 * np.pi * (150 - 60 * tt / dur) * tt) * np.exp(-tt / 0.03)
    return norm(0.85 * tr + 0.5 * body + 0.3 * ring_ + 0.6 * cr + 0.55 * thump)
def creak(dur=0.4, f0=180, f1=120, grain=55):
    """a soft plant-tissue creak: a pulse train through a resonance"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 + (f1 - f0) * tt / dur
    ph = np.cumsum(grain * (1 + 0.3 * np.sin(2 * np.pi * 3 * tt)) / SR)
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.5 + 0.5 * rng.random(n))
    res = np.zeros(n)
    y1 = y2 = 0.0
    for k in range(n):
        w = 2 * np.pi * f[k] / SR; r = 0.995
        y = pulses[k] + 2 * r * np.cos(w) * y1 - r * r * y2
        y2, y1 = y1, y
        res[k] = y
    return norm(bp(res, 80, 2500)) * env(n, dur * 0.25, dur * 0.4)
def rustle(dur=0.5, lo=1500, hi=7000):
    n = int(dur * SR)
    g = (rng.random(n) < 0.012).astype(float) * rng.standard_normal(n)
    x = bp(noise(n) * 0.3 + lp(g, 9000) * 2.0, lo, hi)
    return norm(x) * env(n, dur * 0.3, dur * 0.5)
def puff(dur=0.18, lo=300, hi=2400):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), lo, hi) * np.exp(-tt / (dur * 0.3)) * env(n, 0.004, dur * 0.6))
def tick(dur=0.03, f=4200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 3000) * np.exp(-tt / 0.0015) + 0.4 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def growth(dur=1.0, f0=90, f1=260):
    """fungal growth in time-lapse: a slow wet stretching creak with tiny crackles, rising"""
    n = int(dur * SR); tt = np.arange(n) / SR
    base = creak(dur, f0, f1, grain=38)
    crack = np.zeros(n)
    for _ in range(int(dur * 40)):
        i = rng.integers(0, n - 400)
        crack[i:i + 400] += tick(400 / SR, 3000 + 2500 * rng.random())[:400] * (0.3 + 0.7 * rng.random())
    wet = bp(noise(n), 400, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.3 * tt)) * 0.25
    return norm(0.8 * base + 0.25 * crack + wet) * env(n, dur * 0.3, dur * 0.25)
def shimmer(dur=1.0, f0=6000, f1=2500):
    """the microscopic world: a faint airy descending shimmer (not a whoosh)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(5):
        f = f0 * (f1 / f0) ** (tt / dur) * (1 + 0.013 * k)
        x += np.sin(2 * np.pi * np.cumsum(f) / SR + k) * (0.5 + 0.5 * np.sin(2 * np.pi * (2 + k) * tt))
    return norm(x) * env(n, dur * 0.35, dur * 0.45)
def step():
    n = int(0.018 * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), 2500, 9000) * np.exp(-tt / 0.002))

def crackle(dur=0.5, density=60, lo=2500, hi=9000):
    """tiny dry crackles (the cuticle giving way, fungal tissue pushing through)"""
    n = int(dur * SR); x = np.zeros(n)
    for _ in range(int(dur * density)):
        i = rng.integers(0, max(1, n - 300))
        x[i:i + 300] += tick(300 / SR, 2500 + 4000 * rng.random())[:300] * (0.2 + 0.8 * rng.random())
    return norm(bp(x, lo, hi) + 1e-9) * env(n, dur * 0.2, dur * 0.3)
def creep(dur=2.0):
    """the network spreading inside the body: a slow, low, wet organic texture"""
    n = int(dur * SR); tt = np.arange(n) / SR
    base = bp(noise(n), 120, 700) * (0.55 + 0.45 * np.sin(2 * np.pi * 1.7 * tt + 1) * np.sin(2 * np.pi * 0.6 * tt))
    gl = creak(dur, 70, 140, grain=22) * 0.6
    return norm(base + gl) * env(n, dur * 0.3, dur * 0.3)
def spasm():
    """a muscle jerking under the fungus's control: a short low thump and a leg scrape"""
    n = int(0.16 * SR); tt = np.arange(n) / SR
    th = np.sin(2 * np.pi * (95 - 40 * tt / 0.16) * tt) * np.exp(-tt / 0.04)
    sc = bp(noise(n), 1800, 6000) * np.exp(-tt / 0.03) * 0.4
    return norm(th + sc)
def pop(dur=0.12, f=600):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * (1 - 0.5 * tt / dur) * tt) * np.exp(-tt / 0.025) + 0.4 * bp(noise(n), 800, 3000) * np.exp(-tt / 0.01))

def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]

# ---------------- new effect generators ----------------
def swell(dur=2.0, f=58):
    """a low organic swell under the growth (felt, not a tone)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt + 0.8 * np.sin(2 * np.pi * 0.7 * tt)) + 0.5 * np.sin(2 * np.pi * f * 1.5 * tt)
    return norm(lp(x * (1 + 0.3 * bp(noise(n), 2, 8)), 220)) * env(n, dur * 0.45, dur * 0.4)

def uncanny(dur=1.3):
    """the opening: a glassy, slightly detuned high tone that bends down, over a beating sub, with a wet tissue creak
    as the graft turns see-through. Distinctive, quiet, not a stinger."""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = 1318 * (1 - 0.035 * (1 - np.exp(-tt / 0.35)))
    glass = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.6 * np.sin(2 * np.pi * np.cumsum(f * 1.0059) / SR) + 0.25 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
    glass *= (0.55 + 0.45 * np.sin(2 * np.pi * 5.2 * tt)) * np.exp(-tt / 0.75) * np.clip(tt / 0.03, 0, 1)
    sub = (np.sin(2 * np.pi * 55 * tt) + np.sin(2 * np.pi * 58.4 * tt)) * np.exp(-tt / 0.9) * np.clip(tt / 0.06, 0, 1)
    wet = creak(min(0.5, dur), 140, 230, grain=34)
    wet = np.concatenate([wet, np.zeros(n - len(wet))])
    return norm(0.42 * glass + 0.5 * lp(sub, 200) + 0.55 * wet)
def ting(dur=0.5, f=2640):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm((np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.05)) * np.exp(-tt / 0.16) * np.clip(tt / 0.002, 0, 1))
def chime(dur=1.6, freqs=(659.3, 987.8, 1318.5)):
    """warm soft light: sine partials with a slow attack"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * tt + k) * (0.8 ** k) for k, f in enumerate(freqs))
    return norm(x * env(n, 0.12, dur * 0.7))
def piezo(dur=0.8, f=2900, am=60):
    """a piezo bone saw: a thin buzzing whine, amplitude-modulated, with a gritty cut"""
    n = int(dur * SR); tt = np.arange(n) / SR
    tone = np.sign(np.sin(2 * np.pi * f * tt)) * 0.3 + np.sin(2 * np.pi * f * tt)
    grit = bp(noise(n), 3000, 9000) * (0.5 + 0.5 * np.sin(2 * np.pi * am * tt))
    return norm(bp(tone, 1500, 7000) * (0.7 + 0.3 * np.sin(2 * np.pi * am * tt)) + 0.5 * grit) * env(n, 0.04, 0.08)
def drill(dur=0.65):
    """a dental handpiece: a high whine that drops slightly as it bites, with a fine grinding underneath"""
    n = int(dur * SR); tt = np.arange(n) / SR
    bite = np.clip((tt - 0.06) / 0.05, 0, 1) * np.clip((dur - 0.05 - tt) / 0.05, 0, 1)
    f = 5200 - 700 * bite
    ph = 2 * np.pi * np.cumsum(f) / SR
    whine = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    grind = bp(noise(n), 1800, 6000) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * tt)) * bite
    return norm(0.8 * whine + 0.7 * grind) * env(n, 0.03, 0.07)
def snap(dur=0.08):
    """the cylinder seating: a small, crisp mechanical click (plastic in dentin), with a tiny resonance"""
    n = int(dur * SR); tt = np.arange(n) / SR
    tr = hp(noise(n), 3000) * np.exp(-tt / 0.0012)
    body = np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt / 0.006) + 0.5 * np.sin(2 * np.pi * 1850 * tt) * np.exp(-tt / 0.009)
    return norm(tr + 0.6 * body)
def crack(dur=0.3):
    """bone giving way under the elevator: a short dry crackle and a low knock"""
    n = int(dur * SR); tt = np.arange(n) / SR
    knock = np.sin(2 * np.pi * (180 - 80 * tt / dur) * tt) * np.exp(-tt / 0.03)
    return norm(0.8 * crackle(dur, 120, 1500, 7000) + 0.7 * knock)
def wetslide(dur=0.5):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(bp(noise(n), 300, 1600) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) * env(n, dur * 0.3, dur * 0.4) + 0.3 * creak(dur, 110, 160, 26))
def glide(dur=0.6, f0=420, f1=180):
    """a soft downward tone for the rewind (time running back), very quiet"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, dur * 0.3, dur * 0.5))
def tick2(dur=0.04, f=2200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 1500) * np.exp(-tt / 0.003) + 0.5 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.01))

sfx = np.zeros(N)
E = EV.get
# the hook: the finished reconstruction, light already passing to the retina
place(sfx, uncanny(1.3), 0.0, 'opening: glassy detuned tone + wet creak under the reveal', -19)
place(sfx, wetslide(0.5), E('dissolve'), 'the graft opens over the plate (soft wet slide)', -38)
place(sfx, shimmer(0.9, 6500, 2600), E('raysIn'), 'light through the cylinder', -36)
place(sfx, chime(1.4), E('retinaLit1') - 0.05, 'retina lit (warm soft chime)', -33)
place(sfx, chime(1.2, (587.3, 880.0, 1174.7)), E('glimpse'), 'his first glimpse of the room on SEE (warm chime)', -34)
# the damaged cornea: penlight, white glare; a donor cornea, a red reflex, then it clouds
place(sfx, tick2(0.03, 2600), E('penOn'), 'penlight click', -33)
place(sfx, wetslide(0.35), E('donorIn'), 'donor cornea laid on', -32)
place(sfx, chime(0.7, (440.0, 659.3)), E('reflex'), 'light gets through (brief warm tone)', -37)
place(sfx, swell(0.9, 50), E('cloud'), 'the graft clouds over (low dull swell)', -30)
# the tooth
place(sfx, wetslide(0.4), E('retract'), 'cheek retractors', -36)
place(sfx, piezo(E('saw1e') - E('saw1'), 2900, 55), E('saw1'), 'piezo saw round the root', -30)
place(sfx, crack(0.3), E('elevator'), 'bone gives way under the elevator', -27)
place(sfx, wetslide(0.35), E('lift'), 'the block lifts out', -31)
place(sfx, piezo(E('saw2e') - E('saw2'), 3400, 70), E('saw2'), 'trimming saw: crown off, plate shaped', -31)
place(sfx, tick2(0.04, 1900), E('offcut'), 'offcut drops on the drape', -34)
place(sfx, drill(E('drille') - E('drill')), E('drill'), 'dental drill through the dentin (subdued)', -28)
place(sfx, snap(0.08), E('click') - 0.004, 'the optical cylinder seats (click)', -18)
# under the skin of the other eye
place(sfx, wetslide(0.3), E('incision'), 'incision', -36)
place(sfx, wetslide(0.5), E('tuck'), 'slid beneath the skin', -31)
for k in range(3):
    place(sfx, tick2(0.03, 1500), E('suture') + k * 0.09, 'sutures' if k == 0 else None, -38)
place(sfx, creep(E('growB') - E('growA')), E('growA'), 'tissue growing round the implant (organic, quiet)', -31)
place(sfx, wetslide(0.4), E('lift2'), 'out of the pocket', -32)
# into the front of the damaged eye
place(sfx, wetslide(0.3), E('flap'), 'graft lifted', -34)
place(sfx, crackle(0.25, 60, 3000, 8000), E('trephine'), 'corneal disc removed', -35)
place(sfx, tick2(0.04, 1300), E('seat'), 'implant seated', -30)
place(sfx, wetslide(0.3), E('flapBack'), 'graft laid back over it', -34)
place(sfx, shimmer(1.2, 6500, 2600), E('raysIn2'), 'light through the cylinder to the retina', -34)
place(sfx, chime(1.8, (587.3, 880.0, 1174.7)), E('retinaLit2') - 0.05, 'retina lit (warm chime)', -30)

# ---------------- beds ----------------
room = circ(lambda x: lp(hp(x, 90), 1400), noise(N)) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.09 * t + 1))
hum = (np.sin(2 * np.pi * 120 * t) * 0.15 + np.sin(2 * np.pi * 240 * t) * 0.05)
air = circ(lambda x: bp(x, 2500, 7000), noise(N)) * 0.5
def win2(a, b, fa, fb): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
# his blind view: everything muffled; then the room opens up (brighter air, gentle outdoor birds through the window)
dark = win2(E('povDark'), E('povClear') - 0.2, 0.25, 0.6)
open_ = np.clip((t - (E('povClear') - 0.3)) / 1.2, 0, 1)
# the hook's brief glimpse of his room (3.34-4.36): the same brighter air, for one second
open_ = np.maximum(open_, win2(E('glimpse') + 0.15, E('glimpseEnd') - 0.1, 0.25, 0.1))
room_dark = circ(lambda x: lp(x, 300), room)
beep = np.zeros(N)
for k in range(int(DUR / 0.92) + 1):
    t0 = 0.31 + k * 0.92
    n = int(0.09 * SR); tt = np.arange(n) / SR
    place(beep, np.sin(2 * np.pi * 1046.5 * tt) * env(n, 0.005, 0.05), t0)
beep_dark = circ(lambda x: lp(x, 400), beep)
amb = 0.55 * norm(room) * (1 - dark) + 0.55 * norm(room_dark) * dark + 0.05 * norm(hum) + 0.10 * norm(air) * (0.4 + 0.9 * open_) \
    + 0.035 * (norm(beep) * (1 - dark) + norm(beep_dark + 1e-9) * dark * 0.6)
birds = np.zeros(N)
for k in range(6):
    t0 = E('povClear') + 0.25 + k * 0.38 + 0.12 * rng.random()
    if t0 > DUR - 0.2: break
    d = 0.12; n = int(d * SR); tt = np.arange(n) / SR
    f = 3800 + 900 * rng.random()
    s = np.sin(2 * np.pi * np.cumsum(f + 1200 * np.sin(2 * np.pi * 18 * tt)) / SR) * env(n, 0.01, 0.06)
    place(birds, s, t0)
amb = amb + 0.05 * norm(birds + 1e-9)
# the pad: low and uneasy (A minor with a flat second), darker while he is blind, opening into a warm D major add9
def pad(freqs):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * (0.07 + 0.02 * k) * t + k)
        out += a * lfo * (np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * f * 2.005 * t))
    return circ(lambda x: lp(x, 1200), out)
pad_a = pad([(55.0, 0.5), (110.0, 0.3), (130.81, 0.16), (164.81, 0.1), (116.54, 0.05)])
pad_w = pad([(73.42, 0.45), (146.83, 0.3), (185.0, 0.2), (220.0, 0.18), (329.63, 0.1), (369.99, 0.06)])
warm = np.clip((t - (E('povClear') - 0.1)) / 1.4, 0, 1) ** 1.5
# back to the opening's pad over the last 0.7 s, so the loop seam is continuous in sound too
warm = warm * (1 - np.clip((t - (DUR - 0.7)) / 0.7, 0, 1))
bed = norm(pad_a) * (1 - warm) * (1 - 0.5 * dark) + norm(pad_w) * warm * 1.25
# ---------------- voice and mix ----------------
v, vsr = sf.read(os.path.join(EP, f'audio/narration/FGW_Tooth_Eye_narration_{VER}.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=3.0, att=0.004, rel=0.09):
    """a gentle feed-forward compressor (peak envelope), to bring the voice's peaks closer to its body"""
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0
    envl = np.empty(len(x))
    ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]
        envl[i] = e
    lev = 20 * np.log10(envl + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), float(gr.min())
def limit(x, ceil_db, look=0.004, rel=0.06):
    """a look-ahead peak limiter: the gain needed to keep every sample under the ceiling, held over the look-ahead
    window and released smoothly"""
    from scipy.ndimage import minimum_filter1d
    need = np.minimum(1.0, db(ceil_db) / (np.abs(x) + 1e-12))
    g = minimum_filter1d(need, size=int(look * SR) * 2 + 1)
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g); y = 1.0
    for i in range(len(g)):
        y = g[i] if g[i] < y else a * y + (1 - a) * g[i]
        out[i] = y
    out = np.minimum(out, minimum_filter1d(need, size=3))
    return x * out
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, grmin = compress(v0)
vc = limit(vc, -9.0)
vg = -16.0 - meter.integrated_loudness(vc)
voice = vc * db(vg)
venv = lp(np.abs(voice), 6)
venv = venv / (venv.max() + 1e-9)
duck = 1 - 0.4 * np.clip(venv * 3, 0, 1)
mix = voice + sfx + db(-31) * amb * duck + db(-33) * bed * duck * (1 + 0.6 * warm)
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.4 - lufs), db(-1.6) / peak)
mix *= g
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Tooth_Eye_{VER}_mix.wav'), mix2, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{VER.lower()}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{VER.lower()}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
