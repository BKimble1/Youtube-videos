#!/usr/bin/env python3
"""(V4: tongue-driven footsteps and key ticks in the move demo, aim swishes, the earlier win, the loop glide) V2 music bed, effects and mix for the MouthPad Short (cues: audio/cues_v3.json from tools/export_cues_v2.ts). Everything is synthesised here (no samples, no third-party
music). The narration master is used sample for sample (gain, a gentle compressor and a limiter only).

Effects are placed on the picture's own events (audio/cues.json, exported from the TypeScript timeline by
tools/export_cues.ts), so a click, a shot or a splat lands on the frame where it is drawn:
  game:    paint-blaster "pew" on every shot, a wet splat on every hit, soft strafe swishes, orbs whooshing past,
           a tiny lock-on ping, Rex's lower shots, a victory jingle and the round-reset wipe
  device:  the tongue's click on every press (a crisp mouse click), a soft touch blip when the tongue meets the pad,
           a glint on the first look at the pad, W/A/D key ticks in the split screen, the exploded view's clack
  people:  Honest's beanbag slide-in, frantic controller mashing in the versus round, the controller dropping,
           the cursor and phone UI in the montage, a soft lip "mp" as the mouth closes
  camera:  air whooshes on the pushes into the mouth and the deliberate cuts
  punchline: on "SHUT" the music stops dead under a big splat impact, then returns for the loop
Music: 120 BPM, 16 bars = exactly 32.0 s, so the end flows into the start. Bright chiptune-pop (kick, clap, hats,
square bass, arpeggio), sidechained under the voice, filtered down for "But here's the craziest part".
Levels: voice about -16 LUFS; whole mix about -14 LUFS integrated; true peak <= -1.5 dBTP (4x oversampled).
usage: python3 tools/make_audio.py [mix_name]   (default mix_v1)"""
import json, os, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
NAME = sys.argv[1] if len(sys.argv) > 1 else 'mix_v4'
cj = json.load(open(os.path.join(EP, 'audio/cues_v4.json')))
DUR, T = cj['DUR'], cj['T']
N = int(round(DUR * SR))
tt = np.arange(N) / SR
rng = np.random.default_rng(2026)
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
def expd(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def place(buf, sig, at, name=None, gain_db=0.0):
    i = int(round(at * SR)); idx = (np.arange(len(sig)) + i) % N  # the film loops
    buf[idx] += sig * db(gain_db)
    if name: LOG.append({'t': round(at, 3), 'sfx': name, 'gain_db': gain_db})
def sweep_tone(f0, f1, dur, shape='sin'):
    n = int(dur * SR); f = np.geomspace(f0, f1, n); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if shape == 'sin' else np.sign(np.sin(ph)) * 0.6
def circ(f, x): return f(np.concatenate([x, x, x]))[2 * len(x):]

# ---------------- effect generators
def whoosh(dur=0.45, lo=300, hi=3000, up=True):
    n = int(dur * SR); x = noise(n); out = np.zeros(n); k = 8
    for j in range(k):
        a, b = j * n // k, (j + 1) * n // k
        u = (j + 0.5) / k if up else 1 - (j + 0.5) / k
        c = lo * (hi / lo) ** u
        out[a:b] = bp(x, c * 0.6, min(c * 1.6, 20000))[a:b]
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    return norm(out * e)
def click(f=3200):
    n = int(0.05 * SR)
    a = hp(noise(n), 2500) * expd(n, 0.0025)
    b = np.sin(2 * np.pi * f * np.arange(n) / SR) * expd(n, 0.006)
    s = a * 0.7 + b * 0.5
    s2 = np.zeros(n); d = int(0.009 * SR); s2[d:] = (hp(noise(n - d), 3000) * expd(n - d, 0.002)) * 0.5
    return norm(s + s2)
def pew():
    n = int(0.16 * SR)
    s = sweep_tone(1900, 320, 0.16) * expd(n, 0.06) + 0.25 * hp(noise(n), 2000) * expd(n, 0.015)
    return norm(s)
def splat(big=False):
    d = 0.5 if big else 0.32; n = int(d * SR)
    body = lp(noise(n), 1400) * expd(n, 0.07 if big else 0.05)
    bl = sweep_tone(520, 110, d) * expd(n, 0.09) * 0.8
    s = body + bl
    for k in range(5 if big else 3):  # droplets
        at = int((0.06 + 0.05 * k + rng.random() * 0.04) * SR)
        if at < n - 2000:
            m = n - at; s[at:] += 0.25 * np.sin(2 * np.pi * (900 + 500 * rng.random()) * np.arange(m) / SR) * expd(m, 0.012)
    return norm(s)
def blip(f=880, d=0.12, drop=0.7):
    n = int(d * SR); return norm(sweep_tone(f, f * drop, d) * expd(n, d / 3))
def chime(fs=(2350, 3520, 4700), d=0.7):
    n = int(d * SR); x = np.arange(n) / SR
    return norm(sum(np.sin(2 * np.pi * f * x) * np.exp(-x * (4 + i * 2)) / (i + 1) for i, f in enumerate(fs)))
def keytick():
    n = int(0.06 * SR); return norm(bp(noise(n), 1200, 5000) * expd(n, 0.008) + 0.4 * np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * expd(n, 0.01))
def thump(f0=110, f1=40, d=0.45):
    n = int(d * SR); return norm(sweep_tone(f0, f1, d) * expd(n, d / 3.5))
def fwump():
    n = int(0.35 * SR); return norm(lp(noise(n), 500) * expd(n, 0.07) + 0.6 * thump(90, 45, 0.35))
def mash(dur):
    n = int(dur * SR); s = np.zeros(n); x = 0.0
    while x < dur - 0.05:
        at = int(x * SR); m = int(0.03 * SR)
        s[at:at + m] += bp(noise(m), 1500, 6000) * expd(m, 0.004) * (0.6 + 0.4 * rng.random())
        x += 0.045 + 0.04 * rng.random()
    return s / (np.max(np.abs(s)) + 1e-9)
def clatter():
    s = np.zeros(int(0.7 * SR))
    for k, (at, g) in enumerate([(0.0, 1.0), (0.14, 0.6), (0.24, 0.35), (0.31, 0.2)]):
        n = int(0.08 * SR); i = int(at * SR)
        s[i:i + n] += g * (bp(noise(n), 700, 4000) * expd(n, 0.012) + 0.6 * np.sin(2 * np.pi * (500 + 120 * k) * np.arange(n) / SR) * expd(n, 0.02))
    return norm(s)
def jingle():
    notes = [523.25, 659.25, 783.99, 1046.5]; s = np.zeros(int(0.9 * SR))
    for k, f in enumerate(notes):
        n = int((0.35 if k == 3 else 0.12) * SR); i = int(k * 0.09 * SR); x = np.arange(n) / SR
        w = (np.sign(np.sin(2 * np.pi * f * x)) * 0.35 + np.sin(2 * np.pi * f * x) * 0.65) * np.exp(-x * (5 if k == 3 else 14))
        s[i:i + n] += w
    return norm(lp(s, 6000))
def lip_mp():
    n = int(0.09 * SR); return norm(lp(noise(n), 900) * expd(n, 0.012) + 0.5 * sweep_tone(160, 90, 0.09) * expd(n, 0.02))
def ring2():
    s = np.zeros(int(0.35 * SR))
    for k in range(2):
        n = int(0.11 * SR); i = int(k * 0.16 * SR); x = np.arange(n) / SR
        s[i:i + n] += np.sin(2 * np.pi * 1320 * x) * env(n, 0.005, 0.03)
    return norm(s)

sfx = np.zeros(N)
E = cj['ev']
def wah(d=0.7, f0=330, f1=150):
    n = int(d * SR); x = np.arange(n) / SR
    f = np.geomspace(f0, f1, n); ph = 2 * np.pi * np.cumsum(f) / SR
    w = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * (0.5 + 0.5 * np.sin(2 * np.pi * 5.5 * x)) * env(n, 0.04, 0.25)
    return norm(lp(w, 1800))
def whine(d=0.3):
    n = int(d * SR); return norm(sweep_tone(600, 2400, d) * np.linspace(0.2, 1, n) * env(n, 0.02, 0.03))
def pops(k=8):
    s_ = np.zeros(int(0.7 * SR))
    for i in range(k):
        n = int(0.04 * SR); at = int((0.02 + i * 0.07 + rng.random() * 0.03) * SR)
        s_[at:at + n] += bp(noise(n), 1500, 7000) * expd(n, 0.006) * (0.5 + 0.5 * rng.random())
    return norm(s_)
# ---- the game: every shot, hit, dodge and lock-on that is on screen
for k, f in enumerate(cj['fires']):
    place(sfx, pew(), f['t'], 'blaster', -12 if f['rex'] else -9)
    place(sfx, splat(f['big'] and not f['rex']), f['hit'], 'splat (goo, Rex)' if f['rex'] else ('splat (big)' if f['big'] else 'splat'), -8 if f['rex'] else (-7 if f['big'] else -9))
for s_ in cj['strafes']:
    place(sfx, whoosh(min(0.35, s_['dur'] + 0.08), 500, 2600), s_['t'], 'dodge swish', -13)
for l in cj['locks']:
    place(sfx, blip(1760, 0.08, 1.0), l, 'lock-on ping', -18)
for r in cj['rexFires']:
    place(sfx, blip(420, 0.13, 0.6), r, 'rex shot', -14)
    place(sfx, whoosh(0.3, 400, 2200), r + 0.3, 'orb whoosh past', -16)
place(sfx, whoosh(0.35, 400, 2400), 0.05, 'orb whoosh past (opening dodge)', -10)
for k in range(3):
    place(sfx, whoosh(0.25, 500, 2600), T['watch'] + 0.05 + 0.14 * k, 'orb whoosh past (weave)', -14)
# ---- the decisive win: charge, K.O., Rex pops into confetti, victory hop and jingle (in the pause before "With")
place(sfx, whine(0.3), E['chargeFrom'], 'blaster charging', -14)
place(sfx, thump(140, 50, 0.4), E['koHit'], 'K.O. impact (ducked under "sitting")', -6)
place(sfx, pops(8), E['confetti'], 'confetti bursts', -8)
place(sfx, blip(880, 0.18, 1.6), E['hop'] + 0.05, 'victory hop', -12)
place(sfx, chime((1568, 2093, 2637), 0.5), E['win'] + 0.04, 'trophy pops up', -13)
place(sfx, jingle(), E['koPop'] + 0.1, 'victory jingle', -7)
# ---- the opponent's realization
place(sfx, wah(0.75), E['eyesToWinner'], 'sad wah: he realizes', -12)
place(sfx, thump(110, 45, 0.35), E['padThud'], 'controller thuds on the floor', -9)
place(sfx, chime((2637, 3520), 0.5), E['smug'], 'smug smile chime (after "SHUT")', -17)
place(sfx, whoosh(0.95, 250, 2200), E['loopCut'] + 0.02, 'camera glides back into the opening composition', -17)
# ---- the device: tongue contact and clicks, the reticle, the lift, the sensor
place(sfx, whoosh(0.45, 600, 3200), E['reticleLaunch'], 'reticle flies off the screen', -10)
place(sfx, blip(1760, 0.1, 1.0), E['reticleLock'], 'reticle locks on the pad', -9)
place(sfx, blip(1320, 0.07, 1.0), E['reticleLock'] + 0.08, 'reticle lock (2)', -11)
place(sfx, click(3400), E['tap'], 'tongue tap (contact)', -5)
place(sfx, click(3000), E['click'] - 0.01, 'tongue press: CLICK', -4)
place(sfx, blip(990, 0.1, 0.9), E['tongueTouchRoof'], 'tongue touches the pad', -10)
for p_ in [cj['fires'][2]['t'] - 0.05, cj['fires'][3]['t'] - 0.05, cj['fires'][4]['t'] - 0.05]:
    place(sfx, click(3200), p_, 'tongue click', -11)
place(sfx, whoosh(0.5, 300, 2400), E['lift'], 'retainer lifts out', -13)
place(sfx, chime((1760, 2640, 3520), 0.8), E['lift'] + 0.25, 'product reveal shimmer', -18)
place(sfx, chime((2637, 3951), 0.6), E['sensorGlint'], 'sensor glint', -11)
place(sfx, blip(1200, 0.25, 1.4), E['sensorRipple'], 'sensor ripple', -15)
place(sfx, whoosh(0.55, 300, 2000, up=False), E['flyIn'], 'device flies back in', -15)
for k_ in cj['keyOn']:
    place(sfx, keytick(), k_['t'], f"key {k_['k']} (tongue)", -7)
def step():
    n = int(0.05 * SR); return norm(bp(noise(n), 300, 1800) * expd(n, 0.012))
for s_ in cj['steps']:
    place(sfx, step(), s_, 'Zip footstep (runs with the tongue)', -19)
place(sfx, whoosh(0.3, 600, 2600, up=False), E['aimLeft'], 'aim swings left with the head', -17)
place(sfx, whoosh(0.3, 600, 2600), E['aimRight'], 'aim swings right with the head', -17)
place(sfx, lip_mp(), E['lipsClose'], 'lips close', -6)
# ---- people
place(sfx, whoosh(0.45, 200, 1500), E['honestIn'], 'Honest leans in', -12)
place(sfx, click(2600), E['click1'], 'cursor click', -9)
place(sfx, blip(660, 0.15, 1.5), E['click1'] + 0.06, 'photo opens', -14)
place(sfx, click(2600), E['click2'], 'cursor click', -9)
place(sfx, whoosh(0.25, 800, 5000), E['swipe'], 'phone swipe', -12)
place(sfx, ring2(), E['swipe'] + 0.18, 'call rings', -16)
place(sfx, blip(1320, 0.12, 1.3), E['answer'], 'call answered', -11)
place(sfx, mash(E['koHit'] - E['mashFrom']), E['mashFrom'], 'controller mashing', -11)
for c in cj['cuts'][1:]:
    place(sfx, whoosh(0.2, 900, 4500), c['t'] - 0.1, f"cut: {c['name'][:24]}", -21)

# ---------------- music: 120 BPM, 16 bars (64 beats) = 32.0 s
BEATS = 64; BEAT = DUR / BEATS; BPM = 60 / BEAT  # 16 bars exactly the film length, so the bed loops
mus_d = np.zeros(N); mus_b = np.zeros(N); mus_m = np.zeros(N)
def at_beat(b): return b * BEAT
CH = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]  # Am F C G (MIDI)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
kick = thump(150, 45, 0.28)
clap = norm(bp(noise(int(0.12 * SR)), 900, 5000) * expd(int(0.12 * SR), 0.03))
hat = norm(hp(noise(int(0.035 * SR)), 7000) * expd(int(0.035 * SR), 0.008))
for b in range(BEATS):
    place(mus_d, kick, at_beat(b), None, -2)
    if b % 2 == 1: place(mus_d, clap, at_beat(b), None, -7)
    for h in range(2): place(mus_d, hat, at_beat(b + h * 0.5), None, -15 if h == 0 else -12)
for bar in range(16):
    root, triad = CH[bar % 4]
    for e in range(8):  # bass: 8th-note pulses, octave on the off-beats
        f = mtof(root - 24 + (12 if e % 2 else 0)); n = int(BEAT / 2 * SR * 0.85); x = np.arange(n) / SR
        w = lp(np.sign(np.sin(2 * np.pi * f * x)) * 0.5 + np.sin(2 * np.pi * f * x) * 0.5, 900) * env(n, 0.004, 0.04)
        place(mus_b, w, at_beat(bar * 4 + e * 0.5))
    for s16 in range(16):  # arpeggio: 16ths through the chord, an octave up
        m = triad[s16 % 3] + 12 + (12 if s16 % 8 >= 6 else 0); f = mtof(m); n = int(BEAT / 4 * SR); x = np.arange(n) / SR
        w = (np.abs(((x * f) % 1) - 0.5) * 4 - 1) * np.exp(-x * 18)
        place(mus_m, w, at_beat(bar * 4 + s16 * 0.25), None, -6)
mus_d, mus_b, mus_m = norm(mus_d), norm(mus_b), norm(mus_m)
music = mus_d * db(-1) + mus_b * db(-4) + mus_m * db(-9)
# the twist: filter down on "But here's the craziest part", back up on "Close your mouth"
filt = circ(lambda x: lp(x, 700), music)
w = np.clip((tt - (T['but'] - 0.1)) / 0.25, 0, 1) * (1 - np.clip((tt - (T['close'] - 0.05)) / 0.12, 0, 1))
music = music * (1 - w) + filt * w * 1.2
# the punchline: the music stops dead on "SHUT" and comes back for the loop
filt2 = circ(lambda x: lp(x, 500), music)
w2 = np.clip((tt - (cj['ev']['koPop'] + 0.35)) / 0.2, 0, 1) * (1 - np.clip((tt - (cj['ev']['loopCut'] - 0.1)) / 0.15, 0, 1))
music = music * (1 - w2) + filt2 * w2 * 1.1

# ---------------- voice and mix
v, vsr = sf.read(os.path.join(EP, 'audio/narration/FGW_MouthPad_narration_V2.wav'))
if v.ndim > 1: v = v.mean(1)
assert vsr == SR and len(v) == N, (vsr, len(v), N)
meter = pyln.Meter(SR)
def compress(x, thr_db=-20.0, ratio=2.5, att=0.004, rel=0.09):
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = 0.0; envl = np.empty(len(x)); ax = np.abs(x)
    for i in range(len(x)):
        c = a_a if ax[i] > e else a_r
        e = c * e + (1 - c) * ax[i]; envl[i] = e
    lev = 20 * np.log10(envl + 1e-9)
    gr = np.minimum(0, (thr_db - lev) * (1 - 1 / ratio))
    return x * db(gr), float(gr.min())
def limit(x, ceil_db, look=0.004, rel=0.06):
    from scipy.ndimage import minimum_filter1d
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
venv = lp(np.abs(voice), 8); venv = venv / (venv.max() + 1e-9)
# look-ahead: the ducking starts 60 ms before each word and releases 80 ms after it
from scipy.ndimage import maximum_filter1d
vact = np.clip(venv * 4, 0, 1)
vact = maximum_filter1d(np.roll(vact, -int(0.06 * SR)), size=int(0.14 * SR))
vact = lp(vact, 30)
duck = 1 - 0.75 * vact
sfx_n = sfx / (np.max(np.abs(sfx)) + 1e-9)
# effects: their own limiter so a splat never masks a word; they dip a little under speech
sfx_l = limit(sfx_n * db(-6), -10.0)
sfx_d = sfx_l * (1 - 0.9 * vact)
mus_n = norm(music)
SFX_DB, MUS_DB = float(os.environ.get('SFX_DB', '9')), float(os.environ.get('MUS_DB', '-10'))
mix = voice + sfx_d * db(SFX_DB) + db(MUS_DB) * mus_n * duck
peak = np.max(np.abs(resample_poly(mix, 4, 1)))
lufs = meter.integrated_loudness(np.stack([mix, mix], 1))
g = min(db(-14.0 - lufs), db(-1.6 + 3.0) / peak)  # up to 3 dB of peak limiting on the final limiter
mix *= g
mix = limit(mix, -1.6)
nr = int(0.004 * SR)
step = (mix[0] - (mix[1] - mix[0])) - mix[-1]
mix[-nr:] += step * np.linspace(0, 1, nr) ** 2
mix2 = np.stack([mix, mix], 1)
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
os.makedirs(os.path.join(EP, 'audio/mix/stems'), exist_ok=True)
sf.write(os.path.join(EP, f'source/public/audio/{NAME}.wav'), mix2, SR, subtype='PCM_24')
sf.write(os.path.join(EP, f'audio/mix/FGW_MouthPad_{NAME.upper()}.wav'), mix2, SR, subtype='PCM_24')
stems = {'voice': voice * g, 'sfx': sfx_d * db(SFX_DB) * g, 'music': db(MUS_DB) * mus_n * duck * g}
for nm, x in stems.items():
    sf.write(os.path.join(EP, f'audio/mix/stems/{NAME}_{nm}.wav'), x, SR, subtype='PCM_24')
tp = 20 * np.log10(np.max(np.abs(resample_poly(mix, 4, 1))) + 1e-12)
def lufs_of(x):
    try: return round(meter.integrated_loudness(x), 2)
    except Exception: return None
# masking check: in every 50 ms window where the voice is speaking, how far below the voice are the effects + music?
win = int(0.05 * SR); nw = N // win
def rms(x): return np.sqrt((x[:nw * win].reshape(nw, win) ** 2).mean(1)) + 1e-9
vr, br = rms(stems['voice']), rms(stems['sfx'] + stems['music'])
speaking = vr > db(-28)
margin = 20 * np.log10(vr[speaking] / br[speaking])
res = {'integrated_lufs': round(meter.integrated_loudness(mix2), 2), 'true_peak_dbtp_4x': round(tp, 2), 'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mix))), 2),
       'voice_gain_db': round(vg + 20 * np.log10(g), 2), 'voice_max_gain_reduction_db': round(grmin, 2), 'duration_s': DUR, 'effects': len(LOG),
       'voice_lufs_in_mix': lufs_of(stems['voice']), 'sfx_lufs_in_mix': lufs_of(stems['sfx']), 'music_lufs_in_mix': lufs_of(stems['music']),
       'voice_over_bed_margin_db_while_speaking': {'min': round(float(margin.min()), 1), 'p5': round(float(np.percentile(margin, 5)), 1), 'median': round(float(np.median(margin)), 1)},
       'worst_masking_windows_s': [round(float(i * 0.05), 2) for i in np.where(speaking)[0][np.argsort(margin)[:6]]],
       'music_bpm': BPM, 'music_beats': BEATS, 'loop_seam_jump': round(float(abs(mix[0] - mix[-1])), 4)}
json.dump(res, open(os.path.join(EP, f'audio/mix/mix_measure_{NAME}.json'), 'w'), indent=1)
json.dump(LOG, open(os.path.join(EP, f'audio/sfx_log_{NAME}.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
