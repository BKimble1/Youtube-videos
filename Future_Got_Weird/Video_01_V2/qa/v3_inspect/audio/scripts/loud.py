import json, numpy as np, soundfile as sf, pyloudnorm as pyln, subprocess
from scipy import signal
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000
def tc(s): return '%d:%05.2f'%(s//60,s%60)
mix,_=sf.read(f'{R}/audio/mix/v2/final_mix.wav')
V,_=sf.read(f'{R}/audio/mix/v2/stem_narration.wav'); M,_=sf.read(f'{R}/audio/mix/v2/stem_music_ducked.wav'); X,_=sf.read(f'{R}/audio/mix/v2/stem_sfx.wav')
meter=pyln.Meter(SR)
I=meter.integrated_loudness(mix)
up=signal.resample_poly(mix,4,1,axis=0); tp=20*np.log10(np.abs(up).max()); sp=20*np.log10(np.abs(mix).max())
tpi=np.argmax(np.abs(up).max(1))/4/SR
print('pyloudnorm integrated %.2f LUFS; true peak (4x resample_poly) %.2f dBTP at %s; sample peak %.2f dBFS'%(I,tp,tc(tpi),sp))
# count over -1.5 dBTP
o=np.abs(up).max(1)>10**(-1.5/20); print('4x samples above -1.5 dBTP:',o.sum())
# stem sum check
print('stems sum vs mix max abs diff (pre-limiter sum differs):', np.abs(V+M+X-mix).max())
r=subprocess.run(['ffmpeg','-nostats','-i',f'{R}/audio/mix/v2/final_mix.wav','-af','ebur128=peak=true:framelog=quiet','-f','null','-'],capture_output=True,text=True).stderr
print('\n'.join(l for l in r.splitlines()[-14:]))
# momentary (400ms) and short-term (3s) loudness series via K-weighting
def kw(x):
    # BS.1770 K-weighting at 48k
    b1=[1.53512485958697,-2.69169618940638,1.19839281085285]; a1=[1.0,-1.69065929318241,0.73248077421585]
    b2=[1.0,-2.0,1.0]; a2=[1.0,-1.99004745483398,0.99007225036621]
    return signal.lfilter(b2,a2,signal.lfilter(b1,a1,x,axis=0),axis=0)
def series(x,win,hop=0.1):
    k=kw(x); p=(k**2).sum(1)  # sum of channel powers (G=1 for L/R)
    w=int(win*SR); h=int(hop*SR); c=np.concatenate([[0],np.cumsum(p)])
    n=(len(p)-w)//h+1; idx=np.arange(n)*h
    e=(c[idx+w]-c[idx])/w
    return idx/SR+win/2, -0.691+10*np.log10(e+1e-20)
t,mm=series(mix,0.4); ts,st=series(mix,3.0)
print('momentary max %.1f LUFS at %s; short-term max %.1f LUFS at %s'%(mm.max(),tc(t[mm.argmax()]),st.max(),tc(ts[st.argmax()])))
top=np.argsort(-mm); shown=[]
for i in top:
    if all(abs(t[i]-s)>1.0 for s in shown): shown.append(t[i])
    if len(shown)>=10: break
print('top momentary moments:',[(tc(s),round(float(mm[np.argmin(abs(t-s))]),1)) for s in shown])
# LRA approx: short-term distribution 10-95 pct of gated (abs -70, rel -20)
g=st[st>-70]; g=g[g>(10*np.log10(np.mean(10**(g/10)))-20)]; print('LRA approx %.1f LU'%(np.percentile(g,95)-np.percentile(g,10)))
# per scene
tl=json.load(open(f'{R}/source/src/data/timeline.json'))
fr=np.load(f'{S}/frames.npz'); Vf=fr['Vf']
H=480
print('\nper-scene: music LUFS (stem, whole scene), music LUFS in speech gaps, music short-term max, voice LUFS, voice-music LU, music 1-4k vs voice')
tM,mM=series(M,0.4); tV,mV=series(V,0.4)
res={}
for s in tl['scenes']:
    a,b=s['from']/30,s['to']/30
    i0,i1=int(a*SR),int(b*SR)
    lm=meter.integrated_loudness(M[i0:i1]) if b-a>0.5 else None
    lv=meter.integrated_loudness(V[i0:i1])
    sel=(tM>=a)&(tM<b)
    gaps=sel&(mV<-50)
    speech=sel&(mV>-30)
    mg=10*np.log10(np.mean(10**(mM[gaps]/10))) if gaps.any() else float('nan')
    ms=10*np.log10(np.mean(10**(mM[speech]/10))) if speech.any() else float('nan')
    res[s['id']]=dict(music_lufs=lm,music_gap=mg,music_speech=ms,music_mmax=float(mM[sel].max()),voice_lufs=lv)
    print('%-3s %s-%s music I %.1f | in gaps %.1f | under speech %.1f | momentary max %.1f | voice I %.1f | V-M %.1f LU | gap time %.1fs'%(s['id'],tc(a),tc(b),lm,mg,ms,mM[sel].max(),lv,lv-lm,gaps.sum()*0.1))
json.dump(res,open(f'{S}/scenes.json','w'))
np.savez(f'{S}/series.npz',t=t,mm=mm,ts=ts,st=st,tM=tM,mM=mM,mV=mV)
