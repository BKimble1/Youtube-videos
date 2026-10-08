import json, numpy as np, soundfile as sf
from scipy import signal
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000
def tc(s): return '%d:%05.2f'%(s//60,s%60)
pos=json.load(open(f'{S}/segpos.json'))
def load(p):
    x,_=sf.read(p); return x.mean(1)
V=load(f'{R}/audio/mix/v2/stem_narration.wav'); M=load(f'{R}/audio/mix/v2/stem_music_ducked.wav'); X=load(f'{R}/audio/mix/v2/stem_sfx.wav')
band=signal.butter(4,[1000,4000],'bandpass',fs=SR,output='sos')
F=960; H=480
def frames(a):
    n=(len(a)-F)//H+1
    idx=np.arange(F)[None,:]+H*np.arange(n)[:,None]
    return 10*np.log10((a[idx]**2).mean(1)+1e-20)
Vf,Mf,Xf=[frames(a) for a in (V,M,X)]
Vbf,Mbf,Xbf=[frames(signal.sosfiltfilt(band,a)) for a in (V,M,X)]
np.savez(f'{S}/frames.npz',Vf=Vf,Mf=Mf,Xf=Xf,Vbf=Vbf,Mbf=Mbf,Xbf=Xbf)
placed=json.load(open(f'{R}/audio/sfx/v2/placed.json'))
out=[]
for o in pos:
    wj=json.load(open(f"{R}/audio/narration/v2/{o['id']}.words.json"))['words']
    for w in wj:
        a=o['start']/SR+w['start']; b=o['start']/SR+w['end']
        i0=int(a*SR/H); i1=max(i0+1,int(b*SR/H)-1)
        vb=Vbf[i0:i1]; vv=Vf[i0:i1]
        if len(vb)==0: continue
        act=vb>vb.max()-15
        mX=vb-Xbf[i0:i1]; mM=vb-Mbf[i0:i1]
        mXb=vv-Xf[i0:i1]; mMb=vv-Mf[i0:i1]
        d=dict(seg=o['id'],w=w['word'],a=a,b=b,vpk=float(vv.max()),vbpk=float(vb.max()),
               worstX=float(mX[act].min()),worstM=float(mM[act].min()),fracX=float((mX[act]<6).mean()),fracM=float((mM[act]<6).mean()),
               worstXbb=float(mXb[act].min()),worstMbb=float(mMb[act].min()))
        j=i0+int(np.argmin(np.where(act,mX,99)))
        d['worstX_t']=j*H/SR+0.01
        out.append(d)
json.dump(out,open(f'{S}/words2.json','w'))
vpk=np.array([d['vpk'] for d in out]); med=np.median(vpk)
print('median word peak voice level (20ms frames) %.1f dBFS'%med)
weak=[d for d in out if d['vpk']<med-18]
print('words with peak < median-18 dB (likely alignment drift/very weak):',[(tc(d['a']),d['seg'],d['w'],round(d['vpk'],1)) for d in weak])
def near(t):
    return [c for c in placed if not c['kind'].startswith('amb_') and t-0.45<=c['t']<=t+0.05]
print('\nEFFECTS: words with >=25% of active frames where 1-4 kHz effects are within 6 dB of voice (or worst < 0 dB)')
fl=[d for d in out if (d['fracX']>=0.25 or d['worstX']<0) and d['vpk']>=med-18]
fl.sort(key=lambda d:(-d['fracX'],d['worstX']))
for d in fl:
    cs=near(d['worstX_t'])
    print('%s %s %-16s frac %.0f%% worst %.1f dB (bb %.1f) @%s | %s'%(tc(d['a']),d['seg'],d['w'],100*d['fracX'],d['worstX'],d['worstXbb'],tc(d['worstX_t']),'; '.join('%s@%s g%s %s'%(c['kind'],tc(c['t']),c['gain'],c['note'][:38]) for c in cs)))
print('\nMUSIC: words with >=25% active frames where music within 6 dB in 1-4k or broadband')
fl=[d for d in out if (d['fracM']>=0.25 or d['worstM']<3 or d['worstMbb']<3) and d['vpk']>=med-18]
for d in sorted(fl,key=lambda d:d['worstMbb']):
    print('%s %s %-16s fracM %.0f%% worst1-4k %.1f worstBB %.1f'%(tc(d['a']),d['seg'],d['w'],100*d['fracM'],d['worstM'],d['worstMbb']))
