import re, json, soundfile as sf, numpy as np
R='/home/user/Youtube-videos/Future_Got_Weird/Video_02/'
tl=json.load(open(R+'source/src/data/timeline.json'))
txt=open(R+'script/subtitles_v2.srt',encoding='utf-8').read()
def ts(s):
  h,m,rest=s.split(':'); sec,ms=rest.split(','); return int(h)*3600+int(m)*60+int(sec)+int(ms)/1000
cues=[]
for blk in re.split(r'\n\s*\n',txt.strip()):
  L=blk.strip().split('\n'); a,b=L[1].split(' --> '); cues.append((int(L[0]),ts(a),ts(b),L[2:]))
words=[(w['w'],w['from']/30,w['to']/30,sg['id'],sg['scene']) for sg in tl['segments'] for w in sg['words']]
norm=lambda w: re.sub(r'[^a-z0-9]','',w.lower().replace('’',"'"))
# narration envelope for onset check
V,sr=sf.read(R+'audio/mix/v2/stem_narration.wav',dtype='float32'); V=V.mean(1)
hop=int(0.01*sr); env=20*np.log10(np.sqrt(np.convolve(V**2,np.ones(hop)/hop,'same')[::hop])+1e-9)
def onset_near(t,back=0.4,fwd=0.6):
  a=int((t-back)*100);b=int((t+fwd)*100)
  for i in range(a,b):
    if env[i]>-38 and env[max(i-5,0)]<-45: return i/100
  return None
def offset_near(t,back=0.4,fwd=0.8):
  a=int((t-back)*100);b=int((t+fwd)*100)
  last=None
  for i in range(a,b):
    if env[i]>-38: last=i/100
  return last
wi=0; rows=[]; probs=[]
for n,a,b,lines in cues:
  toks=[t for l in lines for t in l.split()]
  first=None
  for t in toks:
    while wi<len(words) and norm(words[wi][0])!=norm(t):
      probs.append(('skipped word',n,words[wi][0],t)); wi+=1
    if wi>=len(words): probs.append(('ran out',n,t)); break
    if first is None: first=words[wi]
    last=words[wi]; wi+=1
  chars=sum(len(l) for l in lines)+ (len(lines)-1)
  dur=b-a
  on=onset_near(first[1])
  rows.append(dict(n=n,a=a,b=b,dur=dur,ws=first[1],we=last[2],sd=a-first[1],ed=b-last[2],maxline=max(len(l) for l in lines),nl=len(lines),cps=chars/dur,text=' / '.join(lines),scene=first[4],on=on))
if wi<len(words): probs.append(('unused words',words[wi:]))
print('problems:',probs[:20])
print('cues',len(rows))
gaps=[]
for i,r in enumerate(rows):
  nxt=rows[i+1]['a'] if i+1<len(rows) else None
  r['gap']=(nxt-r['b']) if nxt else None
for r in rows:
  flag=[]
  if r['maxline']>42: flag.append('LINE>42')
  if r['nl']>2: flag.append('3+lines')
  if r['dur']<1.0: flag.append('short<1s')
  if r['dur']>7: flag.append('long>7s')
  if r['cps']>20: flag.append('cps>20')
  elif r['cps']>17: flag.append('cps>17')
  if abs(r['sd'])>0.25: flag.append('startoff')
  if r['ed']< -0.1: flag.append('ends-before-word')
  if r['ed']>0.6: flag.append('lingers')
  if r['on'] is not None and r['a']-r['on']>0.15: flag.append('starts-after-audio-onset %.2f'%(r['a']-r['on']))
  if r['on'] is not None and r['on']-r['a']>0.5: flag.append('early-vs-audio %.2f'%(r['on']-r['a']))
  if r['gap'] is not None and r['gap']<0: flag.append('OVERLAP')
  print('%3d %s %7.3f-%7.3f dur %.2f  word %7.3f-%7.3f  sd %+.3f ed %+.3f  onset %s  max %d cps %.1f gap %s %s | %s'%(r['n'],r['scene'],r['a'],r['b'],r['dur'],r['ws'],r['we'],r['sd'],r['ed'],('%.2f'%r['on']) if r['on'] else '-',r['maxline'],r['cps'],('%.2f'%r['gap']) if r['gap'] is not None else '-',','.join(flag),r['text']))
json.dump(rows,open(R+'qa/v2/review_r1/sound_sync/srt_check.json','w'),indent=1)
