#!/usr/bin/env python3
"""Measure narration takes without listening: speech span, pauses, loudness, true peak.
Usage: analyze_takes.py file.mp3 [...]   (prints one compact block per take)"""
import re, subprocess, sys

def run(args):
    return subprocess.run(args, capture_output=True, text=True).stderr

for f in sys.argv[1:]:
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                               capture_output=True, text=True).stdout)
    sil = run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-af', 'silencedetect=n=-38dB:d=0.12', '-f', 'null', '-'])
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', sil)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', sil)]
    loud = run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    summ = loud[loud.rfind('Summary:'):]
    I = re.search(r'I:\s+(-?[\d.]+) LUFS', summ); TP = re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ)
    onset = ends[0] if starts and starts[0] < 0.02 and ends else 0.0
    tail = starts[-1] if starts and (len(ends) < len(starts)) else dur
    pauses = [(round(s, 2), round(e - s, 2)) for s, e in zip(starts, ends) if s > 0.02 and e < dur - 0.02]
    print(f'{f}: dur {dur:.2f}s  speech {onset:.2f}-{tail:.2f}s ({tail-onset:.2f}s)  I {I.group(1) if I else "?"} LUFS  TP {TP.group(1) if TP else "?"} dBFS')
    if pauses:
        print('   pauses (start, len):', pauses)
