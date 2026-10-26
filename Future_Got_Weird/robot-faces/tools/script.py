"""The locked narration (script.md) split into its five generation blocks, with a normalised spoken word list."""
import os, re
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(EP, 'script.md'), encoding='utf-8').read().split('Do not edit.')[1].strip()
PARAS = [p.strip() for p in TEXT.split('\n\n') if p.strip()]
# block boundaries (first paragraph of each block)
STARTS = ['This robot watches', 'At Columbia University', 'Once it had a way', 'But getting the mouth', 'These were studies']
def blocks():
    out, cur = [], None
    for p in PARAS:
        if any(p.startswith(s) for s in STARTS):
            cur = []; out.append(cur)
        cur.append(p)
    return [' '.join(b) for b in out]
SPOKEN = {'2026': 'twenty twenty six', '2024': 'twenty twenty four'}
def norm(s):
    s = s.replace('’', "'").replace('“', ' ').replace('”', ' ').replace('-', ' ')
    s = ' '.join(SPOKEN.get(w, w) for w in s.split())
    return re.sub(r"[^a-z' ]", ' ', s.lower()).split()
def words(s):
    return s.split()
def words_bare(s):
    """display words (as written), one per spoken token group"""
    return re.findall(r"[A-Za-z0-9’'\-]+", s)
