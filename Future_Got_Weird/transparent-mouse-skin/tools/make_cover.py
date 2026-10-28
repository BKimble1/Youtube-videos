#!/usr/bin/env python3
"""Cover frames from the film's own artwork, rendered natively at 2160x3840 (and a 1080x1920 copy): the plain frame
(no captions), and the same frame with a brief "SEE-THROUGH SKIN" treatment for the cover only.
usage: python3 tools/make_cover.py <frame number>"""
import os, subprocess, sys
from PIL import Image
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
f = int(sys.argv[1]); t = f / 30
os.makedirs(os.path.join(EP, 'cover'), exist_ok=True)
for title in (False, True):
    out = os.path.join(EP, f'cover/FGW_Transparent_Mouse_Skin_V1_cover_f{f}_{t:.2f}s{"_titled" if title else ""}_2160x3840.png')
    subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', 'Cover', out, '--scale=2', f'--props={{"f":{f},"title":{str(title).lower()}}}', '--log=error'], cwd=os.path.join(EP, 'source'), check=True)
    Image.open(out).convert('RGB').resize((1080, 1920), Image.LANCZOS).save(out.replace('2160x3840', '1080x1920'))
    print(out)
