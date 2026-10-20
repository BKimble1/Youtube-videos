#!/usr/bin/env python3
"""Telepathy Flaw V2: build the music, effects and mix stems from audio/cues.json and the narration master.

Everything is synthesised with numpy (seeded per cue, so a rebuild is bit-identical); no library music, no third-party
samples. The narration is the ElevenLabs Test Voice take (audio/narration/narration_final_48k.wav), unprocessed.

Design (script/SOUND.md has the cue-by-cue notes):
  * music   a very low, slightly uneasy drone under everything (partials on the 1/30 Hz grid, so it is exactly periodic
            and closes the loop), a clean futuristic bed (soft pad + sparse pentatonic plucks) that exists only until
            "until" and is cut in the dash gap before it, and an electrical texture (periodic 0.75 s ticks, hum, hiss)
            that peaks across the loop seam: it is the same texture at the end of the film and at frame 0
  * effects one-shot UI ticks, signal blips, the friendly arrival chime (used at 3.35 s and 10.9 s) and the same chime
            again at the delivery, lower and dry in the quiet mix, a crackle at "until", a dry alarm at the warning,
            the cancel tap and the late double tick, a rising wipe that resolves into the seam texture
  * mix     stems share one master gain envelope (static gain to -16 LUFS + a lookahead limiter to -1.2 dBFS), so the
            three int24 stems sum EXACTLY to the mix. Music is ducked under speech; effects are ducked 2.5 dB.

Outputs: audio/stems/{narration,music,effects}.wav, audio/mix/FGW_TelepathyFlaw_mix_48k.wav, audio/MIX_LOG.json
Usage: python3 -B tools/build_audio.py
"""
import sys

sys.dont_write_bytecode = True
import hashlib
import json
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
A = ROOT / 'audio' / 'v2'
A_NAR = ROOT / 'audio' / 'narration'
SR = 48000
FPS = 30
DUR = 28.0
N = int(SR * DUR)
FULL = 8388607
TARGET_LUFS = -16.0
CEIL_DB = -1.2
MUSIC_TRIM = 5.0  # dB, music stem before ducking
FX_TRIM = -9.0  # dB, effects stem before ducking


# ----------------------------------------------------------------------------------------------- helpers
def db(x):
    return 10 ** (x / 20)


def tt(n):
    return np.arange(n) / SR


def rng_for(*key):
    h = hashlib.sha256(repr(key).encode()).digest()
    return np.random.default_rng(int.from_bytes(h[:8], 'little'))


def fft_filter(x, lo=None, hi=None, order=2):
    """zero-phase spectral band filter with smooth edges (lo = high-pass corner, hi = low-pass corner)"""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1e-9)) ** (2 * order))
    if hi:
        g *= 1 / (1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * g, n)


def noise(n, seed, lo=None, hi=None):
    r = rng_for('noise', seed)
    return fft_filter(r.standard_normal(n), lo, hi)


def ad(n, a, d, power=2.0):
    """attack-decay envelope over n samples (seconds a, d)"""
    t = tt(n)
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(d, 1e-4) * power / 2)
    return e


def fade_edges(x, a=0.004, b=0.01):
    n = len(x)
    na, nb = int(a * SR), int(b * SR)
    x = x.copy()
    if na:
        x[:na] *= np.linspace(0, 1, na)
    if nb:
        x[-nb:] *= np.linspace(1, 0, nb)
    return x


def glide(f0, f1, n, power=1.0):
    t = np.linspace(0, 1, n) ** power
    f = f0 + (f1 - f0) * t
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def pan_gains(p):
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


class Bus:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def put(self, x, t0, gain_db=0.0, pan=0.0, pan_to=None):
        i0 = int(round(t0 * SR))
        n = len(x)
        a, b = max(0, i0), min(N, i0 + n)
        if b <= a:
            return
        seg = x[a - i0:b - i0] * db(gain_db)
        if pan_to is None:
            l, r = pan_gains(pan)
            self.L[a:b] += seg * l
            self.R[a:b] += seg * r
        else:
            p = np.linspace(pan, pan_to, len(seg))
            ang = (p + 1) * np.pi / 4
            self.L[a:b] += seg * np.cos(ang)
            self.R[a:b] += seg * np.sin(ang)


def reverb_ir(seconds=0.9, seed=1, lp=5000):
    n = int(seconds * SR)
    r = rng_for('ir', seed)
    ir = r.standard_normal(n) * np.exp(-tt(n) / (seconds / 5.5))
    ir = fft_filter(ir, 250, lp)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt((ir ** 2).sum())


def with_reverb(x, wet_db=-14, seconds=0.9, seed=1):
    ir = reverb_ir(seconds, seed)
    n = len(x) + len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)
    out = np.zeros(n)
    out[: len(x)] += x
    out += y * db(wet_db) * np.sqrt((x ** 2).sum() / max(1e-12, (y ** 2).sum())) * 1.0
    return out


# ----------------------------------------------------------------------------------------------- one-shot voices
def v_ping(seed):
    n = int(0.16 * SR)
    t = tt(n)
    tick = np.sin(2 * np.pi * 2350 * t) * np.exp(-t / 0.006)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.02) * 0.5
    click = noise(n, seed, 5000, 11000) * np.exp(-t / 0.0015) * 0.6
    sparkle = np.sin(2 * np.pi * 4700 * t) * np.exp(-t / 0.03) * 0.18
    return fade_edges(tick * 0.8 + body + click + sparkle, 0.0005, 0.02)


def v_zip(seed, lane=0, red=False):
    n = int(0.07 * SR)
    t = tt(n)
    f = 1700 + 190 * lane
    if red:
        x = (np.sin(2 * np.pi * 740 * t) + np.sin(2 * np.pi * 783 * t) + 0.5 * np.sin(2 * np.pi * 370 * t)) * ad(n, 0.004, 0.03)
        return fade_edges(fft_filter(x, 150, 2600), 0.001, 0.01) * 0.9
    x = np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * 40 * t)) * ad(n, 0.003, 0.02)
    return fade_edges(x, 0.001, 0.01) * 0.8


def v_sweep(seed, dur):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = noise(n, seed, 900, 9000)
    # moving band: crossfade a few noise bands in time for a rising shimmer
    lo = fft_filter(nz, 500, 1800)
    hi = fft_filter(nz, 2500, 9000)
    x = lo * (1 - t) + hi * t
    x *= np.sin(np.pi * np.minimum(1, t * 1.15)) ** 1.5 * t ** 0.5
    x += 0.5 * glide(420, 3100, n, 1.7) * (t ** 1.4) * np.sin(np.pi * t) ** 0.8
    return fade_edges(x, 0.01, 0.06) * 0.7


def v_form(seed, dur, low=False):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    f0, f1 = (190, 330) if low else (620, 1650)
    x = glide(f0, f1, n, 1.2) * np.sin(np.pi * t) ** 0.7
    x += 0.35 * glide(f0 * 2.01, f1 * 2.01, n, 1.2) * np.sin(np.pi * t) ** 1.4
    x += 0.15 * noise(n, seed, 3000, 9000) * np.sin(np.pi * t)
    if low:
        x = fft_filter(x, 80, 900)
    return fade_edges(x, 0.004, 0.03) * 0.8


def v_whoosh(seed, dur, rise=True, low=False):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = noise(n, seed, 120, 12000)
    a, b = (180, 700) if low else (600, 3600)
    bands = [fft_filter(nz, a * k, a * k * 2.4) for k in (1, 2, 4)]
    x = bands[0] * (1 - t) ** 2 + bands[1] * 2 * t * (1 - t) + bands[2] * t ** 2 if rise else bands[2] * (1 - t) ** 2 + bands[1] * 2 * t * (1 - t) + bands[0] * t ** 2
    x *= np.sin(np.pi * t) ** 1.6
    if low:
        x += 0.5 * glide(70, 110, n, 1.0) * np.sin(np.pi * t) ** 1.2
    return fade_edges(x, 0.02, 0.1) * 0.9


def bell(f, dur, amp=1.0, detune=0.0, seed=0):
    n = int(dur * SR)
    t = tt(n)
    f = f * 2 ** (detune / 1200)
    x = np.zeros(n)
    for ratio, a, d in ((1.0, 1.0, 0.55), (2.76, 0.42, 0.22), (5.4, 0.17, 0.1), (1.504, 0.25, 0.35), (8.9, 0.06, 0.05)):
        x += a * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (d * dur / 0.8 + 1e-3))
    x *= np.minimum(1, t / 0.002)
    return x * amp


def v_chime(seed, bad=False):
    if not bad:
        dur = 1.5
        n = int(dur * SR)
        x = np.zeros(n)
        for f, off, amp in ((659.3, 0.0, 1.0), (987.8, 0.13, 0.85)):
            b = bell(f, 1.3, amp)
            i0 = int(off * SR)
            x[i0:i0 + len(b)] += b[: n - i0]
        return with_reverb(fade_edges(x, 0.001, 0.05), -11, 1.1, 3) * 0.55
    dur = 0.9
    n = int(dur * SR)
    x = np.zeros(n)
    for f, off, amp, det in ((659.3, 0.0, 1.0, -22), (987.8, 0.13, 0.85, -48)):
        b = bell(f, 0.8, amp, det)
        i0 = int(off * SR)
        x[i0:i0 + len(b)] += b[: n - i0]
    x = fft_filter(x, 120, 3200)
    t = tt(n)
    sub = np.sin(2 * np.pi * 55 * t) * np.exp(-t / 0.28) * np.minimum(1, t / 0.01) * 0.9
    return fade_edges(x * 0.6 + sub, 0.001, 0.06) * 0.7


def v_open(seed, dur, closing=False):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    x = noise(n, seed, 700, 3200) * np.sin(np.pi * t) ** 2
    x += 0.35 * glide(520, 1350, n) * np.sin(np.pi * t) ** 2 * (0.5 if not closing else 0.0)
    if closing:
        x = x[::-1]
    return fade_edges(x, 0.01, 0.05) * 0.6


def v_tag(seed):
    n = int(0.06 * SR)
    t = tt(n)
    return fade_edges(np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.008), 0.0005, 0.01) * 0.7


def v_pop(seed):
    n = int(0.08 * SR)
    return fade_edges(glide(480, 960, n, 0.6) * ad(n, 0.002, 0.04), 0.001, 0.01) * 0.9


def v_glitch(seed, dur=0.22):
    n = int(dur * SR)
    r = rng_for('glitch', seed)
    x = np.zeros(n)
    t = 0.0
    while t < dur - 0.01:
        ln = int(r.uniform(0.001, 0.009) * SR)
        i = int(t * SR)
        seg = r.standard_normal(ln) * np.hanning(ln)
        if r.random() < 0.5:
            seg = np.sign(seg) * (np.abs(seg) > 0.3)  # a crushed burst
        x[i:i + ln] += seg[: n - i] * r.uniform(0.4, 1.0)
        t += r.uniform(0.004, 0.026)
    x = fft_filter(x, 400, 9000)
    tl = tt(n)
    x += 0.8 * np.sin(2 * np.pi * 62 * tl) * np.exp(-tl / 0.09)
    return fade_edges(x, 0.0005, 0.02) * 0.8


def v_swell(seed, dur):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    x = (np.sin(2 * np.pi * 55 * tt(n)) + 0.6 * np.sin(2 * np.pi * 58 * tt(n)) + 0.3 * np.sin(2 * np.pi * 110 * tt(n))) * (t ** 1.8) * (1 - t) ** 0.6
    return fade_edges(x, 0.02, 0.1) * 0.9


def v_thump(seed):
    n = int(0.45 * SR)
    t = tt(n)
    return fade_edges(np.sin(2 * np.pi * (52 + 30 * np.exp(-t / 0.04)) * t) * np.exp(-t / 0.13), 0.002, 0.05)


def v_alarm(seed):
    out = np.zeros(int(0.36 * SR))
    for off, f in ((0.0, 880.0), (0.17, 622.3)):
        n = int(0.1 * SR)
        t = tt(n)
        x = np.sign(np.sin(2 * np.pi * f * t)) * 0.6 + np.sin(2 * np.pi * f * t) * 0.4
        x = fft_filter(x, 300, 2600) * ad(n, 0.003, 0.07)
        i = int(off * SR)
        out[i:i + n] += fade_edges(x, 0.001, 0.01)
    return out * 0.8


def v_tick(seed):
    n = int(0.03 * SR)
    t = tt(n)
    return fade_edges(np.sin(2 * np.pi * 2000 * t) * np.exp(-t / 0.004), 0.0005, 0.005)


def v_static(seed, dur):
    n = int(dur * SR)
    r = rng_for('static', seed)
    gate = (r.random(int(dur / 0.006) + 2) < 0.45).astype(float)
    g = np.interp(np.arange(n) / SR, np.arange(len(gate)) * 0.006, gate)
    x = noise(n, seed, 3000, 10000) * g * np.sin(np.pi * np.linspace(0, 1, n))
    return fade_edges(x, 0.005, 0.05) * 0.8


def v_tap(seed):
    n = int(0.12 * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * 1100 * t) * np.exp(-t / 0.012) + 0.9 * np.sin(2 * np.pi * 210 * t) * np.exp(-t / 0.03) + 0.4 * noise(n, seed, 3000, 9000) * np.exp(-t / 0.003)
    return fade_edges(x, 0.0005, 0.02) * 0.8


def v_ring(seed, dur):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    x = glide(440, 880, n, 1.3) * (0.6 + 0.4 * np.sin(2 * np.pi * 5 * tt(n)))
    x *= np.minimum(1, t * 8) * np.minimum(1, (1 - t) * 20)
    return fade_edges(fft_filter(x, 200, 2500), 0.03, 0.1) * 0.5


def v_late(seed):
    out = np.zeros(int(0.2 * SR))
    for off in (0.0, 0.075):
        n = int(0.04 * SR)
        t = tt(n)
        x = fft_filter(np.sin(2 * np.pi * 760 * t) * np.exp(-t / 0.012), 200, 1300)
        i = int(off * SR)
        out[i:i + n] += fade_edges(x, 0.001, 0.01)
    return out


def v_pass(seed, dur):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    x = glide(230, 150, n, 0.8) * np.sin(np.pi * t) ** 1.4 + 0.4 * glide(460, 300, n, 0.8) * np.sin(np.pi * t) ** 2
    x += 0.2 * noise(n, seed, 150, 900) * np.sin(np.pi * t)
    return fade_edges(x, 0.05, 0.1) * 0.7


def v_inhale(seed):
    n = int(0.55 * SR)
    t = np.linspace(0, 1, n)
    x = noise(n, seed, 500, 2800)
    x *= np.where(t < 0.72, (t / 0.72) ** 1.6, ((1 - t) / 0.28) ** 1.2)
    return fade_edges(x, 0.02, 0.05) * 0.9


def v_rustle(seed):
    n = int(0.32 * SR)
    r = rng_for('rustle', seed)
    g = np.interp(tt(n), np.arange(60) * 0.0055, r.random(60) ** 2)
    x = noise(n, seed, 1800, 7000) * g * np.sin(np.pi * np.linspace(0, 1, n))
    return fade_edges(x, 0.01, 0.05) * 1.2


def v_wipe(seed, dur):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = noise(n, seed, 100, 12000)
    lo, mid, hi = fft_filter(nz, 150, 700), fft_filter(nz, 700, 2600), fft_filter(nz, 2600, 9500)
    x = lo * (1 - t) ** 2 + mid * 2 * t * (1 - t) + hi * t ** 2
    x += 0.5 * glide(160, 920, n, 1.6) * t ** 1.2
    x *= np.minimum(1, t * 6) * (1 - np.clip((t - 0.86) / 0.14, 0, 1) ** 1.5)
    return fade_edges(x, 0.01, 0.01) * 0.85


# ----------------------------------------------------------------------------------------------- music
def circ_bump(t, width):
    """1 at the loop seam (t = 0 = 30 s), falling to 0 `width` s either side"""
    d = np.minimum(t, DUR - t)
    x = np.clip(1 - d / width, 0, 1)
    return x * x * (3 - 2 * x)


def periodic_noise(seed, lo, hi):
    """band-limited noise that is exactly periodic over the 30 s (spectral synthesis), so it closes the loop"""
    r = rng_for('pn', seed)
    n = N
    X = np.zeros(n // 2 + 1, dtype=complex)
    f = np.fft.rfftfreq(n, 1 / SR)
    m = (f >= lo) & (f <= hi)
    X[m] = np.exp(1j * r.uniform(0, 2 * np.pi, m.sum())) * (1 / np.maximum(f[m], 1) ** 0.3)
    x = np.fft.irfft(X, n)
    return x / np.abs(x).max()


def smooth_env(x, a, rel):
    """one-pole attack/release follower (vectorised by blocks of 16 samples)"""
    blk = 16
    nb = len(x) // blk
    y = np.abs(x[: nb * blk]).reshape(nb, blk).max(1)
    out = np.zeros(nb)
    ca = np.exp(-blk / (a * SR))
    cr = np.exp(-blk / (rel * SR))
    s = 0.0
    for i in range(nb):
        c = ca if y[i] > s else cr
        s = c * s + (1 - c) * y[i]
        out[i] = s
    return np.interp(np.arange(len(x)) / blk, np.arange(nb), out)


def build_music(cues):
    beats = cues['beats']
    t = tt(N)
    m = Bus()
    until = cues['words']['untilS']
    dash = cues['words']['seamlesslyE']  # the 0.485 s silence in the narration starts here
    # ---- the drone: partials on the 1/30 Hz grid, periodic over 30 s
    snap = lambda f: round(f * DUR) / DUR  # every partial has an integer number of cycles in 28 s: exactly periodic
    f1, f2, f3 = snap(55.0), snap(55.8), snap(82.5)
    drone = (np.sin(2 * np.pi * f1 * t) + 0.8 * np.sin(2 * np.pi * f2 * t + 0.4) + 0.35 * np.sin(2 * np.pi * f3 * t + 1.1) + 0.25 * np.sin(2 * np.pi * snap(110.1) * t + 0.2) + 0.18 * np.sin(2 * np.pi * snap(116.4) * t + 2.0))
    # level: quiet and uneasy under the opening, a little louder and darker after "until" (the only bed left)
    lvl = db(-37) + (db(-29) - db(-37)) * np.clip((t - until) / 0.6, 0, 1)
    lvl = lvl * (1 - 0.0 * t)
    # back to the opening level over the last seconds so the seam is continuous (periodic envelope)
    lvl = np.where(t > 26.7, db(-29) + (db(-37) - db(-29)) * np.clip((t - 26.7) / 1.3, 0, 1), lvl)
    drone *= lvl
    # slow beating shimmer in the right channel only (the uneasy part)
    m.L += drone * 0.9
    m.R += drone * 0.9 + np.sin(2 * np.pi * snap(56.2) * t + 0.9) * lvl * 0.25
    # ---- the bright bed (clean, futuristic): a soft pad and sparse pentatonic plucks, only until "until"
    bright_on = np.clip(t / 0.9, 0, 1) * (1 - np.clip((t - (dash + 0.02)) / 0.18, 0, 1))
    pad = np.zeros(N)
    for f, a in ((110.0, 1.0), (164.7, 0.8), (246.9, 0.55), (261.6, 0.5), (329.7, 0.35)):
        # detune by whole grid steps so the pad does not matter for the loop (it is off at both ends)
        pad += a * (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.002 * t + 1))
    pad *= (0.6 + 0.4 * np.sin(2 * np.pi * t / 6 - 1.2)) * bright_on * db(-39)
    m.L += pad * 0.9
    m.R += pad * 0.9
    notes = [220.0, 261.6, 293.7, 329.7, 392.0, 440.0, 523.3]
    r = rng_for('arp')
    step = 0.5
    k = 0
    tpos = 1.0
    while tpos < dash - 0.05:
        f = notes[[0, 3, 5, 2, 4, 1, 6, 3][k % 8]]
        n = int(0.55 * SR)
        tn = tt(n)
        x = (np.sin(2 * np.pi * f * tn) + 0.3 * np.sin(2 * np.pi * 2 * f * tn)) * np.exp(-tn / 0.13) * np.minimum(1, tn / 0.004)
        x = fade_edges(x, 0.001, 0.05)
        if r.random() < 0.82:
            m.put(x, tpos, -39, pan=-0.35 + 0.7 * ((k * 5) % 7) / 6)
        k += 1
        tpos += step
    # ---- the seam texture: periodic 0.75 s ticks + hum + hiss, strongest across the loop seam
    seam = circ_bump(t, 1.4)
    hiss = periodic_noise(7, 3500, 12000) * seam * db(-47)
    hum = (np.sin(2 * np.pi * 100.0 * t) * 0.6 + np.sin(2 * np.pi * 150.0 * t) * 0.35 + np.sin(2 * np.pi * 300.0 * t) * 0.18) * seam * db(-44)
    flutter = (0.5 + 0.5 * np.sin(2 * np.pi * t / 0.35)) ** 3
    m.L += hiss * flutter + hum
    m.R += hiss * (1 - 0.3 * flutter) + hum
    return m


# ----------------------------------------------------------------------------------------------- effects
def build_effects(cues):
    fx = Bus()
    for i, c in enumerate(cues['cues']):
        k = c['kind']
        t0 = c['t']
        g = c.get('gain', 0.0)
        pan = c.get('pan', 0.0)
        seed = i + 1
        p = c.get('p', {})
        d = c.get('dur', 0.3)
        if k == 'ping':
            x = v_ping(seed)
        elif k == 'zip':
            x = v_zip(seed, p.get('lane', 0))
        elif k == 'zipred':
            x = v_zip(seed, p.get('lane', 0), True)
        elif k == 'sweep':
            x = v_sweep(seed, d)
        elif k == 'form':
            x = v_form(seed, d, bool(p.get('low')))
        elif k in ('whoosh',):
            x = v_whoosh(seed, d, bool(p.get('rise', 1)), bool(p.get('low')))
            fx.put(x, t0, g, p.get('from', pan), p.get('to', pan))
            continue
        elif k == 'chime':
            x = v_chime(seed)
        elif k == 'chimebad':
            x = v_chime(seed, True)
        elif k == 'open':
            x = v_open(seed, d)
        elif k == 'close':
            x = v_open(seed, d, True)
        elif k == 'tag':
            x = v_tag(seed)
        elif k == 'pop':
            x = v_pop(seed)
        elif k == 'glitch':
            x = v_glitch(seed, d)
        elif k == 'swell':
            x = v_swell(seed, d)
        elif k == 'thump':
            x = v_thump(seed)
        elif k == 'alarm':
            x = v_alarm(seed)
        elif k == 'tick':
            x = v_tick(seed)
        elif k == 'static':
            x = v_static(seed, d)
        elif k == 'tap':
            x = v_tap(seed)
        elif k == 'ring':
            x = v_ring(seed, d)
        elif k == 'late':
            x = v_late(seed)
        elif k == 'pass':
            x = v_pass(seed, d)
            fx.put(x, t0, g, p.get('from', pan), p.get('to', pan))
            continue
        elif k == 'inhale':
            x = v_inhale(seed)
        elif k == 'rustle':
            x = v_rustle(seed)
        elif k == 'wipe':
            x = v_wipe(seed, d)
        else:
            raise ValueError(k)
        fx.put(x, t0, g, pan)
    return fx


# ----------------------------------------------------------------------------------------------- mix
def read_wav24(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float64)


def write_wav24(path, L, R):
    """exact int24 stereo WAV through ffmpeg (inputs are already int-valued floats in +-FULL)"""
    li = np.clip(np.round(L), -FULL, FULL).astype(np.int64)
    ri = np.clip(np.round(R), -FULL, FULL).astype(np.int64)
    inter = np.empty(len(li) * 2, dtype=np.int64)
    inter[0::2], inter[1::2] = li, ri
    b = np.stack([(inter >> 0) & 255, (inter >> 8) & 255, (inter >> 16) & 255], axis=1).astype(np.uint8).tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's24le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', str(path)], input=b, check=True)
    return li, ri


def read_int24(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.int32).astype(np.int64) >> 8
    return a[0::2], a[1::2]


def lufs_and_tp(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    out = {}
    for key, tag in (('lufs', 'I:'), ('lra', 'LRA:'), ('tp', 'Peak:')):
        for line in r.splitlines()[::-1]:
            s = line.strip()
            if s.startswith(tag):
                out[key] = float(s.split()[1])
                break
    return out


def limiter_gain(L, R, ceil_lin, look=0.002, rel=0.09):
    pk = np.maximum(np.abs(L), np.abs(R))
    need = np.minimum(1.0, ceil_lin / np.maximum(pk, 1e-9))
    nl = int(look * SR)
    # lookahead min-filter, then a smooth release
    m = need.copy()
    for s in range(1, nl + 1):
        m[:-s] = np.minimum(m[:-s], need[s:])
    out = np.ones_like(m)
    cr = np.exp(-1 / (rel * SR))
    cur = 1.0
    blk = 8
    nb = len(m) // blk
    mb = m[: nb * blk].reshape(nb, blk).min(1)
    ob = np.ones(nb)
    cb = np.exp(-blk / (rel * SR))
    for i in range(nb):
        cur = mb[i] if mb[i] < cur else cb * cur + (1 - cb) * mb[i]
        ob[i] = cur
    g = np.interp(np.arange(len(m)) / blk, np.arange(nb), ob)
    return np.minimum(g, m)


def main():
    cues = json.load(open(A / 'cues.json'))
    nar = read_wav24(A_NAR / 'narration_final_48k.wav')[:N]  # the unchanged take, trimmed to the V2 length (speech ends 27.39 s)
    assert len(nar) == N, (len(nar), N)
    assert np.abs(nar[int(27.62 * SR):]).max() < 1e-4
    music = build_music(cues)
    fx = build_effects(cues)
    music.L *= db(MUSIC_TRIM)
    music.R *= db(MUSIC_TRIM)
    fx.L *= db(FX_TRIM)
    fx.R *= db(FX_TRIM)

    # ---- ducking from the narration (speech envelope, fast attack, slower release)
    sp = smooth_env(nar, 0.02, 0.28)
    sp = np.clip((sp - 0.01) / 0.05, 0, 1)
    duck_music = 1 - sp * (1 - db(-7.0))
    duck_fx = 1 - sp * (1 - db(-2.5))
    music.L *= duck_music
    music.R *= duck_music
    fx.L *= duck_fx
    fx.R *= duck_fx

    # ---- balance: narration leads; one static gain then a limiter, shared by all three stems
    nar_g = db(-3.0) / np.abs(nar).max()
    NL = nar * nar_g
    NR = nar * nar_g

    def total(gs):
        return NL + music.L + fx.L, NR + music.R + fx.R

    g_static = 1.0
    for _ in range(3):
        SL, SR_ = total(0)
        SL, SR_ = SL * g_static, SR_ * g_static
        tmp = A / 'mix' / '_tmp.wav'
        tmp.parent.mkdir(parents=True, exist_ok=True)
        write_wav24(tmp, SL * FULL * 0.98, SR_ * FULL * 0.98)
        meas = lufs_and_tp(tmp)
        g_static *= db(TARGET_LUFS - meas['lufs'])
    SL, SR_ = total(0)
    lim = limiter_gain(SL * g_static, SR_ * g_static, db(CEIL_DB) / 0.98)
    G = g_static * lim
    stems = {
        'narration': (NL * G, NR * G),
        'music': (music.L * G, music.R * G),
        'effects': (fx.L * G, fx.R * G),
    }
    scale = FULL * 0.98
    ints = {}
    for name, (l, r) in stems.items():
        p = A / 'stems' / f'{name}.wav'
        p.parent.mkdir(parents=True, exist_ok=True)
        ints[name] = write_wav24(p, l * scale, r * scale)
    mixL = ints['narration'][0] + ints['music'][0] + ints['effects'][0]
    mixR = ints['narration'][1] + ints['music'][1] + ints['effects'][1]
    mix_path = A / 'mix' / 'FGW_TelepathyFlaw_V2_mix_48k.wav'
    write_wav24(mix_path, mixL.astype(np.float64), mixR.astype(np.float64))
    (A / 'mix' / '_tmp.wav').unlink(missing_ok=True)
    meas = lufs_and_tp(mix_path)
    peak = max(np.abs(mixL).max(), np.abs(mixR).max()) / FULL
    rl, rr = read_int24(mix_path)
    log = {
        'target_lufs': TARGET_LUFS,
        'measured': meas,
        'sample_peak_dbfs': round(20 * np.log10(peak), 2),
        'limiter_max_reduction_db': round(-20 * np.log10(lim.min()), 2),
        'static_gain_db': round(20 * np.log10(g_static), 2),
        'stems_sum_exactly_to_mix': bool(np.array_equal(rl, mixL) and np.array_equal(rr, mixR)),
        'duration_s': DUR,
        'listened': False,
        'note': 'Nothing in this build has been listened to; every figure is a measurement.',
        'stem_peaks_dbfs': {k: round(20 * np.log10(max(np.abs(v[0]).max(), np.abs(v[1]).max()) / FULL + 1e-9), 2) for k, v in ints.items()},
    }
    json.dump(log, open(A / 'MIX_LOG.json', 'w'), indent=1)
    print(json.dumps(log, indent=1))


if __name__ == '__main__':
    main()
