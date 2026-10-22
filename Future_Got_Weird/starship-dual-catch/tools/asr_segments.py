"""Transcribe each narration segment with a local Whisper base.en (sherpa-onnx) and compare with the script.
Usage: python3.13 tools/asr_segments.py [/path/to/sherpa-onnx-whisper-base.en]  -> qa/asr_segments.json"""
import json, os, re, sys
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
M = sys.argv[1] if len(sys.argv) > 1 else "/tmp/models/sherpa-onnx-whisper-base.en"
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{M}/base.en-encoder.int8.onnx", decoder=f"{M}/base.en-decoder.int8.onnx", tokens=f"{M}/base.en-tokens.txt", num_threads=4)
norm = lambda s: re.sub(r"[^a-z0-9 ]", " ", s.lower().replace("-", " ")).split()
out, bad = [], 0
for s in json.load(open(os.path.join(ROOT, "source", "src", "data", "timeline.json")))["segments"]:
    x, sr = sf.read(os.path.join(ROOT, "audio", "narration", "seg", f"{s['id']}.wav"))
    st = rec.create_stream(); st.accept_waveform(16000, resample_poly(x, 16000, sr).astype(np.float32)); rec.decode_stream(st)
    hyp = st.result.text.strip()
    a, b = set(norm(s["text"])), set(norm(hyp))
    miss = sorted(a - b)
    out.append({"id": s["id"], "script": s["text"], "asr": hyp, "missing_words": miss})
    if miss: bad += 1; print(s["id"], miss, "|", hyp)
json.dump(out, open(os.path.join(ROOT, "qa", "asr_segments.json"), "w"), indent=1)
print("segments with differences:", bad, "of", len(out))
