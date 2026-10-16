#!/usr/bin/env python3
"""Compare narration auditions without listening.
Usage: audition_metrics.py WORDS file.mp3 [...]
Per take: speech span and words/min (WORDS spoken words), pauses >=120 ms (count, longest, total), integrated
loudness, pitch movement (autocorrelation F0 on voiced 40 ms frames: median Hz and 10–90 % range in semitones),
and spectral centroid (a rough 'brightness/crispness' proxy). None of this replaces one human listen."""
import re, subprocess, sys
import numpy as np

SR = 16000

def pcm(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768

def f0_track(x):
    hop, win = 160, 640
    out = []
    for i in range(0, len(x) - win, hop):
        fr = x[i:i + win] * np.hanning(win)
        if np.sqrt(np.mean(fr ** 2)) < 0.02:
            continue
        ac = np.correlate(fr, fr, 'full')[win - 1:]
        lo, hi = SR // 400, SR // 70           # 70–400 Hz
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.45 * ac[0]:
            out.append(SR / k)
    return np.array(out)

words = int(sys.argv[1])
for f in sys.argv[2:]:
    x = pcm(f)
    dur = len(x) / SR
    sil = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-af', 'silencedetect=n=-38dB:d=0.12', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', sil)]
    en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', sil)]
    onset = en[0] if st and st[0] < 0.02 and en else 0.0
    tail = st[-1] if st and len(en) < len(st) else dur
    pauses = [e - s for s, e in zip(st, en) if s > onset + 0.01 and e < tail - 0.01]
    loud = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-'],
                          capture_output=True, text=True).stderr
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', loud)[-1]
    f0 = f0_track(x)
    semis = 12 * np.log2(np.percentile(f0, 90) / np.percentile(f0, 10)) if len(f0) > 10 else float('nan')
    spec = np.abs(np.fft.rfft(x[: len(x) // 2048 * 2048].reshape(-1, 2048) * np.hanning(2048), axis=1))
    fr = np.fft.rfftfreq(2048, 1 / SR)
    e = spec.sum(1); keep = e > np.percentile(e, 40)
    centroid = float(np.median((spec[keep] * fr).sum(1) / spec[keep].sum(1)))
    span = tail - onset
    print(f'{f.split("/")[-1]}: span {span:.2f}s ({onset:.2f}-{tail:.2f})  {60 * words / span:.0f} wpm  '
          f'pauses {len(pauses)} (max {max(pauses, default=0):.2f}s, sum {sum(pauses):.2f}s)  I {I} LUFS  '
          f'F0 med {np.median(f0):.0f} Hz, range {semis:.1f} st  centroid {centroid:.0f} Hz')
