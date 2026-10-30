#!/usr/bin/env python3
"""V2: the same approved take -> narration master (48 kHz, 24-bit, mono), word timeline, captions, word and phrase SRTs.
The V2 brief asks for shorter pauses, not shorter substance. The speech itself is untouched (no splice inside a word,
no time-stretch, no pitch or gain change); only the long silent gaps between phrases are shortened, by removing the
middle of each gap (the removed audio is below -45 dBFS, the take's own room silence) with a 10 ms crossfade:
  sentence ends -> 0.24-0.26 s, the two ellipsis beats -> 0.26 / 0.30 s, the longer commas -> 0.20 s.
Then it is padded with silence after the last word for the push back into the eye that closes the loop.
Word times: tools/align_zipformer.py (Zipformer token timestamps snapped to measured onsets). Two short words that
end a phrase were placed after the following pause by that snapping; they are corrected here by hand from the
waveform's 10 ms energy (see FIX)."""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t1_gksf.mp3'
ALIGN = 'audio/narration/takes/t1_gksf_zipformer.json'
TAIL = float(os.environ.get('FGW_TAIL', '0.9'))
VER = os.environ.get('FGW_VER', 'V2')   # V4: FGW_VER=V4 FGW_TAIL=0.5 (the same speech; a shorter silent tail)
# word index -> the gap after it, at most (s)
CAP = {7: 0.26, 12: 0.24, 22: 0.24, 34: 0.20, 39: 0.20, 45: 0.24, 57: 0.20, 63: 0.26, 71: 0.20, 77: 0.26, 81: 0.30}
os.chdir(ROOT)
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
W = [dict(w) for w in json.load(open(ALIGN))['words']]
# index: (start, end), measured from the energy dips (tools: 10 ms RMS)
FIX = {38: (12.175, 12.30), 39: (12.30, 12.44), 40: (12.745, 12.83),   # "through | it, | and"
       62: (18.965, 19.02), 63: (19.03, 19.34)}                          # "around | it."
for k, (a, b) in FIX.items():
    W[k]['start'], W[k]['end'] = a, b
for k in range(1, len(W)):
    assert W[k]['start'] >= W[k - 1]['start'], k
cuts = []
for k, c in CAP.items():
    a, b = W[k]['end'], W[k + 1]['start']
    if b - a <= c: continue
    m = (a + b) / 2
    seg = y[int((m - (b - a - c) / 2) * SR):int((m + (b - a - c) / 2) * SR)]  # only the span that is removed
    rms_db = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)
    assert rms_db < -45, (W[k]['word'], rms_db)
    cuts.append((round(m - (b - a - c) / 2, 4), round(m + (b - a - c) / 2, 4), W[k]['word'], round(b - a, 3), c))
cuts.sort()
XF = int(0.010 * SR)
out, last = [], 0
for t0, t1, *_ in cuts:
    i0, i1 = int(t0 * SR), int(t1 * SR)
    out.append(y[last:i0 - XF])
    fade = np.linspace(0, 1, 2 * XF, dtype=np.float32)
    out.append(y[i0 - XF:i0 + XF] * (1 - fade) + y[i1 - XF:i1 + XF] * fade)
    last = i1 + XF
out.append(y[last:])
y = np.concatenate(out)
def shift(t):
    s_ = 0.0
    for t0, t1, *_ in cuts:
        if t >= t1: s_ += t1 - t0
        elif t > t0: s_ += t - t0
    return round(t - s_, 3)
W = [{'word': w['word'], 'start': shift(w['start']), 'end': shift(w['end'])} for w in W]
speech_end = W[-1]['end']
DURATION = round(round((speech_end + TAIL) * FPS) / FPS, 3)

CHUNKS = [(4, ['tooth']), (4, ['eye']), (5, ['see', 'again']), (5, ['cornea']), (5, []), (3, []), (4, ['teeth']), (5, ['bone']),
          (5, ['hole']), (6, ['lens']), (6, ['skin']), (6, ['months']), (6, ['tissue']), (4, []), (4, ['damaged']),
          (6, ['light', 'retina']), (4, ['ten', 'years']), (4, ['see', 'again'])]
assert sum(c[0] for c in CHUNKS) == len(W), sum(c[0] for c in CHUNKS)
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = W[i:i + nw]; i += nw
    caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end'], 'w0': i - nw})
for c in caps:
    c['show'] = round(max(0.0, c['start'] - 0.04), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else DURATION
    c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)

pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(y), len(pad))] = y[:len(pad)]
wav = f'audio/narration/FGW_Tooth_Eye_narration_{VER}.wav'
sf.write(wav, pad, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'fixed': {str(k): v for k, v in FIX.items()}, 'removed_silence': [{'from': c[0], 'to': c[1], 'after': c[2], 'gap_was': c[3], 'gap_now': c[4]} for c in cuts], 'words': W}, open(f'audio/narration/FGW_Tooth_Eye_{VER}_words.json', 'w'), indent=1)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(f'captions/FGW_Tooth_Eye_{VER}.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
with open(f'captions/FGW_Tooth_Eye_{VER}_words.srt', 'w') as f:
    for k, w in enumerate(W):
        f.write(f"{k + 1}\n{ts(w['start'])} --> {ts(w['end'])}\n{w['word']}\n\n")
print(json.dumps({'wav': wav, 'sha256': hashlib.sha256(open(wav, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'removed_s': round(sum(c[1] - c[0] for c in cuts), 3), 'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W)}, indent=1))
