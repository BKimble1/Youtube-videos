#!/usr/bin/env python3
"""Synthesize the Short's effects bed (original, procedural; no library sounds).
Cue times follow ShortMain.tsx's shot list and the selected take's word times.
Output: source/public/short/sfx_short.wav (48 kHz stereo, peaks well under the voice)."""
import json, os, wave
import numpy as np

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'source/public/short/sfx_short.wav')
DUR = 42.1
rng = np.random.default_rng(7)
words = json.load(open(os.path.join(ROOT, 'source/src/data/short_words.json')))['words']

def at(word, after=0.0):
    return next(w['s'] for w in words if w['w'].startswith(word) and w['s'] >= after)

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

bus = np.zeros((int(DUR * SR), 2))

def place(sig, t, gain_db, pan=0.0):
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

cues = []
# sh07 suction (10.6 s): iris whoosh + fan hum under "fans pull air…"
cues += [('whoosh', 10.58, -24, 0), ('hum', 10.75, -30, 0)]
# sh08 thrusters (13.95 s): push whoosh; jets A (f 8–46), jets B (f 58–88)
t8 = 13.95
cues += [('whoosh', t8 - 0.02, -25, 0.2), ('hiss1', t8 + 8 / 30, -27, -0.4), ('hiss2', t8 + 58 / 30, -28, 0.4)]
# sh10 trims (21.88 s): card slides, Rocket pop, stamp
t10 = 21.88
cues += [('tick', t10 + k * 5 / 30, -26, 0) for k in range(3)]
cues += [('blip', at('Rocket') - 2 / 30, -27, 0), ('thunk', at('approved') + 5 / 30, -20, 0)]
# sh11 accel (29.85 s): whoosh, stopwatch ticks for 0.81 s, attribution stamp
t11 = 29.85
cues += [('whoosh', t11 - 0.02, -25, -0.2)]
cues += [('tick', t11 + 8 / 30 + k * 0.09, -27, 0) for k in range(10)]
cues += [('blip2', t11 + 8 / 30 + 0.81, -27, 0), ('thunk', at("Tesla's", 32) + 4 / 30, -21, 0)]
# sh12 target (34.55 s): whoosh, two year flips, landing
t12 = 34.55
cues += [('whoosh', t12 - 0.02, -26, 0.2), ('tick', t12 + 6 / 30, -25, 0), ('tick', t12 + 13 / 30, -25, 0), ('thunk', t12 + 14 / 30, -26, 0)]

make = {'whoosh': whoosh, 'hum': lambda: hum(3.1), 'hiss1': lambda: hiss(1.25), 'hiss2': lambda: hiss(1.0),
        'tick': tick, 'thunk': thunk, 'blip': blip, 'blip2': lambda: blip(1320, 0.25)}
for name, t, g, pan in cues:
    place(make[name](), t, g, pan)

peak = np.abs(bus).max()
pcm = (np.clip(bus, -1, 1) * 32767).astype('<i2')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
json.dump([{'cue': n, 't': round(t, 3), 'gain_db': g} for n, t, g, _ in cues], open(os.path.join(ROOT, 'audio/short/sfx_cues_short.json'), 'w'), indent=1)
print(f'{OUT}: {DUR}s, {len(cues)} cues, peak {20*np.log10(peak+1e-12):.1f} dBFS')
