#!/usr/bin/env python3
"""Word timeline + stress for narration takes. Zipformer token times give word starts; each start that follows a
pause is moved to the measured waveform onset (first 10 ms above -50 dBFS after >= 80 ms below -60 dBFS), so a cue can
never lead the sound. A word ends at the last 10 ms window above -40 dBFS before the next word starts.
Stress per word: RMS level (dB) and median F0 (autocorrelation) relative to the take's median word.
usage: python3 tools/word_timeline.py /tmp/asr <take.mp3> [out.json]"""
import sys, json, re
import numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
import asr_takes as A

def f0(seg, sr=16000):
    fr, hop, vals = 640, 160, []
    for i in range(0, len(seg) - fr, hop):
        x = seg[i:i + fr] * np.hanning(fr)
        if np.sqrt(np.mean(x ** 2)) < 0.01: continue
        ac = np.correlate(x, x, 'full')[fr - 1:]
        lo, hi = sr // 400, sr // 70
        k = lo + np.argmax(ac[lo:hi])
        if ac[k] > 0.4 * ac[0]: vals.append(sr / k)
    return float(np.median(vals)) if vals else None

def timeline(asr, path):
    zr, _ = A.recognizers(asr)
    y = A.load(path)
    zw = A.zip_words(A.run(zr, y))
    W = 160
    lv = 20 * np.log10(np.sqrt(np.array([np.mean(y[i:i + W] ** 2) for i in range(0, len(y) - W, W)])) + 1e-9)
    # align locked words to zipformer words (same count expected; fall back to difflib)
    import difflib
    zt = [re.sub(r"[^a-z']", '', w) for w, _ in zw]
    sm = difflib.SequenceMatcher(None, A.LW, zt, autojunk=False)
    starts = [None] * len(A.LW)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): starts[a + k] = zw[b + k][1]
    for i in range(len(starts)):
        if starts[i] is None: starts[i] = starts[i - 1] + 0.15
    out = []
    for i, w in enumerate(A.LW):
        s = starts[i]; i0 = int(s / 0.01)
        # pause-onset refinement
        for j in range(max(8, i0 - 45), min(len(lv), i0 + 35)):
            if lv[j] > -50 and lv[j - 8:j].max() < -60:
                if j * 0.01 > s - 0.45: s = max(s, j * 0.01)
                break
        out.append({'word': w, 'start': round(s, 3)})
    for i, o in enumerate(out):
        nxt = out[i + 1]['start'] if i + 1 < len(out) else len(y) / 16000
        a, b = int(o['start'] / 0.01), min(len(lv), int(nxt / 0.01))
        loud = [j for j in range(a, b) if lv[j] > -40]
        o['end'] = round(((loud[-1] + 1) * 0.01) if loud else nxt, 3)
        seg = y[int(o['start'] * 16000):int(o['end'] * 16000)]
        o['db'] = round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)), 2) if len(seg) else -90
        o['f0'] = f0(seg)
    md = np.median([o['db'] for o in out]); mf = np.median([o['f0'] for o in out if o['f0']])
    for o in out:
        o['rel_db'] = round(o['db'] - md, 2); o['rel_f0'] = round(o['f0'] / mf, 2) if o['f0'] else None
    return out, len(y) / 16000

if __name__ == '__main__':
    words, dur = timeline(sys.argv[1], sys.argv[2])
    KEY = ['shut', 'infrared', 'invisible', 'colors', 'eyelids', 'through', 'converted', 'flash', 'asleep', 'secret', 'code']
    seen = {}
    for o in words:
        if o['word'] in KEY: print(f"  {o['word']:10} {o['start']:6.2f}-{o['end']:6.2f}  {o['rel_db']:+5.1f} dB  F0x{o['rel_f0']}")
    if len(sys.argv) > 3: json.dump({'source': sys.argv[2], 'duration': dur, 'words': words}, open(sys.argv[3], 'w'), indent=1)
