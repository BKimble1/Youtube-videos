"""Final trailer mix: music + sound design, ducking, bus glue, true-peak
limiting and loudness.

    python3 mix.py MUSIC_DIR SFX_DIR OUT.wav [--lufs -14] [--tp -1.2]
    python3 mix.py - SFX_DIR OUT.wav --music-file audio/music_src/Winter_Heist.mp3 --music-offset 0.16

MUSIC_DIR/music_mix.wav (build_music.py), SFX_DIR/sfx_mix.wav (build_sfx.py).
--music-file uses a finished track instead (it keeps its own dynamics: no
section shape and no sound-design stop-downs); --music-offset trims its start
so its beats land on the edit's 120 BPM grid.
Writes OUT.wav (48 kHz, 24-bit, exactly 30.0 s) and OUT.json (loudness,
true peak, the levels used).
"""
import argparse
import json
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from pedalboard import Compressor, Pedalboard, HighShelfFilter, LowShelfFilter, HighpassFilter

import dsp
from dsp import SR, secs

DUR = 30.0
# music ducking under key sound moments: (t0, t1, dB)
DUCKS = [(0.3, 1.75, -4.0), (18.12, 19.55, -3.0), (21.0, 22.0, -2.0), (26.95, 27.6, -3.0)]
# the trailer's dynamic shape (music gain in dB at times, linear between):
# a hushed cold open, a build, a drop that jumps, a slightly lower chaos bed
# under the cuts, the chase climbing to the climax, the logo the loudest hit
SHAPE = [(0.0, -9.0), (1.95, -8.0), (2.0, -4.0), (3.7, -2.5), (3.99, -2.5), (4.0, 1.5), (9.9, 0.5), (10.0, 0.0), (17.7, 0.0),
         (18.0, -1.0), (20.9, 0.0), (21.0, -2.0), (21.99, -1.0), (22.0, 0.5), (25.9, 1.0), (26.0, 2.0), (27.0, 1.5), (27.99, 1.5),
         (28.0, 2.5), (30.0, 2.0)]
# sound design dips inside the musical stop-downs (the silences before the hits)
SFX_STOPS = [(3.78, 3.99, -22.0), (17.8, 17.99, -22.0), (27.78, 27.99, -22.0)]


def shape_env(n):
    t = np.arange(n) / SR
    k = np.array(SHAPE)
    return dsp.db(np.interp(t, k[:, 0], k[:, 1])).astype(np.float32)


def env_from(ducks, n):
    t = np.arange(n) / SR
    g = np.zeros(n, np.float32)
    for t0, t1, d in ducks:
        r = 0.06
        a = np.clip((t - (t0 - r)) / r, 0, 1) * np.clip(((t1 + r) - t) / r, 0, 1)
        g = np.minimum(g, a * d)
    return dsp.db(g)


def true_peak_db(x):
    from scipy import signal
    up = signal.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("music")
    ap.add_argument("sfx")
    ap.add_argument("out")
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--tp", type=float, default=-1.2)
    ap.add_argument("--sfx-lufs", type=float, default=-21.5)
    ap.add_argument("--music-file")
    ap.add_argument("--music-offset", type=float, default=0.0)
    ap.add_argument("--stems", help="also write FLAC stems here (music, sound design and its groups, at mix level before the bus)")
    a = ap.parse_args()
    meter = pyln.Meter(SR)
    if a.music_file:
        import subprocess
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a.music_offset:.4f}", "-i", a.music_file, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                             capture_output=True, check=True).stdout
        music = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
    else:
        music = dsp.read(os.path.join(a.music, "music_mix.wav"))
    sfx = dsp.read(os.path.join(a.sfx, "sfx_mix.wav"))
    n = secs(DUR)
    music = np.pad(music, ((0, max(0, n - len(music))), (0, 0)))[:n]
    sfx = np.pad(sfx, ((0, max(0, n - len(sfx))), (0, 0)))[:n]
    Lm = meter.integrated_loudness(music.astype(np.float64))
    Ls = meter.integrated_loudness(sfx.astype(np.float64))
    music = music * dsp.db(-16.0 - Lm)
    sfx = sfx * dsp.db(a.sfx_lufs - Ls)
    if a.music_file:
        # a finished track: only gentle ducks under the radio, the slow-motion splash and the shush
        music = music * env_from([(t0, t1, d * 0.6) for t0, t1, d in DUCKS], n)[:, None]
    else:
        music = music * env_from(DUCKS, n)[:, None] * shape_env(n)[:, None]
        sfx = sfx * env_from(SFX_STOPS, n)[:, None]
    if a.stems:
        os.makedirs(a.stems, exist_ok=True)
        sf.write(os.path.join(a.stems, "stem_music.flac"), music.astype(np.float32), SR, subtype="PCM_24")
        sf.write(os.path.join(a.stems, "stem_sound_design.flac"), sfx.astype(np.float32), SR, subtype="PCM_24")
        g = dsp.db(a.sfx_lufs - Ls)
        for grp in ("amb", "foley", "fx", "radio", "trans"):
            gp = os.path.join(a.sfx, f"sfx_{grp}.wav")
            if os.path.exists(gp):
                x = dsp.read(gp)
                x = np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n] * g
                sf.write(os.path.join(a.stems, f"stem_sfx_{grp}.flac"), x.astype(np.float32), SR, subtype="PCM_24")
    mix = music + sfx
    mix = Pedalboard([HighpassFilter(22), Compressor(-14, 1.6, 20, 250), LowShelfFilter(80, 0.8), HighShelfFilter(10000, 0.6)])(mix.T.copy(), SR).T
    # loudness, then a true-peak limiter, then loudness again (the limiter only trims peaks)
    for _ in range(3):
        L = meter.integrated_loudness(mix.astype(np.float64))
        mix = mix * dsp.db(a.lufs - L)
        mix = dsp.limiter(mix, ceiling_db=a.tp - 0.3, lookahead=0.005, release=0.08)
    # the very end: no click
    mix[-secs(0.02):] *= np.linspace(1, 0, secs(0.02))[:, None]
    L = meter.integrated_loudness(mix.astype(np.float64))
    tp = true_peak_db(mix)
    sf.write(a.out, mix.astype(np.float32), SR, subtype="PCM_24")
    rep = {"music": a.music_file or os.path.join(a.music, "music_mix.wav"), "music_offset_s": a.music_offset, "integrated_lufs": round(float(L), 2), "true_peak_dbtp": round(float(tp), 2), "music_in_lufs": round(float(Lm), 2), "sfx_in_lufs": round(float(Ls), 2),
           "sfx_target_lufs": a.sfx_lufs, "duration_s": DUR}
    json.dump(rep, open(os.path.splitext(a.out)[0] + ".json", "w"), indent=2)
    print(rep)


if __name__ == "__main__":
    main()
