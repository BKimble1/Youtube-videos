"""Concatenate the picked Test Voice takes (audio/v2/picks.json) with 1 s of silence between sections →
audio/v2/picks_concat.wav (+ _offsets.json, + a 128 kb/s mp3 for the single Scribe pass)."""
import json, subprocess
import numpy as np, soundfile as sf
ROOT = __file__.rsplit('/tools/', 1)[0]
A = ROOT + '/audio/v2/'
SR = 48000
picks = json.load(open(A + 'picks.json'))['picks']
out, offs, t = [], {}, 0.0
for k, f in picks.items():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', A + 'takes/' + f, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32)
    offs[k] = round(t, 4); out += [x, np.zeros(SR, np.float32)]; t += len(x) / SR + 1.0
sf.write(A + 'picks_concat.wav', np.concatenate(out), SR, subtype='PCM_16')
json.dump({'sr': SR, 'offsets': offs, 'duration': round(t, 3)}, open(A + 'picks_concat_offsets.json', 'w'), indent=1)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', A + 'picks_concat.wav', '-b:a', '128k', A + 'picks_concat.mp3'], check=True)
print(offs, round(t, 2))
