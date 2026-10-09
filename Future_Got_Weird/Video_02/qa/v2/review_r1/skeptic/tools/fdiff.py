#!/usr/bin/env python3
"""fdiff.py a b [crop x,y,w,h] -> per-frame mean abs diff and std, seeking at a/30"""
import sys, subprocess, numpy as np
V="/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_REVIEW_r1.mp4"
a,b=int(sys.argv[1]),int(sys.argv[2]); n=b-a+1
W,H=1920,1080
p=subprocess.run(["ffmpeg","-v","error","-ss",f"{a/30:.4f}","-i",V,"-frames:v",str(n),"-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True)
buf=p.stdout
fr=[np.frombuffer(buf[i*W*H*3:(i+1)*W*H*3],np.uint8).reshape(H,W,3).astype(np.int16) for i in range(len(buf)//(W*H*3))]
if len(sys.argv)>3:
    x,y,w,h=map(int,sys.argv[3].split(',')); fr=[f[y:y+h,x:x+w] for f in fr]
prev=None
for i,f in enumerate(fr):
    d = np.abs(f-prev).mean() if prev is not None else 0
    print(a+i, f"diff={d:6.2f} std={f.std():6.2f} mean={f.mean():6.1f}")
    prev=f
