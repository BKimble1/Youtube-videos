"""V2 review QA from the rendered MP4: stream facts, loudness/true peak, black and frozen stretches, contact sheets
(first 30 s, whole film), and frame strips (every 2nd frame) across each real/drawn join and the key manoeuvres.
Writes qa/v2/review/*.png and qa/v2/qa_v2_results.json."""
import json, os, re, subprocess
ROOT = __file__.rsplit('/tools/', 1)[0]
MP4 = f'{ROOT}/exports/FGW_Starship_Dual_Catch_V2_REVIEW_1080p.mp4'
OUT = f'{ROOT}/qa/v2/review'
os.makedirs(OUT, exist_ok=True)
narr = json.load(open(f'{ROOT}/source/src/v2/data/narr.json'))
lines = {l['id']: l for l in narr['lines']}
secs = {s['id']: s for s in narr['sections']}

def run(*a):
    return subprocess.run(a, capture_output=True, text=True)

probe = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels,bit_rate:format=duration', '-of', 'json', MP4).stdout)
r = run('ffmpeg', '-nostats', '-i', MP4, '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
bl = run('ffmpeg', '-nostats', '-i', MP4, '-vf', 'blackdetect=d=0.25:pix_th=0.06', '-an', '-f', 'null', '-').stderr
blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bl)
fr = run('ffmpeg', '-nostats', '-i', MP4, '-vf', 'freezedetect=n=0.0015:d=1.5', '-an', '-f', 'null', '-').stderr
freezes = re.findall(r'freeze_start: ([\d.]+)', fr), re.findall(r'freeze_duration: ([\d.]+)', fr)
sil = run('ffmpeg', '-nostats', '-i', MP4, '-af', 'silencedetect=n=-50dB:d=1.5', '-vn', '-f', 'null', '-').stderr
silences = re.findall(r'silence_start: ([\d.]+)', sil)

def sheet(name, times, cols=6, w=320):
    ins, filt = [], []
    for i, t in enumerate(times):
        ins += ['-ss', f'{t:.3f}', '-i', MP4]
        filt.append(f'[{i}:v]trim=end_frame=1,scale={w}:-1,drawtext=text=\'{t:.2f}\':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6[v{i}]')
    h = int(w * 9 / 16)
    lay = '|'.join(f'{(i % cols) * w}_{(i // cols) * h}' for i in range(len(times)))
    run('ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt) + ';' + ''.join(f'[v{i}]' for i in range(len(times))) + f'xstack=inputs={len(times)}:layout={lay}:fill=gray[o]', '-map', '[o]', '-frames:v', '1', f'{OUT}/{name}.png')

dur = float(probe['format']['duration'])
sheet('first30', [i * 0.5 for i in range(60)], cols=10, w=192)
whole = [i * 5.0 for i in range(int(dur // 5) + 1)]
for k in range(0, len(whole), 36):
    sheet(f'whole_{k // 36}', whole[k:k + 36], cols=6, w=320)
def strip(name, t0, n=12, step=2 / 30):
    sheet(name, [t0 + i * step for i in range(n)], cols=6, w=320)
wt = lambda lid, w: next(x['s'] for x in narr['words'] if x['line'] == lid and re.sub(r'[^a-z]', '', x['w'].lower()) == w)
joins = {
    'join_hook_real_to_drawn': 3.4 - 0.2,
    'join_S2_into_real': secs['S2']['s'] - 1.05 - 0.2,
    'join_S2_real_to_drawn': wt('S2_02', 'load') - 2.6 - 0.2,
    'join_S3_orbit_to_real': lines['S3_03']['s'] - 0.1 - 0.2,
    'join_S3_real_to_tiles': lines['S3_04']['s'] + 0.05 - 0.2,
    'join_S9_into_real': lines['S9_06']['s'] - 0.25 - 0.2,
    'join_S9_real_to_drawn': lines['S9_07']['s'] - 0.2 - 0.2,
    'flip_S4': wt('S4_01', 'relight') - 0.2,
    'flip_S4_upright_to_tower': lines['S4_05']['s'] - 0.45,
    'drift': lines['S6_01']['s'] + 1.5,
    'tilt': lines['S6_02']['s'] + 1.5,
    'toofast': wt('S6_03', 'impact') - 0.6,
    'final_contact': wt('S9_04', 'meet') - 0.4,
}
for k, t in joins.items():
    strip(k, t, n=18 if k.startswith('flip') or k == 'final_contact' else 12)
res = {
    'file': os.path.relpath(MP4, ROOT), 'probe': probe, 'integrated_lufs': I, 'true_peak_dbtp': TP,
    'black_stretches': blacks, 'freezes_over_1_5s': list(zip(*freezes)), 'audio_silences_over_1_5s': silences,
    'joins_checked': {k: round(v, 2) for k, v in joins.items()},
}
json.dump(res, open(f'{ROOT}/qa/v2/qa_v2_results.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in res.items() if k != 'probe'}, indent=1))
print(probe['format'], [ (s.get('codec_name'), s.get('width'), s.get('height'), s.get('r_frame_rate')) for s in probe['streams']])
