#!/usr/bin/env python3
"""Stitch the five selected narration takes into the timing master, with word timings and SRT.
No time-stretch, no pitch change, no edits inside a take: each take is used whole from its first word onset (less a
40 ms pre-roll) to its last word end (plus 60 ms), with fixed silences between blocks and 10 ms fades at the joins.
Word onsets come from ElevenLabs Scribe (audio/narration/scribe_blocks_raw.json), shifted by each block's offset;
an onset after a pause is snapped to the measured waveform onset so a cue never leads the sound."""
import json, subprocess, hashlib, sys, re
import numpy as np, soundfile as sf
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from script import blocks, words as disp_words
SR = 48000
TAKES = ['audio/narration/takes/hook2_t2_khvE.mp3', 'audio/narration/takes/b2_t1_Jy3b.mp3', 'audio/narration/takes/b3_t1_uusj.mp3',
         'audio/narration/takes/b4_t1_Eotl.mp3', 'audio/narration/takes/b5_t2_OsaP.mp3']
GEN = ['khvEr0WgtHf6RKNSp5dP', 'Jy3bCPg2jst4vdz6hjFN', 'uusjstuhOPqWcYJQk5LE', 'EotlK5Lt4r3LJjQH1Owg', 'OsaPgifeMUoLBFXeY7gz']
LEAD = 0.40            # silence before the first word (frame 0 already shows the action)
GAPS = [0.85, 0.80, 0.90, 1.00]   # silence between blocks
TAIL = 2.80            # after the last word: the final expression resolves
raw = json.load(open('audio/narration/scribe_blocks_raw.json'))

def dec(p):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).copy()

def level_db(y, win=480):
    n = len(y) // win
    return 20 * np.log10(np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)

out = [np.zeros(int(LEAD * SR), np.float32)]
t = LEAD
allw = []
offsets = []
for bi, p in enumerate(TAKES):
    y = dec(p)
    ws = raw[str(bi)]['words']
    lv = level_db(y)
    # first audible onset near the first word
    a = max(0, int((ws[0]['start'] - 0.04) * SR))
    on = np.where(lv > -50)[0]
    a = min(a, max(0, on[0] * 480 - int(0.04 * SR)))
    last_loud = on[-1] * 480 + 480
    b = min(len(y), max(int(ws[-1]['end'] * SR), last_loud) + int(0.06 * SR))
    seg = y[a:b].copy()
    f = int(0.01 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    off = t - a / SR
    offsets.append({'block': bi, 'take': p, 'generation_id': GEN[bi], 'src_in': round(a / SR, 3), 'src_out': round(b / SR, 3), 'offset': round(off, 3), 'start': round(t, 3)})
    # display words of the locked text, mapped one-to-one onto Scribe tokens
    dw = disp_words(blocks()[bi])
    assert len(dw) == len(ws), (bi, len(dw), len(ws))
    for k, (w, d) in enumerate(zip(ws, dw)):
        s, e = w['start'], w['end']
        # snap onset after a pause (>=120 ms below -55 dB) to the waveform
        i0 = int(s * SR / 480)
        for j in range(max(12, i0 - 15), min(len(lv), i0 + 12)):
            if lv[j] > -48 and lv[j - 12:j].max() < -55:
                if j * 480 / SR <= s + 0.06 and (k == 0 or j * 480 / SR > ws[k - 1]['start'] + 0.12): s = j * 480 / SR
                break
        allw.append({'word': d, 'block': bi, 'start': round(s + off, 3), 'end': round(e + off, 3)})
    out.append(seg)
    t += len(seg) / SR
    if bi < len(GAPS):
        out.append(np.zeros(int(GAPS[bi] * SR), np.float32)); t += GAPS[bi]
out.append(np.zeros(int(TAIL * SR), np.float32)); t += TAIL
# total length to a whole number of frames at 30 fps
y = np.concatenate(out)
nfr = int(np.ceil(len(y) / SR * 30))
y = np.concatenate([y, np.zeros(int(nfr / 30 * SR) - len(y), np.float32)])
# word ends: trim the padded silence (last 10 ms window above -40 dB before the next word)
lv = level_db(y)
for i, w in enumerate(allw):
    nxt = allw[i + 1]['start'] if i + 1 < len(allw) else len(y) / SR
    a, b = int(w['start'] * 100), min(len(lv), int(max(w['end'], nxt) * 100))
    loud = [j for j in range(a, b) if lv[j] > -40]
    w['end'] = round(min(nxt, (loud[-1] + 1) / 100) if loud else w['end'], 3)
sf.write('audio/narration/FGW_Robot_Faces_narration_V1.wav', y, SR, subtype='PCM_24')
sha = hashlib.sha256(open('audio/narration/FGW_Robot_Faces_narration_V1.wav', 'rb').read()).hexdigest()
meta = {'file': 'audio/narration/FGW_Robot_Faces_narration_V1.wav', 'sha256': sha, 'duration_s': round(len(y) / SR, 4), 'frames_30fps': nfr,
        'speech_s': [allw[0]['start'], allw[-1]['end']], 'words': len(allw), 'lead_s': LEAD, 'gaps_s': GAPS, 'tail_s': TAIL, 'blocks': offsets}
sp = allw[-1]['end'] - allw[0]['start']
meta['wpm_over_speech_span'] = round(len(allw) / sp * 60, 1)
json.dump(meta, open('audio/narration/narration_V1_meta.json', 'w'), indent=1)
json.dump(allw, open('audio/narration/FGW_Robot_Faces_V1_words.json', 'w'), indent=0)
json.dump({'fps': 30, 'frames': nfr, 'words': allw}, open('source/src/data/narration_words.json', 'w'))
print(json.dumps({k: v for k, v in meta.items() if k != 'blocks'}, indent=1))
