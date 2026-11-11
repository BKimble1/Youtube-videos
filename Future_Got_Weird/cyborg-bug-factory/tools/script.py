"""The locked narration (production/NARRATION_LOCKED.txt), its display words and a normalised word list.
'68' is kept as one token; recogniser output 'sixty eight' is folded back to '68' by norm()."""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXT = open(os.path.join(ROOT, os.environ.get('FGW_SCRIPT', 'production/NARRATION_LOCKED.txt'))).read()

def display_words(text=TEXT):
    return [w for w in text.replace('…', '… ').split() if w and w != '…']

def norm(words):
    s = ' '.join(words) if isinstance(words, list) else words
    s = s.lower().replace('’', "'").replace('—', ' ').replace('…', ' ').replace('-', ' ')
    s = re.sub(r'\bsixty eight\b', '68', s)
    return [x for x in re.sub(r"[^a-z0-9' ]", ' ', s).split() if x]

DW = display_words()
LW = norm(TEXT)
