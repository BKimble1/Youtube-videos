import json, numpy as np, soundfile as sf
from scipy import signal
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000; W=480  # 10 ms
pos=json.load(open(f'{S}/segpos.json')); rows=json.load(open(f'{S}/joinrows.json'))
nar,_=sf.read(f'{R}/source/public/audio/narration.wav')
if nar.ndim==2: nar=nar.mean(1)
hpx=signal.sosfilt(signal.butter(4,2500,'highpass',fs=SR,output='sos'),nar)
def lvl(x): return 20*np.log10(np.sqrt((x**2).mean())+1e-12)
def tc(s): return '%d:%06.3f'%(s//60,s%60)
sym=' .:-=+*#%@'
for k in range(len(pos)-1):
    a,b=pos[k],pos[k+1]; ra=rows[k]
    t0=a['sp1']-int(0.04*SR); t1=b['sp0']+int(0.06*SR)
    loud=ra['loud']
    s=''; hf=''
    for i in range(t0,t1,W):
        x=nar[i:i+W]
        if np.all(x==0): s+='_'; continue
        d=lvl(x)-loud
        # map -60..0 -> symbols
        idx=int(np.clip((d+60)/6,0,9)); s+=sym[idx]
    # mark seg boundary position
    cut=(a['start']+a['n']-t0)//W; nxt=(b['start']-t0)//W
    floor=[lvl(nar[i:i+W]) for i in range(a['sp1']+int(0.05*SR),a['start']+a['n']-int(0.035*SR),W)]
    floorb=[lvl(nar[i:i+W]) for i in range(b['start']+int(0.008*SR),b['sp0']-int(0.02*SR),W)]
    same = a['take']==b['take']
    print(f"{a['id']}->{b['id']} {'SAME ' if same else 'XTAKE'} {a['take']}->{b['take']} speechEnd {tc(a['sp1']/SR)} cut {tc((a['start']+a['n'])/SR)} nextSegStart {tc(b['start']/SR)} nextSpeech {tc(b['sp0']/SR)} gap {(b['sp0']-a['sp1'])/SR:.3f}s added {a['add']/SR:.3f}")
    print('   ', s[:cut]+'|'+s[cut:nxt]+'|'+s[nxt:])
    print('    floor tail(dBFS) min %.1f med %.1f | head min %.1f med %.1f'%((min(floor) if floor else np.nan),(np.median(floor) if floor else np.nan),(min(floorb) if floorb else np.nan),(np.median(floorb) if floorb else np.nan)))
