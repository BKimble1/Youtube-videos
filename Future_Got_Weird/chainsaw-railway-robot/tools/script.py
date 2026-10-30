#!/usr/bin/env python3
"""The locked narration, read from SCRIPT_LOCKED.md (between the two '---' rules), split into lines, words and the
four generation blocks. Nothing here edits the words."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def lines():
    t = open(os.path.join(ROOT, 'SCRIPT_LOCKED.md'), encoding='utf-8').read()
    body = t.split('\n---\n')[1]
    return [l.strip() for l in body.strip().split('\n') if l.strip()]

# block boundaries: index of the first line of each block (narrative acts: hook+reveal, control+bilateral,
# safety+rollout, ending)
BLOCK_STARTS = [0, 12, 24, 33]

def blocks():
    L = lines(); s = BLOCK_STARTS + [len(L)]
    return [L[s[i]:s[i + 1]] for i in range(len(BLOCK_STARTS))]

def words(text_lines):
    return ' '.join(text_lines).split()

def norm(w):
    return re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'"))

LW = [norm(w) for w in words(lines())]

if __name__ == '__main__':
    L = lines()
    print(len(L), 'lines', len(words(L)), 'words')
    for i, b in enumerate(blocks()):
        print(i, len(words(b)), len(' '.join(b)), '|', b[0], '...', b[-1])
