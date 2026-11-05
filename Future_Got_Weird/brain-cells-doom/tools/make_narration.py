#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.

The approved words are production/NARRATION_LOCKED.txt, verbatim. Edits are limited to shortening long silent gaps
between sentences (measured below -45 dBFS) to a cap, each cut in the middle of a silent run with a 12 ms
equal-power crossfade. Every word is used sample for sample: no time-stretch, pitch or gain change. Word times are
measured on the edited master (tools/align_zipformer.py), not shifted.

usage:
  python3 tools/make_narration.py                 # from the downloaded take (the delivery path)
  python3 tools/make_narration.py --provisional   # timeline only, from the take's Scribe word times (no audio):
                                                  # used to build picture while the take could not be downloaded
"""
import json, subprocess, hashlib, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, DW

SR = 48000
FPS = 30
TAKE_ID = os.environ.get('FGW_TAKE', 't2_ZiRX')
TAKE = f'audio/narration/takes/{TAKE_ID}.mp3'
SCRIBE = f'audio/narration/takes/{TAKE_ID}_scribe.json'
MASTER = 'audio/narration/FGW_Brain_Cells_DOOM_narration_V1.wav'
ALIGN = 'audio/narration/master_zipformer.json'
TAIL = float(os.environ.get('FGW_TAIL', '0.97'))
CAP = float(os.environ.get('FGW_GAP_CAP', '9.0'))   # sentence gaps longer than this are shortened to it (9 s: the take is used untouched)
KEEP = {}                                              # per-sentence exceptions: next word -> kept gap (s)
os.chdir(ROOT)

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(4, ['200000']), (4, ['living']), (2, ['doom']), (7, ['shoot']), (4, ['actually']), (6, ['head']),
          (5, ['chip']), (7, ['electrical']), (6, ['fire']), (4, ['software']), (7, ['move', 'turn', 'shoot']),
          (5, ['terrible']), (4, ['computer']), (6, ['work']), (6, ['weirdest']), (4, ['controller']), (2, ['alive'])]
assert sum(c[0] for c in CHUNKS) == len(DW), (sum(c[0] for c in CHUNKS), len(DW))


def captions(W, duration):
    caps, i = [], 0
    for nw, emph in CHUNKS:
        ws = W[i:i + nw]; i += nw
        caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
    for c in caps:
        c['show'] = round(max(0.0, c['start'] - 0.04), 3)
    for k, c in enumerate(caps):
        nxt = caps[k + 1]['show'] if k + 1 < len(caps) else duration
        c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)
    return caps


def write_timeline(W, provisional):
    speech_end = W[-1]['end']
    duration = round(round((speech_end + TAIL) * FPS) / FPS, 3)
    caps = captions(W, duration)
    tl = {'fps': FPS, 'frames': int(round(duration * FPS)), 'duration': duration, 'provisional': provisional,
          'take': TAKE_ID, 'captions': caps, 'words': W}
    os.makedirs('source/src/data', exist_ok=True)
    json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

    def ts(t):
        ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
    os.makedirs('captions', exist_ok=True)
    with open('captions/FGW_Brain_Cells_DOOM_V1.srt', 'w') as f:
        for k, c in enumerate(caps):
            end = c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start'])
            f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(end)}\n{c['text']}\n\n")
    return tl


if '--provisional' in sys.argv:
    S = json.load(open(SCRIBE))['words']
    assert [w['word'] for w in S] == DW
    tl = write_timeline([{'word': w['word'], 'start': round(w['start'], 3), 'end': round(w['end'], 3)} for w in S], True)
    print(json.dumps({'provisional_from': SCRIBE, 'duration_s': tl['duration'], 'frames': tl['frames']}, indent=1))
    sys.exit(0)

import numpy as np, soundfile as sf
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
# align the raw take first, to find the pauses
raw_align = f'audio/narration/takes/{TAKE_ID}_zipformer.json'
subprocess.run([sys.executable, 'tools/align_zipformer.py', TAKE, os.environ.get('ASR_ROOT', '/tmp/asr'), raw_align], check=True, capture_output=True)
A = json.load(open(raw_align))
W0 = A['words']


def next_word(t):
    return next(w for w in W0 if w['start'] >= t - 0.02)


segs, cur, log = [], 0, []
X = int(0.012 * SR)
for a, b in A['pauses']:
    gap = b - a
    nw = next_word(b)['word'].strip(',.')
    cap = KEEP.get(nw, CAP)
    if gap <= cap + 0.02:
        continue
    cut = gap - cap
    mid = (a + b) / 2
    i0, i1 = int((mid - cut / 2) * SR), int((mid + cut / 2) * SR)
    segs.append((cur, i0)); cur = i1
    log.append({'before_word': nw, 'gap_s': round(gap, 3), 'kept_s': round(cap, 3), 'removed_s': round(cut, 3)})
segs.append((cur, len(y)))
out = y[segs[0][0]:segs[0][1]].copy()
fi = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
for s0, s1 in segs[1:]:
    nxt = y[s0:s1].copy()
    out[-X:] = out[-X:] * (1 - fi) + nxt[:X] * fi
    out = np.concatenate([out, nxt[X:]])
tmp = 'audio/narration/_edited_take.wav'
sf.write(tmp, out, SR, subtype='PCM_24')
subprocess.run([sys.executable, 'tools/align_zipformer.py', tmp, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
tl = write_timeline(W, False)
pad = np.zeros(int(round(tl['duration'] * SR)), np.float32)
pad[:min(len(out), len(pad))] = out[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
os.remove(tmp)
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'edited_s': round(len(out) / SR, 3), 'gap_edits': log, 'removed_total_s': round(sum(g['removed_s'] for g in log), 3),
                  'speech_end_s': W[-1]['end'], 'duration_s': tl['duration'], 'frames': tl['frames'], 'words': len(W),
                  'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1)}, indent=1))
