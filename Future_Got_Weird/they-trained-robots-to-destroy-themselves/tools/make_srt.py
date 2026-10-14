"""Timed SRT captions from the Scribe word timings of the locked narration, plus a transcript-vs-script check.

Usage: python3 tools/make_srt.py
Reads audio/narration_words.json and script/script_v1.md; writes captions/FGW_RobotsDestroy_v1.srt.
Cues: at most 2 lines x 42 characters and 6 s; they break at sentence ends where possible and never span a pause
longer than 0.9 s. Display spellings follow the script (F.02, F.03, Terminator 2) rather than the recogniser's.
"""
import difflib, json, os, re

ROOT = os.path.join(os.path.dirname(__file__), "..")
words = [w for w in json.load(open(os.path.join(ROOT, "audio", "narration_words.json")))["words"] if w.get("type", "word") == "word"]
DISPLAY = {"F-02s,": "F.02s,", "F-03": "F.03", "US": "U.S."}
for w in words:
    w["text"] = DISPLAY.get(w["text"], w["text"])
    # "the choice wasn't the robot's" (the recogniser cannot hear the apostrophe)
    if w["text"] == "robots." and w["start"] > 230:
        w["text"] = "robot's."


def ts(t):
    h, rem = divmod(t, 3600); m, s = divmod(rem, 60)
    return f"{int(h):02}:{int(m):02}:{s:06.3f}".replace(".", ",")


MAX_CH, MAX_DUR = 42, 6.0
cues, cur = [], []


def flush():
    global cur
    if cur:
        cues.append((cur[0]["start"], cur[-1]["end"], " ".join(w["text"] for w in cur)))
    cur = []


for i, w in enumerate(words):
    cur.append(w)
    dur = cur[-1]["end"] - cur[0]["start"]
    end_sent = re.search(r"[.?!\"]$", w["text"]) is not None
    gap = (words[i + 1]["start"] - w["end"]) if i + 1 < len(words) else 9
    nxt = len(" ".join(x["text"] for x in cur + ([words[i + 1]] if i + 1 < len(words) else [])))
    if (end_sent and (dur >= 1.2 or nxt > 60)) or dur >= MAX_DUR or gap > 0.9 or nxt > MAX_CH * 2:
        flush()
flush()

os.makedirs(os.path.join(ROOT, "captions"), exist_ok=True)
out = os.path.join(ROOT, "captions", "FGW_RobotsDestroy_v1.srt")
with open(out, "w", encoding="utf-8") as f:
    for n, (s, e, text) in enumerate(cues, 1):
        ws = text.split()
        if len(text) <= MAX_CH:
            body = text
        else:
            # balanced two-line split
            best, bk = 1e9, 1
            for k in range(1, len(ws)):
                a, b = " ".join(ws[:k]), " ".join(ws[k:])
                if len(a) <= MAX_CH and len(b) <= MAX_CH and abs(len(a) - len(b)) < best:
                    best, bk = abs(len(a) - len(b)), k
            body = " ".join(ws[:bk]) + "\n" + " ".join(ws[bk:])
        # keep a cue on screen at least 1 s when the next cue allows it
        e2 = max(e, min(s + 1.0, cues[n][0] - 0.05 if n < len(cues) else e + 1.0))
        f.write(f"{n}\n{ts(s)} --> {ts(e2)}\n{body}\n\n")
print(f"cues: {len(cues)} -> {out}")

norm = lambda s: re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("’", "'").replace("-", " ")).split()
script = open(os.path.join(ROOT, "script", "script_v1.md"), encoding="utf-8").read()
spoken = " ".join(re.findall(r"^> (.+)$", script, re.M))
a, b = norm(spoken), norm(" ".join(w["text"] for w in words))
sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
diffs = [op for op in sm.get_opcodes() if op[0] != "equal"]
print(f"script words: {len(a)}  transcript words: {len(b)}  differing spans: {len(diffs)}")
for tag, i1, i2, j1, j2 in diffs:
    print(f"  {tag}: script[{' '.join(a[i1:i2])}] -> transcript[{' '.join(b[j1:j2])}]")
