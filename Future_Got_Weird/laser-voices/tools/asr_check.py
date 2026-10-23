#!/usr/bin/env python3
"""Independent transcript check with Vosk (vosk-model-small-en-us-0.15, Apache-2.0; in this environment it is taken
from the npm package transcribe2texts, which bundles it). Free recognition, no script given to the recogniser.
Reports the transcript, word error rate against the approved narration and the differing words.
usage: python3 tools/asr_check.py <model_dir> <audio> [out.json] [t0 t1]"""
import sys, json, subprocess, difflib
from vosk import Model, KaldiRecognizer, SetLogLevel
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from script import LW, norm

def transcribe(model_dir, path, t0=None, t1=None):
    SetLogLevel(-1)
    cmd = ['ffmpeg', '-v', 'error']
    if t0 is not None: cmd += ['-ss', str(t0), '-to', str(t1)]
    raw = subprocess.run(cmd + ['-i', path, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
    rec = KaldiRecognizer(Model(model_dir), 16000); rec.SetWords(True)
    words = []
    for i in range(0, len(raw), 8000):
        if rec.AcceptWaveform(raw[i:i + 8000]): words += json.loads(rec.Result()).get('result', [])
    words += json.loads(rec.FinalResult()).get('result', [])
    return words

def compare(hyp):
    sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
    diffs = [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    errs = sum(max(len(a.split()), len(b.split())) for _, a, b in diffs)
    return errs / len(LW), diffs

if __name__ == '__main__':
    t0 = float(sys.argv[4]) if len(sys.argv) > 5 else None
    t1 = float(sys.argv[5]) if len(sys.argv) > 5 else None
    words = transcribe(sys.argv[1], sys.argv[2], t0, t1)
    hyp = [w['word'] for w in words]
    w, diffs = compare(norm(' '.join(hyp)))
    print(f'{sys.argv[2]}: Vosk WER vs approved {w:.3f}')
    print('  ', ' '.join(hyp))
    for d in diffs: print('   ', d)
    if len(sys.argv) > 3: json.dump({'audio': sys.argv[2], 'model': 'vosk-model-small-en-us-0.15', 'wer': round(w, 3), 'diffs': diffs, 'words': words}, open(sys.argv[3], 'w'), indent=1)
