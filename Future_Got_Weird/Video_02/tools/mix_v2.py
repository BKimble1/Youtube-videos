#!/usr/bin/env python3
"""V2 final audio mix: narration + ducked dynamic music + effects + very low room tones → -16 LUFS, <= -1 dBTP master.

Targets (production choices, not platform rules): about -16 LUFS integrated, <= -1 dBTP.
Inputs : source/public/audio/narration.wav (from build_timeline.py), audio/music/v2/music_bed.wav (make_music_v2.py),
         audio/sfx/v2/sfx_track.wav + amb_track.wav (make_sfx_v2.py)
Outputs: source/public/audio/mix.wav (used by the Remotion render)
         audio/mix/v2/final_mix.wav, audio/mix/v2/stem_narration.wav, stem_music_ducked.wav, stem_sfx.wav (effects + room tones)
Usage  : python3 tools/mix_v2.py [--music-lufs -27] [--duck-db 9] [--sfx-db 0] [--amb-lufs -46]
"""
import argparse
import json
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000


def fit(x, n):
    if x.ndim == 1:
        x = x[:, None]
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    return x[:n] if len(x) >= n else np.vstack([x, np.zeros((n - len(x), 2))])


def hp(x, f):
    sos = signal.butter(2, f, "highpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def shelf_presence(x, f0=3500, gain_db=1.5, q=0.7):
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * a, -2 * np.cos(w0), 1 - alpha * a]
    aa = [1 + alpha / a, -2 * np.cos(w0), 1 - alpha / a]
    return signal.lfilter(np.array(b) / aa[0], np.array(aa) / aa[0], x, axis=0)


def envelope(x, win_ms=20):
    mono = np.sqrt(np.mean(x ** 2, axis=1)) if x.ndim == 2 else np.abs(x)
    w = max(1, int(win_ms / 1000 * SR))
    k = np.ones(w) / w
    return np.sqrt(np.convolve(mono ** 2, k, mode="same"))


def smooth_ar(g, attack_ms, release_ms):
    """One-pole attack/release smoothing of a gain curve (gain falls = attack)."""
    a = np.exp(-1.0 / (attack_ms / 1000 * SR))
    r = np.exp(-1.0 / (release_ms / 1000 * SR))
    out = np.empty_like(g)
    y = g[0]
    for i in range(len(g)):
        c = a if g[i] < y else r
        y = c * y + (1 - c) * g[i]
        out[i] = y
    return out


def compress(x, threshold_db=-24, ratio=2.2, attack_ms=8, release_ms=120):
    env = envelope(x, 10)
    lvl = 20 * np.log10(env + 1e-9)
    over = np.maximum(lvl - threshold_db, 0)
    gr_db = -over * (1 - 1 / ratio)
    g = 10 ** (gr_db / 20)
    g = smooth_ar(g, attack_ms, release_ms)
    return x * (g[:, None] if x.ndim == 2 else g)


def true_peak(x):
    up = signal.resample_poly(x, 4, 1, axis=0)
    return np.max(np.abs(up))


def limit(x, ceiling_dbtp=-1.2, lookahead_ms=5, release_ms=80):
    ceil = 10 ** (ceiling_dbtp / 20)
    up = signal.resample_poly(x, 4, 1, axis=0)
    pk = np.max(np.abs(up), axis=1).reshape(-1, 4).max(axis=1) if len(up) % 4 == 0 else np.max(np.abs(up[: len(up) // 4 * 4]), axis=1).reshape(-1, 4).max(axis=1)
    pk = np.concatenate([pk, np.full(len(x) - len(pk), pk[-1] if len(pk) else 0)])
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    la = max(1, int(lookahead_ms / 1000 * SR))
    # min over the look-ahead window so gain is already down when the peak arrives
    from scipy.ndimage import minimum_filter1d
    need = minimum_filter1d(need, size=2 * la + 1, mode="nearest")
    g = smooth_ar(need, 0.5, release_ms)
    g = np.minimum(g, need)
    return x * g[:, None]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--music-lufs", type=float, default=-27.0, help="music bed loudness before ducking (LUFS)")
    ap.add_argument("--duck-db", type=float, default=9.0, help="music reduction under speech (dB)")
    ap.add_argument("--sfx-db", type=float, default=0.0)
    ap.add_argument("--amb-lufs", type=float, default=-46.0, help="room tones, very low under narration")
    ap.add_argument("--sfx-duck-db", type=float, default=2.5, help="effects reduction under speech (dB)")
    ap.add_argument("--target-lufs", type=float, default=-16.0)
    ap.add_argument("--no-public", action="store_true", help="don't overwrite source/public/audio/mix.wav (e.g. while a render is reading it)")
    args = ap.parse_args()

    nar, sr = sf.read(os.path.join(ROOT, "source/public/audio/narration.wav"), always_2d=True)
    assert sr == SR
    n = len(nar)
    nar = nar.mean(axis=1)
    mus, sr2 = sf.read(os.path.join(ROOT, "audio/music/v2/music_bed.wav"), always_2d=True)
    sfx, sr3 = sf.read(os.path.join(ROOT, "audio/sfx/v2/sfx_track.wav"), always_2d=True)
    amb, sr4 = sf.read(os.path.join(ROOT, "audio/sfx/v2/amb_track.wav"), always_2d=True)
    assert sr2 == SR and sr3 == SR and sr4 == SR
    mus, sfx, amb = fit(mus, n), fit(sfx, n), fit(amb, n)

    meter = pyln.Meter(SR)
    # --- narration chain: HPF, light compression, a touch of presence, level to -17 LUFS
    v = hp(nar, 75)
    v = compress(v, threshold_db=-26, ratio=2.0)
    v = shelf_presence(v, 3500, 1.5)
    room = np.random.default_rng(3).standard_normal(n) * 10 ** (-74 / 20)  # very low room tone, avoids digital-silence gaps
    room = signal.sosfilt(signal.butter(2, [120, 6000], "bandpass", fs=SR, output="sos"), room)
    v = v + room
    lv = meter.integrated_loudness(np.repeat(v[:, None], 2, axis=1))
    v *= 10 ** ((-17.0 - lv) / 20)
    V = np.repeat(v[:, None], 2, axis=1)

    # --- ducking: sidechain from narration envelope
    e = envelope(v, 30)
    e_db = 20 * np.log10(e + 1e-9)
    speech = np.clip((e_db + 48) / 12, 0, 1)  # 0 below -48 dBFS, 1 above -36 dBFS
    # look ahead 120 ms (the music is already down when a phrase starts) and hold 300 ms (no swell
    # in the short pauses between phrases); the attack/release smoothing below shapes the moves
    from scipy.ndimage import maximum_filter1d
    la, hold = int(0.12 * SR), int(0.30 * SR)
    speech_raw = speech
    speech = maximum_filter1d(speech, size=la + hold + 1, origin=(hold - la) // 2, mode="nearest")
    duck_db = -args.duck_db * speech
    g = 10 ** (duck_db / 20)
    g = smooth_ar(g, 60, 450)
    lm = meter.integrated_loudness(mus)
    M = mus * 10 ** ((args.music_lufs - lm) / 20) * g[:, None]
    gs = smooth_ar(10 ** (-args.sfx_duck_db * speech / 20), 40, 300)
    S = sfx * 10 ** (args.sfx_db / 20) * gs[:, None]
    la_ = meter.integrated_loudness(amb) if np.abs(amb).max() > 0 else -99
    A = amb * (10 ** ((args.amb_lufs - la_) / 20) if la_ > -90 else 0) * smooth_ar(10 ** (-3 * speech / 20), 200, 900)[:, None]
    S = S + A

    mix = V + M + S
    l1 = meter.integrated_loudness(mix)
    gain = 10 ** ((args.target_lufs - l1) / 20)
    mix *= gain
    V *= gain
    M *= gain
    S *= gain
    mix = limit(mix, -1.3)
    l2 = meter.integrated_loudness(mix)
    tp = 20 * np.log10(true_peak(mix) + 1e-12)

    out_dir = os.path.join(ROOT, "audio/mix/v2")
    os.makedirs(out_dir, exist_ok=True)
    if not args.no_public:
        sf.write(os.path.join(ROOT, "source/public/audio/mix.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(out_dir, "final_mix.wav"), mix.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(out_dir, "stem_narration.wav"), V.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(out_dir, "stem_music_ducked.wav"), M.astype(np.float32), SR, subtype="PCM_24")
    sf.write(os.path.join(out_dir, "stem_sfx.wav"), S.astype(np.float32), SR, subtype="PCM_24")

    # speech-to-music ratio while speaking
    sp = speech_raw > 0.9
    vr = np.sqrt(np.mean(V[sp] ** 2)) if sp.any() else 0
    mr = np.sqrt(np.mean(M[sp] ** 2)) if sp.any() else 0
    gap = (speech_raw < 0.05)
    mrg = np.sqrt(np.mean(M[gap] ** 2)) if gap.any() else 0
    report = {
        "integrated_lufs_python": round(l2, 2),
        "true_peak_dbtp_python_4x": round(tp, 2),
        "voice_to_music_db_during_speech": round(20 * np.log10(vr / (mr + 1e-12)), 1),
        "music_rms_in_gaps_dbfs": round(20 * np.log10(mrg + 1e-12), 1),
        "music_lufs_before_ducking": args.music_lufs,
        "duck_db": args.duck_db,
        "amb_lufs": args.amb_lufs,
        "sfx_db": args.sfx_db,
        "duration_s": round(n / SR, 3),
    }
    with open(os.path.join(out_dir, "mix_report.json"), "w") as f:
        json.dump(report, f, indent=1)
    print(json.dumps(report))


if __name__ == "__main__":
    main()
