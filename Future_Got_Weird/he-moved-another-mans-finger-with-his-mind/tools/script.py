"""The locked narration (production/NARRATION_LOCKED.txt) split into its seven generation blocks, plus word helpers."""
import os, re
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(EP, 'production', 'NARRATION_LOCKED.txt'), encoding='utf-8').read().strip()
PARAS = [p.strip() for p in TEXT.split('\n\n') if p.strip()]
GROUPS = [[0], [1, 2], [3, 4], [5], [6, 7], [8, 9, 10], [11, 12]]
def blocks():
    return [' '.join(PARAS[j] for j in g) for g in GROUPS]
SPOKEN = {'2013,': 'twenty thirteen', '2019': 'twenty nineteen'}
def norm(s):
    s = s.replace('’', "'").replace('“', ' ').replace('”', ' ').replace('-', ' ')
    s = ' '.join(SPOKEN.get(w, w) for w in s.split())
    return re.sub(r"[^a-z' ]", ' ', s.lower()).split()
def words(s):
    return s.split()
