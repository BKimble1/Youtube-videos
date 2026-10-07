#!/usr/bin/env python3
"""Build the sparse sound-effects track from the timeline.

Two sources, each used where it does the job best:
  - Synthesized here with numpy: the precisely timed interface accents (token split / generation
    ticks, the selection "pick", error thunks, the scoring-rule flip, the penalties, and the
    check/cross in the verification beat).
  - ElevenLabs sound effects (eleven_text_to_sound_v2, generated for this video through the
    connector; selection and prompts in audio/sfx/elevenlabs/SELECTION.md): the organic sounds a
    synth does poorly. Every real document lands with the same quiet paper slide, scene changes get
    a low air swell, the hook's answer cards a card tap, hand-drawn marks a marker stroke, quiz
    scores a wooden tock, and the title card one restrained low hit.

Each ElevenLabs sound is aligned by its own measured sync point (main transient, stroke onset or
swell peak) to the frame where the matching motion completes, not by the start of the file.

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


EL_DIR = os.path.join(ROOT, "audio/sfx/elevenlabs")
# name: (file, trim start s, trim end s, high-pass Hz, peak dBFS, sync mode)
#   sync "peak"  = loudest 5 ms (a transient: settle, tap, tock, hit)
#   sync "onset" = first frame within 20 dB of the peak (the start of a marker stroke)
#   sync "swell" = maximum of the 60 ms envelope (the middle of a whoosh)
EL_SFX = {
    "paper": ("paper_v2.mp3", 0.0, 0.95, 150, -22, "peak"),
    "whoosh": ("whoosh_v3.mp3", 0.0, 1.25, 40, -25, "swell"),
    "tap": ("tap_v1.mp3", 0.28, 0.60, 120, -23, "peak"),
    "marker": ("marker_v3.mp3", 0.03, 0.58, 300, -24, "onset"),
    "tock": ("tock_v4.mp3", 0.0, 0.30, 150, -20, "peak"),
    "impact": ("impact_v3.mp3", 0.0, 2.0, 28, -21, "peak"),
}


def el_sound(name, gain_db=0.0, rate=1.0):
    """Return (mono samples, sync offset in seconds) for a selected ElevenLabs effect."""
    fn, a, z, hpf, peak_db, mode = EL_SFX[name]
    ar = int(round(SR / rate))  # resampled to SR/rate, then played at SR: rate > 1 is higher and shorter
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(EL_DIR, fn), "-ac", "1",
                          "-ar", str(ar), "-af", "aresample=resampler=soxr",
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    x = x[int(a * ar): int(z * ar)]
    x = signal.sosfilt(signal.butter(2, hpf, "highpass", fs=SR, output="sos"), x)
    fi, fo = int(0.003 * SR), int(0.03 * SR)
    x[:fi] *= np.linspace(0, 1, fi)
    x[-fo:] *= np.linspace(1, 0, fo) ** 2
    hop = int(0.005 * SR)
    nfr = len(x) // hop
    lv = 20 * np.log10(np.sqrt((x[: nfr * hop].reshape(nfr, hop) ** 2).mean(1)) + 1e-10)
    if mode == "peak":
        sync = int(lv.argmax()) * hop / SR
    elif mode == "onset":
        sync = int(np.argmax(lv > lv.max() - 20)) * hop / SR
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

    def place_el(name, t_sync, pan=0.0, label="", gain_db=0.0, rate=1.0):
        x, sync = el_sound(name, gain_db, rate)
        place(x, t_sync - sync, pan, f"{label} [ElevenLabs {name}]")
        cues[-1]["sync_t"] = round(t_sync, 3)

    # --- Hook (S1). Answer cards slide in (16-frame ramps): a card tap as each one lands.
    for k, (sid, word) in enumerate([("s02", "ChatGPT"), ("s03", "DeepSeek"), ("s03", "Llama")]):
        place_el("tap", F(at(sid, word) + 9), -0.15 + 0.15 * k, f"answer card {k + 1} lands", -1.5 * k, 1.0 + 0.04 * k)
    # Coral marks drawn over every title, then every year (rows start 4 frames apart)
    for word, g_db in (("title", 0.0), ("year", -2.0)):
        c = at("s04", word)
        place_el("marker", F(c - 6), -0.2, f"mark {word}s, row 1", g_db)
        place_el("marker", F(c + 0), 0.2, f"mark {word}s, rows 2-3", g_db - 5, 1.07)
    # Real documents land: the paper's header, then the published IMO solutions PDF
    place_el("paper", F(at("s05", "Kalai?") + 11), 0.0, "paper header lands")
    place_el("paper", F(at("s06") + 12 + 11), -0.25, "IMO solutions PDF lands", -1.0)
    # Title card: a soft lead-in swell, then one restrained low hit on "wrong"
    imp, lead = impact()
    swell = imp[: int(lead * SR)]
    air = bandpass(rng.standard_normal(int(0.5 * SR)), 2000, 9000) * env(int(0.5 * SR), 0.002, 0.25, 6)
    t_hit = F(at("s07", "wrong")) + 0.02
    place(swell * db(-3), t_hit - lead, 0, "title swell (synth)")
    place(air / np.abs(air).max() * db(-40), t_hit, 0, "title air (synth)")
    place_el("impact", t_hit, 0, "title hit")

    # --- Scene changes: a low air swell peaking in the middle of the 10-frame cross-fade
    for k, sc in enumerate(tl["scenes"][1:]):
        place_el("whoosh", F(sc["from"] - 5), 0.0, f"into {sc['id']}", -1.0 if k % 2 else 0.0)

    # --- Every other real document arrives with the same paper slide (synced to its settle)
    docs = [
        (at("s12", "Because") + 8, "S2: birthday question excerpt, p. 1", 0.0, 0.0),
        (at("s17", "paper") + 12, "S3: Einstein example, p. 10", 0.1, -1.0),
        (at("s18", "birthday,") + 8 + 10, "S3: Figure 1, p. 3", 0.0, 0.0),
        (at("s21", "year:") + 12, "S3: thesis title block (evidence)", 0.3, -3.0),
        (at("s28", "checked") + 8, "S4: Table 2, p. 14", 0.0, 0.0),
        (at("s29", "fix:") + 12, "S4: proposed instruction, p. 13", 0.0, -1.0),
        (at("s31", "Here's") + 12 + 12, "S5: thesis title page", -0.2, 0.0),
    ]
    for frame, label, pan, g_db in docs:
        place_el("paper", F(frame), pan, label, g_db)

    # --- Quiz scores (S4): a wooden tock as each score appears
    place_el("tock", F(at("s24", "Six", 2)) + 0.03, -0.25, "Honest: 6")
    place_el("tock", F(at("s25", "Seven")) + 0.03, 0.25, "Guesser: 7", 0.0, 1.06)
    place_el("tock", F(at("s27", "Four.")) + 0.03, 0.25, "Guesser: 4", -1.0, 0.94)

    # --- Ending (S6): "Does it sound right?" is struck through before the real question
    place_el("marker", F(at("s37", "right.")) + 0.0, 0.0, "strike: sounds right", -1.0, 0.95)

    # Token split: shimmer of ticks across the split animation (22 frames)
    t0 = F(at("s09", "tokens"))
    for k in range(23):
        place(tick(2400 + 1800 * rng.random(), 0.03, -32), t0 + k * (0.72 / 23) + rng.uniform(-0.01, 0.01), rng.uniform(-0.6, 0.6), "token split")
    # Selection sweep + settle on "picked"
    tp = F(at("s11", "picked"))
    for k in range(9):
        place(tick(1700 + 120 * k, 0.025, -32), tp + 0.73 * (1 - (1 - k / 9) ** 2), 0.3, "pick sweep")
    place(pluck(784, -31), tp + 0.75, 0.3, "pick settle")
    # Tile lands
    place(pluck(1046.5, -33, 0.3), F(at("s11", "added")) + 0.55, 0.2, "token lands")
    # Generation loop: one tick per appended token (every 7 frames, starting 6 frames after "loop")
    tl0 = F(at("s11", "loop")) + 6 / fps
    for k in range(7):
        place(tick(2600 + 90 * k, 0.03, -31), tl0 + k * 7 / fps, 0.4, "token append")
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
