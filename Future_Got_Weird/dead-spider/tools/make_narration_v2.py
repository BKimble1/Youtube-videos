#!/usr/bin/env python3
"""V2: selected take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.
The take is used whole and unedited: no trim inside it, no time-stretch, no pitch change. It starts at frame 0 (the
take's own 80 ms of room tone is the only lead) and is padded with silence to the film length.
Word times are ElevenLabs Scribe's (audio/narration/takes/t2_Z71H_scribe.json); Scribe returns "spider—and" as one
token, which is split at the measured pause inside it; any word onset that follows a pause is snapped to the measured
waveform onset (so a caption never leads the sound)."""
import json, subprocess, hashlib, sys, os
os.environ['FGW_SCRIPT'] = 'production/NARRATION_APPROVED_V2.txt'
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import DW, norm, ROOT

SR = 48000
FPS = 30
TAKE = 'audio/narration/takes/v2_t1_d88W.mp3'
SCRIBE = 'audio/narration/takes/v2_t1_d88W_scribe.json'
DURATION = 30.2  # film length (s): speech ends 29.33 s; the lift completes and holds briefly, then the loop
os.chdir(ROOT)

y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
win = SR // 100
n = len(y) // win
db = 20 * np.log10(np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)
loud = db > -45

# Scribe tokens, without the inline direction tags (never spoken)
tok, inside = [], False
for w in json.load(open(SCRIBE))['words']:
    if w['type'] != 'word': continue
    if w['text'].startswith('['): inside = True
    if not inside: tok.append(w)
    if w['text'].endswith(']'): inside = False
words = []
for w in tok:
    if '—' in w['text']:
        a, b = w['text'].split('—')
        # the pause inside the token: the longest quiet run between its start and end
        i0, i1 = int(w['start'] * 100), int(w['end'] * 100)
        best, run, bs = (0, 0), 0, 0
        for i in range(i0, i1):
            if not loud[i]:
                if run == 0: bs = i
                run += 1
                if run > best[1]: best = (bs, run)
            else:
                run = 0
        g0, g1 = best[0] / 100, (best[0] + best[1]) / 100
        words.append({'text': a + '—', 'start': w['start'], 'end': g0})
        words.append({'text': b, 'start': g1, 'end': w['end']})
    else:
        words.append({'text': w['text'], 'start': w['start'], 'end': w['end']})
assert [x for x in norm([w['text'] for w in words])] == norm(DW), 'Scribe tokens do not match the locked text'
assert len(words) == len(DW)
# snap onsets after a pause to the waveform
for k, w in enumerate(words):
    i = int(w['start'] * 100)
    if i >= 15 and not loud[i - 15:i - 2].any():
        j = i - 2
        while j < len(loud) - 1 and not loud[j]: j += 1
        if abs(j / 100 - w['start']) < 0.12: w['start'] = j / 100
out = [{'word': DW[k], 'start': round(w['start'], 3), 'end': round(w['end'], 3)} for k, w in enumerate(words)]

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(5, []), (4, ['dead']), (7, ['move']), (5, []), (5, []), (6, []), (4, []), (4, []), (3, []), (5, []), (4, []),
          (4, []), (5, ['open']), (6, []), (4, ['clamped', 'shut']), (5, []), (4, []), (5, []), (3, []), (3, ['another'])]
assert sum(c[0] for c in CHUNKS) == len(out), sum(c[0] for c in CHUNKS)
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = out[i:i + nw]; i += nw
    caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
for k, c in enumerate(caps):
    c['show'] = round(max(0.0, c['start'] - 0.04), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else DURATION
    c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)

pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:len(y)] = y[:len(pad)]
os.makedirs('audio/narration', exist_ok=True)
wav = 'audio/narration/FGW_Dead_Spider_narration_V2.wav'
sf.write(wav, pad, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'words': out}, open('audio/narration/FGW_Dead_Spider_V2_words.json', 'w'), indent=1)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': out}
json.dump(tl, open('source/src/data/timeline_v2.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Dead_Spider_V2.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(max(c['end'], c['start'] + 0.3) if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
h = hashlib.sha256(open(wav, 'rb').read()).hexdigest()
sp = np.where(loud)[0]
print(json.dumps({'wav': wav, 'sha256': h, 'duration_s': DURATION, 'speech_s': [sp[0] / 100, sp[-1] / 100 + 0.01], 'words': len(out),
                  'wpm_span': round(len(out) / ((out[-1]['end'] - out[0]['start']) / 60), 1)}, indent=1))
