import soundfile as sf, numpy as np, json
from scipy import signal
R='/home/user/Youtube-videos/Future_Got_Weird/Video_02/'
D=R+'audio/mix/v2/'
SR=48000
tl=json.load(open(R+'source/src/data/timeline.json'))
V,_=sf.read(D+'stem_narration.wav',dtype='float32'); V=V.mean(1)
M,_=sf.read(D+'stem_music_ducked.wav',dtype='float32'); M=M.mean(1)
S,_=sf.read(D+'stem_sfx.wav',dtype='float32'); S=S.mean(1)
sos=signal.butter(4,[300,4000],'bandpass',fs=SR,output='sos')
def rc(x,win=0.1):
  n=int(win*SR);k=len(x)//n
  return 20*np.log10(np.sqrt((x[:k*n].reshape(k,n)**2).mean(1))+1e-9)
Vb,Mb,Sb=[signal.sosfiltfilt(sos,x) for x in (V,M,S)]
W=0.1
v,m,s=rc(V,W),rc(M,W),rc(S,W); vb,mb,sb=rc(Vb,W),rc(Mb,W),rc(Sb,W)
k=len(v)
core=v>-30
print('fraction core',core.mean())
print('scene | V core med | V-M med  p10  min | bandV-M med p10 | V-S med p10 | bandV-S med p10 | music in gaps (V<-45) med')
out={}
for sc in tl['scenes']:
  a,b=int(sc['from']/30/W),min(k,int(sc['to']/30/W))
  q=core[a:b]; g=(v[a:b]<-45)
  d=lambda x: x[a:b][q]
  r=[np.median(d(v)),np.median(d(v-m)),np.percentile(d(v-m),10),d(v-m).min(),np.median(d(vb-mb)),np.percentile(d(vb-mb),10),np.median(d(v-s)),np.percentile(d(v-s),10),np.median(d(vb-sb)),np.percentile(d(vb-sb),10), np.median(m[a:b][g]) if g.any() else np.nan]
  out[sc['id']]=[round(float(x),1) for x in r]
  print('%-4s | %6.1f | %5.1f %5.1f %5.1f | %5.1f %5.1f | %5.1f %5.1f | %5.1f %5.1f | %5.1f'%(sc['id'],*r))
json.dump(out,open(R+'qa/v2/review_r1/sound_sync/scene_ratios.json','w'),indent=1)
# whole film
q=core
print('ALL | V-M med %.1f p10 %.1f | V-S med %.1f p10 %.1f'%(np.median((v-m)[q]),np.percentile((v-m)[q],10),np.median((v-s)[q]),np.percentile((v-s)[q],10)))
