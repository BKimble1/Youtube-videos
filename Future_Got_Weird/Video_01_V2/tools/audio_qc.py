#!/usr/bin/env python3
"""Listen-without-video QC for the V2 mix: what the soundtrack is doing second by second, measured.

  python3 tools/audio_qc.py   (reads audio/mix/v2/stem_*.wav and final_mix.wav) -> audio/mix/v2/audio_qc.json + .md

Reports per scene: narration / music / effects levels, voice-to-music and voice-to-effects margins while speaking,
the loudest effect moments, any stretch of near-silence longer than 1.2 s (all stems quiet) with the time, and
effects peaks that land on top of speech (possible masking).
"""
import json
import os

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'audio', 'mix', 'v2')
SR = 48000


def rms_curve(x, win=0.1):
    m = x.mean(axis=1) if x.ndim == 2 else x
    n = int(win * SR)
    k = len(m) // n
    return 20 * np.log10(np.sqrt((m[:k * n].reshape(k, n) ** 2).mean(axis=1)) + 1e-9)


def main():
    tl = json.load(open(os.path.join(ROOT, 'source', 'src', 'data', 'timeline.json')))
    V = rms_curve(sf.read(os.path.join(D, 'stem_narration.wav'))[0])
    M = rms_curve(sf.read(os.path.join(D, 'stem_music_ducked.wav'))[0])
    S = rms_curve(sf.read(os.path.join(D, 'stem_sfx.wav'))[0])
    X = rms_curve(sf.read(os.path.join(D, 'final_mix.wav'))[0])
    k = min(len(V), len(M), len(S), len(X))
    V, M, S, X = V[:k], M[:k], S[:k], X[:k]
    speaking = V > -40
    out = {'scenes': {}, 'quiet_runs': [], 'masking': []}
    for s in tl['scenes']:
        a, b = int(s['from'] / 30 / 0.1), min(k, int(s['to'] / 30 / 0.1))
        sp = speaking[a:b]
        out['scenes'][s['id']] = {
            'voice_db': round(float(np.median(V[a:b][sp])) if sp.any() else -99, 1),
            'music_db': round(float(np.median(M[a:b])), 1),
            'sfx_db_p90': round(float(np.percentile(S[a:b], 90)), 1),
            'voice_minus_music_speaking': round(float(np.median(V[a:b][sp] - M[a:b][sp])) if sp.any() else 0, 1),
            'voice_minus_sfx_p90_speaking': round(float(np.median(V[a:b][sp]) - np.percentile(S[a:b][sp], 90)) if sp.any() else 0, 1),
        }
    q = X < -50
    i = 0
    while i < k:
        if q[i]:
            j = i
            while j + 1 < k and q[j + 1]:
                j += 1
            if (j - i + 1) * 0.1 >= 1.2:
                out['quiet_runs'].append({'t': round(i * 0.1, 1), 'seconds': round((j - i + 1) * 0.1, 1)})
            i = j + 1
        else:
            i += 1
    for t in np.where(speaking & (S > V - 3))[0]:
        out['masking'].append(round(t * 0.1, 1))
    json.dump(out, open(os.path.join(D, 'audio_qc.json'), 'w'), indent=1)
    print(json.dumps(out['scenes'], indent=1))
    print('quiet runs >= 1.2 s:', out['quiet_runs'])
    print('effects within 3 dB of speech (0.1 s windows):', len(out['masking']), out['masking'][:30])


if __name__ == '__main__':
    main()
