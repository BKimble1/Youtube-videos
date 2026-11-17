#!/usr/bin/env python3
"""Narration: ElevenLabs takes -> WhisperX check and forced alignment -> master wav, word timeline, captions, SRT.

1. Each take is transcribed with WhisperX (faster-whisper small.en, CPU int8) and scored against the locked words
   (production/NARRATION_LOCKED.txt) by word error rate.
2. The chosen take is used sample for sample (no gap edits, stretch, pitch or gain change), padded to the film length.
3. The LOCKED words are force-aligned to it with WhisperX's wav2vec2 aligner (facebook/wav2vec2-base-960h), one
   segment per sentence (sentence spans found from the take's own pauses), so every caption and picture cue is keyed
   to measured word times at 60 fps.

usage: python3 tools/make_narration.py [take_id]     (default: the take with the lower WER, then the shorter)
"""
import json, os, sys, hashlib, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, SENTENCES, DW, CHUNKS, norm

os.chdir(ROOT)
FPS = 60
SR = 48000
TAIL = float(os.environ.get('FGW_TAIL', '1.4'))
TAKES = {'t1_9hVY': 'audio/narration/takes/t1_9hVY.mp3', 't2_BGu1': 'audio/narration/takes/t2_BGu1.mp3'}
MASTER = 'audio/narration/FGW_HeartFish_narration_V1.wav'
OUT = 'audio/narration/whisperx.json'

import whisperx  # noqa: E402


def wer(ref, hyp):
    r, h = [norm(w) for w in ref], [norm(w) for w in hyp]
    r, h = [w for w in r if w], [w for w in h if w]
    d = np.zeros((len(r) + 1, len(h) + 1), int)
    d[:, 0] = range(len(r) + 1)
    d[0, :] = range(len(h) + 1)
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (r[i - 1] != h[j - 1]))
    return d[len(r), len(h)] / max(1, len(r))


def sentence_spans(y16, n):
    """speech runs from the take's energy (20 ms frames, -40 dBFS), merged across the smallest pauses down to n spans"""
    w = 320
    e = np.array([np.sqrt(np.mean(y16[i:i + w] ** 2)) for i in range(0, len(y16) - w, w)])
    sp = 20 * np.log10(e + 1e-9) > -40
    runs, st = [], None
    for i, v in enumerate(sp):
        if v and st is None: st = i
        if not v and st is not None: runs.append([st * 0.02, i * 0.02]); st = None
    if st is not None: runs.append([st * 0.02, len(sp) * 0.02])
    while len(runs) > n:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        k = int(np.argmin(gaps))
        runs[k] = [runs[k][0], runs[k + 1][1]]
        del runs[k + 1]
    return runs


model = whisperx.load_model('small.en', 'cpu', compute_type='int8', language='en')
amodel, meta = whisperx.load_align_model(language_code='en', device='cpu', model_name='facebook/wav2vec2-base-960h')
report = {}
for tid, path in TAKES.items():
    a = whisperx.load_audio(path)
    res = model.transcribe(a, batch_size=4, language='en')
    hyp = ' '.join(s['text'].strip() for s in res['segments'])
    report[tid] = {'file': path, 'duration_s': round(len(a) / 16000, 3), 'transcript': hyp, 'wer': round(wer(DW, hyp.split()), 4),
                   'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest()}
    print(tid, report[tid]['duration_s'], 'WER', report[tid]['wer'], '|', hyp)

choice = sys.argv[1] if len(sys.argv) > 1 else sorted(report, key=lambda k: (report[k]['wer'], report[k]['duration_s']))[0]
a16 = whisperx.load_audio(TAKES[choice])
spans = sentence_spans(a16, len(SENTENCES))
segs = [{'text': s, 'start': max(0.0, sp[0] - 0.08), 'end': min(len(a16) / 16000, sp[1] + 0.12)} for s, sp in zip(SENTENCES, spans)]
al = whisperx.align(segs, amodel, meta, a16, 'cpu', return_char_alignments=False)
W = []
for seg in al['segments']:
    for w in seg['words']:
        W.append({'word': w['word'], 'start': round(float(w['start']), 3), 'end': round(float(w['end']), 3), 'score': round(float(w.get('score', 0)), 3)})
assert [norm(w['word']) for w in W] == [norm(w) for w in DW], 'alignment words differ from the locked text'
for i in range(len(W) - 1):  # strictly ordered, no overlap
    W[i]['end'] = min(W[i]['end'], W[i + 1]['start'])

speech_end = W[-1]['end']
duration = round(round((speech_end + TAIL) * FPS) / FPS, 4)
frames = int(round(duration * FPS))

# captions: phrase chunks, shown from their first word, held to the next (no blank frames inside a sentence run)
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = W[i:i + nw]; i += nw
    caps.append({'text': ' '.join(DW[i - nw:i]), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
for c in caps:
    c['show'] = round(max(0.0, c['start'] - 0.05), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else duration
    c['hide'] = round(nxt if nxt - c['end'] < 0.7 else c['end'] + 0.35, 3)
tl = {'fps': FPS, 'frames': frames, 'duration': duration, 'take': choice, 'provisional': False, 'captions': caps, 'words': W, 'sentences': [{'text': s, 'start': W[sum(len(x.split()) for x in SENTENCES[:k])]['start'], 'end': W[sum(len(x.split()) for x in SENTENCES[:k + 1]) - 1]['end']} for k, s in enumerate(SENTENCES)]}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)


def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


os.makedirs('captions', exist_ok=True)
with open('captions/FGW_HeartFish_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        end = c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start'])
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(end)}\n{c['text']}\n\n")

# master: the take sample for sample at 48 kHz, padded to the film length
import soundfile as sf
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKES[choice], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
pad = np.zeros(int(round(duration * SR)), np.float32)
pad[:min(len(y), len(pad))] = y[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
json.dump({'takes': report, 'chosen': choice, 'aligner': 'whisperx ' + getattr(whisperx, '__version__', '') + ' / facebook/wav2vec2-base-960h',
           'asr': 'faster-whisper small.en int8 (CPU)', 'sentence_spans': spans, 'words': W, 'master': MASTER,
           'master_sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'duration_s': duration, 'frames': frames}, open(OUT, 'w'), indent=1)
print(json.dumps({'chosen': choice, 'duration_s': duration, 'frames': frames, 'speech_end': speech_end, 'min_score': min(w['score'] for w in W)}, indent=1))
