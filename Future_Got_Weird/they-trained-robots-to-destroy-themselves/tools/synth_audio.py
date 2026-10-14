"""In-house sound for They Trained Robots to Destroy Themselves: ambiences, small UI ticks, and the music bed.

Deterministic (fixed seeds), so a rebuild gives identical files. The music follows the narration's mood points from
audio/sfx_cues.json (written by tools/collect_sfx.mjs): unease in the cold open, a curious plucked motif for the
explanation, marimba for the simulation sections, a sparse pad for "what it proves", a warm resolution at the end.
A Runway-generated underscore exists in the owner's Runway library but could not be downloaded in this environment
(its output host is blocked by the network policy), so this original bed is used instead.

Writes source/public/audio/sfx/<kind>.wav (in-house kinds) and source/public/audio/music_bed.wav.
Usage: python3 tools/synth_audio.py
"""
import json, os, wave

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "source", "public", "audio")
SR = 48000
rng = np.random.default_rng(20261014)
os.makedirs(os.path.join(OUT, "sfx"), exist_ok=True)


def T(sec):
    return np.arange(int(sec * SR)) / SR


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=4):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=4):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def norm(x, peak_db=-3.0):
    return x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak_db / 20)


def write(path, x):
    x = np.asarray(x, dtype=np.float64)
    ch = 1 if x.ndim == 1 else x.shape[1]
    with wave.open(path, "wb") as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def loopable(x, xf=0.5):
    """Crossfade the tail into the head so the clip loops without a click."""
    n = int(xf * SR)
    head, tail = x[:n], x[-n:]
    ramp = np.linspace(0, 1, n)
    y = x[n:].copy()
    y[-n:] = tail * (1 - ramp) + head * ramp
    return y


# ------------------------------------------------------------------ in-house effects
def sfx():
    out = {}
    # foundry room tone: brown-noise rumble, mains hum, sparse distant crackle
    n = int(14 * SR)
    brown = np.cumsum(rng.standard_normal(n)); brown -= np.convolve(brown, np.ones(4800) / 4800, mode="same")
    rumble = lp(hp(brown, 25), 380)
    t = np.arange(n) / SR
    hum = 0.25 * np.sin(2 * np.pi * 50 * t) + 0.12 * np.sin(2 * np.pi * 100 * t + 0.4)
    crack = np.zeros(n)
    for i in rng.choice(n - 2000, 60, replace=False):
        crack[i:i + 1200] += rng.standard_normal(1200) * np.exp(-np.arange(1200) / 120) * rng.uniform(0.05, 0.3)
    crack = bp(crack, 1500, 6000)
    amb = norm(rumble) * 0.9 + norm(hum) * 0.18 + norm(crack) * 0.12 * (0.6 + 0.4 * np.sin(2 * np.pi * t / 7))
    out["amb_foundry"] = norm(loopable(amb), -3)
    # simulation room tone: soft, clean, slightly digital
    n = int(10 * SR); t = np.arange(n) / SR
    sim = 0.5 * np.sin(2 * np.pi * 110 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * t / 5)) + 0.3 * np.sin(2 * np.pi * 165 * t) + 0.2 * np.sin(2 * np.pi * 330 * t + 1)
    sim += lp(rng.standard_normal(n), 900) * 0.25
    out["amb_sim"] = norm(loopable(sim), -3)
    # molten sizzle: dense crackle over hiss, 4 s, decaying
    n = int(4.0 * SR); t = np.arange(n) / SR
    imp = np.zeros(n)
    for i in np.sort(rng.choice(n - 800, 900, replace=False)):
        imp[i:i + 600] += rng.standard_normal(600) * np.exp(-np.arange(600) / 60) * rng.uniform(0.2, 1)
    hiss = bp(rng.standard_normal(n), 2500, 9000) * 0.35
    out["sizzle"] = norm((bp(imp, 1200, 9000) + hiss) * np.exp(-t / 1.6) * np.clip(t / 0.02, 0, 1), -3)
    # marker drawing an X: two short squeaky strokes
    def stroke(d):
        tt = T(d)
        sq = np.sin(2 * np.pi * (2100 + 300 * np.sin(2 * np.pi * 9 * tt)) * tt) * 0.25
        nz = bp(rng.standard_normal(len(tt)), 1200, 6000)
        return (sq + norm(nz) * 0.8) * np.sin(np.pi * tt / d) ** 0.6
    out["marker_x"] = norm(np.concatenate([stroke(0.17), np.zeros(int(0.07 * SR)), stroke(0.16)]), -3)
    # pop tick
    tt = T(0.06); f = 1300 - 6000 * tt
    out["pop_tick"] = norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 70), -3)
    # soft negative blip: two low tones
    tt = T(0.32)
    tone = sum((1 / k) * np.sin(2 * np.pi * 196 * k * tt) for k in (1, 3, 5))
    out["buzz_no"] = norm(np.concatenate([tone[: int(0.13 * SR)] * np.exp(-T(0.13) * 8), np.zeros(int(0.03 * SR)), (sum((1 / k) * np.sin(2 * np.pi * 165 * k * T(0.16)) for k in (1, 3, 5))) * np.exp(-T(0.16) * 9)]), -3)
    # soft positive chime
    tt = T(0.9)
    out["ding_yes"] = norm((np.sin(2 * np.pi * 1318.5 * tt) + 0.5 * np.sin(2 * np.pi * 1975.5 * tt) + 0.2 * np.sin(2 * np.pi * 2637 * tt)) * np.exp(-tt * 5.5) * np.clip(tt / 0.004, 0, 1), -3)
    # simulation blip
    tt = T(0.1); f = 880 + 4400 * tt
    out["sim_blip"] = norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 30), -3)
    # slider notch click
    tt = T(0.04)
    out["slider_tick"] = norm(bp(rng.standard_normal(len(tt)), 2000, 5000) * np.exp(-tt * 160) + 0.4 * np.sin(2 * np.pi * 3200 * tt) * np.exp(-tt * 120), -3)
    # counter ticking: accelerating ticks for 2.6 s
    n = int(2.6 * SR); y = np.zeros(n); tk = 0.0; gap = 0.09
    while tk < 2.5:
        i = int(tk * SR); m = min(500, n - i)
        y[i:i + m] += np.sin(2 * np.pi * 2400 * np.arange(m) / SR) * np.exp(-np.arange(m) / 60)
        tk += gap; gap = max(0.028, gap * 0.94)
    out["counter_tick"] = norm(y * np.linspace(1, 0.6, n), -3)
    # closing sting: soft bell chord (D major), 3 s
    tt = T(3.0)
    bell = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(587.3, 1, 1.4), (740, 0.7, 1.6), (880, 0.6, 1.7), (1174.7, 0.4, 2.2), (293.7, 0.5, 1.0)])
    out["sting_end"] = norm(bell * np.clip(tt / 0.01, 0, 1), -3)
    for k, v in out.items():
        write(os.path.join(OUT, "sfx", f"{k}.wav"), v)
    return list(out)


# ------------------------------------------------------------------ music bed
def pluck(f, d=0.7, bright=1.0):
    tt = T(d)
    y = sum((1 / k ** 1.25) * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (3.2 + 2.6 * k / bright)) for k in range(1, 7))
    return y * np.clip(tt / 0.003, 0, 1)


def marimba(f, d=0.8):
    tt = T(d)
    return (np.sin(2 * np.pi * f * tt) * np.exp(-tt * 4.5) + 0.35 * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt * 16) + 0.08 * np.sin(2 * np.pi * 9.9 * f * tt) * np.exp(-tt * 40)) * np.clip(tt / 0.002, 0, 1)


def bass(f, d=1.2):
    tt = T(d)
    return (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 2.0) * np.clip(tt / 0.008, 0, 1)


def piano(f, d=2.4):
    tt = T(d)
    y = sum((0.9 ** k) / k * np.sin(2 * np.pi * f * k * tt * (1 + 0.0004 * k * k)) * np.exp(-tt * (0.9 + 0.8 * k)) for k in range(1, 6))
    return lp(y * np.clip(tt / 0.012, 0, 1), 2500, 2)


def pad(freqs, d, att=1.2, rel=1.5):
    tt = T(d)
    y = np.zeros(len(tt))
    for f in freqs:
        for det in (-0.004, 0, 0.0035):
            ff = f * (1 + det)
            y += sum((1 / k) * np.sin(2 * np.pi * ff * k * tt + k) for k in range(1, 6))
    env = np.minimum(np.clip(tt / att, 0, 1), np.clip((d - tt) / rel, 0, 1))
    return lp(y, 1600, 2) * env


def place(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= len(buf):
        return
    m = min(len(x), len(buf) - i)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + m, 0] += x[:m] * gain * l * 1.414
    buf[i:i + m, 1] += x[:m] * gain * r * 1.414


def music(total, mood):
    buf = np.zeros((int((total + 2) * SR), 2))
    beat = 0.6  # 100 BPM
    bar = 4 * beat
    # chords: D  Bm  G  A (I vi IV V)
    CH = [(146.83, 185.0, 220.0, 293.66), (123.47, 146.83, 185.0, 246.94), (98.0, 123.47, 146.83, 196.0), (110.0, 138.59, 164.81, 220.0)]
    ROOT_ = [73.42, 61.74, 49.0, 55.0]
    a_end, b_end, c_end, d_end, e_end = mood["curious"], mood["training"], mood["prove"], mood["reflect"], mood["question"]
    # A: unease (drone, slow pulse, distant metallic pings)
    tt = T(a_end + 1.5)
    drone = (np.sin(2 * np.pi * 73.42 * tt) + 0.6 * np.sin(2 * np.pi * 110.3 * tt) + 0.35 * np.sin(2 * np.pi * 146.4 * tt)) * (0.75 + 0.25 * np.sin(2 * np.pi * tt / 3.1))
    drone *= np.clip(tt / 0.6, 0, 1) * np.clip((a_end + 1.5 - tt) / 1.5, 0, 1)
    place(buf, drone, 0, 0.28)
    for k in np.arange(0.3, a_end, 1.25):
        th = T(0.35); place(buf, np.sin(2 * np.pi * (62 - 30 * th) * th) * np.exp(-th * 12), k, 0.22)
    for k, f in zip(np.arange(1.0, a_end, 4.1), [1180, 1240, 1110, 1290, 1150, 1210]):
        th = T(1.6); ping = sum(a * np.sin(2 * np.pi * f * r * th) * np.exp(-th * d) for r, a, d in [(1, 1, 3), (2.76, 0.5, 5), (5.4, 0.25, 8)])
        place(buf, ping, k, 0.03, pan=rng.uniform(-0.6, 0.6))
    # B and C: curious motif (plucks, then marimba in the simulation sections), bass, shaker
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]  # chord-tone indices per eighth note
    rests = {3, 7}
    t = a_end - 0.2
    bar_i = 0
    while t < c_end - 0.5:
        ci = bar_i % 4
        ch = CH[ci]
        sec_c = t >= b_end - 0.3
        fade = min(1.0, (t - (a_end - 0.2)) / 4.0)
        place(buf, bass(ROOT_[ci]), t, 0.32 * fade)
        place(buf, bass(ROOT_[ci]), t + 2 * beat, 0.22 * fade)
        for e in range(8):
            if e in rests and (bar_i % 2 == 0):
                continue
            f = ch[pattern[e]] * 2
            note = marimba(f) if sec_c else pluck(f)
            place(buf, note, t + e * beat / 2, (0.10 if sec_c else 0.11) * fade, pan=(-0.35 if e % 2 else 0.35))
        for e in range(8):
            if e % 2 == 1:
                th = T(0.05); sh = bp(rng.standard_normal(len(th)), 4000, 9000) * np.exp(-th * 90)
                place(buf, sh, t + e * beat / 2, 0.035 * fade, pan=0.2)
        if sec_c:
            place(buf, pad(ch, bar + 0.6, 0.8, 0.8), t, 0.012)
        t += bar
        bar_i += 1
    # D: what it proves — sparse pad, occasional pluck
    t = c_end - 0.5
    bar_i = 0
    while t < d_end - 0.5:
        ch = CH[bar_i % 4]
        place(buf, pad(ch, bar + 1.0, 1.0, 1.2), t, 0.016)
        place(buf, bass(ROOT_[bar_i % 4], 2.0), t, 0.2)
        place(buf, pluck(ch[3] * 2, 0.9, 0.7), t + 1.2, 0.07, pan=0.3)
        t += bar
        bar_i += 1
    # E: reflection — slower, warm, felt-piano notes
    t = d_end - 0.5
    bar_i = 0
    slow = bar * 1.5
    while t < e_end:
        ch = CH[[0, 2, 1, 3][bar_i % 4]]
        place(buf, pad(ch, slow + 1.2, 1.5, 1.5), t, 0.018)
        for k, f in enumerate([ch[3] * 2, ch[2] * 2, ch[1] * 2]):
            place(buf, piano(f), t + k * slow / 3, 0.09, pan=(-0.2 + 0.2 * k))
        place(buf, bass([73.42, 49.0, 61.74, 55.0][bar_i % 4], 3.0), t, 0.18)
        t += slow
        bar_i += 1
    # F: resolution chord to the end
    d = total - e_end + 1.5
    place(buf, pad((146.83, 220.0, 293.66, 369.99, 440.0), d, 1.5, 3.0), e_end, 0.02)
    place(buf, piano(293.66, 4), e_end + 0.2, 0.1)
    place(buf, piano(440.0, 4), e_end + 0.8, 0.08)
    place(buf, bass(73.42, 4), e_end, 0.2)
    # small room reverb
    ir_t = T(1.6)
    ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t / 0.45)[:, None]
    ir[:, 0] = lp(ir[:, 0], 5000); ir[:, 1] = lp(ir[:, 1], 5000)
    wet = np.stack([fftconvolve(buf[:, c], ir[:, c])[: len(buf)] for c in range(2)], axis=1)
    out = buf + 0.18 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(buf))
    out = out[: int(total * SR)]
    n = int(2.5 * SR)
    out[-n:] *= np.linspace(1, 0, n)[:, None]
    return norm(out, -6)


if __name__ == "__main__":
    kinds = sfx()
    print("in-house effects:", ", ".join(kinds))
    cues = json.load(open(os.path.join(ROOT, "audio", "sfx_cues.json")))
    mood = {k: v / 30 for k, v in cues["mood"].items()}
    total = cues["totalFrames"] / 30
    m = music(total, mood)
    write(os.path.join(OUT, "music_bed.wav"), m)
    print(f"music bed: {len(m) / SR:.2f} s, sections at {mood}")
