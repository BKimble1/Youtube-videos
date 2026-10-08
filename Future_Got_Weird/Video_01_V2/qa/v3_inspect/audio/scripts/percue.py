# Read-only replication of make_sfx_v2 placement + mix_v2 gains, to measure each cue's own level in the final mix domain.
import json, os, sys, numpy as np, soundfile as sf
from scipy import signal
sys.path.insert(0,'/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2/tools')
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000; FPS=30
import importlib.util
spec=importlib.util.spec_from_file_location('mx',f'{R}/tools/make_sfx_v2.py'); mx=importlib.util.module_from_spec(spec); spec.loader.exec_module(mx)
spec2=importlib.util.spec_from_file_location('mv',f'{R}/tools/mix_v2.py'); mv=importlib.util.module_from_spec(spec2); spec2.loader.exec_module(mv)
rng=np.random.default_rng(2026)
tl=json.load(open(f'{R}/source/src/data/timeline.json'))
total=int(tl['durationInFrames']/FPS*SR)+SR
cues=json.load(open(f'{R}/audio/sfx/v2/cues.json')); lib=json.load(open(f'{R}/audio/sfx/v2/lib/lib.json'))
LIB=f'{R}/audio/sfx/v2/lib'
cache={}; fx=np.zeros((total,2)); per=[]
for scene,lst in cues.items():
    for c in lst or []:
        kind=c['kind']
        if kind not in lib: continue
        meta=lib[kind]
        if kind not in cache:
            y,_=sf.read(os.path.join(LIB,meta['file'])); cache[kind]=y if y.ndim==1 else y.mean(axis=1)
        x=cache[kind]; is_amb=kind.startswith('amb_')
        jp=0 if is_amb else rng.uniform(-0.3,0.3); jg=0 if is_amb else rng.uniform(-0.6,0.6)
        x=mx.resample(x,c.get('pitch',0)+jp); r=2**((c.get('pitch',0)+jp)/12); sync=meta['sync_s']/r
        if c.get('dur'):
            d=float(c['dur']); x=mx.loop_to(x,d) if meta['class']=='loop' else x[:int(d*SR)].copy()
            fi,fo=int(min(0.4,d/4)*SR),int(min(0.6,d/3)*SR); x[:fi]*=np.linspace(0,1,fi); x[-fo:]*=np.linspace(1,0,fo); sync=0.0
        g=10**((meta['gain_db']+c.get('gain',0)+jg)/20)
        t0=c['f']/FPS-sync; i0=int(round(t0*SR))
        if i0<0: x=x[-i0:]; i0=0
        seg=x[:max(0,total-i0)]*g
        pan=0 if is_amb else rng.uniform(-0.18,0.18)
        if not is_amb:
            lr=np.array([np.sqrt(0.5-pan/2),np.sqrt(0.5+pan/2)])*np.sqrt(2)
            fx[i0:i0+len(seg)]+=seg[:,None]*lr[None,:]
            per.append(dict(scene=scene,f=c['f'],t=c['f']/FPS,kind=kind,gain=c.get('gain',0),note=c.get('note',''),i0=i0,n=len(seg),
                            first=float(abs(seg[0])) if len(seg) else 0,last=float(abs(seg[-1])) if len(seg) else 0,pk=float(np.abs(seg).max()) if len(seg) else 0, seg=seg))
n=int(tl['durationInFrames']/FPS*SR)
ref,_=sf.read(f'{R}/audio/sfx/v2/sfx_track.wav',always_2d=True)
print('replication max abs diff vs sfx_track.wav:',np.abs(fx[:n]-ref[:n]).max(),'(float32 file)')
# mix_v2 gains (defaults with approved flags --sfx-db -2 --sfx-duck-db 4)
nar,_=sf.read(f'{R}/source/public/audio/narration.wav',always_2d=True); nar=nar.mean(1)
n=len(nar)
v=mv.hp(nar,75); v=mv.compress(v,threshold_db=-26,ratio=2.0); v=mv.shelf_presence(v,3500,1.5)
room=np.random.default_rng(3).standard_normal(n)*10**(-74/20); room=signal.sosfilt(signal.butter(2,[120,6000],'bandpass',fs=SR,output='sos'),room); v=v+room
import pyloudnorm as pyln; meter=pyln.Meter(SR)
lv=meter.integrated_loudness(np.repeat(v[:,None],2,axis=1)); v*=10**((-17.0-lv)/20)
e=mv.envelope(v,30); e_db=20*np.log10(e+1e-9); speech=np.clip((e_db+48)/12,0,1)
from scipy.ndimage import maximum_filter1d
la,hold=int(0.12*SR),int(0.30*SR); speech=maximum_filter1d(speech,size=la+hold+1,origin=(hold-la)//2,mode='nearest')
gs=mv.smooth_ar(10**(-4*speech/20),40,300)
Vst,_=sf.read(f'{R}/audio/mix/v2/stem_narration.wav'); gain=np.median(Vst[int(5*SR):int(6*SR),0]/v[int(5*SR):int(6*SR)])
print('master gain %.3f dB (from stem/narration ratio)'%(20*np.log10(gain)))
Sst,_=sf.read(f'{R}/audio/mix/v2/stem_sfx.wav',always_2d=True)
est=fx[:n]*10**(-2/20)*gs[:,None]*gain
amb_part=Sst-est
print('stem_sfx minus reconstructed fx part: abs max %.4f (should be ambience only); check at a no-amb time 4:47: %.2e'%(np.abs(amb_part).max(), np.abs(amb_part[int(287*SR):int(287.5*SR)]).max()))
np.save(f'{S}/gs.npy',gs.astype(np.float32))
Vf=None
out=[]
for p in per:
    i0=p['i0']; seg=p['seg'][: max(0,n-i0)]
    eff=seg*10**(-2/20)*gs[i0:i0+len(seg)]*gain
    if len(eff)==0: continue
    # 20 ms max RMS
    w=960; c2=np.concatenate([[0],np.cumsum(eff**2)]); 
    rmsmax=10*np.log10(((c2[w:]-c2[:-w])/w).max()+1e-20) if len(eff)>w else 20*np.log10(np.sqrt((eff**2).mean())+1e-12)
    out.append(dict({k:v for k,v in p.items() if k!='seg'},pk_db=float(20*np.log10(np.abs(eff).max()+1e-12)),rms20_db=float(rmsmax),
                    last_db=float(20*np.log10(abs(eff[-1])+1e-12)),first_db=float(20*np.log10(abs(eff[0])+1e-12)),gs_db=float(20*np.log10(gs[i0+np.argmax(np.abs(eff))]))))
json.dump(out,open(f'{S}/percue.json','w'))
out.sort(key=lambda d:-d['rms20_db'])
def tc(s): return '%d:%05.2f'%(s//60,s%60)
print('\nTop 25 cues by own level in the final-mix domain (20 ms max RMS, mono-sum, after -2 dB fx trim, ducking, master gain):')
for d in out[:25]: print('  %s f%d %-6s %-14s g%-3s rms20 %.1f dBFS pk %.1f duck %.1f dB | %s'%(tc(d['t']),d['f'],d['scene'],d['kind'],d['gain'],d['rms20_db'],d['pk_db'],d['gs_db'],d['note'][:60]))
print('\nCue edge residuals (first/last sample) worst:')
for d in sorted(out,key=lambda d:-max(d['first_db'],d['last_db']))[:8]: print('  %s %s first %.1f last %.1f dBFS'%(tc(d['t']),d['kind'],d['first_db'],d['last_db']))
