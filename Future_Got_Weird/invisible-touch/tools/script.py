"""The locked narration (production/NARRATION_LOCKED.txt), its display words and a normalised word list."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(ROOT, os.environ.get('FGW_SCRIPT', 'production/NARRATION_LOCKED.txt'))).read()

def display_words(text=TEXT):
    return [w for w in text.split() if w]

def norm(words):
    out = []
    for w in (words if isinstance(words, list) else words.split()):
        w = w.lower().replace('’', "'").replace('—', ' ').replace('…', ' ')
        out += [x for x in re.sub(r"[^a-z' ]", ' ', w).split() if x]
    # an ASR model may split "ultrasound" ("ultra sound") or drop the apostrophe of "it's": the same locked word
    merged = []
    for x in out:
        if merged and merged[-1] == 'ultra' and x == 'sound': merged[-1] = 'ultrasound'
        else: merged.append("it's" if x == 'its' else x)
    return merged

DW = display_words()
LW = norm(TEXT)
