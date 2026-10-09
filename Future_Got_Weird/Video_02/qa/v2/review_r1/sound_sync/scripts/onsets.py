import soundfile as sf, numpy as np, json
R='/home/user/Youtube-videos/Future_Got_Weird/Video_02/'
SR=48000
pl=json.load(open(R+'audio/sfx/v2/placed.json'))
x,_=sf.read(R+'audio/sfx/v2/sfx_track.wav',dtype='float32'); x=np.abs(x).max(1)
h=int(0.005*SR)
env=np.array([x[i:i+h].max() for i in range(0,len(x)-h,h)])  # 5 ms peak env
edb=20*np.log10(env+1e-9)
res=[]
for e in pl:
  if e['kind'].startswith('amb'): continue
  c=e['f']/30
  a=int((c-0.25)/0.005); b=int((c+0.25)/0.005)
  seg=edb[a:b]
  d=np.diff(seg)
  i=np.argmax(d)  # sharpest rise
  pk=np.argmax(seg)
  t_on=(a+i+1)*0.005; t_pk=(a+pk)*0.005
  res.append((e['scene'],e['f'],e['kind'],round((t_on-c)*1000),round((t_pk-c)*1000),round(seg.max(),1)))
for r in res: print(r)
