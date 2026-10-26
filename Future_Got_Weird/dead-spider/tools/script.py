"""The locked narration (production/NARRATION_APPROVED.txt), its display words and a normalised word list."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(ROOT, 'production/NARRATION_APPROVED.txt')).read()

def display_words(text=TEXT):
    # "spider—and" is two words; the em dash stays on the first
    return [w for w in text.replace('—', '— ').split() if w]

def norm(words):
    out = []
    for w in (words if isinstance(words, list) else words.split()):
        w = w.lower().replace('’', "'").replace('—', ' ').replace('…', ' ')
        out += [x for x in re.sub(r"[^a-z' ]", ' ', w).split() if x]
    return out

DW = display_words()
LW = norm(TEXT)
