"""Generate the temporary review narration with a free local voice (Kokoro v0.19 'am_michael' via sherpa-onnx),
one file per script segment, trim edge silence, join with the scripted pauses, and write measured timings.
Usage: python3.13 tools/make_narration.py   (model dir: $KOKORO or /tmp/models/kokoro-en-v0_19)
Outputs: audio/narration/seg/<id>.wav, audio/narration/narration_review.wav (48 kHz mono),
         source/src/data/timeline.json (segment start/end seconds, measured from the generated audio)."""
import json, os, re
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
M = os.environ.get("KOKORO", "/tmp/models/kokoro-en-v0_19")
SID, SPEED, SR = 6, 0.97, 48000          # am_michael
LEAD = 0.35                               # silence before the first word
segs = json.load(open(os.path.join(ROOT, "script", "segments.json")))
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
    model=M + "/model.onnx", voices=M + "/voices.bin", tokens=M + "/tokens.txt", data_dir=M + "/espeak-ng-data"), num_threads=4))
tts = sherpa_onnx.OfflineTts(cfg)
SAY = [(r"SpaceX", "Space X"), (r"Starbase's", "Star-base's"), (r"Falcon Nine", "Falcon 9")]
os.makedirs(os.path.join(ROOT, "audio", "narration", "seg"), exist_ok=True)

def trim(x, sr):
    env = np.convolve(np.abs(x), np.ones(int(sr * 0.01)) / int(sr * 0.01), "same")
    on = np.where(env > 0.01 * env.max())[0]
    a, b = max(0, on[0] - int(0.02 * sr)), min(len(x), on[-1] + int(0.06 * sr))
    return x[a:b]

out, t, timeline = [np.zeros(int(LEAD * SR))], LEAD, []
for s in segs:
    txt = s["text"]
    for a, b in SAY: txt = re.sub(a, b, txt)
    g = tts.generate(txt, sid=SID, speed=SPEED)
    x = resample_poly(np.array(g.samples, dtype=np.float64), SR, g.sample_rate)
    x = trim(x, SR)
    x = x / max(1e-9, np.abs(x).max()) * 0.89
    sf.write(os.path.join(ROOT, "audio", "narration", "seg", f"{s['id']}.wav"), x, SR, subtype="PCM_24")
    d = len(x) / SR
    timeline.append({"id": s["id"], "act": s["act"], "text": s["text"], "start": round(t, 3), "end": round(t + d, 3)})
    out += [x, np.zeros(int(s["pause"] * SR))]
    t += d + int(s["pause"] * SR) / SR
y = np.concatenate(out)
sf.write(os.path.join(ROOT, "audio", "narration", "narration_review.wav"), y, SR, subtype="PCM_24")
os.makedirs(os.path.join(ROOT, "source", "src", "data"), exist_ok=True)
json.dump({"total": round(len(y) / SR, 3), "segments": timeline}, open(os.path.join(ROOT, "source", "src", "data", "timeline.json"), "w"), indent=1)
print("total", len(y) / SR, "words", sum(len(s["text"].split()) for s in segs))
