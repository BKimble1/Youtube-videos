"""Timed V2 SRT captions from the word timings of the locked V2 narration, plus a transcript-vs-script check.

Usage: python3 tools/v2/make_srt_v2.py
Reads audio/v2/narration_words_v2.json and script/script_v2.md; writes captions/FGW_RobotsDestroy_v2.srt.
Cues: at most 2 lines x 42 characters and 6 s; they break at sentence ends where possible and never span a pause
longer than 0.9 s. Display spellings follow the script (F.02s, F.03, Terminator 2, 1991) rather than the spoken forms.
"""
import difflib, json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
words = [dict(w) for w in json.load(open(os.path.join(ROOT, "audio", "v2", "narration_words_v2.json")))["words"] if w.get("type", "word") == "word"]
DISPLAY = {"F-zero-twos,": "F.02s,", "F-zero-three": "F.03", "Two,": "2,"}
out_words = []
i = 0
while i < len(words):
    w = words[i]
    if w["text"] == "nineteen" and i + 1 < len(words) and words[i + 1]["text"].startswith("ninety-one"):
        out_words.append({**w, "text": "1991" + words[i + 1]["text"][len("ninety-one"):], "end": words[i + 1]["end"]})
        i += 2
        continue
    out_words.append({**w, "text": DISPLAY.get(w["text"], w["text"])})
    i += 1
words = out_words


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
    end_sent = re.search(r"[.?!\"”]$", w["text"]) is not None
    gap = (words[i + 1]["start"] - w["end"]) if i + 1 < len(words) else 9
    nxt = len(" ".join(x["text"] for x in cur + ([words[i + 1]] if i + 1 < len(words) else [])))
    clause = w["text"].endswith(",") and len(" ".join(x["text"] for x in cur)) >= 46
    if (end_sent and (dur >= 1.2 or nxt > 60)) or clause or dur >= MAX_DUR or gap > 0.9 or nxt > MAX_CH * 2 - 6:
        flush()
flush()

os.makedirs(os.path.join(ROOT, "captions"), exist_ok=True)
out = os.path.join(ROOT, "captions", "FGW_RobotsDestroy_v2.srt")
with open(out, "w", encoding="utf-8") as f:
    for n, (s, e, text) in enumerate(cues, 1):
        ws = text.split()
        if len(text) <= MAX_CH:
            body = text
        else:
            best, bk = 1e9, 1
            for k in range(1, len(ws)):
                a, b = " ".join(ws[:k]), " ".join(ws[k:])
                if len(a) <= MAX_CH and len(b) <= MAX_CH and abs(len(a) - len(b)) < best:
                    best, bk = abs(len(a) - len(b)), k
            body = " ".join(ws[:bk]) + "\n" + " ".join(ws[bk:])
        e2 = max(e, min(s + 1.0, cues[n][0] - 0.05 if n < len(cues) else e + 1.0))
        f.write(f"{n}\n{ts(s)} --> {ts(e2)}\n{body}\n\n")
print(f"cues: {len(cues)} -> {out}")
long_lines = [l for c in open(out, encoding="utf-8").read().split("\n\n") for l in c.split("\n")[2:] if len(l) > MAX_CH]
print(f"lines over {MAX_CH} characters: {len(long_lines)}")

norm = lambda s: re.sub(r"[^a-z0-9' ]", " ", s.lower().replace("’", "'").replace("-", " ").replace("f.02s", "f zero twos").replace("f.02", "f zero two").replace("f.03", "f zero three").replace("terminator 2", "terminator two").replace("1991", "nineteen ninety one")).split()
script = open(os.path.join(ROOT, "script", "script_v2.md"), encoding="utf-8").read()
spoken = " ".join(re.findall(r"^> (.+)$", script, re.M))
a = norm(spoken)
b = norm(" ".join(w["text"] for w in words))
sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
diffs = [op for op in sm.get_opcodes() if op[0] != "equal"]
print(f"script words: {len(a)}  caption words: {len(b)}  differing spans: {len(diffs)}")
for tag, i1, i2, j1, j2 in diffs:
    print(f"  {tag}: script[{' '.join(a[i1:i2])}] -> captions[{' '.join(b[j1:j2])}]")
