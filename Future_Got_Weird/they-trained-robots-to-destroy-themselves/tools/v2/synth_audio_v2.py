"""In-house V2 sound: the furnace bed, room tone, the outline-trace shimmer and the V2 score.

Deterministic (fixed seeds). The score follows the section times in audio/v2/sfx_cues_v2.json (written by
tools/v2/collect_sfx_v2.mjs from the same narration cues as the animation):
  hook      tense: sub pulses accelerating into the first entry, a dropout on impact, then a dark industrial ostinato
  curious   after the payoff of the hook: the plucked "curious" rhythm (V1 motif, tighter, 104 BPM)
  training  marimba version with a shaker
  real      the same groove over a darker bass line
  prove     a held, suspended chord while the jump hangs in the spotlight; a low hit on the entry; a sparse pad
  reflect   felt-piano figure; a held high note while the last jump freezes; light pizzicato for the people
  question  warm resolution after the last entry, fading under the brand sting (sting_end)
Reuses the instrument functions of tools/synth_audio.py (V1). Writes source/public/v2/audio/sfx/{furnace_roar,
amb_room,trace}.wav and source/public/v2/audio/music_v2.wav.
Usage: python3 tools/v2/synth_audio_v2.py
"""
import json, os, subprocess, sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import synth_audio as v1  # noqa: E402  (instrument functions; its __main__ block does not run)

ROOT = os.path.join(HERE, "..", "..")
OUT = os.path.join(ROOT, "source", "public", "v2", "audio")
SR = v1.SR
rng = np.random.default_rng(20261014 + 2)
os.makedirs(os.path.join(OUT, "sfx"), exist_ok=True)
T, bp, lp, hp, norm, write, place = v1.T, v1.bp, v1.lp, v1.hp, v1.norm, v1.write, v1.place


def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0


# ------------------------------------------------------------------ effects
def effects():
    # furnace bed, 16 s, loopable: synthesised roar + rumble, with the four 1 s ElevenLabs roar takes scattered as grains
    n = int(16 * SR); t = np.arange(n) / SR
    brown = np.cumsum(rng.standard_normal(n)); brown -= np.convolve(brown, np.ones(4800) / 4800, mode="same")
    rumble = lp(hp(brown, 22), 220)
    roar = bp(rng.standard_normal(n), 120, 900) * (0.7 + 0.3 * np.sin(2 * np.pi * t / 2.3) * np.sin(2 * np.pi * t / 5.1))
    hiss = bp(rng.standard_normal(n), 2500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 3.7) ** 2)
    bed = norm(rumble) * 0.9 + norm(roar) * 0.55 + norm(hiss) * 0.08
    grains = [load(os.path.join(ROOT, "audio", "v2", "sfx_raw", f"furnace_roar_v{k}.mp3")) for k in (1, 2, 3, 4)]
    g_layer = np.zeros(n)
    tk = 0.0
    while tk < 15.2:
        g = grains[int(rng.integers(0, 4))]
        L = min(len(g), int(rng.uniform(0.6, 1.0) * SR))
        a = int(rng.uniform(0, max(1, len(g) - L)))
        seg = g[a:a + L] * np.hanning(L)
        i = int(tk * SR)
        g_layer[i:i + L] += seg[: n - i] * rng.uniform(0.6, 1.0)
        tk += rng.uniform(0.3, 0.5)
    bed += norm(g_layer) * 0.65
    out = {"furnace_roar": norm(v1.loopable(bed, 0.8), -3)}
    # room tone for the workshop / line / studio sets: soft air and a faint fluorescent hum
    n = int(12 * SR); t = np.arange(n) / SR
    air = lp(np.cumsum(rng.standard_normal(n)) * 0.02 + rng.standard_normal(n) * 0.3, 1800)
    air = hp(air, 60)
    hum = 0.06 * np.sin(2 * np.pi * 120 * t) + 0.03 * np.sin(2 * np.pi * 240 * t)
    out["amb_room"] = norm(v1.loopable(norm(air) * 0.8 + hum, 0.6), -3)
    # outline trace: a soft rising shimmer, 0.9 s
    tt = T(0.9)
    f = 520 * 2 ** (1.4 * tt / 0.9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sh = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3.01 * ph)) * (0.75 + 0.25 * np.sin(2 * np.pi * 14 * tt))
    out["trace"] = norm(sh * np.sin(np.pi * tt / 0.9) ** 1.5, -3)
    for k, v in out.items():
        write(os.path.join(OUT, "sfx", f"{k}.wav"), v)
    return list(out)


# ------------------------------------------------------------------ score
def thump(f0=55, d=0.5):
    tt = T(d)
    return np.sin(2 * np.pi * np.cumsum(f0 + 60 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 7) * np.clip(tt / 0.002, 0, 1)


def clank(f=420, d=0.45):
    tt = T(d)
    y = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * k) for r, a, k in [(1, 1, 9), (2.41, 0.6, 14), (3.93, 0.4, 20), (5.6, 0.2, 30)])
    return (y + 0.4 * bp(rng.standard_normal(len(tt)), 2000, 6000) * np.exp(-tt * 60)) * np.clip(tt / 0.001, 0, 1)


def riser(d):
    tt = T(d)
    x = rng.standard_normal(len(tt))
    lo = bp(x, 300, 1200) * (tt / d) ** 2
    hi = bp(x, 2000, 7000) * (tt / d) ** 3
    tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (2 * tt / d)) / SR) * (tt / d) ** 2 * 0.4
    return lo + 0.6 * hi + tone


def score(total, m):
    buf = np.zeros((int((total + 3) * SR), 2))
    D = 73.42
    # ---------------- hook (0 → hookEnd)
    hk = m["hookEnd"]
    tt = T(hk + 1.5)
    drone = (np.sin(2 * np.pi * D * tt) + 0.55 * np.sin(2 * np.pi * D * 1.5 * tt * 1.002) + 0.3 * np.sin(2 * np.pi * D * 2.01 * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * tt / 2.7))
    env = np.clip(tt / 0.3, 0, 1) * np.clip((hk + 1.5 - tt) / 1.5, 0, 1)
    # dropout on the first impact: the score holds its breath for 0.6 s
    i0 = m["impact"] - 0.05
    env *= np.where((tt > i0) & (tt < i0 + 0.6), 0.15, 1.0)
    place(buf, drone * env, 0, 0.22)
    # accelerating sub pulses into the first entry
    k = 0.15; gap = 0.42
    while k < m["impact"] - 0.2:
        place(buf, thump(48, 0.4), k, 0.5)
        k += gap; gap = max(0.17, gap * 0.86)
    place(buf, riser(m["impact"] - 0.5), 0.5, 0.06)
    # industrial ostinato after the first entry until the hand-off to the curious rhythm
    beat = 60 / 104
    t = m["impact"] + 0.6
    step = 0
    while t < hk - 0.4:
        if step % 4 == 0:
            place(buf, thump(44, 0.5), t, 0.45)
        if step % 4 == 2:
            place(buf, clank(380 + 20 * ((step // 4) % 3), 0.35), t, 0.07, pan=-0.3)
        if step % 2 == 1:
            place(buf, bp(rng.standard_normal(int(0.05 * SR)), 3000, 8000) * np.exp(-T(0.05) * 80), t, 0.05, pan=0.3)
        t += beat / 2
        step += 1
    place(buf, riser(1.2), m["impact2"] - 1.2, 0.04)
    # ---------------- curious → training → real (104 BPM groove)
    beat = 60 / 104
    bar = 4 * beat
    CH = [(146.83, 185.0, 220.0, 293.66), (123.47, 146.83, 185.0, 246.94), (98.0, 123.47, 146.83, 196.0), (110.0, 138.59, 164.81, 220.0)]
    ROOT_ = [73.42, 61.74, 49.0, 55.0]
    DARK = [(123.47, 146.83, 185.0, 246.94), (98.0, 123.47, 146.83, 196.0), (110.0, 130.81, 164.81, 220.0), (92.5, 110.0, 138.59, 185.0)]
    DROOT = [61.74, 49.0, 55.0, 46.25]
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    t = m["curious"]
    bi = 0
    while t < m["prove"] - 0.3:
        dark = t >= m["real"] - 0.2
        sim = t >= m["training"] - 0.2
        ch = (DARK if dark else CH)[bi % 4]
        rt = (DROOT if dark else ROOT_)[bi % 4]
        fade = min(1.0, (t - m["curious"]) / 3.0 + 0.25)
        place(buf, v1.bass(rt), t, 0.32 * fade)
        place(buf, v1.bass(rt), t + 2 * beat, 0.22 * fade)
        if dark:
            place(buf, v1.bass(rt, 0.5), t + 3.5 * beat, 0.16)
        for e in range(8):
            if e in (3, 7) and bi % 2 == 0:
                continue
            f = ch[pattern[e]] * 2
            note = v1.marimba(f) if sim else v1.pluck(f)
            place(buf, note, t + e * beat / 2, (0.095 if sim else 0.105) * fade, pan=(-0.35 if e % 2 else 0.35))
        for e in range(1, 8, 2):
            th = T(0.05)
            place(buf, bp(rng.standard_normal(len(th)), 4000, 9000) * np.exp(-th * 90), t + e * beat / 2, 0.03 * fade, pan=0.2)
        if sim:
            place(buf, v1.pad(ch, bar + 0.6, 0.8, 0.8), t, 0.011)
        t += bar
        bi += 1
    # ---------------- prove: held suspended chord over the hanging jump, a low hit on the entry, then a sparse pad
    p0, pay = m["prove"], m["payoff"]
    place(buf, v1.pad((146.83, 196.0, 220.0, 293.66, 392.0), pay - p0 + 0.6, 0.4, 0.5), p0 - 0.1, 0.03)
    place(buf, riser(1.0), pay - 1.0, 0.04)
    place(buf, thump(40, 1.2), pay - 0.02, 0.6)
    place(buf, v1.piano(73.42 * 2, 3), pay, 0.12)
    t = pay + 0.6
    bi = 0
    while t < m["reflect"] - 0.4:
        ch = CH[bi % 4]
        place(buf, v1.pad(ch, bar + 1.0, 1.0, 1.2), t, 0.015)
        place(buf, v1.bass(ROOT_[bi % 4], 2.0), t, 0.18)
        place(buf, v1.pluck(ch[3] * 2, 0.9, 0.7), t + 1.2, 0.065, pan=0.3)
        t += bar
        bi += 1
    # ---------------- reflect: felt piano until the freeze
    slow = bar * 1.5
    t = m["reflect"] - 0.2
    bi = 0
    while t < m["freeze"] - 0.3:
        ch = CH[[0, 2, 1, 3][bi % 4]]
        place(buf, v1.pad(ch, slow + 1.2, 1.5, 1.5), t, 0.016)
        for k, f in enumerate([ch[3] * 2, ch[2] * 2, ch[1] * 2]):
            place(buf, v1.piano(f), t + k * slow / 3, 0.085, pan=(-0.2 + 0.2 * k))
        place(buf, v1.bass([73.42, 49.0, 61.74, 55.0][bi % 4], 3.0), t, 0.17)
        t += slow
        bi += 1
    # freeze: one held high note (the jump hangs), soft
    place(buf, v1.pad((587.33, 880.0), m["people"] - m["freeze"] + 0.5, 0.3, 0.4), m["freeze"], 0.012)
    # people: light pizzicato on the eighths (picked / built / wrote)
    t = m["people"]
    e = 0
    while t < m["question"] - 0.2:
        f = [293.66, 369.99, 440.0, 369.99][e % 4] * (2 if e % 8 >= 4 else 1)
        place(buf, v1.pluck(f, 0.4, 1.4), t, 0.08, pan=(-0.3 if e % 2 else 0.3))
        if e % 4 == 0:
            place(buf, v1.bass([73.42, 61.74, 49.0, 55.0][(e // 4) % 4], 1.0), t, 0.2)
        t += beat / 2
        e += 1
    # sim reaching: a single bright chime pair on the ring hit is left to the effects
    # ---------------- question: hold under the last entry, then the warm resolution under the closing lines
    q, en = m["question"], m["entry"]
    place(buf, v1.pad((73.42 * 2, 220.0, 293.66), en - q + 0.4, 0.3, 0.4), q, 0.016)
    place(buf, thump(40, 1.2), en - 0.02, 0.45)
    d = m["sting"] - en + 0.8
    place(buf, v1.pad((146.83, 220.0, 293.66, 369.99, 440.0), d, 1.2, 1.0), en + 0.3, 0.02)
    place(buf, v1.piano(293.66, 4), en + 0.6, 0.1)
    place(buf, v1.piano(440.0, 4), en + 1.4, 0.08)
    place(buf, v1.piano(369.99, 4), en + 2.4, 0.07)
    place(buf, v1.bass(73.42, 4), en + 0.3, 0.18)
    # small room reverb
    ir_t = T(1.4)
    ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t / 0.4)[:, None]
    ir[:, 0] = lp(ir[:, 0], 5000); ir[:, 1] = lp(ir[:, 1], 5000)
    from scipy.signal import fftconvolve
    wet = np.stack([fftconvolve(buf[:, c], ir[:, c])[: len(buf)] for c in range(2)], axis=1)
    out = buf + 0.16 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(buf))
    # fade the score out under the sting
    s0, s1 = int((m["sting"] + 0.1) * SR), int((m["sting"] + 0.9) * SR)
    out[s0:s1] *= np.linspace(1, 0, s1 - s0)[:, None]
    out[s1:] = 0
    return norm(out[: int(total * SR)], -6)


if __name__ == "__main__":
    print("in-house effects:", ", ".join(effects()))
    cues = json.load(open(os.path.join(ROOT, "audio", "v2", "sfx_cues_v2.json")))
    total = cues["totalFrames"] / cues["fps"]
    mus = score(total, cues["music"])
    write(os.path.join(OUT, "music_v2.wav"), mus)
    print(f"music_v2: {len(mus) / SR:.2f} s, sections {cues['music']}")
