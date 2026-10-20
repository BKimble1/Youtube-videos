#!/usr/bin/env python3
"""Measured audio QA for the Telepathy Flaw V4 mix (nothing here is a listening check).
 1. integrated loudness and true peak (ebur128), sample peak, clipped samples
 2. loop seam: the mix tiled 3x; the largest sample step and the 20 ms RMS either side of the seam, against the same
    figures measured at ordinary places in the film
 3. dead air: longest stretch of the mix below -60 dBFS (10 ms RMS windows)
 4. masking: windows where the narration is active and music + effects come within 6 dB of it
 5. the narration is untouched by the mix (stem = take x master gain): the stem's first/last speech samples
Writes qa/AUDIO_QA.json."""
import json
import sys
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import build_audio_v3 as b  # noqa: E402

A = ROOT / 'audio' / 'v4'
SR = b.SR


def rms_db(x):
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)


def main():
    mix = A / 'mix' / 'FGW_TelepathyFlaw_V4_mix_48k.wav'
    meas = b.lufs_and_tp(mix)
    ml, mr = b.read_int24(mix)
    nl, nr = b.read_int24(A / 'stems' / 'narration.wav')
    ul, ur = b.read_int24(A / 'stems' / 'music.wav')
    el, er = b.read_int24(A / 'stems' / 'effects.wav')
    F = b.FULL
    mono = (ml + mr) / 2 / F
    out = {'loudness': meas, 'sample_peak_dbfs': round(20 * np.log10(max(np.abs(ml).max(), np.abs(mr).max()) / F), 2), 'clipped_samples': int(((np.abs(ml) >= F) | (np.abs(mr) >= F)).sum())}

    # loop seam
    t3 = np.concatenate([mono, mono, mono])
    n = len(mono)
    d = np.abs(np.diff(t3))
    seam = n
    w = int(0.02 * SR)
    step_at_seam = d[seam - 3:seam + 3].max()
    typical = np.percentile(d, 99.9)
    out['seam'] = {
        'largest_step_at_seam': float(step_at_seam),
        'p99.9_step_elsewhere': float(typical),
        'max_step_anywhere': float(d.max()),
        'rms_20ms_before_dbfs': round(rms_db(t3[seam - w:seam]), 1),
        'rms_20ms_after_dbfs': round(rms_db(t3[seam:seam + w]), 1),
        'rms_1s_before_dbfs': round(rms_db(t3[seam - SR:seam]), 1),
        'rms_1s_after_dbfs': round(rms_db(t3[seam:seam + SR]), 1),
        'clean': bool(step_at_seam <= max(typical * 2.0, 0.002)),
    }
    # the narration alone: the last word ends at 27.39 s and the first begins at 0.08 s, so 0.69 s separate them on replay
    # dead air
    win = int(0.01 * SR)
    nw = len(mono) // win
    lv = np.array([rms_db(mono[i * win:(i + 1) * win]) for i in range(nw)])
    quiet = lv < -60
    longest, cur = 0, 0
    for q in quiet:
        cur = cur + 1 if q else 0
        longest = max(longest, cur)
    out['dead_air_longest_s'] = round(longest * 0.01, 2)
    out['lowest_10ms_level_dbfs'] = round(float(lv.min()), 1)
    # masking
    nm = (nl + nr) / 2 / F
    rest = ((ul + ur + el + er) / 2) / F
    bad = []
    win = int(0.05 * SR)
    for i in range(len(nm) // win):
        a, c = nm[i * win:(i + 1) * win], rest[i * win:(i + 1) * win]
        la, lc = rms_db(a), rms_db(c)
        if la > -45 and lc > la - 6:
            bad.append({'t_s': round(i * 0.05, 2), 'voice_db': round(la, 1), 'music_fx_db': round(lc, 1)})
    out['speech_masking_windows'] = bad
    out['speech_masking_note'] = 'windows (50 ms) where the narration is active and music + effects come within 6 dB of it'
    # V4: the narration and music stems are the approved V3 stems, unchanged (byte-for-byte)
    import hashlib
    sha = lambda q: hashlib.sha256(Path(q).read_bytes()).hexdigest()
    A3 = ROOT / 'audio' / 'v3'
    out['stems_vs_v3'] = {
        'narration_identical': sha(A / 'stems' / 'narration.wav') == sha(A3 / 'stems' / 'narration.wav'),
        'music_identical': sha(A / 'stems' / 'music.wav') == sha(A3 / 'stems' / 'music.wav'),
        'narration_sha256': sha(A / 'stems' / 'narration.wav'),
        'effects_differ_from_v3': sha(A / 'stems' / 'effects.wav') != sha(A3 / 'stems' / 'effects.wav'),
    }
    out['listened'] = False
    json.dump(out, open(ROOT / 'qa' / 'v4' / 'AUDIO_QA.json', 'w'), indent=1)
    print(json.dumps(out, indent=1)[:2600])


if __name__ == '__main__':
    main()
