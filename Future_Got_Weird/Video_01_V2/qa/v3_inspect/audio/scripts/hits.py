import json, numpy as np, soundfile as sf
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000; H=480
def tc(s): return '%d:%05.2f'%(s//60,s%60)
fr=np.load(f'{S}/frames.npz'); Vf,Xf,Mf=fr['Vf'],fr['Xf'],fr['Mf']
pos=json.load(open(f'{S}/segpos.json'))
placed=json.load(open(f'{R}/audio/sfx/v2/placed.json')); lib=json.load(open(f'{R}/audio/sfx/v2/lib/lib.json'))
# line level per segment: median of voice 20ms frames above (max-20) in speech span
line=[]
for o in pos:
    a,b=o['sp0']/SR,o['sp1']/SR; v=Vf[int(a*SR/H):int(b*SR/H)]; act=v[v>v.max()-20]
    line.append((o['id'],a,b,float(np.median(act)),float(np.percentile(act,95))))
def seg_at(t):
    best=None
    for sid,a,b,med,p95 in line:
        if a-0.6<=t<=b+0.6: best=(sid,a,b,med,p95) if best is None or abs((a+b)/2-t)<abs((best[1]+best[2])/2-t) else best
    return best
rows=[]
for c in placed:
    if c['kind'].startswith('amb_'): continue
    t=c['t']; s0=t-lib[c['kind']]['sync_s']
    x=Xf[int(max(0,t-0.05)*SR/H):int((t+0.25)*SR/H)]
    if len(x)==0: continue
    xp=float(x.max())
    sg=seg_at(t)
    rows.append(dict(c=c,xp=xp,seg=sg[0] if sg else None,line_med=sg[3] if sg else None,line_p95=sg[4] if sg else None,in_speech=bool(sg and sg[1]<=t<=sg[2])))
r2=[r for r in rows if r['seg']]
r2.sort(key=lambda r:-(r['xp']-r['line_med']))
print('Loudest effect hits relative to the line they sit on (20 ms frame peak of sfx stem in [t-50ms,t+250ms] minus the line\'s median voice frame level):')
for r in r2[:22]:
    c=r['c']; print('  %s f%d %-13s g%-3s sfx %.1f dBFS | line %s median %.1f p95 %.1f | hit-line %+.1f dB (vs p95 %+.1f) %s | %s'%(tc(c['t']),c['f'],c['kind'],c['gain'],r['xp'],r['seg'],r['line_med'],r['line_p95'],r['xp']-r['line_med'],r['xp']-r['line_p95'],'IN-LINE' if r['in_speech'] else 'pause',c['note'][:50]))
print('\nAll stamp / gavel / claim / buzzer hits:')
for r in rows:
    c=r['c']
    if c['kind'] in ('stamp_light','stamp_heavy','gavel','claim_fails','buzzer_wrong','logo_hit','trophy_clink','fanfare_small','ding_right','bell_ding'):
        print('  %s f%d %-13s g%-3s sfx %.1f | line %s med %s | hit-line %s %s | %s'%(tc(c['t']),c['f'],c['kind'],c['gain'],r['xp'],r['seg'],None if r['line_med'] is None else round(r['line_med'],1),None if r['line_med'] is None else '%+.1f'%(r['xp']-r['line_med']),'IN-LINE' if r['in_speech'] else 'pause',c['note'][:60]))
json.dump([dict(r,c=r['c']) for r in rows],open(f'{S}/hits.json','w'))
