"""Caption sync check: for every spoken word, every frame lying wholly inside the word must show the caption that
contains it (qa/v3_caption_spans.json from tools/caption_spans_v3.ts; word times from audio/narration/v2_words.json)."""
import json, math, os
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = json.load(open(os.path.join(EP, 'qa/v3_caption_spans.json')))
W = json.load(open(os.path.join(EP, 'audio/narration/v2_words.json'))); W = W['words'] if isinstance(W, dict) else W
caps = json.load(open(os.path.join(EP, 'source/src/data/captions_v3.json')))['captions']
assert ' '.join(c['text'] for c in caps).split() == open(os.path.join(EP, 'production/NARRATION_LOCKED.txt'), encoding='utf-8').read().split()
idx = [i for i, c in enumerate(caps) for _ in c['text'].split()]
at = lambda f: next((c['i'] for c in C if c['a'] <= f < c['b']), None)
bad, n = [], 0
for k, w in enumerate(W):
    for f in range(math.ceil(w['start'] * 30), math.floor(w['end'] * 30)):
        n += 1
        if at(f) != idx[k]: bad.append((w['word'], f, at(f), idx[k]))
r = {'words': len(W), 'word_frames_checked': n, 'mismatched_frames': bad,
     'lead_frames': [round(caps[c['i']]['start'] * 30 - c['a'], 1) for c in C],
     'trail_frames': [round(c['b'] - caps[c['i']]['end'] * 30, 1) for c in C],
     'shortest_s': round(min((c['b'] - c['a']) / 30 for c in C), 2), 'captions': len(C)}
json.dump(r, open(os.path.join(EP, 'qa/v3/captions_sync.json'), 'w'), indent=1)
print(f"{n} word frames over {len(W)} words; mismatches {len(bad)} {bad[:8]}")
print(f"lead {min(r['lead_frames'])}..{max(r['lead_frames'])} frames; trail {min(r['trail_frames'])}..{max(r['trail_frames'])} frames; shortest {r['shortest_s']} s")
