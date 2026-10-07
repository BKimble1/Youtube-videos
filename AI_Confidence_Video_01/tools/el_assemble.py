#!/usr/bin/env python3
"""Cut the selected ElevenLabs block takes into per-segment WAVs for tools/build_timeline.py.

The connector returns one MP3 per block (several script segments read in one go, so the delivery
flows). Segment boundaries come from a forced alignment of that take: ElevenLabs Scribe run on the
generation itself returns the prompt's words with start/end times. Because each segment's Eleven v4
prompt has the same number of words as its display text (see tools/el_blocks.py), the alignment
words map 1:1 onto the display words.

Inputs
  script/narration_blocks.json                      block prompts and words per segment
  audio/narration/elevenlabs/selection.json         chosen take + alignment file per block
  audio/narration/elevenlabs/takes/<take>.mp3        downloaded takes
  audio/narration/elevenlabs/takes/<take>.align.json Scribe words [{text,start,end}, ...]

Outputs (audio/narration/elevenlabs/)
  <seg>.wav          48 kHz mono PCM, from just before the first word to just before the next
                     segment (the natural pause, breaths included, stays with the segment)
  <seg>.words.json   display words with times relative to the WAV
  manifest.json      per segment: speech_start_s / speech_end_s inside the WAV and the natural
                     gap that follows, so build_timeline only adds silence where the design asks
                     for a longer pause than the voice took

Every block is gain-matched to the same integrated loudness so levels stay consistent across takes.

Usage: python3 tools/el_assemble.py
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EL = os.path.join(ROOT, "audio/narration/elevenlabs")
SR = 48000
PRE_S = 0.06          # keep at least this much before a segment's first sound (consonant onsets)
EDGE_FADE_S = 0.008   # tiny fades at internal cuts (cuts sit in pauses, so they are inaudible)
TAIL_S = 0.32         # after a block's final word: room for the release, then a fade
FADE_S = 0.04
TARGET_LUFS = -24.0   # narration stem level before the final mix (leaves peaks below -1 dBFS)


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-af", "aresample=resampler=soxr", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def lufs_of(x):
    tmp = os.path.join(EL, ".lufs_tmp.wav")
    sf.write(tmp, x.astype(np.float32), SR)
    err = subprocess.run(["ffmpeg", "-nostats", "-i", tmp, "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    os.remove(tmp)
    return float([l for l in err.splitlines() if l.strip().startswith("I:")][-1].split()[1])


def frame_db(x, hop):
    n = len(x) // hop
    fr = x[: n * hop].reshape(n, hop)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-10)


def norm(t):
    t = t.lower().replace("’", "'")
    return re.sub(r"[^a-z0-9'/ˈəɪæʊʃʒθðŋɑɔɛʌː]", "", t)


def main():
    blocks = json.load(open(os.path.join(ROOT, "script/narration_blocks.json"), encoding="utf-8"))
    sel = json.load(open(os.path.join(EL, "selection.json"), encoding="utf-8"))
    segdoc = json.load(open(os.path.join(ROOT, "script/narration_segments.json"), encoding="utf-8"))
    disp = {s["id"]: s["text"] for s in segdoc["segments"]}
    manifest = {"engine": "elevenlabs", "model": blocks["model"], "voice_name": blocks["voice_name"],
                "voice_id": blocks["voice_id"], "source": "ElevenLabs connector (Flows), MP3 44.1 kHz",
                "segments": []}
    hop = int(0.005 * SR)
    for b in blocks["blocks"]:
        s = sel[b["id"]]
        x = decode(os.path.join(EL, "takes", s["take"]))
        al = json.load(open(os.path.join(EL, "takes", s["alignment"]), encoding="utf-8"))
        words = [w for w in (al["words"] if isinstance(al, dict) else al) if w.get("type", "word") == "word"]
        prompt_words = b["prompt"].split()
        if len(words) != len(prompt_words):
            sys.exit(f"{b['id']}: alignment has {len(words)} words, prompt has {len(prompt_words)}")
        for w, p in zip(words, prompt_words):
            if norm(w["text"]) != norm(p):
                sys.exit(f"{b['id']}: alignment word {w['text']!r} != prompt word {p!r}")
        gain = 10 ** ((TARGET_LUFS - lufs_of(x)) / 20)
        x = x * gain
        db = frame_db(x, hop)
        loud = np.percentile(db, 95)
        voiced = db > loud - 32  # frames clearly above the pause floor (fricatives included)

        def onset(t):
            """Earliest sound of a word aligned to start at t (alignment steps are 40 ms)."""
            i = min(int(t * SR / hop), len(voiced) - 1)
            if voiced[i]:
                while i > 0 and voiced[i - 1] and t - (i - 1) * hop / SR < 0.25:
                    i -= 1
                return i * hop / SR
            lim = min(len(voiced) - 1, i + int(0.12 * SR / hop))
            while i < lim and not voiced[i]:
                i += 1
            return i * hop / SR

        def offset(t):
            """Last sound of a word aligned to end at t (follow the release up to 0.4 s)."""
            i = min(int(t * SR / hop), len(voiced) - 1)
            j = i
            if voiced[i]:
                while j < len(voiced) - 1 and voiced[j + 1] and j + 1 - i < int(0.4 * SR / hop):
                    j += 1
            else:  # aligned end already in the pause: step back to the last sound
                while j > 0 and not voiced[j] and i - j < int(0.2 * SR / hop):
                    j -= 1
            return (j + 1) * hop / SR

        # segment word ranges
        idx, ranges = 0, []
        for sid, n in zip(b["segments"], b["words_per_segment"]):
            ranges.append((sid, idx, idx + n))
            idx += n
        on = [onset(words[a]["start"]) for _, a, _ in ranges]
        off = [offset(words[c - 1]["end"]) for _, _, c in ranges]
        for i in range(len(ranges) - 1):  # never run into the next segment's first word
            off[i] = min(off[i], on[i + 1])
        cuts = []
        for i in range(len(ranges)):
            start = max(0.0, on[i] - PRE_S) if i == 0 else cuts[-1][1]
            if i + 1 < len(ranges):
                # cut at the quietest 10 ms inside the pause, not closer than PRE_S to the next word
                lo, hi = off[i] + 0.03, on[i + 1] - PRE_S
                if hi - lo > 0.02:
                    a0, a1 = int(lo * SR / hop), int(hi * SR / hop)
                    k = a0 + int(np.argmin(db[a0:a1 + 1]))
                    end = k * hop / SR
                else:
                    end = max(lo, hi)
            else:
                end = min(len(x) / SR, off[i] + TAIL_S)
            cuts.append((start, end))
        for (sid, a, c), (t0, t1), so, se in zip(ranges, cuts, on, off):
            seg = x[int(round(t0 * SR)): int(round(t1 * SR))].copy()
            f = int(FADE_S * SR)
            e = int(EDGE_FADE_S * SR)
            if sid == ranges[-1][0]:
                seg[-f:] *= np.linspace(1, 0, f) ** 2
            else:
                seg[-e:] *= np.linspace(1, 0, e)
            if sid == ranges[0][0]:
                g = int(0.01 * SR)
                seg[:g] *= np.linspace(0, 1, g)
            else:
                seg[:e] *= np.linspace(0, 1, e)
            dwords = disp[sid].split()
            ws = [{"word": d, "start": round(max(0.0, w["start"] - t0), 3), "end": round(w["end"] - t0, 3)}
                  for d, w in zip(dwords, words[a:c])]
            sf.write(os.path.join(EL, f"{sid}.wav"), seg.astype(np.float32), SR, subtype="PCM_24")
            with open(os.path.join(EL, f"{sid}.words.json"), "w", encoding="utf-8") as fh:
                json.dump({"words": ws}, fh, ensure_ascii=False, indent=0)
            dur = len(seg) / SR
            manifest["segments"].append({
                "id": sid, "file": f"{sid}.wav", "words_file": f"{sid}.words.json",
                "block": b["id"], "take": s["take"], "generation_id": s.get("generation_id"),
                "duration_s": round(dur, 3),
                "speech_start_s": round(so - t0, 3), "speech_end_s": round(se - t0, 3),
                "natural_gap_after_s": round(dur - (se - t0), 3),
                "block_final": sid == ranges[-1][0],
            })
        print(f"{b['id']} {s['take']}: gain {20*np.log10(gain):+.1f} dB, "
              + ", ".join(f"{sid} {t1-t0:.2f}s" for (sid, _, _), (t0, t1) in zip(ranges, cuts)))
    with open(os.path.join(EL, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
