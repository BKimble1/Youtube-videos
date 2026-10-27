#!/usr/bin/env python3
"""Final narration from take 2 (ElevenLabs Test Voice, eleven_v4; see audio/narration/voice_provenance.json).
The only edit is shortening a few sentence pauses: silent samples (< -45 dBFS) are removed from the middle of the
pause, with 8 ms cosine crossfades, so no speech sample is altered, stretched or re-pitched. Word times are
re-timed by the same cuts. Speech starts on frame 0.
Writes audio/narration/FGW_WiFi_Walls_narration_final.wav (48 kHz/24-bit), audio/narration/words_final.json,
source/src/data/timeline.json (captions + words) and captions/FGW_WiFi_Through_Walls_V1.srt.
usage: python3 -I tools/make_narration.py"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LOCKED, norm

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/take2.mp3'
TAIL = 0.55  # after "are": the last beat lands as the picture returns to the opening frame
# pause after word index -> target pause length (s); the measured pause is cut down to this (never lengthened)
TARGET = {'wall': 0.30, 'you#1': 0.30, 'walls': 0.26, 'you#2': 0.30, 'hand#0': 0.27, 'hand#1': 0.32,
          'past': 0.26, 'phones': 0.30, 'correctly': 0.32, 'cafe': 0.27, 'anything': 0.36}

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
tl = json.load(open(os.path.join(EP, 'audio/narration/takes/take2_words.json')))
W = tl['words']
win = int(0.005 * SR)
lv = 20 * np.log10(np.sqrt(np.array([np.mean(y[i:i + win] ** 2) for i in range(0, len(y) - win, win)])) + 1e-12)
quiet = lv < -45

def silent_run(t0, t1):
    """longest run of quiet 5 ms windows between t0 and t1 (s) -> (start_s, end_s)"""
    a, b = int(t0 / 0.005), int(t1 / 0.005)
    best, cur = (0, 0), None
    for i in range(a, min(b, len(quiet))):
        if quiet[i]:
            cur = i if cur is None else cur
            if i + 1 - cur > best[1] - best[0]: best = (cur, i + 1)
        else: cur = None
    return best[0] * 0.005, best[1] * 0.005

seen, cuts = {}, []
for i, w in enumerate(W[:-1]):
    n = seen.get(w['word'], 0); seen[w['word']] = n + 1
    key = f"{w['word']}#{n}" if f"{w['word']}#{n}" in TARGET else w['word'] if w['word'] in TARGET and n == 0 else None
    if key is None: continue
    s0, s1 = silent_run(W[i]['start'] + 0.12, W[i + 1]['start'] + 0.15)
    gap = s1 - s0
    excess = gap - TARGET[key]
    if excess > 0.03:
        mid = (s0 + s1) / 2
        cuts.append((mid - excess / 2, mid + excess / 2, w['word'], round(gap, 3)))
cuts.sort()
fade = int(0.008 * SR)
out, pos, removed = [], 0, []
for a, b, wd, gap in cuts:
    ia, ib = int(round(a * SR)), int(round(b * SR))
    seg = y[pos:ia].copy()
    if out: seg[:fade] *= np.sin(np.linspace(0, np.pi / 2, fade)) ** 2
    seg[-fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    out.append(seg); pos = ib; removed.append((a, b - a, wd, gap))
seg = y[pos:].copy(); seg[:fade] *= np.sin(np.linspace(0, np.pi / 2, fade)) ** 2; out.append(seg)
y2 = np.concatenate(out)

def remap(t):
    sh = 0.0
    for a, d, _, _ in removed:
        if t >= a + d: sh += d
        elif t > a: sh += t - a
    return round(t - sh, 3)
W2 = [{'word': w['word'], 'start': remap(w['start']), 'end': remap(w['end'])} for w in W]
speech_end = W2[-1]['end']
end_i = min(len(y2), int(round((speech_end + 0.12) * SR)))
y2 = y2[:end_i]; f = int(0.06 * SR); y2[-f:] *= np.linspace(1, 0, f)
frames = int(round((speech_end + TAIL) * FPS)); total = frames / FPS
y2 = np.concatenate([y2, np.zeros(int(round(total * SR)) - len(y2))])
os.makedirs(os.path.join(EP, 'source/src/data'), exist_ok=True)
sf.write(os.path.join(EP, 'audio/narration/FGW_WiFi_Walls_narration_final.wav'), y2, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'duration_s': total, 'frames': frames, 'pause_cuts': [{'at_s': round(a, 3), 'removed_s': round(d, 3), 'after': wd, 'pause_was_s': g} for a, d, wd, g in removed], 'words': W2},
          open(os.path.join(EP, 'audio/narration/words_final.json'), 'w'), indent=1)

# caption chunks: the locked narration in order, 2-4 words each; emphasis keys are the brief's highlighted words
CH = [('If you hid', []), ('behind this wall…', []), ('this machine could', []), ('STILL WATCH YOU.', ['still', 'watch', 'you']),
      ('Scientists built a system', []), ('that shoots invisible', []), ('radio waves', []), ('THROUGH walls.', ['through', 'walls']),
      ('And when they bounce', []), ('off your body,', []), ('AI creates', []), ('a moving SKELETON of you.', ['skeleton']),
      ('Raise your hand?', []), ('It raises its hand.', []),
      ("But here's where", []), ('it gets CREEPY.', ['creepy']),
      ('In a separate experiment,', []), ('scientists used', []), ('ordinary Wi-Fi signals', ['wifi']), ('to IDENTIFY', ['identify']), ('people walking past.', []),
      ('Even WITHOUT', ['without']), ('their phones.', ['their', 'phones']),
      ('They tested', []), ('197 people…', ['197', 'people']), ('and identified', []), ('almost EVERYONE correctly.', ['everyone']),
      ('So imagine', []), ('walking past a café,', []), ('and it recognizes you', []), ('without you doing ANYTHING.', ['anything']),
      ('Now would you rather', []), ('have a CAMERA', ['camera']), ('watching you…', []),
      ('Or Wi-Fi', ['wifi']), ('that knows who you are?', [])]
flat = lambda s: s.replace('…', '...').replace('\n', ' ').split()
assert ' '.join(flat(' '.join(t for t, _ in CH))).lower() == ' '.join(flat(LOCKED)).lower(), 'captions must be the locked narration verbatim'
caps, k = [], 0
for text, emph in CH:
    n = len(norm(text)); ws = W2[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(W2), (k, len(W2))
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total
    c['show'] = round(max(0, c['start'] - 0.05), 3)
    c['hide'] = round(nxt - 0.05 if nxt - c['end'] < 0.7 else c['end'] + 0.4, 3)
json.dump({'fps': FPS, 'frames': frames, 'duration': total, 'captions': caps, 'words': W2}, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)
def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_WiFi_Through_Walls_V1.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total:.3f} s ({frames} frames); removed {sum(d for _, d, _, _ in removed):.2f} s in {len(removed)} pauses')
for a, d, wd, g in removed: print(f'  after {wd:10} pause {g:.2f} -> {g - d:.2f}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
