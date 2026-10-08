import json, numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000
def tc(s): return '%d:%06.3f'%(s//60,s%60)
files={'narration.wav(pre-chain)':f'{R}/source/public/audio/narration.wav','stem_narration':f'{R}/audio/mix/v2/stem_narration.wav',
 'stem_music_ducked':f'{R}/audio/mix/v2/stem_music_ducked.wav','stem_sfx':f'{R}/audio/mix/v2/stem_sfx.wav','final_mix':f'{R}/audio/mix/v2/final_mix.wav'}
res={}
for name,p in files.items():
    x,_=sf.read(p,always_2d=True)
    out={'dc_mean':[float(x[:,c].mean()) for c in range(x.shape[1])],'peak_dbfs':float(20*np.log10(np.abs(x).max()+1e-12))}
    ev=[]
    for c in range(x.shape[1]):
        s=x[:,c]
        d1=np.diff(s,prepend=s[0])
        d2=np.diff(d1,prepend=d1[0])
        loc=np.sqrt(uniform_filter1d(d2**2,481))+1e-9
        r=np.abs(d2)/loc
        cand=np.where((r>14)&(np.abs(d2)>10**(-66/20)))[0]
        # group
        last=-10**9
        for i in cand:
            if i-last>240:
                ev.append((i,c,float(r[i]),float(20*np.log10(abs(d2[i]))),float(20*np.log10(np.abs(d1[i])+1e-12)), float(20*np.log10(np.sqrt((s[max(0,i-480):i+480]**2).mean())+1e-12))))
            last=i
    ev.sort(key=lambda e:-e[2])
    out['n_events']=len(ev)
    out['events']=[dict(t=tc(e[0]/SR),ts=e[0]/SR,ch=e[1],ratio=round(e[2],1),d2_db=round(e[3],1),d1_db=round(e[4],1),local_rms_db=round(e[5],1)) for e in ev[:25]]
    # max sample-to-sample jump overall
    d=np.abs(np.diff(x,axis=0)).max(1)
    out['max_jump_db']=float(20*np.log10(d.max())); out['max_jump_t']=tc(d.argmax()/SR)
    # DC steps: 10ms window means
    m=x.mean(1); w=480; k=len(m)//w; mm=m[:k*w].reshape(k,w).mean(1); rr=np.sqrt((m[:k*w].reshape(k,w)**2).mean(1))
    steps=np.where((np.abs(np.diff(mm))>2e-3)&(rr[1:]<0.01))[0]
    out['dc_steps']=[tc((i+1)*w/SR) for i in steps[:20]]
    res[name]=out
    print(name, 'peak %.2f dBFS'%out['peak_dbfs'],'DC',['%.1e'%v for v in out['dc_mean']],'events',len(ev),'max jump %.1f dB at %s'%(out['max_jump_db'],out['max_jump_t']),'dc_steps',out['dc_steps'][:10])
    for e in out['events'][:12]: print('   ',e)
json.dump(res,open(f'{S}/clicks.json','w'),indent=1)
