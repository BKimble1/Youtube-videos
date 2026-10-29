import sys
# usage: rep.py file <<< "OLD\n===\nNEW\n%%%\nOLD2\n===\nNEW2"
p = sys.argv[1]; s = open(p).read()
for blk in sys.stdin.read().split('\n%%%\n'):
    if not blk.strip(): continue
    old, new = blk.split('\n===\n')
    old = old.strip('\n'); new = new.strip('\n')
    n = s.count(old)
    assert n == 1, f'{p}: expected 1 match, got {n}: {old[:80]!r}'
    s = s.replace(old, new)
open(p, 'w').write(s); print('ok', p)
