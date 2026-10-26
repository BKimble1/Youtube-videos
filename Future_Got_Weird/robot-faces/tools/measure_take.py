#!/usr/bin/env python3
"""Measure a narration take: duration, speech span, pauses (>=0.18 s below -45 dBFS) and words/minute.
usage: measure_take.py <take.mp3> <word_count>"""
import sys, subprocess, re
f, n = sys.argv[1], int(sys.argv[2])
out = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'silencedetect=n=-45dB:d=0.18', '-f', 'null', '-'], capture_output=True, text=True).stderr
dur = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', out).groups()[2]) + 60 * int(re.search(r'Duration: (\d+):(\d+)', out).group(2))
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
pauses = list(zip(st, en))
s0 = en[0] if st and st[0] < 0.05 else 0.0
s1 = st[-1] if st and (len(en) < len(st) or en[-1] > dur - 0.05) else dur
inner = [(a, b) for a, b in pauses if a > s0 + 0.01 and b < s1 - 0.01]
sp = s1 - s0
print(f'{f}: dur {dur:.2f} speech {s0:.2f}-{s1:.2f} ({sp:.2f}s) {n} words -> {60*n/sp:.0f} wpm; pauses {len(inner)} total {sum(b-a for a,b in inner):.2f}s; articulated {60*n/(sp-sum(b-a for a,b in inner)):.0f} wpm')
