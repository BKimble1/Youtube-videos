#!/usr/bin/env python3
"""aband.py t0 t1 [win_ms]: per-window full-band and 300-4000 Hz dBFS for narration, music, sfx stems and the render mix."""
import sys, wave, numpy as np
A="/home/user/Youtube-videos/Future_Got_Weird/Video_02/audio/mix/v2/"
R="/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/v2/review_r1/skeptic/render48.wav"
def load(p,t0,t1):
    w=wave.open(p); sr=w.getframerate(); ch=w.getnchannels(); sw=w.getsampwidth()
    w.setpos(int(t0*sr)); n=int((t1-t0)*sr); b=w.readframes(n)
    if sw==3:
        a=np.frombuffer(b,np.uint8).reshape(-1,3).astype(np.int32); v=(a[:,0]|(a[:,1]<<8)|(a[:,2]<<16)); v=np.where(v>=2**23,v-2**24,v); x=v.astype(np.float64)/2**23
    else:
        dt={2:np.int16,4:np.int32}[sw]; x=np.frombuffer(b,dt).astype(np.float64)/(2**(8*sw-1))
    return x.reshape(-1,ch).mean(1), sr
def band(x,sr,lo=300,hi=4000):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/sr); X[(f<lo)|(f>hi)]=0; return np.fft.irfft(X,len(x))
def db(x): return 20*np.log10(np.sqrt(np.mean(x**2))+1e-9)
t0,t1=float(sys.argv[1]),float(sys.argv[2]); win=float(sys.argv[3]) if len(sys.argv)>3 else 40
pad=0.5
st={k:load(A+v,t0-pad,t1+pad) for k,v in [("voice","stem_narration.wav"),("music","stem_music_ducked.wav"),("sfx","stem_sfx.wav")]}
try: st["mix"]=load(R,t0-pad,t1+pad)
except Exception as e: pass
bd={k:band(x,sr) for k,(x,sr) in st.items()}
sr=48000; w=int(win/1000*sr)
print("t(s)   frame |  full: voice music sfx mix | band: voice music sfx")
t=t0
while t<t1-1e-9:
    i=int((t-t0+pad)*sr); s=slice(i,i+w)
    full=[db(st[k][0][s]) for k in ("voice","music","sfx")]+([db(st["mix"][0][s])] if "mix" in st else [])
    b=[db(bd[k][s]) for k in ("voice","music","sfx")]
    print(f"{t:7.3f} {t*30:6.1f} | "+" ".join(f"{v:6.1f}" for v in full)+" | "+" ".join(f"{v:6.1f}" for v in b))
    t+=win/1000
