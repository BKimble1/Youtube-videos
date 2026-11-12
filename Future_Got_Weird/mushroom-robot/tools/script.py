"""The locked narration (production/NARRATION_LOCKED.txt), its display words and a normalised word list."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(ROOT, os.environ.get('FGW_SCRIPT', 'production/NARRATION_LOCKED.txt'))).read()

def display_words(text=TEXT):
    # "signal..." keeps its ellipsis on the word it follows
    return [w for w in text.replace('…', '… ').split() if w and w != '…']

def norm(words):
    out = []
    for w in (words if isinstance(words, list) else words.split()):
        w = w.lower().replace('’', "'").replace('—', ' ').replace('…', ' ')
        w = w.replace('...', ' ')
        out += [x for x in re.sub(r"[^a-z' ]", ' ', w).split() if x]
    # an ASR model may hear "X-ray" as two tokens: treat "x ray" as the one locked word
    merged = []
    for x in out:
        if merged and merged[-1] == 'ultra' and x == 'violet': merged[-1] = 'ultraviolet'
        else: merged.append(x)
    return merged

DW = display_words()
LW = norm(TEXT)
