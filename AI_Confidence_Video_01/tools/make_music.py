#!/usr/bin/env python3
"""Compose and render the original music bed from the video timeline.

The score is generated here (no samples of existing music) and rendered with FluidSynth using
the MuseScore General SoundFont (MIT licence; parts PD/CC0, see /usr/share/doc/musescore-general-soundfont).
Sections follow the scenes in source/src/data/timeline.json, so the arrangement changes where the
story changes, drops out at the "spot the difference" pause, and resolves at the end.

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
SF2 = os.environ.get("MUSIC_SOUNDFONT", "/usr/share/sounds/sf3/MuseScore_General_Full.sf3")
SR = 48000
BPM = 92
BEAT = 60.0 / BPM
BAR = 4 * BEAT
TPB = 480
SEED = 20261007

CHORDS = {
    "Dmaj9": [50, 57, 61, 64, 66],
    "Bm9": [47, 54, 57, 61, 62],
    "Gmaj9": [43, 50, 54, 57, 59],
    "Asus2": [45, 52, 57, 59, 64],
    "A": [45, 52, 57, 61, 64],
    "Em9": [40, 52, 59, 62, 66],
    "F#m7": [42, 49, 52, 57, 61],
    "Cmaj7": [48, 55, 59, 64, 67],
}
PROG = {
    "A": ["Dmaj9", "Bm9", "Gmaj9", "Asus2"],
    "B": ["Bm9", "Gmaj9", "Dmaj9", "Asus2"],
    "C": ["Em9", "Bm9", "Cmaj7", "Asus2"],
    "D1": ["Dmaj9", "F#m7", "Gmaj9", "Asus2"],
    "D2": ["Gmaj9", "A", "F#m7", "Bm9"],
    "E": ["Gmaj9", "Dmaj9", "Em9", "Asus2"],
    "F": ["Gmaj9", "Asus2", "Dmaj9", "Dmaj9"],
}
# Programs (General MIDI numbers, 0-based) and channels
INSTR = {
    "pad": (89, 0),      # Pad 2 (warm)
    "strings": (49, 1),  # Slow strings
    "arp": (12, 2),      # Marimba
    "keys": (4, 3),      # Electric piano (Rhodes-like)
    "bass": (33, 4),     # Fingered bass
    "bell": (11, 5),     # Vibraphone
    "drums": (0, 9),     # GM percussion
}


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
    rule_change = word_time(tl, "s26", "costs")
    title_hit = word_time(tl, "s07", "wrong")
    # quiet windows (seconds): the viewer gets a moment with the question / reveal
    drops = [
        (seg_time(tl, "s20", "to") - 0.2, seg_time(tl, "s21", "from") + 0.15),  # "Spot the difference?" pause
        (word_time(tl, "s13", "true.") - 0.05, word_time(tl, "s13", "true.") + 1.3),  # likely ≠ true
    ]
    nbars = int(np.ceil(total / BAR)) + 2
    bars = []
    for b in range(nbars):
        t = b * BAR
        sec = "F"
        for sid, key in [("S1", "A"), ("S2", "B"), ("S3", "C"), ("S4", "D1"), ("S5", "E"), ("S6", "F")]:
            a, z = scenes[sid]
            if a <= t + 0.5 * BAR < z:
                sec = key
        if sec == "D1" and t + 0.5 * BAR >= rule_change:
            sec = "D2"
        bars.append(sec)
    return total, bars, drops, title_hit, rule_change


def in_drop(t, drops, pad=0.0):
    return any(a - pad <= t < b for a, b in drops)


def compose(total, bars, drops, title_hit, rule_change):
    rnd = random.Random(SEED)
    events = {k: [] for k in INSTR}  # (start_s, dur_s, note, vel)
    counters = {}
    for b, sec in enumerate(bars):
        t0 = b * BAR
        if t0 > total + 1:
            break
        idx = counters.get(sec, 0)
        counters[sec] = idx + 1
        chord = CHORDS[PROG[sec][idx % 4]]
        first_bar_of_video = b < 2
        # --- pad: always, soft; longer swell in hook
        vel_pad = 40 if sec in ("A", "F") else 46
        if not in_drop(t0 + 0.1, drops):
            for n in chord[1:]:
                events["pad"].append((t0, BAR * 1.02, n, vel_pad + rnd.randint(-3, 3)))
        else:
            for n in chord[1:3]:
                events["pad"].append((t0, BAR, n, 28))
        # --- strings: warmth in E/F and end of C
        if sec in ("E", "F") or (sec == "C" and idx % 4 == 3):
            for n in chord[1:4]:
                events["strings"].append((t0, BAR, n + 12, 34 + rnd.randint(-3, 3)))
        # --- bass
        if sec != "A" or idx >= 2:
            if sec not in ("F",) or idx < 3:
                root = chord[0] - 12 if chord[0] >= 47 else chord[0]
                if not in_drop(t0 + 0.05, drops):
                    events["bass"].append((t0, BEAT * 2.8, root, 58 if sec != "A" else 48))
                    if sec in ("B", "D1", "D2") and idx % 2 == 1:
                        events["bass"].append((t0 + 3.5 * BEAT, BEAT * 0.45, root + 7, 44))
        # --- arpeggio (marimba): rhythm depends on section
        upper = chord[1:] + [chord[2] + 12]
        if sec == "A":
            pat, step, vel = ([0, 2, 4, 3, 1, 3, 2, 4], 0.5, 44) if idx >= 1 else ([0, None, 2, None, 4, None, 3, None], 0.5, 38)
        elif sec == "B":
            pat, step, vel = ([0, 2, 4, 5, 3, 2, 4, 1, 0, 3, 5, 4, 2, 3, 1, 4], 0.25, 40)
        elif sec == "C":
            pat, step, vel = ([4, None, 2, None, 3, None, 1, None], 0.5, 38)
        elif sec == "D1":
            pat, step, vel = ([0, 3, None, 4, 2, None, 4, 3], 0.5, 46)
        elif sec == "D2":
            pat, step, vel = ([0, 2, 4, 5, 4, 2, 5, 3], 0.5, 48)
        elif sec == "E":
            pat, step, vel = ([1, None, None, 3, None, None, 4, None], 0.5, 36)
        else:
            pat, step, vel = ([4, None, 3, None, 2, None, None, None] if idx < 3 else [None] * 8, 0.5, 34)
        for i, p in enumerate(pat):
            if p is None:
                continue
            ts = t0 + i * step * BEAT + rnd.uniform(-0.006, 0.006)
            if in_drop(ts, drops, pad=0.15):
                continue
            note = upper[p % len(upper)] + 12
            v = vel + rnd.randint(-6, 6) + (6 if i % 4 == 0 else 0)
            events["arp"].append((ts, step * BEAT * 0.95, note, max(20, min(100, v))))
        # --- keys (Rhodes) comping in S3/S5
        if sec in ("C", "E") and not in_drop(t0 + 0.1, drops):
            for n in chord[1:4]:
                events["keys"].append((t0 + 0.02 * rnd.random(), BEAT * 1.8, n + 12, 40 + rnd.randint(-4, 4)))
            if idx % 2 == 0:
                for n in chord[2:5]:
                    events["keys"].append((t0 + 2.5 * BEAT, BEAT * 1.2, n + 12, 34))
        # --- vibraphone sparkle after the rule change
        if sec == "D2" and not in_drop(t0, drops):
            events["bell"].append((t0 + 1.5 * BEAT, BEAT, upper[-1] + 12, 40))
        # --- drums (very light): GM kick 36, closed hat 42, shaker 70, rim 37
        if sec in ("B", "D1", "D2"):
            for beat in range(4):
                ts = t0 + beat * BEAT
                if in_drop(ts, drops, pad=0.1):
                    continue
                if beat in (0, 2):
                    events["drums"].append((ts, 0.2, 36, 52 if sec != "B" else 46))
                events["drums"].append((ts + 0.5 * BEAT, 0.1, 42, 26 + rnd.randint(-4, 4)))
                if sec in ("D1", "D2"):
                    events["drums"].append((ts + 0.25 * BEAT, 0.08, 70, 22))
                    events["drums"].append((ts + 0.75 * BEAT, 0.08, 70, 20))
                if sec == "D2" and beat == 3:
                    events["drums"].append((ts, 0.1, 37, 30))
        elif sec == "C" and not in_drop(t0, drops, pad=0.1):
            events["drums"].append((t0, 0.2, 36, 38))
        elif sec == "E" and not in_drop(t0, drops):
            events["drums"].append((t0 + 2 * BEAT, 0.08, 70, 18))
    # --- title hit: low piano-ish octave on the vibraphone + bass at "wrong"
    events["bass"].append((title_hit, 2.4, 38, 72))
    events["bell"].append((title_hit, 2.5, 74, 52))
    events["bell"].append((title_hit, 2.5, 81, 44))
    # --- final resolving chord
    end_t = (len([b for b in bars]) - 3) * BAR
    return events


def write_midi(evts, program, channel, path):
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM)))
    if channel != 9:
        tr.append(mido.Message("program_change", program=program, channel=channel, time=0))
    tr.append(mido.Message("control_change", control=91, value=40, channel=channel, time=0))  # reverb send
    tr.append(mido.Message("control_change", control=93, value=0, channel=channel, time=0))
    msgs = []
    for (ts, dur, note, vel) in evts:
        on = int(round(max(0.0, ts) / BEAT * TPB))
        off = int(round(max(0.0, ts + dur) / BEAT * TPB))
        msgs.append((on, 1, mido.Message("note_on", note=int(note), velocity=int(vel), channel=channel)))
        msgs.append((off, 0, mido.Message("note_off", note=int(note), velocity=0, channel=channel)))
    msgs.sort(key=lambda m: (m[0], m[1]))
    last = 0
    for tick, _, m in msgs:
        m.time = tick - last
        last = tick
        tr.append(m)
    mid.save(path)


def render(midi_path, wav_path):
    subprocess.run(["fluidsynth", "-ni", "-g", "0.5", "-r", str(SR), "-o", "synth.reverb.active=1",
                    "-o", "synth.chorus.active=0", "-F", wav_path, SF2, midi_path], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def hp(x, f, order=2):
    sos = signal.butter(order, f, "highpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def lp(x, f, order=2):
    sos = signal.butter(order, f, "lowpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def peaking(x, f0, gain_db, q=1.0):
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * a, -2 * np.cos(w0), 1 - alpha * a]
    aa = [1 + alpha / a, -2 * np.cos(w0), 1 - alpha / a]
    return signal.lfilter(np.array(b) / aa[0], np.array(aa) / aa[0], x, axis=0)


def main():
    tl = load_timeline()
    total, bars, drops, title_hit, rule_change = plan(tl)
    events = compose(total, bars, drops, title_hit, rule_change)
    stem_dir = os.path.join(ROOT, "audio/music/stems")
    os.makedirs(stem_dir, exist_ok=True)
    n = int((total + 0.5) * SR)
    gains_db = {"pad": -4, "strings": -9, "arp": 1, "keys": -8, "bass": -6, "bell": 2, "drums": -8}
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
            # Tone shaping: keep the 1-4 kHz speech band clear for the narration
            if name in ("pad", "strings", "keys"):
                x = hp(x, 140)
                x = peaking(x, 2500, -4.0, 0.8)
            if name == "arp":
                x = hp(x, 220)
                x = peaking(x, 2200, -3.0, 0.9)
                x = lp(x, 9000)
            if name == "bell":
                x = hp(x, 400)
            if name == "bass":
                x = lp(x, 900)
            if name == "drums":
                x = hp(x, 45)
                x = peaking(x, 3000, -3, 1.0)
            x *= 10 ** (gains_db[name] / 20)
            sf.write(os.path.join(stem_dir, f"{name}.wav"), x.astype(np.float32), SR, subtype="PCM_24")
            bed += x
    # fade in/out
    fi = int(1.2 * SR)
    bed[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
    fo_start = int((total - 4.5) * SR)
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
    print(f"music bed: {total:.1f}s, {BPM} BPM, bars per section {secs}, drops {[(round(a,2), round(b,2)) for a, b in drops]}, title hit {title_hit:.2f}s, rule change {rule_change:.2f}s -> {out}")


if __name__ == "__main__":
    main()
