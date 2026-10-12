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


# ------------------------------------------------------------------ H1 additions (hook with narration)
def fx_flywheel(name, dur, rev_hz=9.0):
    """a heavy flywheel at speed: a low harmonic stack (55/110/165 Hz) with fast amplitude modulation at the revolution rate plus a thin band of air. Mostly below the speech band."""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    stack = np.sin(2 * np.pi * 55 * t) + 0.7 * np.sin(2 * np.pi * 110 * t + 0.4) + 0.4 * np.sin(2 * np.pi * 165 * t + 1.1)
    am = 0.62 + 0.38 * np.sin(2 * np.pi * rev_hz * t)
    air = fft_filter(r.standard_normal(n), 140, 700) * 0.55
    return norm((stack * am + air * (0.5 + 0.5 * np.sin(2 * np.pi * rev_hz * t + 1.3))) * np.minimum(1, t / 0.003), 0.85)


def fx_turbine(name, dur):
    """a spinning turbine: a high whine around 1.1 kHz over a noise band (sits in the speech band, so it is the masking-risk candidate)"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    whine = np.sin(2 * np.pi * (1100 + 40 * np.sin(2 * np.pi * 6 * t)) * t) * 0.6
    nz = fft_filter(r.standard_normal(n), 600, 3200) * 0.5
    return norm((whine + nz) * np.minimum(1, t / 0.003), 0.8)


def fx_latch(name):
    """a mechanism locking: one hard metallic clack and a short low knock (candidate stop accent; physical, not a collision)"""
    r = rng_for(name); t = tgrid(0.18)
    clack = fft_filter(r.standard_normal(len(t)), 1800, 7500) * np.exp(-t / 0.003) + 0.7 * ping(t, 2600, 140) + 0.4 * ping(t, 4100, 200)
    knock = ping(t, 160, 70, 0.6)
    return norm(clack + knock, 0.85)


def fx_rubber_chirp(name):
    """the sole of a shoe grabbing and slipping on stone: a short rubber squeal (800-1400 Hz glide) into a scuff"""
    r = rng_for(name); t = tgrid(0.20)
    sq = glide(t, 780, 1380, 0.04) * np.exp(-t / 0.05) * 0.55
    sc = fft_filter(r.standard_normal(len(t)), 1200, 6500) * np.exp(-t / 0.045)
    return norm(sq + 0.8 * sc, 0.85)


def fx_tag_slap(name):
    """a stiff cardboard tag slapped onto a surface: broadband slap, a light board resonance"""
    r = rng_for(name); t = tgrid(0.12)
    slap = fft_filter(r.standard_normal(len(t)), 900, 6000) * np.exp(-t / 0.008)
    board = ping(t, 430, 90, 0.5) + ping(t, 980, 130, 0.25)
    return norm(slap + board, 0.8)


def fx_stamp_tap(name):
    """a rubber stamp tapped once: duller, lower thud-tap"""
    r = rng_for(name); t = tgrid(0.12)
    tap = fft_filter(r.standard_normal(len(t)), 300, 2200) * np.exp(-t / 0.012)
    return norm(tap + ping(t, 210, 60, 0.7), 0.8)


def fx_sticker_press(name):
    """a soft adhesive press: a quiet click with a short peel hiss"""
    r = rng_for(name); t = tgrid(0.14)
    click = fft_filter(r.standard_normal(len(t)), 1500, 5000) * np.exp(-t / 0.004)
    hiss = fft_filter(r.standard_normal(len(t)), 3500, 9000) * np.exp(-t / 0.04) * 0.3
    return norm(click + hiss, 0.7)


def ratchet_train(name, n_ticks, t_end, ease=3.0, pitch_rise=0.0):
    """mechanical counter / odometer ticks: n_ticks ticks over t_end seconds, evenly spaced in an ease-out curve (fast first, slowing at the end). Returns (audio, tick_times)."""
    r = rng_for(name)
    u = (np.arange(n_ticks) + 0.5) / n_ticks
    times = t_end * (1 - (1 - u) ** (1.0 / ease)) if ease != 1 else t_end * u
    out = np.zeros(int((t_end + 0.1) * SR))
    for i, tt in enumerate(times):
        k = int(tt * SR); m = int(0.014 * SR)
        tc = np.arange(m) / SR
        f = 2300 * (1 + pitch_rise * i / max(1, n_ticks - 1))
        tick = fft_filter(r.standard_normal(m), 1500, 6500) * np.exp(-tc / 0.0025) + 0.5 * np.sin(2 * np.pi * f * tc) * np.exp(-tc / 0.004)
        out[k:k + m] += (0.75 + 0.25 * r.random()) * tick
    return norm(out, 0.7), times


def fx_paper_swish(name, dur=0.28):
    """a flat card sliding away: band noise with a quick rise and fall"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), 1500, 7000)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return norm(nz * env, 0.6)


def fx_clunk(name):
    """the counter reaching its stop: one solid mechanical clunk"""
    r = rng_for(name); t = tgrid(0.2)
    return norm(fft_filter(r.standard_normal(len(t)), 700, 4200) * np.exp(-t / 0.01) + ping(t, 240, 55, 0.8) + ping(t, 520, 90, 0.35), 0.85)


# ------------------------------------------------------------------ V1 additions (whole film): wind, sea, furniture, small mechanisms. numpy only, seeded, no samples.
def _swell(t, dur, p=0.8):
    return np.sin(np.pi * np.clip(t / dur, 0, 1)) ** p


def fx_gust(name, dur, lo=140, hi=1800, whistle=0.0, hiss=0.25, p=0.8):
    """a gust of wind building and passing: band noise under a slow turbulence envelope, an optional thin whistle, a little high air"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), lo, hi)
    turb = 0.62 + 0.38 * np.sin(2 * np.pi * (0.9 * t + r.random())) * np.sin(2 * np.pi * (0.37 * t + r.random()))
    env = _swell(t, dur, p) * turb
    air = fft_filter(r.standard_normal(n), 2500, 7500) * hiss * env
    wh = whistle * np.sin(2 * np.pi * np.cumsum(780 + 90 * np.sin(2 * np.pi * 0.7 * t)) / SR) * env * 0.25
    return norm(nz * env + air + wh, 0.8)


def fx_fronds(name, dur):
    """palm fronds thrashing in wind: high-passed noise chopped by fast random flutter"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), 1400, 7500)
    fl = np.zeros(n)
    for k in range(10):
        fl += np.abs(np.sin(2 * np.pi * (6 + 9 * r.random()) * t + 6.28 * r.random()))
    env = _swell(t, dur, 0.6) * (0.35 + 0.65 * fl / 10)
    return norm(nz * env, 0.7)


def fx_surge(name, dur, rumble=1.0, hiss=0.5, bubbly=0):
    """a heavy surge of water: low rumble swelling, a hiss of foam rising behind it, optional bubble blips"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    u = np.clip(t / dur, 0, 1)
    rum = fft_filter(r.standard_normal(n), 25, 260) * rumble * np.sin(np.pi * np.clip(u * 1.1, 0, 1)) ** 0.9
    hs = fft_filter(r.standard_normal(n), 2200, 9000) * hiss * (u ** 1.4) * np.exp(-3 * np.clip(u - 0.82, 0, None))
    out = rum + hs
    for _ in range(bubbly):
        k = int(r.random() * (n - 4000)); m = 3600; tc = np.arange(m) / SR
        out[k:k + m] += 0.18 * np.sin(2 * np.pi * (380 + 500 * r.random()) * tc) * np.exp(-tc / 0.03)
    return norm(out, 0.85)


def fx_wave_slap(name, dur=0.9, thud=1.0, splash=1.0):
    """water hitting a sea wall: a low thud, a splash burst, then spray patter"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    th = (ping(t, 62, 16, 1.0) + ping(t, 118, 30, 0.6)) * thud
    sp = fft_filter(r.standard_normal(n), 900, 7000) * np.exp(-t / 0.16) * splash
    out = th + 0.8 * sp
    for _ in range(26):
        k = int((0.06 + 0.5 * r.random()) * SR); m = 700; tc = np.arange(m) / SR
        out[k:k + m] += 0.07 * fft_filter(r.standard_normal(m), 2500, 8000) * np.exp(-tc / 0.006)
    return norm(out, 0.85)


def fx_scrape_furniture(name, dur, f0=330, f1=170, lo=1500, hi=8500):
    return fx_scrape(name, dur, f0=f0, f1=f1, lo=lo, hi=hi, att=0.003, rel=0.06)


def fx_cardboard_scrape(name, dur):
    """a cardboard box dragged and tumbling: soft paper-grit scrape with two dull thumps"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    nz = fft_filter(r.standard_normal(n), 700, 4200) * np.exp(-t / (dur * 0.5))
    out = 0.7 * nz
    for k, g in ((0.12 * dur, 0.9), (0.38 * dur, 0.7)):
        i = int(k * SR); m = int(0.12 * SR); tc = np.arange(m) / SR
        if i + m < n: out[i:i + m] += g * (ping(tc, 95, 38) + 0.3 * fft_filter(r.standard_normal(m), 400, 2500) * np.exp(-tc / 0.015))
    return norm(out, 0.8)


def fx_pot_tip(name):
    """a clay pot tipping over: a hollow thunk, a roll, soil spilling"""
    r = rng_for(name); dur = 0.7; t = tgrid(dur); n = len(t)
    out = ping(t, 140, 28, 0.9) * (t < 0.2) + 0.45 * ping(np.maximum(t - 0.22, 0), 180, 26) * (t > 0.22)
    soil = fft_filter(r.standard_normal(n), 1800, 7000) * np.exp(-np.maximum(t - 0.12, 0) / 0.12) * (t > 0.12)
    for _ in range(18):
        k = int((0.14 + 0.45 * r.random()) * SR); m = 500; tc = np.arange(m) / SR
        soil[k:k + m] += 0.25 * fft_filter(r.standard_normal(m), 2500, 8000) * np.exp(-tc / 0.004)
    return norm(out + 0.5 * soil, 0.8)


def fx_cone_clack(name):
    """a hollow plastic cone knocked over: two quick hollow clacks"""
    t = tgrid(0.42); out = ping(t, 520, 55, 0.8) + 0.5 * ping(t, 1180, 90)
    i = int(0.16 * SR); tt = t[:len(t) - i]
    out[i:] += 0.7 * (ping(tt, 470, 60, 0.8) + 0.4 * ping(tt, 1050, 100))
    return norm(out, 0.8)


def fx_roll(name, dur, rate0=7.0, rate1=3.5):
    """a ball rolling on paving: low band noise modulated at the revolution rate (the rate follows the ball's speed)"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    ph = np.cumsum(rate0 + (rate1 - rate0) * (t / dur)) / SR
    am = 0.55 + 0.45 * np.abs(np.sin(np.pi * ph))
    return norm(fft_filter(r.standard_normal(n), 90, 1500) * am * np.minimum(1, t / 0.02), 0.6)


def fx_footstep(name, thud=0.7, mid=1.0, f=170):
    """a soft shoe tap on paving (a low thud under a mid-band scuff, so a phone speaker still carries it)"""
    r = rng_for(name); t = tgrid(0.12)
    return norm(ping(t, f, 55, thud) + mid * fft_filter(r.standard_normal(len(t)), 500, 3200) * np.exp(-t / 0.012), 0.7)


def fx_sip(name):
    """a small sip: a short low gulp (pitch falls) over a soft liquid noise"""
    r = rng_for(name); t = tgrid(0.34); n = len(t)
    g = glide(t, 900, 420, 0.07) * np.exp(-t / 0.12) * 0.7
    liq = fft_filter(r.standard_normal(n), 700, 3200) * np.exp(-t / 0.1) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 11 * t)))
    return norm((g + 0.9 * liq) * np.minimum(1, t / 0.01), 0.55)


def fx_pop(name):
    """a small icon popping into place: a soft round tick"""
    r = rng_for(name); t = tgrid(0.09)
    return norm(ping(t, 560, 70, 0.8) + fft_filter(r.standard_normal(len(t)), 1200, 4800) * np.exp(-t / 0.004) * 0.6, 0.7)


def fx_peel(name):
    """a card peeling off a surface: crackly band noise"""
    r = rng_for(name); t = tgrid(0.34); n = len(t)
    nz = fft_filter(r.standard_normal(n), 1800, 8500)
    cr = (r.random(n) > 0.965).astype(float); cr = np.convolve(cr, np.hanning(24), mode='same')
    return norm((nz * 0.35 + cr * 2.0) * _swell(t, 0.34, 0.5), 0.55)


def fx_swoosh(name, dur, lo_band=(260, 1200), hi_band=(1600, 6500), up=True):
    """a camera move / zoom: a low band that fades into a high band (up) or the reverse (down), under a smooth envelope"""
    r = rng_for(name); t = tgrid(dur); n = len(t)
    a = fft_filter(r.standard_normal(n), *lo_band); b = fft_filter(r.standard_normal(n), *hi_band)
    u = np.clip(t / dur, 0, 1)
    w = u if up else 1 - u
    env = np.sin(np.pi * u) ** 1.4
    return norm((a * (1 - w) + 0.7 * b * w) * env, 0.7)
