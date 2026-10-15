"""Objective masking check for the V6 mix (no listening is possible here): in 50 ms windows where the narrator speaks,
report where effects + beds come within 6 dB of the voice (A-weighting is not applied; this is a conservative screen).
Usage: python3 tools/v6/speech_mask_v6.py   (reads audio/v6/mix/stem_*.wav) → audio/v6/mix/speech_mask_v6.txt
"""
import json, os, subprocess
import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
MIX = os.path.join(ROOT, "audio", "v6", "mix")
SR = 48000

def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0

v = load(os.path.join(MIX, "stem_narration.wav"))
fx = load(os.path.join(MIX, "stem_sfx.wav")) + load(os.path.join(MIX, "stem_beds.wav"))
mu = load(os.path.join(MIX, "stem_music.wav"))
W = int(0.05 * SR)
n = min(len(v), len(fx)) // W
def rms(x):
    return np.sqrt(np.mean(x[: n * W].reshape(n, W) ** 2, axis=1)) + 1e-9
rv, rf, rm = 20 * np.log10(rms(v)), 20 * np.log10(rms(fx)), 20 * np.log10(rms(mu))
speech = rv > -42
flag = speech & (rf > rv - 6)
cues = json.load(open(os.path.join(ROOT, "audio", "v6", "sfx_cues_v6.json")))["cues"]
lines = [f"speech windows: {int(speech.sum())}, flagged (fx+beds within 6 dB of voice): {int(flag.sum())}"]
i = 0
while i < n:
    if flag[i]:
        j = i
        while j + 1 < n and flag[j + 1]:
            j += 1
        t0, t1 = i * 0.05, (j + 1) * 0.05
        near = sorted({c["kind"] for c in cues if t0 - 0.6 <= c["t"] <= t1 + 0.1})
        lines.append(f"{t0:7.2f}-{t1:7.2f}s  voice {rv[i:j+1].mean():6.1f} dB  fx {rf[i:j+1].max():6.1f} dB  near: {', '.join(near)}")
        i = j + 1
    else:
        i += 1
open(os.path.join(MIX, "speech_mask_v6.txt"), "w").write("\n".join(lines) + "\n")
print("\n".join(lines[:60]))
