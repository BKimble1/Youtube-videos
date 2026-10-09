"""burst.py name cue before after [crop x,y,w,h] [cellw] [step] -> sheet png in out dir"""
import sys, subprocess, os, tempfile, glob
from PIL import Image, ImageDraw, ImageFont
VID='/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_REVIEW_r1.mp4'
OUT='/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/v2/review_r1/sound_sync/bursts'
os.makedirs(OUT,exist_ok=True)
name=sys.argv[1]; cue=int(sys.argv[2]); b=int(sys.argv[3]); a=int(sys.argv[4])
crop=sys.argv[5] if len(sys.argv)>5 and sys.argv[5]!='-' else None
cellw=int(sys.argv[6]) if len(sys.argv)>6 else 384
step=int(sys.argv[7]) if len(sys.argv)>7 else 1
f0=cue-b; n=b+a+1
td=tempfile.mkdtemp(dir='/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/ss')
vf=[]
if crop:
  x,y,w,h=crop.split(','); vf.append(f'crop={w}:{h}:{x}:{y}')
vf.append(f'scale={cellw}:-2')
subprocess.run(['ffmpeg','-v','error','-ss','%.4f'%(f0/30+0.001),'-i',VID,'-frames:v',str(n),'-vf',','.join(vf),os.path.join(td,'f%04d.png')],check=True)
fs=sorted(glob.glob(td+'/f*.png'))[::step]
frames=list(range(f0,f0+n))[::step]
im0=Image.open(fs[0]); W,H=im0.size
cols=min(6,len(fs)); rows=(len(fs)+cols-1)//cols
sheet=Image.new('RGB',(cols*W,rows*(H+18)),'white')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',13)
d=ImageDraw.Draw(sheet)
for i,(p,fr) in enumerate(zip(fs,frames)):
  im=Image.open(p); c,r=i%cols,i//cols
  sheet.paste(im,(c*W,r*(H+18)+18))
  col=(220,0,0) if fr==cue else (0,0,0)
  d.text((c*W+4,r*(H+18)+2),f'f{fr}  {fr/30:.2f}s'+('  <CUE' if fr==cue else ''),fill=col,font=font)
  if fr==cue: d.rectangle([c*W,r*(H+18)+18,c*W+W-1,r*(H+18)+18+H-1],outline=(220,0,0),width=3)
out=os.path.join(OUT,f'{name}_f{cue}.png'); sheet.save(out); print(out, sheet.size)
for p in glob.glob(td+'/*'): os.remove(p)
os.rmdir(td)
