import soundfile as sf, numpy as np
r,sr=sf.read('render.wav',dtype='float32')
m,_=sf.read('../../../../audio/mix/v2/final_mix.wav',dtype='float32')
n,_=sf.read('../../../../audio/mix/v2/stem_narration.wav',dtype='float32')
s,_=sf.read('../../../../audio/mix/v2/stem_sfx.wav',dtype='float32')
mu,_=sf.read('../../../../audio/mix/v2/stem_music_ducked.wav',dtype='float32')
print('stem sum vs mix max diff', np.abs(n+s+mu-m).max())
# cross-correlate a chunk
for t0 in [5,100,200,300]:
  a=r[t0*sr:(t0+5)*sr,0]; best=None
  for lag in range(-2000,2001):
    b=m[t0*sr+lag:(t0+5)*sr+lag,0]
    c=np.dot(a,b)/np.sqrt(np.dot(a,a)*np.dot(b,b)+1e-12)
    if best is None or c>best[1]: best=(lag,c)
  print(t0,'lag samples',best[0],'ms',best[0]/sr*1000,'corr',round(best[1],5))
# residual after alignment
lag=0
d=r[:len(m)]-m
print('render vs mix residual rms dB', 20*np.log10(np.sqrt((d**2).mean())+1e-12), 'mix rms', 20*np.log10(np.sqrt((m**2).mean())))
