#!/usr/bin/env python3
"""Transcribe each SRT cue window of the delivered V4 MP4's mixed audio with local Whisper base.en (sherpa-onnx):
checks caption sync and intelligibility under music/effects. Writes qa/asr_mp4_v4.json"""
import json, os, re, subprocess, sys
import numpy as np, sherpa_onnx
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
m = sys.argv[1] if len(sys.argv) > 1 else '/tmp/asr/sherpa-onnx-whisper-base.en'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{m}/base.en-encoder.onnx', decoder=f'{m}/base.en-decoder.onnx', tokens=f'{m}/base.en-tokens.txt', language='en', task='transcribe')
mp4 = os.path.join(EP, 'exports/FGW_Hidden_Trigger_V4_Final_1080x1920.mp4')
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
srt = open(os.path.join(EP, 'captions/FGW_Hidden_Trigger_V3.srt'), encoding='utf-8').read().strip().split('\n\n')
tsec = lambda s: (lambda h, m_, x: int(h) * 3600 + int(m_) * 60 + float(x.replace(',', '.')))(*s.split(':'))
norm = lambda t: re.sub(r'[^a-z ]', '', t.lower()).split()
res, ok = [], 0
for blk in srt:
    _, tm, txt = blk.split('\n', 2)
    s, e = [tsec(x.strip()) for x in tm.split('-->')]
    st = rec.create_stream(); st.accept_waveform(16000, np.concatenate([np.zeros(3200, np.float32), a[int(s * 16000):int(e * 16000)], np.zeros(3200, np.float32)])); rec.decode_stream(st)
    hyp = st.result.text.strip(); good = norm(hyp) == norm(txt); ok += good
    res.append({'cue': txt, 'start': s, 'end': e, 'asr': hyp, 'match': good})
    print(('OK ' if good else '?? ') + f'{s:6.2f}-{e:6.2f} {txt!r} -> {hyp!r}')
json.dump({'matched': ok, 'total': len(res), 'cues': res}, open(os.path.join(EP, 'qa/asr_mp4_v4.json'), 'w'), indent=1, ensure_ascii=False)
print(f'{ok}/{len(res)} cue windows transcribe to their caption text')
