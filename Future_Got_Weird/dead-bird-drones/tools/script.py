"""The locked narration (production/NARRATION_V2.txt), its display words and a normalised word list."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(ROOT, os.environ.get('FGW_SCRIPT', 'production/NARRATION_V2.txt'))).read()

def display_words(text=TEXT):
    # "ANT…" keeps its ellipsis on the word it follows
    return [w for w in text.replace('…', '… ').split() if w and w != '…']

def norm(words):
    out = []
    for w in (words if isinstance(words, list) else words.split()):
        w = w.lower().replace('’', "'").replace('—', ' ').replace('…', ' ')
        out += [x for x in re.sub(r"[^a-z' ]", ' ', w).split() if x]
    # an ASR model may split a compound the narration spells as one word ("gear box", "wild life"): count it as the one word
    merged = []
    for x in out:
        if merged and (merged[-1], x) in {('gear', 'box'), ('wild', 'life')}: merged[-1] += x
        else: merged.append(x)
    return merged

DW = display_words()
LW = norm(TEXT)
