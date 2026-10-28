#!/usr/bin/env python3
"""Script and caption sequence checks: the locked script is 72 words; the captions, read in order, are the script
verbatim; the SRT carries the same text in the same order; the measured word list is the script's words; and no
on-screen text in the source asks viewers to subscribe, like or comment."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LOCKED, LW, norm
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
caps = ' '.join(c['text'] for c in tl['captions'])
srt = open(os.path.join(EP, 'captions/FGW_Transparent_Mouse_Skin_V1.srt'), encoding='utf-8').read()
srt_text = ' '.join(b.split('\n', 2)[2].strip() for b in srt.strip().split('\n\n'))
checks = {
    'script_words_72': len(LOCKED.split()) == 72,
    'captions_equal_script': caps.split() == LOCKED.split(),
    'srt_equals_captions': srt_text.split() == caps.split(),
    'timeline_words_equal_script': [w['word'] for w in tl['words']] == LW,
    'caption_lengths_ok': all(1 <= len(c['text'].split()) <= 6 for c in tl['captions']),
    'captions_ordered_non_overlapping': all(a['hide'] <= b['show'] + 1e-6 for a, b in zip(tl['captions'], tl['captions'][1:])),
}
bad = []
for root, _, files in os.walk(os.path.join(EP, 'source/src')):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            s = open(os.path.join(root, f), encoding='utf-8').read()
            for m in re.finditer(r'(?i)\b(subscribe|like and|comment below|follow us|hit the bell)\b', s):
                bad.append(f'{f}: {m.group(0)}')
checks['no_engagement_prompts_in_source'] = not bad
print(json.dumps(checks, indent=1)); print('engagement hits:', bad)
sys.exit(0 if all(checks.values()) else 1)
