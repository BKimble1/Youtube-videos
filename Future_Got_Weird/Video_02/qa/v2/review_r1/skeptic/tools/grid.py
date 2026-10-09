#!/usr/bin/env python3
"""grid.py out.png tile_w cols f1 f2 ... : full frames scaled to tile_w, labelled"""
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont
V="/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_REVIEW_r1.mp4"
out=sys.argv[1]; tw=int(sys.argv[2]); cols=int(sys.argv[3]); fs=[int(x) for x in sys.argv[4:]]
W,H=1920,1080; th=int(tw*H/W)
F=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",13)
rows=(len(fs)+cols-1)//cols
sheet=Image.new("RGB",(cols*tw,rows*(th+16)),"white"); d=ImageDraw.Draw(sheet)
for k,f in enumerate(fs):
    p=subprocess.run(["ffmpeg","-v","error","-ss",f"{f/30:.4f}","-i",V,"-frames:v","1","-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True)
    im=Image.fromarray(np.frombuffer(p.stdout[:W*H*3],np.uint8).reshape(H,W,3)).resize((tw,th),Image.LANCZOS)
    x,y=(k%cols)*tw,(k//cols)*(th+16); sheet.paste(im,(x,y+16)); d.text((x+3,y+1),f"f{f}",fill="black",font=F)
sheet.save(out)
