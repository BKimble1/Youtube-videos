"""V4 review QA from the rendered MP4: stream facts, loudness/true peak, black and frozen stretches, contact sheets,
frame strips (every 2nd frame) across every real/drawn boundary taken from the shot list plus the flip, contact and
end-screen entrance, the end-frame PNG, and a stillness measurement inside the two end-screen panels.
Writes qa/v4/review/*.jpg, qa/v4/FGW_Starship_Dual_Catch_V4_END_FRAME.png and qa/v4/qa_v4_results.json."""
import json, os, re, subprocess
import numpy as np
ROOT = __file__.rsplit('/tools/', 1)[0]
MP4 = f'{ROOT}/exports/FGW_Starship_Dual_Catch_V4_REVIEW_1080p.mp4'
OUT = f'{ROOT}/qa/v4/review'
os.makedirs(OUT, exist_ok=True)
narr = json.load(open(f'{ROOT}/source/src/v4/data/narr.json'))
shots = json.load(open(f'{ROOT}/qa/v4/shotlist.json'))  # node source/shotlist.mjs v4
FILM_END = narr['duration'] + 2.0
END_A = FILM_END - 15
PANELS = [(180, 360, 660, 371), (1080, 360, 660, 371)]

def run(*a):
    return subprocess.run(a, capture_output=True, text=True)

probe = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels,bit_rate:format=duration', '-of', 'json', MP4).stdout)
r = run('ffmpeg', '-nostats', '-i', MP4, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
bl = run('ffmpeg', '-nostats', '-i', MP4, '-vf', 'blackdetect=d=0.25:pix_th=0.06', '-an', '-f', 'null', '-').stderr
blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bl)
fr = run('ffmpeg', '-nostats', '-i', MP4, '-vf', 'freezedetect=n=0.0015:d=1.5', '-an', '-f', 'null', '-').stderr
freezes = list(zip(re.findall(r'freeze_start: ([\d.]+)', fr), re.findall(r'freeze_duration: ([\d.]+)', fr)))
sil = run('ffmpeg', '-nostats', '-i', MP4, '-af', 'silencedetect=n=-50dB:d=1.5', '-vn', '-f', 'null', '-').stderr
silences = re.findall(r'silence_start: ([\d.]+)', sil)

def sheet(name, times, cols=6, w=320):
    ins, filt = [], []
    for i, t in enumerate(times):
        ins += ['-ss', f'{t:.3f}', '-i', MP4]
        filt.append(f'[{i}:v]trim=end_frame=1,scale={w}:-1,drawtext=text=\'{t:.2f}\':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6[v{i}]')
    h = int(w * 9 / 16)
    lay = '|'.join(f'{(i % cols) * w}_{(i // cols) * h}' for i in range(len(times)))
    run('ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt) + ';' + ''.join(f'[v{i}]' for i in range(len(times))) + f'xstack=inputs={len(times)}:layout={lay}:fill=gray[o]', '-map', '[o]', '-frames:v', '1', '-q:v', '3', f'{OUT}/{name}.jpg')

dur = float(probe['format']['duration'])
sheet('first30', [i * 0.5 for i in range(60)], cols=10, w=192)
whole = [i * 5.0 for i in range(int(dur // 5) + 1)]
for k in range(0, len(whole), 36):
    sheet(f'whole_{k // 36}', whole[k:k + 36], cols=6, w=320)
def strip(name, t0, n=12, step=2 / 30):
    sheet(name, [max(0, t0) + i * step for i in range(n)], cols=6, w=320)
wt = lambda lid, w: next(x['s'] for x in narr['words'] if x['line'] == lid and re.sub(r'[^a-z]', '', x['w'].lower()) == w)
joins = {}
for a, b in zip(shots, shots[1:]):
    if 'real' in a['id'] or 'real' in b['id']:
        joins[f"join_{a['id']}__{b['id']}"] = b['a'] - 0.2
joins.update({
    'flip_ocean_relight': wt('S4_01', 'relight') - 0.4,
    'closing_relight_flip': wt('S9_03', 'engines') - 0.2,
    'closing_contact': wt('S9_04', 'meet') - 0.4,
    'endscreen_entrance': END_A - 0.2,
})
for k, t in joins.items():
    strip(k, t, n=18 if k.startswith(('flip', 'closing')) else 12)

# end frame and panel stillness: mean absolute difference inside each panel between the settled entrance and the end
end_png = f'{ROOT}/qa/v4/FGW_Starship_Dual_Catch_V4_END_FRAME.png'
run('ffmpeg', '-v', 'error', '-y', '-sseof', '-0.1', '-i', MP4, '-frames:v', '1', end_png)
def frame(t):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', MP4, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout, np.uint8).reshape(1080, 1920, 3).astype(float)
f0, f1 = frame(END_A + 0.7), frame(FILM_END - 0.1)
still = [round(float(np.abs(f0[y + 8:y + h - 8, x + 8:x + w - 8] - f1[y + 8:y + h - 8, x + 8:x + w - 8]).mean()), 3) for (x, y, w, h) in PANELS]
res = {
    'file': os.path.relpath(MP4, ROOT), 'probe': probe, 'integrated_lufs': I, 'true_peak_dbtp': TP,
    'black_stretches': blacks, 'freezes_over_1_5s': freezes, 'audio_silences_over_1_5s': silences,
    'end_screen': {'start_s': round(END_A, 2), 'end_s': round(FILM_END, 2), 'panels_xywh': PANELS,
                   'panel_mean_abs_diff_entrance_settled_vs_last_frame': still},
    'joins_checked': {k: round(v, 2) for k, v in joins.items()},
}
json.dump(res, open(f'{ROOT}/qa/v4/qa_v4_results.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in res.items() if k not in ('probe', 'joins_checked')}, indent=1))
print(probe['format'], [(s.get('codec_name'), s.get('width'), s.get('height'), s.get('r_frame_rate')) for s in probe['streams']])
