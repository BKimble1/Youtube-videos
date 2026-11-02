#!/usr/bin/env python3
"""Extra QA for the review file: transition strips (every 2nd frame across each planned move/cut), a muted
phone-size sheet of the first two seconds, and the caption-free loop seam measurement (last frame vs frame 0 rendered
without captions, against the film's median frame step).
usage: python3 tools/qa_extra.py <video.mp4> <out_dir> <seam_last.png> <seam_first.png> <median_step>"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image
src, out, sl, sf_, med = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5])
os.makedirs(out, exist_ok=True)
E = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'audio/cues.json')))['EV']
here = os.path.dirname(os.path.abspath(__file__))
spans = [('widen', 1.2, 5.4), ('dive', E['dive0'] - 0.1, E['cutIn'] + 0.15), ('cut_in', E['cutIn'] - 0.1, E['cutIn'] + 0.1),
         ('cut_out', E['cutOut'] - 0.1, E['cutOut'] + 0.1), ('pullout', E['pull0'], E['pull1'] + 0.1), ('pushin', E['dive2a'] - 0.4, E['dive2b'] + 0.1),
         ('easeout', E['out0'] - 0.1, E['out1'] + 0.1), ('loop_wipe', E['wipe0'] - 0.05, 27.967)]
for name, a, b in spans:
    step = 1 if b - a < 0.5 else 2 if b - a < 1.4 else 4
    subprocess.run([sys.executable, os.path.join(here, 'strips.py'), src, f'{a:.3f}', f'{b:.3f}', str(step), os.path.join(out, f'strip_{name}_{a:.2f}-{b:.2f}s.png'), '0.18', '10'], check=True)
subprocess.run([sys.executable, os.path.join(here, 'strips.py'), src, '0', '2.0', '6', os.path.join(out, 'muted_phone_0-2s.png'), '0.3333', '6'], check=True)
A = np.asarray(Image.open(sl).convert('RGB').resize((270, 480)), np.float32)
B = np.asarray(Image.open(sf_).convert('RGB').resize((270, 480)), np.float32)
seam = float(np.abs(A - B).mean())
res = {'loop_seam_caption_free_mad': round(seam, 2), 'median_frame_step': med, 'ratio': round(seam / med, 2)}
json.dump(res, open(os.path.join(out, 'loop_seam_caption_free.json'), 'w'), indent=1)
print(json.dumps(res))
