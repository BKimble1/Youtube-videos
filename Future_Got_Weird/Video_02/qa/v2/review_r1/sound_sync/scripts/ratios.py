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
def rc(x,win=0.05):
  n=int(win*SR);k=len(x)//n
  return 20*np.log10(np.sqrt((x[:k*n].reshape(k,n)**2).mean(1))+1e-9)
Vb,Mb,Sb=[signal.sosfiltfilt(sos,x) for x in (V,M,S)]
v,m,s=rc(V),rc(M),rc(S); vb,mb,sb=rc(Vb),rc(Mb),rc(Sb)
k=min(map(len,(v,m,s)))
# speech mask from word frames
wm=np.zeros(k,bool)
for sg in tl['segments']:
  for w in sg['words']:
    a=int(w['from']/30/0.05); b=int((w['to']+1)/30/0.05)
    wm[a:b]=True
sp=wm&(v>-45)
print('scene  V(med)  M(med,spk)  V-M med  V-M p5  | band V-M med p5 | V-S med  V-S p5  n(S>=V-6) n(S>=V-3) | band V-S p5, n(Sb>=Vb-6)')
res={}
for sc in tl['scenes']:
  a,b=int(sc['from']/30/0.05),min(k,int(sc['to']/30/0.05))
  q=sp[a:b]
  dvm=(v-m)[a:b][q]; dvs=(v-s)[a:b][q]; dbm=(vb-mb)[a:b][q]; dbs=(vb-sb)[a:b][q]
  r=dict(V=np.median(v[a:b][q]),M=np.median(m[a:b][q]),vm=np.median(dvm),vm5=np.percentile(dvm,5),bvm=np.median(dbm),bvm5=np.percentile(dbm,5),vs=np.median(dvs),vs5=np.percentile(dvs,5),n6=int((dvs<=6).sum()),n3=int((dvs<=3).sum()),bvs5=np.percentile(dbs,5),bn6=int((dbs<=6).sum()))
  res[sc['id']]={kk:round(float(vv),1) for kk,vv in r.items()}
  print('%-4s %6.1f %8.1f %8.1f %7.1f | %6.1f %6.1f | %6.1f %6.1f %5d %5d | %6.1f %5d'%(sc['id'],r['V'],r['M'],r['vm'],r['vm5'],r['bvm'],r['bvm5'],r['vs'],r['vs5'],r['n6'],r['n3'],r['bvs5'],r['bn6']))
# gaps: music level when not speaking
json.dump(res,open('/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/v2/review_r1/sound_sync/scene_ratios.json','w'),indent=1)
# list all 50ms windows during words with S>=V-6 (full band), grouped
idx=np.where(sp&((v-s)<=6))[0]
groups=[]
for i in idx:
  if groups and i-groups[-1][1]<=3: groups[-1][1]=i; groups[-1][2]=min(groups[-1][2],(v-s)[i])
  else: groups.append([i,i,(v-s)[i]])
print('\nwindows during words with effects within 6 dB of voice (full band):')
for g in groups: print(' %.2f-%.2f s fr %d-%d  min V-S %.1f'%(g[0]*0.05,(g[1]+1)*0.05,int(g[0]*0.05*30),int((g[1]+1)*0.05*30),g[2]))
idx=np.where(sp&((vb-sb)<=6))[0]
groups=[]
for i in idx:
  if groups and i-groups[-1][1]<=3: groups[-1][1]=i; groups[-1][2]=min(groups[-1][2],(vb-sb)[i])
  else: groups.append([i,i,(vb-sb)[i]])
print('\nwindows during words with effects within 6 dB of voice (300-4k band):')
for g in groups: print(' %.2f-%.2f s fr %d-%d  min V-S %.1f'%(g[0]*0.05,(g[1]+1)*0.05,int(g[0]*0.05*30),int((g[1]+1)*0.05*30),g[2]))
idx=np.where(sp&((vb-mb)<=10))[0]
groups=[]
for i in idx:
  if groups and i-groups[-1][1]<=3: groups[-1][1]=i; groups[-1][2]=min(groups[-1][2],(vb-mb)[i])
  else: groups.append([i,i,(vb-mb)[i]])
print('\nwindows during words with music within 10 dB of voice (300-4k band):')
for g in groups: print(' %.2f-%.2f s fr %d-%d  min V-M %.1f'%(g[0]*0.05,(g[1]+1)*0.05,int(g[0]*0.05*30),int((g[1]+1)*0.05*30),g[2]))
