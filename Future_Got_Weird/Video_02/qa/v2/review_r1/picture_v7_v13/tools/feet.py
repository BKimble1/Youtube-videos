#!/usr/bin/env python3
"""feet.py s e x0 y0 x1 y1 [--rgb r,g,b --tol 40 --open 7]: per frame, find filled blobs of the shoe colour in the box
(morphological opening removes ink strokes), print each blob's bottom-centre. Used to check foot slide during contacts."""
import sys, subprocess, numpy as np, argparse
from scipy import ndimage as ndi
V="/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_REVIEW_r1.mp4"
ap=argparse.ArgumentParser(); ap.add_argument('s',type=int); ap.add_argument('e',type=int)
for k in ('x0','y0','x1','y1'): ap.add_argument(k,type=int)
ap.add_argument('--rgb',default='40,32,30'); ap.add_argument('--tol',type=float,default=40); ap.add_argument('--open',type=int,default=9); ap.add_argument('--minarea',type=int,default=150)
a=ap.parse_args(); W,H=1920,1080; c=np.array(list(map(int,a.rgb.split(','))))
t0=a.s/30
p=subprocess.Popen(["ffmpeg","-v","error","-ss",f"{max(0,t0-1):.4f}","-i",V,"-ss",f"{min(1,t0):.4f}","-frames:v",str(a.e-a.s+1),"-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
for i in range(a.e-a.s+1):
    b=p.stdout.read(W*H*3)
    if len(b)<W*H*3: break
    fr=np.frombuffer(b,np.uint8).reshape(H,W,3)[a.y0:a.y1,a.x0:a.x1].astype(int)
    m=np.abs(fr-c).sum(2)<a.tol
    m=ndi.binary_opening(m,structure=np.ones((a.open,a.open)))
    lab,n=ndi.label(m); out=[]
    for k in range(1,n+1):
        ys,xs=np.where(lab==k)
        if len(xs)<a.minarea: continue
        out.append((int(xs.mean())+a.x0,int(ys.max())+a.y0,len(xs)))
    out.sort()
    print(a.s+i, out)
