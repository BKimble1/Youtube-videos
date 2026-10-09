#!/usr/bin/env python3
"""burst.py <start_frame> <end_frame> <step> <out.jpg> [--cols 4] [--w 640] [--crop x,y,w,h]
Decode exact frames [start,end] every <step> from the review render and tile them with frame labels."""
import sys, subprocess, numpy as np, argparse
from PIL import Image, ImageDraw, ImageFont
V="/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_REVIEW_r1.mp4"
ap=argparse.ArgumentParser(); ap.add_argument('s',type=int); ap.add_argument('e',type=int); ap.add_argument('step',type=int); ap.add_argument('out')
ap.add_argument('--cols',type=int,default=4); ap.add_argument('--w',type=int,default=640); ap.add_argument('--crop',default='')
a=ap.parse_args()
W,H=1920,1080
t0=a.s/30.0
n=a.e-a.s+1
p=subprocess.Popen(["ffmpeg","-v","error","-ss",f"{max(0,t0-1):.4f}","-i",V,"-ss",f"{min(1,t0):.4f}","-frames:v",str(n),"-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
frames=[]
for i in range(n):
    b=p.stdout.read(W*H*3)
    if len(b)<W*H*3: break
    if i % a.step==0: frames.append((a.s+i,np.frombuffer(b,np.uint8).reshape(H,W,3)))
p.wait()
tiles=[]
font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",18)
for f,fr in frames:
    im=Image.fromarray(fr)
    if a.crop:
        x,y,w,h=map(int,a.crop.split(',')); im=im.crop((x,y,x+w,y+h))
    r=a.w/im.width; im=im.resize((a.w,int(im.height*r)),Image.LANCZOS)
    c=Image.new('RGB',(im.width,im.height+24),'white'); c.paste(im,(0,24)); ImageDraw.Draw(c).text((4,2),f"f{f} {f/30:.2f}s",fill='black',font=font); tiles.append(c)
cols=min(a.cols,len(tiles)); rows=(len(tiles)+cols-1)//cols
tw,th=tiles[0].size
sheet=Image.new('RGB',(cols*tw+(cols-1)*4,rows*th+(rows-1)*4),'#888')
for i,t in enumerate(tiles): sheet.paste(t,((i%cols)*(tw+4),(i//cols)*(th+4)))
sheet.save(a.out,quality=92)
print(a.out,len(tiles))
