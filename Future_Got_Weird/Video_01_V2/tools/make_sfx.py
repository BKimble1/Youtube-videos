#!/usr/bin/env python3
"""Build the sparse prop sound-effects track for pass 2 from the measured timeline.

Every sound is tied to a prop or a piece of paper moving on screen, at the frame where the scene
code lands it (the same word cues the scenes use, plus the ramp/pop offsets written in the scenes).
Nothing is "sweetened" where nothing moves.

Sources:
  - ElevenLabs sound effects (eleven_text_to_sound_v2, generated through the connector; prompts,
    measurements and choices in audio/sfx/elevenlabs/SELECTION.md): paper slides, the counter stamp,
    wooden tile clicks, the card-catalogue drawer, the library cart, the game-show fanfare, plus the
    pass-1 paper settle, card tap, marker stroke, wooden tock, low title hit and transition air.
  - Small numpy synths for the interface accents that must be sample-tight and very short: scorer
    ticks, pick settle, rule flip, penalty tones, check/cross tones.

Each ElevenLabs sound is aligned by its measured sync point (main transient, stroke onset, swell
peak, or the stop at the end of a roll) to the frame where the matching motion completes.

Output: audio/sfx/sfx_track.wav (48 kHz stereo) + audio/sfx/sfx_cues.json
"""
import json
import os
import re
import subprocess

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(11)


def db(x):
    return 10 ** (x / 20)


def env(n, a=0.002, d=0.08, curve=6.0):
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    dec = np.exp(-curve * np.maximum(t - a, 0) / max(d, 1e-4))
    return att * dec


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, 23000)], "bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


# ---------------------------------------------------------------- synthesized accents
def tick(freq=3200, dur=0.035, level=-34):
    n = int(dur * SR)
    noise = bandpass(rng.standard_normal(n), freq * 0.7, min(freq * 1.4, 20000))
    tone = np.sin(2 * np.pi * freq * 0.5 * np.arange(n) / SR)
    x = (0.6 * noise / (np.abs(noise).max() + 1e-9) + 0.4 * tone) * env(n, 0.0008, 0.012, 5)
    return x * db(level)


def thunk(level=-27, f0=95):
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = f0 * np.exp(-t * 3)
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


def low_tone(level=-31, f0=220):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f0 * t) + 0.3 * np.sin(2 * np.pi * f0 * 1.5 * t)
    x *= env(n, 0.004, 0.2, 4)
    return x / np.abs(x).max() * db(level)


def flip(level=-27):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
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


def swell(dur=0.5, level=-30):
    m = int(dur * SR)
    sw = bandpass(rng.standard_normal(m), 600, 5000) * np.linspace(0, 1, m) ** 3
    return sw / (np.abs(sw).max() + 1e-9) * db(level)


# ---------------------------------------------------------------- ElevenLabs sounds
EL_DIR = os.path.join(ROOT, "audio/sfx/elevenlabs")
# name: (file, trim start s, trim end s, high-pass Hz, peak dBFS, sync mode)
#   "peak"  = loudest 5 ms (a settle, tap, tock, thud or hit)
#   "onset" = first frame within 20 dB of the peak (the start of a stroke or a roll)
#   "swell" = maximum of the 60 ms envelope (the middle of an air whoosh)
#   "stop"  = last frame within 20 dB of the peak (the end of a roll or slide)
EL_SFX = {
    "paper": ("paper_v2.mp3", 0.0, 0.95, 150, -22, "peak"),      # pass 1: one sheet settles
    "slide": ("paper2_v2.mp3", 0.10, 1.55, 150, -24, "stop"),     # pass 2: a slip slides across the counter
    "stamp": ("stamp_v2.mp3", 0.60, 1.30, 60, -18, "peak"),       # pass 2: rubber stamp thud
    "tile": ("token_v4.mp3", 0.12, 0.70, 400, -24, "peak"),       # pass 2: wooden tile click
    "drawer": ("drawer_v1.mp3", 0.0, 1.0, 80, -24, "stop"),       # pass 2: catalogue drawer slide + stop
    "cart": ("cart_v1.mp3", 0.0, 1.85, 120, -26, "stop"),         # pass 2: library cart rolls and stops
    "fanfare": ("fanfare_v2.mp3", 0.0, 1.9, 120, -23, "onset"),   # pass 2: game-show win sting
    "whoosh": ("whoosh_v3.mp3", 0.0, 1.25, 40, -27, "swell"),     # pass 1: low air for the paper wipes
    "tap": ("tap_v1.mp3", 0.28, 0.60, 120, -24, "peak"),          # pass 1: card placed on felt
    "marker": ("marker_v3.mp3", 0.03, 0.58, 300, -25, "onset"),   # pass 1: felt-tip stroke
    "tock": ("tock_v4.mp3", 0.0, 0.30, 150, -21, "peak"),         # pass 1: soft wooden tock
    "impact": ("impact_v3.mp3", 0.0, 2.0, 28, -22, "peak"),       # pass 1: restrained low title hit
}
_cache = {}


def el_sound(name, gain_db=0.0, rate=1.0):
    """Return (mono samples, sync offset in seconds) for a selected ElevenLabs effect."""
    fn, a, z, hpf, peak_db, mode = EL_SFX[name]
    ar = int(round(SR / rate))  # resampled to SR/rate, then played at SR: rate > 1 is higher and shorter
    key = (name, ar)
    if key not in _cache:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(EL_DIR, fn), "-ac", "1",
                              "-ar", str(ar), "-af", "aresample=resampler=soxr",
                              "-f", "f32le", "-"], capture_output=True, check=True).stdout
        _cache[key] = np.frombuffer(raw, np.float32).astype(np.float64)
    x = _cache[key][int(a * ar): int(z * ar)].copy()
    x = signal.sosfilt(signal.butter(2, hpf, "highpass", fs=SR, output="sos"), x)
    fi, fo = int(0.003 * SR), int(0.04 * SR)
    x[:fi] *= np.linspace(0, 1, fi)
    x[-fo:] *= np.linspace(1, 0, fo) ** 2
    hop = int(0.005 * SR)
    nfr = len(x) // hop
    lv = 20 * np.log10(np.sqrt((x[: nfr * hop].reshape(nfr, hop) ** 2).mean(1)) + 1e-10)
    if mode == "peak":
        sync = int(lv.argmax()) * hop / SR
    elif mode == "onset":
        sync = int(np.argmax(lv > lv.max() - 20)) * hop / SR
    elif mode == "stop":
        sync = (nfr - int(np.argmax(lv[::-1] > lv.max() - 20))) * hop / SR
    else:
        sm = np.convolve(10 ** (lv / 10), np.ones(12) / 12, mode="same")
        sync = int(sm.argmax()) * hop / SR
    x = x / (np.abs(x).max() + 1e-12) * db(peak_db + gain_db)
    return x, sync


def load():
    with open(os.path.join(ROOT, "source/src/data/timeline.json"), encoding="utf-8") as f:
        return json.load(f)


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def main():
    tl = load()
    fps = tl["fps"]
    segs = {s["id"]: s for s in tl["segments"]}

    def at(seg_id, word=None, occ=1):
        s = segs[seg_id]
        if word is None:
            return s["from"]
        hits = [w for w in s["words"] if norm(w["w"]) == norm(word)]
        if len(hits) < occ:
            raise SystemExit(f"cue not found: {seg_id} {word!r} #{occ}")
        return hits[occ - 1]["from"]

    def seg_end(seg_id):
        return segs[seg_id]["to"]

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
        cues.append({"t": round(t_sec, 3), "frame": int(round(t_sec * fps)), "name": name})

    F = lambda frame: frame / fps

    def el(name, frame, pan=0.0, label="", gain_db=0.0, rate=1.0, lead_s=0.0):
        """Place an ElevenLabs sound so its sync point lands on `frame` (+ lead_s seconds)."""
        x, sync = el_sound(name, gain_db, rate)
        t_sync = F(frame) + lead_s
        place(x, t_sync - sync, pan, f"{label} [EL {name}]")
        cues[-1]["sync_frame"] = int(frame)

    # window pans: the three counter windows sit at world x 480 / 960 / 1440
    WIN_PAN = [-0.35, 0.0, 0.35]

    # ================================================================ S1 — the counter
    cQ = at("s01", "question:")
    place(tick(2600, 0.03, -36), F(cQ + 8), 0.0, "S1 question card up (synth)")
    # the three slips pop out of their windows (pop at cue+4, lands ~8 frames later)
    for k, (sid, word) in enumerate([("s02", "ChatGPT"), ("s02", "DeepSeek"), ("s02", "Llama")]):
        el("slide", at(sid, word) + 12, WIN_PAN[k], f"slip {'ABC'[k]} slides out", -1.0 * k, 1.0 + 0.05 * k)
    # title / university / year marked on slip A (marks ramp from the word)
    for k, word in enumerate(["title,", "university,", "year."]):
        el("marker", at("s02", word), -0.3, f"mark {word.strip(',.')} on slip A", -4.0 - 2.0 * k, 1.0 + 0.06 * k)
    # the big hand stamps WRONG on A, B, C: press peaks one frame after each stampAt
    cAllWrong = at("s03", "All")
    for k in range(3):
        el("stamp", cAllWrong + 2 + 10 * k + 1, WIN_PAN[k], f"stamp WRONG on slip {'ABC'[k]}", -0.8 * k, 1.0 + 0.03 * k)
    # the years are circled (rows 3 frames apart): two strokes, the second quieter
    cRightYear = at("s03", "year.")
    el("marker", cRightYear - 4, -0.2, "circle the years, first", -3.0)
    el("marker", cRightYear + 2, 0.2, "circle the years, rest", -8.0, 1.07)
    # the paper's header cuts in (evIn ramps cAdam+2 over 16 frames)
    el("paper", at("s04", "And") + 16, 0.0, "paper header lands")
    el("marker", at("s04", "lead"), 0.1, "box around the lead author", -5.0, 0.96)

    # ================================================================ S2 — the short version
    cSure = at("s06", "sure?")
    place(swell(0.5, -30), F(cSure) - 0.5, 0, "title swell (synth)")
    el("impact", cSure, 0.0, "title hit", 0.0, 1.0, 0.02)
    cShort = at("s06", "Here's")
    el("whoosh", cShort + 12, 0.0, "panels change", -6.0, 1.15)
    # three claim panels land (k1/k2/k3 ramp 14 frames from the word)
    for k, (sid, word) in enumerate([("s07", None), ("s07", "Checking"), ("s07", "tests")]):
        f0 = at(sid) if word is None else at(sid, word)
        el("tap", f0 + 9, -0.4 + 0.4 * k, f"claim panel {k + 1} lands", -1.0 * k, 1.0 + 0.04 * k)
    el("marker", at("s07", "likely") + 2, -0.4, "underline: likely", -6.0)
    el("marker", at("s07", "different") + 2, 0.0, "underline: different tests", -6.0, 1.05)
    el("stamp", at("s07", "guessing.") + 2, 0.4, "GUESSING PAYS stamp (no hand)", -6.0, 1.1)
    # the channel sting swings in a beat after the last word
    el("whoosh", seg_end("s07") + 20, 0.0, "channel sting in", -3.0)

    # ================================================================ S3 — token machine
    el("slide", at("s08", "apart.") + 12, -0.2, "the slip unfolds on the track", -2.0, 0.95)
    # the split: a shimmer of ticks across the 18-frame split
    t0 = F(at("s09", "tokens:") - 2)
    for k in range(14):
        place(tick(2400 + 1800 * rng.random(), 0.03, -33), t0 + k * (0.6 / 14) + rng.uniform(-0.008, 0.008), rng.uniform(-0.5, 0.5), "token split (synth)")
    el("tile", at("s09", "“Kal”") + 2, -0.15, "tile: Kal", 0.0)
    el("tile", at("s09", "“ai.”") + 4, 0.15, "tile: ai", -1.0, 1.06)
    # the scorer: nine ticks sweep up the candidate list, then the pick settles
    tp = F(at("s10", "scores"))
    for k in range(9):
        place(tick(1700 + 120 * k, 0.025, -33), tp + 0.6 * (k / 9), 0.3, "scorer sweep (synth)")
    place(pluck(784, -31), F(at("s10", "picks") + 16), 0.3, "pick settles (synth)")
    cAgain = at("s10", "again.")
    for k in range(5):
        place(tick(2000 + 150 * k, 0.025, -36), F(cAgain - 4) + k * 0.08, 0.3, "scorer reload (synth)")
    place(pluck(880, -33), F(cAgain + 24), 0.3, "second pick settles (synth)")
    # the answer rolls out: one tile click per real next token
    cToken = at("s10", "Token")
    for i in range(1, 7):
        el("tile", cToken + i * 6 + 4, -0.3 + 0.1 * i, f"roll-out tile {i}", -2.0 - 0.8 * i, 1.0 + 0.03 * (i % 3))
    place(pluck(988, -32, 0.4), F(at("s11", "likely.")), -0.3, "likely (synth)")
    place(low_tone(-31, 196), F(at("s11", "true.")), -0.3, "not the true one (synth)")
    # add-on modules bolt on (modT ramps cue-4 over 14 frames)
    for k, word in enumerate(["instruction", "step-by-step", "web"]):
        el("tap", at("s12", word) + 8, -0.3 + 0.3 * k, f"module bolts on: {word}", -2.0, 0.88 + 0.04 * k)
    cPiece = at("s12", "piece")
    for k in range(3):
        el("tile", cPiece + 5 * k, 0.1, "piece by piece", -8.0 - 2.0 * k, 1.0 + 0.04 * k)

    # ================================================================ S4 — the library
    for k, word in enumerate(["“Methods.”", "“Algorithms.”", "“Machine"]):
        el("tock", at("s14", word) + 2, -0.3 + 0.3 * k, f"book lights up: {word}", -3.0, 1.0 - 0.05 * k)
    # the catalogue drawer slides open (ramp cBut+6 over 20, eased: stops at cBut+26)
    el("drawer", at("s15", "But") + 26, 0.3, "catalogue drawer opens")
    el("tap", at("s15", "birthday,") + 8, 0.35, "birthday cake lands", -4.0, 1.1)
    # words fly in to fill the gap (three, 5 frames apart)
    cFills = at("s16", "fills")
    for k in range(3):
        place(tick(3000 + 300 * k, 0.03, -36), F(cFills - 4 + k * 5 + 14), -0.2 + 0.2 * k, "word flies in (synth)")
    el("slide", cFills + 38, 0.0, "the made-up slip settles", -3.0, 1.05)
    el("stamp", at("s16", "confidence") + 12, 0.2, "IS ENTITLED seal lands", -5.0, 0.92)
    el("marker", at("s16", "think.”") + 2, 0.0, "strike: I think", -3.0)
    el("marker", at("s16", "“maybe.”") + 2, 0.1, "strike: maybe", -5.0, 1.06)

    # ================================================================ S5 — the record
    el("paper", at("s17") + 8, 0.0, "thesis title block lands")
    for k, word in enumerate(["“Probabilistic", "Carnegie", "May"]):
        el("marker", at("s17", word), -0.1, f"highlight box: {word}", -7.0 - 2.0 * k, 1.0 + 0.05 * k)
    el("slide", at("s18", "ChatGPT") + 6, 0.3, "the ChatGPT slip comes alongside", -2.0)
    place(chime(-32), F(at("s18", "right.")) + 0.03, 0.15, "university matches (synth)")
    place(thunk(-29), F(at("s18", "one.")) + 0.05, 0.15, "year off by one (synth)")
    place(thunk(-28, 80), F(at("s18", "invented.")) + 0.05, 0.15, "title invented (synth)")
    el("tap", at("s19", "confident") + 6, 0.3, "magnifier lands", -3.0, 0.95)

    # ================================================================ S6 — game show
    el("tap", at("s20", "graded."), 0.0, "sign lands", -2.0)
    for k, word in enumerate(["Right", "Wrong", "“I"]):
        el("tock", at("s21", word) + 4, -0.3 + 0.3 * k, f"rule card: {word}", -2.0, 1.0 - 0.05 * k)
    place(thunk(-30, 70), F(at("s22", "Two") + 8), 0.0, "podiums land (synth)")
    cBoth, cBlank = at("s22", "Both"), at("s22", "blank.")
    for k in range(6):
        el("tile", cBoth + 4 + k * 3 + 5, -0.45 + 0.03 * k, f"honest tile known {k + 1}", -4.0 - 0.5 * k, 1.0 + 0.02 * (k % 3))
    for k in range(4):
        el("tile", cBlank - 8 + k * 4 + 5, -0.35, f"honest tile blank {k + 1}", -10.0, 0.9)
    el("tock", at("s22", "Six") + 2, -0.35, "Honest: 6", 0.0, 1.0, 0.03)
    cLands = at("s23", "lands.")
    for k in range(4):
        el("tile", cLands + k * 4 + 5, 0.3, f"guesser tile resolves {k + 1}", -5.0, 1.0 + 0.03 * k)
    el("tock", at("s23", "Seven") + 2, 0.35, "Guesser: 7", 0.0, 1.06, 0.03)
    place(chime(-34), F(at("s24", "One")) + 0.03, 0.35, "one lucky guess (synth)")
    place(thunk(-31), F(at("s24", "Three")) + 0.05, 0.35, "three wrong (synth)")
    cTrophy = at("s24", "trophy.")
    el("fanfare", cTrophy - 2, 0.3, "the guesser gets the trophy", 0.0)
    el("slide", cTrophy + 4, 0.1, "confetti", -16.0, 1.3)
    cCosts = at("s25", "costs")
    place(flip(-27), F(cCosts) + 0.03, 0, "rule card flips (synth)")
    place(tick(2200, 0.03, -33), F(at("s25", "plus") + 3), -0.3, "plus one (synth)")
    cMinus = at("s25", "minus")
    for k in range(3):
        place(low_tone(-33), F(cMinus + 2 + k * 5 + 3), 0.3, "minus one (synth)")
    el("tock", at("s25", "Four.") + 2, 0.35, "Guesser: 4", -1.0, 0.94, 0.03)
    # the trophy walks over to the honest podium: little footsteps across the 38-frame walk
    cWalks = at("s25", "trophy")
    for k in range(7):
        el("tock", cWalks + 2 + k * 5, 0.3 - 0.1 * k, f"trophy footstep {k + 1}", -12.0, 1.35 + 0.05 * (k % 2))

    # ================================================================ S7 — benchmarks
    el("paper", at("s26") + 8, 0.0, "Table 2 lands")
    # the tally: nine marks across the row sweep (sweepStart cNine-4 .. sweepEnd cStrictly+20), row 4 skipped
    sweep_start, sweep_end = at("s26", "Nine") - 4, at("s26", "strictly") + 20
    for r in range(10):
        if r == 4:
            continue
        fr = sweep_start + (sweep_end - sweep_start) * r / 10
        place(tick(2800 + 60 * r, 0.03, -34), F(fr), 0.35, f"tally mark (row {r + 1}) (synth)")
    place(thunk(-30, 90), F(at("s26", "no")) + 0.03, 0.35, "no credit for IDK (synth)")
    el("tap", at("s27", "Train") + 12, 0.0, "leaderboard lands", -2.0)
    el("tock", at("s27", "pays.") + 1, 0.0, "guessing pays", -2.0, 1.0)

    # ================================================================ S8 — what helps
    cSearch = at("s28", "Search")
    el("cart", cSearch + 36, -0.2, "retrieval cart rolls in and stops", 0.0, 1.25)
    el("drawer", cSearch + 40, 0.0, "booth shutter opens", -4.0, 1.1)
    place(pluck(1046.5, -33, 0.3), F(at("s28", "Reasoning,") + 8), 0.2, "reasoning bubble pops (synth)")
    cTurning = at("s28", "Turning")
    for k in range(6):
        place(tick(1500 + 100 * k, 0.02, -35), F(cTurning + 6 + k * 5), -0.3, "dial click (synth)")
    cConsistent, cCorrect = at("s28", "consistent,"), at("s28", "correct.")
    for k in range(3):
        el("tap", cConsistent + 4 + k * 6, 0.1 + 0.1 * k, f"identical slip {k + 1} lands", -3.0 - k, 1.0 + 0.04 * k)
    for k in range(3):
        el("stamp", cCorrect - 7 + k * 4, 0.1 + 0.1 * k, f"WRONG on identical slip {k + 1}", -5.0 - k, 1.0 + 0.04 * k)
    el("stamp", at("s28", "None") + 6, 0.0, "NO GUARANTEE stamp", -2.0, 0.95)

    # ================================================================ S9 — verify
    el("tap", at("s29", "check.") + 4, 0.0, "CHECK sign lands", -2.0)
    el("tap", at("s30", "Two") + 14, -0.2, "question card 1", -2.0, 1.0)
    el("tap", at("s30", "say") - 2, 0.2, "question card 2", -2.0, 1.04)
    el("slide", at("s31", "Take") + 6, 0.2, "the ChatGPT slip is pinned", -2.0)
    el("paper", at("s31", "Is") + 16, -0.2, "thesis title page pinned")
    place(chime(-31), F(at("s31", "Yes.")) + 0.03, -0.15, "source exists (synth)")
    place(low_tone(-31), F(at("s31", "No.")) + 0.03, 0.15, "does not say this (synth)")
    cDoes = at("s31", "Does")
    el("marker", cDoes + 6, 0.2, "mark the claimed title", -4.0)
    el("marker", cDoes + 20, 0.2, "mark the claimed year", -7.0, 1.05)
    el("marker", at("s31", "It"), -0.2, "mark the real title", -4.0, 0.97)
    el("marker", at("s31", "2001.") - 6, -0.2, "mark the real year", -7.0, 1.02)
    place(tick(2600, 0.03, -34), F(at("s32", "Source")), -0.1, "source exists tag (synth)")
    place(thunk(-30), F(at("s32", "Claim")) + 0.03, 0.1, "claim fails tag (synth)")
    el("stamp", at("s32", "Stamp") + 5, 0.0, "CLAIM FAILS stamp", 1.0)

    # ================================================================ S10 — payoff
    el("tap", at("s33", "Because") + 9, -0.4, "column: sounding right", -2.0)
    el("tap", at("s33", "being") + 9, 0.4, "column: being right", -2.0, 1.04)
    cDont = at("s34", "don't")
    el("tap", cDont + 6, 0.0, "the old question card", -4.0, 0.96)
    el("marker", cDont + 10, 0.0, "strike: does it sound right", -1.0, 0.95)
    el("tap", at("s34", "Ask") + 9, -0.2, "question card 1", -2.0)
    el("tap", at("s34", "actually") + 3, 0.2, "question card 2", -2.0, 1.04)
    cPeople = at("s35", "people,")
    el("slide", cPeople + 6, 0.35, "the person's slip", -3.0, 1.0)
    el("stamp", cPeople + 16 + 5, 0.35, "SOURCE? stamp", 0.0)
    cThis = at("s36", "This")
    el("whoosh", cThis + 1, 0.0, "end card in", -3.0)
    el("tap", at("s36", "twice") + 6, 0.0, "twice a week chip", -4.0, 1.08)
    place(pluck(1174.7, -32, 0.4), F(at("s36", "subscribe.") + 2), 0.0, "subscribe chip (synth)")

    # ================================================================ scene wipes (12-frame paper wipe centred on the boundary)
    for k, sc in enumerate(tl["scenes"][1:]):
        el("whoosh", sc["from"], 0.0, f"wipe into {sc['id']}", -2.0 if k % 2 else 0.0, 1.0 + 0.03 * (k % 3))

    peak = np.abs(track).max()
    os.makedirs(os.path.join(ROOT, "audio/sfx"), exist_ok=True)
    sf.write(os.path.join(ROOT, "audio/sfx/sfx_track.wav"), track[: int(total * SR)].astype(np.float32), SR, subtype="PCM_24")
    cues.sort(key=lambda c: c["t"])
    with open(os.path.join(ROOT, "audio/sfx/sfx_cues.json"), "w") as f:
        json.dump(cues, f, indent=1)
    print(f"sfx: {len(cues)} cue events, peak {20 * np.log10(peak):.1f} dBFS")


if __name__ == "__main__":
    main()
