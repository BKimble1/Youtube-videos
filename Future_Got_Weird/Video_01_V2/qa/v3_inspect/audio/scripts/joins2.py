import json, numpy as np, soundfile as sf
from scipy import signal
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000; HOP=240
pos=json.load(open(f'{S}/segpos.json'))
segs=json.load(open(f'{R}/script/narration_segments.json'))['segments']
sec={s['id']:x['id'] for x in json.load(open(f'{R}/script/narration_sections.json'))['sections'] for s in [{'id':i} for i in x['segments']]}
secseq={x['id']:x['segments'] for x in json.load(open(f'{R}/script/narration_sections.json'))['sections']}
nar,_=sf.read(f'{R}/source/public/audio/narration.wav'); 
if nar.ndim==2: nar=nar.mean(1)
def fdb(x):
    n=len(x)//HOP; f=x[:n*HOP].reshape(n,HOP); return 20*np.log10(np.sqrt((f**2).mean(1))+1e-12)
def tc(s): return '%d:%06.3f'%(s//60,s%60)
# loud reference per line
rows=[]
for k,o in enumerate(pos):
    a=nar[o['start']:o['start']+o['n']]
    db=fdb(a); loud=np.percentile(db,95)
    # tail: last 35 ms is fade; measure [end-75ms,end-35ms] (pre-fade) and [end-35,end]
    pre=a[-int(0.075*SR):-int(0.035*SR)]; fade=a[-int(0.035*SR):]
    pre_db=20*np.log10(np.sqrt((pre**2).mean())+1e-12)-loud
    head=a[:int(0.008*SR)]; head2=a[int(0.008*SR):int(0.03*SR)]
    head_db=20*np.log10(np.sqrt((head2**2).mean())+1e-12)-loud
    # level at speech end (last 20ms before speech_end)
    se=o['sp1']-o['start']; ss=o['sp0']-o['start']
    se_db=20*np.log10(np.sqrt((a[max(0,se-int(0.02*SR)):se]**2).mean())+1e-12)-loud
    # floor inside the tail region after speech end
    tail=db[se//HOP:]
    floor=np.percentile(tail,10) if len(tail)>3 else np.nan
    floor_abs=np.percentile(db[db>-200],5)
    # activity in tail after speech_end + 60ms: frames > loud-35
    act_tail=[(i*HOP/SR) for i,v in enumerate(tail) if v>loud-38]
    headreg=db[:ss//HOP]
    act_head=[(i*HOP/SR) for i,v in enumerate(headreg) if v>loud-38]
    rows.append(dict(id=o['id'],take=o['take'],loud=loud,pre_db=pre_db,head_db=head_db,se_db=se_db,floor_tail=floor,
        tail_len=(o['n']-se)/SR,head_len=ss/SR,act_tail=len(act_tail)*HOP/SR, act_tail_last=(max(act_tail) if act_tail else None),
        act_head=len(act_head)*HOP/SR,abs_start=o['start']/SR,abs_end=(o['start']+o['n'])/SR,added=o['add']/SR,
        sp0=o['sp0']/SR, sp1=o['sp1']/SR))
print('id   take    seg_start  seg_end   loud  preFade(dB rel) head(8-30ms) atSpeechEnd tailLen tailAct headLen headAct added')
for r in rows:
    print('%s %s %s %s %6.1f %7.1f %7.1f %7.1f   %.3f %.3f %.3f %.3f %.3f'%(r['id'],r['take'],tc(r['abs_start']),tc(r['abs_end']),r['loud'],r['pre_db'],r['head_db'],r['se_db'],r['tail_len'],r['act_tail'],r['head_len'],r['act_head'],r['added']))
json.dump(rows,open(f'{S}/joinrows.json','w'),default=float)
