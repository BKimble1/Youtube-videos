"""In-house V5 score, re-timed to the V5 cut (deterministic; same instruments and key as V2–V4).

Section times come from audio/v5/sfx_cues_v5.json ("music"), written by tools/v5/collect_sfx_v5.mjs from the same
cues as the animation:
  hook      drone + sub pulses accelerating into the first entry, the score drops out on the impact, a light marimba
            ostinato under the sim attempts, a short riser into the corrected landing
  curious   the plucked 104 BPM groove (factory → options → Imatra → the post)
  training  marimba groove, thinned (no pad, no off-beats) while the attempts fail; on the learned landing the groove
            lifts a whole step and gains the pad and the shaker (the "failed → learned" lift)
  real      the same groove over the darker bass line; a riser and a low hit on the real entry, then it drops out
  prove     a sparse pad
  end       silence while the aisle's lights go out; felt piano under the silhouette; a held high note through the
            slowed leap; nothing during the rewind; pizzicato for the people; a riser from the slate into the entry;
            the warm D-major resolution on the symbolic landing, ringing out under the logo; clean fade at the end
Writes source/public/v5/audio/music_v5.wav.
Usage: python3 tools/v5/synth_score_v5.py
"""
import json, os, sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
sys.path.insert(0, os.path.join(HERE, "..", "v2"))
import synth_audio as v1  # noqa: E402
import synth_audio_v2 as v2  # noqa: E402

ROOT = os.path.join(HERE, "..", "..")
OUT = os.path.join(ROOT, "source", "public", "v5", "audio")
os.makedirs(OUT, exist_ok=True)
SR = v1.SR
rng = np.random.default_rng(20261015 + 5)
T, bp, lp, place, norm, write = v1.T, v1.bp, v1.lp, v1.place, v1.norm, v1.write
thump, clank, riser = v2.thump, v2.clank, v2.riser

CH = [(146.83, 185.0, 220.0, 293.66), (123.47, 146.83, 185.0, 246.94), (98.0, 123.47, 146.83, 196.0), (110.0, 138.59, 164.81, 220.0)]
ROOT_ = [73.42, 61.74, 49.0, 55.0]
DARK = [(123.47, 146.83, 185.0, 246.94), (98.0, 123.47, 146.83, 196.0), (110.0, 130.81, 164.81, 220.0), (92.5, 110.0, 138.59, 185.0)]
DROOT = [61.74, 49.0, 55.0, 46.25]
PATTERN = [0, 2, 1, 3, 2, 1, 3, 2]
BEAT = 60 / 104
BAR = 4 * BEAT


def shaker(buf, t, g):
    th = T(0.05)
    place(buf, bp(rng.standard_normal(len(th)), 4000, 9000) * np.exp(-th * 90), t, g, pan=0.2)


def groove(buf, t0, t1, kind, fade_in=3.0, fade_out=0.0, gain=1.0, transpose=1.0, thin=False, lush=False):
    """One groove bar per BAR from t0 until t1. kind: 'pluck' | 'marimba' | 'dark'."""
    t, bi = t0, 0
    while t < t1 - 0.3:
        dark = kind == 'dark'
        ch = [f * transpose for f in (DARK if dark else CH)[bi % 4]]
        rt = (DROOT if dark else ROOT_)[bi % 4] * transpose
        fade = min(1.0, (t - t0) / fade_in + 0.25) if fade_in > 0 else 1.0
        if fade_out > 0:
            fade *= float(np.clip((t1 - t) / fade_out, 0.25, 1.0))
        g = fade * gain
        place(buf, v1.bass(rt), t, 0.32 * g)
        if not thin:
            place(buf, v1.bass(rt), t + 2 * BEAT, 0.22 * g)
        if dark:
            place(buf, v1.bass(rt, 0.5), t + 3.5 * BEAT, 0.16 * g)
        for e in range(8):
            if e in (3, 7) and (bi % 2 == 0 or thin):
                continue
            if thin and e % 2 == 1:
                continue
            f = ch[PATTERN[e]] * 2
            note = v1.marimba(f) if kind == 'marimba' else v1.pluck(f)
            place(buf, note, t + e * BEAT / 2, (0.095 if kind == 'marimba' else 0.105) * g, pan=(-0.35 if e % 2 else 0.35))
        if not thin:
            for e in range(1, 8, 2):
                shaker(buf, t + e * BEAT / 2, (0.045 if lush else 0.03) * g)
        if lush:
            place(buf, v1.pad(ch, BAR + 0.6, 0.8, 0.8), t, 0.013 * g)
        t += BAR
        bi += 1
    return t


def score(total, m):
    buf = np.zeros((int((total + 3) * SR), 2))
    D = 73.42
    # ---------------- hook
    hk, imp = m["hookEnd"], m["impact"]
    tt = T(hk + 1.0)
    drone = (np.sin(2 * np.pi * D * tt) + 0.55 * np.sin(2 * np.pi * D * 1.5 * tt * 1.002) + 0.3 * np.sin(2 * np.pi * D * 2.01 * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * tt / 2.7))
    env = np.clip(tt / 0.25, 0, 1) * np.clip((hk + 1.0 - tt) / 1.0, 0, 1)
    env *= np.where((tt > imp - 0.05) & (tt < imp + 0.55), 0.12, 1.0)  # the score holds its breath on the impact
    place(buf, drone * env, 0, 0.22)
    k, gap = 0.12, 0.36
    while k < imp - 0.15:
        place(buf, thump(48, 0.4), k, 0.5)
        k += gap
        gap = max(0.15, gap * 0.82)
    place(buf, riser(imp - 0.3), 0.3, 0.05)
    # sim attempts: a light marimba ostinato (the cool world), a short riser into the corrected landing
    t, step = m["swap0"] + 0.1, 0
    while t < hk - 0.3:
        f = [293.66, 440.0, 369.99, 440.0][step % 4]
        place(buf, v1.marimba(f, 0.5), t, 0.06, pan=(-0.3 if step % 2 else 0.3))
        if step % 4 == 0:
            place(buf, thump(44, 0.4), t, 0.3)
        t += BEAT / 2
        step += 1
    place(buf, riser(0.9), m["impact2"] - 0.9, 0.035)
    place(buf, v1.pluck(587.33, 0.8), m["impact2"], 0.08)
    # ---------------- curious groove: factory → post
    groove(buf, m["curious"], m["training"] + 0.2, 'pluck')
    # ---------------- training: thin while failing, a whole-step lift and the pad once it lands
    groove(buf, m["training"] + 0.2, m["lift"], 'marimba', fade_in=2.0, thin=True, gain=0.85)
    place(buf, riser(0.8), m["lift"] - 0.8, 0.03)
    place(buf, v1.pad([f * 2 ** (2 / 12) for f in CH[0]], 2.5, 0.05, 2.0), m["lift"], 0.02)
    groove(buf, m["lift"], m["real"], 'marimba', fade_in=0.0, transpose=2 ** (2 / 12), lush=True)
    # ---------------- real: darker groove, riser into the entry, low hit, drop out
    groove(buf, m["real"], m["payoff"] - 1.0, 'dark', fade_in=1.5)
    pay = m["payoff"]
    place(buf, riser(1.2), pay - 1.2, 0.045)
    place(buf, thump(40, 1.2), pay - 0.02, 0.6)
    place(buf, v1.piano(D * 2, 3), pay + 0.05, 0.11)
    # ---------------- prove: sparse pad
    t, bi = pay + 0.9, 0
    while t < m["end"] - 0.5:
        ch = CH[bi % 4]
        place(buf, v1.pad(ch, BAR + 1.0, 1.0, 1.2), t, 0.014)
        place(buf, v1.bass(ROOT_[bi % 4], 2.0), t, 0.15)
        place(buf, v1.pluck(ch[3] * 2, 0.9, 0.7), t + 1.2, 0.06, pan=0.3)
        t += BAR
        bi += 1
    # ---------------- end
    # (the lights go out: no score between dark0 and swap)
    slow = BAR * 1.5
    t, bi = m["swap"] + 0.1, 0
    while t < m["leap"] - 0.4:
        ch = CH[[0, 2, 1, 3][bi % 4]]
        place(buf, v1.pad(ch, min(slow + 1.2, m["leap"] - t + 0.6), 1.2, 1.0), t, 0.015)
        for k, f in enumerate([ch[3] * 2, ch[2] * 2, ch[1] * 2]):
            if t + k * slow / 3 < m["leap"] - 0.3:
                place(buf, v1.piano(f), t + k * slow / 3, 0.08, pan=(-0.2 + 0.2 * k))
        place(buf, v1.bass([D, 49.0, 61.74, 55.0][bi % 4], 3.0), t, 0.16)
        t += slow
        bi += 1
    # the slowed leap: one held high note, cut by the rewind
    hold = v1.pad((587.33, 880.0), m["rewind0"] - m["leap"] + 0.15, 0.3, 0.12)
    place(buf, hold, m["leap"], 0.013)
    # the people: light pizzicato on the eighths until the slate
    t, e = m["rewind1"] + 0.3, 0
    while t < m["clap"] - 0.15:
        f = [293.66, 369.99, 440.0, 369.99][e % 4] * (2 if e % 8 >= 4 else 1)
        place(buf, v1.pluck(f, 0.4, 1.4), t, 0.075, pan=(-0.3 if e % 2 else 0.3))
        if e % 4 == 0:
            place(buf, v1.bass([D, 61.74, 49.0, 55.0][(e // 4) % 4], 1.0), t, 0.18)
        t += BEAT / 2
        e += 1
    en = m["entry"]
    place(buf, riser(en - m["clap"]), m["clap"], 0.04)
    place(buf, thump(40, 1.2), en - 0.02, 0.5)
    # resolution: D major, swelling from the pad, landing with the symbolic stick, ringing out under the logo
    end_t = total
    place(buf, v1.pad((146.83, 220.0, 293.66, 369.99, 440.0), end_t - m["pad"] + 0.2, 1.0, 1.2), m["pad"], 0.019)
    place(buf, v1.bass(D, end_t - m["pad"]), m["pad"] + 0.1, 0.16)
    st = m["stick"]
    place(buf, v1.piano(293.66, 3.0), st, 0.1)
    place(buf, v1.piano(369.99, 3.0), st + 0.02, 0.07)
    place(buf, v1.piano(440.0, 3.0), st + 0.04, 0.07)
    place(buf, v1.piano(587.33, 2.5), m["flare"] + 0.2, 0.075)
    # small room reverb
    ir_t = T(1.4)
    ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t / 0.4)[:, None]
    ir[:, 0] = lp(ir[:, 0], 5000)
    ir[:, 1] = lp(ir[:, 1], 5000)
    from scipy.signal import fftconvolve
    wet = np.stack([fftconvolve(buf[:, c], ir[:, c])[: len(buf)] for c in range(2)], axis=1)
    out = buf + 0.16 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(buf))
    # hard gaps (lights out, rewind) and the clean ending fade
    def gap(a, b, f=0.06):
        i0, i1 = int(a * SR), int(b * SR)
        fi = int(f * SR)
        out[i0:i0 + fi] *= np.linspace(1, 0, fi)[:, None]
        out[i0 + fi:i1] = 0
    gap(m["dark0"] + 0.05, m["swap"] + 0.05)
    s0, s1 = int((total - 0.9) * SR), int(total * SR)
    out[s0:s1] *= np.linspace(1, 0, s1 - s0)[:, None] ** 1.5
    out[s1:] = 0
    return norm(out[: int(total * SR)], -6)


if __name__ == "__main__":
    cues = json.load(open(os.path.join(ROOT, "audio", "v5", "sfx_cues_v5.json")))
    total = cues["totalFrames"] / cues["fps"]
    mus = score(total, cues["music"])
    write(os.path.join(OUT, "music_v5.wav"), mus)
    print(f"music_v5: {len(mus) / SR:.2f} s")
