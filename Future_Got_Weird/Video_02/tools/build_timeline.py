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

pause_after_ms is the target gap between segments. For engines whose manifest gives speech_start_s /
speech_end_s (ElevenLabs block takes, see tools/el_assemble.py) it counts the voice's own pause
towards that target instead of adding the full value on top. With "timing": {"pauses_are_caps": true} in
narration_segments.json (Video 02 v2) a longer natural gap is trimmed to the target; "lead_in_ms",
"end_screen_ms" and "end_screen_voice_offset_ms" set the silent lead-in and the end-screen length and start.
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
TAIL_S = 5.5          # time after the last word (end card + music tail; V2: room for the end-screen elements)
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
            remaining = len(words) - 1 - i
            if too_long and not strong and 0 < remaining <= 2:
                too_long = False  # keep a short tail ("title.") with its phrase instead of a flash cue
            if last or strong or (end_punct and len(text) > 28) or too_long:
                cues.append((cur[0]["start"], cur[-1]["end"], text))
                cur = []
    # merge very short trailing fragments ("title.", "Four.") into the previous cue when it fits
    merged = []
    for a, b, t in cues:
        if merged and len(t.split()) <= 2 and len(merged[-1][2]) + 1 + len(t) <= max_chars and a - merged[-1][1] < 0.6:
            pa, pb, pt = merged[-1]
            merged[-1] = (pa, b, pt + " " + t)
        else:
            merged.append((a, b, t))
    cues = merged
    # enforce min duration, then let each cue linger into the following pause (up to 0.6 s, and
    # long enough for about 17 characters per second where the pause allows); never overlap
    fixed = []
    for i, (a, b, t) in enumerate(cues):
        b = max(b + min(0.6, max(0.3, len(t) / 17.0 - (b - a))), a + 0.9)
        if i + 1 < len(cues):
            b = min(b, cues[i + 1][0] - 0.08)
        fixed.append((a, b, t))
    lines = []
    for i, (a, b, t) in enumerate(fixed, 1):
        # wrap to two lines of <= 42 chars where possible
        if len(t) > 42:
            words = t.split()
            best, best_score = None, 1e9
            for k in range(1, len(words)):
                l1, l2 = " ".join(words[:k]), " ".join(words[k:])
                score = abs(len(l1) - len(l2)) + (100 if max(len(l1), len(l2)) > 44 else 0)
                if score < best_score:
                    best, best_score = (l1, l2), score
            t = best[0] + "\n" + best[1]
        lines.append(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{t}\n")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", default="draft_local", help="folder under audio/narration/")
    ap.add_argument("--srt-only", action="store_true", help="rewrite only script/subtitles_<engine>.srt")
    args = ap.parse_args()

    segs_doc = load_json(os.path.join(ROOT, "script/narration_segments.json"))
    cues_doc = load_json(os.path.join(ROOT, "script/cues.json"))
    man_path = os.path.join(ROOT, "audio/narration", args.engine, "manifest.json")
    manifest = load_json(man_path)
    by_id = {s["id"]: s for s in manifest["segments"]}

    # v2 script timing (script/narration_segments.json "timing"): silent lead-in, end screen length, and designed
    # pauses applied as caps (the voice's own longer pause between two lines is trimmed to the designed gap)
    tim = segs_doc.get("timing", {})
    lead_in = tim.get("lead_in_ms", LEAD_IN_S * 1000) / 1000.0
    cap = bool(tim.get("pauses_are_caps", False))
    seg_list = segs_doc["segments"]
    loaded = []
    for seg in seg_list:
        m = by_id.get(seg["id"])
        if m is None:
            sys.exit(f"Segment {seg['id']} missing from {man_path}")
        m = dict(m)
        wav_path = os.path.join(os.path.dirname(man_path), os.path.basename(m["file"]))
        audio, sr = sf.read(wav_path, dtype="float32", always_2d=True)
        audio = audio.mean(axis=1)
        if sr != SR:
            sys.exit(f"{wav_path}: expected {SR} Hz, got {sr}")
        words = None
        wf = m.get("words_file")
        if wf:
            wpath = os.path.join(os.path.dirname(man_path), os.path.basename(wf))
            if os.path.exists(wpath):
                words = load_json(wpath)
                if isinstance(words, dict):
                    words = words.get("words", [])
        loaded.append([seg, m, audio, words])
    trims = []
    if cap:
        for i in range(len(loaded) - 1):
            seg, m, audio, _ = loaded[i]
            _, mn, an, _ = loaded[i + 1]
            if "speech_end_s" not in m or "speech_start_s" not in mn:
                continue
            target = seg.get("pause_after_ms", 250) / 1000.0
            tail = len(audio) / SR - m["speech_end_s"]
            head = mn["speech_start_s"]
            excess = tail + head - target
            if excess <= 0.02:
                continue
            cut_tail = min(excess, max(0.0, tail - 0.15))
            cut_head = min(excess - cut_tail, max(0.0, head - 0.06))
            if cut_tail > 0:
                n = int(round(cut_tail * SR))
                a = audio[: len(audio) - n].copy()
                fo = min(len(a), int(0.03 * SR))
                a[-fo:] *= np.linspace(1, 0, fo) ** 2
                loaded[i][2] = a
            if cut_head > 0:
                n = int(round(cut_head * SR))
                a = an[n:].copy()
                fi = min(len(a), int(0.01 * SR))
                a[:fi] *= np.linspace(0, 1, fi)
                loaded[i + 1][2] = a
                mn["speech_start_s"] -= cut_head
                mn["speech_end_s"] -= cut_head
                if loaded[i + 1][3]:
                    loaded[i + 1][3] = [{**w, "start": w["start"] - cut_head, "end": w["end"] - cut_head}
                                        for w in loaded[i + 1][3]]
            if cut_tail + cut_head > 0.02:
                trims.append((seg["id"], round(tail + head, 2), round(tail + head - cut_tail - cut_head, 2)))
    pieces = [np.zeros(int(lead_in * SR), dtype=np.float32)]
    t = lead_in
    out_segments = []
    for si, (seg, m, audio, words) in enumerate(loaded):
        dur = len(audio) / SR
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
        # Engines that return whole takes (ElevenLabs blocks) keep the voice's own pause inside the
        # segment WAVs: speech_start_s / speech_end_s mark the speech, and only the part of the
        # designed pause the voice did not already take is added as silence.
        s0 = m.get("speech_start_s", 0.0)
        s1 = m.get("speech_end_s", dur)
        if "speech_end_s" in m:
            nxt = loaded[si + 1][1] if si + 1 < len(loaded) else {}
            natural = (dur - s1) + nxt.get("speech_start_s", 0.0)
            pause = max(0.0, pause - natural)
        if si + 1 == len(loaded) and "end_screen_ms" in tim:
            pause = 0.0
        pieces.append(np.zeros(int(round(pause * SR)), dtype=np.float32))
        out_segments.append({
            "id": seg["id"],
            "scene": seg["scene"],
            "text": seg["text"],
            "start": t + s0,
            "end": t + s1,
            "timing": timing_source,
            "words_abs": words_abs,
        })
        t += dur + pause

    if "end_screen_ms" in tim:
        # the end screen starts end_screen_voice_offset_ms before the last line's first word and lasts end_screen_ms
        last = out_segments[-1]
        es_start = last["start"] - tim.get("end_screen_voice_offset_ms", 200) / 1000.0
        tail = max(0.5, es_start + tim["end_screen_ms"] / 1000.0 - t)
    else:
        tail = TAIL_S
    total_s = t + tail
    pieces.append(np.zeros(int(round(tail * SR)), dtype=np.float32))
    narration = np.concatenate(pieces)

    # Scenes: start SCENE_LEAD_S before the first word of their first segment; first scene starts at 0.
    scene_ids = []
    for s in out_segments:
        if s["scene"] not in scene_ids:
            scene_ids.append(s["scene"])
    scenes = []
    for i, sid in enumerate(scene_ids):
        first = next(s for s in out_segments if s["scene"] == sid)
        lead = SCENE_LEAD_S
        if "end_screen_ms" in tim and i == len(scene_ids) - 1:
            lead = tim.get("end_screen_voice_offset_ms", 200) / 1000.0
        start = 0.0 if i == 0 else max(0.0, first["start"] - lead)
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

    if args.srt_only:
        with open(os.path.join(ROOT, f"script/subtitles_{args.engine}.srt"), "w", encoding="utf-8") as fh:
            fh.write(build_srt(out_segments))
        print(f"wrote script/subtitles_{args.engine}.srt only")
        return
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
    for sid, a, b in trims:
        print(f"  pause cap: after {sid} the voice's own gap {a:.2f}s → {b:.2f}s")
    est = [s["id"] for s in out_segments if s["timing"] != "engine"]
    if est:
        print(f"  NOTE: word timings estimated/remapped for: {', '.join(est)}")
    for p in problems:
        print("  CUE PROBLEM:", p)
    if problems:
        sys.exit(1)


if __name__ == "__main__":
    main()
