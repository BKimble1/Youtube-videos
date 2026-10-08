import json, numpy as np, soundfile as sf
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
SR=48000
def tc(s): return '%d:%05.2f'%(s//60,s%60)
L={}
for k,p in [('mix','audio/mix/v2/final_mix.wav'),('V','audio/mix/v2/stem_narration.wav'),('M','audio/mix/v2/stem_music_ducked.wav'),('X','audio/mix/v2/stem_sfx.wav'),('amb','audio/sfx/v2/amb_track.wav'),('fx','audio/sfx/v2/sfx_track.wav'),('bed','audio/music/v2/music_bed.wav')]:
    x,_=sf.read(f'{R}/{k and p}',always_2d=True); L[k]=x
def lv(x): return 20*np.log10(np.sqrt((x**2).mean())+1e-12)
def table(a,b,step=0.25):
    print('time     mix     V      M      X(sfx+amb)  amb_track(raw)  fx_track(raw)')
    t=a
    while t<b-1e-9:
        i0,i1=int(t*SR),int((t+step)*SR)
        print('%s %6.1f %6.1f %6.1f %6.1f %8.1f %8.1f'%(tc(t),lv(L['mix'][i0:i1]),lv(L['V'][i0:i1]),lv(L['M'][i0:i1]),lv(L['X'][i0:i1]),lv(L['amb'][i0:i1]),lv(L['fx'][i0:i1])))
        t+=step
print('=== OPENING 0-2.5 s ===')
table(0,2.5,0.1)
print('first nonzero sample per stem:',{k:(np.argmax(np.abs(v).max(1)>0)/SR) for k,v in L.items()})
print('mix first 5 samples',L['mix'][:5,0])
print('\n=== TAIL last 8.5 s ===')
table(279.75,288.23,0.25)
print('last samples mix',L['mix'][-5:,0],'last 10ms level %.1f'%lv(L['mix'][-480:]))
M=L['M'].max(1); nz=np.where(np.abs(L['M']).max(1)>10**(-80/20))[0]; print('music last above -80 dBFS at',tc(nz[-1]/SR))
nz=np.where(np.abs(L['bed']).max(1)>10**(-80/20))[0]; print('music bed (unducked) last above -80 dBFS at',tc(nz[-1]/SR), 'bed len',len(L['bed'])/SR)
for thr in (-40,-50,-60):
    nz=np.where(np.abs(L['mix']).max(1)>10**(thr/20))[0]; print('mix last sample above %d dBFS at %s'%(thr,tc(nz[-1]/SR)))
