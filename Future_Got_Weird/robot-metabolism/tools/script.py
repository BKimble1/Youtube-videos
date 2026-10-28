"""The locked narration (single authority: production/NARRATION_LOCKED.txt) and its normalised word list."""
import os, re
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCKED = open(os.path.join(EP, 'production/NARRATION_LOCKED.txt'), encoding='utf-8').read().strip()
norm = lambda s: re.sub(r"[^a-z' ]", ' ', s.lower().replace('’', "'")).split()
LW = norm(LOCKED)
