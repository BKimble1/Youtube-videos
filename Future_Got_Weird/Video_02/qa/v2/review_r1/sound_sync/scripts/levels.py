import soundfile as sf, numpy as np, json
R='/home/user/Youtube-videos/Future_Got_Weird/Video_02/'
D=R+'audio/mix/v2/'
SR=48000
V,_=sf.read(D+'stem_narration.wav',dtype='float32')
M,_=sf.read(D+'stem_music_ducked.wav',dtype='float32')
S,_=sf.read(D+'stem_sfx.wav',dtype='float32')
X,_=sf.read(D+'final_mix.wav',dtype='float32')
np.save('/tmp/claude-0/-home-user-Youtube-videos/30d53758-3f65-58ef-8706-5dc1f2b4b0af/scratchpad/ss/dummy.npy',np.zeros(1))
sumx=V+M+S
# limiter gain reduction per 10 ms
w=480;k=len(X)//w
def pk(a): return np.abs(a[:k*w].reshape(k,w,2)).max(axis=(1,2))
ps=pk(sumx); px=pk(X)
gr=20*np.log10(px+1e-9)-20*np.log10(ps+1e-9)
idx=np.where(gr<-1.0)[0]
print('limiter GR >1 dB windows:',len(idx))
# group
groups=[]
for i in idx:
  if groups and i-groups[-1][1]<=10: groups[-1][1]=i; groups[-1][2]=min(groups[-1][2],gr[i])
  else: groups.append([i,i,gr[i]])
for g in groups: print(' t %.2f-%.2f s  max GR %.1f dB  frame %d'%(g[0]*0.01,g[1]*0.01,g[2],int(g[0]*0.01*30)))
print('max sample of sum',np.abs(sumx).max(), 'mix', np.abs(X).max())
