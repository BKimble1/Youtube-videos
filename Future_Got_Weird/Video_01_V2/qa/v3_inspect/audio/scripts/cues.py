import json, numpy as np, soundfile as sf
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000; H=480
def tc(s): return '%d:%05.2f'%(s//60,s%60)
fr=np.load(f'{S}/frames.npz'); Vf,Mf,Xf=fr['Vf'],fr['Mf'],fr['Xf']
tl=json.load(open(f'{R}/source/src/data/timeline.json'))
TR={'S2':('cut',0),'S3':('reveal',14),'S4':('cut',0),'S5':('wipe',12),'S6':('iris',18),'S7':('wipe',10),'S8':('wipe',10),'S9':('wipe',10),'S10':('cut',0)}
early=lambda t: 0 if t is None or t[0]=='cut' else (t[1] if t[0]=='reveal' else -(-t[1]//2))
late=lambda t: 0 if t is None or t[0] in('cut','reveal') else -(-t[1]//2)
vis={}
sc=tl['scenes']
for i,s in enumerate(sc):
    tin=TR.get(s['id']) if i else None; tout=TR.get(sc[i+1]['id']) if i+1<len(sc) else None
    vis[s['id']]=(max(0,s['from']-early(tin)), min(tl['durationInFrames'], s['to']+late(tout)), s['from'], s['to'])
print('scene visibility (mounted from,to | nominal from,to):',vis)
placed=json.load(open(f'{R}/audio/sfx/v2/placed.json'))
lib=json.load(open(f'{R}/audio/sfx/v2/lib/lib.json'))
print('\nCues outside their scene\'s mounted window, or inside a transition (edge/iris moving):')
for c in placed:
    a,b,nf,nt=vis[c['scene']]
    f=c['f']
    if f<a or f>b: print('  OUTSIDE', c['scene'],f,tc(c['t']),c['kind'],c['gain'],c['note'][:70], 'window',a,b)
    else:
        i=[s['id'] for s in sc].index(c['scene'])
        tin=TR.get(c['scene']) if i else None
        if tin and tin[0] in ('wipe','iris') and f< nf+late(tin): print('  in incoming transition',c['scene'],f,tc(c['t']),c['kind'],c['gain'],c['note'][:70],'(transition frames %d-%d)'%(nf-early(tin),nf+late(tin)))
        tout=TR.get(sc[i+1]['id']) if i+1<len(sc) else None
        if tout and tout[0] in ('wipe','iris') and f> nt-early(tout): print('  in outgoing transition',c['scene'],f,tc(c['t']),c['kind'],c['gain'],c['note'][:70],'(transition frames %d-%d)'%(nt-early(tout),nt+late(tout)))
        if tout and tout[0]=='reveal' and f> nt-tout[1]: print('  during reveal (outgoing animates away)',c['scene'],f,tc(c['t']),c['kind'],c['gain'],c['note'][:70])
# exposed cues: voice quiet in [t-0.15, t+0.35]
rows=[]
for c in placed:
    if c['kind'].startswith('amb_'): continue
    t=c['t']; i0=int(max(0,t-0.15)*SR/H); i1=int((t+0.35)*SR/H)
    vmax=Vf[i0:i1].max(); xmax=Xf[int(t*SR/H):int((t+0.4)*SR/H)].max(); mmed=np.median(Mf[i0:i1])
    rows.append((c,vmax,xmax,mmed))
exp=[r for r in rows if r[1]<-45]
print('\nExposed cues (no voice above -45 dBFS from t-0.15 to t+0.35 s): %d of %d'%(len(exp),len(rows)))
exp.sort(key=lambda r:-r[2])
for c,v,x,m in exp[:60]:
    print('  %s f%d %s %-14s g%-3s sfx %.1f dBFS music %.1f | %s'%(tc(c['t']),c['f'],c['scene'],c['kind'],c['gain'],x,m,c['note'][:70]))
json.dump([dict(c,vmax=float(v),xmax=float(x),mmed=float(m)) for c,v,x,m in rows],open(f'{S}/cuerows.json','w'))
