"""Measured QA on the rendered review: stream properties, black frames, frozen stretches, silences, loudness,
contact sheets every 6 s and around the first 30 s / last 30 s. Writes qa/qa_results.json and qa/sheets/*.png."""
import json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = f'{ROOT}/exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4'
def run(a): return subprocess.run(a, capture_output=True, text=True)
p = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', V]).stdout)
vs = [s for s in p['streams'] if s['codec_type'] == 'video'][0]; au = [s for s in p['streams'] if s['codec_type'] == 'audio'][0]
r = {'file': os.path.basename(V), 'size_mb': round(int(p['format']['size']) / 2**20, 1), 'duration_s': float(p['format']['duration']),
     'video': {k: vs.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'pix_fmt', 'nb_frames', 'color_space']},
     'audio': {k: au.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate']}}
e = run(['ffmpeg', '-v', 'info', '-i', V, '-vf', 'blackdetect=d=0.25:pix_th=0.06,freezedetect=n=0.0008:d=1.2', '-af', 'silencedetect=n=-45dB:d=1.5,ebur128=peak=true', '-f', 'null', '-']).stderr
r['black'] = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', e)
fs = re.findall(r'freeze_start: ([\d.]+)', e); fe = re.findall(r'freeze_end: ([\d.]+)', e)
r['freeze'] = list(zip(fs, fe + ['end'] * (len(fs) - len(fe))))
ss = re.findall(r'silence_start: ([\d.]+)', e); se = re.findall(r'silence_end: ([\d.]+)', e)
r['silence'] = list(zip(ss, se + ['end'] * (len(ss) - len(se))))
m = re.search(r'Integrated loudness:\s+I:\s+([-\d.]+) LUFS.*?True peak:\s+Peak:\s+([-\d.]+) dBFS', e, re.S)
r['loudness_lufs'], r['true_peak_dbfs'] = (float(m.group(1)), float(m.group(2))) if m else (None, None)
os.makedirs(f'{ROOT}/qa/sheets', exist_ok=True)
def sheet(name, times):
    ins, fl = [], []
    for i, t in enumerate(times):
        ins += ['-ss', f'{t:.2f}', '-i', V]
        fl.append(f"[{i}:v]trim=end_frame=1,scale=384:-1,drawtext=text='{int(t//60)}\\:{t%60:05.2f}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6[v{i}]")
    cols = 5; lay = '|'.join(f'{(i%cols)*384}_{(i//cols)*216}' for i in range(len(times)))
    run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(fl) + ';' + ''.join(f'[v{i}]' for i in range(len(times))) + f'xstack=inputs={len(times)}:layout={lay}:fill=gray[o]', '-map', '[o]', '-frames:v', '1', f'{ROOT}/qa/sheets/{name}.png'])
D = r['duration_s']
sheet('first30', [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 23, 26, 29])
allt = [i * 6.0 for i in range(int(D // 6) + 1)]
for k in range(0, len(allt), 20): sheet(f'all_{k//20:02d}', allt[k:k + 20])
sheet('last30', [D - 30 + i * 1.5 for i in range(20)])
json.dump(r, open(f'{ROOT}/qa/qa_results.json', 'w'), indent=1)
print(json.dumps(r, indent=1))
