#!/usr/bin/env python3
"""Synthesize a sparse, original sound-effects track from the timeline.

All sounds are generated here with numpy (no third-party samples). Only a few intentional accents:
token split / generation ticks, the selection "pick", error thunks, the scoring-rule flip, the
penalties, and the check/cross in the verification beat. The title card gets one soft impact.

Output: audio/sfx/sfx_track.wav (48 kHz stereo) + audio/sfx/sfx_cues.json
"""
import json
import os
import re

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(7)


def db(x):
    return 10 ** (x / 20)


def env(n, a=0.002, d=0.08, curve=6.0):
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    dec = np.exp(-curve * np.maximum(t - a, 0) / max(d, 1e-4))
    return att * dec


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def tick(freq=3200, dur=0.035, level=-34):
    n = int(dur * SR)
    noise = bandpass(rng.standard_normal(n), freq * 0.7, min(freq * 1.4, 20000))
    tone = np.sin(2 * np.pi * freq * 0.5 * np.arange(n) / SR)
    x = (0.6 * noise / (np.abs(noise).max() + 1e-9) + 0.4 * tone) * env(n, 0.0008, 0.012, 5)
    return x * db(level)


def thunk(level=-27):
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = 95 * np.exp(-t * 3)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.16, 5)
    knock = bandpass(rng.standard_normal(n), 300, 1400) * env(n, 0.001, 0.02, 6)
    x = body + 0.25 * knock / (np.abs(knock).max() + 1e-9)
    return x / np.abs(x).max() * db(level)


def pluck(freq=880, level=-30, dur=0.45):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.01 * t) + 0.12 * np.sin(2 * np.pi * freq * 3 * t)
    x *= env(n, 0.002, dur * 0.5, 5)
    return x / np.abs(x).max() * db(level)


def chime(level=-30):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1318.5 * t) + 0.5 * np.sin(2 * np.pi * 1975.5 * t) + 0.2 * np.sin(2 * np.pi * 2637 * t)
    x *= env(n, 0.003, 0.5, 4)
    return x / np.abs(x).max() * db(level)


def low_tone(level=-31):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 220 * t) + 0.3 * np.sin(2 * np.pi * 330 * t)
    x *= env(n, 0.004, 0.2, 4)
    return x / np.abs(x).max() * db(level)


def flip(level=-27):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    # rising band-passed sweep, done in short blocks
    blk = 512
    for i in range(0, n, blk):
        f = 700 + 3800 * (i / n) ** 1.5
        seg = bandpass(noise[max(0, i - 2048): i + blk], f * 0.7, f * 1.3)[-min(blk, n - i):]
        out[i: i + len(seg)] = seg
    out *= np.sin(np.pi * np.clip(t / t[-1], 0, 1)) ** 2
    click = np.zeros(n)
    c = tick(2400, 0.03, -20)
    click[-len(c):] += c * 3
    x = out / (np.abs(out).max() + 1e-9) * 0.7 + click
    return x / np.abs(x).max() * db(level)


def impact(level=-21):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = 62 * np.exp(-t * 1.2) + 38
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.8, 4)
    air = bandpass(rng.standard_normal(n), 2000, 9000) * env(n, 0.002, 0.25, 6) * 0.08
    x = sub + air
    # soft swell leading in (reversed filtered noise), prepended
    m = int(0.55 * SR)
    sw = bandpass(rng.standard_normal(m), 600, 5000) * np.linspace(0, 1, m) ** 3 * 0.12
    x = np.concatenate([sw, x])
    return x / np.abs(x).max() * db(level), m / SR


def load():
    with open(os.path.join(ROOT, "source/src/data/timeline.json"), encoding="utf-8") as f:
        return json.load(f)


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def main():
    tl = load()
    fps = tl["fps"]

    def at(seg_id, word=None, occ=1):
        s = next(x for x in tl["segments"] if x["id"] == seg_id)
        if word is None:
            return s["from"]
        hits = [w for w in s["words"] if norm(w["w"]) == norm(word)]
        return hits[occ - 1]["from"]

    total = tl["durationInFrames"] / fps
    n = int(total * SR) + SR
    track = np.zeros((n, 2))
    cues = []

    def place(x, t_sec, pan=0.0, name=""):
        i = int(round(t_sec * SR))
        if i < 0 or i >= n:
            return
        x = x[: n - i]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        track[i: i + len(x), 0] += x * l * 1.4142
        track[i: i + len(x), 1] += x * r * 1.4142
        cues.append({"t": round(t_sec, 3), "name": name})

    F = lambda frame: frame / fps

    # Title card impact on "wrong"
    imp, lead = impact()
    place(imp, F(at("s07", "wrong")) - lead + 0.02, 0, "title impact")
    # Error marks in the hook (title, year)
    place(thunk(-29), F(at("s04", "title")) + 0.05, -0.1, "mark titles")
    place(thunk(-31), F(at("s04", "year")) + 0.05, 0.1, "mark years")
    # Token split: shimmer of ticks across the split animation (22 frames)
    t0 = F(at("s09", "tokens"))
    for k in range(23):
        place(tick(2400 + 1800 * rng.random(), 0.03, -40), t0 + k * (0.72 / 23) + rng.uniform(-0.01, 0.01), rng.uniform(-0.6, 0.6), "token split")
    # Selection sweep + settle on "picked"
    tp = F(at("s11", "picked"))
    for k in range(9):
        place(tick(1700 + 120 * k, 0.025, -38), tp + 0.73 * (1 - (1 - k / 9) ** 2), 0.3, "pick sweep")
    place(pluck(784, -31), tp + 0.75, 0.3, "pick settle")
    # Tile lands
    place(pluck(1046.5, -33, 0.3), F(at("s11", "added")) + 0.55, 0.2, "token lands")
    # Generation loop: one tick per appended token (every 7 frames, starting 6 frames after "loop")
    tl0 = F(at("s11", "loop")) + 6 / fps
    for k in range(7):
        place(tick(2600 + 90 * k, 0.03, -37), tl0 + k * 7 / fps, 0.4, "token append")
    # Reveal in Act 3: year and title marked as not in the record
    place(thunk(-29), F(at("s21", "year:")) + 0.05, -0.2, "reveal year")
    place(thunk(-30), F(at("s21", "title.")) + 0.05, -0.2, "reveal title")
    # Incentive: rule flip and penalties
    place(flip(-26), F(at("s26", "costs")) - 0.02, 0, "rule flip")
    tm = F(at("s27", "minus"))
    for k in range(3):
        place(low_tone(-34), tm + k * 4 / fps, 0.25, "penalty")
    # Verification beat
    place(chime(-31), F(at("s32", "exist,")) + 0.05, 0.15, "check: exists")
    place(low_tone(-31), F(at("s32", "say")) + 0.05, 0.15, "cross: does not say this")

    peak = np.abs(track).max()
    os.makedirs(os.path.join(ROOT, "audio/sfx"), exist_ok=True)
    sf.write(os.path.join(ROOT, "audio/sfx/sfx_track.wav"), track[: int(total * SR)].astype(np.float32), SR, subtype="PCM_24")
    with open(os.path.join(ROOT, "audio/sfx/sfx_cues.json"), "w") as f:
        json.dump(cues, f, indent=1)
    print(f"sfx: {len(cues)} cue events, peak {20*np.log10(peak):.1f} dBFS")


if __name__ == "__main__":
    main()
