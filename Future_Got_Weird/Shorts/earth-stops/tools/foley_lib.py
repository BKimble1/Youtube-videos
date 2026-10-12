#!/usr/bin/env python3
"""Shared procedural-Foley library for the Earth Stops v2 previews (numpy only, deterministic: every random draw is seeded from the sha1 of the effect name).
The first block (DSP primitives and the v1 effects) is carried over unchanged from tools/build_audio_opening.py so the v1 checkpoint stays reproducible on its own;
the second block adds the effects the v2 previews need (stopped-planet thump, spin whirr, ring bloom, freewheel). No samples, no generation model, no paid service.
"""
import hashlib, os, wave
import numpy as np

SR = 48000


# ------------------------------------------------------------------ DSP primitives
def rng_for(name):
    return np.random.default_rng(int(hashlib.sha1(name.encode()).hexdigest()[:8], 16))


def tgrid(dur):
    return np.arange(int(dur * SR)) / SR


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


def norm(x, peak):
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(pcm.shape[1] if pcm.ndim == 2 else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ------------------------------------------------------------------ effects (mono one-shots)
def fx_scrape(name, dur, f0=190.0, f1=120.0, lo=900, hi=7500, att=0.003, rel=0.05):
    """rubber sole dragging over rough paving: band-limited grit under a stick-slip pulse train (the slip rate falls as the slide slows)"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    grit = fft_filter(r.standard_normal(n), lo, hi)
    f = f0 + (f1 - f0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR + 0.6 * np.sin(2 * np.pi * 7 * t)
    slip = 0.40 + 0.60 * (0.5 + 0.5 * np.sin(ph)) ** 2
    jit = 0.6 + 0.4 * np.repeat(r.random(n // 220 + 1), 220)[:n]
    rub = fft_filter(r.standard_normal(n), 250, 1150) * 0.45
    env = np.minimum(1, t / att) * np.minimum(1, np.maximum(0, (dur - t)) / rel)
    return norm((grit * slip * jit + rub * slip) * env, 0.85)


def fx_thud(name, f_hi=120, f_lo=52, decay=0.09, knock=0.7, dur=0.45):
    """a body-weight thump: falling sine for weight + a mid knock and a woody ring so it still carries on a phone speaker"""
    r = rng_for(name); t = tgrid(dur)
    body = glide(t, f_hi, f_lo, 0.045) * np.exp(-t / decay)
    kn = fft_filter(r.standard_normal(len(t)), 180, 1500) * np.exp(-t / 0.014) * knock
    mid = ping(t, 310, 55, 0.35) + ping(t, 520, 90, 0.18)
    return norm(0.8 * body + kn + mid, 0.9)


def fx_ceramic_tick(name):
    """one ceramic rim tick: a couple of inharmonic modes plus a hard transient"""
    r = rng_for(name); t = tgrid(0.22)
    click = fft_filter(r.standard_normal(len(t)), 2500, 8500) * np.exp(-t / 0.0016)
    modes = ping(t, 2350, 85, 0.9) + ping(t, 3320, 120, 0.6) + ping(t, 5180, 210, 0.3) + ping(t, 1480, 60, 0.35)
    return norm(0.6 * click + modes, 0.9)


def fx_coffee_jet(name, dur):
    """liquid leaving a mug at speed: bubbly band-limited noise with random gurgle modulation and a few short blips"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), 900, 5800)
    mod = fft_filter(r.standard_normal(n), 8, 42)
    mod = mod / (np.max(np.abs(mod)) or 1)
    am = 0.55 + 0.45 * mod
    blips = np.zeros(n)
    for tt in r.uniform(0.03, dur - 0.08, 11):
        k = int(tt * SR); m = int(0.016 * SR)
        tb = np.arange(m) / SR
        blips[k:k + m] += 0.5 * np.sin(2 * np.pi * np.cumsum(700 + 1300 * tb / 0.016) / SR) * np.exp(-tb / 0.007)
    env = np.minimum(1, t / 0.012) * np.where(t < dur * 0.65, 1.0, np.exp(-(t - dur * 0.65) / (dur * 0.14)))
    return norm((nz * am + blips) * env, 0.8)


def fx_flap(name, dur, r0=12.0, r1=17.0):
    """jacket / scarf flutter: mid noise chopped by a flutter that speeds up slightly"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), 350, 3200)
    rate = r0 + (r1 - r0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(rate) / SR
    fl = (0.5 + 0.5 * np.sin(ph)) ** 1.6
    jit = 0.7 + 0.3 * np.repeat(r.random(n // 600 + 1), 600)[:n]
    env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.12)
    return norm(nz * (0.25 + 0.75 * fl) * jit * env, 0.7)


def fx_rush(name, dur):
    """air rushing past: three noise bands crossfading from high to low as the speed peaks, then eases off with the slide"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    hi = fft_filter(r.standard_normal(n), 2400, 7500)
    mid = fft_filter(r.standard_normal(n), 800, 2400)
    lo = fft_filter(r.standard_normal(n), 220, 800)
    u = t / dur
    e_hi = np.exp(-((u - 0.12) / 0.16) ** 2)
    e_mid = np.exp(-((u - 0.25) / 0.30) ** 2)
    e_lo = np.clip(u * 3, 0, 1) * np.exp(-((u - 0.4) / 0.6) ** 2)
    sw = 0.85 + 0.15 * np.sin(2 * np.pi * 3.1 * t)
    return norm((0.55 * hi * e_hi + 0.85 * mid * e_mid + 0.9 * lo * e_lo) * sw, 0.7)


def fx_launch(name):
    """the shoes letting go of the pavement: a short rubber squeak, a scuff and a cloth snap"""
    r = rng_for(name); t = tgrid(0.16)
    sq = glide(t, 1050, 1680, 0.025) * np.exp(-t / 0.035) * 0.45
    sc = fft_filter(r.standard_normal(len(t)), 1500, 6500) * np.exp(-t / 0.02)
    sn = fft_filter(r.standard_normal(len(t)), 600, 2800) * np.exp(-t / 0.008) * 0.8
    return norm(sq + 0.6 * sc + sn, 0.85)


def fx_splat(name, f=1250):
    """a coffee droplet hitting stone: a wet tick"""
    r = rng_for(name); t = tgrid(0.08)
    nz = fft_filter(r.standard_normal(len(t)), 900, 3800) * np.exp(-t / 0.006)
    return norm(nz + 0.5 * ping(t, f, 220) + 0.3 * ping(t, 180, 90), 0.8)



# ------------------------------------------------------------------ v2 additions
def fx_planet_stop(name, dur=0.9):
    """the ground (the whole planet) stopping dead: a stylised sub-thump, a hard crack on the front and a long low ring-down. Deliberately larger than a footstep."""
    r = rng_for(name); t = tgrid(dur)
    sub = glide(t, 90, 36, 0.09) * np.exp(-t / 0.28)
    ring = ping(t, 41, 4.2, 0.55) + ping(t, 63, 6.0, 0.3)
    crack = fft_filter(r.standard_normal(len(t)), 250, 5200) * np.exp(-t / 0.012)
    knock = ping(t, 190, 38, 0.4) + ping(t, 340, 70, 0.22)
    return norm(0.95 * sub + 0.6 * ring + 0.7 * crack + knock, 0.95)


def fx_spin_whirr(name, dur, rev_hz=1.7):
    """a big thing turning very fast: a low rumble bed under a band of air chopped once per revolution, swelling a little toward the end"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    rum = fft_filter(r.standard_normal(n), 28, 120) * 1.4 + 0.5 * np.sin(2 * np.pi * 47 * t + 0.4 * np.sin(2 * np.pi * 5.3 * t))
    air = fft_filter(r.standard_normal(n), 500, 3000)
    rev = (0.55 + 0.45 * np.sin(2 * np.pi * rev_hz * t)) ** 1.4
    sw = 0.7 + 0.3 * (t / dur)
    env = np.minimum(1, t / 0.004)
    return norm((0.9 * rum + 0.8 * air * rev) * sw * env, 0.8)


def fx_ring_bloom(name, dur=0.32):
    """the pulse that leaves the rim when it stops: air swept upward under a soft low whomp (a graphic accent, not a physical sound)"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    sweep = np.zeros(n)
    nz = r.standard_normal(n)
    for lo, hi, a in ((400, 900, 1.0), (900, 2200, 0.8), (2200, 5200, 0.5)):
        sweep += a * fft_filter(nz, lo, hi)
    u = t / dur
    sweep *= np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5 * (0.35 + 0.65 * u)
    whomp = glide(t, 140, 70, 0.06) * np.exp(-t / 0.07)
    return norm(0.55 * sweep + 0.8 * whomp, 0.8)


def fx_freewheel(name, dur, rate0=21.0, rate1=11.0):
    """a bicycle rolling freewheel with nobody riding it: a pawl click train that slows with the wheel speed, spoke hiss and a faint frame rattle"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    rate = rate0 + (rate1 - rate0) * (t / dur)
    ph = np.cumsum(rate) / SR
    k = np.floor(ph).astype(int)
    edge = np.concatenate([[True], np.diff(k) > 0])
    clicks = np.zeros(n)
    for i in np.flatnonzero(edge):
        m = min(int(0.012 * SR), n - i)
        tc = np.arange(m) / SR
        clicks[i:i + m] += (0.7 + 0.3 * r.random()) * (fft_filter(r.standard_normal(m), 1800, 7000) * np.exp(-tc / 0.0022) + 0.4 * np.sin(2 * np.pi * (2900 + 400 * r.random()) * tc) * np.exp(-tc / 0.004))
    hiss = fft_filter(r.standard_normal(n), 3200, 8000) * (0.10 + 0.06 * np.sin(2 * np.pi * 9 * t))
    rat = fft_filter(r.standard_normal(n), 400, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.7 * t + 1.1)) ** 3 * 0.12
    env = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.1)
    return norm((clicks + hiss + rat) * env, 0.7)
