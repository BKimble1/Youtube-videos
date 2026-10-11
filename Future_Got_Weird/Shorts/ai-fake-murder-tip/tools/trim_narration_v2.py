#!/usr/bin/env python3
"""V2 narration edit: shorten the long inter-sentence pauses of ElevenLabs take 1 (no word is touched, no global speed change).
In: audio/narration_v2/narration_v2_take1.mp3   Out: audio/narration_v2/narration_v2_final_48k.wav (+ .mp3), narration_v2_edit_log.json
Each pause (silence >= 150 ms at -38 dBFS in 10 ms RMS) is cut down to a target length by removing the middle of the silence, so the
decay of the previous word and the lead-in of the next stay intact; joins are 8 ms cross-fades inside silence."""
import json, os, subprocess, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = f'{ROOT}/audio/narration_v2'
SR = 48000
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{D}/narration_v2_take1.mp3', '-ac', '1', '-ar', str(SR), '-sample_fmt', 's16', f'{D}/narration_v2_take1_48k.wav'], check=True)
with wave.open(f'{D}/narration_v2_take1_48k.wav') as w:
    x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
win = int(0.010 * SR)
n = len(x) // win
db = 20 * np.log10(np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)
quiet = db < -38.0
sil = []  # (start_s, end_s)
i = 0
while i < n:
    if quiet[i]:
        j = i
        while j < n and quiet[j]: j += 1
        if (j - i) * 0.010 >= 0.15: sil.append((i * 0.010, j * 0.010))
        i = j
    else:
        i += 1
# target pause lengths in order of occurrence (None = leave alone); designed from the take's pause map
TARGETS = [0.26, 0.30, 0.22, 0.38, 0.26, 0.28, 0.26, 0.36, None, 0.30]
internal = [s for s in sil if s[1] < len(x) / SR - 0.05 and s[0] > 0.05]
assert len(internal) == len(TARGETS), (len(internal), [(round(a, 2), round(b, 2)) for a, b in sil])
out, pos, log = [], 0, []
xf = int(0.008 * SR)
for (s, e), g in zip(internal, TARGETS):
    s_i, e_i = int(s * SR), int(e * SR)
    if g is None or (e - s) <= g + 0.02:
        continue
    keep_head = int(g / 2 * SR); keep_tail = int(g * SR) - keep_head
    a_end = s_i + keep_head            # end of the kept head part
    b_start = e_i - keep_tail          # start of the kept tail part
    out.append(x[pos:a_end])
    pos = b_start
    log.append({'pause_start_s': round(s, 3), 'pause_end_s': round(e, 3), 'from_s': round(e - s, 3), 'to_s': g})
out.append(x[pos:])
# join with cross-fades
y = out[0]
for seg in out[1:]:
    fo = np.linspace(1, 0, xf); fi = 1 - fo
    y = np.concatenate([y[:-xf], y[-xf:] * fo + seg[:xf] * fi, seg[xf:]])
# leave the take's own start (speech begins immediately) and a short natural tail
pcm = (np.clip(y, -1, 1) * 32767).round().astype('<i2')
with wave.open(f'{D}/narration_v2_final_48k.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{D}/narration_v2_final_48k.wav', '-codec:a', 'libmp3lame', '-b:a', '192k', f'{D}/narration_v2_final.mp3'], check=True)
json.dump({'source': 'narration_v2_take1.mp3', 'raw_duration_s': round(len(x) / SR, 3), 'edited_duration_s': round(len(y) / SR, 3), 'cuts': log}, open(f'{D}/narration_v2_edit_log.json', 'w'), indent=1)
print('raw', round(len(x) / SR, 3), '-> edited', round(len(y) / SR, 3), 's;', len(log), 'pauses shortened')
