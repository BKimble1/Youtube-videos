#!/usr/bin/env python3
"""Final narration for Flying Skateboard V1.

The channel narrator (ElevenLabs "Test Voice", kk5XaSLo2XAw0sKM98zU, eleven_v4), take 1 (generation pjvQYEo2uwtUu9SSysgJ),
chosen by measurement (audio/narration/voice_provenance.json). Processing, in order:
  1. decode to 48 kHz mono;
  2. lengthen two sentence gaps (the brief's breathing room): after "FIRE." by 0.30 s and after "CANYON." by 0.40 s.
     The added time is the gap's own room tone (its quietest 60 ms, repeated with 10 ms crossfades), so the noise
     floor never drops out. No word is cut, stretched or pitch-shifted, and no other gap is touched;
  3. a lead of LEAD s before the first word and a tail after the last for the loop return.
Word times are ElevenLabs Scribe's (an independent transcription of the plain MP3, not aligned to the prompt), shifted
by the edits. Each word start that follows a pause is checked against the waveform onset.
Outputs: audio/narration/FGW_Flying_Skateboard_narration_V1.wav (48k/24-bit), audio/narration/FGW_Flying_Skateboard_V1_words.json,
         source/src/data/timeline.json, captions/FGW_Flying_Skateboard_V1.srt"""
import json, os, re, subprocess
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t1_pjvQ.mp3'
SCRIBE = 'audio/narration/takes/t1_pjvQ_scribe.json'
LEAD = 0.10   # the first word lands on frame ~7: the hook is already in flight on frame 0
TAIL = 1.75   # after "thing?": the bank and the return to the opening composition
EXTEND = {'fire': 0.30, 'canyon': 0.40}

LOCKED = open(os.path.join(EP, 'production/NARRATION_APPROVED.txt'), encoding='utf-8').read().strip()
norm = lambda s: re.sub(r"[^a-z' ]", ' ', s.lower().replace('’', "'").replace('…', ' ')).split()
LW = norm(LOCKED)

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()
sw = [w for w in json.load(open(os.path.join(EP, SCRIBE)))['words'] if w.get('type', 'word') == 'word']
words = []
for w in sw:
    t = w['text'].lower().strip('.,?:;!…')
    t = {'10': 'ten'}.get(t, t)
    words.append({'word': t.replace('’', "'"), 'start': w['start'], 'end': w['end']})
assert [w['word'] for w in words] == LW, ('transcript differs from the locked narration', [w['word'] for w in words])

# onset check on the waveform (20 ms RMS): a word after a pause starts at the first window above -45 dBFS
win = int(0.01 * SR)
lv = 20 * np.log10(np.sqrt(np.array([np.mean(y[i:i + win] ** 2) for i in range(0, len(y) - win, win)])) + 1e-9)
for i, w in enumerate(words):
    if i == 0 or w['start'] - words[i - 1]['end'] > 0.2:
        j0 = int(w['start'] / 0.01)
        for j in range(max(0, j0 - 15), min(len(lv), j0 + 15)):
            if lv[j] > -45:
                w['start'] = round(j * 0.01, 3)
                break

# 2. gap extensions (room tone from the gap itself)
x = int(0.01 * SR)
segs, pos, shift = [], 0, []
for i, w in enumerate(words):
    if w['word'] in EXTEND and i + 1 < len(words):
        a, b = w['end'], words[i + 1]['start']
        ia, ib = int(a * SR), int(b * SR)
        gap = y[ia:ib]
        n = int(0.06 * SR)
        best = min(range(0, len(gap) - n, x), key=lambda k: np.mean(gap[k:k + n] ** 2))
        tone = gap[best:best + n]
        need = int(EXTEND[w['word']] * SR)
        reps = []
        while sum(len(r) for r in reps) < need + 2 * x:
            reps.append(tone)
        fill = np.concatenate(reps)[:need + 2 * x]
        cut = ia + best + n // 2
        head = y[pos:cut].copy()
        fill = fill.copy()
        fill[:x] = fill[:x] * np.linspace(0, 1, x) + head[-x:] * np.linspace(1, 0, x)
        head = head[:-x]
        fill[-x:] *= np.linspace(1, 0, x)
        nxt = y[cut:cut + x] * np.linspace(0, 1, x)
        fill[-x:] += nxt
        segs += [head, fill]
        pos = cut + x
        shift.append((cut / SR, EXTEND[w['word']]))
segs.append(y[pos:])
y2 = np.concatenate(segs)

def moved(t):
    return t + sum(d for c, d in shift if t > c)

for w in words:
    w['start'] = round(moved(w['start']) + LEAD, 3)
    w['end'] = round(moved(w['end']) + LEAD, 3)
y2 = np.concatenate([np.zeros(int(LEAD * SR)), y2])
speech_end = words[-1]['end']
end_i = min(len(y2), int(round((speech_end + 0.18) * SR)))
y3 = y2[:end_i].copy()
f = int(0.05 * SR); y3[-f:] *= np.linspace(1, 0, f)
frames = int(round((speech_end + TAIL) * FPS)); total_s = frames / FPS
y3 = np.concatenate([y3, np.zeros(int(round(total_s * SR)) - len(y3))])
sf.write(os.path.join(EP, 'audio/narration/FGW_Flying_Skateboard_narration_V1.wav'), y3, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'word_times': 'ElevenLabs Scribe (eleven_scribe_v1) on the plain MP3, onsets checked on the waveform, shifted by the edits',
           'gap_extensions_s': EXTEND, 'lead_s': LEAD, 'tail_s': TAIL, 'duration_s': total_s, 'frames': frames, 'words': words},
          open(os.path.join(EP, 'audio/narration/FGW_Flying_Skateboard_V1_words.json'), 'w'), indent=1)

# Caption phrases: the approved narration in short spoken chunks (text exactly as approved, in order).
CH = [('This skateboard', []), ('could make you FLY', ['fly']), ('across a RIVER.', ['river']),
      ('You see, ten powerful', []), ('electric propellers', []), ('blast air downward,', []), ('lifting you completely', []), ('off the ground.', []),
      ('But his first version', []), ('used JET ENGINES…', ['jet', 'engines']), ('and caught FIRE.', ['fire']),
      ('So he switched to electric.', []),
      ('Except there’s', []), ('one HUGE problem.', ['huge']),
      ('The board can’t', []), ('balance itself.', []),
      ('He has to control it', []), ('with his entire BODY,', ['body']), ('while an AI voice coach', []), ('helps him learn', []), ('how to balance.', []),
      ('And after just over', []), ('ten days of practice,', []), ('he actually flew', []), ('across a RIVER…', ['river']), ('and THROUGH a CANYON.', ['through', 'canyon']),
      ('How much would someone', []), ('have to PAY YOU', ['pay', 'you']), ('to ride this thing?', [])]
flat = lambda s: re.sub(r'\s+', '', s)
assert flat(''.join(t for t, _ in CH)) == flat(LOCKED), 'captions must be the approved narration verbatim'
assert norm(' '.join(t for t, _ in CH)) == LW
caps, k = [], 0
for text, emph in CH:
    n = len(norm(text)); ws = words[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(words)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total_s
    c['show'] = round(max(0, c['start'] - 0.04), 3)
    c['hide'] = round(nxt - 0.04 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
os.makedirs(os.path.join(EP, 'source/src/data'), exist_ok=True)
json.dump({'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': words}, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Flying_Skateboard_V1.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'duration {total_s:.3f} s ({frames} frames); speech {words[0]["start"]:.2f}-{words[-1]["end"]:.2f}')
for w in words: print(f"  {w['word']:12} {w['start']:6.2f} {w['end']:6.2f}")
