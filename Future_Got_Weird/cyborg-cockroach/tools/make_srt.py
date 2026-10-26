#!/usr/bin/env python3
"""SRT from the captions exactly as the film burns them in (whole frames from source/src/captions.ts, exported by
source/src/dev/exportCues.ts as its second output), so the uploaded subtitles and the picture agree to the frame.

usage: python3 tools/make_srt.py <captions_frames.json> <out.srt>
"""
import json
import sys

caps = json.load(open(sys.argv[1]))


def ts(f, fps):
    ms = int(round(f / fps * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


out = []
for i, c in enumerate(caps, 1):
    out.append(f"{i}\n{ts(c['show'], c['fps'])} --> {ts(c['hide'], c['fps'])}\n{c['text']}\n")
open(sys.argv[2], 'w', encoding='utf-8').write('\n'.join(out))
print('srt written:', len(caps), 'cues ->', sys.argv[2])
