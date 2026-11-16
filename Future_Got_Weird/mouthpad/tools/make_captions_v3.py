"""V3 burned-in captions: the locked narration in short spoken phrases, timed from the V2 narration master's measured
words (audio/narration/v2_words.json). Channel rules (glass-climbing V8): a caption appears whole on its first frame,
holds still, appears 40 ms before its first word (never before the previous phrase's last word ends), and hides when
the next one shows (or 0.35 s after its last word across a longer pause).
Outputs: source/src/data/captions_v3.json, captions/FGW_MouthPad_V3.srt"""
import json, os, re
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCKED = open(os.path.join(EP, 'production/NARRATION_LOCKED.txt'), encoding='utf-8').read().split()
W = json.load(open(os.path.join(EP, 'audio/narration/v2_words.json')))
W = W['words'] if isinstance(W, dict) else W
TOTAL = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))['duration']

# (phrase exactly as locked, emphasised words shown in yellow capitals)
CH = [('If you put THIS in your mouth,', ['this']), ('you can play video games', ['games']), ('with your TONGUE.', ['tongue']),
      ('Seriously.', []), ('Watch this.', ['watch']),
      ("It's called the MouthPad.", ['mouthpad']),
      ('And that tiny gold square?', ['gold']), ("It's a touchpad", ['touchpad']), ('sitting on the roof of your mouth.', ['roof']),
      ('Move your tongue,', ['tongue']), ('your character moves.', ['moves']),
      ('Tilt your head,', ['head']), ('you AIM.', ['aim']),
      ('Press your tongue up,', ['press']), ('you CLICK.', ['click']),
      ('And people are already using this thing', ['already']), ('to control computers and phones', ['computers', 'phones']),
      ('without their hands.', ['hands']),
      ("But here's the craziest part.", ['craziest']),
      ('Close your mouth,', ['close']), ('and nobody can even SEE', ['see']), ('the controller.', ['controller']),
      ('So imagine losing a video game', ['losing']), ("to someone who's literally", ['literally']), ('just sitting there...', ['sitting']),
      ('With their mouth SHUT.', ['shut'])]
toks = ' '.join(t for t, _ in CH).split()
assert toks == LOCKED, 'captions must be the locked narration verbatim'
norm = lambda s: re.sub(r"[^a-z']", '', s.lower().replace('’', "'"))
assert [norm(w['word']) for w in W] == [norm(x) for x in LOCKED], 'word times out of step with the locked script'
for text, emph in CH:
    for e in emph: assert e in [norm(x) for x in text.split()], (text, e)
caps, k = [], 0
for text, emph in CH:
    n = len(text.split()); ws = W[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(W)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else TOTAL
    prev_end = caps[i - 1]['end'] if i else 0
    c['show'] = round(max(0, c['start'] - 0.04, prev_end), 3)  # never before the previous phrase's last word has ended
    nxt_show = max(nxt - 0.04, c['end']) if i + 1 < len(caps) else TOTAL
    c['hide'] = round(nxt_show if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
json.dump({'captions': caps}, open(os.path.join(EP, 'source/src/data/captions_v3.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_MouthPad_V3.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
