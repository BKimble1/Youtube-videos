#!/usr/bin/env python3
"""textbox.py <png> x0 y0 x1 y1 [--dark 110] : within the box, find rows/cols with dark ink (luma < dark)
and print ink bbox, and per-line vertical runs (text lines). Font size ~ cap-height/0.70 or line ink height (asc+desc)/~0.95."""
import sys, numpy as np
from PIL import Image
p=sys.argv[1]; x0,y0,x1,y1=map(int,sys.argv[2:6]); dark=int(sys.argv[7]) if len(sys.argv)>7 else 110
a=np.asarray(Image.open(p).convert('L')).astype(int)[y0:y1,x0:x1]
m=a<dark
rows=np.where(m.any(1))[0]; cols=np.where(m.any(0))[0]
if len(rows)==0: print('no ink'); sys.exit()
print('ink bbox x',x0+cols[0],x0+cols[-1],'y',y0+rows[0],y0+rows[-1])
# runs of rows
runs=[];s=rows[0];prev=rows[0]
for r in rows[1:]:
    if r!=prev+1: runs.append((s,prev)); s=r
    prev=r
runs.append((s,prev))
for s,e in runs: print(' line y',y0+s,y0+e,'h',e-s+1)
