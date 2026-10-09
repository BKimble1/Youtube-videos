import soundfile as sf, numpy as np, json
from scipy import signal
R='/home/user/Youtube-videos/Future_Got_Weird/Video_02/'
D=R+'audio/mix/v2/'
SR=48000
tl=json.load(open(R+'source/src/data/timeline.json'))
pl=json.load(open(R+'audio/sfx/v2/placed.json'))
V,_=sf.read(D+'stem_narration.wav',dtype='float32'); V=V.mean(1)
M,_=sf.read(D+'stem_music_ducked.wav',dtype='float32'); M=M.mean(1)
S,_=sf.read(D+'stem_sfx.wav',dtype='float32'); S=S.mean(1)
sos=signal.butter(4,[300,4000],'bandpass',fs=SR,output='sos')
Vb,Sb,Mb=[signal.sosfiltfilt(sos,x) for x in (V,S,M)]
words=[(w['from'],w['to'],w['w'],sg['id']) for sg in tl['segments'] for w in sg['words']]
def lv(x,t0,t1):
  a,b=int(t0*SR),int(t1*SR); return 20*np.log10(np.sqrt((x[a:b]**2).mean())+1e-9)
for T in [2.8,107.0,110.6,110.8,237.3,237.4,291.4,297.5,297.7,307.9,311.2]:
  f=T*30
  print('=== %.1f s (frame %d)'%(T,f))
  print('  words:',[ (w[2],w[0],w[1]) for w in words if w[1]>=f-12 and w[0]<=f+12])
  print('  effects placed within -2.5..+0.3 s:',[(e['kind'],e['f'],e['t'],e['gain'],e['note']) for e in pl if T-2.5<=e['t']<=T+0.3 and not e['kind'].startswith('amb')])
  row=[]
  for dt in np.arange(-0.4,0.45,0.05):
    t=T+dt
    row.append('%+.2f V%5.1f S%5.1f M%5.1f | bV%5.1f bS%5.1f'%(dt,lv(V,t,t+0.05),lv(S,t,t+0.05),lv(M,t,t+0.05),lv(Vb,t,t+0.05),lv(Sb,t,t+0.05)))
  print('\n'.join('   '+r for r in row))
