#!/usr/bin/env python3
"""V4: rebuild ONLY the effects bus from audio/v4/cues.json and mix it with the untouched V3 narration and music
stems ("option R"; script/V4_DESIGN.md area 8, sound.md fix plan steps 2-5).

  1. audio/v3/stems/narration.wav and music.wav are copied byte for byte to audio/v4/stems (sha256 checked).
  2. V3's shared gain envelope G3 = g * lim3 is rebuilt in memory from audio/v3/cues.json with the V3 code
     (tools/build_audio_v3.py, imported read-only): the static gain is FROZEN at V3's value (-15 - input_i from
     audio/v3/MIX_LOG.json = 4.23 dB) and the V3 limiter envelope is recomputed from the V3 sum. The rebuild is
     verified bit-exact against all four V3 files (narration, music, effects, mix) before anything is written.
  3. The V4 effects bus is built from audio/v4/cues.json with V3's ducking (one-shots -2.5 dB, continuous beds -6 dB
     under speech), plus an optional per-cue duck: p.duck (dB at full speech) with p.duckLead (s of look-ahead).
     New kinds: press (soft contact), tpulse (restrained treatment pulse). Extended: rotor 'curve' mode (per-frame
     rate/dist/pan/lvl arrays, continuous phase, smoothed doppler) and shaped spin-up params; alarm1 p.low / p.att /
     p.ring; fib p.at / p.amp / p.bed (a thump on each drawn heart twitch over a quiver bed, lib/heart4.ts); ticks p.at
     (one tick per sensor bead leaving the nose, Journey3 SENSOR_REL).
     V3 kinds and params not named above go through the V3 generators unchanged.
  4. effects x G3, ROUNDED to int24 (V3's writer truncated); mix = narration + music + effects as an exact integer
     sum, so the stems sum to the mix with zero residual. No new limiter, no re-normalisation: an effects-only
     safety reduction is applied only if a mix sample exceeds the -1.8 dBFS ceiling (+3 LSB) or the true peak
     exceeds -1.5 dBTP; narration and music are never touched.
  5. writes audio/v4/stems/effects.wav, audio/v4/mix/FGW_DeathClock_V4_mix_48k.wav, audio/v4/MIX_LOG.json
     (loudnorm pass 1 for information only).

Never writes into audio/v3 or exports/v3. Deterministic (noise seeded per cue id). Nothing here has been listened to.
Usage: python3 -B tools/build_audio_v4.py [--g3-cache PATH.npz]
  --g3-cache: reuse a G3 envelope saved by an earlier verified run, when every V3 input hashes the same (iteration
  speed only; the default run rebuilds and verifies G3 from scratch)."""
import sys

sys.dont_write_bytecode = True
import argparse
import hashlib
import importlib.util
import json
import shutil
import subprocess
import time
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('build_audio_v3', ROOT / 'tools' / 'build_audio_v3.py')
V3 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(V3)  # read-only: V3's module only READS audio/v3/cues.json at import; main() is not run

SR, N, FPS = V3.SR, V3.N, V3.FPS
A3 = ROOT / 'audio' / 'v3'
A4 = ROOT / 'audio' / 'v4'
CUES4_PATH = A4 / 'cues.json'
MIX_NAME = 'FGW_DeathClock_V4_mix_48k.wav'
FULL = 8388607
CEIL_DB = -1.8
TP_MAX_DBTP = -1.5
CEIL_TOL_LSB = 3
tg, bandpass, norm, env, glide, fade, db, rng = V3.tg, V3.bandpass, V3.norm, V3.env, V3.glide, V3.fade, V3.db, V3.rng


# ------------------------------------------------------------------ 24-bit IO (exact integers)
def read24(p):
    with wave.open(str(p)) as w:
        assert w.getsampwidth() == 3 and w.getframerate() == SR, p
        ch = w.getnchannels()
        b = np.frombuffer(w.readframes(w.getnframes()), np.uint8).reshape(-1, 3).astype(np.int32)
    x = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16)
    x = np.where(x >= 1 << 23, x - (1 << 24), x)
    return x.reshape(-1, ch).astype(np.int64)


def write24(p, ints):
    """Write int24 samples (already integers, already inside the int24 range)."""
    ints = np.asarray(ints, np.int64)
    assert ints.min() >= -(1 << 23) and ints.max() <= (1 << 23) - 1, p
    p.parent.mkdir(parents=True, exist_ok=True)
    b = ints.astype('<i4').tobytes()
    b24 = np.frombuffer(b, np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(str(p), 'wb') as w:
        w.setnchannels(ints.shape[1])
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b24)


def q_round(x):
    """float -> int24, ROUNDED (V3's writer truncated toward zero)."""
    return np.rint(np.clip(x, -1, 1) * FULL).astype(np.int64)


def q_trunc(x):
    """V3's writer, for the bit-exact check: (clip(x) * 8388607).astype(int32)."""
    return (np.clip(x, -1, 1) * FULL).astype('<i4').astype(np.int64)


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def loudnorm_pass1(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(p), '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return json.loads(r[r.rfind('{'):r.rfind('}') + 1])


# ------------------------------------------------------------------ V3 pieces (exactly as build_audio_v3.main)
_FILES = {}


def load_file(name):
    if name not in _FILES:
        _FILES[name] = V3.load(V3.GEN / name)
    return _FILES[name].copy()


def render_v3(c):
    """V3 cue rendering (build_audio_v3.main lines 704-712)."""
    if c['kind'] == 'file':
        x = V3.norm(V3.fade(load_file(c['p']['file']), 0.002, 0.03), 0.9)
        at = c['f'] / FPS - c['p'].get('offset', 0)
    else:
        x = V3.GEN_FUN[c['kind']](c)
        at = c['f'] / FPS
    return x, at


def limiter_v3(mixg):
    """V3's lookahead limiter (build_audio_v3.main lines 732-747), same arithmetic; the release loop runs on Python
    floats (IEEE doubles, identical results to the numpy-scalar loop, just faster)."""
    from numpy.lib.stride_tricks import sliding_window_view
    ceil = V3.db(-1.8)
    a = np.abs(mixg).max(axis=1)
    need = np.minimum(1.0, ceil / np.maximum(a, 1e-9))
    look = int(0.005 * SR)
    padded = np.concatenate([need, np.ones(look)])
    gmin = sliding_window_view(padded, look + 1).min(axis=1)[:len(need)]
    rel = float(np.exp(-1 / (0.12 * SR)))
    out = []
    v = 1.0
    for g in gmin.tolist():
        v = g if g < v else rel * v + (1 - rel) * g
        out.append(v)
    lim = np.array(out)
    k = np.hanning(look * 2 + 1)
    k /= k.sum()
    lim = np.minimum(lim, np.convolve(np.concatenate([np.ones(look), lim, np.ones(look)]), k, mode='same')[look:-look])
    return lim


def v3_inputs_hash():
    h = hashlib.sha256()
    for p in (A3 / 'cues.json', A3 / 'MIX_LOG.json', ROOT / 'tools' / 'build_audio_v3.py', ROOT / 'audio' / 'narration_v3' / 'narration_final_48k.wav',
              A3 / 'stems' / 'narration.wav', A3 / 'stems' / 'music.wav', A3 / 'stems' / 'effects.wav', A3 / 'mix' / 'FGW_DeathClock_mix_48k.wav'):
        h.update(sha256(p).encode())
    return h.hexdigest()


def rebuild_g3(log):
    """Rebuild V3's narration, music and effects buses and the gain envelope G3 = g * lim3; verify bit-exact."""
    t0 = time.time()
    mixlog3 = json.load(open(A3 / 'MIX_LOG.json'))
    nar = V3.load(ROOT / 'audio' / 'narration_v3' / 'narration_final_48k.wav')
    nar = np.concatenate([nar, np.zeros(max(0, N - len(nar)))])[:N]
    sp_env = V3.speech_env(nar)
    narc, _ = V3.compress_voice(nar)
    narS = V3.stereo(narc)
    fx = np.zeros((N, 2))
    fxc = np.zeros((N, 2))
    for c in V3.CUES['cues']:
        x, at = render_v3(c)
        p = c.get('p', {}) or {}
        V3.place(fxc if c['kind'] in V3.CONTINUOUS else fx, x, at, c['gain'], float(p.get('pan', V3.PAN.get(c['id'], 0.0))), float(p['panTo']) if 'panTo' in p else None)
    mus = V3.stereo(V3.music() * 0.32)
    sp = sp_env[:, None]
    mus_d = mus * (1 - 0.75 * sp)
    fx_d = fx * (1 - 0.25 * sp) + fxc * (1 - 0.5 * sp)
    mix = narS + mus_d + fx_d
    pre = np.abs(mix).max() / 0.98
    gain_db = -15 - float(mixlog3['loudnorm_pass1']['input_i'])  # V3: -15 - (-19.23) = 4.23 dB, frozen
    g = V3.db(gain_db) / max(1.0, pre)
    lim = limiter_v3(mix * g)
    G = (g * lim)[:, None]
    disk = {'narration': read24(A3 / 'stems' / 'narration.wav'), 'music': read24(A3 / 'stems' / 'music.wav'), 'effects': read24(A3 / 'stems' / 'effects.wav'),
            'mix': read24(A3 / 'mix' / 'FGW_DeathClock_mix_48k.wav')}
    ver = {}
    for k, x in (('narration', narS * G), ('music', mus_d * G), ('effects', fx_d * G), ('mix', mix * G)):
        d = np.abs(q_trunc(x) - disk[k])
        ver[k] = {'max_abs_lsb': int(d.max()), 'samples_differing': int((d.max(1) > 0).sum())}
    ok = all(v['max_abs_lsb'] == 0 for v in ver.values())
    log['g3'] = {'static_gain_db': gain_db, 'static_gain_source': 'audio/v3/MIX_LOG.json loudnorm_pass1.input_i (frozen; no re-normalisation)', 'premix_peak_over_0.98': round(float(pre), 4),
                 'limiter_max_reduction_db': round(float(-20 * np.log10(lim.min())), 2), 'limiter_samples_reduced': int((lim < 0.999).sum()),
                 'rebuild_vs_v3_files': ver, 'bit_exact': ok, 'rebuild_s': round(time.time() - t0, 1)}
    if not ok:
        raise SystemExit(f'G3 rebuild is NOT bit-exact against the V3 files: {ver}')
    return G[:, 0].copy(), sp_env


# ------------------------------------------------------------------ V4 generators (new kinds; extended V3 kinds)
def g_press(c):
    """Soft contact of the port nose on skin: a damped low-mid body, a tiny contact tick, a soft sub push.
    No grass, no hiss (unlike pat/thud), not metallic (unlike click/inject)."""
    p = c.get('p') or {}
    t = tg(0.22)
    r = rng(c['id'])
    body = glide(t, 260, 140, 0.02) * env(t, 0.002, 0.025)
    tick = 0.3 * bandpass(r.standard_normal(len(t)), 600, 2500) * env(t, 0.0005, 0.002)
    sub = 0.25 * float(p.get('weight', 1)) * np.sin(2 * np.pi * 90 * t) * env(t, 0.004, 0.06)
    return norm(fade(body + tick + sub, 0.0, 0.02), 0.8)


def g_tpulse(c):
    """The restrained treatment pulse: one soft low-mid swell gliding 280 -> 340 Hz with its 2nd harmonic and a
    breathy low push. Band-limited to <= 2.4 kHz (nothing above ~2.9 kHz): no shimmer, clearly unlike the sensor
    ticks (2.8-6 kHz) and V3's 1.2 s wave."""
    p = c.get('p') or {}
    t = tg(float(p.get('dur', 0.45)))
    r = rng(c['id'])
    f = 280 + 60 * (1 - np.exp(-t / 0.12))
    ph = 2 * np.pi * np.cumsum(f) / SR
    e = env(t, 0.04, 0.18)
    x = np.sin(ph) * e + 0.3 * np.sin(2 * ph) * e
    x += 0.15 * bandpass(r.standard_normal(len(t)), 200, 1500) * env(t, 0.03, 0.1)
    x = bandpass(x, 80, 2400, edge=0.2)
    return norm(fade(x, 0.0, 0.03), 0.75)


def g_alarm1(c):
    """V3's two-tone alarm transient, with optional p.low (scale of the 120 -> 60 Hz thump; 0 removes it), p.att
    (tone attack, s; V3 0.002) and p.ring (s: the second tone rings out with that decay instead of its hard 12 ms
    gate; higher harmonics decay faster). Without these params it is V3's g_alarm1, bit for bit."""
    p = c.get('p') or {}
    if not any(k in p for k in ('low', 'att', 'ring')):
        return V3.g_alarm1(c)
    low_k = float(p.get('low', 1))
    att = float(p.get('att', 0.002))
    ring = float(p.get('ring', 0))
    t = tg(max(0.32, 0.16 + 5 * ring))
    out = np.zeros_like(t)
    tones = ((0.0, 1240.0), (0.07, 980.0))
    for i, (o, f0) in enumerate(tones):
        tt = np.maximum(t - o, 0)
        on = (t >= o) & (t < o + 0.09)
        rise = np.minimum(1, tt / att)
        if ring > 0 and i == len(tones) - 1:
            after = np.maximum(t - (o + 0.09), 0)
            for h in (1, 3, 5):
                gh = np.where(t < o + 0.09, rise, np.exp(-after / (ring / h ** 0.7))) * (t >= o)
                out += np.sin(2 * np.pi * f0 * h * tt) / h * gh
        else:
            sq = sum(np.sin(2 * np.pi * f0 * h * tt) / h for h in (1, 3, 5))
            out += sq * on * rise * np.minimum(1, (o + 0.09 - t) / 0.012)
    x = bandpass(out, 300, 6000)
    if low_k:
        x = x + glide(t, 120, 60, 0.05) * env(t, 0.002, 0.08) * 0.6 * low_k
    return norm(fade(x, 0.0, 0.01), 0.85)


def _frames_to_samples(arr, n):
    """per-frame values (frame 0 = cue start) -> per-sample, linear between frames, held at the ends"""
    arr = np.asarray(arr, float).ravel()
    if arr.size == 1:
        return np.full(n, float(arr[0]))
    return np.interp(np.arange(n) / SR * FPS, np.arange(arr.size), arr)


def g_fib(c):
    """The irregular heart, following the drawn heart (lib/heart4.ts via sound4.ts heartPlan4):
    - p.at (s from the cue start) / p.amp: one low thump per drawn one-sided twitch (a full-amplitude thump peaks at
      0.85, as V3's normalised stream did); a little 170 -> 105 Hz body so it still reads on a phone speaker;
    - p.bed (per frame, 0..1) at p.bedDb under a full thump: a faint quiver of small irregular thumps (V3's stream
      texture), so the rhythm reads as fibrillating rather than as a slow irregular beat; it follows fibAmp and, in
      the journey, the chest window closing.
    Without p.at it is V3's g_fib, bit for bit."""
    p = c.get('p') or {}
    if 'at' not in p:
        return V3.g_fib(c)
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    out = np.zeros_like(t)
    m = int(0.16 * SR)
    tt = np.arange(m) / SR

    def thump(f0):
        return glide(tt, f0, 50, 0.03) * env(tt, 0.003, 0.035) + 0.3 * glide(tt, 170, 105, 0.03) * env(tt, 0.002, 0.025)

    unit = 0.85 / np.max(np.abs(thump(105.0)))
    at = [float(a) for a in np.atleast_1d(p['at'])]
    amps = [float(a) for a in np.atleast_1d(p.get('amp', [1.0] * len(at)))]
    for a, k in zip(at, amps):
        i = int(round(a * SR))
        if 0 <= i < len(out):
            seg = thump(95 + 20 * r.random()) * k * unit
            out[i:i + m] += seg[:len(out[i:i + m])]
    if 'bed' in p:
        bed = np.zeros_like(t)
        r2 = rng(c['id'] + ':bed')
        s = 0.0
        while s < d:
            seg = glide(tt, 80 + 30 * r2.random(), 48, 0.03) * env(tt, 0.004, 0.03) * (0.5 + 0.5 * r2.random())
            i = int(s * SR)
            bed[i:i + m] += seg[:len(bed[i:i + m])]
            s += 0.09 + r2.random() * 0.13
        bed = bed / (np.max(np.abs(bed)) or 1) * 0.85 * db(float(p.get('bedDb', -14)))  # peak bedDb under a full thump
        out += bed * _frames_to_samples(p['bed'], len(t))
    return fade(out, 0.0, 0.05)


def g_ticks(c):
    """Sensor ticks. With p.at (s from the cue start): one tick per bead at exactly those times (V3's tick: a 12 ms
    2.8-6 kHz ping), level 0.5-0.9 seeded, or p.amp[i] when it is > 0 (the hero bead: 1). Without p.at it is V3's
    g_ticks (random times at p.rate per second), bit for bit."""
    p = c.get('p') or {}
    if 'at' not in p:
        return V3.g_ticks(c)
    d = c['dur']
    t = tg(d)
    r = rng(c['id'])
    out = np.zeros_like(t)
    at = [float(a) for a in np.atleast_1d(p['at'])]
    amps = [float(a) for a in np.atleast_1d(p.get('amp', [0.0] * len(at)))]
    m = int(0.012 * SR)
    tt = np.arange(m) / SR
    for a, k in zip(at, amps):
        f0 = 2800 + r.random() * 3200
        lvl = 0.5 + 0.4 * r.random()
        seg = np.sin(2 * np.pi * f0 * tt) * env(tt, 0.0004, 0.003) * (k if k > 0 else lvl)
        i = int(round(a * SR))
        out[i:i + m] += seg[:len(out[i:i + m])]
    return out * 0.6


def _rotor_bank(c, bpf, d):
    """V3's rotor voice: four detuned 8-harmonic blade tones on a continuous phase, plus a blade-modulated hiss.
    p.seed (optional) re-seeds the four start phases and the hiss: the detuned voices beat by several dB at ~3 Hz, and
    the seed decides where the troughs fall (chosen so none lands on a picture cut; see sound4.ts rotorPath)."""
    t = tg(d)
    seed = (c.get('p') or {}).get('seed')
    r = rng(c['id'] if seed is None else f"{c['id']}#{int(seed)}")
    out = np.zeros_like(t)
    for det in (0.97, 0.99, 1.01, 1.035):
        ph = 2 * np.pi * np.cumsum(bpf * det) / SR + r.random() * 6
        out += sum(np.sin(h * ph) / h ** 1.2 for h in range(1, 9))
    hiss = bandpass(r.standard_normal(len(t)), 900, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(bpf) / SR))
    return t, bandpass(out, 60, 2600) * 0.6, hiss * 0.18


def _curve(p, name, default, n):
    """per-frame array p[name] (frame 0 = cue start) -> per-sample values (linear between frames, held at the ends)"""
    arr = np.asarray(p.get(name, [default]), float).ravel()
    if arr.size == 1:
        return np.full(n, float(arr[0]))
    return np.interp(np.arange(n) / SR * FPS, np.arange(arr.size), arr)


def rotor_curve_pan(c, n):
    return np.clip(_curve(c.get('p') or {}, 'pan', 0.0, n), -1, 1)


def g_rotor(c):
    """V3 rotor modes, plus:
    - p.curve: per-frame arrays from the picture (sound4.ts rotorPath): rate (blade speed, 1 = full; may exceed 1
      for load), dist (perspective; amplitude 1/dist^0.85, brightness falls with distance), lvl (dB) and pan (handled
      by the placer). Blade-pass frequency = p.bpf (140 Hz) x rate x Doppler (p.doppler m/s per dist-unit/s).
      One phase integral over the whole cue: no joins. Fades in 0.08 s, out over p.fadeOut s.
    - spin-up shape params (p.spinup with p.shape 'exp'|'easeIn3', p.tau, p.spin, p.bpf0, p.bpf1).
    Any other rotor cue is V3's g_rotor, bit for bit."""
    p = c.get('p') or {}
    d = c['dur']
    if p.get('curve'):
        n = len(tg(d))
        rate = np.maximum(_curve(p, 'rate', 1.0, n), 0)
        dist = np.maximum(_curve(p, 'dist', 1.0, n), 0.3)
        lvl = _curve(p, 'lvl', 0.0, n)
        # radial speed from the per-frame distance: the linear interpolation makes its derivative piecewise constant
        # (a pitch step at every frame boundary), so it is smoothed over p.dopplerSmooth s (Hann) before use
        vr = np.gradient(dist, 1 / SR) * float(p.get('doppler', 0))
        ws = int(float(p.get('dopplerSmooth', 0)) * SR)
        if ws > 1:
            k = np.hanning(ws)
            vr = np.convolve(np.concatenate([np.full(ws, vr[0]), vr, np.full(ws, vr[-1])]), k / k.sum(), mode='same')[ws:-ws]
        bpf = float(p.get('bpf', 140)) * rate * (343 / (343 + vr))
        t, tone, hiss = _rotor_bank(c, bpf, d)
        spd = np.clip(rate, 0, 1.2)
        bright = np.clip(1.4 - dist / 6, 0.3, 1)
        base = tone + hiss * bright * np.minimum(1, spd)
        steady = rate >= 0.9
        ref = np.max(np.abs(base[steady] if steady.any() else base)) or 1.0
        amp = np.minimum(1, spd) ** 1.2 * np.maximum(spd, 1) ** 2 / dist ** 0.85 * db(lvl)
        fo = float(p.get('fadeOut', 0.25))
        return base * (0.8 / ref) * amp * np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / fo)
    if p.get('spinup') and any(k in p for k in ('shape', 'tau', 'spin', 'bpf0', 'bpf1')):
        t = tg(d)
        b0, b1 = float(p.get('bpf0', 30)), float(p.get('bpf1', 140))
        if p.get('shape') == 'easeIn3':
            u = np.clip(t / float(p.get('spin', 0.73)), 0, 1) ** 3
            amp = 0.12 + 0.88 * u ** 0.6
        else:
            u = 1 - np.exp(-t / float(p.get('tau', 0.35)))
            amp = np.minimum(1, t / 0.5) * (0.7 + 0.3 * np.minimum(1, t / d))
        bpf = b0 + (b1 - b0) * u
        t, tone, hiss = _rotor_bank(c, bpf, d)
        x = (tone + hiss) * amp * np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.25)
        return norm(x, 0.8)
    return V3.g_rotor(c)


GEN4 = dict(V3.GEN_FUN)
GEN4.update(press=g_press, tpulse=g_tpulse, alarm1=g_alarm1, rotor=g_rotor, fib=g_fib, ticks=g_ticks)
NEW_KINDS = ('press', 'tpulse')
EXTENDED = {'alarm1': ('low', 'att', 'ring'), 'rotor': ('curve', 'shape', 'tau', 'spin', 'bpf0', 'bpf1'), 'fib': ('at',), 'ticks': ('at',)}


def render4(c):
    """A cue's mono signal and start time. p.polarity -1 inverts it (inaudible on its own; used where a cue's waveform
    would otherwise add to a narration peak that V3's limiter held at the ceiling, so no de-peak is needed there)."""
    if c['kind'] == 'file':
        x, at = render_v3(c)
    else:
        x, at = GEN4[c['kind']](c), c['f'] / FPS
    if float((c.get('p') or {}).get('polarity', 1)) < 0:
        x = -x
    return x, at


# ------------------------------------------------------------------ placement (V3 place() plus pan curves and per-cue ducks)
def place_any(buf, s, at_s, weight=None):
    """Add a stereo cue at at_s with V3's wrap rule (overflow past the end runs into the head); optional per-index
    weight (a function of the wrapped sample indices) for per-cue ducking."""
    a = int(round(at_s * SR))
    if a < 0:
        s = s[-a:]
        a = 0
    idx = (a + np.arange(len(s))) % N
    assert len(s) <= N
    if weight is not None:
        s = s * weight(idx)[:, None]
    buf[idx] += s


def stereo_curve(x, gain_db, pan):
    return np.stack([x * np.cos((pan + 1) * np.pi / 4) * 1.414, x * np.sin((pan + 1) * np.pi / 4) * 1.414], axis=1) * db(gain_db)


def stereo_v3(x, gain_db, pan, pan_to):
    if pan_to is None:
        return V3.stereo(x * db(gain_db), pan)
    pp = np.linspace(pan, pan_to, len(x))
    return np.stack([x * np.cos((pp + 1) * np.pi / 4) * 1.414, x * np.sin((pp + 1) * np.pi / 4) * 1.414], axis=1) * db(gain_db)


def build_effects4(cues, sp_env, log):
    fx = np.zeros((N, 2))
    fxc = np.zeros((N, 2))
    fxd = np.zeros((N, 2))  # cues with their own duck (p.duck) - not ducked again by the bus
    rows = []
    for c in cues:
        x, at = render4(c)
        p = c.get('p', {}) or {}
        pan = float(p['pan']) if isinstance(p.get('pan'), (int, float)) else float(V3.PAN.get(c['id'], 0.0))
        curve = bool(p.get('curve'))
        row = {'id': c['id'], 'kind': c['kind'], 'frame': c['f'], 'time_s': round(at, 3), 'gain_db': c['gain'], 'len_s': round(len(x) / SR, 3),
               'source': p.get('file', 'procedural') if c['kind'] == 'file' else 'procedural'}
        if 'duck' in p:
            k = 1 - db(float(p['duck']))
            lead = int(round(float(p.get('duckLead', 0)) * SR))
            sp_s = np.roll(sp_env, -lead) if lead else sp_env  # cyclic: loop-safe look-ahead
            s = stereo_curve(x, c['gain'], rotor_curve_pan(c, len(x))) if curve else stereo_v3(x, c['gain'], pan, float(p['panTo']) if 'panTo' in p else None)
            place_any(fxd, s, at, weight=lambda idx, k=k, sp_s=sp_s: 1 - k * sp_s[idx])
            row.update(bus='own duck', duck_db=float(p['duck']), duck_lead_s=float(p.get('duckLead', 0)))
        elif curve:
            place_any(fxc if c['kind'] in V3.CONTINUOUS else fx, stereo_curve(x, c['gain'], rotor_curve_pan(c, len(x))), at)
            row.update(bus='continuous' if c['kind'] in V3.CONTINUOUS else 'one-shot', pan='curve')
        else:
            V3.place(fxc if c['kind'] in V3.CONTINUOUS else fx, x, at, c['gain'], pan, float(p['panTo']) if 'panTo' in p else None)
            row.update(bus='continuous' if c['kind'] in V3.CONTINUOUS else 'one-shot')
        rows.append(row)
    sp = sp_env[:, None]
    log['cues'] = rows
    return fx * (1 - 0.25 * sp) + fxc * (1 - 0.5 * sp) + fxd


# ------------------------------------------------------------------ effects-only safety reduction
def oversample4(x):
    """4x band-limited oversampling of a (N, ch) signal (FFT zero-padding, cyclic: the film loops), for true peaks."""
    n = len(x)
    return np.stack([np.fft.irfft(np.fft.rfft(x[:, ch]), 4 * n) * 4 for ch in range(x.shape[1])], axis=1)


DEPEAK_HALF = 24  # samples: each correction is a 1 ms Hann pulse


def safety(nm_i, fx_f, log):
    """Effects-only safety correction ("de-peak"); narration and music are never touched.
    nm_i: narration + music (ints, the V3 files); fx_f: V4 effects x G3 (float). Returns the effects stem as ints.
    It runs only where a mix sample exceeds -1.8 dBFS (+3 LSB rounding tolerance) or the 4x-oversampled true peak
    exceeds -1.5 dBTP. At each such peak it subtracts from the EFFECTS stem the smallest smooth pulse (1 ms Hann, peak =
    the excess plus half an LSB) that brings the sum back to the ceiling, and repeats until nothing is over.
    Why not a keyed gain on the effects bus: V3's limiter held narration + music + V3 effects exactly AT the ceiling on
    its loudest narration peaks (sometimes with the V3 effects partly cancelling), so any new effect energy there is an
    over and a gain on the effects (or on their change from V3) has to go to ~0 for those instants; with a 5 ms
    look-ahead / 120 ms release that silences or gain-rides whole new cues for 0.3-0.5 s (measured in the first V4
    build: five events, down to -89 dB). The de-peak changes only ~1 ms around each peak, by a pulse 30+ dB below the
    narration peak it sits under."""
    ceil_i = V3.db(CEIL_DB) * FULL
    target = np.floor(ceil_i) - 0.5
    fx_i = q_round(fx_f)
    fx0 = fx_i.copy()
    w = np.hanning(2 * DEPEAK_HALF + 3)[1:-1]
    w /= w.max()
    info = {'ceiling_dbfs': CEIL_DB, 'tolerance_lsb': CEIL_TOL_LSB, 'true_peak_max_dbtp': TP_MAX_DBTP, 'method': 'de-peak: 1 ms Hann pulses subtracted from the effects stem at each over (no gain riding)', 'passes': []}
    events = []
    for it in range(40):
        mix = nm_i + fx_i
        over = np.abs(mix) > ceil_i + CEIL_TOL_LSB
        step = {'pass': it, 'sample_peak_dbfs': round(float(20 * np.log10(np.abs(mix).max() / FULL)), 4), 'samples_over': int(over.any(1).sum())}
        if not over.any():
            info['passes'].append(step)
            break
        for ch in range(mix.shape[1]):
            idx = np.where(over[:, ch])[0]
            i = 0
            while i < len(idx):
                j = i
                while j + 1 < len(idx) and idx[j + 1] - idx[j] <= DEPEAK_HALF:
                    j += 1
                seg = idx[i:j + 1]
                k = seg[int(np.argmax(np.abs(mix[seg, ch])))]
                e = abs(mix[k, ch]) - target
                sl = (k + np.arange(-DEPEAK_HALF, DEPEAK_HALF + 1)) % N
                fx_i[sl, ch] -= np.rint(np.sign(mix[k, ch]) * e * w).astype(np.int64)
                if it < 3:
                    events.append({'t_s': round(k / SR, 4), 'frame': round(k / SR * FPS, 1), 'ch': ch, 'excess_lsb': int(round(e)), 'pulse_dbfs': round(float(20 * np.log10(e / FULL)), 1)})
                i = j + 1
        if it < 3:
            info['passes'].append(step)
    # inter-sample (true) peak, 4x oversampled; corrected the same way at the oversampled peak's nearest sample
    for it in range(10):
        mix = nm_i + fx_i
        os_ = oversample4(mix / FULL)
        tp = float(20 * np.log10(np.abs(os_).max()))
        info.setdefault('true_peak_dbtp_4x', []).append(round(tp, 3))
        if tp <= TP_MAX_DBTP:
            break
        lim = V3.db(TP_MAX_DBTP - 0.02)
        hot = np.where(np.abs(os_).max(1) > lim)[0]
        for k4 in hot[np.r_[True, np.diff(hot) > 4 * DEPEAK_HALF]]:
            ch = int(np.argmax(np.abs(os_[k4])))
            k = (k4 // 4) % N
            e = (abs(os_[k4, ch]) - lim) * FULL + 1
            sl = (k + np.arange(-DEPEAK_HALF, DEPEAK_HALF + 1)) % N
            fx_i[sl, ch] -= np.rint(np.sign(os_[k4, ch]) * e * w).astype(np.int64)
            events.append({'t_s': round(k / SR, 4), 'frame': round(k / SR * FPS, 1), 'ch': ch, 'true_peak_excess_lsb': int(round(e))})
    d = fx_i - fx0
    info['corrections'] = events[:60]
    info['corrected_samples'] = int((d != 0).any(1).sum())
    info['correction_peak_dbfs'] = round(float(20 * np.log10(np.abs(d).max() / FULL)), 1) if d.any() else None
    info['final_sample_peak_dbfs'] = round(float(20 * np.log10(np.abs(nm_i + fx_i).max() / FULL)), 4)
    log['safety'] = info
    return fx_i


# ------------------------------------------------------------------ generator facts for the log (measured, not heard)
def gen_facts(cues):
    out = {}
    for c in cues:
        if c['kind'] in NEW_KINDS or (c['kind'] in EXTENDED and any(k in (c.get('p') or {}) for k in EXTENDED[c['kind']])):
            x = GEN4[c['kind']](c)
            X = np.abs(np.fft.rfft(x)) ** 2
            f = np.fft.rfftfreq(len(x), 1 / SR)
            out[c['id']] = {'kind': c['kind'], 'len_s': round(len(x) / SR, 3), 'centroid_hz': round(float((X * f).sum() / X.sum()), 1),
                            'energy_above_3k_pct': round(float(100 * X[f > 3000].sum() / X.sum()), 3), 'energy_below_100hz_pct': round(float(100 * X[f < 100].sum() / X.sum()), 3)}
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--g3-cache', type=Path, default=None)
    args = ap.parse_args()
    t0 = time.time()
    log = {'version': 'v4', 'route': 'option R: V3 narration + music stems reused byte for byte; only the effects bus is rebuilt, under V3 gain envelope G3; exact integer sum; no re-normalisation, no new limiter',
           'listened': False, 'note': 'Nothing in this build has been listened to; all figures are measurements.'}
    cues4 = json.load(open(CUES4_PATH))
    assert cues4['fps'] == FPS and cues4['total_frames'] == V3.CUES['total_frames']
    assert cues4['music'] == V3.CUES['music'], 'audio/v4/cues.json music plan differs from V3 (music.wav is reused)'
    # ---- 1. the V3 narration and music stems, byte for byte
    (A4 / 'stems').mkdir(parents=True, exist_ok=True)
    (A4 / 'mix').mkdir(parents=True, exist_ok=True)
    copies = {}
    for s in ('narration', 'music'):
        shutil.copyfile(A3 / 'stems' / f'{s}.wav', A4 / 'stems' / f'{s}.wav')
        h3, h4 = sha256(A3 / 'stems' / f'{s}.wav'), sha256(A4 / 'stems' / f'{s}.wav')
        assert h3 == h4
        copies[s] = {'sha256': h4, 'equals_v3': h3 == h4}
    log['reused_stems'] = copies
    # ---- 2. G3 (verified bit-exact), or a cached copy from a verified run with identical V3 inputs
    key = v3_inputs_hash()
    cached = False
    if args.g3_cache and args.g3_cache.exists():
        z = np.load(args.g3_cache, allow_pickle=False)
        if str(z['key']) == key and bool(z['bit_exact']):
            G3, sp_env = z['G3'], z['sp_env']
            log['g3'] = json.loads(str(z['log']))
            log['g3']['from_cache'] = str(args.g3_cache)
            cached = True
    if not cached:
        G3, sp_env = rebuild_g3(log)
        if args.g3_cache:
            args.g3_cache.parent.mkdir(parents=True, exist_ok=True)
            np.savez(args.g3_cache, G3=G3, sp_env=sp_env, key=key, bit_exact=True, log=json.dumps(log['g3']))
    log['g3']['v3_inputs_sha256'] = key
    # ---- 3. the V4 effects bus
    fx4 = build_effects4(cues4['cues'], sp_env, log) * G3[:, None]
    # ---- 4. quantise (rounding), sum, safety
    nar_i = read24(A4 / 'stems' / 'narration.wav')
    mus_i = read24(A4 / 'stems' / 'music.wav')
    fx_i = safety(nar_i + mus_i, fx4, log)
    mix_i = nar_i + mus_i + fx_i
    write24(A4 / 'stems' / 'effects.wav', fx_i)
    write24(A4 / 'mix' / MIX_NAME, mix_i)
    # ---- 5. read back and log
    back = {k: read24(p) for k, p in (('n', A4 / 'stems' / 'narration.wav'), ('m', A4 / 'stems' / 'music.wav'), ('e', A4 / 'stems' / 'effects.wav'), ('x', A4 / 'mix' / MIX_NAME))}
    log['stems_sum_residual_lsb'] = int(np.abs(back['n'] + back['m'] + back['e'] - back['x']).max())
    log['mix_sample_peak_dbfs'] = round(float(20 * np.log10(np.abs(back['x']).max() / FULL)), 4)
    log['loudnorm_pass1_mix'] = loudnorm_pass1(A4 / 'mix' / MIX_NAME)
    log['loudnorm_pass1_effects'] = loudnorm_pass1(A4 / 'stems' / 'effects.wav')
    log['loudnorm_pass1_v3_mix_for_reference'] = json.load(open(A3 / 'MIX_LOG.json'))['loudnorm_pass1']
    log['ducking'] = {'speech_env': 'V3 speech_env from the untouched narration (10 ms hops, -30 dB gate, attack ~30 ms, release ~300 ms, loop-wrapped)',
                      'one_shot_bus_db': -2.5, 'continuous_bus_db': -6.0, 'per_cue': 'p.duck dB at full speech, p.duckLead s look-ahead (cyclic roll)'}
    log['generators_measured'] = gen_facts(cues4['cues'])
    log['sources'] = cues4.get('sources', {})
    log['diff_vs_v3'] = cues4.get('diff_vs_v3', {})
    log['outputs'] = {str(p.relative_to(ROOT)): sha256(p) for p in (A4 / 'stems' / 'narration.wav', A4 / 'stems' / 'music.wav', A4 / 'stems' / 'effects.wav', A4 / 'mix' / MIX_NAME)}
    log['cues_json_sha256'] = sha256(CUES4_PATH)
    log['build_s'] = round(time.time() - t0, 1)
    json.dump(log, open(A4 / 'MIX_LOG.json', 'w'), indent=1)
    lm = log['loudnorm_pass1_mix']
    print(f"V4 mix: {lm['input_i']} LUFS, TP {lm['input_tp']} dBTP, LRA {lm['input_lra']} | sample peak {log['mix_sample_peak_dbfs']} dBFS | "
          f"stems residual {log['stems_sum_residual_lsb']} LSB | G3 bit-exact {log['g3']['bit_exact']}{' (cache)' if cached else ''} | "
          f"de-peak: {log['safety']['corrected_samples']} fx samples (peak {log['safety']['correction_peak_dbfs']} dBFS) | {log['build_s']} s")


if __name__ == '__main__':
    main()
