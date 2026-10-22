"""Build the SRT from the generated narration itself: every script segment is a separately generated clip whose
start/end in the final narration are measured (timeline.json). Long segments are split at punctuation, and each split
is snapped to the nearest real pause found in that clip's waveform.
Usage: python3.13 tools/make_srt.py  -> captions/FGW_Starship_Dual_Catch_V1.srt, captions/srt_check.json"""
import json, os, re
import numpy as np, soundfile as sf
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
TL = json.load(open(os.path.join(ROOT, "source", "src", "data", "timeline.json")))
MAXC = 84

def pauses(x, sr):
    w = int(0.02 * sr); e = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "same"))
    q = e < 0.02 * e.max(); out = []; i = 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if (j - i) / sr >= 0.09 and i > 0 and j < len(q): out.append((i + j) / 2 / sr)
            i = j
        else: i += 1
    return out

def chunks(text):
    parts = re.findall(r"[^.,:;?!]+[.,:;?!]*\s*", text)
    out, cur = [], ""
    for p in parts:
        if cur and len(cur) + len(p) > MAXC: out.append(cur.strip()); cur = p
        else: cur += p
    if cur.strip(): out.append(cur.strip())
    return out

def wrap(s):
    if len(s) <= 42: return s
    words = s.split(); best = None
    for k in range(1, len(words)):
        a, b = " ".join(words[:k]), " ".join(words[k:])
        sc = max(len(a), len(b))
        if best is None or sc < best[0]: best = (sc, a + "\n" + b)
    return best[1]

ts = lambda t: f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round((t % 1) * 1000)) % 1000:03d}"
cues, report = [], []
for s in TL["segments"]:
    x, sr = sf.read(os.path.join(ROOT, "audio", "narration", "seg", f"{s['id']}.wav"))
    d = len(x) / sr
    cs = chunks(s["text"]); ps = pauses(x, sr)
    total = sum(len(c) for c in cs); acc = 0; bounds = [0.0]
    for c in cs[:-1]:
        acc += len(c); est = d * acc / total
        near = min(ps, key=lambda p: abs(p - est)) if ps else est
        bounds.append(near if abs(near - est) < 0.8 else est)
    bounds.append(d)
    for i, c in enumerate(cs):
        a, b = s["start"] + bounds[i], s["start"] + bounds[i + 1]
        cues.append((a, b, wrap(c)))
    report.append({"id": s["id"], "chunks": len(cs), "pauses_found": len(ps)})
# keep each cue on screen until just before the next one (max +0.6 s after speech)
lines = []
for i, (a, b, c) in enumerate(cues):
    nxt = cues[i + 1][0] if i + 1 < len(cues) else b + 1
    end = min(b + 0.6, nxt - 0.04)
    lines.append(f"{i + 1}\n{ts(a)} --> {ts(end)}\n{c}\n")
os.makedirs(os.path.join(ROOT, "captions"), exist_ok=True)
open(os.path.join(ROOT, "captions", "FGW_Starship_Dual_Catch_V1.srt"), "w").write("\n".join(lines))
json.dump({"cues": len(cues), "max_line_chars": max(len(l) for (_, _, c) in cues for l in c.split("\n")), "segments": report}, open(os.path.join(ROOT, "captions", "srt_check.json"), "w"), indent=1)
print(len(cues), "cues")
