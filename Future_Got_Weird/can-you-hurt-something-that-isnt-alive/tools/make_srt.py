"""Build SRT captions and a transcript-vs-script check from Scribe word timings.

Usage: python3 tools/make_srt.py audio/narration_words.json script/script_v2.md out.srt
Caption text is the transcript word list (what the audio says), grouped into cues
of at most 2 lines x 42 characters and at most 6.0 s. Cues break at sentence ends
where possible. The comparison prints word-level differences against the script.
"""
import json, re, sys

words_path, script_path, out_path = sys.argv[1:4]
words = [w for w in json.load(open(words_path))["words"] if w.get("type", "word") == "word"]

def ts(t):
    h, rem = divmod(t, 3600); m, s = divmod(rem, 60)
    return f"{int(h):02}:{int(m):02}:{s:06.3f}".replace(".", ",")

MAX_CH, MAX_DUR, MAX_LINES = 42, 6.0, 2
cues, cur = [], []

def flush():
    global cur
    if cur:
        text = " ".join(w["text"] for w in cur)
        cues.append((cur[0]["start"], cur[-1]["end"], text))
    cur = []

def lines_of(ws):
    out, line = [], []
    for w in ws:
        cand = " ".join(x["text"] for x in line + [w])
        if len(cand) > MAX_CH and line:
            out.append(" ".join(x["text"] for x in line)); line = [w]
        else:
            line.append(w)
    if line: out.append(" ".join(x["text"] for x in line))
    return out

for i, w in enumerate(words):
    cur.append(w)
    dur = cur[-1]["end"] - cur[0]["start"]
    sentence_end = re.search(r"[.?!\"]$", w["text"]) is not None
    gap = (words[i + 1]["start"] - w["end"]) if i + 1 < len(words) else 9
    text_len = len(" ".join(x["text"] for x in cur))
    if (sentence_end and (dur >= 1.5 or text_len > 60)) or dur >= MAX_DUR or gap > 0.9 or text_len > MAX_CH * MAX_LINES:
        flush()
flush()

with open(out_path, "w", encoding="utf-8") as f:
    for n, (s, e, text) in enumerate(cues, 1):
        ws = text.split()
        if len(text) <= MAX_CH:
            body = text
        else:
            # one split point: first line as long as possible within MAX_CH, keeping the words in order
            k = 1
            while k < len(ws) and len(" ".join(ws[:k + 1])) <= MAX_CH:
                k += 1
            body = " ".join(ws[:k]) + "\n" + " ".join(ws[k:])
        f.write(f"{n}\n{ts(s)} --> {ts(e)}\n{body}\n\n")
print(f"cues: {len(cues)}")

# Transcript vs script comparison (lowercase, letters and apostrophes only)
norm = lambda s: re.sub(r"[^a-z' ]", "", s.lower().replace("’", "'")).split()
script_text = open(script_path, encoding="utf-8").read()
spoken = " ".join(re.findall(r"^\[L\d\d\] \[Visual[^\]]*\]\n(.*)$", script_text, re.M))
import difflib
a, b = norm(spoken), norm(" ".join(w["text"] for w in words))
sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
diffs = [op for op in sm.get_opcodes() if op[0] != "equal"]
print(f"script words: {len(a)}  transcript words: {len(b)}  differing spans: {len(diffs)}")
for tag, i1, i2, j1, j2 in diffs:
    print(f"  {tag}: script[{' '.join(a[i1:i2])}] -> transcript[{' '.join(b[j1:j2])}]")
