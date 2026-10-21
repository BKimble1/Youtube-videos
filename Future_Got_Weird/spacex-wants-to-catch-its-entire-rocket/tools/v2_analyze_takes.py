"""Measure narration takes: speech span, rate, pitch movement, internal gaps.
Usage: python3 tools/v2_analyze_takes.py <words_in_text> take1.mp3 [take2.mp3 ...]"""
import subprocess, sys, json
import numpy as np

SR = 16000


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def f0_track(x, hop=0.01, win=0.04):
    h, w = int(hop * SR), int(win * SR)
    out = []
    for i in range(0, len(x) - w, h):
        f = x[i:i + w] * np.hanning(w)
        if np.sqrt(np.mean(f ** 2)) < 0.02:
            continue
        ac = np.correlate(f, f, "full")[w - 1:]
        lo, hi = SR // 350, SR // 70
        k = lo + np.argmax(ac[lo:hi])
        if ac[k] > 0.45 * ac[0]:
            out.append(SR / k)
    return np.array(out)


def analyze(path, nwords):
    x = load(path)
    hop = int(0.02 * SR)
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9) for i in range(0, len(x) - hop, hop)])
    voiced = db > -45
    idx = np.where(voiced)[0]
    start, end = idx[0] * 0.02, (idx[-1] + 1) * 0.02
    gaps, run = [], 0
    for v in voiced[idx[0]:idx[-1]]:
        if not v:
            run += 1
        else:
            if run * 0.02 >= 0.15:
                gaps.append(round(run * 0.02, 2))
            run = 0
    f0 = f0_track(x)
    st = 12 * np.log2(np.percentile(f0, 90) / np.percentile(f0, 10))
    return dict(file=path, dur=round(len(x) / SR, 2), speech=[round(start, 2), round(end, 2)],
                wpm=round(nwords / (end - start) * 60), f0_med=round(float(np.median(f0))),
                range_st=round(float(st), 1), gaps=gaps)


if __name__ == "__main__":
    n = int(sys.argv[1])
    for p in sys.argv[2:]:
        print(json.dumps(analyze(p, n)))
