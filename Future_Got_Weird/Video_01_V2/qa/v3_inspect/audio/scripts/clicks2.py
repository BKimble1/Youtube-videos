import json, numpy as np, soundfile as sf
from scipy import signal
from scipy.ndimage import uniform_filter1d, median_filter
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000
def tc(s): return '%d:%06.3f'%(s//60,s%60)
for name,p in [('narration',f'{R}/source/public/audio/narration.wav'),('stem_sfx',f'{R}/audio/mix/v2/stem_sfx.wav'),('final_mix',f'{R}/audio/mix/v2/final_mix.wav'),('music',f'{R}/audio/mix/v2/stem_music_ducked.wav')]:
    x,_=sf.read(p,always_2d=True); s=x[:,0]
    d2=np.diff(s,2,prepend=[s[0],s[0]])
    loc=np.sqrt(uniform_filter1d(d2**2,481))+1e-12
    r=np.abs(d2)/loc
    ev=[]; last=-1e9
    for i in np.argsort(-r)[:4000]:
        if abs(d2[i])<10**(-70/20): continue
        if all(abs(i-j)>480 for j,_ in ev): ev.append((i,r[i]))
        if len(ev)>=8: break
    print(name,'top ratio events:',[(tc(i/SR),round(float(v),1),round(float(20*np.log10(abs(d2[i]))),1)) for i,v in ev])
    # HF frame-jump glitch detector (v2_takes style)
    hp=signal.sosfilt(signal.butter(4,4000,'highpass',fs=SR,output='sos'),x.mean(1))
    H=240; n=len(hp)//H; db=20*np.log10(np.sqrt((hp[:n*H].reshape(n,H)**2).mean(1))+1e-10)
    c=db[1:-1]; jump=np.minimum(c-db[:-2],c-db[2:])
    idx=np.where((jump>18)&(c>np.percentile(db,90)))[0]
    print('   HF frame-jump glitches (>18 dB over both neighbours, top-10% level):',len(idx),[tc((i+1)*H/SR) for i in idx[:20]])
