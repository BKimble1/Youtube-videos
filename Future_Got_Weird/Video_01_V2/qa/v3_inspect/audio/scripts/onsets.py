import json, subprocess, numpy as np, soundfile as sf
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
S='/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/audio'
SR=48000
def dec(p):
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-af','aresample=resampler=soxr','-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.float32).astype(float)
def prof(x,w=240,n=20):
    return ' '.join('%.0f'%(20*np.log10(np.sqrt((x[i*w:(i+1)*w]**2).mean())+1e-12)) for i in range(n))
for take,sid in [('x02_t1','s03'),('x08_t3','s16'),('x04_t1','s08'),('x06_t1','s12'),('x17_t1','s35'),('x01_t4','s01'),('x11_t3','s22'),('x12_t1','s25')]:
    x=dec(f'{R}/audio/narration/v2/takes/{take}.mp3')
    al=json.load(open(f'{R}/audio/narration/v2/takes/{take}.align.json'))
    ws=[w for w in (al['words'] if isinstance(al,dict) else al) if w.get('type','word')=='word' and not w['text'].startswith('[')][:3]
    seg,_=sf.read(f'{R}/audio/narration/v2/{sid}.wav')
    print(take,sid,'first aligned words',[(w['text'],w['start'],w['end']) for w in ws])
    print('  take first 100ms (5ms frames, dBFS, pre gain):',prof(x))
    print('  seg  first 100ms (5ms frames, dBFS):          ',prof(seg))
    print('  seg first sample values', np.round(seg[:4],6), 'peak first 8ms', np.abs(seg[:384]).max())
