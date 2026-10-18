# Copied unchanged from Future_Got_Weird/tesla-roadster-flew/tools/sfxlib.py (branch claude/rocket-car-physics-short-t27oqy):
# the channel's procedural effects library, reused so the episodes share one sound palette.
"""Procedural sound effects shared by the Short and the companion (original synthesis, no library sounds)."""
import numpy as np

SR = 48000
rng = np.random.default_rng(7)
def db(x):
    return 10 ** (x / 20)

def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc; y[i] = acc
    return y

def hp(x, fc):
    return x - onepole_lp(x, fc)

def env(n, a, r, shape=2.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.clip(1 - (t - a) / max(r, 1e-4), 0, 1) ** shape
    return e

def place(bus, sig, t, gain_db, pan=0.0):
    i = int(t * SR); sig = sig[: max(0, len(bus) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i:i + len(sig), 0] += sig * db(gain_db) * l * 1.41
    bus[i:i + len(sig), 1] += sig * db(gain_db) * r * 1.41

def whoosh(d=0.38):
    n = int(d * SR); x = rng.standard_normal(n)
    sweep = np.linspace(500, 3500, n)
    y = np.zeros(n); acc = 0.0
    for i in range(n):  # swept one-pole low-pass
        a = np.exp(-2 * np.pi * sweep[i] / SR); acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y * np.sin(np.linspace(0, np.pi, n)) ** 1.5 / (np.abs(y).max() + 1e-9)

def hum(d, f0=95):
    n = int(d * SR); t = np.arange(n) / SR
    spin = np.clip(t / 0.8, 0, 1)  # spin-up
    ph = 2 * np.pi * np.cumsum(f0 * (0.5 + 0.5 * spin)) / SR
    tone = 0.6 * np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.15 * np.sin(5 * ph)
    air = onepole_lp(rng.standard_normal(n), 900) * 3
    y = (tone + air * spin) * env(n, 0.25, d - 0.25, 1.0)
    return y / (np.abs(y).max() + 1e-9)

def hiss(d):
    n = int(d * SR)
    y = hp(rng.standard_normal(n), 2500) * env(n, 0.03, d - 0.03, 1.4)
    return y / (np.abs(y).max() + 1e-9)

def thunk():
    n = int(0.35 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
    click = hp(rng.standard_normal(n), 1500) * np.exp(-t * 90) * 0.5
    y = body + click
    return y / np.abs(y).max()

def tick():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 260)

def blip(f=880, d=0.18):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 22)


def write_wav(path, bus):
    import os, wave
    pcm = (np.clip(bus, -1, 1) * 32767).astype('<i2')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
