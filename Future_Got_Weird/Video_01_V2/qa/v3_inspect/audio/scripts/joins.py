import json, os, numpy as np, soundfile as sf
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
SR=48000
segs=json.load(open(f'{R}/script/narration_segments.json'))['segments']
man={s['id']:s for s in json.load(open(f'{R}/audio/narration/v2/manifest.json'))['segments']}
nar,sr=sf.read(f'{R}/source/public/audio/narration.wav',always_2d=True); nar=nar.mean(1)
print('narration.wav', len(nar)/SR, sr)
t=0.45; pos=int(0.45*SR); out=[]
for i,s in enumerate(segs):
    m=man[s['id']]
    a,_=sf.read(f"{R}/audio/narration/v2/{m['file']}",always_2d=True); a=a.mean(1)
    st=pos
    # verify
    seg_in=nar[st:st+len(a)]
    err=np.max(np.abs(seg_in-a)) if len(seg_in)==len(a) else None
    pause=s.get('pause_after_ms',250)/1000
    dur=len(a)/SR
    nxt=man[segs[i+1]['id']] if i+1<len(segs) else {}
    natural=(dur-m['speech_end_s'])+nxt.get('speech_start_s',0.0)
    add=max(0.0,pause-natural)
    addn=int(round(add*SR))
    out.append(dict(id=s['id'],take=m['take'],start=st,n=len(a),add=addn,pause_ms=s.get('pause_after_ms'),natural=natural,err=err,
        sp0=st+int(m['speech_start_s']*SR), sp1=st+int(m['speech_end_s']*SR)))
    pos=st+len(a)+addn
print('end pos',pos/SR,'+tail 5.5 =',pos/SR+5.5)
for o in out:
    print(o['id'],o['take'],'start %.3f'%(o['start']/SR),'dur %.3f'%(o['n']/SR),'added_sil %.3f'%(o['add']/SR),'design %s natural %.3f'%(o['pause_ms'],o['natural']),'maxerr',None if o['err'] is None else '%.2e'%o['err'])
json.dump(out,open('/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio/segpos.json','w'),default=float)
