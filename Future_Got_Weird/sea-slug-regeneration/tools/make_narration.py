#!/usr/bin/env python3
"""Final narration and caption timing for Sea Slug Regeneration V1.

The take (ElevenLabs "Test Voice", eleven_v4, take 1) is used verbatim: decoded to 48 kHz mono, no cut, no stretch,
no pitch change. Speech starts at 0.08 s, so the voice starts on the first frame. A short tail follows "TWICE" so the
second separation can begin and match the first frame for the loop.

Word times come from ElevenLabs Scribe on the same take (takes/t1_Yx6F_scribe_words.json). The last word's end is
checked against the waveform (speech energy end) so the tail is measured from the real end of the voice.
Outputs: audio/narration/FGW_SeaSlug_narration_V1.wav, source/public/audio/narration.wav,
         source/src/data/timeline.json, captions/FGW_SeaSlug_Regeneration_V1.srt"""
import json, os, re, subprocess
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t1_Yx6F.mp3'
WORDS = 'audio/narration/takes/t1_Yx6F_scribe_words.json'
TAIL = 0.6  # after "TWICE": the neck pulls apart again into the first frame

LOCKED = open(os.path.join(EP, 'production/NARRATION_LOCKED.txt'), encoding='utf-8').read()


def norm(s):
    return [w for w in re.sub(r"[^a-z' ]", ' ', s.lower().replace('’', "'")).split() if w]


raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'],
                     capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
W = [{'word': w['text'], 'start': float(w['start']), 'end': float(w['end'])}
     for w in json.load(open(os.path.join(EP, WORDS)))['words'] if w['type'] == 'word']
assert [norm(w['word'])[0] for w in W] == norm(LOCKED), 'take must be the locked narration verbatim'

# measured end of speech: last 10 ms window above -45 dBFS
win = int(0.01 * SR)
rms = np.sqrt(np.convolve(y ** 2, np.ones(win) / win, 'same'))
above = np.nonzero(rms > 10 ** (-45 / 20))[0]
speech_end = above[-1] / SR
speech_start = above[0] / SR
frames = int(round((max(speech_end, W[-1]['end']) + TAIL) * FPS))
total = frames / FPS
y = y[:int(total * SR)]
y = np.concatenate([y, np.zeros(int(round(total * SR)) - len(y))])
for p in [os.path.join(EP, 'audio/narration/FGW_SeaSlug_narration_V1.wav'), os.path.join(EP, 'source/public/audio/narration.wav')]:
    sf.write(p, y, SR, subtype='PCM_24')

# caption chunks: the locked narration in spoken order; emphasis = words shown in yellow capitals
CH = [('If this sea slug', []), ('cuts off its own HEAD…', ['head']), ('that head can keep CRAWLING.', ['crawling']),
      ('And its headless BODY?', ['body']), ('It keeps MOVING too.', ['moving']),
      ('You see, there’s a weak spot', []), ('just behind its head.', []),
      ('When it breaks apart,', []), ('even its HEART stays behind.', ['heart']),
      ('Scientists think it may be', []), ('escaping PARASITES', ['parasites']), ('in its old body.', []),
      ('But the head', []), ('starts eating algae…', []),
      ('and about a week later,', []), ('a NEW HEART starts BEATING.', ['new', 'heart', 'beating']),
      ('Then, over the next few weeks,', []), ('an ENTIRE NEW BODY grows back.', ['entire', 'new', 'body']),
      ('And one of these sea slugs', []), ('actually did it… TWICE.', ['twice'])]
assert norm(' '.join(t for t, _ in CH)) == norm(LOCKED), 'captions must be the locked narration verbatim'
caps, k = [], 0
for text, emph in CH:
    n = len(norm(text))
    ws = W[k:k + n]
    k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(W)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total
    c['show'] = round(max(0, c['start'] - 0.04), 3)
    c['hide'] = round(nxt - 0.04 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3) if i + 1 < len(caps) else round(total, 3)
json.dump({'fps': FPS, 'frames': frames, 'duration': total, 'speech': [round(speech_start, 3), round(speech_end, 3)],
           'captions': caps, 'words': W}, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)


def ts(s):
    ms = int(round(s * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


with open(os.path.join(EP, 'captions/FGW_SeaSlug_Regeneration_V1.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps):
        fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'speech {speech_start:.3f}-{speech_end:.3f} s (scribe last word end {W[-1]["end"]}); total {total:.3f} s = {frames} frames')
for c in caps:
    print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
