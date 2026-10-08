import json, subprocess, numpy as np, parselmouth
R='/home/user/Youtube-videos/Future_Got_Weird/Video_01_V2'
SR=48000
def dec(p):
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.float32).astype(float)
sel={'x01':'x01_t4','x02':'x02_t1','x04':'x04_t1','x09':'x09_t4','x15':'x15_t1'}
blind={'x01_t1':"heard 'Kelle's'",'x09_t3':"heard 'Koller's'",'x02_t1':"heard 'Kalai'",'x04_t1':"heard 'Kalai'",'x15_t1':"heard 'Kalai'"}
rows=[]
for sec in ['x01','x02','x04','x09','x15']:
    for k in range(1,5):
        take=f'{sec}_t{k}'
        al=json.load(open(f'{R}/audio/narration/v2/takes/{take}.align.json'))
        ws=al['words'] if isinstance(al,dict) else al
        hit=[(i,w) for i,w in enumerate(ws) if 'kəˈlaɪ' in w['text']]
        i,w=hit[0]
        nxt=[x for x in ws[i+1:] if x.get('type','word')=='word'][0]
        prv=[x for x in ws[:i] if x.get('type','word')=='word'][-1]
        x=dec(f'{R}/audio/narration/v2/takes/{take}.mp3')
        a=max(0,w['start']-0.06); b=min(len(x)/SR, nxt['start']+0.02 if nxt['start']>w['end'] else w['end']+0.06)
        snd=parselmouth.Sound(x[int(a*SR):int(b*SR)],SR)
        pit=snd.to_pitch_ac(time_step=0.005,pitch_floor=70,pitch_ceiling=420)
        inten=snd.to_intensity(time_step=0.005)
        form=snd.to_formant_burg(time_step=0.005,max_number_of_formants=5,maximum_formant=5500)
        ts=np.arange(0.01,snd.duration-0.01,0.005)
        f0=np.array([pit.get_value_at_time(t) for t in ts]); f0=np.nan_to_num(f0)
        I=np.array([inten.get_value(t) for t in ts]); I=np.nan_to_num(I,nan=0)
        F1=np.array([form.get_value_at_time(1,t) for t in ts]); F2=np.array([form.get_value_at_time(2,t) for t in ts])
        voiced=(f0>0)&(I>I.max()-25)
        vi=np.where(voiced)[0]
        if len(vi)<6: print(take,'too few voiced'); continue
        # split voiced region into runs
        runs=[]; s=vi[0]; p=vi[0]
        for j in vi[1:]:
            if j-p>3: runs.append((s,p)); s=j
            p=j
        runs.append((s,p))
        run=max(runs,key=lambda r:r[1]-r[0])
        seg=np.arange(run[0],run[1]+1)
        n=len(seg); half=seg[n//2:]; first=seg[:max(1,n//3)]
        tI=(np.argmax(I[seg]))/max(1,n-1)
        tF0=(np.argmax(f0[seg]))/max(1,n-1)
        last=seg[int(n*0.55):int(n*0.95)]
        f2a=np.nanmedian(F2[last[:max(1,len(last)//3)]]); f2b=np.nanmedian(F2[last[-max(1,len(last)//3):]])
        f1nuc=np.nanmax(F1[seg[int(n*0.4):int(n*0.8)]])
        Ifirst=np.mean(I[first]); Ilast=np.mean(I[seg[n//2:]])
        rows.append((take,round(w['start'],2),round(n*0.005,3),round(tI,2),round(tF0,2),round(Ilast-Ifirst,1),round(f2a),round(f2b),round(f2b-f2a),round(f1nuc), '*SELECTED*' if sel[sec]==take else '', blind.get(take,'')))
print('take start voicedDur  I_peak_pos  F0_peak_pos  I(last half - first third) dB  F2 start->end of final vowel (Hz) rise  F1max(nucleus)')
for r in rows: print(*r)
