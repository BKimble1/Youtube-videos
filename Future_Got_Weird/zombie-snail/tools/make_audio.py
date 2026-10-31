#!/usr/bin/env python3
"""Effects and mix for FGW Short 2, "The Zombie Snail Parasite". Everything is synthesised here (no samples, no
third-party music). The narration master is used sample for sample (gain, a gentle compressor and a limiter only).
Under it: a quiet forest ambience (leaf air, distant birdsong, insects), a faint low tension drone, and restrained
effects placed from the picture's own events and pulse envelope (audio/cues.json, exported from story.ts):
  the sac's organic pulsation (one soft wet throb per contraction, following the stalk's pulse strength),
  the bird's wings as its shadow crosses and as it lands, the restrained peck and the tear, the swallow,
  the dive through the sac wall, the snail's rasping, the sporocyst's growth, the muffled inside of the bird,
  the eggs released, the dropping's soft landing.
No horror stingers, no whooshes on camera moves.
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)
V2: re-cued to the V2 picture (cutaways, the climb, the strike, inside the bird, the second snail and the bloom).
Outputs: source/public/audio/<mix>.wav, audio/mix/FGW_Zombie_Snail_<MIX>.wav, audio/mix/mix_measure_<mix>.json, audio/sfx_log_<mix>.json"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v1'
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, EV, T = cj['DUR'], cj['EV'], cj['T']
PULSE = np.array(cj['pulse']); PHZ = cj['pulseHz']
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
def steps(t0, t1, every=0.075, gain=-40, name=None):
    k = 0
    tt = t0
    while tt < t1:
        place(sfx, step(), tt + 0.012 * rng.random(), name if k == 0 else None, gain - (0 if k % 3 else 3))
        tt += every * (0.85 + 0.3 * rng.random()); k += 1

def swell(dur=2.0, f=58):
    """a low organic swell under the growth (felt, not a tone)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt + 0.8 * np.sin(2 * np.pi * 0.7 * tt)) + 0.5 * np.sin(2 * np.pi * f * 1.5 * tt)
    return norm(lp(x * (1 + 0.3 * bp(noise(n), 2, 8)), 220)) * env(n, dur * 0.45, dur * 0.4)
def throb(dur=0.2):
    """one contraction of the sac: a soft, wet, low squeeze (felt more than heard)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (78 - 25 * tt / dur) * tt) * np.exp(-tt / 0.07)
    wet = bp(noise(n), 250, 1100) * env(n, 0.03, dur * 0.7) * 0.5
    return norm(lp(body + wet, 1400)) * env(n, 0.012, dur * 0.5)
def flap(dur=0.16):
    """one wingbeat: a soft feathery push of air"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = bp(noise(n), 350, 3200) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5
    return norm(x + 0.4 * lp(noise(n), 300) * np.sin(np.pi * tt / dur))
def chirp(f0, f1, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (tt / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, dur * 0.5)
def squelch(dur=0.5, lo=200, hi=1600):
    n = int(dur * SR); tt = np.arange(n) / SR
    g = np.zeros(n)
    for _ in range(int(dur * 30)):
        i = rng.integers(0, max(1, n - 1200))
        g[i:i + 1200] += np.sin(2 * np.pi * (300 + 500 * rng.random()) * np.arange(1200) / SR) * np.exp(-np.arange(1200) / SR / 0.006) * rng.random()
    return norm(bp(noise(n), lo, hi) * 0.4 + g) * env(n, dur * 0.3, dur * 0.4)

sfx = np.zeros(N)
E = EV.get
# ---- the sac's pulsation: a throb on each contraction, scaled by the picture's pulse strength
k = 0
tc = 0.08
while tc < DUR:
    p = PULSE[min(len(PULSE) - 1, int(tc * 100))]
    if p > 0.08:
        place(sfx, throb(0.22), tc, 'sac pulsation (per contraction)' if k == 0 else None, -27 + 4 * min(1.2, p))
        k += 1
    tc += 1 / PHZ
def squirm(dur=1.0, density=26):
    """the larvae shifting inside the sac: a bed of tiny soft wet clicks, very quiet"""
    n = int(dur * SR); x = np.zeros(n)
    for _ in range(int(dur * density)):
        i = rng.integers(0, max(1, n - 900)); m = 900
        f = 500 + 900 * rng.random()
        x[i:i + m] += np.sin(2 * np.pi * f * np.arange(m) / SR) * np.exp(-np.arange(m) / SR / 0.004) * (0.3 + 0.7 * rng.random())
    return norm(bp(x, 300, 2500) + 0.3 * bp(noise(n), 200, 900)) * env(n, dur * 0.2, dur * 0.25)
def slither(dur=4.0):
    """a snail gliding: a soft, sticky, faintly crackling slide"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = bp(noise(n), 900, 4200) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * tt)) + 0.4 * crackle(dur, 25, 3000, 9000)
    return norm(x) * env(n, 0.5, 0.6)
# ---- the push in: the stalk writhes
place(sfx, creak(0.55, 140, 210, 34), T['it'] + 0.05, 'stalk writhes (wet stretch)', -26)
# ---- the cutaway opens the stalk; the larvae inside
place(sfx, squelch(0.5, 220, 1600), E('cut0'), 'cutaway opens the stalk (soft wet peel)', -24)
place(sfx, squirm(E('cutClose') - E('cut0') + 0.3), E('cut0') + 0.15, 'larvae shifting inside the sac', -29)
# ---- the body cutaway; the sporocyst grows; material pumps into the stalk
place(sfx, squelch(0.45, 180, 1200), E('bodyCut0'), 'cutaway opens the body', -26)
place(sfx, creep(E('stalkBack') - T['worm'] + 0.3), T['worm'] - 0.1, 'sporocyst growing (organic creep)', -24)
place(sfx, swell(1.4, 58), E('stalkBack'), 'sac swelling (low)', -26)
place(sfx, squelch(0.35, 250, 1400), E('cutClose'), 'skin closes', -29)
# ---- the climb into the open
place(sfx, slither(E('climb1') - E('climb0')), E('climb0'), 'snail gliding up the leaf', -32)
# ---- the bird arrives: a flutter of wingbeats, the toes take the twig
for i in range(8):
    place(sfx, flap(0.09), E('land0') + 0.05 + i * 0.1, 'landing flutter' if i == 0 else None, -21 - 0.5 * i)
place(sfx, creak(0.3, 210, 140, 60), E('land1') - 0.02, 'twig takes the weight', -27)
place(sfx, tick(0.02, 2600), E('land1') - 0.03, None, -31)
# ---- the strike: feathers, a hard beak snap, a short soft tear
place(sfx, rustle(0.22, 2000, 6500), E('lunge'), 'feathers on the lunge', -29)
place(sfx, tick(0.025, 3400), E('peck') - 0.01, 'beak snap (strike)', -16)
place(sfx, squelch(0.16, 600, 3200), E('peck') + 0.03, 'the stalk tears (soft, wet)', -21)
# ---- the swallow, then inside the bird
place(sfx, pop(0.14, 160), E('swallow') + 0.3, 'swallow (gulp)', -23)
ib = E('inside1') + 0.2 - E('intoBird')
place(sfx, norm(lp(noise(int(ib * SR)), 220)) * env(int(ib * SR), 0.4, 0.4), E('intoBird'), 'inside the bird (muffled)', -28)
for i, tq in enumerate([18.35, 18.9, 19.3]):
    place(sfx, squelch(0.3, 160, 900), tq, 'peristalsis squeeze' if i == 0 else None, -30)
place(sfx, squelch(0.3, 300, 1500), E('burst'), 'sac bursts', -26)
place(sfx, squirm(0.9, 30), E('burst') + 0.15, 'larvae settling', -31)
for i in range(16):
    place(sfx, pop(0.05, 700 + 300 * rng.random()), T['eggs'] + 0.05 + i * 0.055 + 0.02 * rng.random(), 'eggs released (tiny bubbles)' if i == 0 else None, -36 - 2 * (i % 3))
# ---- the dropping lands; snail 2 touches it; its stalk blooms into the loop
place(sfx, squelch(0.12, 300, 2000), E('landDrop'), 'dropping lands (soft)', -23)
place(sfx, crackle(0.45, 55, 2500, 8000), E('touch') - 0.1, 'snail rasps the dropping', -32)
place(sfx, swell(0.9, 56), E('bloom0') - 0.1, 'stalk blooms (low swell into the loop)', -27)

# ---------------- beds ----------------
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]
air = circ(lambda x: lp(hp(x, 120), 1600), noise(N)) * (0.65 + 0.35 * np.sin(2 * np.pi * 0.09 * t + 1))
leaves_air = circ(lambda x: bp(x, 2500, 6500), noise(N)) * (0.45 + 0.55 * np.clip(np.sin(2 * np.pi * 0.06 * t) * 1.5, 0, 1))
birdsong = np.zeros(N)
for k2 in range(7):
    t0 = 1.2 + k2 * 3.4 + rng.random()
    if t0 > DUR - 1.2: break
    for j in range(3 + int(3 * rng.random())):
        f0 = 2600 + 1800 * rng.random()
        place(birdsong, chirp(f0, f0 * (1.2 + 0.4 * rng.random()), 0.06 + 0.05 * rng.random()), t0 + j * 0.11)
birdsong = bp(birdsong, 1500, 7000)
insects = np.zeros(N)
for k2 in range(8):
    t0 = 0.8 + k2 * 3.0 + rng.random()
    if t0 > DUR - 1: break
    d = 0.5 + 0.5 * rng.random(); n = int(d * SR); tt = np.arange(n) / SR
    f = 4700 + 900 * rng.random()
    place(insects, np.sin(2 * np.pi * f * tt) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (26 + 8 * rng.random()) * tt))) * env(n, 0.08, 0.2), t0)
amb = 0.55 * norm(air) + 0.18 * norm(leaves_air) + 0.07 * norm(birdsong + 1e-9) + 0.05 * norm(insects + 1e-9)
# the faint low tension: a slow drone, thicker under the bird and the loop
def pad(freqs):
    out = np.zeros(N)
    for k3, (f, a) in enumerate(freqs):
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * (0.06 + 0.02 * k3) * t + k3)
        out += a * lfo * (np.sin(2 * np.pi * f * t) + 0.1 * np.sin(2 * np.pi * f * 2.004 * t))
    return circ(lambda x: lp(x, 700), out)
bed = norm(pad([(49.0, 0.5), (98.0, 0.3), (116.5, 0.14), (146.8, 0.08), (103.8, 0.05)]))
inside_v = ((t > 3.1) & (t < 7.9)) | ((t > 17.7) & (t < 21.3))
tension = 0.75 + 0.25 * np.clip((t - 14) / 3, 0, 1) - 0.15 * np.clip((t - 21.5) / 1.5, 0, 1) + 0.3 * lp(inside_v.astype(float), 2)
bed *= tension

# ---------------- voice and mix ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Zombie_Snail_narration_V1.wav'))
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
duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
mix = voice + sfx * (1 - 0.25 * np.clip(venv * 3, 0, 1)) + db(-31) * amb * duck + db(-35) * bed * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_Zombie_Snail_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG),
       'voice_lufs_in_mix': round(meter.integrated_loudness(voice * g), 2), 'sfx_peak_vs_voice_peak_db': round(20 * np.log10((np.max(np.abs(sfx * g)) + 1e-12) / np.max(np.abs(voice * g))), 1)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
