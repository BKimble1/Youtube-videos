#!/usr/bin/env python3
"""Authoritative transcript of the locked narration AS IT PLAYS in a rendered master: decodes the MP4's audio track
(narration + bed + effects), runs the local sherpa-onnx zipformer transducer with token timestamps, rebuilds words,
and aligns them to the locked script so every script word gets a measured onset in the master.

Usage: python3 tools/transcribe_master_v7.py MASTER.mp4 ZIPFORMER_DIR [out.json]
Writes (default) qa/transcript_v7.json: {asr_text, words:[{word,start}], script_alignment:[{word,start,matched}]}"""
import difflib, json, os, re, subprocess, sys
import numpy as np, sherpa_onnx

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4, mdir = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else os.path.join(EP, 'qa/transcript_v7.json')
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-map', '0:a:0', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
y = np.frombuffer(pcm, np.float32)
rec = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=f'{mdir}/encoder-epoch-99-avg-1.onnx', decoder=f'{mdir}/decoder-epoch-99-avg-1.onnx', joiner=f'{mdir}/joiner-epoch-99-avg-1.onnx',
    tokens=f'{mdir}/tokens.txt', decoding_method='modified_beam_search', max_active_paths=8)


def run(seg, t0):
    s = rec.create_stream()
    s.accept_waveform(16000, seg)
    rec.decode_stream(s)
    words = []
    for tok, ts in zip(s.result.tokens, s.result.timestamps):
        # a word starts at a token carrying the BPE word marker (sherpa returns it as a leading space)
        if tok.startswith(('▁', ' ')) or not words:
            words.append({'word': tok.lstrip('▁ '), 'start': round(t0 + ts, 3)})
        else:
            words[-1]['word'] += tok
    return [w for w in words if w['word']]


# one pass over the whole track (splitting would stamp the first word after the split at the split point)
words = run(y, 0.0)
norm = lambda w: re.sub(r"[^a-z']", '', w.lower())
script = json.load(open(os.path.join(EP, 'audio/narration/phrases_v3.json')))
sw = [w['word'] for w in script['words']]
a, b = [norm(w) for w in sw], [norm(w['word']) for w in words]
sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
align = [{'word': w, 'start': None, 'matched': False, 'script_start': script['words'][i]['start']} for i, w in enumerate(sw)]
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == 'equal':
        for k in range(i2 - i1):
            align[i1 + k].update(start=words[j1 + k]['start'], matched=True)
    elif op == 'replace':
        # ASR spelling differences: "A I" = "AI", "SOFT WARE" = "software" (merged pieces), or a same-length
        # substitution such as "MIND" for "mimed" (aligned by position and flagged)
        j = j1
        for i in range(i1, i2):
            for n in range(1, 4):
                if j + n <= j2 and ''.join(b[j:j + n]) == a[i]:
                    align[i].update(start=words[j]['start'], matched=True, asr_pieces=n)
                    j += n
                    break
            else:
                if i2 - i1 == j2 - j1:
                    align[i].update(start=words[j1 + (i - i1)]['start'], matched=True, asr_heard=words[j1 + (i - i1)]['word'])
                    j = j1 + (i - i1) + 1
res = {'master': os.path.basename(mp4), 'audio_seconds': round(len(y) / 16000, 3), 'asr_text': ' '.join(w['word'] for w in words),
       'words': words, 'script_alignment': align, 'script_words': len(sw), 'matched_words': sum(x['matched'] for x in align)}
json.dump(res, open(out, 'w'), indent=1, ensure_ascii=False)
print(res['asr_text'])
print(f"{res['matched_words']}/{res['script_words']} script words found in the master's audio, in order")
