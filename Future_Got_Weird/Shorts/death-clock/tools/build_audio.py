#!/usr/bin/env python3
"""Build the Death Clock mix from audio/cues.json (exported from the same TypeScript modules as the picture).

Stems (48 kHz stereo, 24-bit):  narration (the locked, pause-only edited take), effects (procedural one-shots
plus five generated Foley clips), music (procedural bed). Music is ducked under speech by a sidechain
envelope derived from the narration; effects are ducked lightly. The summed mix is normalized with ffmpeg
loudnorm (two passes, linear) to -15 LUFS integrated with a -1.5 dBTP ceiling; the same gain is applied to
every stem, so the stems sum to the mix. Deterministic: every random draw is seeded from the cue id.

Usage: python3 tools/build_audio.py            (writes audio/stems/*.wav, audio/mix/*, audio/MIX_LOG.json)
"""
import hashlib
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR = 48000
CUES = json.load(open(ROOT / 'audio' / 'cues.json'))
FPS = CUES['fps']
TOTAL_S = CUES['total_frames'] / FPS
N = int(round(TOTAL_S * SR))
GEN = ROOT / 'audio' / 'sfx' / 'gen'


# ------------------------------------------------------------------ helpers
def rng(name):
    return np.random.default_rng(int(hashlib.sha1(name.encode()).hexdigest()[:8], 16))


def tg(d):
    return np.arange(int(d * SR)) / SR


def bandpass(x, lo=None, hi=None, edge=0.25):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= np.clip((f - lo * (1 - edge)) / (lo * edge * 2 + 1e-9), 0, 1)
    if hi:
        m *= np.clip((hi * (1 + edge) - f) / (hi * edge * 2 + 1e-9), 0, 1)
    return np.fft.irfft(X * m, len(x))


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def env(t, att, dec):
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-np.maximum(0, t - att) / dec)


def glide(t, f0, f1, tau):
    f = f1 + (f0 - f1) * np.exp(-t / tau)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def sweep(t, f0, f1):
    f = f0 * (f1 / f0) ** (t / t[-1])
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def fade(x, a=0.005, b=0.02):
    n = len(x)
    ia, ib = int(a * SR), int(b * SR)
    if ia:
        x[:ia] *= np.linspace(0, 1, ia)
    if ib:
        x[-ib:] *= np.linspace(1, 0, ib)
    return x


def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def db(g):
    return 10 ** (g / 20)


# ------------------------------------------------------------------ one-shot generators (mono)
def g_heartbeat(c):
    t = tg(0.42)
    tone = c.get('p', {}).get('tone', 1)
    lub = glide(t, 74 * tone, 44 * tone, 0.05) * env(t, 0.004, 0.085)
    lub += 0.35 * glide(t, 150 * tone, 95 * tone, 0.04) * env(t, 0.003, 0.05)  # audible on a phone speaker
    r = rng(c['id'])
    lub += 0.25 * bandpass(r.standard_normal(len(t)), 60, 300) * env(t, 0.002, 0.012)
    t2 = t - 0.17
    dub = np.where(t2 > 0, glide(np.maximum(t2, 0), 88 * tone, 56 * tone, 0.04) * env(np.maximum(t2, 0), 0.003, 0.06), 0) * 0.7
    dub += np.where(t2 > 0, 0.3 * np.sin(2 * np.pi * 170 * tone * np.maximum(t2, 0)) * env(np.maximum(t2, 0), 0.002, 0.03), 0)
    return norm(lub + dub, 0.9)


def g_rustle(c):
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    nz = bandpass(r.standard_normal(len(t)), 800, 5200)
    fl = 0.4 + 0.6 * np.abs(bandpass(r.standard_normal(len(t)), 2, 14))
    fl /= fl.max()
    return norm(nz * fl * np.sin(np.pi * t / d) ** 0.7, 0.7)


def g_thud(c):
    w = c.get('p', {}).get('weight', 1)
    t = tg(0.5)
    r = rng(c['id'])
    body = glide(t, 120, 46, 0.045) * env(t, 0.002, 0.09 + 0.04 * w)
    kn = bandpass(r.standard_normal(len(t)), 160, 1400) * env(t, 0.001, 0.012) * 0.8
    grass = bandpass(r.standard_normal(len(t)), 1500, 6000) * env(t, 0.003, 0.05) * 0.25
    return norm(body * w + kn + grass, 0.9)


def g_whoosh(c):
    d = c['dur'] + 0.18
    t = tg(d)
    r = rng(c['id'])
    nz = r.standard_normal(len(t))
    out = np.zeros_like(t)
    seg = 1024
    for i in range(0, len(t), seg):
        k = min(1, i / (c['dur'] * SR))
        lo, hi = 300 + 900 * k, 1400 + 4200 * k
        out[i:i + seg] = bandpass(nz[i:i + seg * 2], lo, hi)[:len(out[i:i + seg])]
    a = np.where(t < c['dur'], (t / c['dur']) ** 2.2, np.exp(-(t - c['dur']) / 0.05))
    return norm(out * a, 0.8)


def g_blip(c):
    f0 = c.get('p', {}).get('freq', 880)
    t = tg(0.28)
    x = np.sin(2 * np.pi * f0 * t) * env(t, 0.003, 0.07) + 0.3 * np.sin(2 * np.pi * f0 * 2 * t) * env(t, 0.002, 0.03)
    x += 0.5 * np.sin(2 * np.pi * f0 * 1.5 * t) * env(np.maximum(t - 0.09, 0), 0.003, 0.06) * (t > 0.09)
    return norm(x, 0.7)


def g_warble(c):
    d = c['dur']
    t = tg(d)
    f = 196 + 30 * (t / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.55 + 0.45 * np.sin(2 * np.pi * 6.5 * t))
    x += 0.35 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return norm(x * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.2), 0.6)


def g_dive(c):
    d = c['dur']
    t = tg(d + 0.2)
    r = rng(c['id'])
    tone = sweep(np.maximum(t, 1e-4), 180, 1300) * np.minimum(1, t / d) ** 1.5
    shimmer = sum(np.sin(2 * np.pi * (3000 + 2600 * r.random()) * t + r.random() * 6) * env(np.maximum(t - r.random() * d, 0), 0.002, 0.08) * (t > 0) for _ in range(14)) * 0.12
    air = bandpass(r.standard_normal(len(t)), 2000, 9000) * (t / (d + 0.2)) ** 2 * 0.4
    a = np.where(t < d, 1, np.exp(-(t - d) / 0.05))
    return norm((tone * 0.6 + shimmer + air) * a, 0.8)


def g_click(c):
    f0 = c.get('p', {}).get('freq', 2200)
    t = tg(0.08)
    r = rng(c['id'])
    x = bandpass(r.standard_normal(len(t)), 2000, 7000) * env(t, 0.0005, 0.003) + 0.6 * np.sin(2 * np.pi * f0 * t) * env(t, 0.001, 0.018)
    return norm(x, 0.8)


def g_ticks(c):
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    out = np.zeros_like(t)
    n = int(c['p']['rate'] * d)
    for k in range(n):
        at = int(r.random() * d * SR)
        f0 = 2800 + r.random() * 3200
        m = int(0.012 * SR)
        tt = np.arange(m) / SR
        seg = np.sin(2 * np.pi * f0 * tt) * env(tt, 0.0004, 0.003) * (0.4 + 0.6 * r.random())
        out[at:at + m] += seg[:len(out[at:at + m])]
    return norm(out * np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.8), 0.6)


def g_flow(c):
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    brown = np.cumsum(r.standard_normal(len(t)))
    brown -= np.convolve(brown, np.ones(4800) / 4800, mode='same')
    x = bandpass(brown, 40, 420)
    x /= np.max(np.abs(x)) or 1
    puls = 0.6 + 0.4 * np.sin(2 * np.pi * 1.55 * t) ** 2
    hiss = bandpass(r.standard_normal(len(t)), 900, 2600) * 0.08
    return norm((x * puls + hiss) * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.6), 0.6)


def g_scan(c):
    f0 = c['p']['freq']
    t = tg(0.3)
    x = np.sin(2 * np.pi * f0 * t) * env(t, 0.001, 0.025) + 0.4 * sweep(np.maximum(t, 1e-4), f0, f0 * 1.6) * env(t, 0.01, 0.06)
    return norm(x, 0.7)


def g_detect(c):
    t = tg(0.4)
    a = np.sin(2 * np.pi * 660 * t) * env(t, 0.004, 0.08)
    t2 = np.maximum(t - 0.12, 0)
    b = np.sin(2 * np.pi * 523 * t2) * env(t2, 0.004, 0.12) * (t > 0.12)
    return norm((a + b) * (1 + 0.3 * np.sin(2 * np.pi * 30 * t)), 0.7)


def g_flag(c):
    t = tg(0.6)
    x = sum(np.sin(2 * np.pi * 110 * np.maximum(t - o, 0)) * env(np.maximum(t - o, 0), 0.01, 0.1) * (t > o) for o in (0, 0.22))
    x += 0.4 * sum(np.sin(2 * np.pi * 220 * np.maximum(t - o, 0)) * env(np.maximum(t - o, 0), 0.01, 0.06) * (t > o) for o in (0, 0.22))
    return norm(x, 0.7)


def g_fib(c):
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    out = np.zeros_like(t)
    at = 0.0
    while at < d:
        m = int(0.14 * SR)
        tt = np.arange(m) / SR
        thump = glide(tt, 90 + 30 * r.random(), 50, 0.03) * env(tt, 0.003, 0.035) * (0.5 + 0.5 * r.random())
        k = int(at * SR)
        out[k:k + m] += thump[:len(out[k:k + m])]
        at += 0.09 + r.random() * 0.13
    return norm(out * np.minimum(1, t / 0.15), 0.85)


def g_zip(c):
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    x = sweep(np.maximum(t, 1e-4), 380, 2600) * 0.6 + bandpass(r.standard_normal(len(t)), 1500, 6000) * 0.25
    return norm(x * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.08), 0.7)


def g_alarm(c):
    t = tg(0.5)
    out = np.zeros_like(t)
    for k, (o, f0) in enumerate(((0.0, 980.0), (0.19, 1240.0))):
        tt = np.maximum(t - o, 0)
        on = (t >= o) & (t < o + 0.13)
        sq = sum(np.sin(2 * np.pi * f0 * h * tt) / h for h in (1, 3, 5, 7))
        out += sq * on * np.minimum(1, tt / 0.004) * np.minimum(1, (o + 0.13 - t) / 0.01)
    return norm(bandpass(out, 300, 5000), 0.8)


def g_clock(c):
    t = tg(0.06)
    r = rng(c['id'])
    x = np.sin(2 * np.pi * 1850 * t) * env(t, 0.0005, 0.012) + 0.5 * bandpass(r.standard_normal(len(t)), 3000, 8000) * env(t, 0.0003, 0.002)
    return norm(x, 0.7)


def g_send(c):
    t = tg(0.9)
    r = rng(c['id'])
    thump = glide(t, 140, 60, 0.05) * env(t, 0.003, 0.08) * 0.7
    rise = sweep(np.maximum(t, 1e-4), 320, 2100) * env(t, 0.05, 0.25) * 0.6
    sp = sum(np.sin(2 * np.pi * (2500 + 3000 * r.random()) * t) * env(np.maximum(t - 0.1 - 0.4 * r.random(), 0), 0.002, 0.07) * (t > 0.1) for _ in range(10)) * 0.15
    return norm(thump + rise + sp, 0.85)


def g_sparkle(c):
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    x = sum(np.sin(2 * np.pi * (2400 + 3600 * (k / 16)) * t) * env(np.maximum(t - d * k / 16, 0), 0.002, 0.06) * (t > d * k / 16) for k in range(16))
    return norm(x, 0.6)


def g_pin(c):
    t = tg(0.5)
    x = glide(t, 1250, 900, 0.03) * env(t, 0.002, 0.12) + 0.6 * glide(t, 120, 60, 0.04) * env(t, 0.002, 0.08)
    return norm(x, 0.75)


def g_data(c):
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    out = np.zeros_like(t)
    for k in range(14):
        at = int((k / 14) * d * SR)
        m = int(0.03 * SR)
        tt = np.arange(m) / SR
        f0 = 2000 + 900 * r.random()
        out[at:at + m] += (np.sin(2 * np.pi * f0 * tt) * env(tt, 0.001, 0.008))[:len(out[at:at + m])]
    return norm(out, 0.6)


def g_dispatch(c):
    t = tg(0.5)
    r = rng(c['id'])
    x = bandpass(r.standard_normal(len(t)), 1500, 6000) * env(t, 0.0005, 0.004)
    x += np.sin(2 * np.pi * 1046.5 * t) * env(t, 0.003, 0.08) * 0.7
    t2 = np.maximum(t - 0.1, 0)
    x += np.sin(2 * np.pi * 1318.5 * t2) * env(t2, 0.003, 0.1) * 0.7 * (t > 0.1)
    return norm(x, 0.75)


def g_rotor(c):
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    p = c.get('p', {})
    if p.get('spinup'):
        bpf = 30 + 110 * (1 - np.exp(-t / 0.35))
        amp = np.minimum(1, t / 0.5) * (0.7 + 0.3 * np.minimum(1, t / d))
        bright = np.ones_like(t)
    elif p.get('approach'):
        # distance from far right to overhead hover; restrained Doppler on the radial speed
        k = 1 - (1 - np.minimum(1, t / (d * 0.82))) ** 3
        dist = 1 + 9 * (1 - k)
        vr = np.gradient(dist, 1 / SR) * 34  # metres/s at this scale
        dop = 343 / (343 + vr)  # approaching: vr < 0 -> pitch up
        bpf = 140 * dop
        amp = 1 / dist ** 0.9
        bright = np.clip(1.3 - dist / 8, 0.3, 1)
    else:
        bpf = 140 + 2 * np.sin(2 * np.pi * 0.3 * t)
        amp = np.ones_like(t)
        bright = np.ones_like(t) * 0.8
    out = np.zeros_like(t)
    for k, det in enumerate((0.97, 0.99, 1.01, 1.035)):
        ph = 2 * np.pi * np.cumsum(bpf * det) / SR + r.random() * 6
        out += sum(np.sin(h * ph) / h ** 1.2 for h in range(1, 9))
    hiss = bandpass(r.standard_normal(len(t)), 900, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(bpf) / SR))
    x = bandpass(out, 60, 2600) * 0.6 + hiss * 0.18 * bright
    x = x * amp * np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.25)
    return norm(x, 0.8) * (np.max(amp) if p.get('approach') else 1)


def g_inject(c):
    t = tg(0.4)
    r = rng(c['id'])
    x = bandpass(r.standard_normal(len(t)), 2500, 8000) * (env(t, 0.0005, 0.003) + 0.7 * env(np.maximum(t - 0.07, 0), 0.0005, 0.003) * (t > 0.07))
    x += 0.15 * bandpass(r.standard_normal(len(t)), 4000, 9000) * env(np.maximum(t - 0.09, 0), 0.02, 0.08) * (t > 0.09)
    x += 0.4 * np.sin(2 * np.pi * 1500 * t) * env(t, 0.001, 0.01)
    return norm(x, 0.7)


def bell(t, f0, dec):
    return (np.sin(2 * np.pi * f0 * t) + 0.35 * np.sin(2 * np.pi * f0 * 2.01 * t) * np.exp(-t / (dec * 0.5)) + 0.15 * np.sin(2 * np.pi * f0 * 3.02 * t) * np.exp(-t / (dec * 0.3))) * env(t, 0.004, dec)


def g_confirm(c):
    t = tg(0.9)
    t2 = np.maximum(t - 0.14, 0)
    return norm(bell(t, 659.3, 0.25) + bell(t2, 987.8, 0.4) * (t > 0.14), 0.7)


def g_chime(c):
    t = tg(1.4)
    x = sum(bell(np.maximum(t - o, 0), f0, 0.5) * (t > o) for o, f0 in ((0, 880.0), (0.12, 1108.7), (0.24, 1318.5)))
    return norm(x, 0.7)


def g_glitch(c):
    d = c['dur'] + 0.06
    t = tg(d)
    r = rng(c['id'])
    out = np.zeros_like(t)
    seg = int(0.022 * SR)
    for i in range(0, len(t), seg):
        kind = r.integers(0, 3)
        n = min(seg, len(t) - i)
        tt = np.arange(n) / SR
        if kind == 0:
            out[i:i + n] = np.sign(np.sin(2 * np.pi * (200 + 1800 * r.random()) * tt)) * 0.6
        elif kind == 1:
            out[i:i + n] = np.round(r.standard_normal(n) * 3) / 3 * 0.5
        else:
            out[i:i + n] = np.sin(2 * np.pi * (80 + 300 * r.random()) * tt) * 0.8
    out = bandpass(out, 120, 9000)
    return norm(out * np.minimum(1, (d - t) / 0.03), 0.8)


GEN_FUN = {k[2:]: v for k, v in globals().items() if k.startswith('g_')}


# ------------------------------------------------------------------ music (procedural bed)
def saw(ph, n=12):
    return sum(np.sin(k * ph) / k for k in range(1, n + 1))


def music():
    M = CUES['music']
    t = np.arange(N) / SR
    def win(a, b, ra=0.8, rb=0.8):
        return np.clip((t - a) / ra, 0, 1) * np.clip((b - t) / rb, 0, 1)
    tension = win(0, M['hopeFrom'] + 0.6, 0.05, 1.2)
    hope = win(M['hopeFrom'], M['unsettleFrom'] + 1.5, 1.2, 2.0)
    thin = 1 - 0.55 * win(M['thinFrom'], M['total'] + 5, 1.5, 0.1)
    unsettle = win(M['unsettleFrom'], M['glitchAt'], 1.8, 0.03)
    resolve = win(M['resolveFrom'] + 0.25, M['total'], 0.9, 1.6)
    gap = 1 - win(M['glitchAt'], M['resolveFrom'] + 0.2, 0.01, 0.15)  # the glitch cuts the bed for a moment
    r = rng('music')
    def pad(freqs, cutoff, amp):
        x = np.zeros(N)
        for f0 in freqs:
            for det in (0.997, 1.003):
                ph = 2 * np.pi * f0 * det * t + r.random() * 6
                x += saw(ph, 10)
        x = bandpass(x, 40, cutoff)
        return x / (np.max(np.abs(x)) or 1) * amp
    # dark D minor bed; tightens (brighter filter + pulse) after the crimson switch
    dm = pad([73.42, 110.0, 146.83, 174.61], 900, 0.5)
    dm_hi = pad([293.66, 349.23, 440.0], 1800, 0.12)
    swell = np.clip((t - M['swellAt']) / 2, 0, 1)
    pulse_bpm = 104
    pul = np.zeros(N)
    step = 60 / pulse_bpm
    k = 0
    while k * step < M['hopeFrom']:
        a = int(k * step * SR)
        m = int(0.25 * SR)
        tt = np.arange(m) / SR
        pul[a:a + m] += (glide(tt, 70, 42, 0.05) * env(tt, 0.004, 0.08))[:len(pul[a:a + m])]
        k += 1
    pul *= (0.35 + 0.65 * swell)
    # hope: D major colour + a gentle arpeggio
    dmaj = pad([73.42, 110.0, 146.83, 185.0, 220.0], 1500, 0.45)
    arp = np.zeros(N)
    notes = [293.66, 369.99, 440.0, 587.33, 440.0, 369.99]
    stepa = 60 / 104 / 2
    k = 0
    while k * stepa < M['total']:
        a = int(k * stepa * SR)
        m = int(0.6 * SR)
        tt = np.arange(m) / SR
        f0 = notes[k % len(notes)]
        arp[a:a + m] += (np.sin(2 * np.pi * f0 * tt) * env(tt, 0.006, 0.22) + 0.25 * np.sin(2 * np.pi * f0 * 2 * tt) * env(tt, 0.004, 0.1))[:len(arp[a:a + m])]
        k += 1
    # one unsettling sustained note (E-flat over D) under the question
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t)
    un = np.sin(2 * np.pi * np.cumsum(622.25 * vib) / SR) * 0.6 + 0.3 * np.sin(2 * np.pi * 311.13 * t)
    un *= np.clip((t - M['unsettleFrom']) / (M['glitchAt'] - M['unsettleFrom']), 0, 1) ** 1.5
    # restrained resolution: an open fifth
    fifth = pad([73.42, 110.0, 146.83, 220.0], 1100, 0.45)
    x = (dm * (0.75 + 0.15 * swell) + dm_hi * swell) * tension + pul * 0.34 * tension + (dmaj + arp * 0.16 * thin) * hope * thin + un * 0.32 * unsettle + fifth * resolve
    x *= gap
    x *= np.clip(t / 0.4, 0, 1)
    return x


# ------------------------------------------------------------------ assembly
def stereo(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], axis=1)


CONTINUOUS = {'flow', 'rotor', 'fib', 'ticks', 'warble'}
PAN = {'dog_whine': 0.45, 'rotor_lift': 0.2, 'rotor_approach': 0.25, 'rotor_texture': 0.3, 'rotor_hover': 0.2, 'wrist_whoosh': -0.1}


def place(buf, x, at_s, gain_db, pan=0.0):
    a = int(round(at_s * SR))
    s = stereo(x * db(gain_db), pan)
    if a < 0:
        s = s[-a:]
        a = 0
    n = min(len(s), len(buf) - a)
    if n > 0:
        buf[a:a + n] += s[:n]


def speech_env(nar):
    hop = 480
    e = np.array([np.sqrt(np.mean(nar[i:i + hop] ** 2)) for i in range(0, len(nar), hop)])
    e = e / (e.max() or 1)
    on = (20 * np.log10(e + 1e-9) > -30).astype(float)
    # attack 30 ms, release 300 ms
    out = np.zeros_like(on)
    a, r = np.exp(-1 / 3), np.exp(-1 / 30)
    v = 0.0
    for i, x in enumerate(on):
        v = a * v + (1 - a) * x if x > v else r * v + (1 - r) * x
        out[i] = v
    return np.repeat(out, hop)[:len(nar)]


def compress_voice(x, thr_db=-20.0, ratio=2.5, att=0.012, rel=0.15, makeup_db=0.0):
    """Mild feed-forward RMS compressor for the narration (mix stage only; the edited take is untouched on disk)."""
    win = int(0.01 * SR)
    p = np.convolve(x ** 2, np.ones(win) / win, mode='same')
    lvl = 10 * np.log10(p + 1e-12)
    over = np.maximum(0, lvl - thr_db)
    gr_target = -over * (1 - 1 / ratio)
    a = np.exp(-1 / (att * SR))
    r = np.exp(-1 / (rel * SR))
    gr = np.empty_like(gr_target)
    v = 0.0
    for i, t in enumerate(gr_target):
        v = a * v + (1 - a) * t if t < v else r * v + (1 - r) * t
        gr[i] = v
    y = x * db(gr + makeup_db)
    speech = lvl > -45
    return y, {'threshold_db': thr_db, 'ratio': ratio, 'attack_ms': att * 1000, 'release_ms': rel * 1000,
               'max_gr_db': round(float(-gr.min()), 2), 'mean_gr_db_during_speech': round(float(-gr[speech].mean()), 2)}


def write(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(x, -1, 1) * 8388607).astype('<i4')
    b = pcm.astype('<i4').tobytes()
    b24 = np.frombuffer(b, np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b24)


def loudness(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    tail = r[r.rfind('Summary:'):]
    I = float(tail.split('I:')[1].split('LUFS')[0])
    LRA = float(tail.split('LRA:')[1].split('LU')[0])
    TP = float(tail.split('Peak:')[1].split('dBFS')[0])
    return {'integrated_lufs': I, 'lra_lu': LRA, 'true_peak_dbtp': TP}


def main():
    nar = load(ROOT / 'audio' / 'narration' / 'narration_final_48k.wav')
    nar = np.concatenate([nar, np.zeros(max(0, N - len(nar)))])[:N]
    sp_env = speech_env(nar)  # sidechain from the untouched narration
    nar, comp = compress_voice(nar)
    narS = stereo(nar)
    fx = np.zeros((N, 2))
    fxc = np.zeros((N, 2))  # continuous beds (flow, rotors, flutter, ticks, warble) duck deeper under speech
    log = []
    for c in CUES['cues']:
        if c['kind'] == 'file':
            x = load(GEN / c['p']['file'])
            x = norm(fade(x.copy(), 0.002, 0.03), 0.9)
            at = c['f'] / FPS - c['p'].get('offset', 0)
        else:
            x = GEN_FUN[c['kind']](c)
            at = c['f'] / FPS
            if c['kind'] == 'whoosh':
                at -= 0.0
        place(fxc if c['kind'] in CONTINUOUS else fx, x, at, c['gain'], PAN.get(c['id'], 0.0))
        log.append({'id': c['id'], 'kind': c['kind'], 'frame': c['f'], 'time_s': round(at, 3), 'gain_db': c['gain'], 'source': c['p'].get('file', 'procedural') if c.get('p') else 'procedural'})
    mus = stereo(music() * 0.5)
    sp = sp_env[:, None]
    mus_d = mus * (1 - 0.68 * sp)  # about -9.9 dB under speech
    fx_d = fx * (1 - 0.25 * sp) + fxc * (1 - 0.5 * sp)  # one-shots -2.5 dB, continuous beds -6 dB
    mix = narS + mus_d + fx_d
    tmp = ROOT / 'audio' / 'mix' / '_premix.wav'
    write(tmp, mix / max(1.0, np.abs(mix).max() / 0.98))
    pre = np.abs(mix).max() / 0.98
    # two-pass loudnorm, linear mode: measure, then apply one static gain (true-peak ceiling -1.5 dBTP)
    m = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(tmp), '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    js = json.loads(m[m.rfind('{'):m.rfind('}') + 1])
    gain_db = -15 - float(js['input_i'])
    g = db(gain_db) / max(1.0, pre)
    # gentle lookahead peak limiter on the summed mix (5 ms lookahead, 120 ms release, ceiling -1.8 dBFS
    # sample peak so the true peak stays at or under -1 dBTP); the same gain envelope is applied to every
    # stem so the stems still sum to the mix. It only acts on the few narration transients above the ceiling.
    ceil = db(-1.8)
    a = np.abs(mix * g).max(axis=1)
    need = np.minimum(1.0, ceil / np.maximum(a, 1e-9))
    look = int(0.005 * SR)
    from numpy.lib.stride_tricks import sliding_window_view
    padded = np.concatenate([need, np.ones(look)])
    gmin = sliding_window_view(padded, look + 1).min(axis=1)[:len(need)]
    rel = np.exp(-1 / (0.12 * SR))
    lim = np.empty_like(gmin)
    v = 1.0
    for i in range(len(gmin)):
        v = gmin[i] if gmin[i] < v else rel * v + (1 - rel) * gmin[i]
        lim[i] = v
    # smooth the attack so the gain change is not a step
    k = np.hanning(look * 2 + 1); k /= k.sum()
    lim = np.minimum(lim, np.convolve(np.concatenate([np.ones(look), lim, np.ones(look)]), k, mode='same')[look:-look])
    limiter_max_reduction_db = float(-20 * np.log10(lim.min()))
    limiter_frames_active = int((lim < 0.999).sum())
    G = (g * lim)[:, None]
    out = ROOT / 'audio'
    write(out / 'stems' / 'narration.wav', narS * G)
    write(out / 'stems' / 'music.wav', mus_d * G)
    write(out / 'stems' / 'effects.wav', fx_d * G)
    write(out / 'mix' / 'FGW_DeathClock_mix_48k.wav', mix * G)
    tmp.unlink()
    meas = loudness(out / 'mix' / 'FGW_DeathClock_mix_48k.wav')
    resid = np.abs((narS + mus_d + fx_d) * G - mix * G).max()
    json.dump({'total_s': TOTAL_S, 'static_gain_db': round(20 * np.log10(g), 2), 'limiter': {'ceiling_dbfs': -1.8, 'lookahead_ms': 5, 'release_ms': 120, 'max_reduction_db': round(limiter_max_reduction_db, 2), 'samples_reduced': limiter_frames_active, 'seconds_reduced': round(limiter_frames_active / SR, 3)}, 'loudnorm_pass1': js, 'measured_mix': meas,
               'stems_sum_residual': float(resid), 'voice_compressor': comp, 'music_duck_db_under_speech': round(20 * np.log10(1 - 0.68), 1), 'continuous_fx_duck_db_under_speech': round(20 * np.log10(1 - 0.5), 1),
               'effects_duck_db_under_speech': round(20 * np.log10(1 - 0.25), 1), 'cues': log}, open(out / 'MIX_LOG.json', 'w'), indent=1)
    print('mix', meas, 'gain', round(20 * np.log10(g), 2), 'dB')


if __name__ == '__main__':
    main()
