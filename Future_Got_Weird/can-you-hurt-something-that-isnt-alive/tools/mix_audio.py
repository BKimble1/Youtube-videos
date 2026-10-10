"""Final mix: narration leads, music ducks under speech, effects sit on measured cue times.

Writes source/public/audio/mix.mp3 (the only audio the picture uses) and the stems in audio/mix/.
Cue times are read from the narration word timings so effects follow the spoken words.
Usage: python3 tools/mix_audio.py
"""
import json, os, subprocess, re

HERE = os.path.dirname(__file__)
ROOT = os.path.join(HERE, "..")
PUB = os.path.join(ROOT, "source", "public", "audio")
NARR = os.path.join(PUB, "narration.mp3")
MUSIC = os.path.join(PUB, "music_bed.mp3")
WORDS = json.load(open(os.path.join(ROOT, "audio", "narration_words.json")))["words"]
WORDS = [w for w in WORDS if w.get("type", "word") == "word"]

def norm(s):
    return re.sub(r"[^a-z0-9']", "", s.replace("’", "'").lower())

def T(phrase, nth=1):
    want = [norm(x) for x in phrase.split()]
    seen = 0
    for i in range(len(WORDS) - len(want) + 1):
        if all(norm(WORDS[i + k]["text"]) == w for k, w in enumerate(want)):
            seen += 1
            if seen == nth:
                return WORDS[i]["start"]
    raise SystemExit(f"phrase not found: {phrase}")

# (sfx file, cue seconds, gain). Cues match the picture in source/src/scenes.
CUES = [
    ("peel", 0.5, 0.55),
    ("chat_swap", T("In August 2025") - 0.4, 0.45),
    ("game_hit", T("Picture a video game") + 1.5, 0.55),
    ("printer", T("This scene is illustrative"), 0.35),
    ("boing", T("That's the joke"), 0.45),
    ("stamp", T("Even this is hard"), 0.6),
    ("peel", T("So, can you hurt"), 0.55),
]
MUSIC_GAIN = 0.30
for c in CUES:
    print(f"{c[0]:10s} at {c[1]:7.2f}s  gain {c[2]}")

inputs = ["-i", NARR, "-i", MUSIC]
parts = ["[0:a]aresample=48000,volume=1.0[narr]",
         f"[1:a]aresample=48000,volume={MUSIC_GAIN}[mus]",
         "[narr]asplit=2[narr_sc][narr_mix]",
         "[mus][narr_sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=450:makeup=1[duck]"]
labels = ["[narr_mix]", "[duck]"]
for i, (name, t, g) in enumerate(CUES, start=2):
    inputs += ["-i", os.path.join(PUB, "sfx", name + ".mp3")]
    ms = int(round(t * 1000))
    parts.append(f"[{i}:a]aresample=48000,volume={g},adelay={ms}|{ms}[s{i}]")
    labels.append(f"[s{i}]")
parts.append("".join(labels) + f"amix=inputs={len(labels)}:duration=longest:normalize=0,alimiter=limit=0.89[pre]")
parts.append("[pre]loudnorm=I=-15:TP=-1.5:LRA=11[out]")
os.makedirs(os.path.join(ROOT, "audio", "mix"), exist_ok=True)
out_wav = os.path.join(ROOT, "audio", "mix", "mix_v1.wav")
cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(parts), "-map", "[out]", "-ac", "2", "-ar", "48000", out_wav]
subprocess.run(cmd, check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out_wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(PUB, "mix.mp3")], check=True)
print("mix written")
