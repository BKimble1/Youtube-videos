#!/usr/bin/env python3
"""V8: tighten the approved narration's pauses without touching a word.

The locked V1 recording (audio/narration/FGW_Flying_Skateboard_narration_V1.wav) is cut only inside its digital-silence
plateaus between phrases (about -87 dB; the pauses hold no breaths). Each cut sits in the middle of the plateau, so
every word's decay tail and the next word's onset are kept, and is joined with a 12 ms equal-power crossfade over
silence. The voice itself is never resampled, sped up or overlapped.

Writes:
  audio/narration/FGW_Flying_Skateboard_narration_V8_tight.wav   the tightened narration (48 kHz, same format)
  source/src/data/timeline_v8.json                                 words and captions on the V8 clock
  audio/narration/narration_v8_cuts.json                           every cut, the old->new time map, and per-gap report
"""
import json, os
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(EP, 'audio/narration/FGW_Flying_Skateboard_narration_V1.wav')
TL = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
x, SR = sf.read(SRC, always_2d=True)
mono = x.mean(1)
W = TL['words']

# target pause (previous word's end -> next word's start, s) for each phrase boundary; boundaries not listed keep
# their recorded length. A slightly longer pause is kept where it strengthens a reveal (after "RIVER." before the
# mechanism, the "JET ENGINES..." ellipsis, after "FIRE.", the "RIVER..." ellipsis and after "CANYON.").
TARGET = {
    ('river', 'you'): 0.30,      # the hook -> the mechanism
    ('ground', 'but'): 0.22,     # the lift demonstration -> the earlier jet prototype
    ('engines', 'and'): 0.27,    # "used JET ENGINES... and caught FIRE"
    ('fire', 'so'): 0.32,        # the fire's consequence -> the electric replacement
    ('electric', 'except'): 0.22,  # the replacement -> the balance problem
    ('problem', 'the'): 0.22,    # "one HUGE problem." -> "The board can't balance itself."
    ('itself', 'he'): 0.24,
    ('balance', 'and'): 0.22,    # the coached correction -> the river flight
    ('river', 'and'): 0.25,      # "across a RIVER... and THROUGH a CANYON"
    ('canyon', 'how'): 0.38,     # the canyon reveal -> the question
}
LEAD = 0.04     # silence kept before the first word's onset
TAIL = 0.34     # kept after the last word's end (its decay runs ~0.2 s), then the loop
XF = 0.012

hop = int(0.005 * SR)
env = np.array([np.sqrt(np.mean(mono[i:i + hop] ** 2) + 1e-14) for i in range(0, len(mono), hop)])
edb = 20 * np.log10(env)
def plateau(a, b, thr=-80.0):
    """the longest run of silence (below thr) between times a and b"""
    i0, i1 = int(a * SR / hop), int(b * SR / hop)
    best, cur = (0, 0), None
    for i in range(i0, i1):
        if edb[i] < thr:
            cur = (cur[0], i + 1) if cur else (i, i + 1)
            if cur[1] - cur[0] > best[1] - best[0]:
                best = cur
        else:
            cur = None
    return best[0] * hop / SR, best[1] * hop / SR

cuts = []  # (start, length) in old seconds, removed
report = []
# leading silence: first onset
on = next(i for i in range(len(edb)) if edb[i] > -70) * hop / SR
if on - LEAD > 0.005:
    cuts.append((0.0, on - LEAD))
for a, b in zip(W, W[1:]):
    key = (a['word'].strip('.,!?…'), b['word'].strip('.,!?…'))
    g = b['start'] - a['end']
    if key not in TARGET or g <= TARGET[key]:
        continue
    want = g - TARGET[key]
    p0, p1 = plateau(a['end'] - 0.05, b['start'] + 0.05)
    room = (p1 - p0) - 0.06  # keep 30 ms of silence at each side of the cut
    rem = min(want, room)
    if rem < 0.02:
        report.append({'join': ' -> '.join(key), 'gap': round(g, 3), 'kept': round(g, 3), 'note': 'no silent room'})
        continue
    mid = (p0 + p1) / 2
    cuts.append((mid - rem / 2, rem))
    report.append({'join': ' -> '.join(key), 'at_old': round(a['end'], 2), 'gap': round(g, 3), 'kept': round(g - rem, 3), 'removed': round(rem, 3)})
# tail
end_word = W[-1]['end']
cuts_sorted = sorted(cuts)

def new_t(t):
    """old time -> new time (a point inside a removed span maps to the cut)"""
    s = 0.0
    for c0, cl in cuts_sorted:
        if t >= c0 + cl:
            s += cl
        elif t > c0:
            return c0 - s
    return t - s

# assemble: keep segments between cuts, joined by equal-power crossfades over silence
segs, prev = [], 0.0
for c0, cl in cuts_sorted:
    segs.append((prev, c0))
    prev = c0 + cl
segs.append((prev, end_word + TAIL))
n_xf = int(XF * SR)
segs = [(s0, s1) for s0, s1 in segs if s1 - s0 > 1e-4]
out = np.zeros((0, x.shape[1]))
seg_new = []  # where each kept segment starts in the new file
for k, (s0, s1) in enumerate(segs):
    seg = x[int(round(s0 * SR)):int(round(min(s1, len(x) / SR) * SR))]
    if len(out) and n_xf:
        u = np.linspace(0, 1, n_xf)[:, None]
        tail, head = out[-n_xf:], seg[:n_xf]
        seg_new.append((len(out) - n_xf) / SR)
        out = np.concatenate([out[:-n_xf], tail * np.cos(u * np.pi / 2) + head * np.sin(u * np.pi / 2), seg[n_xf:]])
    else:
        seg_new.append(len(out) / SR)
        out = np.concatenate([out, seg])
FPS = 30
frames = int(np.ceil(len(out) / SR * FPS))
dur = frames / FPS
out = np.concatenate([out, np.zeros((int(round(dur * SR)) - len(out), x.shape[1]))]) if int(round(dur * SR)) > len(out) else out[:int(round(dur * SR))]
def nt(t):
    """old time -> new time: exact within a kept segment; a point inside a removed span maps to the next segment's start"""
    for (s0, s1), n0 in zip(segs, seg_new):
        if t <= s1 + 1e-9:
            return n0 + max(0.0, t - s0)
    return seg_new[-1] + (t - segs[-1][0])
sf.write(os.path.join(EP, 'audio/narration/FGW_Flying_Skateboard_narration_V8_tight.wav'), out, SR, subtype='PCM_24')

words = [{**w, 'start': round(nt(w['start']), 3), 'end': round(nt(w['end']), 3)} for w in W]
caps = []
for c in TL['captions']:
    caps.append({**c, 'start': round(nt(c['start']), 3), 'end': round(nt(c['end']), 3), 'show': round(nt(c['show']), 3), 'hide': round(min(dur, nt(c['hide'])), 3)})
json.dump({'fps': FPS, 'frames': frames, 'duration': round(dur, 4), 'captions': caps, 'words': words},
          open(os.path.join(EP, 'source/src/data/timeline_v8.json'), 'w'), indent=1)

# verify: every word's audio is sample-identical to the source (shifted), outside the crossfade zones
def seg_of(t):
    return next(i for i, (s0, s1) in enumerate(segs) if s0 - 1e-6 <= t <= s1 + 1e-6)
worst = 0.0
for w in W:
    o0, o1 = int(round(w['start'] * SR)), int(round(w['end'] * SR))
    n0 = int(round(nt(w['start']) * SR))
    a = x[o0:o1]
    b = out[n0:n0 + len(a)]
    worst = max(worst, float(np.abs(a - b).max()) if len(a) == len(b) else 9.0)
rep = {'source': os.path.relpath(SRC, EP), 'old_duration': TL['duration'], 'new_duration': round(dur, 4), 'frames': frames,
       'removed_total_s': round(TL['duration'] - dur, 3), 'cuts_old_time': [[round(c0, 4), round(cl, 4)] for c0, cl in cuts_sorted],
       'crossfade_ms': XF * 1000, 'joins': report, 'lead_s': LEAD, 'tail_after_last_word_s': round(dur - nt(end_word), 3),
       'words_max_abs_diff_vs_source': worst, 'speech_end_new': round(nt(end_word), 3)}
json.dump(rep, open(os.path.join(EP, 'audio/narration/narration_v8_cuts.json'), 'w'), indent=1)
print(json.dumps(rep, indent=1))
