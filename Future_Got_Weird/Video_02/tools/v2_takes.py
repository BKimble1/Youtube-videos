#!/usr/bin/env python3
"""Video 02 narration (from the Video 01 V2 tool): measure every line in every take, pick takes per line, and cut the chosen lines.

  python3 tools/v2_takes.py eval       -> audio/narration/v2/eval.json + eval_report.md + proposed selection
           [--sections y01,y02]  measure only these recording sections   [--fill] add picks only for unselected lines
  python3 tools/v2_takes.py assemble   -> audio/narration/v2/<seg>.wav, <seg>.words.json, manifest.json

Takes: audio/narration/v2/takes/<section>_t<k>.mp3 with <section>_t<k>.align.json (Scribe forced alignment of the
generation: the prompt's tokens with times, delivery tags included as zero-length tokens).
Sections and segments: script/narration_sections.json, script/narration_segments.json.
Selection: script/narration_selection.json  {"s01": "x01_t3", ...}  (eval writes a proposal if none exists;
           hand edits win, eval never overwrites an existing file unless --reselect).

Measurements per line (no listening involved; every one is a proxy):
  pitch    F0 range (10-90th pct, semitones) and SD over voiced frames: expressive vs monotone
  pace     words per minute while speaking (internal pauses > 0.25 s removed)
  pauses   every internal pause with the word it follows; the designed beats ("answers…", "professional…",
           "font…", "three…", "language…", "evidence is…", the [short pause] before "They do NOT") must be
           0.25-1.3 s long
  words    aligned word durations: < 50 ms (swallowed / skipped) or > 1.4 s (stretched) are flagged
  glitch   loud broadband clicks: 5 ms frames whose energy above 4 kHz jumps > 18 dB over both neighbours
  level    loudness of the line relative to the median of all lines
  release  the last word decays into the pause (no hard cut inside the generation)
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V2 = os.path.join(ROOT, "audio/narration/v2")
TAKES = os.path.join(V2, "takes")
SR = 48000
MEDIAN_LINE_DB = None
HOP = int(0.005 * SR)
PUNCT_ONLY = re.compile(r"^[^\wʊəɪæʃʒθðŋɑɔɛʌ]+$")
DESIGNED_BEATS = {  # segment -> words after which the direction asks for an audible beat (Video 02 script v2 pass)
    "s18": ["direction…"], "s20": ["just…"],
    "n01": ["yet…"], "n03": ["round…"], "n05": ["sensor…"], "n06": ["delay…"], "n07": ["puzzle…"],
    "n08": ["here…"], "n09": ["paths…"], "n11": ["there…"], "n16": ["moved…"], "n19": ["jiggles…"],
    "n20": ["smear…"], "n23": ["up…"], "n24": ["do…"], "n25": ["dollars…"], "n29": ["junction…"],
    "n31": ["sight…"],
}


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-af", "aresample=resampler=soxr", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def frame_db(x, hop=HOP):
    n = len(x) // hop
    fr = x[: n * hop].reshape(n, hop)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-10)


def spoken_tokens(words):
    """Alignment tokens with delivery tags (possibly spanning several tokens) and punctuation-only tokens removed."""
    out, depth = [], 0
    for w in words:
        t = w["text"]
        if w.get("type", "word") != "word":
            continue
        if depth == 0 and t.startswith("["):
            depth = 0 if t.endswith("]") else 1
            continue
        if depth:
            if t.endswith("]"):
                depth = 0
            continue
        if PUNCT_ONLY.match(t):
            continue
        out.append(w)
    return out


def load_docs():
    secs = json.load(open(os.path.join(ROOT, "script/narration_sections.json"), encoding="utf-8"))
    segs = json.load(open(os.path.join(ROOT, "script/narration_segments.json"), encoding="utf-8"))
    return secs, {s["id"]: s for s in segs["segments"]}, [s["id"] for s in segs["segments"]]


def take_lines(section, take):
    """Per segment of a take: (seg id, aligned spoken words, audio, frame dB)."""
    al = json.load(open(os.path.join(TAKES, f"{take}.align.json"), encoding="utf-8"))
    words = spoken_tokens(al["words"] if isinstance(al, dict) else al)
    need = sum(section["words_per_segment"])
    if len(words) != need:
        raise ValueError(f"{take}: {len(words)} spoken tokens aligned, prompt has {need}")
    x = decode(os.path.join(TAKES, f"{take}.mp3"))
    out, i = [], 0
    for sid, n in zip(section["segments"], section["words_per_segment"]):
        out.append((sid, words[i:i + n]))
        i += n
    return out, x


def voiced_mask(db):
    loud = np.percentile(db, 95)
    return db > loud - 32


def onset(t, voiced):
    i = min(int(t * SR / HOP), len(voiced) - 1)
    if voiced[i]:
        while i > 0 and voiced[i - 1] and t - (i - 1) * HOP / SR < 0.25:
            i -= 1
        return i * HOP / SR
    lim = min(len(voiced) - 1, i + int(0.12 * SR / HOP))
    while i < lim and not voiced[i]:
        i += 1
    return i * HOP / SR


def offset(t, voiced):
    i = min(int(t * SR / HOP), len(voiced) - 1)
    j = i
    if voiced[i]:
        while j < len(voiced) - 1 and voiced[j + 1] and j + 1 - i < int(0.4 * SR / HOP):
            j += 1
    else:
        while j > 0 and not voiced[j] and i - j < int(0.2 * SR / HOP):
            j -= 1
    return (j + 1) * HOP / SR


def silences(db, rel=30, min_len=0.12):
    """Stretches where the 5 ms level stays rel dB below the take's loud level for >= min_len seconds."""
    thr = np.percentile(db, 95) - rel
    q = db < thr
    out, i = [], 0
    while i < len(q):
        if q[i]:
            j = i
            while j + 1 < len(q) and q[j + 1]:
                j += 1
            if (j - i + 1) * HOP / SR >= min_len:
                out.append((i * HOP / SR, (j + 1) * HOP / SR))
            i = j + 1
        else:
            i += 1
    return out


def line_bounds(lines, db):
    """Speech start/end of every line in a take, from the energy pauses between consecutive lines.

    The pause between line k and line k+1 is the longest silence that starts after the last word of line k begins
    and ends before the first word of line k+1 is well under way. Line k's speech ends where that pause starts;
    line k+1's speech starts where it ends. Returns {sid: (on, off, pause_before, pause_after)}."""
    sil = silences(db, rel=30, min_len=0.06)
    thr = np.percentile(db, 95) - 30
    loud = np.where(db > thr)[0]
    first_on = loud[0] * HOP / SR if len(loud) else 0.0
    last_off = (loud[-1] + 1) * HOP / SR if len(loud) else len(db) * HOP / SR
    out = {}
    seq = [sid for sid, _ in lines]
    words = dict(lines)
    pauses = []
    for k in range(len(seq) - 1):
        ta = words[seq[k]][-1]["start"]
        tb = words[seq[k + 1]][0]["start"]
        c = [(s0, s1) for s0, s1 in sil if s1 > ta + 0.08 and s0 < tb + 0.05]
        if c:
            pauses.append(max(c, key=lambda p: p[1] - p[0]))
        else:  # no measurable pause: split at the quietest frame between the two words
            a0, a1 = int(ta * SR / HOP), max(int(ta * SR / HOP) + 1, int(tb * SR / HOP))
            m = (a0 + int(np.argmin(db[a0:a1]))) * HOP / SR
            pauses.append((m, m))
    for k, sid in enumerate(seq):
        pb = pauses[k - 1] if k > 0 else None
        pa = pauses[k] if k < len(seq) - 1 else None
        on = pb[1] if pb else first_on
        off = pa[0] if pa else last_off
        out[sid] = (on, off, pb, pa)
    return out


def pitch_stats(seg):
    import parselmouth
    snd = parselmouth.Sound(seg, SR)
    f0 = snd.to_pitch_ac(time_step=0.01, pitch_floor=70, pitch_ceiling=420).selected_array["frequency"]
    f0 = f0[f0 > 0]
    if len(f0) < 20:
        return None, None, None
    st = 12 * np.log2(f0 / np.median(f0))
    return float(np.median(f0)), float(np.percentile(st, 90) - np.percentile(st, 10)), float(np.std(st))


def glitches(seg):
    """Count broadband clicks: 5 ms frames whose >4 kHz energy jumps far above both neighbours."""
    from scipy import signal
    hp = signal.sosfilt(signal.butter(4, 4000, "highpass", fs=SR, output="sos"), seg)
    db = frame_db(hp)
    if len(db) < 3:
        return 0
    c = db[1:-1]
    jump = np.minimum(c - db[:-2], c - db[2:])
    return int(np.sum((jump > 18) & (c > np.percentile(db, 90))))


def measure(only=None):
    secs, segdoc, order = load_docs()
    rows = {}
    for sec in secs["sections"]:
        if only and sec["id"] not in only:
            continue
        for k in range(1, 5):
            take = f"{sec['id']}_t{k}"
            if not os.path.exists(os.path.join(TAKES, f"{take}.align.json")):
                print("no alignment for", take)
                continue
            lines, x = take_lines(sec, take)
            db = frame_db(x)
            voiced = voiced_mask(db)
            sil = silences(db)
            bounds = line_bounds(lines, db)
            for sid, ws in lines:
                a, b = bounds[sid][0], bounds[sid][1]
                seg = x[int(a * SR): int(b * SR)]
                # internal pauses from the energy envelope, each attributed to the word whose aligned start precedes it
                pauses = []
                for s0, s1 in sil:
                    if s0 <= a + 0.05 or s1 >= b - 0.05:
                        continue
                    prev = [w for w in ws if w["start"] <= s0 + 0.02]
                    if prev:
                        pauses.append((prev[-1]["text"], round(s1 - s0, 3)))
                speak = (b - a) - sum(g for _, g in pauses if g > 0.25)
                f0m, rng, sd = pitch_stats(seg)
                # a carried v1 section can contain lines the current script no longer uses: measure them by their tokens
                disp = segdoc[sid]["text"].split() if sid in segdoc else [w["text"] for w in ws]
                short = [d for d, w in zip(disp, ws) if w["end"] - w["start"] < 0.03 and len(re.sub(r"\W", "", d)) >= 5]
                long = [d for d, w in zip(disp, ws) if w["end"] - w["start"] > 1.6]
                beats = {}
                for bw in DESIGNED_BEATS.get(sid, []):
                    gs = [g for t, g in pauses if t.lower().endswith(bw) or t.lower() == bw]
                    beats[bw] = max(gs) if gs else 0.0
                rows.setdefault(sid, {})[take] = {
                    "duration_s": round(b - a, 3), "wpm": round(len(ws) / (speak / 60), 1),
                    "f0_median": round(f0m, 1) if f0m else None, "f0_range_st": round(rng, 2) if rng else None,
                    "f0_sd_st": round(sd, 2) if sd else None,
                    "rms_db": round(float(np.percentile(frame_db(seg), 90)), 2) if len(seg) > HOP * 3 else None,
                    "pauses": pauses, "beats": beats, "short_words": short, "long_words": long,
                    "glitches": glitches(seg),
                }
    return rows, order, segdoc, secs


def score(r, sid, med_db, med_f0):
    s = 0.0
    s += min(r["f0_range_st"] or 0, 9) * 0.8          # expressiveness, saturating
    s += min(r["f0_sd_st"] or 0, 3.5) * 0.8
    w = r["wpm"]
    s -= max(0, w - 205) * 0.08 + max(0, 140 - w) * 0.08   # neither rushed nor dragging
    for bw, g in r["beats"].items():
        s += 2.0 if 0.25 <= g <= 1.3 else -2.0
    s -= 2.0 * len(r["short_words"]) + 2.0 * len(r["long_words"])
    s -= 1.5 * r["glitches"]
    if r["rms_db"] is not None:
        s -= max(0, abs(r["rms_db"] - med_db) - 2.5) * 0.6
    if r["f0_median"] and med_f0:
        s -= max(0, abs(12 * np.log2(r["f0_median"] / med_f0)) - 2.0) * 1.0   # stay one presenter
    long_internal = [g for _, g in r["pauses"] if g > 1.4]
    s -= 2.0 * len(long_internal)
    return round(s, 2)


def cmd_eval(reselect=False, fill=False, only=None):
    rows, order, segdoc, secs = measure(only)
    all_db = [r["rms_db"] for d in rows.values() for r in d.values() if r["rms_db"] is not None]
    all_f0 = [r["f0_median"] for d in rows.values() for r in d.values() if r["f0_median"]]
    med_db, med_f0 = float(np.median(all_db)), float(np.median(all_f0))
    for sid, d in rows.items():
        for take, r in d.items():
            r["score"] = score(r, sid, med_db, med_f0)
    json.dump({"median_rms_db": med_db, "median_f0": med_f0, "lines": rows},
              open(os.path.join(V2, "eval.json"), "w"), indent=1, ensure_ascii=False)
    # proposal: best take per line, but keep a section's lines in one take when it costs < 1.0 point per line
    sel = {}
    for sec in secs["sections"]:
        if only and sec["id"] not in only:
            continue
        ids = [s for s in sec["segments"] if not s.startswith("ctx:")]  # context lines are never selected
        takes = sorted({t for sid in ids for t in rows.get(sid, {})})
        best_per = {sid: max(rows[sid], key=lambda t: rows[sid][t]["score"]) for sid in ids}
        best_one = max(takes, key=lambda t: sum(rows[sid].get(t, {"score": -99})["score"] for sid in ids))
        loss = sum(rows[sid][best_per[sid]]["score"] - rows[sid][best_one]["score"] for sid in ids)
        for sid in ids:
            sel[sid] = best_one if loss < 1.0 * len(ids) else best_per[sid]
    sel_path = os.path.join(ROOT, "script/narration_selection.json")
    if fill and os.path.exists(sel_path):
        # keep every existing choice; add proposals only for lines in the script that have none yet
        cur = json.load(open(sel_path))
        for sid in order:
            if sid not in cur and sid in sel:
                cur[sid] = sel[sid]
        sel = {sid: cur[sid] for sid in order if sid in cur}
        json.dump(sel, open(sel_path, "w"), indent=1)
    elif reselect or not os.path.exists(sel_path):
        json.dump(sel, open(sel_path, "w"), indent=1)
    # report
    lines = ["# V2 narration: per-line measurements", "",
             f"Median line level {med_db:.1f} dB (90th pct of 5 ms frames), median F0 {med_f0:.0f} Hz.", ""]
    for sid in order:
        if sid not in rows:
            continue
        lines += [f"## {sid} — {segdoc[sid]['text']}", f"_Direction: {segdoc[sid].get('direction', '')}_", "",
                  "| take | score | dur s | wpm | F0 range st | F0 SD | level dB | beats | pauses (word: s) | flags |",
                  "|---|---|---|---|---|---|---|---|---|---|"]
        for take, r in sorted(rows[sid].items(), key=lambda kv: -kv[1]["score"]):
            flags = []
            if r["short_words"]:
                flags.append("short: " + " ".join(r["short_words"]))
            if r["long_words"]:
                flags.append("long: " + " ".join(r["long_words"]))
            if r["glitches"]:
                flags.append(f"{r['glitches']} click(s)")
            mark = " ✔" if sel.get(sid) == take else ""
            lines.append(f"| {take}{mark} | {r['score']} | {r['duration_s']} | {r['wpm']} | {r['f0_range_st']} | "
                         f"{r['f0_sd_st']} | {r['rms_db']} | {', '.join(f'{k}{v}' for k, v in r['beats'].items())} | "
                         f"{'; '.join(f'{w} {g}' for w, g in r['pauses'])} | {'; '.join(flags)} |")
        lines.append("")
    open(os.path.join(V2, "eval_report.md"), "w").write("\n".join(lines))
    print(open(sel_path).read() if os.path.exists(sel_path) else "")


def lufs_of(x):
    tmp = os.path.join(V2, ".lufs_tmp.wav")
    sf.write(tmp, x.astype(np.float32), SR)
    err = subprocess.run(["ffmpeg", "-nostats", "-i", tmp, "-af", "ebur128", "-f", "null", "-"], capture_output=True,
                         text=True).stderr
    os.remove(tmp)
    return float([l for l in err.splitlines() if l.strip().startswith("I:")][-1].split()[1])


def cmd_assemble():
    """Cut each line from its chosen take. Lines that are neighbours in the same take are cut inside their shared
    pause (the voice's own pause stays); other lines get their own natural lead-in and release. No time-stretching."""
    secs, segdoc, order = load_docs()
    sel = json.load(open(os.path.join(ROOT, "script/narration_selection.json")))
    sec_by_id = {sec["id"]: sec for sec in secs["sections"]}
    # a line can appear in more than one recording section (v2 retakes); its section is the one its chosen take is from
    sec_of = {sid: sec_by_id[take.rsplit("_t", 1)[0]] for sid, take in sel.items()}
    cache = {}
    target = -24.0
    global MEDIAN_LINE_DB
    ev = json.load(open(os.path.join(V2, "eval.json")))
    # eval measured lines on takes decoded at their native level; assembly works on gain-matched takes, so the
    # median is re-measured below on the first pass over the selected lines
    MEDIAN_LINE_DB = None
    levels = []
    for sid in order:
        take = sel[sid]
        sec = sec_of[sid]
        lines, x = take_lines(sec, take)
        x = x * 10 ** ((target - lufs_of(x)) / 20)
        a0, b0 = line_bounds(lines, frame_db(x))[sid][:2]
        levels.append(float(np.percentile(frame_db(x[int(a0 * SR): int(b0 * SR)]), 90)))
    MEDIAN_LINE_DB = float(np.median(levels))
    print(f"median selected-line level {MEDIAN_LINE_DB:.1f} dB")
    manifest = {"engine": "v2", "model": "eleven_v4", "voice_name": "Test Voice", "voice_id": "kk5XaSLo2XAw0sKM98zU",
                "source": "ElevenLabs connector (Flows), MP3 44.1 kHz", "segments": []}
    for idx, sid in enumerate(order):
        take = sel[sid]
        sec = sec_of[sid]
        if take not in cache:
            lines, x = take_lines(sec, take)
            gain = 10 ** ((target - lufs_of(x)) / 20)
            x = x * gain
            db = frame_db(x)
            cache[take] = (dict(lines), x, db, voiced_mask(db), [s for s, _ in lines], line_bounds(lines, db))
        lines, x, db, voiced, seq, bounds = cache[take]
        ws = lines[sid]
        k = seq.index(sid)
        on, off, pb, pa = bounds[sid]
        prev_sid = order[idx - 1] if idx > 0 else None
        next_sid = order[idx + 1] if idx + 1 < len(order) else None

        def quietest(lo, hi):
            i0, i1 = int(lo * SR / HOP), int(hi * SR / HOP)
            return (i0 + int(np.argmin(db[i0:i1 + 1]))) * HOP / SR

        # start: inside the shared pause if the previous line is the neighbour in this same take; else a short lead-in
        if pb and prev_sid == seq[k - 1] and sel.get(prev_sid) == take and pb[1] - pb[0] > 0.1:
            start = quietest(pb[0] + 0.03, pb[1] - 0.05)
        else:
            start = max(pb[0] + 0.02 if pb else 0.0, on - 0.09)
        if pa and next_sid == seq[k + 1] and sel.get(next_sid) == take and pa[1] - pa[0] > 0.1:
            end = quietest(pa[0] + 0.03, pa[1] - 0.05)
        else:
            end = min(pa[1] - 0.04 if pa else len(x) / SR, off + 0.3)
        seg = x[int(round(start * SR)): int(round(end * SR))].copy()
        ws = [dict(w) for w in ws]
        icap = segdoc[sid].get("inner_pause_cap_ms")
        if icap:
            # tighten sentence breaks inside the line: each pause the take's own energy shows inside the line's speech
            # (the same silences eval measures) that is longer than the cap loses its middle, with a 10 ms crossfade;
            # the words after it move up. Done last to first, so earlier positions stay valid.
            cap_s = icap / 1000.0
            shift_total = 0.0
            inner = [(s0, s1) for s0, s1 in silences(db, rel=30, min_len=0.06)
                     if s0 > on + 0.05 and s1 < off - 0.05 and (s1 - s0) > cap_s + 0.02]
            for s0, s1 in reversed(inner):
                cut = (s1 - s0) - cap_s
                c0 = s0 + cap_s / 2 - start
                a, b = int(round(c0 * SR)), int(round((c0 + cut) * SR))
                xf = int(0.01 * SR)
                head, tail = seg[:a], seg[b:]
                if len(head) <= xf or len(tail) <= xf:
                    continue
                mix = head[-xf:] * np.linspace(1, 0, xf) + tail[:xf] * np.linspace(0, 1, xf)
                seg = np.concatenate([head[:-xf], mix, tail[xf:]])
                d = (b - a + xf) / SR
                shift_total += d
                for w in ws:
                    if w["start"] >= s1 - 0.02:
                        w["start"] -= d
                        w["end"] -= d
                prev = [w for w in ws if w["start"] < s0]
                print(f"   {sid}: pause after '{prev[-1]['text'] if prev else '?'}' {s1 - s0:.2f}s → {cap_s:.2f}s")
            off -= shift_total
        # one presenter: lines whose level strays more than 1.5 dB from the median line are pulled most of the way back
        line_db = float(np.percentile(frame_db(x[int(on * SR): int(off * SR)]), 90))
        dev = line_db - MEDIAN_LINE_DB
        corr = -np.sign(dev) * max(0.0, abs(dev) - 1.5) * 0.8
        seg *= 10 ** (corr / 20)
        if abs(corr) > 0.05:
            print(f"   {sid}: level {dev:+.1f} dB from median, corrected {corr:+.1f} dB")
        fi = int(0.008 * SR)
        fo = int(0.035 * SR)
        seg[:fi] *= np.linspace(0, 1, fi)
        seg[-fo:] *= np.linspace(1, 0, fo) ** 2
        disp = segdoc[sid]["text"].split()
        wj = [{"word": d, "start": round(max(0.0, w["start"] - start), 3), "end": round(w["end"] - start, 3)}
              for d, w in zip(disp, ws)]
        sf.write(os.path.join(V2, f"{sid}.wav"), seg.astype(np.float32), SR, subtype="PCM_24")
        json.dump({"words": wj}, open(os.path.join(V2, f"{sid}.words.json"), "w", encoding="utf-8"), ensure_ascii=False)
        dur = len(seg) / SR
        manifest["segments"].append({"id": sid, "file": f"{sid}.wav", "words_file": f"{sid}.words.json",
                                     "section": sec["id"], "take": take, "duration_s": round(dur, 3),
                                     "speech_start_s": round(on - start, 3), "speech_end_s": round(off - start, 3),
                                     "natural_gap_after_s": round(dur - (off - start), 3)})
        print(f"{sid} {take}: {dur:.2f}s (speech {off - on:.2f}s)")
    json.dump(manifest, open(os.path.join(V2, "manifest.json"), "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if sys.argv[1] == "eval":
        only = None
        if "--sections" in sys.argv:
            only = set(sys.argv[sys.argv.index("--sections") + 1].split(","))
        cmd_eval(reselect="--reselect" in sys.argv, fill="--fill" in sys.argv, only=only)
    elif sys.argv[1] == "assemble":
        cmd_assemble()
    else:
        sys.exit(__doc__)
