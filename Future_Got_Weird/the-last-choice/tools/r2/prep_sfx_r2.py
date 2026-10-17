"""R2: choose and prepare one sound-effect take per kind (objective rules; nothing was auditioned — this environment
cannot play audio). Adapted from tools/prep_sfx.py (R1).

Input: audio/r2/sfx_raw/<kind>_v<n>.mp3 (ElevenLabs eleven_text_to_sound_v2, flow NZsNryXtOG1YNHRfL1ls; prompts, ids and
credits in audio/r2/sfx_raw/manifest.json). libsndfile decodes the mp3s gaplessly, so each take has its exact nominal length.

Rules per category:
  - BEDS: the take with the steadiest short-term level (lowest std of 400 ms RMS in dB, penalising isolated spikes).
    Kept stereo. Every bed was generated with ElevenLabs' loop option, so the take is left whole: resampled circularly
    (the seam stays continuous) and given no fades, so it loops cleanly. lead_s = 0.
  - SWEEPS: the take with the highest median level (R1 rule; takes of a kind have equal length), leading silence trimmed
    (start 10 ms before the level first reaches 2 % of peak). lead_s = time of that first sound; for CLICK_FIRST kinds it
    is the first strong event (the switch click), as R1 did for radio_on.
  - TRANSIENTS (everything else): the take whose hit is most dominant, trimmed so the hit lands 30 ms in.
    Changes from R1, which picked argmax of librosa's log-mel onset strength:
      * file edges made neutral: 50 ms of silence before the take (a hit at sample 0 registers at 0) and a 10 ms fade
        plus silence after it (the hard cut at the end of a take otherwise reads as the strongest onset in the file);
      * each onset is weighted by the peak level just after it, relative to the file peak, so the hit is a loud attack
        and not a faint tail event (log-domain onset strength is level-blind);
      * the hit time is refined from the onset frame to where the 1 ms envelope first reaches half its local peak,
        removing librosa's framing offset (about 20-30 ms late);
      * if trimming to hit - 30 ms would cut loud material (at least 150 ms of sound within 12 dB of the file peak, e.g.
        a creak before a pop), only leading silence is trimmed and lead_s records where the hit is.
    onset_dominance = weighted onset strength at the hit / median onset strength of the take.
Outputs: 48 kHz float WAV, mono (beds stereo), peak-normalised to -3 dBFS; transients and sweeps get a 5 ms fade-in
(1 ms when the sound starts at the cut) and a 40 ms fade-out. Writes audio/r2/sfx/<kind>.wav,
audio/r2/sfx/choices.json (kind -> take, lead_s, duration_s, notes) and audio/R2_SFX_CHOICES.md.
Usage: python3 tools/r2/prep_sfx_r2.py
"""
import glob, json, os, re

import librosa
import numpy as np
import soundfile as sf

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
RAW = os.path.join(ROOT, "audio", "r2", "sfx_raw")
OUT = os.path.join(ROOT, "audio", "r2", "sfx")
os.makedirs(OUT, exist_ok=True)
SR = 48000
HOP = 256
PRE = 0.03  # transients: the hit lands this far into the file
BEDS = {"wind_ruins", "battle_far", "army_march", "drone_swarm", "ally_drone", "machine_hum", "run_rubble"}
SWEEPS = {"tower_collapse", "heavy_servo", "tether_reel", "breaker_charge", "flare_ignite", "smoke_canister", "projector_on",
          "rubble_shift", "cloth_move", "final_breath", "eyes_on", "drone_pass"}
CLICK_FIRST = {"projector_on"}  # sweeps whose cue point is the click at the start ("a projector clicking on")


def load(p, mono=True):
    y, sr = sf.read(p, always_2d=True)
    y = y.T.astype(np.float64)
    return (y.mean(0) if mono else y), sr


def resample(y, sr):
    return librosa.resample(y, orig_sr=sr, target_sr=SR, axis=-1)


def resample_loop(y, sr):
    """Resample a loop circularly (one copy either side) so the filter sees the wrap-around, keeping the seam smooth."""
    n = y.shape[-1]
    z = librosa.resample(np.concatenate([y, y, y], axis=-1), orig_sr=sr, target_sr=SR, axis=-1)
    m = int(round(n * SR / sr))
    return z[..., m:2 * m]


def norm(y, db=-3.0):
    return y * (10 ** (db / 20) / (np.max(np.abs(y)) + 1e-12))


def fades(y, fi=0.005, fo=0.04):
    n = y.shape[-1]
    a, b = int(fi * SR), int(fo * SR)
    g = np.ones(n)
    g[:a] = np.linspace(0, 1, a)
    g[n - b:] *= np.linspace(1, 0, b)
    return y * g


def bed_score(y):
    r = librosa.feature.rms(y=y, frame_length=int(0.4 * SR), hop_length=int(0.1 * SR))[0]
    db = 20 * np.log10(r + 1e-6)
    std = float(np.std(db))
    return -std - 0.5 * max(0, (np.max(db) - np.median(db)) - 6) + 0.05 * len(y) / SR, f"level std {std:.2f} dB"


def sweep_score(y):
    r = librosa.feature.rms(y=y, hop_length=512)[0]
    med = float(np.median(20 * np.log10(r + 1e-6)))
    return len(y) / SR * 0.6 + med * 0.05, f"median level {med:.1f} dB"


def find_hit(y):
    """Return (hit time in s, dominance) for a mono 48 kHz take."""
    pad = int(0.05 * SR)
    a = y.copy()
    nf = int(0.01 * SR)
    a[-nf:] *= np.linspace(1, 0, nf)
    a = np.concatenate([np.zeros(pad), a, np.zeros(pad)])
    o = librosa.onset.onset_strength(y=a, sr=SR, hop_length=HOP)
    t = np.arange(len(o)) * HOP / SR - pad / SR
    keep = (t >= 0) & (t < len(y) / SR)
    o, t = o[keep], t[keep]
    pk = np.max(np.abs(y)) + 1e-12
    w = np.array([np.max(np.abs(y[max(0, int((ti - 0.005) * SR)):int((ti + 0.06) * SR) + 1])) / pk for ti in t])
    k = int(np.argmax(o * w))
    dominance = float(o[k] * w[k] / (np.median(o) + 1e-6))
    # refine: first point in [t-20 ms, t+30 ms] where the 1 ms envelope crosses half the local peak
    blk = SR // 1000
    i0, i1 = max(0, int((t[k] - 0.02) * SR)), min(len(y), int((t[k] + 0.03) * SR))
    seg = np.abs(y[i0:i1])
    env = np.array([seg[j:j + blk].max() for j in range(0, len(seg) - blk + 1, blk)]) if len(seg) >= blk else np.array([])
    hit = t[k]
    if len(env):
        above = env >= 0.5 * env.max()
        j = int(np.argmax(above))
        if j > 0 or i0 == 0:  # a real crossing inside the window (or the take starts on the hit)
            hit = (i0 + j * blk) / SR
    return hit, dominance


kinds = {}
for p in sorted(glob.glob(os.path.join(RAW, "*.mp3"))):
    m = re.match(r"(.+)_v(\d+)\.mp3$", os.path.basename(p))
    kinds.setdefault(m.group(1), []).append(p)

choices = {}
for kind, files in sorted(kinds.items()):
    cat = "bed" if kind in BEDS else "sweep" if kind in SWEEPS else "transient"
    scored = []
    for p in files:
        y, sr = load(p)
        y = resample(y, sr)
        dur = len(y) / SR
        if cat == "bed":
            if dur < 4:
                continue
            score, desc = bed_score(y)
            extra = {}
        elif cat == "sweep":
            score, desc = sweep_score(y)
            extra = {}
        else:
            hit, dom = find_hit(y)
            score, desc = dom + min(dur, 3) * 0.3, f"onset dominance {dom:.1f}"
            extra = {"hit": hit}
        scored.append((score, p, desc, extra))
    if not scored:
        best = max(files, key=lambda q: sf.info(q).frames)
        scored = [(0, best, "longest (no take met the bed length rule)", {})]
    scored.sort(key=lambda s: -s[0])
    _, best, desc, extra = scored[0]
    take = os.path.basename(best)
    others = "; ".join(f"{os.path.basename(p).rsplit('.', 1)[0].split('_')[-1]}: {d}" for _, p, d, _ in scored[1:])
    raw_dur = sf.info(best).frames / sf.info(best).samplerate
    notes = [f"{cat}; {desc}" + (f" (vs {others})" if others else " (only take)")]

    if cat == "bed":
        y, sr = load(best, mono=False)
        if y.shape[0] == 1:
            y = np.concatenate([y, y])
        y = norm(resample_loop(y, sr))
        lead = 0.0
        notes.append("stereo, whole loop take, no fades")
    else:
        y, sr = load(best)
        y = resample(y, sr)
        env = np.abs(y)
        i_snd = int(np.argmax(env > 0.02 * env.max()))  # first sound (leading silence ends)
        if cat == "sweep":
            st = max(0, i_snd - int(0.01 * SR))
            lead = (i_snd - st) / SR
            if kind in CLICK_FIRST:
                lead = (int(np.argmax(env > 0.1 * env.max())) - st) / SR
                notes.append("lead = first strong event (switch click)")
        else:
            hit = extra["hit"]
            st_rule = max(0, int(round((hit - PRE) * SR)))
            pre = y[i_snd:st_rule]
            if len(pre) >= int(0.15 * SR) and np.max(np.abs(pre)) >= 10 ** (-12 / 20) * env.max():
                st = max(0, i_snd - int(0.01 * SR))
                notes.append(f"build-up kept: {(st_rule - st) / SR:.2f} s of loud sound before the hit (not cut)")
            else:
                st = st_rule
            lead = hit - st / SR
            notes.append(f"hit at {hit:.3f} s in the raw take")
        if st > 0:
            notes.append(f"trimmed {st / SR:.3f} s from start")
        y = y[st:]
        y = fades(norm(y), fi=0.005 if lead >= 0.01 else 0.001)
    data = y.T if y.ndim == 2 else y
    sf.write(os.path.join(OUT, f"{kind}.wav"), data.astype(np.float32), SR, subtype="FLOAT")
    out_dur = y.shape[-1] / SR
    choices[kind] = {"take": take, "lead_s": round(float(lead), 3), "duration_s": round(out_dur, 3),
                     "notes": "; ".join(notes) + f"; raw take {raw_dur:.2f} s"}

with open(os.path.join(OUT, "choices.json"), "w") as f:
    json.dump(choices, f, indent=1)
with open(os.path.join(ROOT, "audio", "R2_SFX_CHOICES.md"), "w") as f:
    f.write("# R2 sound-effect take choices (objective rules, not auditioned)\n\n"
            "Source: ElevenLabs `eleven_text_to_sound_v2`, flow `NZsNryXtOG1YNHRfL1ls` (raw takes and prompts in "
            "`audio/r2/sfx_raw/`, `manifest.json`). Prepared files: `audio/r2/sfx/<kind>.wav`, 48 kHz float, -3 dBFS peak. "
            "Rules in `tools/r2/prep_sfx_r2.py`. Lead = seconds from file start to the sync point (hit / first sound).\n\n"
            "| Kind | Category | Take | Duration (s) | Lead (s) |\n|---|---|---|---|---|\n")
    for k, v in sorted(choices.items()):
        cat = v["notes"].split(";")[0]
        f.write(f"| {k} | {cat} | {v['take']} | {v['duration_s']} | {v['lead_s']} |\n")
    kept = [k for k, v in sorted(choices.items()) if "build-up kept" in v["notes"]]
    if kept:
        f.write("\nTransients whose loud build-up was kept rather than cut at hit - 30 ms (place them by their lead): "
                + ", ".join(f"`{k}`" for k in kept) + ".\n")
print(len(choices), "kinds")
for k, v in sorted(choices.items()):
    print(f"{k:18s} {v['take']:24s} dur {v['duration_s']:6.3f} lead {v['lead_s']:6.3f}  {v['notes']}")
