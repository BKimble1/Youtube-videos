"""Find the join for the closing song: the recording's opening trumpet phrase → the lead-in to the first vocal.

  python3 tools/llt_edit.py <wav> <out.json>

Facts used (not guessed): the singer's first word ("Never") starts at rec 64.36 s, from an ElevenLabs Scribe
transcription of the supplied recording (per-word timestamps, production/music/longtime_scribe_words.json). The sung
8-bar sections are ~12.6 s apart, so a bar is ~1.57 s.

Candidates are attack points (onset-strength peaks), not the beat tracker's grid (it locks to a dotted pulse here).
For a source s (end of the trumpet material we keep) and destination d (where the recording resumes):
  - harmony before s ≈ harmony before d, and after s ≈ after d (chroma of the harmonic part, 1.6 s windows),
  - timbre (MFCC) close, loudness close, an attack at both points (cut on a downbeat-like event),
  - d leaves at least ~1 bar before the vocal so the lead-in phrase into "Never" is intact,
  - the kept trumpet material lasts ~8–15 s (the brief), preferring a phrase end (novelty boundary).
"""
import json, sys

import librosa
import numpy as np

wav, out = sys.argv[1], sys.argv[2]
sr, hop = 22050, 256
y, _ = librosa.load(wav, sr=sr, mono=True)
H = librosa.effects.harmonic(y, margin=2.0)
ch = librosa.feature.chroma_cqt(y=H, sr=sr, hop_length=hop)
mf = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20, hop_length=hop)[1:]
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
fr = lambda t: int(round(t * sr / hop))
tm = lambda i: i * hop / sr
W = fr(1.6)
VOCAL = 64.36


def peaks(lo, hi, k=0.35):
    i0, i1 = fr(lo), fr(hi)
    seg = oenv[i0:i1]
    p = librosa.util.peak_pick(seg, pre_max=6, post_max=6, pre_avg=20, post_avg=20, delta=0.2, wait=12)
    thr = k * seg.max()
    return [i0 + int(q) for q in p if seg[q] >= thr]


def vec(i0, i1):
    c = ch[:, i0:i1].mean(axis=1); c /= np.linalg.norm(c) + 1e-9
    m = mf[:, i0:i1].mean(axis=1); m /= np.linalg.norm(m) + 1e-9
    return c, m, 20 * np.log10(rms[i0:i1].mean() + 1e-9)


S = peaks(7.0, 17.0)
D = peaks(56.0, VOCAL - 1.4)
res = []
for s in S:
    cb_s, mb_s, lb_s = vec(s - W, s); ca_s, ma_s, la_s = vec(s, s + W)
    for d in D:
        cb_d, mb_d, lb_d = vec(d - W, d); ca_d, ma_d, la_d = vec(d, d + W)
        harm = 0.5 * float(ca_s @ ca_d) + 0.5 * float(cb_s @ cb_d)
        timb = 0.5 * float(ma_s @ ma_d) + 0.5 * float(mb_s @ mb_d)
        # what the listener hears across the join: the bar before s, then the bar after d
        cross = float(cb_s @ ca_d)
        lvl = abs(lb_s - la_d)
        att = min(oenv[s], oenv[d]) / oenv.max()
        sc = float(0.35 * harm + 0.25 * cross + 0.2 * timb - 0.012 * lvl + 0.1 * att)
        res.append({"score": round(sc, 4), "src": round(tm(s), 3), "dst": round(tm(d), 3), "harm": round(harm, 3), "cross": round(cross, 3),
                    "timbre": round(timb, 3), "level_diff_db": round(float(lvl), 1), "attack": round(float(att), 2),
                    "trumpet_kept_s": round(tm(s), 2), "dst_to_vocal_s": round(VOCAL - tm(d), 2)})
res.sort(key=lambda r: -r["score"])
json.dump({"vocal_onset_rec_s": VOCAL, "src_candidates": [round(tm(s), 3) for s in S], "dst_candidates": [round(tm(d), 3) for d in D], "pairs": res[:40]}, open(out, "w"), indent=1)
for r in res[:20]:
    print(r)
