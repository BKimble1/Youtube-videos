"""Choose and prepare sound-effect takes (objective rules; nothing was auditioned — this environment cannot play audio).

For each kind in audio/sfx_raw (ElevenLabs takes *_v1/_v2, longer re-runs *_L_v1/_L_v2):
  - transient kinds: the take whose largest onset is most dominant (peak onset / median onset), trimmed to start 30 ms
    before that onset ("lead" recorded so the mixer can land the hit exactly on its cue frame)
  - bed / loop kinds: the take with the steadiest short-term level (lowest std of 400 ms RMS in dB) and no isolated spike
  - sweep/texture kinds: the longest take with the highest median level
All outputs: 48 kHz, mono (beds stereo), peak-normalised to -3 dBFS, 5 ms fade-in / 40 ms fade-out (beds keep loop
points). Writes audio/sfx/<kind>.wav and audio/sfx/choices.json; summary in audio/SFX_CHOICES.md.
Also adds reused channel effects from the robots episode (ElevenLabs takes made for the channel) and a few synthesised
tones (tinnitus ring, servo chirp, projector beep).
"""
import glob, json, os, re, shutil

import librosa
import numpy as np
import soundfile as sf

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RAW = os.path.join(ROOT, "audio", "sfx_raw")
OUT = os.path.join(ROOT, "audio", "sfx")
os.makedirs(OUT, exist_ok=True)
SR = 48000
BEDS = {"fire_bed", "city_bed", "refuge_bed", "drone_rotor", "steam_vent", "breath_ragged"}
SWEEPS = {"cable_strain", "gate_roll", "shutter_close", "glass_door", "radio_on", "crane_trolley", "steps_gravel", "breath_exert", "servo_heavy", "gantry_collapse", "debris_rain", "hydraulic", "sparks"}


def load(p, mono=True):
    y, sr = librosa.load(p, sr=SR, mono=mono)
    return y


def norm(y, db=-3.0):
    pk = np.max(np.abs(y)) + 1e-9
    return y * (10 ** (db / 20) / pk)


def fades(y, fi=0.005, fo=0.04):
    n = len(y) if y.ndim == 1 else y.shape[-1]
    a, b = int(fi * SR), int(fo * SR)
    g = np.ones(n)
    g[:a] = np.linspace(0, 1, a)
    g[n - b:] *= np.linspace(1, 0, b)
    return y * g


kinds = {}
for p in sorted(glob.glob(os.path.join(RAW, "*.mp3"))):
    m = re.match(r"(.+?)(_L)?_v(\d)\.mp3$", os.path.basename(p))
    kinds.setdefault(m.group(1), []).append(p)

choices = {}
for kind, files in sorted(kinds.items()):
    best, best_score, info = None, -1e9, {}
    for p in files:
        y = load(p)
        dur = len(y) / SR
        if kind in BEDS:
            if dur < 4:
                continue
            r = librosa.feature.rms(y=y, frame_length=int(0.4 * SR), hop_length=int(0.1 * SR))[0]
            db = 20 * np.log10(r + 1e-6)
            score = -np.std(db) - 0.5 * max(0, (np.max(db) - np.median(db)) - 6) + 0.05 * dur
            meta = {"steadiness_std_db": round(float(np.std(db)), 2)}
        elif kind in SWEEPS:
            r = librosa.feature.rms(y=y, hop_length=512)[0]
            score = dur * 0.6 + float(np.median(20 * np.log10(r + 1e-6))) * 0.05
            meta = {}
        else:
            o = librosa.onset.onset_strength(y=y, sr=SR, hop_length=256)
            score = float(np.max(o) / (np.median(o) + 1e-6)) + min(dur, 3) * 0.3
            meta = {"onset_dominance": round(float(np.max(o) / (np.median(o) + 1e-6)), 1)}
        if score > best_score:
            best, best_score, info = p, score, {"duration_s": round(dur, 2), **meta}
    if best is None:
        best = max(files, key=lambda q: len(load(q)))
        info = {"note": "longest (no take met the bed length rule)"}
    if kind in BEDS:
        y = load(best, mono=False)
        if y.ndim == 1:
            y = np.stack([y, y])
        y = norm(y)
        sf.write(os.path.join(OUT, f"{kind}.wav"), y.T.astype(np.float32), SR, subtype="FLOAT")
        lead = 0.0
    else:
        y = load(best)
        o = librosa.onset.onset_strength(y=y, sr=SR, hop_length=256)
        if kind in SWEEPS:
            # trim leading silence only
            env = np.abs(y)
            thr = 0.02 * env.max()
            i0 = int(np.argmax(env > thr))
            st = max(0, i0 - int(0.01 * SR))
            lead = (i0 - st) / SR
        else:
            k = int(np.argmax(o))
            t_hit = k * 256 / SR
            st = max(0, int((t_hit - 0.03) * SR))
            lead = t_hit - st / SR
        y = fades(norm(y[st:]))
        sf.write(os.path.join(OUT, f"{kind}.wav"), y.astype(np.float32), SR, subtype="FLOAT")
    choices[kind] = {"take": os.path.basename(best), "lead_s": round(float(lead), 3), **info}

# reused channel effects (robots episode; ElevenLabs takes generated for the channel / in-house synthesis)
REUSE = os.path.join(ROOT, "..", "they-trained-robots-to-destroy-themselves", "source", "public")
for kind, rel in {"shutter_slam": "v2/audio/sfx/shutter_slam.wav", "crane_chain": "v2/audio/sfx/crane_chain.wav", "elec_arc": "v2/audio/sfx/elec_arc.wav",
                  "step_grate": "v2/audio/sfx/step_grate.wav", "step_grate_b": "v2/audio/sfx/step_grate_b.wav", "sub_boom": "v2/audio/sfx/sub_boom.wav",
                  "servo_whir": "audio/sfx/servo_whir.wav", "static": "audio/sfx/static.wav", "robot_step": "audio/sfx/robot_step.wav", "padlock": "v2/audio/sfx/padlock.wav"}.items():
    src = os.path.join(REUSE, rel)
    if os.path.exists(src):
        y = load(src)
        sf.write(os.path.join(OUT, f"{kind}.wav"), norm(y).astype(np.float32), SR, subtype="FLOAT")
        choices[kind] = {"take": f"reused: they-trained-robots-to-destroy-themselves/source/public/{rel}", "lead_s": 0.05}

# synthesised tones
t = np.arange(int(3.5 * SR)) / SR
ring = 0.5 * np.sin(2 * np.pi * 3950 * t) * np.exp(-t / 1.4) + 0.15 * np.sin(2 * np.pi * 7900 * t) * np.exp(-t / 0.9)
ring *= np.minimum(1, t / 0.05)
sf.write(os.path.join(OUT, "tinnitus.wav"), norm(ring, -6).astype(np.float32), SR, subtype="FLOAT")
choices["tinnitus"] = {"take": "synthesised (3.95 kHz ring, 1.4 s decay)", "lead_s": 0}
t = np.arange(int(0.35 * SR)) / SR
beep = np.sin(2 * np.pi * (1800 + 900 * t / 0.35) * t) * np.exp(-t / 0.12) * np.minimum(1, t / 0.004)
sf.write(os.path.join(OUT, "projector_beep.wav"), norm(beep, -9).astype(np.float32), SR, subtype="FLOAT")
choices["projector_beep"] = {"take": "synthesised (rising chirp)", "lead_s": 0}

json.dump(choices, open(os.path.join(OUT, "choices.json"), "w"), indent=1)
with open(os.path.join(ROOT, "audio", "SFX_CHOICES.md"), "w") as f:
    f.write("# Sound-effect take choices (objective rules, not auditioned)\n\nSource: ElevenLabs `eleven_text_to_sound_v2`, flow `z1if6RWnmC2gvHiGpM0u`, two takes per kind (prompts in `audio/sfx_raw/manifest.json`); reused channel effects and synthesised tones as noted. Rules in `tools/prep_sfx.py`.\n\n| Kind | Take used | Lead (s) | Notes |\n|---|---|---|---|\n")
    for k, v in sorted(choices.items()):
        extra = ", ".join(f"{a}={b}" for a, b in v.items() if a not in ("take", "lead_s"))
        f.write(f"| {k} | {v['take']} | {v['lead_s']} | {extra} |\n")
print(len(choices), "kinds")
