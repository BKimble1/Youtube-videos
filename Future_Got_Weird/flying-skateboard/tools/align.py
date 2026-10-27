#!/usr/bin/env python3
"""Word timeline for a narration take, measured on the audio with local models only (the sherpa-onnx models that
earlier episodes used cannot be downloaded in this environment):
  1. free recognition with PocketSphinx's bundled US-English model: an independent transcript, scored against the
     approved text (word error rate);
  2. forced alignment of the approved text (PocketSphinx) for word start/end times;
  3. each word start that follows a pause is moved to the measured waveform onset (first 10 ms above -50 dBFS after
     >= 80 ms below -60 dBFS), so a cue never leads the sound; a word ends at its last 10 ms window above -40 dBFS.
usage: python3 tools/align.py <take.mp3> [out.json]"""
import sys, json, subprocess, difflib
import numpy as np
from pocketsphinx import Decoder, Config, get_model_path
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from script import LW, norm

SR = 16000

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return raw, np.frombuffer(raw, np.int16).astype(np.float32) / 32768

def recognise(raw):
    d = Decoder(loglevel='FATAL')
    d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
    return d.hyp().hypstr if d.hyp() else ''

def wer(ref, hyp):
    sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    return errs / len(ref)

def align(raw):
    d = Decoder(loglevel='FATAL', bestpath=False)
    d.set_align_text(' '.join(LW))
    d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
    segs = [(s.word, s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg() if s.word not in ('<s>', '</s>', '<sil>', '(NULL)')]
    words = [w.split('(')[0] for w, _, _ in segs]
    assert words == LW, ('alignment word mismatch', words[:10])
    return segs

def timeline(path):
    raw, y = load(path)
    hyp = recognise(raw)
    segs = align(raw)
    W = 160
    lv = 20 * np.log10(np.sqrt(np.array([np.mean(y[i:i + W] ** 2) for i in range(0, len(y) - W, W)])) + 1e-9)
    out = []
    for (w, s, e), lw in zip(segs, LW):
        i0 = int(s / 0.01)
        for j in range(max(8, i0 - 25), min(len(lv), i0 + 20)):
            if lv[j] > -50 and lv[j - 8:j].max() < -60:
                s = max(s, j * 0.01) if j * 0.01 < s + 0.2 else s
                break
        out.append({'word': lw, 'start': round(s, 3), 'end': round(e, 3)})
    for i, o in enumerate(out):
        nxt = out[i + 1]['start'] if i + 1 < len(out) else len(y) / SR
        a, b = int(o['start'] / 0.01), min(len(lv), int(max(o['end'], nxt) / 0.01))
        loud = [j for j in range(a, b) if lv[j] > -40]
        o['end'] = round(min(nxt, (loud[-1] + 1) * 0.01) if loud else o['end'], 3)
    on = np.where(lv > -45)[0]
    span = (on[0] * 0.01, (on[-1] + 1) * 0.01)
    return {'source': path, 'duration': len(y) / SR, 'speech': [round(span[0], 2), round(span[1], 2)],
            'wpm': round(len(LW) / (span[1] - span[0]) * 60, 1), 'pocketsphinx_transcript': hyp,
            'pocketsphinx_wer_vs_approved': round(wer(LW, norm(hyp)), 3), 'words': out}

if __name__ == '__main__':
    r = timeline(sys.argv[1])
    print(f"{sys.argv[1]}: speech {r['speech']}  {r['wpm']} wpm  sphinx WER {r['pocketsphinx_wer_vs_approved']}")
    print('  sphinx:', r['pocketsphinx_transcript'])
    for o in r['words']:
        if True:
            print(f"   {o['word']:10} {o['start']:6.2f}-{o['end']:6.2f}")
    if len(sys.argv) > 2: json.dump(r, open(sys.argv[2], 'w'), indent=1)
