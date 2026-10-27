#!/usr/bin/env python3
"""The V1 mix: the final narration, an original synthesized music bed, synthesized electronic tones, and five
ElevenLabs sound effects (audio/sfx/el_*.mp3, generated for this film). Cue times are taken from the measured word
timeline (audio/narration/words_final.json) with the same beat offsets the picture uses (source/src/scenes/*.tsx).

Loop: the music is written in exactly 16 bars of the film's length (64 beats in DUR s, about 105.3 bpm) and every
music note and effect is mixed into a circular buffer (anything that rings past the last frame continues at frame 0),
so the end of the film runs into its start without a jump or click. The narration is not circular.

Outputs: audio/mix/FGW_WiFi_Walls_V1_mix.wav (48 kHz/24-bit stereo), source/public/audio/mix.wav, audio/cues.json,
audio/mix/mix_measure.json.
usage: python3 -I tools/make_audio.py"""
import json, os, subprocess
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
WF = json.load(open(os.path.join(EP, 'audio/narration/words_final.json')))
DUR = WF['duration_s']
N = int(round(DUR * SR))
WORDS = WF['words']


def w(word, n=0):
    return [x for x in WORDS if x['word'] == word][n]['start']


rng = np.random.default_rng(7)


def load(name, a=None, b=None):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, 'audio/sfx', name), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32).astype(np.float64)
    if a is not None:
        y = y[int(a * SR):int(b * SR)].copy()
        f = int(0.006 * SR)
        y[:f] *= np.linspace(0, 1, f)
        y[-f * 4:] *= np.linspace(1, 0, f * 4)
    return y


def env_adsr(n, a=0.005, d=0.1, s=0.0, r=0.05):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    dec = np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
    e = e * (s + (1 - s) * dec)
    rel = np.clip((t[-1] - t) / max(r, 1e-4), 0, 1)
    return e * rel


def lp_fast(y, fc):
    # FFT brick-ish low-pass with a soft knee (fast, for long buffers)
    Y = np.fft.rfft(y)
    f = np.fft.rfftfreq(len(y), 1 / SR)
    Y *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(Y, len(y))


def hp_fast(y, fc):
    Y = np.fft.rfft(y)
    f = np.fft.rfftfreq(len(y), 1 / SR)
    Y *= (f / fc) ** 2 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(Y, len(y))


class Bus:
    def __init__(self, circular=True):
        self.y = np.zeros(N)
        self.circ = circular

    def add(self, t, sig, gain=1.0):
        i0 = int(round(t * SR))
        idx = (np.arange(len(sig)) + i0)
        if self.circ:
            idx %= N
            np.add.at(self.y, idx, sig * gain)
        else:
            m = (idx >= 0) & (idx < N)
            self.y[idx[m]] += sig[m] * gain


cues = []


def cue(bus, name, t, sig, gain):
    bus.add(t, sig, gain)
    cues.append({'t': round(t % DUR, 3), 'name': name, 'gain_db': round(20 * np.log10(gain + 1e-9), 1)})


# ------------------------------------------------------------------ synth voices
def tone(f, dur, a=0.004, d=0.12, s=0.0, wave='sine', glide=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = f * (1 + glide * t / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    if wave == 'sine':
        x = np.sin(ph)
    elif wave == 'tri':
        x = 2 / np.pi * np.arcsin(np.sin(ph))
    else:  # soft saw
        x = sum(np.sin(ph * k) / k for k in range(1, 7)) * 0.6
    return x * env_adsr(n, a, d, s, min(0.04, dur / 3))


def blip(f, dur=0.09):
    return tone(f, dur, 0.002, 0.03) + 0.35 * tone(f * 2, dur, 0.002, 0.018)


def chirp(f0, f1, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_adsr(n, 0.004, dur, 0.6, 0.01)


def noise(dur, fc=2000, a=0.01, d=0.2, s=0.0):
    n = int(dur * SR)
    return lp_fast(rng.standard_normal(n), fc) * env_adsr(n, a, d, s, 0.05)


def click(dur=0.012):
    n = int(dur * SR)
    return rng.standard_normal(n) * np.exp(-np.arange(n) / (0.002 * SR))


# ------------------------------------------------------------------ beats (as the picture)
B = {
    'watch': w('watch'), 'sci': w('scientists', 0), 'built': w('built'), 'shoots': w('shoots'), 'through': w('through'),
    'bounce': w('bounce'), 'ai': w('a', 1), 'moving': w('moving'), 'raise': w('raise'), 'hand': w('hand', 0), 'hand2': w('hand', 1),
    'but': w('but'), 'creepy': w('creepy'), 'in': w('in', 0), 'ordinary': w('ordinary'), 'identify': w('identify'),
    'even': w('even'), 'without': w('without', 0), 'they2': w('they', 1), 'people2': w('people', 1), 'everyone': w('everyone'),
    'so': w('so'), 'recognizes': w('recognizes'), 'anything': w('anything'), 'now': w('now'), 'camera': w('camera'),
    'watching': w('watching'), 'or': w('or'), 'wifi2': w('wifi', 1),
}
LAB_OUT = B['in'] - 0.12
CAFE_F1 = B['they2'] - 0.1
CAFE_H0 = B['so'] - 0.12
CAFE_H1 = B['now'] - 0.1

sfx = Bus(True)
ui = Bus(True)
amb = Bus(True)

# ---- hook: the skid starts just before frame 0 (it wraps from the film's end), the back hits the wall at 0.30
skid = load('el_skid_thump.mp3', 0.0, 0.32)
thump = load('el_skid_thump.mp3', 2.45, 2.95)
cue(sfx, 'skid (wraps from the end)', -0.22, skid, 0.8)
cue(sfx, 'back hits the wall', 0.28, thump, 0.85)
# tracking: a soft ping each time the display's skeleton visibly updates (frame 0, the slide, the shh, the crouch)
for t, f in [(0.05, 1568), (0.34, 1568), (1.08, 1397), (2.0, 1568), (B['watch'] + 0.02, 1760), (B['watch'] + 0.17, 2349), (3.3, 1397)]:
    cue(ui, 'tracking ping', t, blip(f), 0.10)
# ---- A: the radio's cover clicks open, the FMCW chirps start with the first wave front
cue(sfx, 'cover latch', B['built'] - 0.02, click(), 0.35)
cue(sfx, 'cover swings', B['built'], noise(0.35, 1400, 0.03, 0.12), 0.05)
t = B['shoots']
while t < B['bounce'] + 0.2:
    cue(ui, 'chirp', t, chirp(2600, 5200, 0.1), 0.022)
    t += 0.28
cue(sfx, 'waves pass the wall (muffled)', B['through'] + 0.02, lp_fast(noise(0.5, 800, 0.02, 0.25), 400), 0.55)
# ---- B: reflections glint off the body, return to the receiver, the skeleton resolves
for i, d in enumerate([0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36]):
    cue(ui, 'reflection glint', B['bounce'] + 0.12 + d, tone(2637 + 220 * (i % 3), 0.18, 0.002, 0.07), 0.035)
cue(ui, 'received', B['ai'] + 0.25, blip(1175, 0.14), 0.08)
cue(ui, 'received', B['ai'] + 0.35, blip(1568, 0.12), 0.07)
s = B['moving']
for k, (dt, f) in enumerate([(0.0, 880), (0.3, 1047), (0.55, 1319), (0.8, 1568)]):
    cue(ui, 'skeleton builds', s + dt, blip(f, 0.1), 0.09)
# ---- C: the raised hand is matched (two-note confirmation), then the second arm
cue(ui, 'match tone', B['hand'] + 0.08, blip(1319, 0.1), 0.1)
cue(ui, 'match tone', B['hand'] + 0.2, blip(1760, 0.14), 0.1)
cue(ui, 'match tone', B['hand2'] + 0.42, blip(1568, 0.12), 0.07)
# ---- D: the low impact under CREEPY, a data stream rising into the cut
boom = load('el_low_boom.mp3')
n = int(1.8 * SR)
tt = np.arange(n) / SR
sub = np.sin(2 * np.pi * (46 - 8 * tt) * tt) * np.exp(-tt / 0.7) * np.minimum(1, tt / 0.02)
swell = lp_fast(rng.standard_normal(int(0.45 * SR)), 900) * np.linspace(0, 1, int(0.45 * SR)) ** 2
cue(sfx, 'reverse swell', B['creepy'] - 0.45, swell, 0.06)
cue(sfx, 'low impact (ElevenLabs)', B['creepy'] + 0.02, boom, 0.8)
cue(sfx, 'sub drop', B['creepy'] + 0.02, sub, 0.35)
stream = hp_fast(noise(0.8, 6000, 0.5, 2.0, 0.8), 1500) * np.linspace(0.2, 1, int(0.8 * SR))
cue(sfx, 'data stream', LAB_OUT - 0.7, stream, 0.05)
# ---- E/F/H: café ambience (ElevenLabs loop), ducked to near-silence under WITHOUT their phones
cafe = load('el_cafe_amb_loop.mp3')
cafe = cafe / (np.sqrt(np.mean(cafe ** 2)) + 1e-9) * 0.05
def place_bed(bus, t0, t1, bed, name, fade=0.08, duck=None):
    n = int((t1 - t0) * SR)
    reps = np.tile(bed, n // len(bed) + 2)[:n].copy()
    e = np.ones(n)
    f = int(fade * SR)
    e[:f] = np.linspace(0, 1, f)
    e[-f:] = np.linspace(1, 0, f)
    if duck:
        tt = t0 + np.arange(n) / SR
        for a, b, g in duck:
            k = np.clip((tt - a) / 0.15, 0, 1) * np.clip((b - tt) / 0.25, 0, 1)
            e *= 1 - (1 - g) * k
    cue(bus, name, t0, reps * e, 1.0)
place_bed(amb, LAB_OUT, CAFE_F1, cafe, 'café ambience', 0.04, duck=[(B['even'] - 0.05, B['they2'] - 0.3, 0.15)])
place_bed(amb, CAFE_H0, CAFE_H1, cafe[int(3 * SR):], 'café ambience (H)', 0.04)
# Wi-Fi texture in the café: quiet chirps; the body crossing the link; the monitor's match chime
t = B['ordinary']
while t < B['identify']:
    cue(ui, 'wifi packet', t, chirp(2200, 3400, 0.05), 0.018)
    t += 0.19
cue(ui, 'link disturbed', B['identify'] - 0.55, tone(660, 0.6, 0.05, 0.3, 0.5, 'tri', glide=-0.3), 0.03)
for k in range(4):
    cue(ui, 'compare tick', B['identify'] + 0.35 + k * 0.22, blip(1047, 0.05), 0.05)
cue(ui, 'MATCH chime', B['identify'] + 1.05, blip(1319, 0.16) + 0.6 * blip(1976, 0.16), 0.09)
cue(sfx, 'quiet emphasis (WITHOUT)', B['without'] + 0.02, lp_fast(noise(0.35, 300, 0.005, 0.12), 180), 0.5)
# ---- G: the corridor: room tone; each walker matched as they pass (a tick, rising); the dataset sweep
room = lp_fast(rng.standard_normal(int(5 * SR)), 250) * 0.012
cue(amb, 'corridor room tone', CAFE_F1, room[: int((CAFE_H0 - CAFE_F1) * SR)] * np.minimum(1, np.minimum(np.arange(int((CAFE_H0 - CAFE_F1) * SR)) / (0.05 * SR), (int((CAFE_H0 - CAFE_F1) * SR) - np.arange(int((CAFE_H0 - CAFE_F1) * SR))) / (0.05 * SR))), 1.0)
g0 = B['they2'] - 0.1
for i in range(7):
    cue(ui, 'walker matched', g0 + 0.45 + i * 0.6 + 0.2, blip(988 + 90 * i, 0.08), 0.06)
for n_ in range(0, 197, 3):
    tt_ = B['everyone'] - 0.15 + n_ * 0.0055
    cue(ui, 'dataset sweep', tt_, blip(1400 + 4 * n_, 0.035), 0.022)
cue(ui, 'miss', B['everyone'] - 0.15 + 37 * 0.0055, tone(220, 0.12, 0.003, 0.06, 0, 'tri'), 0.05)
cue(ui, 'miss', B['everyone'] - 0.15 + 151 * 0.0055, tone(220, 0.12, 0.003, 0.06, 0, 'tri'), 0.05)
# ---- H: recognised: a darker match chime
cue(ui, 'seen before', B['recognizes'] + 0.42, blip(880, 0.2) + 0.7 * blip(1047, 0.2), 0.09)
cue(sfx, 'unease swell', B['anything'] - 0.6, lp_fast(noise(1.0, 500, 0.6, 0.6, 0.6), 300), 0.12)
# ---- I: the camera: his palm slaps over it, the picture dies; the RF ping he hears; the dash (wraps to frame 0)
cue(amb, 'office room tone', CAFE_H1, room[: int((DUR - CAFE_H1) * SR)] * np.minimum(1, np.arange(int((DUR - CAFE_H1) * SR)) / (0.05 * SR)), 1.0)
slap = load('el_cam_slap.mp3', 1.95, 2.4)
cue(sfx, 'palm over the lens (ElevenLabs)', B['camera'] - 0.05, slap, 1.6)
cue(ui, 'picture dies', B['camera'] + 0.05, chirp(1200, 200, 0.18) * 0.8, 0.05)
for t, f in [(B['or'] + 0.1, 1568), (B['or'] + 0.45, 1568), (B['wifi2'] + 0.35, 1760)]:
    cue(ui, 'RF tracking ping (returns)', t, blip(f), 0.11)

# ------------------------------------------------------------------ music: 64 beats in DUR (16 bars), D minor
beat = DUR / 64
mus = Bus(True)
def sec_gain(t):
    """music level by section (linear); equal at 0 and DUR so the loop is seamless"""
    keys = [(0, 0.8), (3.5, 0.8), (4.0, 0.95), (B['raise'] - 0.3, 0.95), (B['raise'], 0.5), (B['but'] - 0.1, 0.5), (B['but'] + 0.3, 0.25), (B['creepy'] + 0.6, 0.15), (LAB_OUT, 0.7),
            (B['even'] - 0.1, 0.7), (B['even'] + 0.2, 0.05), (B['they2'] - 0.25, 0.05), (B['they2'] + 0.1, 0.95), (CAFE_H0, 0.95), (CAFE_H0 + 0.3, 0.6),
            (CAFE_H1, 0.6), (B['camera'] + 0.1, 0.45), (B['or'] + 0.2, 0.75), (DUR, 0.8)]
    xs, ys = zip(*keys)
    return np.interp(t, xs, ys)
prog = [[38, 50, 53, 57], [34, 46, 50, 53], [31, 43, 46, 50], [33, 45, 49, 52]]  # Dm, Bb, Gm, A (MIDI)
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
for bar in range(16):
    ch = prog[bar % 4]
    t_bar = bar * 4 * beat
    # bass: eighth-note pulse on the root
    for k in range(8):
        tb = t_bar + k * beat / 2
        acc = 1.0 if k % 2 == 0 else 0.6
        mus.add(tb, tone(mid(ch[0]), beat * 0.45, 0.004, 0.18, 0.15, 'tri') * acc * sec_gain(tb), 0.16)
    # pad: the chord, soft saw through a low-pass, whole bar
    pad = sum(tone(mid(m + 12) * (1 + d), 4 * beat + 0.3, 0.25, 4.0, 0.9, 'saw') for m in ch[1:] for d in (-0.003, 0.003))
    pad = lp_fast(pad, 1100)
    g = sec_gain(t_bar + np.arange(len(pad)) / SR)
    mus.add(t_bar, pad * g, 0.022)
    # arpeggio plucks (sixteenths) in the explanation and the test sections
    for k in range(16):
        tb = t_bar + k * beat / 4
        m = ch[1:][k % 3] + 24
        if (4.0 < tb < B['raise'] - 0.2) or (LAB_OUT + 0.2 < tb < B['even'] - 0.2) or (B['they2'] < tb < CAFE_H0):
            mus.add(tb, tone(mid(m), 0.16, 0.002, 0.07, 0, 'tri') * sec_gain(tb), 0.035 * (1.0 if k % 4 == 0 else 0.6))
    # ticks on the off-beats (hi-hat-like), not in D or F
    for k in range(4):
        tb = t_bar + (k + 0.5) * beat
        if not (B['but'] - 0.1 < tb < LAB_OUT + 0.1) and not (B['even'] - 0.2 < tb < B['they2']):
            mus.add(tb, hp_fast(noise(0.05, 12000, 0.001, 0.02), 6000) * sec_gain(tb), 0.06)
music = mus.y
# diagnostics only: MUTE=music,amb,sfx,ui silences stems (never set for the delivered mix)
for stem in os.environ.get('MUTE', '').split(','):
    if stem == 'music': music = music * 0
    if stem == 'amb': amb.y *= 0
    if stem == 'sfx': sfx.y *= 0
    if stem == 'ui': ui.y *= 0

# ------------------------------------------------------------------ narration, ducking, master
nar, sr0 = sf.read(os.path.join(EP, 'audio/narration/FGW_WiFi_Walls_narration_final.wav'))
assert sr0 == SR
nar = np.pad(nar, (0, max(0, N - len(nar))))[:N]
# gentle voice compression (RMS, 3:1 above -24 dBFS, 8 ms / 120 ms) so the master limiter barely touches the voice
win = int(0.008 * SR)
env = np.sqrt(np.convolve(nar ** 2, np.ones(win) / win, 'same') + 1e-12)
thr = 10 ** (-24 / 20)
gr = np.where(env > thr, (env / thr) ** (1 / 3 - 1), 1.0)
rel_c = np.exp(-1 / (0.12 * SR)); att_c = np.exp(-1 / (0.008 * SR))
gs = np.empty_like(gr); acc = 1.0
for i in range(len(gr)):
    c = att_c if gr[i] < acc else rel_c
    acc = c * acc + (1 - c) * gr[i]
    gs[i] = acc
nar = nar * gs
nar = nar / (np.sqrt(np.mean(nar[np.abs(nar) > 1e-4] ** 2)) + 1e-12) * 10 ** (-19.5 / 20)
# speech envelope for ducking (smooth, 120 ms)
e = np.abs(nar)
k = int(0.12 * SR)
e = np.convolve(e, np.ones(k) / k, 'same')
speech = np.clip(e / (np.percentile(e, 90) + 1e-9), 0, 1)
duck = 1 - 0.62 * speech
# loop seam: the ducking at the end equals the start (no speech in either tail)
bed = (music * 0.71 * duck + amb.y * (1 - 0.45 * speech))
fx = sfx.y + ui.y
mix_m = nar * 1.0 + bed + fx * (1 - 0.25 * speech)
# gentle stereo: music pad slightly wide (Haas 8 ms on the right), voice centre
d = int(0.008 * SR)
right_bed = np.roll(bed, d)
L = nar + bed + fx * (1 - 0.25 * speech)
R = nar + 0.85 * bed + 0.15 * right_bed + fx * (1 - 0.25 * speech)
st = np.stack([L, R], 1)
# loudness to about -14 LUFS, true peak under -1 dBFS (measure with ffmpeg ebur128 afterwards)
peak = np.abs(st).max()
st = st / peak * 10 ** (-1.5 / 20)
os.makedirs(os.path.join(EP, 'audio/mix'), exist_ok=True)
out = os.path.join(EP, 'audio/mix/FGW_WiFi_Walls_V1_mix.wav')
sf.write(out, st, SR, subtype='PCM_24')
meas = subprocess.run(['ffmpeg', '-v', 'info', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float([l for l in meas.splitlines() if l.strip().startswith('I:')][-1].split()[1])
gain = 10 ** ((-14.3 - I) / 20)
st2 = st * gain
# look-ahead peak limiter at -1.5 dBFS (5 ms look-ahead, 80 ms release), circular so the loop seam stays continuous
lim = 10 ** (-1.5 / 20)
need = np.minimum(1.0, lim / (np.abs(st2).max(1) + 1e-12))
la = int(0.005 * SR)
padded = np.concatenate([need[-la:], need, need[:la]])
win = np.lib.stride_tricks.sliding_window_view(padded, 2 * la + 1).min(1)
rel = np.exp(-1 / (0.08 * SR))
g = np.empty_like(win)
acc = 1.0
for _ in range(2):  # second pass settles the circular start
    for i in range(len(win)):
        acc = win[i] if win[i] < acc else rel * acc + (1 - rel) * win[i]
        g[i] = acc
st2 = st2 * g[:, None]
# the last 3 ms lean into the first sample, so a player that loops the file does not click
ramp = int(0.003 * SR)
st2[-ramp:] = st2[-ramp:] * np.linspace(1, 0, ramp)[:, None] + st2[0][None, :] * np.linspace(0, 1, ramp)[:, None]
sf.write(out, st2, SR, subtype='PCM_24')
os.makedirs(os.path.join(EP, 'source/public/audio'), exist_ok=True)
sf.write(os.path.join(EP, 'source/public/audio/mix.wav'), st2, SR, subtype='PCM_24')
meas = subprocess.run(['ffmpeg', '-v', 'info', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
summ = [l.strip() for l in meas.splitlines()[-12:] if l.strip()]
seam = float(np.abs(st2[0] - st2[-1]).max())
json.dump({'duration_s': DUR, 'frames': WF['frames'], 'beat_s': beat, 'bpm': 60 / beat, 'ebur128': summ, 'loop_seam_sample_jump': seam}, open(os.path.join(EP, 'audio/mix/mix_measure.json'), 'w'), indent=1)
stems = {k: float(20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)) for k, v in {'narration': nar, 'music': music, 'ambience': amb.y, 'effects': sfx.y, 'tones': ui.y}.items()}
print('stem rms dBFS (pre-master):', {k: round(v, 1) for k, v in stems.items()})
json.dump(sorted(cues, key=lambda c: c['t']), open(os.path.join(EP, 'audio/cues.json'), 'w'), indent=1)
print('\n'.join(summ))
print(f'bpm {60 / beat:.2f}; loop seam jump {seam:.5f}; cues {len(cues)}')
