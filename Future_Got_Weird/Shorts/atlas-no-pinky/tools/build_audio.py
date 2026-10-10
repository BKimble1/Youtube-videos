#!/usr/bin/env python3
"""Original sound design + mix for the Atlas Short (numpy only, deterministic).

Reads  audio/cues.json (single cue table) and audio/narration_48k.wav
Writes audio/stems/{narration,music,effects}.wav, audio/FGW_Atlas_No_Pinky_mix.wav,
       audio/sfx_log.csv, audio/MIX_LOG.json, source/public/audio/final_mix.wav
All effects are synthesized here from noise/sine primitives (no third-party samples); the music bed is original
synthesis at 126 BPM. Nothing is randomised without a fixed seed.
"""
import json, os, subprocess, sys, wave, hashlib
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cues = json.load(open(f'{ROOT}/audio/cues.json'))
EV = {k: v['t'] for k, v in cues['events'].items()}
TOTAL = cues['total_seconds']
N = int((TOTAL + 0.6) * SR)


def rng_for(name):
    return np.random.default_rng(int(hashlib.sha1(name.encode()).hexdigest()[:8], 16))


def read_wav(path):
    with wave.open(path) as w:
        n, ch, sw = w.getnframes(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768.0
    return a.reshape(-1, ch).mean(axis=1) if ch > 1 else a


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(pcm.shape[1] if pcm.ndim == 2 else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ------------------------------------------------------------------ DSP primitives
def tgrid(dur):
    n = int(dur * SR)
    return np.arange(n) / SR


def fft_filter(x, lo=None, hi=None, edge=0.25):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= np.clip((f - lo * (1 - edge)) / (lo * edge * 2 + 1e-9), 0, 1)
    if hi:
        m *= np.clip((hi * (1 + edge) - f) / (hi * edge * 2 + 1e-9), 0, 1)
    return np.fft.irfft(X * m, len(x))


def ping(t, f, decay, amp=1.0, phase=0.0):
    return amp * np.sin(2 * np.pi * f * t + phase) * np.exp(-t * decay)


def glide(t, f0, f1, tau):
    f = f1 + (f0 - f1) * np.exp(-t / tau)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def shape(t, a, tail):
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / tail)


def norm(x, peak):
    m = np.max(np.abs(x)) or 1
    return x * (peak / m)


# ------------------------------------------------------------------ effects (mono, peak-normalised per layer)
def fx_click(seed, f=2200):
    r = rng_for(seed); t = tgrid(0.12)
    nz = fft_filter(r.standard_normal(len(t)), 2500, 7500) * np.exp(-t / 0.0022)
    return norm(nz + 0.7 * ping(t, f, 120) + 0.5 * ping(t, 210, 70), 0.9)


def fx_rip(seed, dur=0.45, lo=1500, hi=9000):
    r = rng_for(seed); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), lo, hi)
    slip = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * (230 * t + 35 * np.sin(2 * np.pi * 11 * t))))
    jit = 0.55 + 0.45 * np.repeat(r.random(n // 180 + 1), 180)[:n]
    env = np.minimum(1, t / 0.03) * np.where(t < dur * 0.8, 1, np.exp(-(t - dur * 0.8) / 0.03))
    out = nz * slip * jit * env
    out[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return norm(out, 0.8)


def fx_cup(seed):
    r = rng_for(seed); t = tgrid(0.35)
    thud = glide(t, 190, 105, 0.03) * np.exp(-t / 0.05)
    knock = fft_filter(r.standard_normal(len(t)), 600, 2000) * np.exp(-t / 0.012)
    ring = ping(t, 2350, 38, 0.12) + ping(t, 3320, 55, 0.07)
    return norm(0.9 * thud + 0.45 * knock + ring, 0.85)


def fx_tick(seed, f=1250, double=True):
    r = rng_for(seed); t = tgrid(0.12)
    one = fft_filter(r.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.002) * 0.6 + ping(t, f, 160)
    out = one.copy()
    if double:
        d = int(0.026 * SR)
        out[d:] += 0.55 * one[:-d]
    return norm(out, 0.8)


def fx_stamp(seed):
    r = rng_for(seed); t = tgrid(0.3)
    thud = glide(t, 120, 62, 0.04) * np.exp(-t / 0.075)
    slap = fft_filter(r.standard_normal(len(t)), 250, 1400) * np.exp(-t / 0.02)
    return norm(thud + 0.5 * slap, 0.85)


def fx_servo(seed, dur, f0, f1, lvl=1.0):
    r = rng_for(seed); t = tgrid(dur)
    f = f0 + (f1 - f0) * (t / dur) ** 0.8
    f = f * (1 + 0.012 * np.sin(2 * np.pi * 24 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph + 0.7)
    gear = fft_filter(r.standard_normal(len(t)), 1200, 3200) * (0.08 + 0.05 * np.sin(2 * np.pi * 37 * t))
    env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.09)
    out = fft_filter((tone + gear) * env, 80, 3600)
    return norm(out, 0.5 * lvl)


def fx_metal(seed, f=3100):
    t = tgrid(0.2)
    return norm(ping(t, f, 55) + 0.6 * ping(t, f * 1.62, 80) + 0.35 * ping(t, f * 2.41, 110) + 0.3 * np.exp(-t / 0.001) * rng_for(seed).standard_normal(len(t)), 0.7)


def fx_trigger(seed):
    r = rng_for(seed); t = tgrid(0.28)
    c1 = fft_filter(r.standard_normal(len(t)), 1800, 6500) * np.exp(-t / 0.0025)
    d = int(0.014 * SR)
    c2 = np.zeros_like(t); c2[d:] = (fft_filter(r.standard_normal(len(t) - d), 700, 2600) * np.exp(-t[: len(t) - d] / 0.006)) * 0.9 + ping(t[: len(t) - d], 420, 90) * 0.5
    puff = fx_servo(seed + 'p', 0.16, 170, 240, 0.4)
    out = c1 + c2
    out[int(0.03 * SR): int(0.03 * SR) + len(puff)] += 0.25 * puff
    return norm(out, 0.85)


def fx_tray(seed, f):
    r = rng_for(seed); t = tgrid(0.25)
    tap = fft_filter(r.standard_normal(len(t)), 800, 3500) * np.exp(-t / 0.006)
    return norm(0.7 * tap + ping(t, f, 48) + 0.4 * ping(t, f * 2.7, 90) + 0.5 * glide(t, 220, 130, 0.02) * np.exp(-t / 0.03), 0.8)


def fx_dock(seed):
    r = rng_for(seed); t = tgrid(0.45)
    thump = glide(t, 135, 66, 0.05) * np.exp(-t / 0.11)
    clack = ping(t, 1850, 70, 0.5) + ping(t, 2650, 90, 0.35) + fft_filter(r.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004) * 0.7
    out = thump + clack
    d = int(0.05 * SR)
    seat = fft_filter(r.standard_normal(len(t)), 1000, 4000) * np.exp(-t / 0.005) + ping(t, 900, 120, 0.6)
    out[d:] += 0.4 * seat[:-d]
    return norm(out, 0.9)


def fx_register(seed):
    r = rng_for(seed); t = tgrid(0.7)
    chk = fft_filter(r.standard_normal(len(t)), 700, 3200) * np.exp(-t / 0.012) + ping(t, 520, 60, 0.4)
    d = int(0.05 * SR)
    bell = np.zeros_like(t)
    tb = t[: len(t) - d]
    bell[d:] = ping(tb, 2900, 7, 0.55) + ping(tb, 4350, 9, 0.35) + ping(tb, 7050, 18, 0.12)
    return norm(0.9 * chk + 0.55 * bell, 0.8)


def fx_paper(seed, dur=0.28):
    r = rng_for(seed); t = tgrid(dur)
    nz = fft_filter(r.standard_normal(len(t)), 800, 4200)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return norm(nz * env * (0.6 + 0.4 * np.sin(2 * np.pi * 70 * t) ** 2), 0.6)


def fx_pop(seed, f0=320, f1=720):
    t = tgrid(0.12)
    return norm(glide(t, f1, f0, 0.025) * np.exp(-t / 0.05), 0.7)


def fx_tok(seed, f=820):
    t = tgrid(0.18)
    return norm(ping(t, f, 55) + 0.5 * ping(t, f * 2.02, 90) + 0.35 * fft_filter(rng_for(seed).standard_normal(len(t)), 1500, 5000) * np.exp(-t / 0.003), 0.8)


def fx_printer(seed, dur=0.42):
    r = rng_for(seed); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), 2200, 6500)
    gate = ((t * 62) % 1.0 < 0.45).astype(float)
    env = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.06)
    return norm(nz * gate * env, 0.5)


# ------------------------------------------------------------------ SFX schedule: (event or time, fx, gain dB, pan, layer note)
def sfx_plan():
    E = EV
    P = []
    def add(ev, fx, db, pan=0.0, note='', dt=0.0, t=None, cue=''):
        P.append(dict(t=(t if t is not None else E[ev]) + dt, fx=fx, db=db, pan=pan, ev=ev, note=note, cue=cue))
    add('B01.hand.splay_contact', fx_click('S01'), -3, 0, 'opening accent: small rigid click', cue='S01')
    add('B01.gap.marker', fx_pop('gap'), -15, 0.12, 'dashed circle pops', dt=0.0)
    add('B01.label.tok', fx_tok('purpose', 760), -13, 0, 'ON PURPOSE plate lands', dt=0.0)
    add('B02.wipe.rip', fx_rip('wipe', 0.5, 1200, 8000), -13, 0, 'tape strip crosses frame (transition)', dt=-0.04)
    add('B02.tape.contact', fx_rip('wrap', 0.42), -9, 0.05, 'tape wraps ring + pinky', dt=-0.2, cue='S02')
    add('B02.cup.grasp', fx_servo('in1', 0.34, 260, 380, 0.5), -24, -0.1, 'human-hand prop glides in', dt=-0.3)
    add('B02.cup.contact', fx_cup('cup'), -9, 0.05, 'cup set down on bench', cue='S03')
    add('B02.knob.detent', fx_tick('knob', 1250, True), -10, 0.1, 'knob detent', cue='S04')
    add('B02.day.dial', fx_tick('day', 760, False), -13, 0.18, 'day dial advances one notch', dt=0.0)
    add('B03.card.land', fx_paper('card', 0.26), -22, -0.1, 'card slides along bench', dt=-0.26)
    add('B03.verdict.stamp', fx_stamp('stamp'), -7, 0, 'soft rubber stamp', cue='S05')
    add('B03.card.tilt', fx_tick('tilt', 600, False), -22, 0, 'card tipped up', dt=0.0)
    for i, k in enumerate(['B04.hl.thumb', 'B04.hl.index', 'B04.hl.middle', 'B04.hl.ring']):
        add(k, fx_tok(f'count{i}', 700 + 90 * i), -22, -0.1 + 0.07 * i, f'digit count {i + 1}')
    add('B04.count.thirteen', fx_pop('thirteen', 260, 520), -15, 0, 'big 13 lands')
    add('B04.motion.thumb', fx_servo('th', 0.65, 300, 460), -21, -0.12, 'thumb sweep', cue='S06')
    add('B04.motion.splay', fx_servo('sp', 0.45, 340, 520), -22, 0.0, 'finger splay', cue='S06')
    add('B04.motion.curl', fx_servo('c1', 0.42, 360, 560), -23, 0.1, 'finger curls', dt=0.0)
    add('B04.motion.curl', fx_servo('c2', 0.38, 330, 520), -25, 0.08, 'finger curls (2)', dt=0.14)
    add('B05.washer.pinch', fx_metal('wash', 3100), -11, 0.1, 'washer pinch contact', cue='S07')
    add('B05.object.rotate', fx_servo('rot', 0.55, 420, 300), -20, 0, 'object rotates in hand', cue='S08')
    add('B05.trigger.contact', fx_trigger('trig'), -9, -0.1, 'trigger click', cue='S09')
    add('B05.card.pop', fx_tick('morph', 900, False), -20, 0, 'trigger shape becomes design card')
    add('B06.actuator.1', fx_tray('a1', 520), -18, -0.1, 'actuator 1 lands')
    add('B06.actuator.2', fx_tray('a2', 590), -18, 0.0, 'actuator 2 lands')
    add('B06.actuator.3', fx_tray('a3', 660), -18, 0.1, 'actuator 3 lands')
    add('B06.tray.cost', fx_tray('cost', 700), -9, -0.05, 'tray contact low', cue='S10')
    add('B06.tray.space', fx_tray('space', 880), -9, 0.0, 'tray contact middle', cue='S11')
    add('B06.tray.service', fx_tray('service', 1100), -9, 0.05, 'tray contact high', cue='S12')
    add('B07.hand.arrive', fx_servo('arr', 0.9, 230, 330, 0.5), -22, -0.1, 'hand brings tool in')
    add('B07.tool.dock', fx_dock('dock'), -6, 0, 'tool seats in dock', cue='S13')
    add('B07.hand.release', fx_servo('rel', 0.3, 420, 300, 0.5), -24, 0, 'fingers release')
    add('B08.reference.card_pass', fx_paper('ref', 1.2), -27, 0.2, 'reference card slides past behind', dt=0.0)
    add('B08.pinch.contact', fx_metal('regrip', 2700), -17, 0.1, 'hand re-grips the docked tool')
    add('B08.turn.start', fx_servo('lift', 0.45, 300, 420), -22, 0, 'tool lifts out of the dock')
    add('B08.trigger.click', fx_trigger('trig2'), -12, -0.1, 'trigger click: the useful action continues')
    add('B09.receipt.entry', fx_printer('rcpt', 0.42), -22, -0.2, 'receipt prints', dt=0.0)
    add('B09.hand.open', fx_servo('open', 0.5, 300, 420, 0.5), -24, 0, 'hand returns to open pose')
    add('B09.budget.tag_contact', fx_register('reg'), -9, -0.05, 'restrained register click', cue='S14')
    return P


# ------------------------------------------------------------------ music: original 126 BPM bed
BPM = 126.0
BEAT = 60.0 / BPM
EIGHTH = BEAT / 2
M0 = 0.30  # first bar starts just after the opening click


def mallet(freq, dur=0.5, amp=1.0):
    t = tgrid(dur)
    s = ping(t, freq, 7.5, 1.0) + ping(t, freq * 3.97, 20, 0.28) + ping(t, freq * 9.2, 38, 0.09)
    s *= np.minimum(1, t / 0.002)
    return amp * s


def pluck_bass(freq, dur=0.55, amp=1.0):
    t = tgrid(dur)
    s = ping(t, freq, 5.5, 1.0) + ping(t, freq * 2, 11, 0.45) + ping(t, freq * 3, 20, 0.18)
    return amp * s * np.minimum(1, t / 0.003)


def kick(amp=1.0):
    t = tgrid(0.22)
    return amp * glide(t, 130, 52, 0.025) * np.exp(-t / 0.075)


def hat(seed, amp=1.0):
    t = tgrid(0.05)
    return amp * fft_filter(rng_for(seed).standard_normal(len(t)), 7000, 15000) * np.exp(-t / 0.011)


def tick_m(amp=1.0):
    t = tgrid(0.04)
    return amp * (ping(t, 3600, 260) + 0.4 * ping(t, 5200, 360))


def wood(amp=1.0):
    t = tgrid(0.12)
    return amp * (ping(t, 910, 70) + 0.4 * ping(t, 1830, 110))


def auto(points):
    pts = sorted(points)
    ts = [p[0] for p in pts]; gs = [10 ** (p[1] / 20) if p[1] > -90 else 0.0 for p in pts]
    return lambda t: np.interp(t, ts, gs)


def build_music():
    mus = np.zeros(N)
    D1 = cues['pockets']['D01']; D2 = cues['pockets']['D02']
    stamp_t = EV['B03.verdict.stamp']
    # section automation (dB). Pockets thin the bed right before the verdict and before the final joke.
    arp_g = auto([(0, -90), (0.28, -90), (0.40, -3), (3.2, -2), (D1['start_s'] - 0.05, -2), (D1['start_s'] + 0.12, -90), (D1['end_s'] - 0.25, -90), (stamp_t + 0.02, -1),
                  (10.3, -1), (13.0, 1), (16.3, 0), (20.3, -3), (26.4, -1), (29.65, -4), (D2['start_s'] - 0.05, -4), (D2['start_s'] + 0.12, -90), (D2['end_s'] - 0.1, -90), (D2['end_s'], -90), (40, -90)])
    bass_g = auto([(0, -90), (0.3, -2), (D1['start_s'], -2), (D1['start_s'] + 0.2, -9), (D1['end_s'], -9), (stamp_t + 0.05, -2), (D2['start_s'], -3), (D2['start_s'] + 0.2, -9), (D2['end_s'], -9), (D2['end_s'] + 0.2, -3), (40, -3)])
    kick_g = auto([(0, -90), (0.5, -90), (0.6, -8), (D1['start_s'] - 0.05, -8), (D1['start_s'] + 0.1, -90), (stamp_t + 0.5, -90), (stamp_t + 0.6, -7), (D2['start_s'] - 0.1, -9), (D2['start_s'] + 0.05, -90), (40, -90)])
    hat_g = auto([(0, -90), (3.2, -90), (3.3, -14), (D1['start_s'] - 0.05, -14), (D1['start_s'] + 0.1, -90), (10.3, -90), (10.4, -13), (16.3, -12), (26.4, -15), (29.6, -18), (D2['start_s'] - 0.05, -90), (40, -90)])
    tick_g = auto([(0, -90), (0.4, -16), (D1['start_s'], -16), (D1['start_s'] + 0.1, -14), (D1['end_s'], -14), (D2['end_s'], -14), (D2['end_s'] + 0.3, -16), (33.9, -16), (34.4, -40)])
    chords = [(65.41, [523.25, 659.25, 783.99, 880.0]),   # C  : C2 | C5 E5 G5 A5
              (55.00, [440.00, 523.25, 659.25, 783.99]),  # Am : A1 | A4 C5 E5 G5
              (43.65, [349.23, 440.00, 523.25, 659.25]),  # F  : F1 | F4 A4 C5 E5
              (49.00, [392.00, 493.88, 587.33, 783.99])]  # G  : G1 | G4 B4 D5 G5
    pat = [0, 2, 1, 3, 2, 1, 3, 2]
    r = np.random.default_rng(126)
    bar = 4 * BEAT
    nb = int((TOTAL + 0.4 - M0) / bar) + 1
    def put(x, t, g=1.0):
        i = int(t * SR)
        if i < 0 or i >= N: return
        e = min(N, i + len(x)); mus[i:e] += x[: e - i] * g
    for b in range(nb):
        root, arp = chords[b % 4]
        t0 = M0 + b * bar
        # bass: beat 1, the "and" of 2, beat 3
        for off, dur, amp in ((0, 0.9, 1.0), (1.5 * BEAT, 0.5, 0.6), (2 * BEAT, 0.9, 0.8), (3.5 * BEAT, 0.4, 0.5)):
            tt = t0 + off
            put(pluck_bass(root * (2 if off == 1.5 * BEAT else 1) * 2, dur, amp), tt, 0.9 * bass_g(tt))
        for beat in (0, 2):
            tt = t0 + beat * BEAT
            put(kick(1.0), tt, 0.8 * kick_g(tt))
        for k in range(8):
            tt = t0 + k * EIGHTH
            if k % 2 == 1:
                put(hat(f'h{b}{k}', 1.0), tt, 0.5 * hat_g(tt))
            put(tick_m(1.0), tt, 0.45 * tick_g(tt) * (1.0 if k % 2 == 0 else 0.6))
            play = r.random() < (0.85 if k in (0, 2, 4, 6) else 0.6)
            if play:
                f = arp[pat[k]] * (2 if (b % 4 == 3 and k == 7) else 1)
                put(mallet(f, 0.45, 0.8 if k % 2 == 0 else 0.55), tt, 0.55 * arp_g(tt))
        put(wood(1.0), t0 + 3 * BEAT, 0.35 * hat_g(t0 + 3 * BEAT))
    # stab after the stamp (a small musical answer) and the dock resolution phrase
    for f in (261.63, 329.63, 392.0):
        put(mallet(f, 0.5, 1.0), stamp_t + 0.04, 0.32)
    dock_t = EV['B07.tool.dock']
    for i, f in enumerate((659.25, 783.99, 1046.5)):
        put(mallet(f, 0.9, 1.0), dock_t + 0.10 + i * 0.2381, 0.34)
    # final tag after the register click: tonic chord that rings out
    end_t = EV['B09.budget.tag_contact'] + 0.18
    for f in (523.25, 659.25, 1046.5):
        put(mallet(f, 1.4, 1.0), end_t, 0.30)
    put(pluck_bass(65.41 * 2, 1.2, 1.0), end_t, 0.7)
    return mus


# ------------------------------------------------------------------ mix
def voice_env(voice):
    win = int(0.02 * SR)
    rms = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode='same'))
    rms /= max(1e-9, np.percentile(rms, 98))
    env = np.zeros_like(rms)
    a, rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.28 * SR))
    for i in range(1, len(rms)):  # attack/release follower
        c = a if rms[i] > env[i - 1] else rel
        env[i] = c * env[i - 1] + (1 - c) * rms[i]
    return np.clip(env / 0.5, 0, 1)


def pan_gains(p):
    ang = (p + 1) * np.pi / 4
    return np.cos(ang), np.sin(ang)


def main():
    voice = read_wav(f'{ROOT}/audio/narration_48k.wav')
    v = np.zeros(N); v[: min(N, len(voice))] = voice[:N]
    env = voice_env(v)

    music = build_music() * 0.9
    plan = sfx_plan()
    sfx_L = np.zeros(N); sfx_R = np.zeros(N)
    log = ['cue_id,event,time_s,frame,layer,gain_db,pan,description']
    for p in plan:
        x = p['fx']; i = int(p['t'] * SR)
        g = 10 ** (p['db'] / 20)
        l, r = pan_gains(p['pan'])
        e = min(N, i + len(x))
        if i < 0 or e <= i: continue
        sfx_L[i:e] += x[: e - i] * g * l * 1.414
        sfx_R[i:e] += x[: e - i] * g * r * 1.414
        log.append(f"{p['cue']},{p['ev']},{p['t']:.3f},{int(round(p['t'] * 30))},sfx,{p['db']},{p['pan']},{p['note']}")
    log.append('M01,full_story,0.30,9,music,,0,original synth bed 126 BPM; pockets D01/D02 from cues.json')

    # voice-driven ducking: music -7 dB under speech, broadband effects -3 dB; both recover between phrases
    duck_m = 1 - 0.58 * env
    duck_s = 1 - 0.30 * env
    music_g = 10 ** (-15.5 / 20)
    mus_st = np.stack([music, music], 1) * (music_g * duck_m)[:, None]
    sfx_st = np.stack([sfx_L, sfx_R], 1) * duck_s[:, None]
    vox_st = np.stack([v, v], 1)

    mix = vox_st * 1.0 + mus_st + sfx_st
    # loudness + peak control (two-pass: measure, scale, limit, verify)
    tmp = f'{ROOT}/audio/_raw_mix.wav'; write_wav(tmp, mix / max(1.0, np.max(np.abs(mix)) / 0.95))
    def lufs(path, extra=''):
        out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
        I = float(out.split('Integrated loudness:')[-1].split('I:')[1].split('LUFS')[0])
        tp = float(out.split('True peak:')[-1].split('Peak:')[1].split('dBFS')[0])
        return I, tp
    I0, _ = lufs(tmp)
    target = -14.4
    gain_db = target - I0
    mixg = mix / max(1.0, np.max(np.abs(mix)) / 0.95) * 10 ** (gain_db / 20)
    final = f'{ROOT}/audio/_limited.wav'
    write_wav(f'{ROOT}/audio/_pre.wav', np.clip(mixg, -4, 4) / 4)  # headroom container
    # alimiter works on float; feed via ffmpeg volume to restore level
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', f'{ROOT}/audio/_pre.wav', '-af', 'volume=12.0412dB,alimiter=limit=0.84:attack=3:release=60:level=disabled', '-ar', str(SR), '-c:a', 'pcm_s16le', final], check=True)
    I1, tp1 = lufs(final)
    # trim trailing silence below -60 dB handled by fixed duration; final length = TOTAL_S
    n_out = int(TOTAL * SR)
    out = read_wav_stereo(final)[:n_out]
    # gentle fade over the last 0.12 s so the file never ends on a hard edge
    f = int(0.12 * SR); out[-f:] *= np.linspace(1, 0, f)[:, None]
    write_wav(f'{ROOT}/audio/FGW_Atlas_No_Pinky_mix.wav', out)
    I2, tp2 = lufs(f'{ROOT}/audio/FGW_Atlas_No_Pinky_mix.wav')

    # stems (same gain structure as the mix, un-limited), trimmed to the same length
    sg = 10 ** (gain_db / 20) / max(1.0, np.max(np.abs(mix)) / 0.95)
    write_wav(f'{ROOT}/audio/stems/narration.wav', (vox_st * sg)[:n_out])
    write_wav(f'{ROOT}/audio/stems/music.wav', (mus_st * sg)[:n_out])
    write_wav(f'{ROOT}/audio/stems/effects.wav', (sfx_st * sg)[:n_out])
    open(f'{ROOT}/audio/sfx_log.csv', 'w').write('\n'.join(log) + '\n')
    for tmpf in ('_raw_mix.wav', '_pre.wav', '_limited.wav'):
        try: os.remove(f'{ROOT}/audio/{tmpf}')
        except OSError: pass
    os.makedirs(f'{ROOT}/source/public/audio', exist_ok=True)
    subprocess.run(['cp', f'{ROOT}/audio/FGW_Atlas_No_Pinky_mix.wav', f'{ROOT}/source/public/audio/final_mix.wav'], check=True)
    json.dump({'target_lufs': target, 'measured_integrated_lufs': I2, 'true_peak_dbfs': tp2, 'pre_limiter_lufs': I0, 'post_limiter_lufs_before_fade': I1,
               'sample_rate': SR, 'duration_s': TOTAL, 'ducking': 'music -7 dB (0.58 depth) under speech, effects -3 dB, voice-envelope follower 30 ms attack / 280 ms release',
               'music_bpm': BPM, 'sfx_events': len(plan)}, open(f'{ROOT}/audio/MIX_LOG.json', 'w'), indent=1)
    print(f'integrated {I2:.2f} LUFS, true peak {tp2:.2f} dBTP, {len(plan)} sfx')


def read_wav_stereo(path):
    with wave.open(path) as w:
        n, ch = w.getnframes(), w.getnchannels()
        raw = w.readframes(n)
    return (np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768.0).reshape(-1, ch)


if __name__ == '__main__':
    main()
