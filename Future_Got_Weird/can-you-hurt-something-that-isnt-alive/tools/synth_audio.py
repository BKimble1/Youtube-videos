"""In-house sound design for Can You Hurt Something That Isn't Alive?

Replaces Runway audio outputs, which could not be downloaded from this sandbox (network policy).
Deterministic: fixed random seed, so a rebuild gives the same files.
Writes effects to source/public/audio/sfx/*.mp3 and the music bed to source/public/audio/music_bed.mp3.
Usage: python3 tools/synth_audio.py
"""
import os, subprocess
import numpy as np

SR = 44100
rng = np.random.default_rng(20261010)
OUT = os.path.join(os.path.dirname(__file__), "..", "source", "public", "audio")
os.makedirs(os.path.join(OUT, "sfx"), exist_ok=True)

def env_exp(n, k):
    return np.exp(-np.arange(n) / SR * k)

def noise(n):
    return rng.standard_normal(n)

def lowpass(x, a):
    # one-pole lowpass; a is a scalar or a per-sample array in (0,1): higher = brighter
    a = np.broadcast_to(np.asarray(a, dtype=float), x.shape)
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a[i] * (v - acc); y[i] = acc
    return y

def sweep(f0, f1, dur, shape=None):
    n = int(dur * SR); t = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (shape if shape is not None else 1.0)

def write(name, x, peak=0.8):
    x = x / max(1e-9, np.max(np.abs(x))) * peak
    wav = os.path.join(OUT, "sfx", name + ".wav")
    import wave
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "192k", os.path.join(OUT, "sfx", name + ".mp3")], check=True)
    os.remove(wav)

# 1. paper peel: rising filtered noise, one long pull
n = int(3.0 * SR); t = np.arange(n) / SR
pull = lowpass(noise(n), 0.08 + 0.25 * t / 3.0)
write("peel", pull * (np.sin(np.pi * np.clip(t / 3.0, 0, 1)) ** 0.7) * 0.9)

# 2. game hit: thud + boing + stagger wobble
n = int(2.0 * SR); t = np.arange(n) / SR
thud = sweep(120, 40, 2.0)[:n] * env_exp(n, 22)
click = lowpass(noise(n), 0.5) * env_exp(n, 90) * 0.6
boing = np.zeros(n); seg = sweep(600, 300, 0.5)
boing[int(0.25 * SR):int(0.25 * SR) + len(seg)] = seg[:n - int(0.25 * SR)] * env_exp(len(seg[:n - int(0.25 * SR)]), 6) * 0.5
write("game_hit", thud * 0.9 + click + boing)

# 3. stamp: low thump + dry click
n = int(0.9 * SR); t = np.arange(n) / SR
write("stamp", np.sin(2 * np.pi * 85 * t) * env_exp(n, 9) * 1.0 + lowpass(noise(n), 0.6) * env_exp(n, 60) * 0.7)

# 4. printer: whirr, then clicks along a short print cycle
n = int(3.0 * SR); t = np.arange(n) / SR
whirr = lowpass(noise(n), 0.02) * (0.25 + 0.25 * np.sin(2 * np.pi * 9 * t) ** 2) * np.clip(t / 0.5, 0, 1)
clicks = np.zeros(n)
for k, start in enumerate(np.arange(1.0, 2.8, 0.09)):
    i = int(start * SR); m = min(600, n - i)
    clicks[i:i + m] += lowpass(noise(m), 0.7) * env_exp(m, 120) * (0.5 + 0.2 * (k % 2))
write("printer", whirr * 0.7 + clicks * 0.8)

# 5. chat swap: whoosh out, click in
n = int(2.0 * SR); t = np.arange(n) / SR
whoosh = lowpass(noise(n), 0.06 + 0.1 * np.sin(np.pi * t / 2.0)) * np.sin(np.pi * np.clip(t / 1.4, 0, 1)) ** 1.5
click = np.zeros(n); i = int(1.55 * SR); click[i:i + 500] = np.sin(2 * np.pi * 1800 * np.arange(500) / SR) * env_exp(500, 60)
write("chat_swap", whoosh * 0.9 + click * 0.8)

# 6. boing: up then down
n = int(1.0 * SR); t = np.arange(n) / SR
f = 300 + 400 * np.sin(np.pi * np.clip(t / 0.6, 0, 1)) - 150 * t
write("boing", np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 4.5))

# 7. music bed: sparse pentatonic plucks over a soft bass pulse, lift near the end
DUR = 268.0  # narration plus end screen
N = int(DUR * SR); mix = np.zeros(N)
bpm = 96.0; beat = 60.0 / bpm
def pluck(freq, dur=1.6, amp=0.22):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * 2 * freq * t) * env_exp(n, 3)) * env_exp(n, 4.2) * amp
def bass(freq, dur=0.9, amp=0.12):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * np.minimum(1, t / 0.02) * env_exp(n, 3.5) * amp
def add(buf, start, sig):
    i = int(start * SR)
    if i >= len(buf): return
    m = min(len(sig), len(buf) - i); buf[i:i + m] += sig[:m]
chords = [
    [261.6, 329.6, 392.0, 493.9],   # C
    [220.0, 261.6, 329.6, 392.0],   # Am
    [174.6, 220.0, 261.6, 329.6],   # F
    [196.0, 246.9, 293.7, 392.0],   # G
]
bass_roots = [65.4, 55.0, 43.7, 49.0]
bars = int(DUR / (4 * beat)) + 1
for b in range(bars):
    t0 = b * 4 * beat
    chord = chords[b % 4]
    tnorm = t0 / DUR
    density = 0.35 if t0 < 10 or t0 > DUR - 25 else 0.6   # keep the middle sparse; lift at the end
    lift = 1.0 + 0.6 * max(0.0, (t0 - (DUR - 30)) / 30.0)
    for beat_i in range(4):
        tb = t0 + beat_i * beat
        if rng.random() < density:
            note = chord[int(rng.integers(0, len(chord)))] * (2 if rng.random() < 0.25 else 1)
            add(mix, tb, pluck(note, amp=0.16 * lift))
    add(mix, t0, bass(bass_roots[b % 4], amp=0.10 * lift))
    add(mix, t0 + 2 * beat, bass(bass_roots[b % 4], amp=0.08 * lift))
    for beat_i in range(8):   # quiet shaker on eighths
        tb = t0 + beat_i * beat / 2
        add(mix, tb, lowpass(noise(int(0.05 * SR)), 0.9) * env_exp(int(0.05 * SR), 60) * 0.02)
fade_in = np.clip(np.arange(N) / (2.0 * SR), 0, 1); fade_out = np.clip((N - np.arange(N)) / (5.0 * SR), 0, 1)
mix = mix * fade_in * fade_out
mix = mix / max(1e-9, np.max(np.abs(mix))) * 0.5
import wave
wav = os.path.join(OUT, "music_bed.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "192k", os.path.join(OUT, "music_bed.mp3")], check=True)
os.remove(wav)
print("audio written")
