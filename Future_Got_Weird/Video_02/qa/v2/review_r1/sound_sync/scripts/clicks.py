import soundfile as sf, numpy as np, json
from scipy.ndimage import uniform_filter1d
R='/home/user/Youtube-videos/Future_Got_Weird/Video_02/'
tl=json.load(open(R+'source/src/data/timeline.json'))
cuts=[s['from']/30 for s in tl['scenes']]
segb=sorted([s['from']/30 for s in tl['segments']]+[s['to']/30 for s in tl['segments']])
for name in ['audio/mix/v2/stem_narration.wav','audio/mix/v2/stem_music_ducked.wav','audio/mix/v2/stem_sfx.wav','audio/mix/v2/final_mix.wav','qa/v2/review_r1/sound_sync/render.wav']:
  x,sr=sf.read(R+name,dtype='float64'); x=x.mean(1)
  d2=np.abs(np.diff(x,2))
  loc=np.sqrt(uniform_filter1d(d2**2,int(0.02*sr)))+1e-7
  amp=np.sqrt(uniform_filter1d(x**2,int(0.02*sr)))
  r=d2/loc
  idx=np.where((r>25)&(d2>1e-3))[0]
  ev=[]
  for i in idx:
    if ev and i-ev[-1][0]<int(0.05*sr): continue
    ev.append((i,r[i],d2[i]))
  print(name, 'n events', len(ev))
  for i,rr,dd in ev[:40]:
    t=i/sr
    nc=min(cuts,key=lambda c:abs(c-t)); ns=min(segb,key=lambda c:abs(c-t))
    print('   t=%.3f f%d ratio %.0f d2 %.4f | nearest cut %.3f (%+.3f) seg-edge %+.3f'%(t,int(t*30),rr,dd,nc,t-nc,t-ns))
