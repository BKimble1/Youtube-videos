"""The locked narration (production/NARRATION_LOCKED.txt), its display words and a normalised word list."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(ROOT, os.environ.get('FGW_SCRIPT', 'production/NARRATION_LOCKED.txt'))).read()

def display_words(text=TEXT):
    
    return [w for w in text.replace('…', '… ').split() if w and w != '…']

def norm(words):
    out = []
    for w in (words if isinstance(words, list) else words.split()):
        w = w.lower().replace('’', "'").replace('—', ' ').replace('…', ' ')
        w = w.replace('200,000', '200000')
        out += [x for x in re.sub(r"[^a-z0-9' ]", ' ', w).split() if x]
    # an ASR model writes the number as words: "two hundred thousand" is the one locked word "200000"
    merged = []
    for x in out:
        if len(merged) >= 2 and merged[-2:] == ['two', 'hundred'] and x == 'thousand': merged[-2:] = ['200000']
        else: merged.append(x)
    return merged

DW = display_words()
LW = norm(TEXT)
