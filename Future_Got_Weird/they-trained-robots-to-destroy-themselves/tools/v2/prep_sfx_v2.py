"""Choose and trim the V2 ElevenLabs sound-effect takes (audio/v2/sfx_raw/<kind>_v1..v4.mp3).

No listening is possible in this environment, so choices are made from measurements (onset, main-peak time, crest,
transient count, how far the take has decayed by its end), printed by this script and recorded in
audio/v2/sfx_choices_v2.md. Each choice is trimmed so its main peak sits `pre` seconds after the start; the mixer
places the file that much early so the hit lands on its cue. V1 effects are reused unchanged from
source/public/audio/sfx/ (their leads are in audio/sfx_leads.json).

Writes source/public/v2/audio/sfx/<kind>.wav and audio/v2/sfx_leads_v2.json.
Usage: python3 tools/v2/prep_sfx_v2.py
"""
import json, os, subprocess, wave

import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
RAW = os.path.join(ROOT, "audio", "v2", "sfx_raw")
OUT = os.path.join(ROOT, "source", "public", "v2", "audio", "sfx")
SR = 48000
os.makedirs(OUT, exist_ok=True)

# kind: (take, max seconds, seconds kept before the main peak, why)
CHOICE = {
    "molten_heavy": (3, 3.0, 0.05, "3 s take: hit at 0.14 s, then the densest crackle (29 transients), fully decayed by the end"),
    "sub_boom": (1, 2.0, 0.05, "hit at 0.09 s with a 2 s tail; the 1 s takes stop before the tail decays"),
    "step_grate": (1, 0.6, 0.03, "hit at 0.03 s, decays to -78 dB; strongest of the clean single steps"),
    "step_grate_b": (2, 0.6, 0.03, "second clean step (hit at 0.08 s) used on alternate feet so steps do not repeat"),
    "padlock": (3, 0.6, 0.01, "instant click (peak at 0.01 s), highest crest factor (29.8 dB)"),
    "shutter_slam": (4, 2.0, 0.33, "3 s take whose slam (peak 0.33 s) follows the rattle; the 6 s take peaks at 2.97 s"),
    "crane_chain": (4, 2.0, 0.0, "2 s take with the most energy (-15.6 dB RMS) that decays by the end"),
    "elec_arc": (2, 1.0, 0.1, "loudest early burst (peak 0.28 s), decays to -63 dB"),
    "rewind": (2, 1.0, 0.0, "loudest take that decays to silence (-72 dB tail)"),
    "typing": (1, 1.6, 0.03, "most keystrokes (7 transients) of the two takes fetched"),
}


def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0


def env(x, win=0.01):
    n = max(1, int(win * SR))
    return np.sqrt(np.convolve(x * x, np.ones(n) / n, mode="same"))


def write(path, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


leads, rows = {}, []
for kind, (take, mx, pre, why) in CHOICE.items():
    src = kind.replace("_b", "") if kind.endswith("_b") else kind
    x = load(os.path.join(RAW, f"{src}_v{take}.mp3"))
    pk_t = float(np.argmax(env(x))) / SR
    start = max(0, int((pk_t - pre) * SR)) if pre > 0 else 0
    lead = pk_t - start / SR if pre > 0 else 0.0
    y = x[start:start + int(mx * SR)].copy()
    fade = min(len(y), int(0.12 * SR))
    y[-fade:] *= np.linspace(1, 0, fade)
    y[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    y = y / (np.max(np.abs(y)) + 1e-9) * 10 ** (-3 / 20)
    write(os.path.join(OUT, f"{kind}.wav"), y)
    leads[kind] = round(lead, 3)
    rows.append((kind, take, pk_t, lead, len(y) / SR, why))
    print(f"{kind:13s} v{take} peak {pk_t:.2f}s lead {lead:.3f}s used {len(y) / SR:.2f}s")

json.dump(leads, open(os.path.join(ROOT, "audio", "v2", "sfx_leads_v2.json"), "w"), indent=1)
gen = json.load(open(os.path.join(RAW, "generations.json")))
dl = json.load(open(os.path.join(RAW, "downloaded.json")))
with open(os.path.join(ROOT, "audio", "v2", "sfx_choices_v2.md"), "w") as f:
    f.write("# V2 sound-effect choices (objective, not auditioned)\n\n")
    f.write(f"Source: ElevenLabs sound effects (`{gen['model']}`), flow `{gen['flow_id']}`, four takes per kind requested (two typing takes fetched). ")
    f.write("Chosen from measurements, since no listening is possible in this environment. V1 effects are reused for steps, pushes, stamps, paper, clapper, airbag, static, UI ticks and the sting.\n\n")
    f.write("| Kind | Take | Generation ID | Main peak (s) | Lead (s) | Used (s) | Why |\n|---|---|---|---|---|---|---|\n")
    for kind, take, pk_t, lead, L, why in rows:
        src = kind.replace("_b", "") if kind.endswith("_b") else kind
        gid = dl.get(f"{src}_v{take}", {}).get("generation_id", "?")
        f.write(f"| {kind} | v{take} | `{gid}` | {pk_t:.2f} | {lead:.3f} | {L:.2f} | {why} |\n")
    f.write("\nThe four 1 s `furnace_roar` takes are not used directly; tools/v2/synth_audio_v2.py layers them as grains inside the synthesised furnace bed.\n")
