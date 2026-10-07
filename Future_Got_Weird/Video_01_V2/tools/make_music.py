#!/usr/bin/env python3
"""Compose and render the original music bed for Video 01, pass 2 (Future Got Weird).

Playful, light and bouncy: pizzicato strings, marimba, nylon guitar, vibraphone, light percussion.
The score is generated here (no samples of existing music) and rendered with FluidSynth and the
MuseScore General SoundFont (MIT licence). Sections follow the scenes in the timeline, so the
arrangement changes where the story changes: the counter (bouncy), the title moment (one hit),
the apparatus (clockwork), the library (soft), the record (sparse), the game show (drums, brass stabs),
the benchmarks and the verification (sparse), the payoff (warm, resolving).

Outputs: audio/music/stems/<stem>.wav, audio/music/music_bed.wav (48 kHz stereo, unducked)
Usage:   python3 tools/make_music.py
"""
import json
import os
import random
import re
import subprocess
import tempfile

import mido
import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SF2 = os.environ.get("MUSIC_SOUNDFONT", "/usr/share/sounds/sf3/MuseScore_General.sf3")
SR = 48000
BPM = 108
BEAT = 60.0 / BPM
BAR = 4 * BEAT
TPB = 480
SEED = 20261007

CHORDS = {
    "C": [48, 55, 60, 64, 67], "Am": [45, 52, 57, 60, 64], "F": [41, 48, 53, 57, 60], "G": [43, 50, 55, 59, 62],
    "Dm": [50, 57, 62, 65, 69], "Em": [40, 47, 52, 55, 59], "Cmaj7": [48, 55, 59, 64, 67], "Fmaj7": [41, 48, 52, 57, 60],
    "D": [50, 57, 62, 66, 69], "Bb": [46, 53, 58, 62, 65], "A": [45, 52, 57, 61, 64],
}
PROG = {
    "counter": ["C", "Am", "F", "G"],
    "apparatus": ["Am", "F", "C", "G"],
    "library": ["Fmaj7", "Cmaj7", "Dm", "G"],
    "record": ["Am", "Fmaj7", "Cmaj7", "G"],
    "show": ["C", "F", "G", "C"],
    "bench": ["Dm", "G", "C", "Am"],
    "verify": ["Fmaj7", "Em", "Dm", "G"],
    "payoff": ["C", "G", "Am", "F"],
    "end": ["F", "G", "C", "C"],
}
INSTR = {
    "pizz": (45, 0),     # pizzicato strings
    "marimba": (12, 1),
    "guitar": (24, 2),   # nylon guitar
    "vibes": (11, 3),
    "bass": (32, 4),     # acoustic bass
    "clarinet": (71, 5),
    "brass": (61, 6),    # brass section (stabs)
    "drums": (0, 9),
}
SECTION_OF_SCENE = {"S1": "counter", "S2": "counter", "S3": "apparatus", "S4": "library", "S5": "record", "S6": "show", "S7": "bench", "S8": "apparatus", "S9": "verify", "S10": "payoff"}


def load_timeline():
    with open(os.path.join(ROOT, "source/src/data/timeline.json"), encoding="utf-8") as f:
        return json.load(f)


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def word_time(tl, seg_id, word, occ=1):
    seg = next(s for s in tl["segments"] if s["id"] == seg_id)
    hits = [w for w in seg["words"] if norm(w["w"]) == norm(word)]
    return hits[occ - 1]["from"] / tl["fps"]


def seg_time(tl, seg_id, edge="from"):
    seg = next(s for s in tl["segments"] if s["id"] == seg_id)
    return seg[edge] / tl["fps"]


def plan(tl):
    fps = tl["fps"]
    total = tl["durationInFrames"] / fps
    scenes = {s["id"]: (s["from"] / fps, s["to"] / fps) for s in tl["scenes"]}
    title_hit = word_time(tl, "s06", "sure?")
    sting_start = seg_time(tl, "s07", "to") + 0.5
    rule_change = word_time(tl, "s25", "costs")
    end_card = seg_time(tl, "s36", "from")
    # quiet windows: the viewer gets a moment with a reveal or a joke
    drops = [
        (word_time(tl, "s05", "Very") - 0.1, seg_time(tl, "s05", "to") + 0.6),          # "Very professional. Very fictional."
        (word_time(tl, "s11", "true.") - 0.1, word_time(tl, "s11", "true.") + 1.2),     # "not true"
        (word_time(tl, "s19", "A") - 0.2, seg_time(tl, "s19", "to") + 0.7),              # font joke
        (word_time(tl, "s32", "Stamp") - 0.2, seg_time(tl, "s32", "to") + 0.6),          # stamp it
    ]
    nbars = int(np.ceil(total / BAR)) + 2
    bars = []
    for b in range(nbars):
        t = b * BAR + 0.5 * BAR
        sec = "end"
        for sid, (a, z) in scenes.items():
            if a <= t < z:
                sec = SECTION_OF_SCENE[sid]
        if t >= end_card:
            sec = "end"
        bars.append(sec)
    return total, bars, drops, title_hit, sting_start, rule_change, end_card


def in_drop(t, drops, pad=0.0):
    return any(a - pad <= t < b for a, b in drops)


def compose(total, bars, drops, title_hit, sting_start, rule_change, end_card):
    rnd = random.Random(SEED)
    ev = {k: [] for k in INSTR}
    counters = {}
    for b, sec in enumerate(bars):
        t0 = b * BAR
        if t0 > total + 1:
            break
        idx = counters.get(sec, 0)
        counters[sec] = idx + 1
        chord = CHORDS[PROG[sec][idx % 4]]
        root = chord[0]
        upper = chord[1:] + [chord[1] + 12]
        quiet = in_drop(t0 + 0.2, drops, pad=0.2)
        # --- bass: root on 1 and 3 (walking fifth on 4 in the show)
        if sec not in ("record", "verify") and not quiet:
            ev["bass"].append((t0, BEAT * 1.6, root, 62))
            ev["bass"].append((t0 + 2 * BEAT, BEAT * 1.2, root, 56))
            if sec == "show":
                ev["bass"].append((t0 + 3 * BEAT, BEAT * 0.8, root + 7, 58))
        # --- pizzicato: offbeat bounce in the counter / show / payoff
        if sec in ("counter", "show", "payoff", "bench") and not quiet:
            for i in range(8):
                if i % 2 == 1 or (sec == "show" and i % 4 == 0):
                    n = upper[(i // 2 + idx) % 3]
                    ev["pizz"].append((t0 + i * 0.5 * BEAT + rnd.uniform(-0.004, 0.004), 0.3 * BEAT, n, 54 + rnd.randint(-5, 5)))
        # --- marimba: clockwork arpeggio in the apparatus; sparse elsewhere
        if sec == "apparatus":
            pat = [0, 2, 1, 3, 0, 2, 1, 4, 0, 3, 2, 4, 1, 3, 0, 2]
            for i, p in enumerate(pat):
                ts = t0 + i * 0.25 * BEAT
                if in_drop(ts, drops, pad=0.15):
                    continue
                ev["marimba"].append((ts, 0.22 * BEAT, upper[p % len(upper)] + 12, 44 + (8 if i % 4 == 0 else 0) + rnd.randint(-4, 4)))
        elif sec in ("counter", "payoff") and not quiet:
            for i, p in enumerate([0, None, 2, None, 1, None, 3, None]):
                if p is None:
                    continue
                ev["marimba"].append((t0 + i * 0.5 * BEAT, 0.4 * BEAT, upper[p % len(upper)] + 12, 40 + rnd.randint(-4, 4)))
        elif sec == "bench" and not quiet:
            for i, p in enumerate([0, None, None, 2, None, None, 1, None]):
                if p is None:
                    continue
                ev["marimba"].append((t0 + i * 0.5 * BEAT, 0.4 * BEAT, upper[p % len(upper)] + 12, 38))
        # --- nylon guitar: soft arpeggio in the library and the record, strums in payoff
        if sec in ("library", "record", "verify") and not quiet:
            pat = [0, 1, 2, 3, 2, 1] if sec == "library" else [0, None, 2, None, 1, None]
            for i, p in enumerate(pat):
                if p is None:
                    continue
                ev["guitar"].append((t0 + i * (BAR / 6) + rnd.uniform(-0.005, 0.005), BAR / 6 * 1.6, upper[p % len(upper)], 46 + rnd.randint(-4, 4)))
        if sec in ("payoff", "end") and not quiet:
            for n in chord[1:4]:
                ev["guitar"].append((t0 + 0.01 * rnd.random(), BEAT * 1.9, n, 44))
                ev["guitar"].append((t0 + 2 * BEAT + 0.01 * rnd.random(), BEAT * 1.9, n, 40))
        # --- vibes: a held pad note on the record / verify / library (warmth without fuzz)
        if sec in ("record", "verify", "library", "end") and not quiet:
            for n in chord[1:3]:
                ev["vibes"].append((t0, BAR * 0.95, n + 12, 34))
        # --- clarinet: a little counter-melody in the library and payoff every other bar
        if sec in ("library", "payoff") and idx % 2 == 1 and not quiet:
            mel = [upper[0] + 12, upper[1] + 12, upper[2] + 12, upper[1] + 12]
            for i, n in enumerate(mel):
                ev["clarinet"].append((t0 + i * BEAT + 0.5 * BEAT, 0.8 * BEAT, n, 40 + rnd.randint(-4, 4)))
        # --- brass stabs in the show (after the first bar), on 2-and and 4
        if sec == "show" and idx >= 1 and not quiet:
            for ts in (t0 + 1.5 * BEAT, t0 + 3 * BEAT):
                for n in chord[2:5]:
                    ev["brass"].append((ts, 0.3 * BEAT, n + 12, 52))
        # --- drums: light kit in the show and the counter; shaker in the apparatus
        if sec in ("show", "counter") and not quiet:
            for beat in range(4):
                ts = t0 + beat * BEAT
                if beat in (0, 2):
                    ev["drums"].append((ts, 0.2, 36, 56 if sec == "show" else 46))
                if beat in (1, 3):
                    ev["drums"].append((ts, 0.2, 37 if sec == "counter" else 38, 50 if sec == "show" else 40))  # rimshot / snare
                ev["drums"].append((ts + 0.5 * BEAT, 0.1, 42, 30 + rnd.randint(-4, 4)))
        elif sec in ("apparatus", "bench") and not quiet:
            for i in range(8):
                ev["drums"].append((t0 + i * 0.5 * BEAT, 0.08, 70, 24 + (8 if i % 2 == 0 else 0)))
        elif sec == "payoff" and not quiet:
            for beat in range(4):
                ts = t0 + beat * BEAT
                if beat in (0, 2):
                    ev["drums"].append((ts, 0.2, 36, 44))
                ev["drums"].append((ts + 0.5 * BEAT, 0.08, 70, 22))
    # --- title moment: one bright hit (vibes + brass + crash) at the end of "sound that sure?"
    ev["vibes"].append((title_hit + 0.02, 2.2, 72, 64))
    ev["vibes"].append((title_hit + 0.02, 2.2, 79, 56))
    ev["brass"].append((title_hit + 0.02, 1.2, 60, 60))
    ev["brass"].append((title_hit + 0.02, 1.2, 64, 56))
    ev["drums"].append((title_hit + 0.02, 0.5, 49, 58))
    # --- channel sting: a short rising three-note marimba figure + vibes
    for i, n in enumerate([72, 76, 79]):
        ev["marimba"].append((sting_start + i * 0.18, 0.5, n, 70))
    ev["vibes"].append((sting_start + 0.55, 2.0, 84, 58))
    ev["drums"].append((sting_start + 0.55, 0.3, 81, 40))  # triangle
    # --- rule change: a small clarinet turn
    for i, n in enumerate([67, 65, 64]):
        ev["clarinet"].append((rule_change + 0.1 + i * 0.22, 0.3, n, 50))
    # --- end: resolving chord on the end card
    for n in [48, 55, 60, 64, 67]:
        ev["guitar"].append((end_card + 0.2, 3.5, n, 52))
    ev["vibes"].append((end_card + 0.25, 3.5, 72, 46))
    ev["vibes"].append((end_card + 0.25, 3.5, 79, 40))
    return ev


def write_midi(evts, program, channel, path):
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    if channel != 9:
        tr.append(mido.Message("program_change", program=program, channel=channel, time=0))
    tr.append(mido.Message("control_change", control=91, value=34, channel=channel, time=0))
    tr.append(mido.Message("control_change", control=93, value=0, channel=channel, time=0))
    msgs = []
    for (ts, dur, note, vel) in evts:
        on = int(round(max(0.0, ts) / BEAT * TPB))
        off = int(round(max(0.0, ts + dur) / BEAT * TPB))
        msgs.append((on, 1, mido.Message("note_on", note=int(note), velocity=int(max(1, min(127, vel))), channel=channel)))
        msgs.append((off, 0, mido.Message("note_off", note=int(note), velocity=0, channel=channel)))
    msgs.sort(key=lambda m: (m[0], m[1]))
    last = 0
    for tick, _, m in msgs:
        m.time = tick - last
        last = tick
        tr.append(m)
    mid.save(path)


def render(midi_path, wav_path):
    subprocess.run(["fluidsynth", "-ni", "-g", "0.5", "-r", str(SR), "-o", "synth.reverb.active=1", "-o", "synth.chorus.active=0",
                    "-F", wav_path, SF2, midi_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x, axis=0)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x, axis=0)


def peaking(x, f0, gain_db, q=1.0):
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * a, -2 * np.cos(w0), 1 - alpha * a]
    aa = [1 + alpha / a, -2 * np.cos(w0), 1 - alpha / a]
    return signal.lfilter(np.array(b) / aa[0], np.array(aa) / aa[0], x, axis=0)


def main():
    tl = load_timeline()
    total, bars, drops, title_hit, sting_start, rule_change, end_card = plan(tl)
    events = compose(total, bars, drops, title_hit, sting_start, rule_change, end_card)
    stem_dir = os.path.join(ROOT, "audio/music/stems")
    os.makedirs(stem_dir, exist_ok=True)
    n = int((total + 0.5) * SR)
    gains_db = {"pizz": 0, "marimba": 0, "guitar": -3, "vibes": -6, "bass": -5, "clarinet": -6, "brass": -8, "drums": -7}
    bed = np.zeros((n, 2))
    with tempfile.TemporaryDirectory() as td:
        for name, (prog, ch) in INSTR.items():
            if not events[name]:
                continue
            mp = os.path.join(td, f"{name}.mid")
            wp = os.path.join(td, f"{name}.wav")
            write_midi(events[name], prog, ch, mp)
            render(mp, wp)
            x, sr = sf.read(wp, always_2d=True)
            assert sr == SR
            x = x[:n] if len(x) >= n else np.vstack([x, np.zeros((n - len(x), 2))])
            # keep the 1-4 kHz speech band clear for the narration
            if name in ("vibes", "guitar", "clarinet", "brass"):
                x = hp(x, 140)
                x = peaking(x, 2500, -4.0, 0.8)
            if name in ("marimba", "pizz"):
                x = hp(x, 200)
                x = peaking(x, 2200, -3.0, 0.9)
                x = lp(x, 9000)
            if name == "bass":
                x = lp(x, 900)
            if name == "drums":
                x = hp(x, 45)
                x = peaking(x, 3000, -3, 1.0)
            x *= 10 ** (gains_db[name] / 20)
            sf.write(os.path.join(stem_dir, f"{name}.wav"), x.astype(np.float32), SR, subtype="PCM_24")
            bed += x
    fi = int(0.8 * SR)
    bed[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
    fo_start = int((total - 3.0) * SR)
    fo = n - fo_start
    if fo > 0:
        bed[fo_start:] *= np.linspace(1, 0, fo)[:, None] ** 1.6
    peak = np.max(np.abs(bed))
    if peak > 0.89:
        bed *= 0.89 / peak
    out = os.path.join(ROOT, "audio/music/music_bed.wav")
    sf.write(out, bed.astype(np.float32), SR, subtype="PCM_24")
    secs = {}
    for s in bars:
        secs[s] = secs.get(s, 0) + 1
    print(f"music bed: {total:.1f}s, {BPM} BPM, bars per section {secs}, drops {[(round(a, 2), round(b, 2)) for a, b in drops]}, title hit {title_hit:.2f}s, sting {sting_start:.2f}s, end card {end_card:.2f}s -> {out}")


if __name__ == "__main__":
    main()
