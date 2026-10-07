#!/usr/bin/env python3
"""Build the single source of timing truth for the video.

Inputs
  script/narration_segments.json   segment ids, scene ids, text, pause_after_ms
  script/cues.json                 named animation cues anchored to words in segments
  audio/narration/<engine>/manifest.json   measured segment WAVs (+ optional word timings)

Outputs
  source/public/audio/narration.wav       concatenated narration stem (48 kHz mono)
  source/src/data/timeline.json           frames for scenes, segments, words and cues
  audio/narration/narration_<engine>.wav  copy of the stem for delivery
  script/subtitles_<engine>.srt           subtitles from the measured word timings

Usage
  python3 tools/build_timeline.py --engine draft_local
  python3 tools/build_timeline.py --engine elevenlabs
"""
import argparse
import json
import math
import os
import re
import shutil
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
SR = 48000
LEAD_IN_S = 0.45      # silence before the first word
TAIL_S = 3.6          # time after the last word (end card + music tail)
SCENE_LEAD_S = 0.35   # a scene's visuals start this long before its first word


def load_json(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def norm_word(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def estimate_words(text, dur):
    """Fallback word timing: distribute duration by character weight (punctuation adds pause weight)."""
    toks = text.split()
    weights = []
    for t in toks:
        w = len(re.sub(r"[^\w]", "", t)) + 1.5
        if re.search(r"[,;:]$", t):
            w += 3
        if re.search(r"[.?!]['\"’”]?$", t):
            w += 5
        weights.append(w)
    total = sum(weights) or 1.0
    usable = dur * 0.97
    out, t0 = [], dur * 0.015
    for tok, w in zip(toks, weights):
        d = usable * w / total
        out.append({"word": tok, "start": t0, "end": t0 + d * 0.85})
        t0 += d
    return out


def srt_time(s):
    ms = int(round(s * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


def build_srt(segments, max_chars=84, max_dur=5.5):
    """Phrase-level cues from word timings, splitting at punctuation / length limits."""
    cues = []
    for seg in segments:
        words = seg["words_abs"]
        cur = []
        for i, w in enumerate(words):
            cur.append(w)
            text = " ".join(x["word"] for x in cur)
            end_punct = re.search(r"[.?!:;,]['\"’”]?$", w["word"]) is not None
            strong = re.search(r"[.?!]['\"’”]?$", w["word"]) is not None
            last = i == len(words) - 1
            too_long = len(text) > max_chars - 12 or (cur[-1]["end"] - cur[0]["start"]) > max_dur
            if last or strong or (end_punct and len(text) > 28) or too_long:
                cues.append((cur[0]["start"], cur[-1]["end"], text))
                cur = []
    # enforce min duration and no overlap
    fixed = []
    for i, (a, b, t) in enumerate(cues):
        b = max(b, a + 0.9)
        if i + 1 < len(cues):
            b = min(b, cues[i + 1][0] - 0.02)
        fixed.append((a, b, t))
    lines = []
    for i, (a, b, t) in enumerate(fixed, 1):
        # wrap to two lines of <= 42 chars where possible
        if len(t) > 42:
            words = t.split()
            best, best_score = None, 1e9
            for k in range(1, len(words)):
                l1, l2 = " ".join(words[:k]), " ".join(words[k:])
                score = abs(len(l1) - len(l2)) + (100 if max(len(l1), len(l2)) > 42 else 0)
                if score < best_score:
                    best, best_score = (l1, l2), score
            t = best[0] + "\n" + best[1]
        lines.append(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{t}\n")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", default="draft_local", help="folder under audio/narration/")
    args = ap.parse_args()

    segs_doc = load_json(os.path.join(ROOT, "script/narration_segments.json"))
    cues_doc = load_json(os.path.join(ROOT, "script/cues.json"))
    man_path = os.path.join(ROOT, "audio/narration", args.engine, "manifest.json")
    manifest = load_json(man_path)
    by_id = {s["id"]: s for s in manifest["segments"]}

    pieces = [np.zeros(int(LEAD_IN_S * SR), dtype=np.float32)]
    t = LEAD_IN_S
    out_segments = []
    for seg in segs_doc["segments"]:
        m = by_id.get(seg["id"])
        if m is None:
            sys.exit(f"Segment {seg['id']} missing from {man_path}")
        wav_path = os.path.join(os.path.dirname(man_path), os.path.basename(m["file"]))
        audio, sr = sf.read(wav_path, dtype="float32", always_2d=True)
        audio = audio.mean(axis=1)
        if sr != SR:
            sys.exit(f"{wav_path}: expected {SR} Hz, got {sr}")
        dur = len(audio) / SR
        words = None
        wf = m.get("words_file")
        if wf:
            wpath = os.path.join(os.path.dirname(man_path), os.path.basename(wf))
            if os.path.exists(wpath):
                words = load_json(wpath)
                if isinstance(words, dict):
                    words = words.get("words", [])
        timing_source = "engine"
        if not words:
            words = estimate_words(seg["text"], dur)
            timing_source = "estimated"
        # Map engine words onto display words of seg["text"] (tts_text may use respellings)
        disp = seg["text"].split()
        if len(words) != len(disp):
            # fall back: proportional mapping of display words onto the engine's speech span
            span0 = words[0]["start"] if words else 0.0
            span1 = words[-1]["end"] if words else dur
            est = estimate_words(seg["text"], span1 - span0)
            words = [{"word": w["word"], "start": w["start"] + span0, "end": w["end"] + span0} for w in est]
            timing_source += "+remapped"
        else:
            words = [{"word": d, "start": w["start"], "end": w["end"]} for d, w in zip(disp, words)]
        words_abs = [{"word": w["word"], "start": t + w["start"], "end": t + w["end"]} for w in words]
        pieces.append(audio)
        pause = seg.get("pause_after_ms", 250) / 1000.0
        pieces.append(np.zeros(int(round(pause * SR)), dtype=np.float32))
        out_segments.append({
            "id": seg["id"],
            "scene": seg["scene"],
            "text": seg["text"],
            "start": t,
            "end": t + dur,
            "timing": timing_source,
            "words_abs": words_abs,
        })
        t += dur + pause

    total_s = t + TAIL_S
    pieces.append(np.zeros(int(TAIL_S * SR), dtype=np.float32))
    narration = np.concatenate(pieces)

    # Scenes: start SCENE_LEAD_S before the first word of their first segment; first scene starts at 0.
    scene_ids = []
    for s in out_segments:
        if s["scene"] not in scene_ids:
            scene_ids.append(s["scene"])
    scenes = []
    for i, sid in enumerate(scene_ids):
        first = next(s for s in out_segments if s["scene"] == sid)
        start = 0.0 if i == 0 else max(0.0, first["start"] - SCENE_LEAD_S)
        scenes.append({"id": sid, "start": start})
    for i, sc in enumerate(scenes):
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else total_s

    def f(x):
        return int(round(x * FPS))

    # Cues
    seg_by_id = {s["id"]: s for s in out_segments}
    cue_frames = {}
    problems = []
    for c in cues_doc["cues"]:
        s = seg_by_id.get(c["segment"])
        if s is None:
            problems.append(f"cue {c['name']}: unknown segment {c['segment']}")
            continue
        at = c.get("at", "word")
        if at == "start":
            tt = s["start"]
        elif at == "end":
            tt = s["end"]
        else:
            target = norm_word(c["word"])
            occ = c.get("occurrence", 1)
            hits = [w for w in s["words_abs"] if norm_word(w["word"]) == target]
            if len(hits) < occ:
                problems.append(f"cue {c['name']}: word '{c['word']}' (#{occ}) not in {c['segment']}")
                tt = s["start"]
            else:
                w = hits[occ - 1]
                tt = w["end"] if c.get("edge") == "end" else w["start"]
        tt += c.get("offset_ms", 0) / 1000.0
        cue_frames[c["name"]] = f(tt)

    timeline = {
        "fps": FPS,
        "engine": args.engine,
        "voice": {k: manifest.get(k) for k in ("engine", "model", "voice", "voice_name", "voice_id", "speed", "license") if k in manifest},
        "durationInFrames": f(total_s),
        "durationSeconds": round(total_s, 3),
        "scenes": [{"id": s["id"], "from": f(s["start"]), "to": f(s["end"])} for s in scenes],
        "segments": [
            {
                "id": s["id"],
                "scene": s["scene"],
                "from": f(s["start"]),
                "to": f(s["end"]),
                "text": s["text"],
                "timing": s["timing"],
                "words": [{"w": w["word"], "from": f(w["start"]), "to": f(w["end"])} for w in s["words_abs"]],
            }
            for s in out_segments
        ],
        "cues": cue_frames,
    }

    pub_audio = os.path.join(ROOT, "source/public/audio")
    os.makedirs(pub_audio, exist_ok=True)
    sf.write(os.path.join(pub_audio, "narration.wav"), narration, SR, subtype="PCM_24")
    shutil.copy(os.path.join(pub_audio, "narration.wav"), os.path.join(ROOT, "audio/narration", f"narration_{args.engine}.wav"))
    os.makedirs(os.path.join(ROOT, "source/src/data"), exist_ok=True)
    with open(os.path.join(ROOT, "source/src/data/timeline.json"), "w", encoding="utf-8") as fh:
        json.dump(timeline, fh, indent=1)
    with open(os.path.join(ROOT, f"script/subtitles_{args.engine}.srt"), "w", encoding="utf-8") as fh:
        fh.write(build_srt(out_segments))

    words = sum(len(s["text"].split()) for s in out_segments)
    speech = sum(s["end"] - s["start"] for s in out_segments)
    print(f"engine={args.engine} segments={len(out_segments)} words={words} total={total_s:.2f}s "
          f"({int(total_s//60)}:{total_s%60:05.2f}) speech={speech:.1f}s wpm(speech-only)={words/speech*60:.0f} "
          f"wpm(overall)={words/total_s*60:.0f}")
    for sc in timeline["scenes"]:
        print(f"  scene {sc['id']:<4} {sc['from']/FPS:7.2f}s → {sc['to']/FPS:7.2f}s  ({(sc['to']-sc['from'])/FPS:5.1f}s)")
    est = [s["id"] for s in out_segments if s["timing"] != "engine"]
    if est:
        print(f"  NOTE: word timings estimated/remapped for: {', '.join(est)}")
    for p in problems:
        print("  CUE PROBLEM:", p)
    if problems:
        sys.exit(1)


if __name__ == "__main__":
    main()
