import sys, re, numpy as np, soundfile as sf
wav, srt = sys.argv[1], sys.argv[2]
x, sr = sf.read(wav, dtype='float32', always_2d=True); x = x.mean(axis=1)
hop = int(sr*0.005); win = int(sr*0.02)
n = (len(x)-win)//hop
rms = np.array([np.sqrt(np.mean(x[i*hop:i*hop+win]**2)+1e-12) for i in range(n)])
db = 20*np.log10(rms)
act = db[db > -50]
ref = np.median(act)
thr = ref - 25
def ts(s):
    h,m,r=s.split(':'); a,b=r.split(','); return int(h)*3600+int(m)*60+int(a)+int(b)/1000
cues=[]
for b in open(srt,encoding='utf-8').read().strip().split('\n\n'):
    l=b.split('\n'); a,e=l[1].split(' --> '); cues.append((int(l[0]),ts(a),ts(e),' '.join(l[2:])))
early=[]; late_end=[]
for k,(nidx,a,e,t) in enumerate(cues):
    # voice onset: first frame >= thr within [a-0.5, a+0.3] that follows >= 60 ms below thr
    i0=int((a-0.5)*sr/hop); i1=int((a+0.3)*sr/hop)
    on=None
    for i in range(max(i0,12), i1):
        if db[i]>=thr and np.all(db[i-12:i]<thr):
            on=i*hop/sr + 0.01; break
    if on is not None and on < a - 0.03:
        early.append((nidx, round(a-on,3), t[:40]))
    # voice still sounding after cue end (excluding when next cue starts within 0.1s)
    nxt = cues[k+1][1] if k+1<len(cues) else 1e9
    j0=int(e*sr/hop); j1=int(min(e+0.5, nxt)*sr/hop)
    if j1>j0+2:
        seg=db[j0:j1]
        above=np.where(seg>=thr)[0]
        if len(above) and above[0]==0:
            # how long voice continues past end
            stop = np.argmax(seg<thr) if np.any(seg<thr) else len(seg)
            if stop*hop/sr > 0.05: late_end.append((nidx, round(stop*hop/sr,3), t[-30:]))
print('ref voice level dBFS', round(ref,1), 'thr', round(thr,1))
print('cues whose voice onset precedes cue start by >30 ms:', len(early))
for r in early: print('  ', r)
print('cues where voice continues >50 ms after cue end (with a gap before next cue):', len(late_end))
for r in late_end: print('  ', r)
