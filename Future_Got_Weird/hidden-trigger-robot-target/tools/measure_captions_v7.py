#!/usr/bin/env python3
"""V7 caption timing, measured on the locked narration waveform (audio/narration/narration_v3_testvoice.wav, which
sits at a 0.000 s offset in every master).

The V3-V6 caption starts came from zipformer token timestamps, which run up to ~0.37 s EARLY at phrase starts that
follow a pause (the waveform is still silent there). For each caption: if its first word follows a pause, the speech
onset is the first 10 ms window above -50 dBFS after >= 80 ms below -60 dBFS (searched from 0.45 s before to 0.35 s
after the token time); the caption start is max(token time, that onset), so it can only move later, never earlier
than sound. Captions inside continuous speech keep the token time. Ends are unchanged (last window above -38 dBFS).
Writes source/src/data/captions_v7.json and audio/narration/captions_v7_measured.json (with the evidence)."""
import json, os
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(EP, 'audio/narration/phrases_v3.json')))
y, sr = sf.read(os.path.join(EP, 'audio/narration/narration_v3_testvoice.wav'))
y = y.mean(1) if y.ndim > 1 else y
W = int(0.01 * sr)
lv = np.array([20 * np.log10(np.sqrt((y[i:i + W] ** 2).mean()) + 1e-12) for i in range(0, len(y) - W, W)])


def speech_onset(t):
    i0, i1 = max(0, int(round((t - 0.45) / 0.01))), int(round((t + 0.35) / 0.01))
    for i in range(i0 + 8, i1):
        if lv[i] > -50 and lv[i - 8:i].max() < -60:  # first sound after >= 80 ms of silence
            return round(i * 0.01, 3)
    return None


out, ev = [], []
for c in P['captions']:
    on = speech_onset(c['start'])
    start = max(c['start'], on) if on is not None else c['start']
    out.append({'text': c['text'], 'start': round(start, 3), 'end': c['end']})
    ev.append({'text': c['text'], 'token_start': c['start'], 'waveform_onset_after_pause': on, 'start_v7': round(start, 3), 'moved_s': round(start - c['start'], 3), 'end': c['end']})
json.dump(out, open(os.path.join(EP, 'source/src/data/captions_v7.json'), 'w'), indent=1)
json.dump({'method': __doc__.split('\n\n')[1], 'captions': ev}, open(os.path.join(EP, 'audio/narration/captions_v7_measured.json'), 'w'), indent=1)
for e in ev:
    print(f"{e['text'][:36]:38} {e['token_start']:6.2f} -> {e['start_v7']:6.2f}  ({e['moved_s']:+.2f})")
