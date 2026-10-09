import sys, subprocess, os, tempfile, json
from PIL import Image, ImageDraw, ImageFont
VID='/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_REVIEW_r1.mp4'
OUT='/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/v2/review_r1/sound_sync/'
items=[x.split(':') for x in sys.argv[2].split(';')]
name=sys.argv[1]
td=tempfile.mkdtemp(dir='/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/ss')
W=480;H=270
cols=4; rows=(len(items)+cols-1)//cols
sheet=Image.new('RGB',(cols*W,rows*(H+18)),'white'); d=ImageDraw.Draw(sheet)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',13)
for i,(lab,fr) in enumerate(items):
  fr=int(fr); p=os.path.join(td,f'{i}.png')
  subprocess.run(['ffmpeg','-v','error','-ss','%.4f'%(fr/30+0.001),'-i',VID,'-frames:v','1','-vf',f'scale={W}:{H}',p],check=True)
  c,r=i%cols,i//cols
  sheet.paste(Image.open(p),(c*W,r*(H+18)+18)); d.text((c*W+4,r*(H+18)+2),f'{lab} f{fr}',fill=(0,0,0),font=font)
  os.remove(p)
os.rmdir(td)
sheet.save(OUT+name+'.png'); print(OUT+name+'.png')
