#!/usr/bin/env python3
"""The V9 mix (the V1-V7 engine; V8 cues from the picture's own event timing, audio/v9_events.json, written by
tools/v9/events.ts): the final narration, an original synthesized music bed, synthesized electronic tones, and five
ElevenLabs sound effects (audio/sfx/el_*.mp3, generated for this film). Cue times are taken from the measured word
timeline (audio/narration/words_final.json) with the same beat offsets the picture uses (source/src/scenes/*.tsx).

Loop: the music is written in exactly 16 bars of the film's length (64 beats in DUR s, about 105.3 bpm) and every
music note and effect is mixed into a circular buffer (anything that rings past the last frame continues at frame 0),
so the end of the film runs into its start without a jump or click. The narration is not circular.

Outputs: audio/mix/FGW_WiFi_Walls_V9_mix.wav (48 kHz/24-bit stereo), source/public/audio/mix.wav, audio/cues.json,
audio/mix/mix_measure.json.
usage: python3 -I tools/v9/make_audio9.py"""
import json, os, subprocess
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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


# ------------------------------------------------------------------ beats and events (as the picture)
EV = json.load(open(os.path.join(EP, 'audio/v9_events.json')))
E = EV['beats']
B = {
    'watch': w('watch'), 'raise': w('raise'), 'hand': w('hand', 0), 'hand2': w('hand', 1), 'but': w('but'), 'creepy': w('creepy'),
    'even': w('even'), 'they2': w('they', 1), 'camera': w('camera'), 'or': w('or'), 'wifi2': w('wifi', 1), 'anything': w('anything'),
    'knows': w('knows'), 'who': w('who'),
}
LAB_OUT, LAB_IN = E['labOut'], E['labIn']
UI_IN, UI_OUT, E_OUT, G_IN, H_IN = E['uiIn'], E['uiOut'], E['eOut'], E['gIn'], E['hIn']
E_PUSH, G_BACK, OR_SPLIT, STOP_T = E['ePush'], E['gBack'], E['orSplit'], E['stopT']
POV_IN, STUDY_UI = E['povIn'], E['studyUiIn']
WIN_IN = E_PUSH + 1.0  # the camera reaches the café's glass (E; it stays outside)
WIN_G = G_IN + 0.6  # G: the return visit (the split screen)

sfx = Bus(True)
ui = Bus(True)
amb = Bus(True)


def step_sound(hard=False):
    """a soft sneaker step: heel thud and a short scuff"""
    n = int(0.07 * SR)
    tt = np.arange(n) / SR
    heel = lp_fast(rng.standard_normal(n), 520 if hard else 380) * np.exp(-tt / 0.018) * np.minimum(1, tt / 0.0015)
    m = int(0.03 * SR)
    scuff = np.zeros(n)
    scuff[int(0.025 * SR):int(0.025 * SR) + m] = hp_fast(lp_fast(rng.standard_normal(m), 4200), 1800) * np.exp(-np.arange(m) / (0.008 * SR))
    return heel + scuff * 0.25


def whoosh(dur, fc=1200, peak=0.5):
    """air past the lens: band-limited noise with a rise and fall"""
    n = int(dur * SR)
    x = np.arange(n) / n
    e = np.where(x < peak, (x / peak) ** 2, ((1 - x) / (1 - peak)) ** 1.5)
    return lp_fast(rng.standard_normal(n), fc) * e


def bed(bus, t0, t1, src, name, fade=0.12, gain=1.0):
    n = int((t1 - t0) * SR)
    reps = np.tile(src, n // len(src) + 2)[:n].copy()
    e = np.ones(n)
    f = int(fade * SR)
    e[:f] = np.linspace(0, 1, f)
    e[-f:] = np.linspace(1, 0, f)
    cue(bus, name, t0, reps * e, gain)


boomS = load('el_low_boom.mp3')[: int(0.9 * SR)] * np.linspace(1, 0, int(0.9 * SR)) ** 1.5
# ---- the lab (loop time: the ending is negative time, it rings in before frame 0)
labtone = lp_fast(rng.standard_normal(int(6 * SR)), 220) * 0.010 + 0.004 * np.sin(2 * np.pi * 60 * np.arange(int(6 * SR)) / SR)
bed(amb, LAB_IN - DUR, LAB_OUT, labtone, 'lab room tone (hum)', 0.1)
for s_ in EV['labSteps']:
    if s_['t'] > LAB_IN - DUR:
        cue(sfx, 'footstep (lab)', s_['t'], step_sound(True), 0.24 * (0.85 + 0.3 * rng.random()))
# the street duck under the CCTV (into the cut to the same crouch behind the lab wall)
cue(sfx, 'the duck (clothes, a rush)', EV['duck0'] + DUR + 0.05, hp_fast(whoosh(0.8, 2600, 0.55), 700), 0.07)
# V9 opening: on "behind" both forearms thrown over his head (0.44-0.74), the skeleton's copy redraws with it; then he
# pulls into a ball (arms around his shins, feet drawn in, 1.32-1.95); on "watch you" he lifts his head to peek
cue(sfx, 'arms over his head (sleeves, a rush)', 0.42, hp_fast(whoosh(0.35, 3200, 0.4), 900), 0.09)
cue(sfx, 'pulls into a ball (clothes)', 1.35, hp_fast(noise(0.5, 3000, 0.08, 0.25), 900), 0.05)
# (the feet drawn in are his planted steps, audio/v9_events.json labSteps)
cue(sfx, 'lifts his head to peek (clothes)', 2.75, hp_fast(noise(0.45, 3000, 0.08, 0.25), 900), 0.04)
for t, f in [(0.04, 1568), (0.5, 1397), (0.78, 1760), (1.45, 1568), (1.98, 1397)]:
    cue(ui, 'tracking ping (the screen redraws)', t, blip(f), 0.08)
# the joints lock on as the camera moves to the screen (1.9-2.4): fourteen soft ticks
for j in range(14):
    cue(ui, 'joint locks', 1.9 + j * 0.035 + 0.2, blip(2400 + 40 * j, 0.03), 0.014)
# STILL WATCH YOU: a subtle low impact with the skeleton's flash on "still"
cue(sfx, 'STILL accent (low impact)', w('still') - 0.01, boomS, 0.45)
cue(ui, 'STILL accent (tone)', w('still') + 0.01, tone(98, 0.9, 0.004, 0.5, 0.0, 'tri') * 0.8, 0.08)
for t in EV['openingArrivals']:
    cue(ui, 'echo received (soft)', t, blip(1175 + 60 * rng.random(), 0.06), 0.018)
# the mechanism: the cover latch, the transmit packets, the wall, the hits on him, the echoes, the pose forming
for n_ in range(0, int(DUR / 0.34) + 1):
    t = n_ * 0.34
    if 1.45 <= t < 3.0 or E['shoots'] - 0.05 <= t < E['ai'] + 0.3:
        cue(ui, 'transmit packet', t, chirp(2600, 5200, 0.08), 0.02)
HP = EV['heroPulse']
cue(ui, 'the followed pulse leaves the array', HP['emit'], chirp(2400, 5600, 0.12), 0.05)
cue(sfx, 'the pulse enters the concrete (muffled)', HP['wallIn'], lp_fast(noise(0.5, 800, 0.02, 0.3), 380), 0.5)
cue(ui, 'the pulse meets his head (glint)', HP['hit'], tone(2637, 0.22, 0.002, 0.08), 0.05)
cue(ui, 'its echo arrives (receive bar)', HP['arrive'], blip(1175, 0.16) + 0.5 * blip(1760, 0.16), 0.08)
for t in EV['echoArrivals']:
    cue(ui, 'echo received', t, blip(1175 + 60 * rng.random(), 0.07), 0.032)
cue(ui, 'received', E['ai'] + 0.25, blip(1175, 0.14), 0.065)
cue(ui, 'received', E['ai'] + 0.35, blip(1568, 0.12), 0.055)
# the skeleton built point by point (Lab7 BUILD0 = ai + 0.32, one keypoint every 75 ms)
for j in range(14):
    cue(ui, 'keypoint placed', E['ai'] + 0.32 + j * 0.075 + 0.1, blip(880 * 2 ** (j / 14), 0.05), 0.04)
# the raised hand (kept out of "its hand", 12.61-13.10: the voice stays clear there)
its0, hand1 = w('its'), [x for x in WORDS if x['word'] == 'hand'][1]['end']
for t in EV['raiseArrivals']:
    if not (its0 - 0.1 < t < hand1):
        cue(ui, 'hand echo received', t, blip(1480, 0.06), 0.028)
cue(ui, 'match tone', hand1 + 0.03, blip(1319, 0.1), 0.085)
cue(ui, 'match tone', hand1 + 0.15, blip(1760, 0.14), 0.085)
# ---- CREEPY: low impact, then the skeleton fills into a silhouette and walks out into the street
boom = load('el_low_boom.mp3')
n = int(1.8 * SR)
tt = np.arange(n) / SR
sub = np.sin(2 * np.pi * (46 - 8 * tt) * tt) * np.exp(-tt / 0.7) * np.minimum(1, tt / 0.02)
swell = lp_fast(rng.standard_normal(int(0.45 * SR)), 900) * np.linspace(0, 1, int(0.45 * SR)) ** 2
cue(sfx, 'reverse swell', B['creepy'] - 0.45, swell, 0.06)
cue(sfx, 'low impact (ElevenLabs)', B['creepy'] + 0.02, boom, 0.42)
cue(sfx, 'sub drop', B['creepy'] + 0.02, sub, 0.16)
cue(sfx, 'silhouette whoosh', E['silA'], whoosh(0.9, 1800, 0.55), 0.09)
cue(sfx, 'silhouette shimmer', E['silA'] + 0.1, hp_fast(noise(0.8, 7000, 0.4, 0.3, 0.5), 2500), 0.03)
# a low unsettled drone from here to the ending's screen dissolve, growing a little in each scene
nd = int((LAB_IN - E['silA']) * SR)
td = np.arange(nd) / SR
drone = (np.sin(2 * np.pi * 73.4 * td) + 0.8 * np.sin(2 * np.pi * 74.1 * td) + 0.25 * np.sin(2 * np.pi * 110.3 * td + 0.5 * np.sin(2 * np.pi * 0.3 * td)))
lvl = np.interp(E['silA'] + td, [E['silA'], LAB_OUT, UI_IN, E_OUT, G_IN, WIN_G, H_IN, POV_IN, OR_SPLIT, LAB_IN - 0.02],
                [0.0, 0.5, 0.45, 0.4, 0.55, 0.75, 0.6, 0.9, 1.0, 0.0])
cue(amb, 'unsettled drone', E['silA'], drone * lvl * 0.007, 1.0)
# ---- the café: the street (murmur through the glass, traffic), inside (full murmur)
cafe = load('el_cafe_amb_loop.mp3')
cafe = cafe / (np.sqrt(np.mean(cafe ** 2)) + 1e-9) * 0.05
street = lp_fast(cafe, 1400) * 0.6 + lp_fast(rng.standard_normal(len(cafe)), 300) * 0.01
bed(amb, LAB_OUT - 0.1, WIN_IN, street, 'street (café through glass, traffic)', 0.3)
bed(amb, WIN_IN - 0.3, UI_IN, cafe, 'café through the glass, close', 0.3, 0.6)
bed(amb, UI_IN, UI_OUT, street[int(1 * SR):], 'street (split screen)', 0.1, 0.8)
bed(amb, UI_OUT, E_OUT + 0.1, street, 'street (close track)', 0.08)
bed(amb, G_IN, WIN_G, street[int(2 * SR):], 'street (walking past the café)', 0.25)
bed(amb, WIN_G - 0.3, G_BACK, cafe[int(3 * SR):], 'café through the glass (the receiver match)', 0.3, 0.6)
bed(amb, G_BACK, LAB_IN + 0.3, street[int(5 * SR):], 'street (him unaware, the CCTV, the ending split)', 0.1)
n = int(2.6 * SR)
tt = np.arange(n) / SR
car = lp_fast(rng.standard_normal(n), 500) * np.exp(-((tt - 1.3) / 0.6) ** 2)
cue(amb, 'distant car passes', LAB_OUT + 0.5, car, 0.05)
cue(amb, 'distant car passes', H_IN + 0.1, car, 0.04)
for s_ in EV['footsteps']:
    cue(sfx, f"footstep ({s_['who']})", s_['t'], step_sound(False), 0.24 * s_['gain'] * (0.85 + 0.3 * rng.random()))
t = E['cafe_sep']
while t < UI_OUT:
    cue(ui, 'wifi packet', t, chirp(2200, 3400, 0.05), 0.014)
    t += 0.42
# the split screen: the laptop rises; its signature builds; three comparisons; MATCH on #12
cue(sfx, 'laptop rises (split)', UI_IN - 0.05, whoosh(0.4, 900, 0.4), 0.05)
for k in range(6):
    cue(ui, 'signature column', E['cafe_people'] - 0.15 + k * 0.08, blip(1200 + 40 * k, 0.04), 0.03)
for k in range(3):
    cue(ui, 'compare tick', E['cafe_walking'] + 0.03 + k * 0.1, blip(1047, 0.05), 0.04)
cue(ui, 'MATCH chime', E['cafe_past'] + 0.07, blip(1319, 0.16) + 0.6 * blip(1976, 0.16), 0.08)
cue(sfx, 'quiet emphasis (WITHOUT)', w('without', 0) + 0.02, lp_fast(noise(0.35, 300, 0.005, 0.12), 180), 0.45)
cue(sfx, 'lamp post passes the lens', E['wipeA'] + 0.1, whoosh(0.55, 1100, 0.5), 0.11)
# ---- the study: corridor room tone, three walkers recorded, the push onto the screen, the match, the 197 tiles
room = lp_fast(rng.standard_normal(int(5 * SR)), 250) * 0.012
bed(amb, E_OUT, STUDY_UI, room, 'corridor room tone', 0.08)
bed(amb, STUDY_UI, G_IN, room * 0.8, 'study room tone (results display)', 0.08)
for m in EV['studyMatches']:
    cue(ui, f"match #{m['seed']:02d}", max(m['t'], E_OUT + 0.15), blip(1319, 0.1) + 0.6 * blip(1760, 0.1), 0.06)
cue(sfx, 'push onto the results display', EV['studyPush']['from'] + 0.1, whoosh(1.1, 1300, 0.5), 0.035)
for k in range(5):
    cue(ui, 'reference scanned', STUDY_UI + 0.08 + k * 0.07, blip(980 + 30 * k, 0.04), 0.03)
cue(ui, 'identified (#27)', w('identified') + 0.04, blip(1319, 0.14) + 0.6 * blip(1760, 0.14), 0.075)
# V9: the result is one statement, stamped on "almost" (a soft thump and a chime as its check draws), EVERYONE lit
almost = w('almost')
cue(sfx, 'result stamp (soft thump)', almost - 0.03, lp_fast(noise(0.25, 400, 0.004, 0.1), 220), 0.35)
cue(ui, 'result chime (the check draws)', almost + 0.06, blip(1319, 0.2) + 0.6 * blip(1976, 0.2), 0.07)
cue(ui, 'EVERYONE lit', w('everyone') + 0.02, blip(1760, 0.12), 0.035)
cue(sfx, 'gentle push into the result', G_IN - 0.8, whoosh(0.7, 1600, 0.6), 0.025)
# ---- G: him walking past; the cutaway through the window; the match; straight back out to him, unaware
cue(ui, 'saved record (from earlier)', G_IN + 0.15, blip(988, 0.12), 0.05)
for k in range(5):
    cue(ui, 'new signal arriving', E['cafe_cafe'] + 0.1 + k * 0.16, blip(1200 + 60 * k, 0.04), 0.025)
# V9: the new signature rises onto the stored one and locks (a click and a flash), then SAME ID
cue(sfx, 'signature rises onto the record', E['cafe_recognizes'] - 0.42, whoosh(0.42, 2200, 0.8), 0.03)
cue(sfx, 'signatures lock (click)', E['cafe_recognizes'], click(), 0.16)
cue(ui, 'SAME ID #12', E['cafe_recognizes'] + 0.1, blip(880, 0.2) + 0.7 * blip(1047, 0.2), 0.09)
cue(sfx, 'unease swell (kept under the voice)', B['anything'] - 0.6, lp_fast(noise(1.0, 500, 0.6, 0.6, 0.6), 300), 0.03)
# ---- H: the security camera and its picture; then the receiver (no camera) that knows him; screen to screen
cue(ui, 'camera picture (REC)', POV_IN + 0.02, blip(2093, 0.08), 0.045)
cue(sfx, 'laptop rises (ending split)', OR_SPLIT - 0.05, whoosh(0.4, 900, 0.4), 0.05)
t = OR_SPLIT
while t < LAB_IN - 0.3:
    cue(ui, 'router packet', t, chirp(2200, 3400, 0.05), 0.018)
    t += 0.21
cue(ui, 'identity held (#12)', B['wifi2'] + 0.18, blip(880, 0.18) + 0.6 * blip(1047, 0.18), 0.06)
# he stops under the camera and ducks; the cut to the duck behind the wall rides on that one movement
cue(sfx, 'he stops (scuff)', STOP_T, step_sound(False), 0.2)
cue(sfx, 'match cut to the lab (soft thud)', LAB_IN, lp_fast(noise(0.3, 500, 0.005, 0.12), 260), 0.3)
for t, f in [(DUR - 0.5, 1760)]:
    cue(ui, 'the screen redraws (still)', t, blip(f), 0.09)

# ------------------------------------------------------------------ music: 64 beats in DUR (16 bars), D minor
beat = DUR / 64
mus = Bus(True)
def sec_gain(t):
    """music level by section (linear); equal at 0 and DUR so the loop is seamless"""
    keys = [(0, 0.8), (3.5, 0.8), (4.0, 0.95), (B['raise'] - 0.3, 0.95), (B['raise'], 0.5), (B['but'] - 0.1, 0.5), (B['but'] + 0.3, 0.25), (B['creepy'] + 0.6, 0.15), (LAB_OUT, 0.6),
            (B['even'] - 0.1, 0.6), (B['even'] + 0.2, 0.15), (B['they2'] - 0.25, 0.15), (B['they2'] + 0.1, 0.9), (G_IN, 0.85), (G_IN + 0.3, 0.55),
            (H_IN, 0.45), (B['camera'] + 0.1, 0.35), (B['or'] + 0.2, 0.7), (DUR, 0.8)]
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
        if (4.0 < tb < B['raise'] - 0.2) or (LAB_OUT + 0.2 < tb < B['even'] - 0.2) or (B['they2'] < tb < G_IN):
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
out = os.path.join(EP, 'audio/mix/FGW_WiFi_Walls_V9_mix.wav')
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
# voice clarity (measured, not a substitute for listening): in every 0.5 s window where the voice is speaking, the
# level of the voice against everything else in the mix (music, ambience, effects), after the same master gain
_v = nar * gain * g
_b = (bed + fx * (1 - 0.25 * speech)) * gain * g
_w = int(0.5 * SR)
_ratios = []
for _i in range(0, N - _w, _w):
    _vs = np.sqrt(np.mean(_v[_i:_i + _w] ** 2)) + 1e-12
    if 20 * np.log10(_vs) < -40:
        continue
    _bs = np.sqrt(np.mean(_b[_i:_i + _w] ** 2)) + 1e-12
    _ratios.append((round(_i / SR, 2), round(float(20 * np.log10(_vs / _bs)), 1)))
_r = sorted(r for _, r in _ratios)
json.dump({'note': 'voice level minus music+ambience+effects level, dB, per 0.5 s window while speaking',
           'windows': len(_r), 'min_db': _r[0], 'p10_db': _r[len(_r) // 10], 'median_db': _r[len(_r) // 2],
           'lowest_windows': sorted(_ratios, key=lambda q: q[1])[:6]}, open(os.path.join(EP, 'qa/v9/voice_clarity.json'), 'w'), indent=1)
print('voice vs bed (dB): min', _r[0], 'p10', _r[len(_r) // 10], 'median', _r[len(_r) // 2], 'lowest', sorted(_ratios, key=lambda q: q[1])[:4])
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
