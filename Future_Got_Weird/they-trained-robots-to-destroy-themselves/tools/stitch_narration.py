"""Stitch the selected narration takes into one locked narration track and remap Scribe word timings onto it.

Inputs
  audio/narration/takes/bNN_tK_*.mp3        the generated takes (ElevenLabs, Test Voice, eleven_v4)
  audio/all_takes_scribe_words.json         one Scribe pass over all takes concatenated with 2 s gaps
  audio/all_takes_offsets.json              where each take starts in that concatenation
Outputs
  audio/narration/narration_v1.wav (+ .mp3)  the locked narration (mono 44.1 kHz)
  source/public/audio/narration.mp3          copy used by the mixer
  audio/narration_words.json                 word timings on the stitched timeline
  source/src/data/narration_words.json       same, for the Remotion cue system
  audio/narration_timing.md                  block table

Usage: python3 tools/stitch_narration.py
"""
import json, os, subprocess

import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..")
SR = 44100

# Selected take per block (see audio/narration_timing.md for the reason) and the silence after each block.
SELECT = [
    ("b01_t1_89S4.mp3", 0.60),  # cold open; a beat after the two questions
    ("b02_t1_PerN.mp3", 0.50),
    ("b03_t1_ukeu.mp3", 0.75),  # section change into the training explanation
    ("b04_t1_1LTe.mp3", 0.50),
    ("b05_t1_rQ3A.mp3", 0.65),
    ("b06_t1_GeXj.mp3", 0.75),
    ("b07_t1_Li0N.mp3", 0.00),
]
# Extra silence inserted inside a block at a measured pause: (file, take-local seconds, seconds to add).
INSERTS = [
    ("b07_t1_Li0N.mp3", 19.55, 0.30),  # breath before "They trained robots to destroy themselves."
    ("b07_t1_Li0N.mp3", 25.52, 0.55),  # beat before the closing question
]


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0


offsets = {o["file"]: o for o in json.load(open(os.path.join(ROOT, "audio", "all_takes_offsets.json")))}
allw = [w for w in json.load(open(os.path.join(ROOT, "audio", "all_takes_scribe_words.json")))["words"] if w.get("type", "word") == "word"]

pieces, words, rows = [], [], []
t = 0.0
for name, gap in SELECT:
    x = load(os.path.join(ROOT, "audio", "narration", "takes", name))
    ins = sorted([(s, d) for f, s, d in INSERTS if f == name])
    # split at insert points (snap to the exact sample)
    segs, cur = [], 0
    for s, d in ins:
        k = int(round(s * SR))
        segs.append(x[cur:k]); segs.append(np.zeros(int(round(d * SR)), dtype=np.float32)); cur = k
    segs.append(x[cur:])
    block = np.concatenate(segs)
    o = offsets[name]
    for w in allw:
        if o["offset"] - 0.05 <= w["start"] <= o["offset"] + o["dur"] + 0.05:
            local_s, local_e = w["start"] - o["offset"], w["end"] - o["offset"]
            shift = sum(d for s, d in ins if local_s >= s)
            words.append({"text": w["text"], "type": "word", "start": round(t + local_s + shift, 3), "end": round(t + local_e + shift, 3), "block": name[:3]})
    rows.append((name, t, len(block) / SR, gap))
    pieces.append(block)
    if gap > 0:
        pieces.append(np.zeros(int(round(gap * SR)), dtype=np.float32))
    t += len(block) / SR + gap

y = np.concatenate(pieces)
os.makedirs(os.path.join(ROOT, "audio", "narration"), exist_ok=True)
wav = os.path.join(ROOT, "audio", "narration", "narration_v1.wav")
import wave
with wave.open(wav, "wb") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
mp3 = os.path.join(ROOT, "audio", "narration", "narration_v1.mp3")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "192k", mp3], check=True)
os.makedirs(os.path.join(ROOT, "source", "public", "audio"), exist_ok=True)
subprocess.run(["cp", mp3, os.path.join(ROOT, "source", "public", "audio", "narration.mp3")], check=True)

doc = {"source": "ElevenLabs Scribe (eleven_scribe_v1) word timings of the selected takes, remapped onto narration_v1",
       "voice": "Test Voice kk5XaSLo2XAw0sKM98zU", "model": "eleven_v4", "duration": round(len(y) / SR, 3), "words": words}
for p in [os.path.join(ROOT, "audio", "narration_words.json"), os.path.join(ROOT, "source", "src", "data", "narration_words.json")]:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(doc, open(p, "w"), indent=1)

with open(os.path.join(ROOT, "audio", "narration_timing.md"), "w") as f:
    f.write("# Narration timing (v1)\n\nVoice: ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU`, model `eleven_v4`, default settings, flow `bMvBZzDdtEZz45PtXUpm`.\n")
    f.write("Two takes per block were generated; take 1 was selected for every block. All 14 takes were transcribed with Scribe and match the script.\n")
    f.write("B5 take 1 was preferred because take 2 runs \"airbags, and the foundry did get messy\" together; take 1 keeps the sentence break that starts a new beat.\n")
    f.write("No take was auditioned by ear in this session (no audio playback). Selection used transcripts and measured pauses/levels only.\n\n")
    f.write("| Block | Take | Starts (s) | Length (s) | Gap after (s) |\n|---|---|---|---|---|\n")
    for name, s, d, g in rows:
        f.write(f"| {name[:3].upper()} | {name} | {s:.2f} | {d:.2f} | {g:.2f} |\n")
    f.write(f"\nInserted beats: {INSERTS}\n\nTotal: {len(y)/SR:.2f} s, {len(words)} words.\n")
print(f"narration_v1: {len(y)/SR:.2f}s, {len(words)} words")
for r in rows:
    print(f"  {r[0]}  start {r[1]:7.2f}  len {r[2]:6.2f}")
