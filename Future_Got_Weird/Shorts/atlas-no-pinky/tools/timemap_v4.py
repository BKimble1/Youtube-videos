"""Shared old-time -> new-time map for the V4 retimed ("fast") pace. One explicit map drives speech, alignment, beat events,
caption cues, picture phases and effects. 'orig' is the identity map (no retime). Imported by retime_v4.py, build_cues_v4.py,
build_audio_v4.py."""
import json, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AL = json.load(open(f'{ROOT}/audio/narration_alignment.json'))
WORDS = AL['words']
MEAS = AL['measured_voice_ends_seconds']
FPS = 30
TAIL_S = 1.17            # voice-free tail after the last word (unchanged from V1-V3: the receipt tear lives here)
SPEED = 1.05             # pitch-preserving tempo of the whole narration (fast pace)
# Long inter-sentence gaps shortened on the old clock: word index -> seconds removed from the gap AFTER that word.
# Protected on purpose: the verdict suspense (after word 23 'verdict?'), the hook beat (after 4), the joke setup (after 81), 'but thirteen' etc.
TRIMS = {6: 0.12, 21: 0.12, 26: 0.20, 37: 0.12, 41: 0.16, 61: 0.12, 69: 0.26, 77: 0.12}


def voice_end(i):
    return MEAS.get(WORDS[i]['text'], WORDS[i]['end'])


def build(pace):
    """returns dict(knots=[(old,new)...], speed, trims_applied=[(r0,r1)...], total_s, voice_end_old, voice_end_new)"""
    if pace == 'orig':
        old_total = 34.6
        return dict(pace=pace, knots=[(0.0, 0.0), (60.0, 60.0)], speed=1.0, cuts=[], total_s=old_total, total_frames=round(old_total * FPS))
    knots = [(0.0, 0.0)]
    removed = 0.0
    cuts = []
    for i in sorted(TRIMS):
        e, nxt = voice_end(i), WORDS[i + 1]['start']
        mid = (e + nxt) / 2
        r0, r1 = mid - TRIMS[i] / 2, mid + TRIMS[i] / 2
        assert r0 > e and r1 < nxt, (i, e, nxt, r0, r1)
        knots.append((r0, (r0 - removed) / SPEED))
        removed += TRIMS[i]
        knots.append((r1, (r1 - removed) / SPEED))
        cuts.append((r0, r1))
    knots.append((60.0, (60.0 - removed) / SPEED))
    m = dict(pace=pace, knots=knots, speed=SPEED, cuts=cuts)
    ve = tm(m, voice_end(len(WORDS) - 1))
    m['total_s'] = ve + TAIL_S
    m['total_frames'] = round(m['total_s'] * FPS)
    m['voice_end_new'] = ve
    return m


def tm(m, t):
    ks = m['knots']
    return float(np.interp(t, [k[0] for k in ks], [k[1] for k in ks]))
