"""Choose and trim the ElevenLabs sound-effect takes (audio/sfx_raw/<kind>_v1|v2.mp3).

No listening is possible in this environment, so the choice is objective: for one-shot sounds prefer the take whose
main transient arrives earliest and that is not near-silent; for sustained sounds prefer the longer take. Each choice
is trimmed to start just before its onset (so it lands on the cue frame), shortened to a per-kind maximum with a fade,
peak-normalised to -3 dBFS, and written to source/public/audio/sfx/<kind>.wav. A report goes to audio/sfx_choices.md.

Usage: python3 tools/prep_sfx.py
"""
import os, subprocess, wave

import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..")
RAW = os.path.join(ROOT, "audio", "sfx_raw")
OUT = os.path.join(ROOT, "source", "public", "audio", "sfx")
SR = 48000
os.makedirs(OUT, exist_ok=True)

# kind: (max seconds, sustained?)
KINDS = {
    "robot_step": (0.7, False), "servo_whir": (0.8, False), "robot_push": (0.9, False), "molten_entry": (2.6, False),
"paper_slide": (0.9, False), "paper_swish": (0.7, False), "card_flick": (0.5, False),
    "tag_clink": (1.2, False), "stamp": (0.9, False), "clapper": (0.8, False),
    "map_pin": (0.5, False), "sim_fall": (1.0, False), "knee_tap": (0.6, False), "airbag": (1.6, False),
    "static": (0.8, False), "whoosh_soft": (1.0, False),
}


def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0


def env(x, win=0.01):
    n = max(1, int(win * SR))
    return np.sqrt(np.convolve(x * x, np.ones(n) / n, mode="same"))


# Manual overrides after reading the measurements: the airbag landing should be a longer whump (take 2 is sustained;
# take 1's hit sits at the very end of its file and would be cut to 0.47 s). marker_x is synthesised instead (the only
# non-silent take has its stroke at the end of the file).
OVERRIDE = {"airbag": 2}
TRANSIENT = {"robot_step", "card_flick", "tag_clink", "marker_x", "stamp", "clapper", "map_pin", "sim_fall", "knee_tap", "static", "robot_push", "molten_entry", "airbag"}
PRE = 0.05  # transient kinds start this long before their main peak; the mixer places them PRE early


def stats(x):
    e = env(x)
    pk = float(np.max(np.abs(x))) + 1e-9
    thr = pk * 10 ** (-30 / 20)
    on = int(np.argmax(np.abs(x) > thr))
    dom = float(np.max(e) / (np.median(e) + 1e-6))
    return {"dur": len(x) / SR, "peak_db": 20 * np.log10(pk), "onset": on / SR, "peak_t": float(np.argmax(e)) / SR, "rms_db": 20 * np.log10(float(np.sqrt(np.mean(x * x))) + 1e-9), "dom": dom}


def write(path, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


rows = []
LEADS = {}
for kind, (mx, sustained) in KINDS.items():
    cands = []
    for v in (1, 2):
        p = os.path.join(RAW, f"{kind}_v{v}.mp3")
        if os.path.exists(p):
            x = load(p)
            cands.append((v, x, stats(x)))
    ok = [c for c in cands if c[2]["peak_db"] > -40] or cands
    if kind in OVERRIDE:
        best = [c for c in cands if c[0] == OVERRIDE[kind]][0]
        v, x, s = best
        start = max(0, int((s["onset"] - 0.01) * SR))
        lead = 0.0
    elif kind in TRANSIENT:
        # a take whose hit is not cut off by the end of the file; among those prefer an early hit when its dominance is
        # comparable (>= 25 % of the best), otherwise the most dominant single hit
        valid = [c for c in ok if c[2]["dur"] - c[2]["peak_t"] >= min(0.4, mx * 0.5)] or ok
        top = max(c[2]["dom"] for c in valid)
        early = [c for c in valid if c[2]["peak_t"] <= 1.0 and c[2]["dom"] >= 0.25 * top]
        best = max(early or valid, key=lambda c: c[2]["dom"])
        v, x, s = best
        start = max(0, int((s["peak_t"] - PRE) * SR))
        lead = min(PRE, s["peak_t"])
    else:
        # sweeps: the more compact take (main energy earliest)
        best = min(ok, key=lambda c: c[2]["peak_t"])
        v, x, s = best
        start = max(0, int((s["onset"] - 0.01) * SR))
        lead = 0.0
    LEADS[kind] = round(lead, 3)
    y = x[start:start + int(mx * SR)]
    fade = min(len(y), int(0.08 * SR))
    y[-fade:] *= np.linspace(1, 0, fade)
    y[: int(0.003 * SR)] *= np.linspace(0, 1, int(0.003 * SR))
    y = y / (np.max(np.abs(y)) + 1e-9) * 10 ** (-3 / 20)
    write(os.path.join(OUT, f"{kind}.wav"), y)
    rows.append((kind, v, s, [c[2] for c in cands], len(y) / SR))

import json
json.dump(LEADS, open(os.path.join(ROOT, "audio", "sfx_leads.json"), "w"), indent=1)
with open(os.path.join(ROOT, "audio", "sfx_choices.md"), "w") as f:
    f.write("# Sound-effect choices (objective, not auditioned)\n\nSource: ElevenLabs sound effects (`eleven_text_to_sound_v2`), flow `bMvBZzDdtEZz45PtXUpm`, two takes per kind.\n")
    f.write("Transient sounds: the take with the most dominant single hit, trimmed to start 50 ms before that hit (the mixer places it 50 ms early so the hit lands on the cue frame). Sweeps: the take whose energy peaks earliest, trimmed to its onset. All faded and peak-normalised to -3 dBFS. sizzle, ambiences, UI ticks and the music bed are synthesised in-house (tools/synth_audio.py).\n\n")
    f.write("| Kind | Take used | Onset (s) | Main peak (s) | Raw length (s) | Used length (s) |\n|---|---|---|---|---|---|\n")
    for kind, v, s, allst, L in rows:
        f.write(f"| {kind} | v{v} | {s['onset']:.2f} | {s['peak_t']:.2f} | {s['dur']:.2f} | {L:.2f} |\n")
for kind, v, s, allst, L in rows:
    print(f"{kind:13s} v{v}  peak {s['peak_t']:.2f} dom {s['dom']:.0f} pk {s['peak_db']:.0f}dB  used {L:.2f}s   (others: {[(round(a['peak_t'],2), round(a['dom'])) for a in allst]})")
