"""Shared paths and text helpers for the 10-hook preview round."""
import os, re, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINES = json.load(open(os.path.join(ROOT, 'production/LINES.json')))
ASR_ROOT = os.environ.get('FGW_ASR', '/tmp/claude-0/-home-user-Youtube-videos/f494a593-afd8-5938-88ab-f8f09aa8e111/scratchpad/asr')
SR = 48000
FPS = 30
DUR = 6.0
VOICE_START = 0.06   # first speech sample lands here in every hook

def display_words(text):
    return [w for w in text.replace('…', '… ').split() if w and w != '…']

def norm(words):
    out = []
    for w in (words if isinstance(words, list) else words.split()):
        w = w.lower().replace('’', "'").replace('—', ' ').replace('…', ' ')
        out += [x for x in re.sub(r"[^a-z' ]", ' ', w).split() if x]
    return out
