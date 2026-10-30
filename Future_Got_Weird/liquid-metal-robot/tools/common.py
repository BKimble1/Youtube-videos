"""Shared paths and text helpers for the Liquid Metal Robot V1 Short."""
import os, re, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = open(os.path.join(ROOT, 'production/NARRATION_LOCKED.txt')).read().strip()
ASR_ROOT = os.environ.get('FGW_ASR', '/tmp/claude-0/-home-user-Youtube-videos/f494a593-afd8-5938-88ab-f8f09aa8e111/scratchpad/asr')
SR = 48000
FPS = 30
VOICE_START = 0.06   # first speech sample lands here
EMPH = ['melts', 'magnetic', 'particles', 'liquid', 'model', 'stomach', 'hardened', 'inside', 'you']

def display_words(text=SCRIPT):
    return [w for w in text.replace('…', '… ').split() if w and w != '…']

def norm(words):
    out = []
    for w in (words if isinstance(words, list) else words.split()):
        w = w.lower().replace('’', "'").replace('—', ' ').replace('…', ' ')
        out += [x for x in re.sub(r"[^a-z' ]", ' ', w).split() if x]
    return out
