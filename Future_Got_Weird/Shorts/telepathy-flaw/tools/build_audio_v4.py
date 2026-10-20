#!/usr/bin/env python3
"""Telepathy Flaw V4 audio: the approved narration and music stems are carried over from V3 BYTE FOR BYTE; only the
effects stem is rebuilt, from a restrained cue list on the new picture, with the same synthesised voices, the same
trim and ducking, and the same static master gain as V3 (+2.2 dB), so the balance of the approved mix is unchanged.
The three int24 stems sum exactly to the mix. Nothing here has been listened to; every figure is a measurement.

Outputs: audio/v4/stems/{narration,music,effects}.wav, audio/v4/mix/FGW_TelepathyFlaw_V4_mix_48k.wav,
audio/v4/cues.json, audio/v4/MIX_LOG.json.   Usage: python3 -B tools/build_audio_v4.py"""
import hashlib
import json
import shutil
import sys
from pathlib import Path

sys.dont_write_bytecode = True
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import build_audio_v3 as b  # noqa: E402

A3 = ROOT / 'audio' / 'v3'
A4 = ROOT / 'audio' / 'v4'
SR, FULL = b.SR, b.FULL
db = b.db


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def cue(t, kind, gain=0.0, pan=0.0, dur=None, p=None, note=''):
    c = {'t': round(t, 3), 'kind': kind, 'gain': gain, 'pan': pan, 'note': note}
    if dur is not None:
        c['dur'] = dur
    if p:
        c['p'] = p
    return c


# Restrained: one sound per visible event; no whoosh on cuts. Times follow shot starts / actions in v4/plan4.ts.
CUES = [
    # opening macro: the chip's periodic tick (same texture as the closing return), pulses on "brain chip"
    cue(0.00, 'ping', -9, -0.1, note='chip tick (opening, periodic)'),
    cue(0.40, 'pop', -14, -0.05, note='macro ring 1'),
    cue(0.70, 'ping', -10, -0.1, note='chip tick; cut to the café'),
    cue(1.04, 'tag', -15, 0.1, note='his implant pulses ("lets")'),
    cue(1.40, 'ping', -11, -0.1, note='chip tick (opening, periodic)'),
    cue(1.43, 'tag', -15, 0.1, note='implant pulse ("talk")'),
    cue(2.02, 'chime', -7, 0.45, note='the greeting arrives at her: the friendly arrival chime (first use), in the gap after "someone"'),
    # throat -> match cut -> dive
    cue(3.30, 'open', -9, -0.1, dur=0.5, note='the throat cutaway opens'),
    cue(4.72, 'close', -10, -0.1, dur=0.45, note='the cords close away: match cut to the disc'),
    cue(4.97, 'tick', -11, 0, note='the disc appears'),
    cue(5.08, 'whoosh', -11, 0, dur=0.5, p={'from': 0, 'to': 0, 'rise': 1}, note='dive into the disc'),
    # capture, pickup, decoding (one sound per action)
    cue(5.86, 'zip', -12, -0.15, p={'lane': 3}, note='impulse runs the axon'),
    cue(6.02, 'zip', -12, -0.1, p={'lane': 5}),
    cue(6.18, 'zip', -12, -0.05, p={'lane': 4}),
    cue(6.38, 'tag', -11, 0.1, note='the electrode tip captures it'),
    cue(6.56, 'whoosh', -13, 0, dur=0.45, p={'from': -0.1, 'to': 0.1, 'rise': 1}, note='the signal climbs the shaft'),
    cue(7.30, 'tag', -12, 0.05, note='the motor strip lights'),
    cue(7.62, 'zip', -13, 0, p={'lane': 6}),
    cue(8.90, 'form', -8, 0, dur=0.8, note='the decoder resolves the shape'),
    cue(9.206, 'tick', -12, 0, note='decoder gate'),
    cue(9.307, 'tick', -12, 0, note='decoder gate'),
    cue(9.408, 'tick', -12, 0, note='decoder gate'),
    cue(9.66, 'pop', -9, -0.05, note='the message leaves the chip'),
    # interior: effortless receipt
    cue(10.52, 'chime', -8, 0.45, note='the friendly arrival chime (second use)'),
    cue(12.10, 'ping', -16, 0.1, note='live-link tick'),
    cue(12.65, 'ping', -16, 0.1, note='live-link tick'),
    # the intrusion
    cue(13.14, 'glitch', -4, -0.1, dur=0.22, note='the anomaly ("until")'),
    cue(13.20, 'swell', -9, 0, dur=1.3, note='low swell under the intrusion'),
    cue(13.84, 'alarm', -12, 0, note='UNFILTERED THOUGHT DETECTED (label pops after "brain")'),
    cue(14.52, 'thump', -9, 0, note='the cup breaks in the subjective image'),
    cue(15.55, 'inhale', -17, -0.3, note='he breathes'),
    # unwanted thoughts
    cue(17.05, 'tick', -15, -0.1, note='his grip tightens'),
    cue(18.10, 'static', -17, 0, dur=1.2, note='the swarm of impulses'),
    # the flaw: same treatment twice
    cue(22.45, 'form', -10, 0, dur=0.5, note='same treatment (intended)'),
    cue(22.60, 'tick', -12, 0), cue(22.75, 'tick', -12, 0), cue(22.90, 'tick', -12, 0),
    cue(22.85, 'form', -10, 0, dur=0.5, note='same treatment (unwanted)'),
    cue(23.00, 'tick', -12, 0), cue(23.15, 'tick', -12, 0), cue(23.30, 'tick', -12, 0),
    cue(23.05, 'pop', -10, -0.05, note='token A'),
    cue(23.45, 'pop', -10, -0.05, note='token B (identical)'),
    cue(20.82, 'tick', -16, -0.1, note='his hands clench in his lap'),
    # the signal and the reaction
    cue(24.95, 'zipred', -10, -0.1, note='his implant pulses: the brief signal'),
    cue(25.78, 'chimebad', -6, 0.45, note='the same friendly chime, uncomfortable: lower, dry (Message Delivered, in the gap after "you")'),
    cue(25.38, 'pop', -13, 0.4, note='the alert pops beside her (a chair and a cup)'),
    cue(25.46, 'inhale', -18, 0.5, note='she breathes in as she reads'),
    cue(26.28, 'rustle', -14, 0.5, note='she draws back; the chair slides'),
    # return into the opening (unchanged from V3)
    cue(27.40, 'wipe', -7, 0, dur=0.6, note='the return into the opening (eerie transition)'),
    cue(27.65, 'ping', -10, -0.1, note='chip tick (return): same texture as frame 0'),
]


def main():
    (A4 / 'stems').mkdir(parents=True, exist_ok=True)
    (A4 / 'mix').mkdir(parents=True, exist_ok=True)
    for name in ('narration', 'music'):
        shutil.copyfile(A3 / 'stems' / f'{name}.wav', A4 / 'stems' / f'{name}.wav')
        assert sha(A3 / 'stems' / f'{name}.wav') == sha(A4 / 'stems' / f'{name}.wav')
    cues = {'fps': 30, 'duration_s': 28, 'cues': CUES, 'note': 'V4 effects cue list; narration and music stems are the V3 stems, unchanged'}
    json.dump(cues, open(A4 / 'cues.json', 'w'), indent=1)

    nar = b.read_wav24(ROOT / 'audio' / 'narration' / 'narration_final_48k.wav')[: b.N]
    fx = b.build_effects(cues)
    fx.L *= db(b.FX_TRIM)
    fx.R *= db(b.FX_TRIM)
    sp = b.smooth_env(nar, 0.02, 0.28)
    sp = np.clip((sp - 0.01) / 0.05, 0, 1)
    duck_fx = 1 - sp * (1 - db(-2.5))
    fx.L *= duck_fx
    fx.R *= duck_fx
    v3log = json.load(open(A3 / 'MIX_LOG.json'))
    g_static = db(v3log['static_gain_db'])
    scale = FULL * 0.98
    nl, nr = b.read_int24(A4 / 'stems' / 'narration.wav')
    ul, ur = b.read_int24(A4 / 'stems' / 'music.wav')
    trim_db = 0.0
    # sidechained ceiling for the EFFECTS only (narration and music are untouched): where an effect would push the sum
    # past -1.2 dBFS, the effect gain is reduced (smoothly, +-8 ms) so the mix keeps the ceiling the V3 limiter held
    ceil = db(b.CEIL_DB) * FULL
    eL, eR = fx.L * g_static * scale, fx.R * g_static * scale
    gain = np.ones(len(eL))
    for e, base in ((eL, nl + ul), (eR, nr + ur)):
        head = np.where(e >= 0, ceil - base, ceil + base)
        need = np.where(np.abs(e) > 1e-9, np.clip(head / np.maximum(np.abs(e), 1e-9), 0, 1), 1)
        gain = np.minimum(gain, need)
    k = int(0.008 * SR)
    gmin = gain.copy()
    for sft in range(1, k + 1):
        gmin[:-sft] = np.minimum(gmin[:-sft], gain[sft:])
        gmin[sft:] = np.minimum(gmin[sft:], gain[:-sft])
    gs = np.convolve(gmin, np.hanning(2 * k + 1) / np.hanning(2 * k + 1).sum(), mode='same')
    gs = np.minimum(gs, gmin + 0) if False else gs
    fx.L = fx.L * gs
    fx.R = fx.R * gs
    for _ in range(12):
        el, er = b.write_wav24(A4 / 'stems' / 'effects.wav', fx.L * g_static * db(trim_db) * scale, fx.R * g_static * db(trim_db) * scale)
        mixL, mixR = nl + ul + el, nr + ur + er
        peak = max(np.abs(mixL).max(), np.abs(mixR).max()) / FULL
        mp = A4 / 'mix' / 'FGW_TelepathyFlaw_V4_mix_48k.wav'
        b.write_wav24(mp, mixL.astype(np.float64), mixR.astype(np.float64))
        meas = b.lufs_and_tp(mp)
        if meas['tp'] <= -1.0:
            break
        trim_db -= 0.5
    rl, rr = b.read_int24(mp)
    log = {
        'target_lufs': b.TARGET_LUFS,
        'measured': meas,
        'sample_peak_dbfs': round(20 * np.log10(peak), 2),
        'effects_extra_trim_db': trim_db,
        'effects_sidechain_min_gain_db': round(20 * np.log10(max(gs.min(), 1e-6)), 2),
        'static_gain_db': v3log['static_gain_db'],
        'stems_sum_exactly_to_mix': bool(np.array_equal(rl, mixL) and np.array_equal(rr, mixR)),
        'narration_stem_sha256': sha(A4 / 'stems' / 'narration.wav'),
        'narration_stem_identical_to_v3': sha(A4 / 'stems' / 'narration.wav') == sha(A3 / 'stems' / 'narration.wav'),
        'music_stem_identical_to_v3': sha(A4 / 'stems' / 'music.wav') == sha(A3 / 'stems' / 'music.wav'),
        'duration_s': b.DUR,
        'listened': False,
        'note': 'Nothing in this build has been listened to; every figure is a measurement.',
    }
    json.dump(log, open(A4 / 'MIX_LOG.json', 'w'), indent=1)
    print(json.dumps(log, indent=1))


if __name__ == '__main__':
    main()
