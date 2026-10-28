#!/usr/bin/env python3
"""Narration for Transparent Mouse Skin V1: the channel narrator (ElevenLabs "Test Voice", kk5XaSLo2XAw0sKM98zU,
eleven_v4), take 2 (generation 0ET96wIJn4bpVaOE1Njb), with the approved words verbatim
(audio/narration/voice_provenance.json).

Edits, and nothing else: decoded to 48 kHz mono; the empty lead-in is trimmed to 30 ms; the silent middle of each
sentence gap longer than GAP_MAX is removed (10 ms crossfades) so no gap exceeds GAP_MAX, and the hesitation after
"away" is set to HESITATION. No word is cut, stretched or pitch-shifted. A tail is added after the last word for the
final image. The edited file is force-aligned (tools/align.py) and the caption phrases are written from the measured
words.
Outputs: audio/narration/FGW_Transparent_Mouse_Skin_narration_V1.wav (48k/24-bit), audio/narration/words_V1.json,
         source/src/data/timeline.json, captions/FGW_Transparent_Mouse_Skin_V1.srt"""
import json, os, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LOCKED, norm
from align import timeline

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t2_0ET9.mp3'
LEAD = 0.03         # s of silence kept before "They"
GAP_MAX = 0.42      # s, longest sentence gap kept
HESITATION = 0.28   # s, the gap after "away…"
TAIL = 1.30         # s after "again": the skin settles opaque over the still-moving organs
XF = int(0.01 * SR)

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, TAKE), '-ac', '1', '-ar', str(SR), '-f', 'f64le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float64).copy()

# 10 ms levels; a gap is a run below -45 dBFS between speech
W = SR // 100
lv = 20 * np.log10(np.sqrt(np.array([np.mean(y[i:i + W] ** 2) for i in range(0, len(y) - W, W)])) + 1e-12)
on = lv > -45
first, last = int(np.argmax(on)), len(on) - 1 - int(np.argmax(on[::-1]))
gaps, i = [], first
while i < last:
    if not on[i]:
        j = i
        while j < last and not on[j]: j += 1
        if j - i >= 12: gaps.append((i, j))
        i = j
    else: i += 1
# the hesitation is the gap that contains the TTS alignment's boundary between "away…" (ends 22.616 s) and "and"
hes = min(gaps, key=lambda g: abs((g[0] + g[1]) / 200 - 22.64))

cuts = []  # (start_s, end_s) removed from the middle of a gap
for g in gaps:
    a, b = g[0] / 100, g[1] / 100
    keep = HESITATION if g == hes else GAP_MAX
    if b - a > keep + 0.02:
        mid = (a + b) / 2
        cuts.append((round(mid - (b - a - keep) / 2, 3), round(mid + (b - a - keep) / 2, 3)))
lead_cut = max(0.0, first / 100 - LEAD)

def splice(sig, cuts):
    out, pos = [], 0
    for a, b in cuts:
        ia, ib = int(a * SR), int(b * SR)
        seg = sig[pos:ia].copy()
        if out:  # crossfade into the previous kept segment
            prev = out[-1]
            r = np.linspace(0, 1, XF)
            prev[-XF:] = prev[-XF:] * (1 - r) + seg[:XF] * r
            seg = seg[XF:]
        out.append(seg); pos = ib
    seg = sig[pos:].copy()
    if out:
        r = np.linspace(0, 1, XF); out[-1][-XF:] = out[-1][-XF:] * (1 - r) + seg[:XF] * r; seg = seg[XF:]
    out.append(seg)
    return np.concatenate(out)

y2 = splice(y[int(lead_cut * SR):], [(a - lead_cut, b - lead_cut) for a, b in cuts])
tmp = os.path.join(EP, 'audio/narration/takes/t2_0ET9_edit_48k.wav')
sf.write(tmp, y2, SR, subtype='PCM_24')

tl = timeline(tmp)
Wd = tl['words']
speech_end = Wd[-1]['end']
end_i = min(len(y2), int(round((speech_end + 0.12) * SR)))
y3 = y2[:end_i].copy()
f = int(0.05 * SR); y3[-f:] *= np.linspace(1, 0, f)
frames = int(round((speech_end + TAIL) * FPS)); total_s = frames / FPS
y3 = np.concatenate([y3, np.zeros(int(round(total_s * SR)) - len(y3))])
final = os.path.join(EP, 'audio/narration/FGW_Transparent_Mouse_Skin_narration_V1.wav')
sf.write(final, y3, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'lead_cut_s': round(lead_cut, 3), 'gap_cuts_s_in_take_time': cuts, 'gap_max_s': GAP_MAX, 'hesitation_s': HESITATION,
           'duration_s': total_s, 'frames': frames, 'pocketsphinx_transcript': tl['pocketsphinx_transcript'],
           'pocketsphinx_wer_vs_approved': tl['pocketsphinx_wer_vs_approved'], 'words': Wd},
          open(os.path.join(EP, 'audio/narration/words_V1.json'), 'w'), indent=1)

# Caption phrases: the approved narration in short spoken chunks (text exactly as approved, in order).
CH = [('They made a living mouse’s skin', ['living']), ('transparent.', ['transparent']),
      ('And watched its organs', ['organs']), ('moving underneath.', ['moving']),
      ('Without making a single cut.', ['single', 'cut']),
      ('They’d rubbed a food-dye solution', ['fooddye']), ('onto its skin.', []),
      ('You see, water and fat', ['water', 'fat']), ('normally bend light differently,', ['differently']),
      ('scattering it and hiding what’s underneath.', ['scattering']),
      ('But the dye changes', ['dye']), ('how the watery parts bend light,', ['watery']),
      ('making them behave', []), ('more like the fat.', ['fat']),
      ('Then they washed the dye away…', ['washed']),
      ('and the skin hid', ['hid']), ('the moving organs again.', ['again'])]
assert ''.join(t for t, _ in CH).replace(' ', '') == LOCKED.replace('\n', '').replace(' ', ''), 'captions must be the approved narration verbatim'
assert norm(' '.join(t for t, _ in CH)) == [w['word'] for w in Wd]
caps, k = [], 0
for text, emph in CH:
    assert 2 <= len(text.split()) <= 6 or text == 'transparent.', text
    n = len(norm(text)); ws = Wd[k:k + n]; k += n
    caps.append({'text': text, 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
assert k == len(Wd)
for i, c in enumerate(caps):
    nxt = caps[i + 1]['start'] if i + 1 < len(caps) else total_s
    c['show'] = round(max(0, c['start'] - 0.04), 3)
    c['hide'] = round(nxt - 0.04 if nxt - c['end'] < 0.6 else c['end'] + 0.35, 3)
os.makedirs(os.path.join(EP, 'source/src/data'), exist_ok=True)
json.dump({'fps': FPS, 'frames': frames, 'duration': total_s, 'captions': caps, 'words': Wd}, open(os.path.join(EP, 'source/src/data/timeline.json'), 'w'), indent=1)

def ts(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open(os.path.join(EP, 'captions/FGW_Transparent_Mouse_Skin_V1.srt'), 'w', encoding='utf-8') as fh:
    for i, c in enumerate(caps): fh.write(f"{i + 1}\n{ts(c['show'])} --> {ts(c['hide'])}\n{c['text']}\n\n")
print(f'lead cut {lead_cut:.3f} s; gap cuts {cuts}')
print(f'duration {total_s:.3f} s ({frames} frames); speech {Wd[0]["start"]:.2f}-{Wd[-1]["end"]:.2f}; sphinx WER {tl["pocketsphinx_wer_vs_approved"]}')
for c in caps: print(f"{c['show']:6.2f}-{c['hide']:6.2f}  {c['text']}")
