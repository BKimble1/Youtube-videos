import json, subprocess, numpy as np, parselmouth
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
SR=48000
def dec(p):
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.float32).astype(float)
for take in ['x01_t1','x01_t4','x02_t1','x09_t3','x09_t4','x15_t1','x04_t1']:
    al=json.load(open(f'{R}/audio/narration/v2/takes/{take}.align.json')); ws=al['words']
    i=[j for j,w in enumerate(ws) if 'kəˈlaɪ' in w['text']][0]
    prev=[w for w in ws[:i] if w.get('type','word')=='word'][-1]; w=ws[i]
    x=dec(f'{R}/audio/narration/v2/takes/{take}.mp3')
    a=prev['start']; b=w['end']+0.25
    snd=parselmouth.Sound(x[int(a*SR):int(b*SR)],SR)
    pit=snd.to_pitch_ac(time_step=0.02,pitch_floor=70,pitch_ceiling=420); inten=snd.to_intensity(time_step=0.02)
    form=snd.to_formant_burg(time_step=0.02,max_number_of_formants=5,maximum_formant=5500)
    print(f"{take}: prev '{prev['text']}' {prev['start']}-{prev['end']}, Kalai {w['start']}-{w['end']}  (rows: t_abs F0 dB F1 F2)")
    line=[]
    for t in np.arange(0.01,snd.duration-0.01,0.02):
        f0=pit.get_value_at_time(t); I=inten.get_value(t); f1=form.get_value_at_time(1,t); f2=form.get_value_at_time(2,t)
        line.append('%.2f:%s/%s/%s/%s'%(a+t,'-' if np.isnan(f0) else int(f0),'-' if np.isnan(I) else int(I),'-' if np.isnan(f1) else int(f1),'-' if np.isnan(f2) else int(f2)))
    print('   '+'  '.join(line))
