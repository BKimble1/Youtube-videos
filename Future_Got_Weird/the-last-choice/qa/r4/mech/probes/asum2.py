import json,sys,collections
e=[]
for p in sys.argv[1:]:
    try: e+=json.load(open(p))
    except Exception as ex: print('skip',p,ex)
print(len(e),'events')
def keep(x):
    w=x['what']
    if w.startswith('jump'):
        j=w.split(' ')[1]
        if x['key'].startswith('heavy'): return x['v']>1.6 if j!='hull' else x['v']>0.45
        lim = 0.9 if j.startswith('wr') or j.startswith('an') or j.startswith('kn') else 0.55
        return x['v']>lim
    return True
e=[x for x in e if keep(x)]
print(len(e),'after filter')
c=collections.Counter((x['what'].split(' ')[0]) for x in e); print(c)
g=collections.defaultdict(list)
for x in e: g[(x['shot'],x['key'],x['what'])].append(x)
rows=sorted(g.items(), key=lambda kv:-len(kv[1]))
for (shot,key,what),xs in rows[:70]:
    print(f"{shot:8s} {key:16s} {what:14s} n={len(xs):3d} t {xs[0]['t']:.2f}-{xs[-1]['t']:.2f} max {max(x['v'] for x in xs):.2f} {xs[0]['extra'][:70]}")
