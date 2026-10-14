"""V2 final mix: narration leads, the score and the ambience beds duck under speech, effects land on the animation's cues.

Inputs
  audio/v2/narration/narration_v2.wav          locked V2 narration (Test Voice)
  source/public/v2/audio/music_v2.wav          tools/v2/synth_audio_v2.py
  source/public/v2/audio/sfx/*.wav             tools/v2/prep_sfx_v2.py (new ElevenLabs takes) + synth_audio_v2.py
  source/public/audio/sfx/*.wav                V1 effects reused (tools/prep_sfx.py + tools/synth_audio.py)
  audio/v2/sfx_cues_v2.json                    tools/v2/collect_sfx_v2.mjs (cue times from the same cues as the shots)
  audio/v2/sfx_leads_v2.json, audio/sfx_leads.json   per-kind lead so a transient's hit lands on its cue
Outputs
  audio/v2/mix/mix_v2.wav, source/public/v2/audio/mix_v2.mp3, stems audio/v2/mix/stem_{narration,music,sfx,beds}.wav
Targets: about -15 LUFS integrated, true peak <= -1.5 dBTP (ffmpeg loudnorm, two passes), measured afterwards.
Usage: python3 tools/v2/mix_audio_v2.py
"""
import json, os, re, subprocess, wave

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
PUB2 = os.path.join(ROOT, "source", "public", "v2", "audio")
PUB1 = os.path.join(ROOT, "source", "public", "audio")
MIX = os.path.join(ROOT, "audio", "v2", "mix")
SR = 48000
os.makedirs(MIX, exist_ok=True)

LEVEL = {
    # beds (ducked under speech)
    "furnace_roar": -21, "amb_room": -33, "amb_sim": -31, "sizzle": -17,
    # impacts and machines
    "molten_heavy": -5, "sub_boom": -9, "robot_push": -12, "servo_whir": -20, "step_grate": -13, "robot_step": -15,
    "shutter_slam": -12, "padlock": -9, "crane_chain": -17, "elec_arc": -11, "airbag": -9, "sim_fall": -11, "knee_tap": -11,
    # paper, UI and transitions
    "paper_slide": -17, "card_flick": -16, "pop_tick": -20, "tag_clink": -13, "stamp": -9, "clapper": -7, "map_pin": -14,
    "buzz_no": -17, "ding_yes": -17, "sim_blip": -20, "slider_tick": -21, "static": -17, "whoosh_soft": -20, "rewind": -15,
    "typing": -16, "trace": -16, "sting_end": -10,
}
BEDS = {"furnace_roar", "amb_room", "amb_sim"}
SUSTAIN = BEDS | {"sizzle"}
MUSIC_DB = -3.0     # score level before ducking (the score peaks at -6 dBFS)
DUCK_DB = -9.0      # extra score reduction while the narrator speaks
BED_DUCK_DB = -5.0  # ambience reduction while the narrator speaks


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


def sfx_path(kind):
    for d in (os.path.join(PUB2, "sfx"), os.path.join(PUB1, "sfx")):
        p = os.path.join(d, f"{kind}.wav")
        if os.path.exists(p):
            return p
    raise FileNotFoundError(kind)


cues = json.load(open(os.path.join(ROOT, "audio", "v2", "sfx_cues_v2.json")))
leads = {**json.load(open(os.path.join(ROOT, "audio", "sfx_leads.json"))), **json.load(open(os.path.join(ROOT, "audio", "v2", "sfx_leads_v2.json")))}
total = cues["totalFrames"] / cues["fps"]
N = int(round(total * SR))

narr = load(os.path.join(ROOT, "audio", "v2", "narration", "narration_v2.wav"))
narr = np.pad(narr, (0, max(0, N - len(narr))))[:N]
music = load(os.path.join(PUB2, "music_v2.wav"), 2)
music = np.pad(music, ((0, max(0, N - len(music))), (0, 0)))[:N]

# speech envelope (fast attack, slow release) drives the ducking
win = int(0.03 * SR)
rms = np.sqrt(np.convolve(narr ** 2, np.ones(win) / win, mode="same"))
speech = (rms > db(-42)).astype(np.float64)
dec = 48
sp = speech[::dec]; env = np.empty(len(sp)); acc = 0.0
a_att, a_rel = 1 - np.exp(-dec / (0.04 * SR)), 1 - np.exp(-dec / (0.45 * SR))
for i, v in enumerate(sp):
    acc += (v - acc) * (a_att if v > acc else a_rel); env[i] = acc
g = np.interp(np.arange(N), np.arange(len(sp)) * dec, env)
music_ducked = music * (db(MUSIC_DB) * db(DUCK_DB * g))[:, None]

fx = np.zeros((N, 2))
beds = np.zeros((N, 2))
cache = {}
step_i = 0
for c in cues["cues"]:
    kind = c["kind"]
    file_kind = kind
    if kind == "step_grate":
        file_kind = "step_grate_b" if step_i % 2 else "step_grate"
        step_i += 1
    if file_kind not in cache:
        cache[file_kind] = load(sfx_path(file_kind))
    x = cache[file_kind]
    p = c.get("pitch", 0)
    if p:
        r = 2 ** (p / 12)
        x = np.interp(np.arange(0, len(x) - 1, r), np.arange(len(x)), x)
    if kind in SUSTAIN and c.get("dur"):
        want = int(c["dur"] * SR)
        if kind != "sizzle":
            x = np.tile(x, int(np.ceil(want / len(x))) + 1)
        x = x[:want].copy()
        fi, fo = min(len(x) // 3, int(0.35 * SR)), min(len(x) // 3, int(0.6 * SR))
        x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo)
    t0 = c["t"] - leads.get(file_kind, leads.get(kind, 0.0))
    i = max(0, int(t0 * SR))
    m = min(len(x), N - i)
    if m <= 0:
        continue
    gain = db(LEVEL[kind] + c.get("gain", 0))
    pan = {"robot_step": -0.15, "step_grate": -0.1, "card_flick": 0.15, "pop_tick": 0.1}.get(kind, 0.0)
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    dst = beds if kind in BEDS else fx
    dst[i:i + m, 0] += x[:m] * gain * l
    dst[i:i + m, 1] += x[:m] * gain * r
beds *= db(BED_DUCK_DB * g)[:, None]

voice = np.stack([narr, narr], axis=1)
pre = voice + music_ducked + fx + beds
for name, s in (("narration", voice), ("music", music_ducked), ("sfx", fx), ("beds", beds)):
    write(os.path.join(MIX, f"stem_{name}.wav"), s)
pre_path = os.path.join(MIX, "premaster_v2.wav")
write(pre_path, pre / max(1.0, np.max(np.abs(pre)) / 0.98))

first = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", pre_path, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
meas = json.loads(re.search(r"\{[^{}]*\}", first[first.rfind("Parsed_loudnorm"):], re.S).group(0))
af = (f"loudnorm=I=-15:TP=-1.5:LRA=11:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:measured_LRA={meas['input_lra']}"
      f":measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}:linear=true,aresample=48000")
mix_wav = os.path.join(MIX, "mix_v2.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre_path, "-af", af, "-ar", "48000", "-c:a", "pcm_s16le", mix_wav], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mix_wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(PUB2, "mix_v2.mp3")], check=True)
check = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", mix_wav, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
summ = check[check.rfind("Summary:"):]
I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
LRA = float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1))
TP = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
print(f"mix_v2: {N / SR:.2f} s  integrated {I} LUFS  true peak {TP} dBTP  LRA {LRA} LU  ({len(cues['cues'])} cues)")
json.dump({"integrated_lufs": I, "true_peak_dbtp": TP, "lra_lu": LRA, "duration_s": N / SR, "cues": len(cues["cues"]), "loudnorm_first_pass": meas},
          open(os.path.join(MIX, "mix_v2_measure.json"), "w"), indent=1)
