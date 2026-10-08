import json, numpy as np
from scipy.ndimage import maximum_filter1d
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000; H=480
def tc(s): return '%d:%05.2f'%(s//60,s%60)
fr=np.load(f'{S}/frames.npz'); Vbf,Mbf,Xbf,Vf,Mf,Xf=[fr[k] for k in ('Vbf','Mbf','Xbf','Vf','Mf','Xf')]
loc=maximum_filter1d(Vbf,31)  # 300 ms local max
speechcore=(Vbf>loc-12)&(Vbf>-40)&(Vf>-35)
words=json.load(open(f'{S}/words2.json'))
placed=json.load(open(f'{R}/audio/sfx/v2/placed.json'))
def word_at(t):
    c=[d for d in words if d['a']-0.15<=t<=d['b']+0.05]
    return '/'.join(sorted(set(d['w'] for d in c)))[:30]
def cues(t):
    return [c for c in placed if not c['kind'].startswith('amb_') and t-0.5<=c['t']<=t+0.03]
for name,O,thr in [('EFFECTS',Xbf,6),('MUSIC',Mbf,6)]:
    marg=Vbf-O
    bad=speechcore&(marg<thr)
    print('%s: speech-core frames %d (%.0f s); frames with %s within %d dB in 1-4 kHz: %d (%.2f%%)'%(name,speechcore.sum(),speechcore.sum()*H/SR,name.lower(),thr,bad.sum(),100*bad.mean()/speechcore.mean()))
    idx=np.where(bad)[0]; ev=[]
    for i in idx:
        if ev and i-ev[-1][1]<=3: ev[-1][1]=i
        else: ev.append([i,i])
    ev=[e for e in ev if e[1]-e[0]>=1]
    print('  events (>=2 adjacent core frames, 10 ms hop):',len(ev))
    for a,b in sorted(ev,key=lambda e:np.min(marg[e[0]:e[1]+1])):
        t=a*H/SR+0.01; worst=float(np.min(marg[a:b+1]))
        cs=cues(t) if name=='EFFECTS' else []
        print('   %s +%.2fs worst %+.1f dB (bb %+.1f) word~%s | %s'%(tc(t),(b-a+1)*H/SR,worst,float(np.min((Vf-(Xf if name=="EFFECTS" else Mf))[a:b+1])),word_at(t),'; '.join('%s@%s f%d g%s %s'%(c['kind'],tc(c['t']),c['f'],c['gain'],c['note'][:30]) for c in cs)))
