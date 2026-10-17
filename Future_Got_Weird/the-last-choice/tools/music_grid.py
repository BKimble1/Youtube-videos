"""Beat grid and splice candidates.

  python3 tools/music_grid.py beats <wav> <out.json> [bpm_hint]
      librosa beat track (tightness high) -> beat times, inter-beat stats, tempo
  python3 tools/music_grid.py splice <wav> <src_lo> <src_hi> <dst_lo> <dst_hi> <out.json> [want_len]
      For every pair of beat times s in [src_lo, src_hi], d in [dst_lo, dst_hi]: similarity of harmonic chroma and
      timbre (MFCC) in the 3 s before s vs before d and the 3 s after s vs after d (the join should sound like the music
      simply continued), plus a loudness-match term. Lists the best pairs; with want_len, prefers d - s near it.
"""
import json, sys

import librosa
import numpy as np

mode = sys.argv[1]
sr = 22050


def load(wav):
    y, _ = librosa.load(wav, sr=sr, mono=True)
    return y


if mode == "beats":
    wav, out = sys.argv[2], sys.argv[3]
    bpm = float(sys.argv[4]) if len(sys.argv) > 4 else 120.0
    y = load(wav)
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
    tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=256, start_bpm=bpm, tightness=400)
    bt = librosa.frames_to_time(beats, sr=sr, hop_length=256)
    ibi = np.diff(bt)
    res = {"tempo": float(np.atleast_1d(tempo)[0]), "beats": [round(float(b), 3) for b in bt],
           "ibi_median": float(np.median(ibi)), "ibi_p10": float(np.percentile(ibi, 10)), "ibi_p90": float(np.percentile(ibi, 90))}
    json.dump(res, open(out, "w"))
    print({k: v for k, v in res.items() if k != "beats"}, "n beats", len(bt))
else:
    wav, s_lo, s_hi, d_lo, d_hi, out = sys.argv[2], *map(float, sys.argv[3:7]), sys.argv[7]
    want = float(sys.argv[8]) if len(sys.argv) > 8 else None
    y = load(wav)
    hop = 512
    H = librosa.effects.harmonic(y, margin=2.0)
    ch = librosa.feature.chroma_cqt(y=H, sr=sr, hop_length=hop)
    mf = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20, hop_length=hop)[1:]
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    _, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, tightness=300)
    bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
    fr = lambda t: int(round(t * sr / hop))
    W = fr(3.0)

    def vec(i0, i1):
        c = ch[:, i0:i1].mean(axis=1); c /= np.linalg.norm(c) + 1e-9
        m = mf[:, i0:i1].mean(axis=1); m /= np.linalg.norm(m) + 1e-9
        return c, m, 20 * np.log10(rms[i0:i1].mean() + 1e-9)

    res = []
    S = [b for b in bt if s_lo <= b <= s_hi]
    D = [b for b in bt if d_lo <= b <= d_hi]
    for s in S:
        cb_s, mb_s, lb_s = vec(fr(s) - W, fr(s)); ca_s, ma_s, la_s = vec(fr(s), fr(s) + W)
        for d in D:
            cb_d, mb_d, lb_d = vec(fr(d) - W, fr(d)); ca_d, ma_d, la_d = vec(fr(d), fr(d) + W)
            # the join plays [.. s) then [d ..): compare what comes after s with what comes after d (continuation),
            # and what precedes s with what precedes d (so the harmony leading in suits the destination)
            sc = 0.35 * float(ca_s @ ca_d) + 0.35 * float(cb_s @ cb_d) + 0.15 * float(ma_s @ ma_d) + 0.15 * float(mb_s @ mb_d)
            sc -= 0.01 * abs(lb_s - lb_d)
            if want is not None:
                sc -= 0.004 * abs((d - s) - want)
            res.append((sc, round(float(s), 3), round(float(d), 3), round(float(d - s), 3), round(float(oenv[fr(d)] / oenv.max()), 3)))
    res.sort(reverse=True)
    json.dump([{"score": r[0], "src": r[1], "dst": r[2], "removed_s": r[3], "dst_onset": r[4]} for r in res[:60]], open(out, "w"), indent=1)
    for r in res[:25]:
        print(r)
