#!/usr/bin/env python3
"""Contact sheet from a rendered MP4 (each tile is the real frame, so masks and ids behave exactly as in the film; an
in-DOM sheet of several frames would share SVG ids between tiles).  usage: sheet_from_mp4.py <mp4> <out.png> "f1,f2,..."
"""
import tempfile
import os, sys, subprocess
from PIL import Image, ImageDraw
src, out, frames = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
tiles = []
for f in frames:
    p = os.path.join(tempfile.gettempdir(), f'sheet_f{f}.png')
    subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-vf',f'select=eq(n\\,{f})','-vframes','1',p], check=True)
    im = Image.open(p).convert('RGB').resize((320,568)); d = ImageDraw.Draw(im); d.rectangle((0,0,120,22), fill=(0,0,0)); d.text((4,4), f'f{f} {f/30:.2f}s', fill=(255,255,255)); tiles.append(im)
cols = 6; rows = (len(tiles)+cols-1)//cols
S = Image.new('RGB', (320*cols, 568*rows))
for i, t in enumerate(tiles): S.paste(t, ((i%cols)*320, (i//cols)*568))
S.save(out)
