#!/usr/bin/env python3
"""Measured QA of a rendered file (not a substitute for watching it):

  python3 tools/qa.py exports/<file>.mp4 [out.json]

Streams and durations, static holds >= 1.5 s (freezedetect), black frames (blackdetect), single-frame "pops" (a frame
that differs strongly from both neighbours while they match each other), and loudness / true peak (ebur128).
Writes qa/qa_results.json (or the given path)."""
import json, os, re, subprocess, sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def main(path, out):
    pr = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]).stdout)
    v = next(s for s in pr['streams'] if s['codec_type'] == 'video')
    a = next((s for s in pr['streams'] if s['codec_type'] == 'audio'), None)
    res = {'file': os.path.relpath(path, ROOT), 'size_bytes': int(pr['format']['size']), 'duration_s': float(pr['format']['duration']),
           'video': {k: v.get(k) for k in ('codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'pix_fmt', 'color_space', 'color_primaries', 'color_transfer', 'nb_frames', 'duration')},
           'audio': a and {k: a.get(k) for k in ('codec_name', 'sample_rate', 'channels', 'bit_rate', 'duration')}}
    e = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vf', 'scale=480:-2,freezedetect=n=0.0015:d=1.5,blackdetect=d=0.1:pic_th=0.98', '-map', '0:v', '-f', 'null', '-']).stderr
    res['holds'] = [{'start': float(m.group(1))} for m in re.finditer(r'freeze_start: ([\d.]+)', e)]
    for i, m in enumerate(re.finditer(r'freeze_duration: ([\d.]+)', e)):
        if i < len(res['holds']):
            res['holds'][i]['duration'] = float(m.group(1))
    res['black'] = [{'start': float(m.group(1)), 'end': float(m.group(2))} for m in re.finditer(r'black_start:([\d.]+) black_end:([\d.]+)', e)]
    # pops: per-frame mean abs difference at 160x90
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', 'scale=160:90,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 90, 160).astype(np.float32)
    d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
    pops = []
    for i in range(1, len(fr) - 1):
        a_, b_ = d[i - 1], d[i]
        skip = np.abs(fr[i + 1] - fr[i - 1]).mean()
        if a_ > 6 and b_ > 6 and skip < 0.35 * min(a_, b_):
            pops.append({'frame': i, 't': round(i / 30, 2), 'diff_in': round(float(a_), 1), 'diff_out': round(float(b_), 1), 'skip': round(float(skip), 1)})
    res['single_frame_pops'] = pops
    cuts = [round((i + 1) / 30, 2) for i in range(len(d)) if d[i] > 25]
    res['large_frame_changes_s'] = cuts
    if a:
        lo = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
        summ = lo[lo.rindex('Summary:'):]
        g = lambda tag: float([l for l in summ.splitlines() if l.strip().startswith(tag)][0].split()[1])
        res['loudness'] = {'integrated_lufs': g('I:'), 'lra_lu': g('LRA:'), 'true_peak_dbtp': g('Peak:')}
        res['av_duration_diff_s'] = round(abs(float(v.get('duration', 0)) - float(a.get('duration', 0))), 3)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(res, open(out, 'w'), indent=1)
    print(json.dumps({k: res[k] for k in ('duration_s', 'holds', 'black', 'single_frame_pops', 'loudness', 'av_duration_diff_s') if k in res}, indent=1))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'qa/qa_results.json'))
