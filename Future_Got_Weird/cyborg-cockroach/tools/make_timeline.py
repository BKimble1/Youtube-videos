"""Measured words -> caption chunks, show/hide times, timeline.json for the picture and the SRT.

Caption chunks are short spoken phrases (2-7 words) with restrained emphasis. Two asserts guard them: the chunks joined
equal the locked narration verbatim, and their words equal the aligned words in order.
show = first word start - 0.04 s; hide = next show if the gap to it is under 0.6 s, else last word end + 0.35 s
(the channel rule). The picture snaps these to whole frames and to cuts within 1.5 frames (src/captions.ts).

Writes source/src/data/timeline.json and captions/FGW_Cyborg_Cockroach_V1.srt
"""
import json
import os

from script import ROOT, locked_text, norm

FPS = 30
TAIL_S = 0.60  # after the last word: the final recognition beat and the loop approach (no padding beyond that)

CH = [
    ('This cockroach can fire a needle.', ['needle']),
    ('And a person holding a remote', ['remote']),
    ('decides when it shoots.', []),
    ('Scientists strapped a tiny launcher', []),
    ('onto a living cockroach,', ['living']),
    ('then used electrical pulses', []),
    ('to steer it.', ['steer']),
    ('A second cockroach', ['second']),
    ('carries a camera,', []),
    ('letting the operator watch', []),
    ('as the first moves into position.', []),
    ('Once it lines up,', []),
    ('they fire the injector.', []),
    ('They’ve demonstrated this', []),
    ('on laboratory targets.', ['laboratory']),
    ('But the plan is to send them', []),
    ('beneath collapsed buildings,', ['collapsed']),
    ('carrying emergency medicine.', ['medicine']),
    ('So if you’re trapped', []),
    ('and something starts', []),
    ('crawling toward you…', []),
    ('you might actually want it', []),
    ('to get closer.', ['closer']),
]


def main():
    W = json.load(open(os.path.join(ROOT, 'audio/narration/FGW_Cyborg_Cockroach_V1_words.json')))
    words = W['words']
    assert ' '.join(c for c, _ in CH) == ' '.join(locked_text().split()), 'chunks must equal the locked narration'
    caps, i = [], 0
    for text, emph in CH:
        n = len(text.split())
        ws = words[i:i + n]
        assert [norm(w['text']) for w in ws] == [norm(x) for x in text.split()], (text, [w['text'] for w in ws])
        for e in emph:
            assert e in [norm(x).replace("'", '') for x in text.split()], (e, text)
        caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
        i += n
    assert i == len(words)
    for k, c in enumerate(caps):
        c['show'] = round(max(0.0, c['start'] - 0.04), 3)
    for k, c in enumerate(caps):
        nxt = caps[k + 1]['show'] if k + 1 < len(caps) else None
        c['hide'] = round(nxt if (nxt is not None and nxt - c['end'] < 0.6) else c['end'] + 0.35, 3)
    speech_end = W['speech_end_s']
    frames = int(round((speech_end + TAIL_S) * FPS))
    caps[-1]['hide'] = round(min(caps[-1]['hide'], frames / FPS), 3)
    tl = {'fps': FPS, 'frames': frames, 'duration': frames / FPS, 'narration_s': W['duration_s'], 'speech_end': speech_end,
          'captions': caps,
          'words': [{'word': norm(w['text']), 'text': w['text'], 'start': w['start'], 'end': w['end']} for w in words],
          'phrases': W['phrases']}
    out = os.path.join(ROOT, 'source/src/data/timeline.json')
    json.dump(tl, open(out, 'w'), indent=1, ensure_ascii=False)

    def ts(t):
        ms = int(round(t * 1000))
        return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
    with open(os.path.join(ROOT, 'captions/FGW_Cyborg_Cockroach_V1.srt'), 'w', encoding='utf-8') as f:
        for k, c in enumerate(caps):
            f.write(f"{k + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
    print(f'{frames} frames ({frames / FPS:.3f} s); {len(caps)} captions')
    for c in caps:
        print(f"  {c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}  {c['emph']}")


if __name__ == '__main__':
    main()
