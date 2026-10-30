#!/usr/bin/env python3
"""Effects and mix for FGW "Doctors Grew an Ear Inside Her Arm" V5 (re-cued to the V5 picture: stitch-by-stitch closure, a memory swell into the closing flashback). Everything here is synthesised (no samples, no
third-party music). The narration master (audio/narration/FGW_Ear_Forearm_narration_V5.wav) is used sample for sample
(gain, a gentle compressor and a peak limiter only).
Under it: one continuous low ambient bed (clinic air and a quiet low pad; it never cuts in and out), and restrained
effects placed from the picture's own events (audio/cues.json, exported from story.ts):
  opening: a low, unsettling impact and a slow skin stretch as the ear pushes up under the skin;
  the crash: a brief, distant, muffled impact with a little glass;
  the rib harvest and carving: precise, light blade and scraping sounds, offcuts ticking away;
  the vessels: an understated organic swell with a faint pulse;
  the transfer: a quiet lift, small instrument ticks and suture pulls;
  the finished ear: a brief warm release in the bed;
  the loop: a soft rising swell back into the forearm that lands on "HERE".
No whooshes on camera moves, no cartoon sounds. Every effect sits well under the voice, and the beds duck under it.
Levels: voice about -16 LUFS; the whole about -14 LUFS integrated; sample ceiling -1.5 dBFS (true peak measured 4x).
The bed's tones and LFOs are whole cycles over the film's length and the noise is filtered circularly, so the end of
the film runs straight into its start (the loop).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)
Outputs: source/public/audio/<mix>.wav, audio/mix/FGW_Ear_Forearm_V5_mix.wav, audio/mix/mix_measure_v5.json, audio/sfx_log_v5.json"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v5'
cj = json.load(open(os.path.join(EP, 'audio/cues.json')))
DUR, TM, B = cj['DUR'], cj['TM'], cj['B']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(2018)
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
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
sfx = np.zeros(N)
def place(sig, at, name=None, gain_db=0.0):
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    m = (idx >= 0) & (idx < N)
    sfx[idx[m]] += sig[m] * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})

# ---------------- effect generators ----------------
def impact_low(dur=0.9, f0=48, f1=30):
    """a low, felt thump with a short soft body (the ear pushing up under the skin; not a hit)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = f0 + (f1 - f0) * (tt / dur) ** 0.5
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.28)
    body = lp(noise(n), 260) * np.exp(-tt / 0.07) * 0.5
    return norm(sub + body) * env(n, 0.004, 0.25)
def stretch(dur=0.7, f0=110, f1=70, grain=26):
    """skin under tension: a slow, soft, low creak with a wet texture"""
    n = int(dur * SR); tt = np.arange(n) / SR
    ph = np.cumsum(grain * (1 + 0.4 * np.sin(2 * np.pi * 2.2 * tt)) / SR)
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.4 + 0.6 * rng.random(n))
    f = f0 + (f1 - f0) * tt / dur
    res = np.zeros(n); y1 = y2 = 0.0
    for k in range(n):
        w = 2 * np.pi * f[k] / SR; r = 0.993
        y = pulses[k] + 2 * r * np.cos(w) * y1 - r * r * y2; y2, y1 = y1, y; res[k] = y
    wet = bp(noise(n), 300, 1100) * 0.25
    return norm(bp(res, 50, 1800) + wet) * env(n, dur * 0.35, dur * 0.45)
def rub(dur=0.8):
    """skin turning against air: a very soft, dry brush"""
    n = int(dur * SR)
    return norm(bp(noise(n), 900, 4200) * (0.6 + 0.4 * np.sin(np.linspace(0, np.pi, n)))) * env(n, dur * 0.4, dur * 0.5)
def slice_(dur=0.6):
    """a fine blade drawing through tissue: a thin, slightly grainy high hiss with a faint resonance"""
    n = int(dur * SR); tt = np.arange(n) / SR
    g = 0.6 + 0.4 * (rng.random(n) < 0.03) * rng.random(n)
    x = bp(noise(n) * g, 3200, 9000) + 0.35 * bp(noise(n), 5600, 6400)
    return norm(x) * env(n, 0.03, dur * 0.4)
def scrape(dur=0.3, lo=1600, hi=6500):
    """a blade shaving cartilage: a short, firm scrape with micro-chatter"""
    n = int(dur * SR); tt = np.arange(n) / SR
    chatter = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * (70 + 30 * tt / dur) * tt))
    return norm(bp(noise(n), lo, hi) * chatter) * env(n, 0.012, dur * 0.5)
def tick(dur=0.03, f=4200):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 3000) * np.exp(-tt / 0.0015) + 0.4 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004))
def steel(f=5200):
    """a fine instrument touching: a tiny metallic tick"""
    n = int(0.08 * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.012) + 0.5 * np.sin(2 * np.pi * f * 1.51 * tt) * np.exp(-tt / 0.007) + 0.4 * hp(noise(n), 4000) * np.exp(-tt / 0.002))
def pull(dur=0.14):
    """a suture drawn through: a soft, short high swish"""
    n = int(dur * SR)
    return norm(bp(noise(n), 2500, 8000)) * env(n, dur * 0.3, dur * 0.6)
def wet_lift(dur=0.35):
    """tissue lifting free: a soft wet release"""
    n = int(dur * SR); tt = np.arange(n) / SR
    pop = np.sin(2 * np.pi * (380 - 200 * tt / dur) * tt) * np.exp(-tt / 0.03)
    return norm(0.6 * pop + bp(noise(n), 250, 1600) * np.exp(-tt / 0.09)) * env(n, 0.005, dur * 0.5)
def slide(dur=0.5):
    """the framework sliding in under the skin: a muffled, smooth slide"""
    n = int(dur * SR)
    return norm(bp(noise(n), 180, 1300) * np.sin(np.linspace(0, np.pi, n)) ** 1.5)
def organic(dur=2.0):
    """living tissue: a low, slowly breathing swell with a faint soft pulse"""
    n = int(dur * SR); tt = np.arange(n) / SR
    base = bp(noise(n), 70, 420) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.9 * tt))
    pulse = np.zeros(n)
    for k in range(int(dur / 0.82) + 1):
        for off, a in [(0.0, 1.0), (0.16, 0.6)]:
            i = int((0.15 + k * 0.82 + off) * SR)
            if i < n:
                m = min(n - i, int(0.12 * SR)); tm = np.arange(m) / SR
                pulse[i:i + m] += a * np.sin(2 * np.pi * 52 * tm) * np.exp(-tm / 0.035)
    return norm(base + 0.8 * pulse) * env(n, dur * 0.3, dur * 0.35)
def crash_far(dur=0.9):
    """distant, muffled: a heavy low impact behind glass, and a short spray of glass"""
    n = int(dur * SR); tt = np.arange(n) / SR
    thud = np.sin(2 * np.pi * (70 - 30 * tt / dur) * tt) * np.exp(-tt / 0.12) + lp(noise(n), 900) * np.exp(-tt / 0.06)
    glass = np.zeros(n)
    for _ in range(60):
        i = int((0.01 + 0.35 * rng.random() ** 1.6) * SR); m = min(n - i, 300)
        glass[i:i + m] += hp(noise(m), 3500) * np.exp(-np.arange(m) / SR / 0.002) * rng.random()
    return norm(lp(thud, 1200) + 0.35 * lp(glass, 7000)) * env(n, 0.002, dur * 0.6)
def riser(dur=0.8):
    """a soft rising swell (back to the forearm), no whoosh: a band of air that opens upward"""
    n = int(dur * SR); tt = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(6):
        seg = slice(k * n // 6, (k + 1) * n // 6)
        fc = 300 * (2.6 ** (k / 5) * 2.2)
        out[seg] = bp(noise(n), fc * 0.7, fc * 1.4)[seg]
    return norm(lp(out, 5000)) * (tt / dur) ** 2 * env(n, 0.01, 0.06)

def swell_down(dur=1.6):
    """a soft, low, slightly detuned tone under the flashback (memory), no beat"""
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 110 * tt) + 0.6 * np.sin(2 * np.pi * 110.7 * tt + 1) + 0.3 * np.sin(2 * np.pi * 164.8 * tt)
    return norm(lp(x, 900)) * env(n, dur * 0.35, dur * 0.5)
E = lambda k: B[k]
# opening: the ear pushes up under the skin as the film starts (and again where the loop lands)
place(impact_low(), 0.0, 'low impact under the opening ear', -17)
place(stretch(0.75), 0.02, 'skin stretch (opening)', -27)
place(rub(1.2), E('turn')[0] + 0.1, 'forearm turning (skin)', -38)
# the crash memory
place(crash_far(), TM['crash'] + 0.02, 'distant muffled crash, a little glass', -24)
# rib harvest
place(organic(1.2) * 0.6, E('ribWin')[0], 'chest opening (soft tissue)', -33)
place(slice_(E('cut')[1] - E('cut')[0]), E('cut')[0], 'blade traces the cartilage block', -30)
place(steel(4600), E('lift')[0] - 0.02, 'forceps grip the block', -34)
place(wet_lift(), E('lift')[0] + 0.05, 'block lifts free', -27)
place(tick(0.04, 1800), E('carry1')[1] - 0.02, 'set down on the tray (soft tap)', -33)
place(rub(0.4) * 0.6, E('carry1')[1], None, -40)
# carving: outline, offcuts dropping, hollows, rim
o0, o1 = E('outline')
for k in range(4):
    place(scrape(0.16, 2000, 7000), o0 + k * (o1 - o0) / 4, 'outline cut (scrape)' if k == 0 else None, -31)
for k, frac in enumerate([0.36, 0.68, 1.0]):
    place(rub(0.18) * 0.7, o0 + frac * (o1 - o0) + 0.02, 'offcut slides aside on the drape' if k == 0 else None, -39)
g0, g1 = E('grooves')
for k in range(5):
    place(scrape(0.11, 2400, 8000), g0 + k * (g1 - g0) / 5, 'hollows carved' if k == 0 else None, -32)
r0, r1 = E('rim')
place(scrape(r1 - r0, 1800, 6000), r0, 'rim cut free (long scrape)', -32)
# into the forearm
place(steel(4800), E('carry2')[0] - 0.03, 'forceps pick up the framework', -34)
place(slide(0.55), E('insert')[0] + 0.02, 'framework slides under the skin', -26)
place(stretch(0.6, 120, 80, 22), E('insert')[0] + 0.35, 'skin settles over it', -29)
for k in range(5):  # V5: the stitches go in one by one
    place(steel(5200 + 250 * (k % 2)), E('insert')[1] - 0.1 + k * 0.07, 'stitches, one by one' if k == 0 else None, -36)
    place(pull(0.1), E('insert')[1] - 0.06 + k * 0.07, None, -40)
# vessels grow in the tissue around it
v0, v1 = E('vessels')
place(organic(v1 - v0 + 0.3), v0, 'organic swell, faint pulse (vessels forming)', -27)
# the transfer
place(slice_(E('incise')[1] - E('incise')[0]), E('incise')[0], 'flap outlined', -32)
place(wet_lift(0.45), E('raise')[0] + 0.1, 'living ear lifted', -26)
place(steel(4600), E('raise')[0] + 0.02, 'forceps grip', -33)
place(stretch(0.5, 100, 70, 20), E('seat')[0] + 0.05, 'ear seated', -30)
# microsurgery: one tick per stitch, a pull after each
for key, n_st in [('artery', 6), ('vein', 6), ('nerve', 2)]:
    b0, b1 = E(key)
    st0 = b0 + 0.22
    for k in range(n_st):
        tt_ = st0 + (k + 0.5) * (b1 - b0 - 0.25) / n_st
        place(steel(5000 + 300 * (k % 3)), tt_, f'{key} stitches' if k == 0 else None, -34)
        place(pull(), tt_ + 0.05, None, -38)
place(organic(E('flow')[1] - E('flow')[0]) * 0.7, E('flow')[0], 'blood flows into the ear (soft pulse)', -31)
# the loop: back to the forearm, landing on "HERE"
place(riser(0.8), E('fb')[0] - 0.55, 'memory swell into the flashback', -30)
place(swell_down(1.6), E('fb')[0], 'flashback: the bed muffles and warms', -34)
place(stretch(0.7, 110, 75, 24), E('fb')[1] + 0.4, 'skin stretch (the forearm turning, in the past)', -29)
place(impact_low(0.7, 46, 32), TM['here'] + 0.02, 'low soft landing on HERE', -22)

# ---------------- bed (loop-seamless) ----------------
def qf(f): return round(f * DUR) / DUR  # whole cycles over the film
def circ(f, x): return f(np.concatenate([x, x, x]))[N:2 * N]
air = circ(lambda x: lp(hp(x, 90), 1400), noise(N)) * (0.75 + 0.25 * np.sin(2 * np.pi * qf(0.09) * t))
hiss = circ(lambda x: bp(x, 3000, 7000), noise(N)) * 0.18
def pad(freqs):
    out = np.zeros(N)
    for k, (f, a) in enumerate(freqs):
        lfo = 0.7 + 0.3 * np.sin(2 * np.pi * qf(0.06 + 0.02 * k) * t + k)
        out += a * lfo * (np.sin(2 * np.pi * qf(f) * t) + 0.1 * np.sin(2 * np.pi * qf(f * 2) * t))
    return out
uneasy = pad([(55.0, 0.5), (82.41, 0.28), (110.0, 0.2), (116.54, 0.07), (130.81, 0.12)])  # A minor with a flat second
warm = pad([(55.0, 0.45), (82.41, 0.3), (110.0, 0.24), (138.59, 0.16), (164.81, 0.12), (246.94, 0.05)])  # A major (add9)
def win(a, b, fa, fb): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
rel = win(E('reveal')[0] + 0.3, TM['her'], 0.45, 0.7)
bed = norm(uneasy) * (1 - rel) + norm(warm) * rel * 1.1
amb = 0.6 * norm(air) + norm(hiss) * 0.12
LOG.append({'t': round(E('reveal')[0], 3), 'sfx': 'bed: warm release (minor -> major) for the finished ear', 'gain_db': 0})

# ---------------- voice and mix ----------------
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_Ear_Forearm_narration_V5.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=3.0, att=0.004, rel_=0.09):
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel_ * SR))
    e = 0.0; envl = np.empty(len(x)); ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]; envl[i] = e
    lev = 20 * np.log10(envl + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), float(gr.min())
def limit(x, ceil_db, look=0.004, rel_=0.06):
    from scipy.ndimage import minimum_filter1d
    need = np.minimum(1.0, db(ceil_db) / (np.abs(x) + 1e-12))
    g = minimum_filter1d(need, size=int(look * SR) * 2 + 1)
    a = np.exp(-1 / (rel_ * SR)); out = np.empty_like(g); y = 1.0
    for i in range(len(g)):
        y = g[i] if g[i] < y else a * y + (1 - a) * g[i]; out[i] = y
    out = np.minimum(out, minimum_filter1d(need, size=3))
    return x * out
v0 = v * db(-18.0 - meter.integrated_loudness(v))
vc, grmin = compress(v0)
vc = limit(vc, -9.0)
vg = -16.0 - meter.integrated_loudness(vc)
voice = vc * db(vg)
venv = lp(np.abs(voice), 6); venv = venv / (venv.max() + 1e-9)
duck = 1 - 0.45 * np.clip(venv * 3, 0, 1)
fx_duck = 1 - 0.25 * np.clip(venv * 3, 0, 1)
mix = voice + sfx * fx_duck + db(-31) * amb * duck + db(-33) * bed * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(mix)
g = min(db(-14.0 - lufs), db(-1.6) / peak)
mix *= g
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, 'audio/mix/FGW_Ear_Forearm_V5_mix.wav'), mix2, SR, subtype='PCM_24')
# stems-level check: effects never above the voice
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
sp = venv > 0.15
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG),
       'voice_rms_db_in_speech': round(rms_db(voice[sp] * g), 1), 'effects_rms_db_in_speech': round(rms_db((sfx * fx_duck)[sp] * g), 1),
       'beds_rms_db_in_speech': round(rms_db((db(-31) * amb * duck + db(-33) * bed * duck)[sp] * g), 1),
       'loop_seam_step': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, 'audio/mix/mix_measure_v5.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, 'audio/sfx_log_v5.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
