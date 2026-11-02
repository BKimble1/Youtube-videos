#!/usr/bin/env python3
"""V3 sound design and mix for "This Time Machine Actually Works". Everything is synthesised here (no samples, no
third-party music). The narration master is V1's, used sample for sample (gain, a gentle compressor and a limiter).
Event times come from source/src/v3/cues.json (exported from v3/timing.ts and v3/story.ts by tools/export_cues_v3.ts),
so sound and picture share one timeline.

Restrained, action-led details, one connected journey:
  space (frame 0 and the loop tail): the black hole's low rumble and the capsule's steady engine; both run across the
        loop seam (they start at the loop cut and wrap into frame 0); an air rush as the camera passes the window;
  cockpit: cabin hum; his watch ticks (4 beats a second); through the time-compressed hour the ticks run together into
        a fine whirr and land on a clear tick at "hour"; suit fabric as the wrist rises;
  home clock: a deeper wooden tick-tock that races (years); a warm room; soft air on the cut through the window;
  garden: wind and a few birds while the seasons turn;
  return: the capsule's retro roar as it descends, the landing contact and dust, the hatch release and clunk, his boots
        on the pavement; a sleeve as he recognises his friend;
  the way in: hurried footsteps up the path, the door;
  family room: quiet. Room tone, footsteps on wood, the home clock at normal time, his friend's steps in the doorway,
        fabric as the wrist rises, his watch's light tick against the slow home clock (one hour against years), then a
        gentle swell into the watch face that hands over to the black hole's rumble (loop).
Music: a quiet minor pad (no beat), each tone completing whole cycles over the film so the end continues into the start.
Levels: voice about -16 LUFS; whole about -14 LUFS integrated; true peak below -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio_v3.py [mix_name]   (default mix_v3)"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
from scipy.ndimage import minimum_filter1d

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v3'
TL = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
CJ = json.load(open(os.path.join(EP, 'source/src/v3/cues.json')))
EV = CJ['EV']               # named event times (s)
PAN = CJ.get('pan', {})     # named pan tracks: {"capsule": [[t, pan(-1..1)], ...]}
DUR = TL['duration']
N = int(round(DUR * SR))
t = np.arange(N) / SR
rng = np.random.default_rng(3611)
LOG = []

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
def win(a, b, fa=0.1, fb=0.1): return np.clip(np.minimum((t - (a - fa)) / fa, ((b + fb) - t) / fb), 0, 1)
def loopf(f): return round(f * DUR) / DUR

L_, R_ = np.zeros(N), np.zeros(N)
def place(sig, at, name=None, gain_db=0.0, pan=0.0, wrap=False, pan_track=None):
    """stereo placement with constant-power pan; pan_track = name of a pan curve (time-varying)"""
    i = int(round(at * SR)); idx = np.arange(len(sig)) + i
    if wrap: idx = idx % N
    m = (idx >= 0) & (idx < N)
    s = sig[m] * db(gain_db)
    if pan_track and pan_track in PAN:
        pts = np.array(PAN[pan_track]); p = np.interp(idx[m] / SR, pts[:, 0], pts[:, 1])
    else:
        p = np.full(m.sum(), pan)
    th = (p + 1) * np.pi / 4
    np.add.at(L_, idx[m], s * np.cos(th)); np.add.at(R_, idx[m], s * np.sin(th))
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})

# ---------------- generators
def swell(dur=1.6, f0=180):
    """a soft temporal swell: rising filtered air with a slow detuned glide and a faint shimmer"""
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    air = bp(noise(n), 300, 2200) * (np.sin(np.pi * u) ** 1.5)
    f = f0 * (1 - 0.35 * u)
    ph = 2 * np.pi * np.cumsum(f) / SR
    glide = (np.sin(ph) + np.sin(ph * 1.006) + 0.5 * np.sin(ph * 1.5)) * np.sin(np.pi * u) ** 2
    sh = sum(np.sin(2 * np.pi * np.cumsum(np.full(n, 3200 * (1 + 0.003 * k))) / SR + k) for k in range(3)) * np.sin(np.pi * u) ** 3
    return norm(0.6 * norm(air) + 0.5 * norm(glide) + 0.08 * norm(sh))
def rumble(dur, f=31.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) + 0.7 * np.sin(2 * np.pi * (f * 1.5 + 0.4) * tt) + 0.5 * np.sin(2 * np.pi * (f * 2.01) * tt)
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.35 * tt)
    return norm(lp(x + 0.6 * lp(noise(n), 160), 220)) * env(n, 0.05, 0.5)
def tick(dur=0.025, f=3800, bright=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(hp(noise(n), 2500) * np.exp(-tt / 0.0012) * bright + 0.35 * np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.003))
def tock(f=900, dur=0.07):
    """a wooden wall-clock tock: a low knock with a short resonance"""
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.012) + 0.5 * np.sin(2 * np.pi * f * 2.3 * tt) * np.exp(-tt / 0.006) + 0.4 * bp(noise(n), 400, 3000) * np.exp(-tt / 0.004))
def whoosh(dur, lo=200, hi=1800, up=True):
    n = int(dur * SR); u = np.arange(n) / n
    x = noise(n); out = np.zeros(n); seg = 2400
    for k in range(0, n, seg):
        c = lo + (hi - lo) * (u[k] if up else 1 - u[k])
        out[k:k + seg] = bp(x[k:k + seg + 1200], c * 0.6, c * 1.4)[:len(out[k:k + seg])]
    return norm(out) * np.sin(np.pi * u) ** 1.6
def engine(dur):
    n = int(dur * SR); tt = np.arange(n) / SR; u = tt / dur
    f = 62 + 30 * np.sin(np.pi * u)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) + 0.7 * bp(noise(n), 250, 1600)
    return norm(lp(x, 2400)) * np.sin(np.pi * u) ** 1.2
def roar(dur):
    n = int(dur * SR); u = np.arange(n) / n
    x = lp(noise(n), 900) + 0.5 * bp(noise(n), 900, 3000) * u
    return norm(x) * (0.25 + 0.75 * u) * env(n, 0.2, 0.08)
def thud(f0=80, f1=38, dur=0.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, n)) / SR) * np.exp(-tt / 0.16) + 0.3 * lp(noise(n), 500) * np.exp(-tt / 0.05))
def hiss(dur, lo=2500, hi=9000):
    n = int(dur * SR); return norm(bp(noise(n), lo, hi)) * env(n, 0.02, dur * 0.7)
def step(bright=0.6, wood=False):
    n = int(0.12 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (140 if wood else 90) * tt) * np.exp(-tt / 0.03)
    return norm(body * 0.7 + bp(noise(n), 300, 3000 if wood else 2000) * np.exp(-tt / 0.012) * bright)
def fabric(dur=0.35):
    n = int(dur * SR); return norm(bp(noise(n), 600, 4000) * (0.6 + 0.4 * np.sin(np.linspace(0, 9, n)) ** 2)) * env(n, dur * 0.3, dur * 0.5)
def creak(dur=0.45, f=210):
    n = int(dur * SR); tt = np.arange(n) / SR
    ph = np.cumsum(55 * (1 + 0.4 * np.sin(2 * np.pi * 2 * tt)) / SR)
    p = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    return norm(bp(np.convolve(p, np.sin(2 * np.pi * f * np.arange(900) / SR) * np.exp(-np.arange(900) / SR / 0.004), 'same'), 120, 2500)) * env(n, 0.1, 0.2)
def chirp():
    n = int(0.14 * SR); tt = np.arange(n) / SR
    f = 3200 + 1600 * np.sin(np.pi * tt / 0.14) + 300 * np.sin(2 * np.pi * 30 * tt)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * tt / 0.14) ** 2
def glass(f, dur=1.2):
    n = int(dur * SR); tt = np.arange(n) / SR
    return norm(np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.3)) * np.exp(-tt / (dur * 0.4)) * env(n, 0.01, 0.2)
def brush(dur=0.45):
    """a glove brushing dust off a frame: soft, dry, mid-high"""
    n = int(dur * SR); u = np.arange(n) / n
    return norm(bp(noise(n), 1800, 7000) * np.sin(np.pi * u) ** 0.8 * (0.7 + 0.3 * np.sin(2 * np.pi * 11 * u)))

def engine_bed(dur):
    """the capsule's steady engine (no pass envelope: it runs across the loop seam)"""
    n = int(dur * SR); tt = np.arange(n) / SR
    f = 64 + 3 * np.sin(2 * np.pi * 0.4 * tt)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) + 0.7 * bp(noise(n), 250, 1600)
    return norm(lp(x, 2000)) * env(n, 0.05, 0.4)

e = EV
tail = DUR - e['loopCut']          # the loop tail (space again) before the seam
# ---- space: rumble and engine start at the loop cut and wrap through frame 0 into the window push
place(rumble(tail + e['windowIn'] + 0.4), e['loopCut'], 'black hole rumble (loop cut -> frame 0 -> window)', -7.0, wrap=True)
place(engine_bed(tail + e['windowIn'] + 0.2), e['loopCut'], 'capsule engine (steady, across the seam)', -15.0, pan=0.25, wrap=True)
place(whoosh(0.55, 400, 2000), e['windowIn'] - 0.5, 'through the cockpit window', -17.0)
# ---- cockpit: his watch, the time-compressed hour
cab = lp(hp(noise(N), 50), 300) * win(e['windowIn'], e['match'], 0.15, 0.05)
tk = e['glance'] + 0.05; k = 0
while tk < e['match'] - 0.02:
    if e['hourStart'] < tk < e['hourEnd']:
        u = (tk - e['hourStart']) / (e['hourEnd'] - e['hourStart'])
        dt = 0.25 / (1 + 14 * np.sin(np.pi * u) ** 2)
    else:
        dt = 0.25
    place(tick(bright=1.0 if k % 4 == 0 else 0.55), tk, 'watch tick' if k == 0 else None, -19.0 if k % 4 == 0 else -24.0, pan=-0.1)
    tk += dt; k += 1
whirr = bp(noise(N), 3000, 8000) * np.clip(np.sin(np.pi * np.clip((t - e['hourStart']) / (e['hourEnd'] - e['hourStart']), 0, 1)), 0, 1) ** 2
place(tick(0.03, 3600, 1.2), e['hourEnd'], 'the hour lands', -15.0, pan=-0.1)
place(fabric(0.45), e['raise'], 'wrist rises', -24.0, pan=-0.2)
# ---- home clock: years
tc = e['match']; k = 0
while tc < e['windowMatch']:
    u = (tc - e['match']) / (e['windowMatch'] - e['match'])
    place(tock(900 if k % 2 == 0 else 760), tc, 'home clock racing' if k == 0 else None, -20.0 - 4 * u, pan=0.15)
    tc += 0.5 / (1 + 10 * min(1.0, u * 3)); k += 1
room_past = lp(hp(noise(N), 90), 700) * win(e['match'], e['windowMatch'], 0.05, 0.15)
place(whoosh(0.5, 300, 1200), e['windowMatch'] - 0.3, 'through the window (inside -> outside)', -21.0)
# ---- garden: the years
for k2 in range(14):
    at = e['windowMatch'] + 0.1 + k2 * 0.15 + rng.random() * 0.06
    if at < e['descent'] - 0.2: place(chirp(), at, 'birds' if k2 == 0 else None, -32.0 + 4 * rng.random(), pan=rng.uniform(-0.6, 0.6))
wind = bp(noise(N), 250, 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t)) * win(e['windowMatch'], e['inside'], 0.3, 0.2)
# ---- return
place(roar(e['landing'] - e['descent']), e['descent'], 'capsule retro roar', -11.0, pan=-0.1)
place(thud(), e['landing'], 'landing contact', -7.0, pan=-0.1)
place(hiss(0.6, 1500, 6000), e['landing'] + 0.02, 'landing dust', -19.0, pan=-0.1)
place(hiss(0.3), e['hatch'], 'hatch release', -21.0, pan=-0.15)
place(thud(260, 140, 0.15), e['hatch'] + 0.2, 'hatch clunk', -19.0, pan=-0.15)
for k2, at in enumerate(e['astroSteps']): place(step(0.6), at, 'boots on the pavement' if k2 == 0 else None, -21.0, pan=-0.1)
place(fabric(0.3), e['recognise'], 'sleeve (recognition)', -27.0)
# ---- the way in
for k2, at in enumerate(e['doorSteps']): place(step(0.6), at, 'footsteps up the path' if k2 == 0 else None, -21.0, pan=0.1)
place(creak(0.3, 420), e['gate'], 'garden gate', -25.0, pan=0.05)
place(creak(0.45, 200), e['doorOpen'], 'front door', -21.0, pan=0.1)
# ---- family room: quiet
room = lp(hp(noise(N), 80), 600) * win(e['inside'], e['loopCut'], 0.15, 0.05)
for k2, at in enumerate(e['roomSteps']): place(step(0.5, wood=True), at, 'footsteps on wood' if k2 == 0 else None, -24.0 - 1.5 * k2, pan=0.2)
tc = e['inside'] + 0.4; k = 0
while tc < e['loopCut'] - 0.05:
    place(tock(820 if k % 2 == 0 else 700, 0.05), tc, 'home clock (normal time)' if k == 0 else None, -31.0, pan=-0.25)
    tc += 1.0; k += 1
for k2, at in enumerate(e['friendSteps']): place(step(0.4, wood=True), at, "his friend's steps in the doorway" if k2 == 0 else None, -27.0, pan=0.35)
place(fabric(0.4), e['watchUp'], 'wrist rises (the room)', -25.0, pan=-0.1)
k = 0; tk = e['watchUp'] + 0.35
while tk < e['loopCut'] - 0.02:
    place(tick(bright=1.0 if k % 4 == 0 else 0.55), tk, 'his watch (one hour) against the home clock' if k == 0 else None, -24.0 if k % 4 == 0 else -29.0, pan=-0.1)
    tk += 0.25; k += 1
place(swell(1.0, 200), e['loopPush'] - 0.3, 'into the watch face (to the opening)', -15.0)

# ---------------- music: a quiet minor pad, tones tuned to whole cycles over the film
def pad(freqs):
    x = np.zeros(N)
    for f in freqs:
        x += np.sin(2 * np.pi * loopf(f) * t) + 0.25 * np.sin(2 * np.pi * loopf(f * 2.0) * t + 0.4)
    return x
dm = pad([73.42, 110.0, 174.61, 220.0]); bb = pad([58.27, 116.54, 174.61, 233.08]); gm = pad([98.0, 146.83, 233.08])
mus = dm * np.clip(win(-1, e['match']) + win(e['loopPush'] - 0.3, DUR + 1), 0, 1) + bb * win(e['match'], e['inside']) + gm * win(e['inside'], e['loopPush'] - 0.3) * 0.5
mus = lp(mus * (0.75 + 0.25 * np.sin(2 * np.pi * loopf(0.21) * t)), 1800)
mus *= 1 - 0.75 * win(e['inside'] + 0.3, e['friendIn'] - 0.4, 0.5, 0.6)

amb = db(-33) * norm(cab) + db(-44) * norm(whirr) + db(-36) * norm(room_past) + db(-37) * norm(wind) + db(-41) * norm(room)
L_ += amb; R_ += amb
# the family photograph: everything else drops back so the moment lands
quiet = 1 - 0.5 * win(e['inside'] + 0.4, e['toFace'], 0.4, 0.4)
L_ *= quiet; R_ *= quiet

v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_TimeMachine_narration_V1.wav'))
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=3.0, att=0.004, rel=0.09):
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    ee = 0.0; envl = np.empty(len(x)); ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > ee else a_r
        ee = c * ee + (1 - c) * ax[i]; envl[i] = ee
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
fxd = 1 - 0.3 * np.clip(venv * 3, 0, 1)
musn = db(-31) * norm(mus) * duck
mixL = voice + db(-3) * L_ * fxd + musn
mixR = voice + db(-3) * R_ * fxd + musn
st = np.stack([mixL, mixR], 1)
peak = np.max(np.abs(resample_poly(st, 4, 1, axis=0)))
lufs = meter.integrated_loudness(st)
g = min(db(-14.0 - lufs), db(-1.6 + 2.5) / peak)  # up to 2.5 dB of brick-wall limiting on the loudest transient
st *= g
st[:, 0] = limit(st[:, 0], -2.0); st[:, 1] = limit(st[:, 1], -2.0)  # sample ceiling a little under the -1.6 dBTP target (inter-sample overs)
nr = int(0.004 * SR)
for c in range(2):
    stepv = (st[0, c] - (st[1, c] - st[0, c])) - st[-1, c]
    st[-nr:, c] += stepv * np.linspace(0, 1, nr) ** 2
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), st, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_TimeMachine_{NAME.upper()}.wav'), st, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(st, 4, 1, axis=0))) + 1e-12)
room_win = (int((e['inside'] + 0.6) * SR), int((e['toFace'] - 0.2) * SR))
fx_only = np.stack([L_, R_], 1) * db(-3) * g
res = {'integrated_lufs': round(meter.integrated_loudness(st), 2), 'true_peak_dbtp_4x': round(tp, 2),
       'voice_lufs_in_mix': round(meter.integrated_loudness(np.stack([voice, voice], 1) * g), 2), 'voice_max_gain_reduction_db': round(grmin, 2),
       'family_room_effects_lufs': round(meter.integrated_loudness(fx_only[room_win[0]:room_win[1]]), 2),
       'effects': len(LOG), 'duration_s': DUR, 'loop_seam_jump': round(float(np.abs(st[0] - st[-1]).max()), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
