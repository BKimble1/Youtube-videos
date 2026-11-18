"""The website trailer's music: the game's own round theme, "Soft Bounce Loop"
(art_src/audio/soft_bounce_loop_source.m4a, the owner's track; the same
recording tools/make_match_music.py cuts the in-round music from), arranged
to the edit.

    python3 build_music.py OUT_DIR

The theme is 100.000 BPM in D major on a strict grid, first downbeat at 1.028 s
(make_match_music.py), its form repeating on 8 bars.  It is time-stretched
by exactly 1.2 (rubberband, pitch kept) to 120 BPM, so one bar is exactly
2.0 s, the edit's grid, and whole bars are laid onto the timeline:

    0-2     bar 0, low-passed and opening up (the hook)
    2-6     bars 1-2, airy (low cut, more room), a riser and a held breath
    6-22    bars 7-14, full: the drop; from 14 s a drum layer pushes harder,
            a snare build, and a stop on the half bar at 21.5
    22-27.5 bars 15-17 (the phrase's strongest return) with the drum layer
            and a crash; a hard stop at 27.5
    28-30   the first beat of bar 18 with a boom, a crash and a long tail

Writes OUT_DIR/music_mix.wav (48 kHz) and OUT_DIR/music_theme.wav (the
arranged theme alone) and OUT_DIR/music_layer.wav (the added percussion).
"""
import os
import subprocess
import sys

import numpy as np
import pyloudnorm as pyln
from scipy import signal

import dsp
from dsp import SR, place, secs

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "music_src", "soft_bounce_loop_source.m4a")
DUR = 30.5
STRETCH = 1.2
FIRST_DOWNBEAT = 45329 / 44100.0          # bar 0's downbeat in the source
BAR = 2.4 / STRETCH                       # 2.0 s after the stretch
BEAT = BAR / 4


def theme():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-af", f"rubberband=tempo={STRETCH}:pitchq=quality:transients=crisp",
                          "-ar", str(SR), "-ac", "2", "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def bar_at(x, m, nbars=1, pre=0.004):
    """Source bar m (after the stretch), nbars long, starting `pre` s before
    its downbeat (so the cut hides just under the attack)."""
    t0 = FIRST_DOWNBEAT / STRETCH + m * BAR - pre
    return x[secs(t0):secs(t0 + nbars * BAR)].copy()


def lay(buf, clip, t, xf=0.008):
    """Place a bar with short equal-power fades at both ends."""
    clip = clip.copy()
    n = secs(xf)
    if len(clip) > 2 * n:
        r = np.sin(np.linspace(0, np.pi / 2, n))[:, None]
        clip[:n] *= r
        clip[-n:] *= r[::-1]
    place(buf, clip, t - 0.004)


def reverb(x, wet=0.25, dur=2.4, seed=31):
    ir = dsp.make_ir(dur, damp=5000.0, seed=seed)
    ir = ir / np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))     # unit energy: the tail sits at the dry level
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


def env_db(n, keys):
    t = np.arange(n) / SR
    k = np.array(keys, float)
    return dsp.db(np.interp(t, k[:, 0], k[:, 1])).astype(np.float32)[:, None]


def main(out):
    os.makedirs(out, exist_ok=True)
    x = theme()
    n = secs(DUR)
    th = np.zeros((n, 2), np.float32)

    # 0-2: the hook, bar 0 low-passed, opening toward the splash
    hook = dsp.sweep_filter(bar_at(x, 0), 420.0, 5200.0, kind="low")
    lay(th, hook, 0.0)
    # 2-6: the reveal, bars 1-2, airy and roomy
    rev = reverb(dsp.hp(bar_at(x, 1, 2), 180.0), wet=0.55)
    lay(th, rev, 2.0)
    # 6-22: the drop, bars 7-14
    lay(th, bar_at(x, 7, 8), 6.0)
    # 22-28: the climax, bars 15-17 (to the stop at 27.5)
    lay(th, bar_at(x, 15, 3), 22.0)
    # 28-30: the logo, bar 18's first beat ringing out
    hit = bar_at(x, 18, 1)[: secs(BEAT * 1.2)]
    hit = reverb(dsp.fade(hit, 0.0, 0.25), wet=0.8, dur=3.2, seed=41)
    tail = np.concatenate([hit, np.zeros((secs(2.4), 2), np.float32)])
    tail = reverb(tail, wet=0.6, dur=3.0, seed=43)
    lay(th, dsp.fade(tail[: secs(2.45)], 0.0, 0.9), 28.0)

    # the shape: hush under the hook, a breath before the drop, the stops
    th *= env_db(n, [(0.0, -6.0), (1.9, -3.0), (2.0, -1.5), (5.6, -1.0), (5.72, -18.0), (5.98, -18.0), (6.0, 0.0),
                     (21.47, 0.0), (21.5, -40.0), (21.98, -40.0), (22.0, 0.5), (27.47, 0.5), (27.5, -60.0), (27.99, -60.0), (28.0, 0.0)])

    # ---------------------------------------------------------------- the added percussion
    ly = np.zeros((n, 2), np.float32)
    # hook: a riser into the splash, a low hit on it
    place(ly, dsp.riser(1.6, 300.0, 3500.0, seed=51, tonal=False), 0.4, 0.22)
    place(ly, dsp.boom(1.8, 70.0, 42.0, seed=52, dist=1.4), 2.0, 0.45)
    # reveal: a long riser and a reverse crash into the drop
    place(ly, dsp.riser(2.0, 250.0, 6000.0, seed=53, tonal=False), 3.7, 0.25)
    rc = dsp.reverse_crash(1.4, seed=54)
    place(ly, rc, 6.0 - len(rc) / SR, 0.35)
    # the drop
    place(ly, dsp.boom(2.2, 66.0, 40.0, seed=55, dist=1.6), 6.0, 0.55)
    place(ly, dsp.crash(3.0, seed=56, vel=0.8), 6.0, 0.35)
    # 14-21.5: drums push harder (kick on every beat, claps on 2 and 4)
    for i in range(int((21.5 - 14.0) / BEAT)):
        t = 14.0 + i * BEAT
        place(ly, dsp.kick(0.35, 140.0, 48.0, punch=0.9, seed=60 + i), t, 0.32)
        if i % 2 == 1:
            place(ly, dsp.clap(seed=90 + i, vel=0.7), t, 0.22)
    # the build into the stop: snare 8ths then 16ths over 20-21.5
    for i in range(8):
        t = 20.0 + i * BEAT / 2 if i < 4 else 21.0 + (i - 4) * BEAT / 4
        place(ly, dsp.snare(0.25, seed=120 + i, vel=0.55 + 0.05 * i), t, 0.22)
    # 22-27.5: the climax, taiko on the beat and a crash on the downbeat
    place(ly, dsp.crash(3.0, seed=130, vel=0.9), 22.0, 0.4)
    place(ly, dsp.boom(2.0, 64.0, 40.0, seed=131, dist=1.5), 22.0, 0.45)
    for i in range(int((27.5 - 22.0) / BEAT)):
        t = 22.0 + i * BEAT
        place(ly, dsp.taiko(0.9, 76.0, seed=140 + i, vel=0.8), t, 0.28 if i % 4 else 0.38)
    place(ly, dsp.riser(1.4, 400.0, 7000.0, seed=170, tonal=False), 26.1, 0.25)
    # the logo
    place(ly, dsp.boom(3.0, 62.0, 38.0, seed=180, dist=1.8), 28.0, 0.7)
    place(ly, dsp.crash(3.5, seed=181, vel=1.0), 28.0, 0.45)
    place(ly, dsp.sub_drop(1.6, 70.0, 36.0), 28.0, 0.4)

    meter = pyln.Meter(SR)
    lt = meter.integrated_loudness(th.astype(np.float64))
    th *= dsp.db(-17.0 - lt)
    ll = meter.integrated_loudness(ly.astype(np.float64))
    ly *= dsp.db(-24.0 - ll)        # the added percussion sits ~7 LU under the theme
    mix = th + ly
    lm = meter.integrated_loudness(mix.astype(np.float64))
    g = dsp.db(-16.0 - lm)
    dsp.write(os.path.join(out, "music_theme.wav"), th * g)
    dsp.write(os.path.join(out, "music_layer.wav"), ly * g)
    dsp.write(os.path.join(out, "music_mix.wav"), mix * g)
    print("music", round(meter.integrated_loudness((mix * g).astype(np.float64)), 2), "LUFS, peak", float(np.max(np.abs(mix * g))))


if __name__ == "__main__":
    main(sys.argv[1])
