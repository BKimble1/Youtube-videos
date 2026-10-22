"""Original score, synthesized sound effects and the review mix. Everything is generated here (no third-party audio).
Cue times come from the measured narration timeline (source/src/data/timeline.json) with the same offsets the
scenes use, so effects land on the animated events.
Usage: python3.13 tools/make_audio.py
Outputs: audio/mix/{music,sfx,mix_review}.wav, source/public/audio/{mix_review,narration_review}.wav, audio/mix/mix_measure.json"""
import json, os, shutil
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, sosfiltfilt

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SR = 48000
TL = json.load(open(os.path.join(ROOT, "source", "src", "data", "timeline.json")))
SEG = {s["id"]: s for s in TL["segments"]}
TOTAL = TL["total"] + 0.5
N = int(TOTAL * SR)
rng = np.random.default_rng(7)
S = lambda i: round(SEG[i]["start"] * 30) / 30  # scene code works in frames
E = lambda i: round(SEG[i]["end"] * 30) / 30
F = lambda fr: fr / 30

def lp(x, fc, o=2):
    return sosfilt(butter(o, fc, "low", fs=SR, output="sos"), x)
def hp(x, fc, o=2):
    return sosfilt(butter(o, fc, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def env(n, a, r):
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def noise(sec):
    return rng.standard_normal(int(sec * SR))
def brown(sec):
    x = np.cumsum(rng.standard_normal(int(sec * SR)))
    x = hp(x, 15)
    return x / (np.abs(x).max() + 1e-9)

sfx = np.zeros((N, 2))
def put(x, t, g_db=0.0, pan=0.0):
    i = int(t * SR)
    if i >= N or len(x) == 0: return
    x = x[: N - i] * 10 ** (g_db / 20)
    sfx[i:i + len(x), 0] += x * np.sqrt(0.5 * (1 - pan))
    sfx[i:i + len(x), 1] += x * np.sqrt(0.5 * (1 + pan))

# ---------- effect generators ----------
def rumble(sec, a=0.4, r=0.6, bright=300):
    x = brown(sec) * 0.8 + lp(noise(sec), bright) * 0.25
    t = np.arange(len(x)) / SR
    x *= 1 + 0.15 * np.sin(2 * np.pi * 7.3 * t) * np.sin(2 * np.pi * 0.7 * t)
    return lp(x, bright * 2.2) * env(len(x), a, r)
def wind(sec, a=0.8, r=0.8):
    x = bp(noise(sec), 300, 2400)
    t = np.arange(len(x)) / SR
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t + 1) ** 2
    return x * 0.25 * env(len(x), a, r)
def servo(sec, f0=180, f1=260):
    n = int(sec * SR); t = np.arange(n) / SR
    fr = np.linspace(f0, f1, n)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = 0.5 * np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.12 * np.sin(3.01 * ph)
    x += 0.15 * bp(noise(sec), 800, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * t))
    return x * 0.35 * env(n, 0.12, 0.2)
def clunk(big=1.0):
    n = int(1.6 * SR); t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (55 + 30 * np.exp(-t * 18)) * t) * np.exp(-t * 6)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * g for f, d, g in [(310, 5, 0.25), (447, 6, 0.18), (733, 8, 0.12), (1190, 11, 0.07)])
    click = hp(noise(0.03), 1500) * np.exp(-np.arange(int(0.03 * SR)) / SR * 120)
    x = thump * 0.9 + ring * big
    x[: len(click)] += click * 0.4
    return x * 0.8
def whoosh(sec=0.7, up=True):
    n = int(sec * SR); x = noise(sec); y = np.zeros(n)
    for k in range(8):
        a, b = k * n // 8, (k + 1) * n // 8
        fc = 400 + 2600 * ((k / 7) if up else (1 - k / 7))
        y[a:b] = bp(x, fc * 0.6, fc * 1.4)[a:b]
    return y * np.hanning(n) * 0.5
def tick():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1320 * t) * 0.5 + np.sin(2 * np.pi * 1980 * t) * 0.2) * np.exp(-t * 40) * 0.6
def ignite(sec=1.4):
    x = rumble(sec, 0.02, 0.5, 600)
    x[: int(0.08 * SR)] += hp(noise(0.08), 600) * 0.8
    return x
def splash():
    x = bp(noise(1.5), 200, 5000) * env(int(1.5 * SR), 0.02, 1.2)
    return x * 0.5
def hit():
    n = int(2.5 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (42 + 20 * np.exp(-t * 10)) * t) * np.exp(-t * 2.2) * 0.9
def buzz():
    n = int(0.35 * SR); t = np.arange(n) / SR
    return lp(np.sign(np.sin(2 * np.pi * 110 * t)), 900) * env(n, 0.01, 0.1) * 0.2

# ---------- cues (seconds; mirrors the scene code) ----------
FREEZE = F(386)
put(rumble(FREEZE, 0.05, 0.02), 0, -6)
put(wind(FREEZE, 0.3, 0.02), 0, -10, 0.3)
put(servo(F(382 - 313), 160, 210), F(313), -8, -0.3)
put(hit(), FREEZE, -3)
put(whoosh(0.6), S("h5") - 0.25, -10)
put(whoosh(0.6), S("h6") - 0.2, -11, 0.4)
put(whoosh(0.9, False), S("h7") + 0.3, -12)
# stack / throwaway
put(whoosh(1.0), S("a1") - 0.6, -12)
put(servo(0.7, 300, 380), S("a2") - 0.1, -16)
for k in range(33):
    if k % 3 == 0: put(tick(), S("a2") + 40 / 30 + k * (80 / 30) / 33, -26)
put(servo(0.7, 380, 300), S("a4") - 0.2, -16)
put(whoosh(0.7), S("a5") - 0.2, -12)
for dt in (60, 66): put(tick(), S("a5") + dt / 30, -14)
fal = S("a5") + 4.4
for dt in (80, 84): put(tick(), fal + dt / 30, -14)
put(whoosh(0.8), S("a6") - 0.15, -11)
for dt in (-10, -4): put(tick(), E("a7") + dt / 30, -12)
# booster return
put(whoosh(0.8), S("b1") - 0.6, -12)
put(rumble(S("b3") - S("b2") + 0.2, 0.6, 0.3, 200), S("b2") - 0.3, -14)
hs = S("b3") - 4 / 30
put(ignite(2.2), hs + 14 / 30, -6)
put(rumble(3.5, 0.1, 1.5, 400), hs + 52 / 30, -9)
put(rumble(S("b6") - S("b5") - 1.3, 0.3, 0.4, 250), S("b5") + 40 / 30, -15)
put(wind(4.0), S("b6"), -12)
# grid fins
put(wind(E("b7") - S("b7") + 0.4, 0.3, 0.4), S("b7") - 0.2, -5, 0.2)
for k in range(5): put(servo(0.25, 400, 330), S("b7") + 0.9 + k * 1.47, -18, -0.4)
# booster catch
bc = S("b11") + 150 / 30
put(rumble(S("b9") - S("b8") + 0.2, 0.2, 0.3), S("b8") - 0.2, -7)
put(buzz(), S("b9") + 40 / 30, -8)
put(rumble(bc - S("b10"), 0.2, 0.05), S("b10"), -8)
put(servo(bc - 1 - (S("b11") + 40 / 30), 150, 230), S("b11") + 40 / 30, -10, -0.3)
put(clunk(1.0), bc, -4)
put(whoosh(0.7), S("b13") - 0.4, -13)
for dt in (10 / 30, 4.2, 4.2 + 10 / 30): put(tick(), S("b13") - 6 / 30 + (dt if dt < 1 else dt + 6 / 30), -12)
put(whoosh(0.8), S("b14") - 0.3, -12)
put(servo(1.2, 260, 330), S("b14") + 6.4, -14)
put(servo(3.0, 300, 300), S("b14") + 8.5, -18)
# orbit / reentry / flip
put(whoosh(1.2), S("c1") - 0.8, -12)
put(whoosh(1.0), S("c3") - 0.1, -13)
reent = S("c5") + 2.0
x = rumble(E("c8") - reent + 0.3, 3.0, 1.0, 900) + 0.4 * bp(noise(E("c8") - reent + 0.3), 500, 3000) * env(int((E("c8") - reent + 0.3) * SR), 3, 1)
put(x, reent, -10)
put(wind(E("c9") - S("c9") + 1.5), S("c9") - 0.3, -9)
fs = S("c10") + 1.0
put(ignite(1.6), fs - 10 / 30, -6)
put(rumble(S("c11") - fs, 0.1, 0.4), fs, -9)
put(rumble(5.0, 0.2, 0.5), S("c11"), -15)
put(splash(), S("c11") + 5.0, -12)
put(whoosh(0.8), S("c12") - 0.3, -12)
for d in (10 / 30, 4.3, 5.2, 6.4): put(tick(), S("c12") + d, -15)
# tower anatomy
put(whoosh(1.2), S("d1") - 0.6, -10)
put(servo(70 / 30 - 0.2, 200, 260), S("d3") + 20 / 30, -12)
put(servo(50 / 30, 260, 180), S("d3") + 70 / 30, -12)
put(servo(45 / 30, 200, 230), S("d3") + 120 / 30, -13)
for k in range(2): put(servo(1.6, 220, 280), S("d4") + 0.3 + k * 2.1, -12, 0.3)
put(servo(1.3, 200, 260), S("d5"), -12)
# ship catch
cf = S("d7") + 4 / 30
put(rumble(cf - S("d6") + 0.3, 0.3, 0.05), S("d6") - 0.3, -7)
put(servo(cf - 12 / 30 - (S("d6") + 3.4), 150, 230), S("d6") + 3.4, -10, -0.3)
put(clunk(1.1), cf, -3)
# ship fit
put(servo(140 / 30, 140, 180), S("d9") + 2.0, -12)
put(servo(50 / 30, 300, 260), S("d9") + 230 / 30, -14, 0.4)
put(whoosh(0.7), S("d10") - 0.3, -13)
put(servo(2.4, 260, 200), S("d11") + 0.2, -12)
for d in (2.3, 3.2, 4.1, 5.2): put(tick(), S("d12") + d, -11)
# risk
put(whoosh(1.0, False), S("e1") - 0.6, -10)
for i in ("e2", "e3", "e4", "e5", "e6", "e7", "e8"): put(whoosh(0.5), S(i) - 0.25, -15)
put(servo(2.0, 240, 300), S("e2") + 0.2, -14)
put(buzz(), S("e2") + 2.4, -12)
put(rumble(4.0, 0.2, 0.3), S("e4"), -12)
put(wind(5.0), S("e6") + 2.5, -14)
put(splash(), S("e6") + 190 / 30 - 4 / 30, -11)
for k in range(3): put(tick(), S("e8") + (20 + k * 36) / 30 - 4 / 30, -14)
# payoff
put(whoosh(1.0), S("f1") - 0.6, -12)
put(ignite(3.0), S("f2") - 0.1, -3)
put(rumble(2.4, 0.5, 0.3), S("f2") + 2.6 - 1.0, -9)
put(clunk(0.9), S("f2") + 2.6 + 20 / 30, -6)
put(rumble(1.6, 0.3, 0.5, 900), S("f4"), -10)
put(ignite(1.4), S("f4") + 44 / 30, -9)
put(clunk(1.0), E("f4") + 6 / 30, -5)
put(whoosh(0.8), S("f5") - 0.3, -13)
# finale
put(whoosh(1.0), S("f6") - 0.4, -13)
for d in (4.2, 5.2, 6.1): put(tick(), S("f6") + d, -14)
put(servo(E("f7") - S("f7"), 150, 170), S("f7") + 0.6, -15)

# ---------- score ----------
t = np.arange(N) / SR
def note(f, a, b, g=1.0, at=1.5, rl=2.0, kind="pad"):
    i0, i1 = int(a * SR), min(N, int(b * SR))
    tt = t[i0:i1] - a
    if kind == "pad":
        x = sum(np.sin(2 * np.pi * f * d * tt + p) for d, p in ((1, 0), (1.003, 1), (0.997, 2), (2.0, 0.5))) / 4
    elif kind == "bass":
        x = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
    else:  # pluck
        x = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 3)
    return i0, x * env(len(tt), at, rl) * g
music = np.zeros((N, 2))
def add(i0, x, pan=0.0):
    music[i0:i0 + len(x), 0] += x * np.sqrt(0.5 * (1 - pan)); music[i0:i0 + len(x), 1] += x * np.sqrt(0.5 * (1 + pan))
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
# chord progressions per section (MIDI roots), minor-leaning tension, opening to major at the end
sections = [
    (0.0, FREEZE, [(38, [50, 53, 57]), (38, [50, 53, 58])], 0.9, "tension"),
    (S("h5") - 0.2, S("a1") - 0.4, [(41, [53, 57, 60]), (36, [52, 55, 60])], 0.7, "pulse"),
    (S("a1") - 0.4, S("b1") - 0.5, [(41, [57, 60, 65]), (43, [55, 59, 62]), (36, [55, 60, 64]), (45, [57, 60, 64])], 0.55, "light"),
    (S("b1") - 0.5, S("c1") - 0.6, [(38, [57, 62, 65]), (46, [58, 62, 65]), (41, [57, 60, 65]), (45, [57, 61, 64])], 0.6, "pulse"),
    (S("c1") - 0.6, S("c9") - 0.3, [(36, [60, 64, 67, 71]), (41, [60, 65, 69]), (43, [62, 67, 71]), (45, [60, 64, 69])], 0.55, "space"),
    (S("c9") - 0.3, S("d1") - 0.6, [(38, [57, 62, 65]), (34, [58, 62, 65]), (36, [55, 60, 64]), (33, [57, 61, 64])], 0.7, "pulse"),
    (S("d1") - 0.6, S("e1") - 0.6, [(43, [55, 59, 62]), (40, [55, 59, 64]), (36, [55, 60, 64]), (38, [57, 62, 66])], 0.6, "mech"),
    (S("e1") - 0.6, S("f1") - 0.6, [(38, [50, 53, 57]), (39, [51, 55, 58]), (38, [50, 53, 57]), (37, [49, 53, 56])], 0.65, "tension"),
    (S("f1") - 0.6, S("f6") - 0.4, [(38, [57, 62, 65]), (46, [58, 62, 65]), (48, [60, 64, 67]), (45, [57, 61, 64])], 0.85, "pulse"),
    (S("f6") - 0.4, TOTAL, [(41, [57, 60, 65]), (36, [55, 60, 64]), (38, [57, 62, 65]), (43, [55, 59, 62, 67])], 0.7, "resolve"),
]
for a, b, prog, g, mood in sections:
    L = b - a
    bar = 4.0 if mood in ("space", "resolve", "light") else 2.0
    nb = max(1, int(np.ceil(L / bar)))
    for k in range(nb):
        root, ch = prog[k % len(prog)]
        s0 = a + k * bar; s1 = min(b, s0 + bar + 0.6)
        if s1 - s0 < 0.3: continue
        i0, x = note(hz(root), s0, s1, 0.32 * g, 0.4, 0.6, "bass"); add(i0, x)
        for j, m in enumerate(ch):
            i0, x = note(hz(m), s0, s1, 0.12 * g, 0.8 if mood != "pulse" else 0.3, 0.7); add(i0, x, (j - 1) * 0.4)
        if mood in ("pulse", "mech", "tension"):
            step = 0.25 if mood != "tension" else 0.5
            for q in range(int(bar / step)):
                tq = s0 + q * step
                if tq >= b - 0.1: break
                i0, x = note(hz(ch[q % len(ch)] + 12), tq, min(b, tq + 0.4), (0.07 if mood != "tension" else 0.05) * g, 0.005, 0.3, "pluck"); add(i0, x, 0.5 if q % 2 else -0.5)
        if mood == "resolve" and k == nb - 1:
            pass
music = lp(music.T, 5200).T
# section crossfades: short gain envelope around section edges; silence at the hook freeze
g = np.ones(N)
fz0, fz1 = int(FREEZE * SR), int((S("h5") - 0.2) * SR)
g[fz0:fz1] = 0
music *= g[:, None]
# fade out at the end
fo = int((TOTAL - 3.0) * SR); music[fo:] *= np.linspace(1, 0, N - fo)[:, None]

# ---------- mix ----------
narr, nsr = sf.read(os.path.join(ROOT, "audio", "narration", "narration_review.wav"))
assert nsr == SR
narr = np.pad(narr, (0, max(0, N - len(narr))))[:N]
# speech envelope for ducking (smoothed)
envv = np.abs(narr)
k = int(0.25 * SR)
envv = np.convolve(envv, np.ones(k) / k, "same")
speak = np.clip(envv / 0.03, 0, 1)
duck_m = 10 ** ((-9 * speak) / 20)
duck_f = 10 ** ((-4 * speak) / 20)
music_db, sfx_db = -11.0, -3.0
mix = narr[:, None] * np.array([1.0, 1.0]) * 0.92 + music * duck_m[:, None] * 10 ** (music_db / 20) + sfx * duck_f[:, None] * 10 ** (sfx_db / 20)
meter = pyln.Meter(SR)
lufs0 = meter.integrated_loudness(mix)
mix *= 10 ** ((-15.0 - lufs0) / 20)
# look-ahead peak limiter: gain from a 6 ms max envelope, smoothed (no clipping)
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
ceil = 10 ** (-2.0 / 20)
w = int(0.006 * SR)
pk = maximum_filter1d(np.abs(mix).max(1), w)
gain = uniform_filter1d(minimum_filter1d(np.minimum(1.0, ceil / (pk + 1e-9)), 3 * w), w)
mix *= gain[:, None]
mix = np.clip(mix, -ceil, ceil)
os.makedirs(os.path.join(ROOT, "audio", "mix"), exist_ok=True)
sf.write(os.path.join(ROOT, "audio", "mix", "music.wav"), music / (np.abs(music).max() + 1e-9) * 0.5, SR, subtype="PCM_16")
sf.write(os.path.join(ROOT, "audio", "mix", "sfx.wav"), sfx / (np.abs(sfx).max() + 1e-9) * 0.5, SR, subtype="PCM_16")
sf.write(os.path.join(ROOT, "audio", "mix", "mix_review.wav"), mix, SR, subtype="PCM_16")
pub = os.path.join(ROOT, "source", "public", "audio"); os.makedirs(pub, exist_ok=True)
shutil.copy(os.path.join(ROOT, "audio", "mix", "mix_review.wav"), os.path.join(pub, "mix_review.wav"))
shutil.copy(os.path.join(ROOT, "audio", "narration", "narration_review.wav"), os.path.join(pub, "narration_review.wav"))
# measurements: loudness, peak, and voice-vs-bed level while speaking
lufs = meter.integrated_loudness(mix)
bed = music * duck_m[:, None] * 10 ** (music_db / 20) + sfx * duck_f[:, None] * 10 ** (sfx_db / 20)
spk = speak > 0.5
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
m = {"integrated_lufs": float(round(lufs, 2)), "sample_peak_dbfs": float(round(20 * np.log10(np.abs(mix).max()), 2)), "duration_s": round(N / SR, 3),
     "voice_minus_bed_db_while_speaking": float(round(rms(narr[spk]) - rms(bed[spk].mean(1)), 1)),
     "silent_stretches_over_1s": []}
fr = int(0.05 * SR); lv = np.array([rms(mix[i:i + fr].mean(1)) for i in range(0, N - fr, fr)])
quiet = lv < -55; run = 0
for i, q in enumerate(quiet):
    run = run + 1 if q else 0
    if run == 20: m["silent_stretches_over_1s"].append(float(round((i - 19) * 0.05, 2)))
json.dump(m, open(os.path.join(ROOT, "audio", "mix", "mix_measure.json"), "w"), indent=1)
print(m)
