"""Final mix: narration leads, the music bed ducks under speech, effects land on the frames the animation uses.

Inputs
  audio/narration/narration_v1.wav     locked narration (Test Voice)
  source/public/audio/music_bed.wav    tools/synth_audio.py
  source/public/audio/sfx/*.wav        tools/prep_sfx.py (ElevenLabs takes) + tools/synth_audio.py (in-house)
  audio/sfx_cues.json                  tools/collect_sfx.mjs (cue frames exported from the Remotion scenes)
  audio/sfx_leads.json                 per-kind lead so a transient's hit lands on its cue frame
Outputs
  audio/mix/mix_v1.wav, source/public/audio/mix.mp3, stems audio/mix/stem_{narration,music,sfx}.wav
Targets: about -15 LUFS integrated, true peak <= -1.5 dBTP (ffmpeg loudnorm, two passes), measured afterwards.
Usage: python3 tools/mix_audio.py
"""
import json, os, re, subprocess, wave

import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..")
PUB = os.path.join(ROOT, "source", "public", "audio")
MIX = os.path.join(ROOT, "audio", "mix")
SR = 48000
os.makedirs(MIX, exist_ok=True)

# base level per kind, dB (the cue's own `gain` is added on top)
LEVEL = {
    "amb_foundry": -26, "amb_sim": -30, "robot_step": -15, "servo_whir": -20, "robot_push": -12, "molten_entry": -7,
    "sizzle": -18, "paper_slide": -17, "paper_swish": -18, "card_flick": -16, "pop_tick": -20, "tag_clink": -13,
    "marker_x": -15, "stamp": -9, "clapper": -7, "map_pin": -14, "buzz_no": -17, "ding_yes": -17, "sim_blip": -20,
    "sim_fall": -11, "counter_tick": -22, "slider_tick": -21, "knee_tap": -11, "airbag": -9, "static": -17,
    "whoosh_soft": -20, "sting_end": -12,
}
SUSTAIN = {"amb_foundry", "amb_sim", "sizzle", "counter_tick"}
MUSIC_DB = -6.0          # music bed level before ducking (bed itself peaks at -6 dBFS, about -21.5 LUFS)
DUCK_DB = -9.0           # extra reduction while the narrator speaks


def load(path, ch=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    return x.reshape(-1, ch) if ch > 1 else x


def write(path, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def db(v):
    return 10 ** (v / 20)


cues = json.load(open(os.path.join(ROOT, "audio", "sfx_cues.json")))
leads = json.load(open(os.path.join(ROOT, "audio", "sfx_leads.json")))
total = cues["totalFrames"] / cues["fps"]
N = int(total * SR)

narr = load(os.path.join(ROOT, "audio", "narration", "narration_v1.wav"))
narr = np.pad(narr, (0, max(0, N - len(narr))))[:N]
music = load(os.path.join(PUB, "music_bed.wav"), 2)
music = np.pad(music, ((0, max(0, N - len(music))), (0, 0)))[:N]

# ducking envelope from the narration (fast attack, slow release)
win = int(0.03 * SR)
rms = np.sqrt(np.convolve(narr ** 2, np.ones(win) / win, mode="same"))
speech = (rms > db(-42)).astype(np.float64)
k_att, k_rel = 1 - np.exp(-1 / (0.04 * SR)), 1 - np.exp(-1 / (0.45 * SR))
g = np.empty(N); acc = 0.0
# vectorised one-pole smoothing in blocks is fiddly; a plain loop over a decimated signal is quick enough
dec = 48
sp = speech[::dec]; out = np.empty(len(sp)); a_att, a_rel = 1 - np.exp(-dec / (0.04 * SR)), 1 - np.exp(-dec / (0.45 * SR))
for i, v in enumerate(sp):
    acc += (v - acc) * (a_att if v > acc else a_rel); out[i] = acc
g = np.interp(np.arange(N), np.arange(len(sp)) * dec, out)
duck = db(MUSIC_DB) * db(DUCK_DB * g)
music_ducked = music * duck[:, None]

# effects
fx = np.zeros((N, 2))
cache = {}
for c in cues["cues"]:
    kind = c["kind"]
    if kind not in cache:
        cache[kind] = load(os.path.join(PUB, "sfx", f"{kind}.wav"))
    x = cache[kind]
    p = c.get("pitch", 0)
    if p:
        r = 2 ** (p / 12)
        x = np.interp(np.arange(0, len(x) - 1, r), np.arange(len(x)), x)
    if kind in SUSTAIN and c.get("dur"):
        want = int(c["dur"] * SR)
        if kind != "sizzle":
            reps = int(np.ceil(want / len(x))) + 1
            x = np.tile(x, reps)
        x = x[:want].copy()
        fi, fo = min(len(x) // 3, int(0.4 * SR)), min(len(x) // 3, int(0.7 * SR))
        x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo)
    t0 = c["f"] / cues["fps"] - leads.get(kind, 0.0)
    i = max(0, int(t0 * SR))
    m = min(len(x), N - i)
    if m <= 0:
        continue
    gain = db(LEVEL[kind] + c.get("gain", 0))
    pan = {"robot_step": -0.15, "card_flick": 0.15, "pop_tick": 0.1}.get(kind, 0.0)
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    fx[i:i + m, 0] += x[:m] * gain * l
    fx[i:i + m, 1] += x[:m] * gain * r

voice = np.stack([narr, narr], axis=1)
pre = voice + music_ducked + fx
write(os.path.join(MIX, "stem_narration.wav"), voice)
write(os.path.join(MIX, "stem_music_ducked.wav"), music_ducked)
write(os.path.join(MIX, "stem_sfx.wav"), fx)
pre_path = os.path.join(MIX, "premaster.wav")
write(pre_path, pre / max(1.0, np.max(np.abs(pre)) / 0.98))

# two-pass loudnorm
first = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", pre_path, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
meas = json.loads(re.search(r"\{[^{}]*\}", first[first.rfind("Parsed_loudnorm"):], re.S).group(0))
af = (f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:measured_LRA={meas['input_lra']}"
      f":measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}:linear=true,aresample=48000")
mix_wav = os.path.join(MIX, "mix_v1.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre_path, "-af", af, "-ar", "48000", "-c:a", "pcm_s16le", mix_wav], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mix_wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(PUB, "mix.mp3")], check=True)
check = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", mix_wav, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
summ = check[check.rfind("Summary:"):]
I = re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1)
LRA = re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1)
TP = re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1)
print(f"mix_v1: {N / SR:.2f} s  integrated {I} LUFS  true peak {TP} dBTP  LRA {LRA} LU  ({len(cues['cues'])} cues)")
json.dump({"integrated_lufs": float(I), "true_peak_dbtp": float(TP), "lra_lu": float(LRA), "duration_s": N / SR, "cues": len(cues["cues"])}, open(os.path.join(MIX, "mix_v1_measure.json"), "w"), indent=1)
