#!/usr/bin/env python3
"""Loop-safe mux: copy the rendered picture untouched and encode the PCM mix to AAC once.

AAC works in 1024-sample frames, so the stream is padded past the picture. Silence there would drop the sound for a few
milliseconds on every loop; instead the padding is filled with the start of the mix (what a looping player plays next),
so the last AAC frame continues the film exactly. The audio stream therefore runs (-N mod 1024) samples past the picture.

usage: python3 tools/mux_loop_audio.py <picture.mp4> <mix.wav> <out.mp4> <frames> [fps]
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf

src, mixp, out, frames = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
fps = float(sys.argv[5]) if len(sys.argv) > 5 else 30.0
mix, sr = sf.read(mixp, dtype='float32')
n = int(round(frames / fps * sr))
assert abs(len(mix) - n) <= 1, (len(mix), n)
mix = mix[:n]
pad = (-n) % 1024
ext = np.concatenate([mix, mix[:pad]]) if pad else mix
with tempfile.TemporaryDirectory() as d:
    wav = os.path.join(d, 'ext.wav')
    sf.write(wav, ext, sr, subtype='PCM_24')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '320k', '-ar', str(sr), '-t', f'{(n + pad) / sr:.6f}', '-movflags', '+faststart', out], check=True)
print(f'{out}: {frames} frames, audio {n} samples + {pad} loop-continuous padding samples')
