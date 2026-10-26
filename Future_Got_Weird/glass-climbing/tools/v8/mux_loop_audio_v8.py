"""Replace a rendered V8 MP4's audio with one AAC encode of the mix whose padding tail is the start of the mix.

AAC codes in 1024-sample frames, so 39.000 s at 48 kHz (1,872,000 samples) is padded to 1,872,896 samples. Encoded
from the renderer's audio, that tail is silence: a player that loops at the end of the file drops the music bed for
18.7 ms on every loop. Here the tail is a short crossfade that is continuous with the loop at both of its joins, the
video stream is copied untouched, and the audio is encoded once from the PCM mix (no second lossy generation).
usage: python3 tools/v8/mux_loop_audio_v8.py <in.mp4> <out.mp4>"""
import os, subprocess, sys, tempfile
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
src, out = sys.argv[1], sys.argv[2]
mix, sr = sf.read(os.path.join(EP, 'audio/mix/FGW_Glass_Climbing_V8_mix.wav'), dtype='float32')
n = int(round(39.0 * sr))
assert abs(len(mix) - n) <= 1, (len(mix), n)
mix = mix[:n]
# the encoder's tail (plus one frame): a player looping at the file's end plays mix, tail, mix... so the tail must
# follow on from the mix's last sample and lead into its first. It crossfades from the loop's start (continuing past
# the end) to the loop's last samples (which lead back into the start), so both joins are continuous.
pad = (-n) % 1024 + 1024
w = (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, pad)))[:, None] if mix.ndim > 1 else 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, pad))
tail = mix[:pad] * (1 - w) + mix[n - pad:] * w
ext = np.concatenate([mix, tail])
with tempfile.TemporaryDirectory() as td:
    wav = os.path.join(td, 'mix_ext.wav')
    sf.write(wav, ext, sr, subtype='PCM_24')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '320k', '-ar', str(sr), '-t', f'{(n + (-n) % 1024) / sr:.6f}', '-movflags', '+faststart', out], check=True)
print('muxed', out)
